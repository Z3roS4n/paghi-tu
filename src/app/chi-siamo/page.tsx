import type { Metadata } from "next";
import Link from "next/link";
import { REPO_URL } from "@/lib/contribute";
import { CONTROLLER } from "@/lib/legal";
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
        I dati li raccoglie e li verifica un sistema di agenti AI, ogni giorno. Prima della pubblicazione un secondo
        agente ricontrolla ogni novità: tutte le citazioni sulle fonti e i numeri a campione, oltre ai controlli
        automatici fra fonti diverse. L&apos;AI però sbaglia, e una fonte può sfuggire: per questo chiunque
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
        Paghi Tu è gestito da {CONTROLLER.name} ({CONTROLLER.city}). Le segnalazioni passano dal modulo pubblico su
        GitHub, con le <Link href="/contribuire">regole per contribuire</Link>. Chi non ha un account può scrivere a{" "}
        <a href={`mailto:${CONTROLLER.email}`}>{CONTROLLER.email}</a>.
      </p>
    </ProsePage>
  );
}
