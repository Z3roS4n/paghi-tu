# Export per l'indice dell'agente

Trasforma i dati del sito nei documenti che l'agente può citare (D-030). Non va in rete e non carica niente su Google Cloud.

```bash
npm run ingest:build                 # scrive out/documenti.jsonl (non committato) e manifest.json
npx vitest run agent/ingest          # criteri 1.2-1.5 della fase 1 e controlli contro il golden set
```

| File | Cosa fa |
| --- | --- |
| `export.ts` | funzione pura: dai dati ai documenti, con lo schema `IndexDocument` |
| `load.ts` | legge `data/` |
| `build.ts` | scrive l'export e il manifest |
| `manifest.json` | conteggi per dataset, sha256 del JSONL, record esclusi con il motivo |

Ogni riga del JSONL è `{ "id", "structData" }`. `structData.dataset` e `structData.record` sono le stesse chiavi di `citazioniAttese` nel golden set. D-026 (confermata il 28 ottobre 2026): i valori UPB già pubblicati sul sito entrano con i link, senza testo UPB copiato; Pagella Politica resta esclusa. Tolti dai documenti: gli URL di Wikipedia e le note di ricerca delle promesse.
