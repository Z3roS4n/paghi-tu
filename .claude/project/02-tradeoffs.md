# Paghi Tu — Decisioni & trade-off (ADR)

> Ogni decisione non ovvia va registrata qui con un ID `D-00X`. Le decisioni aperte in fondo.
> Le decisioni D-001…D-010 sono proposte uscite dalla ricerca del 2026-10-20 (sintesi: `research/2026-10-20.sintesi-e-verifica-incrociata.md`). Nessuna è adottata finché il titolare non la conferma. D-011 è una scelta di sviluppo, anch'essa da confermare.

## Registro decisioni

### D-001 — Una sola fonte di verità per ogni grandezza e periodo
- **Stato:** PROPOSTA — da confermare con il titolare
- **Contesto:** per la stessa grandezza esistono più fonti con valori diversi (ISTAT, Eurostat, Banca d'Italia, FMI, AMECO, OCPI). Se il sito mescola fonti senza regola, le serie hanno salti non spiegati e i numeri diventano contestabili.
- **Opzioni:** A) una fonte di verità per grandezza e periodo, le altre come controllo; B) mostrare tutte le fonti affiancate; C) media o serie "nostra" ricostruita.
- **Scelta:** A, con questa tabella:
  - spesa del bilancio dello Stato 2011–oggi: RGS/BDAP; 1966–2004: rendiconti RGS digitalizzati; 2005–2010: rendiconti sul sito RGS;
  - conti delle AP 1995–oggi: ISTAT (Eurostat come controllo); 1980–1994: ISTAT, Sommario di statistiche storiche;
  - debito delle AP: Banca d'Italia (TCCE0200);
  - PIL: ISTAT dal 1995, Banca d'Italia NA150 1946–1994 raccordato;
  - popolazione: ISTAT dal 1952, NA150 1946–1951; prezzi: FOI ISTAT;
  - governi e legislature: dati.camera.it; testi e identificativi degli atti: Normattiva;
  - stime di costo ex ante: relazioni tecniche; consuntivi: INPS, Dipartimento Finanze, ENEA, Corte dei conti, UPB.
- **Motivo:** serie coerenti e citabili; ogni scostamento fra fonti si mostra come controllo, non come dato.
- **Conseguenze:** la tabella va mantenuta nel registro Fonti; FMI, AMECO, OCPI ed Eurostat servono solo per controlli automatici e link; il cambio di fonte di verità è una decisione nuova da registrare.
- **Data:** 2026-10-20

### D-002 — Normalizzazione di default: % del PIL nominale dello stesso anno
- **Stato:** PROPOSTA — da confermare con il titolare
- **Contesto:** confrontare importi dal 1946 a oggi richiede una normalizzazione. Gli euro costanti dipendono dall'indice scelto; il FOI misura i prezzi delle famiglie, non quelli dello Stato, e ISTAT pubblica i coefficienti "per sole finalità di analisi storica".
- **Opzioni:** A) % del PIL di default; B) euro costanti FOI di default; C) valori nominali di default.
- **Scelta:** A. Sempre visibili anche il valore originale (lire o euro) e gli euro nominali a 1936,27 lire per euro; euro costanti FOI e pro capite selezionabili; deflatore del PIL solo come opzione avanzata.
- **Motivo:** la % del PIL non dipende dall'indice dei prezzi e misura il peso sull'economia. Il raccordo NA150 → ISTAT 2026M9 (×1,005622) è piccolo e dichiarato.
- **Conseguenze:** le grandezze derivate si ricalcolano in build da serie versionate; disclaimer obbligatori in pagina; il raccordo si pubblica come colonna separata (condizioni Banca d'Italia).
- **Data:** 2026-10-20

### D-003 — Pipeline a snapshot immutabili e sito statico
- **Stato:** PROPOSTA — da confermare con il titolare
- **Contesto:** le fonti cambiano URL e nomi di file, rivedono i dati (edizioni ISTAT), sono a volte irraggiungibili (ISTAT, senato.it) o hanno API intermittenti (BDAP). Un sito che interroga le fonti dal vivo sarebbe fragile e non riproducibile.
- **Opzioni:** A) ingestione in snapshot immutabili (file grezzo + hash + data) e build statico Next.js; B) API live con cache; C) database aggiornato a mano.
- **Scelta:** A. Discovery dalle pagine indice, scaricamento con retry e backoff, catena di riserva (BDAP: dump con id del dataset → OData → dati.gov.it → manuale), validazione, normalizzazione in build, pubblicazione statica.
- **Motivo:** ogni numero è riproducibile e citabile con la sua versione; nessuna dipendenza a runtime dalle fonti; costi e superficie d'attacco bassi.
- **Conseguenze:** l'archivio grezzo sta fuori dal repo dell'app (il solo CSV Italia Domani pesa 111 MB); servono test di non regressione sui valori chiave; dove conservare l'archivio è OA-7.
- **Data:** 2026-10-20

