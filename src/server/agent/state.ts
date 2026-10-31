import "server-only";

export class StateUnavailable extends Error { constructor() { super("state unavailable"); } }
export class CommitUncertain extends StateUnavailable {}
export class TransactionRejected extends Error {}
type TxResult<T> = { writes: Record<string, unknown>; value: T };
type StateOptions = { projectId: string; databaseId: string; namespace: string; accessToken: () => Promise<string>; fetch?: typeof fetch; signal?: AbortSignal };
type FirestoreDocument = { name?: string; fields?: { payload?: { stringValue?: string }; expiresAt?: { timestampValue?: string } } };

export class FirestoreStateStore {
  private readonly options: StateOptions;
  private readonly root: string;
  private readonly collection: string;
  private readonly fetcher: typeof fetch;
  constructor(options: StateOptions) {
    this.options = options;
    if (!/^[a-z][a-z0-9-]{3,62}$/.test(options.projectId) || !/^[a-z][a-z0-9-]{3,62}$/.test(options.databaseId) || !/^(?:preview|stress-[a-z0-9-]{8,50})$/.test(options.namespace)) throw new StateUnavailable();
    this.root = `projects/${options.projectId}/databases/${options.databaseId}/documents`;
    this.collection = `agent_${options.namespace.replaceAll("-", "_")}`;
    this.fetcher = options.fetch ?? fetch;
  }
  private name(key: string): string {
    if (!/^(control|global|ip\/[a-zA-Z0-9_-]{20,100}|ledger\/[a-f0-9-]{36}|session\/[a-zA-Z0-9_-]{20,100})$/.test(key)) throw new StateUnavailable();
    return `${this.root}/${this.collection}/${Buffer.from(key).toString("base64url")}`;
  }
  private async post(path: string, body: unknown, signal?: AbortSignal): Promise<{ status: number; text: string }> {
    const activeSignal = signal ?? this.options.signal;
    const token = await this.options.accessToken();
    if (!token || activeSignal?.aborted) throw new StateUnavailable();
    const response = await this.fetcher(`https://firestore.googleapis.com/v1/${this.root}:${path}`, { method: "POST", redirect: "error", headers: { authorization: `Bearer ${token}`, "content-type": "application/json" }, body: JSON.stringify(body), signal: activeSignal });
    return { status: response.status, text: await response.text() };
  }
  private async rollback(tx: string): Promise<void> {
    const signal = AbortSignal.timeout(1500);
    await Promise.race([
      this.post("rollback", { transaction: tx }, signal),
      new Promise<never>((_, reject) => signal.addEventListener("abort", () => reject(new StateUnavailable()), { once: true })),
    ]);
  }
  private decode(row: unknown): { found?: FirestoreDocument; missing?: string; transaction?: string } {
    if (!row || typeof row !== "object" || Array.isArray(row)) throw new StateUnavailable();
    const item = row as { found?: FirestoreDocument; missing?: string; transaction?: string };
    if (Boolean(item.found) === Boolean(item.missing)) throw new StateUnavailable();
    return item;
  }
  async transact<T>(keys: string[], fn: (docs: Map<string, unknown | null>) => TxResult<T>, signal?: AbortSignal): Promise<T> {
    const names = keys.map((key) => this.name(key));
    if (new Set(names).size !== names.length) throw new StateUnavailable();
    for (let retry = 0; retry < 3; retry++) {
      let tx: string | undefined;
      let commitAttempted = false;
      try {
        const began = await this.post("beginTransaction", { options: { readWrite: {} } }, signal);
        if (began.status !== 200) throw new StateUnavailable();
        const parsed: unknown = JSON.parse(began.text);
        if (!parsed || typeof parsed !== "object" || !("transaction" in parsed) || typeof parsed.transaction !== "string") throw new StateUnavailable();
        tx = parsed.transaction;
        const got = await this.post("batchGet", { documents: names, transaction: tx }, signal);
        if (got.status !== 200) throw new StateUnavailable();
        const docs = new Map<string, unknown | null>();
        for (const key of keys) docs.set(key, null);
        const rows: unknown = JSON.parse(got.text);
        if (!Array.isArray(rows)) throw new StateUnavailable();
        const seen = new Set<string>();
        for (const raw of rows) {
          const row = this.decode(raw);
          if (row.transaction !== undefined && row.transaction !== tx) throw new StateUnavailable();
          const name = row.found?.name ?? row.missing;
          const index = names.indexOf(name ?? "");
          if (index < 0 || !name || seen.has(name)) throw new StateUnavailable();
          seen.add(name);
          if (row.found) {
            const payload = row.found.fields?.payload?.stringValue;
            if (typeof payload !== "string" || Buffer.byteLength(payload) > 32768) throw new StateUnavailable();
            docs.set(keys[index], JSON.parse(payload));
          }
        }
        if (seen.size !== names.length) throw new StateUnavailable();
        const result = fn(docs);
        const writes = Object.entries(result.writes).map(([key, value]) => {
          if (!docs.has(key)) throw new StateUnavailable();
          const payload = JSON.stringify(value);
          if (Buffer.byteLength(payload) > 32768) throw new StateUnavailable();
          const expiresAt = value && typeof value === "object" && "expiresAt" in value && typeof value.expiresAt === "number" ? new Date(value.expiresAt).toISOString() : undefined;
          return { update: { name: this.name(key), fields: { payload: { stringValue: payload }, ...(expiresAt ? { expiresAt: { timestampValue: expiresAt } } : {}) } } };
        });
        let committed: { status: number; text: string };
        commitAttempted = true;
        try { committed = await this.post("commit", { transaction: tx, writes }, signal); }
        catch { throw new CommitUncertain(); }
        if (committed.status === 409 && /ABORTED/.test(committed.text) && retry < 2 && !signal?.aborted) continue;
        if (committed.status !== 200) throw new CommitUncertain();
        return result.value;
      } catch (error) {
        if (tx && !commitAttempted) {
          try { await this.rollback(tx); } catch { /* original denial/error takes precedence */ }
        }
        if (error instanceof CommitUncertain) throw error;
        if (error instanceof StateUnavailable || error instanceof TransactionRejected) throw error;
        throw new StateUnavailable();
      }
    }
    throw new StateUnavailable();
  }
}
