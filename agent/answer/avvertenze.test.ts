// Test delle avvertenze dei record aggiunte dalla route (D6, proposta, D-033).
import { readFile } from "node:fs/promises";
import { beforeAll, describe, expect, it } from "vitest";
import type { GoldenCase, Rule } from "../evals/golden-set.ts";
import { checkAnswer } from "../evals/score.ts";
import { buildDocuments, documentId } from "../ingest/export.ts";
import { loadSiteData } from "../ingest/load.ts";
import { validateAnswer, type AgentAnswer, type Index } from "./answer.ts";
import { appendWarnings, recordWarnings } from "./avvertenze.ts";

let index: Index;
let cases: GoldenCase[];

beforeAll(async () => {
  const { documents } = buildDocuments(await loadSiteData());
  index = new Map(documents.map((d) => [d.id, d]));
  cases = (await readFile("agent/evals/domande.jsonl", "utf8")).trim().split("\n").map((l) => JSON.parse(l) as GoldenCase);
});

const WARNING_RULES: Rule[] = [
  "dichiara_livello_V2",
  "dichiara_non_verificato",
  "tetto_non_e_risparmio",
  "dichiara_proiezione",
  "scostamento_calcolato_da_paghi_tu",
  "dichiara_confidenza_bassa",
  "dichiara_consuntivo_assente",
  "rottura_di_serie",
  "solo_stesso_trimestre",
  "dichiara_stima",
];

const cite = (id: string) => {
  const d = index.get(id);
  if (!d) throw new Error(id);
  return { id, url: d.structData.fonte_url[0] ?? d.structData.url_pagina };
};

describe("avvertenze dei record (D6)", () => {
  it("ogni regola di avvertenza del golden set è rispettata anche se il modello non scrive niente", () => {
    const withWarnings = cases.filter(
      (c) => c.esitoAtteso === "risposta" && c.regole.some((r) => WARNING_RULES.includes(r)) && c.citazioniAttese.every((x) => index.has(documentId(x.dataset, x.record))),
    );
    expect(withWarnings.length).toBeGreaterThan(10);
    const failed = withWarnings.flatMap((c) => {
      const model: AgentAnswer = { testo: "Ecco il dato.", citazioni: c.citazioniAttese.map((x) => cite(documentId(x.dataset, x.record))), astensione: false };
      const rules = checkAnswer(c, appendWarnings(model, index), index)["4.6"];
      const broken = rules && !rules.ok ? (rules.dettaglio ?? "").split("; ").filter((d) => WARNING_RULES.some((r) => d.startsWith(`${r}:`))) : [];
      return broken.map((d) => `${c.id} ${d}`);
    });
    expect(failed).toEqual([]);
  });

  it("le avvertenze aggiunte non introducono cifre senza fonte né fermano la risposta", () => {
    const ids = [...index.keys()].filter((id) => recordWarnings(index.get(id) as never).length);
    for (const id of ids) {
      const a = appendWarnings({ testo: "Ecco il dato.", citazioni: [cite(id)], astensione: false }, index);
      expect(validateAnswer(a, index).esito, id).toBe("risposta");
    }
  });

  it("non ripete un'avvertenza già scritta e lascia stare record e astensioni senza avvertenze", () => {
    const g = cite("governi--g55");
    const plain: AgentAnswer = { testo: "Alcide De Gasperi.", citazioni: [g], astensione: false };
    expect(appendWarnings(plain, index)).toBe(plain);
    const none: AgentAnswer = { testo: "Non lo so.", citazioni: [], astensione: true };
    expect(appendWarnings(none, index)).toBe(none);
    const id = [...index.keys()].find((k) => recordWarnings(index.get(k) as never).length) as string;
    const once = appendWarnings({ testo: "Ecco.", citazioni: [cite(id)], astensione: false }, index);
    expect(appendWarnings(once, index)).toEqual(once);
  });
});
