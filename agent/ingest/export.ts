// Export dei dati del sito per l'indice dell'agente (D-030): un documento per ogni chiave
// (dataset, record) che il golden set usa nelle citazioni, con testo in italiano e metadati.
// Funzione pura: stessi dati, stessi byte.
import { createHash } from "node:crypto";
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
  VerificationLevel,
  type CostComparison,
  type SourceLink,
  type Verification,
} from "../../src/lib/domain/schemas.ts";
import { FINANCE_SOURCES, formatDateIt, urls } from "../shared/source-format.ts";

export const SITE_URL = "https://www.paghitu.it";

const isoDate = z.iso.date();

export const IndexDocument = z.object({
  id: z.string().regex(/^[A-Za-z0-9][A-Za-z0-9_-]{0,62}$/),
  structData: z.object({
    dataset: z.string().min(1),
    record: z.string().min(1),
    titolo: z.string().min(1),
    testo: z.string().min(1),
    // Le sole parole che l'agente può mettere fra virgolette per una promessa (validatore, 5.2).
    testo_letterale: z.string().min(1).nullable(),
    livello_verifica: VerificationLevel,
    verifica_dettaglio: z.string(),
    fonte_url: z.array(z.url()).min(1),
    periodo: z.object({ dal: isoDate, al: isoDate.nullable() }).nullable(),
    governi: z.array(z.string().regex(/^g\d+$/)),
    url_pagina: z.url().startsWith(SITE_URL),
  }),
});
export type IndexDocument = z.infer<typeof IndexDocument>;

export type Exclusion = { dataset: string; record: string; motivo: string };

export type ExportInput = {
  governi: unknown;
  legislature: unknown;
  leggiBilancio: unknown;
  misure: unknown;
  partiti: unknown;
  promesse: unknown;
  correzioni: unknown;
  finanzaPubblica: unknown;
  serie: Record<string, unknown>;
};

export const NV_OPENING = "Dato non verificato (NV): va dichiarato come tale, non è confermato su una fonte primaria.";

const LEVEL_TEXT = {
  V1: "Livello di verifica V1: fonte primaria.",
  V2: "Livello di verifica V2: verifica parziale.",
  NV: NV_OPENING,
} as const;

// Stessa forma che numberForms di agent/evals/testo.ts riconosce: separatore delle migliaia e al massimo tre decimali.
const num = (v: number) => v.toLocaleString("it-IT", { maximumFractionDigits: 3 });
const date = (iso: string | null) => (iso ? formatDateIt(iso) : "in carica");

export function documentId(dataset: string, record: string): string {
  return `${dataset}--${record}`.replace(/[^A-Za-z0-9_-]/g, "-");
}

const year = (y: number) => ({ dal: `${y}-01-01`, al: `${y}-12-31` });

function month(m: string) {
  const [y, mm] = m.split("-").map(Number);
  const last = new Date(Date.UTC(y, mm, 0)).getUTCDate();
  return { dal: `${m}-01`, al: `${m}-${String(last).padStart(2, "0")}` };
}

function quarter(p: string) {
  const [y, q] = p.split("-Q").map(Number);
  const first = String((q - 1) * 3 + 1).padStart(2, "0");
  return { dal: `${y}-${first}-01`, al: month(`${y}-${String(q * 3).padStart(2, "0")}`).al };
}

type Period = { dal: string; al: string | null };

// Governi in carica in almeno un giorno del periodo: per un anno è la stessa regola delle pagine
// dei governi (anno di inizio ≤ anno ≤ anno di fine). Un governo in carica vale fino alla data dei dati.
function governmentsIn(govs: Government[], p: Period, today: string): string[] {
  const to = p.al ?? today;
  return govs.filter((g) => g.inizio <= to && (g.fine ?? today) >= p.dal).map((g) => g.id);
}

