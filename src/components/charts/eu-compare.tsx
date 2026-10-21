"use client";

import { useState } from "react";
import { formatDecimal } from "@/lib/format";
import { Segmented } from "./segmented";

type Geo = "DE" | "FR" | "ES" | "EU27_2020";
const OPTIONS: { id: Geo; label: string }[] = [
  { id: "EU27_2020", label: "Media UE" },
  { id: "DE", label: "Germania" },
  { id: "FR", label: "Francia" },
  { id: "ES", label: "Spagna" },
];

export type EuRow = { id: string; label: string; it: number; others: Record<Geo, number> };

const pct = (n: number) => `${formatDecimal(n, 1)}%`;

/** Italia contro un paese a scelta sulla stessa scala: pallino pieno l'Italia, anello l'altro. */
export function EuCompare({ rows, year }: { rows: EuRow[]; year: number }) {
  const [geo, setGeo] = useState<Geo>("EU27_2020");
  const name = OPTIONS.find((o) => o.id === geo)!.label;
  const max = Math.ceil(Math.max(...rows.flatMap((r) => [r.it, ...Object.values(r.others)])) / 5) * 5;
  const x = (v: number) => `${(v / max) * 100}%`;

  return (
    <div>
      <Segmented label="Paese di confronto" options={OPTIONS} value={geo} onChange={setGeo} />
      <p className="mt-3 flex flex-wrap gap-x-5 gap-y-1 text-sm text-ink-soft">
        <span className="inline-flex items-center gap-2">
          <i aria-hidden className="size-3 rounded-full bg-accent" />
          Italia
        </span>
        <span className="inline-flex items-center gap-2">
          <i aria-hidden className="size-3 rounded-full border-[3px] border-neutral" />
          {name}
        </span>
      </p>
      <ul className="mt-3" aria-label={`Spesa per funzione in % del PIL, ${year}: Italia e ${name}`}>
        {rows.map((r) => {
          const other = r.others[geo];
          const diff = r.it - other;
          return (
            <li key={r.id} className="border-b border-rule py-2.5">
              <p className="flex items-baseline justify-between gap-3">
                <span className="font-bold">{r.label}</span>
                <span className="tabular text-sm whitespace-nowrap text-ink-soft">
                  <b className="text-ink">{pct(r.it)}</b> contro {pct(other)}
                  <span className="sr-only">, differenza {formatDecimal(diff, 1)} punti</span>
                </span>
              </p>
              <span aria-hidden className="relative mt-2 block h-5 before:absolute before:inset-x-0 before:top-1/2 before:h-px before:bg-rule">
                <span
                  className="absolute top-1/2 h-[3px] -mt-[1.5px] bg-rule transition-[left,width] duration-500 motion-reduce:transition-none"
                  style={{ left: x(Math.min(r.it, other)), width: `${(Math.abs(diff) / max) * 100}%` }}
                />
                <span
                  className="absolute top-1/2 -mt-2 -ml-2 size-4 rounded-full border-[3px] border-neutral bg-paper-raised transition-[left] duration-500 motion-reduce:transition-none"
                  style={{ left: x(other) }}
                />
                <span className="absolute top-1/2 -mt-2 -ml-2 size-4 rounded-full bg-accent shadow-[0_0_0_2.5px_var(--paper-raised)]" style={{ left: x(r.it) }} />
              </span>
            </li>
          );
        })}
      </ul>
      <p aria-hidden className="tabular mt-1 flex justify-between text-xs text-ink-faint">
        <span>0%</span>
        <span>{max}% del PIL</span>
      </p>
    </div>
  );
}
