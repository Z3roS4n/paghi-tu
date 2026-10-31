import { describe, expect, it, vi } from "vitest";
vi.mock("server-only", () => ({}));
import { PreviewPolicy, PolicyDenied } from "./policy.ts";
import type { FirestoreStateStore } from "./state.ts";

class SerialState {
  docs = new Map<string, unknown>([["control", { enabled: true, indexSha256: "a".repeat(64) }]]);
  queue: Promise<void> = Promise.resolve();
  async transact<T>(keys: string[], fn: (docs: Map<string, unknown | null>) => { writes: Record<string, unknown>; value: T }): Promise<T> {
    const before = this.queue; let release!: () => void; this.queue = new Promise<void>((resolve) => { release = resolve; }); await before;
    try { const input = new Map(keys.map((key) => [key, this.docs.get(key) ?? null])); const result = fn(input); for (const [key, value] of Object.entries(result.writes)) this.docs.set(key, value); return result.value; } finally { release(); }
  }
}
const base = { cookie: "c".repeat(43), ip: "203.0.113.1", question: "Domanda", now: Date.UTC(2026, 9, 31) };
describe("shared policy semantics", () => {
  it("admits one of two concurrent instances and deduplicates a request", async () => {
    const store = new SerialState(); const a = new PreviewPolicy(store as unknown as FirestoreStateStore, "s".repeat(32), "a".repeat(64)); const b = new PreviewPolicy(store as unknown as FirestoreStateStore, "s".repeat(32), "a".repeat(64));
    const results = await Promise.allSettled([a.admit({ ...base, requestId: "11111111-1111-4111-8111-111111111111" }), b.admit({ ...base, requestId: "22222222-2222-4222-8222-222222222222" })]);
    expect(results.filter((r) => r.status === "fulfilled")).toHaveLength(1);
    await expect(a.admit({ ...base, requestId: "11111111-1111-4111-8111-111111111111", now: base.now + 46000 })).rejects.toBeInstanceOf(PolicyDenied);
  });
  it("invalidates in-flight context on reset and caps dispatch attempts", async () => {
    const store = new SerialState(); const policy = new PreviewPolicy(store as unknown as FirestoreStateStore, "s".repeat(32), "a".repeat(64));
    const admitted = await policy.admit({ ...base, requestId: "11111111-1111-4111-8111-111111111111" });
    await policy.authorizeDispatch(admitted, base.now + 1); await policy.authorizeDispatch(admitted, base.now + 2); await policy.authorizeDispatch(admitted, base.now + 3);
    await expect(policy.authorizeDispatch(admitted, base.now + 4)).rejects.toMatchObject({ code: "cap" });
    await policy.reset(base.cookie, admitted.conversationId, base.now + 5); await policy.finalize(admitted, { question: "q", ids: [], fingerprints: [], fallback: { testo: "a", astensione: false, citazioni: [] } }, false, base.now + 6);
    const session = store.docs.get(admitted.sessionKey) as { conversations: Record<string, { context?: unknown }> };
    expect(session.conversations[admitted.conversationId].context).toBeUndefined();
  });
  it("leaves a persistent stop before remote fetch if the owner crashes", async () => {
    const store = new SerialState(); const policy = new PreviewPolicy(store as unknown as FirestoreStateStore, "s".repeat(32), "a".repeat(64));
    const admitted = await policy.admit({ ...base, requestId: "33333333-3333-4333-8333-333333333333" });
    await policy.authorizeDispatch(admitted, base.now + 1);
    await expect(policy.admit({ ...base, requestId: "44444444-4444-4444-8444-444444444444", now: base.now + 60000 })).rejects.toMatchObject({ code: "busy" });
    expect(store.docs.get("global")).toMatchObject({ halted: true });
  });
});


describe("index version gate", () => {
  it("rejects missing/wrong snapshot and an active sync before admission", async () => {
    for (const control of [{ enabled: true }, { enabled: true, indexSha256: "b".repeat(64) }, { enabled: true, indexSha256: "a".repeat(64), sync: { owner: "sync" } }]) {
      const state = new SerialState(); state.docs.set("control", control);
      const policy = new PreviewPolicy(state as unknown as FirestoreStateStore, "s".repeat(32), "a".repeat(64));
      await expect(policy.admit({ cookie: "c", ip: "203.0.113.1", requestId: "request", question: "domanda" })).rejects.toMatchObject({ code: "disabled" });
      expect(state.docs.has("global")).toBe(false);
    }
  });
  it("rechecks the snapshot and sync marker before every remote dispatch", async () => {
    const state = new SerialState(); const policy = new PreviewPolicy(state as unknown as FirestoreStateStore, "s".repeat(32), "a".repeat(64));
    const admission = await policy.admit({ cookie: "c", ip: "203.0.113.1", requestId: "request", question: "domanda" });
    state.docs.set("control", { enabled: true, indexSha256: "b".repeat(64) });
    await expect(policy.authorizeDispatch(admission)).rejects.toMatchObject({ code: "disabled" });
    expect(state.docs.get("global")).toMatchObject({ monthCount: 0 });
  });
});
