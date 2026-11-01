import { spawnSync } from "node:child_process";
import { argsMap, loadStateStore, readConfig, recoverHaltedGlobal, assertIndexReadyControl } from "./preview-common.mjs";

const args = argsMap(process.argv.slice(2));
if (args.has("--help")) {
  console.log("Uso: node --conditions=react-server scripts/agent/control-preview.mjs --config /path/verified.json [--read | --apply --enable | --apply --disable | --apply --recover --ack-unknown-outcome --expect-lease-owner OWNER|none]");
  process.exit(0);
}
const config = readConfig(args.get("--config"));
const enable = args.has("--enable");
const disable = args.has("--disable");
const recover = args.has("--recover");
if ([enable, disable, recover].filter(Boolean).length > 1) throw new Error("Scegliere una sola operazione.");
if (!args.has("--read") && !args.has("--apply")) {
  console.log(JSON.stringify({ mode: "PLAN_ONLY", project: config.gcpProjectId, database: config.databaseId, namespace: "preview", action: enable ? "enable" : disable ? "disable" : recover ? "recover" : "read" }));
  process.exit(0);
}
if (args.has("--apply") && !enable && !disable && !recover) throw new Error("--apply richiede --enable, --disable o --recover.");
if (recover && (!args.has("--apply") || !args.has("--ack-unknown-outcome") || !args.has("--expect-lease-owner"))) throw new Error("Recovery richiede --apply, --ack-unknown-outcome e --expect-lease-owner letto con --read.");
const token = spawnSync("gcloud", ["auth", "print-access-token"], { encoding: "utf8" });
if (token.status !== 0) throw new Error("Token operatore non disponibile.");
const { FirestoreStateStore } = await loadStateStore();
const state = new FirestoreStateStore({ projectId: config.gcpProjectId, databaseId: config.databaseId, namespace: "preview", accessToken: async () => token.stdout.trim() });
const control = await state.transact(["control", "global"], (docs) => {
  const current = docs.get("control");
  const global = docs.get("global");
  if (current !== null && (typeof current !== "object" || current === null || typeof current.enabled !== "boolean")) throw new Error("Control divergente.");
  if (enable) assertIndexReadyControl(current);
  if (enable && global && typeof global === "object" && global.halted === true) throw new Error("Global halted dopo esito remoto ambiguo: serve riconciliazione operatore prima di riabilitare.");
  if (!args.has("--apply")) return { writes: {}, value: { control: current, global } };
  if (recover) {
    if (current?.enabled !== false) throw new Error("Disabilitare control prima del recovery.");
    const nextGlobal = recoverHaltedGlobal(global, { acknowledged: args.has("--ack-unknown-outcome"), expectedLeaseOwner: args.get("--expect-lease-owner"), now: Date.now() });
    return { writes: { global: nextGlobal }, value: { control: current, global: nextGlobal } };
  }
  const next = { ...(current ?? {}), enabled: enable, version: typeof current?.version === "number" ? current.version + 1 : 1 };
  return { writes: { control: next }, value: { control: next, global } };
});
const global = control.global;
console.log(JSON.stringify({ enabled: control.control?.enabled ?? false, version: control.control?.version ?? null, halted: global && typeof global === "object" ? global.halted === true : false, leaseOwner: global && typeof global === "object" ? global.lease?.owner ?? "none" : "none", leaseUntil: global && typeof global === "object" ? global.lease?.until ?? null : null, mode: args.has("--apply") ? recover ? "RECOVERED" : "APPLIED" : "READ" }));
