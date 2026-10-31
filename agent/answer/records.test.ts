import { beforeAll, expect, it } from "vitest";
import { buildDocuments } from "../ingest/export.ts";
import { loadSiteData } from "../ingest/load.ts";
import { validateAnswer, type AgentAnswer, type Index } from "./answer.ts";
import { appendWarnings } from "./avvertenze.ts";
import { composeRecords } from "./records.ts";

let index: Index;
beforeAll(async () => {
  index = new Map(buildDocuments(await loadSiteData()).documents.map((d) => [d.id, d]));
});
const answer = (ids: string[], testo = "testo non affidabile del modello"): AgentAnswer => ({
  testo, astensione: false,
  citazioni: ids.map((id) => ({ id, url: index.get(id)?.structData.fonte_url[0] ?? "https://invalid.example" })),
});

it("riporta le date del mandato senza ripetere una durata presupposta dalla domanda", () => {
  const out = composeRecords(answer(["governi--g82"], "Il governo Letta è durato cinque anni."), index);
  expect(out.testo).not.toContain("cinque anni");
  expect(out.testo).toContain("28 aprile 2013");
  expect(out.testo).toContain("22 febbraio 2014");
  expect(validateAnswer(out, index).esito).toBe("risposta");
});
it("conserva gli scostamenti già calcolati e le loro unità", () => {
  const out = composeRecords(answer(["misure--bonus_80_euro-1"]), index);
  expect(out.testo).toMatch(/Scostamento:.*euro.*%/);
  expect(validateAnswer(out, index).esito).toBe("risposta");
});
it("non mostra percentuali mescolando confronti con basi non omogenee", () => {
  const out = appendWarnings(composeRecords(answer(["misure--reddito_di_cittadinanza-1", "misure--reddito_di_cittadinanza-2"]), index), index);
  expect(out.testo).not.toContain("%");
  expect(out.testo).toContain("5.906.800.000 euro");
  expect(out.testo).toContain("non è un risparmio");
  expect(validateAnswer(out, index).esito).toBe("risposta");
});
it("non trasforma un id inventato o un'astensione in una risposta", () => {
  const bad = answer(["governi--inesistente"]);
  expect(composeRecords(bad, index)).toEqual(bad);
  expect(validateAnswer(composeRecords(bad, index), index).esito).toBe("astensione_forzata");
  const abstained = { ...answer(["governi--g82"]), astensione: true };
  expect(composeRecords(abstained, index)).toEqual(abstained);
});

it("la guardia respinge percentuali anche quando sono supportate da un altro record citato", () => {
  const out = answer(["misure--reddito_di_cittadinanza-1", "misure--reddito_di_cittadinanza-2"], "Lo scostamento è -0,328 %.");
  const verdict = validateAnswer(out, index);
  expect(verdict.esito).toBe("astensione_forzata");
  if (verdict.esito === "astensione_forzata") expect(verdict.motivi.some((m) => m.motivo === "percentuale_basi_non_omogenee")).toBe(true);
});

it("i confronti multipli conservano i dati e non ripetono gli avvisi comuni", () => {
  const out = appendWarnings(composeRecords(answer([1, 2, 3, 4].map((n) => `misure--reddito_di_cittadinanza-${n}`)), index), index);
  expect(out.testo.length).toBeLessThanOrEqual(2000);
  expect(out.testo.match(/Spendere meno del tetto/g)?.length).toBe(1);
  expect(validateAnswer(out, index).esito).toBe("risposta");
});
