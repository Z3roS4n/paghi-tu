# Decisioni di design

> Log delle decisioni prese durante il redesign/nuovo design UI — scope, processo, scelte tecniche.
> Formato breve: una voce per decisione, con data e motivazione. Per i gap funzionali (design →
> nessun backend) vedi [da-implementare.md](da-implementare.md); per lo stile vedi
> [design-system.md](design-system.md).

## D-UI-01 — Scope (2026-10-21)
Redesign guidato dalla domanda «quanto spende lo Stato con i nostri soldi?»: home con cifra per residente e
scontrino per funzione, pagina `/spesa`, conti per governo, archivio con ricerca. Desktop e mobile insieme.

## D-UI-02 — Lo scontrino diventa il conto per residente (2026-10-21)
Lo scontrino era il riepilogo del sito (numero di governi, durata media). Ora è la spesa pubblica per residente
divisa per funzione, con «di cui oltre le entrate» e «Chi paga: TU». Lega il nome del progetto al dato.

## D-UI-03 — Grafici senza libreria (2026-10-21)
SVG scritto a mano: poche serie annuali, nessuna dipendenza da aggiungere al bundle. Un componente client
piccolo per l'interazione, tutto il resto server.

## D-UI-04 — Neutralità nei conti per governo (2026-10-21)
I governi si mostrano in ordine cronologico, mai in classifica. Ogni blocco di conti per governo porta
l'avvertenza che le cifre descrivono il periodo e non attribuiscono cause.

## D-UI-05 — Bozze del redesign: testi semplici, immagini in pubblico dominio (2026-10-21)
Il proprietario ha giudicato le prime tre bozze troppo «da AI». Rifatte con testi in frasi piane (niente slogan,
niente trattini lunghi, niente etichette su ogni sezione), un solo colore di accento per bozza, icone Phosphor e
nessun Fraunces. Le immagini sono incisioni del Settecento e foto da Wikimedia Commons in pubblico dominio
(elenco e fonti in `bozze/img/CREDITI.md`); le foto moderne vanno in bianco e nero, così il tricolore resta fuori
dalla palette (D-011). La didascalia cita sempre autore e licenza.

## D-UI-06 — Direzione C, più dati e movimento legato allo scroll (2026-10-21)
Il proprietario ha scelto la C con angoli meno tondi: schede 6 px, bottoni ed etichette 4 px. La bozza `c2-piazza.html`
aggiunge il primo semestre 2026 (Eurostat trimestrale), i 100 € raccontati a passi con i quadretti fissi sullo schermo,
le serie 1995-2025 in euro di oggi e in % del PIL, il confronto con UE, Germania, Francia e Spagna, il debito dal 1946
con il governo dell'anno evidenziato e il previsto contro lo speso delle misure (solo confronti omogenei; i tetti di
spesa a parte). Le animazioni usano `animation-timeline` dove c'è, IntersectionObserver altrove, nessun listener di scroll.
La spesa per voce del 2025 non c'è ancora: Eurostat la pubblica di solito a febbraio, quindi i 100 € restano sul 2024.

## D-UI-07 — Racconto dei 100 € in un pannello unico, design C su tutto il sito (2026-10-21)
Da mobile il testo dei passi restava sbiadito finché non passava sotto i quadretti, e i quadretti erano piccoli. Ora
quadretti, testo e avanzamento stanno in un solo pannello fisso alto quanto lo schermo; lo scroll scorre su «binari»
invisibili sotto il pannello e il passo cambia quando un binario passa al centro. I quadretti occupano la larghezza
disponibile (circa 36 px a 390 px). Il design C è applicato a tutte le pagine con mattoni comuni (`components/ui.tsx`)
e blocchi condivisi fra home e `/spesa` (`components/sections/finance.tsx`). Le note di lavoro dei verificatori non
sono più testo visibile: restano, per trasparenza, nel pannello chiuso «Registro tecnico della verifica».

## D-UI-08 — Marchio: il timbro «TU» (2026-10-21)
Tre direzioni su Claude Design (lo scontrino, il timbro, il quadretto); il proprietario ha scelto **il timbro**: «Paghi»
più un timbro d'ufficio con «TU», il destinatario del conto. Sostituisce l'icona Phosphor dello scontrino nella testata
e nel piè di pagina. Un solo colore (terracotta, D-011), lettere del timbro in tracciati perché favicon e anteprime non
caricano i caratteri del sito. L'ironia resta nel nome e nel timbro, mai nei contenuti: il timbro non compare accanto a
partiti, persone o dati.

<!--
Template voce successiva:

## D-UI-0X — <titolo breve> (2026-10-21)
<Cosa si è deciso e perché — 2-4 righe, senza rifare tutto il ragionamento.>
-->
