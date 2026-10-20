import Link from "next/link";
import { ArrowRightIcon } from "@phosphor-icons/react/ssr";
import { LevelTag } from "@/components/verification-badge";
import { DATA_SNAPSHOT } from "@/server/data";
import { homeStats } from "@/server/stats";
import { formatDate, formatDecimal, formatInt } from "@/lib/format";

function ReceiptRow({ label, value, note }: { label: string; value: string; note?: string }) {
  return (
    <div className="py-2">
      <div className="flex items-baseline gap-2">
        <span className="shrink-0">{label}</span>
        <span aria-hidden className="min-w-4 flex-1 translate-y-[-3px] border-b border-dotted border-ink-faint" />
        <span className="tabular shrink-0 font-semibold">{value}</span>
      </div>
      {note ? <p className="mt-0.5 text-[11px] text-ink-faint">{note}</p> : null}
    </div>
  );
}

const SECTIONS = [
  {
    href: "/governi",
    title: "Governi",
    body: "Tutti i governi da De Gasperi a oggi: date, maggioranze, leggi di bilancio presentate.",
    status: "Online",
  },
  {
    href: "/leggi-di-bilancio",
    title: "Leggi di bilancio",
    body: "Ogni manovra con i suoi estremi su Normattiva e il governo che l'ha presentata.",
    status: "Online",
  },
  {
    href: "/promesse",
    title: "Promesse per le politiche 2027",
    body: "Cosa promettono i partiti, con la frase esatta e la fonte. Stesse regole per tutti.",
    status: "In verifica",
  },
  {
    href: "/misure",
    title: "Quanto costano le misure",
    body: "Costo stimato all'approvazione contro costo effettivo, per Quota 100, Superbonus, RdC e altre.",
    status: "Online",
  },
] as const;

export default function Home() {
  const s = homeStats();

  return (
    <>
      <section className="mx-auto grid max-w-6xl gap-12 px-4 pt-12 pb-16 md:grid-cols-[1.2fr_1fr] md:items-center md:px-6 md:pt-20">
        <div>
          <h1 className="text-4xl leading-[1.05] font-semibold tracking-tight md:text-6xl">
            Ogni promessa ha un prezzo. Il conto arriva a te.
          </h1>
          <p className="mt-6 max-w-[48ch] text-lg leading-relaxed text-ink-soft">
            Spese dello Stato, promesse elettorali e costo delle misure dal 1946 a oggi. Solo numeri con fonte.
          </p>
          <div className="mt-8 flex flex-wrap gap-3">
            <Link
              href="/governi"
              className="inline-flex items-center gap-2 bg-accent px-5 py-3 font-medium text-accent-ink transition-transform active:scale-[0.98]"
            >
              Esplora i governi
              <ArrowRightIcon size={16} weight="bold" aria-hidden />
            </Link>
            <Link href="/metodo" className="inline-flex items-center border border-ink px-5 py-3 font-medium">
              Come verifichiamo
            </Link>
          </div>
        </div>

        <figure className="receipt mx-auto w-full max-w-sm px-6 py-7 font-mono text-[13px] shadow-[0_18px_40px_-24px_rgb(24_24_27/0.45)] md:rotate-[1.2deg]">
          <div className="text-center">
            <p className="text-base font-semibold">PAGHI TU</p>
            <p className="text-ink-faint">dati al {formatDate(DATA_SNAPSHOT)}</p>
          </div>
          <div className="my-4 border-t border-dashed border-ink-faint" />
          <ReceiptRow label="Governi" value={formatInt(s.governmentCount)} note={`dal ${formatDate(s.firstGovernmentStart)}`} />
          <ReceiptRow
            label="Durata media"
            value={`${formatInt(s.meanDurationDays)} gg`}
            note={`sui ${s.endedCount} governi conclusi`}
          />
          {s.current ? (
            <ReceiptRow
              label={s.current.nome.replace(/^Governo\s+/, "Gov. ")}
              value={`${formatInt(s.currentDurationDays ?? 0)} gg`}
              note="in carica"
            />
          ) : null}
          <ReceiptRow label="Atti di bilancio censiti" value={formatInt(s.budgetLawCount)} />
          <ReceiptRow
            label={`PIL ${s.gdp.anno}`}
            value={`${formatDecimal(s.gdp.valore / 1000, 0)} mld €`}
            note="ISTAT, prezzi correnti"
          />
          <ReceiptRow
            label={`Residenti 1/1/${s.population.anno}`}
            value={`${formatDecimal(s.population.valore / 1e6, 1)} mln`}
            note={s.population.nota ? "stima ISTAT" : "ISTAT"}
          />
          <div className="my-4 border-t border-dashed border-ink-faint" />
          <div className="flex items-baseline justify-between text-base font-semibold">
            <span>Chi paga</span>
            <span className="text-accent">TU</span>
          </div>
          <figcaption className="sr-only">Riepilogo dei dati principali pubblicati su Paghi Tu</figcaption>
        </figure>
      </section>

      <section className="border-y border-rule bg-paper-raised">
        <div className="mx-auto max-w-6xl px-4 py-16 md:px-6">
          <h2 className="text-2xl font-semibold tracking-tight md:text-3xl">Cosa trovi qui</h2>
          <ul className="mt-8 grid gap-px bg-rule md:grid-cols-2">
            {SECTIONS.map((sec) => (
              <li key={sec.title} className="bg-paper-raised">
                <Link href={sec.href} className="group flex h-full flex-col gap-3 p-6 hover:bg-paper">
                  <div className="flex items-center justify-between gap-4">
                    <h3 className="text-lg font-semibold">{sec.title}</h3>
                    <span
                      className={`font-mono text-xs ${sec.status === "Online" ? "text-ink-soft" : "text-accent"}`}
                    >
                      {sec.status}
                    </span>
                  </div>
                  <p className="max-w-[48ch] text-ink-soft">{sec.body}</p>
                </Link>
              </li>
            ))}
          </ul>
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-4 py-16 md:px-6">
        <h2 className="text-2xl font-semibold tracking-tight md:text-3xl">Ogni dato porta il suo livello di verifica</h2>
        <dl className="mt-8 grid gap-8 md:grid-cols-[1fr_1fr_1fr]">
          <div>
            <dt className="flex items-center gap-2 font-medium"><LevelTag level="V1" /> Fonte primaria</dt>
            <dd className="mt-2 text-ink-soft">Controllato due volte, in modo indipendente, sul documento ufficiale: legge, bilancio, banca dati dell'ente.</dd>
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
