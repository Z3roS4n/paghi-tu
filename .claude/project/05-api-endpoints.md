# Paghi Tu — Endpoint pubblici

> **Ultimo aggiornamento:** 31 ottobre 2026 · **da:** Codex (su mandato Giovanni)

Il sito su main non espone server actions, webhook, cron HTTP o API di scrittura. Le routine operano sul repository, non tramite endpoint del sito. L’assistente nelle PR #6–#8 è separato da questa baseline pubblica.

| Metodo | Path | Scopo | Protezione |
|---|---|---|---|
| GET | `/archivio/indice.json` | indice JSON prerenderizzato da `archiveEntries()` in `src/server/archive.ts` | pubblico, dati del sito |
| GET | `/robots.txt` | indicazioni ai crawler e URL sitemap | pubblico |
| GET | `/sitemap.xml` | pagine pubbliche e dettagli dei governi | pubblico |

L’archivio carica l’indice via GET e filtra lato client; nessuna mutazione né autenticazione. L’indice è un array di voci costruite dal modulo server, non un servizio di ricerca remoto. Percorsi inesistenti restituiscono 404. Nessuna convenzione webhook o variabile `CRON_SECRET` da configurare.

## POST `/api/agent` — Preview soltanto (31 ottobre 2026)

Body JSON strict, massimo 4096 byte: `{action:'ask',question,requestId,conversationId?}` oppure `{action:'reset',requestId,conversationId}`. Domanda 1–300 caratteri, requestId UUID; conversationId generato dal server e subordinato al cookie `__Host-paghi-agent` HttpOnly/Secure/SameSite=Strict/Path=/, durata 1800s. Origine esatta configurata, nessun Host fidato dal client. Risposta ask: `{requestId,conversationId,text,abstention,mode,notice?,sources:[{id,title,url,pageUrl,verification}]}`; reset `{reset:true}`. Errori fissi `{error:{code,message},requestId?}` senza dati provider o domande nei log. Nessun retry automatico.

Flag off o ambiente produzione: 503 prima di WIF/Firestore. Le operazioni ammesse condividono stato persistente: deduplica requestId, reset/versione contesto, cap UTC, lease globale e halt per esiti incerti. I test locali coprono queste condizioni con dipendenze iniettate; la prova cloud resta pendente. [Operazioni e rollback](reports/2026-10-31-preview-wiring.md).
