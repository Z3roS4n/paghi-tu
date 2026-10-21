import Image from "next/image";
import { CalendarCheckIcon } from "@phosphor-icons/react/ssr";
import { ChartFigure } from "@/components/chart-figure";
import { DivergingBars, HBars, PairBars, ShiftList, Sparkline } from "@/components/charts/bars";
import { EuCompare } from "@/components/charts/eu-compare";
import { GovernmentDebt } from "@/components/charts/government-debt";
import { WaffleStory, type ReceiptLine, type WaffleStep } from "@/components/story/waffle-story";
import { Card, GoLink, Legend, Section, SourceNote, Tag } from "@/components/ui";
import { formatDecimal, formatInt, formatMonth } from "@/lib/format";
import {
  accountsOverTime,
  debtGdpSeries,
  debtByGovernment,
  euComparison,
  euFunctionRows,
  functionShift,
  interestShareSeries,
  measureDeviations,
  monthlyDebtSince,
  semesterUpdate,
  waffle,
} from "@/server/finance";
import anesi from "../../../public/img/anesi-piazza-colonna.jpg";

const euro = (n: number) => `${formatInt(n)} €`;
const pct = (n: number) => `${formatDecimal(n, 1)}%`;
/** «a» davanti a consonante, «ad» davanti a vocale: «ad agosto», «a settembre». */
const a = (word: string) => (/^[aeiou]/i.test(word) ? "ad" : "a");
const mld = (mln: number) => `${formatDecimal(mln / 1000, 1)} mld €`;

const SHORT: Record<string, string> = {
  pensioni: "Vecchiaia e superstiti",
  sanita: "Sanità",
  "altra-protezione": "Altra protezione sociale",
  "affari-economici": "Affari economici",
  interessi: "Interessi sul debito",
  istruzione: "Istruzione",
  "servizi-generali": "Altri servizi generali",
  sicurezza: "Ordine pubblico",
  difesa: "Difesa",
  territorio: "Casa e territorio",
  ambiente: "Ambiente",
  cultura: "Cultura e sport",
  resto: "Tutto il resto",
};

const WHAT: Record<string, string> = {
  sanita: "Ospedali, medici di base, farmaci.",
  "altra-protezione": "Famiglie, disoccupazione, malattia e disabilità, casa.",
  "affari-economici": "Trasporti, energia, agricoltura, industria.",
  istruzione: "Dalla scuola dell'infanzia all'università.",
  "servizi-generali": "Organi dello Stato, fisco, rapporti con l'estero.",
};

const VOCE: Record<string, string> = { spesa: "Spesa", entrate: "Entrate", interessi: "Interessi", saldo: "Disavanzo" };

