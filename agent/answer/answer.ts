// Risposta dell'agente e validatore deterministico (fase 5 della roadmap): la route controlla ogni
// risposta con questo codice prima di mostrarla, le eval (agent/evals/score.ts) usano lo stesso.
// Nel dubbio la risposta diventa un'astensione: un falso riscontro è peggio di una risposta in meno.
import { z } from "zod";
import type { IndexDocument } from "../ingest/export.ts";
import { normalizeText, verbatimFragments } from "../evals/testo.ts";
import { MAX_ANSWER, exposesInstructions, forbiddenFormat, judgment, wrongAttribution } from "./guardie.ts";
import manifest from "../ingest/manifest.json" with { type: "json" };

export const AgentAnswer = z.object({
  testo: z.string(),
  citazioni: z.array(z.object({ id: z.string(), url: z.string() })),
  astensione: z.boolean(),
});
export type AgentAnswer = z.infer<typeof AgentAnswer>;

export type Index = ReadonlyMap<string, IndexDocument>;

// Le domande sull'agente stesso non hanno un record da citare: la route risponde con questo testo
// fisso, senza chiamare l'engine (AI Act art. 50, decisione del 2026-10-25, D-031).
export const TRANSPARENCY_ANSWER =
  "Sono un assistente automatico basato sull'intelligenza artificiale, non una persona. Rispondo solo con i dati pubblicati su Paghi Tu, " +
  "un dataset pubblico costruito su fonti ufficiali: per ogni risposta indico il record e la fonte da cui viene, così puoi controllarla. " +
  "Se un dato non c'è, o non è verificato, te lo dico invece di inventarlo.";

