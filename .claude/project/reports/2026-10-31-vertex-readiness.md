# Paghi Tu — agente verificato su Vertex

> **Ultimo aggiornamento:** 31 ottobre 2026 · **da:** Codex (su mandato Giovanni)

**Esito tecnico: PASS per l’uso assistito tramite runner su Vertex AI Search.** L’indice reale è aggiornato e le prove attraversano cancello, ricerca/generazione e validatore. Il sito pubblico non è ancora collegato; le PR nel repo di Antonio restano soggette al merge del titolare (D-027).

## Prove finali

| Prova | Esito osservato | Evidenza |
| --- | --- | --- |
| Golden set | 155 casi, tre passate, 465 risposte; tutte le metriche al 100%, zero falliti | `agent/evals/runs/2026-10-31/2026-10-31T13-55-50.report.json` e log compresso omonimo |
| Avversariale | 54 casi, tre passate, 162 risposte; 54/54 | `agent/evals/runs/2026-10-31/2026-10-31T14-12-12-avversariale.report.json` e log compresso omonimo |
| Domande aggiuntive | 7/7, tutte assenti dal golden: quattro risposte e tre astensioni senza Google | `agent/evals/runs/2026-10-31/2026-10-31-holdout-runtime.json` |
| Indice reale | 2.121 documenti, nessun ID mancante/in più, nessuna impronta obsoleta | comando `vertex/agent.ts check`, rieseguito dopo le prove |
| Test del clone | 236/236 | `npm test` su `agent/vertex-ready-20261031`, e8c8202 |
| Test del runner | 5/5 | `node --test projects/paghi-tu-agent/vertex/agent.test.ts` |
| Controlli statici | typecheck e lint del clone PASS; typecheck strict ESNext/bundler del runner PASS | comandi eseguiti in sessione |
| Sito esistente | build PASS, 87 pagine controllate senza problemi | `npm run build`, `npm run check:pages` |

Misure della campagna finale su dataset congelato del 31 ottobre 2026. Ogni caso ha esattamente tre righe con run distinti 0/1/2: nessuna risposta duplicata dal runner per riempire i run. Le risposte locali dei cancelli non chiamano Google. Nel golden: 285 risposte via Search, 114 via Answer, 66 locali; nell’avversariale: 18 Search, 33 Answer, 111 locali. Sono conteggi del client, non dati di fatturazione.

Le metriche del golden sono: cifre con fonte 155/155; astensioni 23/23; verbatim 59/59; record atteso citato 132/132; nessuna citazione inventata 155/155; valori attesi 129/129; regole 96/96. Ogni caso passa solo se passa tutte e tre le passate.

## Comportamento operativo

Per domande individuabili da data, esercizio, tipo di atto, territorio coperto o dichiarazione univoca si usa Vertex Search. I risultati devono contenere tutti gli ID richiesti e la stessa impronta dell’export. I valori tabellari e le parole esatte delle dichiarazioni sono composti dai record restituiti; il modello non li ricalcola. Per le altre domande si usa Vertex Answer, sempre seguito dal validatore.

Le risposte attese del golden non entrano nel percorso delle risposte: la route riceve domanda e indice. Le metriche vengono applicate dopo la risposta. Domande regionali, provinciali e comunali, paesi non coperti e somme nuove fra record ricevono astensione. Le percentuali sono escluse quando il confronto comprende basi non omogenee; una guardia le respinge se arrivano comunque.

I filtri Vertex che rifiutavano domande legittime sono disattivati nel client; cancello deterministico, controllo delle citazioni, verbatim, numeri, attribuzioni, formati e avvertenze restano attivi. Le prove avversariali misurano questa configurazione. Non è una garanzia universale su qualsiasi domanda futura.

## Versioni e riproducibilità

- Progetto `paghi-tu-agent`, location `eu`, data store `paghi-tu-dati`, engine `paghi-tu-agente`.
- Moduli e dati verificati nel clone: `e8c820287beff25910e23b0f5539a46a8a406794`.
- Export SHA-256: `d0cad38c0785b3d3c0d7223148a45a687d880b0036f8e02463a9d4633a900d2a`.
- Golden SHA-256: `a9a18a3194f8081279ee584c43746bf5adac5276254d3a6e903f6c1f548a1ce8`.
- Runner: versione su main WEBMASTER `16dd99a0`, più una sola annotazione TypeScript sullo spread di `failedCase`. Il JavaScript emesso è identico, SHA-256 `858ed63d07efec655855bb9afd93585ce7fbe546af7ed30018c0c9942c8e0004`; prova in `agent/evals/runs/2026-10-31/2026-10-31-typecheck-equivalence.json`.
- I log e gli snapshot compressi, i metadati e i report sono anche in `agent/evals/runs/2026-10-31/` del clone. Il riepilogo con le impronte è `agent/evals/runs/2026-10-31/readiness-summary.json`.

Le prove precedenti interrotte restano locali con il loro stato: non sono state conteggiate come accettazione. Il runner ora può fermarsi al primo fallimento, conservando il log e completando solo le richieste già in volo.

## Uso

```bash
node /Users/giovanni/WEBMASTER/projects/paghi-tu-agent/vertex/agent.ts check
node /Users/giovanni/WEBMASTER/projects/paghi-tu-agent/vertex/agent.ts ask "Chi guidava il governo il 17 maggio 2007?"
```

Usa la sessione gcloud dell’operatore. Il service account `paghi-runtime` è senza chiavi utente (verificato il 31 ottobre). Il budget da 50 EUR/mese è un avviso, non un limite rigido; quote verificate 30 scritture conversazionali e 10 richieste LLM/minuto. Il runner separa Search (limite prudenziale 60 partenze/minuto) e Answer (8/minuto). Costo effettivo e credito residuo non sono stati misurati: non si deducono dai conteggi.

## Limiti di consegna e gate esterni

- Fonti: 149 riscontrate, cinque da archivio. Quattro copie locali sono il testo normalizzato realmente acquisito HTTP 200 nella giornata, con provenienza e SHA-256; la quinta è Wayback. I test continuano a riscontrare i valori. Questo non certifica 149 fonti live dopo i successivi 403 e timeout. Nessuna eccezione per host indisponibili; niente ulteriori richieste a ISTAT dopo il blocco osservato.
- Antonio resta 0/155 revisionati: Giovanni ha derogato alla revisione preventiva per la campagna sul set corrente. Non si attribuisce una revisione ad Antonio.
- Il codice nel repo di Antonio è consegnato su un ramo per review, non su main: la PR è parcheggiata per il titolare. Nessun merge delle PR #1/#3/#4/#5 da parte di Codex.
- Prima del sito: OIDC Vercel, collegamento della route/widget e gate esterni già previsti (informativa, accordi e parere richiesto). Non sono stati dichiarati chiusi da queste eval.
- Artifact di revisione non aggiornato: connettore ArtifactData assente, host browser indisponibile e tentativo nativo Chrome terminato con `cgWindowNotFound`. Il presente report e il PLAN su main contengono lo stato verificato.
