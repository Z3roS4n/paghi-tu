import type { Metadata } from "next";
import Link from "next/link";
import { ArrowUpRightIcon, FlagIcon } from "@phosphor-icons/react/ssr";
import { SourceLinks } from "@/components/source-links";
import { Card, PageHead, SectionHead, Tag, Wrap } from "@/components/ui";
import { LevelTag, VerificationBadge } from "@/components/verification-badge";
import { correctionUrl } from "@/lib/contribute";
import { COST_NATURES, LEGAL_ACT_TYPE, SAVING_NATURES, yearlyTotals } from "@/lib/domain/acts";
import { COFOG_DIVISIONS, type ActMeasure, type LegalAct, type LegalActStatus, type SourceLink, type YearAmount } from "@/lib/domain/schemas";
import { formatDate, formatExactMillions, formatInt, formatMonth } from "@/lib/format";
import { getGovernment, legalActs, legalActsStatus } from "@/server/data";

export const metadata: Metadata = {
  title: "Leggi e decreti che spostano soldi pubblici",
  description:
    "I decreti-legge, le leggi e i decreti legislativi pubblicati in Gazzetta Ufficiale che autorizzano una spesa o cambiano un'entrata, con gli importi scritti nella norma.",
};

const STATUS: Record<LegalActStatus, string> = {
  in_conversione: "In attesa di conversione",
  convertito: "Convertito in legge",
  decaduto: "Decaduto, non convertito",
  in_vigore: "In vigore",
};

const NATURE: Record<ActMeasure["natura"], string> = {
  spesa: "Spesa",
  minori_entrate: "Entrate in meno",
  maggiori_entrate: "Entrate in più",
  minori_spese: "Spesa in meno",
};

const RULES = [
  {
    title: "Le cifre della norma",
    body: "Ogni importo è copiato dal testo in Gazzetta o dalla relazione tecnica del governo, anno per anno. Non facciamo stime nostre.",
  },
  {
    title: "Limite o stima",
    body: "«Nel limite di» è il massimo che si può spendere, non quanto si spenderà. Le stime sono le valutazioni della relazione tecnica.",
  },
  {
    title: "Le coperture a parte",
    body: "I soldi presi da altri fondi per pagare una misura non sono una misura nuova: restano nelle note dell'atto. I totali non sono il saldo ufficiale.",
  },
];

const LINK = "inline-flex min-h-12 items-center gap-1.5 text-[15px] font-bold";

function Amounts({ items, continuing = false }: { items: YearAmount[]; continuing?: boolean }) {
  return (
    <ul className="flex flex-wrap gap-x-3 gap-y-0.5">
      {items.map((i, n) => (
        <li key={i.anno} className="tabular whitespace-nowrap">
          <span className="text-ink-soft">{i.anno}:</span> <b>{formatExactMillions(i.mln)}</b>
          {continuing && n === items.length - 1 ? <span className="text-ink-soft"> e ogni anno dopo</span> : null}
        </li>
      ))}
    </ul>
  );
}

function MeasureRow({ m }: { m: ActMeasure }) {
  return (
    <li id={m.id} className="scroll-mt-24 border-t border-rule pt-3.5 first:border-0 first:pt-0">
      <div className="flex flex-wrap items-center gap-1.5">
        <Tag tone={COST_NATURES.includes(m.natura) ? "accent" : "plain"}>{NATURE[m.natura]}</Tag>
        <Tag tone="plain">{m.tipoOnere === "tetto" ? "Limite di spesa" : "Stima"}</Tag>
        <span className="ml-auto">
          <LevelTag level={m.verifica.livello} />
        </span>
      </div>
      <p className="mt-2 font-semibold">{m.descrizione}</p>
      <div className="mt-1 text-[15px]">
        <Amounts items={m.importi} continuing={m.continuaDopo} />
      </div>
      <details className="group mt-1 text-[15px]">
        <summary className="flex min-h-11 cursor-pointer list-none items-center gap-2 text-ink-soft hover:text-ink [&::-webkit-details-marker]:hidden">
          {m.articolo}, il testo
          <span className="text-ink-faint underline underline-offset-2 group-open:hidden">apri</span>
        </summary>
        <div className="mb-2 space-y-2 border-l-2 border-rule pl-4">
          <blockquote className="m-0 text-[15.5px] leading-relaxed">«{m.citazione}»</blockquote>
          <p className="text-sm text-ink-soft">{COFOG_DIVISIONS[m.cofog]}</p>
          <SourceLinks fonti={[m.fonte]} />
          <VerificationBadge verifica={m.verifica} />
        </div>
      </details>
    </li>
  );
}

