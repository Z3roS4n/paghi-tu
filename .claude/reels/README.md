# Reel di Paghi Tu

Idee e copioni per i Reel Instagram. Le schede le scrivono il titolare, le sessioni di Claude Code e la routine
giornaliera (passo «Idee per i Reel» in `.claude/routines/aggiornamento-dati.md`). Il primo video, già uscito,
è il racconto completo del sito («Il conto lo paghi tu», 50 s).

## Cartella
- `calendario.md`: cosa esce e quando, con lo stato di ogni video.
- `idee/RNN-titolo.md`: una scheda per video. Numerazione progressiva, mai riusata.
- `prompt/RNN-titolo.md`: il prompt completo da dare ad Animatio (progetti in `C:\Users\thepr\ms-motion`, brand
  `paghi-tu`), scritto quando un video passa a `in lavorazione`.

## Come lavora Animatio (dal primo video)
- Voce Giulio letta in un passaggio unico, senza tag di emozione (i tag `[pausa]` diventano silenzi di 2 s), poi
  tagliata per scena sulle pause. Giulio legge lento: circa 120-130 parole fanno 60-70 secondi.
- **Voce parlata, schermo esatto:** a schermo «19.633 €» con la fonte; a voce la cifra chiave intera, le altre arrotondate (vedi sotto).
  Una persona non legge le slide.
- Le grafiche si agganciano alla parola della trascrizione che le nomina.
- Componenti del brand già pronti: `scontrino` e `cento-quadretti`; il timbro «TU» va salvato come `timbro`.
- Immagini: `immagine_genera` (gemini-3-pro-image) con lo stile comune dei prompt, poi bicromia del brand;
  `scontorna` per le foto-oggetto; `video_genera` solo per clip brevi di oggetti, con il primo fotogramma.
- Quello che mancava al primo video: foto dimostrative e oggetti riconoscibili accanto ai grafici.
- Correzioni del titolare sul video del disavanzo (22/10/2026), da rispettare in ogni copione e prompt:
  - Giulio con eleven_v3, stabilità 0,5, stile 0,4: intonazione guidata da «…» prima delle cifre chiave e da una o
    due parole in MAIUSCOLO;
  - cifre a voce alternate: la cifra che regge il video intera, le altre arrotondate, mai decimali, «quasi» e
    «più di» al massimo una volta ogni due cifre;
  - niente transizioni a spinta o swipe in su o in giù: morph con un elemento grafico che cambia forma (massimo 2
    per video), altrimenti taglio.
- Stati: `idea` → `in lavorazione` → `programmato` (in coda su Instagram) → `pubblicato` (con data e link al post),
  oppure `scartato` (con il motivo).
  `riserva`: scheda pronta senza data, da usare quando una settimana non ha notizie adatte.

## Formato
- Reel 9:16, 1080×1920, circa 60 secondi (55-65). **Cinque uscite a settimana, dal lunedì al venerdì** (decisione del
  titolare del 28/10/2026, D-032; prima erano tre).
- Montaggio in Animatio, con il brand kit di Paghi Tu già caricato: palette, Bricolage Grotesque per titoli e
  cifre, Figtree per i testi, Courier Prime per lo scontrino, timbro «TU» terracotta in chiusura (D-UI-08).
- Voce: **Giulio**, sempre la stessa, tono calmo da documentario, circa 140 parole al minuto.
- Sottotitoli sempre accesi alla pubblicazione: la maggior parte dei Reel si guarda senza audio. Un solo progetto per
  video: i sottotitoli sono la fascia Parole di Animatio e si accendono o si spengono prima del render, mai una copia
  del progetto «senza sottotitoli» (correzione del titolare, 24/10/2026).
- Zone sicure: niente testo importante nei 250 px in alto e nei 400 px in basso (didascalia e bottoni del Reel).
- I primi 2 secondi devono avere una domanda o una cifra a schermo: è lì che si decide se il video viene visto.

## Formato visivo (D-032, dal 28/10/2026)
I primi video erano chiari ma fermi: poche scene lunghe, etichette minuscole, metà del fotogramma vuota, immagini solo
come fondo sbiadito. Dal 28/10 ogni video segue queste regole, misurate sul fotogramma 1080×1920.

**Niente di piccolo.**
- Testo minimo 40 px, per qualsiasi cosa sia a schermo (fonti comprese: 34 px al minimo, in `testoTenue`, mai Courier
  sotto i 40 px). Etichette dei grafici 48 px, cifre dentro un grafico 64 px, la cifra protagonista 180-320 px.
