# Paghi Tu

**Quanto spende lo Stato con i nostri soldi?** Paghi Tu mette in fila, con la fonte accanto a ogni numero, la spesa pubblica italiana per residente, i conti durante ogni governo, le leggi di bilancio, il costo previsto ed effettivo delle misure e le promesse dei partiti per le politiche 2027.

Sito: https://www.paghitu.it

## Un progetto aperto

- **Apartitico.** Stesso metodo, stessa profondità e stesse regole per ogni governo e ogni partito. Niente classifiche, giudizi o indicazioni di voto.
- **Ogni dato ha una fonte** e un livello di verifica (V1 fonte primaria, V2 verifica parziale, NV da verificare).
- **Aggiornato dall'AI, corretto da tutti.** Una routine di agenti AI aggiorna dati e fonti ogni giorno; un secondo agente ricontrolla tutto sulle fonti prima della pubblicazione. Chiunque può segnalare un errore o proporre una correzione: ogni modifica a un dato pubblicato resta nel [registro delle correzioni](https://www.paghitu.it/correzioni).

Hai trovato un errore? [Apri una correzione](https://github.com/Z3roS4n/paghi-tu/issues/new?template=correzione.yml). Vuoi contribuire al codice o ai dati? Leggi [CONTRIBUTING.md](CONTRIBUTING.md).

## Da dove vengono i dati

| Dato | Fonte |
|---|---|
| Spesa, entrate, saldo, interessi (dal 1995) | Eurostat `gov_10a_main`, `gov_10a_exp`, `gov_10dd_edpt1` |
| Debito pubblico mensile (dal 1861) | Banca d'Italia, tavola TCCE0325 |
| Governi e legislature | dati.camera.it |
| Leggi di bilancio | Normattiva |
| Popolazione, PIL storico, prezzi | ISTAT, Banca d'Italia |
| Promesse elettorali | canali ufficiali dei partiti, interviste pubblicate dalle testate |

Il dettaglio di ogni fonte, con licenza e condizioni di riuso, è nella pagina [Fonti](https://www.paghitu.it/fonti); il metodo in [Metodo](https://www.paghitu.it/metodo).

## Come è fatto

- Next.js 16 (App Router, tutto statico), React 19, Tailwind 4, zod, vitest. Node ≥ 24.
- `scripts/data/` scarica e trasforma i dati: le copie grezze stanno in `data/raw/` con un manifest (URL, data, sha256); i JSON in `data/` sono generati, non si modificano a mano.
- Le note di ricerca e di verifica, i CSV delle promesse e le decisioni di progetto sono in `.claude/project/` (vedi `02-tradeoffs.md`).

```bash
npm ci
npm run dev            # sito in locale
npm run data:update    # riscarica e ricostruisce i conti pubblici (con 5 controlli incrociati)
npm run data:import    # rigenera i JSON dai CSV di ricerca
npm run typecheck && npm run lint && npm test && npm run build
```

## Licenza

Codice con licenza [MIT](LICENSE). I dati restano soggetti alla licenza di ciascuna fonte, indicata nella pagina Fonti.
