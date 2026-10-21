import type { Verification, VerificationLevel } from "@/lib/domain/schemas";

const LABEL: Record<VerificationLevel, string> = {
  V1: "Verificato su fonte primaria",
  V2: "Verifica parziale",
  NV: "Da verificare",
};

const MEANING: Record<VerificationLevel, string> = {
  V1: "Controllato due volte, in modo indipendente, sul documento ufficiale.",
  V2: "Almeno un campo viene da una fonte secondaria, non dal documento ufficiale.",
  NV: "Non ancora confermato su una fonte primaria. Non va preso per certo.",
};

const TONE: Record<VerificationLevel, string> = {
  V1: "bg-paper-sunk text-ink",
  V2: "bg-level-v2-bg text-level-v2",
  NV: "bg-paper-sunk text-level-nv ring-1 ring-level-nv ring-inset",
};

const FIELD_LABEL: Record<string, string> = {
  inizio: "data di inizio",
  presidente: "presidente del Consiglio",
  legislatura: "legislatura",
  maggioranza: "partiti di maggioranza",
};

export function LevelTag({ level }: { level: VerificationLevel }) {
  return (
    <span
      title={LABEL[level]}
      className={`inline-flex min-h-7 w-fit shrink-0 items-center justify-self-start rounded-ctl px-2.5 text-[13.5px] leading-none font-bold ${TONE[level]}`}
    >
      {level}
      <span className="sr-only">, {LABEL[level].toLowerCase()}</span>
    </span>
  );
}

/**
 * Livello di verifica spiegato a parole. Le note di lavoro dei verificatori restano consultabili,
 * per trasparenza, ma in un secondo pannello: sono un registro tecnico, non un testo per chi legge.
 */
export function VerificationBadge({ verifica, compact = false }: { verifica: Verification; compact?: boolean }) {
  if (compact) return <LevelTag level={verifica.livello} />;
  return (
    <details className="group text-[15px]">
      <summary className="flex min-h-11 cursor-pointer list-none flex-wrap items-center gap-x-2 gap-y-1 text-ink-soft hover:text-ink [&::-webkit-details-marker]:hidden">
        <LevelTag level={verifica.livello} />
        <span className="font-semibold">{LABEL[verifica.livello]}</span>
        <span className="text-ink-faint underline underline-offset-2 group-open:hidden">perché</span>
      </summary>
      <div className="mt-2 space-y-3 border-l-2 border-rule pl-4">
        <p className="max-w-[60ch] text-ink-soft">{MEANING[verifica.livello]}</p>
        {verifica.campi ? (
          <ul className="grid gap-1.5 sm:grid-cols-2">
            {Object.entries(verifica.campi).map(([campo, livello]) => (
              <li key={campo} className="flex items-center gap-2">
                <LevelTag level={livello} />
                <span>{FIELD_LABEL[campo] ?? campo}</span>
              </li>
            ))}
          </ul>
        ) : null}
        <details className="text-sm">
          <summary className="flex min-h-11 cursor-pointer items-center text-ink-faint hover:text-ink">Registro tecnico della verifica</summary>
          <ul className="mt-1 max-w-[75ch] space-y-1.5 font-mono text-xs leading-relaxed break-words text-ink-soft">
            {verifica.dettaglio.split(/\s*\|\|\s*/).map((line, i) => (
              <li key={i}>{line}</li>
            ))}
          </ul>
        </details>
      </div>
    </details>
  );
}
