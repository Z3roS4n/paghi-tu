// Risposta dell'agente e validatore deterministico (fase 5 della roadmap): la route controlla ogni
// risposta con questo codice prima di mostrarla, le eval (agent/evals/score.ts) usano lo stesso.
// Nel dubbio la risposta diventa un'astensione: un falso riscontro è peggio di una risposta in meno.
import { z } from "zod";
import type { IndexDocument } from "../ingest/export.ts";
import { normalizeText, verbatimFragments } from "../evals/testo.ts";

export const AgentAnswer = z.object({
  testo: z.string(),
  citazioni: z.array(z.object({ id: z.string(), url: z.string() })),
  astensione: z.boolean(),
});
export type AgentAnswer = z.infer<typeof AgentAnswer>;

export type Index = ReadonlyMap<string, IndexDocument>;

export const REASONS = [
  "nessuna_citazione",
  "id_inesistente",
  "url_non_del_record",
  "cifra_senza_fonte",
  "citazione_non_letterale",
  "nv_non_dichiarato",
] as const;
export type Reason = (typeof REASONS)[number];

export type Validation =
  | { esito: "risposta" }
  | { esito: "astensione" }
  | { esito: "astensione_forzata"; motivi: { motivo: Reason; dettaglio: string }[] };

const MONTHS = [
  "gennaio", "febbraio", "marzo", "aprile", "maggio", "giugno",
  "luglio", "agosto", "settembre", "ottobre", "novembre", "dicembre",
];

const dateText = (y: string, m: string, d: string) => `${Number(d)} ${MONTHS[Number(m) - 1] ?? m} ${y}`;

// Una data scritta in un altro formato diventa «27 luglio 1960», la forma dei documenti: così il
// mese non conta come cifra. Gli identificativi (C27-PD-028, COR-0001, g13) non sono cifre.
function prepare(text: string): string {
  return text
    .replace(/https?:\/\/\S+/g, " ")
    .replace(/\b(\d{4})-(\d{2})-(\d{2})\b/g, (_, y: string, m: string, d: string) => dateText(y, m, d))
    .replace(/\b(\d{1,2})[/.](\d{1,2})[/.](\d{4})\b/g, (_, d: string, m: string, y: string) => dateText(y, m, d))
    .replace(/\b[A-Z]\d{2}-[A-Z0-9]+-\d{3}\b|\bCOR-\d{4}\b|\bg\d+\b|\b\d{4}-Q[1-4]\b/g, " ")
    .replace(/(\d)\s*[°º]/g, "$1");
}

// Le cifre come le scrive un testo italiano: punto per le migliaia, virgola per i decimali. Il segno
// non conta («disavanzo di 69.736» e «saldo -69.736» sono la stessa cifra). Una cifra attaccata a
// una lettera («R15») non è una cifra.
const NUMBER = /(?<![\p{L}\d.,])\d{1,3}(?:\.\d{3})+(?:,\d+)?(?![\d\p{L}])|(?<![\p{L}\d.,])\d+(?:,\d+)?(?![\d\p{L}])/gu;
const SCALES: [RegExp, number][] = [[/^\s*(miliard|mld)/i, 1e9], [/^\s*(milion|mln)/i, 1e6]];

// Ogni cifra con le letture che ammette: «5.906,8 milioni» vale 5906,8 e 5.906.800.000. Il cambio di
// scala vale solo se esatto: «5,9 miliardi» non è 5.906.800.000.
export function extractFigures(text: string): string[][] {
  const prepared = prepare(text);
  return [...prepared.matchAll(NUMBER)].map((m) => {
    const value = Number(m[0].replace(/\./g, "").replace(",", "."));
    const after = prepared.slice((m.index ?? 0) + m[0].length, (m.index ?? 0) + m[0].length + 12);
    const scale = SCALES.find(([re]) => re.test(after))?.[1];
    return scale ? [String(value), String(Math.round(value * scale))] : [String(value)];
  });
}

export const extractNumbers = (text: string): string[] => extractFigures(text).map((f) => f[0]);

const QUOTE = /«([^»]+)»|“([^”]+)”|"([^"]+)"/g;
// Sotto questa lunghezza le virgolette segnano un termine («tetto»), non una citazione.
const MIN_QUOTE = 12;

export function extractQuotes(text: string): string[] {
  return [...text.matchAll(QUOTE)].map((m) => m[1] ?? m[2] ?? m[3] ?? "").filter((q) => q.trim().length >= MIN_QUOTE);
}

// Il testo di un documento su cui una risposta può appoggiarsi. Restano fuori le note di metodo, che
// conservano valori superati («il valore originario … era errato»), e il testo di prima di una
// correzione: lì le cifre e le parole ci sono, ma non sono più quelle giuste.
export const citableText = (d: IndexDocument) =>
  d.structData.testo
    .split("\n")
    .filter((l) => !/^(Metodo|Prima):/.test(l))
    .join("\n");

const inside = (quote: string, source: string) => {
  const fragments = verbatimFragments(quote);
  const src = normalizeText(source);
  return fragments.length > 0 && fragments.every((f) => src.includes(f));
};

// Una citazione è giusta se sta nelle parole esatte di una promessa citata, oppure nel testo di un
// altro documento citato. La parafrasi di una promessa non vale come citazione.
export function quoteIsLiteral(quote: string, docs: IndexDocument[]): boolean {
  return docs.some((d) =>
    d.structData.testo_letterale !== null ? inside(quote, d.structData.testo_letterale) : inside(quote, citableText(d)),
  );
}

// Le cifre della risposta che non stanno nel testo di nessun documento citato (metrica 4.1, criterio 5.1).
export function figuresWithoutSource(text: string, docs: IndexDocument[]): string[] {
  const cited = new Set(docs.flatMap((d) => extractFigures(citableText(d)).flat()));
  return [...new Set(extractFigures(text).filter((f) => !f.some((v) => cited.has(v))).map((f) => f[0]))];
}

export const declaresNotVerified = (text: string) => /non (è )?verificat|\(nv\)|\bnv\b|da verificare/.test(normalizeText(text));

export function validateAnswer(answer: AgentAnswer, index: Index): Validation {
  if (answer.astensione) return { esito: "astensione" };
  const motivi: { motivo: Reason; dettaglio: string }[] = [];

  if (!answer.citazioni.length) motivi.push({ motivo: "nessuna_citazione", dettaglio: "risposta senza citazioni" });
  const docs: IndexDocument[] = [];
  for (const c of answer.citazioni) {
    const doc = index.get(c.id);
    if (!doc) {
      motivi.push({ motivo: "id_inesistente", dettaglio: c.id });
      continue;
    }
    docs.push(doc);
    if (!doc.structData.fonte_url.includes(c.url) && doc.structData.url_pagina !== c.url) {
      motivi.push({ motivo: "url_non_del_record", dettaglio: `${c.id} ${c.url}` });
    }
  }

  for (const n of figuresWithoutSource(answer.testo, docs)) motivi.push({ motivo: "cifra_senza_fonte", dettaglio: n });

  for (const q of extractQuotes(answer.testo)) {
    if (!quoteIsLiteral(q, docs)) motivi.push({ motivo: "citazione_non_letterale", dettaglio: q });
  }

  if (docs.some((d) => d.structData.livello_verifica === "NV") && !declaresNotVerified(answer.testo)) {
    motivi.push({ motivo: "nv_non_dichiarato", dettaglio: docs.filter((d) => d.structData.livello_verifica === "NV").map((d) => d.id).join(", ") });
  }

  return motivi.length ? { esito: "astensione_forzata", motivi } : { esito: "risposta" };
}
