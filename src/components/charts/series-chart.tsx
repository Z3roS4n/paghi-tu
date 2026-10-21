"use client";

import { useCallback, useRef, useState, useSyncExternalStore } from "react";
import { formatChartValue, niceTicks, type ChartUnit } from "@/lib/chart";

export type ChartSeries = {
  id: string;
  name: string;
  tone: "accent" | "neutral";
  values: (number | null)[];
  /** Indice fino al quale i valori sono un nostro calcolo: quel tratto è tratteggiato. */
  estimatedUntil?: number;
};

export type SeriesChartProps = {
  label: string;
  years: number[];
  series: ChartSeries[];
  unit: ChartUnit;
  yMin?: number;
  yMax?: number;
  gap?: boolean;
  breakYear?: number;
  bands?: { name: string; from: number; to: number }[];
  notes?: { year: number; text: string; below?: boolean }[];
  endLabels?: boolean;
  height?: number;
  /** Disegna sempre tutte le fasce, non solo quella dell'anno scelto (es. il mandato di un solo governo). */
  pinBands?: boolean;
  /** Solo da componenti client: avvisa quando cambia l'anno scelto. */
  onSelect?: (year: number) => void;
};

const PAD = { top: 16, bottom: 28 };

function useWidth(ref: React.RefObject<HTMLDivElement | null>) {
  const subscribe = useCallback(
    (notify: () => void) => {
      const el = ref.current;
      if (!el) return () => {};
      const ro = new ResizeObserver(notify);
      ro.observe(el);
      return () => ro.disconnect();
    },
    [ref],
  );
  return useSyncExternalStore(
    subscribe,
    () => ref.current?.clientWidth ?? 720,
    () => 720,
  );
}

const TONE_STROKE = { accent: "stroke-accent", neutral: "stroke-neutral" } as const;
const TONE_FILL = { accent: "fill-accent", neutral: "fill-neutral" } as const;

