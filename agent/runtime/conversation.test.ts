import { readFileSync } from "node:fs";
import { createHash } from "node:crypto";
import { gunzipSync } from "node:zlib";
import { fileURLToPath } from "node:url";
import { describe, expect, it, vi } from "vitest";
import { z } from "zod";
import { IndexDocument } from "../ingest/export.ts";
import { createAgentRuntime, type AgentAnswer, type RuntimeTransport } from "./index.ts";

const fixture = fileURLToPath(new URL("./fixtures/recorded-runs.jsonl.gz", import.meta.url));
const [snapshot, ...rows] = gunzipSync(readFileSync(fixture)).toString("utf8").trim().split("\n").map((line) => JSON.parse(line) as unknown);
const docs = (snapshot as { index: unknown[] }).index.map((doc) => IndexDocument.parse(doc));
const index = new Map(docs.map((doc) => [doc.id, doc]));
const recorded = rows.find((row) => (row as { id?: string }).id === "GOV-g5-in-carica") as { domanda: string; raw: unknown; shown: unknown };
const config = { projectId: "paghi-tu-agent", engineId: "paghi-tu-agente", dataStoreId: "paghi-tu-dati", location: "eu" as const };

describe("portable conversation", () => {
  it("keeps a validated factual fallback and rejects changed provenance", async () => {
    const transport = vi.fn<RuntimeTransport>()
      .mockResolvedValueOnce({ status: 200, ok: true, json: recorded.raw })
      .mockResolvedValue({ status: 500, ok: false, json: {} });
    const runtime = createAgentRuntime({ index, transport, signal: new AbortController().signal, config });
    const first = await runtime.reply(recorded.domanda);
    expect(first.shown).toEqual(recorded.shown);
    expect(first.mode).toBe("dati");
    expect(first.context?.ids.length).toBeGreaterThan(0);
    expect(first.notice).toBeDefined();
    expect(transport).toHaveBeenCalledTimes(2);
    const formulation = z.object({ answerGenerationSpec: z.object({ promptSpec: z.object({ preamble: z.string() }) }) })
      .parse(transport.mock.calls[1][0].body);
    expect(createHash("sha256").update(formulation.answerGenerationSpec.promptSpec.preamble).digest("hex"))
      .toBe("76e4ec2e003fce1c706223b92c08ec93a23b1f45b428d3d1298255f7c90b58a6");

    const followup = await runtime.reply("Cosa significa?", first.context);
    expect(followup.mode).toBe("dati");
    expect(followup.shown).toEqual(first.shown);
    expect(transport).toHaveBeenCalledTimes(3);

    const stale = { ...first.context!, fingerprints: first.context!.fingerprints.map(() => "changed") };
    const rejected = await runtime.reply("Cosa significa?", stale);
    expect(rejected.mode).toBe("chiarimento");
    expect(rejected.context).toBeUndefined();
    expect(transport).toHaveBeenCalledTimes(3);
  });

  it("asks for a complete reference without spending a Vertex attempt", async () => {
    const transport = vi.fn<RuntimeTransport>();
    const runtime = createAgentRuntime({ index, transport, signal: new AbortController().signal, config });
    const result = await runtime.reply("Cosa significa?");
    expect(result.mode).toBe("chiarimento");
    expect(result.backend).toBe("locale");
    expect(transport).not.toHaveBeenCalled();
  });

  it("rejects a valid fallback from a different record before dispatch", async () => {
    const transport = vi.fn<RuntimeTransport>();
    const runtime = createAgentRuntime({ index, transport, signal: new AbortController().signal, config });
    const other = index.get("governi--g55")!;
    const forged = {
      question: recorded.domanda,
      ids: [other.id],
      fingerprints: [createHash("sha256").update(JSON.stringify(other)).digest("hex")],
      fallback: recorded.shown as AgentAnswer,
    };
    const result = await runtime.reply("Cosa significa?", forged);
    expect(result.mode).toBe("chiarimento");
    expect(result.context).toBeUndefined();
    expect(transport).not.toHaveBeenCalled();
  });
});
