import type { Metadata } from "next";
import Link from "next/link";
import { CaretRightIcon } from "@phosphor-icons/react/ssr";
import { DebtByGovernment } from "@/components/sections/finance";
import { Card, PageHead, Wrap } from "@/components/ui";
import { LevelTag } from "@/components/verification-badge";
import { legislatures, governments, governmentsOf } from "@/server/data";
import { governmentDurationDays } from "@/server/stats";
import { formatDate, formatDecimal, formatEuroMillions, formatInt } from "@/lib/format";
import { governmentFinance } from "@/server/finance";

export const metadata: Metadata = {
  title: "Governi",
  description: "Tutti i governi italiani dal 1945 a oggi, per legislatura, con date, maggioranze, debito durante il mandato e fonti.",
};

function legislatureLabel(id: string) {
  return id === "AC" ? "Assemblea Costituente" : `${id} legislatura`;
}

export default function GovernmentsPage() {
  const ordered = legislatures.toSorted((a, b) => b.numero - a.numero);

  return (
    <Wrap>
      <PageHead kicker="Dal 1945 a oggi" title="Governi">
        <p>
          I {governments.length} governi della Repubblica e della Costituente, con date e presidenti da dati.camera.it. Per ogni governo
          il livello di verifica è indicato campo per campo.
        </p>
      </PageHead>

      <DebtByGovernment />

      <section aria-labelledby="t-elenco" className="mt-16 md:mt-24">
        <h2 id="t-elenco" className="reveal text-[clamp(1.8rem,7vw,2.8rem)] leading-[1.05] font-extrabold">
          Tutti i governi, legislatura per legislatura
        </h2>

        <Card className="reveal mt-5 max-w-[46em]">
          <details className="group">
            <summary className="flex min-h-11 cursor-pointer list-none items-center justify-between gap-3 font-bold [&::-webkit-details-marker]:hidden">
              Come leggere il «debito nel mandato»
              <CaretRightIcon size={18} weight="bold" aria-hidden className="shrink-0 text-accent transition-transform group-open:rotate-90" />
            </summary>
            <ul className="mt-2 list-disc space-y-2 pl-5 text-[15.5px] text-ink-soft">
              <li>
                La cifra in alto è di quanto è cresciuto (o sceso) il debito pubblico fra l&apos;ultimo fine mese prima del giuramento e
                l&apos;ultimo fine mese prima della fine del governo. Fonte: Banca d&apos;Italia.
              </li>
              <li>
                È in euro dell&apos;epoca (le lire sono convertite al cambio fisso): 1 miliardo del 1960 non vale 1 miliardo di oggi, quindi
                questa cifra non serve a confrontare governi lontani nel tempo.
              </li>
              <li>
                Per confrontare usa la riga sotto, il debito in rapporto al PIL: a fine dicembre dell&apos;anno prima del giuramento e
                all&apos;ultima fine di dicembre che cade dentro il mandato. I governi che non arrivano a una fine di dicembre non ce
                l&apos;hanno. Dal 1995 il rapporto è il dato Eurostat; prima è un nostro calcolo (debito Banca d&apos;Italia diviso per il
                PIL).
              </li>
              <li>
                Il debito dipende anche dall&apos;economia, dai tassi e dalle decisioni dei governi precedenti: questi numeri non dicono di
                chi è il merito o la colpa. Il dettaglio è nella pagina di ogni governo.
              </li>
            </ul>
          </details>
        </Card>

        <div className="mt-10 space-y-12">
          {ordered.map((leg) => {
            const govs = governmentsOf(leg.id).toSorted((a, b) => b.ordine - a.ordine);
            return (
              <section key={leg.id} aria-labelledby={`leg-${leg.id}`} className="reveal">
                <div className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1 border-b-2 border-ink pb-2">
                  <h3 id={`leg-${leg.id}`} className="text-2xl font-extrabold">
                    {legislatureLabel(leg.id)}
                  </h3>
                  <p className="tabular text-sm text-ink-soft">
                    {formatDate(leg.inizio)} · {leg.fine ? formatDate(leg.fine) : "in corso"}
                  </p>
                </div>
                {govs.length === 0 ? (
                  <p className="py-4 text-ink-soft">Nessun governo collegato a questa legislatura nei dati.</p>
                ) : (
                  <ul className="mt-3 grid gap-2">
                    <li
                      aria-hidden
                      className="hidden px-5 text-[13px] font-semibold text-ink-faint md:grid md:grid-cols-[2fr_1.4fr_1fr_11.5rem_auto] md:gap-6"
                    >
                      <span>Governo</span>
                      <span>Maggioranza</span>
                      <span>Giuramento</span>
                      <span className="text-right">Debito nel mandato</span>
                      <span className="w-9" />
                    </li>
                    {govs.map((g) => (
                      <li
                        key={g.id}
                        className="relative grid grid-cols-[1fr_auto] gap-x-4 gap-y-2 rounded-card bg-paper-raised px-4 py-3.5 transition-colors hover:bg-paper-sunk md:grid-cols-[2fr_1.4fr_1fr_11.5rem_auto] md:items-center md:gap-6 md:px-5"
                      >
                        <Link href={`/governi/${g.id}`} className="font-bold after:absolute after:inset-0 after:rounded-card hover:text-accent">
                          {g.nome.replace(/^Governo\s+/, "")}
                          <span className="block text-[15px] font-normal text-ink-soft">{g.presidente}</span>
                        </Link>
                        <span className="justify-self-end md:order-last">
                          <LevelTag level={g.verifica.livello} />
                        </span>
                        <p className="col-span-2 text-[15px] text-ink-soft md:col-span-1">{g.maggioranza}</p>
                        <p className="tabular text-[15px]">
                          {formatDate(g.inizio)}
                          <span className="block text-ink-faint">{g.fine ? `${formatInt(governmentDurationDays(g))} giorni` : "in carica"}</span>
                        </p>
                        <DebtChange g={g} />
                      </li>
                    ))}
                  </ul>
                )}
              </section>
            );
          })}
        </div>
      </section>
    </Wrap>
  );
}

function DebtChange({ g }: { g: { inizio: string; fine: string | null } }) {
  const {
    debito: d,
    debitoPil: { prima, fine },
  } = governmentFinance(g);
  if (!d) return <span />;
  const pct = (n: number) => `${formatDecimal(n, 1)}%`;
  return (
    <div className="text-right text-[15px]">
      <p className="text-[13px] text-ink-faint md:hidden">Debito nel mandato</p>
      <p className="font-display tabular text-lg leading-tight font-bold">
        {d.variazione >= 0 ? "+" : "−"}
        {formatEuroMillions(Math.abs(d.variazione))}
        <span className="font-sans text-sm font-normal text-ink-faint">{d.fine.parziale ? " finora" : ""}</span>
      </p>
      <p className="tabular text-[13px] text-ink-faint">
        {prima && fine ? `${pct(prima.valore)} → ${pct(fine.valore)} del PIL` : "nessun dicembre nel mandato"}
      </p>
    </div>
  );
}
