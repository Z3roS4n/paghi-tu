# Vercel

> Hosting del sito statico e statistiche di visita (Vercel Web Analytics, dal 2026-10-21). L'app non chiama API Vercel e non usa variabili d'ambiente.

## Scopo
Build (`next build`) e distribuzione delle 83 pagine prerenderizzate su CDN.

## Progetto
- Team: `msworks-project`. Progetto: `paghi-tu` (`.vercel/project.json`, non versionato).
- Produzione: https://www.paghitu.it. Pubblica: il titolare ha scelto di lasciarla visibile, il 2026-10-21.
- I deploy successivi sono anteprime protette da login Vercel, salvo `--prod`. Gli URL di anteprima contengono il nome del team.
- Il primo deploy (2026-10-21) è andato in produzione in automatico, perché era il primo del progetto.

## Deploy
- **Il repo GitHub `Z3roS4n/paghi-tu` è collegato al progetto** (verificato il 2026-10-24): ogni push su `main` va
  in produzione da solo, gli altri branch e le PR diventano anteprime protette da login. Unire una PR la pubblica
  subito. Lo stato del deploy compare sul commit in GitHub (contesto `Vercel`).
- CLI, solo per casi particolari: `npx vercel@64.7.0 deploy --yes` per un'anteprima, aggiungendo `--prod` per la produzione. Va lanciata dalla radice del repo.
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
- **Web Analytics (attiva dal 2026-10-21, D-023):** pacchetto `@vercel/analytics@2.0.1`, componente `src/components/site-analytics.tsx` nel layout, con `beforeSend` che toglie query string e ancora dall'URL (la ricerca dell'archivio mette il testo cercato in `?q=`). Senza cookie, visitatore riconosciuto da un hash scartato dopo 24 ore, solo dati aggregati (doc Vercel «Privacy and Compliance»). Va abilitata anche dalla dashboard: progetto `paghi-tu` → Analytics → Enable; finché non lo è, lo script non registra niente. Descritta in `/privacy`: se cambia la configurazione, aggiornare l'informativa nello stesso commit.
- Trasferimenti: Vercel è certificata EU-U.S. Data Privacy Framework e usa le clausole contrattuali standard (kb «Is Vercel certified under DPF?», docs «Security & Compliance»). Il Data Processing Addendum è su vercel.com/legal/dpa: verificare che copra il piano del team.

## Preview protetta assistente — 31 ottobre 2026

Integrazione implementata localmente, wiring PENDING ANTONIO. SDK `@vercel/oidc` 4.0.5; token server scambiato con Google STS, claim owner_id/project_id/environment fissati, issuer/audience esatti. Deployment Protection nativa obbligatoria su pagina e API; verifica anonima distinta dalla risposta applicativa 503. Solo env Preview, nessun seat aggiuntivo, nessun deploy `--prod`. UI di test, design finale Antonio. [Env, setup, stress e rollback](../project/reports/2026-10-31-preview-wiring.md). Nessun webhook nuovo.
