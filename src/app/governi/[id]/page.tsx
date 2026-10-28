import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeftIcon, ArrowRightIcon } from "@phosphor-icons/react/ssr";
import { ChartFigure } from "@/components/chart-figure";
import { SourceLinks } from "@/components/source-links";
import { Card, GoLink, PageHead, Section, SourceNote, Tile, Wrap } from "@/components/ui";
import { VerificationBadge } from "@/components/verification-badge";
import { budgetLawsProposedBy, finance, getGovernment, getLegislature, governments, legalActsOf, legalActsStatus, measuresOf } from "@/server/data";
import { governmentDurationDays } from "@/server/stats";
import { formatDate, formatDecimal, formatEuroMillions, formatInt, formatMonth } from "@/lib/format";
import { LEGAL_ACT_TYPE } from "@/lib/domain/acts";
import { fractionalYear } from "@/lib/domain/finance";
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
  const acts = legalActsOf(g.id);
  const prev = governments.find((x) => x.ordine === g.ordine - 1);
  const next = governments.find((x) => x.ordine === g.ordine + 1);
  const money = governmentFinance(g);

  return (
    <Wrap>
      <Link href="/governi" className="mt-4 inline-flex min-h-11 items-center gap-1.5 text-[15px] font-semibold text-ink-soft hover:text-ink">
        <ArrowLeftIcon size={16} weight="bold" aria-hidden />
        Tutti i governi
      </Link>
      <PageHead title={g.nome}>
        <p>Presidente del Consiglio: {g.presidente}</p>
      </PageHead>

      <dl className="mt-6 grid grid-cols-2 gap-2.5 lg:grid-cols-4">
        {[
          ["Inizio", formatDate(g.inizio)],
          ["Fine", g.fine ? formatDate(g.fine) : "In carica"],
          ["Durata", `${formatInt(governmentDurationDays(g))} giorni${g.fine ? "" : " finora"}`],
          ["Legislatura", leg ? (leg.id === "AC" ? "Costituente" : leg.id) : g.legislaturaId],
        ].map(([k, v]) => (
          <div key={k} className="reveal min-w-0 rounded-card bg-paper-raised px-3.5 pt-3.5 pb-4 md:px-5">
            <dt className="text-sm font-semibold text-ink-soft">{k}</dt>
            <dd className="font-display tabular mt-0.5 text-[clamp(1.2rem,5vw,1.6rem)] leading-tight font-bold tracking-[-0.02em]">{v}</dd>
          </div>
        ))}
      </dl>

      <PublicAccounts g={g} money={money} />

      <section className="mt-16 grid gap-3.5 md:mt-24 lg:grid-cols-[1.4fr_1fr] lg:items-start">
        <div className="grid gap-3.5">
          <Card className="reveal" as="section">
            <h2 className="text-2xl font-extrabold">Maggioranza</h2>
            <p className="mt-2 max-w-[62ch] text-ink-soft">{g.maggioranza}</p>
            <p className="mt-1.5 text-sm text-ink-faint">Tipo: {g.tipo}</p>
          </Card>

          <Card className="reveal" as="section">
            <h2 className="text-2xl font-extrabold">Atti di bilancio presentati</h2>
            {laws.length === 0 ? (
              <p className="mt-2 text-ink-soft">Nessun atto di bilancio attribuito a questo governo come proponente nei dati verificati finora.</p>
            ) : (
              <ul className="mt-3 divide-y divide-rule border-t border-rule">
                {laws.map((l) => (
                  <li key={l.id} className="flex flex-wrap items-baseline justify-between gap-x-3 gap-y-1 py-3">
                    <Link href={`/leggi-di-bilancio#${l.id}`} className="hover:text-accent">
                      <span className="font-display tabular font-bold">{l.annoEsercizio}</span>{" "}
                      <span className="text-ink-soft">{l.tipoAtto}</span>
                      <span className="block text-[15px]">{l.estremi}</span>
                    </Link>
                    {l.governoProponenteAttribuzione === "inferita" ? (
                      <span className="text-[13px] font-semibold text-level-v2">attribuzione dedotta dalla data</span>
                    ) : null}
                  </li>
                ))}
              </ul>
            )}
          </Card>

          {linkedMeasures.length > 0 ? (
            <Card className="reveal" as="section">
              <h2 className="text-2xl font-extrabold">Misure con costo previsto e consuntivo</h2>
              <ul className="mt-3 divide-y divide-rule border-t border-rule">
                {linkedMeasures.map((m) => (
                  <li key={m.id}>
                    <Link href={`/misure#${m.id}`} className="group flex min-h-12 items-center justify-between gap-3 py-2.5 hover:text-accent">
                      <span>
                        <span className="font-bold">{m.titolo}</span>
                        <span className="block text-[15px] text-ink-soft">{m.governoTesto}</span>
                      </span>
                      <ArrowRightIcon size={18} weight="bold" aria-hidden className="shrink-0 text-accent transition-transform group-hover:translate-x-0.5" />
                    </Link>
                  </li>
                ))}
              </ul>
            </Card>
          ) : null}

          {acts.length > 0 ? (
            <Card className="reveal" as="section">
              <h2 className="text-2xl font-extrabold">Leggi e decreti con importi</h2>
              <p className="mt-1 text-[15px] text-ink-soft">
                {acts.length} atti nel registro, Gazzetta Ufficiale letta dal {formatDate(legalActsStatus.dal)} al {formatDate(legalActsStatus.al)}.
              </p>
              <ul className="mt-3 divide-y divide-rule border-t border-rule">
                {acts.slice(0, 8).map((a) => (
                  <li key={a.id}>
                    <Link href={`/atti#${a.id}`} className="group flex min-h-12 items-center justify-between gap-3 py-2.5 hover:text-accent">
                      <span>
                        <span className="font-bold">{a.titolo}</span>
                        <span className="block text-[15px] text-ink-soft">
                          {LEGAL_ACT_TYPE[a.tipo]} n. {a.numero} del {formatDate(a.data)}
                        </span>
                      </span>
                      <ArrowRightIcon size={18} weight="bold" aria-hidden className="shrink-0 text-accent transition-transform group-hover:translate-x-0.5" />
                    </Link>
                  </li>
                ))}
              </ul>
              {acts.length > 8 ? <GoLink href="/atti">Tutti gli atti</GoLink> : null}
            </Card>
          ) : null}
        </div>

        <aside className="grid gap-3.5">
          <Card className="reveal">
            <h2 className="font-sans text-[15.5px] font-bold tracking-normal">Verifica</h2>
            <div className="mt-1">
              <VerificationBadge verifica={g.verifica} />
            </div>
          </Card>
          <Card className="reveal">
            <h2 className="font-sans text-[15.5px] font-bold tracking-normal">Fonti</h2>
            <div className="mt-3">
              <SourceLinks fonti={g.fonti} />
            </div>
          </Card>
        </aside>
      </section>

      <nav aria-label="Governi adiacenti" className="mt-12 grid grid-cols-2 gap-2.5">
        {prev ? (
          <Link href={`/governi/${prev.id}`} className="group flex min-h-14 flex-col justify-center rounded-card bg-paper-raised px-4 py-3 hover:bg-paper-sunk">
            <span className="inline-flex items-center gap-1 text-[13px] text-ink-faint">
              <ArrowLeftIcon size={14} weight="bold" aria-hidden />
              Precedente
            </span>
            <span className="font-bold group-hover:text-accent">{prev.nome}</span>
          </Link>
        ) : (
          <span />
        )}
        {next ? (
          <Link
            href={`/governi/${next.id}`}
            className="group flex min-h-14 flex-col items-end justify-center rounded-card bg-paper-raised px-4 py-3 text-right hover:bg-paper-sunk"
          >
            <span className="inline-flex items-center gap-1 text-[13px] text-ink-faint">
              Successivo
              <ArrowRightIcon size={14} weight="bold" aria-hidden />
            </span>
            <span className="font-bold group-hover:text-accent">{next.nome}</span>
          </Link>
        ) : (
          <span />
        )}
      </nav>
    </Wrap>
  );
}

