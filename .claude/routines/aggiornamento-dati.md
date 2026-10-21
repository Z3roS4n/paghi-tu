# Routine — aggiornamento dati di Paghi Tu

> Istruzioni per l'agente schedulato su cloud (D-018, decisa dal titolare il 2026-10-21).
> **Ogni giorno.** Le modifiche vanno online subito, ma solo dopo la conferma di un secondo agente AI
> indipendente (il verificatore), che non ha scritto le modifiche e le ricontrolla sulle fonti.
> La routine gira su un account diverso da quello di sviluppo.
> Prerequisiti: clone del repo GitHub pubblico con permesso di push su `main`, progetto Vercel collegato,
> Node ≥ 24, segreti `RESEND_API_KEY`, `PAGHITU_NOTIFY_TO`, `PAGHITU_NOTIFY_FROM` (vedi
> `.claude/integrations/resend.md`).

## Regole fisse (valgono per ogni esecuzione)
1. Leggi `AGENTS.md`, `.claude/project/07-bad-practices.md` e `.claude/project/02-tradeoffs.md` (D-010, D-013, D-016, D-018, D-019).
2. Un solo processo interroga ISTAT, con al massimo 4 richieste al minuto. Se ISTAT non risponde, non riprovare in ciclo.
3. Niente Save Page Now, form, login o scritture su servizi esterni, a parte il repo, Vercel e Resend. Non aggirare 403, captcha o WAF. Le catture nuove su Internet Archive (`archive-sources.ts --save`) restano escluse finché il titolare non le autorizza in modo esplicito.
4. **Nei 15 giorni prima di un voto nazionale non si pubblicano contenuti nuovi su partiti e promesse**, solo correzioni di errori. Controlla la data del voto in `.claude/project/research/` prima del binario 2.
5. Il repo è pubblico: nessun dato personale del titolare, nessun segreto, nessun indirizzo email in file, commit, log o report. Commit con author `Thepro007002001@gmail.com` e nome «Paghi Tu», senza co-author, messaggi imperativi in inglese.
6. **Cancello del verificatore.** Prima di ogni push l'agente che ha fatto le modifiche passa il diff a un secondo agente, con contesto pulito, che:
   - riapre dalla fonte, con un formato o un percorso diverso dalla pipeline, ogni valore numerico cambiato (o almeno 5 a campione se sono più di 20) e ogni citazione nuova parola per parola;
   - controlla neutralità e simmetria fra partiti (stesse regole, stessa profondità);
   - risponde `CONFERMATO` oppure `RESPINTO` con i motivi riga per riga.
   Solo con `CONFERMATO` si fa push e deploy. Con `RESPINTO` le righe respinte restano fuori; se il verificatore respinge un dato numerico, non si pubblica niente del binario 1.

## Binario 1 — conti pubblici
1. `npm ci`
2. `npm run data:update`. Se `build-public-finance.ts` si ferma su un controllo incrociato: **non pubblicare**, segnalazione con l'output e stop.
3. Se `git diff --stat data/` è vuoto, il binario 1 finisce qui (lo dice la segnalazione del giorno).
4. `npm run typecheck && npm run lint && npm test && npm run build`. Se uno fallisce, segnalazione e stop.
5. Cancello del verificatore (regola 6).
6. Commit «Update public finance data to <ultimo periodo>».

## Binario 2 — promesse della campagna
1. Censimento sui canali ufficiali di **tutti** i partiti del catalogo, con lo stesso criterio (note `2026-10-21.controllo-simmetria-promesse.md` e `2026-10-21.uniformita-pre-pubblicazione.md`): righe nuove con `stato_verifica` «NUOVA da routine <data> — richiede verifica». Si registrano tutte le misure di un pacchetto, senza tetto per partito (D-019).
2. Un agente diverso fa la verifica L2 riga per riga (stesso schema di `2026-10-21.verifica-l2-righe-nuove.md`): citazione parola per parola sulla fonte, criterio slogan, livello in testa all'esito (`V1✓`, `V2✓`). Un'intervista pubblicata da una testata vale come fonte primaria (D-019). I tagli «[…]» non tolgono mai le parole con cui il proponente descrive un gruppo di persone.
3. Controllo di simmetria sulle righe nuove: stessa profondità per tutti i partiti. Se un partito non è stato controllato, nessuno viene pubblicato (D-013).
4. `node scripts/data/archive-sources.ts` (senza `--save`): cerca la copia d'archivio già esistente di ogni fonte nuova; il verificatore controlla che la copia contenga la citazione. Le fonti ancora senza copia vanno nella segnalazione del giorno.
5. `npm run data:import`, test, build. Le righe che non passano restano nei CSV e fuori dal sito.
6. Cancello del verificatore (regola 6), poi commit «Add verified campaign promises up to <data>».

## Pubblicazione
1. `git push origin main`, deploy in produzione (`npx --yes vercel@64.7.0 deploy --prod --yes`), controllo HTTP 200 di `/`, `/spesa`, `/governi`, `/promesse`, `/archivio/indice.json`.
2. Report breve in `.claude/project/reports/` (`node .claude/scripts/new-report.mjs "aggiornamento <data>"`), committato con il resto.

## Segnalazioni
A fine esecuzione, sempre (anche se non è cambiato niente): `node scripts/notify.ts "<esito> <data>" <file>` con binario per binario cosa è stato pubblicato, cosa ha respinto il verificatore e perché, quali fonti restano senza copia, gli errori con il passo e l'output. Mai pubblicare «a metà».
