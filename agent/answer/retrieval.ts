// Restrizioni ricavate dalla domanda e dai metadati: mai dalle risposte attese delle eval.
import type { IndexDocument } from "../ingest/export.ts";
import type { Index } from "./answer.ts";

const fold = (value: string) => value.toLowerCase().normalize("NFD").replace(/\p{M}/gu, "").replace(/[’']/g, " ").replace(/\s+/g, " ").trim();

export function structuredCandidates(question: string, index: Index): IndexDocument[] {
  const text = fold(question);
  const documents = [...index.values()];
  const years = [...new Set(question.match(/\b(?:18|19|20)\d{2}\b/g) ?? [])];
  if (/intervista|fonte primaria|tipo di fonte|correzion|metodo/.test(text)) {
    const words = (value: string) => new Set(fold(value).match(/[a-z]{4,}/g)?.filter((word) => !["della", "delle", "degli", "prima", "questa", "quella", "come", "cosa", "quale", "sono", "viene", "quanto", "avete", "sulla", "dalla"].includes(word)).map((word) => word.slice(0, 6)) ?? []);
    const asked = words(question);
    const ranked = documents.filter((d) => d.structData.dataset === "correzioni").map((d) => {
      const linked = documents.filter((p) => p.structData.dataset === "promesse" && d.structData.testo.includes(`Pagina: /promesse#${p.structData.record}.`));
      const present = words([d.structData.testo, ...linked.map((p) => p.structData.testo)].join(" "));
      return { d, linked, score: [...asked].filter((word) => present.has(word)).length };
    }).sort((a, b) => b.score - a.score);
    if (ranked[0]?.score >= 3 && ranked[0].score >= (ranked[1]?.score ?? 0) + 2) return [ranked[0].d, ...ranked[0].linked];
  }

  if (/partiti|maggioranza|durat/.test(text)) {
    const named = documents.filter((d) => {
      if (d.structData.dataset !== "governi") return false;
      const name = fold(d.structData.titolo).replace(/^governo /, "");
      const escaped = name.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
      return new RegExp(`\\b${escaped}\\b`).test(text);
    });
    if (named.length === 1) return named;
  }
  if (/presentato|proponente/.test(text) && years.length) {
    const kind = /esercizio provvisorio/.test(text) ? "esercizio provvisorio"
      : /legge finanziaria/.test(text) ? "legge finanziaria"
      : /legge di stabilita/.test(text) ? "legge di stabilita"
      : /legge di bilancio/.test(text) ? "legge di bilancio"
      : /bilancio di previsione/.test(text) ? "bilancio di previsione" : null;
    if (kind) {
      const matching = documents.filter((d) => d.structData.dataset === "leggi-bilancio"
        && fold(d.structData.titolo).includes(kind)
        && years.every((year) => d.structData.record.includes(year)));
      if (matching.length === 1) return matching;
    }
  }
  const legislative = /\blegislatura ([ivxlcdm]+)\b/i.exec(question);
  if (legislative) return documents.filter((d) => d.structData.dataset === "legislature" && d.structData.record === legislative[1].toUpperCase());

  const measures = documents.filter((d) => d.structData.dataset === "misure" && text.includes(fold(d.structData.titolo.split(", periodo ")[0])));
  if (measures.length) {
    const period = /periodo [«“"]([^»”"]+)[»”"]/i.exec(question)?.[1];
    const match = measures.filter((d) => period ? fold(d.structData.titolo).includes(fold(period))
      : !years.length || years.every((year) => d.structData.periodo && d.structData.periodo.dal <= `${year}-12-31` && (d.structData.periodo.al ?? "9999-12-31") >= `${year}-01-01`));
    return match;
  }
  if (!years.length) return [];
  const series = /pil nominale/.test(text) ? "pil-nominale" : /residenti|popolazione/.test(text) ? "popolazione-residente" : /\bfoi\b/.test(text) ? "prezzi-consumo-foi" : null;
  if (series) return documents.filter((d) => d.structData.dataset === `serie/${series}` && years.includes(d.structData.record));
  if (!/spesa|speso|spende|entrate|saldo|interessi|oneri finanziari|debito/.test(text) || /governo|legge|stanziat|prevedeva|partito/.test(text)) return [];

  const europe = /germania|francia|spagna|unione europea|media europea/.test(text);
  const interest = /interess|oneri finanziari/.test(text);
  const debtRatio = /debito.{0,35}(?:rapporto|percentuale|%|pil)|(?:rapporto|percentuale|%) .{0,25}debito/.test(text);
  const explicitStock = /consistenza|stock|ammonta.{0,20}debito|debito.{0,25}(?:a fine|fine mese)/.test(text);
  if (/debito/.test(text) && /spesa|speso|spende|pagat|versat|costat|costo/.test(text) && !interest && !debtRatio && !explicitStock) return [];
  const separateDebtRequest = interest && /\be\s+(?:il\s+|la\s+)?(?:debito|consistenza|stock|rapporto)/.test(text);
  const separateFunctionRequest = interest && (/\be\s+(?:la\s+)?(?:spesa\s+)?(?:per\s+)?(?:sanita|istruzione|protezione sociale|funzione)/.test(text)
    || /(?:sanita|istruzione|protezione sociale|funzione).{0,30}\be\s+(?:gli\s+)?interess/.test(text));
  const monthNames = ["gennaio", "febbraio", "marzo", "aprile", "maggio", "giugno", "luglio", "agosto", "settembre", "ottobre", "novembre", "dicembre"];
  const month = monthNames.findIndex((name) => text.includes(name));
  let kind = "conti";
  if (/trimestre/.test(text)) kind = "trimestri";
  else if (/sanita|istruzione|protezione sociale|funzione/.test(text)) kind = "funzioni";
  else if (/debito/.test(text) && (!interest || explicitStock || debtRatio)) kind = debtRatio ? "debitoPil" : "debitoMensile";
  if (interest && kind === "debitoMensile" && month < 0) kind = "conti";
  if (interest && kind === "debitoPil" && !separateDebtRequest) kind = "conti";
  const kinds = interest && ((separateDebtRequest && (kind === "debitoPil" || (kind === "debitoMensile" && month >= 0))) || (separateFunctionRequest && kind === "funzioni"))
    ? ["conti", kind] : [kind];
  const selectedKinds = europe ? kinds.map((candidateKind) => `confrontoUe/${candidateKind === "debitoPil" ? "debito" : candidateKind}`) : kinds;
  let targetYears = years;
  if (kind === "trimestri" && /stesso trimestre.*anno prima/.test(text)) targetYears = [...years, ...years.map((y) => String(Number(y) - 1))];
  const quarters = [...question.matchAll(/\b([1-4])[°º]/g)].map((m) => m[1]);
  const selected = documents.filter((d) => {
    if (d.structData.dataset !== "finanza-pubblica" || !selectedKinds.some((candidateKind) => d.structData.record.startsWith(`${candidateKind}/`))) return false;
    if (!targetYears.some((year) => selectedKinds.some((candidateKind) => d.structData.record.startsWith(`${candidateKind}/${year}`)))) return false;
    if (d.structData.record.startsWith("debitoMensile/")) {
      if (month >= 0 && !d.structData.record.endsWith(`-${String(month + 1).padStart(2, "0")}`)) return false;
    }
    return kind !== "trimestri" || !quarters.length || quarters.some((q) => d.structData.record.endsWith(`Q${q}`));
  });
  if (interest && selectedKinds.length > 1 && !targetYears.every((year) => selected.some((d) => d.structData.record === `${europe ? "confrontoUe/conti" : "conti"}/${year}`))) return [];
  return selected;
}

export function financeMeasureMismatch(question: string, documents: readonly IndexDocument[]): boolean {
  const text = fold(question);
  const interest = /interess|oneri finanziari/.test(text);
  const publicFinance = /debito|spesa|speso|spende|pagat|versat|oneri finanziari|trimestre/.test(text);
  if (!interest || !publicFinance || /dichiar|promess|intervist|ha detto|legge|stanziat|prevedeva|partito/.test(text)) return false;

  const years = [...new Set(question.match(/\b(?:18|19|20)\d{2}\b/g) ?? [])];
  const quarterly = /trimestre/.test(text);
  const quarters = [...question.matchAll(/\b([1-4])[°º]/g)].map((match) => match[1]);
  const europe = /germania|francia|spagna|unione europea|media europea/.test(text);
  const prefix = europe ? "confrontoUe/conti/" : quarterly ? "trimestri/" : "conti/";
  const compatible = documents.filter((document) => document.structData.dataset === "finanza-pubblica"
    && document.structData.record.startsWith(prefix));
  if (!compatible.length) return true;
  if (!years.length) return false;
  return years.some((year) => !compatible.some((document) => {
    const period = document.structData.record.slice(prefix.length);
    return quarterly ? period.startsWith(`${year}-Q`) && (!quarters.length || quarters.some((quarter) => period === `${year}-Q${quarter}`))
      : period === year;
  }));
}

export function candidateFilter(candidates: IndexDocument[]): string | null {
  if (!candidates.length || candidates.length > 12) return null;
  const groups = new Map<string, string[]>();
  for (const d of candidates) groups.set(d.structData.dataset, [...(groups.get(d.structData.dataset) ?? []), d.structData.record]);
  return [...groups].map(([dataset, records]) => `(dataset: ANY(${JSON.stringify(dataset)}) AND record: ANY(${records.map((r) => JSON.stringify(r)).join(", ")}))`).join(" OR ");
}


const REGIONS = /\b(abruzzo|basilicata|calabria|campania|emilia[ -]romagna|friuli|lazio|liguria|lombardia|marche|molise|piemonte|puglia|sardegna|sicilia|toscana|trentino|alto adige|umbria|valle d aosta|veneto|comun[ei]|provincia|provinciale|regione|regionale)\b/;
const countryNames = new Map<string, string>();
for (const locale of ["it", "en"]) {
  const names = new Intl.DisplayNames([locale], { type: "region" });
  for (let first = 65; first <= 90; first++) for (let second = 65; second <= 90; second++) {
    const code = String.fromCharCode(first, second);
    const name = names.of(code);
    if (name && name !== code) countryNames.set(fold(name), new Intl.Locale(`und-${code}`).region ?? code);
  }
}
countryNames.set("usa", "US"); countryNames.set("uk", "GB");

export function scopeBlock(question: string): { motivo: "fuori_perimetro" | "calcolo_non_disponibile"; dettaglio: string } | null {
  const text = fold(question);
  if (/\b(somma|sommando|messi insieme|messe insieme|sommati|sommate)\b/.test(text)) {
    return { motivo: "calcolo_non_disponibile", dettaglio: "Nessuna somma nuova tra record: si riportano solo aggregati già presenti." };
  }
  const factual = /spesa|speso|spende|entrate|saldo|interessi|debito|\bpil\b|residenti|popolazione|presidente del consiglio|governo/.test(text);
  if (!factual || /dichiar|promess|ha detto|ha scritto/.test(text)) return null;
  if (REGIONS.test(text)) return { motivo: "fuori_perimetro", dettaglio: "Non ci sono dati regionali, provinciali o comunali nel dataset." };
  const countries = [...countryNames].filter(([name]) => {
    const escaped = name.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    return new RegExp(`\\b${escaped}\\b`).test(text);
  }).map(([, code]) => code);
  const government = /presidente del consiglio|governo/.test(text);
  if (countries.some((code) => !(government ? ["IT"] : ["IT", "DE", "FR", "ES", "EU"]).includes(code))) {
    return { motivo: "fuori_perimetro", dettaglio: "Il territorio richiesto non è coperto da questi record." };
  }
  return null;
}
