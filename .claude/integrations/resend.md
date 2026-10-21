# Resend

> Email di segnalazione della routine di aggiornamento (D-018). **Gated**: senza `RESEND_API_KEY`, `PAGHITU_NOTIFY_TO` e `PAGHITU_NOTIFY_FROM` lo script esce con codice 2 e non tocca il sito.

## Scopo
Ogni esecuzione della routine manda al titolare un riepilogo: cosa è stato aggiornato e pubblicato, cosa è stato bloccato da un controllo o dall'agente verificatore, e perché. Il sito non manda email ai visitatori e non ha form.

## Base URL / SDK e versione
- REST `https://api.resend.com`, nessun SDK (solo `fetch` di Node 24).

## Autenticazione
Bearer con chiave API Resend. Il mittente deve essere su un dominio verificato nell'account Resend usato (il servizio email di chi gestisce il progetto, oppure il dominio di Paghi Tu quando ci sarà).

## Variabili d'ambiente
```
RESEND_API_KEY=
PAGHITU_NOTIFY_TO=      # destinatari separati da virgola: solo nei segreti della routine
PAGHITU_NOTIFY_FROM=    # per esempio "Paghi Tu <routine@dominio-verificato>"
```
Il repo è pubblico: destinatario, mittente e chiave non vanno mai in file versionati, log o report.

## Endpoint / metodi usati
| Metodo | Path | Request | Response |
|---|---|---|---|
| POST | `/emails` | `{ from, to[], subject, text }` | `{ id }` |

## Webhook
Nessuno.

## File nel codice
- `scripts/notify.ts` — `node scripts/notify.ts "<oggetto>" <file | ->`

## Gestione errori e gating
- Variabili mancanti: codice 2 e messaggio con i nomi delle variabili, mai i valori.
- Risposta non 2xx: codice 1 con lo stato e il corpo della risposta di Resend.
- Timeout 30 s. Se la segnalazione fallisce, la routine lo scrive nel report del giorno.

## Costi
La routine manda una o due email al giorno: basta il piano gratuito di Resend (limiti da ricontrollare sul listino al momento dell'attivazione).

## Note / TODO
- Da configurare sull'account dove girerà la routine (non questo).
