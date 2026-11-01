import { readFileSync } from "node:fs";
import { createHash } from "node:crypto";
import { gunzipSync } from "node:zlib";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";
import { IndexDocument } from "../ingest/export.ts";
import { createCore } from "./core.ts";
import type { TransportRequest, TransportResponse } from "./index.ts";

type Recorded = {
  id: string;
  domanda: string;
  raw: unknown;
  adapted: unknown;
  validation: unknown;
  shown: unknown;
  gate: unknown;
  chiamata_google: boolean;
  api_usata: "locale" | "search" | "answer";
  expected_ids: string[] | null;
  search_attempts: number | null;
};

const fixture = fileURLToPath(new URL("./fixtures/recorded-runs.jsonl.gz", import.meta.url));
const manifest = JSON.parse(readFileSync(new URL("./fixtures/manifest.json", import.meta.url), "utf8")) as { fixtureSha256: string; sources: { rows: number }[] };
const compressed = readFileSync(fixture);
const [snapshot, ...records] = gunzipSync(compressed).toString("utf8").trim().split("\n").map((line) => JSON.parse(line) as unknown);
const docs = (snapshot as { index: unknown[] }).index.map((doc) => IndexDocument.parse(doc));
const index = new Map(docs.map((doc) => [doc.id, doc]));
const cases = records as Recorded[];
const config = { projectId: "paghi-tu-agent", engineId: "paghi-tu-agente", dataStoreId: "paghi-tu-dati", location: "eu" as const };

describe("portable runtime replay", () => {
  it("matches all 627 recorded factual turns without network", async () => {
    expect(cases).toHaveLength(627);
    expect(createHash("sha256").update(compressed).digest("hex")).toBe(manifest.fixtureSha256);
    expect(manifest.sources.map((source) => source.rows)).toEqual([465, 162]);
    const differences: string[] = [];
    for (const row of cases) {
      const core = createCore({ index, config });
      const requests: TransportRequest[] = [];
      const dispatch = async (request: TransportRequest): Promise<TransportResponse> => {
        requests.push(request);
        expect(request.kind).toBe(row.api_usata);
        if (row.api_usata === "search" && row.search_attempts === 2 && requests.length === 1) {
          return { status: 200, ok: true, json: { results: [] } };
        }
        return { status: 200, ok: true, json: row.api_usata === "answer" ? { answer: row.raw } : row.raw };
      };
      const result = await core.route(row.domanda, dispatch);
      if (JSON.stringify(result.shown) !== JSON.stringify(row.shown)) differences.push(`${row.id}:shown`);
      if (JSON.stringify(result.adapted) !== JSON.stringify(row.adapted)) differences.push(`${row.id}:adapted`);
      if (JSON.stringify(result.validation) !== JSON.stringify(row.validation)) differences.push(`${row.id}:validation`);
      if (JSON.stringify(result.gate) !== JSON.stringify(row.gate)) differences.push(`${row.id}:gate`);
      if (result.chiamata_google !== row.chiamata_google) differences.push(`${row.id}:called`);
      if (requests.length !== (row.search_attempts ?? (row.api_usata === "locale" ? 0 : 1))) differences.push(`${row.id}:count`);
    }
    expect(differences).toEqual([]);
  });
});
