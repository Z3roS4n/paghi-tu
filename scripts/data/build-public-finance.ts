// Trasforma i file grezzi di data/raw/ in data/finanza-pubblica.json e incrocia le fonti fra loro.
// Se un controllo non passa si ferma: un aggiornamento automatico non deve mai pubblicare numeri incoerenti.
import { readFile, writeFile } from "node:fs/promises";
import { join } from "node:path";
import { parseCsvRecords } from "../../src/lib/csv.ts";
import { PublicFinance, Series } from "../../src/lib/domain/schemas.ts";

const RAW = "data/raw";
const DEBT_FROM = "1945-01";

const manifest: { file: string; url: string; scaricato: string; fileOrigine?: string }[] = JSON.parse(
  await readFile(join(RAW, "manifest.json"), "utf8"),
);
const raw = async (file: string, delimiter?: string) => parseCsvRecords(await readFile(join(RAW, file), "utf8"), delimiter);
const serie = async (id: string) => Series.parse(JSON.parse(await readFile(`data/serie/${id}.json`, "utf8")));

const main = await raw("eurostat/gov_10a_main.csv");
const exp = await raw("eurostat/gov_10a_exp.csv");
const edp = await raw("eurostat/gov_10dd_edpt1.csv");
const bdi = await raw("bancaditalia/TCCE0325.csv", ";");
const population = new Map((await serie("popolazione-residente")).punti.map((p) => [p.anno, p.valore]));
const gdp = new Map((await serie("pil-nominale")).punti.map((p) => [p.anno, p.valore]));

// Eurostat segna con OBS_VALUE vuoto gli anni senza dato: restano mancanti, mai zero.
function table(rows: Record<string, string>[], key: (r: Record<string, string>) => string) {
  const out = new Map<string, number>();
  for (const r of rows) if (r.OBS_VALUE !== "") out.set(`${key(r)}|${r.TIME_PERIOD}`, Number(r.OBS_VALUE));
  return out;
}
const mainT = table(main, (r) => `${r.unit}|${r.na_item}`);
const breaks = new Set(main.filter((r) => r.unit === "MIO_NAC" && r.na_item === "TE" && r.OBS_FLAG.includes("b")).map((r) => Number(r.TIME_PERIOD)));
const expT = table(exp, (r) => r.cofog99);
const edpT = table(edp, (r) => r.unit);
const years = (rows: Record<string, string>[]) => [...new Set(rows.map((r) => Number(r.TIME_PERIOD)))].toSorted((a, b) => a - b);

const conti = years(main)
  .filter((anno) => mainT.has(`MIO_NAC|TE|${anno}`))
  .map((anno) => {
    const v = (unit: string, item: string) => {
      const x = mainT.get(`${unit}|${item}|${anno}`);
      if (x === undefined) throw new Error(`gov_10a_main: manca ${unit} ${item} ${anno}`);
      return x;
    };
    const a = population.get(anno);
    const b = population.get(anno + 1);
    return {
      anno,
      spesa: v("MIO_NAC", "TE"),
      entrate: v("MIO_NAC", "TR"),
      saldo: v("MIO_NAC", "B9"),
      interessi: v("MIO_NAC", "D41PAY"),
      pil: { spesa: v("PC_GDP", "TE"), entrate: v("PC_GDP", "TR"), saldo: v("PC_GDP", "B9"), interessi: v("PC_GDP", "D41PAY") },
      // Popolazione media dell'anno: media fra il 1° gennaio dell'anno e quello dell'anno dopo.
      popolazioneMedia: a !== undefined && b !== undefined ? Math.round((a + b) / 2) : null,
      rotturaDiSerie: breaks.has(anno),
    };
  });

const cofogCodes = [...new Set(exp.map((r) => r.cofog99))].filter((c) => c !== "TOTAL");
const funzioni = years(exp)
  .filter((anno) => expT.has(`TOTAL|${anno}`))
  .map((anno) => ({
    anno,
    totale: expT.get(`TOTAL|${anno}`)!,
    voci: Object.fromEntries(cofogCodes.flatMap((c) => (expT.has(`${c}|${anno}`) ? [[c, expT.get(`${c}|${anno}`)!]] : []))),
  }));

const debtColumn = "FPI_FP.M.IT.S13.MGD.SBI3.101.112.FAV.EUR.EDP";
const debitoMensile = bdi
  .filter((r) => r[debtColumn] !== "")
  .map((r) => ({ mese: r.DATA_OSS.slice(0, 7).replace("/", "-"), valore: Number(r[debtColumn].replace(",", ".")) }))
  .filter((p) => p.mese >= DEBT_FROM)
  .toSorted((a, b) => a.mese.localeCompare(b.mese));

const debitoPil = years(edp)
  .filter((anno) => edpT.has(`PC_GDP|${anno}`))
  .map((anno) => ({ anno, valore: edpT.get(`PC_GDP|${anno}`)! }));

