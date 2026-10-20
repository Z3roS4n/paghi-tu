import type { Metadata } from "next";
import Link from "next/link";
import { SourceLinks } from "@/components/source-links";
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

function signed(n: number, text: string) {
  return n > 0 ? `+${text}` : text;
}

function Difference({ c }: { c: CostComparison }) {
  if (!c.consuntivo) return <span className="text-ink-faint">Non ancora disponibile</span>;
  if (!c.scostamento) {
    return <span className="text-ink-faint">Non calcolata: le due cifre misurano cose diverse</span>;
  }
  const { eur, pct, calcolatoDa } = c.scostamento;
  return (
    <span>
      <span className="tabular font-mono">
        {signed(eur, formatEuroMillions(eur / 1e6))}
        {pct === null ? null : ` (${signed(pct, `${formatDecimal(pct, 1)}%`)})`}
      </span>
      <span className="block text-xs text-ink-faint">
        {calcolatoDa === "fonte" ? "calcolo della fonte" : "calcolo nostro"}
        {c.consuntivo.proiezione ? ", con proiezione" : ""}
      </span>
    </span>
  );
}

function ComparisonRow({ c }: { c: CostComparison }) {
  return (
    <li className="py-6">
      <div className="grid grid-cols-2 gap-4 md:grid-cols-[10rem_1fr_1fr_1fr_6rem] md:gap-6">
        <p className="col-span-2 font-mono text-sm md:col-span-1">{c.periodo}</p>
        <div>
          <p className="text-xs text-ink-faint">{c.tipoOnere === "tetto" ? "Limite di spesa" : "Costo previsto"}</p>
          <p className="tabular font-mono text-lg">{formatEuroMillions(c.previsto.importoEur / 1e6)}</p>
        </div>
        <div>
          <p className="text-xs text-ink-faint">{c.consuntivo?.proiezione ? "Consuntivo con proiezione" : "Consuntivo"}</p>
          <p className="tabular font-mono text-lg">
            {c.consuntivo ? formatEuroMillions(c.consuntivo.importoEur / 1e6) : "—"}
          </p>
        </div>
        <div>
          <p className="text-xs text-ink-faint">Differenza · {HOMOGENEITY[c.omogeneita]}</p>
          <Difference c={c} />
        </div>
        <div title={CONFIDENCE[c.confidenza]}>
          <p className="text-xs text-ink-faint">Confidenza</p>
          <p className="font-mono text-lg">{c.confidenza}</p>
        </div>
      </div>
      <details className="group mt-4 text-sm">
        <summary className="cursor-pointer list-none text-ink-soft hover:text-ink">
          Come leggere questi numeri <span className="text-ink-faint group-open:hidden">(apri)</span>
        </summary>
        <div className="mt-4 grid gap-6 border-l-2 border-rule pl-4 md:grid-cols-2">
          <div className="space-y-2">
            <p>
              <span className="text-ink-faint">Previsto: </span>
              {c.previsto.descrizione}
            </p>
            <SourceLinks fonti={[c.previsto.fonte]} />
          </div>
          <div className="space-y-2">
            <p>
              <span className="text-ink-faint">Consuntivo: </span>
              {c.consuntivo ? c.consuntivo.descrizione : c.consuntivoAssente}
            </p>
            {c.consuntivo ? <SourceLinks fonti={[c.consuntivo.fonte]} /> : null}
          </div>
          <p className="max-w-[80ch] leading-relaxed text-ink-soft md:col-span-2">{c.noteMetodo}</p>
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

function MeasureSection({ m }: { m: Measure }) {
  const govs = m.governiIds.map((id) => getGovernment(id)).filter((g) => g !== undefined);
  return (
    <section id={m.id} aria-labelledby={`h-${m.id}`} className="scroll-mt-6">
      <div className="border-b border-ink pb-3">
        <h2 id={`h-${m.id}`} className="text-2xl font-semibold tracking-tight">
          {m.titolo}
        </h2>
        <p className="mt-1 text-sm text-ink-soft">{m.attoIstitutivo}</p>
        <p className="mt-1 text-sm text-ink-soft">
          {govs.map((g, i) => (
            <span key={g.id}>
              {i > 0 ? ", " : null}
              <Link href={`/governi/${g.id}`} className="underline underline-offset-2 hover:text-ink">
                {g.nome}
              </Link>
            </span>
          ))}
        </p>
        {m.governoTesto.includes("(") ? <p className="mt-1 text-sm text-ink-faint">{m.governoTesto}</p> : null}
      </div>
      <ul className="divide-y divide-rule">
        {m.confronti.map((c) => (
          <ComparisonRow key={c.id} c={c} />
        ))}
      </ul>
    </section>
  );
}

export default function MeasuresPage() {
  return (
    <div className="mx-auto max-w-6xl px-4 py-12 md:px-6 md:py-16">
      <h1 className="text-4xl font-semibold tracking-tight md:text-5xl">Quanto costano le misure</h1>
      <p className="mt-4 max-w-[62ch] text-lg text-ink-soft">
        Quanto lo Stato prevedeva di spendere quando una misura è stata approvata, e quanto ha speso davvero secondo
        chi ne misura l'effetto. Le differenze vanno in tutte e due le direzioni.
      </p>

      <section aria-labelledby="leggere" className="mt-10 grid gap-px border border-rule bg-rule md:grid-cols-3">
        <div className="bg-paper-raised p-5">
          <h2 id="leggere" className="font-semibold">
            Stima o limite
          </h2>
          <p className="mt-2 text-sm text-ink-soft">
            Un limite di spesa è il massimo autorizzato, non una previsione: spendere meno del limite non vuol dire
            aver risparmiato.
          </p>
        </div>
        <div className="bg-paper-raised p-5">
          <h3 className="font-semibold">Stessa base o basi diverse</h3>
          <p className="mt-2 text-sm text-ink-soft">
            Se previsto e consuntivo misurano cose diverse (per esempio il consuntivo include modifiche arrivate dopo),
            mostriamo le due cifre affiancate senza calcolare la differenza.
          </p>
        </div>
        <div className="bg-paper-raised p-5">
          <h3 className="font-semibold">Confidenza da A a D</h3>
          <p className="mt-2 text-sm text-ink-soft">
            A quando il confronto è fatto da una fonte istituzionale sulla stessa base, D quando manca il consuntivo
            o contiene proiezioni. Ogni riga spiega la sua.
          </p>
        </div>
      </section>

      <p className="mt-6 max-w-[75ch] text-sm text-ink-soft">
        Questi {measures.length} casi sono stati scelti fra governi diversi, ma la scelta non è casuale e non è
        bilanciata in senso stretto: mancano ancora i governi prima del 2008 e il governo Gentiloni. Importi in euro
        correnti. Il metodo è in{" "}
        <Link href="/metodo" className="underline underline-offset-2">
          Metodo
        </Link>
        .
      </p>

      <div className="mt-14 space-y-16">
        {measures.map((m) => (
          <MeasureSection key={m.id} m={m} />
        ))}
      </div>
    </div>
  );
}
