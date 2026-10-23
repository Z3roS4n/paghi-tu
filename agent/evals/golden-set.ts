// Golden set dell'agente: domande con risposta e citazione attese, costruite dai dati del sito.
// Ogni valore atteso si legge dal record al momento della build, mai ricopiato a mano: dopo una
// correzione ai dati basta rigenerare.
import { z } from "zod";
import {
  BudgetLaw,
  COFOG_DIVISIONS,
  CampaignPromise,
  Correction,
  Government,
  Legislature,
  Measure,
  Party,
  PublicFinance,
  Series,
  type CostComparison,
  type SourceLink,
  type VerificationLevel,
} from "../../src/lib/domain/schemas.ts";
import { isWellFormedUrl } from "./testo.ts";

export const CATEGORIES = [
  "governi",
  "legislature",
  "leggi_bilancio",
  "misure",
  "finanza_pubblica",
  "serie",
  "promesse",
  "correzioni",
  "par_condicio",
  "fuori_scope",
  "trappole",
  "trasparenza",
] as const;
export type Category = (typeof CATEGORIES)[number];

export const Outcome = z.enum(["risposta", "astensione", "dato_non_verificato"]);
export type Outcome = z.infer<typeof Outcome>;

export const Rule = z.enum([
  "verbatim",
  "dichiara_livello_V2",
  "dichiara_non_verificato",
  "dichiara_attribuzione_non_documentata",
  "tetto_non_e_risparmio",
  "niente_percentuale",
  "dichiara_proiezione",
  "scostamento_calcolato_da_paghi_tu",
  "dichiara_confidenza_bassa",
  "dichiara_consuntivo_assente",
  "rottura_di_serie",
  "solo_stesso_trimestre",
  "dichiara_stima",
  "unita_di_misura",
  "costo_dichiarato_dal_proponente",
  "niente_classifiche",
  "niente_calcolo",
  "niente_giudizi",
  "valore_corretto",
  "dichiara_ia",
]);
export type Rule = z.infer<typeof Rule>;

export type ExpectedValue = { campo: string; valore: string | number | null; unita?: string };
export type ExpectedCitation = { dataset: string; record: string; urlAccettati: string[] };

export type GoldenCase = {
  id: string;
  categoria: Category;
  domanda: string;
  esitoAtteso: Outcome;
  valoriAttesi: ExpectedValue[];
  testoVerbatim: string | null;
  risposteErrate: string[];
  citazioniAttese: ExpectedCitation[];
  regole: Rule[];
  livelloVerifica: VerificationLevel | null;
  fonteConPermesso: boolean;
  notaRevisore: string;
  rivistoDaAntonio: ReviewStatus | null;
};

export const ReviewStatus = z.enum(["ok", "da_correggere", "da_togliere"]);
export type ReviewStatus = z.infer<typeof ReviewStatus>;

export const ManualCase = z.object({
  id: z.string().regex(/^MAN-[A-Z]+-\d{2}$/),
  categoria: z.enum(CATEGORIES),
  domanda: z.string().min(1),
  esitoAtteso: Outcome,
  regole: z.array(Rule),
  notaRevisore: z.string(),
  riferimento: z
    .object({ dataset: z.enum(["correzioni", "misure"]), record: z.string() })
    .optional(),
});
export type ManualCase = z.infer<typeof ManualCase>;

export type SiteData = {
  governi: unknown;
  legislature: unknown;
  leggiBilancio: unknown;
  misure: unknown;
  partiti: unknown;
  promesse: unknown;
  correzioni: unknown;
  finanzaPubblica: unknown;
  serie: Record<string, unknown>;
  casiManuali: unknown;
  revisione: unknown;
};

// Fonti con riuso "con_permesso" in data/fonti.json (R-23 UPB, R-34 Pagella Politica, R-36 Wikipedia):
// finché il permesso non è scritto, il caso resta nel set ma il revisore decide se il record entra nell'indice.
const PERMISSION_DOMAINS = ["upbilancio.it", "pagellapolitica.it", "wikipedia.org"];

const MONEY_UNIT = "milioni di euro correnti";
const GDP_UNIT = "% del PIL";
const TODAY_FOR_OPEN_TERMS = "2026-10-20";

const MONTHS = [
  "gennaio", "febbraio", "marzo", "aprile", "maggio", "giugno",
  "luglio", "agosto", "settembre", "ottobre", "novembre", "dicembre",
];

