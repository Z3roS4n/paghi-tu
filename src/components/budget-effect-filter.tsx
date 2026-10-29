"use client";

import { useState } from "react";
import { Segmented } from "@/components/charts/segmented";

export type BudgetEffectView = "conti" | "incerto" | "no" | "tutte";

// Il filtro agisce solo via CSS sugli attributi data-effetto delle promesse (vedi globals.css):
// la pagina resta statica e completa, il filtro cambia soltanto cosa è visibile.
export function BudgetEffectFilter({ counts, children }: { counts: Record<BudgetEffectView, number>; children: React.ReactNode }) {
  const [view, setView] = useState<BudgetEffectView>("conti");
  const options: { id: BudgetEffectView; label: string }[] = [
    { id: "conti", label: `Riguardano i conti pubblici (${counts.conti})` },
    { id: "incerto", label: `Non chiaro (${counts.incerto})` },
    { id: "no", label: `Non li riguardano (${counts.no})` },
    { id: "tutte", label: `Tutte (${counts.tutte})` },
  ];
  return (
    <div data-vista={view} className="effect-filter">
      <div className="mt-8">
        <p className="mb-2 text-sm font-semibold text-ink-soft">Mostra le promesse</p>
        <Segmented label="Filtra per promesse che riguardano i conti pubblici" options={options} value={view} onChange={setView} />
        <p className="mt-2 max-w-[60ch] text-sm text-ink-faint">
          Una promessa riguarda i conti pubblici se parla di una spesa o di un&apos;entrata pubblica precisa, per cambiarla o per
          lasciarla com&apos;è: «non introdurre una tassa» e «introdurla» contano allo stesso modo. La classificazione la fanno due
          codificatori indipendenti con la stessa regola per tutti; quando non sono d&apos;accordo vale «non chiaro».
        </p>
      </div>
      {children}
    </div>
  );
}
