// Converte i CSV verificati in research/ nei dataset JSON pubblicati in data/.
// Non aggiunge fatti: trasforma soltanto, e fallisce se un record non rispetta lo schema.
import { mkdir, readFile, writeFile } from "node:fs/promises";
import { join } from "node:path";
import { z } from "zod";
import { parseCsvRecords } from "../../src/lib/csv.ts";
import {
  BudgetLaw,
  CampaignPromise,
  CofogDivision,
  Government,
  Legislature,
  Party,
  PromiseCatalogStatus,
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
    .map((url) => ({ url }));
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
const PUBLISHED_PROMISE_GROUPS: string[] = [];
const PROMISE_GROUPS = ["a", "b", "c"];
const CAMPAIGN_PERIOD = { dal: "2026-01-01", al: SNAPSHOT };

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
  for (const group of PROMISE_GROUPS) {
    for (const r of await readRecords(`promesse-campagna-gruppo-${group}`)) {
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
        fonte: { url: r.fonte_url.trim() },
        archivioUrl: urlOrNull(r.archivio_url),
        cofog: CofogDivision.parse(r.tema_cofog.trim().slice(0, 2)),
        misurabile: r.misurabile,
        costoDichiarato: r.costo_dichiarato_proponente.trim() || null,
        stimaTerzi: r.stima_terzi.trim() && stimaUrl ? { testo: r.stima_terzi.trim(), fonte: { url: stimaUrl } } : null,
        note: r.note.trim(),
        verifica: verification(r.stato_verifica),
      });
      verified.push({ group, promise });
    }
  }
  const published = verified.filter(({ group }) => PUBLISHED_PROMISE_GROUPS.includes(group)).map(({ promise }) => promise);
  const status = PromiseCatalogStatus.parse({
    periodo: CAMPAIGN_PERIOD,
    censite,
    verificate: verified.length,
    pubblicate: published.length,
    gruppiPubblicati: PUBLISHED_PROMISE_GROUPS,
  });
  return { parties: [...parties.values()], published, status };
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

await mkdir(join(OUT, "serie"), { recursive: true });
await write("legislature", legs);
await write("governi", govs);
await write("leggi-bilancio", laws);
await write("fonti", srcs);
for (const s of allSeries) await write(join("serie", s.id), s);
await write("partiti", campaign.parties);
await write("promesse", campaign.published);
await write("promesse-stato", campaign.status);

const count = (xs: { verifica: Verification }[]) =>
  Object.entries(Object.groupBy(xs, (x) => x.verifica.livello)).map(([k, v]) => `${k}=${v?.length}`).join(" ");
console.log(`legislature ${legs.length} (${count(legs)})`);
console.log(`governi ${govs.length} (${count(govs)})`);
console.log(`leggi-bilancio ${laws.length} (${count(laws)}), senza governo collegato: ${laws.filter((l) => !l.governoProponenteId).length}`);
console.log(`serie ${allSeries.map((s) => `${s.id}:${s.punti.length}`).join(" ")}`);
console.log(`fonti ${srcs.length}`);
console.log(`promesse censite ${campaign.status.censite}, verificate ${campaign.status.verificate}, pubblicate ${campaign.status.pubblicate}, partiti ${campaign.parties.length}`);