export function SeriesChart(p: SeriesChartProps) {
  const wrap = useRef<HTMLDivElement>(null);
  const width = useWidth(wrap);
  const [active, setActive] = useState(p.years.length - 1);
  const height = p.height ?? 300;

  const all = p.series.flatMap((s) => s.values.filter((v): v is number => v !== null));
  const ticks = niceTicks(p.yMin ?? Math.min(...all), p.yMax ?? Math.max(...all));
  const y0 = p.yMin ?? ticks[0];
  const y1 = p.yMax ?? ticks.at(-1)!;
  const shownTicks = ticks.filter((t) => t >= y0 && t <= y1);
  const tickText = (t: number) => formatChartValue(t, p.unit, "axis");
  const left = Math.max(...shownTicks.map((t) => tickText(t).length)) * 7 + 14;
  const right = p.endLabels ? Math.max(...p.series.map((s) => s.name.length)) * 7 + 18 : 14;
  const n = p.years.length;
  const plotW = Math.max(width - left - right, 10);
  const plotH = height - PAD.top - PAD.bottom;
  const sx = (i: number) => left + (i / (n - 1 || 1)) * plotW;
  const sxYear = (year: number) => left + ((year - p.years[0]) / (n - 1 || 1)) * plotW;
  const sy = (v: number) => PAD.top + (1 - (v - y0) / (y1 - y0 || 1)) * plotH;

  const path = (s: ChartSeries, from: number, to: number) => {
    let d = "";
    for (let i = from; i <= to; i++) {
      const v = s.values[i];
      if (v === null) continue;
      d += `${d ? "L" : "M"}${sx(i).toFixed(1)},${sy(v).toFixed(1)}`;
    }
    return d;
  };

  const yearTicks = (() => {
    const every = Math.max(1, width < 520 ? Math.ceil((n - 1) / 2) : Math.ceil((n - 1) / 4));
    const idx = new Set([0, n - 1]);
    for (let i = every; i < n - every / 2; i += every) idx.add(i);
    return [...idx].toSorted((a, b) => a - b);
  })();

  const gapPolygon =
    p.gap && p.series.length === 2
      ? [
          ...p.series[0].values.map((v, i) => (v === null ? null : `${sx(i)},${sy(v)}`)),
          ...p.series[1].values.map((v, i) => (v === null ? null : `${sx(i)},${sy(v)}`)).toReversed(),
        ]
          .filter(Boolean)
          .join(" ")
      : null;

  const year = p.years[active];
  const band = p.bands?.findLast((b) => b.from <= year + 0.999 && b.to > year);
  const inYear = p.bands?.filter((b) => b.from < year + 1 && b.to > year).map((b) => b.name) ?? [];

  function select(i: number) {
    const next = Math.min(Math.max(i, 0), n - 1);
    if (next === active) return;
    setActive(next);
    p.onSelect?.(p.years[next]);
  }

  function pick(clientX: number) {
    const rect = wrap.current?.getBoundingClientRect();
    if (!rect) return;
    select(Math.round(((clientX - rect.left - left) / plotW) * (n - 1)));
  }

  const readout = p.series
    .map((s) => {
      const v = s.values[active];
      const est = s.estimatedUntil !== undefined && active <= s.estimatedUntil;
      return v === null ? null : `${p.series.length > 1 ? `${s.name} ` : ""}${formatChartValue(v, p.unit, "full")}${est ? " (nostro calcolo)" : ""}`;
    })
    .filter(Boolean)
    .join(", ");

  return (
    <div>
      <p aria-live="polite" className="min-h-[2.9em] text-sm leading-snug text-ink-soft">
        <b className="font-display text-[22px] font-bold tracking-tight text-ink">{year}</b> {readout}
        {inYear.length > 0 ? (
          <span className="block">
            {inYear.length > 1 ? "Governi: " : "Governo: "}
            {inYear.join(", ")}
          </span>
        ) : null}
      </p>
      <div
        ref={wrap}
        role="slider"
        tabIndex={0}
        aria-label={p.label}
        aria-valuemin={p.years[0]}
        aria-valuemax={p.years[n - 1]}
        aria-valuenow={year}
        aria-valuetext={`${year}: ${readout}`}
        className="relative mt-1 w-full cursor-crosshair touch-pan-y"
        style={{ height }}
        onPointerDown={(e) => pick(e.clientX)}
        onPointerMove={(e) => {
          if (e.pointerType === "mouse" || e.buttons) pick(e.clientX);
        }}
        onKeyDown={(e) => {
          const step = { ArrowLeft: -1, ArrowDown: -1, ArrowRight: 1, ArrowUp: 1 }[e.key];
          if (step) select(active + step);
          else if (e.key === "Home") select(0);
          else if (e.key === "End") select(n - 1);
          else return;
          e.preventDefault();
        }}
      >
        {/* Prima dell'idratazione la larghezza è stimata: il viewBox scala il disegno invece di sbordare. */}
        <svg width="100%" height={height} viewBox={`0 0 ${width} ${height}`} aria-hidden className="block overflow-visible">
          {(p.pinBands ? (p.bands ?? []) : band ? [band] : []).map((b) => (
            <rect
              key={`${b.name}-${b.from}`}
              x={Math.max(left, sxYear(b.from))}
              y={PAD.top}
              width={Math.max(Math.min(left + plotW, sxYear(b.to)) - Math.max(left, sxYear(b.from)), 2)}
              height={plotH}
              className="fill-accent-soft"
            />
          ))}
          {shownTicks.map((t) => (
            <g key={t}>
              <line x1={left} x2={left + plotW} y1={sy(t)} y2={sy(t)} className={t === 0 ? "stroke-ink-faint" : "stroke-rule"} />
              <text x={left - 8} y={sy(t)} dy="0.32em" textAnchor="end" className="tabular fill-ink-faint text-[12px]">
                {tickText(t)}
              </text>
            </g>
          ))}
          {yearTicks.map((i, j) => (
            <text
              key={i}
              x={sx(i)}
              y={height - 6}
              textAnchor={j === 0 ? "start" : j === yearTicks.length - 1 ? "end" : "middle"}
              className="tabular fill-ink-faint text-[12px]"
            >
              {p.years[i]}
            </text>
          ))}
          {p.breakYear !== undefined ? (
            <line
              x1={sxYear(p.breakYear)}
              x2={sxYear(p.breakYear)}
              y1={PAD.top}
              y2={PAD.top + plotH}
              strokeDasharray="2 4"
              className="stroke-ink-faint"
            />
          ) : null}
          {gapPolygon ? <polygon points={gapPolygon} className="chart-area fill-accent/12" /> : null}
          {p.series.map((s) =>
            s.estimatedUntil !== undefined ? (
              <g key={s.id}>
                <path d={path(s, 0, s.estimatedUntil)} fill="none" strokeWidth={2.5} strokeDasharray="4 4" className={`chart-late ${TONE_STROKE[s.tone]}`} />
                <path d={path(s, s.estimatedUntil, n - 1)} pathLength={1} fill="none" strokeWidth={2.5} strokeLinejoin="round" strokeLinecap="round" className={`chart-line ${TONE_STROKE[s.tone]}`} />
              </g>
            ) : (
              <path key={s.id} d={path(s, 0, n - 1)} pathLength={1} fill="none" strokeWidth={2.5} strokeLinejoin="round" strokeLinecap="round" className={`chart-line ${TONE_STROKE[s.tone]}`} />
            ),
          )}
          {p.notes?.map((note) => {
            const i = p.years.indexOf(note.year);
            const v = p.series[0].values[i];
            if (i < 0 || v === null) return null;
            return (
              <text
                key={note.year}
                x={sx(i)}
                y={note.below ? sy(v) + 20 : sy(v) - 10}
                textAnchor={i < n / 6 ? "start" : i > (n * 5) / 6 ? "end" : "middle"}
                className="chart-late fill-ink-faint text-[12px] font-semibold"
              >
                {note.text}
              </text>
            );
          })}
          {p.endLabels
            ? p.series.map((s) => {
                const v = s.values[n - 1];
                return v === null ? null : (
                  <text key={s.id} x={left + plotW + 10} y={sy(v)} dy="0.32em" className={`chart-late text-[12.5px] font-bold ${s.tone === "accent" ? "fill-accent" : "fill-ink-soft"}`}>
                    {s.name}
                  </text>
                );
              })
            : null}
          <line x1={sx(active)} x2={sx(active)} y1={PAD.top} y2={PAD.top + plotH} className="chart-late stroke-ink-faint opacity-50" />
          {p.series.map((s) => {
            const v = s.values[active];
            return v === null ? null : (
              <circle key={s.id} cx={sx(active)} cy={sy(v)} r={5.5} strokeWidth={2.5} className={`chart-late stroke-paper-raised ${TONE_FILL[s.tone]}`} />
            );
          })}
        </svg>
      </div>
    </div>
  );
}
