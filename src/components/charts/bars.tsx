import { formatDecimal } from "@/lib/format";

const signed = (n: number) => `${n > 0 ? "+" : ""}${formatDecimal(n, 1)}%`;

/** Stessa voce in due periodi: barre dello stesso colore per il prima, accento per il dopo. */
export function PairBars({
  rows,
  before,
  after,
  format,
}: {
  rows: { id: string; label: string; before: number; after: number; delta: number }[];
  before: string;
  after: string;
  format: (n: number) => string;
}) {
  return (
    <ul className="reveal-bars mt-5 grid gap-5 md:grid-cols-2 md:gap-x-8">
      {rows.map((r) => {
        const max = Math.max(r.before, r.after);
        return (
          <li key={r.id}>
            <p className="flex items-baseline justify-between gap-3 font-bold">
              <span>{r.label}</span>
              <span className="font-display tabular text-xl text-accent">{signed(r.delta)}</span>
            </p>
            <div className="mt-1.5 grid gap-1">
              {[
                [before, r.before, "bg-neutral"],
                [after, r.after, "bg-accent"],
              ].map(([label, value, tone]) => (
                <p key={label as string} className="grid grid-cols-[3.2em_1fr_auto] items-center gap-2 text-[13.5px] text-ink-faint">
                  <span>{label}</span>
                  <span className={`bar block h-3 rounded-r-ctl ${tone}`} style={{ width: `${((value as number) / max) * 100}%` }} aria-hidden />
                  <b className="tabular font-semibold whitespace-nowrap text-ink">{format(value as number)}</b>
                </p>
              ))}
            </div>
          </li>
        );
      })}
    </ul>
  );
}

/** Barre orizzontali dallo zero, una sola evidenziata. */
export function HBars({
  rows,
  max,
  format,
}: {
  rows: { id: string; label: string; value: number; highlight?: boolean }[];
  max: number;
  format: (n: number) => string;
}) {
  return (
    <ul className="reveal-bars mt-4 grid gap-2">
      {rows.map((r) => (
        <li key={r.id} className={`grid grid-cols-[6.5em_1fr_auto] items-center gap-2.5 text-[15px] ${r.highlight ? "font-bold" : ""}`}>
          <span>{r.label}</span>
          <span
            aria-hidden
            className={`bar block h-3.5 rounded-r-ctl ${r.highlight ? "bg-accent" : "bg-neutral"}`}
            style={{ width: `${(r.value / max) * 100}%` }}
          />
          <b className="tabular whitespace-nowrap">{format(r.value)}</b>
        </li>
      ))}
    </ul>
  );
}

/** Scostamento dalla stima, centrato sullo zero: a sinistra speso meno, a destra speso di più. */
export function DivergingBars({
  rows,
  scale,
}: {
  rows: { id: string; title: string; detail: string; note: string; pct: number }[];
  scale: number;
}) {
  return (
    <>
      <ul className="reveal-bars mt-4 grid">
        {rows.map((r) => {
          const more = r.pct >= 0;
          const w = (Math.min(Math.abs(r.pct), scale) / scale) * 50;
          return (
            <li key={r.id} className="grid gap-1 border-b border-rule py-2.5 md:grid-cols-[17em_1fr_4.5em] md:items-center md:gap-4">
              <p className="font-bold">
                {r.title}
                <small className="block text-[13.5px] font-normal text-ink-faint">{r.detail}</small>
              </p>
              <div>
                <div className="relative h-4 before:absolute before:inset-y-[-4px] before:left-1/2 before:w-[1.5px] before:bg-ink-faint">
                  <span
                    aria-hidden
                    className={`bar absolute top-0.5 h-3 ${more ? "left-1/2 rounded-r-ctl bg-accent" : "right-1/2 rounded-l-ctl bg-neutral"}`}
                    style={{ width: `${w}%`, ["--origin" as string]: more ? "left" : "right" }}
                  />
                </div>
                <p className="tabular mt-1 text-[13.5px] text-ink-faint">{r.note}</p>
              </div>
              <p className={`font-display tabular text-lg font-extrabold md:text-right ${more ? "text-accent" : "text-ink-soft"}`}>{signed(r.pct)}</p>
            </li>
          );
        })}
      </ul>
      <p className="mt-1.5 grid grid-cols-2 text-[12.5px] text-ink-faint md:mr-[calc(4.5em+16px)] md:ml-[calc(17em+16px)]">
        <span>speso meno del previsto</span>
        <span className="text-right">speso più del previsto</span>
      </p>
    </>
  );
}

