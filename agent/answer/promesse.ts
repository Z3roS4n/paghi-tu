// Risposte sulle dichiarazioni composte dalla route (D5, decisa da Giovanni il 2026-10-25; D-033): il
// modello sceglie quali dichiarazioni citare, le parole le prende la route dai campi del record.
// Così una citazione non si ricuce e non finisce sotto il partito sbagliato (M8).
import type { IndexDocument } from "../ingest/export.ts";
import { citableText, type AgentAnswer, type Index } from "./answer.ts";

// Domande che chiedono che cosa qualcuno ha dichiarato o promesso.
const DECLARATION_QUESTION = /\b(dichiarat\w*|dichiarazion\w*|promess\w*|promett\w*|promesso|scritto|detto|parole esatte)\b/i;

// Le righe del record che la risposta mostra: chi, quando, le parole esatte, il costo dichiarato se
// c'è, il livello di verifica. Restano fuori la sintesi (parafrasi), la classificazione e la stima di
// terzi, che porta un URL.
const SHOWN = /^(Dato non verificato|Dichiarante:|Parole esatte:|Costo dichiarato dal proponente:|Livello di verifica)/;

export function composeDeclaration(d: IndexDocument): string {
  return citableText(d)
    .split("\n")
    .filter((l) => SHOWN.test(l) && l !== "Costo dichiarato dal proponente: non indicato.")
    .join("\n");
}

// Se la risposta cita dichiarazioni e la domanda chiede una dichiarazione (o cita solo dichiarazioni),
// il testo del modello si sostituisce con le righe dei record citati, nell'ordine delle citazioni.
// Le altre risposte restano come sono: le controlla il validatore.
export function composePromises(answer: AgentAnswer, index: Index, question: string): AgentAnswer {
  if (answer.astensione) return answer;
  const cited = answer.citazioni.map((c) => ({ c, d: index.get(c.id) }));
  const promises = cited.filter((x): x is { c: (typeof answer.citazioni)[number]; d: IndexDocument } => x.d?.structData.dataset === "promesse");
  if (!promises.length) return answer;
  if (promises.length < cited.length && !DECLARATION_QUESTION.test(question)) return answer;
  return {
    testo: promises.map((x) => composeDeclaration(x.d)).join("\n\n"),
    citazioni: promises.map((x) => x.c),
    astensione: false,
  };
}
