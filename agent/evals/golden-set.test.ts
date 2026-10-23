import { readFileSync, readdirSync } from "node:fs";
import { describe, expect, it } from "vitest";
import { buildGoldenSet, type SiteData } from "./golden-set.ts";

const read = (path: string): unknown => JSON.parse(readFileSync(path, "utf8"));

function loadData(): SiteData {
  const serie: Record<string, unknown> = {};
  for (const f of readdirSync("data/serie").filter((x) => x.endsWith(".json")).sort()) {
    serie[f.replace(/\.json$/, "")] = read(`data/serie/${f}`);
  }
  return {
    governi: read("data/governi.json"),
    legislature: read("data/legislature.json"),
    leggiBilancio: read("data/leggi-bilancio.json"),
    misure: read("data/misure.json"),
    partiti: read("data/partiti.json"),
    promesse: read("data/promesse.json"),
    correzioni: read("data/correzioni.json"),
    finanzaPubblica: read("data/finanza-pubblica.json"),
    serie,
    casiManuali: read("agent/evals/casi-manuali.json"),
    revisione: read("agent/evals/revisione.json"),
  };
}

const data = loadData();
const cases = buildGoldenSet(data);
const allData = readdirSync("data").filter((f) => f.endsWith(".json")).map((f) => readFileSync(`data/${f}`, "utf8")).join("\n") +
  readdirSync("data/serie").map((f) => readFileSync(`data/serie/${f}`, "utf8")).join("\n");

describe("golden set dell'agente", () => {
  it("è deterministico e allineato al file committato", () => {
    expect(buildGoldenSet(loadData())).toEqual(cases);
    const committed = readFileSync("agent/evals/domande.jsonl", "utf8").trim().split("\n").map((l) => JSON.parse(l));
    expect(committed).toEqual(cases);
  });

  it("le parole attese delle promesse coincidono con il testo letterale del record", () => {
    const promises = new Map((data.promesse as { id: string; testoLetterale: string }[]).map((p) => [p.id, p.testoLetterale]));
    const verbatim = cases.filter((c) => c.regole.includes("verbatim"));
    expect(verbatim.length).toBeGreaterThan(0);
    for (const c of verbatim) {
      const record = c.citazioniAttese.find((x) => x.dataset === "promesse")?.record;
      expect(c.testoVerbatim, c.id).toBe(promises.get(record ?? ""));
    }
  });

  it("ogni risposta sui dati cita un record con un URL presente nei dati", () => {
    const answered = cases.filter((c) => c.esitoAtteso !== "astensione" && c.categoria !== "trasparenza" && c.id !== "MAN-COR-03");
    for (const c of answered) {
      expect(c.citazioniAttese.length, c.id).toBeGreaterThan(0);
      for (const url of c.citazioniAttese.flatMap((x) => x.urlAccettati)) expect(allData.includes(url), `${c.id} ${url}`).toBe(true);
    }
  });

  it("le astensioni non si aspettano valori", () => {
    expect(cases.filter((c) => c.esitoAtteso === "astensione" && c.valoriAttesi.length).map((c) => c.id)).toEqual([]);
  });

  it("ogni partito con promesse pubblicate ha almeno un caso", () => {
    const withPromises = new Set((data.promesse as { partitoId: string }[]).map((p) => p.partitoId));
    const covered = new Set(cases.filter((c) => c.categoria === "promesse").map((c) => c.id.split("-")[2]));
    expect([...withPromises].filter((p) => !covered.has(p))).toEqual([]);
  });
});
