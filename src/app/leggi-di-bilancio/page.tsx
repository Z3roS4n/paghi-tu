import type { Metadata } from "next";
import Link from "next/link";
import { SourceLinks } from "@/components/source-links";
import { PageHead, Wrap } from "@/components/ui";
import { LevelTag } from "@/components/verification-badge";
import { budgetLaws, getGovernment } from "@/server/data";

export const metadata: Metadata = {
  title: "Leggi di bilancio",
  description: "Le leggi con cui lo Stato ha approvato i suoi bilanci e le sue manovre, dal 1946 a oggi, con estremi e governo proponente.",
};

const ERAS = [
  { from: 2017, to: 9999, title: "Legge di bilancio (dal 2017)" },
  { from: 2011, to: 2016, title: "Legge di stabilità (2011-2016)" },
  { from: 1979, to: 2010, title: "Legge finanziaria (1979-2010)" },
  { from: 1965, to: 1978, title: "Legge di bilancio unica, anno solare (1965-1978)" },
  { from: 0, to: 1964, title: "Bilanci per ministero, esercizio luglio-giugno (1946-1964)" },
] as const;

const COLS = "md:grid-cols-[7rem_minmax(0,1.6fr)_minmax(0,1fr)_auto]";

export default function BudgetLawsPage() {
  const sorted = budgetLaws.toSorted((a, b) => b.annoInizio - a.annoInizio || a.tipoAtto.localeCompare(b.tipoAtto));

  return (
    <Wrap>
      <PageHead kicker={`${budgetLaws.length} atti dal 1946`} title="Leggi di bilancio">
        <p>
          Estremi verificati su Normattiva. Il governo indicato è quello che ha presentato l&apos;atto, non sempre quello che l&apos;ha
          gestito.
        </p>
      </PageHead>

      <div className="mt-10 space-y-12">
        {ERAS.map((era) => {
          const rows = sorted.filter((l) => l.annoInizio >= era.from && l.annoInizio <= era.to);
          if (rows.length === 0) return null;
          const id = `era-${era.from}`;
          return (
            <section key={era.title} aria-labelledby={id} className="reveal">
              <h2 id={id} className="border-b-2 border-ink pb-2 text-[clamp(1.4rem,5.4vw,1.9rem)] leading-tight font-extrabold">
                {era.title}
              </h2>
              <ul className="mt-3 grid gap-2">
                <li aria-hidden className={`hidden px-5 text-[13px] font-semibold text-ink-faint md:grid md:gap-6 ${COLS}`}>
                  <span>Esercizio</span>
                  <span>Atto</span>
                  <span>Governo proponente</span>
                  <span>Verifica</span>
                </li>
                {rows.map((l) => {
                  const g = l.governoProponenteId ? getGovernment(l.governoProponenteId) : undefined;
                  return (
                    <li
                      key={l.id}
                      id={l.id}
                      className={`grid scroll-mt-24 grid-cols-[1fr_auto] gap-x-4 gap-y-2 rounded-card bg-paper-raised px-4 py-3.5 md:items-start md:gap-6 md:px-5 ${COLS}`}
                    >
                      <span className="font-display tabular text-xl leading-tight font-bold">{l.annoEsercizio}</span>
                      <span className="justify-self-end md:order-last">
                        <LevelTag level={l.verifica.livello} />
                      </span>
                      <div className="col-span-2 md:col-span-1">
                        <p className="text-sm text-ink-soft">{l.tipoAttoOriginale}</p>
                        <p className="font-semibold">{l.estremi}</p>
                        <div className="mt-2">
                          <SourceLinks fonti={l.fonti} />
                        </div>
                      </div>
                      <p className="col-span-2 text-[15px] md:col-span-1">
                        <span className="text-[13px] text-ink-faint md:hidden">Governo proponente: </span>
                        {g ? (
                          <Link href={`/governi/${g.id}`} className="inline-flex min-h-11 items-center font-semibold hover:text-accent md:min-h-0">
                            {g.nome.replace(/^Governo\s+/, "")}
                          </Link>
                        ) : (
                          <span className="text-ink-faint">Governo non attribuito: {l.governoProponenteTesto}</span>
                        )}
                        {l.governoProponenteAttribuzione === "inferita" ? (
                          <span className="block text-[13px] font-semibold text-level-v2">dedotto dalla data di presentazione</span>
                        ) : null}
                      </p>
                    </li>
                  );
                })}
              </ul>
            </section>
          );
        })}
      </div>
    </Wrap>
  );
}
