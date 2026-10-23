// Riscontra il golden set con le fonti online: npm run evals:verify
// Scarica ogni URL atteso, ne estrae il testo (HTML, XML, CSV o PDF con pdftotext) e cerca le parole
// esatte delle citazioni e i valori attesi. Non decide niente: scrive i fatti in verifica-fonti.json,
// e sono i test offline (verifica.test.ts) a stabilire se il set è coerente con le fonti.
// I valori di finanza pubblica non si cercano qui: li riscontra il test con le copie in data/raw/.
import { execFile, execFileSync } from "node:child_process";
import { createHash } from "node:crypto";
import { mkdir, mkdtemp, readFile, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { promisify } from "node:util";
import type { GoldenCase } from "./golden-set.ts";
import { findDeclarant, findDeclaredCost, findNumber, findValue, htmlToText, missingFragments, normalizeText } from "./testo.ts";

const DIR = "agent/evals";
const UA = "PaghiTu-verifica/1.0 (+https://www.paghitu.it/metodo)";
const TIMEOUT_MS = 90_000;
const PARALLEL = 4;
// D-004: ISTAT ammette 5 richieste al minuto per IP e blocca per 1-2 giorni chi le supera. Ogni
// richiesta, compresi i tentativi ripetuti, passa da una coda per host con un intervallo minimo.
const MIN_INTERVAL_MS: [RegExp, number][] = [
  [/(^|\.)istat\.it$/, 16_000],
  [/(^|\.)camera\.it$/, 3_000],
];
const DEFAULT_INTERVAL_MS = 1_000;
const OFFLINE_DATASETS = ["finanza-pubblica"];
// --dump <cartella>: salva il testo normalizzato di ogni fonte, per rileggere a mano un valore non trovato.
const DUMP = process.argv.includes("--dump") ? process.argv[process.argv.indexOf("--dump") + 1] : null;

try {
  execFileSync("pdftotext", ["-v"], { stdio: "ignore" });
} catch {
  console.error("pdftotext non trovato: serve poppler (brew install poppler, apt install poppler-utils).");
  process.exit(1);
}

const domandeText = await readFile(join(DIR, "domande.jsonl"), "utf8");
const cases: GoldenCase[] = domandeText.trim().split("\n").map((l) => JSON.parse(l));
const promises: { id: string; archivioUrl: string | null }[] = JSON.parse(await readFile("data/promesse.json", "utf8"));
const archiveOf = new Map<string, string>();
for (const c of cases) {
  for (const cit of c.citazioniAttese.filter((x) => x.dataset === "promesse")) {
    const a = promises.find((p) => p.id === cit.record)?.archivioUrl;
    if (a) for (const u of cit.urlAccettati) archiveOf.set(u, a);
  }
}

type Kind = "html" | "pdf" | "testo" | "binario";
type Fetched = { http: number; urlLetto: string; tipo: Kind; testo: string };
type SourceResult = { url: string; esito: "ok" | "ko"; via: "diretto" | "archivio"; http: number; urlLetto: string; tipo: Kind; caratteri: number; errore?: string };

const run = promisify(execFile);
const work = await mkdtemp(join(tmpdir(), "paghi-tu-verifica-"));

async function pdfText(body: Buffer): Promise<string> {
  const file = join(work, `${createHash("sha256").update(body).digest("hex")}.pdf`);
  await writeFile(file, body);
  const { stdout } = await run("pdftotext", ["-enc", "UTF-8", file, "-"], { maxBuffer: 256 * 1024 * 1024 });
  return stdout;
}

const nextSlot = new Map<string, number>();
async function throttle(url: string): Promise<void> {
  const host = new URL(url).hostname;
  const gap = MIN_INTERVAL_MS.find(([re]) => re.test(host))?.[1] ?? DEFAULT_INTERVAL_MS;
  const now = Date.now();
  const at = Math.max(now, nextSlot.get(host) ?? 0);
  nextSlot.set(host, at + gap);
  if (at > now) await new Promise((r) => setTimeout(r, at - now));
}

async function get(url: string): Promise<Fetched> {
  let last: unknown;
  for (let attempt = 0; attempt < 2; attempt++) {
    try {
      await throttle(url);
      // Niente header Range: alcuni server (dati.camera.it, ISTAT) rispondono 416 o 500.
      const res = await fetch(url, { headers: { "user-agent": UA, accept: "*/*" }, redirect: "follow", signal: AbortSignal.timeout(TIMEOUT_MS) });
      if (res.status >= 500 && attempt === 0) continue;
      const body = Buffer.from(await res.arrayBuffer());
      const type = res.headers.get("content-type") ?? "";
      const isPdf = type.includes("pdf") || body.subarray(0, 5).toString() === "%PDF-";
      const isBinary = !isPdf && (/zip|octet-stream|excel|spreadsheet/.test(type) || body.subarray(0, 2).toString() === "PK");
      const tipo: Kind = isPdf ? "pdf" : isBinary ? "binario" : /html|xml/.test(type) ? "html" : "testo";
      const testo = !res.ok || isBinary ? "" : isPdf ? await pdfText(body) : tipo === "html" ? htmlToText(body.toString("utf8")) : body.toString("utf8");
      return { http: res.status, urlLetto: res.url, tipo, testo };
    } catch (e) {
      last = e;
    }
  }
  throw last;
}

// La cattura Wayback con «id_» restituisce la pagina originale, senza la barra dell'archivio.
const rawArchive = (a: string) => a.replace(/\/web\/(\d{14})\//, "/web/$1id_/");

const texts = new Map<string, string>();
if (DUMP) await mkdir(DUMP, { recursive: true });
const dumpName = (url: string) => `${createHash("sha256").update(url).digest("hex").slice(0, 12)}.txt`;
async function check(url: string): Promise<SourceResult> {
  let direct: Fetched | null = null;
  let error = "";
  try {
    direct = await get(url);
    if (direct.http === 200) {
      texts.set(url, normalizeText(direct.testo));
      return { url, esito: "ok", via: "diretto", http: 200, urlLetto: direct.urlLetto, tipo: direct.tipo, caratteri: direct.testo.length };
    }
  } catch (e) {
    error = String(e);
  }
  const archive = archiveOf.get(url);
  if (archive) {
    const a = await get(rawArchive(archive)).catch(() => null);
    if (a?.http === 200) {
      texts.set(url, normalizeText(a.testo));
      return { url, esito: "ok", via: "archivio", http: direct?.http ?? 0, urlLetto: archive, tipo: a.tipo, caratteri: a.testo.length };
    }
  }
  return { url, esito: "ko", via: "diretto", http: direct?.http ?? 0, urlLetto: direct?.urlLetto ?? url, tipo: direct?.tipo ?? "binario", caratteri: 0, ...(error ? { errore: error } : {}) };
}

const urls = [...new Set(cases.flatMap((c) => c.citazioniAttese.flatMap((x) => x.urlAccettati)))].toSorted();
const sources: SourceResult[] = [];
for (let i = 0; i < urls.length; i += PARALLEL) {
  sources.push(...(await Promise.all(urls.slice(i, i + PARALLEL).map(check))));
  process.stdout.write(`\r${sources.length}/${urls.length} fonti`);
}
process.stdout.write("\n");
if (DUMP) {
  for (const [url, text] of texts) await writeFile(join(DUMP, dumpName(url)), `${url}\n\n${text}`);
}
await rm(work, { recursive: true, force: true });

type ValueResult = {
  campo: string;
  esito: "trovato" | "non_trovato" | "riscontro_offline" | "somma_di_addendi_trovati";
  url?: string;
  forma?: string;
  addendiNonTrovati?: number[];
};
const sums: Record<string, { addendi: number[] }> = JSON.parse(await readFile(join(DIR, "eccezioni-fonti.json"), "utf8")).somme;
const caseResults = cases.filter((c) => c.citazioniAttese.length).map((c) => {
  const urlsOfCase = c.citazioniAttese.flatMap((x) => x.urlAccettati).filter((u) => texts.has(u));
  let verbatim: { trovato: boolean; url: string | null; mancanti: string[] } | null = null;
  if (c.testoVerbatim) {
    const tries = urlsOfCase.map((u) => ({ url: u, mancanti: missingFragments(c.testoVerbatim!, texts.get(u)!) }));
    const best = tries.find((t) => t.mancanti.length === 0) ?? tries.toSorted((a, b) => a.mancanti.length - b.mancanti.length)[0];
    verbatim = { trovato: best?.mancanti.length === 0, url: best?.url ?? null, mancanti: best?.mancanti ?? [c.testoVerbatim] };
  }
  const offline = c.citazioniAttese.every((x) => OFFLINE_DATASETS.includes(x.dataset));
  const valori: ValueResult[] = c.valoriAttesi.filter((v) => v.valore !== null).map((v) => {
    if (offline) return { campo: v.campo, esito: "riscontro_offline" };
    const find = (text: string) =>
      v.campo === "dichiarante" ? findDeclarant(text, String(v.valore)) : v.campo === "costoDichiarato" ? findDeclaredCost(text, String(v.valore)) : findValue(text, v.valore!, v.unita);
    for (const u of urlsOfCase) {
      const forma = find(texts.get(u)!);
      if (forma) return { campo: v.campo, esito: "trovato", url: u, forma };
    }
    // Un valore che Paghi Tu ha calcolato sommando righe della fonte (eccezioni-fonti.json, «somme»):
    // ogni addendo deve stare in una fonte del caso; la somma la ricontrolla il test offline.
    const sum = sums[`${c.id}|${v.campo}`];
    if (sum) {
      const missing = sum.addendi.filter((a) => !urlsOfCase.some((u) => findNumber(texts.get(u)!, a)));
      return { campo: v.campo, esito: missing.length ? "non_trovato" : "somma_di_addendi_trovati", addendiNonTrovati: missing };
    }
    return { campo: v.campo, esito: "non_trovato" };
  });
  return { id: c.id, verbatim, valori };
});

const ledger = {
  domandeSha256: createHash("sha256").update(domandeText).digest("hex"),
  verificatoIl: new Date().toISOString().slice(0, 10),
  fonti: sources,
  casi: caseResults.toSorted((a, b) => a.id.localeCompare(b.id)),
};
await writeFile(join(DIR, "verifica-fonti.json"), `${JSON.stringify(ledger, null, 2)}\n`);

const ko = sources.filter((s) => s.esito === "ko");
const viaArchive = sources.filter((s) => s.via === "archivio");
const noVerbatim = caseResults.filter((c) => c.verbatim && !c.verbatim.trovato);
const notFound = caseResults.flatMap((c) => c.valori.filter((v) => v.esito === "non_trovato").map((v) => `${c.id} ${v.campo}`));
console.log(`fonti: ${sources.length - ko.length} ok (${viaArchive.length} dall'archivio), ${ko.length} ko`);
for (const s of ko) console.log(`  ko ${s.http} ${s.url}${s.errore ? ` ${s.errore}` : ""}`);
console.log(`citazioni non ritrovate: ${noVerbatim.length}`);
for (const c of noVerbatim) console.log(`  ${c.id}: ${c.verbatim!.mancanti.join(" | ")}`);
console.log(`valori non trovati nelle fonti: ${notFound.length}`);
for (const n of notFound) console.log(`  ${n}`);
console.log(`→ ${DIR}/verifica-fonti.json; npx vitest run agent/evals decide se il set è coerente.`);
