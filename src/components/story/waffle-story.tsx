"use client";

import { useEffect, useRef, useState } from "react";
import { CaretDownIcon } from "@phosphor-icons/react";

export type WaffleStep =
  | { kind: "squares"; id: string; amount: string; unit: string; title: string; text: React.ReactNode; from: number; count: number; all?: boolean }
  | { kind: "receipt"; id: string; amount: string; unit: string; title: string; text: React.ReactNode };

export type ReceiptLine = { id: string; label: string; value: string; strong?: boolean };

const CELLS = Array.from({ length: 100 }, (_, i) => i);
const RAIL_VH = 62;
// Spazio di scroll in cui si accendono i quadretti del passo e si stampa lo scontrino.
const FILL_VH = 30;
const PRINT_VH = 30;

const timeline = (i: number) => `--step-${i}`;
// Il passo i è attivo da quando il suo binario tocca il centro dello schermo: lì parte il suo avanzamento.
const range = (from: number, to: number) => `cover calc(50vh + ${from}vh) cover calc(50vh + ${to}vh)`;

/**
 * Racconto a passi: un pannello fisso alto quanto lo schermo tiene insieme quadretti e testo, e lo
 * scroll sui binari sotto il pannello sceglie il passo. Dove il browser ha le timeline di scroll,
 * quadretti, avanzamento e scontrino seguono il dito invece di cambiare a scatti.
 */
