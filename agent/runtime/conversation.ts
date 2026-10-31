import { AgentAnswer, citableText, extractQuotes, quoteIsLiteral, validateAnswer } from "../answer/answer.ts";
import { gateQuestion } from "../answer/input.ts";
import { scopeBlock } from "../answer/retrieval.ts";
import { judgment, toPlainText } from "../answer/guardie.ts";
import { appendWarnings } from "../answer/avvertenze.ts";
import type { IndexDocument } from "../ingest/export.ts";
import type { Dispatch, Routed } from "./core.ts";
import type { ConversationContext, ConversationResult } from "./index.ts";
import { createCore } from "./core.ts";

const genericFollowup = /^(?:(?:e |ma )?(?:cosa|che cosa|che) (?:significa|vuol dire)(?: (?:questo|questa frase|questa dichiarazione|questa risposta|in pratica))?|(?:puoi )?(?:spiega(?:melo|mi|lo)?|spiegare|spiegarmelo)(?: (?:meglio|in parole semplici|questa frase|questa dichiarazione))?|(?:puoi )?riassum(?:i|ere)(?: (?:in parole semplici|la risposta))?|in pratica|pi[uù] semplice|approfondisci)[?.! ]*$/iu;
const explanation = /^(?:(?:e|ma)\s+)?(?:(?:me\s+(?:lo|la|li|le)\s+)?(?:traduci|spieghi|riassumi)|(?:puoi|potresti)\s+(?:(?:me\s+(?:lo|la|li|le)\s+)?(?:tradurre|spiegare|riassumere))|(?:spiega|spiegami)\b|(?:cosa|che cosa|che)\s+(?:significa|vuol dire))\b/iu;
const discourseReference = /\b(?:quest[oaie]|quell[oaie])\s*(?:[?.!]|$)|\b(?:quest[oaie]|quell[oaie])\s+(?:risposta|frase|dichiarazione|testo|dato)\b|\b(?:risposta|frase|dichiarazione|testo|dato)\s+(?:precedent[ei]|di\s+prima|qui\s+sopra)\b|\b(?:detto|scritto|mostrato|riportato)\s+(?:prima|sopra)\b/iu;
const unresolvedDeictic = /\b(?:quest[oaie]|quell[oaie])\b/iu;
const objectClitic = /\bme\s+(?:lo|la|li|le)\s+(?:traduci|spieghi|riassumi|tradurre|spiegare|riassumere)\b/iu;
const unresolvedRephrase = /^(?:(?:e|ma)\s+)?(?:puoi|potresti)\s+\p{L}*?r(?:(?:me|te|ce|ve|se))?(?:lo|la|li|le)\b/iu;
const imperativeRephrase = /^(?:(?:e|ma)\s+)?\p{L}{2,}(?:lo|la|li|le)\b.*\s(?:pi[uù]|in|con|meglio)(?=\s|[?.!]|$)/iu;
const bareReference = /^(?:(?:e|ma)\s+)?(?:quell[oaie]|quest[oaie]|l[oaie])(?:\s+(?:di|del|della|sul|sulla)\s+.+)?[?.! ]*$/iu;
const followupKind = (question: string): 'spiegazione' | 'ambiguo' | 'autonoma' => {
  const q = question.trim();
  if (genericFollowup.test(q)) return 'spiegazione';
  if (bareReference.test(q)) return 'ambiguo';
  if (explanation.test(q) && (discourseReference.test(q) || objectClitic.test(q) || /^(?:cosa|che cosa|che)\s+(?:significa|vuol dire)[?.! ]*$/iu.test(q))) return 'spiegazione';
  if (unresolvedRephrase.test(q) || imperativeRephrase.test(q) || (explanation.test(q) && unresolvedDeictic.test(q))) return 'ambiguo';
  return 'autonoma';
};
export const isFollowup = (question: string) => followupKind(question) === 'spiegazione';
const broaderFiscalStasis = (text: string) =>
  /\b(?:regol[aei]|norm[aei]|sistema|quadro|fisco|tassazione)\b/iu.test(text) &&
  /\b(?:non\s+(?:si\s+)?(?:camb\p{L}*|modific\p{L}*|var\p{L}*)|rest\p{L}*\s+(?:ugual\p{L}*|invariat\p{L}*)|invariat\p{L}*|immut\p{L}*|status quo)\b/iu.test(text);
export function unsupportedDeclarationScope(text: string, docs: IndexDocument[]): boolean {
  const declarations = docs.filter((d) => d.structData.dataset === 'promesse');
  if (!declarations.length || !broaderFiscalStasis(text)) return false;
  // Questa è una guardia conservativa sulla generalizzazione fiscale osservata,
  // non una prova di equivalenza semantica. Il fallimento mostra il dato verificato.
  return !declarations.some((d) => broaderFiscalStasis(d.structData.testo_letterale ?? ''));
}
const empty = (text = "Non ho dati verificati su Paghi Tu per rispondere a questa domanda."): AgentAnswer => ({ testo: text, astensione: true, citazioni: [] });

