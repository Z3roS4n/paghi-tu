# Paghi Tu — Endpoint pubblici

> **Ultimo aggiornamento:** 31 ottobre 2026 · **da:** Codex (su mandato Giovanni)

Il sito su main non espone server actions, webhook, cron HTTP o API di scrittura. Le routine operano sul repository, non tramite endpoint del sito. L’assistente nelle PR #6–#8 è separato da questa baseline pubblica.

| Metodo | Path | Scopo | Protezione |
|---|---|---|---|
| GET | `/archivio/indice.json` | indice JSON prerenderizzato da `archiveEntries()` in `src/server/archive.ts` | pubblico, dati del sito |
| GET | `/robots.txt` | indicazioni ai crawler e URL sitemap | pubblico |
| GET | `/sitemap.xml` | pagine pubbliche e dettagli dei governi | pubblico |

L’archivio carica l’indice via GET e filtra lato client; nessuna mutazione né autenticazione. L’indice è un array di voci costruite dal modulo server, non un servizio di ricerca remoto. Percorsi inesistenti restituiscono 404. Nessuna convenzione webhook o variabile `CRON_SECRET` da configurare.