export function WaffleStory({ steps, receipt, receiptTitle }: { steps: WaffleStep[]; receipt: ReceiptLine[]; receiptTitle: string }) {
  const [active, setActive] = useState(0);
  const rails = useRef<HTMLDivElement>(null);
  const step = steps[active];
  const last = steps.length - 1;

  useEffect(() => {
    const el = rails.current;
    if (!el) return;
    const io = new IntersectionObserver(
      (entries) => {
        for (const e of entries) if (e.isIntersecting) setActive(Number((e.target as HTMLElement).dataset.step));
      },
      { rootMargin: "-50% 0px -50% 0px" },
    );
    for (const r of el.children) io.observe(r);
    return () => io.disconnect();
  }, []);

  const groupOf = (i: number) => steps.findIndex((s) => s.kind === "squares" && !s.all && i >= s.from && i < s.from + s.count);

  const cell = (i: number): { className: string; style?: React.CSSProperties } => {
    if (step.kind === "squares" && step.all) return { className: "bg-neutral" };
    const g = groupOf(i);
    if (g === active && step.kind === "squares") {
      const at = ((i - step.from) / step.count) * FILL_VH;
      return { className: "waffle-on", style: { animationTimeline: timeline(active), animationRange: range(at, at + 3) } };
    }
    if (g !== -1 && g < active) return { className: "bg-neutral/40" };
    return { className: "bg-paper-sunk" };
  };

  const hint = active === 0 ? "Scorri: ogni quadretto è un euro" : step.kind === "receipt" ? "Scorri per stampare il conto" : null;

  return (
    <div
      className="relative mt-6 [--story-h:calc(100dvh-var(--header-h)-var(--dock-h)-env(safe-area-inset-bottom))] lg:[--story-h:calc(100dvh-var(--header-h))]"
      style={{ timelineScope: steps.map((_, i) => timeline(i)).join(", ") }}
    >
      <div className="sticky top-[var(--header-h)] grid h-[var(--story-h)] grid-rows-[minmax(0,1fr)_auto_auto] gap-3.5 py-3 max-lg:landscape:grid-cols-2 max-lg:landscape:grid-rows-[1fr_auto] max-lg:landscape:gap-x-8 lg:grid-cols-2 lg:grid-rows-[1fr_auto] lg:gap-x-14 lg:py-7">
        <div className="relative grid min-h-0 place-items-center max-lg:landscape:row-span-2 lg:row-span-2">
          <div
            aria-hidden
            className={`grid w-[min(100%,max(120px,calc(var(--story-h)-300px)))] grid-cols-10 gap-1 transition-[opacity,transform] duration-500 max-lg:landscape:w-[min(100%,calc(var(--story-h)-32px))] lg:w-[min(100%,calc(var(--story-h)-140px),460px)] ${step.kind === "receipt" ? "scale-95 opacity-0" : ""}`}
          >
            {CELLS.map((i) => {
              const c = cell(i);
              return <span key={i} className={`aspect-square rounded-[3px] transition-[background-color,transform] duration-300 motion-reduce:transition-none ${c.className}`} style={c.style} />;
            })}
          </div>
          <div
            aria-hidden={step.kind !== "receipt"}
            className={`absolute inset-0 grid place-items-center transition-opacity duration-500 ${step.kind === "receipt" ? "" : "pointer-events-none opacity-0"}`}
          >
            <div className="receipt-print max-h-full w-[min(100%,340px)]" style={{ animationTimeline: timeline(last), animationRange: range(0, PRINT_VH) }}>
              <div className="receipt max-h-[calc(var(--story-h)-260px)] overflow-y-auto px-3.5 pt-4 pb-7 text-[14.5px] leading-[1.45] shadow-[0_18px_30px_-18px_rgb(0_0_0/0.45)] max-lg:landscape:max-h-[calc(var(--story-h)-24px)] lg:max-h-[calc(var(--story-h)-56px)]">
                <p className="border-b-[1.5px] border-dashed border-[#a9a49a] pb-2 text-center">
                  <b className="block text-[17px] tracking-[0.12em]">PAGHI TU</b>
                  {receiptTitle}
                </p>
                {receipt.map((r) => (
                  <p key={r.id} className={`flex items-baseline gap-2 ${r.strong ? "mt-1.5 border-t-[1.5px] border-dashed border-[#a9a49a] pt-1.5 text-[16.5px] font-bold" : "mt-0.5"}`}>
                    <span className="truncate">{r.label}</span>
                    <span className="min-w-3 flex-1 translate-y-[-3px] border-b border-dotted border-[#a9a49a]" />
                    <b className="tabular shrink-0">{r.value}</b>
                  </p>
                ))}
              </div>
            </div>
          </div>
        </div>
        <div aria-live="polite" className="grid max-lg:landscape:self-center lg:self-center">
          {steps.map((s, i) => (
            <article
              key={s.id}
              aria-hidden={i !== active}
              className={`col-start-1 row-start-1 max-w-[30em] transition-[opacity,transform] duration-500 ease-[cubic-bezier(0.2,0.8,0.2,1)] motion-reduce:transition-none ${
                i === active ? "" : i < active ? "pointer-events-none -translate-y-4 opacity-0" : "pointer-events-none translate-y-4 opacity-0"
              }`}
            >
              <p className="font-display tabular text-[clamp(2.6rem,12vw,3.6rem)] leading-none font-extrabold tracking-[-0.04em] text-accent">
                {s.amount}
                <small className="ml-1 text-[0.42em] font-bold tracking-normal text-ink-soft">{s.unit}</small>
              </p>
              <h3 className="mt-1.5 text-[clamp(1.45rem,6vw,1.9rem)] font-bold">{s.title}</h3>
              <p className="mt-1 text-lg leading-normal text-ink-soft lg:text-[19px] [&_b]:text-ink">{s.text}</p>
            </article>
          ))}
        </div>
        <div>
          <p
            aria-hidden
            className={`flex h-6 items-center justify-center gap-1.5 text-sm font-semibold text-ink-faint transition-opacity duration-300 ${hint ? "" : "opacity-0"} ${step.kind === "receipt" ? "hint-print" : ""}`}
            style={step.kind === "receipt" ? { animationTimeline: timeline(last), animationRange: range(PRINT_VH - 6, PRINT_VH) } : undefined}
          >
            {hint ?? " "}
            {hint ? <CaretDownIcon size={16} weight="bold" className="scroll-nudge text-accent" /> : null}
          </p>
          <div className="flex gap-1" role="group" aria-label="Passi del racconto">
            {steps.map((s, i) => (
              <button
                key={s.id}
                type="button"
                aria-label={`Passo ${i + 1}: ${s.title}`}
                aria-current={i === active ? "step" : undefined}
                onClick={() =>
                  rails.current?.children[i]?.scrollIntoView({
                    behavior: matchMedia("(prefers-reduced-motion: reduce)").matches ? "auto" : "smooth",
                    block: "center",
                  })
                }
                className="flex-1 py-2.5"
              >
                <span className="block h-1 overflow-hidden rounded-full bg-paper-sunk">
                  <span
                    data-on={i <= active ? "" : undefined}
                    className="story-seg block h-full bg-accent"
                    style={{ animationTimeline: timeline(i), animationRange: range(0, i === last ? PRINT_VH : RAIL_VH) }}
                  />
                </span>
              </button>
            ))}
          </div>
        </div>
      </div>
      <div ref={rails} aria-hidden className="mt-[calc(-1*var(--story-h))]">
        {steps.map((s, i) => (
          <div
            key={s.id}
            data-step={i}
            className={i === last ? "h-[var(--story-h)]" : "h-[62vh]"}
            style={{ viewTimelineName: timeline(i) }}
          />
        ))}
      </div>
    </div>
  );
}
