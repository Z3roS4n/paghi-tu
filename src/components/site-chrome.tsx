import Link from "next/link";
import { REPO_URL } from "@/lib/contribute";

const NAV = [
  { href: "/spesa", label: "Spesa" },
  { href: "/governi", label: "Governi" },
  { href: "/leggi-di-bilancio", label: "Leggi di bilancio" },
  { href: "/promesse", label: "Promesse" },
  { href: "/misure", label: "Misure" },
  { href: "/archivio", label: "Archivio" },
  { href: "/metodo", label: "Metodo" },
  { href: "/fonti", label: "Fonti" },
] as const;

export function SiteHeader() {
  return (
    <header className="border-b border-rule">
      <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-x-6 gap-y-3 px-4 py-4 md:h-16 md:flex-nowrap md:px-6 md:py-0">
        <Link href="/" className="shrink-0 font-mono text-lg font-semibold tracking-tight whitespace-nowrap">
          Paghi Tu
        </Link>
        <nav aria-label="Sezioni principali" className="w-full min-w-0 overflow-x-auto md:w-auto">
          <ul className="flex gap-5 text-sm whitespace-nowrap text-ink-soft">
            {NAV.map((item) => (
              <li key={item.href}>
                <Link href={item.href} className="hover:text-ink">
                  {item.label}
                </Link>
              </li>
            ))}
          </ul>
        </nav>
      </div>
    </header>
  );
}

export function SiteFooter() {
  return (
    <footer className="mt-24 border-t border-rule">
      <div className="mx-auto grid max-w-6xl gap-8 px-4 py-10 text-sm text-ink-soft md:grid-cols-[2fr_1fr_1fr] md:px-6">
        <p className="max-w-[55ch]">
          Paghi Tu pubblica solo dati con fonte, con lo stesso metodo per ogni governo e ogni partito. È un progetto
          aperto: chiunque può segnalare un errore o proporre una correzione. Codice con licenza MIT; i dati hanno la
          licenza indicata per ciascuna fonte.
        </p>
        <ul className="space-y-2">
          <li><Link href="/chi-siamo" className="hover:text-ink">Chi siamo</Link></li>
          <li><Link href="/correzioni" className="hover:text-ink">Segnala un errore</Link></li>
          <li>
            <a href={REPO_URL} target="_blank" rel="noopener noreferrer" className="hover:text-ink">
              Codice e dati su GitHub
            </a>
          </li>
        </ul>
        <ul className="space-y-2">
          <li><Link href="/note-legali" className="hover:text-ink">Note legali e privacy</Link></li>
          <li><Link href="/metodo" className="hover:text-ink">Come verifichiamo</Link></li>
        </ul>
      </div>
    </footer>
  );
}
