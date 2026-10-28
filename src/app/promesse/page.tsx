import type { Metadata } from "next";
import Link from "next/link";
import { ArrowUpRightIcon, FlagIcon } from "@phosphor-icons/react/ssr";
import { BudgetEffectFilter, type BudgetEffectView } from "@/components/budget-effect-filter";
import { Card, PageHead, SectionHead, Tag, Wrap } from "@/components/ui";
import { LevelTag, VerificationBadge } from "@/components/verification-badge";
import { correctionUrl } from "@/lib/contribute";
import { COFOG_DIVISIONS, type BudgetEffect, type CampaignPromise } from "@/lib/domain/schemas";
import { formatDate, formatDecimal, formatInt } from "@/lib/format";
import { parties, promises, promiseStatus, promisesByParty, unreadableChannels } from "@/server/data";
import { costBase, promiseCostView } from "@/server/promise-costs";

export const metadata: Metadata = {
  title: "Promesse per le politiche 2027",
  description:
    "Le promesse dei partiti per le prossime elezioni politiche, con la frase esatta, chi l'ha detta, quando e la fonte.",
};

const SOURCE_TYPE: Record<CampaignPromise["tipoFonte"], string> = {
  programma: "Programma",
  documento_partito: "Documento del partito",
  sito_ufficiale: "Sito ufficiale",
  social_ufficiale: "Account social ufficiale",
  discorso: "Discorso",
  video: "Video",
  intervista: "Intervista",
  stenografico: "Resoconto stenografico",
  atto_parlamentare: "Atto parlamentare",
};

const HORIZON: Record<CampaignPromise["orizzonte"], string> = {
  prossima_legislatura: "Per la prossima legislatura",
  legislatura_in_corso: "Nella legislatura in corso",
  non_specificato: "Tempi non indicati",
};

const VEHICLE: Record<CampaignPromise["veicolo"], string> = {
  programma: "Programma",
  documento_partito: "Documento del partito",
  dichiarazione: "Dichiarazione",
  proposta_di_legge: "Proposta di legge",
  emendamento: "Emendamento",
  risoluzione_mozione: "Risoluzione o mozione",
  richiesta_legge_bilancio: "Richiesta sulla legge di bilancio",
  richiesta_decreto: "Richiesta su un decreto",
  appello_raccolta_firme: "Appello con raccolta firme",
  altro: "Altro",
};

const EFFECT: Record<BudgetEffect, string> = {
  si: "Effetto sui conti pubblici",
  no: "Nessun effetto diretto sui conti",
  incerto: "Effetto sui conti non chiaro",
};

const effectKey = (p: CampaignPromise) => p.effettoConti ?? "nd";

// Alcune citazioni hanno già le loro virgolette (frase citata seguita dal testo dell'articolo): non si raddoppiano.
const quoted = (text: string) => (/[«»]/.test(text) ? text : `«${text}»`);

const mln = (n: number) => `${formatInt(n)} milioni`;
const span = (r: readonly [number, number], f: (n: number) => string) =>
  f(r[0]) === f(r[1]) ? f(r[0]) : `tra ${f(r[0])} e ${f(r[1])}`;
const NATURE_LABEL = {
  spesa: "Costo dichiarato",
  minor_gettito: "Entrate in meno dichiarate",
  maggior_gettito: "Entrate in più dichiarate",
} as const;

// D-021: traduzione aritmetica della cifra del proponente e confronto con misure dello stesso tipo.
function CostContext({ p }: { p: CampaignPromise }) {
  const v = promiseCostView(p.id, p.cofog);
  if (!v || (!v.annuo && !v.famiglia)) return null;
  const label = v.natura && v.natura in NATURE_LABEL ? NATURE_LABEL[v.natura as keyof typeof NATURE_LABEL] : null;
  return (
    <div className="grid gap-1.5 rounded-ctl bg-accent-soft px-3.5 py-3 text-[15px] leading-normal">
      {v.annuo && v.perResidente && label ? (
        <p>
          <b>
            {label}: {span(v.annuo, mln)} di euro l&apos;anno
          </b>
          , in media {span(v.perResidente, (n) => `${formatInt(n)} €`)} per residente all&apos;anno
          {v.natura === "maggior_gettito" ? " (una media su tutti i residenti, non quanto pagherebbe ciascuno)" : ""}
          {v.quotaFunzione
            ? `, ${span(v.quotaFunzione, (n) => `${formatDecimal(n * 100, 1)}%`)} di quanto il settore pubblico ha speso nel ${costBase.annoFunzioni} per «${COFOG_DIVISIONS[p.cofog]}»`
            : ""}
          .
        </p>
      ) : null}
      {v.famiglia ? (
        <p className="text-sm text-ink-soft">
          Misure dello stesso tipo ({v.famiglia}) già fatte in passato:{" "}
          {v.precedenti.length > 0
            ? v.precedenti
                .map((c) => `${c.titolo}, ${c.periodo}: ${formatDecimal(Math.abs(c.pct), 0)}% ${c.pct < 0 ? "in meno" : "in più"} della stima`)
                .join("; ")
            : "nessuna con un confronto omogeneo fra stima e costo effettivo"}
          .{" "}
          <Link href="/misure" className="font-semibold text-ink underline underline-offset-2">
            Dettagli
          </Link>
        </p>
      ) : null}
      {v.sePrecedenti ? (
        <p className="text-sm text-ink-soft">
          Se andasse come quelle misure: {span(v.sePrecedenti, mln)} di euro l&apos;anno. È un calcolo di Paghi Tu, non una previsione.
        </p>
      ) : null}
    </div>
  );
}

