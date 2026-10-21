const TU_PATH =
  "M16.5 14.5H32.5V19.7H27.1V33.5H21.9V19.7H16.5Z M35.5 14.5H40.7V25.5A2.8 2.8 0 0 0 46.3 25.5V14.5H51.5V25.5A8 8 0 0 1 35.5 25.5Z";

// Il timbro «TU» (D-UI-08). Sotto i 40 px di altezza la cornice interna sparisce.
export function StampMark({ height, className }: { height: number; className?: string }) {
  const double = height >= 40;
  return (
    <svg viewBox="-2 -2 72 52" height={height} width={(height * 72) / 52} className={className} aria-hidden focusable="false">
      <g transform="rotate(-6 34 24)" fill="none" stroke="currentColor">
        <rect x="2" y="4" width="64" height="40" rx="4" strokeWidth={double ? 3 : 3.4} />
        {double && <rect x="7" y="9" width="54" height="30" rx="2" strokeWidth="1.2" />}
        <path d={TU_PATH} fill="currentColor" stroke="none" />
      </g>
    </svg>
  );
}

export function Wordmark({ size, className = "" }: { size: number; className?: string }) {
  return (
    <span className={`inline-flex items-center gap-[0.14em] ${className}`} style={{ fontSize: size }}>
      <span aria-hidden>Paghi</span>
      <StampMark height={Math.round(size * 1.36)} className="text-accent" />
      <span className="sr-only">Paghi Tu</span>
    </span>
  );
}
