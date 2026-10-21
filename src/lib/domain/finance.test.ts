import { describe, expect, it } from "vitest";
import financeJson from "../../../data/finanza-pubblica.json";
import gdpJson from "../../../data/serie/pil-nominale.json";
import {
  HAS_RECEIPT_DETAIL,
  debtDuring,
  debtToGdp,
  fractionalYear,
  functionShares,
  perResident,
  receipt,
  sameQuartersComparison,
  waffleSteps,
} from "./finance.ts";
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

describe("confronti per il sito", () => {
  it("confronta gli stessi trimestri di due anni", () => {
    const c = sameQuartersComparison(finance.trimestri);
    const last = finance.trimestri.at(-1)!;
    expect(c.anno).toBe(Number(last.periodo.slice(0, 4)));
    const spesa = c.voci.find((v) => v.id === "spesa")!;
    const q = (p: string) => finance.trimestri.find((t) => t.periodo === p)!.spesa;
    const n = Number(last.periodo.slice(-1));
    const expected = Array.from({ length: n }, (_, i) => q(`${c.anno}-Q${i + 1}`)).reduce((a, b) => a + b, 0);
    expect(spesa.dopo).toBeCloseTo(expected, 3);
  });

  it("i quadretti partono uno dopo l'altro e sommano a circa 100", () => {
    const year = finance.funzioni.filter((f) => HAS_RECEIPT_DETAIL(f.voci)).at(-1)!;
    const steps = waffleSteps(receipt(year, 59_000_000), 6);
    expect(steps).toHaveLength(7);
    for (let i = 1; i < steps.length; i++) expect(steps[i].da).toBe(steps[i - 1].da + steps[i - 1].su100);
    const total = steps.reduce((s, x) => s + x.su100, 0);
    expect(total).toBeGreaterThanOrEqual(98);
    expect(total).toBeLessThanOrEqual(102);
  });

  it("le quote per funzione sommano a 100", () => {
    const shares = functionShares(finance.funzioni.at(-1)!);
    expect(Object.values(shares).reduce((a, b) => a + b, 0)).toBeCloseTo(100, 1);
  });

  it("l'anno con decimali parte da gennaio e cresce col giorno", () => {
    expect(fractionalYear("2022-01-01")).toBe(2022);
    expect(fractionalYear("2022-10-22")).toBeCloseTo(2022 + 294 / 365, 6);
    expect(fractionalYear("2024-12-31")).toBeLessThan(2025);
  });
});