const LINK = "inline-flex min-h-12 items-center gap-1.5 text-[15px] font-bold";

// D-031: la stessa proposta detta di nuovo dallo stesso partito resta sotto la riga originale.
function Restatements({ p }: { p: CampaignPromise }) {
  if (p.ribadita.length === 0) return null;
  return (
    <details className="group text-[15px]">
      <summary className="flex min-h-11 cursor-pointer list-none items-center gap-2 font-semibold text-ink-soft hover:text-ink [&::-webkit-details-marker]:hidden">
        Ribadita {p.ribadita.length === 1 ? "un'altra volta" : `altre ${p.ribadita.length} volte`}, l&apos;ultima il {formatDate(p.ribadita.at(-1)!.data)}
        <span className="font-normal text-ink-faint underline underline-offset-2 group-open:hidden">apri</span>
      </summary>
      <ul className="mt-1 mb-2 space-y-3 border-l-2 border-rule pl-4">
        {p.ribadita.map((r) => (
          <li key={r.id} id={r.id} className="scroll-mt-24 space-y-1">
            <p>{quoted(r.testoLetterale)}</p>
            <p className="text-sm text-ink-soft">
              {r.dichiarante}, {r.ruoloDichiarante}. {SOURCE_TYPE[r.tipoFonte]}, {formatDate(r.data)}.{" "}
              <a href={r.fonte.url} target="_blank" rel="noopener noreferrer" className="font-semibold text-ink underline underline-offset-2">
                Fonte
              </a>
              {r.archivioUrl ? (
                <>
                  {" · "}
                  <a href={r.archivioUrl} target="_blank" rel="noopener noreferrer" className="font-semibold text-ink underline underline-offset-2">
                    Copia d&apos;archivio
                  </a>
                </>
              ) : null}
            </p>
            <LevelTag level={r.verifica.livello} />
          </li>
        ))}
      </ul>
    </details>
  );
}

function PromiseItem({ p, party }: { p: CampaignPromise; party: string }) {
  return (
    <Card as="li" className="reveal flex flex-col gap-2.5 pb-0!" data-effetto={effectKey(p)}>
      <div id={p.id} className="flex scroll-mt-24 flex-wrap items-center gap-1.5">
        <Tag tone="plain">{party}</Tag>
        <span className="ml-auto">
          <LevelTag level={p.verifica.livello} />
        </span>
      </div>
      <h3 className="font-sans text-lg leading-snug font-bold tracking-normal">{p.parafrasiNeutra}</h3>
      <blockquote className="m-0 border-l-[3px] border-accent pl-3.5 text-[16.5px] leading-relaxed">
        <p>{quoted(p.testoLetterale)}</p>
      </blockquote>
      <p className="text-[14.5px] text-ink-soft">
        {p.dichiarante}, {p.ruoloDichiarante}. {SOURCE_TYPE[p.tipoFonte]}, {formatDate(p.data)}.
      </p>
      {p.costoDichiarato || p.stimaTerzi ? (
        <dl className="grid gap-2 rounded-ctl bg-accent-soft px-3.5 py-3 text-[15px] sm:grid-cols-2">
          {p.costoDichiarato ? (
            <div>
              <dt className="text-sm text-ink-soft">Costo secondo chi propone</dt>
              <dd className="tabular font-bold">{p.costoDichiarato}</dd>
            </div>
          ) : null}
          {p.stimaTerzi ? (
            <div>
              <dt className="text-sm text-ink-soft">Stima indipendente</dt>
              <dd className="tabular">
                <a href={p.stimaTerzi.fonte.url} target="_blank" rel="noopener noreferrer" className="font-bold underline underline-offset-2">
                  {p.stimaTerzi.testo}
                </a>
              </dd>
            </div>
          ) : null}
        </dl>
      ) : null}
      <CostContext p={p} />
      <ul className="flex flex-wrap gap-1.5 text-[13.5px]" aria-label="Classificazione">
        {[p.effettoConti ? EFFECT[p.effettoConti] : "Effetto sui conti da classificare", COFOG_DIVISIONS[p.cofog], HORIZON[p.orizzonte], VEHICLE[p.veicolo]].map((t) => (
          <li key={t} className="rounded-ctl bg-paper-sunk px-2 py-1 text-ink-soft">
            {t}
          </li>
        ))}
      </ul>
      <Restatements p={p} />
      <VerificationBadge verifica={p.verifica} />
      <div className="mt-auto flex flex-wrap gap-x-4.5 border-t border-rule">
        <a href={p.fonte.url} target="_blank" rel="noopener noreferrer" className={`${LINK} hover:text-accent`}>
          Leggi la fonte
          <ArrowUpRightIcon size={16} weight="bold" aria-hidden />
        </a>
        {p.archivioUrl ? (
          <a href={p.archivioUrl} target="_blank" rel="noopener noreferrer" className={`${LINK} hover:text-accent`}>
            Copia d&apos;archivio
            <ArrowUpRightIcon size={16} weight="bold" aria-hidden />
          </a>
        ) : null}
        <a href={correctionUrl(`/promesse#${p.id}`, p.id)} target="_blank" rel="noopener noreferrer" className={`${LINK} text-ink-soft hover:text-ink`}>
          <FlagIcon size={16} aria-hidden />
          Segnala un errore
        </a>
      </div>
    </Card>
  );
}

