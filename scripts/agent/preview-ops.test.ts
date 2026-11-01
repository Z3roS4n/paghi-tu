import { afterEach, expect, test } from "vitest";
import { mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { assertEphemeralStorageSettings, assertTTLActive, exactPreviewTarget, readConfig, recoverHaltedGlobal } from "./preview-common.mjs";

const dirs: string[] = [];
afterEach(() => { for (const dir of dirs.splice(0)) rmSync(dir, { recursive: true }); });

function config(overrides: Record<string, string> = {}) {
  const dir = mkdtempSync(join(tmpdir(), "paghi-preview-ops-"));
  dirs.push(dir);
  const path = join(dir, "config.json");
  writeFileSync(path, JSON.stringify({
    gcpProjectId: "paghi-tu-agent", gcpProjectNumber: "123456789", databaseId: "paghi-tu-preview", databaseLocation: "europe-west1",
    serviceAccountEmail: "paghi-runtime@paghi-tu-agent.iam.gserviceaccount.com", workloadIdentityPoolId: "preview-pool", workloadIdentityProviderId: "vercel-provider",
    vercelOwnerId: "team_verified", vercelProjectId: "prj_verified", vercelIssuer: "https://oidc.vercel.com/team_verified",
    vercelJwtAudience: "https://oidc.vercel.com/team_verified", stsAudience: "//iam.googleapis.com/projects/123456789/locations/global/workloadIdentityPools/preview-pool/providers/vercel-provider",
    previewOrigin: "https://paghi-tu-preview.vercel.app", ...overrides,
  }));
  return path;
}

test("rejects missing pins and production targets before any operator action", () => {
  expect(() => readConfig(config({ vercelOwnerId: "REQUIRED_VERIFIED_OWNER_ID" }))).toThrow();
  expect(() => readConfig(config({ gcpProjectId: "other-project" }))).toThrow();
  expect(() => readConfig(config({ previewOrigin: "https://www.paghitu.it" }))).toThrow();
  expect(() => readConfig(config({ vercelProjectId: "prj_x' || true" }))).toThrow();
  expect(() => readConfig(config({ databaseLocation: "europe-west2" }))).toThrow();
  expect(() => readConfig(config({ databaseLocation: "europe-west6" }))).toThrow();
  expect(readConfig(config({ databaseLocation: "europe-west1" })).databaseLocation).toBe("europe-west1");
});

test("accepts only the exact protected Preview origin", () => {
  const origin = "https://paghi-tu-preview.vercel.app";
  expect(exactPreviewTarget(origin + "/", origin)).toBe(origin);
  expect(() => exactPreviewTarget("https://www.paghitu.it/", origin)).toThrow();
  expect(() => exactPreviewTarget(origin + "/api/agent", origin)).toThrow();
  expect(() => exactPreviewTarget(origin + "/?token=secret", origin)).toThrow();
});

test("recovery requires explicit acknowledgment and an expired matching lease", () => {
  const global = { day: "2026-10-31", dayCount: 49, month: "2026-10", monthCount: 999, halted: true, lease: { owner: "opaque-owner", until: 1100 } };
  expect(() => recoverHaltedGlobal(global, { acknowledged: false, expectedLeaseOwner: "opaque-owner", now: 1200 })).toThrow();
  expect(() => recoverHaltedGlobal(global, { acknowledged: true, expectedLeaseOwner: "opaque-owner", now: 1000 })).toThrow();
  expect(() => recoverHaltedGlobal(global, { acknowledged: true, expectedLeaseOwner: "another-owner", now: 1200 })).toThrow();
  expect(global.halted).toBe(true);
});

test("recovery clears only halt and expired owned lease, preserving counters", () => {
  const global = { day: "2026-10-31", dayCount: 50, month: "2026-10", monthCount: 1000, halted: true, lease: { owner: "opaque-owner", until: 1100 }, extra: "preserved" };
  const recovered = recoverHaltedGlobal(global, { acknowledged: true, expectedLeaseOwner: "opaque-owner", now: 1200 });
  expect(recovered).toEqual({ ...global, halted: false, lease: undefined });
  expect(recovered.dayCount).toBe(50);
  expect(recovered.monthCount).toBe(1000);
});

test("PITR and backup schedules require independent, conclusive negative checks", () => {
  const database = { pointInTimeRecoveryEnablement: "POINT_IN_TIME_RECOVERY_DISABLED" };
  expect(() => assertEphemeralStorageSettings(database, [])).not.toThrow();
  expect(() => assertEphemeralStorageSettings(database, [{ name: "daily" }])).toThrow();
  expect(() => assertEphemeralStorageSettings(database, null)).toThrow();
  expect(() => assertEphemeralStorageSettings({}, [])).toThrow();
  expect(() => assertEphemeralStorageSettings({ pointInTimeRecoveryEnablement: "POINT_IN_TIME_RECOVERY_ENABLED" }, [])).toThrow();
});

test("TTL requires the exact Preview field in ACTIVE state", () => {
  const name = "projects/paghi-tu-agent/databases/paghi-tu-preview/collectionGroups/agent_preview/fields/expiresAt";
  const verify = (fields: unknown) => assertTTLActive(fields, "paghi-tu-agent", "paghi-tu-preview");
  expect(() => verify([{ name, ttlConfig: { state: "ACTIVE" } }])).not.toThrow();
  for (const state of ["CREATING", "NEEDS_REPAIR", "STATE_UNSPECIFIED", undefined]) {
    expect(() => verify([{ name, ttlConfig: { state } }])).toThrow();
  }
  expect(() => verify([])).toThrow();
  expect(() => verify(null)).toThrow();
  expect(() => verify([{ name: name.replace("agent_preview", "agent_other"), ttlConfig: { state: "ACTIVE" } }])).toThrow();
  expect(() => verify([{ name, ttlConfig: { state: "ACTIVE" } }, { name, ttlConfig: { state: "ACTIVE" } }])).toThrow();
});


test("requires a verified index stamp and no sync marker before manual enable", async () => {
  const { assertIndexReadyControl } = await import("./preview-common.mjs");
  expect(() => assertIndexReadyControl({ enabled: false })).toThrow();
  expect(() => assertIndexReadyControl({ indexSha256: "x".repeat(64) })).toThrow();
  expect(() => assertIndexReadyControl({ indexSha256: "a".repeat(64), sync: { owner: "sync" } })).toThrow();
  expect(() => assertIndexReadyControl({ indexSha256: "a".repeat(64) })).not.toThrow();
});
