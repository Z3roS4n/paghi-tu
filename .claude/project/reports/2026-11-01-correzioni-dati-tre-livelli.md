# Correzioni dei dati con la verifica a tre livelli (2026-11-01)

Seguito di `2026-11-01-correzioni-golden-set.md`. Gli 8 casi del golden set rimasti `da_correggere` avevano il difetto nel dato o nella sua nota. Il titolare ha chiesto di correggerli con la verifica a tre livelli: ricerca, verifica indipendente, tentativo di smentita fatto senza conoscere l'esito della verifica. Si è applicato solo ciò che ha superato tutti e tre i livelli. Le modifiche sono nei CSV di ricerca e passano a `data/*.json` con `npm run data:import`. Ogni correzione visibile sul sito è nel registro (COR-0010…0016).

## Misure

Previsto, consuntivo e scostamento non cambiano. Cambiano solo le note.

- **Quota 100 (COR-0010).** La nota riportava 10.272 e 5.772 mln. Sono le differenze stampate dall'UPB, cioè la somma delle differenze annue arrotondate al milione. Lo scostamento della pagina è invece la differenza fra i totali: -10.271 e -5.771 mln. Ora la nota dice da dove viene ciascun numero; per il 2023 l'UPB indica 1.372, mentre 5.034 - 3.663 = 1.371. Il secondo livello ha tolto un «perché» che la fonte non dà.
- **Abolizione dell'ICI sulla prima casa (COR-0011).** La nota citava il totale di p. 4 (3.364.556.281,09) senza dire che il consuntivo usa l'ICI attestata di p. 3 (3.364.846.992,77). Ora indica il totale usato e la differenza fra i due (290.711,68 euro), che la fonte non spiega. Lo scostamento cambierebbe di 0,2 mln; in percentuale resta +29,2%. Tolta la parola «ricalcolato», che la fonte non usa per quel totale.

## Promesse

- **C27-LEGA-001 (COR-0012).**
  - **Difetto:** la citazione univa una frase che la newsletter «La Settimana Leghista #38» attribuisce a Salvini fra virgolette con una frase scritta dalla newsletter, presentando tutto come parole di Salvini.
  - **Correzione:** dichiarante «Lega (partito – newsletter ufficiale)», come le altre righe della stessa newsletter. La citazione è ora solo testo della newsletter, con età, platea, sperimentazione e costo.
  - **Livello 3:** ha trovato che nell'intervista a La Verità, riferita dalla newsletter, Salvini stesso parla di 64 anni, contributi prima del 1996, 80.000 persone e 1,6 miliardi. Quindi il motivo non dice che Salvini non l'abbia proposto. L'intervista è a pagamento e, come per C27-NM-021 e C27-IV-027, non è usata come fonte.
  - **Note:** sono state integrate, non riscritte.
- **C27-SVP-003 (COR-0013): tolta dal catalogo.**
  - **Difetto:** la mozione Boldrini 1-00599 ha 26 firmatari. L'unico della SVP è Manfred Schullian, che presiede il gruppo Misto (più formazioni) e non ha incarichi di partito su svp.eu. Non firmano né l'Obmann Dieter Steger né la rappresentante della componente Renate Gebhard.
  - **Regola:** è la stessa applicata a C27-PD-031 e alle componenti del Misto.
  - **Dove resta la misura:** il punto 4 resta per AVS (C27-AVS-050); per +Europa la stessa misura è C27-PE-026.
  - **Effetti:** tolta l'eccezione ormai inutile in `eccezioni-fonti.json`. La SVP non ha più promesse pubblicate.

## Leggi di bilancio

Per gli atti prima del 1990 la prova del governo è la prima pagina dello stampato Camera («presentato dal Ministro del Tesoro … di concerto …»), incrociata con le cariche dei ministri su dati.camera.it e con l'Iter delle leggi 1948-1990.

- **Esercizio provvisorio 1969 (COR-0014).** Il record passa da NV a V1.
  - Legge 24 dicembre 1968 n. 1273 (Normattiva).
  - Stampato C.781: presentato da Colombo (Tesoro) di concerto con Preti (Bilancio). Preti ricopre quella carica solo nel governo Rumor I; Colombo era al Tesoro anche nel Leone II, quindi da solo non basta.
  - Al posto del link al catalogo dell'Iter c'è la scheda 7806.
  - Il terzo livello ha ricordato che il livello si calcola dal token più basso in `stato_verifica`: il testo è stato riscritto senza «NV».