/** Ultimo semestre contro lo stesso semestre dell'anno prima, più il debito mese per mese. */
export function SemesterCard() {
  const s = semesterUpdate();
  const by = Object.fromEntries(s.voci.map((v) => [v.id, v]));
  const deficit = { prima: -by.saldo.prima, dopo: -by.saldo.dopo };
  const fastest = s.voci.filter((v) => v.id !== "saldo").toSorted((a, b) => b.variazionePct - a.variazionePct)[0];
  const debt = monthlyDebtSince(`${s.anno - 1}-01`);
  const rise = (debt.ultimo.mld - debt.dicembre.mld) * 1000;
  const markFrom = debt.punti.findIndex((p) => p.mese === debt.dicembre.mese);
  const rows = s.voci.map((v) =>
    v.id === "saldo"
      ? { id: v.id, label: VOCE[v.id], before: deficit.prima, after: deficit.dopo, delta: ((deficit.dopo - deficit.prima) / deficit.prima) * 100 }
      : { id: v.id, label: VOCE[v.id], before: v.prima, after: v.dopo, delta: v.variazionePct },
  );
  const spending = by.spesa.variazionePct;

  return (
    <section aria-labelledby="t-novita" className="mt-4">
      <Card className="reveal">
        <Tag>
          <CalendarCheckIcon size={16} weight="bold" aria-hidden />
          {s.periodo[0].toUpperCase() + s.periodo.slice(1)} {s.anno}
        </Tag>
        <div className="lg:grid lg:grid-cols-[1.3fr_1fr] lg:items-start lg:gap-10">
          <div>
            <h2 id="t-novita" className="mt-2.5 text-[clamp(1.4rem,5.4vw,1.9rem)] leading-tight font-extrabold">
              Nel {s.periodo} del {s.anno} la spesa è {spending >= 0 ? "cresciuta" : "scesa"} del {pct(Math.abs(spending))}
            </h2>
            <p className="mt-2.5 max-w-[36em] text-ink-soft">
              Rispetto agli stessi mesi del {s.anno - 1}. Le entrate sono {by.entrate.variazionePct >= 0 ? "salite" : "scese"} del{" "}
              {pct(Math.abs(by.entrate.variazionePct))} e il disavanzo è {deficit.dopo < deficit.prima ? "sceso" : "salito"} di{" "}
              {formatDecimal(Math.abs(deficit.dopo - deficit.prima) / 1000, 1)} miliardi.{" "}
              {fastest.id === "interessi" ? "Gli interessi sono la voce che cresce più in fretta." : null}
            </p>
            <PairBars rows={rows} before={String(s.anno - 1)} after={String(s.anno)} format={mld} />
            <SourceNote>
              Eurostat, conti trimestrali delle amministrazioni pubbliche, dati non destagionalizzati. Confrontiamo gli stessi
              mesi di due anni perché la spesa si concentra a fine anno.
            </SourceNote>
          </div>
          <div className="mt-5 border-t border-rule pt-4 lg:mt-2.5 lg:border-0 lg:pt-0">
            <p className="font-bold">Debito pubblico, mese per mese</p>
            <p className="mt-0.5 text-[15px] text-ink-soft">
              Da {formatMonth(debt.dicembre.mese)} {a(formatMonth(debt.ultimo.mese))} {formatMonth(debt.ultimo.mese)} è {rise >= 0 ? "salito" : "sceso"} di{" "}
              {formatDecimal(Math.abs(rise) / 1000, 1)} miliardi, fino a {formatInt(debt.ultimo.mld)} miliardi.
            </p>
            <div className="mt-3">
              <Sparkline
                values={debt.punti.map((p) => p.mld)}
                markFrom={markFrom}
                label={`Debito pubblico mensile da ${formatMonth(debt.punti[0].mese)} a ${formatMonth(debt.ultimo.mese)}, da ${formatInt(debt.punti[0].mld)} a ${formatInt(debt.ultimo.mld)} miliardi`}
              />
              <p aria-hidden className="mt-1 flex justify-between text-xs text-ink-faint">
                <span>{formatMonth(debt.punti[0].mese)}</span>
                <span>{formatMonth(debt.ultimo.mese)}</span>
              </p>
            </div>
            <SourceNote>
              Banca d&apos;Italia, debito delle amministrazioni pubbliche.
              {debt.ultimo.provvisorio ? ` ${formatMonth(debt.ultimo.mese)[0].toUpperCase() + formatMonth(debt.ultimo.mese).slice(1)} è un dato provvisorio.` : ""}
            </SourceNote>
          </div>
        </div>
      </Card>
    </section>
  );
}

