import "server-only";
import { daysBetween } from "@/lib/format";
import { DATA_SNAPSHOT, budgetLaws, governments, series } from "./data";

export function governmentDurationDays(g: { inizio: string; fine: string | null }) {
  return daysBetween(g.inizio, g.fine ?? DATA_SNAPSHOT);
}

function lastPoint(points: { anno: number; valore: number; nota?: string }[]) {
  return points.reduce((a, b) => (b.anno > a.anno ? b : a));
}

export function homeStats() {
  const ended = governments.filter((g) => g.fine !== null);
  const current = governments.find((g) => g.fine === null);
  const meanDays = Math.round(ended.reduce((sum, g) => sum + governmentDurationDays(g), 0) / ended.length);
  const first = governments.reduce((a, b) => (b.inizio < a.inizio ? b : a));

  return {
    governmentCount: governments.length,
    firstGovernmentStart: first.inizio,
    meanDurationDays: meanDays,
    endedCount: ended.length,
    current,
    currentDurationDays: current ? governmentDurationDays(current) : null,
    budgetLawCount: budgetLaws.length,
    gdp: lastPoint(series.gdp.punti),
    population: lastPoint(series.population.punti),
  };
}
