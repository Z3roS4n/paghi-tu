import type { Metadata } from "next";
import Link from "next/link";
import { ProsePage } from "@/components/prose-page";
import { Tag } from "@/components/ui";
import { REPO_URL, correctionUrl } from "@/lib/contribute";
import { formatDate } from "@/lib/format";
import { corrections } from "@/server/data";

export const metadata: Metadata = {
  title: "Correzioni",
  description: "Come segnalare un errore su Paghi Tu e registro pubblico di ogni modifica ai dati già pubblicati.",
};

const KIND = { correzione: "Correzione", metodo: "Cambio di metodo" } as const;

export default function CorrectionsPage() {
  return (
    <ProsePage
      title="Correzioni"
      intro="I dati li raccoglie e li verifica un sistema di agenti AI, ma chiunque può correggerli. Ogni modifica a un dato già pubblicato resta qui, con il valore di prima, quello nuovo e il motivo."
    >
      <h2>Come segnalare un errore</h2>
      <ol>
        <li>
          Apri il{" "}
          <a href={correctionUrl("/")} target="_blank" rel="noopener noreferrer">
            modulo di correzione
          </a>{" "}
          oppure usa il link «Segnala un errore» accanto al dato: pagina e dato sono già compilati.
        </li>
        <li>Scrivi cosa è sbagliato e qual è il valore giusto.</li>
        <li>
          Indica la fonte: un documento ufficiale, una banca dati pubblica, il testo originale di una dichiarazione.
          Senza fonte la segnalazione non si può verificare. Quali fonti valgono e cosa non accettiamo è scritto nelle{" "}
          <Link href="/contribuire">regole per contribuire</Link>.
        </li>
      </ol>
      <p>
        Il modulo è su GitHub, dove il progetto è pubblico: serve un account gratuito, e la segnalazione è visibile a
        tutti. Chi sa usare git può anche proporre la modifica direttamente, come spiegato nella{" "}
        <a href={`${REPO_URL}/blob/main/CONTRIBUTING.md`} target="_blank" rel="noopener noreferrer">
          guida per chi contribuisce
        </a>
        .
      </p>

      <h2>Cosa succede dopo</h2>
      <ul>
        <li>
          Un agente verificatore, diverso da quello che ha scritto il dato, ricontrolla la segnalazione sulla fonte,
          di solito entro un giorno.
        </li>
        <li>
          Se la fonte conferma, il dato viene corretto, la correzione compare in questa pagina e la segnalazione viene
          chiusa con il link alla modifica.
        </li>
        <li>Se non conferma, la segnalazione è respinta e la risposta spiega perché, in pubblico, sotto la segnalazione.</li>
        <li>
          Se la fonte si può leggere in due modi o il tema è delicato, la segnalazione resta aperta come «da decidere»
          finché non la esamina una persona.
        </li>
        <li>
          Valgono le stesse regole per tutti: si correggono fatti con una fonte, non opinioni. Le regole sono nel{" "}
          <Link href="/metodo">metodo</Link>.
        </li>
      </ul>

      <h2>Registro</h2>
      {corrections.length === 0 ? (
        <p className="rounded-card bg-paper-raised px-4 py-4 md:px-6">Nessuna correzione a dati pubblicati, finora.</p>
      ) : (
        <div role="list" className="grid gap-2.5">
          {corrections.map((c) => (
            <article
              role="listitem"
              key={c.id}
              id={c.id}
              className="scroll-mt-[calc(var(--header-h)+16px)] rounded-card bg-paper-raised px-4 py-4.5 md:px-6 md:py-5.5"
            >
              <div className="flex flex-wrap items-center gap-2">
                <Tag tone={c.tipo === "metodo" ? "plain" : "accent"}>{KIND[c.tipo]}</Tag>
                <span className="tabular text-sm font-semibold text-ink-faint">
                  {c.id} · {formatDate(c.data)}
                </span>
              </div>
              <h3 className="!mt-2.5 text-lg leading-snug font-bold">
                <Link href={c.pagina}>{c.dato}</Link>
              </h3>
              <dl className="mt-3 grid gap-2 sm:grid-cols-2">
                <div className="min-w-0 rounded-ctl bg-paper px-3.5 py-3">
                  <dt className="text-[13.5px] font-semibold text-ink-faint">Prima</dt>
                  <dd className="mt-0.5 break-words text-ink-soft line-through decoration-ink-faint/60">{c.prima}</dd>
                </div>
                <div className="min-w-0 rounded-ctl bg-accent-soft px-3.5 py-3">
                  <dt className="text-[13.5px] font-semibold text-accent">Dopo</dt>
                  <dd className="mt-0.5 font-semibold break-words text-ink">{c.dopo}</dd>
                </div>
              </dl>
              <dl className="mt-3 grid gap-2 text-[15px] sm:grid-cols-[7.5rem_1fr]">
                <dt className="font-semibold text-ink-faint">Motivo</dt>
                <dd className="text-ink-soft">{c.motivo}</dd>
                {c.fonte ? (
                  <>
                    <dt className="font-semibold text-ink-faint">Fonte</dt>
                    <dd className="min-w-0">
                      <a href={c.fonte.url} target="_blank" rel="noopener noreferrer" className="break-all">
                        {c.fonte.etichetta ?? c.fonte.url}
                      </a>
                    </dd>
                  </>
                ) : null}
                {c.segnalazione ? (
                  <>
                    <dt className="font-semibold text-ink-faint">Segnalazione</dt>
                    <dd>
                      <a href={c.segnalazione} target="_blank" rel="noopener noreferrer">
                        apri su GitHub
                      </a>
                    </dd>
                  </>
                ) : null}
              </dl>
            </article>
          ))}
        </div>
      )}
    </ProsePage>
  );
}
