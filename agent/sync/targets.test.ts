import { describe, expect, it } from "vitest";
import { parseSyncTargets } from "./targets.ts";

describe("sync targets (D-047)", () => {
  it("defaults to Preview only, as before", () => {
    expect(parseSyncTargets(undefined)).toEqual([{ environment: "preview", databaseId: "paghi-tu-preview" }]);
  });
  it("maps each environment to its own database in a fixed order", () => {
    expect(parseSyncTargets("production, preview")).toEqual([{ environment: "preview", databaseId: "paghi-tu-preview" }, { environment: "production", databaseId: "paghi-tu-production" }]);
    expect(parseSyncTargets("production")).toEqual([{ environment: "production", databaseId: "paghi-tu-production" }]);
  });
  it("rejects unknown, empty and repeated targets before any I/O", () => {
    for (const value of ["", "prod", "preview,", "preview,preview", "staging", "constructor", "__proto__"]) expect(() => parseSyncTargets(value)).toThrow("invalid sync targets");
  });
});
