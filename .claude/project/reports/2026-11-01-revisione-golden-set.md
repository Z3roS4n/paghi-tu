# Revisione del golden set dell'agente (2026-11-01)

Revisione caso per caso dei 157 casi di `agent/evals/domande.jsonl`, sul ramo della PR #6 allineato a `main` (`089e212`). L'ha fatta Claude su mandato del titolare: tre revisori indipendenti hanno lavorato su dati, promesse e casi manuali, e i punti principali sono stati ricontrollati a campione. Gli esiti sono in `agent/evals/revisione.json`.

**Esito: 119 ok, 38 da correggere, nessuno da togliere.** I valori attesi coincidono con i record di `data/` e con le copie delle fonti in `data/raw/`. I difetti stanno quasi tutti nella formulazione delle domande, nelle note dei casi manuali e in alcuni record di `leggi-bilancio.json` e `promesse.json`.

## Da correggere nel generatore (`golden-set.ts`)

- **Valori obbligatori che la domanda non chiede.** `score.ts` esige tutti i valori attesi non nulli. Nei casi «in carica» la domanda chiede solo il presidente, ma il caso vuole anche `inizio`; per g13, g21 e g30 la data è il giuramento, mentre la nomina cade il giorno prima. Togliere `inizio` dai valori attesi. Casi: GOV-g55, g5, g13, g21, g30, g38, g46, g61 (`-in-carica`).
- **Governo in carica al passato.** GOV-g202-maggioranza: «sostenevano» per il governo Meloni, che ha `fine` nullo. Per i governi in carica serve il presente.
- **Unicità per persona, non per stringa.** Il controllo di unicità confronta la stringa intera del dichiarante, mentre la route filtra per singola persona. Così PRO-C27-AVS-057, FI-028 e FI-030 hanno due candidate. Aggiungere il tema alla domanda e confrontare per persona.
- **Più dichiaranti.** Verbo al singolare e separatori «;» o «,» («ha dichiarato Enrico Costa; Stefania Craxi»), doppie parentesi con AVS. Casi: CSX-001, AVS-057, FI-028, FI-030. Dopo la modifica va ricontrollato che il cancello D4 (più partiti) non blocchi CSX-001.
- **Tema COFOG poco chiaro.** In AVS-056 e PCIT-011 l'area di spesa non basta a distinguere dichiarazioni dello stesso giorno. Usare il tema specifico o la formula «nell'area di spesa «…»».
- **Formule fisse sulle misure.** «Quanto era stanziato / si è speso davvero» non regge con limiti poi aumentati, proiezioni, oneri potenziali e minor gettito. Casi: MIS-quota_100-2 (consuntivo 2022-2025 proiettato da UPB; nota -10.272 contro valore -10.271), MIS-reddito_di_cittadinanza-2/3/4 (limite iniziale del DL 4/2019 o limite aggiornato), MIS-superbonus_110-1 (detrazioni maturate ENEA, non spesa; «Periodo «Intero periodo»»), MIS-abolizione_ici_prima_casa-1 (minor gettito certificato; totale in nota diverso dal valore).
- **Base dell'indice.** SER-prezzi-consumo-foi-2025: dire «base 1913 = 1, media annua».
- **Forma della domanda.** LB-1946-47-1947-48: «per gli esercizi 1946-47 e 1947-48»; erano decreti legislativi, quindi «ha autorizzato» invece di «ha presentato».
- **Elezioni su due giorni.** LEG-VII-elezioni: si votò il 20-21 giugno 1976; accettare la forma su due giorni. La sola fonte con la data è la pagina di un deputato.

## Da correggere nei casi manuali (`casi-manuali.json`)

- **Note in contrasto con l'astensione.** La 4.2 vuole astensione senza cifre, ma le note dicono che l'agente può offrire dati, stime o promesse. Casi: MAN-PAR-06, MAN-PAR-08 e MAN-PAR-11 (coppia speculare), MAN-OUT-03 e MAN-OUT-08 (coppia speculare), MAN-TRAP-03 (già segnato in D-040 come da allineare).
- **Par condicio.** MAN-PAR-02 nomina un solo partito (M5S) senza speculare: aggiungere lo speculare o togliere il nome.
- **Trappola che non scatta.** FP-trimestre-2026-Q2-precedente: la regola `solo_stesso_trimestre` controlla solo che compaia «stesso trimestre»; una risposta che dice «è salita» passa. Serve un controllo come `affirms()` per il tetto.

## Da verificare nei dati (passano dalla verifica a tre livelli, non da questa PR)

- **LB-1988 e LB-1996:** attribuzione «documentata» ma dettaglio «governo INFERENZA». Documentare l'iniziativa (dati.senato.it, come per 2005 e 2026) o marcare «inferita».
- **LB-1969:** livello NV con governo confermato dal verificatore e URL Normattiva già presente.
- **LB-1978:** la proroga C.2077 risulta del 17/03/1978, con Andreotti IV già in carica (g30 finisce il 13/03/1978). Verificare S.1136 e, se serve, separare i governi come nel record 1953-54.
- **PRO-C27-LEGA-001:** il verbatim attribuito a Salvini contiene una frase della newsletter, e la nota cita Durigon per la stessa proposta.
- **PRO-C27-SVP-003:** mozione firmata da 26 deputati, fra cui Schullian, registrata anche come C27-AVS-050. Attribuirla alla SVP come posizione propria è improprio.

## Equilibrio fra partiti

Sulle 60 domande sulle promesse il centrodestra ha 23 casi su 84 record (27 %), il centrosinistra 24 su 200 (12 %), il polo di centro 4 su 68 (6 %), gli altri 9 su 84 (11 %). Forza Italia ha 11 casi (18 % della sezione) contro il 5,5 % dei record. La causa è meccanica: la regola «tutti i V2 interrogabili» premia i partiti con molti V2 di persone diverse in giorni diversi. Proposta: tetto di 2-3 casi V2 per partito o quota per coalizione. Va deciso dal titolare (par condicio, D-013).

## Rischi non coperti dal set

- Silenzio elettorale (D-006, D-025): nessun caso prova l'astensione sulle promesse nei 15 giorni prima del voto.
- Classifiche fra governi («quale governo ha speso di più?»): `niente_classifiche` copre solo i partiti.
- Costo di una misura attribuito a un solo governo (per esempio il Superbonus tutto al Conte II).
- Partiti con canali non leggibili: nessun caso prova che l'agente non trasformi la mancanza di dati in «non ha promesso nulla».
- Sondaggi e risultati elettorali passati.

## Stato dei test dopo l'allineamento a `main`

Rigenerati `domande.jsonl`, `revisione.md` e `agent/ingest/manifest.json` (export: 2.123 documenti).

- Su Windows 3 test di `verifica.test.ts` sulle impronte falliscono anche sul ramo originale: dipendono dagli a capo del checkout (`core.autocrlf=true`). Nella CI su Linux passano.
- Dopo l'allineamento, il registro `verifica-fonti.json` non conteneva i 2 casi nuovi arrivati da `main` (PRO-C27-FI-042, PRO-C27-M5S-069). Serve `npm run evals:verify`, che distanzia le richieste a ISTAT come vuole D-004, ma richiede `pdftotext` (poppler), assente su questo computer: va lanciato dove poppler è installato. Fino ad allora la CI resta rossa su questi 2 test.

L'eval del 31 ottobre (155 casi al 100 %) vale per il set di quel giorno: dopo le correzioni va rifatta.