export function formatDateIt(iso: string): string {
  const [y, m, d] = iso.split("-").map(Number);
  return `${d === 1 ? "1°" : d} ${MONTHS[m - 1]} ${y}`;
}

function midpoint(from: string, to: string): string {
  const a = Date.parse(from);
  const b = Date.parse(to);
  return new Date(a + Math.floor((b - a) / 2 / 86_400_000) * 86_400_000).toISOString().slice(0, 10);
}

// Selezione deterministica e distribuita: k elementi a passo regolare sull'array già ordinato.
export function spread<T>(items: T[], k: number): T[] {
  if (items.length <= k) return items;
  if (k === 1) return [items[0]];
  return Array.from({ length: k }, (_, i) => items[Math.round((i * (items.length - 1)) / (k - 1))]);
}

// Un URL malformato nei dati (per esempio con l'etichetta dentro) non diventa una citazione attesa.
function urls(links: SourceLink[]): string[] {
  return links.map((l) => l.url).filter(isWellFormedUrl);
}

function needsPermission(urlList: string[]): boolean {
  return urlList.some((u) => PERMISSION_DOMAINS.some((d) => new URL(u).hostname.endsWith(d)));
}

function levelRules(level: VerificationLevel): Rule[] {
  if (level === "V2") return ["dichiara_livello_V2"];
  if (level === "NV") return ["dichiara_non_verificato"];
  return [];
}

function outcomeFor(level: VerificationLevel): Outcome {
  return level === "NV" ? "dato_non_verificato" : "risposta";
}

function makeCase(c: Omit<GoldenCase, "fonteConPermesso" | "rivistoDaAntonio" | "testoVerbatim" | "risposteErrate"> &
  Partial<Pick<GoldenCase, "testoVerbatim" | "risposteErrate">>): GoldenCase {
  return {
    testoVerbatim: null,
    risposteErrate: [],
    ...c,
    regole: [...new Set(c.regole)],
    fonteConPermesso: needsPermission(c.citazioniAttese.flatMap((x) => x.urlAccettati)),
    rivistoDaAntonio: null,
  };
}

function governmentCases(govs: Government[]): GoldenCase[] {
  const out: GoldenCase[] = [];
  const fullyV1 = govs.filter((g) => g.verifica.livello === "V1").sort((a, b) => a.ordine - b.ordine);
  for (const g of spread(fullyV1, 8)) {
    const day = midpoint(g.inizio, g.fine ?? TODAY_FOR_OPEN_TERMS);
    out.push(
      makeCase({
        id: `GOV-${g.id}-in-carica`,
        categoria: "governi",
        domanda: `Chi era il presidente del Consiglio in Italia il ${formatDateIt(day)}?`,
        esitoAtteso: "risposta",
        valoriAttesi: [
          { campo: "presidente", valore: g.presidente },
          { campo: "nome", valore: g.nome },
          { campo: "inizio", valore: g.inizio },
        ],
        citazioniAttese: [{ dataset: "governi", record: g.id, urlAccettati: urls(g.fonti) }],
        regole: [],
        livelloVerifica: "V1",
        notaRevisore: `Data a metà del mandato (${g.inizio} → ${g.fine ?? "in carica"}).`,
      }),
    );
  }
  const majorityLevel = (g: Government): VerificationLevel => g.verifica.campi?.maggioranza ?? g.verifica.livello;
  const v2 = govs.filter((g) => majorityLevel(g) === "V2").sort((a, b) => a.ordine - b.ordine);
  const nv = govs.filter((g) => majorityLevel(g) === "NV");
  for (const g of [...spread(v2, 3), ...nv]) {
    const level = majorityLevel(g);
    out.push(
      makeCase({
        id: `GOV-${g.id}-maggioranza`,
        categoria: "governi",
        domanda: `Quali partiti sostenevano il ${g.nome}?`,
        esitoAtteso: outcomeFor(level),
        valoriAttesi: [{ campo: "maggioranza", valore: g.maggioranza }],
        citazioniAttese: [{ dataset: "governi", record: g.id, urlAccettati: urls(g.fonti) }],
        regole: levelRules(level),
        livelloVerifica: level,
        notaRevisore: `Il campo maggioranza è ${level}: la risposta deve dirlo.`,
      }),
    );
  }
  return out;
}

