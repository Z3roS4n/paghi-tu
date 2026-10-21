import type { Metadata } from "next";
import { correctionUrl } from "@/lib/contribute";
import Link from "next/link";
import { SourceLinks } from "@/components/source-links";
import { VerificationBadge } from "@/components/verification-badge";
import { COFOG_DIVISIONS, type CampaignPromise } from "@/lib/domain/schemas";
import { formatDate, formatDecimal, formatInt } from "@/lib/format";
import { promiseStatus, promisesByParty } from "@/server/data";
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
    <div className="mt-4 space-y-2 border-l-2 border-accent pl-4 text-sm text-ink-soft">
      {v.annuo && v.perResidente && label ? (
        <p>
          {label}: {span(v.annuo, mln)} di euro l&apos;anno, in media {span(v.perResidente, (n) => `${formatInt(n)} €`)}{" "}
          per residente all&apos;anno
          {v.natura === "maggior_gettito" ? " (una media su tutti i residenti, non quanto pagherebbe ciascuno)" : ""}
          {v.quotaFunzione
            ? `, ${span(v.quotaFunzione, (n) => `${formatDecimal(n * 100, 1)}%`)} di quanto il settore pubblico ha speso nel ${costBase.annoFunzioni} per «${COFOG_DIVISIONS[p.cofog]}»`
            : ""}
          .
        </p>
      ) : null}
      {v.famiglia ? (
        <p>
          Misure dello stesso tipo ({v.famiglia}) già fatte in passato:{" "}
          {v.precedenti.length > 0
            ? v.precedenti
                .map((c) => `${c.titolo}, ${c.periodo}: ${formatDecimal(Math.abs(c.pct), 0)}% ${c.pct < 0 ? "in meno" : "in più"} della stima`)
                .join("; ")
            : "nessuna con un confronto omogeneo fra stima e costo effettivo"}
          . <Link href="/misure" className="underline underline-offset-2">Dettagli</Link>
        </p>
      ) : null}
      {v.sePrecedenti ? (
        <p>
          Se andasse come quelle misure: {span(v.sePrecedenti, mln)} di euro l&apos;anno. È un calcolo di Paghi Tu,
          non una previsione.
        </p>
      ) : null}
    </div>
  );
}

