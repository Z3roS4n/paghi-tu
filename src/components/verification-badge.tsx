import type { Verification, VerificationLevel } from "@/lib/domain/schemas";

const LABEL: Record<VerificationLevel, string> = {
  V1: "Verificato su fonte primaria",
  V2: "Verifica parziale",
  NV: "Da verificare",
};

const TONE: Record<VerificationLevel, string> = {
  V1: "border-level-v1 text-level-v1",
  V2: "border-level-v2 text-level-v2",
  NV: "border-level-nv text-level-nv",
};

const FIELD_LABEL: Record<string, string> = {
  inizio: "data di inizio",
  presidente: "presidente del Consiglio",
  legislatura: "legislatura",
  maggioranza: "partiti di maggioranza",
};

export function LevelTag({ level }: { level: VerificationLevel }) {
  return (
    <span className={`inline-flex w-fit items-center justify-self-start border px-1.5 py-0.5 font-mono text-[11px] leading-none ${TONE[level]}`}>
      {level}
    </span>
  );
}

export function VerificationBadge({ verifica, compact = false }: { verifica: Verification; compact?: boolean }) {
  if (compact) return <LevelTag level={verifica.livello} />;
  return (
    <details className="group text-sm">
      <summary className="flex cursor-pointer list-none items-center gap-2 text-ink-soft hover:text-ink">
        <LevelTag level={verifica.livello} />
        <span>{LABEL[verifica.livello]}</span>
        <span className="text-ink-faint group-open:hidden">(dettagli)</span>
      </summary>
      <div className="mt-3 space-y-3 border-l-2 border-rule pl-4">
        {verifica.campi ? (
          <ul className="grid gap-1 sm:grid-cols-2">
            {Object.entries(verifica.campi).map(([campo, livello]) => (
              <li key={campo} className="flex items-center gap-2">
                <LevelTag level={livello} />
                <span>{FIELD_LABEL[campo] ?? campo}</span>
              </li>
            ))}
          </ul>
        ) : null}
        <p className="max-w-[75ch] font-mono text-xs leading-relaxed whitespace-pre-line text-ink-soft">
          {verifica.dettaglio.replaceAll(" || ", "\n")}
        </p>
      </div>
    </details>
  );
}
