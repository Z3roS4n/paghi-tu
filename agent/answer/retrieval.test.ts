import { readFile } from "node:fs/promises";
import { beforeAll, expect, it } from "vitest";
import { buildDocuments } from "../ingest/export.ts";
import { loadSiteData } from "../ingest/load.ts";
import type { Index } from "./answer.ts";
import { candidateFilter, financeMeasureMismatch, scopeBlock, structuredCandidates } from "./retrieval.ts";
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

it("recupera la spesa per interessi dai conti annuali, anche se la domanda nomina il debito", () => {
  for (const question of [
    "Quanto ha speso lo Stato italiano per interessi sul debito nel 2023?",
    "Quanto sono costati gli interessi del debito pubblico nel 2018?",
    "Quali oneri finanziari ha sostenuto l'Italia nel 2024?",
    "Interessi sul debito in percentuale del PIL nel 2025?",
  ]) {
    const year = question.match(/20\d{2}/)?.[0];
    expect(structuredCandidates(question, index).map((d) => d.structData.record)).toEqual([`conti/${year}`]);
  }
});

it("mantiene distinte consistenza, rapporto debito PIL e richieste composte", () => {
  expect(structuredCandidates("Debito pubblico a fine agosto 2026?", index).map((d) => d.structData.record)).toEqual(["debitoMensile/2026-08"]);
  expect(structuredCandidates("Debito pubblico in rapporto al PIL nel 2025?", index).map((d) => d.structData.record)).toEqual(["debitoPil/2025"]);
  expect(structuredCandidates("Spesa per interessi e debito in rapporto al PIL nel 2025?", index).map((d) => d.structData.record).sort()).toEqual(["conti/2025", "debitoPil/2025"]);
  expect(structuredCandidates("Interessi sul debito e consistenza a fine agosto 2025?", index).map((d) => d.structData.record).sort()).toEqual(["conti/2025", "debitoMensile/2025-08"]);
  expect(structuredCandidates("Interessi sul debito e consistenza a fine agosto 2026?", index)).toEqual([]);
  expect(structuredCandidates("Quanto è costato il debito nel 2023?", index)).toEqual([]);
});

it("non sostituisce gli interessi trimestrali o il confronto UE con lo stock", () => {
  expect(structuredCandidates("Interessi sul debito nel 2° trimestre 2024?", index).map((d) => d.structData.record)).toEqual(["trimestri/2024-Q2"]);
  expect(structuredCandidates("Spesa per interessi sul debito in Italia e Germania nel 2025?", index).map((d) => d.structData.record)).toEqual(["confrontoUe/conti/2025"]);
  expect(structuredCandidates("Debito in rapporto al PIL di Italia e Germania nel 2025?", index).map((d) => d.structData.record)).toEqual(["confrontoUe/debito/2025"]);
  expect(structuredCandidates("Spesa sanitaria e interessi sul debito nel 2024?", index).map((d) => d.structData.record).sort()).toEqual(["conti/2024", "funzioni/2024"]);
});

it("segnala citazioni di stock o debito PIL incompatibili con gli interessi richiesti", () => {
  const record = (name: string) => {
    const document = [...index.values()].find((item) => item.structData.dataset === "finanza-pubblica" && item.structData.record === name);
    if (!document) throw new Error(`Record di prova assente: ${name}`);
    return document;
  };
  const annual = "Quanto ha speso lo Stato per interessi sul debito nel 2023?";
  expect(financeMeasureMismatch(annual, [record("debitoMensile/2023-07")])).toBe(true);
  expect(financeMeasureMismatch(annual, [record("debitoPil/2023")])).toBe(true);
  expect(financeMeasureMismatch(annual, [record("conti/2022"), record("debitoMensile/2023-07")])).toBe(true);
  expect(financeMeasureMismatch(annual, [record("conti/2023"), record("debitoMensile/2023-07")])).toBe(false);
  expect(financeMeasureMismatch("Spesa per interessi nel 2023 e nel 2024?", [record("conti/2023")])).toBe(true);
  expect(financeMeasureMismatch("Spesa per interessi nel 2023 e nel 2024?", [record("conti/2023"), record("conti/2024")])).toBe(false);
});

it("controlla trimestre e confronto UE senza bloccare stock o contesti storici", () => {
  const finance = [...index.values()].filter((document) => document.structData.dataset === "finanza-pubblica");
  const pick = (name: string) => {
    const document = finance.find((item) => item.structData.record === name);
    if (!document) throw new Error(`Record di prova assente: ${name}`);
    return document;
  };
  expect(financeMeasureMismatch("Interessi nel 2° trimestre 2024?", [pick("conti/2024")])).toBe(true);
  expect(financeMeasureMismatch("Spesa per interessi nel 2° trimestre 2024?", [pick("conti/2024")])).toBe(true);
  expect(financeMeasureMismatch("Spesa per interessi nel 2° trimestre 2024?", [pick("trimestri/2024-Q1")])).toBe(true);
  expect(financeMeasureMismatch("Spesa per interessi nel 2° trimestre 2024?", [pick("trimestri/2024-Q2")])).toBe(false);
  expect(financeMeasureMismatch("Interessi sul debito in Italia e Germania nel 2025?", [pick("conti/2025")])).toBe(true);
  expect(financeMeasureMismatch("Interessi sul debito in Italia e Germania nel 2025?", [pick("confrontoUe/conti/2025")])).toBe(false);
  expect(financeMeasureMismatch("Debito pubblico a fine agosto 2026?", [pick("debitoMensile/2026-08")])).toBe(false);
  expect(financeMeasureMismatch("Quali interessi rappresentava il governo Prodi nel 1998?", [pick("debitoMensile/1998-07")])).toBe(false);
  expect(financeMeasureMismatch("Che cosa ha dichiarato sui suoi interessi e la spesa pubblica?", [pick("debitoMensile/2023-07")])).toBe(false);
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
