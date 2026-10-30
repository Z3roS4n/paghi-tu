// Converte i CSV verificati in research/ nei dataset JSON pubblicati in data/.
// Non aggiunge fatti: trasforma soltanto, e fallisce se un record non rispetta lo schema.
import { mkdir, readFile, writeFile } from "node:fs/promises";
import { join } from "node:path";
import { z } from "zod";
import { parseCsvRecords } from "../../src/lib/csv.ts";
import { parseYearAmounts } from "../../src/lib/domain/acts.ts";
import {
  ActMeasure,
  BudgetEffect,
  BudgetLaw,
  CampaignPromise,
  CofogDivision,
  CostComparison,
  Government,
  LegalAct,
  LegalActsCoverage,
  LegalActsStatus,
  Legislature,
  Measure,
  Party,
  PromiseCatalogStatus,
  PromiseCost,
  PromiseRestatement,
  Series,
  Source,
  type SourceLink,
  type Verification,
  type VerificationLevel,
} from "../../src/lib/domain/schemas.ts";

const RESEARCH = ".claude/project/research";
const SNAPSHOT = "2026-10-20";
const OUT = "data";

async function readRecords(name: string) {
  return parseCsvRecords(await readFile(join(RESEARCH, `${SNAPSHOT}.${name}.csv`), "utf8"));
}

function lowestLevel(text: string): VerificationLevel {
  const found = new Set(text.match(/\b(NV|V2|V1)\b/g) ?? []);
  if (found.has("NV")) return "NV";
  if (found.has("V2")) return "V2";
  if (found.has("V1")) return "V1";
  return "NV";
}

function verification(text: string): Verification {
  return { livello: lowestLevel(text), dettaglio: text.trim() };
}

// Nelle promesse l'esito sta in testa («V1✓ …»): il resto della nota può citare livelli superati.
function promiseVerification(text: string): Verification {
  const head = text.trim().match(/^(NV|V2|V1)✓/);
  return head ? { livello: head[1] as VerificationLevel, dettaglio: text.trim() } : verification(text);
}

// D-019: un'intervista pubblicata da una testata vale come fonte primaria. Restano V2 le righe che
// lo sono per un altro motivo: ruolo preso da fonti secondarie, pagina originale letta solo in copia.
const INTERVIEW_V2_OTHER_REASON = new Set(["C27-NM-012", "C27-FI-009", "C27-FI-029"]);

function interviewAsPrimary(id: string, tipoFonte: string, v: Verification): Verification {
  if (tipoFonte !== "intervista" || v.livello !== "V2" || INTERVIEW_V2_OTHER_REASON.has(id)) return v;
  return {
    livello: "V1",
    dettaglio: `V1 per D-019: intervista pubblicata da una testata, citazione verificata sul testo. Esito della verifica, quando le interviste valevano V2: ${v.dettaglio}`,
  };
}

const LEVEL_ORDER: VerificationLevel[] = ["NV", "V2", "V1"];
function lowest(levels: VerificationLevel[]): VerificationLevel {
  return LEVEL_ORDER.find((l) => levels.includes(l)) ?? "NV";
}

// Nelle note dei governi il verificatore L2 scrive per ultimo l'esito sui partiti:
// conta quello, non la stesura iniziale che ha superato.
function governmentVerification(text: string): Verification {
  const lastParties = text.slice(text.lastIndexOf("partiti")).split(" | ")[0];
  const campi = {
    inizio: "V1",
    presidente: "V1",
    legislatura: "V1",
    maggioranza: lowestLevel(lastParties),
  } satisfies Record<string, VerificationLevel>;
  return { livello: lowest(Object.values(campi)), campi, dettaglio: text.trim() };
}

