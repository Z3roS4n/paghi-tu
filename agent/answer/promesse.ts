// Risposte sulle dichiarazioni composte dalla route (D5, decisa da Giovanni il 2026-10-25; D-033): il
// modello sceglie quali dichiarazioni citare, le parole le prende la route dai campi del record.
// Così una citazione non si ricuce e non finisce sotto il partito sbagliato (M8).
import type { IndexDocument } from "../ingest/export.ts";
import { citableText, type AgentAnswer, type Index } from "./answer.ts";
import { PARTIES } from "./guardie.ts";
import { fold, partiesNamed } from "./input.ts";

// Domande che chiedono che cosa qualcuno ha dichiarato o promesso.
const DECLARATION_QUESTION = /\b(dichiarat\w*|dichiarazion\w*|promess\w*|promett\w*|promesso|scritto|detto|intervist\w*|tipo di fonte|parole esatte)\b/i;

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

// Le correzioni pubblicate su una dichiarazione (pagina «/promesse#<id>») fanno parte della sua
// verità: la risposta composta le mostra con quello che è cambiato e perché, e le cita.
const CORRECTION_SHOWN = /^(Correzione |Dopo:|Motivo:)/;
function corrections(d: IndexDocument, index: Index): IndexDocument[] {
  const page = `Pagina: /promesse#${d.id.replace(/^promesse--/, "")}.`;
  return [...index.values()].filter((c) => c.structData.dataset === "correzioni" && citableText(c).split("\n").includes(`Tipo: correzione. ${page}`));
}
const composeCorrection = (c: IndexDocument) =>
  citableText(c)
    .split("\n")
    // Un indirizzo nel testo è un formato vietato: la fonte della correzione è già nella citazione.
    .filter((l) => CORRECTION_SHOWN.test(l) && !/https?:\/\//.test(l))
    .join("\n");

// Chi la domanda nomina: le persone (nome e cognome con le maiuscole, tolti i nomi dei partiti) e i
// partiti. Una dichiarazione di qualcun altro non risponde alla domanda (M8): «Che cosa ha dichiarato
// Elly Schlein l'8 luglio?» non si risponde con le parole di Bignami di quel giorno.
const PERSON = /\p{Lu}\p{Ll}+(?:\s+\p{Lu}\p{Ll}+)+/gu;
const PARTY_WORDS = Object.values(PARTIES).flat().map((a) => fold(a).trim());
function askedAbout(question: string): { people: string[]; parties: string[] } {
  const people = [...question.matchAll(PERSON)].map((m) => fold(m[0]).trim()).filter((n) => !PARTY_WORDS.some((a) => a.includes(n) || n.includes(a)));
  return { people, parties: partiesNamed(fold(question)) };
}
function declaredBy(d: IndexDocument, asked: { people: string[]; parties: string[] }): boolean {
  const lines = citableText(d).split("\n");
  const who = fold(lines.find((l) => l.startsWith("Dichiarante:")) ?? "");
  const party = partiesNamed(fold(/Partito: ([^.]+)\./.exec(lines.find((l) => l.startsWith("Dichiarante:")) ?? "")?.[1] ?? ""));
  return (!asked.people.length || asked.people.some((n) => who.includes(n))) && (!asked.parties.length || party.some((p) => asked.parties.includes(p)));
}

// La dichiarazione di una persona o di un partito in una data scritta per intero («il 21 ottobre 2026»), se nell'indice
// ce n'è esattamente una; altrimenti nessuna. Le candidate (stessa persona o partito, stessa data)
// servono anche alla ricerca, che fra quelle sceglie per argomento.
const MONTHS = "gennaio|febbraio|marzo|aprile|maggio|giugno|luglio|agosto|settembre|ottobre|novembre|dicembre";
const DATE = new RegExp(`\\b(\\d{1,2})°?\\s+(${MONTHS})\\s+(\\d{4})\\b`, "giu");
export function declarationCandidates(question: string, index: Index): IndexDocument[] {
  const asked = askedAbout(question);
  const dates = [...new Set([...question.matchAll(DATE)].map((m) => `Data: ${Number(m[1])} ${m[2].toLowerCase()} ${m[3]}.`))];
  if ((!asked.people.length && !asked.parties.length) || dates.length !== 1) return [];
  return [...index.values()].filter((d) => d.structData.dataset === "promesse" && citableText(d).includes(dates[0]) && declaredBy(d, asked));
}
export function findDeclaration(question: string, index: Index): IndexDocument | null {
  const found = declarationCandidates(question, index);
  return found.length === 1 ? found[0] : null;
}

// Se la risposta cita dichiarazioni e la domanda chiede una dichiarazione (o cita solo dichiarazioni),
// il testo del modello si sostituisce con le righe dei record citati, nell'ordine delle citazioni.
// Le altre risposte restano come sono: le controlla il validatore.
// La risposta tiene solo le dichiarazioni della persona o del partito che la domanda nomina.
export function composePromises(answer: AgentAnswer, index: Index, question: string): AgentAnswer {
  // La dichiarazione che la domanda individua (persona e data) entra fra le citazioni anche se la
  // ricerca non l'ha trovata (decisione di Giovanni del 2026-10-25).
  const found = DECLARATION_QUESTION.test(question) ? findDeclaration(question, index) : null;
  if (found && !answer.citazioni.some((c) => c.id === found.id)) {
    const c = { id: found.id, url: found.structData.fonte_url[0] ?? found.structData.url_pagina };
    answer = answer.astensione ? { testo: "", citazioni: [c], astensione: false } : { ...answer, citazioni: [...answer.citazioni, c] };
  }
  if (answer.astensione) return answer;
  const cited = answer.citazioni.map((c) => ({ c, d: index.get(c.id) }));
  const promises = cited.filter((x): x is { c: (typeof answer.citazioni)[number]; d: IndexDocument } => x.d?.structData.dataset === "promesse");
  // Una risposta che cita solo correzioni mostra le righe dei record: una regola di metodo cambiata
  // non si parafrasa (decisione di Giovanni del 2026-10-25).
  if (!promises.length) {
    const fixes = cited.map((x) => x.d).filter((d): d is IndexDocument => d?.structData.dataset === "correzioni");
    return fixes.length && fixes.length === cited.length ? { ...answer, testo: fixes.map(composeCorrection).join("\n\n") } : answer;
  }
  if (promises.length < cited.length && !DECLARATION_QUESTION.test(question)) return answer;
  // Solo le dichiarazioni di chi la domanda nomina; se non ne resta nessuna, astensione.
  const asked = askedAbout(question);
  const own = promises.filter((x) => declaredBy(x.d, asked));
  if (!own.length) return { testo: "", citazioni: [], astensione: true };
  const fixes = [...new Map(own.flatMap((x) => corrections(x.d, index)).map((c) => [c.id, c])).values()];
  return {
    testo: [...own.map((x) => composeDeclaration(x.d)), ...fixes.map(composeCorrection)].join("\n\n"),
    citazioni: [...own.map((x) => x.c), ...fixes.map((c) => ({ id: c.id, url: answer.citazioni.find((x) => x.id === c.id)?.url ?? c.structData.fonte_url[0] ?? c.structData.url_pagina }))],
    astensione: false,
  };
}
