// Test delle risposte sulle dichiarazioni composte dalla route (D5, D-033).
import { readFile } from "node:fs/promises";
import { beforeAll, describe, expect, it } from "vitest";
import type { GoldenCase } from "../evals/golden-set.ts";
import { RUNS, scoreRun } from "../evals/score.ts";
import { buildDocuments, documentId } from "../ingest/export.ts";
import { loadSiteData } from "../ingest/load.ts";
import { validateAnswer, type AgentAnswer, type Index } from "./answer.ts";
import { composeDeclaration, composePromises, findDeclaration } from "./promesse.ts";

let index: Index;
let cases: GoldenCase[];

beforeAll(async () => {
  const { documents } = buildDocuments(await loadSiteData());
  index = new Map(documents.map((d) => [d.id, d]));
  cases = (await readFile("agent/evals/domande.jsonl", "utf8")).trim().split("\n").map((l) => JSON.parse(l) as GoldenCase);
});

const cite = (id: string) => {
  const d = index.get(id);
  if (!d) throw new Error(id);
  return { id, url: d.structData.fonte_url[0] ?? d.structData.url_pagina };
};

describe("dichiarazioni composte dalla route (D5)", () => {
  it("accetta il ruolo citato dal record senza accettare una parafrasi come parole del dichiarante", () => {
    const id = "promesse--C27-CAPI-015";
    const d = index.get(id)!;
    const good: AgentAnswer = { testo: composeDeclaration(d), citazioni: [cite(id)], astensione: false };
    expect(validateAnswer(good, index).esito).toBe("risposta");
    const bad = { ...good, testo: `${good.testo}\nHa dichiarato: «Rendere gratuita la casa come risposta al costo degli affitti.»` };
    expect(validateAnswer(bad, index).esito).toBe("astensione_forzata");
  });

  it("ogni caso del golden set sulle promesse passa tutte le metriche con la risposta composta, qualunque cosa scriva il modello", () => {
    const promise = cases.filter((c) => c.categoria === "promesse" && c.esitoAtteso === "risposta" && c.citazioniAttese.every((x) => index.has(documentId(x.dataset, x.record))));
    expect(promise.length).toBeGreaterThan(30);
    const answers = new Map(
      promise.map((c) => {
        const model: AgentAnswer = { testo: "Il Partito Democratico ha detto «una frase ricucita che nessuno ha mai detto davvero».", citazioni: c.citazioniAttese.map((x) => cite(documentId(x.dataset, x.record))), astensione: false };
        return [c.id, Array.from({ length: RUNS }, () => composePromises(model, index, c.domanda))];
      }),
    );
    const report = scoreRun(promise, answers, index);
    expect(report.casi.filter((s) => !s.passa).map((s) => `${s.id}: ${JSON.stringify(s.metriche)}`)).toEqual([]);
    for (const [, [a]] of answers) expect(a && validateAnswer(a, index).esito).toBe("risposta");
  });

  it("mostra chi, quando, le parole esatte e il livello, senza sintesi, classificazione e URL", () => {
    const text = composeDeclaration(index.get("promesse--C27-FDI-001") as never);
    expect(text).toContain("Dichiarante: Galeazzo Bignami");
    expect(text).toContain("Parole esatte: «Con questa proposta di legge");
    expect(text).toContain("Livello di verifica V1");
    expect(text).not.toMatch(/In sintesi|Tipo di fonte|https?:|non indicato/);
  });

  it("lascia stare le risposte che non riguardano dichiarazioni", () => {
    const g = cite("governi--g55");
    const a: AgentAnswer = { testo: "Alcide De Gasperi.", citazioni: [g, cite("promesse--C27-FDI-001")], astensione: false };
    expect(composePromises(a, index, "Chi era il presidente del Consiglio nel 1946?")).toBe(a);
    expect(composePromises({ ...a, citazioni: [g] }, index, "Che cosa ha dichiarato De Gasperi?").testo).toBe("Alcide De Gasperi.");
  });

  it("su una domanda di dichiarazione tiene solo le dichiarazioni citate", () => {
    const a: AgentAnswer = { testo: "x", citazioni: [cite("governi--g55"), cite("promesse--C27-FDI-001")], astensione: false };
    const out = composePromises(a, index, "Che cosa ha dichiarato Bignami l'8 luglio 2026?");
    expect(out.citazioni.map((c) => c.id)).toEqual(["promesse--C27-FDI-001"]);
  });

  it("non risponde con la dichiarazione di un'altra persona o di un altro partito (M8)", () => {
    const a: AgentAnswer = { testo: "x", citazioni: [cite("promesse--C27-FDI-001")], astensione: false };
    expect(composePromises(a, index, "Che cosa ha dichiarato Elly Schlein l'8 luglio 2026 sugli immigrati detenuti?").astensione).toBe(true);
    expect(composePromises(a, index, "Che cosa ha dichiarato il Partito Democratico l'8 luglio 2026?").astensione).toBe(true);
    expect(composePromises(a, index, "Che cosa ha dichiarato Galeazzo Bignami (Fratelli d'Italia) l'8 luglio 2026?").astensione).toBe(false);
    expect(composePromises(a, index, "Che cosa ha promesso Fratelli d'Italia sui detenuti stranieri?").astensione).toBe(false);
  });

  it("mostra e cita le correzioni pubblicate sulla dichiarazione", () => {
    const a: AgentAnswer = { testo: "x", citazioni: [cite("promesse--C27-FI-013")], astensione: false };
    const out = composePromises(a, index, "La frase di Antonio Tajani sull'esenzione del bollo per la prima auto viene da un'intervista?");
    expect(out.citazioni.map((c) => c.id)).toEqual(["promesse--C27-FI-013", "correzioni--COR-0002"]);
    expect(out.testo).toContain("Dopo: Discorso");
    expect(validateAnswer(out, index).esito).toBe("risposta");
  });

  it("aggiunge la dichiarazione individuata da persona e data anche se la ricerca non l'ha trovata", () => {
    const q = "Che cosa ha dichiarato Angelo Bonelli (Alleanza Verdi e Sinistra (Europa Verde + Sinistra Italiana)) il 21 ottobre 2026? Voglio le parole esatte e la fonte.";
    expect(findDeclaration(q, index)?.id).toBe("promesse--C27-AVS-046");
    const out = composePromises({ testo: "Non lo so.", citazioni: [], astensione: true }, index, q);
    expect(out.citazioni.map((c) => c.id)).toEqual(["promesse--C27-AVS-046"]);
    expect(out.testo).toContain("Può prendere i soldi tassando gli extraprofitti");
    expect(validateAnswer(out, index, q).esito).toBe("risposta");
    // Senza data, o senza persona, nessuna aggiunta.
    expect(findDeclaration("Che cosa ha dichiarato Angelo Bonelli sui carburanti?", index)).toBeNull();
    expect(findDeclaration("Che cosa è stato dichiarato il 21 ottobre 2026?", index)).toBeNull();
  });

  it("una risposta che cita solo correzioni mostra le righe del record, non la parafrasi", () => {
    const a: AgentAnswer = { testo: "Prima era V2, ora un'intervista conta come primaria.", citazioni: [cite("correzioni--COR-0003")], astensione: false };
    const out = composePromises(a, index, "Per Paghi Tu un'intervista pubblicata da un giornale conta come fonte primaria?");
    expect(out.testo).toContain("Dopo: V1: un'intervista pubblicata da un giornale conta come fonte primaria, se la citazione è verificata sul testo.");
    expect(out.testo).not.toContain("Prima era V2");
    expect(validateAnswer(out, index).esito).toBe("risposta");
  });
});
