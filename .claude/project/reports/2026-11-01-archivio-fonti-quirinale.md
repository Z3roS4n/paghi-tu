# Verifica delle fonti da un'altra rete (2026-11-01)

Seguito di `2026-11-01-correzioni-golden-set.md`. Il test «ogni URL atteso è stato letto» era rosso su tre fonti: le pagine dell'archivio del Quirinale su Leone e Saragat (HTTP 403) e la query SDMX ISTAT `RICPOPRES2011` (timeout). La verifica è stata ripetuta dalla rete di Giovanni con `npm run evals:verify -- --dump`, stesso golden set (sha256 `966204185176…`).

## Esito

- **Quirinale:** Leone, Saragat e Gronchi letti direttamente con HTTP 200. Il testo normalizzato di Gronchi coincide byte per byte con la copia del 31 ottobre, quindi il formato del dump è quello delle copie già archiviate.
- **ISTAT:** `esploradati.istat.it` non risponde da questa rete: connect timeout a 30 s su tutti e sette gli endpoint SDMX, non solo su `RICPOPRES2011`. È coerente con il blocco di connessione del 31 ottobre (D-004). Nessun'altra richiesta a ISTAT.
- Citazioni e valori dei casi coincidono con il registro della verifica precedente dello stesso giorno, caso per caso.

## File toccati

- `data/raw/agent-sources/quirinale-leone-20261101.txt`, `quirinale-saragat-20261101.txt`: copie integrali del testo normalizzato letto con HTTP 200, con l'URL in testa come per Gronchi.
- `agent/evals/fonti-archiviate.json`: due voci nuove, con sha256 della copia e lettura originale presa dal registro di questa verifica.

`verifica-fonti.json` resta quello della verifica precedente. Il registro di questa rete avrebbe 4 fonti ISTAT ko invece di una, quindi non è stato committato. Nessuna eccezione scritta.

## Verifiche

- `npx vitest run agent/evals`: 68/69. Resta rosso «ogni URL atteso è stato letto», con le stesse tre fonti: il test legge il registro, e le copie entrano in gioco solo alla prossima verifica.

## Prossimo

- Rilanciare `npm run evals:verify` da una rete che raggiunge ISTAT: Leone e Saragat passano dalla copia d'archivio se il Quirinale risponde ancora 403. Resta aperta solo `RICPOPRES2011`.
