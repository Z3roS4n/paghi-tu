# Caroselli di Paghi Tu

Post a più slide per Instagram, fatti nel canvas di Animatio (progetti in `C:\Users\thepr\ms-motion`, brand
`paghi-tu`). Accompagnano i Reel: un carosello si legge con calma, quindi può tenere più cifre di un video, ma
segue le stesse regole del README dei Reel su testo, immagini e verifica. Decisione: D-033.

## Dove stanno
- **Un canvas solo per tutti i caroselli:** `brand/paghi-tu/caroselli` («caroselli» nella vista Canvas).
- **Una riga per carosello:** le tavole affiancate a 0 px (x = 0, 1080, 2160…), così sulla lavagna si legge la
  striscia intera. Le righe una sotto l'altra, con 400 px d'aria (y = 0, 1750, 3500…).
- **A sinistra di ogni riga** un elemento `titolo` con numero e nome, per esempio «01 · Dove vanno i soldi, voce per
  voce».
- **La riga «00 · Modello» in cima** ha le quattro tavole del formato standard con i segnaposto: copertina, slide
  tipo, slide a due colonne, ultima slide. Un carosello nuovo parte copiando quelle tavole
  (`canvas_tavola_aggiungi` con `da`).
- **Le tavole** sono `post` 1080×1350, statiche, con id `NN-KK` (carosello, slide).
- **I PNG esportati** vanno in `ms-motion/renders/paghi-tu/caroselli/NN-nome/` come `01.png`, `02.png`…, con la
  `didascalia.txt` e un `striscia.png` di controllo, cioè le slide affiancate senza spazio.

## Cosa lo rende premium
- **Una sola idea per slide**, molta aria e la stessa griglia su tutte le slide. Come le pagine dati dei
  quotidiani: cambia il contenuto, la pagina resta quella.
- **La continuità tra le slide.** Un elemento attraversa il bordo e prosegue nella slide dopo, così scorrendo
  sembra un foglio unico: nel pilota è la striscia della spesa, voce per voce, in scala.
  - È il «seamless carousel»: si progetta una tela larga 1080 × numero di slide e la si taglia ogni 1080 px.
  - Un oggetto a cavallo di un bordo va su tutte e due le tavole, alla stessa y, con la x spostata di 1080.
- **Nessun effetto:** niente ombre forti, gradienti o cornici. Il ritmo lo danno la scala delle cifre e la linea.

## Formato standard
Uguale in ogni carosello: cambiano solo i contenuti e la disposizione dentro la griglia. Misure in px della slide
1080×1350.

| Elemento | Posizione | Stile |
|---|---|---|
| Margini | 80 a sinistra e a destra | |
| Testata | y 74, alta 40 | a sinistra il tema e l'anno, a destra «02 / 09»; `$etichetta` (Courier Prime) 26, `$testoTenue` |
| Filo di testata | y 128, alto 2 | `$testo`; continuo: nella copertina parte da x 80, nell'ultima slide finisce a x 1000, nelle altre va da 0 a 1080 |
| Titolo della slide | y 200 | `$titolo` 64 (una voce) o 48 (due colonne), `$testo`, al massimo cinque parole |
| Cifra | y 300 (una voce) o y 360 (colonne) | `$titolo` 220 o 128, `$accento`; «€» e «%» a metà corpo |
| Riga sotto la cifra | y 560 o y 520 | `$testo` 40 o 36, `$testoTenue`; larga 500 se a destra c'è l'immagine |
| Colonne | x 80 e x 580, larghe 420 | due voci per slide al massimo |
| Zona immagine | y 560-880 | a destra (x 600-1000) con una voce, sotto la sua colonna con due; mai sopra la fascia della linea |
| Fascia della linea continua | y 900-1040, alta 140 | sempre a questa altezza; pezzi in `$testo` separati da 8 px di fondo; nessun accento |
| Etichette della linea | y 1058, alte 34 | `$etichetta` 26, `$testoTenue`; una per pezzo visibile, dentro la slide, mai a cavallo del bordo |
| Nota | y 1130-1230 | `$testo` 26, `$testoTenue`, parole del sito |
| Fonte | y 1262 | `$testo` 24, `$testoTenue` |

- **Fondo:** `$fondo` su tutte le slide, anche la copertina e l'ultima, così la striscia non cambia colore.
- **Accento:** uno solo per slide, sulla cifra protagonista. La linea continua resta ardesia.
- **Cifre:** come sul sito, in formato italiano.
- **Copertina:**
  - titolo-gancio `$titolo` 124 su tre righe al massimo, a y 200;
  - a y 620 una riga `$testo` 44 con la cifra in accento;
  - la linea continua comincia qui ed esce dal bordo destro, perché è l'invito a scorrere;
  - in piede «Medie per residente, non quanto paga ogni persona.» quando servono.
- **Ultima slide:**
  - etichetta «TOTALE» o «IN SINTESI» a y 200, cifra `$titolo` 180 in `$testo` a y 250, riga a y 460;
  - filo a y 600;
  - fonte completa a y 636 (`$testo` 32), «medie per residente» se serve, il link alla pagina del sito a y 840
    (`$testo` 40, il link in grassetto) e «Hai trovato un errore? Segnalalo su paghitu.it/correzioni» a y 910;
  - il marchio (`timbro` con parola «Paghi») a x 80, y 1120.
- **Da 6 a 10 slide.**

## Contenuti
- **Ordine dentro la slide:** prima il titolo, poi la cifra, poi la riga che la spiega. Al massimo due blocchi di
  testo per slide, oltre a nota e fonte. Una slide a due colonne conta un blocco per colonna.
- **Solo cifre pubblicate sul sito**, ricontrollate con curl il giorno stesso. Niente somme o rapporti calcolati da
  noi: se servono, prima vanno sul sito.
- **Medie per residente:** dove le cifre sono per residente, «Medie per residente, non quanto paga ogni persona»
  sta in copertina o nell'ultima slide, e la fonte di ogni slide dice «medie per residente».
- **Nessun ritratto e nessun nome di politici.** Le persone pubbliche seguono la regola dei Reel (D-032) solo se il
  carosello parla di un loro atto.
- **Immagini:** come nei Reel («Riuso delle immagini»).
  - Ritagli a retino (`ritaglio-carta`) solo dove aiutano a riconoscere la voce, al massimo uno per slide.
  - Un ritaglio già usato in un reel va bene solo se il soggetto è lo stesso; registro e monete fotografate no.
  - Le immagini non toccano mai la linea continua.
- **Didascalia:** la domanda o il fatto del titolo, le cifre principali, le definizioni del sito, la fonte, il link
  alla pagina, «Hai trovato un errore? Segnalalo su paghitu.it/correzioni» e gli hashtag dei Reel.

## Controllo prima di pubblicare
- Ogni slide esportata in PNG e guardata a piena misura.
- Il `striscia.png` delle slide affiancate: ogni pezzo della linea deve combaciare sul bordo, al pixel.
- Nessun testo tagliato e nessuna etichetta a cavallo di un bordo.
- Le cifre rilette contro la pagina del sito del giorno.

## Caroselli
| N. | Titolo | Pagina del sito | Stato |
|---|---|---|---|
| 01 | Dove vanno i soldi, voce per voce (spesa per funzione 2024, per residente) | /spesa | pilota, da rivedere con il titolare |
