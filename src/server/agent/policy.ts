import "server-only";
import { createHmac, randomBytes, randomUUID } from "node:crypto";
import type { ConversationContext } from "../../../agent/runtime/index.ts";
import { FirestoreStateStore, CommitUncertain, StateUnavailable, TransactionRejected } from "./state.ts";

export const POLICY_LIMITS = { daily: 50, monthlyAttempts: 1000, perRequestAttempts: 3, leaseMs: 45000, ipIntervalMs: 8000, ipHourly: 10, sessionMs: 1800000, ledgerMs: 86400000, conversations: 20 } as const;
export class PolicyDenied extends TransactionRejected {
  readonly code: "disabled" | "busy" | "duplicate" | "rate" | "cap" | "session" | "uncertain";
  constructor(code: PolicyDenied["code"]) { super(code); this.code = code; }
}
export type Context = ConversationContext;
type Conversation = { version: number; expiresAt: number; context?: Context; inflight?: string };
type Session = { expiresAt: number; conversations: Record<string, Conversation> };
type Global = { day: string; dayCount: number; month: string; monthCount: number; lease?: { owner: string; until: number }; halted?: boolean };
type Ip = { hour: string; count: number; last: number; expiresAt: number };
type Ledger = { fingerprint: string; owner: string; version: number; sessionKey: string; conversationId: string; attempts: number; attemptIds?: string[]; status: "open" | "done"; expiresAt: number };
const object = (v: unknown): v is Record<string, unknown> => !!v && typeof v === "object" && !Array.isArray(v);
const validContext = (v: unknown): v is Context => object(v) && typeof v.question === "string" && v.question.length <= 300 && Array.isArray(v.ids) && v.ids.length <= 20 && v.ids.every((x) => typeof x === "string") && Array.isArray(v.fingerprints) && v.fingerprints.length === v.ids.length && v.fingerprints.every((x) => typeof x === "string" && /^[a-f0-9]{64}$/.test(x)) && object(v.fallback) && typeof v.fallback.testo === "string" && typeof v.fallback.astensione === "boolean" && Array.isArray(v.fallback.citazioni);
const validGlobal = (v: unknown): v is Global => object(v) && typeof v.day === "string" && typeof v.dayCount === "number" && Number.isInteger(v.dayCount) && typeof v.month === "string" && typeof v.monthCount === "number" && Number.isInteger(v.monthCount) && v.dayCount >= 0 && v.monthCount >= 0 && (v.lease === undefined || (object(v.lease) && typeof v.lease.owner === "string" && typeof v.lease.until === "number"));
const validSession = (v: unknown): v is Session => object(v) && typeof v.expiresAt === "number" && object(v.conversations) && Object.values(v.conversations).every((c) => object(c) && Number.isInteger(c.version) && typeof c.expiresAt === "number" && (c.inflight === undefined || typeof c.inflight === "string") && (c.context === undefined || validContext(c.context)));
const validIp = (v: unknown): v is Ip => object(v) && typeof v.hour === "string" && Number.isInteger(v.count) && typeof v.last === "number" && typeof v.expiresAt === "number";
const validLedger = (v: unknown): v is Ledger => object(v) && typeof v.fingerprint === "string" && typeof v.owner === "string" && Number.isInteger(v.version) && typeof v.sessionKey === "string" && typeof v.conversationId === "string" && Number.isInteger(v.attempts) && (v.attemptIds === undefined || (Array.isArray(v.attemptIds) && v.attemptIds.every((x) => typeof x === "string"))) && (v.status === "open" || v.status === "done") && typeof v.expiresAt === "number";

