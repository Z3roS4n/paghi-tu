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

export const COFOG_DIVISIONS = {
  "01": "Servizi generali delle amministrazioni pubbliche",
  "02": "Difesa",
  "03": "Ordine pubblico e sicurezza",
  "04": "Affari economici",
  "05": "Protezione dell'ambiente",
  "06": "Abitazioni e assetto territoriale",
  "07": "Sanità",
  "08": "Attività ricreative, culturali e di culto",
  "09": "Istruzione",
  "10": "Protezione sociale",
} as const;
export const CofogDivision = z.enum(Object.keys(COFOG_DIVISIONS) as [keyof typeof COFOG_DIVISIONS]);
export type CofogDivision = z.infer<typeof CofogDivision>;

export const Party = z.object({
  id: z.string().regex(/^[A-Z0-9]+$/),
  nome: z.string(),
  coalizione: z.string(),
});
export type Party = z.infer<typeof Party>;

export const PromiseSourceType = z.enum([
  "programma",
  "documento_partito",
  "sito_ufficiale",
  "social_ufficiale",
  "discorso",
  "video",
  "intervista",
  "stenografico",
  "atto_parlamentare",
]);

export const PromiseHorizon = z.enum(["prossima_legislatura", "legislatura_in_corso", "non_specificato"]);
export const PromiseVehicle = z.enum([
  "programma",
  "documento_partito",
  "dichiarazione",
  "proposta_di_legge",
  "emendamento",
  "risoluzione_mozione",
  "richiesta_legge_bilancio",
  "richiesta_decreto",
  "appello_raccolta_firme",
  "altro",
]);

// Citazione breve ex art. 70 L. 633/1941: oltre i 320 caratteri si riassume, non si cita.
export const CampaignPromise = z.object({
  id: z.string().regex(/^C27-[A-Z0-9]+-\d{3}$/),
  partitoId: z.string(),
  dichiarante: z.string(),
  ruoloDichiarante: z.string(),
  data: isoDate,
  testoLetterale: z.string().min(1).max(320),
  parafrasiNeutra: z.string().min(1),
  tipoFonte: PromiseSourceType,
  orizzonte: PromiseHorizon,
  veicolo: PromiseVehicle,
  fonte: SourceLink,
  archivioUrl: z.url().nullable(),
  cofog: CofogDivision,
  misurabile: z.enum(["si", "parziale", "no"]),
  costoDichiarato: z.string().nullable(),
  stimaTerzi: z.object({ testo: z.string(), fonte: SourceLink }).nullable(),
  note: z.string(),
  verifica: Verification,
});
export type CampaignPromise = z.infer<typeof CampaignPromise>;

export const PromiseCatalogStatus = z.object({
  periodo: z.object({ dal: isoDate, al: isoDate }),
  censite: z.number().int().nonnegative(),
  verificate: z.number().int().nonnegative(),
  pubblicate: z.number().int().nonnegative(),
  gruppiPubblicati: z.array(z.string()),
  regolaPerimetro: z.enum(["tutte", "solo_fuori_legislatura_in_corso"]).nullable(),
});

// Regole della nota "costo delle misure": lo scostamento si deriva, non si scrive a mano, e
// con basi non omogenee si mostrano i due numeri affiancati senza percentuale.
export const Homogeneity = z.enum(["omogeneo", "parzialmente_omogeneo", "non_omogeneo"]);
export const Confidence = z.enum(["A", "B", "C", "D"]);

export const CostFigure = z.object({
  importoEur: z.number().nonnegative(),
  descrizione: z.string(),
  fonte: SourceLink,
});

export const CostComparison = z.object({
  id: z.string(),
  periodo: z.string(),
  // Un tetto di spesa non è una stima: spendere meno del tetto non è un "risparmio".
  tipoOnere: z.enum(["stima", "tetto"]),
  previsto: CostFigure,
  consuntivo: CostFigure.extend({ proiezione: z.boolean() }).nullable(),
  consuntivoAssente: z.string().optional(),
  omogeneita: Homogeneity,
  confidenza: Confidence,
  scostamento: z
    .object({ eur: z.number(), pct: z.number().nullable(), calcolatoDa: z.enum(["fonte", "paghi_tu"]) })
    .nullable(),
  noteMetodo: z.string(),
  verifica: Verification,
});
export type CostComparison = z.infer<typeof CostComparison>;

