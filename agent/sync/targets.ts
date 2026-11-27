// Closed allow-list of (database, namespace) pairs the index sync may lock and stamp (D-047).
// Firestore IAM is per database, so production state lives in its own database.
export const SYNC_TARGETS = {
  preview: { environment: "preview", databaseId: "paghi-tu-preview" },
  production: { environment: "production", databaseId: "paghi-tu-production" },
} as const;
export type SyncTarget = (typeof SYNC_TARGETS)[keyof typeof SYNC_TARGETS];

export function parseSyncTargets(value: string | undefined): SyncTarget[] {
  const names = (value ?? "preview").split(",").map((name) => name.trim());
  if (names.length === 0 || names.some((name) => !Object.hasOwn(SYNC_TARGETS, name)) || new Set(names).size !== names.length) throw new Error("invalid sync targets");
  // Fixed order, so the lock sequence does not depend on how the variable is written.
  return (Object.keys(SYNC_TARGETS) as (keyof typeof SYNC_TARGETS)[]).filter((name) => names.includes(name)).map((name) => SYNC_TARGETS[name]);
}
