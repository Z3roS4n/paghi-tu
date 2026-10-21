"use client";

import { useRef, useState, useSyncExternalStore } from "react";

export type ChartPoint = { x: number; label: string; value: number; display: string };
type Unit = "euro" | "pct";

const HEIGHT = 260;
const PAD = { top: 16, right: 16, bottom: 28, left: 56 };

function niceStep(range: number, target: number) {
  const raw = range / target;
  const mag = 10 ** Math.floor(Math.log10(raw));
  return [1, 2, 2.5, 5, 10].map((m) => m * mag).find((s) => s >= raw) ?? 10 * mag;
}

function tickLabel(v: number, unit: Unit) {
  if (unit === "pct") return `${v.toLocaleString("it-IT")}%`;
  if (Math.abs(v) >= 1000) return `${(v / 1000).toLocaleString("it-IT")}k €`;
  return `${v.toLocaleString("it-IT")} €`;
}

function useWidth(ref: React.RefObject<HTMLDivElement | null>) {
  return useSyncExternalStore(
    (notify) => {
      const el = ref.current;
      if (!el) return () => {};
      const ro = new ResizeObserver(notify);
      ro.observe(el);
      return () => ro.disconnect();
    },
    () => ref.current?.clientWidth ?? 720,
    () => 720,
  );
}

export function LineChart({
  points,
  unit,
  label,
  highlight,
}: {
  points: ChartPoint[];
  unit: Unit;
  label: string;
  highlight?: { from: number; to: number; label: string };
}) {
  const wrap = useRef<HTMLDivElement>(null);
  const width = useWidth(wrap);
  const [active, setActive] = useState<number | null>(null);

  const xs = points.map((p) => p.x);
  const vs = points.map((p) => p.value);
  const x0 = Math.min(...xs);
  const x1 = Math.max(...xs);
  const step = niceStep(Math.max(...vs, 0) - Math.min(...vs, 0) || 1, 4);
  const y0 = Math.floor(Math.min(...vs, 0) / step) * step;
  const y1 = Math.ceil(Math.max(...vs, 0) / step) * step;
  const ticks = Array.from({ length: Math.round((y1 - y0) / step) + 1 }, (_, i) => y0 + i * step);

  const plotW = Math.max(width - PAD.left - PAD.right, 10);
  const plotH = HEIGHT - PAD.top - PAD.bottom;
  const sx = (x: number) => PAD.left + ((x - x0) / (x1 - x0 || 1)) * plotW;
  const sy = (v: number) => PAD.top + (1 - (v - y0) / (y1 - y0 || 1)) * plotH;

  const line = points.map((p, i) => `${i ? "L" : "M"}${sx(p.x).toFixed(1)},${sy(p.value).toFixed(1)}`).join("");
  const area = `${line}L${sx(x1).toFixed(1)},${sy(Math.max(y0, 0))}L${sx(x0).toFixed(1)},${sy(Math.max(y0, 0))}Z`;
  const yearTicks = (() => {
    const span = x1 - x0;
    const every = niceStep(span || 1, width < 480 ? 3 : 6);
    const first = Math.ceil(x0 / every) * every;
    return Array.from({ length: Math.floor((x1 - first) / every) + 1 }, (_, i) => first + i * every);
  })();

  function nearest(clientX: number) {
    const rect = wrap.current?.getBoundingClientRect();
    if (!rect) return;
    const x = x0 + ((clientX - rect.left - PAD.left) / plotW) * (x1 - x0);
    let best = 0;
    for (let i = 1; i < points.length; i++) if (Math.abs(points[i].x - x) < Math.abs(points[best].x - x)) best = i;
    setActive(best);
  }

  const a = active === null ? null : points[active];
  const last = points.at(-1)!;

  return (
    <div ref={wrap} className="relative w-full">
      <svg
        width={width}
        height={HEIGHT}
        role="img"
        aria-label={label}
        tabIndex={0}
        className="block touch-pan-y outline-none focus-visible:outline-2 focus-visible:outline-accent"
        onPointerMove={(e) => nearest(e.clientX)}
        onPointerLeave={() => setActive(null)}
        onFocus={() => setActive((i) => i ?? points.length - 1)}
        onBlur={() => setActive(null)}
        onKeyDown={(e) => {
          if (e.key !== "ArrowLeft" && e.key !== "ArrowRight") return;
          e.preventDefault();
          setActive((i) => Math.min(Math.max((i ?? points.length - 1) + (e.key === "ArrowLeft" ? -1 : 1), 0), points.length - 1));
        }}
      >
        {highlight ? (
          <g>
            <rect
              x={sx(Math.max(highlight.from, x0))}
              y={PAD.top}
              width={Math.max(sx(Math.min(highlight.to, x1)) - sx(Math.max(highlight.from, x0)), 2)}
              height={plotH}
              className="fill-ink/[0.06]"
            />
            <text x={sx(Math.max(highlight.from, x0)) + 4} y={PAD.top + 12} className="fill-ink-soft text-[11px]">
              {highlight.label}
            </text>
          </g>
        ) : null}
        {ticks.map((t) => (
          <g key={t}>
            <line x1={PAD.left} x2={PAD.left + plotW} y1={sy(t)} y2={sy(t)} className={t === 0 ? "stroke-ink-faint" : "stroke-rule"} />
            <text x={PAD.left - 8} y={sy(t)} dy="0.32em" textAnchor="end" className="tabular fill-ink-faint text-[11px]">
              {tickLabel(t, unit)}
            </text>
          </g>
        ))}
        {yearTicks.map((t) => (
          <text key={t} x={sx(t)} y={HEIGHT - 8} textAnchor="middle" className="tabular fill-ink-faint text-[11px]">
            {t}
          </text>
        ))}
        <path d={area} className="fill-accent/10" />
        <path d={line} fill="none" strokeWidth={2} strokeLinejoin="round" strokeLinecap="round" className="stroke-accent" />
        <circle cx={sx(last.x)} cy={sy(last.value)} r={4} strokeWidth={2} className="fill-accent stroke-paper" />
        {a ? (
          <g aria-hidden>
            <line x1={sx(a.x)} x2={sx(a.x)} y1={PAD.top} y2={PAD.top + plotH} className="stroke-ink-faint" />
            <circle cx={sx(a.x)} cy={sy(a.value)} r={5} strokeWidth={2} className="fill-accent stroke-paper" />
          </g>
        ) : null}
      </svg>
      <p aria-live="polite" className="sr-only">
        {a ? `${a.label}: ${a.display}` : ""}
      </p>
      {a ? (
        <div
          aria-hidden
          className="pointer-events-none absolute top-2 border border-rule bg-paper-raised px-3 py-2 text-sm shadow-sm"
          style={{
            left: Math.min(Math.max(sx(a.x) - 70, 0), width - 150),
          }}
        >
          <p className="font-semibold">{a.display}</p>
          <p className="text-xs text-ink-faint">{a.label}</p>
        </div>
      ) : null}
    </div>
  );
}
