// Metriche della fase 4: ogni caso del golden set si pone 3 volte e passa solo se passa in tutti e
// 3 i run. Usa lo stesso validatore della route (agent/answer/answer.ts), così le eval misurano
// quello che l'utente vedrebbe. Nessun giudizio di un modello: solo confronti sul testo.
import {
  declaresNotVerified,
  extractFigures,
  extractQuotes,
  figuresWithoutSource,
  validateAnswer,
  type AgentAnswer,
  type Index,
} from "../answer/answer.ts";
import { documentId, type IndexDocument } from "../ingest/export.ts";
import type { GoldenCase, Rule } from "./golden-set.ts";
import { findDeclarant, findValue, normalizeText } from "./testo.ts";

export const RUNS = 3;

export const METRICS = ["4.1", "4.2", "4.3", "4.4", "4.4b", "4.5", "4.6"] as const;
export type Metric = (typeof METRICS)[number];

// Soglie della roadmap. Il 95 % di 4.4 e 4.5 è una proposta, da confermare al criterio 0.9:
// finché non c'è la riga datata nel README delle eval non è una decisione.
export const THRESHOLDS: Record<Metric, number> = {
  "4.1": 1,
  "4.2": 1,
  "4.3": 1,
  "4.4": 0.95,
  "4.4b": 1,
  "4.5": 0.95,
  "4.6": 1,
};

const NAMES: Record<Metric, string> = {
  "4.1": "cifre con fonte",
  "4.2": "astensioni giuste",
  "4.3": "verbatim",
  "4.4": "record atteso fra i citati",
  "4.4b": "nessuna citazione inventata",
  "4.5": "valori attesi",
  "4.6": "regole",
};

type Check = { ok: boolean; dettaglio?: string };
const pass: Check = { ok: true };
const fail = (dettaglio: string): Check => ({ ok: false, dettaglio });

const has = (text: string, re: RegExp) => re.test(normalizeText(text));

// Una parola vietata vale solo se non è negata poco prima: «non è un risparmio» va bene.
const affirms = (text: string, re: RegExp) =>
  [...normalizeText(text).matchAll(new RegExp(re.source, "g"))].some((m) => !/\bnon\b[^.;]{0,40}$/.test(normalizeText(text).slice(0, m.index)));

const UNIT_WORDS: [RegExp, RegExp][] = [
  [/^euro$|euro/, /euro|€/],
  [/%/, /%|per cento/],
  [/persone/, /persone|abitanti|residenti/],
  [/indice/, /indice/],
];