function check(id: string, descrizione: string, deviations: { label: string; value: number }[], limit: number, unit: string) {
  const worst = deviations.reduce((a, b) => (Math.abs(b.value) > Math.abs(a.value) ? b : a));
  const fmt = (n: number) => n.toLocaleString("it-IT", { maximumFractionDigits: 3 });
  return {
    id,
    descrizione,
    superato: Math.abs(worst.value) <= limit,
    dettaglio: `${deviations.length} confronti; scarto massimo ${fmt(worst.value)} ${unit} (${worst.label}); soglia ${fmt(limit)} ${unit}`,
  };
}
const pct = (a: number, b: number) => ((a - b) / b) * 100;

const controlli = [
  check(
    "somma-funzioni",
    "Le dieci funzioni COFOG sommano al totale della spesa per funzione",
    funzioni.map((f) => ({
      label: String(f.anno),
      value: pct(Object.entries(f.voci).filter(([c]) => c.length === 4).reduce((s, [, x]) => s + x, 0), f.totale),
    })),
    0.1,
    "%",
  ),
  check(
    "spesa-due-tavole",
    "Spesa totale uguale nelle due tavole Eurostat (conti principali e spesa per funzione)",
    funzioni.flatMap((f) => {
      const c = conti.find((x) => x.anno === f.anno);
      return c ? [{ label: String(f.anno), value: pct(c.spesa, f.totale) }] : [];
    }),
    0.5,
    "%",
  ),
  check(
    "saldo-identita",
    "Saldo uguale a entrate meno spese",
    conti.map((c) => ({ label: String(c.anno), value: pct(c.entrate - c.spesa, c.spesa) - pct(c.saldo, c.spesa) })),
    0.05,
    "punti %",
  ),
  check(
    "debito-bdi-eurostat",
    "Debito di fine anno: Banca d'Italia contro Eurostat",
    debitoPil.flatMap(({ anno }) => {
      const dec = debitoMensile.find((d) => d.mese === `${anno}-12`);
      const eu = edpT.get(`MIO_NAC|${anno}`);
      return dec && eu ? [{ label: String(anno), value: pct(dec.valore, eu) }] : [];
    }),
    0.5,
    "%",
  ),
  check(
    "pil-istat-eurostat",
    "Spesa in % del PIL: valore Eurostat contro spesa Eurostat divisa per il PIL ISTAT della nostra serie",
    conti.flatMap((c) => {
      const g = gdp.get(c.anno);
      return g ? [{ label: String(c.anno), value: c.pil.spesa - (c.spesa / g) * 100 }] : [];
    }),
    0.5,
    "punti %",
  ),
];

const failed = controlli.filter((c) => !c.superato);
if (failed.length > 0) {
  throw new Error(`controlli non superati:\n${failed.map((c) => `- ${c.descrizione}: ${c.dettaglio}`).join("\n")}`);
}

const lastUpdate = (rows: Record<string, string>[]) => rows[0]["LAST UPDATE"];
const scaricato = manifest[0].scaricato;
const bdiFile = manifest.find((m) => m.file.startsWith("bancaditalia/"))!;
const etichette: Record<string, string> = {
  "eurostat/gov_10a_main.csv": "Eurostat gov_10a_main, conti principali delle amministrazioni pubbliche",
  "eurostat/gov_10a_exp.csv": "Eurostat gov_10a_exp, spesa delle amministrazioni pubbliche per funzione (COFOG)",
  "eurostat/gov_10dd_edpt1.csv": "Eurostat gov_10dd_edpt1, debito pubblico (notifica EDP)",
  "bancaditalia/TCCE0325.csv": "Banca d'Italia, Finanza pubblica: fabbisogno e debito, tavola TCCE0325",
};
const aggiornamenti: Record<string, string> = {
  "eurostat/gov_10a_main.csv": lastUpdate(main),
  "eurostat/gov_10a_exp.csv": lastUpdate(exp),
  "eurostat/gov_10dd_edpt1.csv": lastUpdate(edp),
  "bancaditalia/TCCE0325.csv": bdiFile.fileOrigine
    ? `estrazione del ${bdiFile.fileOrigine.replace(/^(\d{4})(\d{2})(\d{2}).*/, "$3/$2/$1")}`
    : "n.d.",
};

const out = PublicFinance.parse({
  scaricato,
  fonti: manifest.map((m) => ({ url: m.url, etichetta: etichette[m.file], aggiornamentoFonte: aggiornamenti[m.file] })),
  conti,
  funzioni,
  debitoMensile,
  debitoPil,
  controlli,
  verifica: {
    livello: "V1",
    dettaglio: `Scaricati dalle fonti primarie il ${scaricato.slice(0, 10)} e incrociati in automatico: ${controlli
      .map((c) => c.descrizione.toLowerCase())
      .join("; ")}. Tutti i controlli superati.`,
  },
});
await writeFile("data/finanza-pubblica.json", `${JSON.stringify(out, null, 2)}\n`);
console.log(
  `conti ${conti[0].anno}–${conti.at(-1)!.anno}, funzioni ${funzioni[0].anno}–${funzioni.at(-1)!.anno}, debito ${debitoMensile[0].mese}–${debitoMensile.at(-1)!.mese}`,
);
for (const c of controlli) console.log(`✓ ${c.id}: ${c.dettaglio}`);