type Draft = {
  dataset: string;
  record: string;
  titolo: string;
  righe: string[];
  verifica: Verification;
  fonti: SourceLink[];
  periodo: Period | null;
  governi: string[];
  pagina: string;
  letterale?: string;
};

const needsPermission = (links: SourceLink[]) =>
  links.some((l) => URL.canParse(l.url) && /(^|\.)pagellapolitica\.it$/.test(new URL(l.url).hostname));

// Frasi che parlano a un modello invece che a un lettore. Un documento che le contiene (una
// dichiarazione di terzi, una nota) resta fuori dall'indice finché il titolare non lo rivede: è il
// vettore dell'injection indiretta (piano di hardening, D-033).
export const INSTRUCTION_LIKE =
  /\b(ignora|dimentica) (tutte )?(le )?(istruzioni|regole)\b|\bignore (all |any )?(previous |prior )?instructions\b|\bsystem prompt\b|\b(sei|you are) (ora |now )?(un|an?) (assistente|assistant|ai|ia)\b|\b(rispondi|answer) (solo|only) (con|with)\b|\bmodalit[aà] sviluppatore\b|\bdeveloper mode\b/i;

function toDocument(d: Draft): IndexDocument | Exclusion {
  if ([d.titolo, ...d.righe, d.letterale ?? ""].some((t) => INSTRUCTION_LIKE.test(t))) {
    return { dataset: d.dataset, record: d.record, motivo: "frasi da istruzione nel testo: in quarantena finché il titolare non lo rivede (D-033)" };
  }
  if (needsPermission(d.fonti)) {
    return { dataset: d.dataset, record: d.record, motivo: "fonte con riuso «con_permesso» senza permesso scritto (criterio 1.1)" };
  }
  const fonte_url = [...new Set(urls(d.fonti))];
  if (!fonte_url.length) return { dataset: d.dataset, record: d.record, motivo: "nessuna fonte accettata dopo le esclusioni" };
  const level = d.verifica.livello;
  // Le fonti restano nei metadati (fonte_url) e le mostra il widget: nel testo il modello le copierebbe
  // nella risposta, e un URL nella risposta è un'astensione (D-033).
  const testo = [level === "NV" ? NV_OPENING : null, d.titolo, ...d.righe, level === "NV" ? null : LEVEL_TEXT[level]]
    .filter((r): r is string => Boolean(r))
    .join("\n");
  return {
    id: documentId(d.dataset, d.record),
    structData: {
      dataset: d.dataset,
      record: d.record,
      titolo: d.titolo,
      testo,
      testo_letterale: d.letterale ?? null,
      livello_verifica: level,
      verifica_dettaglio: d.verifica.dettaglio,
      fonte_url,
      periodo: d.periodo,
      governi: d.governi,
      url_pagina: `${SITE_URL}${d.pagina}`,
    },
  };
}

function governmentDrafts(govs: Government[]): Draft[] {
  return govs.map((g) => ({
    dataset: "governi",
    record: g.id,
    titolo: g.nome,
    righe: [
      `Presidente del Consiglio: ${g.presidente}.`,
      `In carica dal ${date(g.inizio)} ${g.fine ? `al ${date(g.fine)}` : "(in carica)"}; legislatura ${g.legislaturaId}.`,
      `Maggioranza: ${g.maggioranza}. Tipo: ${g.tipo}.`,
    ],
    verifica: g.verifica,
    fonti: g.fonti,
    periodo: { dal: g.inizio, al: g.fine },
    governi: [g.id],
    pagina: `/governi/${g.id}`,
  }));
}

