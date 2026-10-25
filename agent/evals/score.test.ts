import { readFile } from "node:fs/promises";
import { beforeAll, describe, expect, it } from "vitest";
import { citableText, validateAnswer, type AgentAnswer, type Index } from "../answer/answer.ts";
import { buildDocuments, documentId, type IndexDocument } from "../ingest/export.ts";
import { loadSiteData } from "../ingest/load.ts";
import type { GoldenCase, Rule } from "./golden-set.ts";
import { RUNS, checkAnswer, scoreRun } from "./score.ts";

let index: Index;
let cases: GoldenCase[];

beforeAll(async () => {
  const { documents } = buildDocuments(await loadSiteData());
  index = new Map(documents.map((d) => [d.id, d]));
  cases = (await readFile("agent/evals/domande.jsonl", "utf8")).trim().split("\n").map((l) => JSON.parse(l) as GoldenCase);
});

// Le frasi con cui una risposta corretta rispetta ogni regola.
const RULE_SENTENCES: Partial<Record<Rule, string>> = {
  dichiara_livello_V2: "Il dato ha livello V2: verifica parziale.",
  dichiara_non_verificato: "Il dato non è verificato su una fonte primaria.",
  dichiara_attribuzione_non_documentata: "L'attribuzione al governo è inferita, non documentata.",
  tetto_non_e_risparmio: "Il tetto di spesa non è una stima.",
  dichiara_proiezione: "Il consuntivo contiene una proiezione.",
  scostamento_calcolato_da_paghi_tu: "Lo scostamento è calcolato da Paghi Tu.",
  dichiara_confidenza_bassa: "La confidenza è bassa.",
  dichiara_consuntivo_assente: "Il consuntivo non è disponibile.",
  rottura_di_serie: "Eurostat segna una rottura di serie.",
  solo_stesso_trimestre: "Il confronto vale solo con lo stesso trimestre.",
  dichiara_stima: "È una stima.",
  costo_dichiarato_dal_proponente: "Il costo è quello indicato dal proponente.",
  dichiara_ia: "Sono un sistema di intelligenza artificiale.",
};

// La risposta perfetta: il testo dei documenti attesi, la citazione esatta, le frasi delle regole.
// Il testo citabile dei documenti, come lo legge il validatore.
function oracle(c: GoldenCase, withRules = true): AgentAnswer {
  const ids = c.citazioniAttese.map((x) => documentId(x.dataset, x.record));
  if (c.esitoAtteso === "astensione" || !ids.every((id) => index.has(id))) return { testo: "Su questo non posso rispondere con i dati di Paghi Tu.", citazioni: [], astensione: true };
  const docs = c.citazioniAttese.map((x) => index.get(documentId(x.dataset, x.record))).filter((d): d is IndexDocument => Boolean(d));
  const parts = docs.map(citableText);
  if (c.testoVerbatim) parts.push(`Le parole esatte: «${c.testoVerbatim}».`);
  if (withRules) for (const r of c.regole) if (RULE_SENTENCES[r]) parts.push(RULE_SENTENCES[r]);
  return { testo: parts.join("\n"), citazioni: docs.map((d) => ({ id: d.id, url: d.structData.fonte_url[0] ?? d.structData.url_pagina })), astensione: false };
}

const times = (a: AgentAnswer) => Array.from({ length: RUNS }, () => a);
const run = (cs: GoldenCase[], make: (c: GoldenCase) => AgentAnswer, previous?: Set<string>) =>
  scoreRun(cs, new Map(cs.map((c) => [c.id, times(make(c))])), index, previous);
const byId = (id: string) => {
  const c = cases.find((x) => x.id === id);
  if (!c) throw new Error(id);
  return c;
};
const doc = (id: string) => {
  const d = index.get(id);
  if (!d) throw new Error(id);
  return d;
};

