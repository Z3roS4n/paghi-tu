import Link from "next/link";
import { ArrowRightIcon } from "@phosphor-icons/react/ssr";

/** Mattoni comuni delle pagine: contenitore, intestazioni, carte, bottoni, note di fonte. */

export function Wrap({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  return <div className={`mx-auto max-w-6xl px-4 md:px-7 ${className}`}>{children}</div>;
}

export function PageHead({ kicker, title, children }: { kicker?: string; title: string; children?: React.ReactNode }) {
  return (
    <header className="pt-8 pb-2 md:pt-14">
      {kicker ? <Tag>{kicker}</Tag> : null}
      <h1 className="mt-3 max-w-[22ch] text-[clamp(2.1rem,8vw,3.8rem)] leading-[1.02] font-extrabold">{title}</h1>
      {children ? <div className="mt-4 max-w-[38em] text-lg text-ink-soft [&_b]:text-ink">{children}</div> : null}
    </header>
  );
}

export function SectionHead({ id, title, children }: { id: string; title: string; children?: React.ReactNode }) {
  return (
    <>
      <h2 id={id} className="reveal text-[clamp(1.8rem,7vw,2.8rem)] leading-[1.05] font-extrabold">
        {title}
      </h2>
      {children ? <div className="reveal mt-2.5 max-w-[36em] text-lg text-ink-soft [&_b]:font-bold [&_b]:text-ink">{children}</div> : null}
    </>
  );
}

export function Section({ id, title, intro, children, className = "" }: { id: string; title: string; intro?: React.ReactNode; children?: React.ReactNode; className?: string }) {
  return (
    <section aria-labelledby={id} className={`mt-16 md:mt-24 ${className}`}>
      <SectionHead id={id} title={title}>
        {intro}
      </SectionHead>
      {children}
    </section>
  );
}

export function Card({ children, className = "", as: As = "div" }: { children: React.ReactNode; className?: string; as?: "div" | "article" | "li" | "section" }) {
  return <As className={`min-w-0 rounded-card bg-paper-raised px-4 py-4.5 md:px-6 md:py-5.5 ${className}`}>{children}</As>;
}

export function Tag({ children, tone = "accent" }: { children: React.ReactNode; tone?: "accent" | "plain" }) {
  return (
    <span
      className={`inline-flex min-h-7 items-center gap-1.5 rounded-ctl px-2.5 text-[13.5px] font-bold ${tone === "accent" ? "bg-accent-soft text-accent" : "bg-paper-sunk text-ink"}`}
    >
      {children}
    </span>
  );
}

export function SourceNote({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  return <p className={`mt-3 text-[13.5px] leading-normal text-ink-faint ${className}`}>{children}</p>;
}

const BUTTON = {
  solid: "bg-accent text-accent-ink hover:brightness-110",
  outline: "border-[1.5px] border-rule bg-paper-raised text-ink hover:border-ink-faint",
  light: "bg-night-ink text-night hover:brightness-95",
  ghost: "border-[1.5px] border-night-ink/40 text-night-ink hover:border-night-ink",
} as const;

export function ButtonLink({ href, children, tone = "solid", external }: { href: string; children: React.ReactNode; tone?: keyof typeof BUTTON; external?: boolean }) {
  const cls = `inline-flex min-h-12 items-center justify-center gap-2 rounded-ctl px-5 font-bold whitespace-nowrap transition-[transform,filter,border-color] active:translate-y-px ${BUTTON[tone]}`;
  if (external)
    return (
      <a href={href} target="_blank" rel="noopener noreferrer" className={cls}>
        {children}
      </a>
    );
  return (
    <Link href={href} className={cls}>
      {children}
    </Link>
  );
}

export function GoLink({ href, children }: { href: string; children: React.ReactNode }) {
  return (
    <Link href={href} className="group inline-flex min-h-12 items-center gap-2 font-bold hover:text-accent">
      {children}
      <ArrowRightIcon size={18} weight="bold" aria-hidden className="transition-transform group-hover:translate-x-0.5" />
    </Link>
  );
}

/** Numero chiave con etichetta sopra e nota sotto; `dark` per quello da mettere in evidenza. */
export function Tile({ label, value, note, dark, className = "" }: { label: string; value: React.ReactNode; note?: React.ReactNode; dark?: boolean; className?: string }) {
  return (
    <div className={`reveal min-w-0 rounded-card px-3.5 pt-3.5 pb-4 md:px-5 md:py-4.5 ${dark ? "bg-night text-night-ink" : "bg-paper-raised"} ${className}`}>
      <p className={`text-sm font-semibold ${dark ? "text-night-ink/75" : "text-ink-soft"}`}>{label}</p>
      <p className={`font-display tabular mt-0.5 leading-[1.12] font-bold tracking-[-0.02em] ${dark ? "text-[clamp(2rem,9vw,2.8rem)] lg:text-[2.15rem]" : "text-[clamp(1.5rem,6.4vw,2rem)]"}`}>{value}</p>
      {note ? <p className={`mt-0.5 text-[13.5px] leading-snug ${dark ? "text-night-ink/70" : "text-ink-faint"}`}>{note}</p> : null}
    </div>
  );
}

/** Cifra con unità più piccola, per i numeri grandi. */
export function BigNumber({ value, unit, className = "" }: { value: string; unit: string; className?: string }) {
  return (
    <p className={`font-display tabular flex items-baseline gap-[0.08em] leading-[0.9] font-extrabold tracking-[-0.04em] ${className}`}>
      {value}
      <small className="text-[0.45em] tracking-normal text-accent">{unit}</small>
    </p>
  );
}

export function Legend({ items }: { items: { label: string; tone: "accent" | "neutral"; dashed?: boolean }[] }) {
  return (
    <p className="mt-1 flex flex-wrap gap-x-4 gap-y-1 text-sm text-ink-soft">
      {items.map((i) => (
        <span key={i.label} className="inline-flex items-center gap-1.5">
          <i
            aria-hidden
            className={`inline-block h-[3px] w-4 rounded-full ${i.tone === "accent" ? "text-accent" : "text-neutral"}`}
            style={{ background: i.dashed ? "repeating-linear-gradient(90deg,currentColor 0 4px,transparent 4px 8px)" : "currentColor" }}
          />
          {i.label}
        </span>
      ))}
    </p>
  );
}
