# Vercel

> Hosting del sito statico. Non è un'integrazione a runtime: l'app non chiama API Vercel e non usa variabili d'ambiente.

## Scopo
Build (`next build`) e distribuzione delle 83 pagine prerenderizzate su CDN.

## Progetto
- Team: `msworks-project`. Progetto: `paghi-tu` (`.vercel/project.json`, non versionato).
- Produzione: https://www.paghitu.it. Pubblica: il titolare ha scelto di lasciarla visibile, il 2026-10-21.
- I deploy successivi sono anteprime protette da login Vercel, salvo `--prod`. Gli URL di anteprima contengono il nome del team.
- Il primo deploy (2026-10-21) è andato in produzione in automatico, perché era il primo del progetto.

## Deploy
- CLI: `npx vercel@64.7.0 deploy --yes` per un'anteprima, aggiungendo `--prod` per la produzione. Va lanciata dalla radice del repo.
- La build NON esegue `npm run data:import`: pubblica i `data/*.json` così come sono nel working tree. Prima di un deploy, rigenerarli e committarli.
- `.vercelignore` esclude `.claude/`, `scripts/`, i file `.md` (tranne README) e `.env*`.

## Autenticazione
- Login CLI dell'account del titolare. `vercel link` ha creato `.env.local` con un `VERCEL_OIDC_TOKEN`: è escluso da git (`.env*`) e dall'upload.

## Variabili d'ambiente
Nessuna richiesta dall'app.

## Endpoint / webhook
Nessuno.

## Costi
Piano del team `msworks-project`. Sito statico senza funzioni a runtime.

## Note / TODO
- Dominio proprio (OA-1, `paghitu.it` candidato) da collegare dopo l'acquisto.
- CI: valutare il collegamento al repository Git, così da avere un deploy a ogni push dopo lint, test e build.
- Analytics Vercel: NON attivarle. La pagina note legali dichiara che il sito non raccoglie statistiche che identificano i visitatori.
