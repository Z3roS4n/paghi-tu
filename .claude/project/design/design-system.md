# Design system — Paghi Tu

> Guida di stile e convenzioni per il redesign/nuovo design UI. Fonte di verità per implementare
> qualsiasi schermata nuova o rifinire una esistente, senza dover ririsalire al design originale o
> al contesto di una conversazione passata. **Aggiornare questo file ogni volta che si stabilisce
> una nuova convenzione trasversale** — non lasciarla solo nella chat.

## Commenti nel codice (vale anche qui, non solo per la UI)
Vedi `06-code-style.md`: commentare solo dove strettamente necessario a capire il codice per uno
sviluppatore anche senza AI; se il codice è chiaro da sé, non commentarlo. Vale per ogni
componente/servizio toccato durante il redesign.

## Scope attuale
Sito pubblico, senza login, desktop e mobile con la stessa pagina (reflow ai breakpoint Tailwind).
Redesign del 2026-10-21 (direzione C, bozza `bozze/c2-piazza.html`, D-UI-06/07): la domanda guida è **«quanto spende
lo Stato con i nostri soldi?»**. Ogni pagina porta il numero principale in testa, poi il dettaglio, poi fonti e
controlli. Tutte le pagine sono sul nuovo design.

## Palette — token
Definita in `src/app/globals.css`: ardesia e terracotta (D-011: nessun colore di partito — niente rosso,
blu, verde, giallo o tricolore come colore di identità). Tema chiaro e scuro seguono `prefers-color-scheme`.

| Token | Utility | Chiaro | Scuro |
|---|---|---|---|
| carta | `bg-paper` | `#eceeee` | `#14181a` |
| carta rialzata (schede) | `bg-paper-raised` | `#f8f9f9` | `#1d2326` |
| carta incassata (segmenti, quadretti) | `bg-paper-sunk` | `#e1e5e6` | `#262e32` |
| inchiostro | `text-ink` | `#1f2427` | `#e9eced` |
| inchiostro secondario | `text-ink-soft` | `#465055` | `#b4bdc1` |
| inchiostro tenue | `text-ink-faint` | `#5e686d` | `#939da2` |
| filetto | `border-rule` | `#cdd3d5` | `#344045` |
| accento (unico) | `bg-accent` / `text-accent` | `#a4461f` | `#e9875c` |
| accento chiaro | `bg-accent-soft` | `#f3ddd2` | `#3d2a22` |
| neutro dei grafici (secondo termine) | `bg-neutral` | `#7c878c` | `#8a959a` |
| notte (tessera debito, blocco errori) | `bg-night` / `text-night-ink` | `#232a2e` | `#0f1213` |
| livelli V1/V2/NV | `text-level-*` | `#3f474b` / `#7a5300` / `#b91c1c` | `#d4d9db` / `#f2c66b` / `#f87171` |

Lo scontrino (`.receipt`) resta carta chiara anche in tema scuro: è un oggetto, non una superficie.
I colori di livello sono stati di verifica, non si riusano per le serie dei grafici. Nei grafici: accento per
l'Italia, l'ultimo periodo o la serie principale; neutro per il termine di confronto.

## Tipografia
Via `next/font/google`: **Bricolage Grotesque** per titoli e cifre grandi (`font-display`, automatico su h1–h3),
**Figtree** per il testo (`font-sans`, corpo 17 px), **Courier Prime** solo nello scontrino (`font-mono`).
Titoli `font-extrabold` con `clamp()` (h1 2,1–3,8 rem, h2 1,8–2,8 rem). `tabular-nums` (classe `.tabular`)
dove i numeri si allineano: tabelle, assi, barre, tessere.

## Forma & elevazione
Angoli poco tondi (scelta del proprietario): **schede 6 px** (`rounded-card`), **bottoni, etichette, campi 4 px**
(`rounded-ctl`). Le superfici sono schede `bg-paper-raised` su carta; ombra (`shadow-card`) solo per la scheda
della cifra in apertura su mobile e per lo scontrino. Bersagli tattili almeno 44 px (bottoni 48).

## Icone
`@phosphor-icons/react` (import `/ssr` nei server component), una sola famiglia, `weight="bold"` nei bottoni.

## Localizzazione
Italiano. Numeri con `Intl` it-IT (punto per le migliaia, virgola per i decimali), «€» dopo la cifra,
date per esteso («21 ottobre 2026»). Milioni → `formatEuroMillions` (mln/mld). Percentuali con un decimale.

## Convenzioni di componente

### Controlli di form — SEMPRE primitive stilizzate, MAI native
I controlli nativi del browser (`<select>`, checkbox/radio nativi) renderizzano popup e stili
propri del sistema operativo, **ignorando il tema dell'app** (tipicamente si vede un popup chiaro
su un'app in tema scuro). Regola fissa, verificata più volte su più progetti:
- Usare sempre le primitive stilizzate del design system in uso (es. shadcn/ui, Radix, base-ui...),
  mai l'elemento HTML nativo direttamente in una schermata utente.
- Se manca la primitiva (es. non esiste ancora un componente Checkbox/Switch/Select stilizzato nel
  progetto), **crearla prima** seguendo lo stile delle primitive già presenti — non bypassarla con
  l'elemento nativo "per ora".