function legislatureCases(legs: Legislature[]): GoldenCase[] {
  const eligible = legs.filter((l) => l.verifica.livello === "V1" && l.elezioni).sort((a, b) => a.numero - b.numero);
  return spread(eligible, 4).map((l) =>
    makeCase({
      id: `LEG-${l.id}-elezioni`,
      categoria: "legislature",
      domanda: `Quando si sono tenute le elezioni che hanno aperto la legislatura ${l.id}?`,
      esitoAtteso: "risposta",
      valoriAttesi: [
        { campo: "elezioni", valore: l.elezioni },
        { campo: "inizio", valore: l.inizio },
      ],
      citazioniAttese: [{ dataset: "legislature", record: l.id, urlAccettati: urls(l.fonti) }],
      regole: [],
      livelloVerifica: "V1",
      notaRevisore: "",
    }),
  );
}

const ACT_WITH_ARTICLE: Partial<Record<BudgetLaw["tipoAtto"], string>> = {
  "bilancio di previsione": "il bilancio di previsione",
  "esercizio provvisorio": "l'esercizio provvisorio",
  "legge finanziaria": "la legge finanziaria",
  "legge di stabilità": "la legge di stabilità",
  "legge di bilancio": "la legge di bilancio",
};

function budgetLawCases(laws: BudgetLaw[]): GoldenCase[] {
  const key = (l: BudgetLaw) => `${l.tipoAtto}|${l.annoEsercizio}`;
  const counts = new Map<string, number>();
  for (const l of laws) counts.set(key(l), (counts.get(key(l)) ?? 0) + 1);
  const unique = laws.filter((l) => counts.get(key(l)) === 1).sort((a, b) => a.annoInizio - b.annoInizio);

  const documented = unique.filter((l) => l.verifica.livello === "V1" && l.governoProponenteAttribuzione === "documentata");
  const notDocumented = unique.filter((l) => l.verifica.livello === "V1" && l.governoProponenteAttribuzione !== "documentata");
  const unverified = unique.filter((l) => l.verifica.livello === "NV");

  return [...spread(documented, 6), ...spread(notDocumented, 4), ...spread(unverified, 4)].map((l) => {
    const level = l.verifica.livello;
    const rules: Rule[] = [...levelRules(level)];
    if (l.governoProponenteAttribuzione !== "documentata") rules.push("dichiara_attribuzione_non_documentata");
    return makeCase({
      id: `LB-${l.id}`,
      categoria: "leggi_bilancio",
      domanda: `Quale governo ha presentato ${ACT_WITH_ARTICLE[l.tipoAtto] ?? l.tipoAttoOriginale} per l'esercizio ${l.annoEsercizio}, e con quale atto?`,
      esitoAtteso: outcomeFor(level),
      valoriAttesi: [
        { campo: "governoProponenteTesto", valore: l.governoProponenteTesto },
        { campo: "governoProponenteAttribuzione", valore: l.governoProponenteAttribuzione },
        { campo: "estremi", valore: l.estremi },
      ],
      citazioniAttese: [{ dataset: "leggi-bilancio", record: l.id, urlAccettati: urls(l.fonti) }],
      regole: rules,
      livelloVerifica: level,
      notaRevisore:
        l.governoProponenteAttribuzione === "documentata"
          ? ""
          : `Attribuzione ${l.governoProponenteAttribuzione}: il governo non va dato come certo.`,
    });
  });
}

function comparisonRules(c: CostComparison): Rule[] {
  const rules: Rule[] = ["unita_di_misura"];
  if (c.tipoOnere === "tetto") rules.push("tetto_non_e_risparmio");
  if (c.omogeneita === "non_omogeneo") rules.push("niente_percentuale");
  if (c.consuntivo?.proiezione) rules.push("dichiara_proiezione");
  if (c.scostamento?.calcolatoDa === "paghi_tu") rules.push("scostamento_calcolato_da_paghi_tu");
  if (c.confidenza === "C" || c.confidenza === "D") rules.push("dichiara_confidenza_bassa");
  if (!c.consuntivo) rules.push("dichiara_consuntivo_assente");
  rules.push(...levelRules(c.verifica.livello));
  return rules;
}

function comparisonValues(c: CostComparison): ExpectedValue[] {
  const values: ExpectedValue[] = [
    { campo: c.tipoOnere === "tetto" ? "tetto di spesa" : "previsto", valore: c.previsto.importoEur, unita: "euro" },
  ];
  if (c.consuntivo) values.push({ campo: "consuntivo", valore: c.consuntivo.importoEur, unita: "euro" });
  else values.push({ campo: "consuntivoAssente", valore: c.consuntivoAssente ?? null });
  if (c.scostamento) {
    values.push({ campo: "scostamento", valore: c.scostamento.eur, unita: "euro" });
    if (c.scostamento.pct !== null && c.omogeneita !== "non_omogeneo") {
      values.push({ campo: "scostamento %", valore: c.scostamento.pct, unita: "%" });
    }
  }
  values.push({ campo: "confidenza", valore: c.confidenza });
  return values;
}

