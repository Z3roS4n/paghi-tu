import { describe, expect, it } from "vitest";
import { daysBetween, formatDate, formatEuroMillions } from "./format.ts";

describe("format", () => {
  it("formatta le date in italiano senza slittare di fuso", () => {
    expect(formatDate("2022-10-22")).toBe("22 ottobre 2022");
  });

  it("conta i giorni fra due date", () => {
    expect(daysBetween("2024-02-28", "2024-03-01")).toBe(2);
  });

  it("passa ai miliardi sopra i mille milioni", () => {
    expect(formatEuroMillions(2_265_002.5)).toBe("2.265,0 mld €");
    expect(formatEuroMillions(904)).toBe("904 mln €");
  });
});
