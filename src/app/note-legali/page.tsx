import type { Metadata } from "next";
import Link from "next/link";
import { ProsePage } from "@/components/prose-page";
import { CONTROLLER } from "@/lib/legal";

export const metadata: Metadata = {
  title: "Note legali",
  description: "Chi gestisce Paghi Tu, quanto ci si può fidare dei dati e con quali limiti, uso dell'intelligenza artificiale, licenze e rettifiche.",
};

export default function LegalPage() {
  return (
    <ProsePage title="Note legali" intro={`Condizioni d'uso del sito e politica sulla veridicità dei dati. Ultimo aggiornamento: ${CONTROLLER.policyDate}.`}>
      <h2>Chi gestisce il sito</h2>
      <p>
        Paghi Tu è gestito da <strong>{CONTROLLER.name}</strong>, ditta individuale di {CONTROLLER.owner}, {CONTROLLER.city},
        partita IVA {CONTROLLER.vat}. Email <a href={`mailto:${CONTROLLER.email}`}>{CONTROLLER.email}</a>, PEC{" "}
        {CONTROLLER.pec}.
      </p>
      <p>
        Il sito è apartitico: non dà indicazioni di voto, non fa classifiche fra partiti e applica le stesse regole a
        tutti. Il trattamento dei dati personali è descritto nella pagina <Link href="/privacy">Privacy</Link>.
      </p>

      <h2>Veridicità dei dati</h2>
      <h3>A cosa ci impegniamo</h3>
      <ul>
        <li>
          <strong>Nessun numero senza fonte.</strong> Ogni dato ha accanto la fonte da cui viene: un atto ufficiale, una
          banca dati pubblica, il testo originale di una dichiarazione.
        </li>
        <li>
          <strong>Il livello di verifica è sempre dichiarato.</strong> V1 vuol dire verificato sulla fonte primaria; V2
          che almeno una parte viene da una fonte secondaria; NV che non è ancora verificato. Come si arriva a ogni
          livello è spiegato nel <Link href="/metodo">Metodo</Link>. Un dato non viene mai presentato come più sicuro di
          quanto sia.
        </li>
        <li>
          <strong>I nostri calcoli si vedono.</strong> Rapporti, cifre per residente, rivalutazioni e confronti fatti da
          noi sono indicati come tali, con il metodo nella pagina <Link href="/metodo">Metodo</Link>.
        </li>
        <li>
          <strong>Niente numeri scritti a mano.</strong> I conti pubblici arrivano dalle banche dati ufficiali con
          programmi pubblici; prima di ogni aggiornamento controlli automatici incrociano le fonti e, se non tornano,
          l&apos;aggiornamento non va online.
        </li>
        <li>
          <strong>Le citazioni sono esatte.</strong> Si riportano parola per parola; un taglio «[…]» non toglie mai le
          parole con cui chi parla descrive un gruppo di persone.
        </li>
        <li>
          <strong>Stesse regole per tutti.</strong> Ogni regola vale per tutti i partiti e tutti i governi insieme. Se un
          partito non è stato controllato con lo stesso criterio, le novità non si pubblicano per nessuno.
        </li>
        <li>
          <strong>Gli errori si correggono in pubblico.</strong> Ogni modifica a un dato già pubblicato resta nel{" "}
          <Link href="/correzioni">registro delle correzioni</Link>, con il valore di prima, quello nuovo, il motivo e
          la fonte. Le voci del registro non si cancellano.
        </li>
      </ul>
      <h3>Cosa non possiamo garantire</h3>
      <ul>
        <li>
          <strong>Che non ci siano errori.</strong> Verifichiamo tutto, ma possiamo sbagliare. Per questo il metodo è
          pubblico e chiunque può segnalare un errore.
        </li>
        <li>
          <strong>Che i dati siano completi.</strong> Il catalogo delle promesse raccoglie quello che abbiamo trovato e
          verificato, non tutto quello che è stato detto; il numero di promesse di un partito non misura quanto propone.
        </li>
        <li>
          <strong>Che le fonti non cambino.</strong> ISTAT, Eurostat e Banca d&apos;Italia rivedono i loro dati; quando
          succede aggiorniamo e segnaliamo le rotture di serie e i dati provvisori.
        </li>
        <li>
          <strong>Che una media descriva te.</strong> Le cifre «per residente» sono medie: non sono quanto paga o riceve
          una singola persona.
        </li>
      </ul>
      <p>
        I contenuti servono a informare. Non sono consulenza fiscale, finanziaria o legale e non sono un&apos;indicazione
        di voto. Prima di decisioni importanti, controlla la fonte originale indicata accanto a ogni dato.
      </p>

      <h2>Uso dell&apos;intelligenza artificiale</h2>
      <p>
        Ricerca, estrazione dei dati, verifica e buona parte dei testi sono fatti con agenti di intelligenza artificiale
        (modelli Claude di Anthropic). Ogni dato nuovo passa da un secondo agente, con contesto separato, che può
        respingerlo: le citazioni le ricontrolla tutte, parola per parola, sulla fonte; per i conti pubblici scaricati
        con programmi il controllo è automatico fra fonti diverse, più un ricontrollo a campione. Le regole le decide il
        titolare, che esamina di persona i casi dubbi. Non tutti i dati vengono riletti da una persona prima della
        pubblicazione: è un motivo in più per cui indichiamo sempre fonte e livello di verifica, e per cui le
        segnalazioni sono aperte a tutti.
      </p>

      <h2>Contributi</h2>
      <p>
        Chiunque può segnalare un errore o proporre un dato, con le regole della pagina{" "}
        <Link href="/contribuire">Regole per contribuire</Link>. Le segnalazioni senza fonte, le opinioni e le richieste
        in malafede non vengono pubblicate.
      </p>

      <h2>Persone citate e rettifica</h2>
      <p>
        Le persone citate lo sono per il loro ruolo pubblico, con dichiarazioni e atti già pubblicati dalle fonti
        indicate. Chi ritiene che un dato che lo riguarda sia inesatto può chiederne la rettifica dal modulo su GitHub o
        scrivendo a <a href={`mailto:${CONTROLLER.email}`}>{CONTROLLER.email}</a>, indicando la fonte corretta. La
        verifichiamo come ogni altra segnalazione; se è fondata il dato viene corretto e la correzione resta nel
        registro.
      </p>

      <h2>Licenze e riuso</h2>
      <p>
        Il codice del sito è distribuito con licenza MIT. I dati riportati restano soggetti alla licenza della fonte da
        cui provengono, indicata nella pagina <Link href="/fonti">Fonti</Link>: chi li riusa deve rispettarla. I testi di
        leggi e atti ufficiali non sono coperti da diritto d&apos;autore (art. 5 della legge 633/1941). Dei programmi e delle
        dichiarazioni politiche riportiamo solo brevi citazioni con la fonte (art. 70 della stessa legge). Le incisioni
        storiche usate nelle pagine sono in pubblico dominio, con l&apos;autore indicato nel piè di pagina.
      </p>

      <h2>Responsabilità e link esterni</h2>
      <p>
        I contenuti sono pubblicati così come sono, a scopo informativo. Nei limiti consentiti dalla legge, il titolare
        non risponde di decisioni prese sulla base dei dati del sito, salvo i casi di dolo o colpa grave. I link portano
        a siti di terzi, sul cui contenuto il titolare non ha controllo: la fonte originale fa sempre fede.
      </p>
    </ProsePage>
  );
}
