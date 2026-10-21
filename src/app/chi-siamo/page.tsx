import type { Metadata } from "next";
import Link from "next/link";
import { REPO_URL } from "@/lib/contribute";
import { ProsePage } from "@/components/prose-page";

export const metadata: Metadata = {
  title: "Chi siamo",
  description: "Perché si chiama Paghi Tu e come funziona il progetto.",
};

export default function AboutPage() {
  return (
    <ProsePage title="Chi siamo" intro="Paghi Tu è un progetto indipendente e apartitico sui conti pubblici italiani.">
      <h2>Perché questo nome</h2>
      <p>
        Ogni spesa dello Stato e ogni promessa realizzata si pagano con le tasse o con il debito, cioè con soldi
        di chi vive in Italia oggi o domani. Il nome dice questo e nient'altro: non accusa nessuno, ricorda chi
        riceve il conto.
      </p>
      <h2>Cosa facciamo</h2>
      <p>
        Raccogliamo bilanci, leggi, relazioni tecniche e programmi elettorali dalle fonti ufficiali e li mettiamo
        uno accanto all'altro: cosa è stato promesso, cosa è stato approvato, quanto doveva costare e quanto è costato.
      </p>
      <h2>Cosa non facciamo</h2>
      <ul>
        <li>Non diamo indicazioni di voto e non facciamo classifiche tra partiti.</li>
        <li>Non pubblichiamo commenti o sondaggi.</li>
        <li>Non pubblichiamo un numero senza la sua fonte.</li>
      </ul>
      <h2>Un progetto aperto</h2>
      <p>
        I dati li raccoglie e li verifica un sistema di agenti AI, ogni giorno, con un secondo agente che ricontrolla
        tutto sulle fonti prima della pubblicazione. L&apos;AI però sbaglia, e una fonte può sfuggire: per questo chiunque
        può segnalare un errore o proporre una correzione, e ogni modifica resta in un registro pubblico.
      </p>
      <p>
        Codice, dati e note di verifica sono pubblici su{" "}
        <a href={REPO_URL} target="_blank" rel="noopener noreferrer">
          GitHub
        </a>{" "}
        con licenza MIT. Come contribuire: <Link href="/correzioni">Correzioni</Link>.
      </p>
      <h2>Contatti</h2>
      <p>
        Le segnalazioni passano dal modulo pubblico su GitHub. Per chi non ha un account, un indirizzo dedicato al
        progetto è in attivazione.
      </p>
    </ProsePage>
  );
}