### D-004 — Limite globale delle richieste per IP verso ogni fonte
- **Stato:** PROPOSTA — da confermare con il titolare
- **Contesto:** ISTAT ammette 5 richieste al minuto per IP e blocca per 1–2 giorni chi supera il limite; in questa ricerca due verificatori sono stati bloccati. L'FMI vieta lo scaricamento automatico massivo senza permesso.
- **Opzioni:** A) limitatore globale per fonte e per IP, condiviso fra tutti i job; B) limite per singolo script; C) nessun limite.
- **Scelta:** A. Per ISTAT al massimo 4 richieste al minuto, coda unica, nessun job parallelo; per le fonti con divieto di scaricamento massivo (FMI) nessun job automatico senza permesso.
- **Motivo:** un blocco ISTAT ferma l'aggiornamento di conti AP, PIL e popolazione per giorni.
- **Conseguenze:** l'ingestione è lenta ma prevedibile; il runner CI condiviso (IP variabili e condivisi) può non essere adatto; la scelta del runner è OA-8.
- **Data:** 2026-10-20

### D-005 — Archiviazione delle fonti: Wayback più hash
- **Stato:** PROPOSTA — da confermare con il titolare
- **Contesto:** le citazioni (programmi elettorali, dichiarazioni, note di terzi) devono restare verificabili anche se la pagina cambia o sparisce.
- **Opzioni:** A) SHA-256 del file scaricato più richiesta di snapshot Wayback (Save Page Now) e, se fallisce, archive.today; B) solo copia locale; C) solo link.
- **Scelta:** A. La copia locale resta privata quando la licenza non ne permette la ridistribuzione.
- **Motivo:** prova indipendente da terzi e controllo di integrità senza ridistribuire contenuti protetti.
- **Conseguenze:** ogni Snapshot ha `hash_sha256` e `url_wayback`; servono limiti di frequenza anche verso Internet Archive.
- **Data:** 2026-10-20

### D-006 — Nessun commento, sondaggio o classifica al lancio
- **Stato:** PROPOSTA — da confermare con il titolare
- **Contesto:** i commenti espongono a responsabilità per contenuti di terzi (Cass. 12546/2019, DSA) e richiedono moderazione; sondaggi e classifiche fra partiti rischiano di violare la par condicio (art. 8 L. 28/2000) e di far sembrare il progetto schierato.
- **Opzioni:** A) nessuna interazione pubblica, solo un modulo privato di segnalazione; B) commenti moderati; C) commenti e voti liberi.
- **Scelta:** A, con congelamento dei contenuti nuovi su promesse e partiti nei 15 giorni prima di ogni voto.
- **Motivo:** rischio legale e reputazionale minimo; coerente con EFCSN/IFCN.
- **Conseguenze:** analytics senza cookie; registro pubblico delle correzioni e diritto di replica; con il possibile voto anticipato ad aprile 2027 il calendario di congelamento va fissato quando il voto viene convocato.
- **Data:** 2026-10-20

### D-007 — Schema "Misura" multi-atto e multi-governo
- **Stato:** PROPOSTA — da confermare con il titolare
- **Contesto:** l'errore più frequente nelle verifiche è stato attribuire una misura o una legge a un solo governo (Superbonus tutto al Conte II, ICI tutta al Berlusconi IV, leggi di bilancio 1963-64 e 1970). In 14 esercizi il governo che propone la legge di bilancio non è quello che la promulga.
- **Opzioni:** A) Misura con più atti, ciascuno con governo, relazione e quota d'onere; B) un solo governo per Misura; C) nessuna attribuzione.
- **Scelta:** A. Tre relazioni legge–governo (proponente, approvazione, gestione), quota d'onere da relazione tecnica per ogni atto, costo dell'intero programma mai attribuito a una singola promessa, scostamento percentuale solo su basi omogenee.
- **Motivo:** attribuzione calcolata dagli atti e verificabile, non scritta a mano.
- **Conseguenze:** chiave del governo = URI Camera; la UI deve scegliere quale relazione mostrare di default (OA-9).
- **Data:** 2026-10-20

