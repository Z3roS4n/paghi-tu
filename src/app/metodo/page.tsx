import type { Metadata } from "next";
import Link from "next/link";
import { ProsePage } from "@/components/prose-page";
import { LevelTag } from "@/components/verification-badge";

export const metadata: Metadata = {
  title: "Metodo",
  description: "Come Paghi Tu raccoglie, verifica e presenta i dati: livelli di verifica, regole di neutralità, limiti per periodo storico.",
};

const LEVELS = [
  ["V1", "Il dato è stato letto sulla fonte primaria (legge, banca dati dell'ente, documento ufficiale) e ricontrollato in modo indipendente."],
  ["V2", "Almeno una parte del dato viene da una fonte secondaria affidabile. Indichiamo quale parte."],
  ["NV", "Il dato non è ancora confermato. Resta visibile solo con questa etichetta."],
] as const;

const PERIODS = [
  ["1946-1964", "Governi e leggi completi. Spesa dello Stato frammentaria (mancano online i rendiconti 1953-1965). Debito disponibile dal 1861."],
  ["1965-1994", "Rendiconti dello Stato solo in PDF scansionati. Conti di tutta la pubblica amministrazione da ISTAT dal 1980."],
  ["1995-2010", "Conti pubblici ISTAT ed Eurostat completi. Programmi elettorali depositati dal 2006, non tutti reperibili."],
  ["2011-oggi", "Bilancio dello Stato voce per voce (RGS). Programmi elettorali pubblicati dal Ministero dell'Interno dal 2018."],
] as const;

