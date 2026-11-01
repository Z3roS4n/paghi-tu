# Firestore — stato Preview assistente

> Ultimo aggiornamento: 31 ottobre 2026 · da: Codex (su mandato Giovanni)

Stato: preparato localmente; nessun provisioning o test cloud eseguito. Firestore Native Standard, database nominato `paghi-tu-preview` nello stesso progetto esistente, località EU in allowlist. API REST `https://firestore.googleapis.com/v1/projects/<project>/databases/<database>/documents`: beginTransaction, batchGet, commit e rollback; access token SA federata, ruolo datastore.user condizionato sul database, non su singoli documenti. Nessun webhook.

Adapter unico `src/server/agent/state.ts`; collezione `agent_preview`, chiavi logiche codificate per control, cap, lease, ledger e sessioni. Lo stress usa namespace casuale isolato. Le transazioni gestiscono contesa con retry limitato soltanto quando l'esito è noto; commit incerto non viene ripetuto. Stato indisponibile impedisce dispatch. Control iniziale spento. Contesto con scadenza logica 30 minuti; campo expiresAt con TTL ACTIVE richiesto, cancellazione fisica eventuale. PITR/backup devono essere disattivati e verificati separatamente. Costi letture/scritture/TTL da osservare sul piccolo campione, non garantiti dal budget.

Env `GCP_PROJECT_ID`, `AGENT_STATE_DATABASE_ID` e identità WIF come nel [runbook](../project/reports/2026-10-31-preview-wiring.md). Setup versionato in `scripts/agent/setup-preview.mjs`, piano di default e apply manuale con manifest delle sole risorse create. Nessuna modifica DB manuale fuori procedura. Errori redatti, nessun testo utente nei log applicativi; halt persistente e ripresa manuale per esiti incerti. Rollback e stress nel runbook. Privacy e verifiche live PENDING ANTONIO/titolare.