- **Esercizio provvisorio 1978 (COR-0015).**
  - Estremi completati con la legge di proroga (L. 22 marzo 1978 n. 76) e con l'atto della L. 934/1977 (S.1028/C.1940).
  - Governo Andreotti III, ora documentato. I due disegni di legge li presenta Stammati, ministro del Tesoro solo in quel governo: S.1028 il 2/12/1977, S.1136 l'8/3/1978. Il 17/03 di dati.camera.it è la data di trasmissione alla Camera.
  - La proroga è approvata sotto Andreotti IV. Il record non si divide perché conta il governo che presenta l'atto, come nel 1953-54.
- **Legge finanziaria 1988.**
  - Valori invariati. La nota interna diceva «INFERENZA»: ora il governo è documentato dallo stampato C.2043 (Amato, Colombo, Gava, insieme solo nel governo Goria) e dall'Iter, scheda 12225.
  - Aggiunta la fonte. Nessuna correzione pubblica: il dato visibile non cambia.
- **Legge finanziaria 1996 (COR-0016).**
  - La fonte ac12_3448 era il bilancio di previsione 1996 (S.2019): sostituita con ac12_3447 (S.2156, legge finanziaria 1996).
  - Aggiunto lo stampato C.3447: Dini di concerto con Masera, che è al Bilancio solo nel governo Dini.
  - L'iniziativa «Popolare» nei metadati di dati.camera.it è un errore della scheda.

## Golden set e controlli

- **Riselezione (D-045).** Le correzioni del 1969 e del 1978 spostano due record di gruppo e cambiano la scelta delle leggi di bilancio.
  - Escono LB-1969, LB-1978, LB-1988, LB-1996, LB-1958-59-bilancio e LB-2005-legge-finanziaria.
  - Entrano LB-1987-legge-finanziaria, LB-1996-bilancio, LB-2005-bilancio, LB-1966-esercizio-provvisorio, LB-1958-59-esercizio-provvisorio e LB-1969-bilancio.
  - Si è accettata la nuova scelta invece di fissare i casi a mano.
- **Revisione dei casi entrati:** un revisore indipendente ha controllato i sei casi entrati su Normattiva, sugli stampati Camera e sulle cariche dei ministri.
  - **Cinque `ok`.** Per LB-1987 il governo Craxi II si ricava dalla data dello stampato (29/09/1986), perché Goria e Romita avevano le stesse cariche anche nel Craxi I.
  - **LB-1969-bilancio-di-previsione è `da_correggere`.** Il record resta NV per un token «estremi legge NV» rimasto nella nota, mentre la verifica del 20 ottobre ha già letto la legge su Normattiva. Anche il governo si può documentare: lo stampato C.311 è presentato da Colombo, «Ministro del Tesoro e ad interim del Bilancio», carica che ha solo nel governo Leone II. Visto da un solo livello, quindi non applicato.
- **Set finale:** 141 casi, 140 `ok` e 1 `da_correggere`. I casi Quota 100, ICI e LEGA-001 passano a `ok`; le voci dei casi usciti sono tolte da `revisione.json`.
- **Set avversariale:**
  - ADV-M8-03 ora attribuisce la proposta alla Lega e vieta «uscire volontariamente a 64 anni».
  - ADV-CTRL-05 aveva lo scopo di provare che «condannato» in una citazione non fa scattare il lessico dei giudizi. Nessun'altra citazione del golden set contiene una parola del lessico, quindi quella prova si perde. Il controllo resta su LEGA-001 con la domanda nuova: la promessa va citata come testo del partito.
- **Indice e verifica:** `ingest:build` rigenerato (registro delle correzioni da 9 a 16 voci).
- **Esito delle verifiche:**
  - **Lint, typecheck, build e `check:pages`:** verdi (88 pagine, 0 problemi).
  - **Test:** 304 su 306.
  - **`evals:verify`:** 132 fonti lette su 134, nessuna citazione non ritrovata. I valori non trovati sono 49, gli stessi tipi di prima (estremi e nome del governo, coperti dalle eccezioni scritte); passano dai casi usciti a quelli entrati.
  - **Restano non lette due interrogazioni ISTAT sulla popolazione** (RICPOPRES2011 e RICPOPRES1991): vanno in timeout da questa rete, dopo una verifica completa, una seconda verifica completa e un nuovo tentativo solo sulle fonti fallite. Le richieste sono rimaste distanziate di 16 secondi (D-004). Per questo fallisce il test «ogni URL atteso è stato letto», che si chiude rifacendo il tentativo sulle fonti fallite quando ISTAT risponde.
  - **Solo su Windows** fallisce anche il test delle impronte delle copie Eurostat (a capo CRLF del checkout); nella CI su Linux passa.

## Punti aperti

