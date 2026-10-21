import type { Metadata } from "next";
import Link from "next/link";
import { ProsePage } from "@/components/prose-page";
import { CONTROLLER } from "@/lib/legal";

export const metadata: Metadata = {
  title: "Privacy",
  description: "Informativa sul trattamento dei dati personali di Paghi Tu: chi è il titolare, quali dati tratta, perché, per quanto tempo e quali diritti hai.",
};

export default function PrivacyPage() {
  return (
    <ProsePage
      title="Privacy"
      intro={`Informativa sul trattamento dei dati personali (articoli 13 e 14 del Regolamento UE 2016/679, GDPR). Ultimo aggiornamento: ${CONTROLLER.policyDate}.`}
    >
      <h2>In breve</h2>
      <ul>
        <li>
          Il sito non usa cookie, non ha account, non mostra pubblicità e non ha moduli: quello per le segnalazioni è su
          GitHub.
        </li>
        <li>
          Contiamo le visite con Vercel Web Analytics, che non usa cookie e non conserva l&apos;indirizzo IP: vediamo solo
          numeri aggregati.
        </li>
        <li>Font e immagini arrivano dal nostro dominio: aprendo il sito non contatti Google o altri servizi esterni.</li>
        <li>Le segnalazioni passano da GitHub e sono pubbliche: non inserire dati personali.</li>
        <li>
          Non vendiamo dati e non facciamo profilazione. Nessuna decisione automatizzata ha effetti giuridici o simili su
          di te (art. 22 GDPR): l&apos;esito di una segnalazione riguarda il dato, non la persona che l&apos;ha inviata.
        </li>
      </ul>

      <h2>Titolare del trattamento</h2>
      <p>
        <strong>{CONTROLLER.name}</strong>, ditta individuale di {CONTROLLER.owner}, {CONTROLLER.city}. Partita IVA{" "}
        {CONTROLLER.vat}.
        <br />
        Email: <a href={`mailto:${CONTROLLER.email}`}>{CONTROLLER.email}</a> · PEC: {CONTROLLER.pec} (scrivibile da
        un&apos;altra casella PEC)
      </p>
      <p>Non è stato nominato un responsabile della protezione dei dati (DPO): per questo trattamento non è obbligatorio.</p>

      <h2>Quali dati trattiamo e perché</h2>

      <h3>1. Navigazione</h3>
      <p>
        Per mostrarti le pagine, il server che ospita il sito registra alcuni dati tecnici di ogni richiesta:
        indirizzo IP, data e ora, pagina richiesta, browser e sistema operativo, pagina di provenienza.
      </p>
      <ul>
        <li>
          <strong>Perché:</strong> far funzionare il sito, proteggerlo da abusi e attacchi, capire i guasti.
        </li>
        <li>
          <strong>Base giuridica:</strong> legittimo interesse del titolare a offrire un sito sicuro e funzionante
          (art. 6, par. 1, lett. f GDPR).
        </li>
        <li>
          <strong>Chi li tratta:</strong> Vercel Inc., che ospita il sito, per conto del titolare.
        </li>
        <li>
          <strong>Per quanto tempo:</strong> i registri delle richieste restano consultabili dal titolare per un giorno
          (piano Pro di Vercel); Vercel può conservarli più a lungo per la sicurezza della propria rete, secondo le sue
          condizioni. Non li usiamo per altro e non li incrociamo con altri dati.
        </li>
      </ul>

      <h3>2. Statistiche di visita</h3>
      <p>
        Usiamo Vercel Web Analytics per sapere quante persone leggono il sito e quali pagine servono di più. Non usa
        cookie e non salva nulla sul tuo dispositivo. Ogni visitatore viene riconosciuto per 24 ore con un codice
        calcolato dalla richiesta, poi il codice viene scartato; l&apos;indirizzo IP non viene conservato.
      </p>
      <p>
        Per ogni pagina vista possono essere registrati: data e ora, indirizzo della pagina (senza i parametri: per
        esempio non registriamo cosa cerchi nell&apos;archivio), pagina di provenienza, paese, regione e città
        approssimativi, sistema operativo, browser e tipo di dispositivo. Vediamo solo totali, non il percorso di una
        singola persona.
      </p>
      <ul>
        <li>
          <strong>Base giuridica:</strong> legittimo interesse a migliorare il sito con dati aggregati (art. 6, par. 1,
          lett. f GDPR). Non chiediamo il consenso perché lo strumento produce solo statistiche aggregate e non salva
          niente sul dispositivo (art. 122 del Codice privacy e Linee guida del Garante su cookie e altri strumenti di
          tracciamento del 10 giugno 2021).
        </li>
        <li>
          <strong>Per quanto tempo:</strong> le statistiche aggregate restano consultabili dal titolare per 12 mesi
          (piano Pro di Vercel); Vercel può conservarle più a lungo secondo le sue condizioni.
        </li>
        <li>
          <strong>Chi li tratta:</strong> Vercel Inc., per conto del titolare.
        </li>
        <li>
          <strong>Come opporti:</strong> puoi bloccare lo script con le impostazioni del browser o con un&apos;estensione
          che blocca le statistiche; il sito funziona lo stesso. Puoi anche scriverci.
        </li>
      </ul>

      <h3>3. Segnalazioni e contributi</h3>
      <p>
        Le segnalazioni di errori e le proposte di modifica passano dal repository pubblico su GitHub. Quello che scrivi
        lì, il tuo nome utente e gli eventuali allegati sono <strong>pubblici</strong> e sono trattati anche da GitHub,
        come titolare autonomo, secondo la sua informativa.
      </p>
      <ul>
        <li>
          <strong>Cosa facciamo noi:</strong> leggiamo la segnalazione, la verifichiamo sulla fonte, rispondiamo in
          pubblico e, se il dato cambia, la colleghiamo alla voce del <Link href="/correzioni">registro delle
          correzioni</Link>. La lettura e la prima verifica sono fatte da agenti di intelligenza artificiale che usano i
          modelli Claude di Anthropic: ricevono il testo della segnalazione, che è già pubblico su GitHub. Il titolare
          riceve un riepilogo via email, inviato con il servizio Resend.
        </li>
        <li>
          <strong>Base giuridica:</strong> legittimo interesse a correggere i dati e a rendere conto delle correzioni
          (art. 6, par. 1, lett. f GDPR).
        </li>
        <li>
          <strong>Obbligo:</strong> segnalare è facoltativo. Per farlo serve un account GitHub; chi non ce l&apos;ha può
          scrivere al titolare.
        </li>
        <li>
          <strong>Per quanto tempo:</strong> il registro delle correzioni è permanente, perché serve a mostrare cosa è
          cambiato e perché. Nel registro c&apos;è solo il link alla segnalazione, non il tuo nome. Puoi modificare il
          testo della tua segnalazione su GitHub o chiederci di cancellarla: la cancelliamo noi e togliamo il link dal
          registro.
        </li>
      </ul>
      <p>Le regole per contribuire sono nella pagina <Link href="/contribuire">Regole per contribuire</Link>.</p>

      <h3>4. Email al titolare</h3>
      <p>
        Se ci scrivi, trattiamo il tuo indirizzo email e quello che scrivi per risponderti e per gestire la richiesta
        (legittimo interesse, art. 6, par. 1, lett. f GDPR), per il tempo necessario a farlo e a gestire gli eventuali
        seguiti.
      </p>

      <h3>5. Persone citate sul sito</h3>
      <p>
        Il sito riporta nomi, ruoli pubblici e dichiarazioni pubbliche di persone con incarichi politici o istituzionali
        (presidenti del Consiglio, ministri, esponenti di partito), presi da fonti pubbliche: atti ufficiali, siti dei
        partiti e delle istituzioni, testate giornalistiche. Per ogni dato la fonte è indicata accanto.
      </p>
      <ul>
        <li>
          <strong>Perché:</strong> informare su questioni di interesse pubblico (spesa pubblica, leggi, promesse
          elettorali).
        </li>
        <li>
          <strong>Base giuridica:</strong> legittimo interesse (art. 6, par. 1, lett. f GDPR) bilanciato con la libertà
          di espressione e di informazione (art. 85 GDPR e articoli 136 e seguenti del Codice privacy, d.lgs. 196/2003).
          Appartenenza a un partito e dichiarazioni politiche rivelano opinioni politiche: le trattiamo perché sono rese
          manifestamente pubbliche dalla persona stessa (art. 9, par. 2, lett. e GDPR), nel rispetto delle Regole
          deontologiche per il trattamento dei dati personali nell&apos;esercizio dell&apos;attività giornalistica. Trattiamo
          solo dati legati al ruolo pubblico, mai dati sulla vita privata.
        </li>
        <li>
          <strong>Per quanto tempo:</strong> i dati restano come archivio storico, perché servono a confrontare nel tempo
          quello che è stato detto e fatto.
        </li>
        <li>
          <strong>Diritti:</strong> la persona citata può sempre chiedere la rettifica di un dato inesatto; le
          correzioni restano pubbliche nel registro.
        </li>
      </ul>

      <h2>A chi arrivano i dati</h2>
      <ul>
        <li>
          <strong>Vercel Inc.</strong>: hosting del sito e statistiche di visita, come responsabile del trattamento
          secondo il suo accordo sul trattamento dei dati.
        </li>
        <li>
          <strong>GitHub</strong>: piattaforma delle segnalazioni, come titolare autonomo, secondo la propria
          informativa.
        </li>
        <li>
          <strong>Anthropic</strong>: fornisce i modelli di intelligenza artificiale usati dagli agenti; riceve il testo
          e il nome utente delle segnalazioni, già pubblici su GitHub, e le fonti pubbliche usate per la ricerca.
        </li>
        <li>
          <strong>Resend</strong>: invio dei riepiloghi via email al titolare, come responsabile del trattamento secondo
          il suo accordo sul trattamento dei dati.
        </li>
      </ul>
      <p>Nessun dato viene venduto o ceduto ad altri per fini commerciali.</p>

      <h2>Trasferimenti fuori dall&apos;Unione europea</h2>
      <p>
        Questi fornitori hanno sede negli Stati Uniti.
      </p>
      <ul>
        <li>
          <strong>Vercel</strong> e <strong>Resend</strong> sono certificate secondo l&apos;EU-U.S. Data Privacy Framework
          (decisione di adeguatezza della Commissione europea del 10 luglio 2023) e i loro accordi includono le clausole
          contrattuali standard approvate dalla Commissione.
        </li>
        <li>
          <strong>GitHub</strong> tratta i dati delle segnalazioni come titolare autonomo, con le garanzie descritte
          nella sua informativa.
        </li>
        <li>
          <strong>Anthropic</strong> riceve solo dati già pubblici: testo e nome utente delle segnalazioni su GitHub e le
          fonti pubbliche usate per la ricerca.
        </li>
      </ul>
      <p>
        Puoi chiedere copia delle garanzie o maggiori dettagli scrivendo a{" "}
        <a href={`mailto:${CONTROLLER.email}`}>{CONTROLLER.email}</a>.
      </p>

      <h2>I tuoi diritti</h2>
      <p>
        Puoi chiedere di accedere ai tuoi dati, di correggerli, di cancellarli, di limitarne il trattamento, di
        riceverli in un formato leggibile e puoi opporti ai trattamenti basati sul legittimo interesse (articoli 15-22
        GDPR). Scrivi a <a href={`mailto:${CONTROLLER.email}`}>{CONTROLLER.email}</a> o, da una casella PEC, a{" "}
        {CONTROLLER.pec}: rispondiamo entro un mese.
      </p>
      <p>
        Se ritieni che il trattamento violi il GDPR puoi presentare reclamo al Garante per la protezione dei dati
        personali (
        <a href="https://www.garanteprivacy.it" target="_blank" rel="noopener noreferrer">
          garanteprivacy.it
        </a>
        ).
      </p>

      <h2>Link verso altri siti</h2>
      <p>
        Il sito rimanda a fonti esterne (Gazzetta Ufficiale, Eurostat, siti dei partiti, copie su Internet Archive e
        altre). Quando le apri, i dati li tratta il sito che visiti, secondo le sue regole.
      </p>

      <h2>Modifiche</h2>
      <p>
        Se cambiamo questa informativa aggiorniamo la data in alto. Il testo è nel repository pubblico, quindi ogni
        versione precedente resta consultabile su GitHub.
      </p>
    </ProsePage>
  );
}
