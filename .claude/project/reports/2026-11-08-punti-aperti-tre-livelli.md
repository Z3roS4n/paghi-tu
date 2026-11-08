# Punti aperti corretti con la verifica a tre livelli (2026-11-08)

Seguito di `2026-11-01-correzioni-dati-tre-livelli.md`. Il titolare ha chiesto di sistemare i punti aperti di quel report, in autonomia. Ogni gruppo ha avuto tre passaggi:

1. ricerca;
2. verifica indipendente sulle fonti, senza riusare i file della ricerca;
3. tentativo di smentita, svolto in parallelo alla verifica e senza conoscerne l'esito.

Si è applicato solo ciò che ha superato tutti e tre. Le modifiche stanno nei CSV di ricerca e passano a `data/*.json` con `npm run data:import`. Ogni cambiamento visibile sul sito è nel registro delle correzioni, da COR-0017 a COR-0047. Le date dei governi in `governi.json` (giuramento invece di nomina) restano come sono: sono una convenzione. ac12_3448 ora è fra le fonti del bilancio di previsione 1996.

## Leggi di bilancio

**Bilanci di previsione 1965-1977 (COR-0017…0023, COR-0030…0035).**

- **Livello:** tredici record restavano NV per un «estremi legge NV» rimasto dalla prima stesura, anche se la legge era già stata letta su Normattiva. Ora sono V1. Ogni anno ha come fonti lo stampato Camera e la scheda dell'Iter delle leggi 1948-1990.
- **Governo, da dedotto a documentato:** 1966 Moro II, 1968 Moro III, 1969 Leone II, 1972 Colombo, 1974 Rumor IV, 1976 Moro IV.
  - Quando un ministro aveva la stessa carica anche nel governo vicino, decide la data di presentazione (al Senato per i disegni di legge partiti dal Senato).
  - 1969: Colombo è ministro «del Tesoro e ad interim del Bilancio» solo nel governo Leone II.
  - 1970: la fonte generica dell'Iter è sostituita dalla scheda 8001.
  - 1975: decide la data, perché Colombo e Giolitti hanno le stesse due cariche anche nel Rumor III.
  - 1976: la fonte ac06_4131-bis era il fascicolo delle note illustrative. Il disegno di legge è ac06_4131. Il governo poggia anche sull'approvazione del Senato (20/11/1975), non solo sulla data dell'Iter, che segue l'elenco degli allegati.
  - 1977: lo stampato è del 29/07/1976, il giorno della nomina del governo Andreotti III. Lo firmano Colombo e Andreotti, ministri del Moro V, mentre nel governo Andreotti III Tesoro e Bilancio vanno a Stammati e Morlino. Il governo resta Moro V.

**Leggi finanziarie 1980-2000.**

- **Atto Camera sbagliato (COR-0027, 0028, 0029):** per il 1994, il 1998 e il 2000 l'atto citato era quello del bilancio di previsione, come era successo per il 1996. Sostituito con quello della legge finanziaria: ac11_3340, ac13_4355 e ac13_6557.
- **Note interne contraddittorie:** le finanziarie 1980, 1982, 1984, 1986, 1990, 1992 e 1994 erano «documentate», ma la nota interna diceva ancora «INFERENZA». Ora il governo è documentato dagli stampati e dalle cariche: Cossiga I, Spadolini I, Craxi I, Craxi I, Andreotti VI, Andreotti VII, Ciampi. Nessuna correzione pubblica, perché il dato visibile non cambia.
- **Finanziaria 1996:** il titolo dell'atto, citato senza la parte finale, ora è completo, anche in COR-0016.

**Altri record.**

- **Esercizio provvisorio 1966 (COR-0036):** Moro II documentato.
- **Esercizio provvisorio 1958-59 (COR-0037):** da NV a V1. La legge è la n. 625 del 20/06/1958 (atto C.1/S.4), presentata dal governo Zoli.
- **Bilanci di previsione 1996 e 2005 (COR-0038, 0039):** ora citano il proprio disegno di legge. Prima il governo era attribuito per analogia con la finanziaria. Il disegno di legge 2005 è presentato il 30/09/2004; l'1/10 di dati.camera.it è la data della scheda.

## Promesse

- **C27-LEGA-011 (COR-0024):** il testo citato è della newsletter #32, in terza persona. Ora è attribuito a «Lega (partito – newsletter ufficiale)», come C27-LEGA-001.
  - Le sole parole fra virgolette del paragrafo sono di Molinari e non dicono in che cosa consiste la misura.
  - La lettera d'apertura firmata da Salvini chiama la misura «la proposta della Lega». Non è usata, perché la citazione non viene da lì.
  - La citazione ora arriva alla fine della frase.
