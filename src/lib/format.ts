const dateFmt = new Intl.DateTimeFormat("it-IT", { day: "numeric", month: "long", year: "numeric", timeZone: "UTC" });
const intFmt = new Intl.NumberFormat("it-IT", { maximumFractionDigits: 0, useGrouping: "always" });

export function formatDate(iso: string): string {
  return dateFmt.format(new Date(`${iso}T00:00:00Z`));
}

export function formatInt(n: number): string {
  return intFmt.format(n);
}

export function formatDecimal(n: number, digits: number): string {
  return new Intl.NumberFormat("it-IT", { minimumFractionDigits: digits, maximumFractionDigits: digits, useGrouping: "always" }).format(n);
}

export function daysBetween(fromIso: string, toIso: string): number {
  const ms = Date.parse(`${toIso}T00:00:00Z`) - Date.parse(`${fromIso}T00:00:00Z`);
  return Math.round(ms / 86_400_000);
}

export function formatEuroMillions(millions: number): string {
  if (Math.abs(millions) >= 1000) return `${formatDecimal(millions / 1000, 1)} mld €`;
  return `${formatInt(millions)} mln €`;
}

const exactMlnFmt = new Intl.NumberFormat("it-IT", { maximumFractionDigits: 3, useGrouping: "always" });

/** Milioni come scritti nella fonte, senza arrotondare né passare ai miliardi: 45.2 → "45,2 mln €". */
export function formatExactMillions(millions: number): string {
  return `${exactMlnFmt.format(millions)} mln €`;
}

const monthFmt = new Intl.DateTimeFormat("it-IT", { month: "long", year: "numeric", timeZone: "UTC" });

/** "2026-08" → "agosto 2026". */
export function formatMonth(month: string): string {
  return monthFmt.format(new Date(`${month}-01T00:00:00Z`));
}
