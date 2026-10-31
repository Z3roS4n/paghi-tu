import "server-only";

export type AgentConfig = {
  projectId: string; projectNumber: string; poolId: string; providerId: string; serviceAccountEmail: string;
  engineId: string; dataStoreId: string; databaseId: string; allowedOrigin: string; ipHashSecret: string; vercelOwnerId: string; vercelProjectId: string; vercelAudience: string; vercelIssuer: string;
};

const id = /^[a-z][a-z0-9-]{3,62}$/;
const placeholder = /^(?:changeme|placeholder|todo|pending|your[-_]|<|\$|example)/i;

export function loadAgentConfig(env: Record<string, string | undefined> = process.env): AgentConfig | null {
  if (env.AGENT_ENABLED !== "1" || env.VERCEL_ENV !== "preview") return null;
  const values = [env.GCP_PROJECT_ID, env.GCP_PROJECT_NUMBER, env.GCP_WORKLOAD_IDENTITY_POOL_ID, env.GCP_WORKLOAD_IDENTITY_POOL_PROVIDER_ID, env.GCP_SERVICE_ACCOUNT_EMAIL, env.VERTEX_ENGINE_ID, env.VERTEX_DATA_STORE_ID, env.AGENT_STATE_DATABASE_ID, env.AGENT_ALLOWED_ORIGIN, env.AGENT_IP_HASH_SECRET, env.AGENT_VERCEL_OWNER_ID, env.AGENT_VERCEL_PROJECT_ID, env.AGENT_VERCEL_AUDIENCE, env.AGENT_VERCEL_ISSUER];
  if (values.some((v) => !v || placeholder.test(v))) return null;
  const [projectId, projectNumber, poolId, providerId, serviceAccountEmail, engineId, dataStoreId, databaseId, allowedOrigin, ipHashSecret, vercelOwnerId, vercelProjectId, vercelAudience, vercelIssuer] = values as string[];
  if (!id.test(projectId) || !/^\d{6,20}$/.test(projectNumber) || !id.test(poolId) || !id.test(providerId) || !id.test(databaseId) || !engineId || !dataStoreId || !new RegExp(`^[^@]+@${projectId}\\.iam\\.gserviceaccount\\.com$`).test(serviceAccountEmail)) return null;
  try { const url = new URL(allowedOrigin); if (url.protocol !== "https:" || url.origin !== allowedOrigin || url.username || url.password) return null; } catch { return null; }
  if (Buffer.byteLength(ipHashSecret) < 32) return null;
  if (!/^team_[A-Za-z0-9]+$/.test(vercelOwnerId) || !/^prj_[A-Za-z0-9]+$/.test(vercelProjectId) || !vercelAudience.startsWith("https://") || !vercelIssuer.startsWith("https://oidc.vercel.com/")) return null;
  return { projectId, projectNumber, poolId, providerId, serviceAccountEmail, engineId, dataStoreId, databaseId, allowedOrigin, ipHashSecret, vercelOwnerId, vercelProjectId, vercelAudience, vercelIssuer };
}
