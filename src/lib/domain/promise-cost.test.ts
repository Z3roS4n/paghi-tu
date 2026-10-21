import { describe, expect, it } from "vitest";
import measuresJson from "../../../data/misure.json";
import { annualRange, eurPerResident, precedentComparisons, precedentRange, type DeclaredCost } from "./promise-cost.ts";
import { Measure } from "./schemas.ts";

const measures = Measure.array().parse(measuresJson);
const cost = (c: Partial<DeclaredCost>): DeclaredCost => ({
  natura: "spesa",
  minMln: 1000,
  maxMln: 1000,
  periodo: "annuo",
  anni: null,
  ...c,
});

describe("annualRange", () => {
  it("divide un totale per gli anni dichiarati", () => {
    expect(annualRange(cost({ minMln: 25000, maxMln: 25000, periodo: "totale", anni: 10 }))).toEqual([2500, 2500]);
  });

  it("non inventa un profilo annuale", () => {
    expect(annualRange(cost({ periodo: "totale" }))).toBeNull();
    expect(annualRange(cost({ periodo: "non_indicato" }))).toBeNull();
    expect(annualRange(cost({ minMln: null, maxMln: null }))).toBeNull();
  });
});

describe("precedenti", () => {
  it("esclude i tetti di spesa e i confronti non omogenei", () => {
    // RdC e assegno di inclusione hanno solo tetti di spesa; il Superbonus solo un confronto non omogeneo.
    expect(precedentComparisons("sostegno_reddito_poveri", measures)).toEqual([]);
    expect(precedentComparisons("bonus_edilizi", measures)).toEqual([]);
  });

  it("usa lo scostamento minimo e massimo dei precedenti", () => {
    const comps = precedentComparisons("pensionamento_anticipato", measures);
    expect(comps.length).toBeGreaterThan(0);
    const [lo, hi] = precedentRange(cost({}), comps)!;
    const pcts = comps.map((c) => c.pct);
    expect(lo).toBeCloseTo(1000 * (1 + Math.min(...pcts) / 100));
    expect(hi).toBeCloseTo(1000 * (1 + Math.max(...pcts) / 100));
  });

  it("non si applica alle maggiori entrate", () => {
    const comps = precedentComparisons("pensionamento_anticipato", measures);
    expect(precedentRange(cost({ natura: "maggior_gettito" }), comps)).toBeNull();
  });
});

it("traduce milioni in euro per residente", () => {
  expect(eurPerResident(1000, 50_000_000)).toBe(20);
});
