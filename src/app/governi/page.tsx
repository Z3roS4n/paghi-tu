import type { Metadata } from "next";
import Link from "next/link";
import { VerificationBadge } from "@/components/verification-badge";
import { legislatures, governmentsOf } from "@/server/data";
import { governmentDurationDays } from "@/server/stats";
import { formatDate, formatDecimal, formatEuroMillions, formatInt } from "@/lib/format";
import { governmentFinance } from "@/server/finance";

export const metadata: Metadata = {
  title: "Governi",
  description: "Tutti i governi italiani dal 1945 a oggi, per legislatura, con date, maggioranze e fonti.",
};

function legislatureLabel(id: string) {
  return id === "AC" ? "Assemblea Costituente" : `${id} legislatura`;
}

export default function GovernmentsPage() {
  const ordered = legislatures.toSorted((a, b) => b.numero - a.numero);

  return (
    <div className="mx-auto max-w-6xl px-4 py-12 md:px-6 md:py-16">
      <h1 className="text-4xl font-semibold tracking-tight md:text-5xl">Governi</h1>
      <p className="mt-4 max-w-[62ch] text-lg text-ink-soft">
        Date di inizio e presidenti da dati.camera.it. Per ogni governo il livello di verifica è indicato campo per campo.
      </p>
      <div className="mt-6 max-w-[68ch] border-l-2 border-accent pl-4 text-sm text-ink-soft">
        <p className="font-medium text-ink">Come leggere la colonna «Debito nel mandato»</p>
        <ul className="mt-2 list-disc space-y-1 pl-5">
          <li>
            La cifra in alto è di quanto è cresciuto (o sceso) il debito pubblico fra l&apos;ultimo fine mese prima del
            giuramento e l&apos;ultimo fine mese prima della fine del governo. Fonte: Banca d&apos;Italia.
          </li>
          <li>
            È in euro dell&apos;epoca (le lire sono convertite al cambio fisso): 1 miliardo del 1960 non vale 1 miliardo di
            oggi, quindi questa cifra non serve a confrontare governi lontani nel tempo.
          </li>
          <li>
            Per confrontare usa la riga sotto, il debito in rapporto al PIL: alla fine dell&apos;anno prima del giuramento e
            all&apos;ultimo dicembre del mandato. I governi che non arrivano a un dicembre non ce l&apos;hanno.
          </li>
          <li>
            Il debito dipende anche dall&apos;economia, dai tassi e dalle decisioni dei governi precedenti: questi numeri non
            dicono di chi è il merito o la colpa. Il dettaglio è nella pagina di ogni governo.
          </li>
        </ul>
      </div>

      <div className="mt-12 space-y-14">
        {ordered.map((leg) => {
          const govs = governmentsOf(leg.id).toSorted((a, b) => b.ordine - a.ordine);
          return (
            <section key={leg.id} aria-labelledby={`leg-${leg.id}`}>
              <div className="flex flex-wrap items-baseline justify-between gap-2 border-b border-ink pb-2">
                <h2 id={`leg-${leg.id}`} className="text-xl font-semibold">
                  {legislatureLabel(leg.id)}
                </h2>
                <p className="tabular font-mono text-sm text-ink-soft">
                  {formatDate(leg.inizio)} · {leg.fine ? formatDate(leg.fine) : "in corso"}
                </p>
              </div>
              {govs.length === 0 ? (
                <p className="py-4 text-ink-soft">Nessun governo collegato a questa legislatura nei dati.</p>
              ) : (
                <ul className="divide-y divide-rule">
                  <li
                    aria-hidden
                    className="hidden py-2 text-xs text-ink-faint md:grid md:grid-cols-[2fr_1.4fr_1fr_11.5rem_auto] md:gap-6"
                  >
                    <span>Governo</span>
                    <span>Maggioranza</span>
                    <span>Giuramento</span>
                    <span className="text-right">Debito nel mandato</span>
                    <span className="w-[1.625rem]" />
                  </li>
                  {govs.map((g) => (
                    <li key={g.id} className="grid gap-2 py-4 md:grid-cols-[2fr_1.4fr_1fr_11.5rem_auto] md:items-center md:gap-6">
                      <Link href={`/governi/${g.id}`} className="font-medium hover:text-accent">
                        {g.nome.replace(/^Governo\s+/, "")}
                        <span className="block text-sm font-normal text-ink-soft">{g.presidente}</span>
                      </Link>
                      <p className="text-sm text-ink-soft">{g.maggioranza}</p>
                      <p className="tabular font-mono text-sm">
                        {formatDate(g.inizio)}
                        <span className="block text-ink-faint">
                          {g.fine ? `${formatInt(governmentDurationDays(g))} giorni` : "in carica"}
                        </span>
                      </p>
                      <DebtChange g={g} />
                      <VerificationBadge verifica={g.verifica} compact />
                    </li>
                  ))}
                </ul>
              )}
            </section>
          );
        })}
      </div>
    </div>
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
    <div className="text-sm md:text-right">
      <p className="text-xs text-ink-faint md:hidden">Debito nel mandato</p>
      <p className="tabular font-mono">
        {d.variazione >= 0 ? "+" : "−"}
        {formatEuroMillions(Math.abs(d.variazione))}
        <span className="text-ink-faint">{d.fine.parziale ? " finora" : ""}</span>
      </p>
      <p className="tabular font-mono text-xs text-ink-faint">
        {prima && fine ? `${pct(prima.valore)} → ${pct(fine.valore)} del PIL` : "nessun dicembre nel mandato"}
      </p>
    </div>
  );
}
