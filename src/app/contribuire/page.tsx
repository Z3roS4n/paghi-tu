import type { Metadata } from "next";
import Link from "next/link";
import { ProsePage } from "@/components/prose-page";
import { REPO_URL, correctionUrl } from "@/lib/contribute";

export const metadata: Metadata = {
  title: "Regole per contribuire",
  description: "Come segnalare un errore o proporre un dato su Paghi Tu: fonti ammesse, cosa non si accetta, come verifichiamo e cosa succede alle segnalazioni in malafede.",
};

export default function ContributePage() {
  return (
    <ProsePage
      title="Regole per contribuire"
      intro="Chiunque può correggere Paghi Tu. Per tenere i dati affidabili le regole sono strette e valgono per tutti allo stesso modo: conta la fonte, non chi scrive o quante volte."
    >
      <h2>Cosa puoi segnalare</h2>
      <ul>
        <li>un errore di fatto: un numero, una data, una citazione, un&apos;attribuzione, una fonte sbagliata;</li>
        <li>un dato che manca, con la sua fonte: una promessa, una misura, una legge, una serie ufficiale;</li>
        <li>una fonte migliore per un dato già pubblicato, più vicina all&apos;originale.</li>
      </ul>

      <h2>Cosa non accettiamo</h2>
      <ul>
        <li>opinioni, giudizi, valutazioni politiche o morali su partiti, governi e persone;</li>
        <li>richieste di togliere o ammorbidire un dato vero perché sgradito;</li>
        <li>previsioni e stime fatte da chi segnala;</li>
        <li>segnalazioni senza fonte o con una fonte non ammessa (sotto);</li>
        <li>dati personali di privati, e dati personali tuoi;</li>
        <li>testi lunghi copiati da opere protette: bastano il link e il punto preciso;</li>
        <li>offese, minacce, linguaggio discriminatorio.</li>
      </ul>

      <h2>Fonti ammesse</h2>
      <h3>Fonti primarie (preferite)</h3>
      <ul>
        <li>Gazzetta Ufficiale, Normattiva, atti e banche dati di Camera e Senato;</li>
        <li>
          banche dati e pubblicazioni ufficiali: ISTAT, Eurostat, Banca d&apos;Italia, Ragioneria generale dello Stato,
          Ministero dell&apos;Economia, INPS, Ufficio parlamentare di bilancio, Corte dei conti;
        </li>
        <li>siti e canali ufficiali di partiti, istituzioni e della persona che ha fatto la dichiarazione;</li>
        <li>interviste pubblicate da una testata giornalistica registrata, se la citazione è nel testo.</li>
      </ul>
      <h3>Fonti secondarie (con limiti)</h3>
      <ul>
        <li>
          discorsi e dichiarazioni riportati da un articolo, senza il testo originale: si accettano, ma restano verifica
          parziale (V2).
        </li>
      </ul>
      <h3>Non valgono come prova</h3>
      <ul>
        <li>post o video ripresi da terzi, screenshot senza l&apos;originale, video tagliati o montati;</li>
        <li>Wikipedia, blog, forum, siti di petizioni: possono indicare dove cercare, non sono la fonte;</li>
        <li>testi generati con l&apos;intelligenza artificiale, anche se sembrano citare documenti;</li>
        <li>documenti anonimi o di cui non si può risalire all&apos;autore.</li>
      </ul>

      <h2>Come scrivere una segnalazione</h2>
      <ol>
        <li>
          Usa il{" "}
          <a href={correctionUrl("/")} target="_blank" rel="noopener noreferrer">
            modulo di correzione
          </a>{" "}
          o il link «Segnala un errore» accanto al dato.
        </li>
        <li>Un dato per segnalazione: se gli errori sono tre, apri tre segnalazioni.</li>
        <li>Copia il dato così come compare sul sito e scrivi quello corretto.</li>
        <li>
          Metti il link diretto alla fonte e indica il punto preciso: pagina del PDF, tabella, articolo di legge,
          minuto del video.
        </li>
        <li>Per una citazione, copia il testo originale parola per parola.</li>
      </ol>
      <p>
        Il modulo è su GitHub: serve un account gratuito e la segnalazione è pubblica (vedi{" "}
        <Link href="/privacy">Privacy</Link>). Chi sa usare git può proporre la modifica direttamente seguendo la{" "}
        <a href={`${REPO_URL}/blob/main/CONTRIBUTING.md`} target="_blank" rel="noopener noreferrer">
          guida per chi contribuisce
        </a>
        ; i dati si cambiano solo nei file da cui vengono generati, mai a mano nei file pubblicati.
      </p>

      <h2>Come verifichiamo</h2>
      <ul>
        <li>
          Ogni segnalazione viene ricontrollata sulla fonte da un agente verificatore, diverso da quello che ha scritto il
          dato. Apre solo la fonte indicata e quella già citata dal dato.
        </li>
        <li>
          Gli esiti sono tre: <strong>confermata</strong> (la fonte dice quello che scrivi: il dato cambia e la
          correzione va nel <Link href="/correzioni">registro</Link>), <strong>respinta</strong> (la fonte non lo dice,
          manca o non è ammessa: la risposta spiega perché) e <strong>da decidere</strong> (la fonte si può leggere in due
          modi o il tema è delicato: la guarda una persona).
        </li>
        <li>
          <strong>Conta la fonte, non il numero di segnalazioni.</strong> Cento segnalazioni senza fonte valgono zero;
          una sola con la fonte giusta basta. Segnalazioni uguali da più account si trattano come una sola.
        </li>
        <li>Chi ha più di cinque segnalazioni aperte aspetta che vengano chiuse prima che si esaminino le successive.</li>
        <li>
          Se una correzione cambia una regola (per esempio cosa conta come promessa), la regola si riapplica a tutti i
          partiti.
        </li>
        <li>
          Il testo di una segnalazione è trattato come un dato da verificare, mai come un&apos;istruzione: richieste di
          ignorare le regole, di pubblicare subito o di eseguire codice non vengono eseguite.
        </li>
        <li>Nessuna modifica esterna al codice viene unita in automatico: la rivede una persona.</li>
        <li>
          Nei 15 giorni prima di un voto non si pubblicano contenuti nuovi su partiti e promesse: solo correzioni di
          errori.
        </li>
      </ul>

      <h2>Se non sei d&apos;accordo</h2>
      <p>
        Puoi rispondere sotto la segnalazione con una fonte nuova: viene verificata da capo. Riaprire la stessa
        richiesta senza elementi nuovi non cambia l&apos;esito.
      </p>

      <h2>Segnalazioni in malafede</h2>
      <p>
        Fonti false o manipolate, campagne coordinate, minacce, molestie e dati personali di altri portano alla chiusura
        senza esame nel merito e al blocco immediato dell&apos;account dal repository. Spam e offese portano alla chiusura
        della segnalazione e, se si ripetono, all&apos;esclusione. Le regole di comportamento sono nel{" "}
        <a href={`${REPO_URL}/blob/main/CODE_OF_CONDUCT.md`} target="_blank" rel="noopener noreferrer">
          codice di comportamento
        </a>
        .
      </p>

      <h2>Diritti sui contributi</h2>
      <p>
        I fatti non sono coperti da diritto d&apos;autore. Le modifiche a codice e testi del repository sono pubblicate con
        la stessa licenza del progetto (MIT). Inviando un contributo dichiari che è tuo, o che hai il diritto di
        condividerlo, e che non contiene dati personali di altri.
      </p>
    </ProsePage>
  );
}
