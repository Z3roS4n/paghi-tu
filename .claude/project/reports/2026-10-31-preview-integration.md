# Preview protetta assistente — verifica locale e consegna

> Ultimo aggiornamento: 31 ottobre 2026 · da: Codex (su mandato Giovanni)

## Risultato

Integrazione preparata sul ramo `agent/preview-guarded-20261031`, discendente di `eb15bad` (PR #6). Implementazione Codex; author Git Antonio Murabito secondo mandato e convenzione repo, non attestazione di review umana. Nessun merge su main del sito, provisioning, apply o deploy manuale eseguito. Deploy e wiring spettano ad Antonio con i suoi accessi; nessun nuovo seat Vercel. La UI è funzionale per test Preview; **design finale dell'agent a cura di Antonio**.

## Prove locali misurate

- Baseline 241 test preservata; suite finale **277/277**, 33 file. Typecheck, lint e build Next 16.4.3 PASS, sia flag off sia build `AGENT_ENABLED=1 VERCEL_ENV=preview`.
- Replay dei 627 turni registrati precedenti: confronto esatto di shown/adapted/validation/gate, tipo e numero dispatch; nessuna nuova chiamata Vertex. Fixture portabile con manifest e SHA. Non prova piena uguaglianza dei payload, nuove query cloud o qualità generale della conversazione.
- 22 test backend: gate ambiente/origine, schema/cookie, cap e contesa simulata, reset, errori stato/auth e commit incerto, halt persistente anche quando il runtime assorbe un errore di formulazione. 8 test runtime e 6 ops. Le simulazioni non equivalgono a Firestore reale.
- HTTP server locale build off: `/` 200, `/assistente` 404, POST `/api/agent` 503 DISABLED con zero tentativi. Build mantiene pubbliche le pagine statiche e solo la nuova API dinamica; root layout e navigazione invariati.
- Chromium locale sulla build Preview, **8 controlli PASS**, API esplicitamente simulata: pagina, limite input, testo HTML non eseguito, URL javascript scartati, fonti HTTP(S), astensione, ID conversazione/UUID, reset e 429 senza reinvio automatico. Nessun errore JavaScript osservato. Prova UI, non integrazione provider.
- Export rigenerato 2121 documenti; SHA `d0cad38c0785b3d3c0d7223148a45a687d880b0036f8e02463a9d4633a900d2a`; golden SHA `a9a18a3194f8081279ee584c43746bf5adac5276254d3a6e903f6c1f548a1ce8` invariati. Build rigenera l'export; trace API include export/manifest ed esclude test, fixture ed eval.
- Audit dipendenze produzione (`npm audit --omit=dev`): **0 vulnerabilità note** nell'esecuzione locale. Override zod mirato elimina tre nuovi high transitivi; restano 16 moderate del tooling dev preesistente, non risolte da questo incremento.
- Review avversariale indipendente: chiusi formato batchGet JSON array, rollback transazioni aperte, incertezza persistente, integrità contesto, allowlist EU, verifica separata backup/PITR e TTL esatto ACTIVE con rilettura. Nessun P1/P2 residuo fra i rilievi ricontrollati. Non certifica assenza generale di difetti.

## Da completare prima dell'accensione

[Runbook completo e stress](2026-10-31-preview-wiring.md): Antonio verifica gli ID reali, applica il setup dopo piano, configura solo Preview, prova protection anonima pagina/API, WIF negativi owner/project/environment, IAM altro DB, TTL ACTIVE, backup/PITR, due istanze Firestore, cap e costi osservati. Il titolare approva la nota privacy della persistenza effimera. Control iniziale spento; produzione sempre disabilitata.

Lo stress Firestore conta l'ultima unità concorrente in un namespace casuale con due adapter e nessuna Vertex; non è un test completo di tutte le policy. Lo stress HTTP a control spento limita richieste, concorrenza e durata senza Vertex. Fase pagata separata con opt-in e massimo tre richieste. Budget non è hard cap monetario. Errori incerti richiedono riconciliazione; timeout e scadenza lease non provano che il provider abbia terminato.

**Stato: local verified / manual handoff prepared / live PENDING ANTONIO.** Nessuna autorizzazione alla produzione implicita nel PASS locale.
