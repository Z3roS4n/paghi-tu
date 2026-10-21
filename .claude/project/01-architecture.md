# Paghi Tu — Architettura

> Ultimo aggiornamento: 2026-10-21. Documento vivo: aggiornare a ogni decisione architetturale.

## Visione
Sito pubblico e apartitico che mostra spesa dello Stato, governi, leggi di bilancio, promesse elettorali e costo delle misure (previsto contro effettivo) dal 1946 a oggi. Pubblica solo dati con fonte verificabile e livello di verifica dichiarato, con le stesse regole per ogni governo e partito.

## Diagramma logico
```
 fonti ufficiali (Camera, Senato, Normattiva, ISTAT, RGS/BDAP, Banca d'Italia, siti dei partiti)
        │  ricerca + verifica a più livelli (agenti e controllo umano), D-010
        ▼
 .claude/project/research/*.csv        ← dati grezzi verificati, con note e fonti riga per riga
        │  npm run data:import  (scripts/data/import-research.ts, schemi zod)
        ▼
 data/*.json, data/serie/*.json        ← snapshot versionato in git (DATA_SNAPSHOT)
        ▲
        │  npm run data:update = data:fetch (API Eurostat, Banca d'Italia → data/raw/ + manifest)
        │                       + data:finance (5 controlli incrociati → data/finanza-pubblica.json), D-016
        │  import statico, validazione zod a build time (src/server/data.ts)
        ▼
 Next.js 16 App Router, tutte le pagine prerenderizzate (ensureStatic "navigation")
        │
        ▼
 hosting statico/CDN — nessun DB, nessun cookie, nessun form, nessuna analytics
```

## Componenti chiave
### 1. Ricerca e verifica (`.claude/project/research/`)
- Note datate e CSV con colonne di fonte, archivio e stato di verifica. Ogni CSV passa per un verificatore indipendente prima di entrare in `data/`.
- Registro fonti R-01…R-36 nella nota di sintesi; licenza e regole di riuso per fonte.

### 2. Import (`scripts/data/`)
- `import-research.ts`: script Node con type-stripping nativo, nessuna rete: legge solo i CSV locali.
- `fetch-public-finance.ts`: unico script con rete. Scarica i conti pubblici così come arrivano in `data/raw/` (manifest con URL, data, sha256).
- `build-public-finance.ts`: dai grezzi a `data/finanza-pubblica.json`; si ferma se un controllo incrociato fallisce.
- Converte i livelli testuali in V1/V2/NV (record = livello più basso dei campi), mappa i governi proponenti, segnala le attribuzioni inferite.
- Fallisce se un record non passa lo schema zod.

### 3. Dominio (`src/lib/`)
- `domain/schemas.ts`: schemi zod condivisi fra import e app.
- `money.ts`, `format.ts`, `csv.ts`: funzioni pure, testate con vitest.
- `domain/integrity.test.ts`: invarianti sui dati (riferimenti, sovrapposizioni, un solo governo in carica).
- `domain/finance.ts`: scontrino per residente, debito durante un governo, debito/PIL, euro 2025. `domain/archive.ts`: normalizzazione e ricerca dell'archivio.

### 4. Accesso ai dati server-only (`src/server/`)
- `data.ts` importa i JSON e li valida; `stats.ts` e `finance.ts` calcolano i numeri delle pagine; `archive.ts` costruisce l'indice dell'archivio. Nessun I/O a runtime.

### 5. UI (`src/app/`, `src/components/`)
- Server Components statici. Due client component, isolati: `line-chart.tsx` (grafico SVG con crocino e tastiera; titolo, fonte e tabella stanno nel server component `chart-figure.tsx`) e `archive-search.tsx` (carica `/archivio/indice.json`, route GET prerenderizzata).
- Badge di verifica, link alle fonti, scontrino per residente in home. Palette neutra (D-011).

## Flussi principali
1. **Aggiornamento dati:** nuova ricerca o correzione → CSV aggiornato → verifica indipendente → `npm run data:import` → test di integrità → build → deploy. Ogni correzione pubblicata va nel registro `/correzioni`.
2. **Conti pubblici:** `npm run data:update` → test → build → deploy. È il binario 1 della routine su cloud (D-018): automatico solo se tutti i controlli passano.
3. **Campagna in corso:** censimento periodico delle promesse per partito (gruppi A/B/C) → verifica L2 per gruppo → controllo di simmetria fra gruppi → import. Congelamento 15 giorni prima del voto.

## Struttura repo
```
data/              # snapshot JSON generati (non modificare a mano)
data/raw/          # copie grezze delle API ufficiali + manifest
scripts/data/      # import dai CSV di ricerca, download e build dei conti pubblici
src/
  app/             # route: /, /spesa, /governi, /governi/[id], /leggi-di-bilancio, /promesse, /misure, /archivio (+ indice.json), /metodo, /fonti, /chi-siamo, /correzioni, /note-legali
  server/          # accesso dati server-only e statistiche
  components/      # UI condivisa
  lib/             # utility pure, schemi zod, test
```
