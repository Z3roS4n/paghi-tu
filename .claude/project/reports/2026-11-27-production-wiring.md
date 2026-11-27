# Runbook — assistente in produzione

> Ultimo aggiornamento: 27 novembre 2026 · da: Claude (Code CLI, su mandato Giovanni)

Decisione: [D-047](../02-tradeoffs.md). Il runbook Preview ([2026-10-31-preview-wiring](2026-10-31-preview-wiring.md)) resta valido per la Preview; qui solo le differenze. Nessun passo è stato eseguito nel cloud: tutto quello che segue è da fare e verificare dal vivo.

## Prima di cominciare

- Decisioni di Giovanni (27 novembre): Vercel Firewall con un rate limit su `/api/agent`; limiti invariati per la prima settimana; pagina diretta `noindex`, fuori dal dock (già così nel codice); risorse GCP create da Claude con la conferma di Giovanni a ogni passo. Resta al titolare la privacy della persistenza effimera.
- La PR della chat (#13) è su main: il copy della pagina dice ancora «Anteprima protetta» e va adattato alla produzione prima dell'accensione.
- Next in versione corretta per le advisory note.

## Risorse GCP (Claude, con il sì di Giovanni a ogni `--apply`)

1. Config locale fuori dal repo, copiata da `scripts/agent/preview-config.example.json` con `"environment": "production"`, `"databaseId": "paghi-tu-production"`, il service account e il provider di produzione. `previewOrigin` non serve.
2. `node scripts/agent/setup-preview.mjs --config <prod.json>` stampa il piano; con `--apply --secret-output … --manifest-output …` crea o verifica:
   - database `paghi-tu-production` nella stessa località UE, PITR e backup spenti;
   - TTL `expiresAt` su `agent_production` in stato ACTIVE;
   - pool WIF dedicato alla produzione e provider con `assertion.environment == 'production'`;
   - binding `workloadIdentityUser` del service account solo su `attribute.project_env/<project>:production`. Il preflight si ferma se il service account ha altri impersonatori (un `principalSet` sull'intero pool, il principal Preview, un utente);
   - binding `datastore.user` del service account di produzione condizionato sul solo database di produzione;
   - documento `control` iniziale `{enabled:false}`;
   - un segreto HMAC nuovo.
3. Il service account di produzione va creato prima e deve essere diverso da quello della Preview: lo script controlla i suoi impersonatori, non chi altro usa lo stesso indirizzo. Ruoli: sola ricerca su Vertex e il binding sopra. Nessun binding del service account Preview sul database di produzione.
4. Identità GitHub della sync (risorse GCP create il 27 novembre: service account `paghi-runtime-prod`, pool `vercel-production`, provider `vercel-certalea`, database `paghi-tu-production`): `datastore.user` condizionato anche su `paghi-tu-production`, poi variabile di repository `AGENT_SYNC_TARGETS=preview,production` (la imposta Antonio). Senza la variabile la sync tocca solo la Preview; dopo la prima sync su due target, una sync che ne esclude uno si rifiuta (`sync targets narrowed`). Per togliere davvero un ambiente: spegnerlo con `control --disable`, poi togliere `indexTargets` dal `control` degli altri, con una scrittura manuale dichiarata.

## Sync notturna (Antonio)

Il workflow `agent-index-sync` parte a ogni push su main che tocca dati o agente, e ogni notte alle 03:30 UTC. Serve la variabile di repository `AGENT_INDEX_SYNC_ENABLED=1`. Il job `validate` lancia `npm test`: finché `agent/evals/verifica-fonti.json` non è rigenerato per il golden set corrente, i 2 test di `verifica.test.ts` falliscono e la sync non parte.

## Vercel (Antonio)

Prima dell'accensione: una regola Vercel Firewall con rate limit su `/api/agent`.

Solo nell'ambiente Production:

- `AGENT_ENABLED=1` e `AGENT_PRODUCTION_ENABLED=1`;
- `AGENT_STATE_DATABASE_ID=paghi-tu-production`;
- `GCP_SERVICE_ACCOUNT_EMAIL` e `GCP_WORKLOAD_IDENTITY_POOL_PROVIDER_ID` di produzione;
- `AGENT_ALLOWED_ORIGIN` uguale al dominio pubblico esatto;
- `AGENT_IP_HASH_SECRET` nuovo;
- gli altri pin come in Preview.

La pagina `/assistente` è statica: gli interruttori valgono dal deploy successivo.

## Accensione

1. Sync con il target di produzione, e verifica che `control` abbia `indexSha256` e nessun `sync`.
2. Deploy di produzione dello stesso commit. Finché l'hash dell'indice del deploy non coincide con quello marcato, l'API risponde 503: è voluto.
3. `node --conditions=react-server scripts/agent/control-preview.mjs --config <prod.json> --read`, poi `--apply --enable` solo dopo il via del titolare.
4. Un campione piccolo da browser, poi controllo di log senza testo utente, contatori e fatturazione.

Stress e verifica automatica restano solo Preview: con `environment: production` gli script si rifiutano.

## Spegnimento

- A runtime: `control-preview.mjs --config <prod.json> --apply --disable`.
- Definitivo: togliere `AGENT_PRODUCTION_ENABLED` e rifare il deploy.
- Recupero di un halt: come in Preview, con la config di produzione.
- Recupero di una sync bloccata: `sync-index.ts --apply --recover-sync OWNER --ack-remote-reconciled` con lo stesso `AGENT_SYNC_TARGETS` della sync bloccata (il report la elenca in `targets`). Legge tutti gli stati prima di scrivere, si ferma su un marcatore di un altro proprietario o se non ne trova, e scrive in `recovered` ogni target recuperato.

## Cosa non è stato provato

Unit test e build provano la logica locale: config, claim, namespace, cache del token, principal WIF e controllo degli impersonatori, preflight, rilascio dei lock, guardia sui target e recupero su più stati, rifiuti degli script. Non provano WIF, IAM, TTL, Firestore reale, Firewall, protezione o costi.
