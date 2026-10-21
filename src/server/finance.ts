import "server-only";
import {
  HAS_RECEIPT_DETAIL,
  debtDuring,
  debtToGdp,
  fractionalYear,
  functionShares,
  perResident,
  receipt,
  sameQuartersComparison,
  toEuro2025,
  waffleSteps,
} from "@/lib/domain/finance";
import type { Government } from "@/lib/domain/schemas";
import { finance, governments, measures, series } from "./data";

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

export function semesterUpdate() {
  return sameQuartersComparison(finance.trimestri);
}

/** Debito di fine mese in miliardi, dal mese indicato all'ultimo disponibile. */
export function monthlyDebtSince(month: string) {
  const points = finance.debitoMensile.filter((d) => d.mese >= month);
  const last = points.at(-1)!;
  const december = finance.debitoMensile.findLast((d) => d.mese.endsWith("-12") && d.mese < last.mese)!;
  return {
    punti: points.map((p) => ({ mese: p.mese, mld: p.valore / 1000 })),
    dicembre: { mese: december.mese, mld: december.valore / 1000 },
    ultimo: { mese: last.mese, mld: last.valore / 1000, provvisorio: isProvisionalDebt(last.mese) },
  };
}

/** Spesa ed entrate per residente in euro del 2025 e in % del PIL, sugli stessi anni. */
export function accountsOverTime() {
  const rows = accountsWithPopulation().flatMap((c) => {
    const spesa = toEuro2025(perResident(c.spesa, c.popolazioneMedia), c.anno, coefficients);
    const entrate = toEuro2025(perResident(c.entrate, c.popolazioneMedia), c.anno, coefficients);
    return spesa === null || entrate === null ? [] : [{ anno: c.anno, spesa, entrate, pil: c.pil }];
  });
  return { righe: rows, rottura: seriesBreaks[0] ?? null };
}

/** Interessi passivi ogni 100 euro di spesa pubblica, anno per anno. */
export function interestShareSeries() {
  return finance.conti.map((c) => ({ anno: c.anno, valore: (c.interessi / c.spesa) * 100 }));
}

const SHIFT_ROWS = [
  { id: "GF10", label: "Protezione sociale" },
  { id: "GF07", label: "Sanità" },
  { id: "GF01", label: "Servizi generali, compresi gli interessi" },
  { id: "GF04", label: "Affari economici" },
  { id: "GF09", label: "Istruzione" },
] as const;

/** Quote su 100 euro di spesa nel primo e nell'ultimo anno con la spesa per funzione. */
export function functionShift() {
  const first = finance.funzioni[0];
  const last = finance.funzioni.at(-1)!;
  const a = functionShares(first);
  const b = functionShares(last);
  const shown = new Set<string>(SHIFT_ROWS.map((r) => r.id));
  const others = (s: Record<string, number>) => Object.entries(s).filter(([k]) => !shown.has(k)).reduce((t, [, v]) => t + v, 0);
  return {
    da: first.anno,
    a: last.anno,
    righe: SHIFT_ROWS.map((r) => ({ id: r.id, label: r.label, from: a[r.id], to: b[r.id] })),
    altre: { from: others(a), to: others(b) },
  };
}

export function waffle() {
  const r = latestReceipt();
  const interest = interestShareSeries();
  return {
    receipt: r,
    passi: waffleSteps(r, 6),
    interessiPrimoAnno: interest[0],
    interessiStessoAnno: interest.find((d) => d.anno === r.anno) ?? interest.at(-1)!,
  };
}

export const euComparison = finance.confrontoUe;

/** Scostamenti fra previsto e consuntivo dove le due cifre misurano la stessa cosa. */
export function measureDeviations() {
  const rows = measures.flatMap((m) =>
    m.confronti
      .filter((c) => c.scostamento?.pct != null && c.omogeneita !== "non_omogeneo")
      .map((c) => ({ misura: m, confronto: c, pct: c.scostamento!.pct! })),
  );
  return {
    stima: rows.filter((r) => r.confronto.tipoOnere === "stima"),
    tetto: rows.filter((r) => r.confronto.tipoOnere === "tetto"),
  };
}

const EU_ROWS = [
  { id: "vecchiaia", label: "Vecchiaia e superstiti", codes: ["GF1002", "GF1003"] },
  { id: "sanita", label: "Sanità", codes: ["GF07"] },
  { id: "affari", label: "Affari economici", codes: ["GF04"] },
  { id: "istruzione", label: "Istruzione", codes: ["GF09"] },
  { id: "interessi", label: "Interessi sul debito", codes: ["GF0107"] },
] as const;

/** Righe del confronto europeo: spesa per funzione in % del PIL, Italia e gli altri. */
export function euFunctionRows() {
  const v = finance.confrontoUe.funzioni.valori;
  const sum = (geo: keyof typeof v, codes: readonly string[]) => codes.reduce((s, c) => s + v[geo][c], 0);
  return EU_ROWS.map((r) => ({
    id: r.id,
    label: r.label,
    it: sum("IT", r.codes),
    others: { DE: sum("DE", r.codes), FR: sum("FR", r.codes), ES: sum("ES", r.codes), EU27_2020: sum("EU27_2020", r.codes) },
  }));
}

/** Debito sul PIL dal dopoguerra con le fasce dei governi, e per ogni governo i numeri del mandato. */
export function debtByGovernment() {
  const years = debtGdpSeries.map((d) => d.anno);
  const lastEstimate = debtGdpSeries.findLastIndex((d) => d.calcolatoDa === "paghi_tu");
  const now = fractionalYear(finance.scaricato.slice(0, 10));
  const cards = governments.map((g) => {
    const m = governmentFinance(g);
    return {
      id: g.id,
      nome: g.nome.replace(/^Governo\s+/, ""),
      presidente: g.presidente,
      inizio: g.inizio,
      fine: g.fine,
      from: fractionalYear(g.inizio),
      to: g.fine ? fractionalYear(g.fine) : now,
      debito: m.debito ? { variazione: m.debito.variazione, parziale: m.debito.fine.parziale } : null,
      prima: m.debitoPil.prima,
      dopo: m.debitoPil.fine,
      livello: g.verifica.livello,
    };
  });
  return {
    chart: {
      label: "Debito pubblico in % del PIL, a fine anno",
      years,
      unit: "pct" as const,
      yMin: 0,
      series: [
        {
          id: "debito",
          name: "Debito",
          tone: "accent" as const,
          values: debtGdpSeries.map((d) => d.valore),
          estimatedUntil: lastEstimate >= 0 ? lastEstimate : undefined,
        },
      ],
      bands: cards.map((c) => ({ name: c.nome, from: c.from, to: c.to })),
      height: 340,
    },
    cards,
  };
}
