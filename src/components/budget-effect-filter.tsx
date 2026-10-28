"use client";

import { useState } from "react";
import { Segmented } from "@/components/charts/segmented";

export type BudgetEffectView = "conti" | "incerto" | "no" | "tutte";

// Il filtro agisce solo via CSS sugli attributi data-effetto delle promesse (vedi globals.css):
// la pagina resta statica e completa, il filtro cambia soltanto cosa è visibile.
export function BudgetEffectFilter({ counts, children }: { counts: Record<BudgetEffectView, number>; children: React.ReactNode }) {
  const [view, setView] = useState<BudgetEffectView>("conti");
  const options: { id: BudgetEffectView; label: string }[] = [
    { id: "conti", label: `Con effetto sui conti (${counts.conti})` },
    { id: "incerto", label: `Effetto non chiaro (${counts.incerto})` },
    { id: "no", label: `Senza effetto (${counts.no})` },
    { id: "tutte", label: `Tutte (${counts.tutte})` },
  ];
  return (
    <div data-vista={view} className="effect-filter">
      <div className="mt-8">
        <p className="mb-2 text-sm font-semibold text-ink-soft">Mostra le promesse</p>
        <Segmented label="Filtra per effetto sui conti pubblici" options={options} value={view} onChange={setView} />
        <p className="mt-2 max-w-[60ch] text-sm text-ink-faint">
          «Con effetto sui conti» vuol dire che la proposta, se fatta, cambia direttamente una spesa o un&apos;entrata pubblica. La
          classificazione la fanno due codificatori indipendenti; quando non sono d&apos;accordo vale «non chiaro».
        </p>
      </div>
      {children}
    </div>
  );
}
