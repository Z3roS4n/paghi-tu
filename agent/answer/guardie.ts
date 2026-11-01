// Controlli in uscita contro manipolazioni e abusi (piano di hardening del 2026-10-25, D-033): il
// validatore li applica dopo quelli su cifre e citazioni. Tutti lessicali e deterministici: il
// modello può essere stato manipolato, il codice no. Nel dubbio la risposta diventa un'astensione.
import type { IndexDocument } from "../ingest/export.ts";
import { normalizeText } from "../evals/testo.ts";
import lessico from "./lessico.json" with { type: "json" };

// Le fonti le mostra il widget: nel testo niente URL, link, immagini o HTML (esfiltrazione, siti di terzi).
const FORBIDDEN_FORMAT = /https?:\/\/|\bwww\.|\]\(|!\[|<\/?[a-z][a-z0-9]*(\s[^>]*)?\/?>|\b[a-z0-9-]+\.(it|com|org|eu|net|ly|io)\/\S*/i;
export const forbiddenFormat = (text: string): string | null => text.match(FORBIDDEN_FORMAT)?.[0] ?? null;

// Il grassetto e gli elenchi del modello si tolgono prima di mostrare e di validare: non sono un
// rischio, e farne un'astensione costerebbe risposte giuste.
export function toPlainText(text: string): string {
  return text
    .replace(/\*\*([^*]+)\*\*|__([^_]+)__/g, (_, a: string | undefined, b: string | undefined) => a ?? b ?? "")
    .replace(/^\s{0,3}#{1,6}\s+/gm, "")
    .replace(/^\s*[*•]\s+/gm, "- ")
    .replace(/[ \t]+\n/g, "\n")
    .trim();
}

export const MAX_ANSWER = 2000;

const phrasePattern = (phrases: string[]) =>
  new RegExp(`(?<![\\p{L}\\p{N}])(?:${phrases.map((p) => normalizeText(p).replace(/[.*+?^${}()|[\]\\]/g, "\\$&")).join("|")})(?![\\p{L}\\p{N}])`, "u");
const JUDGMENT = phrasePattern([...lessico.giudizi, ...lessico.voto]);
const INSTRUCTIONS = phrasePattern(lessico.istruzioni);

export const judgment = (text: string): string | null => normalizeText(text).match(JUDGMENT)?.[0] ?? null;
export const exposesInstructions = (text: string): string | null => normalizeText(text).match(INSTRUCTIONS)?.[0] ?? null;
export const LEXICON = { JUDGMENT, INSTRUCTIONS };

// Partiti e coalizioni con i nomi con cui una risposta li può chiamare. Le persone si leggono dalle
// righe «Dichiarante:» dell'indice. «Azione» e «Ora!» sono parole comuni: valgono solo per esteso.
export const PARTIES: Record<string, string[]> = {
  fdi: ["fratelli d'italia", "fdi"],
  pd: ["partito democratico", "pd"],
  m5s: ["movimento 5 stelle", "movimento cinque stelle", "m5s", "5 stelle", "cinque stelle"],
  lega: ["lega"],
  fi: ["forza italia"],
  avs: ["alleanza verdi e sinistra", "avs", "europa verde", "sinistra italiana"],
  az: ["partito azione", "azione di calenda"],
  iv: ["italia viva"],
  pe: ["+europa", "più europa", "piu europa"],
  nm: ["noi moderati"],
  capi: ["partito capibara"],
  fn: ["futuro nazionale"],
  pap: ["potere al popolo"],
  pcit: ["progetto civico italia"],
  pld: ["partito liberaldemocratico"],
  psi: ["partito socialista italiano", "avanti psi", "psi"],
  scn: ["sud chiama nord"],
  svp: ["südtiroler volkspartei", "svp"],
  maie: ["maie", "movimento associativo italiani all'estero"],
  cdx: ["centrodestra"],
  csx: ["centrosinistra"],
};

type Names = { patterns: [string, RegExp][] };
const cache = new WeakMap<object, Names>();
const namePattern = (n: string) => new RegExp(`(?<![\\p{L}\\p{N}])${normalizeText(n).replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}(?![\\p{L}\\p{N}])`, "u");

function namesOf(docs: Iterable<IndexDocument>, key: object): Names {
  const hit = cache.get(key);
  if (hit) return hit;
  const patterns: [string, RegExp][] = Object.entries(PARTIES).flatMap(([k, aliases]) => aliases.map((a): [string, RegExp] => [k, namePattern(a)]));
  const people = new Set<string>();
  for (const d of docs) {
    if (d.structData.dataset !== "promesse") continue;
    const m = d.structData.testo.match(/^Dichiarante: ([^,\n]+)/m);
    const name = m?.[1]?.trim();
    if (!name || /\(|partito|movimento|alleanza/i.test(name)) continue;
    people.add(name);
  }
  for (const p of people) {
    const surname = p.split(/\s+/).slice(-1)[0] ?? p;
    patterns.push([`persona:${normalizeText(p)}`, namePattern(p)], [`persona:${normalizeText(p)}`, namePattern(surname)]);
  }
  const names = { patterns };
  cache.set(key, names);
  return names;
}

// Chi una dichiarazione può essere attribuita: i nomi che compaiono nella sua intestazione
// (titolo, dichiarante, partito). Una risoluzione unitaria di più partiti li ammette tutti.
function allowedFor(d: IndexDocument, names: Names): Set<string> {
  const header = normalizeText([d.structData.titolo, ...d.structData.testo.split("\n").filter((l) => /^(Dichiarante|Partito):/.test(l))].join(" "));
  return new Set(names.patterns.filter(([, re]) => re.test(header)).map(([k]) => k));
}

// Accanto a una citazione di una dichiarazione (la sua riga, dopo la citazione precedente) si possono
// nominare solo il partito e le persone di quella dichiarazione: così una frase di FdI non si attribuisce
// al PD (M8). Gli indirizzi web non contano: i loro slug nominano chiunque. owners dà le dichiarazioni
// che contengono una citazione.
const URLS = /https?:\/\/\S+|\bwww\.\S+|\b[a-z0-9-]+\.(it|com|org|eu|net)\/\S*/gi;
const BEFORE = 200;
const AFTER = 80;

export function wrongAttribution(
  text: string,
  quotes: string[],
  owners: (quote: string) => IndexDocument[],
  index: ReadonlyMap<string, IndexDocument>,
): string | null {
  const clean = text.replace(URLS, " ");
  const names = namesOf(index.values(), index);
  const spans = quotes
    .map((q) => ({ q, at: clean.indexOf(q) }))
    .filter((x) => x.at >= 0)
    .sort((a, b) => a.at - b.at);
  for (const [i, { q, at }] of spans.entries()) {
    const docs = owners(q).filter((d) => d.structData.dataset === "promesse");
    if (!docs.length) continue;
    const prevEnd = i > 0 ? (spans[i - 1]?.at ?? 0) + (spans[i - 1]?.q.length ?? 0) + 1 : 0;
    const from = Math.max(clean.lastIndexOf("\n", at) + 1, at - BEFORE, prevEnd);
    const end = at + q.length + 1;
    const nextAt = spans[i + 1]?.at ?? clean.length;
    const tail = clean.slice(end, Math.min(end + AFTER, nextAt - 1));
    const window = normalizeText(`${clean.slice(from, Math.max(from, at - 1))} ${tail.split(/[.\n]/)[0] ?? ""}`);
    const allowed = new Set(docs.flatMap((d) => [...allowedFor(d, names)]));
    for (const [k, re] of names.patterns) {
      const m = window.match(re);
      if (m && !allowed.has(k)) return m[0];
    }
  }
  return null;
}