function Totals({ act }: { act: LegalAct }) {
  const costs = yearlyTotals(act.misure, COST_NATURES);
  const savings = yearlyTotals(act.misure, SAVING_NATURES);
  const continuing = act.misure.some((m) => m.continuaDopo);
  return (
    <dl className="grid gap-2 rounded-ctl bg-accent-soft px-3.5 py-3 text-[15px] sm:grid-cols-2">
      <div>
        <dt className="text-sm text-ink-soft">Spese ed entrate in meno, somma delle misure</dt>
        <dd>{costs.length > 0 ? <Amounts items={costs} /> : "nessuna"}</dd>
      </div>
      <div>
        <dt className="text-sm text-ink-soft">Entrate in più e spese in meno</dt>
        <dd>{savings.length > 0 ? <Amounts items={savings} /> : "nessuna registrata"}</dd>
      </div>
      {continuing ? (
        <p className="text-sm text-ink-soft sm:col-span-2">Alcune misure continuano anche dopo l&apos;ultimo anno indicato: le somme contano solo gli anni scritti.</p>
      ) : null}
    </dl>
  );
}

function ActCard({ act }: { act: LegalAct }) {
  const gov = getGovernment(act.governoId);
  const links: SourceLink[] = [
    { ...act.gazzetta.fonte, etichetta: `Gazzetta Ufficiale n. ${act.gazzetta.numero}` },
    ...(act.cdm ? [{ ...act.cdm, etichetta: "Consiglio dei ministri" }] : []),
    ...(act.relazioneTecnica ? [{ ...act.relazioneTecnica, etichetta: "Relazione tecnica" }] : []),
    ...(act.conversione ? [{ ...act.conversione.fonte, etichetta: act.conversione.estremi }] : []),
  ];
  return (
    <Card as="li" className="reveal flex flex-col gap-3 pb-0!">
      <div id={act.id} className="flex scroll-mt-24 flex-wrap items-center gap-1.5">
        <Tag tone="plain">{STATUS[act.stato]}</Tag>
        <span className="ml-auto">
          <LevelTag level={act.verifica.livello} />
        </span>
      </div>
      <div>
        <h3 className="font-sans text-lg leading-snug font-bold tracking-normal">{act.titolo}</h3>
        <p className="mt-1 text-[14.5px] text-ink-soft">
          {LEGAL_ACT_TYPE[act.tipo]} n. {act.numero} del {formatDate(act.data)}, in Gazzetta dal {formatDate(act.gazzetta.data)}.{" "}
          {gov ? (
            <Link href={`/governi/${gov.id}`} className="font-semibold text-ink underline underline-offset-2 hover:text-accent">
              {gov.nome}
            </Link>
          ) : null}
        </p>
        <p className="mt-1 text-sm text-ink-faint">{act.titoloUfficiale}</p>
      </div>
      <Totals act={act} />
      <ul className="grid gap-3.5">
        {act.misure.map((m) => (
          <MeasureRow key={m.id} m={m} />
        ))}
      </ul>
      <SourceLinks fonti={links} />
      {act.note ? (
        <details className="text-sm">
          <summary className="flex min-h-11 cursor-pointer items-center text-ink-faint hover:text-ink">Note di lavoro della ricerca (testo tecnico)</summary>
          <p className="mt-1 max-w-[80ch] font-mono text-xs leading-relaxed break-words text-ink-soft">{act.note}</p>
        </details>
      ) : null}
      <div className="mt-auto flex flex-wrap gap-x-4.5 border-t border-rule">
        <a href={act.gazzetta.fonte.url} target="_blank" rel="noopener noreferrer" className={`${LINK} hover:text-accent`}>
          Leggi il testo
          <ArrowUpRightIcon size={16} weight="bold" aria-hidden />
        </a>
        <a href={correctionUrl(`/atti#${act.id}`, act.id)} target="_blank" rel="noopener noreferrer" className={`${LINK} text-ink-soft hover:text-ink`}>
          <FlagIcon size={16} aria-hidden />
          Segnala un errore
        </a>
      </div>
    </Card>
  );
}

