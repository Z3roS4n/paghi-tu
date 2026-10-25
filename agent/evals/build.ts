// Rigenera domande.jsonl e il foglio di revisione dai dati del sito: npm run evals:build
import { readFile, readdir, writeFile } from "node:fs/promises";
import { join } from "node:path";
import { CATEGORIES, buildGoldenSet, type GoldenCase } from "./golden-set.ts";

const DIR = "agent/evals";
const json = async (path: string): Promise<unknown> => JSON.parse(await readFile(path, "utf8"));

const seriesFiles = (await readdir("data/serie")).filter((f) => f.endsWith(".json")).sort();
const serie: Record<string, unknown> = {};
for (const f of seriesFiles) serie[f.replace(/\.json$/, "")] = await json(join("data/serie", f));

const cases = buildGoldenSet({
  governi: await json("data/governi.json"),
  legislature: await json("data/legislature.json"),
  leggiBilancio: await json("data/leggi-bilancio.json"),
  misure: await json("data/misure.json"),
  partiti: await json("data/partiti.json"),
  promesse: await json("data/promesse.json"),
  correzioni: await json("data/correzioni.json"),
  finanzaPubblica: await json("data/finanza-pubblica.json"),
  serie,
  casiManuali: await json(join(DIR, "casi-manuali.json")),
  revisione: await json(join(DIR, "revisione.json")),
  formeAccettate: await json(join(DIR, "forme-accettate.json")),
  esclusi: await json(join(DIR, "esclusi.json")),
});

await writeFile(join(DIR, "domande.jsonl"), cases.map((c) => JSON.stringify(c)).join("\n") + "\n");

const fmt = (v: string | number | null) =>
  typeof v === "number" ? v.toLocaleString("it-IT", { maximumFractionDigits: 3 }) : (v ?? "—");
const cell = (s: string) => s.replace(/\|/g, "\\|").replace(/\n/g, " ");

function reviewBlock(c: GoldenCase): string {
  const lines = [`### ${c.id}`, "", `**Domanda:** ${c.domanda}`, "", `**Esito atteso:** ${c.esitoAtteso}`];
  if (c.livelloVerifica) lines.push(`**Livello del dato:** ${c.livelloVerifica}`);
  if (c.testoVerbatim) lines.push("", `**Parole esatte attese:** «${c.testoVerbatim}»`);
  if (c.valoriAttesi.length) {
    lines.push("", "| Campo | Valore atteso | Unità |", "| --- | --- | --- |");
    for (const v of c.valoriAttesi) lines.push(`| ${cell(v.campo)} | ${cell(String(fmt(v.valore)))} | ${v.unita ?? ""} |`);
  }
  if (c.risposteErrate.length) lines.push("", `**Da respingere:** ${c.risposteErrate.map((r) => `«${r}»`).join(" · ")}`);
  for (const cit of c.citazioniAttese) lines.push("", `**Citazione:** \`${cit.dataset}\` / \`${cit.record}\` — ${cit.urlAccettati.join(" · ") || "nessun URL"}`);
  if (c.regole.length) lines.push("", `**Regole:** ${c.regole.map((r) => `\`${r}\``).join(", ")}`);
  if (c.fonteConPermesso) lines.push("", "**⚠ Fonte con riuso «con_permesso»** in `data/fonti.json`: decidere se il record entra nell'indice.");
  if (c.notaRevisore) lines.push("", `**Nota:** ${c.notaRevisore}`);
  lines.push("", `**Revisione:** ${c.rivistoDaAntonio ?? "da fare"}`, "");
  return lines.join("\n");
}

const byCategory = CATEGORIES.map((cat) => [cat, cases.filter((c) => c.categoria === cat)] as const).filter(([, cs]) => cs.length);
const summary = byCategory.map(([cat, cs]) => `| ${cat} | ${cs.length} |`).join("\n");
const sheet = [
  "# Golden set — foglio di revisione",
  "",
  "File generato da `npm run evals:build`: non si modifica a mano. Per segnare un caso si scrive in `agent/evals/revisione.json` (`\"<id>\": \"ok\" | \"da_correggere\" | \"da_togliere\"`) e si rigenera.",
  "",
  `Casi: ${cases.length}. Con fonte «con_permesso»: ${cases.filter((c) => c.fonteConPermesso).length}. Rivisti: ${cases.filter((c) => c.rivistoDaAntonio).length}.`,
  "",
  "| Categoria | Casi |",
  "| --- | --- |",
  summary,
  "",
  ...byCategory.flatMap(([cat, cs]) => [`## ${cat}`, "", ...cs.map(reviewBlock)]),
].join("\n");
await writeFile(join(DIR, "revisione.md"), sheet);

console.log(`golden set: ${cases.length} casi → ${DIR}/domande.jsonl, ${DIR}/revisione.md`);