function legislatureDrafts(legs: Legislature[], govs: Government[], today: string): Draft[] {
  return legs.map((l) => ({
    dataset: "legislature",
    record: l.id,
    titolo: l.numero === 0 ? "Assemblea Costituente" : `Legislatura ${l.id}`,
    righe: [
      `Dal ${date(l.inizio)} ${l.fine ? `al ${date(l.fine)}` : "(in corso)"}.`,
      l.elezioni ? `Elezioni: ${date(l.elezioni)}.` : "Elezioni: nessuna data nel dato.",
      `Sistema elettorale: ${l.sistemaElettorale}.`,
    ],
    verifica: l.verifica,
    fonti: l.fonti,
    periodo: { dal: l.inizio, al: l.fine },
    governi: governmentsIn(govs, { dal: l.inizio, al: l.fine }, today),
    pagina: "/governi",
  }));
}

function budgetLawDrafts(laws: BudgetLaw[]): Draft[] {
  return laws.map((l) => ({
    dataset: "leggi-bilancio",
    record: l.id,
    titolo: `${l.tipoAttoOriginale}, esercizio ${l.annoEsercizio}`,
    righe: [
      `Tipo di atto: ${l.tipoAtto}. Estremi: ${l.estremi}.`,
      `Governo proponente: ${l.governoProponenteTesto} (attribuzione ${l.governoProponenteAttribuzione}).`,
    ],
    verifica: l.verifica,
    fonti: l.fonti,
    periodo: year(l.annoInizio),
    governi: l.governoProponenteId ? [l.governoProponenteId] : [],
    pagina: "/leggi-di-bilancio",
  }));
}

export const withoutPercentages = (note: string) =>
  note
    .split(/(?<=\.)\s+(?=\p{Lu})/u)
    .filter((sentence) => !/\d\s*%|per cento/.test(sentence))
    .join(" ");

function comparisonLines(c: CostComparison): string[] {
  const lines = [
    `${c.tipoOnere === "tetto" ? "Tetto di spesa" : "Previsto"}: ${num(c.previsto.importoEur)} euro (${c.previsto.descrizione}).`,
    c.consuntivo
      ? `Consuntivo${c.consuntivo.proiezione ? " (proiezione)" : ""}: ${num(c.consuntivo.importoEur)} euro (${c.consuntivo.descrizione}).`
      : `Consuntivo: ${c.consuntivoAssente ?? "non disponibile"}.`,
  ];
  if (c.tipoOnere === "tetto") lines.push("Spendere meno del tetto non è un risparmio: il tetto non è una stima.");
  if (c.scostamento) {
    // Con basi non omogenee si mostrano i due numeri, senza percentuale (nota «costo delle misure»).
    const pct = c.scostamento.pct !== null && c.omogeneita !== "non_omogeneo" ? ` (${num(c.scostamento.pct)} %)` : "";
    const by = c.scostamento.calcolatoDa === "fonte" ? "dalla fonte" : "da Paghi Tu";
    lines.push(`Scostamento: ${num(c.scostamento.eur)} euro${pct}, calcolato ${by}.`);
  }
  // Con basi non omogenee la percentuale non si dà, nemmeno dentro la nota di metodo: le frasi con
  // una percentuale restano fuori dall'indice (D-031).
  const note = c.omogeneita === "non_omogeneo" ? withoutPercentages(c.noteMetodo) : c.noteMetodo;
  lines.push(`Omogeneità delle basi: ${c.omogeneita}. Confidenza: ${c.confidenza}.`, `Metodo: ${note}`);
  return lines;
}

function measureDrafts(measures: Measure[]): Draft[] {
  return measures.flatMap((m) =>
    m.confronti.map((c) => ({
      dataset: "misure",
      record: c.id,
      titolo: `${m.titolo}, periodo ${c.periodo}`,
      righe: [`Atto istitutivo: ${m.attoIstitutivo}. Governo: ${m.governoTesto}. Anno di avvio: ${m.annoAvvio}.`, ...comparisonLines(c)],
      verifica: c.verifica,
      fonti: [c.previsto.fonte, ...(c.consuntivo ? [c.consuntivo.fonte] : [])],
      periodo: { dal: `${m.annoAvvio}-01-01`, al: null },
      governi: m.governiIds,
      pagina: "/misure",
    })),
  );
}

