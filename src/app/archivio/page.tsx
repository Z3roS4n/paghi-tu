import type { Metadata } from "next";
import { ArchiveSearch } from "@/components/archive-search";
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
    <div className="mx-auto max-w-4xl px-4 py-12 md:px-6 md:py-16">
      <h1 className="text-4xl font-semibold tracking-tight md:text-5xl">Archivio</h1>
      <p className="mt-4 max-w-[60ch] text-lg text-ink-soft">
        Tutto quello che abbiamo verificato, in un solo posto:{" "}
        {counts.map(([n, label], i) => `${formatInt(n)} ${label}${i < counts.length - 1 ? ", " : ""}`)}. Si aggiorna quando
        aggiungiamo dati nuovi.
      </p>
      <div className="mt-10">
        <ArchiveSearch />
      </div>
    </div>
  );
}
