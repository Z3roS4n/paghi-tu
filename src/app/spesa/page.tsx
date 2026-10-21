import type { Metadata } from "next";
import Link from "next/link";
import { CheckCircleIcon, WarningCircleIcon } from "@phosphor-icons/react/ssr";
import { ChartFigure } from "@/components/chart-figure";
import { AccountsTimeline, EuropeBlock, SemesterCard, WhatChanged } from "@/components/sections/finance";
import { Card, PageHead, Section, SourceNote, Tile, Wrap } from "@/components/ui";
import { VerificationBadge } from "@/components/verification-badge";
import { formatDecimal, formatInt, formatMonth } from "@/lib/format";
import { finance } from "@/server/data";
import { accountsSeries, debtGdpSeries, headline, latestReceipt, seriesBreaks } from "@/server/finance";

export const metadata: Metadata = {
  title: "Quanto spendiamo",
  description:
    "Quanto spendono ogni anno Stato, regioni, comuni ed enti di previdenza per ogni residente, dove vanno i soldi e quanto pesa il debito. Dati Eurostat e Banca d'Italia.",
};

const euro = (n: number) => `${formatInt(n)} €`;
const pct = (n: number) => `${formatDecimal(n, 1)}%`;

export default function SpendingPage() {
  const h = headline();
  const r = latestReceipt();
  const max = r.righe[0].euro;
  const saldo = accountsSeries("saldo");
  const lastEstimate = debtGdpSeries.findLastIndex((d) => d.calcolatoDa === "paghi_tu");

  return (
    <Wrap>
      <PageHead kicker={`Conti delle amministrazioni pubbliche, ${h.anno}`} title="Quanto spende il settore pubblico per ognuno di noi">
        <p>
          <b>{euro(h.spesa)}</b> nel {h.anno} per ogni persona residente in Italia, neonati compresi: {euro(h.spesa / 365)} al giorno. È il{" "}
          {pct(h.pil.spesa)} del PIL, il valore di quanto il Paese ha prodotto nell&apos;anno: un rapporto, non una fetta del PIL, perché
          buona parte della spesa sono pensioni, interessi e altri trasferimenti.
        </p>
      </PageHead>

      <div className="mt-6 grid grid-cols-2 gap-2.5 md:grid-cols-3 lg:grid-cols-[1fr_1fr_1fr_1.5fr]">
        <Tile label={`Entrate ${h.anno}`} value={euro(h.entrate)} note="a testa: imposte, contributi e altre entrate" />
        <Tile label={`Disavanzo ${h.anno}`} value={euro(-h.saldo)} note="la spesa oltre le entrate, finanziata soprattutto con nuovo debito" />
        <Tile className="col-span-2 md:col-span-1" label={`Interessi sul debito ${h.anno}`} value={euro(h.interessi)} note="per residente" />
        <Tile
          dark
          className="col-span-2 md:col-span-3 lg:col-span-1"
          label={`Debito pubblico, ${formatMonth(h.debito.mese)}`}
          value={`${euro(h.debito.perResidente)} a testa`}
          note={`${formatInt(h.debito.totale / 1000)} miliardi in tutto${h.debito.provvisorio ? ", dato provvisorio" : ""}, diviso per i residenti al 1° gennaio ${h.debito.popolazioneAnno}`}
        />
      </div>
      <SourceNote className="max-w-[70ch]">
        Comprende Stato, regioni, comuni, INPS e gli altri enti che ISTAT classifica fra le amministrazioni pubbliche; restano fuori le
        imprese pubbliche. Le cifre per residente dividono il totale dell&apos;anno per la popolazione media ({formatDecimal(h.popolazione / 1e6, 1)}{" "}
        milioni nel {h.anno}). Sono medie, non quello che paga una persona.
      </SourceNote>

      <SemesterCard />

      <Section
        id="t-dove"
        title="Dove vanno i soldi"
        intro={
          <p>
            Spesa per residente nel {r.anno}, divisa per funzione secondo la classificazione europea COFOG. Il dettaglio per funzione esce un
            anno dopo il totale: per questo l&apos;ultimo anno è il {r.anno}.
          </p>
        }
      >
        <Card className="reveal mt-6">
          <ul className="reveal-bars">
            {r.righe.map((x) => (
              <li key={x.id} className="grid grid-cols-[1fr_auto] items-center gap-x-4 gap-y-1.5 border-b border-rule py-2.5 md:grid-cols-[19rem_1fr_6.5rem_4rem]">
                <span className="text-[15.5px] font-semibold">{x.etichetta}</span>
                <span className="col-span-2 row-start-2 md:col-span-1 md:row-start-auto">
                  <span aria-hidden className="bar block h-3 rounded-r-ctl bg-accent" style={{ width: `${Math.max((x.euro / max) * 100, 0.5)}%` }} />
                </span>
                <span className="font-display tabular text-right text-lg font-bold">{euro(x.euro)}</span>
                <span className="tabular hidden text-right text-sm text-ink-faint md:block">{pct(x.quota * 100)}</span>
              </li>
            ))}
            <li className="grid grid-cols-[1fr_auto] gap-x-4 pt-3 text-lg font-extrabold md:grid-cols-[19rem_1fr_6.5rem_4rem]">
              <span>Totale</span>
              <span className="hidden md:block" />
              <span className="font-display tabular text-right">{euro(r.totaleEuro)}</span>
              <span className="hidden md:block" />
            </li>
          </ul>
          <SourceNote>
            Fonte: Eurostat, gov_10a_exp. «Vecchiaia e superstiti» sono le voci COFOG 10.2 e 10.3: pensioni di vecchiaia, anticipate e ai
            superstiti, più assistenza e servizi agli anziani. «Altra protezione sociale» comprende malattia e invalidità (con le pensioni di
            invalidità), famiglia e figli, disoccupazione, casa, esclusione sociale e altre spese non classificate. La riga sul debito è la
            voce COFOG 01.7, operazioni relative al debito pubblico: interessi e oneri di emissione.
          </SourceNote>
        </Card>
      </Section>

      <AccountsTimeline />
      <WhatChanged />

      <Section
        id="t-saldo"
        title="Il saldo, anno per anno"
        intro={
          <p>
            Sotto lo zero le spese superano le entrate. La differenza si finanzia soprattutto con nuovo debito, ma la variazione del debito
            non coincide con il disavanzo: contano anche la liquidità del Tesoro e i pagamenti di cassa.
          </p>
        }
      >
        <ChartFigure
          className="reveal mt-6"
          title="Saldo dei conti pubblici in % del PIL"
          chart={{
            label: "Saldo dei conti pubblici in % del PIL",
            years: saldo.map((p) => p.anno),
            unit: "pct",
            breakYear: seriesBreaks[0],
            series: [{ id: "saldo", name: "Saldo", tone: "accent", values: saldo.map((p) => p.valore) }],
            height: 260,
          }}
          source="Eurostat gov_10a_main, indebitamento netto (B9)."
        />
        {seriesBreaks.length > 0 ? (
          <SourceNote className="max-w-[70ch]">
            Dal {seriesBreaks.join(", ")} i dati incorporano la revisione dei conti nazionali ISTAT più recente; gli anni precedenti non sono
            ancora stati ricostruiti. Fra il {seriesBreaks[0] - 1} e il {seriesBreaks[0]} c&apos;è quindi una rottura di serie (Eurostat la
            segnala con il flag «b»): il confronto fra i due periodi va letto con cautela.
          </SourceNote>
        ) : null}
      </Section>

      <EuropeBlock />

      <Section id="t-debito-storia" title={`Il debito dal ${debtGdpSeries[0].anno}`}>
        <ChartFigure
          className="reveal mt-6"
          title="Debito pubblico in % del PIL, a fine anno"
          note="Dal 1995 il valore è quello di Eurostat. Prima lo calcoliamo noi (tratteggio): debito di dicembre secondo Banca d'Italia diviso per il PIL della nostra serie storica."
          chart={{
            label: "Debito pubblico in % del PIL, a fine anno",
            years: debtGdpSeries.map((d) => d.anno),
            unit: "pct",
            yMin: 0,
            series: [
              {
                id: "debito",
                name: "Debito",
                tone: "accent",
                values: debtGdpSeries.map((d) => d.valore),
                estimatedUntil: lastEstimate >= 0 ? lastEstimate : undefined,
              },
            ],
            height: 320,
          }}
          source="Banca d'Italia, tavola TCCE0325; Eurostat gov_10dd_edpt1; PIL: Banca d'Italia NA150 e ISTAT."
        />
        <SourceNote>
          Per vedere il governo in carica anno per anno: <Link href="/governi" className="font-semibold text-accent underline underline-offset-2">Governi</Link>.
        </SourceNote>
      </Section>

      <section aria-labelledby="t-fonti" className="mt-16 grid gap-3.5 md:mt-24 lg:grid-cols-[1.4fr_1fr] lg:items-start">
        <Card>
          <h2 id="t-fonti" className="text-[1.7rem] leading-tight font-extrabold">
            Da dove vengono questi numeri
          </h2>
          <ul className="mt-4 grid gap-3 text-[15px]">
            {finance.fonti.map((f) => (
              <li key={f.url}>
                <a href={f.url} target="_blank" rel="noopener noreferrer" className="font-semibold underline underline-offset-2 hover:text-accent">
                  {f.etichetta}
                </a>
                <span className="block text-sm text-ink-faint">Aggiornamento della fonte: {f.aggiornamentoFonte}</span>
              </li>
            ))}
          </ul>
          <h3 className="mt-8 text-xl font-bold">Controlli automatici</h3>
          <p className="mt-1 text-[15px] text-ink-soft">
            A ogni aggiornamento i dati vengono incrociati fra fonti diverse. Se un controllo non passa, l&apos;aggiornamento non va online.
          </p>
          <ul className="mt-3 grid gap-2.5 text-[15px]">
            {finance.controlli.map((c) => (
              <li key={c.id} className="grid grid-cols-[auto_1fr] gap-x-2.5">
                {c.superato ? (
                  <CheckCircleIcon size={20} weight="fill" className="mt-0.5 text-level-v1" aria-label="superato" />
                ) : (
                  <WarningCircleIcon size={20} weight="fill" className="mt-0.5 text-level-nv" aria-label="non superato" />
                )}
                <span>
                  {c.descrizione}
                  <span className="block text-sm text-ink-faint">{c.dettaglio}</span>
                </span>
              </li>
            ))}
          </ul>
        </Card>
        <Card>
          <VerificationBadge verifica={finance.verifica} />
          <p className="mt-2 text-[15px] text-ink-soft">
            Scaricati il {finance.scaricato.slice(8, 10)}/{finance.scaricato.slice(5, 7)}/{finance.scaricato.slice(0, 4)}. Il metodo è
            descritto in{" "}
            <Link href="/metodo" className="font-semibold text-accent underline underline-offset-2">
              Metodo
            </Link>
            .
          </p>
        </Card>
      </section>
    </Wrap>
  );
}
