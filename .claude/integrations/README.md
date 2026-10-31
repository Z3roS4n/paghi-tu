# Integrazioni esterne — Paghi Tu

> **Norma di progetto (obbligatoria):** ogni API di terze parti, ogni webhook (in entrata o in uscita) e ogni servizio esterno integrato **deve** essere documentato qui, in `.claude/integrations/`, **contestualmente** all'integrazione (stesso incremento). Un'integrazione non documentata è incompleta.
>
> Ogni scheda contiene: scopo · base URL/SDK e versione · autenticazione · variabili d'ambiente · endpoint/metodi con shape request/response · webhook (endpoint nostro, verifica firma, eventi, mapping) · file nel codice · gestione errori e gating · costi · note/TODO.

## Registro integrazioni

| Integrazione | Tipo | Stato | Scheda |
|---|---|---|---|
| Vercel | hosting statico + API Preview protetta | ✅ attiva (produzione pubblica dal 2026-10-21) | [vercel.md](vercel.md) |
| Resend | email di segnalazione della routine | 🟡 pronta, da configurare sull'account della routine | [resend.md](resend.md) |
| Eurostat (SDMX) | dati dei conti pubblici, senza chiave | ✅ attiva (pipeline `data:update`) | [eurostat.md](eurostat.md) |
| Internet Archive (Wayback) | copie d'archivio delle fonti | 🟡 ricerca delle copie attiva; nuove catture in attesa di permesso | [internet-archive.md](internet-archive.md) |
| Vertex AI Search (Discovery Engine) | agente conversazionale con citazioni | 🟡 core verificato; nuova API Preview preparata, wiring Antonio pendente | [vertex-ai-search.md](vertex-ai-search.md) |

| Firestore | stato effimero e limiti Preview | 🟡 implementato, provisioning/verifica Antonio pendenti | [firestore.md](firestore.md) |

## Webhook in entrata (endpoint esposti dalla nostra app)

| Endpoint | Provider | Verifica | Scheda |
|---|---|---|---|
| `POST /api/webhooks/<x>` | <provider> | firma/secret | — |

## Gating / graceful degradation
Ogni integrazione è **opzionale a runtime**: senza le sue variabili d'ambiente l'app resta pienamente funzionante e la funzione appare disabilitata. Verifica con `isXxxConfigured()` per ciascuna.

Nuova scheda: `/integration <nome servizio>` oppure `node .claude/scripts/new-integration.mjs "Nome"`.
