import { z } from "zod";

const isoDate = z.iso.date();

export const VerificationLevel = z.enum(["V1", "V2", "NV"]);
export type VerificationLevel = z.infer<typeof VerificationLevel>;

// Il livello è il più basso fra quelli citati nel dettaglio: un record con anche un solo
// campo V2 non viene mai mostrato come pienamente verificato.
export const Verification = z.object({
  livello: VerificationLevel,
  campi: z.record(z.string(), VerificationLevel).optional(),
  dettaglio: z.string(),
});
export type Verification = z.infer<typeof Verification>;

export const SourceLink = z.object({
  url: z.url(),
  etichetta: z.string().optional(),
});
export type SourceLink = z.infer<typeof SourceLink>;

export const Reuse = z.enum(["si", "con_citazione", "con_permesso"]);

export const Source = z.object({
  id: z.string().regex(/^R-\d{2}$/),
  ente: z.string(),
  dataset: z.string(),
  copertura: z.string(),
  accesso: z.string(),
  licenza: z.string(),
  riuso: Reuse,
  aggiornamento: z.string(),
  fonteDiVeritaPer: z.string(),
});
export type Source = z.infer<typeof Source>;

export const Legislature = z.object({
  id: z.string(),
  numero: z.number().int().min(0),
  inizio: isoDate,
  fine: isoDate.nullable(),
  elezioni: isoDate.nullable(),
  sistemaElettorale: z.string(),
  fonti: z.array(SourceLink).min(1),
  verifica: Verification,
});
export type Legislature = z.infer<typeof Legislature>;

export const Government = z.object({
  id: z.string().regex(/^g\d+$/),
  ordine: z.number().int().positive(),
  nome: z.string(),
  presidente: z.string(),
  legislaturaId: z.string(),
  inizio: isoDate,
  fine: isoDate.nullable(),
  maggioranza: z.string(),
  tipo: z.string(),
  fonti: z.array(SourceLink).min(1),
  verifica: Verification,
});
export type Government = z.infer<typeof Government>;

export const BudgetActType = z.enum([
  "bilancio di previsione",
  "esercizio provvisorio",
  "legge finanziaria",
  "legge di stabilità",
  "legge di bilancio",
  "altro",
]);

export const BudgetLaw = z.object({
  id: z.string(),
  annoEsercizio: z.string(),
  annoInizio: z.number().int(),
  tipoAtto: BudgetActType,
  tipoAttoOriginale: z.string(),
  estremi: z.string(),
  governoProponenteId: z.string().nullable(),
  // "inferita": dedotta dalla data di presentazione rispetto al calendario dei governi.
  governoProponenteAttribuzione: z.enum(["documentata", "inferita", "incerta"]),
  governoProponenteTesto: z.string(),
  fonti: z.array(SourceLink),
  verifica: Verification,
});
export type BudgetLaw = z.infer<typeof BudgetLaw>;

export const SeriesPoint = z.object({
  anno: z.number().int(),
  valore: z.number(),
  nota: z.string().optional(),
});

export const Series = z.object({
  id: z.string(),
  titolo: z.string(),
  unita: z.string(),
  fonti: z.array(SourceLink).min(1),
  avvertenze: z.array(z.string()),
  punti: z.array(SeriesPoint).min(1),
  verifica: Verification,
});
export type Series = z.infer<typeof Series>;
