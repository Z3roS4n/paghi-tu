import { writeFileSync } from "node:fs";
import { readFile } from "node:fs/promises";
import { isAbsolute } from "node:path";
import { randomUUID } from "node:crypto";
import { FirestoreStateStore } from "../../src/server/agent/state.ts";
import { parseSnapshot, recoverStates, refreshIndex } from "../../agent/sync/refresh.ts";
import { parseSyncTargets } from "../../agent/sync/targets.ts";
import { createSyncRemote } from "../../agent/sync/vertex.ts";

const args = process.argv.slice(2);
if (args.includes("--help")) { console.log("sync-index.ts [--apply | --apply --recover-sync OWNER --ack-remote-reconciled]; plan-only by default. See index-refresh runbook."); process.exit(0); }
const recovery = args.indexOf("--recover-sync");
const allowed = args.filter((_, i) => i !== recovery + 1 || recovery < 0);
if (allowed.some((a) => !["--apply", "--recover-sync", "--ack-remote-reconciled"].includes(a)) || (recovery >= 0 && (!args[recovery + 1] || !args.includes("--ack-remote-reconciled")))) throw new Error("invalid sync arguments");
// Parsed before the plan-only exit, so a malformed variable fails the validate job too, before any report.
const targets = parseSyncTargets(process.env.AGENT_SYNC_TARGETS);
const snapshot = parseSnapshot(await readFile("agent/ingest/out/documenti.jsonl", "utf8"), JSON.parse(await readFile("agent/ingest/manifest.json", "utf8")));
if (!args.includes("--apply")) { console.log(JSON.stringify({ mode: "PLAN_ONLY", documents: snapshot.documents.length, hash: snapshot.hash, targets: targets.map((t) => t.environment), recovery: recovery >= 0, cloud: "not contacted" })); process.exit(0); }
const project = process.env.AGENT_SYNC_PROJECT; const database = process.env.AGENT_SYNC_DATABASE; const store = process.env.AGENT_SYNC_STORE; const engine = process.env.AGENT_SYNC_ENGINE;
const token = process.env.AGENT_SYNC_ACCESS_TOKEN; const commit = process.env.AGENT_SYNC_COMMIT;
// AGENT_SYNC_DATABASE pins the Preview database the workflow was configured for; target databases come from the allow-list.
if (project !== "paghi-tu-agent" || database !== "paghi-tu-preview" || !store || !engine || !token || !/^[a-f0-9]{40}$/.test(commit ?? "")) throw new Error("verified sync configuration required");
const reportPath = process.env.AGENT_SYNC_REPORT;
if (!reportPath || !isAbsolute(reportPath) || reportPath.startsWith(process.cwd() + "/")) throw new Error("report must be absolute and outside checkout");
const signal = AbortSignal.timeout(16 * 60 * 1000); const owner = randomUUID();
const events: Record<string, unknown>[] = [];
const report: Record<string, unknown> = { startedAt: new Date().toISOString(), phase: "STARTED", owner, commit, hash: snapshot.hash, targets: targets.map((t) => t.environment), events };
const persist = () => writeFileSync(reportPath, JSON.stringify(report, null, 2) + "\n", { mode: 0o600 });
await persist();
const states = targets.map((t) => new FirestoreStateStore({ projectId: project, databaseId: t.databaseId, namespace: t.environment, accessToken: async () => token, signal }));
try {
  if (recovery >= 0) {
    // Use the same AGENT_SYNC_TARGETS as the blocked run (its report lists them): markers elsewhere stay.
    const recovered: string[] = []; report.recovered = recovered;
    await recoverStates({ states, names: targets.map((t) => t.environment), owner: args[recovery + 1], acknowledged: args.includes("--ack-remote-reconciled"), onRecovered: (name) => { recovered.push(name); persist(); } });
    report.phase = "RECOVERED_DISABLED";
  } else {
    const event = (e: Record<string, unknown>) => { events.push(e); console.log(JSON.stringify(e)); persist(); };
    const remote = createSyncRemote({ project, store, engine, token, signal, event });
    Object.assign(report, await refreshIndex({ snapshot, remote, states, targets: targets.map((t) => t.environment), commit: commit!, owner, event }));
  }
  await persist(); console.log(JSON.stringify({ phase: report.phase, owner, hash: snapshot.hash }));
} catch (error) {
  report.phase = "BLOCKED";
  // Internal messages only (limits, HTTP status, ownership): they tell «no remote writes» from «outcome unknown».
  report.error = error instanceof Error ? error.message.slice(0, 200) : "unknown"; report.operatorAction = "Inspect control/sync owner, operation references and cloud outcome. Never clear a lock or replay an unknown import blindly.";
  await persist(); console.error(JSON.stringify({ phase: "BLOCKED", owner, hash: snapshot.hash, message: "Sync failed; inspect report and reconcile before recovery." })); process.exitCode = 1;
}
