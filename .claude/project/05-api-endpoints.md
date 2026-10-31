# Paghi Tu — API, actions & route handlers

> Convenzioni per mutazioni (server actions) e endpoint HTTP (route handlers).

## Principi
- Server actions = thin controller; la logica vive nei servizi (`src/server/services`).
- Route handlers solo per: webhook in ingresso, cron, download file, API pubblica.
- Validazione input con schema condiviso (stesso schema del form).

## Server actions
| Action | Input | Output | Servizio |
|---|---|---|---|
| `createX` | `{…}` | `{…}` | `services/x.ts` |

## Route handlers
| Metodo | Path | Scopo | Protezione |
|---|---|---|---|
| POST | `/api/webhooks/<provider>` | callback esterno | firma/secret |
| GET  | `/api/cron/<job>` | job schedulato | `Bearer CRON_SECRET` |

## Convenzioni errori
- Errori di dominio tipizzati; risposta HTTP coerente (400/401/403/404/409/500).
- Idempotenza per i webhook: transizioni di stato atomiche.

## POST `/api/agent` — Preview soltanto (31 ottobre 2026)

Body JSON strict, massimo 4096 byte: `{action:'ask',question,requestId,conversationId?}` oppure `{action:'reset',requestId,conversationId}`. Domanda 1–300 caratteri, requestId UUID; conversationId generato dal server e subordinato al cookie `__Host-paghi-agent` HttpOnly/Secure/SameSite=Strict/Path=/, durata 1800s. Origine esatta configurata, nessun Host fidato dal client. Risposta ask: `{requestId,conversationId,text,abstention,mode,notice?,sources:[{id,title,url,pageUrl,verification}]}`; reset `{reset:true}`. Errori fissi `{error:{code,message},requestId?}` senza dati provider o domande nei log. Nessun retry automatico.

Flag off o ambiente produzione: 503 prima di WIF/Firestore. Le operazioni ammesse condividono stato persistente: deduplica requestId, reset/versione contesto, cap UTC, lease globale e halt per esiti incerti. I test locali coprono queste condizioni con dipendenze iniettate; la prova cloud resta pendente. [Operazioni e rollback](reports/2026-10-31-preview-wiring.md).
