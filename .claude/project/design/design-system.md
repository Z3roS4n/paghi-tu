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
Redesign del 2026-10-21: la domanda guida è **«quanto spende lo Stato con i nostri soldi?»**. Ogni pagina
porta il numero principale in testa, poi il dettaglio, poi fonti e controlli. Pagine: home (cifra per
residente + scontrino), `/spesa`, `/governi/[id]` (conti durante il mandato), `/archivio` (ricerca).

## Palette — token
Definita in `src/app/globals.css` (D-011: nessun colore di partito — niente rosso, blu, verde, giallo o
tricolore come colore di identità). Tema chiaro e scuro seguono `prefers-color-scheme`.

| Token | Utility | Chiaro | Scuro |
|---|---|---|---|
| carta | `bg-paper` | `#f4f4f1` | `#111113` |
| carta rialzata | `bg-paper-raised` | `#fbfbf9` | `#1b1b1e` |
| inchiostro | `text-ink` | `#18181b` | `#ececee` |
| inchiostro secondario | `text-ink-soft` | `#52525b` | `#a1a1aa` |
| inchiostro tenue | `text-ink-faint` | `#71717a` | `#8b8b94` |
| filetto | `border-rule` | `#d4d4d8` | `#34343a` |
| accento (unico) | `bg-accent` / `text-accent` | `#c2410c` | `#fb923c` |
| livelli V1/V2/NV | `text-level-*` | `#3f3f46` / `#a16207` / `#b91c1c` | `#d4d4d8` / `#fbbf24` / `#f87171` |

Lo scontrino (`.receipt`) resta carta chiara anche in tema scuro: è un oggetto, non una superficie.
I colori di livello sono stati di verifica, non si riusano per le serie dei grafici.

## Tipografia
Geist (testo e titoli) e Geist Mono (etichette, date, scontrino) via `next/font`. Titoli `font-semibold
tracking-tight`; cifra principale 6xl–8xl, stesso sans, cifre proporzionali. `tabular-nums` (classe
`.tabular`) solo dove i numeri si allineano in colonna: tabelle, assi, scontrino.

## Forma & elevazione
Tutto squadrato (radius 0) tranne la punta delle barre (4px). Gruppi con filetti `border-rule`/`divide-y`,
non card. Unica ombra: lo scontrino della home.

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
Una sola pagina per desktop e mobile. Larghezza minima verificata 500 px (Edge headless non scende sotto):
nessuno scroll orizzontale della pagina; le tabelle larghe scorrono dentro il loro contenitore.

## Shell (riferimento rapido)
Intestazione con logo e menu (Spesa, Governi, Leggi di bilancio, Promesse, Misure, Archivio, Metodo, Fonti);
su mobile il menu scorre in orizzontale. La ricerca vive in `/archivio` (link anche dalla home). Piè di pagina
con Chi siamo, Correzioni, Note legali, Metodo.

## Grafici
- Una serie per grafico, colore accento, linea 2px, area al 10%, griglia a filetti pieni. Mai due assi:
  misure diverse → grafici diversi affiancati.
- `ChartFigure` (server) dà titolo, nota, fonte e **tabella dei dati** sempre disponibile; `LineChart` (client)
  dà crocino e tooltip con mouse e frecce della tastiera.
- Barre orizzontali con valore in punta, una sola tinta. Nessuna palette per categorie finché non serve davvero.
