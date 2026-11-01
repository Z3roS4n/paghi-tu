import { describe, expect, it, vi } from "vitest";
import { createSyncRemote } from "./vertex.ts";
import { IndexDocument } from "../ingest/export.ts";
import { gunzipSync } from "node:zlib";
import { readFileSync } from "node:fs";
const rows = JSON.parse(gunzipSync(readFileSync(new URL("../runtime/fixtures/recorded-runs.jsonl.gz", import.meta.url))).toString().split("\n", 1)[0]).index as unknown[];
const doc = IndexDocument.parse(rows[0]);
const branch = "projects/paghi-tu-agent/locations/eu/collections/default_collection/dataStores/store/branches/0";
function create(replies: unknown[]) {
  const responses = [...replies]; const fetcher = vi.fn(async () => { const value = responses.shift(); if (value instanceof Error) throw value; return new Response(JSON.stringify(value)); });
  return { remote: createSyncRemote({ project: "paghi-tu-agent", store: "store", engine: "engine", token: "sentinel-token", signal: new AbortController().signal, fetch: fetcher, pause: async () => {} }), fetcher };
}
describe("Vertex sync REST boundary", () => {
  it("pins project and requires explicit token", () => { expect(() => createSyncRemote({ project: "wrong", store: "store", engine: "engine", token: "", signal: new AbortController().signal })).toThrow(); });
  it("rejects repeated pagination and malformed records", async () => {
    await expect(create([{ nextPageToken: "x" }, { nextPageToken: "x" }]).remote.list()).rejects.toThrow("repeated");
    await expect(create([{ documents: [{ id: "bad" }] }]).remote.list()).rejects.toThrow();
  });
  it("uses INCREMENTAL and accepts only complete successful operation counts", async () => {
    const { remote, fetcher } = create([{ name: branch + "/operations/op", done: true, metadata: { successCount: "1", failureCount: "0" }, response: { errorSamples: [] } }]);
    await remote.upsert([doc]);
    const init = fetcher.mock.calls[0] as unknown as [string, RequestInit];
    const body = JSON.parse(String(init[1].body)); expect(body.reconciliationMode).toBe("INCREMENTAL"); expect(body.inlineSource.documents[0].content.mimeType).toBe("text/plain"); expect(init[1].redirect).toBe("manual");
  });
  it("rejects foreign operation references and partial successes without retry", async () => {
    for (const op of [{ name: "https://evil.invalid/op" }, { name: branch + "/operations/op", done: true, metadata: { successCount: 0, failureCount: 1 } }]) {
      const { remote, fetcher } = create([op]); await expect(remote.upsert([doc])).rejects.toThrow(); expect(fetcher).toHaveBeenCalledOnce();
    }
  });
  it("does not replay a request with an unknown transport outcome", async () => {
    const { remote, fetcher } = create([new TypeError("unknown")]); await expect(remote.upsert([doc])).rejects.toThrow(); expect(fetcher).toHaveBeenCalledOnce();
  });
  it("waits for search fingerprints and rejects deleted documents still searchable", async () => {
    const { remote, fetcher } = create(Array(6).fill({ results: [{ document: { id: doc.id, structData: { source_sha256: "old" } } }] }));
    expect(await remote.ready([doc], [])).toBe(false); expect(fetcher).toHaveBeenCalledTimes(6);
    const removed = { id: doc.id, hash: "old", dataset: doc.structData.dataset, record: doc.structData.record };
    expect(await create(Array(6).fill({ results: [{ document: { id: doc.id } }] })).remote.ready([], [removed])).toBe(false);
  });
});
