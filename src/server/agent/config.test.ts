import { describe, expect, it, vi } from "vitest";
vi.mock("server-only", () => ({}));
import { loadAgentConfig } from "./config.ts";

const good = { AGENT_ENABLED: "1", VERCEL_ENV: "preview", GCP_PROJECT_ID: "paghi-tu-agent", GCP_PROJECT_NUMBER: "123456789012", GCP_WORKLOAD_IDENTITY_POOL_ID: "vercel-pool", GCP_WORKLOAD_IDENTITY_POOL_PROVIDER_ID: "preview-provider", GCP_SERVICE_ACCOUNT_EMAIL: "agent@paghi-tu-agent.iam.gserviceaccount.com", VERTEX_ENGINE_ID: "engine", VERTEX_DATA_STORE_ID: "store", AGENT_STATE_DATABASE_ID: "preview-db", AGENT_ALLOWED_ORIGIN: "https://preview.example.vercel.app", AGENT_IP_HASH_SECRET: "x".repeat(32), AGENT_VERCEL_OWNER_ID: "team_abc123", AGENT_VERCEL_PROJECT_ID: "prj_abc123", AGENT_VERCEL_AUDIENCE: "https://vercel.com/team_abc123", AGENT_VERCEL_ISSUER: "https://oidc.vercel.com/team_abc123" };
describe("Preview config", () => {
  it("keeps production and missing flag off", () => { expect(loadAgentConfig({ ...good, VERCEL_ENV: "production" })).toBeNull(); expect(loadAgentConfig({ ...good, AGENT_ENABLED: "0" })).toBeNull(); });
  it("requires pins, secret and exact HTTPS origin", () => { expect(loadAgentConfig(good)).not.toBeNull(); expect(loadAgentConfig({ ...good, AGENT_VERCEL_OWNER_ID: "PENDING" })).toBeNull(); expect(loadAgentConfig({ ...good, AGENT_ALLOWED_ORIGIN: "http://preview.example" })).toBeNull(); expect(loadAgentConfig({ ...good, AGENT_IP_HASH_SECRET: "short" })).toBeNull(); });
});