### D-008 — Licenza dei dati del progetto per dataset
- **Stato:** PROPOSTA — da confermare con il titolare (e con l'avvocato)
- **Contesto:** la nota legale proponeva CC BY 4.0 per tutti i dati, ma dati.camera.it e Wikipedia sono CC BY-SA 4.0 (share-alike), il Manifesto Project vieta la ridistribuzione senza permesso, la Banca d'Italia chiede di non modificare i dati, l'FMI richiede permesso per l'uso commerciale, la licenza BDAP è contraddittoria.
- **Opzioni:** A) licenza per dataset; B) CC BY-SA 4.0 per tutto; C) CC BY 4.0 per tutto, escludendo i dati share-alike.
- **Scelta:** A. CC BY 4.0 per i dataset nostri o derivati da fonti CC BY, IODL o CC0; CC BY-SA 4.0 per i dataset che incorporano dati Camera (governi, legislature, membri); niente ridistribuzione per Manifesto e FMI senza permesso; valori Banca d'Italia intatti, trasformazioni in colonne separate.
- **Motivo:** è l'unica opzione compatibile con tutte le fonti trovate; B obbligherebbe al share-alike anche dove non serve, C escluderebbe l'anagrafica dei governi.
- **Conseguenze:** `DATA_LICENSE` per dataset e file `ATTRIBUTIONS` generato dal registro Fonti; l'importazione si blocca se il permesso necessario manca. La licenza del codice è OA-4.
- **Data:** 2026-10-20

### D-009 — Copertura dell'MVP
- **Stato:** PROPOSTA — da confermare con il titolare
- **Contesto:** l'affidabilità dei dati varia molto per periodo: alta dal 2011, bassa o assente prima del 1965 per spesa, conti AP, promesse e costi.
- **Opzioni:** A) MVP 2011–oggi completo più serie lunghe dove sono affidabili; B) 1946–oggi da subito su tutto; C) solo il governo in carica.
- **Scelta:** A:
  - spesa dello Stato 2011–oggi (BDAP);
  - conti AP 1995–oggi (ISTAT);
  - debito e % del PIL dal 1946;
  - governi, legislature e leggi di bilancio 1946–oggi;
  - 10 misure di caso studio;
  - promesse 2018 e 2022, con solo lo stato di processo per il governo in carica.
- **Motivo:** si pubblica solo ciò che ha passato la doppia verifica; il resto entra per fasi (2013 e 1995–2010; 1965–1994; 1946–1964).
- **Conseguenze:** la pagina di metodo dichiara le lacune per periodo; l'MVP dipende dalle risposte di RGS (licenza BDAP) e Banca d'Italia, e dalla verifica ISTAT pendente.
- **Data:** 2026-10-20

### D-010 — Doppia verifica obbligatoria prima della pubblicazione
- **Stato:** PROPOSTA — da confermare con il titolare
- **Contesto:** la verifica a tre livelli ha trovato errori sostanziali anche dopo la prima stesura (attribuzioni di governo, cifre da stampa, finanziatori di terzi), e un errore del verificatore stesso (OCPI).
- **Opzioni:** A) ogni numero, attribuzione e citazione verificato da una seconda persona sulla fonte primaria, con regola di risoluzione dei disaccordi; B) verifica a campione; C) solo controlli automatici.
- **Scelta:** A, più controlli automatici sui CSV (chiavi, date nel mandato, somme, unità) e controllo di simmetria fra forze politiche.
- **Motivo:** per un sito sulla spesa pubblica e sulle promesse, un errore di attribuzione è anche un rischio di neutralità e di diffamazione.
- **Conseguenze:** stato di verifica per ogni record (V1, V2, NV, verificato da, data); niente pubblicazione da sola fonte secondaria.
- **Data:** 2026-10-20