- **Preservare sempre la semantica dei form** durante la conversione: se un native `<select>`/
  checkbox era dentro un form con `name`/FormData letto da un'azione server, la primitiva stilizzata
  deve continuare a sottomettere le stesse chiavi/valori (quasi tutte le librerie di componenti
  supportano un prop `name` che renderizza un input nascosto per questo). Non cambiare mai i dati
  che un'azione server riceve durante un semplice re-skin.

### Stato disabilitato / funzione non supportata
Quando il design mostra una funzione senza backend che la supporti (vedi `da-implementare.md`):
**non inventare mai dati finti**. Convenzione: elemento visibile ma disabilitato, con
tooltip/etichetta tipo "Presto disponibile". Mai wired a un'azione che darebbe errore o a dati mock
fuori da un harness di anteprima esplicitamente dev-only.

### Stati da coprire sempre
Vuoto, caricamento, errore, scaduto/warning — con i colori/varianti già definiti nella palette
sopra, non improvvisati caso per caso.

## Pattern architetturale per sezione
Per ogni schermata/sezione:
1. **Componente presentazionale** (`<sezione>/<nome>-view.*` o equivalente) — riceve solo props
   tipizzate, nessun fetch/logica di business dentro, responsive nello stesso componente.
   Sotto-pezzi in file separati nella stessa cartella.
2. **Pagina/route reale** — fa il fetch dei dati (servizi/API esistenti), preserva i filtri/URL
   esistenti, passa i dati al componente presentazionale.
3. **Harness di anteprima** (vedi sotto) — monta la view con dati mock realistici, senza auth.

Per sezioni con logica business esistente e complessa (form grandi, editor, wizard...), **ri-skinnare
in place** preservando ogni state/handler/azione — non riscrivere la logica durante un re-skin.

## Harness di anteprima
Non serve: il sito non ha schermate dietro login. Le verifiche visive si fanno sul server locale (porta 3311).

## Responsive
Una sola pagina per desktop e mobile, verificata a 390 e 1280 px, chiaro e scuro, con scroll reale (CDP su Edge
headless, `Emulation.setDeviceMetricsOverride`). Nessuno scroll orizzontale della pagina; le tabelle larghe scorrono
dentro il loro contenitore. Il racconto dei 100 € usa un pannello alto quanto lo schermo meno intestazione e dock
(`--header-h`, `--dock-h`): testo e quadretti stanno sempre insieme.

## Shell (riferimento rapido)
Intestazione fissa con marchio e, da 1024 px, menu (Spesa, Governi, Leggi di bilancio, Promesse, Misure,
Archivio, Metodo) con barra di avanzamento dello scroll. Sotto i 1024 px un **dock in basso** a 5 voci (Spesa,
Governi, Promesse, Misure, Altro); «Altro» apre un foglio `<dialog>` con le altre sezioni. Piè di pagina con
Metodo, Fonti, Correzioni, Chi siamo, Note legali, GitHub e i crediti delle incisioni. Voci in `src/lib/navigation.ts`.

## Grafici
- Componenti in `src/components/charts/`: `SeriesChart` (client, linee con lettura dell'anno, trascinamento col dito,
  frecce e Home/Fine; tratteggio per i nostri calcoli; una fascia evidenziata per il governo scelto), `ChartFigure`
  (server: titolo, nota, fonte e **tabella dei dati** sempre disponibile; con `views` un selettore euro di oggi /
  % del PIL), `bars.tsx` (coppie prima/dopo, barre orizzontali, scostamenti centrati sullo zero, spostamenti
  1995→ultimo anno, sparkline), `EuCompare` (Italia contro un paese a scelta), `GovernmentDebt` (grafico + scheda
  del governo dell'anno scelto).
- Mai due assi: misure diverse → grafici diversi. Linee 2,5 px, griglia a filetti, legenda sempre con due serie.
- Le funzioni (`format`) passano solo fra componenti server; ai client si passano dati e ReactNode.

## Movimento
Tutto dentro `prefers-reduced-motion: no-preference`; senza JavaScript o con meno movimento il contenuto resta fermo e completo.
- **Legato allo scroll** (`animation-timeline`): entrata dei blocchi (`.reveal`), incisione d'apertura che si allontana, barra di avanzamento della pagina.
- **Grafici e barre**: partono quando entrano nello schermo (`InViewMarker` mette `data-inview`, una sola volta) e si completano da soli in circa un secondo, così si leggono per intero. Lo stato nascosto vale solo con la classe `js`, messa da uno script in `<head>`.
- **Racconto dei 100 € e scontrino**: ogni binario è una `view-timeline` (`--step-N`, condivise con `timeline-scope`); i quadretti del passo si accendono uno per uno, il segmento di avanzamento si riempie e lo scontrino si stampa seguendo lo scroll. Invito «Scorri» con freccia sul primo passo e sullo scontrino. Senza timeline di scroll i passi cambiano a stati fissi.
- Nessun listener di scroll.
- **Bottoni**: da mobile prendono tutta la larghezza (due affiancati se le etichette sono corte, altrimenti uno per riga); da `sm` tornano alla larghezza del testo.
