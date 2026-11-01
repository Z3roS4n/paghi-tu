# Correzione locale del recupero interessi e debito

> **Ultimo aggiornamento:** 31 ottobre 2026 · **da:** Codex (su mandato Giovanni)

## Difetto e intervento

La review UI R2 aveva osservato che la domanda Quanto ha speso lo Stato italiano per interessi sul debito nel 2023? mostrava dodici consistenze mensili del debito. In `structuredCandidates`, la presenza della parola debito sceglieva `debitoMensile` prima di considerare la misura interessi.

Il selettore ora usa `conti/<anno>` per interessi e oneri finanziari annuali, lasciando `debitoMensile` per la consistenza e `debitoPil` per il rapporto debito/PIL. Mantiene i trimestri e i confronti UE; nelle richieste composte delimitate seleziona entrambi i record quando presenti. La spesa genericamente riferita al debito, senza una misura chiara, non viene instradata allo stock.

È disponibile la funzione pura `financeMeasureMismatch(question: string, documents: readonly IndexDocument[]): boolean`. Il runtime deve passarle i documenti effettivamente citati prima della composizione: `true` significa che la misura degli interessi non è coperta dalla classe di record e dal periodo esplicito richiesti, quindi occorre astenersi o chiedere chiarimento. `false` segnala soltanto che questa incompatibilità non è stata rilevata. La guardia non blocca domande su stock, dichiarazioni o contesti storici diversi. Non sono stati modificati dati, export, indice, golden set o risposte attese.

## Verifica

- Baseline dell'intero clone: 236 test superati, comunicata dall'orchestratore prima delle modifiche.
- Dopo la modifica: `npx vitest run agent/answer/retrieval.test.ts --reporter=dot` → 13 test superati, nessun fallimento. I nuovi casi coprono la domanda UI, altri anni e parafrasi, stock mensile, debito/PIL, combinazioni, trimestri, funzione e confronto UE. I test della guardia usano record di classi reali e verificano anche che un conto di un anno diverso non basti.
- `git diff --check` senza rilievi.

## Limiti

Questa è una verifica del selettore e della guardia locale. Nessuna chiamata Vertex o prova UI è stata eseguita in questo work package. Se i candidati strutturati sono vuoti, `candidateFilter` restituisce `null` e la ricerca generale può comunque recuperare documenti non pertinenti. La guardia è pronta per l'integrazione nel runtime, che non rientra in questo work package. Le prove end-to-end e la review indipendente restano necessarie prima di dichiarare R2 risolto nel prodotto.