const COFOG_LABELS: Record<string, string> = COFOG_DIVISIONS;
const functionLabel = (code: string) => COFOG_LABELS[code.slice(2, 4)] ?? "";
const fnLine = (code: string, value: number, unit: string) =>
  `${code}${code.length === 4 ? ` ${functionLabel(code)}` : ""}: ${num(value)} ${unit}.`;

function financeDrafts(f: PublicFinance, govs: Government[], today: string): Draft[] {
  const MLN = "milioni di euro correnti";
  const source = (needle: string) => {
    const hit = f.fonti.filter((s) => s.etichetta?.includes(needle));
    if (!hit.length) throw new Error(`Fonte di finanza pubblica non trovata: ${needle}`);
    return hit;
  };
  const S = FINANCE_SOURCES;
  const base = (record: string, titolo: string, righe: string[], periodo: Period, fonti: SourceLink[]) => ({
    dataset: "finanza-pubblica",
    record,
    titolo,
    righe,
    verifica: f.verifica,
    fonti,
    periodo,
    governi: governmentsIn(govs, periodo, today),
    pagina: "/spesa",
  });
  return [
    ...f.conti.map((c) =>
      base(
        `conti/${c.anno}`,
        `Conti delle amministrazioni pubbliche, anno ${c.anno}`,
        [
          `Spesa: ${num(c.spesa)} ${MLN} (${num(c.pil.spesa)} % del PIL).`,
          `Entrate: ${num(c.entrate)} ${MLN} (${num(c.pil.entrate)} % del PIL).`,
          `Saldo: ${num(c.saldo)} ${MLN} (${num(c.pil.saldo)} % del PIL).`,
          `Interessi: ${num(c.interessi)} ${MLN} (${num(c.pil.interessi)} % del PIL).`,
          c.popolazioneMedia === null ? "Popolazione media: non disponibile." : `Popolazione media: ${num(c.popolazioneMedia)}.`,
          ...(c.rotturaDiSerie ? ["Rottura di serie: gli anni prima di questo non sono confrontabili alla pari."] : []),
        ],
        year(c.anno),
        source(S.MAIN),
      ),
    ),
    ...f.trimestri.map((t) =>
      base(
        `trimestri/${t.periodo}`,
        `Conti trimestrali delle amministrazioni pubbliche, ${t.periodo}`,
        [
          `Spesa: ${num(t.spesa)} ${MLN}. Entrate: ${num(t.entrate)} ${MLN}. Saldo: ${num(t.saldo)} ${MLN}. Interessi: ${num(t.interessi)} ${MLN}.`,
          "Dati non destagionalizzati: si confrontano solo con lo stesso trimestre di un altro anno.",
        ],
        quarter(t.periodo),
        source(S.QUARTERLY),
      ),
    ),
    ...f.funzioni.map((y) =>
      base(
        `funzioni/${y.anno}`,
        `Spesa delle amministrazioni pubbliche per funzione (COFOG), anno ${y.anno}`,
        [
          `Totale: ${num(y.totale)} ${MLN}.`,
          ...Object.keys(y.voci).sort().map((code) => fnLine(code, y.voci[code], MLN)),
        ],
        year(y.anno),
        source(S.FUNCTIONS),
      ),
    ),
    ...f.debitoMensile.map((d) =>
      base(
        `debitoMensile/${d.mese}`,
        `Debito delle amministrazioni pubbliche a fine ${formatDateIt(`${d.mese}-01`).replace(/^1° /, "")}`,
        [`Debito: ${num(d.valore)} ${MLN}.`],
        month(d.mese),
        source(S.BDI),
      ),
    ),
    ...f.debitoPil.map((d) =>
      base(`debitoPil/${d.anno}`, `Debito in rapporto al PIL, anno ${d.anno}`, [`Debito: ${num(d.valore)} % del PIL.`], year(d.anno), source(S.EDP)),
    ),
    base(
      `confrontoUe/funzioni/${f.confrontoUe.funzioni.anno}`,
      `Spesa per funzione in % del PIL, confronto europeo, anno ${f.confrontoUe.funzioni.anno}`,
      Object.keys(f.confrontoUe.funzioni.valori)
        .sort()
        .flatMap((geo) => {
          const v = f.confrontoUe.funzioni.valori[geo as keyof typeof f.confrontoUe.funzioni.valori] ?? {};
          return Object.keys(v).sort().map((code) => `${geo} ${fnLine(code, v[code], "% del PIL")}`);
        }),
      year(f.confrontoUe.funzioni.anno),
      source(S.EU_FUNCTIONS),
    ),
    base(
      `confrontoUe/conti/${f.confrontoUe.conti.anno}`,
      `Conti delle amministrazioni pubbliche in % del PIL, confronto europeo, anno ${f.confrontoUe.conti.anno}`,
      Object.keys(f.confrontoUe.conti.valori)
        .sort()
        .map((geo) => {
          const v = f.confrontoUe.conti.valori[geo as keyof typeof f.confrontoUe.conti.valori];
          return v
            ? `${geo}: spesa ${num(v.spesa)} % del PIL, entrate ${num(v.entrate)} % del PIL, saldo ${num(v.saldo)} % del PIL, interessi ${num(v.interessi)} % del PIL.`
            : `${geo}: dato assente.`;
        }),
      year(f.confrontoUe.conti.anno),
      source(S.EU_ACCOUNTS),
    ),
    base(
      `confrontoUe/debito/${f.confrontoUe.debito.anno}`,
      `Debito in % del PIL, confronto europeo, anno ${f.confrontoUe.debito.anno}`,
      Object.keys(f.confrontoUe.debito.valori)
        .sort()
        .map((geo) => `${geo}: ${num(f.confrontoUe.debito.valori[geo as keyof typeof f.confrontoUe.debito.valori] ?? Number.NaN)} % del PIL.`),
      year(f.confrontoUe.debito.anno),
      source(S.EU_DEBT),
    ),
  ];
}

