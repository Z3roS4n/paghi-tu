import { readFileSync } from "node:fs";
import { gunzipSync } from "node:zlib";
import { describe, expect, it, vi } from "vitest";
import { IndexDocument, sha256, toJsonl } from "../ingest/export.ts";
import { diffSnapshot, fingerprint, parseSnapshot, record, recoverSync, refreshIndex, type SyncRemote, type SyncState } from "./refresh.ts";
const fixture = new URL("../runtime/fixtures/recorded-runs.jsonl.gz", import.meta.url);
const rows = JSON.parse(gunzipSync(readFileSync(fixture)).toString().split("\n", 1)[0]).index as unknown[];
const docs = rows.slice(0, 22).map((d) => IndexDocument.parse(d));
const snapshot = (ds = docs) => parseSnapshot(toJsonl(ds), { sha256: sha256(toJsonl(ds)), documenti: ds.length });
class State {
  docs = new Map<string, unknown>([["control", { enabled: true, version: 1 }]]);
  queue: Promise<void> = Promise.resolve();
  async transact<T>(keys: string[], fn: (values: Map<string, unknown | null>) => { writes: Record<string, unknown>; value: T }): Promise<T> {
    const before = this.queue; let release!: () => void; this.queue = new Promise<void>((resolve) => { release = resolve; }); await before;
    try { const result = fn(new Map(keys.map((k) => [k, this.docs.get(k) ?? null]))); for (const [k, v] of Object.entries(result.writes)) this.docs.set(k, v); return result.value; } finally { release(); }
  }
}
function remote(seed = docs) {
  const stored = new Map(seed.map((d) => [d.id, d]));
  const r = {
    list: vi.fn(async () => [...stored.values()].map((d) => ({ id: d.id, hash: fingerprint(d), dataset: d.structData.dataset, record: d.structData.record }))),
    upsert: vi.fn(async (ds: IndexDocument[]) => { ds.forEach((d) => stored.set(d.id, d)); }),
    remove: vi.fn(async (id: string) => { stored.delete(id); }), ready: vi.fn(async () => true),
  } satisfies SyncRemote;
  return r;
}
const commit = "a".repeat(40);
describe("guarded index refresh", () => {
  it("rejects corrupt, duplicate and empty snapshots before any I/O", () => {
    expect(() => parseSnapshot(toJsonl(docs), { sha256: "wrong", documenti: docs.length })).toThrow();
    expect(() => snapshot([docs[0], docs[0]])).toThrow(); expect(() => snapshot([])).toThrow();
  });
  it("does not write Vertex on unchanged data and restores previously enabled control", async () => {
    const state = new State(); const r = remote(); const out = await refreshIndex({ snapshot: snapshot(), state: state as SyncState, remote: r, commit });
    expect(out).toMatchObject({ phase: "UNCHANGED", enabled: true, upserted: 0, removed: 0 }); expect(r.upsert).not.toHaveBeenCalled(); expect(r.remove).not.toHaveBeenCalled();
    expect(state.docs.get("control")).toMatchObject({ enabled: true, indexSha256: snapshot().hash }); expect(record(state.docs.get("control")).sync).toBeUndefined();
  });
  it("imports additions/corrections before removing excluded IDs", async () => {
    const state = new State(); const before = docs.slice(0, 20); const corrected = structuredClone(docs[1]); corrected.structData.titolo += " corretto";
    const wanted = [corrected, ...docs.slice(2, 21)]; const r = remote(before);
    const out = await refreshIndex({ snapshot: snapshot(wanted), state, remote: r, commit });
    expect(out).toMatchObject({ upserted: 2, removed: 1 }); expect(r.upsert.mock.invocationCallOrder[0]).toBeLessThan(r.remove.mock.invocationCallOrder[0]);
  });
  it("never activates a control initially disabled", async () => {
    const state = new State(); state.docs.set("control", { enabled: false });
    expect((await refreshIndex({ snapshot: snapshot(), state, remote: remote(), commit })).enabled).toBe(false);
  });
  it("rejects a competing sync and global uncertain/in-flight states", async () => {
    const state = new State(); const results = await Promise.allSettled([1, 2].map(() => refreshIndex({ snapshot: snapshot(), state, remote: remote(), commit })));
    expect(results.filter((r) => r.status === "fulfilled")).toHaveLength(1);
    for (const global of [{ halted: true }, { lease: { owner: "x", until: Date.now() + 100000 } }]) {
      state.docs.set("global", global); await expect(refreshIndex({ snapshot: snapshot(), state, remote: remote(), commit })).rejects.toThrow();
    }
  });
  it("leaves suspended after failed import and never starts deletions", async () => {
    const state = new State(); const r = remote(docs.slice(0, 20)); r.upsert.mockRejectedValue(new Error("unknown outcome"));
    await expect(refreshIndex({ snapshot: snapshot(docs.slice(1, 21)), state, remote: r, commit })).rejects.toThrow();
    expect(r.remove).not.toHaveBeenCalled(); expect(state.docs.get("control")).toMatchObject({ enabled: false, sync: { hash: snapshot(docs.slice(1, 21)).hash } });
  });
  it("blocks excessive deletions without changing remote data", async () => {
    expect(() => diffSnapshot(snapshot(docs.slice(0, 1)), docs.map((d) => ({ id: d.id, hash: fingerprint(d), dataset: d.structData.dataset, record: d.structData.record })))).toThrow("removal limit");
  });
  it("rejects missing/stale remote records and search that is not ready", async () => {
    for (const stale of [true, false]) {
      const state = new State(); const r = remote(); if (stale) r.list.mockResolvedValue([]); else r.ready.mockResolvedValue(false);
      r.upsert.mockImplementation(async () => {});
      await expect(refreshIndex({ snapshot: snapshot(), state, remote: r, commit })).rejects.toThrow(); expect(record(state.docs.get("control")).enabled).toBe(false);
    }
  });
  it("preserves an operator kill during readiness and publishes only a disabled stamp", async () => {
    const state = new State(); const r = remote(); r.ready.mockImplementation(async () => { const c = record(state.docs.get("control")); state.docs.set("control", { ...c, enabled: false, version: Number(c.version) + 1 }); return true; });
    const out = await refreshIndex({ snapshot: snapshot(), state, remote: r, commit }); expect(out.enabled).toBe(false);
  });
  it("keeps an uncertain acquisition locked and rejects a blind replay", async () => {
    const state = new State(); const ambiguous: SyncState = { transact: async (keys, fn) => { await state.transact(keys, fn); throw new Error("commit unknown"); } };
    await expect(refreshIndex({ snapshot: snapshot(), state: ambiguous, remote: remote(), commit, owner: "owner" })).rejects.toThrow();
    expect(record(state.docs.get("control")).enabled).toBe(false);
    await expect(refreshIndex({ snapshot: snapshot(), state, remote: remote(), commit })).rejects.toThrow();
  });
  it("requires disabled control, exact owner and acknowledgment to recover; invalidates stamp", () => {
    const c = { enabled: false, version: 4, indexSha256: "a".repeat(64), sync: { owner: "owner" } };
    for (const [owner, ack] of [["other", true], ["owner", false]] as const) expect(() => recoverSync(c, owner, ack)).toThrow();
    expect(() => recoverSync({ ...c, enabled: true }, "owner", true)).toThrow();
    const next = recoverSync(c, "owner", true); expect(next.enabled).toBe(false); expect(next.sync).toBeUndefined(); expect(next.indexSha256).toBeUndefined();
  });
});


it("does not replay an uncertain publication; an applied stamp was fully verified", async () => {
  const state = new State(); const r = remote();
  const uncertain: SyncState = { transact: async (keys, fn) => {
    let publishing = false;
    const value = await state.transact(keys, (docs) => { const result = fn(docs); publishing = !!result.writes.control && record(result.writes.control).indexSha256 !== undefined && record(result.writes.control).sync === undefined; return result; });
    if (publishing) throw new Error("publication acknowledgment lost");
    return value;
  } };
  await expect(refreshIndex({ snapshot: snapshot(), state: uncertain, remote: r, commit })).rejects.toThrow();
  expect(r.ready).toHaveBeenCalledOnce(); expect(r.upsert).not.toHaveBeenCalled();
  expect(state.docs.get("control")).toMatchObject({ enabled: true, indexSha256: snapshot().hash });
});
