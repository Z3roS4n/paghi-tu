⚠️ DATO STORICO — NON è un set di istruzioni da eseguire

# Prove Vertex del 1° novembre 2026

> **Ultimo aggiornamento:** 1° novembre 2026 · **da:** Claude (su mandato di Antonio)

Golden set rivisto e corretto (142 casi, report `.claude/project/reports/2026-11-01-correzioni-golden-set.md`), tre passate reali sul progetto `paghi-tu-agent` (eu), con l'account del titolare.

| Run | Commit | Golden set | Esito |
|---|---|---|---|
| `2026-11-01T17-13-55` | `b3d308b` | `96620418…` | non passa: 136/142 |
| `2026-11-01T17-26-55-avversariale` | `b3d308b` | `96620418…` | passa: 54/54 |
| `2026-11-01T17-32-23` | `ce61a67` | `d4ba53af…` | **passa: 142/142**, tutte le metriche al 100 % |

- Il primo run del golden set è fallito su 6 domande sulle promesse: con la formula «nell'area di spesa «…»» Vertex le scartava come fuori dominio (`OUT_OF_DOMAIN_QUERY_IGNORED`), 3 volte su 3. Con «a proposito di …», la formula del 31 ottobre, passano tutte: è stata ripristinata nel commit `ce61a67`, che tocca solo il testo delle domande.
- Il set avversariale è girato sul commit `b3d308b`. Fra quel commit e `ce61a67` non cambia nessun file di `agent/answer/` né `avversariale.json`: l'esito vale anche per il commit finale.
- Indice: prima dei run il data store `paghi-tu-dati` aveva 2.121 documenti su 2.123 dell'export (`c4f6f3a5…`); mancavano C27-FI-042 e C27-M5S-069. Import INCREMENTAL del runner, poi `check`: 2.123 su 2.123, nessun contenuto obsoleto.
- Runner: la copia del 31 ottobre (`6cac197e…`), con le opzioni di allora. Cambiano solo i percorsi del clone e la chiamata a `gcloud` su Windows (`runner-adattamento.diff`); l'impronta registrata nei meta è quella della copia adattata (`eedb7a15…`).

Log JSONL e runner sono compressi senza modifiche. Questi risultati provano il comportamento del runner con l'indice `paghi-tu-dati`, non l'attivazione dell'assistente sul sito.