/** I 100 euro di spesa, quadretto per quadretto, e alla fine lo scontrino per residente. */
export function MoneyStory() {
  const { receipt: r, passi, interessiPrimoAnno, interessiStessoAnno } = waffle();
  const rest = r.righe.slice(passi.length - 1);
  const sum = passi.reduce((s, p) => s + p.su100, 0);
  const restNames = rest.map((x) => SHORT[x.id].toLowerCase());

  const text = (id: string, su100: number) => {
    if (id === "pensioni")
      return (
        <>
          Soprattutto pensioni. È la voce più grande{su100 >= 30 && su100 <= 36 ? <>: <b>un euro su tre</b></> : null}.
        </>
      );
    if (id === "interessi")
      return (
        <>
          Contando solo gli interessi passivi, nel {interessiPrimoAnno.anno} erano <b>{formatDecimal(interessiPrimoAnno.valore, 1)} €</b> ogni 100
          spesi; nel {interessiStessoAnno.anno} {formatDecimal(interessiStessoAnno.valore, 1)} €.
        </>
      );
    if (id === "resto")
      return (
        <>
          {restNames.join(", ").replace(/^./, (c) => c.toUpperCase())}.{sum !== 100 ? ` Le quote sono arrotondate, la somma fa ${sum}.` : ""}
        </>
      );
    return WHAT[id] ?? null;
  };

  const steps: WaffleStep[] = [
    {
      kind: "squares",
      id: "tutto",
      amount: "100 €",
      unit: "spesi",
      title: "Tutta la spesa pubblica",
      text: "Stato, regioni, comuni ed enti di previdenza insieme. Vediamo dove finisce ogni euro.",
      from: 0,
      count: 100,
      all: true,
    },
    ...passi.map(
      (p): WaffleStep => ({ kind: "squares", id: p.id, amount: `${p.su100} €`, unit: "ogni 100", title: SHORT[p.id], text: text(p.id, p.su100), from: p.da, count: p.su100 }),
    ),
    {
      kind: "receipt",
      id: "conto",
      amount: euro(r.totaleEuro),
      unit: "a testa",
      title: `Il conto del ${r.anno}`,
      text: `È la spesa per ogni residente. Di questi, ${euro(r.oltreLeEntrate)} sono stati spesi oltre le entrate.`,
    },
  ];

  const lines: ReceiptLine[] = [
    ...r.righe.slice(0, 7).map((x) => ({ id: x.id, label: SHORT[x.id], value: euro(x.euro) })),
    { id: "resto", label: "Tutto il resto", value: euro(r.righe.slice(7).reduce((s, x) => s + x.euro, 0)) },
    { id: "totale", label: "TOTALE", value: euro(r.totaleEuro), strong: true },
    { id: "oltre", label: "oltre le entrate", value: euro(r.oltreLeEntrate) },
  ];

  return (
    <Section
      id="t-cento"
      title="Dove vanno 100 € di spesa pubblica"
      intro={
        <p>
          Dati {r.anno}, l&apos;ultimo anno con il dettaglio per voce: Eurostat pubblica l&apos;anno dopo a febbraio. Ogni quadretto è
          un euro, scorri per vedere dove va.
        </p>
      }
    >
      <WaffleStory steps={steps} receipt={lines} receiptTitle={`spesa pubblica ${r.anno}, per residente`} />
      <SourceNote>
        Eurostat, spesa delle amministrazioni pubbliche per funzione (COFOG), {r.anno}. Popolazione media{" "}
        {formatDecimal(r.popolazione / 1e6, 1)} milioni.
      </SourceNote>
    </Section>
  );
}

/** Spesa ed entrate dal 1995, in euro di oggi o in % del PIL. */
export function AccountsTimeline() {
  const { righe, rottura } = accountsOverTime();
  const first = righe[0];
  const last = righe.at(-1)!;
  const change = (a: number, b: number) => ((b - a) / a) * 100;
  const years = righe.map((r) => r.anno);
  const common = { years, gap: true, endLabels: true, breakYear: rottura ?? undefined };

  return (
    <Section
      id="t-serie"
      title="Trent'anni di conti, in euro di oggi"
      intro={
        <p>
          Nel {first.anno} la spesa pubblica era di <b>{euro(first.spesa)}</b> per residente, ai prezzi del 2025. Nel {last.anno} è di{" "}
          {euro(last.spesa)}, il {pct(change(first.spesa, last.spesa))} in più. Le entrate sono cresciute del{" "}
          {pct(change(first.entrate, last.entrate))}, e la distanza fra le due linee è il disavanzo.
        </p>
      }
    >
      <ChartFigure
        className="reveal mt-6"
        note={<Legend items={[{ label: "Spesa", tone: "accent" }, { label: "Entrate", tone: "neutral" }]} />}
        views={[
          {
            id: "euro",
            label: "Euro di oggi",
            title: "Spesa ed entrate per residente, euro del 2025",
            chart: {
              ...common,
              label: "Spesa ed entrate per residente, euro del 2025",
              unit: "euro",
              series: [
                { id: "spesa", name: "Spesa", tone: "accent", values: righe.map((r) => r.spesa) },
                { id: "entrate", name: "Entrate", tone: "neutral", values: righe.map((r) => r.entrate) },
              ],
            },
          },
          {
            id: "pil",
            label: "% del PIL",
            title: "Spesa ed entrate in % del PIL",
            chart: {
              ...common,
              label: "Spesa ed entrate in % del PIL",
              unit: "pct",
              series: [
                { id: "spesa", name: "Spesa", tone: "accent", values: righe.map((r) => r.pil.spesa) },
                { id: "entrate", name: "Entrate", tone: "neutral", values: righe.map((r) => r.pil.entrate) },
              ],
            },
          },
        ]}
        source={
          <>
            Eurostat, conti delle amministrazioni pubbliche. Euro rivalutati con i coefficienti ISTAT dei prezzi al consumo, che
            ISTAT indica per sola analisi storica.
            {rottura ? ` Nel ${rottura} Eurostat cambia il modo di contare (linea tratteggiata verticale).` : ""}
          </>
        }
      />
    </Section>
  );
}

