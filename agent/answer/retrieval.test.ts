import { readFile } from "node:fs/promises";
import { beforeAll, expect, it } from "vitest";
import { buildDocuments } from "../ingest/export.ts";
import { loadSiteData } from "../ingest/load.ts";
import type { Index } from "./answer.ts";
import { candidateFilter, scopeBlock, structuredCandidates } from "./retrieval.ts";
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

it("si astiene sui territori non coperti, anche fuori dai casi della suite principale", () => {
  expect(scopeBlock("Quanto ha speso la Toscana per l’istruzione nel 2023?")?.motivo).toBe("fuori_perimetro");
  expect(scopeBlock("Quanto vale il PIL della Svizzera nel 2024?")?.motivo).toBe("fuori_perimetro");
  expect(scopeBlock("Chi era il presidente del Consiglio del Giappone nel 2000?")?.motivo).toBe("fuori_perimetro");
  expect(scopeBlock("Spesa pubblica italiana rispetto alla Germania nel 2025")).toBeNull();
});
it("non calcola nuove somme e lascia passare i totali già disponibili", () => {
  expect(scopeBlock("Quanto costa la somma di assegno unico e bonus 80 euro?")?.motivo).toBe("calcolo_non_disponibile");
  expect(scopeBlock("Quota 100 e assegno unico messi insieme: quanto costano?")?.motivo).toBe("calcolo_non_disponibile");
  expect(scopeBlock("Quanto vale la spesa totale delle amministrazioni pubbliche italiane nel 2020?")).toBeNull();
});

it("il controllo di perimetro non ferma le domande con risposta del golden set", async () => {
  const cases = (await readFile("agent/evals/domande.jsonl", "utf8")).trim().split("\n").map((line) => JSON.parse(line) as { id: string; domanda: string; esitoAtteso: string });
  expect(cases.filter((c) => c.esitoAtteso !== "astensione" && scopeBlock(c.domanda)).map((c) => c.id)).toEqual([]);
});
