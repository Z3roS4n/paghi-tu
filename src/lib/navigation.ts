export const MAIN_NAV = [
  { href: "/spesa", label: "Spesa" },
  { href: "/governi", label: "Governi" },
  { href: "/leggi-di-bilancio", label: "Leggi di bilancio" },
  { href: "/promesse", label: "Promesse" },
  { href: "/misure", label: "Misure" },
  { href: "/archivio", label: "Archivio" },
  { href: "/metodo", label: "Metodo" },
] as const;

export const DOCK_NAV = [
  { href: "/spesa", label: "Spesa", icon: "receipt" },
  { href: "/governi", label: "Governi", icon: "bank" },
  { href: "/promesse", label: "Promesse", icon: "quotes" },
  { href: "/misure", label: "Misure", icon: "scales" },
] as const;

export const MORE_NAV = [
  { href: "/leggi-di-bilancio", label: "Leggi di bilancio", hint: "le manovre anno per anno" },
  { href: "/archivio", label: "Archivio", hint: "cerca fra governi, manovre, misure e promesse" },
  { href: "/metodo", label: "Metodo", hint: "come verifichiamo, cosa vogliono dire V1 e V2" },
  { href: "/fonti", label: "Fonti", hint: "da dove vengono i numeri" },
  { href: "/correzioni", label: "Correzioni", hint: "il registro di cosa abbiamo cambiato" },
  { href: "/chi-siamo", label: "Chi siamo", hint: "un progetto aperto" },
] as const;

export function isCurrent(path: string, href: string) {
  return path === href || path.startsWith(`${href}/`);
}