function verifiedContext(previous: ConversationContext | undefined, index: ReadonlyMap<string, IndexDocument>, core: ReturnType<typeof createCore>): ConversationContext | undefined {
  if (!previous || typeof previous.question !== "string" || !previous.question.trim()
    || !Array.isArray(previous.ids) || !previous.ids.length || !Array.isArray(previous.fingerprints)
    || previous.ids.length !== previous.fingerprints.length || new Set(previous.ids).size !== previous.ids.length) return undefined;
  const fallback = AgentAnswer.safeParse(previous.fallback);
  if (!fallback.success || fallback.data.astensione || fallback.data.citazioni.length !== previous.ids.length) return undefined;
  const cited = fallback.data.citazioni.map((citation) => citation.id);
  if (new Set(cited).size !== cited.length || cited.some((id) => !previous.ids.includes(id))) return undefined;
  const docs = previous.ids.map((id) => index.get(id));
  if (docs.some((doc, i) => !doc || core.fingerprint(doc) !== previous.fingerprints[i])) return undefined;
  const bounded = new Map(docs.map((doc) => [doc!.id, doc!]));
  return validateAnswer(fallback.data, bounded, previous.question).esito === "risposta" ? previous : undefined;
}

export async function converse(question: string, index: ReadonlyMap<string, IndexDocument>, previous: ConversationContext | undefined, core: ReturnType<typeof createCore>, dispatch: Dispatch): Promise<ConversationResult> {
  const gate = gateQuestion(question);
  if (!gate.passa || scopeBlock(gate.domanda)) return { shown: empty(), mode: "astensione", backend: "locale" };
  const q = gate.domanda;
  const kind = followupKind(q);
  const followup = kind === "spiegazione";
  const validPrevious = verifiedContext(previous, index, core);
  if (kind === "ambiguo") return { shown: empty("A quale dichiarazione o dato ti riferisci? Indica il soggetto o la domanda completa."), mode: "chiarimento", context: validPrevious, backend: "locale" };
  if (followup && !previous) return { shown: empty("A quale risposta o dichiarazione ti riferisci? Fammi prima una domanda sui dati, poi posso spiegare la risposta."), mode: "chiarimento", backend: "locale" };
  if (followup && !validPrevious) return { shown: empty("Il contesto non è più disponibile. Ripeti la domanda completa."), mode: "chiarimento", backend: "locale" };
  let context = validPrevious;
  let factual: AgentAnswer;
  let backend: ConversationResult["backend"] = "locale";
  if (followup && validPrevious) {
    factual = validPrevious.fallback;
  } else {
    const result: Routed = await core.route(q, dispatch);
    factual = result.shown;
    backend = result.backend;
    if (factual.astensione || !factual.citazioni.length) return { shown: factual, mode: factual.astensione ? "astensione" : "diretta", backend };
    context = { question: q, ids: factual.citazioni.map((c) => c.id), fingerprints: factual.citazioni.map((c) => core.fingerprint(index.get(c.id)!)), fallback: factual };
  }
  const docs = context!.ids.map((id) => index.get(id)!);
  if (docs.length > 8 || docs.reduce((n, d) => n + citableText(d).length, 0) > 28000) return { shown: factual, mode: "dati", context, backend };
  try {
    const raw = await core.formulateAnswer(followup ? `Domanda precedente: ${context!.question}\nRichiesta attuale: ${q}` : q, docs, dispatch);
    backend = "answer";
    let shown = core.adapt(raw);
    if (shown.citazioni.some((c) => !context!.ids.includes(c.id))) throw new Error("citation outside context");
    shown = appendWarnings({ ...shown, testo: toPlainText(shown.testo) }, index);
    let outside = shown.testo;
    for (const quote of extractQuotes(shown.testo)) if (quoteIsLiteral(quote, docs)) outside = outside.replace(quote, " ");
    if (judgment(outside.replace(/\bvergognos[aei]\b/gi, "vergognoso"))) throw new Error("judgment");
    if (unsupportedDeclarationScope(outside, docs)) throw new Error("declaration scope");
    if (followup && docs.some((d) => d.structData.dataset === "promesse") && !shown.astensione) shown.testo += "\n\nQuesta spiegazione riguarda il significato della dichiarazione. La verifica della fonte non dimostra che l’impegno sia stato attuato.";
    const validation = validateAnswer(shown, index, followup ? context!.question : q);
    if (!shown.astensione && validation.esito === "risposta") return { shown, mode: followup ? "spiegazione" : "sintesi", context, backend };
  } catch (error) {
    if (error instanceof Error && (error.message === "vertex attempt budget exhausted" || error.name === "AbortError")) throw error;
  }
  return { shown: factual, mode: "dati", context, notice: "La formulazione non è disponibile: mostro i dati della fonte.", backend };
}
