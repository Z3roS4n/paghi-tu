# Routine — aggiornamento dati di Paghi Tu

> Istruzioni per l'agente schedulato su cloud (D-018, PROPOSTA). Non attivare prima della conferma del
> titolare su frequenza, binario 2 (PR o pubblicazione diretta) e canale delle segnalazioni.
> Prerequisiti: repo su GitHub con accesso in scrittura al branch `routine/aggiornamento`, progetto
> Vercel collegato (`msworks-project/paghi-tu`), Node ≥ 24.

## Regole fisse (valgono per ogni esecuzione)
1. Leggi `AGENTS.md`, `.claude/project/07-bad-practices.md` e `.claude/project/02-tradeoffs.md` (D-010, D-013, D-016, D-018).
2. Un solo processo interroga ISTAT, con al massimo 4 richieste al minuto. Se ISTAT non risponde, non riprovare in ciclo.
3. Niente Save Page Now, form, login o scritture su servizi esterni, a parte il repo e Vercel. Non aggirare 403, captcha o WAF.
4. **Nei 15 giorni prima di un voto nazionale non si pubblicano contenuti nuovi su partiti e promesse**, solo correzioni di errori. Controlla la data del voto in `.claude/project/research/` prima del binario 2.
5. Nessun dato personale del titolare in nessun file. Commit con author `Thepro007002001@gmail.com`, senza co-author, messaggi imperativi in inglese.

## Binario 1 — conti pubblici (settimanale)
1. `npm ci`
2. `npm run data:update`. Se `build-public-finance.ts` si ferma su un controllo incrociato: **non pubblicare**, apri una segnalazione con l'output e chiudi.
3. Se `git diff --stat data/` è vuoto, chiudi senza commit.
4. `npm run typecheck && npm run lint && npm test && npm run build`. Se uno fallisce, segnalazione e stop.
5. Verifica a campione: riapri dalla fonte (formato diverso dalla pipeline, per esempio JSON-stat Eurostat) 3 valori cambiati e confrontali con `data/finanza-pubblica.json`. Se non coincidono, stop.
6. Commit «Update public finance data to <ultimo periodo>», push, deploy in produzione (`npx --yes vercel@64.7.0 deploy --prod --yes`), controllo HTTP 200 di `/`, `/spesa`, `/governi`, `/archivio/indice.json`.
7. Report breve in `.claude/project/reports/` (`node .claude/scripts/new-report.mjs "aggiornamento conti pubblici"`).

## Binario 2 — promesse della campagna (ogni 2-3 giorni in campagna)
1. Censimento sui canali ufficiali di **tutti** i partiti del catalogo, con lo stesso criterio (note `2026-10-21.controllo-simmetria-promesse.md` e `2026-10-21.uniformita-pre-pubblicazione.md`): righe nuove con `stato_verifica` «NUOVA da routine <data> — richiede verifica».
2. Un agente diverso fa la verifica L2 riga per riga (stesso schema di `2026-10-21.verifica-l2-righe-nuove.md`): citazione parola per parola sulla fonte, criterio slogan, livello in testa all'esito (`V1✓`, `V2✓`).
3. Controllo di simmetria sulle righe nuove: stessa profondità per tutti i partiti. Se un partito non è stato controllato, nessuno viene pubblicato (D-013).
4. `npm run data:import`, test, build. Le righe che non passano restano nei CSV e fuori dal sito.
5. Secondo la decisione del titolare: PR da approvare, oppure commit e deploy come nel binario 1.

## Segnalazioni
Ogni stop scrive: binario, passo, output dell'errore, file coinvolti. Mai pubblicare «a metà».
