# Roadmap frontend — Paghi Tu

> File permanente. Traccia l'applicazione di un redesign/nuovo design alla webapp. In futuro
> arriveranno altre pagine/modalità: **non eliminare questo file**, si estende.

## Design system, decisioni e convenzioni → cartella [`design/`](design/README.md)
**Non duplicare qui.** Scope, fedeltà, processo, harness di anteprima, regole trasversali e log
delle decisioni vivono in [`design/design-system.md`](design/design-system.md) e
[`design/decisions.md`](design/decisions.md). I gap funzionali (design → nessun backend) sono in
[`design/da-implementare.md`](design/da-implementare.md). Questo file traccia **solo l'avanzamento**
per fase/sezione.

## Fasi

### Fase A — Design system + shell (fondamenta)  ✅ = fatto · 🔄 = in corso · ⬜ = da fare
| # | Blocco | Stato | Note |
|---|---|---|---|
| A1 | Token colore/tema in uso dal design system del progetto | ✅ | `globals.css`, D-011 |
| A2 | Font | ✅ | Geist + Geist Mono |
| A3 | Tema dark/light (se previsto) + toggle | ✅ | segue il sistema, nessun toggle |
| A4 | Shell desktop (navigazione principale, ricerca/comando globale) | ✅ | menu con Spesa e Archivio |
| A5 | Shell mobile (se previsto) | ✅ | menu a scorrimento |
| A6 | Primitive UI mancanti (installare/creare al bisogno) | ✅ | `ChartFigure`, `LineChart`, chip di filtro |
| A7 | Controlli nativi → primitive stilizzate (select/checkbox/radio) in tutti i form | ✅ | nessun select nativo; filtri a chip |

### Fase B — Schermate
| # | Schermata | Route | Componente esistente | Stato |
|---|---|---|---|---|
| B1 | Home | `/` | `app/page.tsx` | ✅ |
| B2 | Quanto spendiamo | `/spesa` | `app/spesa/page.tsx` | ✅ |
| B3 | Conti per governo | `/governi/[id]` | `PublicAccounts` | ✅ |
| B4 | Archivio con ricerca | `/archivio` | `components/archive-search.tsx` | ✅ |
| B5 | Elenco governi con debito durante il mandato | `/governi` | — | ⬜ |
| B6 | Spesa 1946–1994 | `/spesa` | — | ⬜ (DI-01) |

## Log avanzamento
- 2026-10-21 — Avvio. Creati `design/` (README, design-system, decisions, da-implementare) e questa roadmap.
- 2026-10-21 — Home, `/spesa`, conti per governo e archivio implementati e verificati a 1280 e 500 px.
