// Scrive l'export per l'indice dell'agente e il suo manifest: npm run ingest:build
// Non va in rete: legge solo data/ e scrive solo in agent/ingest/.
import { mkdir, writeFile } from "node:fs/promises";
import { join } from "node:path";
import { buildDocuments, sha256, toJsonl, type IndexDocument } from "./export.ts";
import { loadSiteData } from "./load.ts";

const DIR = "agent/ingest";
const { documents, excluded } = buildDocuments(await loadSiteData());
const jsonl = toJsonl(documents);

const datasetOf = (d: IndexDocument) => d.structData.dataset;
const perDataset: Record<string, number> = {};
for (const d of documents) perDataset[datasetOf(d)] = (perDataset[datasetOf(d)] ?? 0) + 1;

const manifest = {
  file: "out/documenti.jsonl",
  documenti: documents.length,
  sha256: sha256(jsonl),
  perDataset: Object.fromEntries(Object.keys(perDataset).sort().map((k) => [k, perDataset[k]])),
  esclusi: excluded,
};

await mkdir(join(DIR, "out"), { recursive: true });
await writeFile(join(DIR, "out", "documenti.jsonl"), jsonl);
await writeFile(join(DIR, "manifest.json"), `${JSON.stringify(manifest, null, 2)}\n`);
console.log(`export: ${documents.length} documenti, ${excluded.length} esclusi → ${DIR}/out/documenti.jsonl, ${DIR}/manifest.json`);
