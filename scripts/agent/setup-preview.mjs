import { spawnSync } from "node:child_process";
import { randomBytes } from "node:crypto";
import { openSync, writeSync, closeSync, existsSync, readFileSync, writeFileSync, lstatSync } from "node:fs";
import { resolve } from "node:path";
import { argsMap, assertEphemeralStorageSettings, assertTTLActive, readConfig } from "./preview-common.mjs";

function gcloud(...args) {
  const result = spawnSync("gcloud", [...args, "--format=json"], { encoding: "utf8", maxBuffer: 2_000_000 });
  if (result.status !== 0) throw new Error(`gcloud ${args[0]} ${args[1] ?? ""} non riuscito; controllare identità e permessi operatore.`);
  return result.stdout.trim() ? JSON.parse(result.stdout) : null;
}

function gcloudOptional(...args) {
  const result = spawnSync("gcloud", [...args, "--format=json"], { encoding: "utf8", maxBuffer: 2_000_000 });
  if (result.status === 0) return JSON.parse(result.stdout);
  if (/NOT_FOUND|does not exist|not found/i.test(result.stderr)) return null;
  throw new Error(`Preflight gcloud ${args[0]} ${args[1] ?? ""} non conclusivo; nessuna modifica.`);
}

const args = argsMap(process.argv.slice(2));
if (args.has("--help")) {
  console.log("Uso: node scripts/agent/setup-preview.mjs --config /path/verified.json [--apply --secret-output /path/outside-repo/ip-hmac-secret --manifest-output /path/outside-repo/created-manifest.json]");
  process.exit(0);
}
const config = readConfig(args.get("--config"));
const plan = [
  "Preflight identità GCP, project number, SA esistente e IAM corrente",
  "Abilitare API firestore.googleapis.com, iam.googleapis.com, iamcredentials.googleapis.com, sts.googleapis.com se mancanti",
  `Creare o verificare Firestore Native Standard ${config.databaseId} in ${config.databaseLocation}; TTL su expiresAt, PITR e backup off`,
  "Creare/verificare pool e provider OIDC con issuer, audience e claim esatti; binding WIF solo sulla SA runtime",
  "Concedere datastore.user alla SA solo con condizione sul database dedicato; nessun ruolo non condizionato",
  "Inizializzare control Preview a enabled:false; generare segreto HMAC fuori dal repo con permessi 0600",
];
if (!args.has("--apply")) {
  console.log(JSON.stringify({ mode: "PLAN_ONLY", project: config.gcpProjectId, database: config.databaseId, location: config.databaseLocation, steps: plan }, null, 2));
  process.exit(0);
}
if (!args.get("--secret-output") || !args.get("--manifest-output")) throw new Error("--apply richiede --secret-output e --manifest-output fuori dal repository.");
const secretPath = resolve(args.get("--secret-output"));
const manifestPath = resolve(args.get("--manifest-output"));
if (secretPath.startsWith(resolve(process.cwd()) + "/") || manifestPath.startsWith(resolve(process.cwd()) + "/")) throw new Error("Segreto e manifest devono stare fuori dal repository.");
if (secretPath === manifestPath) throw new Error("Segreto e manifest richiedono file distinti.");
if (existsSync(secretPath) && (!lstatSync(secretPath).isFile() || (lstatSync(secretPath).mode & 0o077) !== 0)) throw new Error("Segreto esistente non è un file privato 0600.");
const manifest = existsSync(manifestPath) ? JSON.parse(readFileSync(manifestPath, "utf8")) : { projectId: config.gcpProjectId, databaseId: config.databaseId, created: [] };
if (manifest.projectId !== config.gcpProjectId || manifest.databaseId !== config.databaseId || !Array.isArray(manifest.created)) throw new Error("Manifest esistente divergente.");
function recordCreated(kind, id) {
  if (!manifest.created.some((item) => item.kind === kind && item.id === id)) manifest.created.push({ kind, id });
  writeFileSync(manifestPath, JSON.stringify(manifest, null, 2) + "\n", { mode: 0o600 });
}
const expectedStsAudience = `//iam.googleapis.com/projects/${config.gcpProjectNumber}/locations/global/workloadIdentityPools/${config.workloadIdentityPoolId}/providers/${config.workloadIdentityProviderId}`;
if (config.stsAudience !== expectedStsAudience) throw new Error("STS audience non coincide con il provider pin.");

