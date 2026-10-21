# Internet Archive (Wayback Machine)

> Copia d'archivio di ogni fonte delle promesse (D-005, D-019). **Gated**: senza `--save` lo script cerca solo copie già esistenti e non scrive niente su Internet Archive.

## Scopo
Una pagina di partito o un articolo può cambiare o sparire. Ogni promessa pubblicata deve avere, accanto alla fonte, una copia datata dal giorno della dichiarazione in poi.

## Base URL / SDK e versione
- CDX API `https://web.archive.org/cdx/search/cdx` (lettura).
- Save Page Now `https://web.archive.org/save/<url>` (scrittura: chiede una cattura nuova).

## Autenticazione
Nessuna (accesso anonimo). User agent dichiarato `PaghiTu-archivio/1.0`.

## Variabili d'ambiente
Nessuna.

## Endpoint / metodi usati
| Metodo | Path | Request | Response |
|---|---|---|---|
| GET | `/cdx/search/cdx` | `url`, `from=AAAAMMGG`, `filter=statuscode:200`, `limit=1`, `output=json` | `[[intestazione], [timestamp]]` o `[]` |
| GET | `/save/<url>` | — | redirect o `content-location` con `/web/<timestamp>/<url>` |

## Webhook
Nessuno.

## File nel codice
- `scripts/data/archive-sources.ts` — `node scripts/data/archive-sources.ts [--save]`; scrive l'URL della copia nella colonna `archivio_url` dei CSV di ricerca, poi `npm run data:import`.

## Gestione errori e gating
- Una richiesta alla volta, 20 s di pausa fra due catture; su 429 attende 2 minuti e riprova una volta.
- Le fonti senza copia restano «da archiviare» e lo script esce con codice 1, così la routine lo segnala.
- Le pagine di elenco (per esempio `…/news-e-media/12`) cambiano contenuto nel tempo: una cattura tardiva può non contenere più la dichiarazione. Il verificatore controlla che la copia contenga la citazione.

## Costi
Gratuito.

## Note / TODO
- 2026-10-21: trovate 6 copie esistenti; 97 fonti ancora senza copia, in attesa del permesso del titolare per lanciare `--save`.
