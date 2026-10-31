import "server-only";
import { randomBytes } from "node:crypto";
import { isIP } from "node:net";
import type { AgentConfig } from "./config.ts";
import { AuthUnavailable } from "./auth.ts";
import { FirestoreStateStore, StateUnavailable, CommitUncertain } from "./state.ts";
import { PreviewPolicy, PolicyDenied, type Admission } from "./policy.ts";
import { agentRequestSchema, type AgentAskResponse, type AgentErrorResponse } from "../../lib/agent-contract.ts";
import { createAgentRuntime, type RuntimeTransport } from "../../../agent/runtime/index.ts";
import type { IndexDocument } from "../../../agent/ingest/export.ts";

export type AgentAudit = { requestId?: string; status: number; durationMs: number; attempts: number; release: string };
type Dependencies = { config: AgentConfig | null; getToken: (config: AgentConfig, signal: AbortSignal) => Promise<string>; state: (config: AgentConfig, token: string, signal: AbortSignal) => FirestoreStateStore; index: () => Promise<ReadonlyMap<string, IndexDocument>>; fetch?: typeof fetch; now?: () => number; log?: (audit: AgentAudit) => void };
const headers = { "cache-control": "no-store, max-age=0", "content-type": "application/json; charset=utf-8" };
function failure(status: number, code: string, message: string, requestId?: string): Response { return new Response(JSON.stringify({ error: { code, message }, ...(requestId ? { requestId } : {}) } satisfies AgentErrorResponse), { status, headers }); }
function readCookie(request: Request): string | null {
  const all = request.headers.get("cookie") ?? "";
  const values = all.split(";").map((x) => x.trim()).filter((x) => x.startsWith("__Host-paghi-agent="));
  if (values.length !== 1) return null;
  const cookie = values[0].slice("__Host-paghi-agent=".length);
  return /^[A-Za-z0-9_-]{43}$/.test(cookie) ? cookie : null;
}
async function readSmallJson(request: Request, signal: AbortSignal): Promise<unknown> {
  const reader = request.body?.getReader(); if (!reader) throw new Error("invalid");
  let size = 0; const chunks: Uint8Array[] = [];
  const cancel = () => { void reader.cancel(); };
  signal.addEventListener("abort", cancel, { once: true });
  try {
    while (true) {
      if (signal.aborted) throw new DOMException("aborted", "AbortError");
      const { done, value } = await reader.read(); if (done) break;
      size += value.byteLength; if (size > 4096) throw new RangeError("too large"); chunks.push(value);
    }
  } finally { signal.removeEventListener("abort", cancel); reader.cancel().catch(() => undefined); }
  return JSON.parse(new TextDecoder("utf-8", { fatal: true }).decode(Buffer.concat(chunks)));
}
function statusFor(error: unknown, signal: AbortSignal, requestId?: string): Response {
  if (signal.aborted) return failure(504, "DEADLINE", "Tempo scaduto.", requestId);
  if (error instanceof PolicyDenied) {
    if (error.code === "disabled") return failure(503, "DISABLED", "Assistente non disponibile.", requestId);
    if (error.code === "rate" || error.code === "cap") return failure(429, "LIMIT", "Limite raggiunto.", requestId);
    return failure(409, "CONFLICT", "Richiesta non disponibile.", requestId);
  }
  if (error instanceof CommitUncertain || error instanceof StateUnavailable || error instanceof AuthUnavailable) return failure(503, "UNAVAILABLE", "Assistente non disponibile.", requestId);
  return failure(503, "UNAVAILABLE", "Assistente non disponibile.", requestId);
}

