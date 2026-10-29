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
- **Le tavole** sono `post` 1080×1350 con id `NN-KK` (carosello, slide): statiche, o animate per le 2-3 slide
  che si muovono (vedi «Slide animate»).
- **I file esportati** vanno in `ms-motion/renders/paghi-tu/caroselli/NN-nome/`: `01.png`, `02.png`… per le slide
  statiche, `01.mp4`… per quelle animate. Con loro la `didascalia.txt`, un `striscia.png` di controllo (le slide
  affiancate senza spazio) e uno `scorrimento.mp4` che simula lo swipe con le slide animate in movimento.

## Cosa lo rende premium
- **Una sola idea per slide**, molta aria e la stessa griglia su tutte le slide. Come le pagine dati dei
  quotidiani: cambia il contenuto, la pagina resta quella.
- **La continuità tra le slide.** Ogni bordo ha qualcosa che lo attraversa, così scorrendo sembra un foglio
  unico. È il «seamless carousel»: si progetta una tela larga 1080 × numero di slide e la si taglia ogni 1080 px.
  Un oggetto a cavallo di un bordo va su tutte e due le tavole, alla stessa y, con la x spostata di 1080.
- **Collegamenti vari, non sempre la stessa barra.** Correzione del titolare (28/10/2026): le barre fra una slide e
  l'altra erano ripetitive. In un carosello lo stesso tipo di collegamento si usa al massimo due volte. I tipi:
  - un oggetto che attraversa il bordo (una scheda, un lucchetto);
  - un'immagine su due slide (lo schedario della copertina che finisce nella slide 2);
  - una figura spezzata (una cifra gigante tagliata dal bordo);
  - una linea che diventa un'altra cosa (il filo che diventa il braccio della bilancia);
  - un fondo che continua (un'incisione a tutta pagina su due slide, chiara, in moltiplica);
  - la striscia in scala del pilota, solo quando è il dato stesso.
- **Elementi con un motivo.** Correzione del titolare: niente immagini «messe lì giusto per starci» e niente forme
  astratte. Ogni elemento è una metafora del contenuto della slide e ha la sua riga, con il motivo, nella tabella
  del carosello qui sotto. Pochi elementi, grandi, che riempiono la slide.
- **Profondità a piani, non 3D.** Il brand non ammette il 3D (`"3d": {"ammesso": false}`). La profondità viene da
  2-3 piani per slide: il fondo (un'incisione o una cifra gigante in `$linea`), l'oggetto a retino con la sua ombra
  morbida, carte e timbri sopra. Ombre solo sotto gli oggetti e morbide; niente gradienti né cornici.
- **Parallasse:** nelle slide statiche lo swipe sposta tutto insieme, quindi la parallasse vera c'è solo nelle
  slide animate, dove i piani si muovono a velocità diverse.

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
| Zona degli oggetti | y 560-1080 | l'oggetto della slide, grande; esce dal bordo se è il collegamento; mai sopra titolo, cifra, descrizione e fonte |
| Fascia della linea continua | y 900-1040, alta 140 | solo se il carosello usa la striscia in scala; pezzi in `$testo` separati da 8 px di fondo; nessun accento |
| Etichette della linea | y 1058, alte 34 | `$etichetta` 26, `$testoTenue`; una per pezzo visibile, dentro la slide, mai a cavallo del bordo |
| Descrizione | y 1100, alta 130, larga 920 | su ogni slide interna; `$testo` 32 (fino a 34), `$testo`, interlinea 1,3; 2-3 righe con le parole del sito |
| Nota | dentro la descrizione | se serve una definizione: `$testo` 28, `$testoTenue`, al posto dell'ultima riga della descrizione |
| Fonte | y 1262 | `$testo` 28, `$testoTenue`: la pagina del sito e la sezione |

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

## Slide animate
- **2-3 per carosello**, di solito la copertina e una slide interna. Le altre restano PNG.
- **Movimento lento in ciclo di 4-6 s** (10 battiti = 5 s): si muovono solo i piani in primo piano, e di poco (una
  scheda che si solleva di 18 px, due carte che oscillano di ±2,5° in controfase). Curva `sine-in-out`.
- **Niente entrate né uscite:** il primo e l'ultimo fotogramma sono la slide completa, e sono uguali, così il ciclo
  non si vede. Gli oggetti a cavallo di un bordo restano fermi, sennò il collegamento si rompe.
- **Esportazione:** MP4 1080×1350 a 30 fps, H.264, senza audio. Si rende fotogramma per fotogramma con
  `fotogramma` di `editor/mcp/render.ts`, poi si monta con ffmpeg.

## Contenuti
- **Ordine dentro la slide:** prima il titolo, poi la cifra, poi la riga che la spiega. Al massimo due blocchi di
  testo per slide, oltre a nota e fonte. Una slide a due colonne conta un blocco per colonna.
- **La cifra o la parola grande dice qualcosa a chi legge** («Eurostat», «dal 1861», «69 governi»), con le parole
  del sito. Mai un codice interno: i codici del registro (R-07, R-12…) restano piccoli, in `$etichetta`, o sulla
  scheda, come riferimento per chi va su /fonti. Correzione del coordinatore sul 04.
- **Un solo accento per slide:** se una slide ha due parole grandi, solo una è in `$accento`, l'altra in `$testo`
  (correzione del coordinatore sul 04: «Normattiva» e «69 governi» erano tutte e due rosse).
- **Due fatti accostati non devono crearne un terzo:** «Il debito, mese per mese» sopra «dal 1861» faceva leggere
  «mese per mese dal 1861», che il sito non dice; «69 governi» con «dal 1948» era sbagliato (dal 1948 partono le
  legislature, i governi dal 1945).
- **Solo cifre pubblicate sul sito**, ricontrollate con curl il giorno stesso. Niente somme o rapporti calcolati da
  noi: se servono, prima vanno sul sito.
- **Medie per residente:** dove le cifre sono per residente, «Medie per residente, non quanto paga ogni persona»
  sta in copertina o nell'ultima slide, e la fonte di ogni slide dice «medie per residente».
- **Nessun ritratto e nessun nome di politici.** Le persone pubbliche seguono la regola dei Reel (D-032) solo se il
  carosello parla di un loro atto.
- **Temi:** non quelli già fatti nei Reel (correzione del titolare). I caroselli raccontano il sito stesso: le
  fonti, il metodo, le correzioni.
- **Immagini:** come nei Reel («Riuso delle immagini»).
  - Oggetti generati (`immagine_genera`, trasparenti) resi a retino con `ritaglio-carta` e `bordo` 0. Al massimo
    4 immagini generate per carosello: se ne servono di più, prima si chiede.
  - Incisioni d'archivio di pubblico dominio solo come fondo chiaro (opacità 0,13-0,16, in moltiplica).
  - Un ritaglio già usato in un reel va bene solo se il soggetto è lo stesso; registro e monete fotografate no.
  - Le immagini non toccano mai la linea continua.
- **Didascalia:** la domanda o il fatto del titolo, le cifre principali, le definizioni del sito, la fonte, il link
  alla pagina, «Hai trovato un errore? Segnalalo su paghitu.it/correzioni» e gli hashtag dei Reel.

## Controllo prima di pubblicare
- Ogni slide esportata in PNG e guardata a piena misura.
- Il `striscia.png` delle slide affiancate: ogni oggetto a cavallo di un bordo deve combaciare, al pixel.
- Le slide animate: primo e ultimo fotogramma uguali, e lo `scorrimento.mp4` guardato per intero.
- Nessun testo tagliato e nessuna etichetta a cavallo di un bordo.
- Le cifre rilette contro la pagina del sito del giorno.

## Caroselli
| N. | Titolo | Pagina del sito | Stato |
|---|---|---|---|
| 01 | Dove vanno i soldi, voce per voce (spesa per funzione 2024, per residente) | /spesa | prova, fermo: tema già nei Reel |
| 02 | Il calendario della manovra | /leggi-di-bilancio | prova, fermo: tema già nei Reel |
| 03 | Il debito, mese per mese | / (grafico del debito) | prova, fermo: tema già nei Reel |
| 04 | Da dove vengono i numeri | /fonti, /metodo | prima versione, da rivedere con il titolare e il verificatore |
| 05 | Quando sbagliamo | /correzioni | da fare, dopo l'ok al 04 |

### 04 · Da dove vengono i numeri: elementi e motivo
| Slide | Elemento | Motivo |
|---|---|---|
| 1-2 | Schedario a retino, su due slide | il registro delle fonti è uno schedario: da R-01 a R-36 |
| 1 | Scheda R-12 sollevata (animata) | ogni numero ha la sua scheda: si tira fuori la fonte |
| 2-3 | Scheda R-07 a cavallo del bordo | dai conti pubblici (Eurostat) si passa al debito (Banca d'Italia) |
| 3-4 | Incisione di Montecitorio (Piranesi), fondo che continua | leggi e governi vengono dal Parlamento (Normattiva, dati.camera.it) |
| 3 | Righello di 166 tacche, dal 1861 al 2026, a destra della scheda R-07 | un segno per ogni anno della serie del debito: solo la forma e le due date, nessuna cifra |
| 4 | 69 linguette in tre file che si coprono come in un cassetto (dietro le prime, dal 1945; davanti le ultime, oggi) | un fascicolo per governo; la profondità sta nel tono delle file, non nella trasparenza |
| 4-5 | Filo che diventa il braccio della bilancia | le fonti stanno sullo stesso piano, poi si pesano |
| 5 | Bilancia con due carte «DEBITO» (animata) | il debito di Banca d'Italia e quello di Eurostat devono coincidere |
| 5-6 | «3» gigante spezzato dal bordo | i tre livelli di verifica |
| 6 | Timbri V1, V2, NV | ogni dato porta il timbro del suo livello |
| 6-7 | Lucchetto aperto a cavallo del bordo | le licenze: riuso libero, con citazione, con permesso |
