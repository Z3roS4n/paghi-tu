# Da implementare — funzionalità nel design ma assenti nel backend

> Registro delle funzionalità che **compaiono nel design** ma per cui **non esiste ancora supporto
> backend**. Non vanno inventate al volo: si annotano qui e si valutano dopo. Ogni voce: schermata
> di origine, cosa mostra, cosa manca lato backend, disposizione, priorità.

## Legenda priorità
- **P1** — blocca la fedeltà di una schermata core; da valutare a breve.
- **P2** — utile, ma la schermata resta sensata anche senza (placeholder/stato vuoto).
- **P3** — nice-to-have / raffinamento.

## Voci

### [DI-01] Spesa prima del 1995 — `/spesa`
- **Design:** la domanda vale dal 1946, ma i conti Eurostat partono dal 1995.
- **Backend attuale:** solo debito dal 1861 (Banca d'Italia). Mancano spesa ed entrate 1946–1994 (ISTAT dal 1980, RGS e ricostruzioni storiche prima).
- **Disposizione:** rinviato alla Fase 2 della roadmap; serve ISTAT con un solo processo alla volta.
- **UI ora:** i grafici di spesa partono dal 1995 e lo dicono nel titolo.
- **Priorità:** P1.

### [DI-02] Bilancio dello Stato per ministero e missione — `/spesa`
- **Design:** «dove vanno i soldi» per ministero, oltre che per funzione COFOG.
- **Backend attuale:** nessuno. RGS/BDAP: dump CSV per id del dataset, 2008–2025 (nota accesso-tecnico §3).
- **Disposizione:** da fare dopo la conferma della licenza.
- **UI ora:** solo COFOG.
- **Priorità:** P2.

<!--
Template voce:

### [ID] Titolo — schermata di origine
- **Design:** cosa mostra/promette il design (rif. mockup/regione).
- **Backend attuale:** cosa esiste già e cosa manca.
- **Disposizione:** come si procede — implementare ora / rinviato (e perché) / fuori scope. Non
  implementare senza richiesta esplicita del cliente/PM, anche se sembra piccola.
- **UI ora:** come renderizzare la schermata nel frattempo (stato vuoto/disabilitato — mai dati finti).
- **Priorità:** P1/P2/P3.
-->