export default function MethodPage() {
  return (
    <ProsePage
      title="Metodo"
      intro="Paghi Tu non esprime giudizi. Mostra cosa dicono i documenti ufficiali, con il link per controllare."
    >
      <h2>Tre livelli di verifica</h2>
      <div className="grid gap-2.5" role="list">
        {LEVELS.map(([level, text]) => (
          <div key={level} role="listitem" className="flex items-start gap-3 rounded-card bg-paper-raised px-4 py-3.5 md:px-5">
            <LevelTag level={level} />
            <span className="text-ink-soft">{text}</span>
          </div>
        ))}
      </div>
      <p>
        Un record prende sempre il livello del suo campo meno verificato. Un governo con date confermate ma
        maggioranza da fonte secondaria risulta V2, non V1.
      </p>
      <p>
        Per le promesse, un&apos;intervista pubblicata da un giornale conta come fonte primaria: le parole sono del
        dichiarante e le controlliamo sul testo dell&apos;intervista, sul giornale o sulla ripubblicazione integrale in un
        canale del dichiarante (sito del partito, del ministero o personale). Restano V2 i discorsi e le dichiarazioni
        riportati da un articolo, le righe il cui testo abbiamo potuto leggere solo in una copia d&apos;archivio, e quelle in
        cui un&apos;altra parte del dato, per esempio il ruolo nel partito, viene da una fonte secondaria.
      </p>

      <h2>Come lavoriamo</h2>
      <p>
        La ricerca e la prima verifica sono svolte con strumenti di intelligenza artificiale che aprono le fonti
        ufficiali e ne citano il punto esatto. Ogni nota passa poi da una seconda verifica indipendente e da un
        confronto incrociato con le altre note. La responsabilità editoriale di ciò che pubblichiamo resta nostra.
      </p>
      <p>
        Le verifiche hanno già corretto errori reali prima della pubblicazione: una misura attribuita a un solo
        governo quando il costo stimato veniva da due, cifre riprese dalla stampa che non corrispondevano al
        documento originale. Per questo un numero preso solo dalla stampa non viene mai pubblicato come certo.
      </p>

      <h2>Stesse regole per tutti</h2>
      <ul>
        <li>Nessun aggettivo su persone o partiti. Verbi descrittivi: ha dichiarato, la legge prevede, la relazione tecnica stima.</li>
        <li>Nessun sondaggio, classifica tra partiti o voto degli utenti.</li>
        <li>Le promesse si citano con la frase esatta e la fonte, mai riassunte in forma più forte.</li>
        <li>Una promessa riceve un esito (attuata, parzialmente attuata, non attuata) solo con un atto documentato e alla scadenza dichiarata.</li>
        <li>Nei 15 giorni prima delle elezioni politiche o di un referendum nazionale non pubblichiamo contenuti nuovi su partiti e promesse. Correggiamo solo errori.</li>
      </ul>

      <h2>Confrontare cifre di epoche diverse</h2>
      <p>
        Le cifre in lire si convertono al tasso fisso di 1.936,27 lire per euro. Per confrontare anni lontani
        mostriamo la percentuale sul PIL dello stesso anno, accanto alla cifra originale. Gli euro rivalutati con
        l'indice ISTAT dei prezzi al consumo restano disponibili come opzione, con le cautele che ISTAT stessa indica.
      </p>

      <h2>Quanto costerebbe una promessa</h2>
      <p>
        Non stimiamo noi il costo delle promesse. Quando chi propone dichiara una cifra all&apos;anno, la traduciamo in
        euro per residente e, se è una spesa, la mettiamo accanto a quanto ha speso il settore pubblico per la stessa
        funzione nell&apos;ultimo anno disponibile: è solo aritmetica sulla cifra del proponente. Se la cifra non dice per quanti anni vale, non la dividiamo.
      </p>
      <p>
        Quando lo strumento proposto è dello stesso tipo di una misura già fatta (per esempio un&apos;uscita anticipata dal
        lavoro e Quota 100), mostriamo quanto quella misura doveva costare e quanto è costata davvero, solo se i due numeri
        sono confrontabili. Da qui il calcolo «se andasse come quelle misure», che applica gli stessi scostamenti alla
        cifra dichiarata: un riferimento, non una previsione. Gli scostamenti del passato vanno in tutte e due le
        direzioni, e un tetto di spesa non è una stima. Ogni promessa è stata classificata da due agenti in modo
        indipendente; dove non erano d&apos;accordo, non mostriamo precedenti. Non sommiamo i costi per partito: le cifre
        dichiarate sono poche e diverse fra loro, e la somma sembrerebbe una classifica.
      </p>

      <h2>Spesa, entrate e debito</h2>
      <p>
        I conti delle amministrazioni pubbliche (Stato, regioni, comuni, enti di previdenza) vengono da Eurostat, il debito
        mese per mese da Banca d&apos;Italia. Scarichiamo i file direttamente dagli enti e ne conserviamo una copia. A ogni
        aggiornamento i dati vengono incrociati fra fonti diverse: se il debito di Banca d&apos;Italia e quello di Eurostat non
        coincidono, o le voci di spesa non sommano al totale, l&apos;aggiornamento non va online.
      </p>
      <p>
        Le cifre per residente dividono il totale per la popolazione media dell&apos;anno: sono medie, non quello che paga una
        singola persona. Per i governi mostriamo il debito all&apos;ultima fine mese prima dell&apos;insediamento e all&apos;ultima
        fine mese prima della chiusura, così nessun mese viene contato per due governi. È una descrizione di cosa è successo durante il mandato, non un giudizio su chi lo ha
        causato.
      </p>

      <h2>Costo previsto e costo effettivo</h2>
      <p>
        Il previsto viene dalla relazione tecnica della legge o dal limite di spesa che la legge fissa. Il consuntivo
        viene da chi misura la spesa dopo: INPS, Dipartimento delle Finanze, ENEA, Ministero dell'Interno, Ufficio
        parlamentare di bilancio. La differenza la calcoliamo solo se le due cifre misurano la stessa cosa, e diciamo
        sempre se l'ha calcolata la fonte o noi. Se il consuntivo include modifiche arrivate dopo la legge, o misura
        una grandezza diversa, mostriamo le due cifre senza differenza.
      </p>

      <h2>Promesse della campagna in corso</h2>
      <p>
        Censiamo le promesse sui canali ufficiali dei partiti e dei loro leader, con la frase esatta. Ogni riga passa
        un secondo controllo indipendente sulla fonte. Pubblichiamo tutti i partiti insieme, dopo aver controllato che
        la ricerca abbia avuto la stessa profondità per ciascuno. Ogni promessa dice se riguarda la legislatura in corso o
        la prossima, e con quale strumento è stata presentata: programma, proposta di legge, richiesta sulla legge di
        bilancio, risoluzione in Parlamento. Non contiamo come promesse gli slogan, gli atti solo procedurali e gli
        impegni che non riguardano politiche pubbliche, come candidature e alleanze.
      </p>
      <p>
        Ogni promessa dice anche se, attuata, cambierebbe direttamente una spesa o un&apos;entrata pubblica. La
        classificazione la fanno due codificatori indipendenti, con lo stesso criterio per tutti i partiti, guardando solo il
        testo e non gli effetti indiretti; se non sono d&apos;accordo scriviamo «non chiaro». Quando un partito ripete la
        stessa proposta, la nuova dichiarazione compare sotto quella di prima come «ribadita» e non conta come una promessa
        in più. Resta una riga a sé se aggiunge una cifra, una soglia, una data o uno strumento diversi.
      </p>

      <h2>Leggi e decreti</h2>
      <p>
        Nel registro delle leggi e dei decreti entrano gli atti pubblicati in Gazzetta Ufficiale che autorizzano una spesa o
        cambiano un&apos;entrata con un importo scritto: decreti-legge, leggi e decreti legislativi. Per ogni misura copiamo
        l&apos;importo anno per anno dal testo o dalla relazione tecnica del governo, con le parole esatte, e diciamo se è un
        limite di spesa o una stima. Non registriamo come misure le coperture ottenute tagliando altri fondi, per questo i
        totali di un atto non sono il suo saldo ufficiale. Ogni importo è riletto sulla fonte da un secondo controllo prima
        della pubblicazione. Il registro parte dal governo in carica e va indietro fino al suo insediamento, il 22 ottobre 2022.
      </p>

      <h2>Cosa possiamo mostrare, per periodo</h2>
      <dl className="grid gap-2.5">
        {PERIODS.map(([period, text]) => (
          <div key={period} className="grid gap-1 rounded-card bg-paper-raised px-4 py-3.5 sm:grid-cols-[8rem_1fr] sm:gap-6 md:px-5">
            <dt className="font-display tabular text-lg font-bold">{period}</dt>
            <dd className="text-ink-soft">{text}</dd>
          </div>
        ))}
      </dl>

      <h2>Errori</h2>
      <p>
        Ogni correzione resta pubblica nel <Link href="/correzioni">registro delle correzioni</Link>,
        con il valore precedente, quello nuovo e il motivo. Distinguiamo i nostri errori dalle revisioni fatte dalle fonti.
      </p>
    </ProsePage>
  );
}