/** Quote per funzione nel primo e nell'ultimo anno, e il peso degli interessi sulla spesa. */
export function WhatChanged() {
  const s = functionShift();
  const by = Object.fromEntries(s.righe.map((r) => [r.id, r]));
  const interest = interestShareSeries();
  const n1 = (v: number) => formatDecimal(v, 1);

  return (
    <Section
      id="t-cambio"
      title={`Cosa è cambiato dal ${s.da}`}
      intro={
        <p>
          Su 100 € spesi, la protezione sociale è passata da {n1(by.GF10.from)} a {n1(by.GF10.to)} €, la sanità da {n1(by.GF07.from)} a{" "}
          {n1(by.GF07.to)}. I servizi generali sono scesi da {n1(by.GF01.from)} a {n1(by.GF01.to)} € soprattutto perché pesano meno gli
          interessi, che stanno in questa voce.
        </p>
      }
    >
      <div className="mt-6 grid gap-3.5 lg:grid-cols-[1.2fr_1fr] lg:items-start">
        <Card className="reveal">
          <ShiftList rows={s.righe} from={s.da} to={s.a} max={Math.ceil(Math.max(...s.righe.flatMap((r) => [r.from, r.to])) / 5) * 5} />
          <SourceNote>
            Euro ogni 100 di spesa. Eurostat, COFOG. Le altre voci (difesa, ordine pubblico, ambiente, casa, cultura) insieme passano
            da {n1(s.altre.from)} a {n1(s.altre.to)} €.
          </SourceNote>
        </Card>
        <ChartFigure
          className="reveal"
          title="Interessi ogni 100 € di spesa"
          chart={{
            label: "Interessi ogni 100 euro di spesa pubblica",
            years: interest.map((d) => d.anno),
            unit: "eur100",
            yMin: 0,
            series: [{ id: "interessi", name: "Interessi", tone: "accent", values: interest.map((d) => d.valore) }],
            height: 240,
          }}
          source="Eurostat, interessi passivi delle amministrazioni pubbliche sulla spesa totale."
        />
      </div>
    </Section>
  );
}

const GEO_NAME = { IT: "Italia", DE: "Germania", FR: "Francia", ES: "Spagna", EU27_2020: "Media UE" } as const;

/** Confronto con Germania, Francia, Spagna e media UE, sempre in % del PIL. */
export function EuropeBlock() {
  const rows = euFunctionRows();
  const debt = Object.entries(euComparison.debito.valori)
    .map(([geo, v]) => ({ id: geo, label: GEO_NAME[geo as keyof typeof GEO_NAME], value: v, highlight: geo === "IT" }))
    .toSorted((a, b) => b.value - a.value);
  const by = Object.fromEntries(rows.map((r) => [r.id, r]));
  const more = rows.filter((r) => r.it > r.others.EU27_2020).map((r) => r.label.toLowerCase());
  const less = rows.filter((r) => r.it < r.others.EU27_2020).map((r) => r.label.toLowerCase());
  const list = (xs: string[]) => (xs.length > 1 ? `${xs.slice(0, -1).join(", ")} e ${xs.at(-1)}` : xs[0]);

  return (
    <Section
      id="t-europa"
      title="L'Italia e gli altri paesi"
      intro={
        <p>
          In rapporto al PIL l&apos;Italia spende più della media europea per {list(more)}
          {less.length ? `, meno per ${list(less)}` : ""}. Scegli con chi confrontarla.
        </p>
      }
    >
      <Card className="reveal mt-6">
        <EuCompare rows={rows} year={euComparison.funzioni.anno} />
        <SourceNote>
          Spesa per funzione in % del PIL, {euComparison.funzioni.anno}. Eurostat, COFOG. Gli interessi sono la voce 01.7: in Italia{" "}
          {pct(by.interessi.it)} del PIL.
        </SourceNote>
        <h3 className="mt-7 text-xl font-bold">Debito pubblico in % del PIL, {euComparison.debito.anno}</h3>
        <HBars rows={debt} max={Math.max(...debt.map((d) => d.value))} format={pct} />
        <SourceNote>Eurostat, debito pubblico secondo le regole europee (Maastricht).</SourceNote>
      </Card>
    </Section>
  );
}

