import type { Metadata } from "next";
import Link from "next/link";
import { ProsePage } from "@/components/prose-page";
import { LevelTag } from "@/components/verification-badge";

export const metadata: Metadata = {
  title: "Metodo",
  description: "Come Paghi Tu raccoglie, verifica e presenta i dati: livelli di verifica, regole di neutralità, limiti per periodo storico.",
};

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
      <ul className="!list-none !pl-0 space-y-4">
        <li className="flex gap-3"><LevelTag level="V1" /><span>Il dato è stato letto sulla fonte primaria (legge, banca dati dell'ente, documento ufficiale) e ricontrollato in modo indipendente.</span></li>
        <li className="flex gap-3"><LevelTag level="V2" /><span>Almeno una parte del dato viene da una fonte secondaria affidabile. Indichiamo quale parte.</span></li>
        <li className="flex gap-3"><LevelTag level="NV" /><span>Il dato non è ancora confermato. Resta visibile solo con questa etichetta.</span></li>
      </ul>
      <p>
        Un record prende sempre il livello del suo campo meno verificato. Un governo con date confermate ma
        maggioranza da fonte secondaria risulta V2, non V1.
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
        <li>Nei 15 giorni prima di un voto non pubblichiamo contenuti nuovi su partiti e promesse. Correggiamo solo errori.</li>
      </ul>

      <h2>Confrontare cifre di epoche diverse</h2>
      <p>
        Le cifre in lire si convertono al tasso fisso di 1.936,27 lire per euro. Per confrontare anni lontani
        mostriamo la percentuale sul PIL dello stesso anno, accanto alla cifra originale. Gli euro rivalutati con
        l'indice ISTAT dei prezzi al consumo restano disponibili come opzione, con le cautele che ISTAT stessa indica.
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

      <h2>Cosa possiamo mostrare, per periodo</h2>
      <dl className="divide-y divide-rule border-y border-rule">
        {PERIODS.map(([period, text]) => (
          <div key={period} className="grid gap-1 py-4 sm:grid-cols-[8rem_1fr] sm:gap-6">
            <dt className="tabular font-mono">{period}</dt>
            <dd className="text-ink-soft">{text}</dd>
          </div>
        ))}
      </dl>

      <h2>Errori</h2>
      <p>
        Ogni correzione resta pubblica nel <Link href="/correzioni" className="underline">registro delle correzioni</Link>,
        con il valore precedente, quello nuovo e il motivo. Distinguiamo i nostri errori dalle revisioni fatte dalle fonti.
      </p>
    </ProsePage>
  );
}
