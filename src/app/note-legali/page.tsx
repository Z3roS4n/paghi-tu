import type { Metadata } from "next";
import { ProsePage } from "@/components/prose-page";

export const metadata: Metadata = {
  title: "Note legali e privacy",
  description: "Licenze, riuso dei dati e trattamento dei dati dei visitatori su Paghi Tu.",
};

export default function LegalPage() {
  return (
    <ProsePage title="Note legali e privacy" intro="Testo provvisorio, in revisione legale prima del lancio pubblico.">
      <h2>Licenze</h2>
      <p>
        Il codice del sito è distribuito con licenza MIT. I dati riportati restano soggetti alla licenza della
        fonte da cui provengono, indicata nella pagina Fonti. I testi di leggi e atti ufficiali non sono coperti
        da diritto d'autore (art. 5 della legge 633/1941). Dei programmi elettorali riportiamo solo brevi
        citazioni con la fonte (art. 70 della stessa legge).
      </p>
      <h2>Privacy dei visitatori</h2>
      <p>
        Il sito non usa cookie, non ha moduli e non raccoglie statistiche che identificano chi lo visita.
      </p>
      <h2>Persone citate</h2>
      <p>
        Le persone citate lo sono per il loro ruolo pubblico, con dichiarazioni e atti già pubblicati dalle fonti
        indicate. Chi ritiene che un dato sia inesatto può chiederne la rettifica: ogni modifica resta pubblica
        nel registro delle correzioni.
      </p>
    </ProsePage>
  );
}