// Un controllo per ogni regola del golden set. Sui casi da astensione la regola è rispettata
// dall'astensione stessa; la 4.2 controlla che sia vera.
const RULES: Record<Rule, (a: AgentAnswer, c: GoldenCase) => Check | null> = {
  verbatim: () => null, // metrica 4.3
  valore_corretto: () => null, // metrica 4.5: il valore atteso è quello dopo la correzione
  dichiara_livello_V2: (a) => (has(a.testo, /\bv2\b|verifica parziale|verificat[oa] solo in parte/) ? pass : fail("livello V2 non dichiarato")),
  dichiara_non_verificato: (a) => (declaresNotVerified(a.testo) ? pass : fail("dato NV non dichiarato")),
  dichiara_attribuzione_non_documentata: (a) =>
    has(a.testo, /attribuzione (inferita|non documentata|incerta)|non (è )?documentat|inferit/) ? pass : fail("attribuzione data come certa"),
  tetto_non_e_risparmio: (a) =>
    !has(a.testo, /tetto/) ? fail("tetto non nominato") : affirms(a.testo, /risparmi/) ? fail("tetto presentato come risparmio") : pass,
  niente_percentuale: (a) => (has(a.testo, /\d\s*(%|per cento)/) ? fail("percentuale su basi non omogenee") : pass),
  dichiara_proiezione: (a) => (has(a.testo, /proiezion/) ? pass : fail("proiezione non dichiarata")),
  scostamento_calcolato_da_paghi_tu: (a) => (has(a.testo, /calcolat\w* da paghi tu|paghi tu (lo )?(ha )?calcolat/) ? pass : fail("chi ha calcolato lo scostamento non è detto")),
  dichiara_confidenza_bassa: (a) => (has(a.testo, /confidenza (è )?(bassa|[cd]\b)|confidenza: [cd]\b|bassa confidenza/) ? pass : fail("confidenza bassa non dichiarata")),
  dichiara_consuntivo_assente: (a) =>
    has(a.testo, /consuntivo (non (è )?(disponibile|ancora)|assente|mancante)|nessun consuntivo|senza consuntivo|manca il consuntivo/) ? pass : fail("consuntivo assente non dichiarato"),
  rottura_di_serie: (a) => (has(a.testo, /rottura di serie/) ? pass : fail("rottura di serie non dichiarata")),
  solo_stesso_trimestre: (a) => (has(a.testo, /stesso trimestre/) ? pass : fail("confronto fra trimestri diversi non escluso")),
  dichiara_stima: (a) => (has(a.testo, /stim[ae]/) ? pass : fail("stima non dichiarata")),
  unita_di_misura: (a, c) => {
    const units = [...new Set(c.valoriAttesi.map((v) => v.unita).filter((u): u is string => Boolean(u)))];
    const missing = units.filter((u) => {
      const word = UNIT_WORDS.find(([key]) => key.test(u))?.[1] ?? new RegExp(normalizeText(u).split(" ")[0]);
      return !has(a.testo, word);
    });
    return missing.length ? fail(`unità mancante: ${missing.join(", ")}`) : pass;
  },
  costo_dichiarato_dal_proponente: (a) =>
    has(a.testo, /dichiarat\w* da|indicat\w* da|secondo (il|la|i|le) (proponent|partit)|stima del (partito|proponente)|dal proponente/) ? pass : fail("costo non attribuito al proponente"),
  niente_classifiche: (a) => (has(a.testo, /classific|al primo posto|(il|i) (partit\w*|govern\w*) (che )?(ha |hanno )?(più|meno) /) ? fail("classifica o ordinamento") : pass),
  niente_calcolo: (a) => (has(a.testo, /in totale|sommand|la somma|messi insieme|complessivamente/) ? fail("calcolo non presente nei record") : pass),
  niente_giudizi: (a) =>
    affirms(a.testo, /\b(meglio|peggio|migliore|peggiore|fallimentar\w*|disastros\w*|ottim[oa]|pessim[oa]|bravo|brava|giust[oa]|sbagliat\w*)\b/) ? fail("giudizio") : pass,
  dichiara_ia: (a) => (has(a.testo, /intelligenza artificiale|\b(ia|ai)\b|sistema automatico|assistente automatico/) ? pass : fail("non dice di essere un sistema di IA")),
};

const expectedIds = (c: GoldenCase) => c.citazioniAttese.map((x) => documentId(x.dataset, x.record));

const stripQuotes = (s: string) => normalizeText(s).replace(/^["\s]+|["\s]+$/g, "");

// Le metriche di una risposta. null = la metrica non si applica a questo caso.
export function checkAnswer(c: GoldenCase, a: AgentAnswer, index: Index): Record<Metric, Check | null> {
  // Se il record atteso è fuori dall'indice (escluso all'export, 1.1) l'agente non può citarlo:
  // la risposta giusta è l'astensione, qualunque sia l'esito scritto nel golden set.
  const indexed = expectedIds(c).every((id) => index.has(id));
  const abstains = c.esitoAtteso === "astensione" || !indexed;
  const docs = a.citazioni.map((x) => index.get(x.id)).filter((d): d is IndexDocument => Boolean(d));
  const validation = validateAnswer(a, index, c.domanda);

  const figures = (): Check => {
    if (a.astensione) return pass;
    if (validation.esito === "risposta" && !a.citazioni.length) return pass; // testo fisso di trasparenza
    const loose = figuresWithoutSource(a.testo, docs, undefined, c.domanda);
    return loose.length ? fail(`cifre senza fonte: ${loose.join(", ")}`) : pass;
  };

  const abstention = (): Check | null => {
    if (!abstains) return null;
    if (!a.astensione) return fail("ha risposto invece di astenersi");
    const n = extractFigures(a.testo).length;
    return n ? fail(`astensione con ${n} cifre`) : pass;
  };

  // Le parole esatte stanno nella risposta per intero, dopo la normalizzazione; la parafrasi del
  // golden set non compare fra virgolette. Le citazioni annidate («… «…» …») restano confrontabili.
  const verbatim = (): Check | null => {
    if (!c.regole.includes("verbatim") || !c.testoVerbatim || abstains) return null;
    const quotes = extractQuotes(a.testo).map(stripQuotes);
    if (c.risposteErrate.map(stripQuotes).some((w) => quotes.some((q) => q.includes(w)))) return fail("parafrasi presentata come citazione");
    return normalizeText(a.testo).includes(normalizeText(c.testoVerbatim)) ? pass : fail("citazione diversa dal testo verbatim");
  };

  const expected = (): Check | null => {
    if (abstains) return null;
    const cited = new Set(a.citazioni.map((x) => x.id));
    const missing = expectedIds(c).filter((id) => !cited.has(id));
    return missing.length ? fail(`record attesi non citati: ${missing.join(", ")}`) : pass;
  };

  const invented = (): Check => {
    const bad = validation.esito === "astensione_forzata" ? validation.motivi.filter((m) => m.motivo === "id_inesistente" || m.motivo === "url_non_del_record") : [];
    return bad.length ? fail(bad.map((m) => `${m.motivo}: ${m.dettaglio}`).join("; ")) : pass;
  };

  const values = (): Check | null => {
    if (abstains) return null;
    const vals = c.valoriAttesi.filter((v) => v.valore !== null);
    if (!vals.length) return null;
    const text = normalizeText(a.testo);
    const missing = vals.filter((v) =>
      v.campo === "dichiarante" && typeof v.valore === "string"
        ? !findDeclarant(text, v.valore)
        : !(findValue(text, v.valore as string | number, v.unita) ?? (typeof v.valore === "string" && text.includes(normalizeText(v.valore)) ? v.valore : null)),
    );
    return missing.length ? fail(`valori mancanti: ${missing.map((v) => v.campo).join(", ")}`) : pass;
  };

  const rules = (): Check | null => {
    const results = c.regole
      .map((r) => [r, abstains && a.astensione ? null : RULES[r](a, c)] as const)
      .filter((x): x is readonly [Rule, Check] => x[1] !== null);
    if (!results.length) return null;
    const failed = results.filter(([, r]) => !r.ok);
    return failed.length ? fail(failed.map(([r, x]) => `${r}: ${x.dettaglio}`).join("; ")) : pass;
  };

  return { "4.1": figures(), "4.2": abstention(), "4.3": verbatim(), "4.4": expected(), "4.4b": invented(), "4.5": values(), "4.6": rules() };
}

