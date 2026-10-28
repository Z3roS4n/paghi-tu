import type { Metadata } from "next";
import { Card, PageHead, Tag, Wrap } from "@/components/ui";
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
    <Wrap>
      <PageHead kicker="Registro delle fonti" title="Fonti">
        <p>
          Le fonti che usiamo o abbiamo valutato, ognuna con la sua licenza: «NV» dove non l&apos;abbiamo ancora verificata.
          Dove serve un permesso, non ripubblichiamo i dati finché non l&apos;abbiamo ottenuto.
        </p>
      </PageHead>
      <ul className="mt-8 grid gap-2.5 md:grid-cols-2">
        {sources.map((s) => (
          <Card as="li" key={s.id} className="reveal flex flex-col">
            <div className="flex items-start justify-between gap-4">
              <h2 className="text-xl leading-tight font-bold">{s.ente}</h2>
              <span className="tabular shrink-0 text-[13px] font-semibold text-ink-faint">{s.id}</span>
            </div>
            <p className="mt-1 text-ink-soft">{s.dataset}</p>
            <dl className="mt-4 grid gap-2 text-[15px]">
              {(
                [
                  ["Copertura", s.copertura],
                  ["Licenza", s.licenza],
                  ["Usata per", s.fonteDiVeritaPer],
                ] as const
              ).map(([k, v]) => (
                <div key={k} className="grid gap-0.5 sm:grid-cols-[6.5rem_1fr] sm:gap-3">
                  <dt className="font-semibold text-ink-faint">{k}</dt>
                  <dd className="min-w-0 break-words">{v}</dd>
                </div>
              ))}
            </dl>
            <p className="mt-auto pt-4">
              <Tag tone={s.riuso === "con_permesso" ? "accent" : "plain"}>{REUSE_LABEL[s.riuso]}</Tag>
            </p>
          </Card>
        ))}
      </ul>
    </Wrap>
  );
}