- Un grafico prende tutta la larghezza utile (920 px) e almeno 700 px di altezza; barre e colonne spesse almeno 110
  px; al massimo 6 voci per grafico. Una sola voce nell'accento, le altre in ardesia o nel grigio di confronto.
- Se una cosa non si legge sul telefono a braccio teso, non c'è: si toglie o si ingrandisce.

**Il fotogramma è pieno.**
- Il soggetto della scena (cifra, grafico, oggetto) occupa almeno metà della zona sicura (250-1580 px in altezza).
  Nessuna metà del fotogramma vuota.
- Tre piani per scena: un fondo (carta, notte o foto a retino), il soggetto, un dettaglio in primo piano (un ritaglio,
  un'etichetta, una freccia). Il primo piano entra per ultimo.

**Si muove sempre.**
- 8-12 scene per un minuto. Ogni 1,5-2 secondi succede qualcosa: entra un elemento, una cifra conta, un grafico
  cresce, la camera avanza. Nessun fotogramma fermo per più di 3 secondi.
- Le immagini non stanno mai ferme: avvicinamento lento (push-in) o parallasse tra i piani.
- Ogni grafica si aggancia alla parola della voce che la nomina; il grafico cresce mentre Giulio dice la cifra.
- Le transizioni restano quelle ammesse dal brand (taglio, morph al massimo 2, push-down al massimo 1).

**Montaggio pulito, non da principiante** (correzione del titolare del 28/10/2026).
- **Continuità sul taglio.** Un elemento che resta da una scena all'altra (una pila, un grafico, la cifra protagonista,
  un'etichetta, il fondo) sta nello stesso punto, alla stessa misura e nello stesso stato: niente salti di qualche
  pixel, niente cambi di corpo, niente pile o grafici che ricrescono da zero (`da` negativo li mostra già pronti),
  niente cifre che ricontano da zero. Se deve cambiare, cambia con un movimento visibile o con il morph, mai con il
  taglio.
- **Camera coerente.** Un avvicinamento lento (camera o `lento`) non si interrompe su un taglio verso una scena che
  riparte da 1: o la scena dopo parte dallo stesso zoom, o niente camera su quella coppia di scene. Il fondo che
  continua non riparte il suo movimento.
- **Griglia fissa.** Le stesse cose stanno sempre allo stesso posto per tutto il video: etichetta in alto a y 270,
  cifra protagonista a y 340, riga che la spiega a y 560-570, fonte a y 1500, sottotitoli a 1400. Margini 80 px.
- **Ogni movimento ha un motivo.** Entra solo ciò che la voce sta per dire, quando lo dice; niente elementi che
  entrano ed escono subito, niente scatti, lampi, rimbalzi o zoom senza scopo. Le entrate cambiano con la funzione
  (la cifra con il blur, il titolo con la maschera, l'etichetta con il wipe, la fonte in dissolvenza): mai tutto in
  dissolvenza.
- **Tagli sul senso.** Si taglia su una pausa della voce o su un cambio di argomento, non a metà di una frase; due
  scene di fila non devono sembrare la stessa con un elemento in meno.
- **Suoni sul colpo.** Un effetto cade sull'evento che sottolinea (la pila che cresce, il timbro che cade), anche se
  l'avviso del controllo dice «fuori battito»; sui battiti (`sync_aggancia`) solo gli effetti senza un evento a schermo.
- **Prima di consegnare:** si guarda il video consegnato (`video_guarda`) e, a ogni taglio, il fotogramma prima e
  quello dopo: se qualcosa salta senza motivo, si corregge.

**Grafici che colpiscono.**
- Un grafico per scena, mai una tabella. Tipi: colonne e barre per confronti, linea per l'andamento (si disegna),
  ciambella e pila per le parti di un totale.
- Il dato che conta è nell'accento, grande, con l'etichetta scritta sulla barra e non in una legenda.
- Confronti fisici quando aiutano: pile di monete (`pila-monete`), lo scontrino che si allunga, i cento quadretti.
- Proporzioni sempre vere: zero dentro l'asse, nessun asse tagliato.

**Immagini ritagliate, effetto carta.**
- Gli oggetti, i luoghi e le persone sono **ritagli**: scontornati (`scontorna`), stampati a **retino di puntini**
  nell'inchiostro del brand, con un bordo di carta bianca e un'ombra morbida, come un ritaglio di giornale
  incollato sulla pagina. Stanno sopra la grafica, in primo piano, non solo come sfondo.
- Lo sfondo può essere una foto intera, sempre a retino e in bicromia, mai a colori pieni.
- Almeno 3 ritagli per video. Il componente del brand è `ritaglio-carta`: la foto resta leggibile sotto in bicromia e
  il retino è una trama sopra (di serie forza 0,5 e passo 6 px; sotto i 300 px passo 4-5 e forza 0,3-0,4). L'oggetto
  si deve riconoscere al primo sguardo (correzione del titolare del 28/10: con i soli puntini grossi non si capiva cosa
  fosse). Prototipo del formato: progetto Animatio `paghi-tu/90-prototipo-sanita`.

**Informazioni utili, non ripetizioni.**
- Ogni video dà almeno **tre informazioni che chi guarda può riusare**: una cifra con cosa vuol dire, un confronto che
  la mette in prospettiva, dove si trova sul sito o nell'atto ufficiale.
- Vietati i video che spiegano solo una definizione o il metodo senza un dato nuovo: al massimo un video sul metodo
  ogni due settimane.
- Meglio un fatto di questa settimana (un decreto in Gazzetta, una promessa nuova, un dato appena uscito) spiegato con
  i numeri del sito, che un concetto generale già raccontato.

## Tono: informare, e farsi ascoltare volentieri
- **Una domanda, una risposta.** Ogni Reel risponde a una sola domanda che una persona si farebbe davvero («Perché
  si parla di manovra?», «Quanto ci costano gli interessi?»). La domanda è il gancio, la risposta arriva entro la
  fine, senza divagazioni.
- **Spiegare, non solo elencare.** Ogni cifra arriva con la frase che la rende chiara: cosa misura, rispetto a cosa,
  perché conta. Un termine tecnico (disavanzo, PIL, COFOG) si spiega con parole semplici la prima volta che compare.
- **Un momento «non lo sapevo».** In ogni video c'è almeno un fatto che sorprende, ma vero e con la fonte: un
  confronto nel tempo, con l'Europa, fra previsto e speso.
- **Voce da racconto.** Giulio parla a chi ascolta, al «tu», con frasi brevi, domande, pause. Mai da telegiornale,
  mai allarmato. Al massimo 6-7 cifre per video: oltre, non si ricorda niente.
- **Chiusura che resta.** L'ultima frase riassume in parole quello che si è capito, poi «paghitu.it».

## Video dalle notizie
Dalla settimana del 4 novembre le idee nascono dalle notizie: la routine guarda cosa è successo nei giorni prima
(manovra in Parlamento, un dato nuovo di ISTAT, Banca d'Italia, Eurostat o dell'Ufficio parlamentare di bilancio, un
tema di cui parlano tutti) e lo collega ai numeri del sito. La notizia è lo spunto; la spiegazione la danno i dati.
Ogni scheda nata da una notizia ha una sezione «La notizia» con fonte, data e link.

## Non ripetersi
Le idee del 24 ottobre riprendevano quasi tutte i concetti del primo video (decisione del titolare, D-028). Prima di
scrivere un'idea si legge l'elenco «Già raccontato» qui sotto e le schede `in lavorazione` e `pubblicato`.
- **Domanda nuova, cifra nuova.** Il gancio e il momento «non lo sapevo» non possono stare su un numero o un concetto
  che è già stato al centro di un video uscito o in lavorazione.
- Un dato già usato può tornare una volta sola, come termine di paragone, mai come protagonista.
- Una notizia che ripete un concetto già spiegato si usa solo con un angolo davvero nuovo; altrimenti si passa.
- Cambia anche la forma: non due video di fila con la stessa scena principale (scontrino, griglia dei 100 €, linea
  del tempo, confronto con l'Europa, barre).
- Meglio pescare dalle parti del sito che i video non hanno ancora toccato: governi, leggi di bilancio, misure,
  promesse, archivio, metodo, voci piccole della spesa.

### Già raccontato
| Video | Concetti al centro |
|---|---|
| R00 Il conto lo paghi tu | spesa per residente (19.633 €), ogni 100 € di spesa (con «8 all'istruzione e 8 agli interessi»: gli interessi pesano quanto l'istruzione), interessi ogni 100 € 1995-2024, debito in % del PIL dal 1946, debito ad agosto 2026 (3.201 miliardi) e debito a testa, Italia contro media UE (debito e interessi), previsto contro speso (Quota 100) |
| R01 Lo Stato spende più di quanto incassa | entrate contro uscite per residente, disavanzo a testa, saldo in % del PIL dal 1995 |
| R02 La voce che corre più di tutte | crescita degli interessi nel semestre, interessi a testa, interessi ogni 100 € dal 1995, interessi Italia contro UE |
| R03 Previsto contro speso | stima della relazione tecnica contro consuntivo delle misure |
| R15 Se la manovra non arriva in tempo | calendario della legge di bilancio, esercizio provvisorio |
| R09 Le voci piccole del conto | difesa, sicurezza, ambiente, cultura, casa per residente |
| R10 Le regole per le promesse | come il sito raccoglie le promesse, partiti in ordine alfabetico |

Quando un video passa a `in lavorazione` si aggiunge la sua riga.

## Immagini
- Incisioni del Settecento già nel repo (`public/img/`), in pubblico dominio, a retino e in bicromia, con parallasse
  lento.
- Foto dimostrative di oggetti e luoghi (scontrini, monete, registri, camion, pompe di benzina, banchi di scuola,
  corsie d'ospedale, facciate di palazzi pubblici), scontornate e a retino. Solo in pubblico dominio o con una licenza
  che permette l'uso commerciale, con il credito a schermo quando la licenza lo chiede. Si possono generare con l'AI
  se non mostrano persone riconoscibili, loghi o palazzi falsi spacciati per veri.
- **Personaggi pubblici** (decisione del titolare del 28/10/2026, D-032): la foto di un politico o di un'altra persona
  pubblica può comparire quando il video parla di un fatto che la riguarda (un decreto del suo governo, una proposta
  che ha presentato, una frase citata com'è), con nome e ruolo scritti accanto. Regole:
  - mai insultata, derisa o messa in cattiva luce: niente caricature, smorfie scelte apposta, fumetti, scritte sopra il
    volto, accostamenti che suggeriscono un giudizio;
  - solo foto vere con licenza che ne permette il riuso (ritratti ufficiali di governo.it, camera.it, senato.it,
    Wikimedia Commons), con il credito; mai volti generati o modificati con l'AI, mai fotomontaggi;
  - stesso trattamento per tutti: stessa misura, stesso retino, espressione neutra; se ne compare più d'uno, stesso
    spazio e ordine alfabetico;
  - restano esclusi simboli e colori di partito, folle di manifestazioni, banconote che bruciano e altri cliché
    allarmistici.
- Registrazioni dello schermo del sito su telefono, per mostrare dove si trova ogni numero.

## Regole che non si saltano
1. **Ogni numero viene dal sito pubblicato**, copiato com'è, in formato italiano (19.633 €, 7,5%). Unica
   eccezione: nei video nati da una notizia, la cifra della notizia può venire dalla sua fonte primaria (ISTAT,
   Banca d'Italia, Eurostat, MEF, Ufficio parlamentare di bilancio, Gazzetta Ufficiale, atti di Camera e Senato),
   con il link nella scheda, mai solo da un giornale. Nessun arrotondamento a schermo, nessuna cifra calcolata
   apposta per il video. Nella voce le cifre si scrivono in lettere, così Giulio non le legge male.
2. **Il giorno del montaggio** si riaprono le pagine indicate nella scheda e si ricontrolla ogni cifra: la routine
   aggiorna i dati, e il video deve dire quello che dice il sito quel giorno.
3. **Neutralità:** partiti, governi e politici si possono nominare, ma senza mai esprimere una preferenza, né a
   favore né contro, per un partito, una coalizione o una persona. Su di loro solo fatti veri con la fonte (una
   misura, un atto, una frase citata com'è), mai fatti non verificati, intenzioni o motivi attribuiti: sarebbe
   diffamazione. Quando ne compare più d'uno, stesse regole e stesso spazio per tutti, in ordine alfabetico. Nessun
   giudizio («spreco», «scandalo», «colpa», «finalmente»). Nessuna spiegazione delle cause che il sito non dà.
   Nelle immagini i personaggi pubblici seguono le regole della sezione «Immagini»; restano esclusi simboli e colori di
   partito.
4. Le cifre per residente sono medie: quando compaiono, a schermo c'è «medie per residente».
5. **Nei 15 giorni prima delle elezioni politiche o di un referendum nazionale** niente video nuovi su partiti e promesse (stessa regola del sito).
6. Fonti in piccolo su ogni scena con un numero; in chiusura «paghitu.it» e l'invito a segnalare gli errori.

## Struttura di una scheda
Titolo, data prevista, stato, pagine del sito, perché adesso, gancio, tabella dei numeri (valore, fonte, pagina),
**le tre informazioni utili** (una riga ciascuna), scene con i tempi (8-12 scene, per ognuna il soggetto, il grafico o il
ritaglio e la misura della cifra protagonista), voce per Giulio, **ritagli** (almeno 3, con la fonte dell'immagine e la
licenza), bozza della didascalia, cose da controllare prima del montaggio.
