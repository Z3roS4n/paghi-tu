import "server-only";
import { createHash } from "node:crypto";
import { readFile } from "node:fs/promises";
import { join } from "node:path";
import { IndexDocument } from "../../../agent/ingest/export.ts";
import { loadAgentConfig } from "./config.ts";
import { getRuntimeAccessToken } from "./auth.ts";
import { FirestoreStateStore } from "./state.ts";
import { createAgentHandler } from "./service.ts";

let indexCache: Promise<ReadonlyMap<string, IndexDocument>> | undefined;
export function loadAgentIndex(): Promise<ReadonlyMap<string, IndexDocument>> {
  indexCache ??= (async () => {
    const root = join(process.cwd(), "agent", "ingest");
    const [jsonl, manifestText] = await Promise.all([readFile(join(root, "out", "documenti.jsonl"), "utf8"), readFile(join(root, "manifest.json"), "utf8")]);
    const manifest: unknown = JSON.parse(manifestText);
    if (!manifest || typeof manifest !== "object" || !("sha256" in manifest) || manifest.sha256 !== createHash("sha256").update(jsonl).digest("hex")) throw new Error("invalid index");
    const index = new Map<string, IndexDocument>();
    for (const line of jsonl.split("\n").filter(Boolean)) {
      const doc = IndexDocument.parse(JSON.parse(line));
      if (index.has(doc.id)) throw new Error("duplicate index id");
      index.set(doc.id, doc);
    }
    if (!("documenti" in manifest) || manifest.documenti !== index.size) throw new Error("invalid index count");
    return index;
  })();
  return indexCache;
}

const config = loadAgentConfig();
export const handleAgentPost = createAgentHandler({
  config,
  getToken: getRuntimeAccessToken,
  state: (cfg, token, signal) => new FirestoreStateStore({ projectId: cfg.projectId, databaseId: cfg.databaseId, namespace: "preview", accessToken: async () => token, signal }),
  index: loadAgentIndex,
  log: (audit) => console.info(JSON.stringify(audit)),
});
