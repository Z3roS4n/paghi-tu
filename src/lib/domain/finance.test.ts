import { describe, expect, it } from "vitest";
import financeJson from "../../../data/finanza-pubblica.json";
import gdpJson from "../../../data/serie/pil-nominale.json";
import { HAS_RECEIPT_DETAIL, debtDuring, debtToGdp, perResident, receipt } from "./finance.ts";
import { PublicFinance, Series } from "./schemas.ts";

const finance = PublicFinance.parse(financeJson);
const gdp = new Map(Series.parse(gdpJson).punti.map((p) => [p.anno, p.valore]));

describe("finanza pubblica", () => {
  it("tutti i controlli incrociati risultano superati", () => {
    expect(finance.controlli.filter((c) => !c.superato)).toEqual([]);
  });

  it("le righe dello scontrino sommano al totale, senza voci negative", () => {
    for (const year of finance.funzioni.filter((f) => HAS_RECEIPT_DETAIL(f.voci))) {
      const r = receipt(year, 59_000_000);
      expect(r.righe.every((x) => x.mln >= 0)).toBe(true);
      expect(r.righe.reduce((s, x) => s + x.mln, 0)).toBeCloseTo(year.totale, 0);
    }
  });

  it("converte milioni in euro per residente", () => {
    expect(perResident(59, 59_000_000)).toBe(1);
  });

  it("prende il debito della fine del mese prima dell'insediamento", () => {
    const d = debtDuring(finance.debitoMensile, "2022-10-22", null)!;
    expect(d.inizio.mese).toBe("2022-09");
    expect(d.fine.parziale).toBe(true);
    expect(d.variazione).toBeCloseTo(d.fine.valore - d.inizio.valore, 6);
  });

  it("due governi consecutivi non contano lo stesso mese", () => {
    const before = debtDuring(finance.debitoMensile, "2021-02-13", "2022-10-22")!;
    const after = debtDuring(finance.debitoMensile, "2022-10-22", null)!;
    expect(before.fine.mese).toBe(after.inizio.mese);
  });

  it("non inventa un debito prima della serie", () => {
    expect(debtDuring(finance.debitoMensile, "1900-01-15", "1901-01-01")).toBeNull();
  });

  it("il debito/PIL calcolato da noi si raccorda con quello Eurostat", () => {
    const series = debtToGdp(finance, gdp);
    const ours = series.find((d) => d.anno === 1994)!;
    const eurostat = series.find((d) => d.anno === 1995)!;
    expect(ours.calcolatoDa).toBe("paghi_tu");
    expect(eurostat.calcolatoDa).toBe("fonte");
    expect(Math.abs(ours.valore - eurostat.valore)).toBeLessThan(8);
  });
});
