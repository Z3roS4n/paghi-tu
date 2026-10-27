// Cancello d'ingresso (piano di hardening del 2026-10-25, D-033): prima di chiamare l'engine. Pulisce
// la domanda e ferma, con l'astensione fissa (D3), le domande che non serve mandare al modello. È un
// risparmio di costo e un primo filtro, non la difesa: omoglifi, lingue e parafrasi lo aggirano, e
// l'ultimo cancello resta il validatore in uscita. Nessun modello, solo confronti sul testo.
import { normalizeText } from "../evals/testo.ts";
import { PARTIES } from "./guardie.ts";

// D1, deciso da Giovanni il 2026-10-25.
export const MAX_QUESTION = 300;

export const GATE_REASONS = ["vuota", "troppo_lunga", "manipolazione", "voto_o_giudizio", "previsione", "testo_da_pubblicare", "link_o_formato", "piu_partiti"] as const;
export type GateReason = (typeof GATE_REASONS)[number];
export type GateResult = { passa: true; domanda: string } | { passa: false; motivo: GateReason; dettaglio: string };

// piuPartiti: true finché D4 è aperta (proposta: astensione finché non c'è il parere sulla par condicio, 8.1).
export type GateOptions = { piuPartiti?: boolean };

// La domanda che va all'engine: NFKC, senza caratteri di controllo, invisibili (zero-width) e di
// direzione (bidi), spazi compattati.
export function cleanQuestion(q: string): string {
  return q
    .normalize("NFKC")
    .replace(/[\t\n\r\f\v]+/g, " ")
    .replace(/[\p{Cc}\p{Cf}]/gu, "")
    .replace(/\s+/g, " ")
    .trim();
}

// Lettere di altri alfabeti uguali a quelle latine, e cifre usate come lettere: solo per il confronto.
const LOOKALIKE: Record<string, string> = {
  а: "a", е: "e", о: "o", р: "p", с: "c", у: "y", х: "x", і: "i", ј: "j", ѕ: "s", ԁ: "d", ɡ: "g", һ: "h", ӏ: "l",
  α: "a", ε: "e", ι: "i", κ: "k", ν: "v", ο: "o", ρ: "p", τ: "t", υ: "u", χ: "x",
  "0": "o", "1": "i", "3": "e", "4": "a", "5": "s", "7": "t", "@": "a", $: "s",
};

