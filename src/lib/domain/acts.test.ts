import { describe, expect, it } from "vitest";
import { COST_NATURES, SAVING_NATURES, parseYearAmounts, yearlyTotals } from "./acts.ts";

describe("parseYearAmounts", () => {
  it("legge anni e decimali col punto, in ordine di anno", () => {
    expect(parseYearAmounts("2027:60; 2026:45.2")).toEqual([
      { anno: 2026, mln: 45.2 },
      { anno: 2027, mln: 60 },
    ]);
  });

  it("rifiuta la virgola decimale e gli anni ripetuti", () => {
    expect(() => parseYearAmounts("2026:45,2")).toThrow();
    expect(() => parseYearAmounts("2026:1;2026:2")).toThrow();
  });
});

describe("yearlyTotals", () => {
  const measures = [
    { natura: "spesa" as const, importi: [{ anno: 2026, mln: 45.2 }] },
    { natura: "minori_entrate" as const, importi: [{ anno: 2026, mln: 60.1 }, { anno: 2027, mln: 10 }] },
    { natura: "maggiori_entrate" as const, importi: [{ anno: 2026, mln: 5 }] },
  ];

  it("somma per anno solo le nature richieste", () => {
    expect(yearlyTotals(measures, COST_NATURES)).toEqual([
      { anno: 2026, mln: 105.3 },
      { anno: 2027, mln: 10 },
    ]);
    expect(yearlyTotals(measures, SAVING_NATURES)).toEqual([{ anno: 2026, mln: 5 }]);
  });
});
