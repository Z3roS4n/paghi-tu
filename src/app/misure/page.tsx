import type { Metadata } from "next";
import Link from "next/link";
import { MeasureGaps } from "@/components/sections/finance";
import { SourceLinks } from "@/components/source-links";
import { Card, PageHead, SectionHead, Tag, Wrap } from "@/components/ui";
import { VerificationBadge } from "@/components/verification-badge";
import type { CostComparison, Measure } from "@/lib/domain/schemas";
import { formatDecimal, formatEuroMillions } from "@/lib/format";
import { getGovernment, measures } from "@/server/data";

export const metadata: Metadata = {
  title: "Quanto costano le misure",
  description:
    "Costo previsto quando una misura è stata approvata e costo effettivo misurato dopo, con fonti, basi di calcolo e limiti del confronto.",
};

const CONFIDENCE: Record<CostComparison["confidenza"], string> = {
  A: "Previsto e consuntivo da fonte primaria, stessa base: il confronto lo fa una fonte istituzionale.",
  B: "Previsto e consuntivo da fonte primaria, confronto calcolato da noi con differenze di base dichiarate.",
  C: "Un dato da fonte secondaria, oppure basi diverse.",
  D: "Solo il previsto, oppure un consuntivo che contiene proiezioni.",
};

const HOMOGENEITY: Record<CostComparison["omogeneita"], string> = {
  omogeneo: "Stessa base",
  parzialmente_omogeneo: "Basi in parte diverse",
  non_omogeneo: "Basi diverse",
};

const RULES = [
  {
    title: "Stima o limite",
    body: "Un limite di spesa è il massimo autorizzato, non una previsione: spendere meno del limite non vuol dire aver risparmiato.",
  },
  {
    title: "Stessa base o basi diverse",
    body: "Se previsto e consuntivo misurano cose diverse (per esempio il consuntivo include modifiche arrivate dopo), mostriamo le due cifre affiancate senza calcolare la differenza.",
  },
  {
    title: "Confidenza da A a D",
    body: "A quando il confronto è fatto da una fonte istituzionale sulla stessa base, D quando manca il consuntivo o contiene proiezioni. Ogni riga spiega la sua.",
  },
];

const money = (eur: number) => formatEuroMillions(eur / 1e6);
const signed = (n: number, text: string) => (n > 0 ? `+${text}` : text);

function Difference({ c }: { c: CostComparison }) {
  if (!c.consuntivo) return <p className="text-[15px] text-ink-soft">Consuntivo non ancora disponibile</p>;
  if (!c.scostamento) return <p className="text-[15px] text-ink-soft">Non calcolata: le due cifre misurano cose diverse</p>;
  const { eur, pct, calcolatoDa } = c.scostamento;
  // Con basi diverse niente percentuale; sotto un tetto non si parla di risparmio.
  const showPct = pct !== null && c.omogeneita !== "non_omogeneo";
  return (
    <>
      <p className="font-display tabular text-[clamp(1.25rem,5vw,1.6rem)] leading-tight font-bold tracking-[-0.02em]">
        {signed(eur, money(eur))}
        {showPct ? <span className="text-accent"> {signed(pct, `${formatDecimal(pct, 1)}%`)}</span> : null}
      </p>
      <p className="text-[13.5px] leading-snug text-ink-soft">
        {c.tipoOnere === "tetto" ? (eur < 0 ? "sotto il limite, non un risparmio" : "oltre il limite") : eur < 0 ? "speso meno della stima" : "speso più della stima"}
        , {calcolatoDa === "fonte" ? "calcolo della fonte" : "calcolo nostro"}
        {c.consuntivo.proiezione ? ", con proiezione" : ""}
      </p>
    </>
  );
}

function Figure({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-ctl bg-paper px-3.5 py-3">
      <p className="text-[13.5px] text-ink-soft">{label}</p>
      <p className="font-display tabular text-[clamp(1.25rem,5vw,1.6rem)] leading-tight font-bold tracking-[-0.02em]">{value}</p>
    </div>
  );
}

