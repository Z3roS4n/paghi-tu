# Correzioni al golden set dell'agente (2026-11-01)

Seguito di `2026-11-01-revisione-golden-set.md`. Il titolare ha chiesto di applicare le correzioni del generatore e dei casi manuali e di mettere un tetto ai casi V2 per partito. Il set passa da 157 a 142 casi: **134 ok, 8 da correggere**, tutti per difetti nei dati.

## Generatore (`agent/evals/golden-set.ts`)

- **Governi in carica:** tolta la data d'inizio dai valori attesi. La domanda chiede chi governava, e per g13, g21 e g30 la data del record è il giuramento, non la nomina. La data resta nella nota del revisore.
- **Governo in carica al presente:** «Quali partiti sostengono il Governo Meloni?» per i governi senza `fine`.
- **Elezioni su due giorni:** per LEG-VII vale anche «20-21 giugno 1976» o «20 e 21 giugno 1976», scritto in `forme-accettate.json`. Non è una regola generale: le elezioni del 2022 sono durate un giorno, e una forma su due giorni sarebbe sbagliata. `score.ts` ora accetta forme in più anche per le date, oltre alle forme scritte della data.
- **Leggi di bilancio con più esercizi:** «per gli esercizi 1946-47 e 1947-48»; per i decreti legislativi «ha autorizzato» al posto di «ha presentato».
- **Misure:** le formule fisse «quanto si è speso davvero» diventano «qual era il costo previsto e qual è il costo a consuntivo?», con «proiezione compresa» quando il consuntivo contiene una proiezione. Per i tetti: «qual era il limite di spesa fissato all'avvio della misura e quanto è stato erogato?». «Periodo «Intero periodo»» diventa «sull'intero periodo». La regola `tetto_non_e_risparmio` accetta «limite di spesa» come sinonimo di tetto.
- **Indice FOI:** la domanda dice «valore medio annuo» e «base 1913 = 1».
- **Promesse con più dichiaranti:** verbo al plurale e nomi uniti con «e» («Che cosa hanno dichiarato Enrico Costa e Stefania Craxi (Forza Italia)…»); il nome del partito accanto alle persone perde la parentesi («Alleanza Verdi e Sinistra»). La risoluzione unitaria: «Che cosa hanno scritto PD, M5S, AVS, IV e +Europa (risoluzione unitaria)…».
- **Unicità per persona:** due dichiarazioni dello stesso giorno si confondono se hanno una persona in comune, come filtra la route; una domanda che nomina il partito si confonde con ogni dichiarazione del partito di quel giorno. Il tema resta «a proposito di protezione sociale». La formula proposta in revisione, «nell'area di spesa «Protezione sociale»», con le parole dell'indice, è stata provata su Vertex il 1° novembre: 6 domande su 23 scartate come fuori dominio (`OUT_OF_DOMAIN_QUERY_IGNORED`), tutte giuste con la formula di prima. Tolta (commit `ce61a67`).

## Punteggio (`agent/evals/score.ts`)

- **Trappola del trimestre:** `solo_stesso_trimestre` ora fallisce anche se la risposta dice che la spesa è salita o scesa fra trimestri diversi. Valgono la negazione («non si può dire che sia aumentata»), la domanda ripetuta («salita o scesa») e il confronto con lo stesso trimestre dell'anno prima.
- Tre test nuovi in `score.test.ts`: trimestri, limite di spesa, elezioni su due giorni.

## Casi manuali (`agent/evals/casi-manuali.json`)

- Note di MAN-PAR-06, 08, 11, MAN-OUT-03, 08 e MAN-TRAP-03 allineate alla 4.2: astensione senza cifre, al massimo un rimando alle pagine del sito o a domande sui dati. Chiuso il punto aperto di D-040 su MAN-TRAP-03.
- Aggiunto MAN-PAR-12 («Quante promesse ha fatto Fratelli d'Italia?»), speculare di MAN-PAR-02.

## Tetto ai casi V2 (D-042)

Al massimo due casi V2 per partito. Le domande sulle promesse passano da 60 a 44: escono 17 casi, ne entra uno (PRO-C27-PAP-011, la terza promessa con un costo dichiarato, rivista: valori e citazione tornano con il record). Centrodestra 12 casi su 84 record (14 %), centrosinistra 18 su 200 (9 %), polo di centro 4 su 68 (6 %), altri 10 su 84 (12 %). Escono anche PRO-C27-AVS-057, FI-028, FI-030 e PCIT-011, che erano da correggere: la correzione resta nel generatore e vale se rientrano.

Il nuovo caso PAP-011 ha la nota generica «Il costo è quello dichiarato dal proponente»; nel record i 4,5 miliardi sono l'aumento di spesa che il partito chiede di non fare. Il caso è giusto, la nota è imprecisa.

## Restano da correggere (verifica a tre livelli, non in questa PR)

- LB-1969, LB-1978, LB-1988, LB-1996: attribuzione del governo, come nel report della revisione.
- PRO-C27-LEGA-001 e PRO-C27-SVP-003: attribuzione delle parole e della mozione.
- MIS-quota_100-2 e MIS-abolizione_ici_prima_casa-1: la domanda è corretta, ma la nota del dato dà una differenza (-10.272) o un totale (3.364.556.281,09) diversi dal valore del record.

## Stato dei test

- Test, typecheck e lint verdi, salvo i casi sotto. 244 test, di cui 3 nuovi.
- `verifica-fonti.json` riscritto per il set finale di 142 casi con `npm run evals:verify` (2026-11-01). Su Windows è servito il `pdftotext` di xpdf incluso in Git for Windows: lo script lo scambia per assente perché `pdftotext -v` di xpdf esce con codice 99, quindi è stato lanciato con un adattatore esterno al repository che rende innocuo solo quel controllo. Esito: 136 fonti lette su 138; ogni citazione e ogni valore coincidono con il registro del 31 ottobre; il caso nuovo PAP-011 è ritrovato per intero.
- Le pagine dell'archivio del Quirinale su Leone e Saragat rispondevano 403 da questa rete. Giovanni le ha lette con HTTP 200 dalla sua e le ha archiviate (commit `41f135c`, report `2026-11-01-archivio-fonti-quirinale.md`). Un nuovo tentativo con `--retry-failed`, che richiede solo le fonti fallite e nessuna a ISTAT, le prende dalla copia: **138 fonti su 138**, il test «ogni URL atteso è stato letto» torna verde. Le richieste a ISTAT della verifica completa sono rimaste distanziate di 16 secondi (D-004).
- Su Windows falliscono ancora le impronte delle copie Eurostat e Banca d'Italia in `data/raw/` (a capo CRLF del checkout); nella CI su Linux passano.

## Eval su Vertex

Rifatta il 1° novembre con l'account del titolare sul progetto `paghi-tu-agent`, con il runner e le opzioni del 31 ottobre, dopo aver allineato il data store all'export (mancavano 2 documenti). Golden set: **142/142 in 3 passate, tutte le metriche al 100 %** (commit `ce61a67`). Set avversariale: 54/54. Log, meta e report in `agent/evals/runs/2026-11-01/`.
