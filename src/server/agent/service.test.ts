import { describe, expect, it, vi } from "vitest";
import { createHash } from "node:crypto";
import { readFileSync } from "node:fs";
import { gunzipSync } from "node:zlib";
import { fileURLToPath } from "node:url";
vi.mock("server-only", () => ({}));
vi.mock("../../../agent/runtime/index.ts", () => ({ createAgentRuntime: ({ transport }: { transport: (request: { kind: "search"; url: string; body: object }, signal: AbortSignal) => Promise<unknown> }) => ({ reply: async () => {
  const request = { kind: "search" as const, url: "https://eu-discoveryengine.googleapis.com/v1/projects/paghi-tu-agent/locations/eu/collections/default_collection/engines/engine/servingConfigs/default_search:search", body: {} };
  for (let i = 0; i < 4; i++) await transport(request, new AbortController().signal);
  return { shown: { testo: "", astensione: true, citazioni: [] }, mode: "astensione" };
} }) }));
import { createAgentHandler } from "./service.ts";
import type { AgentConfig } from "./config.ts";
import type { FirestoreStateStore } from "./state.ts";
import { snapshotHash } from "../../../agent/sync/refresh.ts";
import { IndexDocument } from "../../../agent/ingest/export.ts";

const config: AgentConfig = { projectId: "paghi-tu-agent", projectNumber: "123456789012", poolId: "pool", providerId: "provider", serviceAccountEmail: "agent@paghi-tu-agent.iam.gserviceaccount.com", engineId: "engine", dataStoreId: "store", databaseId: "preview-db", allowedOrigin: "https://preview.example.vercel.app", ipHashSecret: "x".repeat(32), vercelOwnerId: "team_test", vercelProjectId: "prj_test", vercelAudience: "https://vercel.com/team_test", vercelIssuer: "https://oidc.vercel.com/team_test" };
const body = JSON.stringify({ action: "ask", question: "Ciao", requestId: "11111111-1111-4111-8111-111111111111" });
const request = (headers: Record<string, string>, payload = body) => new Request("https://preview.example.vercel.app/api/agent", { method: "POST", headers: { "content-type": "application/json", ...headers }, body: payload });
describe("strict agent HTTP gate", () => {
  const getToken = vi.fn(async () => "token");
  const state = vi.fn(() => ({} as FirestoreStateStore));
  const index = vi.fn(async () => new Map());
  it("returns 503 before auth when disabled", async () => { const response = await createAgentHandler({ config: null, getToken, state, index })(request({ origin: config.allowedOrigin })); expect(response.status).toBe(503); expect(getToken).not.toHaveBeenCalled(); });
  it("rejects Origin and Host spoof without auth", async () => { const response = await createAgentHandler({ config, getToken, state, index })(request({ origin: "https://attacker.invalid", host: "preview.example.vercel.app" })); expect(response.status).toBe(403); expect(getToken).not.toHaveBeenCalled(); });
  it("rejects client provenance and oversized chunked body", async () => { const handler = createAgentHandler({ config, getToken, state, index }); const invalid = await handler(request({ origin: config.allowedOrigin }, JSON.stringify({ ...JSON.parse(body), ids: ["trusted"] }))); expect(invalid.status).toBe(400); const large = await handler(request({ origin: config.allowedOrigin }, body + "x".repeat(4100))); expect(large.status).toBe(413); expect(getToken).not.toHaveBeenCalled(); });
  it("fails closed without the trusted Vercel IP header", async () => { const response = await createAgentHandler({ config, getToken, state, index })(request({ origin: config.allowedOrigin, "x-forwarded-for": "203.0.113.1" })); expect(response.status).toBe(503); expect(getToken).not.toHaveBeenCalled(); });
  it("rejects a malformed session cookie without replacing it", async () => { const response = await createAgentHandler({ config, getToken, state, index })(request({ origin: config.allowedOrigin, cookie: "__Host-paghi-agent=forged" })); expect(response.status).toBe(409); expect(response.headers.get("set-cookie")).toBeNull(); expect(getToken).not.toHaveBeenCalled(); });
  it("logs only fixed metadata for invalid bodies", async () => { const log = vi.fn(); const response = await createAgentHandler({ config, getToken, state, index, log })(request({ origin: config.allowedOrigin }, "SECRET_INVALID_BODY")); expect(response.status).toBe(400); expect(log).toHaveBeenCalledOnce(); expect(JSON.stringify(log.mock.calls)).not.toContain("SECRET_INVALID_BODY"); expect(log.mock.calls[0][0]).toMatchObject({ status: 400, attempts: 0 }); });
  it("never performs a fourth backend fetch", async () => {
    const docs = new Map<string, unknown>([["control", { enabled: true, indexSha256: snapshotHash(new Map()) }]]);
    const adapter = { transact: async <T,>(keys: string[], fn: (input: Map<string, unknown | null>) => { writes: Record<string, unknown>; value: T }): Promise<T> => {
      const result = fn(new Map(keys.map((key) => [key, docs.get(key) ?? null])));
      for (const [key, value] of Object.entries(result.writes)) docs.set(key, value);
      return result.value;
    } };
    const fetchBackend = vi.fn(async () => new Response("{}", { status: 200 }));
    const handler = createAgentHandler({ config, getToken: async () => "token", state: () => adapter as unknown as FirestoreStateStore, index, fetch: fetchBackend as typeof fetch });
    const response = await handler(request({ origin: config.allowedOrigin, "x-vercel-forwarded-for": "203.0.113.1" }));
    expect(response.status).toBe(503);
    expect(fetchBackend).toHaveBeenCalledTimes(3);
  });
  it("keeps fail-stop when the real runtime swallows an unknown formulation outcome", async () => {
    vi.doUnmock("../../../agent/runtime/index.ts"); vi.resetModules();
    const { createAgentHandler: realHandler } = await import("./service.ts");
    const fixture = fileURLToPath(new URL("../../../agent/runtime/fixtures/recorded-runs.jsonl.gz", import.meta.url));
    const snapshot = JSON.parse(gunzipSync(readFileSync(fixture)).toString("utf8").split("\n", 1)[0]) as { index: unknown[] };
    const gov = IndexDocument.parse(snapshot.index.find((doc) => IndexDocument.safeParse(doc).data?.id === "governi--g60"));
    const sha = createHash("sha256").update(JSON.stringify(gov)).digest("hex");
    const docs = new Map<string, unknown>([["control", { enabled: true, indexSha256: snapshotHash(new Map([[gov.id, gov]])) }]]);
    const adapter = { transact: async <T,>(keys: string[], fn: (input: Map<string, unknown | null>) => { writes: Record<string, unknown>; value: T }): Promise<T> => {
      const result = fn(new Map(keys.map((key) => [key, docs.get(key) ?? null])));
      for (const [key, value] of Object.entries(result.writes)) docs.set(key, value);
      return result.value;
    } };
    const fetchBackend = vi.fn(async () => {
      if (fetchBackend.mock.calls.length === 1) return new Response(JSON.stringify({ results: [{ document: { id: gov.id, structData: { source_sha256: sha } } }] }), { status: 200 });
      throw new TypeError("SECRET_PROVIDER_ERROR");
    });
    const logs: unknown[] = [];
    let now = Date.now();
    const handler = realHandler({ config, getToken: async () => "SECRET_ACCESS_TOKEN", state: () => adapter as unknown as FirestoreStateStore, index: async () => new Map([[gov.id, gov]]), fetch: fetchBackend as typeof fetch, now: () => now, log: (entry) => logs.push(entry) });
    const question = "Chi era il presidente del Consiglio in Italia il 17 maggio 2007? SECRET_QUESTION";
    const first = await handler(request({ origin: config.allowedOrigin, "x-vercel-forwarded-for": "203.0.113.1" }, JSON.stringify({ action: "ask", question, requestId: "aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa" })));
    expect(first.status).toBe(503);
    expect(docs.get("global")).toMatchObject({ halted: true });
    now += 60000;
    const second = await handler(request({ origin: config.allowedOrigin, "x-vercel-forwarded-for": "203.0.113.1" }, JSON.stringify({ action: "ask", question, requestId: "bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb" })));
    expect(second.status).toBe(409);
    expect(fetchBackend).toHaveBeenCalledTimes(2);
    const safeLog = JSON.stringify(logs);
    for (const secret of ["SECRET_QUESTION", "SECRET_PROVIDER_ERROR", "SECRET_ACCESS_TOKEN", "203.0.113.1"]) expect(safeLog).not.toContain(secret);
    expect(logs).toHaveLength(2);
  });
});


it("rejects a stale deployed bundle before any Vertex fetch", async () => {
  const fetchBackend = vi.fn();
  const adapter = { transact: async <T,>(keys: string[], fn: (input: Map<string, unknown | null>) => { writes: Record<string, unknown>; value: T }) => fn(new Map(keys.map((key) => [key, key === "control" ? { enabled: true, indexSha256: "b".repeat(64) } : null]))).value };
  const handler = createAgentHandler({ config, getToken: async () => "token", state: () => adapter as unknown as FirestoreStateStore, index: async () => new Map(), fetch: fetchBackend });
  expect((await handler(request({ origin: config.allowedOrigin, "x-vercel-forwarded-for": "203.0.113.1" }))).status).toBe(503);
  expect(fetchBackend).not.toHaveBeenCalled();
});
