"use client";

import { useEffect, useRef, useState } from "react";

export type WaffleStep =
  | { kind: "squares"; id: string; amount: string; unit: string; title: string; text: React.ReactNode; from: number; count: number; all?: boolean }
  | { kind: "receipt"; id: string; amount: string; unit: string; title: string; text: React.ReactNode };

export type ReceiptLine = { id: string; label: string; value: string; strong?: boolean };

const CELLS = Array.from({ length: 100 }, (_, i) => i);

/**
 * Racconto a passi: un pannello fisso alto quanto lo schermo tiene insieme quadretti e testo, e lo
 * scroll sui binari sotto il pannello sceglie il passo. Così su mobile niente testo che passa sotto
 * il grafico, e i quadretti restano grandi.
 */
export function WaffleStory({ steps, receipt, receiptTitle }: { steps: WaffleStep[]; receipt: ReceiptLine[]; receiptTitle: string }) {
  const [active, setActive] = useState(0);
  const rails = useRef<HTMLDivElement>(null);
  const step = steps[active];

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

  const lit = (i: number) => step.kind === "squares" && !step.all && i >= step.from && i < step.from + step.count;

  return (
    <div className="relative mt-6 [--story-h:calc(100dvh-var(--header-h)-var(--dock-h)-env(safe-area-inset-bottom))] lg:[--story-h:calc(100dvh-var(--header-h))]">
      <div className="sticky top-[var(--header-h)] grid h-[var(--story-h)] grid-rows-[minmax(0,1fr)_auto_auto] gap-3.5 py-3 max-lg:landscape:grid-cols-2 max-lg:landscape:grid-rows-[1fr_auto] max-lg:landscape:gap-x-8 lg:grid-cols-2 lg:grid-rows-[1fr_auto] lg:gap-x-14 lg:py-7">
        <div className="relative grid min-h-0 place-items-center max-lg:landscape:row-span-2 lg:row-span-2">
          <div
            aria-hidden
            className={`grid w-[min(100%,max(120px,calc(var(--story-h)-280px)))] max-lg:landscape:w-[min(100%,calc(var(--story-h)-32px))] grid-cols-10 gap-1 transition-[opacity,transform] duration-500 lg:w-[min(100%,calc(var(--story-h)-140px),460px)] ${step.kind === "receipt" ? "scale-95 opacity-0" : ""}`}
          >
            {CELLS.map((i) => (
              <span
                key={i}
                className={`aspect-square rounded-[3px] transition-[background-color,transform] duration-300 motion-reduce:transition-none ${
                  step.kind === "squares" && step.all ? "bg-neutral" : lit(i) ? "scale-90 bg-accent" : "bg-paper-sunk"
                }`}
                style={{ transitionDelay: step.kind === "squares" ? `${Math.abs(i - step.from) * 6}ms` : undefined }}
              />
            ))}
          </div>
          <div
            aria-hidden={step.kind !== "receipt"}
            className={`absolute inset-0 grid place-items-center transition-[opacity,transform] duration-500 ${step.kind === "receipt" ? "" : "pointer-events-none translate-y-6 opacity-0"}`}
          >
            <div className="receipt max-h-full w-[min(100%,340px)] overflow-y-auto px-3.5 pt-4 pb-7 text-[14.5px] leading-[1.45] shadow-[0_18px_30px_-18px_rgb(0_0_0/0.45)]">
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
        <div aria-live="polite" className="grid max-lg:landscape:self-center lg:self-center">
          {steps.map((s, i) => (
            <article
              key={s.id}
              aria-hidden={i !== active}
              className={`col-start-1 row-start-1 max-w-[30em] transition-[opacity,transform] duration-300 motion-reduce:transition-none ${i === active ? "" : "pointer-events-none translate-y-3 opacity-0"}`}
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
              className="flex-1 py-2.5 before:block before:h-1 before:rounded-full before:bg-paper-sunk before:transition-colors aria-[current=step]:before:bg-accent data-[done]:before:bg-accent"
              data-done={i < active ? "" : undefined}
            />
          ))}
        </div>
      </div>
      <div ref={rails} aria-hidden className="mt-[calc(-1*var(--story-h))]">
        {steps.map((s, i) => (
          <div key={s.id} data-step={i} className={i === steps.length - 1 ? "h-[var(--story-h)]" : "h-[62vh]"} />
        ))}
      </div>
    </div>
  );
}
