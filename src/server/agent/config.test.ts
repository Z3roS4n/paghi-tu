import { describe, expect, it, vi } from "vitest";
vi.mock("server-only", () => ({}));
import { agentEnvironment, loadAgentConfig, PRODUCTION_DATABASE_ID } from "./config.ts";

const good = { AGENT_ENABLED: "1", VERCEL_ENV: "preview", GCP_PROJECT_ID: "paghi-tu-agent", GCP_PROJECT_NUMBER: "123456789012", GCP_WORKLOAD_IDENTITY_POOL_ID: "vercel-pool", GCP_WORKLOAD_IDENTITY_POOL_PROVIDER_ID: "preview-provider", GCP_SERVICE_ACCOUNT_EMAIL: "agent@paghi-tu-agent.iam.gserviceaccount.com", VERTEX_ENGINE_ID: "engine", VERTEX_DATA_STORE_ID: "store", AGENT_STATE_DATABASE_ID: "preview-db", AGENT_ALLOWED_ORIGIN: "https://preview.example.vercel.app", AGENT_IP_HASH_SECRET: "x".repeat(32), AGENT_VERCEL_OWNER_ID: "team_abc123", AGENT_VERCEL_PROJECT_ID: "prj_abc123", AGENT_VERCEL_AUDIENCE: "https://vercel.com/team_abc123", AGENT_VERCEL_ISSUER: "https://oidc.vercel.com/team_abc123" };
describe("Preview config", () => {
  it("keeps production and missing flag off", () => { expect(loadAgentConfig({ ...good, VERCEL_ENV: "production" })).toBeNull(); expect(loadAgentConfig({ ...good, AGENT_ENABLED: "0" })).toBeNull(); });
  it("requires pins, secret and exact HTTPS origin", () => { expect(loadAgentConfig(good)).not.toBeNull(); expect(loadAgentConfig({ ...good, AGENT_VERCEL_OWNER_ID: "PENDING" })).toBeNull(); expect(loadAgentConfig({ ...good, AGENT_ALLOWED_ORIGIN: "http://preview.example" })).toBeNull(); expect(loadAgentConfig({ ...good, AGENT_IP_HASH_SECRET: "short" })).toBeNull(); });
});

describe("Production switch (D-047)", () => {
  const prod = { ...good, VERCEL_ENV: "production", AGENT_PRODUCTION_ENABLED: "1", AGENT_STATE_DATABASE_ID: "paghi-tu-production", AGENT_ALLOWED_ORIGIN: "https://www.example.it" };
  it("keeps today's Preview config unchanged apart from the environment", () => {
    expect(loadAgentConfig(good)).toMatchObject({ environment: "preview", databaseId: "preview-db" });
    expect(agentEnvironment(good)).toBe("preview");
  });
  it("stays off in production without the second switch", () => {
    const withoutSwitch = { ...prod, AGENT_PRODUCTION_ENABLED: undefined };
    expect(loadAgentConfig(withoutSwitch)).toBeNull(); expect(agentEnvironment(withoutSwitch)).toBeNull();
    expect(loadAgentConfig({ ...prod, AGENT_PRODUCTION_ENABLED: "true" })).toBeNull();
  });
  it("binds production to its own database and Preview away from it", () => {
    expect(loadAgentConfig(prod)).toMatchObject({ environment: "production", databaseId: PRODUCTION_DATABASE_ID });
    expect(loadAgentConfig({ ...prod, AGENT_STATE_DATABASE_ID: "paghi-tu-preview" })).toBeNull();
    expect(loadAgentConfig({ ...good, AGENT_STATE_DATABASE_ID: PRODUCTION_DATABASE_ID })).toBeNull();
  });
  it("never lets the switch select the environment", () => {
    expect(loadAgentConfig({ ...good, AGENT_PRODUCTION_ENABLED: "1" })).toMatchObject({ environment: "preview" });
    for (const VERCEL_ENV of ["development", "", undefined, "Production"]) expect(loadAgentConfig({ ...prod, VERCEL_ENV })).toBeNull();
    expect(loadAgentConfig({ ...prod, AGENT_ENABLED: "0" })).toBeNull();
  });
});
