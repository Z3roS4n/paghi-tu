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

<!--
Template voce successiva:

## D-UI-0X — <titolo breve> (2026-10-21)
<Cosa si è deciso e perché — 2-4 righe, senza rifare tutto il ragionamento.>
-->