const COVERAGE = [
  "Al 21 ottobre 2026 solo alcuni partiti hanno pubblicato un documento programmatico per le politiche. Per gli altri le promesse vengono da proposte di legge, richieste sulla legge di bilancio, dichiarazioni e interviste dei leader: per questo il numero di righe dipende anche da quanto ogni partito ha messo per iscritto.",
  "Molte proposte riguardano la legge di bilancio 2027 o leggi in discussione ora: sono indicate come «Nella legislatura in corso», per la maggioranza come per l'opposizione.",
  "Partito Democratico: il sito nazionale non è leggibile dai nostri strumenti; sette passaggi del discorso del 18 ottobre restano fuori finché non li confrontiamo con il video ufficiale.",
  "Forza Italia: dal 19 marzo 2026 il sito del partito non ha pubblicato notizie; le righe vengono da interviste del segretario e di altri dirigenti, in parte ripubblicate sul sito del Ministero degli Esteri.",
  "Quando un partito presenta un pacchetto di misure, per esempio una proposta di legge o una risoluzione, ogni misura diventa una riga. Per questo il numero di righe non dice quanto un partito propone, né quanto le sue proposte pesano.",
  "Per i partiti con programmi molto lunghi il censimento può non essere completo. Le formazioni minori entrano se hanno annunciato una lista nazionale con fonte verificabile.",
];

function unreadableLine(c: (typeof unreadableChannels)[number]) {
  const name = parties.find((p) => p.id === c.partito)?.nome ?? c.partito;
  const last = c.ultimoControlloRiuscito ? `l'ultimo controllo riuscito è del ${formatDate(c.ultimoControlloRiuscito)}` : "finora nessun controllo è riuscito";
  return `${name}: dal ${formatDate(c.dal)} i canali ufficiali (${c.canali.join(", ")}) non sono leggibili dai nostri strumenti; ${last}. Le promesse nuove di questo partito arrivano dopo un controllo a mano.`;
}

function Coverage() {
  return (
    <details className="group reveal mt-4 rounded-card bg-paper-raised px-4 md:px-6">
      <summary className="flex min-h-12 cursor-pointer list-none items-center justify-between gap-3 font-bold [&::-webkit-details-marker]:hidden">
        Copertura e limiti di questo censimento
        <span className="text-sm font-normal text-ink-faint underline underline-offset-2 group-open:hidden">apri</span>
      </summary>
      <ul className="mb-4 list-disc space-y-2 pl-5 text-[15px] text-ink-soft">
        {[...COVERAGE, ...unreadableChannels.map(unreadableLine)].map((line) => (
          <li key={line}>{line}</li>
        ))}
      </ul>
    </details>
  );
}

