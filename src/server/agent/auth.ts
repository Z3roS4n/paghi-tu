import "server-only";
import { getVercelOidcToken } from "@vercel/oidc";
import { IdentityPoolClient } from "google-auth-library";
import type { AgentConfig } from "./config.ts";

export class AuthUnavailable extends Error { constructor() { super("authentication unavailable"); } }

function decodeClaims(token: string): Record<string, unknown> {
  const parts = token.split(".");
  if (parts.length !== 3) throw new AuthUnavailable();
  const claims: unknown = JSON.parse(Buffer.from(parts[1], "base64url").toString("utf8"));
  if (!claims || typeof claims !== "object") throw new AuthUnavailable();
  return claims as Record<string, unknown>;
}

export async function getRuntimeAccessToken(config: AgentConfig, signal: AbortSignal, getOidc = getVercelOidcToken): Promise<string> {
  if (signal.aborted) throw new AuthUnavailable();
  const timeout = AbortSignal.timeout(8000);
  const combined = AbortSignal.any([signal, timeout]);
  try {
    const oidc = await Promise.race([getOidc(), new Promise<never>((_, reject) => combined.addEventListener("abort", () => reject(new AuthUnavailable()), { once: true }))]);
    const claims = decodeClaims(oidc);
    if (claims.iss !== config.vercelIssuer || claims.owner_id !== config.vercelOwnerId || claims.project_id !== config.vercelProjectId || claims.environment !== "preview" || claims.aud !== config.vercelAudience || typeof claims.sub !== "string" || typeof claims.exp !== "number" || claims.exp * 1000 <= Date.now() + 10000) throw new AuthUnavailable();
    const audience = `//iam.googleapis.com/projects/${config.projectNumber}/locations/global/workloadIdentityPools/${config.poolId}/providers/${config.providerId}`;
    const client = new IdentityPoolClient({
      type: "external_account", audience, subject_token_type: "urn:ietf:params:oauth:token-type:jwt", token_url: "https://sts.googleapis.com/v1/token",
      service_account_impersonation_url: `https://iamcredentials.googleapis.com/v1/projects/-/serviceAccounts/${encodeURIComponent(config.serviceAccountEmail)}:generateAccessToken`,
      subject_token_supplier: { getSubjectToken: async () => oidc }, scopes: ["https://www.googleapis.com/auth/cloud-platform"],
      transporterOptions: { timeout: 7000, retry: false, signal: combined },
    });
    const result = await Promise.race([client.getAccessToken(), new Promise<never>((_, reject) => combined.addEventListener("abort", () => reject(new AuthUnavailable()), { once: true }))]);
    if (!result.token) throw new AuthUnavailable();
    return result.token;
  } catch { throw new AuthUnavailable(); }
}
