import "server-only";
import { HAS_RECEIPT_DETAIL, debtDuring, debtToGdp, perResident, receipt, toEuro2025 } from "@/lib/domain/finance";
import type { Government } from "@/lib/domain/schemas";
import { finance, series } from "./data";

const gdp = new Map(series.gdp.punti.map((p) => [p.anno, p.valore]));
const population = new Map(series.population.punti.map((p) => [p.anno, p.valore]));
const coefficients = new Map(series.coefficients.punti.map((p) => [p.anno, p.valore]));

export const debtGdpSeries = debtToGdp(finance, gdp);
export const seriesBreaks = finance.conti.filter((c) => c.rotturaDiSerie).map((c) => c.anno);

// Banca d'Italia segna come provvisori i mesi dopo l'ultimo dicembre già notificato a Eurostat.
const lastNotifiedYear = Math.max(...finance.debitoPil.map((d) => d.anno));
export const isProvisionalDebt = (mese: string) => Number(mese.slice(0, 4)) > lastNotifiedYear;

function accountsWithPopulation() {
  return finance.conti.filter((c): c is typeof c & { popolazioneMedia: number } => c.popolazioneMedia !== null);
}

export function headline() {
  const c = accountsWithPopulation().at(-1)!;
  const pop = c.popolazioneMedia;
  const lastDebt = finance.debitoMensile.at(-1)!;
  const debtYear = Number(lastDebt.mese.slice(0, 4));
  const debtPop = population.get(debtYear) ?? pop;
  return {
    anno: c.anno,
    popolazione: pop,
    spesa: perResident(c.spesa, pop),
    entrate: perResident(c.entrate, pop),
    saldo: perResident(c.saldo, pop),
    interessi: perResident(c.interessi, pop),
    pil: c.pil,
    debito: {
      mese: lastDebt.mese,
      totale: lastDebt.valore,
      perResidente: perResident(lastDebt.valore, debtPop),
      popolazioneAnno: debtYear,
      provvisorio: isProvisionalDebt(lastDebt.mese),
    },
  };
}

export function latestReceipt() {
  const year = finance.funzioni.filter((f) => HAS_RECEIPT_DETAIL(f.voci)).at(-1)!;
  const c = finance.conti.find((x) => x.anno === year.anno);
  if (!c?.popolazioneMedia) throw new Error(`manca la popolazione media per il ${year.anno}`);
  return {
    ...receipt(year, c.popolazioneMedia),
    popolazione: c.popolazioneMedia,
    oltreLeEntrate: perResident(-c.saldo, c.popolazioneMedia),
  };
}

export function spendingPerResidentReal() {
  return accountsWithPopulation().flatMap((c) => {
    const v = toEuro2025(perResident(c.spesa, c.popolazioneMedia), c.anno, coefficients);
    return v === null ? [] : [{ anno: c.anno, valore: v }];
  });
}

export function accountsSeries(key: "spesa" | "entrate" | "saldo" | "interessi") {
  return finance.conti.map((c) => ({ anno: c.anno, valore: c.pil[key] }));
}

export function governmentFinance(g: Pick<Government, "inizio" | "fine">) {
  const debt = debtDuring(finance.debitoMensile, g.inizio, g.fine);
  const startYear = Number(g.inizio.slice(0, 4));
  const endYear = Number((g.fine ?? finance.scaricato).slice(0, 4));
  const ratio = new Map(debtGdpSeries.map((d) => [d.anno, d]));
  // Il rapporto è di fine anno: conta l'ultimo dicembre che cade dentro il mandato, con la stessa
  // regola delle fine mese del debito, così un dicembre non va a due governi.
  const endMonth = debt?.fine.mese ?? `${endYear}-12`;
  const lastDecember = Number(endMonth.slice(0, 4)) - (endMonth.endsWith("-12") ? 0 : 1);
  const lastRatio = debtGdpSeries.findLast((d) => d.anno <= lastDecember && d.anno >= startYear) ?? null;
  return {
    debito: debt,
    debitoPil: { prima: ratio.get(startYear - 1) ?? null, fine: lastRatio },
    anni: finance.conti.filter((c) => c.anno >= startYear && c.anno <= endYear),
  };
}
