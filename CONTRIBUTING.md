# Contribuire a Paghi Tu

Paghi Tu è aggiornato ogni giorno da una routine di agenti AI, ma è aperto a tutti: l'AI sbaglia, e chi conosce un tema o una fonte può correggerla. Questa guida spiega come.

## 1. Segnalare un errore (non serve saper programmare)

Usa il modulo [Correzione](https://github.com/Z3roS4n/paghi-tu/issues/new?template=correzione.yml), oppure il link «Segnala un errore» sul sito: pagina e dato sono già compilati. Servono tre cose:

1. cosa è sbagliato, così come compare sul sito;
2. cosa dovrebbe esserci;
3. **la fonte**: un documento ufficiale, una banca dati pubblica, il testo originale della dichiarazione.

Per un dato che manca (una promessa, una misura, una fonte ufficiale) c'è il modulo [Dato o fonte mancante](https://github.com/Z3roS4n/paghi-tu/issues/new?template=fonte-mancante.yml).

### Cosa succede dopo

- Ogni giorno la routine legge le segnalazioni aperte. Un agente verificatore, diverso da quello che ha scritto il dato, la ricontrolla sulla fonte indicata.
- **Confermata**: il dato viene corretto, la modifica entra nel [registro delle correzioni](https://www.paghitu.it/correzioni) e la segnalazione viene chiusa con il link al commit.
- **Non confermata**: la risposta spiega perché, sotto la segnalazione. Se non sei d'accordo puoi rispondere con un'altra fonte.
- I casi dubbi (una fonte che si può leggere in due modi, un tema delicato) restano aperti con l'etichetta `da-decidere` finché un umano non li guarda.

## 2. Proporre una modifica (pull request)

1. Fai un fork e un branch.
2. I dati non si modificano a mano nei JSON di `data/`: si cambiano le fonti da cui sono generati.
   - promesse, governi, leggi, misure: i CSV in `.claude/project/research/`, poi `npm run data:import`;
   - conti pubblici: si correggono gli script in `scripts/data/`, poi `npm run data:update`.
3. Lancia `npm run typecheck && npm run lint && npm test && npm run build`.
4. Apri la pull request con il modello proposto: cosa cambia, fonte, controlli.

Le pull request che toccano dati vengono verificate sulla fonte come le segnalazioni. **La routine non unisce mai codice esterno da sola**: applica di nuovo la modifica ai dati dopo la verifica, e le modifiche al codice le rivede una persona.

## Regole che valgono per tutti

- **Fatti, non opinioni.** Si correggono numeri, date, citazioni, fonti, attribuzioni. Non si aggiungono giudizi su partiti, governi o persone.
- **Stesse regole per tutti.** Una regola nuova (per esempio su cosa conta come promessa) si applica a tutti i partiti insieme, mai a uno solo.
- **Citazioni esatte.** Il testo di una dichiarazione si copia parola per parola. Un taglio «[…]» non toglie mai le parole con cui chi parla descrive un gruppo di persone.
- **Niente dati personali** di privati, e niente dati personali tuoi nelle segnalazioni.
- **Nei 15 giorni prima di un voto** non si pubblicano dati nuovi su partiti e promesse: solo correzioni di errori.

Le regole complete sono nel [Metodo](https://www.paghitu.it/metodo) e nel [codice di comportamento](CODE_OF_CONDUCT.md).

## Etichette

| Etichetta | Significato |
|---|---|
| `correzione` | segnalazione di un dato sbagliato |
| `dato-mancante` | proposta di un dato o di una fonte nuova |
| `confermata` | il verificatore ha confermato, correzione applicata |
| `respinta` | la fonte non conferma: motivo nel commento |
| `da-decidere` | serve una persona |
