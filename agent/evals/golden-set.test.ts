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

  it("ogni valore e ogni URL attesi stanno nel record citato", () => {
    const finance = data.finanzaPubblica as Record<string, unknown> & { fonti: unknown; confrontoUe: Record<string, unknown> };
    const keyOf: Record<string, string> = { conti: "anno", funzioni: "anno", debitoPil: "anno", trimestri: "periodo", debitoMensile: "mese" };
    const byId = (list: unknown, id: string) => (list as { id: string }[]).find((r) => r.id === id);
    const resolve = (dataset: string, record: string): unknown => {
      if (dataset === "misure") {
        return (data.misure as { confronti: { id: string }[] }[]).flatMap((m) => m.confronti).find((c) => c.id === record);
      }
      if (dataset === "finanza-pubblica") {
        const [section, key, extra] = record.split("/");
        if (section === "confrontoUe") return { valori: finance.confrontoUe[key], fonti: finance.fonti, extra };
        const row = (finance[section] as Record<string, unknown>[]).find((r) => String(r[keyOf[section]]) === key);
        return row && { row, fonti: finance.fonti };
      }
      if (dataset.startsWith("serie/")) {
        const s = data.serie[dataset.slice(6)] as { punti: { anno: number }[]; fonti: unknown };
        const point = s.punti.find((p) => String(p.anno) === record);
        return point && { point, fonti: s.fonti };
      }
      const lists: Record<string, unknown> = {
        governi: data.governi, legislature: data.legislature, "leggi-bilancio": data.leggiBilancio,
        promesse: data.promesse, correzioni: data.correzioni,
      };
      return byId(lists[dataset], record);
    };
    const problems: string[] = [];
    for (const c of cases.filter((x) => x.citazioniAttese.length)) {
      const records = c.citazioniAttese.map((cit) => {
        const r = resolve(cit.dataset, cit.record);
        if (!r) problems.push(`${c.id}: record ${cit.dataset}/${cit.record} inesistente`);
        const blob = JSON.stringify(r ?? null);
        for (const url of cit.urlAccettati) if (!blob.includes(url)) problems.push(`${c.id}: ${url} non è nel record`);
        return blob;
      });
      const all = records.join(" ");
      for (const v of c.valoriAttesi) {
        if (v.valore !== null && !all.includes(JSON.stringify(v.valore))) problems.push(`${c.id}: ${v.campo}=${v.valore} non è nel record`);
      }
    }
    expect(problems).toEqual([]);
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
