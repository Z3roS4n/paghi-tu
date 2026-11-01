import { describe, expect, it, vi } from "vitest";
vi.mock("server-only", () => ({}));
import { getRuntimeAccessToken } from "./auth.ts";
import type { AgentConfig } from "./config.ts";

const config: AgentConfig = { projectId: "paghi-tu-agent", projectNumber: "123456789012", poolId: "pool", providerId: "provider", serviceAccountEmail: "agent@paghi-tu-agent.iam.gserviceaccount.com", engineId: "engine", dataStoreId: "store", databaseId: "preview-db", allowedOrigin: "https://preview.example.vercel.app", ipHashSecret: "x".repeat(32), vercelOwnerId: "team_test", vercelProjectId: "prj_test", vercelAudience: "https://vercel.com/team_test", vercelIssuer: "https://oidc.vercel.com/team_test" };
const token = (claims: Record<string, unknown>) => `e30.${Buffer.from(JSON.stringify(claims)).toString("base64url")}.signature`;
describe("WIF pin gate", () => {
  it("rejects wrong owner before an external exchange", async () => { const get = vi.fn(async () => token({ owner_id: "team_other", project_id: config.vercelProjectId, environment: "preview", aud: config.vercelAudience, exp: Date.now() / 1000 + 3600 })); await expect(getRuntimeAccessToken(config, new AbortController().signal, get)).rejects.toThrow("authentication unavailable"); expect(get).toHaveBeenCalledOnce(); });
  it("rejects a production assertion", async () => { const get = async () => token({ owner_id: config.vercelOwnerId, project_id: config.vercelProjectId, environment: "production", aud: config.vercelAudience, exp: Date.now() / 1000 + 3600 }); await expect(getRuntimeAccessToken(config, new AbortController().signal, get)).rejects.toThrow(); });
});
