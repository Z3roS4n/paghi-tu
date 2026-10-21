import { formatDecimal, formatInt } from "./format";

export type ChartUnit = "euro" | "pct" | "eur100";

export function niceStep(range: number, target: number) {
  const raw = range / target;
  const mag = 10 ** Math.floor(Math.log10(raw));
  return [1, 2, 2.5, 5, 10].map((m) => m * mag).find((s) => s >= raw) ?? 10 * mag;
}

/** Tacche "tonde" che coprono [min, max]; lo zero entra solo se è già nell'intervallo. */
export function niceTicks(min: number, max: number, target = 4) {
  const step = niceStep(max - min || Math.abs(max) || 1, target);
  const from = Math.floor(min / step) * step;
  const to = Math.ceil(max / step) * step;
  return Array.from({ length: Math.round((to - from) / step) + 1 }, (_, i) => Number((from + i * step).toFixed(6)));
}

export function formatChartValue(v: number, unit: ChartUnit, mode: "axis" | "full") {
  if (unit === "pct") return mode === "axis" ? `${formatInt(v)}%` : `${formatDecimal(v, 1)}%`;
  if (unit === "eur100") return mode === "axis" ? `${formatInt(v)} €` : `${formatDecimal(v, 1)} € ogni 100`;
  return `${formatInt(v)} €`;
}