function seriesDrafts(series: Series[], govs: Government[], today: string): Draft[] {
  return series.flatMap((s) =>
    s.punti.map((p) => ({
      dataset: `serie/${s.id}`,
      record: String(p.anno),
      titolo: `${s.titolo}, ${p.anno}`,
      righe: [`Valore: ${num(p.valore)} ${s.unita}.`, ...(p.nota ? [`Nota: ${p.nota}`] : []), ...s.avvertenze.map((a) => `Avvertenza: ${a}`)],
      verifica: s.verifica,
      fonti: s.fonti,
      periodo: year(p.anno),
      governi: governmentsIn(govs, year(p.anno), today),
      pagina: "/spesa",
    })),
  );
}

// Le note delle promesse sono appunti di ricerca e verifica, non mostrati in pagina: non entrano nell'indice.
function promiseDrafts(promises: CampaignPromise[], parties: Party[], govs: Government[], today: string): Draft[] {
  const partyName = new Map(parties.map((p) => [p.id, p.nome]));
  return promises.map((p) => ({
    dataset: "promesse",
    record: p.id,
    titolo: `Dichiarazione di ${p.dichiarante} (${partyName.get(p.partitoId) ?? p.partitoId}) del ${date(p.data)}`,
    righe: [
      `Dichiarante: ${p.dichiarante}, ${p.ruoloDichiarante}. Partito: ${partyName.get(p.partitoId) ?? p.partitoId}. Data: ${date(p.data)}.`,
      `Parole esatte: «${p.testoLetterale}»`,
      `In sintesi: ${p.parafrasiNeutra}`,
      `Tipo di fonte: ${p.tipoFonte}. Veicolo: ${p.veicolo}. Orizzonte: ${p.orizzonte}. Area di spesa: ${COFOG_DIVISIONS[p.cofog]}. Misurabile: ${p.misurabile}.`,
      `Costo dichiarato dal proponente: ${p.costoDichiarato ?? "non indicato"}.`,
      ...(p.stimaTerzi ? [`Stima di terzi: ${p.stimaTerzi.testo} (${p.stimaTerzi.fonte.url}).`] : []),
    ],
    verifica: p.verifica,
    fonti: [p.fonte, ...(p.stimaTerzi ? [p.stimaTerzi.fonte] : [])],
    periodo: { dal: p.data, al: p.data },
    governi: governmentsIn(govs, { dal: p.data, al: p.data }, today),
    pagina: `/promesse#${p.id}`,
    letterale: p.testoLetterale,
  }));
}

