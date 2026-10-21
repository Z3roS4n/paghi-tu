import "server-only";
import {
  PRECEDENT_FAMILIES,
  annualRange,
  eurPerResident,
  precedentComparisons,
  precedentRange,
} from "@/lib/domain/promise-cost";
import { HAS_RECEIPT_DETAIL } from "@/lib/domain/finance";
import type { CofogDivision } from "@/lib/domain/schemas";
import { finance, measures, promiseCosts } from "./data";

const byId = new Map(promiseCosts.map((c) => [c.id, c]));
const population = finance.conti.findLast((c) => c.popolazioneMedia !== null)!;
const functions = finance.funzioni.findLast((f) => HAS_RECEIPT_DETAIL(f.voci))!;

export const costBase = { annoPopolazione: population.anno, annoFunzioni: functions.anno };

export function promiseCostView(id: string, cofog: CofogDivision) {
  const c = byId.get(id);
  if (!c) return null;
  const annual = c.costo ? annualRange(c.costo) : null;
  const pop = population.popolazioneMedia!;
  const functionSpending = functions.voci[`GF${cofog}`];
  const comparisons = c.famiglia ? precedentComparisons(c.famiglia, measures) : [];
  return {
    natura: c.costo?.natura ?? null,
    annuo: annual,
    perResidente: annual ? ([eurPerResident(annual[0], pop), eurPerResident(annual[1], pop)] as const) : null,
    quotaFunzione:
      // Solo per la spesa: una minore entrata confrontata con la spesa di una funzione dice poco.
      annual && functionSpending && c.costo?.natura === "spesa"
        ? ([annual[0] / functionSpending, annual[1] / functionSpending] as const)
        : null,
    famiglia: c.famiglia ? PRECEDENT_FAMILIES[c.famiglia].etichetta : null,
    precedenti: comparisons,
    sePrecedenti: c.costo ? precedentRange(c.costo, comparisons) : null,
  };
}
export type PromiseCostView = NonNullable<ReturnType<typeof promiseCostView>>;
