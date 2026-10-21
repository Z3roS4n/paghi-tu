import type { Metadata } from "next";
import Link from "next/link";
import { ChartFigure } from "@/components/chart-figure";
import { VerificationBadge } from "@/components/verification-badge";
import { formatDecimal, formatInt, formatMonth } from "@/lib/format";
import { finance } from "@/server/data";
import { accountsSeries, debtGdpSeries, headline, latestReceipt, seriesBreaks, spendingPerResidentReal } from "@/server/finance";

export const metadata: Metadata = {
  title: "Quanto spendiamo",
  description:
    "Quanto spendono ogni anno Stato, regioni, comuni ed enti di previdenza per ogni residente, dove vanno i soldi e quanto pesa il debito. Dati Eurostat e Banca d'Italia.",
};

const euro = (n: number) => `${formatInt(n)} €`;
const pct = (n: number) => `${formatDecimal(n, 1)}%`;

function Stat({ label, value, note }: { label: string; value: string; note: string }) {
  return (
    <div className="bg-paper-raised p-5">
      <dt className="text-sm text-ink-soft">{label}</dt>
      <dd className="mt-2 text-3xl font-semibold tracking-tight">{value}</dd>
      <dd className="mt-1 text-sm text-ink-faint">{note}</dd>
    </div>
  );
}