// La forma su cui girano i pattern: minuscole, senza accenti, omoglifi e cifre ricondotti a lettere,
// parole spaziate ricomposte («i g n o r a» → «ignora»), apostrofi come spazi.
export function fold(q: string): string {
  // Le lettere separate da un solo carattere si ricompongono prima di compattare gli spazi: fra le
  // parole spaziate ne restano due o più.
  const joined = q.normalize("NFKC").replace(/(?<![\p{L}])(?:\p{L}[ ._-]){1,}\p{L}(?![\p{L}])/gu, (m) => m.replace(/[ ._-]/g, ""));
  return normalizeText(joined)
    .normalize("NFD")
    .replace(/\p{M}/gu, "")
    .replace(/./gu, (c) => LOOKALIKE[c] ?? c)
    .replace(/['"]/g, " ")
    .replace(/\s+/g, " ");
}

// Frammenti in base64 che decodificati sono testo: una domanda vera non ne ha bisogno.
function encodedText(q: string): string | null {
  for (const m of q.matchAll(/[A-Za-z0-9+/]{16,}={0,2}/g)) {
    const raw = m[0];
    if (!/[A-Z]/.test(raw) || !/[a-z]/.test(raw)) continue;
    const decoded = Buffer.from(raw, "base64").toString("utf8");
    if (/^[\p{L}\p{N}\p{P}\p{Zs}]{8,}$/u.test(decoded) && /\p{L}{3,}/u.test(decoded)) return raw;
  }
  return null;
}

const MANIPULATION = [
  /\b(ignora\w*|ignori|dimentic\w*|trascura\w*|scorda\w*|salta|bypass\w*|aggira\w*|lascia (stare|perdere)|lassa sta)\b.{0,40}\b(istruzion\w*|regol\w*|indicazion\w*|vincol\w*|limit\w*|filtr\w*)/,
  /\b(ignore|forget|disregard|bypass|override)\b.{0,40}\b(instructions?|rules?|guidelines?|prompt|filters?)\b/,
  /\b(system|developer)\b.{0,15}\b(prompt|mode|message)\b|\bmodalita (sviluppatore|dio|libera|senza filtri)\b|\bjailbreak\w*|\bdan\b/,
  /\b(ripeti\w*|mostra\w*|stampa\w*|rivela\w*|elenca\w*|dimmi|scrivi\w*|riporta\w*|copia\w*)\b.{0,40}\b((le|tue|sue|vostre) istruzioni|istruzioni (che|ricevute|iniziali|precedenti)|prompt|preambolo)\b/,
  /\b(gioco di ruolo|gioc\w* (il|a) ruolo|role ?play|fingi\w*|fai finta|facciamo finta|immagina di essere|interpreta (il ruolo|un|una)|sei (ora|adesso) |da ora (in poi )?(sei|rispondi|devi)|d ora in poi|from now on|you are now|pretend|act as)\b/,
  /(^| )(system|assistant|sistema) ?:/,
  /\b(esegui|execute|decodifica|decode)\b/,
  /\bsenza (regole|filtri|restrizioni|limiti|censur\w*)\b/,
  /\b(attribuend\w*|attribuiscil\w*|come se l avesse detto)\b/,
];

// Giudizi, voto e classifiche: la roadmap li esclude, e il modello non ha niente da cercare.
const JUDGMENT = [
  /\b(per chi|chi) (devo |dovrei |posso |conviene |)votare\b|\bvotate\b|\bconsigl\w* .{0,25}\bvot\w*|\bmerit\w* .{0,20}\bvoto\b/,
  /\b(partit\w*|govern\w*|premier|president\w*|leader|coalizion\w*|ministr\w*)\b.{0,40}\b(miglior\w*|peggior\w*|meglio|peggio|piu (credibile|corrott\w*|bravo|onest\w*|affidabile)|most corrupt|best|worst)\b/,
  /\b(miglior\w*|peggior\w*)\b.{0,30}\b(partit\w*|govern\w*|premier|president\w*|leader)\b/,
  /\b(credibil\w*|brav[oa]|buon[oa]? (premier|governo|presidente|leader)|cattiv\w* (premier|governo|presidente)|incompetent\w*|corrott\w*|onest\w*)\b/,
  /\bha(nno)? (fatto|gestito) (bene|male)\b|\b(e|sono) stat[oaie] (un|una|uno)? ?(fallimento|successo|disastro|spreco)\b|\b(uno )?spreco di (soldi|denaro|risorse)\b|\bsprecat\w*|\brovinat\w*|\binsult\w*/,
  /\b(cosa|che) ne pensi\b|\bcosa pensi\b|\b(tua|vostra) opinione\b|\b(un|il tuo) giudizio\b|\bgiudica\b|\bcommenta\b|\bdai un giudizio\b/,
  /\bclassifica\b|\bchi ha ragione\b|\bchi promette di piu\b|\b(piu|quante) promesse\b|\bparla di piu\b|\bpromess\w* piu costos\w*|\b(ir)?realizzabil\w*/,
];
// «Previsione» da sola no: il bilancio di previsione e le previsioni del DEF sono dati.
const PREDICTION = /\b(vincer\w+|vincera|vince(ranno)?|chi vince|sondagg\w*|prevedi\w*|pronostic\w*)\b/;
const PUBLISHABLE = [
  /\b(scrivi\w*|crea\w*|inventa\w*|componi\w*|prepara\w*|genera\w*|fammi|redigi\w*)\b.{0,30}\b(post|tweet|slogan|volantin\w*|comunicat\w*|discors\w*|poesi\w*|canzon\w*|meme|articol\w*|caption|reel|thread|lettera|manifest\w*)\b/,
  /\bin modo (che|da) (sembri|sembrino|far sembrare|risultare)\b|\bfa(r|i) sembrare\b/,
];
const FORMAT = [/\b(dammi|mandami|manda|inviami|metti|includi|aggiungi|inserisci|scrivi\w*|rispondi)\b.{0,40}\b(link|url|immagin\w*|html|markdown)\b/, /!\[|https?:\/\/|\bwww\./];

// Domande su ciò che dicono più partiti insieme (M10, D4): i partiti in generale, una coalizione o
// almeno due partiti nominati, con un verbo di promessa o dichiarazione.
const ABOUT_PROMISES = /\b(promett\w*|promess\w*|propost\w*|propon\w*|parlat\w*|parla(no)?|dichiar\w*|dice|dicono|programm\w*|vogliono|pensano|confronta\w*)\b/;
const MANY_PARTIES = /\b(i partiti|tutti i partiti|quali partiti|ogni partito|le coalizioni|centrodestra|centrosinistra|destra e sinistra)\b/;
const partyPatterns = Object.entries(PARTIES).map(([k, aliases]) => [k, new RegExp(`(?<![\\p{L}\\p{N}])(${aliases.map((a) => fold(a).trim().replace(/[.*+?^${}()|[\]\\]/g, "\\$&")).join("|")})(?![\\p{L}\\p{N}])`, "u")] as const);
export const partiesNamed = (folded: string): string[] => partyPatterns.filter(([, re]) => re.test(folded)).map(([k]) => k);

// Un giudizio negato poco prima («non mi serve un giudizio», «senza commenti») non conta.
const negated = (text: string, at: number) => /\b(non|senza|nessun\w*)\b[^.?!]{0,25}$/.test(text.slice(0, at));
function firstHit(patterns: RegExp[], text: string, allowNegation = false): string | null {
  for (const re of patterns) {
    const m = re.exec(text);
    if (m && !(allowNegation && negated(text, m.index))) return m[0].trim();
  }
  return null;
}

export function gateQuestion(question: string, options: GateOptions = {}): GateResult {
  const domanda = cleanQuestion(question);
  if (!domanda) return { passa: false, motivo: "vuota", dettaglio: "domanda vuota" };
  if (domanda.length > MAX_QUESTION) return { passa: false, motivo: "troppo_lunga", dettaglio: `${domanda.length} caratteri` };
  // Il confronto parte dal testo prima di compattare gli spazi, che separano le parole spaziate.
  const f = fold(question.normalize("NFKC").replace(/[\t\n\r\f\v]+/g, "  ").replace(/[\p{Cc}\p{Cf}]/gu, ""));
  const encoded = encodedText(domanda);
  if (encoded) return { passa: false, motivo: "manipolazione", dettaglio: `testo codificato ${encoded.slice(0, 20)}` };
  const hit = (motivo: GateReason, dettaglio: string | null): GateResult | null => (dettaglio ? { passa: false, motivo, dettaglio } : null);
  return (
    hit("manipolazione", firstHit(MANIPULATION, f)) ??
    hit("testo_da_pubblicare", firstHit(PUBLISHABLE, f)) ??
    hit("link_o_formato", firstHit(FORMAT, f)) ??
    hit("voto_o_giudizio", firstHit(JUDGMENT, f, true)) ??
    hit("previsione", firstHit([PREDICTION], f)) ??
    (options.piuPartiti !== false && ABOUT_PROMISES.test(f) && (MANY_PARTIES.test(f) || partiesNamed(f).length >= 2)
      ? { passa: false, motivo: "piu_partiti", dettaglio: MANY_PARTIES.exec(f)?.[0] ?? partiesNamed(f).join(", ") }
      : null) ?? { passa: true, domanda }
  );
}