function comparisonCitation(c: CostComparison): ExpectedCitation {
  const links = [c.previsto.fonte, ...(c.consuntivo ? [c.consuntivo.fonte] : [])];
  return { dataset: "misure", record: c.id, urlAccettati: [...new Set(urls(links))] };
}

function comparisonCase(c: CostComparison, id: string, question: string, category: Category, extra: Rule[] = [], note = ""): GoldenCase {
  const level = c.verifica.livello;
  return makeCase({
    id,
    categoria: category,
    domanda: question,
    esitoAtteso: outcomeFor(level),
    valoriAttesi: comparisonValues(c),
    risposteErrate: c.tipoOnere === "tetto" ? ["Presentare la differenza fra tetto e speso come un risparmio."] : [],
    citazioniAttese: [comparisonCitation(c)],
    regole: [...comparisonRules(c), ...extra],
    livelloVerifica: level,
    notaRevisore: note || c.noteMetodo,
  });
}

function measureCases(measures: Measure[]): GoldenCase[] {
  return measures.flatMap((m) =>
    m.confronti.map((c) =>
      comparisonCase(
        c,
        `MIS-${c.id}`,
        c.tipoOnere === "tetto"
          ? `${m.titolo}, periodo «${c.periodo}»: quanto era stanziato e quanto si è speso davvero?`
          : `${m.titolo}, periodo «${c.periodo}»: quanto si prevedeva di spendere e quanto si è speso davvero?`,
        "misure",
      ),
    ),
  );
}

