import "server-only";
import { z } from "zod";
import budgetLawsJson from "../../data/leggi-bilancio.json";
import governmentsJson from "../../data/governi.json";
import legislaturesJson from "../../data/legislature.json";
import sourcesJson from "../../data/fonti.json";
import gdpJson from "../../data/serie/pil-nominale.json";
import populationJson from "../../data/serie/popolazione-residente.json";
import foiJson from "../../data/serie/prezzi-consumo-foi.json";
import { BudgetLaw, Government, Legislature, Series, Source } from "@/lib/domain/schemas";

export const DATA_SNAPSHOT = "2026-10-20";

// I JSON sono importati staticamente: vengono validati una volta in build e finiscono nel
// bundle del server, così ogni pagina resta prerenderizzabile senza I/O a runtime.
export const legislatures = z.array(Legislature).parse(legislaturesJson);
export const governments = z.array(Government).parse(governmentsJson);
export const budgetLaws = z.array(BudgetLaw).parse(budgetLawsJson);
export const sources = z.array(Source).parse(sourcesJson);
export const series = {
  gdp: Series.parse(gdpJson),
  population: Series.parse(populationJson),
  foi: Series.parse(foiJson),
};

export function getGovernment(id: string) {
  return governments.find((g) => g.id === id);
}

export function getLegislature(id: string) {
  return legislatures.find((l) => l.id === id);
}

export function budgetLawsProposedBy(governmentId: string) {
  return budgetLaws.filter((l) => l.governoProponenteId === governmentId);
}

export function governmentsOf(legislatureId: string) {
  return governments.filter((g) => g.legislaturaId === legislatureId);
}