export function createAgentHandler(deps: Dependencies): (request: Request) => Promise<Response> {
  const handle = async (request: Request, audit: { requestId?: string; attempts: number }): Promise<Response> => {
    if (request.method !== "POST") return failure(400, "INPUT", "Richiesta non valida.");
    if (!deps.config) return failure(503, "DISABLED", "Assistente non disponibile.");
    const config = deps.config;
    const startedAt = Date.now();
    const deadline = AbortSignal.timeout(45000);
    const signal = AbortSignal.any([deadline, request.signal]);
    if (request.headers.get("origin") !== config.allowedOrigin) return failure(403, "ORIGIN", "Origine non autorizzata.");
    if (!/^application\/json(?:;\s*charset=utf-8)?$/i.test(request.headers.get("content-type") ?? "")) return failure(400, "INPUT", "Richiesta non valida.");
    const claimedLength = Number(request.headers.get("content-length"));
    if (Number.isFinite(claimedLength) && claimedLength > 4096) return failure(413, "SIZE", "Richiesta troppo grande.");
    let raw: unknown;
    try { raw = await readSmallJson(request, signal); }
    catch (error) { return error instanceof RangeError ? failure(413, "SIZE", "Richiesta troppo grande.") : signal.aborted ? failure(504, "DEADLINE", "Tempo scaduto.") : failure(400, "INPUT", "Richiesta non valida."); }
    const parsed = agentRequestSchema.safeParse(raw);
    if (!parsed.success) return failure(400, "INPUT", "Richiesta non valida.");
    const input = parsed.data;
    audit.requestId = input.requestId;
    const cookie = readCookie(request);
    if ((request.headers.get("cookie") ?? "").split(";").some((part) => part.trim().startsWith("__Host-paghi-agent=")) && !cookie) return failure(409, "CONFLICT", "Sessione non disponibile.", input.requestId);
    if (input.action === "reset" && !cookie) return failure(409, "CONFLICT", "Sessione non disponibile.", input.requestId);
    if (input.action === "ask" && input.conversationId && !cookie) return failure(409, "CONFLICT", "Sessione non disponibile.", input.requestId);
    const ip = request.headers.get("x-vercel-forwarded-for");
    if (!ip || ip.includes(",") || !isIP(ip)) return failure(503, "UNAVAILABLE", "Assistente non disponibile.", input.requestId);
    const currentCookie = cookie ?? randomBytes(32).toString("base64url");
    let admission: Admission | undefined; let policy: PreviewPolicy | undefined; let uncertain = false; let blocked: PolicyDenied | undefined; let completed = false; let finalizationUncertain = false;
    try {
      const token = await deps.getToken(config, signal);
      if (signal.aborted) throw new AuthUnavailable();
      const state = deps.state(config, token, signal); policy = new PreviewPolicy(state, config.ipHashSecret);
      if (input.action === "reset") {
        await policy.reset(currentCookie, input.conversationId, deps.now?.() ?? Date.now(), signal);
        return new Response(JSON.stringify({ reset: true }), { status: 200, headers });
      }
      admission = await policy.admit({ cookie: currentCookie, ip, requestId: input.requestId, question: input.question, conversationId: input.conversationId, now: deps.now?.() ?? Date.now(), signal });
      const index = await deps.index();
      let attempts = 0;
      const transport: RuntimeTransport = async (dispatch, dispatchSignal) => {
        if (uncertain || blocked || signal.aborted || dispatchSignal.aborted || attempts >= 3 || deadline.aborted || Date.now() - startedAt > 43000) throw new DOMException("aborted", "AbortError");
        const path = `/v1/projects/${encodeURIComponent(config.projectId)}/locations/eu/collections/default_collection/engines/${encodeURIComponent(config.engineId)}/servingConfigs/default_search:`;
        if (dispatch.url !== `https://eu-discoveryengine.googleapis.com${path}${dispatch.kind}`) throw new StateUnavailable();
        try { await policy!.authorizeDispatch(admission!, deps.now?.() ?? Date.now(), signal); }
        catch (error) { if (error instanceof StateUnavailable) uncertain = true; if (error instanceof PolicyDenied) blocked = error; throw error; }
        attempts++; audit.attempts++;
        if (signal.aborted) { uncertain = true; throw new DOMException("aborted", "AbortError"); }
        try {
          const response = await (deps.fetch ?? fetch)(dispatch.url, { method: "POST", headers: { authorization: `Bearer ${token}`, "content-type": "application/json" }, body: JSON.stringify(dispatch.body), redirect: "manual", signal });
          if (!response.ok) return { status: response.status, ok: false, json: {} };
          const json: unknown = await response.json();
          return { status: response.status, ok: response.ok, json };
        } catch { uncertain = true; throw new DOMException("backend result unknown", "AbortError"); }
      };
      const runtime = createAgentRuntime({ index, transport, signal, config: { projectId: config.projectId, engineId: config.engineId, dataStoreId: config.dataStoreId, location: "eu" } });
      const result = await runtime.reply(input.question, admission.previous);
      if (uncertain) throw new StateUnavailable();
      if (blocked) throw blocked;
      const context = result.shown.astensione ? undefined : result.context;
      try { await policy.finalize(admission, context, false, deps.now?.() ?? Date.now(), signal); completed = true; }
      catch (error) { if (error instanceof CommitUncertain) finalizationUncertain = true; throw error; }
      const sources = result.shown.citazioni.flatMap((citation) => {
        const doc = index.get(citation.id); if (!doc || !doc.structData.fonte_url.includes(citation.url)) return [];
        return [{ id: citation.id, title: doc.structData.titolo, url: citation.url, pageUrl: doc.structData.url_pagina, verification: doc.structData.livello_verifica }];
      });
      const body: AgentAskResponse = { requestId: input.requestId, conversationId: admission.conversationId, text: result.shown.testo, abstention: result.shown.astensione, mode: result.mode, ...(result.notice ? { notice: result.notice } : {}), sources };
      const responseHeaders = new Headers(headers);
      if (!cookie) responseHeaders.set("set-cookie", `__Host-paghi-agent=${currentCookie}; HttpOnly; Secure; SameSite=Strict; Path=/; Max-Age=1800`);
      return new Response(JSON.stringify(body), { status: 200, headers: responseHeaders });
    } catch (error) {
      if (error instanceof CommitUncertain || signal.aborted) uncertain = true;
      return statusFor(error, signal, input.requestId);
    } finally {
      if (admission && policy && !completed && !finalizationUncertain) {
        try { await policy.finalize(admission, undefined, uncertain, deps.now?.() ?? Date.now(), AbortSignal.timeout(3000)); } catch { /* lease expires without replay */ }
      }
    }
  };
  return async (request) => {
    const started = Date.now(); const audit: { requestId?: string; attempts: number } = { attempts: 0 };
    let status = 503;
    try { const response = await handle(request, audit); status = response.status; return response; }
    catch { return failure(503, "UNAVAILABLE", "Assistente non disponibile.", audit.requestId); }
    finally {
      try { deps.log?.({ requestId: audit.requestId, status, durationMs: Date.now() - started, attempts: audit.attempts, release: process.env.VERCEL_GIT_COMMIT_SHA?.slice(0, 12) ?? "unknown" }); } catch { /* observability cannot change response */ }
    }
  };
}