> Chiusi in gran parte il 2026-11-08: vedi `2026-11-08-punti-aperti-tre-livelli.md`.

Visti da un solo livello, quindi non applicati qui.

- **Stesso errore del 1996** (atto Camera del bilancio al posto della finanziaria), trovato dal terzo livello con una query su dati.camera.it:
  - 1994: ac11_3341 invece di ac11_3340;
  - 1998: ac13_4356 invece di ac13_4355;
  - 2000: ac13_6558 invece di ac13_6557.
- **Note interne contraddittorie:** le leggi finanziarie 1980, 1982, 1984, 1986, 1990, 1992 e 1994 sono «documentate» ma la nota interna dice ancora «governo INFERENZA».
- **Stesso token «estremi legge NV» in 13 bilanci di previsione** (1965-1977, fra cui il 1969 sopra), nonostante la nota V1✓ dica che gli estremi sono stati letti su Normattiva. Controllato solo sulle note, non sulle fonti. Correggerli cambierebbe di nuovo la scelta del golden set (D-045).
- **Promozioni possibili segnalate dalla revisione dei casi entrati:**
  - esercizio provvisorio 1966: Moro II documentabile dagli stampati C.2838 e C.2970;
  - esercizio provvisorio 1958-59: L. 20 giugno 1958 n. 625, Normattiva e dati.camera.it;
  - fonti in più per i bilanci di previsione 1996 (stampato C.3448) e 2005 (ac14_5311).
- **ac12_3448:** può diventare fonte del bilancio di previsione 1996, che oggi ha solo Normattiva.
- **C27-LEGA-011:** ha lo stesso difetto della LEGA-001, cioè testo in terza persona della newsletter #32 attribuito a Salvini.
- **Quota 100:** la descrizione del consuntivo dice «consuntivo 2019-2021», ma per il 2021 l'UPB include già circa il 10% di domande giacenti (p. 46).
- **Date di governo:** `governi.json` usa le date del giuramento, la Camera quelle della nomina (Andreotti III: 13/03 contro 11/03/1978). È una convenzione e non cambia nessun esito.

## Seguito della verifica automatica della PR (2026-11-08)

La verifica automatica del 2 novembre ha dato DUBBIO su due correzioni e ha segnalato alcune citazioni abbreviate.

- **C27-SVP-003 (COR-0013).** La pagina «Organisation» di svp.eu dice che del Parteiausschuss fanno parte tutti i parlamentari («alle Mandatar/innen … ital. Parlament»), quindi anche Schullian. «Senza incarichi di partito» era impreciso: motivo e `stato_verifica` ora dicono che fa parte di quell'organo collegiale e che, per la stessa pagina, il partito lo rappresenta all'esterno l'Obmann («vertritt sie nach außen»), che non firma. L'esito non cambia: il Parteiausschuss non è fra i ruoli che parlano per un partito, per nessun partito. La lista elettorale ora è citata come sulla scheda camera.it, «Südtiroler Volkspartei (SVP) - PATT». Fonte della correzione: la pagina svp.eu.
- **Esercizio provvisorio 1969 (COR-0014).** La scheda dell'Iter nomina solo Colombo; Preti è nello stampato C.781, letto dai primi due livelli ma non citato fra le fonti. Ora lo stampato è fra le fonti del record ed è la fonte della correzione. Il vecchio indirizzo `www.camera.it/_dati/…` rimanda a `documenti.camera.it`, dove il file risponde (HTTP 200).
- **Citazioni dei frontespizi** (1978, 1988, 1996): il titolo del ministro del Bilancio era abbreviato dentro le virgolette. Ora c'è «[…]» al posto della parte tolta, e per il 1996 «con il» come nello stampato. Nel 1978 «presentati» diventa «presentato», come scrivono i due stampati.
- `main` unito nel ramo (atti fino al 2026-11-06, idee per i reel): nessun file in comune. `domande.jsonl` non cambia, quindi il registro delle fonti resta valido salvo le due letture ISTAT ancora mancanti.
- **SVP su `/promesse` (decisione del titolare, 2026-11-08):** la nota «Copertura e limiti» ha ora una riga generata per ogni partito senza promesse pubblicate e senza canali illeggibili (NOVAX ha già la riga dei canali illeggibili). Oggi riguarda solo la SVP.
- **Verifica delle fonti rifatta il 2026-11-08** da questa rete, con richieste a ISTAT distanziate di 16 secondi (D-004): **134 fonti su 134** (4 dalle copie d'archivio), 0 citazioni non ritrovate, 49 valori non trovati, coperti dalle eccezioni come prima. Il test «ogni URL atteso è stato letto» torna verde.
