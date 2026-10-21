import "server-only";
import { z } from "zod";
import budgetLawsJson from "../../data/leggi-bilancio.json";
import governmentsJson from "../../data/governi.json";
import legislaturesJson from "../../data/legislature.json";
import sourcesJson from "../../data/fonti.json";
import gdpJson from "../../data/serie/pil-nominale.json";
import populationJson from "../../data/serie/popolazione-residente.json";
import foiJson from "../../data/serie/prezzi-consumo-foi.json";
import coefficientsJson from "../../data/serie/coefficienti-rivalutazione-istat-2025.json";
import financeJson from "../../data/finanza-pubblica.json";
import measuresJson from "../../data/misure.json";
import partiesJson from "../../data/partiti.json";
import promisesJson from "../../data/promesse.json";
import promiseStatusJson from "../../data/promesse-stato.json";
import correctionsJson from "../../data/correzioni.json";
import {
  BudgetLaw,
  CampaignPromise,
  Correction,
  Government,
  Legislature,
  Measure,
  Party,
  PromiseCatalogStatus,
  PublicFinance,
  Series,
  Source,
} from "@/lib/domain/schemas";

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
  coefficients: Series.parse(coefficientsJson),
};
export const finance = PublicFinance.parse(financeJson);

export const measures = z.array(Measure).parse(measuresJson).toSorted((a, b) => a.annoAvvio - b.annoAvvio);
export const parties = z.array(Party).parse(partiesJson);
export const promises = z.array(CampaignPromise).parse(promisesJson);
export const promiseStatus = PromiseCatalogStatus.parse(promiseStatusJson);
export const corrections = z.array(Correction).parse(correctionsJson).toSorted((a, b) => b.id.localeCompare(a.id));

export function getGovernment(id: string) {
  return governments.find((g) => g.id === id);
}

export function getLegislature(id: string) {
  return legislatures.find((l) => l.id === id);
}

export function budgetLawsProposedBy(governmentId: string) {
  return budgetLaws.filter((l) => l.governoProponenteId === governmentId);
}

export function measuresOf(governmentId: string) {
  return measures.filter((m) => m.governiIds.includes(governmentId));
}

export function governmentsOf(legislatureId: string) {
  return governments.filter((g) => g.legislaturaId === legislatureId);
}

const collator = new Intl.Collator("it-IT", { sensitivity: "base", ignorePunctuation: true });

// Ordine alfabetico: nessun partito viene prima per peso elettorale o numero di promesse.
export function promisesByParty() {
  return parties
    .map((party) => ({ party, items: promises.filter((p) => p.partitoId === party.id).toSorted((a, b) => b.data.localeCompare(a.data)) }))
    .filter((g) => g.items.length > 0)
    .toSorted((a, b) => collator.compare(a.party.nome, b.party.nome));
}
