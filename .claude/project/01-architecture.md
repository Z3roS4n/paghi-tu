# Paghi Tu — Architettura

> Ultimo aggiornamento: 2026-10-20. Documento vivo: aggiornare a ogni decisione architetturale.

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
- Script Node con type-stripping nativo, nessuna rete: legge solo i CSV locali.
- Converte i livelli testuali in V1/V2/NV (record = livello più basso dei campi), mappa i governi proponenti, segnala le attribuzioni inferite.
- Fallisce se un record non passa lo schema zod.

### 3. Dominio (`src/lib/`)
- `domain/schemas.ts`: schemi zod condivisi fra import e app.
- `money.ts`, `format.ts`, `csv.ts`: funzioni pure, testate con vitest.
- `domain/integrity.test.ts`: invarianti sui dati (riferimenti, sovrapposizioni, un solo governo in carica).

### 4. Accesso ai dati server-only (`src/server/`)
- `data.ts` importa i JSON e li valida; `stats.ts` calcola i numeri della home. Nessun I/O a runtime.

### 5. UI (`src/app/`, `src/components/`)
- Server Components statici; nessun client component finora.
- Badge di verifica, link alle fonti, scontrino della home. Palette neutra (D-011).

## Flussi principali
1. **Aggiornamento dati:** nuova ricerca o correzione → CSV aggiornato → verifica indipendente → `npm run data:import` → test di integrità → build → deploy. Ogni correzione pubblicata va nel registro `/correzioni`.
2. **Campagna in corso:** censimento periodico delle promesse per partito (gruppi A/B/C) → verifica L2 per gruppo → controllo di simmetria fra gruppi → import. Congelamento 15 giorni prima del voto.

## Struttura repo
```
data/              # snapshot JSON generati (non modificare a mano)
scripts/data/      # import dai CSV di ricerca
src/
  app/             # route: /, /governi, /governi/[id], /leggi-di-bilancio, /metodo, /fonti, /chi-siamo, /correzioni, /note-legali
  server/          # accesso dati server-only e statistiche
  components/      # UI condivisa
  lib/             # utility pure, schemi zod, test
```
