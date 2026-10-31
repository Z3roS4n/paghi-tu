import { describe, expect, it, vi } from "vitest";
vi.mock("server-only", () => ({}));
import { FirestoreStateStore, CommitUncertain, StateUnavailable, TransactionRejected } from "./state.ts";

const root = "projects/paghi-tu-agent/databases/preview-db/documents/agent_preview";
const name = `${root}/${Buffer.from("control").toString("base64url")}`;
const makeStore = (fetcher: typeof fetch) => new FirestoreStateStore({ projectId: "paghi-tu-agent", databaseId: "preview-db", namespace: "preview", accessToken: async () => "test-token", fetch: fetcher });
describe("Firestore REST transaction adapter", () => {
  it("reads a consistent snapshot and commits writes in the transaction", async () => {
    const calls: { url: string; body: unknown }[] = [];
    const fetcher = vi.fn(async (url: string | URL | Request, init?: RequestInit) => {
      calls.push({ url: String(url), body: JSON.parse(String(init?.body)) });
      if (String(url).endsWith(":beginTransaction")) return new Response(JSON.stringify({ transaction: "tx" }));
      if (String(url).endsWith(":batchGet")) return new Response(JSON.stringify([{ found: { name, fields: { payload: { stringValue: JSON.stringify({ enabled: true }) } } } }]));
      return new Response("{}", { status: 200 });
    });
    const value = await makeStore(fetcher as typeof fetch).transact(["control"], (docs) => ({ writes: { control: { enabled: false } }, value: docs.get("control") }));
    expect(value).toEqual({ enabled: true });
    expect(calls.map((call) => call.url.split(":").pop())).toEqual(["beginTransaction", "batchGet", "commit"]);
    expect(calls[2].body).toMatchObject({ transaction: "tx", writes: [{ update: { name } }] });
  });
  it("fails closed on an incomplete batchGet", async () => {
    const fetcher = vi.fn(async (url: string | URL | Request) => new Response(String(url).endsWith(":beginTransaction") ? '{"transaction":"tx"}' : String(url).endsWith(":batchGet") ? "[]" : "{}"));
    await expect(makeStore(fetcher as typeof fetch).transact(["control"], () => ({ writes: {}, value: null }))).rejects.toBeInstanceOf(StateUnavailable);
    expect(fetcher).toHaveBeenCalledTimes(3);
    expect(String(fetcher.mock.calls[2][0])).toContain(":rollback");
  });
  it("treats an unknown commit as uncertain and never replays it", async () => {
    const fetcher = vi.fn(async (url: string | URL | Request) => {
      if (String(url).endsWith(":beginTransaction")) return new Response('{"transaction":"tx"}');
      if (String(url).endsWith(":batchGet")) return new Response(JSON.stringify([{ missing: name }]));
      throw new Error("network lost");
    });
    await expect(makeStore(fetcher as typeof fetch).transact(["control"], () => ({ writes: { control: { enabled: false } }, value: null }))).rejects.toBeInstanceOf(CommitUncertain);
    expect(fetcher).toHaveBeenCalledTimes(3);
  });
  it("recalculates an ABORTED transaction with a bounded retry", async () => {
    let commits = 0; let callbacks = 0;
    const fetcher = vi.fn(async (url: string | URL | Request) => {
      if (String(url).endsWith(":beginTransaction")) return new Response('{"transaction":"tx"}');
      if (String(url).endsWith(":batchGet")) return new Response(JSON.stringify([{ missing: name }]));
      commits++;
      return commits === 1 ? new Response('{"error":{"status":"ABORTED"}}', { status: 409 }) : new Response("{}", { status: 200 });
    });
    await expect(makeStore(fetcher as typeof fetch).transact(["control"], () => { callbacks++; return { writes: { control: { enabled: false } }, value: "ok" }; })).resolves.toBe("ok");
    expect(callbacks).toBe(2); expect(commits).toBe(2);
  });
  it("accepts pretty JSON array and maps out-of-order documents", async () => {
    const global = `${root}/${Buffer.from("global").toString("base64url")}`;
    const fetcher = vi.fn(async (url: string | URL | Request) => {
      if (String(url).endsWith(":beginTransaction")) return new Response('{"transaction":"tx"}');
      if (String(url).endsWith(":batchGet")) return new Response(JSON.stringify([{ found: { name: global, fields: { payload: { stringValue: '{"dayCount":1}' } } } }, { missing: name }], null, 2));
      return new Response("{}", { status: 200 });
    });
    await expect(makeStore(fetcher as typeof fetch).transact(["control", "global"], (docs) => ({ writes: {}, value: [docs.get("control"), docs.get("global")] }))).resolves.toEqual([null, { dayCount: 1 }]);
  });
  it("rejects duplicate, unrequested and corrupt array rows before commit", async () => {
    for (const rows of [[{ missing: name }, { missing: name }], [{ missing: `${root}/not-requested` }], [{ found: { name, fields: {} } }], [{ error: { status: "INTERNAL" } }]]) {
      const paths: string[] = [];
      const fetcher = vi.fn(async (url: string | URL | Request) => { paths.push(String(url)); if (String(url).endsWith(":beginTransaction")) return new Response('{"transaction":"tx"}'); if (String(url).endsWith(":batchGet")) return new Response(JSON.stringify(rows)); return new Response("{}"); });
      await expect(makeStore(fetcher as typeof fetch).transact(["control"], () => ({ writes: {}, value: null }))).rejects.toBeInstanceOf(StateUnavailable);
      expect(paths.at(-1)).toContain(":rollback"); expect(paths.some((path) => path.endsWith(":commit"))).toBe(false);
    }
  });
  it("rolls back a policy denial using an independent cleanup signal", async () => {
    const requests: { path: string; signal?: AbortSignal }[] = [];
    const fetcher = vi.fn(async (url: string | URL | Request, init?: RequestInit) => {
      requests.push({ path: String(url), signal: init?.signal ?? undefined });
      if (String(url).endsWith(":beginTransaction")) return new Response('{"transaction":"tx"}');
      if (String(url).endsWith(":batchGet")) return new Response(JSON.stringify([{ missing: name }]));
      return new Response("{}", { status: 200 });
    });
    const controller = new AbortController();
    const store = new FirestoreStateStore({ projectId: "paghi-tu-agent", databaseId: "preview-db", namespace: "preview", accessToken: async () => "test-token", fetch: fetcher as typeof fetch, signal: controller.signal });
    await expect(store.transact(["control"], () => { controller.abort(); throw new TransactionRejected("disabled"); })).rejects.toBeInstanceOf(TransactionRejected);
    expect(requests.map((row) => row.path.split(":").pop())).toEqual(["beginTransaction", "batchGet", "rollback"]);
    expect(requests[2].signal).not.toBe(controller.signal);
    expect(requests[2].signal?.aborted).toBe(false);
  });
});
