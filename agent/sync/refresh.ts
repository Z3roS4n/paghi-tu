import { randomUUID } from "node:crypto";
import { IndexDocument, sha256, toJsonl } from "../ingest/export.ts";
import type { FirestoreStateStore } from "../../src/server/agent/state.ts";

export type Snapshot = { hash: string; documents: IndexDocument[] };
export type RemoteDocument = { id: string; hash: string; dataset: string; record: string };
export type SyncRemote = { list: () => Promise<RemoteDocument[]>; upsert: (documents: IndexDocument[]) => Promise<void>; remove: (id: string) => Promise<void>; ready: (documents: IndexDocument[], removed: RemoteDocument[]) => Promise<boolean> };
export type SyncState = Pick<FirestoreStateStore, "transact">;
const isRecord = (v: unknown): v is Record<string, unknown> => !!v && typeof v === "object" && !Array.isArray(v);
export const record = (v: unknown): Record<string, unknown> => isRecord(v) ? v : {};
export const fingerprint = (d: IndexDocument) => sha256(JSON.stringify(d));
export const snapshotHash = (index: ReadonlyMap<string, IndexDocument>) => sha256(toJsonl([...index.values()]));
export function parseSnapshot(jsonl: string, manifest: unknown): Snapshot {
  const m = record(manifest);
  if (m.sha256 !== sha256(jsonl)) throw new Error("export hash mismatch");
  const documents = jsonl.trim().split("\n").map((line) => IndexDocument.parse(JSON.parse(line)));
  if (!documents.length || documents.length > 10000 || documents.length !== m.documenti || new Set(documents.map((d) => d.id)).size !== documents.length || toJsonl(documents) !== jsonl) throw new Error("invalid export");
  return { hash: sha256(jsonl), documents };
}
export function diffSnapshot(snapshot: Snapshot, stored: RemoteDocument[]) {
  if (new Set(stored.map((d) => d.id)).size !== stored.length) throw new Error("duplicate remote ID");
  const old = new Map(stored.map((d) => [d.id, d])); const wanted = new Set(snapshot.documents.map((d) => d.id));
  const upserts = snapshot.documents.filter((d) => old.get(d.id)?.hash !== fingerprint(d));
  const removed = stored.filter((d) => !wanted.has(d.id));
  if (removed.length > 100 || removed.length > stored.length * 0.1) throw new Error("removal limit exceeded; operator review required");
  return { upserts, removed };
}
export function assertIdleGlobal(value: unknown, now = Date.now()) {
  if (value === null) return;
  const g = record(value);
  if (typeof g.day !== "string" || typeof g.month !== "string" || !Number.isInteger(g.dayCount) || Number(g.dayCount) < 0 || !Number.isInteger(g.monthCount) || Number(g.monthCount) < 0 || (g.halted !== undefined && typeof g.halted !== "boolean")) throw new Error("invalid global state");
  if (g.lease !== undefined && (typeof record(g.lease).owner !== "string" || !Number.isFinite(record(g.lease).until))) throw new Error("invalid global lease");
  if (g.halted || (g.lease && Number(record(g.lease).until) > now)) throw new Error("global is not idle");
}
// One Vertex index serves every environment, so every environment state is locked before the index
// changes and stamped after it. `state` alone keeps the single-environment behavior unchanged.
export async function refreshIndex(input: { snapshot: Snapshot; remote: SyncRemote; state?: SyncState; states?: readonly SyncState[]; commit: string; owner?: string; now?: () => number; event?: (event: Record<string, unknown>) => void }) {
  const { snapshot, remote } = input; const owner = input.owner ?? randomUUID(); const now = input.now ?? Date.now;
  const states = input.states ?? (input.state ? [input.state] : []);
  if (states.length === 0 || (input.states && input.state)) throw new Error("sync states required");
  const versions: number[] = []; const wasEnabled: boolean[] = [];
  // Read-only preflight: a removal over the limit or an invalid remote listing stops here, before the
  // assistant is suspended and before a still-valid stamp could be lost in recovery.
  diffSnapshot(snapshot, await remote.list());
  // No expiry unlock: a crashed worker may still have an import running remotely. A lock that fails on a
  // later state leaves the earlier ones disabled with the marker: recovery is an operator decision.
  for (const [i, state] of states.entries()) {
    await state.transact(["control", "global"], (docs) => {
      const c = record(docs.get("control")); assertIdleGlobal(docs.get("global"), now());
      if (typeof c.enabled !== "boolean" || c.sync !== undefined || (c.version !== undefined && (!Number.isInteger(c.version) || Number(c.version) < 0))) throw new Error("sync blocked by state");
      wasEnabled[i] = c.enabled; versions[i] = Number.isInteger(c.version) ? Number(c.version) + 1 : 1;
      return { writes: { control: { ...c, enabled: false, version: versions[i], sync: { owner, startedAt: now(), hash: snapshot.hash, commit: input.commit } } }, value: undefined };
    });
  }
  input.event?.({ phase: "LOCKED", owner, hash: snapshot.hash });
  async function assertOwned() {
    for (const [i, state] of states.entries()) {
      await state.transact(["control", "global"], (docs) => {
        const c = record(docs.get("control")); assertIdleGlobal(docs.get("global"), now());
        if (record(c.sync).owner !== owner || c.version !== versions[i] || c.enabled !== false) throw new Error("sync ownership changed");
        return { writes: {}, value: undefined };
      });
    }
  }
  // Before publication, failures leave the disabled control and persistent marker.
  // An uncertain final commit may already have published a fully verified snapshot.
  const changes = diffSnapshot(snapshot, await remote.list());
  for (let i = 0; i < changes.upserts.length; i += 100) { await assertOwned(); await remote.upsert(changes.upserts.slice(i, i + 100)); }
  for (const d of changes.removed) { await assertOwned(); input.event?.({ phase: "DELETE_SENT", id: d.id }); await remote.remove(d.id); }
  const stored = await remote.list(); const expected = new Map(snapshot.documents.map((d) => [d.id, fingerprint(d)]));
  if (stored.length !== expected.size || new Set(stored.map((d) => d.id)).size !== stored.length || stored.some((d) => expected.get(d.id) !== d.hash)) throw new Error("remote verification failed");
  await assertOwned();
  // Readiness probes only what changed: unchanged documents were already verified by the previous stamp.
  if (!await remote.ready(changes.upserts, changes.removed)) throw new Error("search index not ready");
  // Each stamp is independent: a failure leaves that state (and the ones after it) disabled with the marker.
  const enabled: boolean[] = [];
  for (const [i, state] of states.entries()) {
    enabled[i] = await state.transact(["control", "global"], (docs) => {
      const c = record(docs.get("control")); assertIdleGlobal(docs.get("global"), now());
      if (record(c.sync).owner !== owner || !Number.isInteger(c.version) || c.enabled !== false) throw new Error("sync ownership changed");
      const next: Record<string, unknown> = { ...c, indexSha256: snapshot.hash, indexCommit: input.commit, indexedAt: now(), enabled: wasEnabled[i] && c.version === versions[i], version: Number(c.version) + 1 };
      delete next.sync;
      return { writes: { control: next }, value: next.enabled === true };
    });
  }
  return { phase: changes.upserts.length || changes.removed.length ? "UPDATED" : "UNCHANGED", owner, hash: snapshot.hash, upserted: changes.upserts.length, removed: changes.removed.length, count: snapshot.documents.length, enabled: enabled.every(Boolean), enabledByState: enabled };
}
export function recoverSync(control: unknown, expectedOwner: string, acknowledged: boolean) {
  const c = record(control);
  if (!acknowledged || !Number.isInteger(c.version) || c.enabled !== false || !expectedOwner || record(c.sync).owner !== expectedOwner) throw new Error("sync recovery preconditions failed");
  const next: Record<string, unknown> = { ...c, version: Number(c.version) + 1 }; delete next.sync; delete next.indexSha256;
  return next;
}
