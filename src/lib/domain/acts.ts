import type { ActMeasure, ActMeasureNature, LegalActType, YearAmount } from "./schemas.ts";

export const LEGAL_ACT_TYPE: Record<LegalActType, string> = {
  decreto_legge: "Decreto-legge",
  legge: "Legge",
  decreto_legislativo: "Decreto legislativo",
  legge_di_bilancio: "Legge di bilancio",
};

// Formato dei CSV di ricerca: «2026:45.2;2027:60», milioni di euro, un anno per voce.
export function parseYearAmounts(field: string): YearAmount[] {
  const items = field
    .split(";")
    .map((s) => s.trim())
    .filter(Boolean)
    .map((s) => {
      const m = s.match(/^(\d{4})\s*:\s*(\d+(?:\.\d+)?)$/);
      if (!m) throw new Error(`importo non leggibile: «${s}»`);
      return { anno: Number(m[1]), mln: Number(m[2]) };
    });
  const years = items.map((i) => i.anno);
  if (new Set(years).size !== years.length) throw new Error(`anno ripetuto in «${field}»`);
  return items.toSorted((a, b) => a.anno - b.anno);
}

export const COST_NATURES: readonly ActMeasureNature[] = ["spesa", "minori_entrate"];
export const SAVING_NATURES: readonly ActMeasureNature[] = ["maggiori_entrate", "minori_spese"];

// Somme per anno delle sole misure registrate, separate per verso: non è il saldo ufficiale dell'atto,
// che conta anche le coperture.
export function yearlyTotals(measures: Pick<ActMeasure, "natura" | "importi">[], natures: readonly ActMeasureNature[]) {
  const byYear = new Map<number, number>();
  for (const m of measures) {
    if (!natures.includes(m.natura)) continue;
    for (const { anno, mln } of m.importi) byYear.set(anno, (byYear.get(anno) ?? 0) + mln);
  }
  return [...byYear].map(([anno, mln]) => ({ anno, mln: Math.round(mln * 1000) / 1000 })).toSorted((a, b) => a.anno - b.anno);
}
