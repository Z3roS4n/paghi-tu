import type { AgentAnswer } from "../answer/answer.ts";
import type { IndexDocument } from "../ingest/export.ts";
import { createCore } from "./core.ts";
import { converse } from "./conversation.ts";

export type { AgentAnswer } from "../answer/answer.ts";
export type { IndexDocument } from "../ingest/export.ts";

export type RuntimeConfig = {
  projectId: string;
  engineId: string;
  dataStoreId: string;
  location: "eu";
};

export type TransportRequest = { kind: "search" | "answer"; url: string; body: unknown };
export type TransportResponse = { status: number; ok: boolean; json: unknown };
export type RuntimeTransport = (request: TransportRequest, signal: AbortSignal) => Promise<TransportResponse>;

export type ConversationContext = {
  question: string;
  ids: string[];
  fingerprints: string[];
  fallback: AgentAnswer;
};

export type ConversationResult = {
  shown: AgentAnswer;
  context?: ConversationContext;
  mode: "astensione" | "diretta" | "chiarimento" | "dati" | "sintesi" | "spiegazione";
  notice?: string;
  backend: "locale" | "search" | "answer";
};

export function createAgentRuntime({ index, transport, signal, config }: {
  index: ReadonlyMap<string, IndexDocument>;
  transport: RuntimeTransport;
  signal: AbortSignal;
  config: RuntimeConfig;
}) {
  const core = createCore({ index, config });
  return {
    async reply(question: string, previous?: ConversationContext): Promise<ConversationResult> {
      let attempts = 0;
      const dispatch = async (request: TransportRequest): Promise<TransportResponse> => {
        if (signal.aborted) throw new DOMException("Request aborted", "AbortError");
        if (attempts >= 3) throw new Error("vertex attempt budget exhausted");
        attempts++;
        return transport(request, signal);
      };
      return converse(question, index, previous, core, dispatch);
    },
  };
}