/** Da un anno all'altro su una scala comune: pallino vuoto il primo anno, pieno l'ultimo. */
export function ShiftList({
  rows,
  from,
  to,
  max,
}: {
  rows: { id: string; label: string; from: number; to: number }[];
  from: number;
  to: number;
  max: number;
}) {
  return (
    <>
      <ul className="reveal-bars" aria-label={`Quote su 100 euro di spesa, ${from} e ${to}`}>
        {rows.map((r) => {
          const up = r.to > r.from;
          const p1 = (r.from / max) * 100;
          const p2 = (r.to / max) * 100;
          return (
            <li key={r.id} className="grid grid-cols-[3.2em_1fr_3.2em] items-center gap-2 border-b border-rule py-2">
              <p className="col-span-3 text-[15.5px] font-bold">{r.label}</p>
              <span className="font-display tabular text-[15px] font-bold text-ink-faint">{formatDecimal(r.from, 1)}</span>
              <span aria-hidden className="relative h-3.5 before:absolute before:inset-x-0 before:top-1/2 before:h-px before:bg-rule">
                <span
                  className={`bar absolute top-1/2 -mt-0.5 h-1 rounded-full ${up ? "bg-accent" : "bg-neutral"}`}
                  style={{ left: `${Math.min(p1, p2)}%`, width: `${Math.abs(p2 - p1)}%`, ["--origin" as string]: up ? "left" : "right" }}
                />
                <span className="absolute top-1/2 -mt-[5px] -ml-[5px] h-2.5 w-2.5 rounded-full border-2 border-neutral bg-paper-raised" style={{ left: `${p1}%` }} />
                <span className={`absolute top-1/2 -mt-[5px] -ml-[5px] h-2.5 w-2.5 rounded-full ${up ? "bg-accent" : "bg-neutral"}`} style={{ left: `${p2}%` }} />
              </span>
              <span className="font-display tabular text-right text-[17px] font-extrabold">{formatDecimal(r.to, 1)}</span>
            </li>
          );
        })}
      </ul>
      <p className="mt-1 flex justify-between text-xs text-ink-faint">
        <span>{from}</span>
        <span>{to}</span>
      </p>
    </>
  );
}

/** Linea piccola senza assi, per una serie mensile breve; il tratto evidenziato è dopo `markFrom`. */
export function Sparkline({ values, markFrom, label }: { values: number[]; markFrom: number; label: string }) {
  const min = Math.min(...values);
  const max = Math.max(...values);
  const x = (i: number) => (i / (values.length - 1)) * 100;
  const y = (v: number) => 92 - ((v - min) / (max - min || 1)) * 84;
  const d = values.map((v, i) => `${i ? "L" : "M"}${x(i).toFixed(2)},${y(v).toFixed(2)}`).join("");
  return (
    <svg viewBox="0 0 100 100" preserveAspectRatio="none" role="img" aria-label={label} className="block h-16 w-full overflow-visible">
      <rect x={x(markFrom)} y={0} width={100 - x(markFrom)} height={100} className="fill-accent-soft" />
      <path d={d} fill="none" strokeWidth={2.5} vectorEffect="non-scaling-stroke" strokeLinejoin="round" className="stroke-accent" />
    </svg>
  );
}
