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

La forma esatta di citazioni e riferimenti va confermata sull'indice vero (fase 3 della roadmap dell'agente). Il validatore (D-031, `agent/answer/answer.ts`) lavora su una forma propria, `AgentAnswer`: in fase 3 serve un adattatore dalla risposta di `:answer` a quella forma.

## Webhook
Nessuno.

## File nel codice
- `agent/evals/`: golden set e verifica contro le fonti (presenti).
- `agent/ingest/`: export dei documenti per l'indice e manifest (D-030, presente, non carica niente).
- `agent/setup`, import nel data store, route `/api/agent` e widget: da scrivere.

## Gestione errori e gating
- `AGENT_ENABLED` diverso da `1`: 503, nessuna chiamata.
- Risposta senza citazioni o con una cifra che non sta in un record citato: astensione con il link alla pagina, mai la risposta del modello.
- Errori o timeout di Google Cloud: astensione con il link alla pagina e log senza il testo della domanda.

## Costi
Pagati da un credito promozionale Google Cloud del co-maintainer, con budget mensile e avvisi sul solo progetto, quota delle richieste conversazionali ridotta a 30 al minuto e un tetto giornaliero di risposte nella route. Il costo reale per query si misura in fase 3 dal report di fatturazione.

## Note / TODO
- Domande di trasparenza («sto parlando con una persona?», «da dove prendi i numeri?»): testo fisso nella route, con la disclosure AI, perché il validatore blocca le risposte senza citazioni (D-031).
- Riga in `/privacy` aggiunta il 2026-10-25 (sezione 6, assistente «non ancora attivo»). Prima del collegamento: togliere «non ancora attivo», aggiornare «In breve» (il widget è un modulo), disclosure AI nella pagina, accordo art. 28 fra titolare e co-maintainer che gestisce il progetto Google Cloud.
- Casi con fonte «con_permesso» (D-026, confermata dal titolare il 2026-10-28): i 7 casi con fonte UPB (Quota 100, Superbonus, Bonus 80 euro, salvaguardie esodati, esonero contributivo 2015, MAN-TRAP-02) entrano nell'indice come sul sito, cioè con i valori di Paghi Tu e il link alla fonte UPB in `urlAccettati`, mai testo UPB copiato. Se l'UPB chiede di toglierli, si tolgono (voce in `agent/evals/esclusi.json` e record fuori dall'export). Pagella Politica resta fonte di controllo e confronto, mai copia; se un suo caso arriva, lo decide il titolare. Wikipedia è esclusa (D-026, 2026-10-25).

## Aggiornamento Preview — 31 ottobre 2026

Il precedente stato proposta/non collegata è storico: il core è stato provato su Vertex nelle eval precedenti. La nuova API Preview è implementata ma il suo wiring cloud resta PENDING ANTONIO. `agent/runtime/` usa il trasporto di `src/server/agent/`, con identità Vercel federata e nessuna credenziale locale in produzione. Endpoint Discovery Engine europei search/answer; nessun webhook. Flag, cap e intento persistente precedono ogni fetch; nessun retry automatico, esiti incerti fermano il sistema. Indice e attesi non sono modificati. Il replay delle registrazioni non prova nuove query live o sintesi conversazionale. [Report](../project/reports/2026-10-31-preview-integration.md), [runbook](../project/reports/2026-10-31-preview-wiring.md).


## Aggiornamento indice — 31 ottobre 2026

D-043 aggiunge aggiornamento opt-in dopo i commit dati verificati: list, import INCREMENTAL, delete degli esclusi, polling operations e Search di readiness. WIF GitHub e SA sync separati dal viewer Vercel. Durante refresh control sospeso; hash del bundle deve coincidere con stamp verificato. Integrazione preparata, nessun apply/trigger live in sessione; vedere runbook index-refresh.

[Runbook aggiornamento](../project/reports/2026-10-31-index-refresh.md).