export type CaseScore = { id: string; passa: boolean; metriche: Partial<Record<Metric, Check>> };

// Un caso passa una metrica solo se la passa in tutti i run; il primo fallimento dà il dettaglio.
export function scoreCase(c: GoldenCase, answers: AgentAnswer[], index: Index): CaseScore {
  if (answers.length !== RUNS) throw new Error(`${c.id}: servono ${RUNS} risposte, ne ho ${answers.length}`);
  const perRun = answers.map((a) => checkAnswer(c, a, index));
  const metriche: Partial<Record<Metric, Check>> = {};
  for (const m of METRICS) {
    const checks = perRun.map((r) => r[m]).filter((x): x is Check => x !== null);
    if (!checks.length) continue;
    metriche[m] = checks.find((x) => !x.ok) ?? pass;
  }
  return { id: c.id, passa: Object.values(metriche).every((x) => x.ok), metriche };
}

export type MetricSummary = { metrica: Metric; nome: string; passati: number; totale: number; quota: number; soglia: number; ok: boolean };
export type Report = {
  esito: "passa" | "non_passa";
  metriche: MetricSummary[];
  casi: CaseScore[];
  // Casi la cui citazione attesa è fuori dall'indice (esclusa all'export): si misurano come astensioni.
  fuoriIndice: string[];
  regressioni: string[];
  mancanti: string[];
};

// previous: id dei casi che passavano nel run di riferimento (4.7).
export function scoreRun(cases: GoldenCase[], answers: ReadonlyMap<string, AgentAnswer[]>, index: Index, previous: ReadonlySet<string> = new Set()): Report {
  const mancanti = cases.filter((c) => !answers.has(c.id)).map((c) => c.id);
  const casi = cases.filter((c) => answers.has(c.id)).map((c) => scoreCase(c, answers.get(c.id) ?? [], index));
  const metriche = METRICS.map((m): MetricSummary => {
    const scored = casi.filter((s) => s.metriche[m]);
    const passati = scored.filter((s) => s.metriche[m]?.ok).length;
    const quota = scored.length ? passati / scored.length : 1;
    return { metrica: m, nome: NAMES[m], passati, totale: scored.length, quota, soglia: THRESHOLDS[m], ok: quota >= THRESHOLDS[m] };
  });
  const regressioni = casi.filter((s) => !s.passa && previous.has(s.id)).map((s) => s.id);
  const fuoriIndice = cases.filter((c) => c.esitoAtteso !== "astensione" && !expectedIds(c).every((id) => index.has(id))).map((c) => c.id);
  const ok = metriche.every((m) => m.ok) && !regressioni.length && !mancanti.length;
  return { esito: ok ? "passa" : "non_passa", metriche, casi, fuoriIndice, regressioni, mancanti };
}