const project = gcloud("projects", "describe", config.gcpProjectId);
if (String(project.projectNumber) !== config.gcpProjectNumber || project.projectId !== config.gcpProjectId) throw new Error("Project ID/number mismatch.");
const sa = gcloud("iam", "service-accounts", "describe", config.serviceAccountEmail, `--project=${config.gcpProjectId}`);
if (sa.email !== config.serviceAccountEmail) throw new Error("SA mismatch.");
gcloud("services", "enable", "firestore.googleapis.com", "iam.googleapis.com", "iamcredentials.googleapis.com", "sts.googleapis.com", `--project=${config.gcpProjectId}`);
const existingDatabase = gcloudOptional("firestore", "databases", "describe", `--database=${config.databaseId}`, `--project=${config.gcpProjectId}`);
if (existingDatabase) {
  const database = existingDatabase;
  if (database.locationId !== config.databaseLocation || database.type !== "FIRESTORE_NATIVE") throw new Error("Database esistente con regione o modalità diversa; nessuna modifica.");
}
const policy = gcloud("projects", "get-iam-policy", config.gcpProjectId);
const member = `serviceAccount:${config.serviceAccountEmail}`;
const expectedCondition = `resource.name == 'projects/${config.gcpProjectId}/databases/${config.databaseId}'`;
for (const binding of policy.bindings ?? []) {
  if (binding.role === "roles/datastore.user" && binding.members?.includes(member) && binding.condition?.expression !== expectedCondition) throw new Error("Binding datastore.user più ampio già presente; fermarsi.");
}
if (!(policy.bindings ?? []).some((binding) => binding.role === "roles/discoveryengine.viewer" && binding.members?.includes(member))) throw new Error("La SA non risulta Discovery Engine viewer nel progetto; verificare i permessi esistenti.");
const poolArgs = ["iam", "workload-identity-pools", "describe", config.workloadIdentityPoolId, `--project=${config.gcpProjectId}`, "--location=global"];
const pool = gcloudOptional(...poolArgs);
const attributeCondition = `assertion.owner_id == '${config.vercelOwnerId}' && assertion.project_id == '${config.vercelProjectId}' && assertion.environment == 'preview'`;
const mapping = "google.subject=assertion.sub,attribute.owner_id=assertion.owner_id,attribute.project_id=assertion.project_id,attribute.environment=assertion.environment";
const providerArgs = ["iam", "workload-identity-pools", "providers", "describe", config.workloadIdentityProviderId, `--workload-identity-pool=${config.workloadIdentityPoolId}`, `--project=${config.gcpProjectId}`, "--location=global"];
const provider = pool ? gcloudOptional(...providerArgs) : null;
if (provider && (provider.oidc?.issuerUri !== config.vercelIssuer || !provider.oidc?.allowedAudiences?.includes(config.vercelJwtAudience) || provider.attributeCondition !== attributeCondition || Object.entries({ "google.subject": "assertion.sub", "attribute.owner_id": "assertion.owner_id", "attribute.project_id": "assertion.project_id", "attribute.environment": "assertion.environment" }).some(([key, value]) => provider.attributeMapping?.[key] !== value))) throw new Error("Provider esistente divergente; nessun overwrite.");
const principal = `principalSet://iam.googleapis.com/projects/${config.gcpProjectNumber}/locations/global/workloadIdentityPools/${config.workloadIdentityPoolId}/attribute.project_id/${config.vercelProjectId}`;
const saPolicy = gcloud("iam", "service-accounts", "get-iam-policy", config.serviceAccountEmail, `--project=${config.gcpProjectId}`);
if ((saPolicy.bindings ?? []).some((binding) => binding.role === "roles/iam.workloadIdentityUser" && binding.members?.includes(principal) && binding.condition)) throw new Error("Binding WIF condizionato inatteso; verificare manualmente.");
console.log("Preflight GCP completato; procedo solo con configurazioni mancanti e pin verificati.");
if (!existingDatabase) {
  gcloud("firestore", "databases", "create", `--database=${config.databaseId}`, `--location=${config.databaseLocation}`, "--type=firestore-native", `--project=${config.gcpProjectId}`);
  recordCreated("database", config.databaseId);
}
const database = gcloud("firestore", "databases", "describe", `--database=${config.databaseId}`, `--project=${config.gcpProjectId}`);
if (database.locationId !== config.databaseLocation || database.type !== "FIRESTORE_NATIVE") throw new Error("Database mismatch dopo la creazione.");
const backupSchedules = gcloud("firestore", "backups", "schedules", "list", `--database=${config.databaseId}`, `--project=${config.gcpProjectId}`);
assertEphemeralStorageSettings(database, backupSchedules);
const ttlFields = gcloud("firestore", "fields", "ttls", "list", `--collection-group=agent_preview`, `--database=${config.databaseId}`, `--project=${config.gcpProjectId}`);
if (!Array.isArray(ttlFields)) throw new Error("Lettura TTL inconcludente; nessuna modifica ulteriore.");
if (ttlFields.some((field) => !field.name?.endsWith("/fields/expiresAt"))) throw new Error("TTL esistente su campo diverso; nessun overwrite.");
if (ttlFields.length === 0) {
  gcloud("firestore", "fields", "ttls", "update", "expiresAt", "--collection-group=agent_preview", `--database=${config.databaseId}`, "--enable-ttl", `--project=${config.gcpProjectId}`);
  recordCreated("ttl", "agent_preview/expiresAt");
}
const ttlAfter = gcloud("firestore", "fields", "ttls", "list", `--collection-group=agent_preview`, `--database=${config.databaseId}`, `--project=${config.gcpProjectId}`);
assertTTLActive(ttlAfter, config.gcpProjectId, config.databaseId);
if (!pool) {
  gcloud("iam", "workload-identity-pools", "create", config.workloadIdentityPoolId, `--project=${config.gcpProjectId}`, "--location=global", "--display-name=Paghi Tu Preview");
  recordCreated("wif-pool", config.workloadIdentityPoolId);
}
if (!provider) {
  gcloud("iam", "workload-identity-pools", "providers", "create-oidc", config.workloadIdentityProviderId, `--workload-identity-pool=${config.workloadIdentityPoolId}`, `--project=${config.gcpProjectId}`, "--location=global", `--issuer-uri=${config.vercelIssuer}`, `--allowed-audiences=${config.vercelJwtAudience}`, `--attribute-mapping=${mapping}`, `--attribute-condition=${attributeCondition}`);
  recordCreated("wif-provider", `${config.workloadIdentityPoolId}/${config.workloadIdentityProviderId}`);
}
if (!(saPolicy.bindings ?? []).some((binding) => binding.role === "roles/iam.workloadIdentityUser" && binding.members?.includes(principal))) {
  gcloud("iam", "service-accounts", "add-iam-policy-binding", config.serviceAccountEmail, `--project=${config.gcpProjectId}`, "--role=roles/iam.workloadIdentityUser", `--member=${principal}`);
  recordCreated("sa-binding", principal);
}
if (!(policy.bindings ?? []).some((binding) => binding.role === "roles/datastore.user" && binding.members?.includes(member) && binding.condition?.expression === expectedCondition)) {
  gcloud("projects", "add-iam-policy-binding", config.gcpProjectId, "--role=roles/datastore.user", `--member=${member}`, `--condition=expression=${expectedCondition},title=paghi_tu_preview_database,description=Preview database only`);
  recordCreated("database-binding", member);
}
const tokenResult = spawnSync("gcloud", ["auth", "print-access-token"], { encoding: "utf8" });
if (tokenResult.status !== 0) throw new Error("Token operatore non disponibile.");
const documentId = Buffer.from("control").toString("base64url");
const root = `https://firestore.googleapis.com/v1/projects/${config.gcpProjectId}/databases/${config.databaseId}/documents/agent_preview`;
const headers = { authorization: `Bearer ${tokenResult.stdout.trim()}`, "content-type": "application/json" };
const current = await fetch(`${root}/${documentId}`, { headers, redirect: "error" });
if (current.status === 404) {
  const created = await fetch(`${root}?documentId=${documentId}`, { method: "POST", headers, body: JSON.stringify({ fields: { payload: { stringValue: JSON.stringify({ enabled: false }) } } }), redirect: "error" });
  if (created.status !== 200) throw new Error("Control init non confermato; verificare manualmente prima di ripetere.");
  recordCreated("control-document", "agent_preview/control");
} else if (current.status === 200) {
  const doc = await current.json();
  const control = JSON.parse(doc.fields?.payload?.stringValue ?? "null");
  if (typeof control?.enabled !== "boolean") throw new Error("Control esistente non riconosciuto.");
} else throw new Error("Lettura control non conclusiva.");
if (!existsSync(secretPath)) {
  const secret = randomBytes(32).toString("base64url");
  const file = openSync(secretPath, "wx", 0o600);
  try { writeSync(file, secret + "\n"); } finally { closeSync(file); }
}
console.log(`Setup verificato. Segreto HMAC locale in ${secretPath}; manifest in ${manifestPath}. Non stamparli né committarli. STS audience attesa: ${config.stsAudience}. Verificare control prima di attivare.`);