function financeCases(f: PublicFinance): GoldenCase[] {
  const source = (needle: string) => {
    const hit = f.fonti.find((s) => s.etichetta?.includes(needle));
    if (!hit) throw new Error(`Fonte di finanza pubblica non trovata: ${needle}`);
    return [hit.url];
  };
  const cite = (record: string, needle: string): ExpectedCitation[] => [
    { dataset: "finanza-pubblica", record, urlAccettati: source(needle) },
  ];
  const MAIN = "gov_10a_main, conti principali delle";
  const FUNCTIONS = "gov_10a_exp, spesa delle amministrazioni pubbliche per funzione";
  const EDP = "gov_10dd_edpt1, debito pubblico";
  const QUARTERLY = "gov_10q_ggnfa";
  const EU_FUNCTIONS = "spesa per funzione in % del PIL";
  const EU_ACCOUNTS = "conti principali in % del PIL";
  const EU_DEBT = "debito in % del PIL";
  const BDI = "Banca d'Italia";

  const out: GoldenCase[] = [];
  const base = { esitoAtteso: "risposta" as const, livelloVerifica: f.verifica.livello, testoVerbatim: null };

  const metrics = [
    { key: "spesa", label: "la spesa totale delle amministrazioni pubbliche" },
    { key: "entrate", label: "il totale delle entrate delle amministrazioni pubbliche" },
    { key: "saldo", label: "il saldo (indebitamento o accreditamento netto) delle amministrazioni pubbliche" },
    { key: "interessi", label: "la spesa per interessi delle amministrazioni pubbliche" },
  ] as const;
  const years = spread([...f.conti].sort((a, b) => a.anno - b.anno), 5);
  years.forEach((y, i) => {
    const m = metrics[i % metrics.length];
    out.push(
      makeCase({
        ...base,
        id: `FP-conti-${y.anno}-${m.key}`,
        categoria: "finanza_pubblica",
        domanda: `Quanto valeva ${m.label} in Italia nel ${y.anno}?`,
        valoriAttesi: [{ campo: m.key, valore: y[m.key], unita: MONEY_UNIT }],
        citazioniAttese: cite(`conti/${y.anno}`, MAIN),
        regole: ["unita_di_misura"],
        notaRevisore: "",
      }),
    );
  });
  const lastYear = f.conti.reduce((a, b) => (a.anno > b.anno ? a : b));
  out.push(
    makeCase({
      ...base,
      id: `FP-conti-${lastYear.anno}-interessi-pil`,
      categoria: "finanza_pubblica",
      domanda: `In percentuale del PIL, quanto ha pesato la spesa per interessi nel ${lastYear.anno}?`,
      valoriAttesi: [{ campo: "pil.interessi", valore: lastYear.pil.interessi, unita: GDP_UNIT }],
      citazioniAttese: cite(`conti/${lastYear.anno}`, MAIN),
      regole: ["unita_di_misura"],
      notaRevisore: "",
    }),
  );

  for (const brk of f.conti.filter((c) => c.rotturaDiSerie)) {
    const prev = f.conti.find((c) => c.anno === brk.anno - 1);
    if (!prev) continue;
    out.push(
      makeCase({
        ...base,
        id: `FP-rottura-${brk.anno}`,
        categoria: "finanza_pubblica",
        domanda: `La spesa pubblica del ${brk.anno} si può confrontare alla pari con quella del ${prev.anno}?`,
        valoriAttesi: [
          { campo: `spesa ${prev.anno}`, valore: prev.spesa, unita: MONEY_UNIT },
          { campo: `spesa ${brk.anno}`, valore: brk.spesa, unita: MONEY_UNIT },
        ],
        citazioniAttese: [...cite(`conti/${prev.anno}`, MAIN), ...cite(`conti/${brk.anno}`, MAIN)],
        regole: ["rottura_di_serie", "unita_di_misura"],
        notaRevisore: `Eurostat segna una rottura di serie nel ${brk.anno}: gli anni prima non sono confrontabili alla pari.`,
      }),
    );
  }

  const quarters = [...f.trimestri].sort((a, b) => a.periodo.localeCompare(b.periodo));
  const lastQ = quarters[quarters.length - 1];
  const [qYear, qNum] = lastQ.periodo.split("-");
  const sameQ = quarters.find((q) => q.periodo === `${Number(qYear) - 1}-${qNum}`);
  const prevQ = quarters[quarters.length - 2];
  if (sameQ) {
    out.push(
      makeCase({
        ...base,
        id: `FP-trimestre-${lastQ.periodo}-stesso`,
        categoria: "finanza_pubblica",
        domanda: `Quanto hanno speso le amministrazioni pubbliche nel ${qNum.replace("Q", "")}° trimestre ${qYear}, rispetto allo stesso trimestre dell'anno prima?`,
        valoriAttesi: [
          { campo: `spesa ${lastQ.periodo}`, valore: lastQ.spesa, unita: MONEY_UNIT },
          { campo: `spesa ${sameQ.periodo}`, valore: sameQ.spesa, unita: MONEY_UNIT },
        ],
        citazioniAttese: [...cite(`trimestri/${sameQ.periodo}`, QUARTERLY), ...cite(`trimestri/${lastQ.periodo}`, QUARTERLY)],
        regole: ["unita_di_misura"],
        notaRevisore: "",
      }),
    );
  }
  out.push(
    makeCase({
      ...base,
      id: `FP-trimestre-${lastQ.periodo}-precedente`,
      categoria: "trappole",
      domanda: `La spesa pubblica è salita o scesa fra il ${prevQ.periodo.split("-")[1].replace("Q", "")}° e il ${qNum.replace("Q", "")}° trimestre ${qYear}?`,
      valoriAttesi: [
        { campo: `spesa ${prevQ.periodo}`, valore: prevQ.spesa, unita: MONEY_UNIT },
        { campo: `spesa ${lastQ.periodo}`, valore: lastQ.spesa, unita: MONEY_UNIT },
      ],
      citazioniAttese: [...cite(`trimestri/${prevQ.periodo}`, QUARTERLY), ...cite(`trimestri/${lastQ.periodo}`, QUARTERLY)],
      regole: ["solo_stesso_trimestre", "unita_di_misura"],
      notaRevisore: "Trimestri non destagionalizzati: può dare i due valori, ma non dire che la spesa è salita o scesa.",
    }),
  );

  const lastFn = f.funzioni.reduce((a, b) => (a.anno > b.anno ? a : b));
  const functionLabels = { "07": "la sanità", "09": "l'istruzione", "10": "la protezione sociale" } as const;
  for (const code of ["07", "09", "10"] as const) {
    const label = functionLabels[code];
    out.push(
      makeCase({
        ...base,
        id: `FP-funzioni-${lastFn.anno}-GF${code}`,
        categoria: "finanza_pubblica",
        domanda: `Quanto hanno speso le amministrazioni pubbliche per ${label} nel ${lastFn.anno}?`,
        valoriAttesi: [{ campo: `GF${code}`, valore: lastFn.voci[`GF${code}`] ?? null, unita: MONEY_UNIT }],
        citazioniAttese: cite(`funzioni/${lastFn.anno}`, FUNCTIONS),
        regole: ["unita_di_misura"],
        notaRevisore: "",
      }),
    );
  }

  const lastMonth = [...f.debitoMensile].sort((a, b) => a.mese.localeCompare(b.mese)).at(-1)!;
  const [dy, dm] = lastMonth.mese.split("-").map(Number);
  out.push(
    makeCase({
      ...base,
      id: `FP-debito-${lastMonth.mese}`,
      categoria: "finanza_pubblica",
      domanda: `A quanto ammontava il debito pubblico italiano a fine ${MONTHS[dm - 1]} ${dy}?`,
      valoriAttesi: [{ campo: "debito", valore: lastMonth.valore, unita: MONEY_UNIT }],
      citazioniAttese: cite(`debitoMensile/${lastMonth.mese}`, BDI),
      regole: ["unita_di_misura"],
      notaRevisore: "",
    }),
  );
  const lastDebt = f.debitoPil.reduce((a, b) => (a.anno > b.anno ? a : b));
  out.push(
    makeCase({
      ...base,
      id: `FP-debito-pil-${lastDebt.anno}`,
      categoria: "finanza_pubblica",
      domanda: `Quanto valeva il debito pubblico in rapporto al PIL nel ${lastDebt.anno}?`,
      valoriAttesi: [{ campo: "debitoPil", valore: lastDebt.valore, unita: GDP_UNIT }],
      citazioniAttese: cite(`debitoPil/${lastDebt.anno}`, EDP),
      regole: ["unita_di_misura"],
      notaRevisore: "",
    }),
  );

  const eu = f.confrontoUe;
  out.push(
    makeCase({
      ...base,
      id: `FP-ue-funzioni-${eu.funzioni.anno}-GF07`,
      categoria: "finanza_pubblica",
      domanda: `In rapporto al PIL, l'Italia spende per la sanità più o meno della Germania? (${eu.funzioni.anno})`,
      valoriAttesi: [
        { campo: "IT GF07", valore: eu.funzioni.valori.IT?.GF07 ?? null, unita: GDP_UNIT },
        { campo: "DE GF07", valore: eu.funzioni.valori.DE?.GF07 ?? null, unita: GDP_UNIT },
      ],
      citazioniAttese: cite(`confrontoUe/funzioni/${eu.funzioni.anno}`, EU_FUNCTIONS),
      regole: ["unita_di_misura"],
      notaRevisore: "",
    }),
  );
  out.push(
    makeCase({
      ...base,
      id: `FP-ue-debito-${eu.debito.anno}`,
      categoria: "finanza_pubblica",
      domanda: `Com'è il debito pubblico italiano in % del PIL rispetto alla media dell'Unione europea nel ${eu.debito.anno}?`,
      valoriAttesi: [
        { campo: "IT", valore: eu.debito.valori.IT ?? null, unita: GDP_UNIT },
        { campo: "EU27_2020", valore: eu.debito.valori.EU27_2020 ?? null, unita: GDP_UNIT },
      ],
      citazioniAttese: cite(`confrontoUe/debito/${eu.debito.anno}`, EU_DEBT),
      regole: ["unita_di_misura"],
      notaRevisore: "",
    }),
  );
  out.push(
    makeCase({
      ...base,
      id: `FP-ue-conti-${eu.conti.anno}-spesa`,
      categoria: "finanza_pubblica",
      domanda: `Nel ${eu.conti.anno} la spesa pubblica in % del PIL era più alta in Italia o in Francia?`,
      valoriAttesi: [
        { campo: "IT spesa", valore: eu.conti.valori.IT?.spesa ?? null, unita: GDP_UNIT },
        { campo: "FR spesa", valore: eu.conti.valori.FR?.spesa ?? null, unita: GDP_UNIT },
      ],
      citazioniAttese: cite(`confrontoUe/conti/${eu.conti.anno}`, EU_ACCOUNTS),
      regole: ["unita_di_misura"],
      notaRevisore: "",
    }),
  );
  return out;
}