function ComparisonRow({ c }: { c: CostComparison }) {
  return (
    <li className="border-t border-rule pt-4 first:border-0 first:pt-0">
      <div className="flex flex-wrap items-center gap-1.5">
        <p className="mr-auto font-bold">{c.periodo}</p>
        <Tag tone="plain">{c.tipoOnere === "tetto" ? "Limite di spesa" : "Stima"}</Tag>
        <Tag tone="plain">{HOMOGENEITY[c.omogeneita]}</Tag>
        <span title={CONFIDENCE[c.confidenza]}>
          <Tag tone="plain">Confidenza {c.confidenza}</Tag>
        </span>
      </div>
      <div className="mt-3 grid grid-cols-2 gap-2.5 md:grid-cols-3">
        <Figure label={c.tipoOnere === "tetto" ? "Limite di spesa" : "Costo previsto"} value={money(c.previsto.importoEur)} />
        <Figure label={c.consuntivo?.proiezione ? "Consuntivo con proiezione" : "Consuntivo"} value={c.consuntivo ? money(c.consuntivo.importoEur) : "—"} />
        <div className="col-span-2 rounded-ctl bg-paper px-3.5 py-3 md:col-span-1">
          <p className="text-[13.5px] text-ink-soft">Differenza</p>
          <Difference c={c} />
        </div>
      </div>
      <details className="group mt-2 text-[15px]">
        <summary className="flex min-h-11 cursor-pointer list-none items-center gap-2 font-semibold text-ink-soft hover:text-ink [&::-webkit-details-marker]:hidden">
          Come leggere questi numeri
          <span className="font-normal text-ink-faint underline underline-offset-2 group-open:hidden">apri</span>
        </summary>
        <div className="mt-2 mb-2 grid gap-5 border-l-2 border-rule pl-4 md:grid-cols-2">
          <div className="space-y-2">
            <p>
              <b>Previsto.</b> <span className="text-ink-soft">{c.previsto.descrizione}</span>
            </p>
            <SourceLinks fonti={[c.previsto.fonte]} />
          </div>
          <div className="space-y-2">
            <p>
              <b>Consuntivo.</b> <span className="text-ink-soft">{c.consuntivo ? c.consuntivo.descrizione : c.consuntivoAssente}</span>
            </p>
            {c.consuntivo ? <SourceLinks fonti={[c.consuntivo.fonte]} /> : null}
          </div>
          <details className="text-sm md:col-span-2">
            <summary className="flex min-h-11 cursor-pointer items-center text-ink-faint hover:text-ink">Note di lavoro della ricerca (testo tecnico)</summary>
            <p className="mt-1 max-w-[80ch] font-mono text-xs leading-relaxed break-words text-ink-soft">{c.noteMetodo}</p>
          </details>
          <p className="text-ink-soft md:col-span-2">
            Confidenza {c.confidenza}: {CONFIDENCE[c.confidenza]}
          </p>
          <div className="md:col-span-2">
            <VerificationBadge verifica={c.verifica} />
          </div>
        </div>
      </details>
    </li>
  );
}

function MeasureCard({ m }: { m: Measure }) {
  const govs = m.governiIds.map((id) => getGovernment(id)).filter((g) => g !== undefined);
  return (
    <Card as="section" className="reveal scroll-mt-24">
      <div id={m.id} className="scroll-mt-24">
        <h3 id={`h-${m.id}`} className="text-[1.6rem] leading-tight font-extrabold">
          {m.titolo}
        </h3>
        <p className="mt-1 text-[15px] text-ink-soft">{m.attoIstitutivo}</p>
        <p className="mt-0.5 text-[15px] text-ink-soft">
          {govs.map((g, i) => (
            <span key={g.id}>
              {i > 0 ? ", " : null}
              <Link href={`/governi/${g.id}`} className="font-semibold text-ink underline underline-offset-2 hover:text-accent">
                {g.nome}
              </Link>
            </span>
          ))}
        </p>
        {m.governoTesto.includes("(") ? <p className="mt-0.5 text-sm text-ink-faint">{m.governoTesto}</p> : null}
      </div>
      <ul className="mt-5 grid gap-4">
        {m.confronti.map((c) => (
          <ComparisonRow key={c.id} c={c} />
        ))}
      </ul>
    </Card>
  );
}

export default function MeasuresPage() {
  return (
    <Wrap>
      <PageHead kicker="Previsto e speso" title="Quanto costano le misure">
        <p>
          Quanto lo Stato prevedeva di spendere quando una misura è stata approvata, e quanto ha speso davvero secondo chi ne misura
          l&apos;effetto. Le differenze vanno in tutte e due le direzioni.
        </p>
      </PageHead>

      <section aria-label="Come leggere i confronti" className="mt-8 grid gap-2.5 md:grid-cols-3">
        {RULES.map((r) => (
          <Card key={r.title} className="reveal">
            <h2 className="font-sans text-lg font-bold tracking-normal">{r.title}</h2>
            <p className="mt-1.5 text-[15.5px] text-ink-soft">{r.body}</p>
          </Card>
        ))}
      </section>

      <MeasureGaps />

      <section aria-labelledby="t-casi" className="mt-16 md:mt-24">
        <SectionHead id="t-casi" title="Misura per misura">
          <p>
            Questi {measures.length} casi sono stati scelti fra governi diversi, ma la scelta non è casuale e non è bilanciata in senso
            stretto: mancano ancora i governi prima del 2008 e il governo Gentiloni. Importi in euro correnti. Il metodo è in{" "}
            <Link href="/metodo" className="font-semibold text-accent underline underline-offset-2">
              Metodo
            </Link>
            .
          </p>
        </SectionHead>
        <div className="mt-6 grid gap-3.5 lg:grid-cols-2 lg:items-start">
          {measures.map((m) => (
            <MeasureCard key={m.id} m={m} />
          ))}
        </div>
      </section>
    </Wrap>
  );
}