export const Measure = z.object({
  id: z.string(),
  titolo: z.string(),
  attoIstitutivo: z.string(),
  governoTesto: z.string(),
  governiIds: z.array(z.string().regex(/^g\d+$/)).min(1),
  annoAvvio: z.number().int(),
  confronti: z.array(CostComparison).min(1),
});
export type Measure = z.infer<typeof Measure>;

// Conti delle amministrazioni pubbliche (settore S13): importi in milioni di euro correnti.
export const PublicAccountsYear = z.object({
  anno: z.number().int(),
  spesa: z.number(),
  entrate: z.number(),
  saldo: z.number(),
  interessi: z.number(),
  pil: z.object({ spesa: z.number(), entrate: z.number(), saldo: z.number(), interessi: z.number() }),
  popolazioneMedia: z.number().nullable(),
  // Flag "b" di Eurostat: la serie cambia metodo da quest'anno, gli anni prima non sono confrontabili alla pari.
  rotturaDiSerie: z.boolean(),
});
export type PublicAccountsYear = z.infer<typeof PublicAccountsYear>;

export const SpendingByFunctionYear = z.object({
  anno: z.number().int(),
  totale: z.number(),
  voci: z.record(z.string().regex(/^GF\d{2,4}$/), z.number()),
});
export type SpendingByFunctionYear = z.infer<typeof SpendingByFunctionYear>;

export const FinanceCheck = z.object({
  id: z.string(),
  descrizione: z.string(),
  superato: z.boolean(),
  dettaglio: z.string(),
});

export const PublicFinance = z.object({
  scaricato: z.iso.datetime(),
  fonti: z.array(SourceLink.extend({ aggiornamentoFonte: z.string() })),
  conti: z.array(PublicAccountsYear).min(1),
  funzioni: z.array(SpendingByFunctionYear).min(1),
  debitoMensile: z.array(z.object({ mese: z.string().regex(/^\d{4}-\d{2}$/), valore: z.number() })).min(1),
  debitoPil: z.array(z.object({ anno: z.number().int(), valore: z.number() })).min(1),
  controlli: z.array(FinanceCheck).min(1),
  verifica: Verification,
});
export type PublicFinance = z.infer<typeof PublicFinance>;

// Registro pubblico delle modifiche a dati già pubblicati (D-020): mai cancellato, solo esteso.
export const Correction = z.object({
  id: z.string().regex(/^COR-\d{4}$/),
  data: isoDate,
  tipo: z.enum(["correzione", "metodo"]),
  dato: z.string(),
  pagina: z.string().startsWith("/"),
  prima: z.string(),
  dopo: z.string(),
  motivo: z.string(),
  fonte: SourceLink.nullable(),
  segnalazione: z.url().nullable(),
});
export type Correction = z.infer<typeof Correction>;

// D-021: costo dichiarato reso confrontabile (solo quello che il testo dice) e famiglia di misure
// passate con lo stesso strumento. Doppia codifica indipendente; nei casi discordi vale il vuoto.
export const PromiseCost = z.object({
  id: z.string(),
  famiglia: z
    .enum([
      "pensionamento_anticipato",
      "sostegno_reddito_poveri",
      "bonus_edilizi",
      "assegni_figli",
      "taglio_tasse_lavoro_dipendente",
      "tasse_prima_casa",
      "incentivi_assunzioni",
    ])
    .nullable(),
  costo: z
    .object({
      natura: z.enum(["spesa", "minor_gettito", "maggior_gettito", "riallocazione", "costo_zero", "non_strutturabile"]),
      minMln: z.number().nonnegative().nullable(),
      maxMln: z.number().nonnegative().nullable(),
      periodo: z.enum(["annuo", "totale", "non_indicato"]),
      anni: z.number().int().positive().nullable(),
    })
    .nullable(),
});
export type PromiseCost = z.infer<typeof PromiseCost>;
