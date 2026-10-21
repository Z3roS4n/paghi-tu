// Dà una copia d'archivio a ogni fonte delle promesse che ne è ancora senza (D-005, D-019).
// Prima cerca una cattura Wayback già esistente, presa dal giorno della dichiarazione in poi;
// con --save chiede a Internet Archive una cattura nuova, una alla volta e con una pausa fra
// le richieste. Scrive l'URL della cattura nella colonna archivio_url del CSV di ricerca.
import { readdir, readFile, writeFile } from "node:fs/promises";
import { join } from "node:path";
import { formatCsv, parseCsv } from "../../src/lib/csv.ts";

const RESEARCH = ".claude/project/research";
const SAVE = process.argv.includes("--save");
const SAVE_PAUSE_MS = 20_000;
const UA = "PaghiTu-archivio/1.0 (+https://www.paghitu.it/metodo)";

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));
const ymd = (date: string) => date.replaceAll("-", "");
const snapshot = (ts: string, url: string) => `https://web.archive.org/web/${ts}/${url}`;

async function existing(url: string, from: string): Promise<string | null> {
  const q = new URLSearchParams({ url, from, filter: "statuscode:200", limit: "1", output: "json", fl: "timestamp" });
  const res = await fetch(`https://web.archive.org/cdx/search/cdx?${q}`, { headers: { "user-agent": UA }, signal: AbortSignal.timeout(60_000) });
  if (!res.ok) throw new Error(`CDX ${res.status}`);
  const rows = (await res.json()) as string[][];
  return rows[1]?.[0] ? snapshot(rows[1][0], url) : null;
}

async function save(url: string): Promise<string | null> {
  for (let attempt = 0; attempt < 2; attempt++) {
    const res = await fetch(`https://web.archive.org/save/${url}`, {
      headers: { "user-agent": UA },
      redirect: "manual",
      signal: AbortSignal.timeout(180_000),
    });
    if (res.status === 429) {
      await sleep(120_000);
      continue;
    }
    const where = res.headers.get("location") ?? res.headers.get("content-location");
    const ts = where?.match(/\/web\/(\d{14})/)?.[1];
    if (ts) return snapshot(ts, url);
    await sleep(15_000);
    return existing(url, ymd(new Date().toISOString().slice(0, 10)));
  }
  return null;
}

const files = (await readdir(RESEARCH)).filter((f) => /promesse-campagna-gruppo-.*\.csv$/.test(f));
const found = new Map<string, string | null>();
const log: string[] = [];
let saves = 0;

for (const file of files) {
  const path = join(RESEARCH, file);
  const [header, ...rows] = parseCsv(await readFile(path, "utf8"));
  const col = (name: string) => header.indexOf(name);
  const [iUrl, iArchive, iDate] = [col("fonte_url"), col("archivio_url"), col("data")];
  let changed = 0;
  for (const r of rows) {
    if (/^https?:\/\//.test(r[iArchive].trim())) continue;
    const url = r[iUrl].trim();
    if (!/^https?:\/\//.test(url)) continue;
    if (!found.has(url)) {
      let copy: string | null = null;
      try {
        copy = await existing(url, ymd(r[iDate].trim()));
        if (!copy && SAVE) {
          if (saves++ > 0) await sleep(SAVE_PAUSE_MS);
          copy = await save(url);
        }
      } catch (e) {
        log.push(`errore ${url}: ${(e as Error).message}`);
      }
      found.set(url, copy);
      log.push(`${copy ? "ok" : "manca"} ${url}${copy ? ` -> ${copy}` : ""}`);
      console.log(log.at(-1));
    }
    const copy = found.get(url);
    if (copy) {
      r[iArchive] = copy;
      changed++;
    }
  }
  if (changed) await writeFile(path, formatCsv([header, ...rows]));
  console.log(`${file}: ${changed} archivi aggiunti`);
}

const missing = [...found.values()].filter((v) => !v).length;
console.log(`fonti controllate ${found.size}, senza copia ${missing}`);
if (missing) process.exitCode = 1;