/** Debito sul PIL dal dopoguerra, con il governo dell'anno scelto. */
export function DebtByGovernment() {
  const { chart, cards } = debtByGovernment();
  const low = debtGdpSeries.reduce((a, b) => (b.valore < a.valore ? b : a));
  const high = debtGdpSeries.reduce((a, b) => (b.valore > a.valore ? b : a));
  const over100 = debtGdpSeries.find((d) => d.valore >= 100);

  return (
    <Section
      id="t-debito"
      title={`Il debito dal ${debtGdpSeries[0].anno}, governo dopo governo`}
      intro={
        <p>
          Nel {low.anno} il debito valeva il {pct(low.valore)} del PIL, il punto più basso.
          {over100 ? ` Ha passato il 100% nel ${over100.anno}` : ""} e ha toccato il massimo nel {high.anno}, con il {pct(high.valore)}.
          Scegli un anno: compare il governo in carica.
        </p>
      }
    >
      <GovernmentDebt
        chart={chart}
        cards={cards}
        image={
          <figure className="m-0">
            <Image
              src={anesi}
              alt="Incisione del 1750 circa di piazza Colonna: al centro la colonna di Marco Aurelio, a destra il lungo palazzo Chigi."
              sizes="(min-width: 1024px) 400px, 100vw"
              className="aspect-[16/9] w-full object-cover object-[60%_60%] dark:brightness-[0.8]"
            />
            <figcaption className="sr-only">Piazza Colonna verso il 1750: a destra Palazzo Chigi, oggi sede del governo.</figcaption>
          </figure>
        }
      />
      <SourceNote>
        Dal 1995 Eurostat. Prima del 1995 è un nostro calcolo: debito di dicembre (Banca d&apos;Italia) diviso per il PIL ricostruito da
        Banca d&apos;Italia. Governi: dati.camera.it. Incisione di piazza Colonna, Statens Museum for Kunst, pubblico dominio.
      </SourceNote>
    </Section>
  );
}

/** Previsto contro speso per le misure con basi confrontabili. */
export function MeasureGaps({ more }: { more?: boolean }) {
  const { stima, tetto } = measureDeviations();
  const row = (r: (typeof stima)[number]) => ({
    id: r.confronto.id,
    title: r.misura.titolo,
    detail: r.confronto.periodo + (r.confronto.consuntivo?.proiezione && !/proiezione/i.test(r.confronto.periodo) ? ", con proiezione" : ""),
    note: `${mld(r.confronto.previsto.importoEur / 1e6)} previsti, ${mld((r.confronto.consuntivo?.importoEur ?? 0) / 1e6)} spesi`,
    pct: r.pct,
  });
  const scale = Math.ceil(Math.max(...[...stima, ...tetto].map((r) => Math.abs(r.pct))) / 10) * 10;
  const low = stima.reduce((a, b) => (b.pct < a.pct ? b : a));
  const high = stima.reduce((a, b) => (b.pct > a.pct ? b : a));

  return (
    <Section
      id="t-misure"
      title="Quanto costava sulla carta, quanto è costato"
      intro={
        <p>
          Per alcune misure passate c&apos;è sia la stima scritta nella legge sia la spesa misurata dopo. Le stime sbagliano in tutte e
          due le direzioni: la spesa è stata il {pct(Math.abs(low.pct))} sotto la stima per «{low.misura.titolo}» e il {pct(high.pct)} sopra
          per «{high.misura.titolo}».
        </p>
      }
    >
      <Card className="reveal mt-6">
        <p className="text-sm font-bold text-ink-soft">Stime della relazione tecnica</p>
        <DivergingBars rows={stima.map(row)} scale={scale} />
        {tetto.length ? (
          <>
            <p className="mt-7 text-sm font-bold text-ink-soft">Tetti di spesa: il massimo fissato dalla legge, non una stima</p>
            <DivergingBars rows={tetto.map(row)} scale={scale} />
          </>
        ) : null}
        <SourceNote>
          Relazioni tecniche delle leggi e consuntivi di INPS, Ministero dell&apos;Economia e Ufficio parlamentare di bilancio. Mostriamo
          la differenza solo quando le due cifre misurano la stessa cosa: per il Superbonus, per esempio, non è così.
        </SourceNote>
        {more ? <GoLink href="/misure">Tutte le misure, con le fonti</GoLink> : null}
      </Card>
    </Section>
  );
}
