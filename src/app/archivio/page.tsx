import type { Metadata } from "next";
import { ArchiveSearch } from "@/components/archive-search";
import { PageHead, Wrap } from "@/components/ui";
import { budgetLaws, governments, measures, promises } from "@/server/data";
import { formatInt } from "@/lib/format";

export const metadata: Metadata = {
  title: "Archivio",
  description: "Cerca fra governi, leggi di bilancio, misure e promesse elettorali, con la fonte di ogni dato.",
};

export default function ArchivePage() {
  const counts = [
    [governments.length, "governi"],
    [budgetLaws.length, "atti di bilancio"],
    [measures.length, "misure"],
    [promises.length, "promesse"],
  ] as const;
  return (
    <Wrap className="max-w-4xl">
      <PageHead title="Archivio">
        <p>
          Tutto quello che abbiamo verificato, in un solo posto:{" "}
          {counts.map(([n, label], i) => (
            <span key={label}>
              <b>{formatInt(n)}</b> {label}
              {i < counts.length - 1 ? ", " : ""}
            </span>
          ))}
          . Si aggiorna quando aggiungiamo dati nuovi.
        </p>
      </PageHead>
      <div className="mt-8">
        <ArchiveSearch />
      </div>
    </Wrap>
  );
}
