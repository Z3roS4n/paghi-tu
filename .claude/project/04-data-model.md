# Paghi Tu — Modello dati

> Fonte di verità: gli schemi zod in `src/lib/domain/schemas.ts`. Non c'è un database: i dati sono JSON versionati in `data/`, generati da `npm run data:import`. Questo documento spiega intento, vincoli e stati.

## Entità principali
### Legislatura
- Campi chiave: `id` (numero romano), `numero`, `inizio`, `fine` (null se in corso), `elezioni`, `sistemaElettorale`.
- Vincoli: `id` univoco.

### Governo
- Campi chiave: `id` (`g<n>`, come l'URI di dati.camera.it), `ordine`, `nome`, `presidente`, `legislaturaId`, `inizio` (giuramento), `fine`, `maggioranza`, `tipo`.
- Vincoli: `legislaturaId` esiste; nessuna sovrapposizione di mandati; un solo governo con `fine` null.
- Note: `verifica.campi` riporta il livello per `inizio`, `presidente`, `legislatura`, `maggioranza`.

### Legge di bilancio
- Campi chiave: `id`, `annoEsercizio`, `tipoAtto`, `estremi`, `governoProponenteId`, `governoProponenteAttribuzione` (`documentata` | `inferita` | `incerta`).
- Vincoli: il governo proponente esiste ed era in carica prima dell'anno di esercizio.
- Note: tre relazioni distinte legge–governo (proponente, approvazione, gestione); oggi è valorizzata solo la prima (OA-9).

### Fonte
- `id` R-xx, ente, dataset, copertura, licenza, `riuso` (`si` | `con_citazione` | `con_permesso`), fonte di verità per quali grandezze (D-001).

### Serie
- `id`, unità, fonti, avvertenze, `punti[{anno, valore, nota?}]`. Oggi: PIL nominale, popolazione residente, indice FOI, coefficienti di rivalutazione ISTAT 2025.

### Promessa (in arrivo, dai CSV della campagna)
- Colonne di ricerca: partito, coalizione, dichiarante e ruolo, data, testo letterale (citazione breve, art. 70 L. 633/1941), parafrasi neutra, tipo e URL della fonte, archivio, tema COFOG, misurabile, costo dichiarato dal proponente, stima di terzi con fonte, stato, stato di verifica.
- Da decidere prima dell'import: campo `orizzonte` (legge di bilancio 2027 / prossima legislatura) e regola per le promesse recepite dal governo prima del voto, uguale per maggioranza e opposizione.

### Atto (D-029)
- Un decreto-legge, una legge o un decreto legislativo pubblicato in Gazzetta con almeno una misura con importo. Campi chiave: `id` (`dl-AAAA-N`, `l-AAAA-N`, `dlgs-AAAA-N`), `tipo`, `numero`, `data`, `titolo` (breve e neutro) e `titoloUfficiale`, `governoId`, `gazzetta` (numero, data, link), `inVigoreDal` (da Normattiva; prima di quella data la pagina mostra «Pubblicato, in vigore dal…», calcolato nel browser), `cdm`, `stato` (`in_conversione`, `convertito`, `decaduto`, `in_vigore`), `conversione`, `relazioneTecnica`, `misure`, `verifica`.
- Misura dell'atto: `id` (`<atto>-mNN`), `articolo`, `descrizione`, `natura` (`spesa`, `minori_entrate`, `maggiori_entrate`, `minori_spese`), `tipoOnere` (`tetto` o `stima`), `cofog`, `importi` (anno e milioni, come nella fonte), `continuaDopo` («a decorrere»), `citazione`, `fonte`, `verifica`.
- Vincoli: governo in carica alla data dell'atto; Gazzetta dentro il periodo censito (`data/atti-stato.json`); un atto senza misure verificate non si pubblica. CSV: `research/2026-10-28.atti-economici.csv` e `2026-10-28.atti-misure.csv`, importi nel formato `2026:45.2;2027:60`.

### Classificazione delle promesse (D-030, D-031)
- `effettoConti` (`si`, `no`, `incerto`) e `ribadita` (le ripetizioni dello stesso partito, con data e fonte) da `research/2026-10-28.promesse-classificazione.csv`, doppia codifica indipendente.

### Misura (in arrivo, D-007)
- Multi-atto e multi-governo: costo stimato all'approvazione (relazione tecnica) contro costo a consuntivo, ciascuno con fonte. Scostamento % solo se le basi sono omogenee.

## Livelli di verifica
```
NV (da verificare) → V2 (verifica parziale o fonte secondaria) → V1 (fonte primaria, doppio controllo)
```
- Il livello di un record è il più basso fra i suoi campi.
- Si scende di livello (o si rimuove) quando una correzione lo richiede; ogni modifica pubblicata va nel registro correzioni.

## Regole di integrità
- Garantite da `src/lib/domain/integrity.test.ts` e dalla validazione zod a build time: riferimenti esistenti, id univoci, mandati non sovrapposti, proponente in carica prima dell'esercizio.
- Importi in euro; lire convertite a 1 € = 1.936,27 L. Normalizzazione di default in % del PIL (D-002), euro costanti con indice FOI.

## Migrazioni
- Nessun DB. Un cambio di schema si fa nello schema zod e nello script di import nello stesso commit, rigenerando `data/`. Mai modificare i JSON a mano.
