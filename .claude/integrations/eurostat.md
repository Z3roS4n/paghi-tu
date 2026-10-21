# Eurostat (API SDMX 2.1)

> Fonte dei conti pubblici: spesa, entrate, saldo, interessi, spesa per funzione, debito/PIL, trimestri e confronto UE. Nessuna chiave: se il download fallisce, `npm run data:update` si ferma e il sito resta con i dati dell'ultimo aggiornamento riuscito.

## Scopo
Scaricare le tavole ufficiali delle amministrazioni pubbliche (settore S13) che alimentano `data/finanza-pubblica.json` (D-016, D-022).

## Base URL / SDK e versione
- REST `https://ec.europa.eu/eurostat/api/dissemination/sdmx/2.1/data/<dataflow>/<chiave>?format=SDMX-CSV`, `fetch` di Node, nessun SDK.

## Autenticazione
Nessuna. User-Agent `paghi-tu-data-pipeline`.

## Variabili d'ambiente
Nessuna.

## Endpoint / metodi usati
| Dataflow | Chiave | Uso |
|---|---|---|
| `gov_10a_main` | `A.MIO_NAC+PC_GDP.S13.TE+TR+B9+D41PAY.IT` | conti annuali Italia dal 1995 |
| `gov_10a_exp` | `A.MIO_NAC.S13.<COFOG>.TE.IT` | spesa per funzione Italia |
| `gov_10dd_edpt1` | `A.MIO_NAC+PC_GDP.S13.GD.IT` | debito e debito/PIL Italia |
| `gov_10q_ggnfa` | `Q.MIO_EUR.NSA.S13.TE+TR+B9+D41PAY.IT`, dal 2019-Q1 | trimestri non destagionalizzati (stesso periodo contro stesso periodo) |
| `gov_10a_exp` | `A.PC_GDP.S13.TOTAL+GF04+GF07+GF09+GF0107+GF1002+GF1003.TE.IT+DE+FR+ES+EU27_2020`, dal 2019 | confronto UE per funzione |
| `gov_10a_main` | `A.PC_GDP.S13.TE+TR+B9+D41PAY.<paesi>`, dal 2019 | confronto UE dei conti |
| `gov_10dd_edpt1` | `A.PC_GDP.S13.GD.<paesi>`, dal 2019 | confronto UE del debito |

Risposta: CSV SDMX con `TIME_PERIOD`, `OBS_VALUE`, `OBS_FLAG` (il flag «b» segna una rottura di serie).

## Webhook
Nessuno.

## File nel codice
- `scripts/data/fetch-public-finance.ts` — download, copie grezze in `data/raw/eurostat/` e manifest con sha256
- `scripts/data/build-public-finance.ts` — parsing, 7 controlli incrociati, scrittura di `data/finanza-pubblica.json`

## Gestione errori e gating
HTTP diverso da 200 → errore e stop. Un controllo incrociato fallito → nessun file scritto. Il confronto UE usa l'ultimo anno in cui tutti i paesi hanno il dato.

## Costi
Gratuita. Riutilizzo libero con citazione della fonte (politica di riuso Eurostat).

## Note
- `MIO_NAC` per le serie lunghe (prima del 1999 `MIO_EUR` usa i cambi ECU dell'anno); i trimestri partono dal 2019 e usano `MIO_EUR`.
- La spesa per funzione dell'anno precedente esce di solito a febbraio.
