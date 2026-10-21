export const ARCHIVE_KINDS = {
  governo: "Governi",
  legge: "Leggi di bilancio",
  misura: "Misure",
  promessa: "Promesse 2027",
} as const;
export type ArchiveKind = keyof typeof ARCHIVE_KINDS;

export type ArchiveEntry = {
  tipo: ArchiveKind;
  titolo: string;
  dettaglio: string;
  href: string;
  /** Data ISO o anno: serve per l'ordinamento, dal più recente. */
  data: string;
  /** Per le promesse: id e nome del partito, per il filtro. */
  partito?: { id: string; nome: string };
  /** Testo in cui cercare, già normalizzato. */
  testo: string;
};

export function normalize(s: string) {
  return s
    .normalize("NFD")
    .replace(/\p{M}/gu, "")
    .toLowerCase()
    .replace(/[^\p{L}\p{N}%]+/gu, " ")
    .trim();
}

/** Tutte le parole cercate devono comparire; i risultati più recenti vengono prima. */
export function searchArchive(
  entries: ArchiveEntry[],
  query: string,
  filter: { tipo: ArchiveKind | null; partito: string | null },
) {
  const words = normalize(query).split(" ").filter(Boolean);
  return entries
    .filter((e) => (filter.tipo ? e.tipo === filter.tipo : true))
    .filter((e) => (filter.partito ? e.partito?.id === filter.partito : true))
    .filter((e) => words.every((w) => e.testo.includes(w)))
    .toSorted((a, b) => b.data.localeCompare(a.data));
}