### D-011 — Palette senza colori di partito
- **Stato:** APPLICATA nello sviluppo — da confermare con il titolare
- **Contesto:** in Italia rosso, blu, azzurro, verde, giallo, arancione-viola e tricolore sono associati a partiti o coalizioni. Un colore di accento può far sembrare il sito vicino a una parte.
- **Opzioni:** A) palette neutra carta/inchiostro con un solo accento; B) colori diversi per partito (come i siti di risultati elettorali); C) nessun colore.
- **Scelta:** A. Carta e inchiostro, accento arancione bruciato (#c2410c, tema scuro #fb923c) usato solo per azioni e stato "in verifica"; nessun colore associato a un partito nelle schede, nei grafici o nei badge. Livelli di verifica (grigio V1, ambra V2, rosso NV) distinti anche da etichetta testuale: descrivono solo lo stato del dato e valgono uguali per ogni partito.
- **Motivo:** nessun partito deve poter leggere un'affinità cromatica; il colore non deve trasmettere giudizi (niente rosso/verde per "male/bene").
- **Conseguenze:** i grafici per partito useranno una scala neutra di grigi con etichette dirette, non legende colorate; nuovi colori solo con voce in questo registro.
- **Data:** 2026-10-20

### D-012 — Gli atti parlamentari non sono promesse elettorali
- **Stato:** PROPOSTA — da confermare con il titolare (dalla verifica L2 del gruppo B, 2026-10-20)
- **Contesto:** 13 righe del gruppo B venivano dalla risoluzione unitaria 6-00294 (PD, M5S, AVS, IV, +Europa), che impegna il Governo in carica ed è stata preclusa senza voto il 13/10/2026. Lo stesso censimento escludeva per questo motivo altre proposte rivolte al Governo.
- **Scelta proposta:** risoluzioni, mozioni ed emendamenti, di maggioranza o di opposizione, vanno in una categoria a parte ("atto parlamentare"), collegabile ai partiti firmatari; diventano promesse solo se ripresi in un programma o in una dichiarazione per le politiche.
- **Da decidere insieme:** la regola gemella per le proposte dei partiti di maggioranza sulla legge di bilancio 2027 (gruppo A, campo `orizzonte` proposto). Le due regole vanno approvate insieme perché valgano uguali per maggioranza e opposizione.
- **Data:** 2026-10-20

### D-013 — Pubblicazione delle promesse tutta insieme, dopo il controllo di simmetria
- **Stato:** APPLICATA nello sviluppo — da confermare con il titolare
- **Scelta:** l'import valida e conta tutte le righe, ma pubblica solo i gruppi elencati in `PUBLISHED_PROMISE_GROUPS` (oggi nessuno). Un gruppo entra quando tutti e tre hanno passato la verifica L2 e il controllo di simmetria. Restano fuori le righe "DA RIMUOVERE", "NON VERIFICABILE", "NUOVA" e quelle "con riserva" (per esempio il discorso di Schlein del 18/10, da confrontare con il video).
- **Motivo:** pubblicare un partito prima degli altri, o con standard diversi, sarebbe di per sé una scelta di parte.
- **Data:** 2026-10-20

## Decisioni aperte
- **OA-1** — ~~Nome del progetto e dominio~~ → nome deciso il 2026-10-20: **Paghi Tu** (provocatorio verso politica e cittadini, senza attribuire condotte a nessuno). Dominio candidato `paghitu.it` (libero al controllo DNS del 2026-10-20, da confermare all'acquisto).
- **OA-2** — Editore: il titolare del progetto, persona fisica. **Decisione del titolare (2026-10-20): nome e dati personali NON pubblicati sul sito**; il sito si presenta come "Paghi Tu" con un recapito dedicato (email del progetto). Da validare con l'avvocato prima del lancio: (a) se art. 2 L. 47/1948 (richiamato da art. 1 c. 3 L. 62/2001) e art. 7 D.Lgs. 70/2003 impongono l'indicazione dell'editore a un sito non periodico e non commerciale; (b) identità del titolare del trattamento richiesta dall'art. 13 GDPR se il sito tratta dati dei visitatori (log, analytics, form) — si minimizza con zero cookie, zero analytics con IP, nessun form; (c) alternativa: associazione (es. APS/ETS) come editore, così sul sito compare l'ente e non la persona; (d) responsabilità personale e polizza RC. L'anonimato verso il pubblico non elimina la responsabilità: l'editore resta identificabile da hosting e registro del dominio.
- **OA-3** — Finanziamento: fonti ammesse, soglia di pubblicazione dei finanziatori (proposta 5%), esclusioni (partiti, candidati, soggetti collegati).
- **OA-4** — ~~Licenza del codice~~ → decisa il 2026-10-20: **MIT** (file `LICENSE`, `package.json`). Resta da confermare la licenza per dataset di D-008.
- **OA-11** — Promesse della campagna per le prossime politiche: decise il 2026-10-20 nel perimetro MVP, con aggiornamento continuo (vedi D-009 e nota `research/2026-10-20.campagna-elettorale-in-corso.md`).
- **OA-5** — Perimetro dell'MVP: confermare D-009 o ridurlo (per esempio senza promesse al lancio).
- **OA-6** — Registrare o no una testata: non obbligatorio senza richiesta di provvidenze (D.Lgs. 70/2003 art. 7 c. 3), ma da decidere con l'avvocato se il sito pubblicherà articoli o newsletter a cadenza regolare.
- **OA-7** — Dove conservare l'archivio grezzo degli snapshot (storage a oggetti, repository dati separato con Git LFS o DVC) e chi lo paga.
- **OA-8** — Runner per l'ingestione: self-hosted con IP fisso o CI condiviso, visto il limite per IP di ISTAT.
- **OA-9** — Quale relazione legge–governo mostrare di default nelle pagine (proponente, approvazione o gestione).
- **OA-10** — Se chiedere il permesso al Manifesto Project, all'FMI e all'OCPI, o limitarsi ai link; se usare un browser headless (Playwright) per Elezioni trasparenti e senato.it.