- **C27-LEGA-007 (COR-0025):** l'attribuzione a Salvini è confermata. Il virgolettato è in prima persona e segue «Matteo Salvini ha annunciato». La citazione ora tiene «già questa settimana riproporremo in Parlamento» e segna con «[…]» le due parti tolte.
- **Stesso difetto negli altri partiti (COR-0040…0047).** Per non applicare due criteri diversi (D-013), il controllo ha riletto le fonti di tutte le 55 righe pubblicate che nominano una persona e citano un canale di partito. Ha trovato otto righe con lo stesso difetto della LEGA-011:
  - C27-NM-003 (Lupi) e C27-NM-007 (Gelmini) ora sono «Noi Moderati (partito – sito ufficiale)»;
  - C27-ORA-001…006 (Boldrin) ora sono «ORA! (sito ufficiale)», come le altre righe del sito di ORA!.

  La citazione non cambia. Su FdI, IV e sugli altri partiti le parole citate sono davvero delle persone nominate.

## Misure

**Quota 100 (COR-0026).** La descrizione del consuntivo diceva «consuntivo 2019-2021». Per il 2021 l'UPB aumenta la spesa registrata dall'INPS (5.148 mln) di circa il 10% per le quasi 39.000 domande giacenti, e arriva a 5.648 mln (Tab. 20, p. 47; giacenti a p. 33). Ora la descrizione distingue spesa registrata, stima e proiezione. Gli importi non cambiano.

## Golden set

- **Composizione (D-045):** le correzioni cambiano di nuovo la scelta delle leggi di bilancio. Escono sette casi, fra cui LB-1969-bilancio, che era `da_correggere` e ora è corretto. Entrano sette casi, rivisti sulle fonti: cinque `ok`, due `da_correggere` (sotto).
- **Quota 100:** cambia solo la nota del revisore del caso, che resta `ok`.
- **Promesse:** le correzioni non toccano nessun caso.
- **Totale:** 141 casi, 139 `ok`, 2 `da_correggere`.
- **D-046:** le citazioni dei frontespizi stampati in maiuscolo si trascrivono con le maiuscole normali.

## Controlli

- **Lint, typecheck, build e `check:pages`:** verdi (88 pagine, 0 problemi).
- **Test:** 305 su 306; fallisce solo, su Windows, il test delle impronte delle copie Eurostat (a capo CRLF), che nella CI su Linux passa.
- **`evals:verify`:** 136 fonti su 136, 0 citazioni non ritrovate, 47 valori non trovati, tutti dei tipi coperti dalle eccezioni (estremi e nome del governo delle leggi di bilancio, scostamenti calcolati da Paghi Tu). Una lettura ISTAT andata in timeout è stata ripetuta una volta sola con `--retry-failed`; le richieste a ISTAT sono rimaste distanziate di 16 secondi (D-004).

## Punti aperti

Visti da un solo livello, quindi non applicati.

- **LB-2002-bilancio-di-previsione (`da_correggere`):** la nota documenta il governo con S.699, che è la finanziaria 2002. Il bilancio è S.700 (dati.senato.it ddl 15717, Tremonti, Berlusconi II). Il governo non cambia.
- **LB-1962-63-esercizio-provvisorio (`da_correggere`):** il record è V1, ma i suoi estremi dicono «(estremi legge NV)». Gli elementi per correggerlo:
  - la legge è la n. 568 del 29/06/1962;
  - lo stampato C.3889 è di Tremelloni di concerto con La Malfa;
  - Tremelloni è al Tesoro solo nel governo Fanfani IV.

  Correggerlo cambia di nuovo la scelta del golden set.
- **Esercizio provvisorio 1956-57:** è NV davvero, ma si può correggere. La legge è la n. 580 del 28/06/1956. Lo presentano Medici e Zoli al Senato il 16/06/1956, durante il governo Segni I.
- **Bilancio 1963-64:** è NV. I bilanci sono leggi separate per ciascuno stato di previsione. Le presenta il governo Fanfani IV e decadono con lo scioglimento delle Camere; il governo Leone I le ripresenta dal 24/06/1963. Da verificare.
- **Esercizi provvisori senza estremi:** 1959-60, 1965, 1967, 1968, 1971, 1972, 1974, 1975 e 1979 hanno ancora «legge NV», e lì gli estremi della legge mancano davvero.
- **Tagli nelle citazioni delle promesse:**
  - 15 citazioni cominciano a metà frase senza «[…]». Fra queste LEGA-012, LEGA-013, PE-007 (che comincia a metà parola), IV-003, IV-007 e PD-026.
  - 20 citazioni finiscono a metà frase. Il dataset finora non ha mai segnato i tagli in fondo, quindi serve una regola. ORA-021 finisce con una virgola.
  - 122 testi pubblicati cominciano con la minuscola senza «[…]», molti probabilmente perché sono voci di elenco. Non sono stati controllati uno per uno.
- **C27-NM-007:** su dati.senato.it l'unico disegno di legge di Gelmini sull'AFAM è S.1411 del 5/03/2025, firmato solo da lei. La pagina del 7/10/2026 potrebbe riannunciare quell'atto (da verificare). È una questione di perimetro, non di dichiarante.
- **FDI-015, FDI-017 e PE-008:** fra i dichiaranti ci sono persone che non dicono le parole citate (FDI), oppure manca uno dei firmatari dell'atto (PE-008). Il criterio va deciso.
- **Bilanci 1970 e 1971:** sono presentati da un governo già dimissionario. La nota non lo dice, mentre la nota del 1978 lo dice. Non cambia il governo indicato.
