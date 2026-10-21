import type { Metadata } from "next";
import Link from "next/link";
import { VerificationBadge } from "@/components/verification-badge";
import { legislatures, governmentsOf } from "@/server/data";
import { governmentDurationDays } from "@/server/stats";
import { formatDate, formatEuroMillions, formatInt } from "@/lib/format";
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
      <p className="mt-3 max-w-[62ch] text-sm text-ink-soft">
        La colonna sul debito pubblico mostra di quanto è cambiato durante il mandato, in euro correnti (Banca d&apos;Italia).
        Gli importi di epoche lontane non sono confrontabili e il debito dipende anche da economia, tassi e decisioni
        precedenti: il dettaglio è nella pagina di ogni governo.
      </p>

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
                  {govs.map((g) => (
                    <li key={g.id} className="grid gap-2 py-4 md:grid-cols-[2fr_1.4fr_1fr_8rem_auto] md:items-center md:gap-6">
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
  const d = governmentFinance(g).debito;
  if (!d) return <span />;
  return (
    <p className="tabular font-mono text-sm md:text-right">
      {d.variazione >= 0 ? "+" : "−"}
      {formatEuroMillions(Math.abs(d.variazione))}
      <span className="block text-ink-faint">{d.fine.parziale ? "di debito, finora" : "di debito"}</span>
    </p>
  );
}
