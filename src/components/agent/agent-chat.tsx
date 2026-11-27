"use client";

import { useRef, useState, type FormEvent } from "react";
import { ArrowCounterClockwiseIcon, ArrowSquareOutIcon, ClockCountdownIcon, HandPalmIcon, PaperPlaneRightIcon, ReceiptIcon, WarningCircleIcon } from "@phosphor-icons/react";
import type { AgentAskResponse, AgentSource } from "@/lib/agent-contract";
import { LevelTag } from "@/components/verification-badge";
import { VerificationLevel } from "@/lib/domain/schemas";

type Turn = { id: string; question: string; answer: AgentAskResponse };
type ChatError = { message: string; timeout: boolean };

const MAX_LENGTH = 300;
// Domande del golden set con risposta attesa (agent/evals/domande.jsonl).
const STARTERS = [
  "A quanto ammontava il debito pubblico italiano a fine agosto 2026?",
  "Quanto valeva il debito pubblico in rapporto al PIL nel 2025?",
  "Com'è il debito pubblico italiano in % del PIL rispetto alla media dell'Unione europea nel 2025?",
];

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
    <ul aria-label="Fonti" className="mt-4 grid gap-3 border-t border-rule pt-3 text-sm">
      {sources.map((source) => {
        const href = safeSourceUrl(source.url);
        const pageHref = safeSourceUrl(source.pageUrl);
        const level = VerificationLevel.safeParse(source.verification);
        return (
          <li key={`${source.id}-${source.url}`} className="grid grid-cols-[auto_1fr] items-baseline gap-x-3 gap-y-1">
            {level.success ? <LevelTag level={level.data} /> : <span />}
            <span className="font-bold text-ink">{source.title}</span>
            <span className="col-start-2 flex flex-wrap gap-x-4">
              {href ? <a className="inline-flex min-h-8 items-center gap-1 font-semibold text-accent underline underline-offset-2" href={href} target="_blank" rel="noopener noreferrer">Fonte <ArrowSquareOutIcon aria-hidden weight="bold" /></a> : null}
              {pageHref ? <a className="inline-flex min-h-8 items-center font-semibold text-accent underline underline-offset-2" href={pageHref} target="_blank" rel="noopener noreferrer">Pagina Paghi Tu</a> : null}
            </span>
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
  const [error, setError] = useState<ChatError | null>(null);
  const generation = useRef(0);
  const field = useRef<HTMLTextAreaElement>(null);

  async function ask(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const trimmed = question.trim();
    if (!trimmed || trimmed.length > MAX_LENGTH || busy || resetting) return;
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
      setError(controller.signal.aborted
        ? { message: "Tempo scaduto. L’esito della richiesta è incerto: attendi prima di fare un’altra domanda.", timeout: true }
        : { message: cause instanceof Error ? cause.message : "Richiesta non disponibile.", timeout: false });
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
      setError({ message: "Non è stato possibile azzerare il contesto. Ricarica la pagina prima di continuare.", timeout: false });
    } finally {
      clearTimeout(timeout);
      setBusy(false);
      setResetting(false);
    }
  }

  function pickStarter(text: string) {
    setQuestion(text);
    field.current?.focus();
  }

  const near = question.length >= MAX_LENGTH - 40;

  return (
    <div className="mt-6 pb-32 lg:pb-0">
      <section aria-label="Conversazione con Paghi Tu Agent" aria-live="polite" className="flex flex-col gap-5">
        {turns.length === 0 && !busy ? (
          <div className="rounded-card border border-rule bg-paper-raised p-5">
            <h2 className="text-[1.4rem]">Da dove partiamo?</h2>
            <p className="mt-1 text-ink-soft">Scrivi una domanda sui dati di Paghi Tu, oppure parti da una di queste.</p>
            <div className="mt-3 flex flex-wrap gap-2">
              {STARTERS.map((text) => (
                <button key={text} type="button" onClick={() => pickStarter(text)} disabled={resetting} className="min-h-11 rounded-ctl border border-rule bg-paper px-3 py-2 text-left text-[15px] font-semibold hover:border-accent focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent disabled:opacity-50">{text}</button>
              ))}
            </div>
          </div>
        ) : null}
        {turns.map((turn) => (
          <article key={turn.id} className="flex flex-col gap-3">
            <h2 className="max-w-[min(86%,35rem)] self-end rounded-card rounded-br-ctl bg-ink px-4 py-2.5 font-sans text-[17px] leading-snug font-semibold tracking-normal text-paper">{turn.question}</h2>
            <div className={`rounded-card border p-4 ${turn.answer.abstention ? "border-dashed border-rule" : "border-rule bg-paper-raised"}`}>
              <p className="mb-2 flex items-center gap-2 text-[13px] font-bold text-ink-faint">
                {turn.answer.abstention
                  ? <><HandPalmIcon aria-hidden weight="bold" className="text-lg text-accent" />Paghi Tu Agent si è astenuto</>
                  : <><ReceiptIcon aria-hidden weight="fill" className="text-lg text-accent" />Risposta dai dati</>}
              </p>
              <p className="whitespace-pre-wrap text-ink">{turn.answer.text}</p>
              {turn.answer.notice ? <p className="mt-2 text-sm text-ink-faint">{turn.answer.notice}</p> : null}
              <SourceLinks sources={turn.answer.sources} />
            </div>
          </article>
        ))}
        {busy ? (
          <p role="status" className="flex items-center gap-3 font-semibold text-ink-soft">
            <span aria-hidden className="agent-dots inline-flex gap-1"><span /><span /><span /></span>
            Sto cercando nei dati e verificando le fonti…
          </p>
        ) : null}
        {error ? (
          <p role="alert" className="flex items-start gap-3 rounded-card bg-night px-4 py-3 text-[15px] text-night-ink">
            {error.timeout ? <ClockCountdownIcon aria-hidden weight="bold" className="mt-0.5 shrink-0 text-xl" /> : <WarningCircleIcon aria-hidden weight="bold" className="mt-0.5 shrink-0 text-xl" />}
            <span>{error.message}</span>
          </p>
        ) : null}
      </section>

      <form onSubmit={ask} className="fixed inset-x-0 bottom-[calc(var(--dock-h)+env(safe-area-inset-bottom))] z-10 border-t border-rule bg-paper/95 px-4 py-2.5 backdrop-blur lg:sticky lg:bottom-0 lg:mt-6 lg:border-0 lg:bg-paper lg:px-0 lg:pt-4 lg:pb-5 lg:backdrop-blur-none">
        <div className="rounded-card border-[1.5px] border-rule bg-paper-raised px-3 pt-2 pb-1.5 shadow-card focus-within:border-accent">
          <label htmlFor="agent-question" className="sr-only lg:not-sr-only lg:block lg:text-[13px] lg:font-bold lg:text-ink-soft">La tua domanda</label>
          <textarea
            id="agent-question"
            ref={field}
            value={question}
            onChange={(event) => setQuestion(event.target.value)}
            maxLength={MAX_LENGTH}
            rows={2}
            disabled={busy || resetting}
            className="block max-h-40 w-full resize-none bg-transparent py-1 text-ink [field-sizing:content] placeholder:text-ink-faint focus:outline-none"
            placeholder="Per esempio: quanto è cambiato il debito pubblico?"
          />
          <div className="mt-1 flex items-center justify-between gap-3">
            <span className={`tabular text-[13px] ${near ? "font-bold text-level-v2" : "text-ink-faint"}`}>{question.length}/{MAX_LENGTH}</span>
            <div className="flex gap-2">
              <button type="button" onClick={reset} disabled={!conversationId || resetting} aria-label="Azzera contesto" className="inline-flex min-h-12 min-w-12 items-center justify-center gap-2 rounded-ctl border-[1.5px] border-rule px-3 font-bold focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent disabled:opacity-45 sm:px-4">
                <ArrowCounterClockwiseIcon aria-hidden weight="bold" /><span className="hidden sm:inline">Azzera contesto</span>
              </button>
              <button type="submit" disabled={busy || resetting || !question.trim()} className="inline-flex min-h-12 items-center gap-2 rounded-ctl bg-accent px-5 font-bold text-accent-ink focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent disabled:opacity-45">
                <PaperPlaneRightIcon aria-hidden weight="bold" />Invia
              </button>
            </div>
          </div>
        </div>
      </form>
    </div>
  );
}
