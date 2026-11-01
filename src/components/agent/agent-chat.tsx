"use client";

import { useRef, useState, type FormEvent } from "react";
import type { AgentAskResponse, AgentSource } from "@/lib/agent-contract";

type Turn = { id: string; question: string; answer: AgentAskResponse };

function safeSourceUrl(value: string): string | null {
  try {
    const url = new URL(value);
    return url.protocol === "https:" || url.protocol === "http:" ? url.href : null;
  } catch {
    return null;
  }
}

function SourceLinks({ sources }: { sources: AgentSource[] }) {
  if (sources.length === 0) return null;
  return (
    <ul className="mt-3 space-y-1 text-sm">
      {sources.map((source) => {
        const href = safeSourceUrl(source.url);
        const pageHref = safeSourceUrl(source.pageUrl);
        return (
          <li key={`${source.id}-${source.url}`}>
            <span className="font-semibold">{source.title}</span>{source.verification ? ` · ${source.verification}` : ""}
            {href ? <> · <a className="text-accent underline underline-offset-2" href={href} target="_blank" rel="noopener noreferrer">Fonte</a></> : null}
            {pageHref ? <> · <a className="text-accent underline underline-offset-2" href={pageHref} target="_blank" rel="noopener noreferrer">Pagina Paghi Tu</a></> : null}
          </li>
        );
      })}
    </ul>
  );
}

async function postAgent(body: object, signal: AbortSignal): Promise<unknown> {
  const response = await fetch("/api/agent", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    credentials: "same-origin",
    cache: "no-store",
    body: JSON.stringify(body),
    signal,
  });
  let value: unknown;
  try { value = await response.json(); } catch { throw new Error("Richiesta non disponibile. Riprova più tardi."); }
  if (!response.ok) {
    if (response.status === 409) throw new Error("Una richiesta è ancora in corso. Attendi prima di continuare.");
    if (response.status === 429) throw new Error("Limite temporaneo raggiunto. Riprova più tardi.");
    throw new Error("Richiesta non disponibile. Riprova più tardi.");
  }
  return value;
}

export function AgentChat() {
  const [question, setQuestion] = useState("");
  const [turns, setTurns] = useState<Turn[]>([]);
  const [conversationId, setConversationId] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [resetting, setResetting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const generation = useRef(0);

  async function ask(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const trimmed = question.trim();
    if (!trimmed || trimmed.length > 300 || busy || resetting) return;
    const thisGeneration = generation.current;
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 55_000);
    setBusy(true);
    setError(null);
    try {
      const result = await postAgent({ action: "ask", requestId: crypto.randomUUID(), question: trimmed, ...(conversationId ? { conversationId } : {}) }, controller.signal) as AgentAskResponse;
      if (thisGeneration !== generation.current) return;
      setTurns((previous) => [...previous, { id: result.requestId, question: trimmed, answer: result }]);
      setConversationId(result.conversationId);
      setQuestion("");
    } catch (cause) {
      if (thisGeneration !== generation.current) return;
      setError(controller.signal.aborted ? "Tempo scaduto. L’esito della richiesta è incerto: attendi prima di fare un’altra domanda." : cause instanceof Error ? cause.message : "Richiesta non disponibile.");
    } finally {
      clearTimeout(timeout);
      if (thisGeneration === generation.current) setBusy(false);
    }
  }

  async function reset() {
    if (!conversationId || resetting) return;
    generation.current += 1;
    setResetting(true);
    setError(null);
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 55_000);
    try {
      await postAgent({ action: "reset", requestId: crypto.randomUUID(), conversationId }, controller.signal);
      setTurns([]);
      setConversationId(null);
      setQuestion("");
      setBusy(false);
    } catch {
      setError("Non è stato possibile azzerare il contesto. Ricarica la pagina prima di continuare.");
    } finally {
      clearTimeout(timeout);
      setBusy(false);
      setResetting(false);
    }
  }

  return (
    <section aria-label="Conversazione con l’assistente" className="mt-8 max-w-3xl rounded-card bg-paper-raised p-4 md:p-6">
      <p className="text-sm font-semibold text-ink-soft">Risposte generate da AI, da controllare sulle fonti indicate.</p>
      <div aria-live="polite" className="mt-5 space-y-5">
        {turns.length === 0 ? <p className="text-ink-soft">Scrivi una domanda sui dati di Paghi Tu.</p> : null}
        {turns.map((turn) => (
          <article key={turn.id} className="border-t border-rule pt-4">
            <h2 className="font-bold">{turn.question}</h2>
            <p className="mt-2 whitespace-pre-wrap text-ink">{turn.answer.text}</p>
            {turn.answer.abstention ? <p className="mt-2 text-sm font-semibold text-ink-soft">L’assistente si è astenuto.</p> : null}
            {turn.answer.notice ? <p className="mt-2 text-sm text-ink-soft">{turn.answer.notice}</p> : null}
            <SourceLinks sources={turn.answer.sources} />
          </article>
        ))}
        {busy ? <p role="status" className="text-ink-soft">Sto cercando nei dati e verificando le fonti…</p> : null}
        {error ? <p role="alert" className="text-sm text-ink-soft">{error}</p> : null}
      </div>
      <form onSubmit={ask} className="mt-6 space-y-3">
        <label htmlFor="agent-question" className="block font-semibold">La tua domanda</label>
        <textarea id="agent-question" value={question} onChange={(event) => setQuestion(event.target.value)} maxLength={300} rows={3} disabled={busy || resetting} className="w-full rounded-ctl border border-rule bg-paper px-3 py-2 text-ink focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent" placeholder="Per esempio: quanto è cambiato il debito pubblico?" />
        <div className="flex flex-wrap gap-3">
          <button type="submit" disabled={busy || resetting || !question.trim()} className="min-h-12 rounded-ctl bg-accent px-5 font-bold text-accent-ink focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent disabled:opacity-50">Invia domanda</button>
          <button type="button" onClick={reset} disabled={!conversationId || resetting} className="min-h-12 rounded-ctl border border-rule px-5 font-bold focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent disabled:opacity-50">Azzera contesto</button>
        </div>
      </form>
    </section>
  );
}
