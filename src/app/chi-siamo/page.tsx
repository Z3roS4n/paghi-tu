import type { Metadata } from "next";
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
      <h2>Contatti</h2>
      <p>
        Per segnalare un errore o chiedere una rettifica useremo un indirizzo dedicato al progetto, in attivazione.
      </p>
    </ProsePage>
  );
}