function PromiseItem({ p }: { p: CampaignPromise }) {
  const fonti = [
    { url: p.fonte.url, etichetta: SOURCE_TYPE[p.tipoFonte] },
    ...(p.archivioUrl ? [{ url: p.archivioUrl, etichetta: "Copia d'archivio" }] : []),
  ];
  return (
    <li id={p.id} className="grid scroll-mt-6 gap-4 py-6 md:grid-cols-[1fr_16rem] md:gap-10">
      <div className="min-w-0">
        <p className="text-lg leading-snug">{p.parafrasiNeutra}</p>
        <blockquote className="mt-3 border-l-2 border-rule pl-4 text-ink-soft">
          <p>«{p.testoLetterale}»</p>
          <footer className="mt-2 text-sm text-ink-faint">
            {p.dichiarante}, {p.ruoloDichiarante} · {formatDate(p.data)}
          </footer>
        </blockquote>
        {p.costoDichiarato || p.stimaTerzi ? (
          <dl className="mt-4 grid gap-2 text-sm sm:grid-cols-2">
            {p.costoDichiarato ? (
              <div>
                <dt className="text-ink-faint">Costo secondo chi propone</dt>
                <dd className="tabular">{p.costoDichiarato}</dd>
              </div>
            ) : null}
            {p.stimaTerzi ? (
              <div>
                <dt className="text-ink-faint">Stima indipendente</dt>
                <dd className="tabular">
                  <a
                    href={p.stimaTerzi.fonte.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="underline underline-offset-2"
                  >
                    {p.stimaTerzi.testo}
                  </a>
                </dd>
              </div>
            ) : null}
          </dl>
        ) : null}
        <CostContext p={p} />
      </div>
      <div className="space-y-3 text-sm">
        <p className="text-ink-soft">{COFOG_DIVISIONS[p.cofog]}</p>
        <p className="font-mono text-xs text-ink-faint">
          {HORIZON[p.orizzonte]} · {VEHICLE[p.veicolo]}
        </p>
        <SourceLinks fonti={fonti} />
        <VerificationBadge verifica={p.verifica} />
        <a
          href={correctionUrl(`/promesse#${p.id}`, p.id)}
          target="_blank"
          rel="noopener noreferrer"
          className="block text-xs text-ink-faint underline underline-offset-2 hover:text-ink"
        >
          Segnala un errore
        </a>
      </div>
    </li>
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

function Coverage() {
  return (
    <details className="group mt-8 border border-rule bg-paper-raised p-5 text-sm">
      <summary className="cursor-pointer list-none font-semibold">
        Copertura e limiti di questo censimento{" "}
        <span className="font-normal text-ink-faint group-open:hidden">(apri)</span>
      </summary>
      <ul className="mt-4 list-disc space-y-2 pl-5 text-ink-soft">
        {COVERAGE.map((line) => (
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
      <h2 id="stato" className="text-2xl font-semibold tracking-tight">
        A che punto siamo
      </h2>
      <ol className="mt-6 divide-y divide-rule border-y border-rule">
        {steps.map((s, i) => (
          <li key={s.title} className="grid gap-2 py-5 md:grid-cols-[3rem_1fr_8rem] md:gap-6">
            <span className="font-mono text-sm text-ink-faint">{String(i + 1).padStart(2, "0")}</span>
            <div>
              <h3 className="font-semibold">{s.title}</h3>
              <p className="mt-1 max-w-[65ch] text-ink-soft">{s.body}</p>
            </div>
            <span
              className={`font-mono text-xs md:text-right ${s.state === "Fatto" ? "text-ink-soft" : "text-accent"}`}
            >
              {s.state}
            </span>
          </li>
        ))}
      </ol>
      <p className="mt-6 max-w-[65ch] text-ink-soft">
        Pubblichiamo le promesse di tutti i partiti insieme, non uno alla volta. Il metodo è descritto in{" "}
        <Link href="/metodo" className="underline underline-offset-2">
          Metodo
        </Link>
        .
      </p>
    </section>
  );
}

export default function PromisesPage() {
  const groups = promisesByParty();
  return (
    <div className="mx-auto max-w-6xl px-4 py-12 md:px-6 md:py-16">
      <h1 className="text-4xl font-semibold tracking-tight md:text-5xl">Promesse per le politiche 2027</h1>
      <p className="mt-4 max-w-[62ch] text-lg text-ink-soft">
        Cosa propongono i partiti in vista delle politiche 2027: la frase esatta, chi l'ha detta, quando e dove, e se
        riguarda la prossima legislatura o quella in corso. Non diamo giudizi e non facciamo classifiche. Il costo è quello dichiarato da chi propone, oppure una stima di un ente
        indipendente, con la fonte.
      </p>

      {groups.length === 0 ? (
        <Pending />
      ) : (
        <>
          <nav aria-label="Partiti" className="mt-10 border-y border-rule py-4">
            <p className="font-mono text-xs text-ink-faint">Partiti in ordine alfabetico</p>
            <ul className="mt-3 flex flex-wrap gap-2">
              {groups.map(({ party }) => (
                <li key={party.id}>
                  <a
                    href={`#p-${party.id}`}
                    className="inline-block border border-rule px-3 py-1.5 text-sm hover:border-ink"
                  >
                    {party.nome}
                  </a>
                </li>
              ))}
            </ul>
          </nav>
          <Coverage />
          <div className="mt-12 space-y-16">
            {groups.map(({ party, items }) => (
              <section key={party.id} id={`p-${party.id}`} aria-labelledby={`h-${party.id}`} className="scroll-mt-6">
                <div className="flex flex-wrap items-baseline justify-between gap-x-6 gap-y-1 border-b border-ink pb-3">
                  <h2 id={`h-${party.id}`} className="text-2xl font-semibold tracking-tight">
                    {party.nome}
                  </h2>
                  <p className="font-mono text-xs text-ink-faint">{party.coalizione}</p>
                </div>
                <ul className="divide-y divide-rule">
                  {items.map((p) => (
                    <PromiseItem key={p.id} p={p} />
                  ))}
                </ul>
              </section>
            ))}
          </div>
        </>
      )}
    </div>
  );
}
