import { randomUUID } from "node:crypto";
import { spawnSync } from "node:child_process";
import { argsMap, exactPreviewTarget, loadStateStore, readConfig } from "./preview-common.mjs";

const args = argsMap(process.argv.slice(2));
if (args.has("--help")) {
  console.log("Uso: node --conditions=react-server scripts/agent/stress-preview.mjs --config /path/verified.json [--apply] [--paid-vertex --count 1..3]");
  process.exit(0);
}
const config = readConfig(args.get("--config"));
const target = exactPreviewTarget(config.previewOrigin + "/", config.previewOrigin);
const paid = args.has("--paid-vertex");
const count = args.has("--count") ? Number(args.get("--count")) : paid ? 3 : 50;
if (!Number.isInteger(count) || count < 1 || count > (paid ? 3 : 50)) throw new Error("Numero richieste fuori limite.");
if (!args.has("--apply")) {
  console.log(JSON.stringify({ mode: "PLAN_ONLY", phase: paid ? "PAID_OPT_IN" : "FLAG_OFF", target, count, maxConcurrency: paid ? 1 : 10, maxDurationSeconds: 30, noRetry: true }));
  process.exit(0);
}
if (!process.env.VERCEL_PROTECTION_BYPASS) throw new Error("Bypass Preview richiesto solo in env di processo; non inserirlo nel config o negli argomenti.");
if (!paid) {
  const token = spawnSync("gcloud", ["auth", "print-access-token"], { encoding: "utf8" });
  if (token.status !== 0) throw new Error("Token operatore non disponibile per verificare il kill.");
  const { FirestoreStateStore } = await loadStateStore();
  const state = new FirestoreStateStore({ projectId: config.gcpProjectId, databaseId: config.databaseId, namespace: "preview", accessToken: async () => token.stdout.trim() });
  const control = await state.transact(["control"], (docs) => ({ writes: {}, value: docs.get("control") }));
  if (!control || typeof control !== "object" || control.enabled !== false) throw new Error("Control non conferma enabled:false; stress flag-off annullato.");
}
const controller = new AbortController();
const timer = setTimeout(() => controller.abort(), 30_000);
let next = 0;
const statuses = new Map();
const workers = Array.from({ length: Math.min(count, paid ? 1 : 10) }, async () => {
  while (next < count && !controller.signal.aborted) {
    next += 1;
    try {
      const response = await fetch(`${target}/api/agent`, {
        method: "POST", redirect: "manual", signal: controller.signal,
        headers: { "content-type": "application/json", origin: target, "x-vercel-protection-bypass": process.env.VERCEL_PROTECTION_BYPASS },
        body: JSON.stringify({ action: "ask", requestId: randomUUID(), question: "Quali dati mostra Paghi Tu?" }),
      });
      statuses.set(response.status, (statuses.get(response.status) ?? 0) + 1);
      if (!paid && response.status !== 503) controller.abort();
    } catch { statuses.set("network_or_timeout", (statuses.get("network_or_timeout") ?? 0) + 1); }
  }
});
await Promise.all(workers);
clearTimeout(timer);
const summary = Object.fromEntries(statuses);
const passed = paid ? Object.keys(summary).every((status) => ["200", "409", "429", "503", "504"].includes(status)) : Object.keys(summary).length === 1 && summary["503"] === count;
console.log(JSON.stringify({ phase: paid ? "PAID_OPT_IN" : "FLAG_OFF", countSent: next, statuses: summary, passed, note: "HTTP Preview only; non prova atomicità Firestore o correttezza dei contenuti." }));
if (!passed) process.exitCode = 1;
