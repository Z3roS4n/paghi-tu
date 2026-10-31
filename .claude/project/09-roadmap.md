# Paghi Tu — Roadmap

> Fasi con checklist e criteri di verifica. Spunta man mano; ogni fase completata → report.

## Fase 0 — Fondamenta
- [x] Setup repo, toolchain (Next 16.4, React 19.3, Tailwind 4, TS strict), lint, test (vitest)
- [x] Ricerca iniziale con verifica a tre livelli (report 2026-10-20-23-02)
- [x] Schemi zod e import dai CSV di ricerca in `data/`
- [ ] CI (lint, typecheck, test, build) — dopo la scelta di hosting
- **Verifica:** build verde, test passano, tutte le pagine prerenderizzate.

## Fase 1 — MVP pubblico (D-009, da confermare)
- [x] Governi 1946–oggi con livello di verifica per campo
- [x] Leggi di bilancio con estremi e governo proponente (attribuzione documentata/inferita/incerta)
- [x] Pagine Metodo, Fonti, Chi siamo, Correzioni, Note legali (provvisorie)
- [x] Promesse della campagna 2027: 282 righe verificate pubblicate il 2026-10-21, tutti i partiti insieme (D-013, D-015)
- [x] Verifica L2 delle 52 righe «NUOVA da uniformità»: 38 valide, catalogo a 320 promesse (2026-10-21)
- [x] Misure caso studio (previsto contro effettivo) → pagina `/misure` (10 misure, 18 confronti)
- [x] Serie % PIL e euro costanti nei grafici (palette neutra): `/spesa`, conti per governo (2026-10-21)
- [x] Archivio con ricerca `/archivio` (D-017)
- [ ] Recapito del progetto, revisione legale (OA-2, OA-6), dominio (OA-1)
- **Verifica:** ogni record pubblicato V1 o V2 con fonte; nessun NV visibile senza etichetta; controllo di simmetria superato.

## Fase 2 — Spesa dello Stato
- [x] Debito pubblico mensile dal 1945 (Banca d'Italia TCCE0325, valori non modificati) e debito/PIL (D-016)
- [x] Conti delle AP 1995–2025 e spesa per funzione COFOG 1995–2024 (Eurostat, MIO_NAC) con 5 controlli incrociati
- [ ] Spesa ed entrate 1946–1994 (DI-01)
- [ ] Routine su cloud (D-018, da confermare)
- [ ] Spesa per funzione (BDAP/RGS, dopo risposta sulla licenza)
- [ ] Conti della PA ISTAT (ritentare l'accesso, un solo job alla volta)

## Fase 3 — Storico promesse
- [ ] Programmi 2018 e 2022, poi 2013 e 1995–2010, poi 1965–1994 e 1946–1964
- [ ] Stato di attuazione delle promesse con atti collegati

## Preview protetta assistente — 31 ottobre 2026

- [x] Runtime portabile, API Preview, UI funzionale di test e controlli locali.
- [x] Setup in modalità piano di default, stress limitato e istruzioni di stop/recupero.
- [ ] Antonio: verificare ID Vercel, WIF, IAM altro DB, Firestore reale su due istanze, TTL ACTIVE, protezione anonima pagina/API e costi osservati.
- [ ] Titolare: approvare privacy della persistenza effimera prima dell'accensione.
- [ ] Antonio: deploy e wiring Preview con i suoi accessi; design finale UI a sua cura.
- [ ] Produzione: decisione separata dopo le prove live; questa consegna non la abilita.

Prove e limiti nel [report](reports/2026-10-31-preview-integration.md), procedura nel [runbook](reports/2026-10-31-preview-wiring.md).


## Aggiornamento indice — 31 ottobre 2026

- [x] Preparare refresh indice separato: workflow opt-in, CLI piano/apply, delta/rimozioni/verifica, gate hash e prove locali.
- [ ] Antonio: identity GitHub WIF/permessi, environment/variabili, test trigger reale e notifiche, prompt routine effettivo aggiornato e Preview costruita sullo stesso snapshot.
- [ ] Collaudo cloud no-op/correzione/aggiunta/rimozione/errore e recupero; nessuna attivazione implicita dalla PR.

[Runbook aggiornamento](reports/2026-10-31-index-refresh.md).
