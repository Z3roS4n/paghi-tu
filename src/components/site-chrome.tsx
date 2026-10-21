import Link from "next/link";
import { ReceiptIcon } from "@phosphor-icons/react/ssr";
import { REPO_URL } from "@/lib/contribute";
import { NavLinks } from "./nav-links";

export function SiteHeader() {
  return (
    <header className="sticky top-0 z-30 border-b border-rule bg-paper/90 backdrop-blur-md">
      <div className="mx-auto flex h-[var(--header-h)] max-w-6xl items-center justify-between gap-6 px-4 md:px-7">
        <Link href="/" className="font-display inline-flex min-h-11 shrink-0 items-center gap-2 text-[22px] font-extrabold tracking-tight">
          <ReceiptIcon size={26} weight="fill" className="text-accent" aria-hidden />
          Paghi Tu
        </Link>
        <nav aria-label="Sezioni principali" className="hidden lg:block">
          <NavLinks />
        </nav>
      </div>
      <span aria-hidden className="scroll-progress absolute inset-x-0 -bottom-px h-[3px] bg-accent" />
    </header>
  );
}

const FOOTER_LINKS = [
  { href: "/metodo", label: "Metodo" },
  { href: "/fonti", label: "Fonti" },
  { href: "/correzioni", label: "Correzioni" },
  { href: "/chi-siamo", label: "Chi siamo" },
  { href: "/note-legali", label: "Note legali e privacy" },
] as const;

export function SiteFooter() {
  return (
    <footer className="mt-20 border-t border-rule">
      <div className="mx-auto grid max-w-6xl gap-8 px-4 py-10 md:grid-cols-2 md:px-7">
        <div>
          <Link href="/" className="font-display inline-flex items-center gap-2 text-xl font-extrabold tracking-tight">
            <ReceiptIcon size={22} weight="fill" className="text-accent" aria-hidden />
            Paghi Tu
          </Link>
          <p className="mt-3 max-w-[48ch] text-[15px] text-ink-soft">
            Sito apartitico sui conti pubblici italiani. Ogni numero ha una fonte e un livello di verifica, con lo stesso
            metodo per ogni governo e ogni partito. Chiunque può segnalare un errore. Codice con licenza MIT; i dati hanno la
            licenza indicata per ciascuna fonte.
          </p>
        </div>
        <ul className="grid grid-cols-2 content-start gap-x-6 text-[15px] font-semibold">
          {FOOTER_LINKS.map((l) => (
            <li key={l.href}>
              <Link href={l.href} className="flex min-h-11 items-center hover:text-accent">
                {l.label}
              </Link>
            </li>
          ))}
          <li>
            <a href={REPO_URL} target="_blank" rel="noopener noreferrer" className="flex min-h-11 items-center hover:text-accent">
              Codice e dati su GitHub
            </a>
          </li>
        </ul>
        <p className="text-[13px] leading-normal text-ink-faint md:col-span-2">
          Incisioni da Wikimedia Commons, in pubblico dominio: Giuseppe Vasi, piazza di Monte Citorio (1752); piazza Colonna
          (1750 circa, Statens Museum for Kunst); Giovanni Battista Piranesi, Palazzo Montecitorio (XVIII secolo); il
          Ministero delle Finanze da «Roma italiana, 1870-1895».
        </p>
        <p className="border-t border-rule pt-4 text-[13.5px] text-ink-faint md:col-span-2">
          Progettato e sviluppato da{" "}
          <a href="https://www.msworks.it" target="_blank" rel="noopener noreferrer" className="font-semibold text-ink-soft underline underline-offset-2 hover:text-accent">
            msworks.it
          </a>
        </p>
      </div>
    </footer>
  );
}
