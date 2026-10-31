import { readFileSync } from "node:fs";

export async function loadStateStore() {
  return import("../../src/server/agent/state.ts");
}

export const EU_FIRESTORE_LOCATIONS = new Set(["europe-west1", "europe-west3", "europe-west4", "eur3"]);

export function readConfig(path) {
  if (!path) throw new Error("Passare --config con un JSON locale verificato.");
  const config = JSON.parse(readFileSync(path, "utf8"));
  const required = ["gcpProjectId", "gcpProjectNumber", "databaseId", "databaseLocation", "serviceAccountEmail", "workloadIdentityPoolId", "workloadIdentityProviderId", "vercelOwnerId", "vercelProjectId", "vercelIssuer", "vercelJwtAudience", "stsAudience", "previewOrigin"];
  for (const key of required) if (typeof config[key] !== "string" || !config[key] || /REQUIRED|PLACEHOLDER|CHANGEME/i.test(config[key])) throw new Error(`Pin mancante o placeholder: ${key}`);
  if (config.gcpProjectId !== "paghi-tu-agent") throw new Error("Il progetto GCP deve essere quello esistente: paghi-tu-agent.");
  if (!/^https:\/\/[a-z0-9-]+\.vercel\.app$/.test(config.previewOrigin)) throw new Error("Origin Preview non ammessa.");
  if (!/^\d+$/.test(config.gcpProjectNumber)) throw new Error("Project number non valido.");
  if (!EU_FIRESTORE_LOCATIONS.has(config.databaseLocation)) throw new Error("La regione DB deve essere nell'allowlist UE verificata.");
  if (!/^[a-z][a-z0-9-]{3,62}$/.test(config.databaseId)) throw new Error("Database ID non valido.");
  if (!/^[a-z][a-z0-9-]{3,62}$/.test(config.workloadIdentityPoolId) || !/^[a-z][a-z0-9-]{3,62}$/.test(config.workloadIdentityProviderId)) throw new Error("WIF ID non valido.");
  if (!/^[a-zA-Z0-9_-]{3,128}$/.test(config.vercelOwnerId) || !/^[a-zA-Z0-9_-]{3,128}$/.test(config.vercelProjectId)) throw new Error("Vercel pin non valido.");
  if (!/^[a-z][a-z0-9-]*@paghi-tu-agent\.iam\.gserviceaccount\.com$/.test(config.serviceAccountEmail)) throw new Error("Service account non appartiene al progetto pin.");
  for (const key of ["vercelIssuer", "vercelJwtAudience"]) {
    try {
      const url = new URL(config[key]);
      if (url.protocol !== "https:" || url.username || url.password || url.hash || url.search || /['"`]/.test(config[key])) throw new Error();
    } catch { throw new Error(`${key} non valido.`); }
  }
  return config;
}

export function argsMap(argv) {
  const result = new Map();
  for (let i = 0; i < argv.length; i++) {
    const item = argv[i];
    if (!item.startsWith("--")) throw new Error(`Argomento sconosciuto: ${item}`);
    if (["--apply", "--help", "--paid-vertex", "--read", "--enable", "--disable", "--recover", "--ack-unknown-outcome"].includes(item)) result.set(item, true);
    else {
      if (!argv[i + 1] || argv[i + 1].startsWith("--")) throw new Error(`Valore mancante: ${item}`);
      result.set(item, argv[++i]);
    }
  }
  return result;
}

export function exactPreviewTarget(value, expected) {
  const target = new URL(value);
  if (target.protocol !== "https:" || target.pathname !== "/" || target.search || target.hash || target.username || target.password || target.origin !== expected) throw new Error("Target non coincide con l'origin Preview verificata.");
  return target.origin;
}

export function recoverHaltedGlobal(global, { acknowledged, expectedLeaseOwner, now }) {
  if (!acknowledged) throw new Error("Serve --ack-unknown-outcome dopo riconciliazione operatore.");
  if (!global || typeof global !== "object" || global.halted !== true || typeof global.day !== "string" || !Number.isInteger(global.dayCount) || typeof global.month !== "string" || !Number.isInteger(global.monthCount) || global.dayCount < 0 || global.monthCount < 0) throw new Error("Global assente o divergente; nessuna modifica.");
  const lease = global.lease;
  if (lease !== undefined && (!lease || typeof lease !== "object" || typeof lease.owner !== "string" || typeof lease.until !== "number" || !Number.isFinite(lease.until))) throw new Error("Lease divergente; nessuna modifica.");
  if (lease && lease.until > now) throw new Error("Lease ancora attivo; attendere e riconciliare.");
  if (expectedLeaseOwner !== (lease?.owner ?? "none")) throw new Error("Owner lease diverso da quello letto; nessuna modifica.");
  return { ...global, halted: false, lease: undefined };
}

export function assertEphemeralStorageSettings(database, backupSchedules) {
  if (!database || typeof database !== "object" || database.pointInTimeRecoveryEnablement !== "POINT_IN_TIME_RECOVERY_DISABLED") throw new Error("PITR assente, attivo o inconcludente: non accendere Preview.");
  if (!Array.isArray(backupSchedules)) throw new Error("Lettura backup schedules inconcludente: non accendere Preview.");
  if (backupSchedules.length !== 0) throw new Error("Backup schedules attivi: non accendere Preview.");
}

export function assertTTLActive(fields, projectId, databaseId) {
  const expected = `projects/${projectId}/databases/${databaseId}/collectionGroups/agent_preview/fields/expiresAt`;
  if (!Array.isArray(fields) || fields.length !== 1 || fields[0]?.name !== expected || fields[0]?.ttlConfig?.state !== "ACTIVE") throw new Error("TTL expiresAt non ancora ACTIVE o configurazione divergente: PENDING, attendere e ripetere il setup.");
}