function seriesCases(series: Series[]): GoldenCase[] {
  const questions: Record<string, (anno: number) => string> = {
    "pil-nominale": (a) => `Quanto valeva il PIL nominale italiano nel ${a}?`,
    "popolazione-residente": (a) => `Quanti residenti aveva l'Italia al 1° gennaio ${a}?`,
    "prezzi-consumo-foi": (a) => `Qual è il valore dell'indice FOI dei prezzi al consumo nel ${a}?`,
  };
  return series
    .filter((s) => questions[s.id])
    .map((s) => {
      const last = s.punti.reduce((a, b) => (a.anno > b.anno ? a : b));
      const estimated = last.nota?.includes("stimato") ?? false;
      return makeCase({
        id: `SER-${s.id}-${last.anno}`,
        categoria: "serie",
        domanda: questions[s.id](last.anno),
        esitoAtteso: "risposta",
        valoriAttesi: [{ campo: s.id, valore: last.valore, unita: s.unita }],
        citazioniAttese: [{ dataset: `serie/${s.id}`, record: String(last.anno), urlAccettati: urls(s.fonti) }],
        regole: ["unita_di_misura", ...(estimated ? (["dichiara_stima"] as Rule[]) : [])],
        livelloVerifica: s.verifica.livello,
        notaRevisore: estimated ? "Valore stimato da ISTAT (OBS_STATUS=e)." : "",
      });
    });
}

