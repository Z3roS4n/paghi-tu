# Integrazioni esterne — Paghi Tu

> **Norma di progetto (obbligatoria):** ogni API di terze parti, ogni webhook (in entrata o in uscita) e ogni servizio esterno integrato **deve** essere documentato qui, in `.claude/integrations/`, **contestualmente** all'integrazione (stesso incremento). Un'integrazione non documentata è incompleta.
>
> Ogni scheda contiene: scopo · base URL/SDK e versione · autenticazione · variabili d'ambiente · endpoint/metodi con shape request/response · webhook (endpoint nostro, verifica firma, eventi, mapping) · file nel codice · gestione errori e gating · costi · note/TODO.

## Registro integrazioni

| Integrazione | Tipo | Stato | Scheda |
|---|---|---|---|
| Vercel | hosting statico | ✅ attiva (produzione pubblica dal 2026-10-21) | [vercel.md](vercel.md) |
| Resend | email di segnalazione della routine | 🟡 script pronto; routine attive, configurazione e consegna email non verificate da questo checkout | [resend.md](resend.md) |
| Eurostat (SDMX) | dati dei conti pubblici, senza chiave | ✅ attiva (pipeline `data:update`) | [eurostat.md](eurostat.md) |
| Banca d’Italia | debito mensile TCCE0325, senza chiave | ✅ pipeline `data:update` | [banca-d-italia.md](banca-d-italia.md) |
| Internet Archive (Wayback) | copie d'archivio delle fonti | 🟡 ricerca delle copie attiva; nuove catture in attesa di permesso | [internet-archive.md](internet-archive.md) |
| Vertex AI Search (Discovery Engine) | agente conversazionale con citazioni | 🟡 proposta (D-026), non collegata | [vertex-ai-search.md](vertex-ai-search.md) |

## Webhook e gating
Nessun webhook in entrata. Il sito legge snapshot locali; i download non avvengono a runtime. Resend è usato solo dallo script di notifica, che fallisce esplicitamente se mancano le sue variabili. La presenza delle routine non prova la configurazione o la consegna delle email: verifica presso il titolare, senza invii di test automatici.

Nuova scheda: `/integration <nome servizio>` oppure `node .claude/scripts/new-integration.mjs "Nome"`.