function Coverage() {
  const { dal, al, obiettivo } = legalActsStatus;
  const recovering = dal > obiettivo;
  return (
    <Card className="reveal mt-8">
      <p className="font-bold">
        Gazzetta Ufficiale letta dal {formatDate(dal)} al {formatDate(al)}
      </p>
      <p className="mt-1 text-[15.5px] text-ink-soft">
        {recovering
          ? `Ogni giorno aggiungiamo gli atti nuovi e, a ritroso, quelli già usciti, fino al ${formatDate(obiettivo)}, l'inizio del governo Meloni. Finché il recupero non è finito, il registro non è completo.`
          : `Il registro copre tutto il periodo dal ${formatDate(obiettivo)}, l'inizio del governo Meloni.`}{" "}
        Un atto compare dopo che una seconda verifica indipendente ha ricontrollato ogni importo sul testo.
      </p>
    </Card>
  );
}

export default function LegalActsPage() {
  const byMonth = Map.groupBy(legalActs, (a) => a.gazzetta.data.slice(0, 7));
  const measureCount = legalActs.reduce((n, a) => n + a.misure.length, 0);
  return (
    <Wrap>
      <PageHead kicker="Gazzetta Ufficiale" title="Leggi e decreti che spostano soldi pubblici">
        <p>
          I decreti-legge, le leggi e i decreti legislativi che autorizzano una spesa o cambiano un&apos;entrata, con gli importi anno per
          anno come li scrive la norma. Finora: <b>{formatInt(legalActs.length)} atti</b> e <b>{formatInt(measureCount)} misure</b>.
        </p>
      </PageHead>

      <Coverage />

      <section aria-label="Come leggere gli importi" className="mt-4 grid gap-2.5 md:grid-cols-3">
        {RULES.map((r) => (
          <Card key={r.title} className="reveal">
            <h2 className="font-sans text-lg font-bold tracking-normal">{r.title}</h2>
            <p className="mt-1.5 text-[15.5px] text-ink-soft">{r.body}</p>
          </Card>
        ))}
      </section>

      {legalActs.length === 0 ? (
        <Card className="mt-12">
          <p className="font-bold">Il registro è appena partito.</p>
          <p className="mt-1 text-ink-soft">
            I primi atti compaiono qui dopo la verifica. Se conosci un atto con importi che manca, puoi{" "}
            <a href={correctionUrl("/atti")} target="_blank" rel="noopener noreferrer" className="font-semibold text-accent underline underline-offset-2">
              segnalarlo
            </a>
            .
          </p>
        </Card>
      ) : (
        <div className="mt-14 space-y-14 md:mt-20 md:space-y-20">
          {[...byMonth].map(([month, acts]) => (
            <section key={month} aria-labelledby={`m-${month}`}>
              <SectionHead id={`m-${month}`} title={formatMonth(month).replace(/^./, (c) => c.toUpperCase())} />
              <ul className="mt-5 grid gap-3.5 lg:grid-cols-2 lg:items-start">
                {acts.map((a) => (
                  <ActCard key={a.id} act={a} />
                ))}
              </ul>
            </section>
          ))}
        </div>
      )}
    </Wrap>
  );
}
