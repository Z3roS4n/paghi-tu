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
- **Parlato arrotondato, schermo esatto:** Giulio dice «quasi ventimila», a schermo c'è «19.633 €» con la fonte.
  Una persona non legge le slide.
- Le grafiche si agganciano alla parola della trascrizione che le nomina.
- Componenti del brand già pronti: `scontrino` e `cento-quadretti`; il timbro «TU» va salvato come `timbro`.
- Immagini: `immagine_genera` (gemini-3-pro-image) con lo stile comune dei prompt, poi bicromia del brand;
  `scontorna` per le foto-oggetto; `video_genera` solo per clip brevi di oggetti, con il primo fotogramma.
- Quello che mancava al primo video: foto dimostrative e oggetti riconoscibili accanto ai grafici.
- Stati: `idea` → `in lavorazione` → `pubblicato` (con data e link al post), oppure `scartato` (con il motivo).
  `riserva`: scheda pronta senza data, da usare quando una settimana non ha notizie adatte.

## Formato
- Reel 9:16, 1080×1920, circa 60 secondi (55-65). Tre uscite a settimana: lunedì, mercoledì, venerdì.
- Montaggio in Animatio, con il brand kit di Paghi Tu già caricato: palette, Bricolage Grotesque per titoli e
  cifre, Figtree per i testi, Courier Prime per lo scontrino, timbro «TU» terracotta in chiusura (D-UI-08).
- Voce: **Giulio**, sempre la stessa, tono calmo da documentario, circa 140 parole al minuto.
- Sottotitoli sempre impressi: la maggior parte dei Reel si guarda senza audio.
- Zone sicure: niente testo importante nei 250 px in alto e nei 400 px in basso (didascalia e bottoni del Reel).
- I primi 2 secondi devono avere una domanda o una cifra a schermo: è lì che si decide se il video viene visto.

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

## Immagini
- Incisioni del Settecento già nel repo (`public/img/`), in pubblico dominio, trattate in bicromia con un velo
  terracotta e parallasse lento.
- Foto dimostrative di oggetti e luoghi: scontrini, monete, registri, facciate di palazzi pubblici, archivi,
  aule vuote, corsie d'ospedale vuote. Solo in pubblico dominio o con licenza che permette l'uso commerciale,
  con il credito a schermo quando la licenza lo chiede. Si possono generare con l'AI, se non mostrano persone
  riconoscibili, loghi o palazzi falsi spacciati per veri.
- Registrazioni dello schermo del sito su telefono, per mostrare dove si trova ogni numero.
- Mai volti di politici, simboli o colori di partito, folle di manifestazioni, banconote che bruciano o altri
  cliché allarmistici.

## Regole che non si saltano
1. **Ogni numero viene dal sito pubblicato**, copiato com'è, in formato italiano (19.633 €, 7,5%). Unica
   eccezione: nei video nati da una notizia, la cifra della notizia può venire dalla sua fonte primaria (ISTAT,
   Banca d'Italia, Eurostat, MEF, Ufficio parlamentare di bilancio, Gazzetta Ufficiale, atti di Camera e Senato),
   con il link nella scheda, mai solo da un giornale. Nessun arrotondamento a schermo, nessuna cifra calcolata
   apposta per il video. Nella voce le cifre si scrivono in lettere, così Giulio non le legge male.
2. **Il giorno del montaggio** si riaprono le pagine indicate nella scheda e si ricontrolla ogni cifra: la routine
   aggiorna i dati, e il video deve dire quello che dice il sito quel giorno.
3. **Neutralità:** nessun partito, governo o politico citato o mostrato, salvo nei video sul metodo, dove compaiono
   tutti insieme e alla pari. Nessun giudizio («spreco», «scandalo», «colpa», «finalmente»). Nessuna spiegazione
   delle cause che il sito non dà.
4. Le cifre per residente sono medie: quando compaiono, a schermo c'è «medie per residente».
5. **Nei 15 giorni prima delle elezioni politiche o di un referendum nazionale** niente video nuovi su partiti e promesse (stessa regola del sito).
6. Fonti in piccolo su ogni scena con un numero; in chiusura «paghitu.it» e l'invito a segnalare gli errori.

## Struttura di una scheda
Titolo, data prevista, stato, pagine del sito, perché adesso, gancio, tabella dei numeri (valore, fonte, pagina),
scene con i tempi, voce per Giulio, immagini, bozza della didascalia, cose da controllare prima del montaggio.
