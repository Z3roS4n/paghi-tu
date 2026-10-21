import type { Metadata } from "next";
import Link from "next/link";
import { ProsePage } from "@/components/prose-page";
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
          Senza fonte la segnalazione non si può verificare.
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
        <li>Se non conferma, la risposta spiega perché, in pubblico, sotto la segnalazione.</li>
        <li>
          Valgono le stesse regole per tutti: si correggono fatti con una fonte, non opinioni. Le regole sono nel{" "}
          <Link href="/metodo">metodo</Link>.
        </li>
      </ul>

      <h2>Registro</h2>
      {corrections.length === 0 ? (
        <p>Nessuna correzione a dati pubblicati, finora.</p>
      ) : (
        <ol className="!list-none !pl-0 space-y-8">
          {corrections.map((c) => (
            <li key={c.id} id={c.id} className="scroll-mt-6 border-t border-rule pt-6">
              <p className="font-mono text-xs !text-ink-faint">
                {c.id} · {formatDate(c.data)} · {KIND[c.tipo]}
              </p>
              <p className="mt-1 font-medium !text-ink">
                <Link href={c.pagina}>{c.dato}</Link>
              </p>
              <dl className="mt-3 grid gap-2 text-sm md:grid-cols-[6rem_1fr]">
                <dt className="!text-ink-faint">Prima</dt>
                <dd>{c.prima}</dd>
                <dt className="!text-ink-faint">Dopo</dt>
                <dd>{c.dopo}</dd>
                <dt className="!text-ink-faint">Motivo</dt>
                <dd>{c.motivo}</dd>
                {c.fonte ? (
                  <>
                    <dt className="!text-ink-faint">Fonte</dt>
                    <dd>
                      <a href={c.fonte.url} target="_blank" rel="noopener noreferrer" className="break-all">
                        {c.fonte.url}
                      </a>
                    </dd>
                  </>
                ) : null}
                {c.segnalazione ? (
                  <>
                    <dt className="!text-ink-faint">Segnalazione</dt>
                    <dd>
                      <a href={c.segnalazione} target="_blank" rel="noopener noreferrer">
                        apri su GitHub
                      </a>
                    </dd>
                  </>
                ) : null}
              </dl>
            </li>
          ))}
        </ol>
      )}
    </ProsePage>
  );
}
