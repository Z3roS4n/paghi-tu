import type { Measure } from "./schemas.ts";

// D-021: il costo di una promessa è sempre quello dichiarato dal proponente. Paghi Tu lo traduce
// in euro per residente e lo mette accanto a quanto sono costate davvero misure dello stesso tipo.
export const PRECEDENT_FAMILIES = {
  pensionamento_anticipato: { etichetta: "uscita anticipata dal lavoro", misure: ["quota-100", "salvaguardie-esodati-chiuse"] },
  sostegno_reddito_poveri: { etichetta: "sostegno al reddito per chi è in povertà", misure: ["reddito-di-cittadinanza", "assegno-di-inclusione"] },
  bonus_edilizi: { etichetta: "detrazioni per lavori sugli edifici", misure: ["superbonus-110"] },
  assegni_figli: { etichetta: "assegni per i figli", misure: ["assegno-unico-universale"] },
  taglio_tasse_lavoro_dipendente: {
    etichetta: "taglio di tasse o contributi in busta paga",
    misure: ["bonus-80-euro", "riduzione-strutturale-cuneo-fiscale"],
  },
  tasse_prima_casa: { etichetta: "tasse sulla prima casa", misure: ["abolizione-ici-prima-casa"] },
  incentivi_assunzioni: { etichetta: "sgravi per le assunzioni", misure: ["esonero-contributivo-assunzioni-2015"] },
} as const;
export type PrecedentFamily = keyof typeof PRECEDENT_FAMILIES;

export type DeclaredCost = {
  natura: "spesa" | "minor_gettito" | "maggior_gettito" | "riallocazione" | "costo_zero" | "non_strutturabile";
  minMln: number | null;
  maxMln: number | null;
  periodo: "annuo" | "totale" | "non_indicato";
  anni: number | null;
};

/** Importo all'anno in milioni, solo se la dichiarazione lo permette senza ipotesi nostre. */
export function annualRange(c: DeclaredCost): [number, number] | null {
  if (c.minMln === null || c.maxMln === null) return null;
  if (c.periodo === "annuo") return [c.minMln, c.maxMln];
  if (c.periodo === "totale" && c.anni) return [c.minMln / c.anni, c.maxMln / c.anni];
  return null;
}

export type PrecedentComparison = { misuraId: string; titolo: string; periodo: string; pct: number };

// Solo stime (un tetto di spesa non è una stima) con basi omogenee o in parte omogenee e
// uno scostamento calcolato: gli altri confronti non dicono di quanto si è sbagliata la stima.
export function precedentComparisons(family: PrecedentFamily, measures: Measure[]): PrecedentComparison[] {
  const ids: readonly string[] = PRECEDENT_FAMILIES[family].misure;
  return measures
    .filter((m) => ids.includes(m.id))
    .flatMap((m) =>
      m.confronti.flatMap((c) => {
        const pct = c.scostamento?.pct;
        return c.tipoOnere === "stima" && c.omogeneita !== "non_omogeneo" && pct != null
          ? [{ misuraId: m.id, titolo: m.titolo, periodo: c.periodo, pct }]
          : [];
      }),
    );
}

/**
 * «Se andasse come le misure simili del passato»: il costo dichiarato corretto con lo scostamento
 * minimo e massimo dei precedenti. Un calcolo, non una previsione; solo per costi e minori entrate.
 */
export function precedentRange(c: DeclaredCost, comparisons: PrecedentComparison[]): [number, number] | null {
  const annual = annualRange(c);
  if (!annual || comparisons.length === 0 || (c.natura !== "spesa" && c.natura !== "minor_gettito")) return null;
  const pcts = comparisons.map((x) => x.pct);
  return [annual[0] * (1 + Math.min(...pcts) / 100), annual[1] * (1 + Math.max(...pcts) / 100)];
}

export const eurPerResident = (mln: number, population: number) => (mln * 1e6) / population;
