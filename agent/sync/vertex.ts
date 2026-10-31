import { setTimeout as delay } from "node:timers/promises";
import { indexedText } from "../answer/answer.ts";
import { candidateFilter } from "../answer/retrieval.ts";
import type { IndexDocument } from "../ingest/export.ts";
import { fingerprint, record, type RemoteDocument, type SyncRemote } from "./refresh.ts";

export function createSyncRemote(options: { project: string; store: string; engine: string; token: string; signal: AbortSignal; fetch?: typeof fetch; pause?: (ms?: number) => Promise<void>; event?: (event: Record<string, unknown>) => void }): SyncRemote {
  if (options.project !== "paghi-tu-agent" || ![options.store, options.engine].every((id) => /^[a-zA-Z0-9_-]{3,100}$/.test(id)) || !options.token) throw new Error("invalid sync target");
  const root = `projects/${options.project}/locations/eu/collections/default_collection`;
  const branch = `${root}/dataStores/${options.store}/branches/0`; const host = "https://eu-discoveryengine.googleapis.com/v1/";
  const fetcher = options.fetch ?? fetch;
  const pause = options.pause ?? (async (ms = 10000) => { await delay(ms, undefined, { signal: options.signal }); });
  let requests = 0;
  async function api(method: string, path: string, body?: unknown) {
    if (++requests > 600 || options.signal.aborted) throw new Error("sync request/deadline limit");
    const response = await fetcher(host + path, { method, headers: { authorization: `Bearer ${options.token}`, "content-type": "application/json" }, ...(body === undefined ? {} : { body: JSON.stringify(body) }), redirect: "manual", signal: options.signal });
    if (!response.ok) throw new Error(`sync HTTP ${response.status}`);
    return record(await response.json());
  }
  async function list(): Promise<RemoteDocument[]> {
    const docs: RemoteDocument[] = []; const tokens = new Set<string>(); let pageToken = "";
    do {
      if (tokens.has(pageToken)) throw new Error("repeated page token"); tokens.add(pageToken);
      const page = await api("GET", `${branch}/documents?${new URLSearchParams({ pageSize: "1000", ...(pageToken ? { pageToken } : {}) })}`);
      if (page.documents !== undefined && !Array.isArray(page.documents)) throw new Error("invalid document list");
      for (const raw of (page.documents ?? []) as unknown[]) {
        const d = record(raw); const meta = record(d.structData);
        if (typeof d.id !== "string" || !/^[a-zA-Z0-9_-]{1,128}$/.test(d.id) || typeof meta.source_sha256 !== "string" || !/^[a-f0-9]{64}$/.test(meta.source_sha256) || typeof meta.dataset !== "string" || typeof meta.record !== "string") throw new Error("invalid remote document");
        docs.push({ id: d.id, hash: meta.source_sha256, dataset: meta.dataset, record: meta.record });
        if (docs.length > 10000) throw new Error("remote size limit");
      }
      if (page.nextPageToken !== undefined && typeof page.nextPageToken !== "string") throw new Error("invalid pagination");
      pageToken = String(page.nextPageToken ?? "");
    } while (pageToken);
    return docs;
  }
  return {
    list,
    async upsert(documents) {
      if (!documents.length || documents.length > 100) throw new Error("invalid batch");
      const payload = documents.map((d) => {
        const meta: Record<string, unknown> = { ...d.structData }; delete meta.testo;
        return { id: d.id, structData: { ...meta, source_sha256: fingerprint(d) }, content: { mimeType: "text/plain", rawBytes: Buffer.from(indexedText(d)).toString("base64") } };
      });
      let op = await api("POST", `${branch}/documents:import`, { inlineSource: { documents: payload }, reconciliationMode: "INCREMENTAL" });
      if (typeof op.name !== "string" || !op.name.startsWith(`${branch}/operations/`) || !/^[a-zA-Z0-9_-]+$/.test(op.name.slice(`${branch}/operations/`.length))) throw new Error("unexpected operation name");
      const operation = op.name; options.event?.({ phase: "IMPORT_ACCEPTED", operation });
      for (let i = 0; op.done !== true && i < 60; i++) { await pause(); op = await api("GET", operation); }
      if (op.done !== true || op.error || (Array.isArray(record(op.response).errorSamples) ? (record(op.response).errorSamples as unknown[]).length > 0 : record(op.response).errorSamples !== undefined) || Number(record(op.metadata).failureCount ?? 0) !== 0 || Number(record(op.metadata).successCount) !== documents.length) throw new Error("import incomplete or failed");
    },
    async remove(id) { if (!/^[a-zA-Z0-9_-]{1,128}$/.test(id)) throw new Error("invalid document ID"); await api("DELETE", `${branch}/documents/${encodeURIComponent(id)}`); },
    async ready(documents, removed) {
      const expected = new Map(documents.map((d) => [d.id, fingerprint(d)]));
      const probes = [...documents, ...removed.map((d) => ({ id: d.id, structData: { dataset: d.dataset, record: d.record } } as IndexDocument))];
      for (let round = 0; round < 6; round++) {
        let valid = true;
        for (let i = 0; i < probes.length; i += 12) {
          const group = probes.slice(i, i + 12); const filter = candidateFilter(group);
          if (!filter) throw new Error("missing readiness filter");
          await pause(500);
          const page = await api("POST", `${root}/engines/${options.engine}/servingConfigs/default_search:search`, { query: "", filter, pageSize: 20 });
          if (!Array.isArray(page.results) && page.results !== undefined) throw new Error("invalid search results");
          const found = new Map<string, string>();
          for (const result of (page.results ?? []) as unknown[]) { const d = record(record(result).document); if (typeof d.id !== "string" || found.has(d.id) || !group.some((p) => p.id === d.id)) { valid = false; continue; } found.set(d.id, String(record(d.structData).source_sha256 ?? "")); }
          if (page.nextPageToken) valid = false;
          for (const d of group) if (expected.has(d.id) ? found.get(d.id) !== expected.get(d.id) : found.has(d.id)) valid = false;
        }
        if (valid) return true;
        await pause();
      }
      return false;
    },
  };
}