const TRANSPARENCY_QUESTION =
  /\b(sei|parlo con|sto parlando con|parlando con) (una persona|un umano|un essere umano|un bot|un robot|un'ia|un'intelligenza artificiale|una macchina|un programma)\b|\bchi (sei|c'è dall'altra parte)\b|\bcosa sei\b|\bsei (umano|reale|un'ia|un bot)\b|\bda dove (prendi|vengono|arrivano|ricavi) (i numeri|i dati|le risposte|le informazioni)\b|\bquali fonti usi\b|\bcome (funzioni|rispondi)\b/;

export const isTransparencyQuestion = (question: string) => TRANSPARENCY_QUESTION.test(normalizeText(question).replace(/"/g, "'"));

export const transparencyAnswer = (): AgentAnswer => ({ testo: TRANSPARENCY_ANSWER, citazioni: [], astensione: false });

export const REASONS = [
  "nessuna_citazione",
  "id_inesistente",
  "url_non_del_record",
  "cifra_senza_fonte",
  "citazione_non_letterale",
  "nv_non_dichiarato",
  "formato_vietato",
  "giudizio",
  "istruzioni_esposte",
  "attribuzione_errata",
  "troppo_lunga",
  "silenzio_elettorale",
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

// I nomi delle misure che contengono una cifra («Quota 100», «Superbonus 110%», «Bonus 80 euro»):
// la cifra fa parte del nome e non è un dato. L'elenco lo scrive l'export nel manifest.
const escapeName = (n: string) =>
  n.replace(/[.*+?^${}()|[\]\\]/g, "\\$&").replace(/\s?%|\s+/g, (x) => (x.includes("%") ? "\\s?%?" : "\\s+"));
export const namesPattern = (names: string[]): RegExp | null =>
  names.length ? new RegExp(`(?<!\\p{L})(?:${names.map(escapeName).join("|")})(?!\\d)`, "giu") : null;
export const NAMED_FIGURES = namesPattern(manifest.nomiConCifre);

// Una data scritta in un altro formato diventa «27 luglio 1960», la forma dei documenti: così il
// mese non conta come cifra. Gli identificativi (C27-PD-028, COR-0001, g13) non sono cifre. Il
// periodo di un trimestre («2026-Q2» nel record) diventa «2 trimestre 2026», come «2° trimestre
// 2026» nella risposta: è un dato del record e la risposta lo può ripetere.
function prepare(text: string, names: RegExp | null): string {
  return (names ? text.replace(names, " ") : text)
    .replace(/https?:\/\/\S+/g, " ")
    .replace(/\b(\d{4})-(\d{2})-(\d{2})\b/g, (_, y: string, m: string, d: string) => dateText(y, m, d))
    .replace(/\b(\d{1,2})[/.](\d{1,2})[/.](\d{4})\b/g, (_, d: string, m: string, y: string) => dateText(y, m, d))
    .replace(/\b(\d{4})-Q([1-4])\b/g, "$2 trimestre $1")
    .replace(/\b[A-Z]\d{2}-[A-Z0-9]+-\d{3}\b|\bCOR-\d{4}\b|\bg\d+\b/g, " ")
    .replace(/(\d)\s*[°º]/g, "$1");
}

// Le date scritte per intero nella domanda («il 2 novembre 1953»): la risposta può ripeterle senza
// citarle, perché non sono un dato del record (decisione del 2026-10-25). Gli altri numeri della
// domanda restano da citare, così una risposta non conferma una cifra messa da chi chiede.
const FULL_DATE = new RegExp(`\\b(\\d{1,2}) (${MONTHS.join("|")}) (\\d{4})\\b`, "gi");
const dateKey = (d: string, m: string, y: string) => `${Number(d)} ${m.toLowerCase()} ${y}`;
function withoutQuestionDates(prepared: string, question: string | undefined, names: RegExp | null): string {
  if (!question) return prepared;
  const asked = new Set([...prepare(question, names).matchAll(FULL_DATE)].map((m) => dateKey(m[1], m[2], m[3])));
  return asked.size ? prepared.replace(FULL_DATE, (all, d: string, m: string, y: string) => (asked.has(dateKey(d, m, y)) ? " " : all)) : prepared;
}

// Le cifre come le scrive un testo italiano: punto per le migliaia, virgola per i decimali. Il segno
// non conta («disavanzo di 69.736» e «saldo -69.736» sono la stessa cifra). Una cifra attaccata a
// una lettera («R15») non è una cifra.
const NUMBER = /(?<![\p{L}\d.,])\d{1,3}(?:\.\d{3})+(?:,\d+)?(?![\d\p{L}])|(?<![\p{L}\d.,])\d+(?:,\d+)?(?![\d\p{L}])/gu;
const SCALES: [RegExp, number][] = [[/^\s*(miliard|mld)/i, 1e9], [/^\s*(milion|mln)/i, 1e6]];

// Ogni cifra con le letture che ammette: «5.906,8 milioni» vale 5906,8 e 5.906.800.000. Il cambio di
// scala vale solo se esatto: «5,9 miliardi» non è 5.906.800.000.
export function extractFigures(text: string, names: RegExp | null = NAMED_FIGURES, question?: string): string[][] {
  const prepared = withoutQuestionDates(prepare(text, names), question, names);
  return [...prepared.matchAll(NUMBER)].map((m) => {
    const value = Number(m[0].replace(/\./g, "").replace(",", "."));
    const after = prepared.slice((m.index ?? 0) + m[0].length, (m.index ?? 0) + m[0].length + 12);
    const scale = SCALES.find(([re]) => re.test(after))?.[1];
    return scale ? [String(value), String(Math.round(value * scale))] : [String(value)];
  });
}

export const extractNumbers = (text: string, names: RegExp | null = NAMED_FIGURES): string[] => extractFigures(text, names).map((f) => f[0]);

const QUOTE = /«([^»]+)»|“([^”]+)”|„([^“”]+)[“”]|‹([^›]+)›|"([^"]+)"/g;
// Sotto questa lunghezza le virgolette segnano un termine («tetto»), non una citazione.
const MIN_QUOTE = 12;

export function extractQuotes(text: string): string[] {
  return [...text.matchAll(QUOTE)].map((m) => m[1] ?? m[2] ?? m[3] ?? m[4] ?? m[5] ?? "").filter((q) => q.trim().length >= MIN_QUOTE);
}

// Il testo di un documento su cui una risposta può appoggiarsi. Restano fuori le note di metodo, che
// conservano valori superati («il valore originario … era errato»), e il testo di prima di una
// correzione: lì le cifre e le parole ci sono, ma non sono più quelle giuste.
export const citableText = (d: IndexDocument) =>
  d.structData.testo
    .split("\n")
    .filter((l) => !/^(Metodo|Prima):/.test(l))
    .join("\n");

// Il testo che va all'engine (D7, decisa da Giovanni il 2026-10-25): senza le note di metodo, così il
// modello vede solo cifre che può citare. Il testo di prima di una correzione resta: le domande sulle
// correzioni chiedono che cosa è cambiato, e il validatore non lo lascia citare come dato.
export const indexedText = (d: IndexDocument) =>
  d.structData.testo
    .split("\n")
    .filter((l) => !/^Metodo:/.test(l))
    .join("\n");

// Con i tagli […] i pezzi devono stare nella fonte nello stesso ordine, essere al massimo 3 e lunghi
// almeno 20 caratteri: pezzi corti o riordinati ricuciono una frase che nessuno ha detto (M8, D-033).
const MAX_FRAGMENTS = 3;
const MIN_FRAGMENT = 20;
const inside = (quote: string, source: string) => {
  const fragments = verbatimFragments(quote);
  const src = normalizeText(source);
  // I tagli che stanno già nella fonte («Forza Italia […] punta») non sono tagli della risposta.
  const whole = normalizeText(quote).replace(/^[,;:.\s"]+|[,;:\s"]+$/g, "");
  if (whole.length >= 3 && src.includes(whole)) return true;
  if (!fragments.length || fragments.length > MAX_FRAGMENTS) return false;
  if (fragments.length > 1 && fragments.some((f) => f.length < MIN_FRAGMENT)) return false;
  let from = 0;
  for (const f of fragments) {
    const at = src.indexOf(f, from);
    if (at < 0) return false;
    from = at + f.length;
  }
  return true;
};

// Una citazione è giusta se sta nelle parole esatte di una promessa citata, oppure nel testo di un
// altro documento citato. La parafrasi di una promessa non vale come citazione.
export function quoteIsLiteral(quote: string, docs: IndexDocument[]): boolean {
  return docs.some((d) =>
    d.structData.testo_letterale !== null ? inside(quote, d.structData.testo_letterale) : inside(quote, citableText(d)),
  );
}

// Le cifre della risposta che non stanno nel testo di nessun documento citato (metrica 4.1, criterio 5.1).
export function figuresWithoutSource(text: string, docs: IndexDocument[], names: RegExp | null = NAMED_FIGURES, question?: string): string[] {
  const cited = new Set(docs.flatMap((d) => extractFigures(citableText(d), names).flat()));
  return [...new Set(extractFigures(text, names, question).filter((f) => !f.some((v) => cited.has(v))).map((f) => f[0]))];
}

export const declaresNotVerified = (text: string) => /non (è )?verificat|\(nv\)|\bnv\b|da verificare/.test(normalizeText(text));

// Una risposta senza citazioni che dice di non avere il dato è un'astensione scritta male: la route
// mostra l'astensione fissa (decisione del 2026-10-25).
const NO_DATA =
  /\b(non (sono presenti|ci sono|contengono|contiene|riportano|riporta|ho|dispongo di|trovo|risultano|e presente|è presente|c'e|c'è) (informazioni|dati|riferimenti|notizie)|nessuna informazione|nessun dato|i documenti (forniti )?non (contengono|riportano|indicano))\b/;
export const declaresNoData = (text: string) => NO_DATA.test(normalizeText(text));

// promesse: false durante il silenzio elettorale (roadmap 5.4): nessuna dichiarazione si può citare.
// guardie: false spegne i controlli D-033, solo per misurare quante risposte fermano (falsi rifiuti).
// nessunDato (D9, Giovanni, 2026-10-26; acceso di default, false solo per misurare): una risposta
// che dice di non avere il dato è un'astensione anche se cita qualcosa.
export type ValidationOptions = { promesse?: boolean; guardie?: boolean; nessunDato?: boolean };

export function validateAnswer(answer: AgentAnswer, index: Index, question?: string, options: ValidationOptions = {}): Validation {
  if (answer.astensione) return { esito: "astensione" };
  if (answer.testo === TRANSPARENCY_ANSWER && !answer.citazioni.length) return { esito: "risposta" };
  if ((!answer.citazioni.length || (options.nessunDato ?? true)) && declaresNoData(answer.testo)) return { esito: "astensione" };
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

  for (const n of figuresWithoutSource(answer.testo, docs, NAMED_FIGURES, question)) motivi.push({ motivo: "cifra_senza_fonte", dettaglio: n });

  let outside = answer.testo;
  for (const q of extractQuotes(answer.testo)) {
    if (!quoteIsLiteral(q, docs)) motivi.push({ motivo: "citazione_non_letterale", dettaglio: q });
    else outside = outside.split(q).join(" ");
  }

  // Controlli contro manipolazioni e abusi (D-033), sul testo fuori dalle citazioni verificate: le
  // parole esatte di una dichiarazione possono contenere giudizi, la risposta no.
  if (options.guardie !== false) {
    const format = forbiddenFormat(answer.testo);
    if (format) motivi.push({ motivo: "formato_vietato", dettaglio: format });
    const judged = judgment(outside);
    if (judged) motivi.push({ motivo: "giudizio", dettaglio: judged });
    const exposed = exposesInstructions(outside);
    if (exposed) motivi.push({ motivo: "istruzioni_esposte", dettaglio: exposed });
    const quotes = extractQuotes(answer.testo).filter((q) => quoteIsLiteral(q, docs));
  const wrong = wrongAttribution(answer.testo, quotes, (q) => docs.filter((d) => quoteIsLiteral(q, [d])), index);
    if (wrong) motivi.push({ motivo: "attribuzione_errata", dettaglio: wrong });
    if (answer.testo.length > MAX_ANSWER) motivi.push({ motivo: "troppo_lunga", dettaglio: `${answer.testo.length} caratteri` });
  }
  if (options.promesse === false && docs.some((d) => d.structData.dataset === "promesse")) {
    motivi.push({ motivo: "silenzio_elettorale", dettaglio: docs.filter((d) => d.structData.dataset === "promesse").map((d) => d.id).join(", ") });
  }

  if (docs.some((d) => d.structData.livello_verifica === "NV") && !declaresNotVerified(answer.testo)) {
    motivi.push({ motivo: "nv_non_dichiarato", dettaglio: docs.filter((d) => d.structData.livello_verifica === "NV").map((d) => d.id).join(", ") });
  }

  return motivi.length ? { esito: "astensione_forzata", motivi } : { esito: "risposta" };
}
