# Vertex AI Search (Discovery Engine)

> Agente conversazionale che risponde solo dai dati del sito, con citazioni (D-026). **Gated**: senza `AGENT_ENABLED=1` la route risponde 503 e non chiama Google Cloud. **Stato: decisa il 2026-10-25, non collegata.** Nessuna route, nessun widget e nessun dato importato; la scheda c'è perché D-023 la chiede prima del collegamento.

## Scopo
Rispondere a domande sui dati di Paghi Tu (governi, leggi di bilancio, misure, serie, promesse) citando ogni volta il record e la sua fonte. Le cifre vengono solo dai record citati, le promesse solo verbatim; senza una citazione verificabile l'agente si astiene e manda alla pagina del sito. Il golden set in `agent/evals/` misura questo comportamento prima di qualsiasi rilascio.

## Base URL / SDK e versione
- REST `https://eu-discoveryengine.googleapis.com/v1`, location `eu`, progetto Google Cloud `paghi-tu-agent`.
- SDK da scegliere quando si scrive la route (`@google-cloud/discoveryengine` oppure `fetch` diretto): da decidere.

## Autenticazione
Workload Identity Federation con l'OIDC di Vercel su un service account di runtime che ha solo `roles/discoveryengine.viewer` e nessuna chiave. Serve il team e il progetto Vercel del titolare per configurare il pool. Ripiego, solo se la federazione non funziona: chiave JSON nelle env di Vercel, ruotata a fine progetto.

## Variabili d'ambiente
```
AGENT_ENABLED=          # 1 accende la route; qualsiasi altro valore = 503
GCP_PROJECT_ID=
GCP_PROJECT_NUMBER=
GCP_WORKLOAD_IDENTITY_POOL_ID=
GCP_WORKLOAD_IDENTITY_POOL_PROVIDER_ID=
GCP_SERVICE_ACCOUNT_EMAIL=
VERTEX_ENGINE_ID=
```
Nessuna di queste ha il prefisso `NEXT_PUBLIC_`.

## Endpoint / metodi usati
| Metodo | Path | Request | Response |
|---|---|---|---|
| POST | `/projects/{p}/locations/eu/collections/default_collection/engines/{e}/servingConfigs/default_search:answer` | `{ query: { text }, answerGenerationSpec }` | `{ answer: { answerText, citations[], references[] } }` |

La forma esatta di citazioni e riferimenti va confermata sull'indice vero (fase 3 della roadmap dell'agente) prima di scrivere il validatore.

## Webhook
Nessuno.

## File nel codice
- `agent/evals/`: golden set e verifica contro le fonti (presenti).
- `agent/ingest`, `agent/setup`, route `/api/agent` e widget: da scrivere.

## Gestione errori e gating
- `AGENT_ENABLED` diverso da `1`: 503, nessuna chiamata.
- Risposta senza citazioni o con una cifra che non sta in un record citato: astensione con il link alla pagina, mai la risposta del modello.
- Errori o timeout di Google Cloud: astensione con il link alla pagina e log senza il testo della domanda.

## Costi
Pagati da un credito promozionale Google Cloud del co-maintainer, con budget mensile e avvisi sul solo progetto, quota delle richieste conversazionali ridotta a 30 al minuto e un tetto giornaliero di risposte nella route. Il costo reale per query si misura in fase 3 dal report di fatturazione.

## Note / TODO
- Riga in `/privacy` aggiunta il 2026-10-25 (sezione 6, assistente «non ancora attivo»). Prima del collegamento: togliere «non ancora attivo», aggiornare «In breve» (il widget è un modulo), disclosure AI nella pagina, accordo art. 28 fra titolare e co-maintainer che gestisce il progetto Google Cloud.
- I casi con fonte «con_permesso» (UPB, Pagella Politica) entrano nell'indice solo con una decisione scritta. Wikipedia è esclusa (D-026, 2026-10-25).