export default function SpendingPage() {
  const h = headline();
  const r = latestReceipt();
  const max = r.righe[0].euro;

  return (
    <div className="mx-auto max-w-6xl px-4 py-12 md:px-6 md:py-16">
      <p className="font-mono text-sm text-ink-faint">Conti delle amministrazioni pubbliche, {h.anno}</p>
      <h1 className="mt-3 max-w-[20ch] text-4xl font-semibold tracking-tight md:text-6xl">
        Quanto spende il settore pubblico per ognuno di noi
      </h1>

      <section aria-labelledby="totale" className="mt-10 grid gap-10 md:grid-cols-[1.1fr_1fr] md:items-end">
        <div>
          <h2 id="totale" className="sr-only">Spesa per residente</h2>
          <p className="text-6xl font-semibold tracking-tight md:text-8xl">{euro(h.spesa)}</p>
          <p className="mt-4 max-w-[46ch] text-lg text-ink-soft">
            spesi nel {h.anno} per ogni persona residente in Italia, neonati compresi: {euro(h.spesa / 365)} al giorno.
            Equivale al {pct(h.pil.spesa)} del PIL, il valore di quanto il Paese ha prodotto nell&apos;anno: è un
            rapporto, non una fetta del PIL, perché buona parte della spesa sono pensioni, interessi e altri trasferimenti.
          </p>
        </div>
        <p className="max-w-[52ch] text-sm text-ink-soft md:pb-2">
          Comprende Stato, regioni, comuni, INPS e gli altri enti che ISTAT classifica fra le amministrazioni pubbliche;
          restano fuori le imprese pubbliche. Le cifre per residente dividono il totale dell&apos;anno per la popolazione
          media dell&apos;anno ({formatDecimal(h.popolazione / 1e6, 1)} milioni nel {h.anno}); il debito, che è un valore a
          una data, si divide per i residenti al 1° gennaio {h.debito.popolazioneAnno}. Sono medie, non quello che paga una
          persona.
        </p>
      </section>

      <dl className="mt-12 grid gap-px border border-rule bg-rule sm:grid-cols-2 lg:grid-cols-4">
        <Stat label="Entrate per residente" value={euro(h.entrate)} note={`imposte, contributi e altre entrate, ${h.anno}`} />
        <Stat
          label="Disavanzo (spesa oltre le entrate)"
          value={euro(-h.saldo)}
          note={`per residente nel ${h.anno}: l'indebitamento netto, finanziato soprattutto con nuovo debito`}
        />
        <Stat label="Interessi sul debito" value={euro(h.interessi)} note={`per residente nel ${h.anno}`} />
        <Stat
          label="Debito pubblico per residente"
          value={euro(h.debito.perResidente)}
          note={`a fine ${formatMonth(h.debito.mese)}${h.debito.provvisorio ? " (dato provvisorio)" : ""}, ${formatInt(h.debito.totale / 1000)} miliardi in tutto, diviso per i residenti al 1° gennaio ${h.debito.popolazioneAnno}`}
        />
      </dl>

      <section aria-labelledby="dove" className="mt-20">
        <h2 id="dove" className="text-2xl font-semibold tracking-tight md:text-3xl">Dove vanno i soldi</h2>
        <p className="mt-3 max-w-[65ch] text-ink-soft">
          Spesa per residente nel {r.anno}, divisa per funzione secondo la classificazione europea COFOG. Il dettaglio per
          funzione esce un anno dopo il totale: per questo l&apos;ultimo anno è il {r.anno}.
        </p>
        <ul className="mt-8 divide-y divide-rule border-y border-rule">
          {r.righe.map((x) => (
            <li key={x.id} className="grid grid-cols-[1fr_auto] items-center gap-x-6 gap-y-2 py-3 md:grid-cols-[18rem_1fr_7rem_4rem]">
              <span>{x.etichetta}</span>
              <span className="col-span-2 row-start-2 md:col-span-1 md:row-start-auto">
                <span
                  className="block h-3 rounded-r-[4px] bg-accent"
                  style={{ width: `${Math.max((x.euro / max) * 100, 0.5)}%` }}
                  aria-hidden
                />
              </span>
              <span className="tabular text-right font-semibold">{euro(x.euro)}</span>
              <span className="tabular hidden text-right text-sm text-ink-faint md:block">{pct(x.quota * 100)}</span>
            </li>
          ))}
          <li className="grid grid-cols-[1fr_auto] gap-x-6 py-3 font-semibold md:grid-cols-[18rem_1fr_7rem_4rem]">
            <span>Totale</span>
            <span className="hidden md:block" />
            <span className="tabular text-right">{euro(r.totaleEuro)}</span>
            <span className="hidden md:block" />
          </li>
        </ul>
        <p className="mt-3 text-xs text-ink-faint">
          Fonte: Eurostat, gov_10a_exp. «Vecchiaia e superstiti» sono le voci COFOG 10.2 e 10.3: pensioni di vecchiaia,
          anticipate e ai superstiti, più assistenza e servizi agli anziani. «Altra protezione sociale» comprende malattia e
          invalidità (con le pensioni di invalidità), famiglia e figli, disoccupazione, casa, esclusione sociale e altre spese
          non classificate. La riga sul debito è la voce COFOG 01.7, operazioni relative al debito pubblico: interessi e oneri
          di emissione.
        </p>
      </section>

      <section aria-labelledby="tempo" className="mt-20">
        <h2 id="tempo" className="text-2xl font-semibold tracking-tight md:text-3xl">Come è cambiata dal 1995</h2>
        {seriesBreaks.length > 0 ? (
          <p className="mt-3 max-w-[70ch] text-sm text-ink-soft">
            Dal {seriesBreaks.join(", ")} i dati incorporano la revisione dei conti nazionali ISTAT più recente; gli anni
            precedenti non sono ancora stati ricostruiti. Fra il {seriesBreaks[0] - 1} e il {seriesBreaks[0]} c&apos;è quindi
            una rottura di serie (Eurostat la segnala con il flag «b»): il confronto fra i due periodi va letto con cautela.
          </p>
        ) : null}
        <div className="mt-8 grid gap-14 lg:grid-cols-2">
          <ChartFigure
            title="Spesa pubblica per residente, in euro del 2025"
            note="Gli importi di ogni anno sono portati ai prezzi del 2025 con i coefficienti ISTAT di rivalutazione."
            source="Eurostat gov_10a_main, popolazione e coefficienti ISTAT. Elaborazione Paghi Tu."
            unit="euro"
            points={spendingPerResidentReal().map((p) => ({ x: p.anno, label: String(p.anno), value: p.valore, display: euro(p.valore) }))}
          />
          <ChartFigure
            title="Spesa pubblica in % del PIL"
            source="Eurostat gov_10a_main."
            unit="pct"
            points={accountsSeries("spesa").map((p) => ({ x: p.anno, label: String(p.anno), value: p.valore, display: pct(p.valore) }))}
          />
          <ChartFigure
            title="Saldo dei conti pubblici in % del PIL"
            note="Sotto lo zero le spese superano le entrate (indebitamento netto). La differenza si finanzia soprattutto con nuovo debito, ma la variazione del debito non coincide con il disavanzo: contano anche la liquidità del Tesoro e i pagamenti di cassa."
            source="Eurostat gov_10a_main, indebitamento netto (B9)."
            unit="pct"
            points={accountsSeries("saldo").map((p) => ({ x: p.anno, label: String(p.anno), value: p.valore, display: pct(p.valore) }))}
          />
          <ChartFigure
            title="Interessi sul debito in % del PIL"
            source="Eurostat gov_10a_main, interessi passivi (D.41)."
            unit="pct"
            points={accountsSeries("interessi").map((p) => ({ x: p.anno, label: String(p.anno), value: p.valore, display: pct(p.valore) }))}
          />
        </div>
      </section>

      <section aria-labelledby="debito" className="mt-20">
        <h2 id="debito" className="text-2xl font-semibold tracking-tight md:text-3xl">
          Il debito dal {debtGdpSeries[0].anno}
        </h2>
        <div className="mt-8">
          <ChartFigure
            title="Debito pubblico in % del PIL, a fine anno"
            note="Dal 1995 il valore è quello di Eurostat. Prima lo calcoliamo noi: debito di dicembre secondo Banca d'Italia diviso per il PIL della nostra serie storica."
            source="Banca d'Italia, tavola TCCE0325; Eurostat gov_10dd_edpt1; PIL: Banca d'Italia NA150 e ISTAT."
            unit="pct"
            points={debtGdpSeries.map((p) => ({
              x: p.anno,
              label: `${p.anno}${p.calcolatoDa === "paghi_tu" ? " (calcolo Paghi Tu)" : ""}`,
              value: p.valore,
              display: pct(p.valore),
            }))}
          />
        </div>
      </section>

      <section aria-labelledby="fonti" className="mt-20 grid gap-10 border-t border-rule pt-10 md:grid-cols-[1.4fr_1fr]">
        <div>
          <h2 id="fonti" className="text-xl font-semibold">Da dove vengono questi numeri</h2>
          <ul className="mt-4 space-y-3 text-sm">
            {finance.fonti.map((f) => (
              <li key={f.url}>
                <a href={f.url} target="_blank" rel="noopener noreferrer" className="underline underline-offset-2">
                  {f.etichetta}
                </a>
                <span className="block text-ink-faint">Aggiornamento della fonte: {f.aggiornamentoFonte}</span>
              </li>
            ))}
          </ul>
          <h3 className="mt-8 font-semibold">Controlli automatici</h3>
          <p className="mt-1 text-sm text-ink-soft">
            A ogni aggiornamento i dati vengono incrociati fra fonti diverse. Se un controllo non passa, l&apos;aggiornamento
            non va online.
          </p>
          <ul className="mt-3 space-y-2 text-sm">
            {finance.controlli.map((c) => (
              <li key={c.id}>
                <span className="font-mono text-xs text-level-v1">{c.superato ? "superato" : "non superato"}</span> {c.descrizione}
                <span className="block text-xs text-ink-faint">{c.dettaglio}</span>
              </li>
            ))}
          </ul>
        </div>
        <aside className="space-y-4">
          <VerificationBadge verifica={finance.verifica} />
          <p className="text-sm text-ink-soft">
            Scaricati il {finance.scaricato.slice(8, 10)}/{finance.scaricato.slice(5, 7)}/{finance.scaricato.slice(0, 4)}.
            Il metodo è descritto in{" "}
            <Link href="/metodo" className="underline underline-offset-2">
              Metodo
            </Link>
            .
          </p>
        </aside>
      </section>
    </div>
  );
}
