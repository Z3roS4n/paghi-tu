import type { Metadata } from "next";
import Link from "next/link";
import { SourceLinks } from "@/components/source-links";
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

export default function BudgetLawsPage() {
  const sorted = budgetLaws.toSorted((a, b) => b.annoInizio - a.annoInizio || a.tipoAtto.localeCompare(b.tipoAtto));

  return (
    <div className="mx-auto max-w-6xl px-4 py-12 md:px-6 md:py-16">
      <h1 className="text-4xl font-semibold tracking-tight md:text-5xl">Leggi di bilancio</h1>
      <p className="mt-4 max-w-[62ch] text-lg text-ink-soft">
        Estremi verificati su Normattiva. Il governo indicato è quello che ha presentato l'atto, non sempre quello che l'ha gestito.
      </p>

      <div className="mt-12 space-y-14">
        {ERAS.map((era) => {
          const rows = sorted.filter((l) => l.annoInizio >= era.from && l.annoInizio <= era.to);
          if (rows.length === 0) return null;
          return (
            <section key={era.title}>
              <h2 className="border-b border-ink pb-2 text-xl font-semibold">{era.title}</h2>
              <ul className="divide-y divide-rule">
                {rows.map((l) => {
                  const g = l.governoProponenteId ? getGovernment(l.governoProponenteId) : undefined;
                  return (
                    <li key={l.id} className="grid gap-2 py-4 md:grid-cols-[7rem_1.6fr_1fr_auto] md:items-start md:gap-6">
                      <span className="tabular font-mono">{l.annoEsercizio}</span>
                      <div>
                        <p className="text-sm text-ink-soft">{l.tipoAttoOriginale}</p>
                        <p>{l.estremi}</p>
                        <div className="mt-2">
                          <SourceLinks fonti={l.fonti} />
                        </div>
                      </div>
                      <p className="text-sm">
                        {g ? (
                          <Link href={`/governi/${g.id}`} className="hover:text-accent">
                            {g.nome.replace(/^Governo\s+/, "")}
                          </Link>
                        ) : (
                          <span className="text-ink-faint">Governo non attribuito: {l.governoProponenteTesto}</span>
                        )}
                        {l.governoProponenteAttribuzione === "inferita" ? (
                          <span className="block text-xs text-level-v2">dedotto dalla data di presentazione</span>
                        ) : null}
                      </p>
                      <LevelTag level={l.verifica.livello} />
                    </li>
                  );
                })}
              </ul>
            </section>
          );
        })}
      </div>
    </div>
  );
}
