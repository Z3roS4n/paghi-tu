# Paghi Tu — Bad practices (cosa NON fare)

> Lista viva. Ogni volta che un errore viene individuato in review, si aggiunge qui.

- ❌ `any` per zittire il compilatore. Usare `unknown` + narrowing.
- ❌ Logica di dominio dentro i componenti o le server actions.
- ❌ Import diretto del client DB fuori dal modulo dedicato.
- ❌ Segreti con prefisso pubblico (es. `NEXT_PUBLIC_`).
- ❌ Float sugli importi monetari. Usare un tipo decimale.
- ❌ Modificare lo schema DB fuori dal sistema di migrazione.
- ❌ Stringhe hardcoded sparse per testi/valori di dominio.
- ❌ Integrazione esterna senza scheda in `.claude/integrations/`.
- ❌ Task completato senza report in `reports/`.

### Next.js 16.x
- ❌ Scrivere Next "a memoria": verificare l'API in `node_modules/next/dist/docs/` della versione installata.
- ❌ Rimuovere il blocco `nextjs-agent-rules` da `AGENTS.md` (`next dev` lo ricrea): va committato.
- ❌ `middleware.ts` nei progetti nuovi → `proxy.ts` con funzione `proxy`.
- ❌ Accesso sincrono a `params`, `searchParams`, `cookies()`, `headers()`, `draftMode()`: sono async.
- ❌ `revalidateTag(tag)` a un argomento (deprecato) → `revalidateTag(tag, 'max')`, oppure
  `updateTag(tag)` nelle Server Actions quando serve read-your-writes.
- ❌ Dare per scontato il caching implicito di fetch/route (modello pre-16): con Cache Components
  si cachea solo ciò che è marcato `'use cache'`.
- ❌ `experimental.ppr`, `experimental.dynamicIO`, `export const experimental_ppr`: rimossi →
  `cacheComponents`.
- ❌ `images.domains`, `next/legacy/image`: deprecati → `images.remotePatterns`, `next/image`.
- ❌ Contare su `scroll-behavior: smooth` automatico: serve `data-scroll-behavior="smooth"` su `<html>`.

### Dati di finanza pubblica
- ❌ Eurostat in `MIO_EUR` per anni prima del 1999: converte le lire al cambio ECU dell'anno (debito 1995
  più basso del 7%). Usare `MIO_NAC`, che applica il tasso fisso di 1.936,27 come Banca d'Italia e ISTAT
  (scoperto dal controllo `debito-bdi-eurostat`, 2026-10-21).
- ❌ Trattare come zero un anno senza `OBS_VALUE`: è un dato mancante.
- ❌ Pubblicare un aggiornamento automatico se un controllo incrociato di `build-public-finance.ts` fallisce.
- ❌ Interrogare ISTAT da più processi insieme: limite di 5 query al minuto per IP, blocco di 1-2 giorni.

### Controlli sulle pagine generate
- ❌ Cercare «undefined» con un grep sull'HTML di `.next/`: i dati interni di React contengono `$undefined`
  su ogni pagina. Usare `npm run check:pages`, che guarda solo il testo visibile (2026-10-21).
- ❌ Lasciare marcatori di lavoro («INFERENZA», `V1✓`) nelle colonne mostrate in pagina: /fonti ne aveva
  quattro nella licenza e nella copertura, riformulati alla fonte (2026-10-21).
- ❌ Correggere a mano `data/fonti.json`: lo rigenera `npm run data:import` dalla tabella delle fonti in
  `research/2026-10-20.sintesi-e-verifica-incrociata.md`. Le correzioni di D-034 (R-01, R-04, R-07, R-12) e di R-17
  erano solo nel JSON e il primo import le avrebbe tolte; riportate nella tabella il 2026-10-29.
