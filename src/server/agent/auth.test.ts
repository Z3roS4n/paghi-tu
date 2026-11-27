import { describe, expect, it, vi } from "vitest";
vi.mock("server-only", () => ({}));
import { clearRuntimeTokenCache, getRuntimeAccessToken } from "./auth.ts";
import type { AgentConfig } from "./config.ts";

const config: AgentConfig = { environment: "preview", projectId: "paghi-tu-agent", projectNumber: "123456789012", poolId: "pool", providerId: "provider", serviceAccountEmail: "agent@paghi-tu-agent.iam.gserviceaccount.com", engineId: "engine", dataStoreId: "store", databaseId: "preview-db", allowedOrigin: "https://preview.example.vercel.app", ipHashSecret: "x".repeat(32), vercelOwnerId: "team_test", vercelProjectId: "prj_test", vercelAudience: "https://vercel.com/team_test", vercelIssuer: "https://oidc.vercel.com/team_test" };
const token = (claims: Record<string, unknown>) => `e30.${Buffer.from(JSON.stringify(claims)).toString("base64url")}.signature`;
describe("WIF pin gate", () => {
  it("rejects wrong owner before an external exchange", async () => { const get = vi.fn(async () => token({ owner_id: "team_other", project_id: config.vercelProjectId, environment: "preview", aud: config.vercelAudience, exp: Date.now() / 1000 + 3600 })); await expect(getRuntimeAccessToken(config, new AbortController().signal, get)).rejects.toThrow("authentication unavailable"); expect(get).toHaveBeenCalledOnce(); });
  it("rejects a production assertion", async () => { const get = async () => token({ owner_id: config.vercelOwnerId, project_id: config.vercelProjectId, environment: "production", aud: config.vercelAudience, exp: Date.now() / 1000 + 3600 }); await expect(getRuntimeAccessToken(config, new AbortController().signal, get)).rejects.toThrow(); });
});

describe("environment binding and token reuse (D-047)", () => {
  const claims = (environment: string) => ({ iss: config.vercelIssuer, owner_id: config.vercelOwnerId, project_id: config.vercelProjectId, environment, aud: config.vercelAudience, sub: "owner:team_test:project:prj_test:environment:" + environment, exp: Date.now() / 1000 + 3600 });
  const production: AgentConfig = { ...config, environment: "production", databaseId: "paghi-tu-production", providerId: "production-provider", serviceAccountEmail: "agent-prod@paghi-tu-agent.iam.gserviceaccount.com" };
  const signal = () => new AbortController().signal;
  it("rejects a Preview assertion on the production config and the reverse, before any exchange", async () => {
    clearRuntimeTokenCache(); const exchange = vi.fn(async () => "token");
    await expect(getRuntimeAccessToken(production, signal(), async () => token(claims("preview")), exchange)).rejects.toThrow("authentication unavailable");
    await expect(getRuntimeAccessToken(config, signal(), async () => token(claims("production")), exchange)).rejects.toThrow("authentication unavailable");
    expect(exchange).not.toHaveBeenCalled();
  });
  it("reuses a token for ten minutes per environment, still checking every assertion", async () => {
    clearRuntimeTokenCache(); let clock = Date.now(); const now = () => clock;
    const exchange = vi.fn(async (cfg: AgentConfig) => `token-${cfg.environment}-${exchange.mock.calls.length}`);
    expect(await getRuntimeAccessToken(config, signal(), async () => token(claims("preview")), exchange, now)).toBe("token-preview-1");
    expect(await getRuntimeAccessToken(config, signal(), async () => token(claims("preview")), exchange, now)).toBe("token-preview-1");
    expect(await getRuntimeAccessToken(production, signal(), async () => token(claims("production")), exchange, now)).toBe("token-production-2");
    await expect(getRuntimeAccessToken(config, signal(), async () => token(claims("production")), exchange, now)).rejects.toThrow();
    clock += 10 * 60 * 1000 + 1;
    expect(await getRuntimeAccessToken(config, signal(), async () => token(claims("preview")), exchange, now)).toBe("token-preview-3");
    expect(exchange).toHaveBeenCalledTimes(3);
  });
  it("keys the cached token on provider and service account, not only on the environment", async () => {
    clearRuntimeTokenCache(); let n = 0; const exchange = vi.fn(async () => `token-${++n}`);
    expect(await getRuntimeAccessToken(config, signal(), async () => token(claims("preview")), exchange)).toBe("token-1");
    expect(await getRuntimeAccessToken({ ...config, serviceAccountEmail: "other@paghi-tu-agent.iam.gserviceaccount.com" }, signal(), async () => token(claims("preview")), exchange)).toBe("token-2");
    expect(await getRuntimeAccessToken({ ...config, providerId: "other-provider" }, signal(), async () => token(claims("preview")), exchange)).toBe("token-3");
  });
  it("does not cache a failed exchange", async () => {
    clearRuntimeTokenCache(); const exchange = vi.fn(async () => null);
    await expect(getRuntimeAccessToken(config, signal(), async () => token(claims("preview")), exchange)).rejects.toThrow();
    await expect(getRuntimeAccessToken(config, signal(), async () => token(claims("preview")), exchange)).rejects.toThrow();
    expect(exchange).toHaveBeenCalledTimes(2);
  });
});
