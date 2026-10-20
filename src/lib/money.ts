export const LIRE_PER_EURO = 1936.27;

export type YearSeries = ReadonlyMap<number, number>;

export function lireToEuro(lire: number): number {
  return lire / LIRE_PER_EURO;
}

export function shareOfGdp(valueEur: number, gdpEur: number): number {
  if (gdpEur <= 0) throw new Error("PIL non positivo");
  return (valueEur / gdpEur) * 100;
}

export function constantEuro(
  valueEur: number,
  fromYear: number,
  toYear: number,
  priceIndex: YearSeries,
): number {
  const from = priceIndex.get(fromYear);
  const to = priceIndex.get(toYear);
  if (from === undefined || to === undefined) {
    throw new Error(`Indice dei prezzi mancante per ${from === undefined ? fromYear : toYear}`);
  }
  return valueEur * (to / from);
}

export function perCapita(valueEur: number, population: number): number {
  if (population <= 0) throw new Error("Popolazione non positiva");
  return valueEur / population;
}

export function toSeries(points: ReadonlyArray<{ anno: number; valore: number }>): YearSeries {
  return new Map(points.map((p) => [p.anno, p.valore]));
}