// Il registro delle correzioni è la fonte primaria di sé stesso: ogni voce è V1 per costruzione.
function correctionDrafts(corrections: Correction[]): Draft[] {
  return corrections.map((c) => ({
    dataset: "correzioni",
    record: c.id,
    titolo: `Correzione ${c.id} del ${date(c.data)}: ${c.dato}`,
    righe: [`Tipo: ${c.tipo}. Pagina: ${c.pagina}.`, `Prima: ${c.prima}`, `Dopo: ${c.dopo}`, `Motivo: ${c.motivo}`],
    verifica: { livello: "V1", dettaglio: "registro pubblico delle correzioni (D-020)" },
    fonti: c.fonte ? [c.fonte] : [{ url: `${SITE_URL}/correzioni` }],
    periodo: { dal: c.data, al: c.data },
    governi: [],
    pagina: "/correzioni",
  }));
}

// I nomi delle misure che contengono una cifra («Quota 100», «Superbonus 110%»): il validatore non
// li conta come cifre. Si prendono da tutte le misure, anche da quelle escluse dall'indice, perché
// un'astensione può nominarle (D-031).
export function namedFiguresOf(measures: Measure[]): string[] {
  return [...new Set(measures.flatMap((m) => [...m.titolo.matchAll(/\p{L}+ \d+(?:\s?%| euro)?/gu)].map((x) => x[0])))].sort();
}

export function buildDocuments(input: ExportInput): { documents: IndexDocument[]; excluded: Exclusion[]; nomiConCifre: string[] } {
  const governi = z.array(Government).parse(input.governi).toSorted((a, b) => a.ordine - b.ordine);
  const finanza = PublicFinance.parse(input.finanzaPubblica);
  const today = finanza.scaricato.slice(0, 10);
  const serie = Object.keys(input.serie)
    .sort()
    .map((k) => Series.parse(input.serie[k]));

  const drafts = [
    ...governmentDrafts(governi),
    ...legislatureDrafts(z.array(Legislature).parse(input.legislature), governi, today),
    ...budgetLawDrafts(z.array(BudgetLaw).parse(input.leggiBilancio)),
    ...measureDrafts(z.array(Measure).parse(input.misure)),
    ...financeDrafts(finanza, governi, today),
    ...seriesDrafts(serie, governi, today),
    ...promiseDrafts(z.array(CampaignPromise).parse(input.promesse), z.array(Party).parse(input.partiti), governi, today),
    ...correctionDrafts(z.array(Correction).parse(input.correzioni)),
  ];

  const documents: IndexDocument[] = [];
  const excluded: Exclusion[] = [];
  for (const d of drafts) {
    const out = toDocument(d);
    if ("motivo" in out) excluded.push(out);
    else documents.push(IndexDocument.parse(out));
  }
  return { documents, excluded, nomiConCifre: namedFiguresOf(z.array(Measure).parse(input.misure)) };
}

export function toJsonl(documents: IndexDocument[]): string {
  return documents.map((d) => JSON.stringify(d)).join("\n") + "\n";
}

export const sha256 = (s: string) => createHash("sha256").update(s).digest("hex");
