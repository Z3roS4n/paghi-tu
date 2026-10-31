import type { SourceLink } from "../../src/lib/domain/schemas.ts";
import { isWellFormedUrl } from "../evals/testo.ts";

export const FINANCE_SOURCES = {
  MAIN: "gov_10a_main, conti principali delle",
  FUNCTIONS: "gov_10a_exp, spesa delle amministrazioni pubbliche per funzione",
  EDP: "gov_10dd_edpt1, debito pubblico",
  QUARTERLY: "gov_10q_ggnfa",
  EU_FUNCTIONS: "spesa per funzione in % del PIL",
  EU_ACCOUNTS: "conti principali in % del PIL",
  EU_DEBT: "debito in % del PIL",
  BDI: "Banca d'Italia",
} as const;

export const MONTHS = [
  "gennaio", "febbraio", "marzo", "aprile", "maggio", "giugno",
  "luglio", "agosto", "settembre", "ottobre", "novembre", "dicembre",
];

export function formatDateIt(iso: string): string {
  const [y, m, d] = iso.split("-").map(Number);
  return `${d === 1 ? "1°" : d} ${MONTHS[m - 1]} ${y}`;
}

export const EXCLUDED_DOMAINS = ["wikipedia.org"];

export function urls(links: SourceLink[]): string[] {
  return links
    .map((l) => l.url)
    .filter(isWellFormedUrl)
    .filter((u) => !EXCLUDED_DOMAINS.some((d) => new URL(u).hostname.endsWith(d)));
}
