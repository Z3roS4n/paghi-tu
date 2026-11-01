# Revisione della Preview dell'assistente e dell'aggiornamento dell'indice (2026-11-01)

Revisione del codice unito con la #7 (`3325c14`, D-043) e la #8 (`14d8bec`, D-044), fatta da due revisori indipendenti in sola lettura; ogni reperto corretto qui è stato riletto sul codice e coperto da un test che fallisce senza la correzione.

## Corretti

**Preview (#7)**
- **Chiusura della scheda = Preview ferma per tutti.** Il segnale della richiesta includeva la connessione del browser e arrivava fino alla chiamata a Vertex e a Firestore: se il client se ne andava, il nostro server interrompeva Vertex, l'esito diventava incerto e `global.halted` bloccava tutti fino al recupero manuale. Ora il client interrompe solo la lettura del body; il resto si ferma solo alla scadenza di 45 s (`service.ts`).
- **Esiti certi trattati come incerti.** `StateUnavailable` (transazione non scritta) all'autorizzazione e l'abort dopo l'autorizzazione ma prima dell'invio mettevano `halted`. Ora solo `CommitUncertain` o una chiamata a Vertex partita senza risposta lo fanno. Un terzo ABORTED di Firestore è un rifiuto certo: `StateUnavailable`, non `CommitUncertain` (`state.ts`).
- **Chiarimento che cancellava il contesto.** La domanda ambigua («e quello?») restituisce il contesto precedente, ma il servizio lo buttava perché la risposta è un'astensione.
- **Cookie scaduto a sessione viva.** Il cookie aveva `Max-Age=1800` fisso dal primo messaggio, mentre la sessione si allunga a ogni richiesta: ora si rinnova a ogni risposta.
- **`maxDuration = 60`** sulla route: senza, una piattaforma con un limite più basso poteva uccidere la funzione dopo un'autorizzazione e lasciare `halted`.

**Aggiornamento dell'indice (#8)**
- **Token OIDC esposto a `npm ci`, test e build.** `id-token: write` valeva per tutto il job: uno script di installazione di una dipendenza poteva chiedere un token valido per l'identità di sincronizzazione. Ora la validazione è un job senza `id-token`; il job di sincronizzazione installa con `--ignore-scripts` e ricostruisce solo l'export.
- **Taglio oltre il limite rilevato dopo il lock.** Diff e limite delle rimozioni si controllano ora in sola lettura prima di sospendere l'assistente; prima un commit di dati che toglieva più del 10 % dei record spegneva l'assistente e il recupero cancellava uno stamp ancora valido.
- **Prontezza di Search su tutto l'indice.** Con 2.123 documenti servivano 177 ricerche per giro e il tetto di 600 richieste ne permetteva circa tre; ora si provano solo i documenti cambiati e rimossi.
- **Causa del blocco persa.** Il report di blocco scrive il messaggio d'errore interno e ogni DELETE inviato, così si distingue «nessuna scrittura» da «esito ignoto».
- **Trigger incompleto.** Aggiunti `src/lib/domain/**` e `package-lock.json`, da cui dipende l'export.

## Aperti (scritti in D-043, D-044 e nei runbook)

- L'identità federata vale per ogni deployment Preview del progetto Vercel, non per un ramo: il token OIDC non lo porta. Mitigazione operativa: env dell'agente limitate a un ramo, nessun Preview di rami di terzi con l'agente acceso.
- L'impronta `source_sha256` non copre il testo indicizzato: chi cambia `indexedText` deve ricaricare l'indice per intero. Cambiarla richiede di toccare insieme runtime, sincronizzazione e runner, con un ricaricamento completo: rimandato.
- La sessione può superare 32 KB dopo molte conversazioni; scambio di identità e caricamento dell'indice costano prima dei limiti.

## Verifiche

Lint e typecheck puliti; 303 test su 306, 4 nuovi. I 3 rossi falliscono solo su Windows per gli a capo CRLF del checkout e passano in CI. Nessuna prova live: Preview, identità federata e Firestore restano da attivare.
