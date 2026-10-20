import Link from "next/link";

const NAV = [
  { href: "/governi", label: "Governi" },
  { href: "/leggi-di-bilancio", label: "Leggi di bilancio" },
  { href: "/metodo", label: "Metodo" },
  { href: "/fonti", label: "Fonti" },
] as const;

export function SiteHeader() {
  return (
    <header className="border-b border-rule">
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between gap-6 px-4 md:px-6">
        <Link href="/" className="font-mono text-lg font-semibold tracking-tight">
          Paghi Tu
        </Link>
        <nav aria-label="Sezioni principali" className="min-w-0 overflow-x-auto">
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
          Paghi Tu pubblica solo dati con fonte, con lo stesso metodo per ogni governo e ogni partito.
          Codice con licenza MIT; i dati hanno la licenza indicata per ciascuna fonte.
        </p>
        <ul className="space-y-2">
          <li><Link href="/chi-siamo" className="hover:text-ink">Chi siamo</Link></li>
          <li><Link href="/correzioni" className="hover:text-ink">Correzioni</Link></li>
        </ul>
        <ul className="space-y-2">
          <li><Link href="/note-legali" className="hover:text-ink">Note legali e privacy</Link></li>
          <li><Link href="/metodo" className="hover:text-ink">Come verifichiamo</Link></li>
        </ul>
      </div>
    </footer>
  );
}
