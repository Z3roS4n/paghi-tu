import { describe, expect, it } from "vitest";
import { formatChartValue, niceStep, niceTicks } from "./chart.ts";

describe("assi dei grafici", () => {
  it("sceglie passi tondi", () => {
    expect(niceStep(100, 4)).toBe(25);
    expect(niceStep(7, 4)).toBe(2);
  });

  it("le tacche coprono l'intervallo e lo zero entra solo se c'è", () => {
    expect(niceTicks(0, 154.7)).toEqual([0, 50, 100, 150, 200]);
    const t = niceTicks(13765, 19633);
    expect(t[0]).toBeLessThanOrEqual(13765);
    expect(t.at(-1)).toBeGreaterThanOrEqual(19633);
    expect(t).not.toContain(0);
  });

  it("con un solo valore restituisce comunque un intervallo", () => {
    expect(niceTicks(5, 5).length).toBeGreaterThan(1);
  });

  it("formatta in italiano", () => {
    expect(formatChartValue(136.7, "pct", "full")).toBe("136,7%");
    expect(formatChartValue(19633, "euro", "axis")).toBe("19.633 €");
  });
});
