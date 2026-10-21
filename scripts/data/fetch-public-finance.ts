// Scarica dalle fonti primarie i conti pubblici e li salva così come arrivano in data/raw/,
// con un manifest (URL, data, hash). Non trasforma niente: lo fa build-public-finance.ts.
// Unità MIO_NAC, non MIO_EUR: per gli anni prima del 1999 MIO_EUR converte le lire al cambio
// ECU dell'anno, MIO_NAC al tasso fisso di 1.936,27 come Banca d'Italia e ISTAT.
import { createHash } from "node:crypto";
import { mkdir, writeFile } from "node:fs/promises";
import { join } from "node:path";
import { inflateRawSync } from "node:zlib";

const RAW = "data/raw";
const EUROSTAT = "https://ec.europa.eu/eurostat/api/dissemination/sdmx/2.1/data";
const BANKITALIA = "https://a2a.bancaditalia.it/infostat/dataservices/export/IT/CSV/DATA/PUBLICATION/BANKITALIA/DIFF/FPI";

const COFOG_CODES = [
  "TOTAL",
  ...Array.from({ length: 10 }, (_, i) => `GF${String(i + 1).padStart(2, "0")}`),
  "GF0107",
  "GF1001",
  "GF1002",
  "GF1003",
];

const SOURCES = [
  {
    file: "eurostat/gov_10a_main.csv",
    url: `${EUROSTAT}/gov_10a_main/A.MIO_NAC+PC_GDP.S13.TE+TR+B9+D41PAY.IT?format=SDMX-CSV`,
  },
  {
    file: "eurostat/gov_10a_exp.csv",
    url: `${EUROSTAT}/gov_10a_exp/A.MIO_NAC.S13.${COFOG_CODES.join("+")}.TE.IT?format=SDMX-CSV`,
  },
  {
    file: "eurostat/gov_10dd_edpt1.csv",
    url: `${EUROSTAT}/gov_10dd_edpt1/A.MIO_NAC+PC_GDP.S13.GD.IT?format=SDMX-CSV`,
  },
  // Pubblicazione FPI: zip di zip. Serve solo la tavola TCCE0325 (debito lordo delle AP, mensile dal 1861).
  { file: "bancaditalia/TCCE0325.csv", url: BANKITALIA, zipEntry: "TCCE0325_IT.zip" },
] as const;

async function download(url: string) {
  const res = await fetch(url, { headers: { "User-Agent": "paghi-tu-data-pipeline" } });
  if (!res.ok) throw new Error(`${url} → HTTP ${res.status}`);
  return Buffer.from(await res.arrayBuffer());
}

// Lettore zip minimo (directory centrale + deflate): basta per i file di Banca d'Italia.
function unzip(buf: Buffer): Map<string, Buffer> {
  const eocd = buf.lastIndexOf(Buffer.from([0x50, 0x4b, 0x05, 0x06]));
  if (eocd < 0) throw new Error("zip senza directory centrale");
  const count = buf.readUInt16LE(eocd + 10);
  let p = buf.readUInt32LE(eocd + 16);
  const out = new Map<string, Buffer>();
  for (let i = 0; i < count; i++) {
    const method = buf.readUInt16LE(p + 10);
    const size = buf.readUInt32LE(p + 20);
    const nameLen = buf.readUInt16LE(p + 28);
    const extraLen = buf.readUInt16LE(p + 30);
    const commentLen = buf.readUInt16LE(p + 32);
    const local = buf.readUInt32LE(p + 42);
    const name = buf.toString("utf8", p + 46, p + 46 + nameLen);
    const start = local + 30 + buf.readUInt16LE(local + 26) + buf.readUInt16LE(local + 28);
    const data = buf.subarray(start, start + size);
    out.set(name, method === 8 ? inflateRawSync(data) : Buffer.from(data));
    p += 46 + nameLen + extraLen + commentLen;
  }
  return out;
}

function single(entries: Map<string, Buffer>) {
  if (entries.size !== 1) throw new Error(`atteso un solo file, trovati ${entries.size}`);
  return [...entries][0];
}

const fetchedAt = new Date().toISOString();
const manifest = [];
for (const src of SOURCES) {
  let body: Buffer = await download(src.url);
  let sourceFile: string | undefined;
  if ("zipEntry" in src) {
    const inner = unzip(body).get(src.zipEntry);
    if (!inner) throw new Error(`${src.zipEntry} non trovato nella pubblicazione FPI`);
    [sourceFile, body] = single(unzip(inner));
  }
  const text = body.toString("utf8").replace(/^﻿/, "");
  if (!/^(DATAFLOW|"DATA_OSS")/.test(text)) throw new Error(`${src.file}: intestazione inattesa «${text.slice(0, 80)}»`);
  await mkdir(join(RAW, src.file, ".."), { recursive: true });
  await writeFile(join(RAW, src.file), text);
  manifest.push({
    file: src.file,
    url: src.url,
    ...(sourceFile ? { fileOrigine: sourceFile } : {}),
    scaricato: fetchedAt,
    sha256: createHash("sha256").update(text).digest("hex"),
    righe: text.trimEnd().split("\n").length,
  });
  console.log(`${src.file} ${text.length} B`);
}
await writeFile(join(RAW, "manifest.json"), `${JSON.stringify(manifest, null, 2)}\n`);
