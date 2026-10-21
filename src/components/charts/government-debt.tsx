"use client";

import Link from "next/link";
import { useState } from "react";
import { ArrowRightIcon } from "@phosphor-icons/react";
import { formatDate, formatDecimal, formatEuroMillions } from "@/lib/format";
import { LevelTag } from "@/components/verification-badge";
import { SeriesChart, type SeriesChartProps } from "./series-chart";

export type GovernmentCard = {
  id: string;
  nome: string;
  presidente: string;
  inizio: string;
  fine: string | null;
  from: number;
  to: number;
  debito: { variazione: number; parziale: boolean } | null;
  prima: { anno: number; valore: number } | null;
  dopo: { anno: number; valore: number } | null;
  livello: "V1" | "V2" | "NV";
};

const pct = (n: number) => `${formatDecimal(n, 1)}%`;

/** Il grafico del debito e, accanto, il governo in carica nell'anno scelto. */
export function GovernmentDebt({ chart, cards, image }: { chart: Omit<SeriesChartProps, "onSelect">; cards: GovernmentCard[]; image?: React.ReactNode }) {
  const [year, setYear] = useState(chart.years.at(-1)!);
  const g = cards.findLast((c) => c.from <= year + 0.999 && c.to > year) ?? cards.at(-1)!;

  return (
    <div className="mt-6 grid gap-3.5 lg:grid-cols-[minmax(0,1.6fr)_minmax(0,1fr)] lg:items-start">
      <figure className="chart-frame m-0 min-w-0 rounded-card bg-paper-raised px-3.5 pt-4 pb-3.5 md:px-5 md:pt-5">
        <figcaption>
          <h3 className="font-sans text-[15.5px] font-bold tracking-normal">Debito pubblico, % del PIL</h3>
          <p className="mt-1 flex flex-wrap gap-x-4 gap-y-1 text-sm text-ink-soft">
            <span className="inline-flex items-center gap-1.5">
              <i aria-hidden className="inline-block h-[3px] w-4 rounded-full bg-accent" />
              Dato ufficiale, dal 1995
            </span>
            <span className="inline-flex items-center gap-1.5">
              <i aria-hidden className="inline-block h-[3px] w-4 bg-[repeating-linear-gradient(90deg,var(--accent)_0_4px,transparent_4px_8px)]" />
              Nostro calcolo, prima del 1995
            </span>
          </p>
        </figcaption>
        <div className="mt-2">
          <SeriesChart {...chart} onSelect={setYear} />
        </div>
        <p className="mt-1 text-sm text-ink-faint">Scorri il dito o usa le frecce sul grafico per cambiare anno.</p>
      </figure>
      <article className="min-w-0 overflow-hidden rounded-card bg-paper-raised">
        {image}
        <div className="px-4 pt-4 pb-2 md:px-5">
          <div className="flex items-start justify-between gap-3">
            <div aria-live="polite">
              <h3 className="text-[1.6rem] leading-tight font-extrabold">Governo {g.nome}</h3>
              <p className="text-[15px] text-ink-soft">
                {g.presidente}, {g.fine ? `dal ${formatDate(g.inizio)} al ${formatDate(g.fine)}` : `in carica dal ${formatDate(g.inizio)}`}
              </p>
            </div>
            <LevelTag level={g.livello} />
          </div>
          <dl className="my-4 grid gap-2.5 sm:grid-cols-2 lg:grid-cols-1">
            <div className="rounded-ctl bg-paper px-3.5 py-3">
              <dt className="sr-only">Debito nel mandato</dt>
              <dd className="font-display tabular text-[clamp(1.25rem,5vw,1.6rem)] leading-tight font-bold tracking-[-0.02em] whitespace-nowrap">
                {g.debito ? `${g.debito.variazione >= 0 ? "+" : "−"}${formatEuroMillions(Math.abs(g.debito.variazione))}` : "n.d."}
              </dd>
              <dd className="text-[13.5px] leading-snug text-ink-soft">
                debito {g.debito && g.debito.variazione < 0 ? "in meno" : "in più"} {g.debito?.parziale ? "finora" : "nel mandato"}, euro dell&apos;epoca
              </dd>
            </div>
            <div className="rounded-ctl bg-paper px-3.5 py-3">
              <dt className="sr-only">Debito sul PIL</dt>
              <dd className="font-display tabular text-[clamp(1.25rem,5vw,1.6rem)] leading-tight font-bold tracking-[-0.02em] whitespace-nowrap">
                {g.prima && g.dopo ? `${pct(g.prima.valore)} → ${pct(g.dopo.valore)}` : "n.d."}
              </dd>
              <dd className="text-[13.5px] leading-snug text-ink-soft">
                {g.prima && g.dopo ? `debito sul PIL, ${g.prima.anno} e ${g.dopo.anno}` : "nessun dicembre nel mandato"}
              </dd>
            </div>
          </dl>
          <p className="text-[15px] text-ink-soft">
            Il debito di un periodo dipende anche da decisioni prese prima e da fatti che nessun governo controlla. Qui c&apos;è
            solo cosa è successo durante il mandato.
          </p>
          <Link href={`/governi/${g.id}`} className="group mt-1 inline-flex min-h-12 items-center gap-2 font-bold hover:text-accent">
            Scheda del governo {g.nome}
            <ArrowRightIcon size={18} weight="bold" aria-hidden className="transition-transform group-hover:translate-x-0.5" />
          </Link>
        </div>
      </article>
    </div>
  );
}