export type Admission = { owner: string; ledgerKey: string; sessionKey: string; conversationId: string; version: number; previous?: Context };
export class PreviewPolicy {
  private readonly state: FirestoreStateStore;
  private readonly secret: string;
  private readonly indexHash: string;
  constructor(state: FirestoreStateStore, secret: string, indexHash: string) { if (Buffer.byteLength(secret) < 32) throw new StateUnavailable(); this.state = state; this.secret = secret; if (!/^[a-f0-9]{64}$/.test(indexHash)) throw new StateUnavailable(); this.indexHash = indexHash; }
  hash(text: string): string { return createHmac("sha256", this.secret).update(text).digest("base64url"); }
  private control(v: unknown): void { if (!object(v) || v.enabled !== true || v.sync !== undefined || v.indexSha256 !== this.indexHash) throw new PolicyDenied("disabled"); }
  async admit(input: { cookie: string; ip: string; requestId: string; question: string; conversationId?: string; now?: number; signal?: AbortSignal }): Promise<Admission> {
    const now = input.now ?? Date.now(); const date = new Date(now); const day = date.toISOString().slice(0, 10); const month = day.slice(0, 7); const hour = date.toISOString().slice(0, 13);
    const sessionKey = `session/${this.hash(input.cookie)}`; const ipKey = `ip/${this.hash(`${day}:${input.ip}`)}`;
    const digest = createHmac("sha256", this.secret).update(`${sessionKey}:${input.requestId}`).digest("hex");
    const stableLedgerKey = `ledger/${digest.slice(0, 8)}-${digest.slice(8, 12)}-4${digest.slice(13, 16)}-a${digest.slice(17, 20)}-${digest.slice(20, 32)}`;
    const owner = randomBytes(32).toString("base64url"); const fingerprint = this.hash(`${input.question}\n${input.conversationId ?? "new"}`);
    return this.state.transact(["control", "global", ipKey, stableLedgerKey, sessionKey], (docs) => {
      this.control(docs.get("control"));
      const priorLedger = docs.get(stableLedgerKey); if (priorLedger !== null) { if (!validLedger(priorLedger)) throw new StateUnavailable(); throw new PolicyDenied("duplicate"); }
      const rawGlobal = docs.get("global"); if (rawGlobal !== null && !validGlobal(rawGlobal)) throw new StateUnavailable();
      const global: Global = rawGlobal ? { ...rawGlobal } : { day, dayCount: 0, month, monthCount: 0 };
      if (global.day !== day) { global.day = day; global.dayCount = 0; }
      if (global.month !== month) { global.month = month; global.monthCount = 0; }
      if (global.halted || global.lease && global.lease.until > now) throw new PolicyDenied("busy");
      if (global.dayCount >= POLICY_LIMITS.daily || global.monthCount >= POLICY_LIMITS.monthlyAttempts) throw new PolicyDenied("cap");
      const rawIp = docs.get(ipKey); if (rawIp !== null && !validIp(rawIp)) throw new StateUnavailable();
      const ip: Ip = rawIp && rawIp.hour === hour ? { ...rawIp } : { hour, count: 0, last: 0, expiresAt: now + POLICY_LIMITS.ledgerMs };
      if (now - ip.last < POLICY_LIMITS.ipIntervalMs || ip.count >= POLICY_LIMITS.ipHourly) throw new PolicyDenied("rate");
      const rawSession = docs.get(sessionKey); if (rawSession !== null && !validSession(rawSession)) throw new StateUnavailable();
      const session: Session = rawSession && rawSession.expiresAt > now ? structuredClone(rawSession) : { expiresAt: now + POLICY_LIMITS.sessionMs, conversations: {} };
      const conversationId = input.conversationId ?? randomBytes(32).toString("base64url");
      const current = session.conversations[conversationId];
      if (input.conversationId && (!current || current.expiresAt <= now)) throw new PolicyDenied("session");
      if (!current && Object.keys(session.conversations).filter((key) => session.conversations[key].expiresAt > now).length >= POLICY_LIMITS.conversations) throw new PolicyDenied("cap");
      if (current?.inflight) throw new PolicyDenied("busy");
      const version = current?.version ?? 0;
      const previous = current?.context;
      session.conversations[conversationId] = { version, expiresAt: now + POLICY_LIMITS.sessionMs, inflight: owner, ...(previous ? { context: previous } : {}) };
      session.expiresAt = now + POLICY_LIMITS.sessionMs;
      global.dayCount++; global.lease = { owner, until: now + POLICY_LIMITS.leaseMs };
      ip.count++; ip.last = now;
      const ledger: Ledger = { fingerprint, owner, version, sessionKey, conversationId, attempts: 0, status: "open", expiresAt: now + POLICY_LIMITS.ledgerMs };
      return { writes: { global, [ipKey]: ip, [stableLedgerKey]: ledger, [sessionKey]: session }, value: { owner, ledgerKey: stableLedgerKey, sessionKey, conversationId, version, previous } };
    }, input.signal);
  }
  async authorizeDispatch(admission: Admission, now = Date.now(), signal?: AbortSignal): Promise<string> {
    const attemptId = randomUUID();
    return this.state.transact(["control", "global", admission.ledgerKey, admission.sessionKey], (docs) => {
      this.control(docs.get("control"));
      const global = docs.get("global"); const ledger = docs.get(admission.ledgerKey); const session = docs.get(admission.sessionKey);
      if (!validGlobal(global) || !validLedger(ledger) || !validSession(session)) throw new StateUnavailable();
      const conversation = session.conversations[admission.conversationId];
      if (global.lease?.owner !== admission.owner || global.lease.until <= now || ledger.owner !== admission.owner || ledger.status !== "open" || conversation?.version !== admission.version || conversation.inflight !== admission.owner || session.expiresAt <= now) throw new PolicyDenied("busy");
      if (ledger.attempts >= POLICY_LIMITS.perRequestAttempts || global.monthCount >= POLICY_LIMITS.monthlyAttempts) throw new PolicyDenied("cap");
      const updatedGlobal = { ...global, monthCount: global.monthCount + 1, halted: true };
      const updatedLedger = { ...ledger, attempts: ledger.attempts + 1, attemptIds: [...(ledger.attemptIds ?? []), attemptId] };
      return { writes: { global: updatedGlobal, [admission.ledgerKey]: updatedLedger }, value: attemptId };
    }, signal);
  }
  async finalize(admission: Admission, context: Context | undefined, uncertain: boolean, now = Date.now(), signal?: AbortSignal): Promise<void> {
    await this.state.transact(["global", admission.ledgerKey, admission.sessionKey], (docs) => {
      const global = docs.get("global"); const ledger = docs.get(admission.ledgerKey); const session = docs.get(admission.sessionKey);
      if (!validGlobal(global) || !validLedger(ledger) || !validSession(session)) throw new StateUnavailable();
      const writes: Record<string, unknown> = { [admission.ledgerKey]: { ...ledger, status: "done" } };
      if (global.lease?.owner === admission.owner) writes.global = uncertain ? { ...global, halted: true } : { ...global, halted: false, lease: undefined };
      const current = session.conversations[admission.conversationId];
      if (current?.version === admission.version && current.inflight === admission.owner) {
        const updated = structuredClone(session); const item = updated.conversations[admission.conversationId]; delete item.inflight; delete item.context;
        if (context && item.expiresAt > now && Buffer.byteLength(JSON.stringify(context)) <= 32768) item.context = context;
        writes[admission.sessionKey] = updated;
      }
      return { writes, value: undefined };
    }, signal);
  }
  async reset(cookie: string, conversationId: string, now = Date.now(), signal?: AbortSignal): Promise<void> {
    const sessionKey = `session/${this.hash(cookie)}`;
    await this.state.transact(["control", sessionKey], (docs) => {
      this.control(docs.get("control")); const session = docs.get(sessionKey);
      if (!validSession(session) || session.expiresAt <= now || !session.conversations[conversationId] || session.conversations[conversationId].expiresAt <= now) throw new PolicyDenied("session");
      const updated = structuredClone(session); const item = updated.conversations[conversationId]; item.version++; delete item.context; delete item.inflight;
      return { writes: { [sessionKey]: updated }, value: undefined };
    }, signal);
  }
}
export { CommitUncertain, StateUnavailable };
