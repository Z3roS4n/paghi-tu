import { describe, expect, it } from "vitest";
import { z } from "zod";
import governmentsJson from "../../../data/governi.json";
import measuresJson from "../../../data/misure.json";
import { Government, Measure } from "./schemas.ts";

const governments = z.array(Government).parse(governmentsJson);
const measures = z.array(Measure).parse(measuresJson);
const comparisons = measures.flatMap((m) => m.confronti);

describe("integrità delle misure", () => {
  it("ogni misura è collegata a governi esistenti", () => {
    const ids = new Set(governments.map((g) => g.id));
    expect(measures.filter((m) => m.governiIds.some((id) => !ids.has(id))).map((m) => m.id)).toEqual([]);
  });

  it("con basi diverse non c'è scostamento", () => {
    expect(comparisons.filter((c) => c.omogeneita === "non_omogeneo" && c.scostamento).map((c) => c.id)).toEqual([]);
  });

  it("lo scostamento è sempre consuntivo meno previsto", () => {
    const wrong = comparisons.filter(
      (c) => c.scostamento && c.consuntivo && c.scostamento.eur !== c.consuntivo.importoEur - c.previsto.importoEur,
    );
    expect(wrong.map((c) => c.id)).toEqual([]);
  });

  it("senza consuntivo la confidenza è D", () => {
    expect(comparisons.filter((c) => !c.consuntivo && c.confidenza !== "D").map((c) => c.id)).toEqual([]);
  });

  it("il -36,2% di Quota 100 2019-2021 coincide con il dato UPB", () => {
    const q100 = comparisons.find((c) => c.id === "quota_100-1");
    expect(q100?.scostamento?.calcolatoDa).toBe("fonte");
    expect(q100?.scostamento?.pct?.toFixed(1)).toBe("-36.2");
  });
});