// Se il dichiarante è il partito stesso o un documento, la domanda nomina il partito.
function promiseSubject(p: CampaignPromise, party: Party): { who: string; verb: string } {
  const isPerson = !p.dichiarante.includes("(") && !p.dichiarante.includes(party.nome) && !party.nome.includes(p.dichiarante) && p.dichiarante !== party.id;
  return isPerson ? { who: `${p.dichiarante} (${party.nome})`, verb: "ha dichiarato" } : { who: party.nome, verb: "ha scritto" };
}

function onDate(iso: string): string {
  const day = Number(iso.slice(8, 10));
  return `${day === 8 || day === 11 ? "l'" : "il "}${formatDateIt(iso)}`;
}

function promiseQuestion(p: CampaignPromise, party: Party, withTopic: boolean): string {
  const { who, verb } = promiseSubject(p, party);
  const topic = withTopic ? ` a proposito di ${COFOG_DIVISIONS[p.cofog].toLowerCase()}` : "";
  return `Che cosa ${verb} ${who} ${onDate(p.data)}${topic}? Voglio le parole esatte e la fonte.`;
}

function promiseCase(p: CampaignPromise, party: Party, withTopic: boolean, extra: Rule[] = [], note = ""): GoldenCase {
  const level = p.verifica.livello;
  const values: ExpectedValue[] = [
    { campo: "dichiarante", valore: p.dichiarante },
    { campo: "data", valore: p.data },
  ];
  if (extra.includes("costo_dichiarato_dal_proponente")) values.push({ campo: "costoDichiarato", valore: p.costoDichiarato });
  return makeCase({
    id: `PRO-${p.id}`,
    categoria: "promesse",
    domanda: promiseQuestion(p, party, withTopic),
    esitoAtteso: outcomeFor(level),
    valoriAttesi: values,
    testoVerbatim: p.testoLetterale,
    risposteErrate: [p.parafrasiNeutra],
    citazioniAttese: [{ dataset: "promesse", record: p.id, urlAccettati: urls([p.fonte]) }],
    regole: ["verbatim", ...levelRules(level), ...extra],
    livelloVerifica: level,
    notaRevisore: note,
  });
}

function promiseCases(promises: CampaignPromise[], parties: Party[]): GoldenCase[] {
  const partyById = new Map(parties.map((p) => [p.id, p]));
  const sorted = [...promises].sort((a, b) => a.id.localeCompare(b.id));
  const speakerDay = (p: CampaignPromise) => `${promiseSubject(p, partyById.get(p.partitoId)!).who}|${p.data}`;
  const speakerDayTopic = (p: CampaignPromise) => `${speakerDay(p)}|${p.cofog}`;
  const count = (key: (p: CampaignPromise) => string) => {
    const m = new Map<string, number>();
    for (const p of sorted) m.set(key(p), (m.get(key(p)) ?? 0) + 1);
    return m;
  };
  const byDay = count(speakerDay);
  const byTopic = count(speakerDayTopic);
  // Una domanda deve indicare una sola promessa: se chi parla, data e tema non bastano, la promessa si salta.
  const askable = (p: CampaignPromise) => byDay.get(speakerDay(p)) === 1 || byTopic.get(speakerDayTopic(p)) === 1;
  const needsTopic = (p: CampaignPromise) => byDay.get(speakerDay(p))! > 1;

  const chosen = new Map<string, GoldenCase>();
  const add = (p: CampaignPromise, extra: Rule[] = [], note = "") => {
    if (chosen.has(p.id) || !askable(p)) return;
    chosen.set(p.id, promiseCase(p, partyById.get(p.partitoId)!, needsTopic(p), extra, note));
  };

  // Ordine dei partiti alfabetico per sigla: nessun partito viene prima per scelta.
  for (const partyId of [...partyById.keys()].sort()) {
    const first = sorted.find((p) => p.partitoId === partyId && askable(p));
    if (first) add(first);
  }
  for (const p of sorted.filter((x) => x.verifica.livello === "V2")) add(p);
  for (const p of sorted.filter((x) => x.costoDichiarato && !chosen.has(x.id) && askable(x)).slice(0, 3)) {
    add(p, ["costo_dichiarato_dal_proponente"], "Il costo è quello dichiarato dal proponente, non una stima di Paghi Tu.");
  }
  return [...chosen.values()];
}

