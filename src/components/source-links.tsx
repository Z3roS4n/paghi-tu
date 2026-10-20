import { ArrowUpRightIcon } from "@phosphor-icons/react/ssr";
import type { SourceLink } from "@/lib/domain/schemas";

function hostLabel(url: string) {
  try {
    return new URL(url).hostname.replace(/^www\./, "");
  } catch {
    return url;
  }
}

export function SourceLinks({ fonti }: { fonti: SourceLink[] }) {
  if (fonti.length === 0) return <p className="text-sm text-ink-faint">Nessuna fonte collegata.</p>;
  return (
    <ul className="flex flex-wrap gap-2">
      {fonti.map((f) => (
        <li key={f.url}>
          <a
            href={f.url}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1 border border-rule bg-paper-raised px-2 py-1 font-mono text-xs text-ink-soft hover:border-ink hover:text-ink"
          >
            {f.etichetta ?? hostLabel(f.url)}
            <ArrowUpRightIcon size={12} weight="bold" aria-hidden />
          </a>
        </li>
      ))}
    </ul>
  );
}
