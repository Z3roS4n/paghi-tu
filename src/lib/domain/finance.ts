import { COFOG_DIVISIONS, type PublicFinance, type SpendingByFunctionYear } from "./schemas.ts";

type Voci = SpendingByFunctionYear["voci"];
type DebtPoint = PublicFinance["debitoMensile"][number];

// Righe dello scontrino: si escludono a vicenda e sommano al totale della spesa per funzione.
// Pensioni e interessi escono dalla loro divisione COFOG perché da soli pesano quanto intere funzioni.
export const RECEIPT_LINES: { id: string; etichetta: string; importo: (v: Voci) => number }[] = [
  { id: "pensioni", etichetta: "Pensioni di vecchiaia e ai superstiti", importo: (v) => v.GF1002 + v.GF1003 },
  { id: "sanita", etichetta: COFOG_DIVISIONS["07"], importo: (v) => v.GF07 },
  { id: "altra-protezione", etichetta: "Altra protezione sociale", importo: (v) => v.GF10 - v.GF1002 - v.GF1003 },
  { id: "affari-economici", etichetta: COFOG_DIVISIONS["04"], importo: (v) => v.GF04 },
  { id: "interessi", etichetta: "Interessi e altre spese sul debito pubblico", importo: (v) => v.GF0107 },
  { id: "istruzione", etichetta: COFOG_DIVISIONS["09"], importo: (v) => v.GF09 },
  { id: "servizi-generali", etichetta: "Altri servizi generali", importo: (v) => v.GF01 - v.GF0107 },
  { id: "sicurezza", etichetta: COFOG_DIVISIONS["03"], importo: (v) => v.GF03 },
  { id: "difesa", etichetta: COFOG_DIVISIONS["02"], importo: (v) => v.GF02 },
  { id: "territorio", etichetta: COFOG_DIVISIONS["06"], importo: (v) => v.GF06 },
  { id: "ambiente", etichetta: COFOG_DIVISIONS["05"], importo: (v) => v.GF05 },
  { id: "cultura", etichetta: COFOG_DIVISIONS["08"], importo: (v) => v.GF08 },
];

export const HAS_RECEIPT_DETAIL = (v: Voci) => ["GF1002", "GF1003", "GF0107"].every((c) => c in v);

/** Euro per residente da un importo in milioni di euro. */
export function perResident(millions: number, population: number) {
  return (millions * 1e6) / population;
}

export function receipt(year: SpendingByFunctionYear, population: number) {
  const righe = RECEIPT_LINES.map((l) => {
    const mln = l.importo(year.voci);
    return { id: l.id, etichetta: l.etichetta, mln, euro: perResident(mln, population), quota: mln / year.totale };
  }).toSorted((a, b) => b.mln - a.mln);
  return { anno: year.anno, righe, totaleEuro: perResident(year.totale, population) };
}

const monthOf = (iso: string) => iso.slice(0, 7);
function previousMonth(month: string) {
  const [y, m] = month.split("-").map(Number);
  return m === 1 ? `${y - 1}-12` : `${y}-${String(m - 1).padStart(2, "0")}`;
}

/**
 * Debito alla fine del mese prima dell'insediamento e alla fine del mese prima della chiusura
 * (o all'ultimo mese disponibile): così un mese non viene mai contato per due governi.
 */
export function debtDuring(points: DebtPoint[], start: string, end: string | null) {
  const byMonth = new Map(points.map((p) => [p.mese, p.valore]));
  const startMonth = previousMonth(monthOf(start));
  const last = points.at(-1)!;
  const endMonth = end && previousMonth(monthOf(end)) <= last.mese ? previousMonth(monthOf(end)) : last.mese;
  const inizio = byMonth.get(startMonth);
  const fine = byMonth.get(endMonth);
  if (inizio === undefined || fine === undefined) return null;
  return {
    inizio: { mese: startMonth, valore: inizio },
    fine: { mese: endMonth, valore: fine, parziale: end === null || previousMonth(monthOf(end)) > last.mese },
    variazione: fine - inizio,
  };
}

/**
 * Debito in % del PIL per anno: dal 1995 il valore Eurostat; prima, debito di dicembre
 * (Banca d'Italia) diviso per il PIL della nostra serie. Il secondo è un nostro calcolo.
 */
export type DebtRatio = { anno: number; valore: number; calcolatoDa: "fonte" | "paghi_tu" };

export function debtToGdp(finance: Pick<PublicFinance, "debitoMensile" | "debitoPil">, gdp: Map<number, number>): DebtRatio[] {
  const eurostat = new Map(finance.debitoPil.map((d) => [d.anno, d.valore]));
  const firstEurostat = Math.min(...eurostat.keys());
  return finance.debitoMensile
    .filter((d) => d.mese.endsWith("-12"))
    .flatMap((d): DebtRatio[] => {
      const anno = Number(d.mese.slice(0, 4));
      if (anno >= firstEurostat) {
        const v = eurostat.get(anno);
        return v === undefined ? [] : [{ anno, valore: v, calcolatoDa: "fonte" }];
      }
      const g = gdp.get(anno);
      return g === undefined ? [] : [{ anno, valore: (d.valore / g) * 100, calcolatoDa: "paghi_tu" }];
    });
}

/** Porta un importo dell'anno in euro del 2025 con il coefficiente ISTAT di rivalutazione. */
export function toEuro2025(value: number, year: number, coefficients: Map<number, number>) {
  const k = coefficients.get(year);
  return k === undefined ? null : value * k;
}
