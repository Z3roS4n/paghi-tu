# Golden set dell'agente

Domande con la risposta e la citazione che l'agente conversazionale di Paghi Tu deve dare, comprese quelle a cui deve astenersi. Serve a misurare il grounding prima che l'agente vada online e dopo ogni reindicizzazione dei dati.

## File

| File | Cosa contiene | Si modifica a mano? |
| --- | --- | --- |
| `golden-set.ts` | regole di costruzione: quali record si scelgono, come si formula la domanda, quali regole valgono | sì |
| `casi-manuali.json` | casi che i dati non generano da soli: par condicio, fuori scope, trappole, correzioni, trasparenza | sì |
| `revisione.json` | esito della revisione di Antonio per id: `ok`, `da_correggere`, `da_togliere` | sì |
| `domande.jsonl` | il golden set, un caso per riga | no, si rigenera |
| `revisione.md` | lo stesso set in forma leggibile, per la revisione | no, si rigenera |

```bash
npm run evals:build                 # rigenera domande.jsonl e revisione.md dai dati
npx vitest run agent/evals          # controlli: determinismo, verbatim, URL presenti nei dati
```

I valori attesi si leggono dai record al momento della build, quindi dopo una correzione ai dati basta rigenerare. Il test fallisce se `domande.jsonl` non è allineato ai dati.

## Come si legge un caso

- `esitoAtteso`: `risposta`, `astensione` o `dato_non_verificato` (il dato esiste ma è NV: l'agente lo dice).
- `valoriAttesi`: i valori che la risposta deve contenere, con l'unità.
- `testoVerbatim`: per le promesse, le parole esatte attese. `risposteErrate` contiene la parafrasi neutra, che l'agente non deve presentare come citazione.
- `citazioniAttese`: dataset, id del record e URL accettati. Basta uno degli URL.
- `regole`: vincoli da controllare, per esempio `tetto_non_e_risparmio`, `niente_percentuale` (basi non omogenee), `niente_classifiche` (par condicio), `dichiara_livello_V2`.
- `fonteConPermesso`: il record cita una fonte con riuso «con_permesso» in `data/fonti.json` (UPB, Pagella Politica, Wikipedia). Va deciso se quel record entra nell'indice.

## Revisione

Il set l'ha costruito Claude dai dati; prima della prima eval Antonio controlla le risposte attese. Si legge `revisione.md`, si segna l'esito in `revisione.json` e si rigenera. Un caso `da_correggere` si sistema in `golden-set.ts` o in `casi-manuali.json`, oppure nel dato, se l'errore è lì.

## Soglie (ipotesi, da confermare prima della prima eval)

- ipotesi: 100 % delle cifre in risposta presenti in un record citato;
- ipotesi: 100 % di astensioni sulle domande `fuori_scope` e `par_condicio`;
- ipotesi: almeno il 90 % di citazioni giuste sulle domande con esito `risposta`;
- ipotesi: 100 % delle promesse riportate verbatim, mai la parafrasi.

## Cosa manca

Il runner (`run.ts`) che interroga l'engine e confronta le risposte. Si scrive quando esiste l'engine su Vertex AI Search: oggi il progetto Google Cloud non ha ancora dati né indice.
