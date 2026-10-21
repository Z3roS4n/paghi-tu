import Link from "next/link";
import { ArrowRightIcon, MagnifyingGlassIcon } from "@phosphor-icons/react/ssr";
import { LevelTag } from "@/components/verification-badge";
import { formatDecimal, formatInt, formatMonth } from "@/lib/format";
import { headline, latestReceipt } from "@/server/finance";
import { homeStats } from "@/server/stats";

const RECEIPT_ROWS = 7;
const euro = (n: number) => `${formatInt(n)} €`;

function ReceiptRow({ label, value, strong }: { label: string; value: string; strong?: boolean }) {
  return (
    <div className={`flex items-baseline gap-2 py-1.5 ${strong ? "font-semibold" : ""}`}>
      <span className="shrink">{label}</span>
      <span aria-hidden className="min-w-4 flex-1 translate-y-[-3px] border-b border-dotted border-ink-faint" />
      <span className="tabular shrink-0">{value}</span>
    </div>
  );
}

export default function Home() {
  const h = headline();
  const r = latestReceipt();
  const s = homeStats();
  const shown = r.righe.slice(0, RECEIPT_ROWS);
  const rest = r.righe.slice(RECEIPT_ROWS).reduce((sum, x) => sum + x.euro, 0);

  const sections = [
    {
      href: "/spesa",
      title: "Quanto spendiamo",
      body: `Spesa, entrate, deficit e debito pubblico per residente, anno per anno dal 1995. Il debito dal 1945.`,
    },
    {
      href: "/governi",
      title: "Governi",
      body: `I ${s.governmentCount} governi da De Gasperi a oggi: date, maggioranze, manovre e debito pubblico durante il mandato.`,
    },
    {
      href: "/leggi-di-bilancio",
      title: "Leggi di bilancio",
      body: `${s.budgetLawCount} atti di bilancio con gli estremi su Normattiva e il governo che li ha presentati.`,
    },
    {
      href: "/promesse",
      title: "Promesse per le politiche 2027",
      body: "Cosa promettono i partiti, con la frase esatta e la fonte. Stesse regole per tutti.",
    },
    {
      href: "/misure",
      title: "Quanto costano le misure",
      body: "Costo stimato all'approvazione contro costo effettivo, per Quota 100, Superbonus, RdC e altre.",
    },
    {
      href: "/archivio",
      title: "Archivio",
      body: "Cerca fra governi, manovre, misure e promesse in un solo posto.",
    },
  ];

  return (
    <>
      <section className="mx-auto grid max-w-6xl gap-12 px-4 pt-12 pb-16 md:grid-cols-[1.15fr_1fr] md:items-start md:px-6 md:pt-20">
        <div>
          <p className="font-mono text-sm text-ink-faint">Conti pubblici {h.anno}, fonte Eurostat</p>
          <h1 className="mt-4 text-4xl leading-[1.05] font-semibold tracking-tight md:text-6xl">
            Quanto spende lo Stato con i nostri soldi?
          </h1>
          <p className="mt-8 text-6xl font-semibold tracking-tight md:text-7xl">{euro(h.spesa)}</p>
          <p className="mt-3 max-w-[46ch] text-lg leading-relaxed text-ink-soft">
            spesi nel {h.anno} da Stato, regioni, comuni ed enti di previdenza per ogni residente: {euro(h.spesa / 365)} al
            giorno. Le entrate sono state {euro(h.entrate)} a testa; il disavanzo si finanzia soprattutto con nuovo debito,
            che a fine {formatMonth(h.debito.mese)} vale {euro(h.debito.perResidente)} per residente.
          </p>
          <div className="mt-8 flex flex-wrap gap-3">
            <Link
              href="/spesa"
              className="inline-flex items-center gap-2 bg-accent px-5 py-3 font-medium whitespace-nowrap text-accent-ink transition-transform active:scale-[0.98]"
            >
              Guarda dove vanno
              <ArrowRightIcon size={16} weight="bold" aria-hidden />
            </Link>
            <Link
              href="/archivio"
              className="inline-flex items-center gap-2 border border-ink px-5 py-3 font-medium whitespace-nowrap transition-transform active:scale-[0.98]"
            >
              <MagnifyingGlassIcon size={16} weight="bold" aria-hidden />
              Cerca nell&apos;archivio
            </Link>
          </div>
        </div>

        <figure className="receipt mx-auto w-full max-w-sm px-6 py-7 font-mono text-[13px] shadow-[0_18px_40px_-24px_rgb(24_24_27/0.45)] md:rotate-[1.2deg]">
          <div className="text-center">
            <p className="text-base font-semibold">PAGHI TU</p>
            <p className="text-ink-faint">spesa pubblica {r.anno}, per residente</p>
          </div>
          <div className="my-4 border-t border-dashed border-ink-faint" />
          {shown.map((x) => (
            <ReceiptRow key={x.id} label={x.etichetta} value={euro(x.euro)} />
          ))}
          <ReceiptRow label="Tutto il resto" value={euro(rest)} />
          <div className="my-3 border-t border-dashed border-ink-faint" />
          <ReceiptRow label="Totale" value={euro(r.totaleEuro)} strong />
          <ReceiptRow label="di cui oltre le entrate" value={euro(r.oltreLeEntrate)} />
          <div className="my-4 border-t border-dashed border-ink-faint" />
          <div className="flex items-baseline justify-between text-base font-semibold">
            <span>Chi paga</span>
            <span className="text-accent">TU</span>
          </div>
          <figcaption className="mt-4 text-[11px] leading-snug text-ink-faint">
            Eurostat, spesa delle amministrazioni pubbliche per funzione. Totale diviso per la popolazione media del{" "}
            {r.anno} ({formatDecimal(r.popolazione / 1e6, 1)} milioni).
          </figcaption>
        </figure>
      </section>

      <section className="border-y border-rule bg-paper-raised">
        <div className="mx-auto max-w-6xl px-4 py-16 md:px-6">
          <h2 className="text-2xl font-semibold tracking-tight md:text-3xl">Cosa trovi qui</h2>
          <ul className="mt-8 grid gap-px bg-rule md:grid-cols-2 lg:grid-cols-3">
            {sections.map((sec) => (
              <li key={sec.title} className="bg-paper-raised">
                <Link href={sec.href} className="group flex h-full flex-col gap-3 p-6 hover:bg-paper">
                  <h3 className="flex items-center justify-between gap-4 text-lg font-semibold">
                    {sec.title}
                    <ArrowRightIcon size={16} aria-hidden className="text-ink-faint group-hover:text-accent" />
                  </h3>
                  <p className="max-w-[48ch] text-ink-soft">{sec.body}</p>
                </Link>
              </li>
            ))}
          </ul>
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-4 py-16 md:px-6">
        <h2 className="text-2xl font-semibold tracking-tight md:text-3xl">Ogni dato porta il suo livello di verifica</h2>
        <dl className="mt-8 grid gap-8 md:grid-cols-3">
          <div>
            <dt className="flex items-center gap-2 font-medium"><LevelTag level="V1" /> Fonte primaria</dt>
            <dd className="mt-2 text-ink-soft">Controllato due volte, in modo indipendente, sul documento ufficiale: legge, bilancio, banca dati dell&apos;ente.</dd>
          </div>
          <div>
            <dt className="flex items-center gap-2 font-medium"><LevelTag level="V2" /> Verifica parziale</dt>
            <dd className="mt-2 text-ink-soft">Almeno un campo viene da una fonte secondaria. Lo diciamo, campo per campo.</dd>
          </div>
          <div>
            <dt className="flex items-center gap-2 font-medium"><LevelTag level="NV" /> Da verificare</dt>
            <dd className="mt-2 text-ink-soft">Dato non ancora confermato. Resta visibile come tale, mai presentato come certo.</dd>
          </div>
        </dl>
      </section>
    </>
  );
}