function manualCase(m: ManualCase, ctx: { corrections: Correction[]; promises: CampaignPromise[]; measures: Measure[] }): GoldenCase {
  if (m.riferimento?.dataset === "correzioni") {
    const cor = ctx.corrections.find((c) => c.id === m.riferimento!.record);
    if (!cor) throw new Error(`${m.id}: correzione ${m.riferimento.record} inesistente`);
    const promiseId = cor.pagina.startsWith("/promesse#") ? cor.pagina.split("#")[1] : null;
    const promise = promiseId ? ctx.promises.find((p) => p.id === promiseId) : undefined;
    const citations: ExpectedCitation[] = [{ dataset: "correzioni", record: cor.id, urlAccettati: cor.fonte ? urls([cor.fonte]) : [] }];
    if (promise) citations.push({ dataset: "promesse", record: promise.id, urlAccettati: urls([promise.fonte]) });
    return makeCase({
      id: m.id,
      categoria: m.categoria,
      domanda: m.domanda,
      esitoAtteso: m.esitoAtteso,
      valoriAttesi: [{ campo: cor.dato, valore: cor.dopo }],
      testoVerbatim: m.regole.includes("verbatim") && promise ? promise.testoLetterale : null,
      risposteErrate: [cor.prima],
      citazioniAttese: citations,
      regole: m.regole,
      livelloVerifica: promise?.verifica.livello ?? null,
      notaRevisore: m.notaRevisore,
    });
  }
  if (m.riferimento?.dataset === "misure") {
    for (const measure of ctx.measures) {
      const c = measure.confronti.find((x) => x.id === m.riferimento!.record);
      if (c) return comparisonCase(c, m.id, m.domanda, m.categoria, m.regole, m.notaRevisore);
    }
    throw new Error(`${m.id}: confronto ${m.riferimento.record} inesistente`);
  }
  return makeCase({
    id: m.id,
    categoria: m.categoria,
    domanda: m.domanda,
    esitoAtteso: m.esitoAtteso,
    valoriAttesi: [],
    citazioniAttese: [],
    regole: m.regole,
    livelloVerifica: null,
    notaRevisore: m.notaRevisore,
  });
}

export function buildGoldenSet(data: SiteData): GoldenCase[] {
  const governi = z.array(Government).parse(data.governi);
  const legislature = z.array(Legislature).parse(data.legislature);
  const leggi = z.array(BudgetLaw).parse(data.leggiBilancio);
  const misure = z.array(Measure).parse(data.misure);
  const partiti = z.array(Party).parse(data.partiti);
  const promesse = z.array(CampaignPromise).parse(data.promesse);
  const correzioni = z.array(Correction).parse(data.correzioni);
  const finanza = PublicFinance.parse(data.finanzaPubblica);
  const serie = Object.values(data.serie).map((s) => Series.parse(s));
  const manuali = z.array(ManualCase).parse(data.casiManuali);
  const revisione = z.record(z.string(), ReviewStatus).parse(data.revisione);

  const cases = [
    ...governmentCases(governi),
    ...legislatureCases(legislature),
    ...budgetLawCases(leggi),
    ...measureCases(misure),
    ...financeCases(finanza),
    ...seriesCases(serie),
    ...promiseCases(promesse, partiti),
    ...manuali.map((m) => manualCase(m, { corrections: correzioni, promises: promesse, measures: misure })),
  ].map((c) => ({ ...c, rivistoDaAntonio: revisione[c.id] ?? null }));

  const ids = new Set<string>();
  for (const c of cases) {
    if (ids.has(c.id)) throw new Error(`Id duplicato nel golden set: ${c.id}`);
    ids.add(c.id);
  }
  return cases;
}
