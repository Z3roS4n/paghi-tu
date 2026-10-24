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
- **Stato:** IN PARTE SUPERATA da D-015 (scelta S1 del titolare, 2026-10-21). Gli atti parlamentari con contenuto di policy, di maggioranza e di opposizione, restano nel catalogo con l'etichetta di veicolo e orizzonte. Resta applicata a tutti i gruppi, da confermare, la regola di perimetro qui sotto (atti procedurali, impegni non di policy, doppioni, testi fuori periodo).
- **Contesto:** 13 righe del gruppo B venivano dalla risoluzione unitaria 6-00294 (PD, M5S, AVS, IV, +Europa), che impegna il Governo in carica ed è stata preclusa senza voto il 13/10/2026. Lo stesso censimento escludeva per questo motivo altre proposte rivolte al Governo.
- **Scelta proposta:** risoluzioni, mozioni ed emendamenti, di maggioranza o di opposizione, vanno in una categoria a parte ("atto parlamentare"), collegabile ai partiti firmatari; diventano promesse solo se ripresi in un programma o in una dichiarazione per le politiche.
- **Da decidere insieme:** la regola gemella per le proposte dei partiti di maggioranza sulla legge di bilancio 2027 (gruppo A, campo `orizzonte` proposto). Le due regole vanno approvate insieme perché valgano uguali per maggioranza e opposizione.
- **Regola di perimetro applicata dalla verifica L2 del gruppo C (2026-10-21), da estendere a tutti i gruppi:**
  - restano le richieste al governo in carica solo se hanno un contenuto di policy, presentato dal partito come proposta propria;
  - escono gli atti procedurali (per esempio "portare in Parlamento il ddl X"), gli impegni non di policy (candidature, liste, alleanze, ruoli personali), gli atti personali nella legislatura in corso, gli appelli con raccolta firme limitati alla legislatura in corso e i doppioni;
  - escono i testi ripubblicati nel periodo ma scritti prima (data della prima pubblicazione fuori periodo).
- **Data:** 2026-10-20

### D-013 — Pubblicazione delle promesse tutta insieme, dopo il controllo di simmetria
- **Stato:** APPLICATA nello sviluppo — da confermare con il titolare
- **Scelta:** l'import valida e conta tutte le righe, ma pubblica solo i gruppi elencati in `PUBLISHED_PROMISE_GROUPS` (oggi nessuno). Un gruppo entra quando tutti e tre hanno passato la verifica L2 e il controllo di simmetria. Restano fuori le righe "DA RIMUOVERE", "NON VERIFICABILE", "NUOVA" e quelle "con riserva" (per esempio il discorso di Schlein del 18/10, da confrontare con il video).
- **Motivo:** pubblicare un partito prima degli altri, o con standard diversi, sarebbe di per sé una scelta di parte.
- **Data:** 2026-10-20
- **Modifica del 2026-10-22 (titolare):** le esecuzioni del 21 e 22 ottobre si sono fermate perché alcuni siti
  rispondono con un blocco anti-bot e due formazioni non hanno un canale ufficiale leggibile. Da ora un partito
  **tecnicamente** non leggibile, dopo i canali alternativi del runbook, non blocca gli altri: si pubblicano i partiti
  controllati e /promesse dice quali canali non si leggono e da quando (`data/canali-non-leggibili.json`). Dopo 3
  esecuzioni di fila la segnalazione chiede un controllo a mano. Un partito saltato per errore blocca ancora tutti.
  Le protezioni anti-bot non si aggirano.

### D-014 — Lo scostamento si mostra solo con omogeneità dichiarata
- **Stato:** APPLICATA nello sviluppo — da confermare con il titolare (proposta della nota `research/2026-10-20.costo-delle-misure-previsto-vs-consuntivo.md`)
- **Scelta:** ogni confronto previsto/consuntivo ha `omogeneita` (omogeneo, parzialmente omogeneo, non omogeneo), `confidenza` A–D e `tipoOnere` (stima o tetto), assegnati nell'import (`COMPARISONS` in `scripts/data/import-research.ts`) dalle note di metodo verificate. Lo scostamento è sempre calcolato (consuntivo meno previsto), mai inserito a mano; con basi non omogenee non si calcola. Si dichiara se l'ha calcolato la fonte (oggi solo UPB su Quota 100 2019-21) o Paghi Tu.
- **Motivo:** senza questa regola il sito suggerirebbe "risparmi" o "sforamenti" impropri (tetti di spesa RdC e ADI; Superbonus con onere potenziale ENEA contro effetti sui saldi).
- **Data:** 2026-10-21

