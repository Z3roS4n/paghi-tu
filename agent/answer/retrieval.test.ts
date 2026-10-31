import { beforeAll, expect, it } from "vitest";
import { buildDocuments } from "../ingest/export.ts";
import { loadSiteData } from "../ingest/load.ts";
import type { Index } from "./answer.ts";
import { candidateFilter, structuredCandidates } from "./retrieval.ts";
let index: Index;
beforeAll(async () => { index = new Map(buildDocuments(await loadSiteData()).documents.map((d) => [d.id, d])); });
it("restringe una domanda annuale mai usata nelle prove al suo dato", () => {
  expect(structuredCandidates("Quanto erano le entrate pubbliche nel 1998?", index).map((d) => d.structData.record)).toEqual(["conti/1998"]);
});
it("conserva entrambi gli anni di un confronto e le basi trimestrali", () => {
  expect(structuredCandidates("Confronta la spesa pubblica del 2007 con il 2006", index).map((d) => d.structData.record).sort()).toEqual(["conti/2006", "conti/2007"]);
  expect(structuredCandidates("Spesa pubblica nel 1° e 2° trimestre 2024?", index).map((d) => d.structData.record).sort()).toEqual(["trimestri/2024-Q1", "trimestri/2024-Q2"]);
});
it("non forza record su anni assenti o domande prive di intento strutturato", () => {
  expect(structuredCandidates("Quanto spenderemo nel 2099?", index)).toEqual([]);
  expect(structuredCandidates("Che cosa ha dichiarato una persona nel 2025?", index)).toEqual([]);
  expect(candidateFilter([])).toBeNull();
});
it("distingue i dati italiani dal confronto europeo", () => {
  const selected = structuredCandidates("Spesa pubblica in Italia e Germania nel 2025", index);
  expect(selected.map((d) => d.structData.record)).toEqual(["confrontoUe/conti/2025"]);
  expect(candidateFilter(selected)).toContain('dataset: ANY("finanza-pubblica")');
});

it("usa tipo ed esercizio per le leggi e il nome completo per le maggioranze", () => {
  expect(structuredCandidates("Chi ha presentato la legge finanziaria per l’esercizio 1999?", index).map((d) => d.structData.record)).toEqual(["1999-legge-finanziaria"]);
  expect(structuredCandidates("Quali partiti formavano la maggioranza del Governo Prodi I?", index).map((d) => d.structData.record)).toEqual(["g50"]);
});