const monthLabel = (m: string) => `fine ${formatMonth(m)}`;
const pct = (n: number) => `${formatDecimal(n, 1)}%`;

function PublicAccounts({
  g,
  money,
}: {
  g: { nome: string; inizio: string; fine: string | null };
  money: ReturnType<typeof governmentFinance>;
}) {
  const d = money.debito;
  if (!d) return null;
  const ratioNote = (r: { calcolatoDa: "fonte" | "paghi_tu" } | null) => (r?.calcolatoDa === "paghi_tu" ? " (calcolo Paghi Tu)" : "");
  const lastEstimate = debtGdpSeries.findLastIndex((p) => p.calcolatoDa === "paghi_tu");
  const band = {
    name: g.nome.replace(/^Governo\s+/, ""),
    from: fractionalYear(g.inizio),
    to: fractionalYear(g.fine ?? finance.scaricato.slice(0, 10)),
  };

  return (
    <Section
      id="conti"
      title="I conti pubblici durante il governo"
      intro={
        <p>
          Il debito cambia anche per decisioni prese prima, per l&apos;andamento dell&apos;economia e per i tassi di interesse. Queste cifre
          descrivono cosa è successo durante il mandato; non dicono quanta parte dipende dal governo.
        </p>
      }
    >
      <div className="mt-6 grid grid-cols-2 gap-2.5 md:grid-cols-3">
        <Tile label="Debito all'insediamento" value={formatEuroMillions(d.inizio.valore)} note={monthLabel(d.inizio.mese)} />
        <Tile
          label={d.fine.parziale ? "Debito all'ultimo dato" : "Debito alla fine"}
          value={formatEuroMillions(d.fine.valore)}
          note={`${monthLabel(d.fine.mese)}${isProvisionalDebt(d.fine.mese) ? ", dato provvisorio" : ""}`}
        />
        <Tile
          dark
          className="col-span-2 md:col-span-1"
          label={`Variazione ${d.fine.parziale ? "finora" : "nel mandato"}`}
          value={`${d.variazione >= 0 ? "+" : "−"}${formatEuroMillions(Math.abs(d.variazione))}`}
          note="euro correnti, non confrontabili fra epoche lontane"
        />
      </div>
      {money.debitoPil.prima && money.debitoPil.fine ? (
        <p className="mt-4 text-ink-soft">
          Debito in rapporto al PIL: <b className="text-ink">{pct(money.debitoPil.prima.valore)}</b> a fine {money.debitoPil.prima.anno}
          {ratioNote(money.debitoPil.prima)}, <b className="text-ink">{pct(money.debitoPil.fine.valore)}</b> a fine{" "}
          {money.debitoPil.fine.anno}
          {ratioNote(money.debitoPil.fine)}.
        </p>
      ) : null}

      <div className="mt-6 grid gap-3.5 lg:grid-cols-2 lg:items-start">
        <ChartFigure
          className="reveal"
          title="Debito pubblico in % del PIL, a fine anno"
          note="La fascia colorata è il periodo del governo. Il tratteggio, prima del 1995, è un nostro calcolo."
          chart={{
            label: "Debito pubblico in % del PIL, a fine anno",
            years: debtGdpSeries.map((p) => p.anno),
            unit: "pct",
            yMin: 0,
            series: [
              {
                id: "debito",
                name: "Debito",
                tone: "accent",
                values: debtGdpSeries.map((p) => p.valore),
                estimatedUntil: lastEstimate >= 0 ? lastEstimate : undefined,
              },
            ],
            bands: [band],
            pinBands: true,
          }}
          source="Banca d'Italia, tavola TCCE0325; Eurostat gov_10dd_edpt1. Prima del 1995 calcolo Paghi Tu sul PIL della nostra serie."
        />

        {money.anni.length > 0 ? (
          <Card className="reveal">
            <h3 className="font-sans text-[15.5px] font-bold tracking-normal">Anno per anno, in % del PIL</h3>
            <p className="mt-1 text-sm text-ink-soft">
              Anni in cui il governo è stato in carica, anche solo in parte. La manovra di un anno è approvata nell&apos;autunno precedente,
              spesso da un altro governo.
            </p>
            <table className="mt-3 w-full text-left text-[15px]">
              <thead className="text-[13px] text-ink-faint">
                <tr className="border-b border-rule">
                  <th scope="col" className="py-2 font-semibold">
                    Anno
                  </th>
                  <th scope="col" className="py-2 text-right font-semibold">
                    Spesa
                  </th>
                  <th scope="col" className="py-2 text-right font-semibold">
                    Entrate
                  </th>
                  <th scope="col" className="py-2 text-right font-semibold">
                    Saldo
                  </th>
                  <th scope="col" className="py-2 text-right font-semibold">
                    Interessi
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-rule">
                {money.anni.map((a) => (
                  <tr key={a.anno}>
                    <td className="tabular py-2 font-bold">{a.anno}</td>
                    <td className="tabular py-2 text-right">{pct(a.pil.spesa)}</td>
                    <td className="tabular py-2 text-right">{pct(a.pil.entrate)}</td>
                    <td className="tabular py-2 text-right">{pct(a.pil.saldo)}</td>
                    <td className="tabular py-2 text-right">{pct(a.pil.interessi)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
            <SourceNote>Fonte: Eurostat gov_10a_main. Dati annuali disponibili dal 1995.</SourceNote>
          </Card>
        ) : null}
      </div>
      <SourceNote>
        Debito: Banca d&apos;Italia, debito lordo delle amministrazioni pubbliche, tavola TCCE0325. Valori di fine mese: l&apos;ultimo prima
        dell&apos;insediamento e l&apos;ultimo prima della fine del governo, così nessun mese è contato due volte.{" "}
        <Link href="/spesa" className="font-semibold text-accent underline underline-offset-2">
          Tutti i conti pubblici
        </Link>
      </SourceNote>
    </Section>
  );
}