### D-015 — Orizzonte e veicolo come colonne, non come cancellazioni
- **Stato:** DECISA dal titolare il 2026-10-21: scenario **S1**. Il catalogo contiene tutte le righe valide, con `orizzonte` e `veicolo` mostrati su ogni promessa; nessun registro separato. Nell'import: `PROMISE_SCOPE_RULE = "tutte"` (controllo di simmetria, `research/2026-10-21.controllo-simmetria-promesse.md`).
- **Contesto:** R-ORIZZONTE (gruppo A) e D-012 (gruppi B e C) toglievano dal catalogo, con formulazioni diverse, le proposte legate alla legislatura in corso. A ne marcava 40 righe, B le 13 della risoluzione CSX, C ne teneva alcune.
- **Scelta proposta:**
  - ogni riga dei tre CSV ha `orizzonte` (prossima_legislatura, legislatura_in_corso, non_specificato) e `veicolo` (10 valori), assegnati dal testo con gli stessi criteri per tutti;
  - nei casi dubbi vale `non_specificato`, con la motivazione in nota;
  - lo stato_verifica non decide più il perimetro («PERIMETRO: orizzonte/veicolo (vedi colonne)»);
  - il titolare sceglie fra S1 (tutte le righe valide, 206) e S2 (fuori legislatura_in_corso, 137), oppure una variante (fuori risoluzioni ed emendamenti, 189).
- **Conseguenze:** l'import oggi conta S1. Quando la scelta sarà fatta, il filtro va applicato in `scripts/data/import-research.ts`, insieme a D-012 e R-ORIZZONTE.
- **Data:** 2026-10-21

