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
  if (!/spesa|speso|spende|entrate|saldo|interessi|debito/.test(text) || /governo|legge|stanziat|prevedeva|partito/.test(text)) return [];

  const europe = /germania|francia|spagna|unione europea|media europea/.test(text);
  let kind = "conti";
  if (/trimestre/.test(text)) kind = "trimestri";
  else if (/sanita|istruzione|protezione sociale|funzione/.test(text)) kind = "funzioni";
  else if (/debito/.test(text)) kind = /pil/.test(text) ? "debitoPil" : "debitoMensile";
  if (europe) kind = `confrontoUe/${kind === "debitoPil" ? "debito" : kind}`;
  let targetYears = years;
  if (kind === "trimestri" && /stesso trimestre.*anno prima/.test(text)) targetYears = [...years, ...years.map((y) => String(Number(y) - 1))];
  const quarters = [...question.matchAll(/\b([1-4])[°º]/g)].map((m) => m[1]);
  return documents.filter((d) => {
    if (d.structData.dataset !== "finanza-pubblica" || !d.structData.record.startsWith(`${kind}/`)) return false;
    if (!targetYears.some((year) => d.structData.record.startsWith(`${kind}/${year}`))) return false;
    if (kind === "debitoMensile") {
      const months = ["gennaio", "febbraio", "marzo", "aprile", "maggio", "giugno", "luglio", "agosto", "settembre", "ottobre", "novembre", "dicembre"];
      const month = months.findIndex((name) => text.includes(name));
      if (month >= 0 && !d.structData.record.endsWith(`-${String(month + 1).padStart(2, "0")}`)) return false;
    }
    return kind !== "trimestri" || !quarters.length || quarters.some((q) => d.structData.record.endsWith(`Q${q}`));
  });
}

export function candidateFilter(candidates: IndexDocument[]): string | null {
  if (!candidates.length || candidates.length > 12) return null;
  const groups = new Map<string, string[]>();
  for (const d of candidates) groups.set(d.structData.dataset, [...(groups.get(d.structData.dataset) ?? []), d.structData.record]);
  return [...groups].map(([dataset, records]) => `(dataset: ANY(${JSON.stringify(dataset)}) AND record: ANY(${records.map((r) => JSON.stringify(r)).join(", ")}))`).join(" OR ");
}