function links(field: string): SourceLink[] {
  return field
    .split(/\s;\s|\s+(?=https?:\/\/)/)
    .map((s) => s.trim())
    .filter((s) => /^https?:\/\//.test(s))
    .map((s) => {
      const m = s.match(/^(\S+)\s+\((.+)\)$/);
      return m ? { url: m[1], etichetta: m[2] } : { url: s };
    });
}

const ROMAN: Record<string, number> = { I: 1, V: 5, X: 10 };
function legislatureNumber(id: string): number {
  if (id === "AC") return 0;
  let total = 0;
  for (let i = 0; i < id.length; i++) {
    const v = ROMAN[id[i]];
    const next = ROMAN[id[i + 1]] ?? 0;
    total += v < next ? -v : v;
  }
  return total;
}

function dateOrNull(s: string) {
  return s.trim() === "" ? null : s.trim();
}

async function legislatures() {
  return (await readRecords("legislature")).map((r) =>
    Legislature.parse({
      id: r.numero,
      numero: legislatureNumber(r.numero),
      inizio: r.data_inizio,
      fine: dateOrNull(r.data_fine),
      elezioni: dateOrNull(r.data_elezioni),
      sistemaElettorale: r.sistema_elettorale,
      fonti: links(r.fonte_url),
      verifica: verification(r.stato_verifica),
    }),
  );
}

async function governments() {
  return (await readRecords("governi")).map((r) => {
    const camera = r.fonte_url.match(/governo\.rdf\/(g\d+)/);
    if (!camera) throw new Error(`Governo senza URI Camera: ${r.nome_governo}`);
    return Government.parse({
      id: camera[1],
      ordine: Number(r.id),
      nome: r.nome_governo,
      presidente: r.presidente_consiglio,
      legislaturaId: r.legislatura,
      inizio: r.data_giuramento,
      fine: dateOrNull(r.data_fine),
      maggioranza: r.partiti_maggioranza,
      tipo: r.tipo,
      fonti: links(r.fonte_url),
      verifica: governmentVerification(r.stato_verifica),
    });
  });
}

const ACT_TYPES = new Map<string, z.infer<typeof BudgetLaw>["tipoAtto"]>([
  ["bilancio di previsione", "bilancio di previsione"],
  ["esercizio provvisorio", "esercizio provvisorio"],
  ["legge finanziaria", "legge finanziaria"],
  ["legge di stabilità", "legge di stabilità"],
  ["legge di stabilita", "legge di stabilità"],
  ["legge di bilancio", "legge di bilancio"],
]);

function actType(raw: string) {
  const key = raw.trim().toLowerCase();
  for (const [prefix, type] of ACT_TYPES) if (key.startsWith(prefix)) return type;
  return "altro" as const;
}

async function budgetLaws(govs: ReturnType<typeof Government.parse>[]) {
  const byName = new Map(govs.map((g) => [g.nome.replace(/^Governo\s+/, "").toLowerCase(), g.id]));
  const seen = new Map<string, number>();
  return (await readRecords("leggi-bilancio")).map((r) => {
    const tipoAtto = actType(r.tipo_atto);
    const base = `${r.anno_esercizio.replace(/[^0-9]+/g, "-").replace(/^-|-$/g, "")}-${tipoAtto.replace(/\s+/g, "-")}`;
    const n = (seen.get(base) ?? 0) + 1;
    seen.set(base, n);
    const proposer = r.governo_proponente.trim();
    const inferred = /\(INF\)$/.test(proposer);
    const proposerId = byName.get(proposer.replace(/\s*\(INF\)$/, "").toLowerCase()) ?? null;
    return BudgetLaw.parse({
      id: n === 1 ? base : `${base}-${n}`,
      annoEsercizio: r.anno_esercizio,
      annoInizio: Number(r.anno_esercizio.match(/\d{4}/)?.[0]),
      tipoAtto,
      tipoAttoOriginale: r.tipo_atto,
      estremi: r.estremi,
      governoProponenteId: proposerId,
      governoProponenteAttribuzione: proposerId === null ? "incerta" : inferred ? "inferita" : "documentata",
      governoProponenteTesto: proposer,
      fonti: links(r.fonte_url),
      verifica: verification(r.stato_verifica),
    });
  });
}

const SERIES_META: Record<string, { titolo: string; avvertenze: string[] }> = {
  "serie-pil-nominale": {
    titolo: "PIL nominale",
    avvertenze: [
      "1946–1994: Banca d'Italia NA150 v2.0, livelli SEC2010 ricostruiti dagli autori; 1995–2025: ISTAT edizione 2026M9.",
      "Per raccordare 1946–1994 all'edizione ISTAT 2026M9 si moltiplica per 1,005622 (rapporto 1995): il raccordo è una nostra elaborazione e va mostrato separato dal valore della fonte.",
    ],
  },
  "serie-popolazione-residente": {
    titolo: "Popolazione residente al 1° gennaio",
    avvertenze: [
      "1946–1951: Banca d'Italia NA150, arrotondata alle migliaia; dal 1952: ISTAT.",
      "Il dato 2026 è una stima ISTAT.",
    ],
  },
  "serie-prezzi-consumo-foi": {
    titolo: "Indice dei prezzi al consumo FOI (base 1913 = 1)",
    avvertenze: ["Dal 1992 FOI al netto dei tabacchi. ISTAT: valori per sole finalità di analisi storica."],
  },
  "serie-coefficienti-rivalutazione-istat-2025": {
    titolo: "Coefficienti ISTAT di rivalutazione in valori 2025",
    avvertenze: ["Per sole finalità di analisi storica: non valgono per rivalutazioni a fini legali."],
  },
};

async function series() {
  return Promise.all(
    Object.entries(SERIES_META).map(async ([name, meta]) => {
      const rows = await readRecords(name);
      const urls = [...new Set(rows.map((r) => r.fonte_url))];
      return Series.parse({
        id: name.replace(/^serie-/, ""),
        titolo: meta.titolo,
        unita: rows[0].unita,
        fonti: urls.map((url) => ({ url })),
        avvertenze: meta.avvertenze,
        punti: rows.map((r) => ({
          anno: Number(r.anno),
          valore: Number(r.valore),
          ...(r.unita !== rows[0].unita || /stimat|OBS_STATUS/i.test(r.note) ? { nota: `${r.unita}; ${r.note}` } : {}),
        })),
        verifica: {
          livello: "V1",
          dettaglio:
            "Verifica livello 2 del 2026-10-20: tutte le righe ricontrollate sui file ufficiali riscaricati, 0 scarti.",
        },
      });
    }),
  );
}

const REUSE: Record<string, z.infer<typeof Source>["riuso"]> = {
  sì: "si",
  si: "si",
  "con citazione": "con_citazione",
  "con permesso": "con_permesso",
};

function stripMd(s: string) {
  return s.replace(/\*\*/g, "").replace(/`/g, "").trim();
}

async function sources() {
  const md = await readFile(join(RESEARCH, `${SNAPSHOT}.sintesi-e-verifica-incrociata.md`), "utf8");
  return md
    .split("\n")
    .filter((l) => l.startsWith("| R-"))
    .map((line) => {
      const c = line.split("|").slice(1, -1).map(stripMd);
      const reuseKey = Object.keys(REUSE).find((k) => c[6].toLowerCase().startsWith(k));
      return Source.parse({
        id: c[0],
        ente: c[1],
        dataset: c[2],
        copertura: c[3],
        accesso: c[4],
        licenza: c[5],
        riuso: reuseKey ? REUSE[reuseKey] : "con_permesso",
        aggiornamento: c[7],
        fonteDiVeritaPer: c[8],
      });
    });
}

// Un gruppo entra nel sito solo dopo la verifica indipendente di ogni riga e il controllo di
// simmetria fra i gruppi (D-010): fino ad allora le promesse sono validate ma non pubblicate.
const PUBLISHED_PROMISE_GROUPS: string[] = ["a", "b", "c", "c-integrazione"];
// Scenari S1/S2 della nota di simmetria: il titolare ha scelto S1 il 2026-10-21 (D-015).
const PROMISE_SCOPE_RULE: "tutte" | "solo_fuori_legislatura_in_corso" | null = "tutte";
if (PUBLISHED_PROMISE_GROUPS.length > 0 && PROMISE_SCOPE_RULE === null) {
  throw new Error("Promesse: scegliere PROMISE_SCOPE_RULE prima di pubblicare un gruppo");
}
const PROMISE_FILES: Record<string, string> = {
  a: "2026-10-20.promesse-campagna-gruppo-a",
  b: "2026-10-20.promesse-campagna-gruppo-b",
  c: "2026-10-20.promesse-campagna-gruppo-c",
  "c-integrazione": "2026-10-21.promesse-campagna-gruppo-c-integrazione",
};
const CAMPAIGN_PERIOD = { dal: "2026-01-01", al: "2026-10-30" };

function isVerified(status: string) {
  return status.includes("✓") && !/DA RIMUOVERE|NON VERIFICABILE|NUOVA|riserva/i.test(status);
}

function urlOrNull(s: string) {
  return /^https?:\/\//.test(s.trim()) ? s.trim() : null;
}

async function campaignPromises() {
  const parties = new Map<string, z.infer<typeof Party>>();
  const verified: { group: string; promise: z.infer<typeof CampaignPromise> }[] = [];
  let censite = 0;
  for (const [group, file] of Object.entries(PROMISE_FILES)) {
    for (const r of parseCsvRecords(await readFile(join(RESEARCH, `${file}.csv`), "utf8"))) {
      const partitoId = r.id.split("-")[1];
      if (!parties.has(partitoId)) parties.set(partitoId, Party.parse({ id: partitoId, nome: r.partito, coalizione: r.coalizione }));
      censite++;
      // Le righe non ancora verificate possono essere incomplete: si contano, non si validano.
      if (!isVerified(r.stato_verifica)) continue;
      const stimaUrl = urlOrNull(r.fonte_stima_url);
      const promise = CampaignPromise.parse({
        id: r.id,
        partitoId,
        dichiarante: r.dichiarante,
        ruoloDichiarante: r.ruolo_dichiarante,
        data: r.data,
        testoLetterale: r.testo_letterale.trim(),
        parafrasiNeutra: r.parafrasi_neutra.trim(),
        tipoFonte: r.tipo_fonte,
        orizzonte: r.orizzonte,
        veicolo: r.veicolo,
        fonte: { url: r.fonte_url.trim() },
        archivioUrl: urlOrNull(r.archivio_url),
        cofog: CofogDivision.parse(r.tema_cofog.trim().slice(0, 2)),
        misurabile: r.misurabile,
        costoDichiarato: r.costo_dichiarato_proponente.trim() || null,
        stimaTerzi: r.stima_terzi.trim() && stimaUrl ? { testo: r.stima_terzi.trim(), fonte: { url: stimaUrl } } : null,
        note: r.note.trim(),
        verifica: interviewAsPrimary(r.id, r.tipo_fonte, promiseVerification(r.stato_verifica)),
        effettoConti: null,
        ribadita: [],
      });
      verified.push({ group, promise });
    }
  }
  const eligible = verified
    .filter(({ group }) => PUBLISHED_PROMISE_GROUPS.includes(group))
    .filter(({ promise }) => promise.verifica.livello !== "NV")
    .filter(({ promise }) => PROMISE_SCOPE_RULE === "tutte" || promise.orizzonte !== "legislatura_in_corso")
    .map(({ promise }) => promise);
  const published = await classifyPromises(eligible);
  const status = PromiseCatalogStatus.parse({
    periodo: CAMPAIGN_PERIOD,
    censite,
    verificate: verified.length,
    pubblicate: published.length,
    ribadite: eligible.length - published.length,
    gruppiPubblicati: PUBLISHED_PROMISE_GROUPS,
    regolaPerimetro: PROMISE_SCOPE_RULE,
  });
  return { parties: [...parties.values()], published, status };
}

// D-030 e D-031: due codificatori indipendenti; nel CSV entra solo l'esito concorde
// (sui conti, «incerto» se discordano; sulle ripetizioni, vuoto se discordano).
const PROMISE_CLASSIFICATION = "2026-10-28.promesse-classificazione";

async function classifyPromises(eligible: z.infer<typeof CampaignPromise>[]) {
  const rows = parseCsvRecords(await readFile(join(RESEARCH, `${PROMISE_CLASSIFICATION}.csv`), "utf8"));
  const byId = new Map(eligible.map((p) => [p.id, p]));
  const restates = new Map<string, string>();
  for (const r of rows) {
    const p = byId.get(r.id);
    if (!p) continue;
    p.effettoConti = BudgetEffect.parse(r.effetto_conti);
    const target = r.ribadisce.trim();
    if (!target) continue;
    const original = byId.get(target);
    if (!original) throw new Error(`${r.id}: ribadisce ${target}, che non è pubblicata`);
    if (original.partitoId !== p.partitoId) throw new Error(`${r.id}: ribadisce una promessa di un altro partito`);
    if (original.data > p.data) throw new Error(`${r.id}: ribadisce una promessa successiva`);
    restates.set(r.id, target);
  }
  const root = (id: string): string => {
    const next = restates.get(id);
    return next ? root(next) : id;
  };
  for (const [id] of restates) {
    const p = byId.get(id)!;
    byId.get(root(id))!.ribadita.push(
      PromiseRestatement.parse({
        id: p.id,
        dichiarante: p.dichiarante,
        ruoloDichiarante: p.ruoloDichiarante,
        data: p.data,
        testoLetterale: p.testoLetterale,
        tipoFonte: p.tipoFonte,
        fonte: p.fonte,
        archivioUrl: p.archivioUrl,
        verifica: p.verifica,
      }),
    );
  }
  for (const p of eligible) p.ribadita.sort((a, b) => a.data.localeCompare(b.data) || a.id.localeCompare(b.id));
  return eligible.filter((p) => !restates.has(p.id));
}

const LEGAL_ACTS = "2026-10-28.atti-economici";
const LEGAL_ACT_MEASURES = "2026-10-28.atti-misure";
// La routine sposta «dal» indietro con il recupero e «al» al giorno dell'ultima Gazzetta letta.
const LEGAL_ACTS_COVERAGE = { dal: "2026-08-01", al: "2026-10-29", obiettivo: "2022-10-22" };

async function legalActs(govs: ReturnType<typeof Government.parse>[]) {
  const coverage = LegalActsCoverage.parse(LEGAL_ACTS_COVERAGE);
  const byName = new Map(govs.map((g) => [g.nome.replace(/^Governo\s+/, ""), g]));
  const measuresByAct = new Map<string, z.infer<typeof ActMeasure>[]>();
  let measuresCensite = 0;
  for (const r of parseCsvRecords(await readFile(join(RESEARCH, `${LEGAL_ACT_MEASURES}.csv`), "utf8"))) {
    measuresCensite++;
    if (!isVerified(r.stato_verifica)) continue;
    const m = ActMeasure.parse({
      id: r.id,
      articolo: r.articolo.trim(),
      descrizione: r.descrizione.trim(),
      natura: r.natura,
      tipoOnere: r.tipo_onere,
      cofog: CofogDivision.parse(r.cofog.trim().slice(0, 2)),
      importi: parseYearAmounts(r.importi_mln),
      continuaDopo: r.a_decorrere.trim() === "si",
      citazione: r.citazione.trim(),
      fonte: { url: r.fonte_url.trim() },
      verifica: promiseVerification(r.stato_verifica),
    });
    if (!m.id.startsWith(`${r.atto}-m`)) throw new Error(`${m.id}: l'id non comincia con l'atto ${r.atto}`);
    measuresByAct.set(r.atto, [...(measuresByAct.get(r.atto) ?? []), m]);
  }
  const acts: z.infer<typeof LegalAct>[] = [];
  let censiti = 0;
  for (const r of parseCsvRecords(await readFile(join(RESEARCH, `${LEGAL_ACTS}.csv`), "utf8"))) {
    censiti++;
    const misure = (measuresByAct.get(r.id) ?? []).filter((m) => m.verifica.livello !== "NV");
    measuresByAct.delete(r.id);
    if (!isVerified(r.stato_verifica) || misure.length === 0) continue;
    const gov = byName.get(r.governo.trim());
    if (!gov) throw new Error(`${r.id}: governo sconosciuto «${r.governo}»`);
    if (r.data_atto < gov.inizio || (gov.fine && r.data_atto > gov.fine)) throw new Error(`${r.id}: ${gov.nome} non era in carica`);
    if (r.gu_data < coverage.dal || r.gu_data > coverage.al) throw new Error(`${r.id}: Gazzetta del ${r.gu_data} fuori dal periodo censito`);
    const conversione = r.conversione_estremi.trim();
    const verifica = promiseVerification(r.stato_verifica);
    acts.push(
      LegalAct.parse({
        id: r.id,
        tipo: r.tipo,
        numero: Number(r.numero),
        data: r.data_atto,
        titoloUfficiale: r.titolo_ufficiale.trim(),
        titolo: r.titolo_breve.trim(),
        governoId: gov.id,
        gazzetta: { numero: Number(r.gu_numero), data: r.gu_data, fonte: { url: r.gu_url.trim() } },
        inVigoreDal: r.in_vigore_dal.trim(),
        cdm: urlOrNull(r.cdm_url) ? { url: r.cdm_url.trim() } : null,
        stato: r.stato,
        conversione: conversione ? { estremi: conversione, fonte: { url: r.conversione_url.trim() } } : null,
        relazioneTecnica: urlOrNull(r.relazione_tecnica_url) ? { url: r.relazione_tecnica_url.trim() } : null,
        misure,
        note: r.note.trim(),
        verifica: { ...verifica, livello: lowest([verifica.livello, ...misure.map((m) => m.verifica.livello)]) },
      }),
    );
  }
  const orphans = [...measuresByAct.keys()].filter((id) => measuresByAct.get(id)!.length > 0);
  if (orphans.length > 0) throw new Error(`misure di atti non censiti: ${orphans.join(", ")}`);
  const status = LegalActsStatus.parse({ ...coverage, censiti, pubblicati: acts.length, misureCensite: measuresCensite });
  return { acts: acts.toSorted((a, b) => b.gazzetta.data.localeCompare(a.gazzetta.data) || a.id.localeCompare(b.id)), status };
}

const MEASURES: Record<string, { titolo: string; governi: string[] }> = {
  quota_100: { titolo: "Quota 100", governi: ["Conte I"] },
  reddito_di_cittadinanza: { titolo: "Reddito e pensione di cittadinanza", governi: ["Conte I"] },
  superbonus_110: { titolo: "Superbonus 110%", governi: ["Conte II", "Draghi", "Meloni"] },
  assegno_unico_universale: { titolo: "Assegno unico universale", governi: ["Draghi"] },
  bonus_80_euro: { titolo: "Bonus 80 euro", governi: ["Renzi"] },
  abolizione_ici_prima_casa: { titolo: "Abolizione dell'ICI sulla prima casa", governi: ["Berlusconi IV", "Prodi II"] },
  salvaguardie_esodati_chiuse: { titolo: "Salvaguardie «esodati» già chiuse", governi: ["Monti", "Letta"] },
  assegno_di_inclusione: { titolo: "Assegno di inclusione", governi: ["Meloni"] },
  esonero_contributivo_assunzioni_2015: { titolo: "Esonero contributivo per le assunzioni 2015", governi: ["Renzi"] },
  riduzione_strutturale_cuneo_fiscale: { titolo: "Riduzione strutturale del cuneo fiscale", governi: ["Meloni"] },
};

type ComparisonMeta = Pick<z.infer<typeof CostComparison>, "periodo" | "tipoOnere" | "omogeneita" | "confidenza"> & {
  proiezione?: boolean;
  scostamentoDellaFonte?: boolean;
};

// Classificazione di ogni riga del CSV secondo le regole della nota "costo delle misure"
// (omogeneità, confidenza A–D, tetto o stima), ricavata dalle note di metodo verificate.
const COMPARISONS: [string, ComparisonMeta][] = [
  ["quota_100", { periodo: "2019–2021", tipoOnere: "stima", omogeneita: "omogeneo", confidenza: "A", scostamentoDellaFonte: true }],
  ["quota_100", { periodo: "2019–2025, con proiezione UPB", tipoOnere: "stima", omogeneita: "parzialmente_omogeneo", confidenza: "D", proiezione: true }],
  ["reddito_di_cittadinanza", { periodo: "2019 (aprile–dicembre)", tipoOnere: "tetto", omogeneita: "non_omogeneo", confidenza: "C" }],
  ["reddito_di_cittadinanza", { periodo: "2020", tipoOnere: "tetto", omogeneita: "parzialmente_omogeneo", confidenza: "B" }],
  ["reddito_di_cittadinanza", { periodo: "2021", tipoOnere: "tetto", omogeneita: "non_omogeneo", confidenza: "C" }],
  ["reddito_di_cittadinanza", { periodo: "2022", tipoOnere: "tetto", omogeneita: "non_omogeneo", confidenza: "C" }],
  ["superbonus_110", { periodo: "Intero periodo", tipoOnere: "stima", omogeneita: "non_omogeneo", confidenza: "C" }],
  ["assegno_unico_universale", { periodo: "2022 (marzo–dicembre)", tipoOnere: "stima", omogeneita: "parzialmente_omogeneo", confidenza: "C" }],
  ["assegno_unico_universale", { periodo: "2023", tipoOnere: "stima", omogeneita: "non_omogeneo", confidenza: "C" }],
  ["assegno_unico_universale", { periodo: "2024", tipoOnere: "stima", omogeneita: "non_omogeneo", confidenza: "C" }],
  ["assegno_unico_universale", { periodo: "2025", tipoOnere: "stima", omogeneita: "non_omogeneo", confidenza: "C" }],
  ["bonus_80_euro", { periodo: "2014 (maggio–dicembre)", tipoOnere: "stima", omogeneita: "parzialmente_omogeneo", confidenza: "B" }],
  ["bonus_80_euro", { periodo: "2015, a regime", tipoOnere: "stima", omogeneita: "parzialmente_omogeneo", confidenza: "C" }],
  ["abolizione_ici_prima_casa", { periodo: "2008", tipoOnere: "stima", omogeneita: "parzialmente_omogeneo", confidenza: "B" }],
  ["salvaguardie_esodati_chiuse", { periodo: "Salvaguardie chiuse", tipoOnere: "tetto", omogeneita: "omogeneo", confidenza: "B" }],
  ["assegno_di_inclusione", { periodo: "2024", tipoOnere: "tetto", omogeneita: "parzialmente_omogeneo", confidenza: "B" }],
  ["esonero_contributivo_assunzioni_2015", { periodo: "2015–2018", tipoOnere: "stima", omogeneita: "parzialmente_omogeneo", confidenza: "C" }],
  ["riduzione_strutturale_cuneo_fiscale", { periodo: "2025", tipoOnere: "stima", omogeneita: "omogeneo", confidenza: "D" }],
];

function cleanNote(s: string) {
  return s.replace(/\[Verificatore: ([^\]]*)\]/g, "$1").trim();
}

async function measures(govs: ReturnType<typeof Government.parse>[]) {
  const byName = new Map(govs.map((g) => [g.nome.replace(/^Governo\s+/, ""), g.id]));
  const rows = await readRecords("casi-studio-misure");
  if (rows.length !== COMPARISONS.length) throw new Error(`casi studio: ${rows.length} righe, ${COMPARISONS.length} classificate`);
  const out = new Map<string, z.infer<typeof Measure>>();
  rows.forEach((r, i) => {
    const [misura, meta] = COMPARISONS[i];
    if (r.misura !== misura) throw new Error(`casi studio riga ${i + 1}: attesa ${misura}, trovata ${r.misura}`);
    const previsto = Number(r.costo_previsto_eur);
    const consuntivo = r.costo_consuntivo_eur.trim() === "" ? null : Number(r.costo_consuntivo_eur);
    const diff = consuntivo === null || meta.omogeneita === "non_omogeneo" ? null : consuntivo - previsto;
    const comparison = CostComparison.parse({
      id: `${misura}-${(out.get(misura)?.confronti.length ?? 0) + 1}`,
      periodo: meta.periodo,
      tipoOnere: meta.tipoOnere,
      previsto: { importoEur: previsto, descrizione: r.periodo_previsione, fonte: { url: r.fonte_previsto_url } },
      consuntivo:
        consuntivo === null
          ? null
          : {
              importoEur: consuntivo,
              descrizione: r.periodo_consuntivo,
              fonte: { url: r.fonte_consuntivo_url },
              proiezione: meta.proiezione ?? false,
            },
      ...(consuntivo === null ? { consuntivoAssente: r.periodo_consuntivo } : {}),
      omogeneita: meta.omogeneita,
      confidenza: meta.confidenza,
      scostamento:
        diff === null
          ? null
          : { eur: diff, pct: (diff / previsto) * 100, calcolatoDa: meta.scostamentoDellaFonte ? "fonte" : "paghi_tu" },
      noteMetodo: cleanNote(r.note_metodo),
      verifica: verification(r.stato_verifica),
    });
    const existing = out.get(misura);
    if (existing) {
      existing.confronti.push(comparison);
      return;
    }
    const info = MEASURES[misura];
    out.set(misura, {
      id: misura.replaceAll("_", "-"),
      titolo: info.titolo,
      attoIstitutivo: r.atto_istitutivo,
      governoTesto: r.governo,
      governiIds: info.governi.map((name) => {
        const id = byName.get(name);
        if (!id) throw new Error(`governo sconosciuto per ${misura}: ${name}`);
        return id;
      }),
      annoAvvio: Number(r.anno_avvio),
      confronti: [comparison],
    });
  });
  return [...out.values()].map((m) => Measure.parse(m));
}

const PROMISE_COSTS = "2026-10-21.costi-precedenti";
const num = (s: string) => (s.trim() === "" ? null : Number(s));

async function promiseCosts(published: z.infer<typeof CampaignPromise>[]) {
  const byId = new Map(published.map((p) => [p.id, p]));
  const rows = parseCsvRecords(await readFile(join(RESEARCH, `${PROMISE_COSTS}.csv`), "utf8"));
  return rows.flatMap((r) => {
    const p = byId.get(r.id);
    if (!p) return [];
    if (r.natura && !p.costoDichiarato?.includes(r.cifra_testuale)) {
      throw new Error(`${r.id}: la cifra «${r.cifra_testuale}» non è nel costo dichiarato`);
    }
    const c = PromiseCost.parse({
      id: r.id,
      famiglia: r.famiglia || null,
      costo: r.natura
        ? { natura: r.natura, minMln: num(r.importo_mln_min), maxMln: num(r.importo_mln_max), periodo: r.periodo, anni: num(r.anni) }
        : null,
    });
    return c.famiglia || c.costo ? [c] : [];
  });
}

async function write(name: string, value: unknown) {
  await writeFile(join(OUT, `${name}.json`), JSON.stringify(value, null, 2) + "\n", "utf8");
}

const legs = await legislatures();
const govs = await governments();
const laws = await budgetLaws(govs);
const allSeries = await series();
const srcs = await sources();
const campaign = await campaignPromises();
const allMeasures = await measures(govs);
const costs = await promiseCosts(campaign.published);
const acts = await legalActs(govs);

await mkdir(join(OUT, "serie"), { recursive: true });
await write("legislature", legs);
await write("governi", govs);
await write("leggi-bilancio", laws);
await write("fonti", srcs);
for (const s of allSeries) await write(join("serie", s.id), s);
await write("partiti", campaign.parties);
await write("promesse", campaign.published);
await write("promesse-stato", campaign.status);
await write("promesse-costi", costs);
await write("misure", allMeasures);
await write("atti", acts.acts);
await write("atti-stato", acts.status);

const count = (xs: { verifica: Verification }[]) =>
  Object.entries(Object.groupBy(xs, (x) => x.verifica.livello)).map(([k, v]) => `${k}=${v?.length}`).join(" ");
console.log(`legislature ${legs.length} (${count(legs)})`);
console.log(`governi ${govs.length} (${count(govs)})`);
console.log(`leggi-bilancio ${laws.length} (${count(laws)}), senza governo collegato: ${laws.filter((l) => !l.governoProponenteId).length}`);
console.log(`serie ${allSeries.map((s) => `${s.id}:${s.punti.length}`).join(" ")}`);
console.log(`fonti ${srcs.length}`);
console.log(`misure ${allMeasures.length}, confronti ${allMeasures.reduce((n, m) => n + m.confronti.length, 0)}`);
console.log(`costi delle promesse ${costs.filter((c) => c.costo).length}, con precedenti ${costs.filter((c) => c.famiglia).length}`);
console.log(`promesse censite ${campaign.status.censite}, verificate ${campaign.status.verificate}, pubblicate ${campaign.status.pubblicate}, ribadite ${campaign.status.ribadite}, partiti ${campaign.parties.length}`);
console.log(`promesse per effetto sui conti: ${Object.entries(Object.groupBy(campaign.published, (p) => p.effettoConti ?? "da_classificare")).map(([k, v]) => `${k}=${v?.length}`).join(" ")}`);
console.log(`atti censiti ${acts.status.censiti}, pubblicati ${acts.acts.length} (${count(acts.acts)}), misure ${acts.acts.reduce((n, a) => n + a.misure.length, 0)} su ${acts.status.misureCensite} censite`);