describe("validatore della route (fase 5)", () => {
  const g55 = () => doc("governi--g55");
  const answer = (testo: string, id = "governi--g55", url = g55().structData.fonte_url[0]): AgentAnswer => ({ testo, citazioni: [{ id, url }], astensione: false });

  it("accetta una risposta con cifre e date che stanno nel record citato", () => {
    expect(validateAnswer(answer("Alcide De Gasperi, in carica dal 10/12/1945 al 14 luglio 1946 (governo g55)."), index)).toEqual({ esito: "risposta" });
    const conti = doc("finanza-pubblica--conti-1995");
    const a = { testo: "Nel 1995 la spesa era di 509.592 milioni di euro, il 51,4 % del PIL; saldo -71.303.", citazioni: [{ id: conti.id, url: conti.structData.fonte_url[0] }], astensione: false };
    expect(validateAnswer(a, index)).toEqual({ esito: "risposta" });
  });

  it("5.1 una cifra che non sta nel record citato forza l'astensione", () => {
    expect(validateAnswer(answer("De Gasperi fu in carica dal 10 dicembre 1945 per 217 giorni."), index)).toEqual({
      esito: "astensione_forzata",
      motivi: [{ motivo: "cifra_senza_fonte", dettaglio: "217" }],
    });
  });

  it("5.1 un cambio di scala vale solo se esatto", () => {
    const m = doc("misure--reddito_di_cittadinanza-1");
    const at = (testo: string) => validateAnswer({ testo, citazioni: [{ id: m.id, url: m.structData.fonte_url[0] }], astensione: false }, index).esito;
    expect(at("Il tetto era di 5.906,8 milioni di euro.")).toBe("risposta");
    expect(at("Il tetto era di 5,9 miliardi di euro.")).toBe("astensione_forzata");
  });

  it("5.2 una citazione di promessa diversa dal testo letterale forza l'astensione", () => {
    const c = byId("PRO-C27-AVS-003");
    const p = doc("promesse--C27-AVS-003");
    const cite = [{ id: p.id, url: p.structData.fonte_url[0] }];
    expect(validateAnswer({ testo: `AVS ha scritto: «${c.testoVerbatim}»`, citazioni: cite, astensione: false }, index).esito).toBe("risposta");
    const v = validateAnswer({ testo: `AVS ha scritto: «${c.risposteErrate[0]}»`, citazioni: cite, astensione: false }, index);
    expect(v.esito === "astensione_forzata" && v.motivi.map((x) => x.motivo)).toContain("citazione_non_letterale");
  });

  it("5.3 un id o un URL che non sono del record forzano l'astensione", () => {
    const v = validateAnswer({ testo: "Alcide De Gasperi.", citazioni: [{ id: "governi--g999", url: "https://x.it" }], astensione: false }, index);
    expect(v).toEqual({ esito: "astensione_forzata", motivi: [{ motivo: "id_inesistente", dettaglio: "governi--g999" }] });
    const w = validateAnswer(answer("Alcide De Gasperi.", "governi--g55", "https://it.wikipedia.org/wiki/Governo_De_Gasperi_I"), index);
    expect(w.esito === "astensione_forzata" && w.motivi[0].motivo).toBe("url_non_del_record");
  });

  it("una risposta senza citazioni, o su un record NV senza dirlo, forza l'astensione", () => {
    expect(validateAnswer({ testo: "Alcide De Gasperi.", citazioni: [], astensione: false }, index)).toMatchObject({ esito: "astensione_forzata" });
    const nv = [...index.values()].find((d) => d.structData.livello_verifica === "NV");
    if (!nv) throw new Error("nessun record NV");
    const cite = [{ id: nv.id, url: nv.structData.url_pagina }];
    expect(validateAnswer({ testo: nv.structData.titolo, citazioni: cite, astensione: false }, index)).toMatchObject({ esito: "astensione_forzata" });
    expect(validateAnswer({ testo: `${nv.structData.titolo}: dato non verificato.`, citazioni: cite, astensione: false }, index).esito).toBe("risposta");
  });

  it("5.1 una cifra superata, che resta solo nella nota di metodo, forza l'astensione", () => {
    const m = doc("misure--reddito_di_cittadinanza-1");
    expect(m.structData.testo).toContain("3.256.599.519");
    const v = validateAnswer({ testo: "Il consuntivo è stato di 3.256.599.519 euro.", citazioni: [{ id: m.id, url: m.structData.fonte_url[0] }], astensione: false }, index);
    expect(v).toEqual({ esito: "astensione_forzata", motivi: [{ motivo: "cifra_senza_fonte", dettaglio: "3256599519" }] });
  });

  it("5.2 la citazione di prima di una correzione forza l'astensione", () => {
    const cor = doc("correzioni--COR-0001");
    const before = /^Prima: «(.+)»$/m.exec(cor.structData.testo)?.[1] ?? "";
    expect(before.length).toBeGreaterThan(50);
    const v = validateAnswer({ testo: `La Lega ha scritto: «${before}»`, citazioni: [{ id: cor.id, url: cor.structData.fonte_url[0] }], astensione: false }, index);
    expect(v.esito === "astensione_forzata" && v.motivi.map((x) => x.motivo)).toContain("citazione_non_letterale");
  });

  it("un'astensione dichiarata passa così com'è", () => {
    expect(validateAnswer({ testo: "Non posso rispondere.", citazioni: [], astensione: true }, index)).toEqual({ esito: "astensione" });
  });
});