### D-016 — Conti pubblici da Eurostat e Banca d'Italia, con controlli incrociati automatici
- **Stato:** applicata il 2026-10-21 (pagina `/spesa`, home, conti per governo).
- **Contesto:** il sito deve rispondere a «quanto spendiamo», con numeri che una routine possa aggiornare da sola.
- **Scelta:**
  - spesa, entrate, saldo e interessi delle amministrazioni pubbliche (S13) da Eurostat `gov_10a_main`, spesa per funzione da `gov_10a_exp` (COFOG), debito/PIL da `gov_10dd_edpt1`; debito lordo mensile dal 1861 da Banca d'Italia, tavola TCCE0325;
  - unità `MIO_NAC` e non `MIO_EUR` (prima del 1999 `MIO_EUR` usa i cambi ECU dell'anno: vedi `07-bad-practices.md`);
  - le cifre per residente dividono per la popolazione media dell'anno (media fra due 1° gennaio); sono medie, e la pagina lo dice;
  - copie grezze in `data/raw/` con manifest (URL, data, sha256); `build-public-finance.ts` fa 5 controlli incrociati (somma COFOG, spesa nelle due tavole, identità del saldo, debito Banca d'Italia contro Eurostat, % PIL contro PIL ISTAT) e si ferma se uno fallisce;
  - livello V1: fonte primaria più controlli fra fonti indipendenti; in più una verifica L2 a campione (`research/2026-10-21.verifica-l2-finanza-pubblica.md`);
  - prima del 1995 il debito/PIL è un nostro calcolo (debito di dicembre / PIL della serie) ed è etichettato così.
  - il flag Eurostat «b» (rottura di serie, oggi nel 2010 per la revisione ISTAT 2026) si salva per anno e la pagina lo segnala; il debito dei mesi dopo l'ultimo dicembre notificato è «dato provvisorio».
  - verifica L2 del 2026-10-21: tutti i numeri confermati su JSON-stat e sul PDF Banca d'Italia del 15/10/2026; corretti 7 testi (perimetro, rapporto col PIL, disavanzo, etichetta pensioni).
- **Conseguenze:** nessun numero di spesa scritto a mano nelle pagine; il debito per governo usa l'ultima fine mese prima dell'insediamento e l'ultima prima della chiusura (nessun mese contato due volte), con l'avvertenza che non attribuisce cause.
- **Data:** 2026-10-21

### D-017 — Archivio con ricerca su indice statico
- **Stato:** applicata il 2026-10-21 (`/archivio`).
- **Scelta:** un indice JSON (`/archivio/indice.json`) prerenderizzato in build da tutti i dataset; la ricerca gira nel browser (parole tutte presenti, senza accenti, più recenti prima), con filtri per tipo e partito e la ricerca nell'URL. Nessun servizio di ricerca esterno, nessun dato dell'utente salvato.
- **Conseguenze:** l'indice si rigenera a ogni build, quindi ogni aggiornamento della routine lo aggiorna da solo. Se l'indice supera qualche MB si passa a un indice per tipo o a una libreria di ricerca full-text.
- **Data:** 2026-10-21

### D-018 — Routine su cloud per l'aggiornamento automatico
- **Stato:** decisa dal titolare il 2026-10-21; routine creata il 2026-10-21 e **spenta** finché non c'è il suo ambiente cloud con i segreti.
- **Contesto:** il titolare vuole una routine su cloud che aggiorni dati e fonti in autonomia, con agenti verificatori.
- **Decisioni del titolare (2026-10-21):** esecuzione **ogni giorno**; modifiche **pubblicate subito, ma solo dopo la conferma di un secondo agente AI** che non le ha scritte e le ricontrolla sulle fonti (`CONFERMATO` / `RESPINTO`), senza PR da approvare a mano; **segnalazioni via email con Resend** (`scripts/notify.ts`, scheda `integrations/resend.md`), con destinatario, mittente e chiave solo nei segreti della routine perché il repo è pubblico.
- **Scelta:** due binari, perché hanno rischi diversi.
  1. **Dati numerici da API ufficiali** (Eurostat, Banca d'Italia; poi RGS e ISTAT): `npm run data:update`, test, build. Se tutti i controlli incrociati passano, commit e deploy in automatico; se un controllo fallisce, niente pubblicazione e una segnalazione.
  2. **Contenuti editoriali** (promesse, misure, governi): agenti di ricerca → verificatore L2 indipendente → controllo di simmetria fra partiti → import. Va online solo ciò che passa tutti i cancelli, tutti i partiti insieme (D-013); ogni modifica resta nel registro delle correzioni.
  - Vincoli fissi: un solo processo che interroga ISTAT; niente Save Page Now o scritture su servizi esterni oltre al repo, a Vercel e a Resend; niente aggiramento di blocchi; **nei 15 giorni prima di un voto la routine non pubblica contenuti nuovi su partiti e promesse** (regola in `/metodo`).
- **Runbook:** `.claude/routines/aggiornamento-dati.md` (istruzioni passo per passo per l'agente schedulato).
- **Attivazione (2026-10-21):**
  - il titolare ha scelto di far girare la routine **sull'account di sviluppo**, non su un account separato;
  - ogni giorno alle 06:00 UTC (07:00 con l'ora solare, 08:00 con l'ora legale), modello Opus 5.5, nessun connettore: solo il repo, la shell, la ricerca web e i subagenti per il verificatore;
  - ambiente cloud dedicato, perché i segreti di un ambiente sono visibili a ogni sessione che lo usa; serve accesso di rete completo (Eurostat, Banca d'Italia, ISTAT, Resend, Vercel);
  - il deploy usa `VERCEL_TOKEN` con `VERCEL_ORG_ID` e `VERCEL_PROJECT_ID`, perché sul cloud non c'è il login della CLI. **Aggiornamento 2026-10-24:** il repo è collegato a Vercel e ogni push su `main` va in produzione da solo; la routine aspetta il deploy del commit e usa il token solo di riserva;
  - `npm run check:pages` controlla il testo visibile delle pagine generate: nessun «NaN», «undefined», «Infinity», nessuna nota interna fuori dai pannelli chiusi.
- **Data:** 2026-10-21

### D-019 — Decisioni del titolare su promesse, archivi e debito per governo
- **Stato:** applicata il 2026-10-21, salvo dove indicato.
- **Scelte:**
  - **Interviste pubblicate da una testata = fonte primaria (V1)**, se la citazione è verificata sul testo. Applicata in `import-research.ts` (`interviewAsPrimary`). Restano V2 `C27-NM-012` (ruolo di partito preso da fonti secondarie) e `C27-FI-009` (pagina originale letta solo nella copia Wayback). Discorsi riportati e video restano V2: la decisione riguarda le interviste. Vale anche il testo integrale ripubblicato su un canale del dichiarante (esteri.it, sito del partito o personale). Il verificatore ha trovato `C27-FI-013` classificata per errore come intervista (è una dichiarazione alla Camera riportata da HDmotori): corretta in «discorso», resta V2. Promosse 23 righe.
  - **Nessun tetto di righe per partito:** ogni misura di un pacchetto è una riga (Azione 40, +Europa 18 restano così). Il numero di righe non misura quanto propone un partito, e la pagina lo dice.
  - **C27-LEGA-024:** il titolare non ha una preferenza. Scelta di Paghi Tu: reintegrare l'inciso «(in particolare stranieri o di seconda generazione)» e tagliare invece l'attacco «Poi,» e l'esempio finale. Regola generale: un taglio «[…]» non toglie mai le parole con cui il proponente descrive un gruppo di persone, perché la dichiarazione risulterebbe diversa da come è stata fatta.
  - **Ogni fonte deve avere una copia d'archivio.** `scripts/data/archive-sources.ts` cerca le copie Wayback esistenti (sola lettura); con `--save` chiederebbe catture nuove (scheda `integrations/internet-archive.md`). Al 2026-10-21: 6 copie esistenti trovate e salvate; le catture nuove restano escluse finché il titolare non autorizza in modo esplicito le scritture verso Internet Archive.
  - **Spesa 1946–1994:** si usa la fonte più attendibile (nota `research/2026-10-21.fonte-spesa-1946-1994.md`, DI-01). Proposta:
    - 1980–1994: ISTAT, *L'Italia in 150 anni*, tavola 12.17 (amministrazioni pubbliche, SEC95, CC BY 4.0), con rottura di serie dichiarata sul 1995 (scarto con Eurostat sulla spesa +2%); le % del PIL dalla tavola 12.19 della stessa edizione.
    - 1946–1979: nessuna serie ufficiale digitale per le amministrazioni pubbliche. Opzione: FMI *Public Finances in Modern History*, solo in % del PIL e come serie separata (richiede attribuzione e, per l'uso commerciale, un permesso).
    - Da fare prima di implementare: riscaricare e verificare la tavola ISTAT quando il sito non risponde più 403.
  - **Debito nell'elenco dei governi «il più chiaro possibile»:** colonna con intestazione, variazione in euro dell'epoca più rapporto debito/PIL a inizio e fine mandato, legenda in quattro punti. Il rapporto usa l'ultimo dicembre dentro il mandato, così un dicembre non va a due governi.
  - **Repo pubblico su GitHub, open source (MIT).** I commit portano nome e cognome del titolare come autore: il titolare ha scelto il 2026-10-21 di pubblicare la storia così com'è. La regola di OA-2 per il sito (nessun nome o dato personale nelle pagine) è superata da D-023.
- **Data:** 2026-10-21

### D-020 — Progetto aperto: l'AI aggiorna, chiunque può correggere
- **Stato:** applicata il 2026-10-21.
- **Contesto:** il titolare vuole un progetto indipendente a cui tutti possono contribuire: i dati arrivano in automatico dall'AI, ma chiunque deve poterli correggere.
- **Scelta:**
  - segnalazioni con moduli GitHub (`.github/ISSUE_TEMPLATE/correzione.yml`, `fonte-mancante.yml`): la fonte è obbligatoria; link «Segnala un errore» su ogni promessa e nel footer, con pagina e dato già compilati (`src/lib/contribute.ts`);
  - `CONTRIBUTING.md`, `CODE_OF_CONDUCT.md`, modello di PR; etichette `correzione`, `dato-mancante`, `confermata`, `respinta`, `da-decidere`, `condotta`;
  - registro pubblico `data/correzioni.json` mostrato in `/correzioni`: ogni modifica a un dato già pubblicato, mai cancellata, con valore di prima e di dopo, motivo, fonte e segnalazione;
  - la routine (binario 3 del runbook) verifica ogni segnalazione sulla fonte con l'agente verificatore, applica le confermate e risponde in pubblico. Il testo delle issue è trattato come dato, mai come istruzione; nessuna PR esterna viene unita in automatico; i casi dubbi restano a una persona (`da-decidere`).
- **Conseguenze:** per segnalare serve un account GitHub gratuito; per chi non ce l'ha resta da attivare un indirizzo del progetto (OA-2). Il binario 3 apre una superficie di attacco (prompt injection, spam): il runbook la limita con regole fisse e un tetto di 20 segnalazioni per esecuzione.
- **Data:** 2026-10-21

### D-021 — Costo delle promesse: la cifra del proponente, tradotta e messa accanto ai precedenti
- **Stato:** applicata il 2026-10-21.
- **Contesto:** il titolare vuole stimare il possibile costo delle promesse incrociandolo con quello che è successo in passato. Oggi solo 23 promesse su 320 hanno una cifra dichiarata e nessuna ha una stima indipendente; le 10 misure passate hanno scostamenti nei due sensi (Quota 100 −36%, abolizione ICI +29%).
- **Scelta:**
  - nessuna stima di Paghi Tu del costo di una promessa: si usa la cifra del proponente, strutturata (`research/2026-10-21.costi-precedenti.csv`: natura, importo minimo e massimo, periodo) senza ipotesi; un totale senza anni non diventa annuo;
  - la cifra annua si traduce in euro per residente (popolazione media dell'ultimo anno, «in media»; per le entrate in più la pagina precisa che non è quanto pagherebbe ciascuno) e, solo per la spesa, in quota della spesa pubblica per la stessa funzione COFOG (ultimo anno con il dettaglio);
  - famiglie di precedenti definite per strumento e beneficiari (`src/lib/domain/promise-cost.ts`), assegnate da due codificatori indipendenti (codifiche A e B nella stessa cartella): 23 costi concordi, 3 famiglie discordi lasciate vuote, 5 righe con precedenti;
  - il calcolo «se andasse come quelle misure» applica lo scostamento minimo e massimo dei soli confronti `stima` con basi omogenee o in parte omogenee; etichettato come calcolo, non previsione;
  - nessuna somma dei costi per partito.
- **Conseguenze:** la sezione cresce con le stime indipendenti (UPB, Osservatorio CPI) e con nuove misure in `/misure`; la routine deve codificare due volte le righe nuove con lo stesso schema.
- **Data:** 2026-10-21

### D-022 — Dati 2026: trimestri Eurostat e confronto con l'Europa
- **Stato:** applicata il 2026-10-21 (home, `/spesa`).
- **Contesto:** il proprietario chiedeva dati più recenti del 2024. La spesa per funzione 2025 esce solo a febbraio; i conti annuali arrivano al 2025.
- **Scelta:**
  - trimestri non destagionalizzati da `gov_10q_ggnfa` (dal 2019): si confronta solo un periodo con lo stesso periodo dell'anno prima, perché la spesa si concentra a fine anno; la home mostra il primo semestre 2026 contro il primo semestre 2025;
  - debito mensile Banca d'Italia fino all'ultimo mese, con «dato provvisorio» dopo l'ultimo dicembre notificato;
  - confronto con Germania, Francia, Spagna e media UE solo in % del PIL, sull'ultimo anno in cui tutti i paesi hanno il dato;
  - due controlli in più nella pipeline: i quattro trimestri sommano all'anno (tolleranza 0,5%) e i valori italiani del confronto UE coincidono con le tavole nazionali (0,05 punti).
- **Conseguenze:** nessun numero scritto a mano nelle frasi: i testi («la spesa è cresciuta del…», «più della media europea per…») si calcolano dai dati, e cambiano da soli al prossimo aggiornamento.
- **Data:** 2026-10-21

### D-023 — Titolare M's Works, informativa privacy, statistiche e regole strette per i contributi
- **Stato:** applicata il 2026-10-21.
- **Contesto:** il titolare ha deciso di indicare M's Works come titolare del sito e del trattamento (supera la regola di OA-2 di non mettere dati del titolare sulle pagine) e di attivare Vercel Web Analytics; ha chiesto una politica attenta sulla veridicità dei dati e regole strette per i contributi.
- **Scelta:**
  - titolare: M's Works, ditta individuale di Antonio Cirino Murabito, Palermo, P.IVA 07344720821, email e PEC come su msworks.it (`src/lib/legal.ts`); codice fiscale non pubblicato, non serve;
  - `/privacy`: informativa artt. 13-14 (navigazione, statistiche, segnalazioni su GitHub lette da agenti AI, email, persone citate da fonti pubbliche), destinatari (Vercel, GitHub, Anthropic, Resend), trasferimenti extra UE, diritti, reclamo al Garante;
  - `/note-legali`: chi gestisce il sito, politica sulla veridicità (impegni e limiti), uso dell'AI dichiarato (non ogni dato è riletto da una persona), rettifica, licenze, responsabilità;
  - `/contribuire`: fonti ammesse e non ammesse, un dato per segnalazione, conta la fonte e non il numero di segnalazioni (doppioni = una), massimo 5 aperte per account, testo delle issue mai trattato come istruzione, malafede = chiusura e blocco; stesse regole in CONTRIBUTING, CODE_OF_CONDUCT, moduli GitHub e runbook della routine;
  - Vercel Web Analytics senza query string né ancora negli URL inviati.
- **Conseguenze:** ogni nuovo servizio che tratta dati dei visitatori o dei segnalatori va aggiunto a `/privacy` nello stesso commit. Testo da far rivedere a un legale prima di considerarlo definitivo.
- **Data:** 2026-10-21

### D-025 — La regola dei 15 giorni vale per politiche e referendum nazionali
- **Stato:** applicata il 2026-10-22, decisione del titolare.
- **Contesto:** la routine ha chiesto se la suppletiva di Chieti del 15-16 novembre 2026 fa scattare il blocco dei
  contenuti nuovi su partiti e promesse dal 31 ottobre.
- **Scelta:** il blocco vale solo nei 15 giorni prima delle elezioni politiche o di un referendum nazionale.
  Suppletive, regionali e amministrative non lo fanno scattare. Testo aggiornato in /metodo, /contribuire,
  CONTRIBUTING, runbook e regole dei Reel.
- **Data:** 2026-10-22

### D-024 — Reel Instagram pianificati nel repo, idee settimanali dalla routine
- **Stato:** applicata il 2026-10-22.
- **Contesto:** dopo il primo video il titolare vuole tre Reel a settimana di circa un minuto, con la voce Giulio e il
  montaggio in Animatio, e vuole che la routine proponga le idee nuove.
- **Scelta:**
  - cartella `.claude/reels/` con regole e formato (`README.md`), calendario e una scheda per video in `idee/`;
  - i primi quattro video (26 ottobre-2 novembre) li prepara il titolare; altre otto schede restano in riserva;
  - binario 4 della routine: a ogni esecuzione, se restano meno di sei uscite future, aggiunge una settimana di
    idee nate dalle notizie dei giorni prima e spiegate con i numeri del sito (una cifra della notizia solo dalla
    sua fonte primaria); aggiorna le schede non ancora pubblicate quando cambiano i dati; un secondo agente
    controlla le cifre;
  - tono: una domanda per video, ogni cifra spiegata, un fatto che sorprende, voce da racconto (README dei Reel);
  - stesse regole del sito: nessun partito o governo nominato fuori dai video sul metodo, nessun giudizio, niente
    video su partiti e promesse nei 15 giorni prima di un voto.
- **Conseguenze:** il repo è pubblico, quindi anche il piano dei video lo è. Le schede servono da copione, ma il
  giorno del montaggio le cifre vanno ricontrollate sul sito.
- **Data:** 2026-10-22

### D-026 — Golden set dell'agente generato dai dati
- **Stato:** proposta il 2026-10-23, in revisione.
- **Contesto:** l'agente conversazionale su Vertex AI Search va misurato prima di andare online. Il progetto non ha un golden set; i dati del sito sono la fonte del grounding.
- **Scelta:** il set si genera da `data/` con `agent/evals/golden-set.ts` (selezione deterministica e distribuita, valori letti dai record, mai ricopiati), più casi scritti a mano in `casi-manuali.json` per par condicio, fuori scope e trappole. Le promesse si scelgono in ordine alfabetico di sigla, almeno una per partito. La revisione del titolare sta in `revisione.json` e sopravvive alle rigenerazioni.
- **Conseguenze:** dopo una correzione ai dati si rigenera con `npm run evals:build`; il test fallisce se `domande.jsonl` non è allineato. Le soglie restano ipotesi finché il titolare non le conferma.
- **Data:** 2026-10-23

### D-027 — Le pull request le verifica una routine a parte, e le unisce il titolare
- **Stato:** applicata il 2026-10-23, su richiesta del titolare.
- **Contesto:** arrivano le prime PR di un collaboratore, con codice e correzioni ai dati. Il binario 3 della routine dei dati le trattava come segnalazioni e riapplicava i dati confermati con un suo commit (D-020), ma non controllava il codice, i conflitti o i file generati.
- **Scelta:** una routine cloud separata (`.claude/routines/verifica-pr.md`, ogni giorno alle 07:00 UTC, dopo quella dei dati) controlla ogni PR aperta su `main`: unione con main e numerazione di decisioni e correzioni, typecheck, lint, test, build e controllo delle pagine, file generati riprodotti dai loro script, regole del progetto e ambito. Ogni correzione ai dati passa due controlli fatti da due agenti diversi: una verifica sulla fonte primaria, poi un tentativo di smentirla che non vede l'esito del primo. È vera solo se la verifica la conferma e il tentativo di smentita fallisce. Una correzione senza fonte, con una fonte non ammessa o fatta senza criterio si respinge subito. Le decisioni del titolare scritte sulla PR (marcatore `<!-- decisione-titolare -->`) non si riaprono. Due frasi separate solo da un inciso di chi scrive («ha spiegato») si uniscono con «[…]» (decisioni del titolare del 2026-10-24, nate dalla PR #2). Scrive l'esito sulla PR (RESPINTA, SERVE UNA DECISIONE DEL TITOLARE, DA SISTEMARE, PRONTA), ne aggiorna l'etichetta, chiude le respinte, tiene allineate le issue collegate (etichetta `in-pr`, che la routine dei dati salta) e manda il riepilogo al titolare. Non unisce e non approva. Il codice della PR gira solo se l'autore ha permesso di scrittura sul repo, senza segreti e senza script di installazione. La routine dei dati non tocca più le PR.
- **Conseguenze:** le correzioni proposte con una PR arrivano sul sito quando il titolare la unisce, non più con un commit della routine. I commenti sono pubblici e partono dall'account del token.
- **Data:** 2026-10-23

### D-028 — Verifica deterministica del golden set contro le fonti
- **Stato:** proposta il 2026-10-23, in revisione.
- **Contesto:** un controllo a mano sulle fonti del golden set ha trovato errori che i test non vedevano (percentuali arrotondate, record citati a metà, un URL con l'etichetta dentro, una citazione che unisce due frasi). Per un agente su dati politici l'errore non è ammesso: la verifica deve essere ripetibile e decisa dal codice.
- **Scelta:** due livelli. `npm run evals:verify` (`agent/evals/verifica-fonti.ts`) va in rete con la coda per host di D-004, legge ogni URL atteso (HTML, PDF con `pdftotext`, copia d'archivio del record se la fonte è chiusa) e scrive i fatti in `verifica-fonti.json`, che si committa. I test offline (`verifica.test.ts`, `testo.test.ts`) decidono: ogni fonte letta, ogni citazione trovata parola per parola, ogni valore trovato nella fonte o nelle copie di `data/raw/` cella per cella, oppure con una ragione scritta in `eccezioni-fonti.json`. Le somme calcolate da Paghi Tu si dichiarano con gli addendi, che devono stare nella fonte e tornare al valore. Un'eccezione non più necessaria fa fallire il test.
- **Motivo:** la rete non è deterministica, il registro sì: lo stesso registro dà sempre lo stesso esito, e chi rilegge vede cosa è stato trovato, dove e in che forma. Le forme accettate sono strette (niente miliardi arrotondati senza la parola, niente cognome da solo per un nome di più di due parole) perché un falso riscontro è peggio di un valore non trovato.
- **Conseguenze:** dopo ogni `evals:build` che cambia `domande.jsonl` si rilancia `evals:verify` (il test confronta l'impronta). Il registro non scade da solo: la data è nel file e va riletta prima di ogni eval dell'agente.
- **Data:** 2026-10-23

## Decisioni aperte
- **OA-1** — ~~Nome del progetto e dominio~~ → nome deciso il 2026-10-20: **Paghi Tu** (provocatorio verso politica e cittadini, senza attribuire condotte a nessuno). Dominio candidato `paghitu.it` (libero al controllo DNS del 2026-10-20, da confermare all'acquisto).
- **OA-2** — **SUPERATA da D-023 (2026-10-21): titolare M's Works, indicato in /privacy e /note-legali.** Testo originale: Editore: il titolare del progetto, persona fisica. **Decisione del titolare (2026-10-20): nome e dati personali NON pubblicati sul sito**; il sito si presenta come "Paghi Tu" con un recapito dedicato (email del progetto). Da validare con l'avvocato prima del lancio: (a) se art. 2 L. 47/1948 (richiamato da art. 1 c. 3 L. 62/2001) e art. 7 D.Lgs. 70/2003 impongono l'indicazione dell'editore a un sito non periodico e non commerciale; (b) identità del titolare del trattamento richiesta dall'art. 13 GDPR se il sito tratta dati dei visitatori (log, analytics, form) — si minimizza con zero cookie, zero analytics con IP, nessun form; (c) alternativa: associazione (es. APS/ETS) come editore, così sul sito compare l'ente e non la persona; (d) responsabilità personale e polizza RC. L'anonimato verso il pubblico non elimina la responsabilità: l'editore resta identificabile da hosting e registro del dominio.
- **OA-3** — Finanziamento: fonti ammesse, soglia di pubblicazione dei finanziatori (proposta 5%), esclusioni (partiti, candidati, soggetti collegati).
- **OA-4** — ~~Licenza del codice~~ → decisa il 2026-10-20: **MIT** (file `LICENSE`, `package.json`). Resta da confermare la licenza per dataset di D-008.
- **OA-11** — Promesse della campagna per le prossime politiche: decise il 2026-10-20 nel perimetro MVP, con aggiornamento continuo (vedi D-009 e nota `research/2026-10-20.campagna-elettorale-in-corso.md`).
- **OA-5** — Perimetro dell'MVP: confermare D-009 o ridurlo (per esempio senza promesse al lancio).
- **OA-6** — Registrare o no una testata: non obbligatorio senza richiesta di provvidenze (D.Lgs. 70/2003 art. 7 c. 3), ma da decidere con l'avvocato se il sito pubblicherà articoli o newsletter a cadenza regolare.
- **OA-7** — Dove conservare l'archivio grezzo degli snapshot (storage a oggetti, repository dati separato con Git LFS o DVC) e chi lo paga.
- **OA-8** — Runner per l'ingestione: self-hosted con IP fisso o CI condiviso, visto il limite per IP di ISTAT.
- **OA-9** — Quale relazione legge–governo mostrare di default nelle pagine (proponente, approvazione o gestione).
- **OA-10** — Se chiedere il permesso al Manifesto Project, all'FMI e all'OCPI, o limitarsi ai link; se usare un browser headless (Playwright) per Elezioni trasparenti e senato.it.
