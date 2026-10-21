import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ChartFigure } from "@/components/chart-figure";
import { SourceLinks } from "@/components/source-links";
import { VerificationBadge } from "@/components/verification-badge";
import { budgetLawsProposedBy, getGovernment, getLegislature, governments, measuresOf } from "@/server/data";
import { governmentDurationDays } from "@/server/stats";
import { formatDate, formatDecimal, formatEuroMillions, formatInt, formatMonth } from "@/lib/format";
import { debtGdpSeries, governmentFinance, isProvisionalDebt } from "@/server/finance";

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
  const money = governmentFinance(g);

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

      <PublicAccounts g={g} money={money} />

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

const monthLabel = (m: string) => `fine ${formatMonth(m)}`;
const pct = (n: number) => `${formatDecimal(n, 1)}%`;

function PublicAccounts({
  g,
  money,
}: {
  g: { inizio: string; fine: string | null };
  money: ReturnType<typeof governmentFinance>;
}) {
  const d = money.debito;
  if (!d) return null;
  const from = Number(g.inizio.slice(0, 4)) + (Number(g.inizio.slice(5, 7)) - 1) / 12;
  const to = g.fine ? Number(g.fine.slice(0, 4)) + (Number(g.fine.slice(5, 7)) - 1) / 12 : 9999;
  const ratioNote = (r: { calcolatoDa: "fonte" | "paghi_tu" } | null) => (r?.calcolatoDa === "paghi_tu" ? " (calcolo Paghi Tu)" : "");
  return (
    <section aria-labelledby="conti" className="mt-12 border-t border-rule pt-10">
      <h2 id="conti" className="text-xl font-semibold">I conti pubblici durante il governo</h2>
      <p className="mt-2 max-w-[70ch] text-sm text-ink-soft">
        Il debito cambia anche per decisioni prese prima, per l&apos;andamento dell&apos;economia e per i tassi di interesse. Queste
        cifre descrivono cosa è successo durante il mandato; non dicono quanta parte dipende dal governo.
      </p>
      <dl className="mt-6 grid gap-px border border-rule bg-rule sm:grid-cols-3">
        <div className="bg-paper-raised p-5">
          <dt className="text-sm text-ink-soft">Debito all&apos;insediamento</dt>
          <dd className="mt-1 text-2xl font-semibold">{formatEuroMillions(d.inizio.valore)}</dd>
          <dd className="text-sm text-ink-faint">{monthLabel(d.inizio.mese)}</dd>
        </div>
        <div className="bg-paper-raised p-5">
          <dt className="text-sm text-ink-soft">{d.fine.parziale ? "Debito all'ultimo dato" : "Debito alla fine"}</dt>
          <dd className="mt-1 text-2xl font-semibold">{formatEuroMillions(d.fine.valore)}</dd>
          <dd className="text-sm text-ink-faint">
            {monthLabel(d.fine.mese)}
            {isProvisionalDebt(d.fine.mese) ? ", dato provvisorio" : ""}
          </dd>
        </div>
        <div className="bg-paper-raised p-5">
          <dt className="text-sm text-ink-soft">Variazione {d.fine.parziale ? "finora" : "nel mandato"}</dt>
          <dd className="mt-1 text-2xl font-semibold">
            {d.variazione >= 0 ? "+" : "−"}
            {formatEuroMillions(Math.abs(d.variazione))}
          </dd>
          <dd className="text-sm text-ink-faint">euro correnti, non confrontabili fra epoche lontane</dd>
        </div>
      </dl>
      {money.debitoPil.prima && money.debitoPil.fine ? (
        <p className="mt-4 text-sm text-ink-soft">
          Debito in rapporto al PIL: {pct(money.debitoPil.prima.valore)} a fine {money.debitoPil.prima.anno}
          {ratioNote(money.debitoPil.prima)}, {pct(money.debitoPil.fine.valore)} a fine {money.debitoPil.fine.anno}
          {ratioNote(money.debitoPil.fine)}.
        </p>
      ) : null}

      {money.anni.length > 0 ? (
        <div className="mt-8 overflow-x-auto">
          <table className="w-full min-w-[28rem] text-left text-sm">
            <caption className="mb-2 text-left text-ink-soft">
              Anni in cui il governo è stato in carica, anche solo in parte. La manovra di un anno è approvata
              nell&apos;autunno precedente, spesso da un altro governo.
            </caption>
            <thead className="text-ink-faint">
              <tr className="border-b border-rule">
                <th scope="col" className="py-2 font-normal">Anno</th>
                <th scope="col" className="py-2 text-right font-normal">Spesa, % PIL</th>
                <th scope="col" className="py-2 text-right font-normal">Entrate, % PIL</th>
                <th scope="col" className="py-2 text-right font-normal">Saldo, % PIL</th>
                <th scope="col" className="py-2 text-right font-normal">Interessi, % PIL</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-rule">
              {money.anni.map((a) => (
                <tr key={a.anno}>
                  <td className="tabular py-2">{a.anno}</td>
                  <td className="tabular py-2 text-right">{pct(a.pil.spesa)}</td>
                  <td className="tabular py-2 text-right">{pct(a.pil.entrate)}</td>
                  <td className="tabular py-2 text-right">{pct(a.pil.saldo)}</td>
                  <td className="tabular py-2 text-right">{pct(a.pil.interessi)}</td>
                </tr>
              ))}
            </tbody>
          </table>
          <p className="mt-2 text-xs text-ink-faint">Fonte: Eurostat gov_10a_main. Dati annuali disponibili dal 1995.</p>
        </div>
      ) : null}

      <div className="mt-10">
        <ChartFigure
          title="Debito pubblico in % del PIL, a fine anno"
          note="La fascia grigia è il periodo del governo."
          source="Banca d'Italia, tavola TCCE0325; Eurostat gov_10dd_edpt1. Prima del 1995 calcolo Paghi Tu sul PIL della nostra serie."
          unit="pct"
          highlight={{ from, to, label: "in carica" }}
          points={debtGdpSeries.map((p) => ({
            x: p.anno,
            label: `${p.anno}${p.calcolatoDa === "paghi_tu" ? " (calcolo Paghi Tu)" : ""}`,
            value: p.valore,
            display: pct(p.valore),
          }))}
        />
      </div>
      <p className="mt-4 text-xs text-ink-faint">
        Debito: Banca d&apos;Italia, debito lordo delle amministrazioni pubbliche, tavola TCCE0325. Valori di fine mese: l&apos;ultimo
        prima dell&apos;insediamento e l&apos;ultimo prima della fine del governo, così nessun mese è contato due volte. <Link href="/spesa" className="underline underline-offset-2">Tutti i conti pubblici</Link>
      </p>
    </section>
  );
}