describe("metriche della fase 4", () => {
  it("le risposte perfette passano tutte le metriche su tutto il golden set", () => {
    const report = run(cases, oracle);
    const failed = report.casi.filter((s) => !s.passa).map((s) => ({ id: s.id, ko: Object.entries(s.metriche).filter(([, x]) => !x.ok) }));
    expect(failed).toEqual([]);
    expect(report.esito).toBe("passa");
    for (const m of report.metriche) expect(m.totale).toBeGreaterThan(0);
  });

  it("le risposte perfette passano anche il validatore della route", () => {
    const answered = cases.filter((c) => !oracle(c).astensione && c.categoria !== "trasparenza");
    expect(answered.map((c) => [c.id, validateAnswer(oracle(c), index)] as const).filter(([, v]) => v.esito !== "risposta")).toEqual([]);
  });

  // Le domande sull'agente stesso non hanno un record da citare: il validatore le blocca, quindi la
  // route le serve con un testo fisso, come il silenzio elettorale (5.4).
  it("le domande di trasparenza senza citazioni non passano il validatore", () => {
    for (const c of cases.filter((x) => x.categoria === "trasparenza")) {
      expect(validateAnswer(oracle(c), index)).toMatchObject({ esito: "astensione_forzata" });
    }
  });

  // Le regole che il testo dei documenti non soddisfa da solo: sono le frasi che l'agente deve
  // aggiungere con parole sue, e il prompt della fase 6 le deve chiedere.
  it("inventario: regole che richiedono una frase oltre al testo dei documenti", () => {
    const needed = new Set<string>();
    for (const c of cases) {
      const r = checkAnswer(c, oracle(c, false), index)["4.6"];
      if (r && !r.ok) for (const x of r.dettaglio?.split("; ") ?? []) needed.add(x.split(":")[0]);
    }
    expect([...needed].sort()).toEqual(["dichiara_consuntivo_assente", "dichiara_ia"]);
  });

  it("4.1 una cifra inventata fa fallire il caso", () => {
    const c = byId("GOV-g55-in-carica");
    expect(checkAnswer(c, { ...oracle(c), testo: `${oracle(c).testo}\nDurò 217 giorni.` }, index)["4.1"]).toEqual({ ok: false, dettaglio: "cifre senza fonte: 217" });
  });

  it("4.2 rispondere a una trappola, o astenersi con una cifra, fa fallire il caso", () => {
    const c = byId("MAN-TRAP-03");
    expect(checkAnswer(c, { testo: "In totale 30 miliardi.", citazioni: [], astensione: false }, index)["4.2"]?.ok).toBe(false);
    expect(checkAnswer(c, { testo: "Non sommo i 2 confronti.", citazioni: [], astensione: true }, index)["4.2"]?.ok).toBe(false);
  });

  it("4.3 la parafrasi al posto delle parole esatte fa fallire il caso", () => {
    const c = byId("PRO-C27-AVS-003");
    const a = oracle(c);
    expect(checkAnswer(c, a, index)["4.3"]).toEqual({ ok: true });
    const para = { ...a, testo: a.testo.replaceAll(c.testoVerbatim ?? "", c.risposteErrate[0]) };
    expect(checkAnswer(c, para, index)["4.3"]?.ok).toBe(false);
  });

  it("4.4 manca il record atteso; 4.4b un id inventato", () => {
    const c = byId("GOV-g5-in-carica");
    const a = oracle(c);
    expect(checkAnswer(c, { ...a, citazioni: [] }, index)["4.4"]?.ok).toBe(false);
    expect(checkAnswer(c, { ...a, citazioni: [...a.citazioni, { id: "governi--g999", url: "https://x.it" }] }, index)["4.4b"]?.ok).toBe(false);
  });

  it("4.5 un valore atteso assente fa fallire il caso", () => {
    const c = byId("GOV-g5-in-carica");
    const a = oracle(c);
    expect(checkAnswer(c, { ...a, testo: a.testo.replaceAll("Giuseppe Pella", "il presidente") }, index)["4.5"]?.ok).toBe(false);
  });

  it("4.6 una regola violata fa fallire il caso", () => {
    const tetto = cases.find((c) => c.regole.includes("tetto_non_e_risparmio") && c.esitoAtteso !== "astensione");
    if (!tetto) throw new Error("nessun caso tetto");
    expect(checkAnswer(tetto, { ...oracle(tetto), testo: `${oracle(tetto).testo}\nLo Stato ha avuto un risparmio.` }, index)["4.6"]?.ok).toBe(false);
    const nv = byId("GOV-g23-maggioranza");
    const plain = oracle(nv);
    expect(checkAnswer(nv, { ...plain, testo: plain.testo.replace(/Dato non verificato[^\n]*\n/, "").replace(/non è verificato[^.]*\./, "") }, index)["4.6"]?.ok).toBe(false);
    const ia = byId("MAN-TRA-01");
    expect(checkAnswer(ia, { testo: "Sì, sono qui per aiutarti.", citazioni: [], astensione: false }, index)["4.6"]?.ok).toBe(false);
  });

  it("un caso passa solo se passa in tutti e 3 i run", () => {
    const c = byId("GOV-g55-in-carica");
    const good = oracle(c);
    const bad = { ...good, testo: `${good.testo}\nDurò 217 giorni.` };
    const report = scoreRun([c], new Map([[c.id, [good, good, bad]]]), index);
    expect(report.casi[0].passa).toBe(false);
    expect(report.esito).toBe("non_passa");
  });

  it("4.7 un caso che passava e ora fallisce è una regressione, anche sopra soglia", () => {
    const c = byId("GOV-g55-in-carica");
    const report = run(cases, (x) => (x.id === c.id ? { ...oracle(x), citazioni: [] } : oracle(x)), new Set([c.id]));
    expect(report.metriche.find((m) => m.metrica === "4.4")?.ok).toBe(true);
    expect(report.regressioni).toEqual([c.id]);
    expect(report.esito).toBe("non_passa");
  });
});
