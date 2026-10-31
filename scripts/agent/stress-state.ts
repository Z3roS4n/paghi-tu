import { randomUUID } from "node:crypto";
import { spawnSync } from "node:child_process";
import { argsMap, loadStateStore, readConfig } from "./preview-common.mjs";

const args = argsMap(process.argv.slice(2));
if (args.has("--help")) {
  console.log("Uso: node --conditions=react-server scripts/agent/stress-state.ts --config /path/verified.json [--apply]");
  process.exit(0);
}
const config = readConfig(args.get("--config"));
if (!args.has("--apply")) {
  console.log(JSON.stringify({ mode: "PLAN_ONLY", scope: "real Firestore, two store instances", database: config.databaseId, namespace: "stress-<uuid>", writes: "one isolated global document", cleanup: "that document only" }));
  process.exit(0);
}
const namespace = `stress-${randomUUID()}`;
const token = spawnSync("gcloud", ["auth", "print-access-token"], { encoding: "utf8" });
if (token.status !== 0) throw new Error("Token operatore non disponibile.");
const { FirestoreStateStore } = await loadStateStore();
const options = { projectId: config.gcpProjectId, databaseId: config.databaseId, namespace, accessToken: async () => token.stdout.trim() };
const first = new FirestoreStateStore(options);
const second = new FirestoreStateStore(options);
const key = "global";
let created = false;
try {
  await first.transact([key], (docs: Map<string, unknown | null>) => {
    if (docs.get(key) !== null) throw new Error("Namespace inatteso già popolato.");
    return { writes: { [key]: { admitted: 0, expiresAt: Date.now() + 3_600_000 } }, value: true };
  });
  created = true;
  const admit = (store: InstanceType<typeof FirestoreStateStore>) => store.transact([key], (docs: Map<string, unknown | null>) => {
    const current = docs.get(key);
    if (!current || typeof current !== "object" || !("admitted" in current) || typeof current.admitted !== "number") throw new Error("Stato inatteso.");
    if (current.admitted >= 1) return { writes: {}, value: false };
    return { writes: { [key]: { ...current, admitted: current.admitted + 1 } }, value: true };
  });
  const results = await Promise.allSettled([admit(first), admit(second)]);
  const admitted = results.filter((result) => result.status === "fulfilled" && result.value === true).length;
  const denied = results.filter((result) => result.status === "fulfilled" && result.value === false).length;
  console.log(JSON.stringify({ namespace, admitted, denied, failures: results.length - admitted - denied, status: admitted === 1 && denied === 1 ? "PASS_REAL_FIRESTORE_LAST_UNIT" : "FAIL_OR_INCONCLUSIVE" }));
  if (admitted !== 1 || denied !== 1) process.exitCode = 1;
} finally {
  if (created) {
    const documentId = Buffer.from(key).toString("base64url");
    const url = `https://firestore.googleapis.com/v1/projects/${config.gcpProjectId}/databases/${config.databaseId}/documents/agent_${namespace.replaceAll("-", "_")}/${documentId}`;
    const response = await fetch(url, { method: "DELETE", headers: { authorization: `Bearer ${token.stdout.trim()}` }, redirect: "error" });
    if (!response.ok && response.status !== 404) {
      console.error(JSON.stringify({ namespace, cleanup: "FAILED", documentId }));
      process.exitCode = 1;
    } else console.log(JSON.stringify({ namespace, cleanup: "CONFIRMED", documentId }));
  }
}