function Pending() {
  const steps = [
    {
      title: "Censimento sui canali ufficiali",
      state: "Fatto",
      body: `${formatInt(promiseStatus.censite)} dichiarazioni dal ${formatDate(promiseStatus.periodo.dal)} al ${formatDate(promiseStatus.periodo.al)}: programmi, siti e documenti dei partiti, discorsi e interviste dei leader.`,
    },
    {
      title: "Verifica indipendente, riga per riga",
      state: "In corso",
      body: `Un secondo controllo riapre ogni fonte e confronta la frase parola per parola. Confermate finora: ${formatInt(promiseStatus.verificate)} su ${formatInt(promiseStatus.censite)}.`,
    },
    {
      title: "Controllo di simmetria",
      state: "Da fare",
      body: "Stessa profondità di ricerca e stesse regole per ogni partito, di maggioranza e di opposizione, prima di pubblicare chiunque.",
    },
  ];
  return (
    <section aria-labelledby="stato" className="mt-12">
      <SectionHead id="stato" title="A che punto siamo" />
      <ol className="mt-6 grid gap-2.5 md:grid-cols-3">
        {steps.map((s, i) => (
          <Card as="li" key={s.title} className="reveal">
            <div className="flex items-center justify-between gap-3">
              <span className="font-display tabular text-2xl font-extrabold text-ink-faint">{String(i + 1).padStart(2, "0")}</span>
              <Tag tone={s.state === "Fatto" ? "plain" : "accent"}>{s.state}</Tag>
            </div>
            <h3 className="mt-2 font-sans text-lg font-bold tracking-normal">{s.title}</h3>
            <p className="mt-1 text-[15.5px] text-ink-soft">{s.body}</p>
          </Card>
        ))}
      </ol>
      <p className="mt-6 max-w-[65ch] text-ink-soft">
        Pubblichiamo le promesse di tutti i partiti insieme, non uno alla volta. Il metodo è descritto in{" "}
        <Link href="/metodo" className="font-semibold text-accent underline underline-offset-2">
          Metodo
        </Link>
        .
      </p>
    </section>
  );
}

function effectCounts(): Record<BudgetEffectView, number> {
  const n = (k: string) => promises.filter((p) => effectKey(p) === k).length;
  return { conti: n("si") + n("nd"), incerto: n("incerto"), no: n("no"), tutte: promises.length };
}

const effectsOf = (items: CampaignPromise[]) => [...new Set(items.map(effectKey))].join(" ");

export default function PromisesPage() {
  const groups = promisesByParty();
  return (
    <Wrap>
      <PageHead kicker="Elezioni politiche 2027" title="Promesse per le politiche 2027">
        <p>
          Cosa propongono i partiti in vista delle politiche 2027: la frase esatta, chi l&apos;ha detta, quando e dove, e se riguarda la
          prossima legislatura o quella in corso. Non diamo giudizi e non facciamo classifiche. Il costo è quello dichiarato da chi
          propone, oppure una stima di un ente indipendente, con la fonte.
        </p>
      </PageHead>

      {groups.length === 0 ? (
        <Pending />
      ) : (
        <>
          <nav aria-label="Partiti" className="mt-8">
            <p className="text-sm font-semibold text-ink-soft">Partiti in ordine alfabetico</p>
            <ul className="mt-2 flex flex-wrap gap-2">
              {groups.map(({ party, items }) => (
                <li key={party.id} data-effetti={effectsOf(items)}>
                  <a
                    href={`#p-${party.id}`}
                    className="inline-flex min-h-11 items-center rounded-ctl border-[1.5px] border-rule bg-paper-raised px-3.5 text-[15px] font-semibold hover:border-ink-faint"
                  >
                    {party.nome}
                  </a>
                </li>
              ))}
            </ul>
          </nav>
          <Coverage />
          <BudgetEffectFilter counts={effectCounts()}>
          <div className="mt-12 space-y-14 md:mt-16 md:space-y-20">
            {groups.map(({ party, items }) => (
              <section key={party.id} id={`p-${party.id}`} aria-labelledby={`h-${party.id}`} className="scroll-mt-24" data-effetti={effectsOf(items)}>
                <div className="flex flex-wrap items-baseline justify-between gap-x-6 gap-y-1">
                  <h2 id={`h-${party.id}`} className="reveal text-[clamp(1.6rem,6vw,2.4rem)] leading-tight font-extrabold">
                    {party.nome}
                  </h2>
                  <p className="text-sm text-ink-faint">{party.coalizione}</p>
                </div>
                <ul className="mt-4 grid gap-3.5 md:grid-cols-2">
                  {items.map((p) => (
                    <PromiseItem key={p.id} p={p} party={party.nome} />
                  ))}
                </ul>
              </section>
            ))}
          </div>
          </BudgetEffectFilter>
        </>
      )}
    </Wrap>
  );
}
