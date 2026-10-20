import type { Metadata } from "next";
import { sources } from "@/server/data";
import type { Source } from "@/lib/domain/schemas";

export const metadata: Metadata = {
  title: "Fonti",
  description: "Registro delle fonti usate da Paghi Tu: ente, copertura, licenza e condizioni di riuso.",
};

const REUSE_LABEL: Record<Source["riuso"], string> = {
  si: "Riuso libero",
  con_citazione: "Riuso con citazione",
  con_permesso: "Serve un permesso",
};

export default function SourcesPage() {
  return (
    <div className="mx-auto max-w-6xl px-4 py-12 md:px-6 md:py-16">
      <h1 className="text-4xl font-semibold tracking-tight md:text-5xl">Fonti</h1>
      <p className="mt-4 max-w-[62ch] text-lg text-ink-soft">
        Le fonti che usiamo o abbiamo valutato, con la licenza verificata. Dove serve un permesso, non ripubblichiamo i dati finché non l'abbiamo ottenuto.
      </p>
      <ul className="mt-12 grid gap-px bg-rule md:grid-cols-2">
        {sources.map((s) => (
          <li key={s.id} className="bg-paper p-6">
            <div className="flex items-baseline justify-between gap-4">
              <h2 className="font-semibold">{s.ente}</h2>
              <span className="font-mono text-xs text-ink-faint">{s.id}</span>
            </div>
            <p className="mt-1 text-ink-soft">{s.dataset}</p>
            <dl className="mt-4 space-y-2 text-sm">
              <div><dt className="inline text-ink-faint">Copertura: </dt><dd className="inline">{s.copertura}</dd></div>
              <div><dt className="inline text-ink-faint">Licenza: </dt><dd className="inline">{s.licenza}</dd></div>
              <div><dt className="inline text-ink-faint">Usata per: </dt><dd className="inline">{s.fonteDiVeritaPer}</dd></div>
            </dl>
            <p className={`mt-4 font-mono text-xs ${s.riuso === "con_permesso" ? "text-accent" : "text-ink-soft"}`}>
              {REUSE_LABEL[s.riuso]}
            </p>
          </li>
        ))}
      </ul>
    </div>
  );
}
