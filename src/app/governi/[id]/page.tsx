import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { SourceLinks } from "@/components/source-links";
import { VerificationBadge } from "@/components/verification-badge";
import { budgetLawsProposedBy, getGovernment, getLegislature, governments, measuresOf } from "@/server/data";
import { governmentDurationDays } from "@/server/stats";
import { formatDate, formatInt } from "@/lib/format";

export function generateStaticParams() {
  return governments.map((g) => ({ id: g.id }));
}

export async function generateMetadata({ params }: PageProps<"/governi/[id]">): Promise<Metadata> {
  const g = getGovernment((await params).id);
  return g ? { title: g.nome, description: `${g.nome}: date, maggioranza, leggi di bilancio presentate e fonti.` } : {};
}

export default async function GovernmentPage({ params }: PageProps<"/governi/[id]">) {
  const g = getGovernment((await params).id);
  if (!g) notFound();
  const leg = getLegislature(g.legislaturaId);
  const laws = budgetLawsProposedBy(g.id).toSorted((a, b) => a.annoInizio - b.annoInizio);
  const linkedMeasures = measuresOf(g.id);
  const prev = governments.find((x) => x.ordine === g.ordine - 1);
  const next = governments.find((x) => x.ordine === g.ordine + 1);

  return (
    <article className="mx-auto max-w-6xl px-4 py-12 md:px-6 md:py-16">
      <Link href="/governi" className="text-sm text-ink-soft hover:text-ink">
        Tutti i governi
      </Link>
      <h1 className="mt-4 text-4xl font-semibold tracking-tight md:text-5xl">{g.nome}</h1>
      <p className="mt-3 text-lg text-ink-soft">Presidente del Consiglio: {g.presidente}</p>

      <dl className="mt-10 grid gap-px border border-rule bg-rule sm:grid-cols-2 lg:grid-cols-4">
        {[
          ["Inizio", formatDate(g.inizio)],
          ["Fine", g.fine ? formatDate(g.fine) : "In carica"],
          ["Durata", `${formatInt(governmentDurationDays(g))} giorni${g.fine ? "" : " finora"}`],
          ["Legislatura", leg ? (leg.id === "AC" ? "Costituente" : leg.id) : g.legislaturaId],
        ].map(([k, v]) => (
          <div key={k} className="bg-paper-raised p-5">
            <dt className="text-sm text-ink-soft">{k}</dt>
            <dd className="tabular mt-1 font-mono text-lg">{v}</dd>
          </div>
        ))}
      </dl>

      <section className="mt-12 grid gap-10 md:grid-cols-[1.4fr_1fr]">
        <div>
          <h2 className="text-xl font-semibold">Maggioranza</h2>
          <p className="mt-3 max-w-[62ch] text-ink-soft">{g.maggioranza}</p>
          <p className="mt-2 text-sm text-ink-faint">Tipo: {g.tipo}</p>

          <h2 className="mt-12 text-xl font-semibold">Atti di bilancio presentati</h2>
          {laws.length === 0 ? (
            <p className="mt-3 text-ink-soft">
              Nessun atto di bilancio attribuito a questo governo come proponente nei dati verificati finora.
            </p>
          ) : (
            <ul className="mt-4 divide-y divide-rule border-y border-rule">
              {laws.map((l) => (
                <li key={l.id} className="flex flex-wrap items-baseline justify-between gap-3 py-3">
                  <span>
                    <span className="font-mono">{l.annoEsercizio}</span>{" "}
                    <span className="text-ink-soft">{l.tipoAtto}</span>
                    <span className="block text-sm">{l.estremi}</span>
                  </span>
                  {l.governoProponenteAttribuzione === "inferita" ? (
                    <span className="text-xs text-level-v2">attribuzione dedotta dalla data</span>
                  ) : null}
                </li>
              ))}
            </ul>
          )}

          {linkedMeasures.length > 0 ? (
            <>
              <h2 className="mt-12 text-xl font-semibold">Misure con costo previsto e consuntivo</h2>
              <ul className="mt-4 divide-y divide-rule border-y border-rule">
                {linkedMeasures.map((m) => (
                  <li key={m.id} className="py-3">
                    <Link href={`/misure#${m.id}`} className="hover:text-accent">
                      {m.titolo}
                    </Link>
                    <span className="block text-sm text-ink-soft">{m.governoTesto}</span>
                  </li>
                ))}
              </ul>
            </>
          ) : null}
        </div>

        <aside className="space-y-8">
          <div>
            <h2 className="text-sm font-semibold">Verifica</h2>
            <div className="mt-3">
              <VerificationBadge verifica={g.verifica} />
            </div>
          </div>
          <div>
            <h2 className="text-sm font-semibold">Fonti</h2>
            <div className="mt-3">
              <SourceLinks fonti={g.fonti} />
            </div>
          </div>
        </aside>
      </section>

      <nav aria-label="Governi adiacenti" className="mt-16 flex justify-between gap-4 border-t border-rule pt-6 text-sm">
        {prev ? <Link href={`/governi/${prev.id}`} className="hover:text-accent">{prev.nome}</Link> : <span />}
        {next ? <Link href={`/governi/${next.id}`} className="text-right hover:text-accent">{next.nome}</Link> : <span />}
      </nav>
    </article>
  );
}
