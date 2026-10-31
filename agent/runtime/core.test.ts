import { readFileSync } from "node:fs";
import { createHash } from "node:crypto";
import { gunzipSync } from "node:zlib";
import { fileURLToPath } from "node:url";
import { describe, expect, it, vi } from "vitest";
import { z } from "zod";
import { IndexDocument } from "../ingest/export.ts";
import { createAgentRuntime, type RuntimeTransport } from "./index.ts";

const fixture = fileURLToPath(new URL("./fixtures/recorded-runs.jsonl.gz", import.meta.url));
const snapshot = JSON.parse(gunzipSync(readFileSync(fixture)).toString("utf8").split("\n", 1)[0]) as { index: unknown[] };
const gov = IndexDocument.parse(snapshot.index.find((doc) => IndexDocument.safeParse(doc).data?.id === "governi--g60"));
const govSha = createHash("sha256").update(JSON.stringify(gov)).digest("hex");
const index = new Map([[gov.id, gov]]);
const config = { projectId: "paghi-tu-agent", engineId: "paghi-tu-agente", dataStoreId: "paghi-tu-dati", location: "eu" as const };

describe("portable runtime dispatch", () => {
  it("answers blocked and transparency questions locally", async () => {
    const transport = vi.fn<RuntimeTransport>();
    const runtime = createAgentRuntime({ index, transport, signal: new AbortController().signal, config });
    expect((await runtime.reply("Per chi devo votare?")).shown.astensione).toBe(true);
    expect((await runtime.reply("Sei una persona?")).backend).toBe("locale");
    expect(transport).not.toHaveBeenCalled();
  });

  it("counts both search attempts and a formulation in the three dispatch budget", async () => {
    const signal = new AbortController().signal;
    const transport = vi.fn<RuntimeTransport>()
      .mockResolvedValueOnce({ status: 200, ok: true, json: { results: [] } })
      .mockResolvedValueOnce({ status: 200, ok: true, json: { results: [{ document: { id: gov.id, structData: { source_sha256: govSha } } }] } })
      .mockResolvedValueOnce({ status: 500, ok: false, json: {} });
    const runtime = createAgentRuntime({ index, transport, signal, config });
    const result = await runtime.reply("Chi era il presidente del Consiglio in Italia il 17 maggio 2007?");
    expect(result.shown.astensione).toBe(false);
    expect(result.mode).toBe("dati");
    expect(result.context?.ids).toEqual([gov.id]);
    expect(transport).toHaveBeenCalledTimes(3);
    expect(transport.mock.calls.every(([, passed]) => passed === signal)).toBe(true);
    expect(transport.mock.calls[1][0].body).toMatchObject({ query: "" });
  });

  it("does not retry 401 or dispatch after abort", async () => {
    const controller = new AbortController();
    const transport = vi.fn<RuntimeTransport>().mockResolvedValue({ status: 401, ok: false, json: {} });
    const runtime = createAgentRuntime({ index: new Map(), transport, signal: controller.signal, config });
    await expect(runtime.reply("Quanti governi ci sono stati in Italia?")).rejects.toThrow("answer HTTP 401");
    expect(transport).toHaveBeenCalledTimes(1);
    controller.abort();
    await expect(runtime.reply("Quanti governi ci sono stati in Italia?")).rejects.toMatchObject({ name: "AbortError" });
    expect(transport).toHaveBeenCalledTimes(1);
  });

  it("keeps baseline Answer parameters and preamble bytes", async () => {
    const transport = vi.fn<RuntimeTransport>().mockResolvedValue({ status: 200, ok: true, json: { answer: {} } });
    const runtime = createAgentRuntime({ index: new Map(), transport, signal: new AbortController().signal, config });
    await runtime.reply("Quanti governi ci sono stati in Italia?");
    expect(transport).toHaveBeenCalledTimes(1);
    const request = transport.mock.calls[0][0];
    expect(request.kind).toBe("answer");
    expect(request.url).toBe("https://eu-discoveryengine.googleapis.com/v1/projects/paghi-tu-agent/locations/eu/collections/default_collection/engines/paghi-tu-agente/servingConfigs/default_search:answer");
    const body = z.object({
      query: z.object({ text: z.string() }),
      answerGenerationSpec: z.object({
        ignoreAdversarialQuery: z.boolean(), ignoreNonAnswerSeekingQuery: z.boolean(),
        ignoreLowRelevantContent: z.boolean(), ignoreJailBreakingQuery: z.boolean(),
        includeCitations: z.boolean(), answerLanguageCode: z.string(),
        promptSpec: z.object({ preamble: z.string() }),
      }),
    }).parse(request.body);
    expect(body.query.text).toBe("Quanti governi ci sono stati in Italia?");
    expect(body.answerGenerationSpec).toMatchObject({
      ignoreAdversarialQuery: false, ignoreNonAnswerSeekingQuery: false,
      ignoreLowRelevantContent: false, ignoreJailBreakingQuery: false,
      includeCitations: true, answerLanguageCode: "it",
    });
    expect(createHash("sha256").update(body.answerGenerationSpec.promptSpec.preamble).digest("hex"))
      .toBe("934d9a1fa6066d3be1f54fb8f4efec89746b7ab7e4a3cf6a2f631d6db1d574dc");
  });
});
