# {{NAME}} — Stack tecnico

> Versioni pinnate alla prima installazione; aggiornare qui a ogni upgrade.

**Versioni installate ({{TODAY}}):** Next.js {{NEXT_VERSION}} · React {{REACT_VERSION}} ·
TypeScript {{TS_VERSION}} · Tailwind {{TAILWIND_VERSION}} · Node {{NODE_VERSION}}
*(lette da `package.json` allo scaffold; `<n/d>` = non presente, completare a mano)*

## Baseline Next.js 16.x (se lo stack è Next)
- **Requisiti**: Node ≥ 20.9 · TypeScript ≥ 5.1 (dalla 16.3 `next build` può usare TS 7 per il
  type-check) · browser Chrome/Edge/Firefox 111+, Safari 16.4+.
- **Cache Components** (`cacheComponents: true`, + `partialPrefetching: true`): attivo di default
  nei progetti creati con `create-next-app` 16.4+, sarà il default in Next 17. Niente caching
  implicito: tutto è dinamico finché non lo marchi con `'use cache'` + `cacheLife()`.
- **Turbopack** è il bundler di default (dev e build), con cache su disco attiva di default dalla 16.3.
- **`proxy.ts`** sostituisce `middleware.ts` (runtime Node).
- **`next lint` non esiste più**: ESLint/Biome si lanciano direttamente (`npm run lint`).
- **Doc della versione installata** in `node_modules/next/dist/docs/`; `next dev` mantiene il blocco
  `nextjs-agent-rules` in `AGENTS.md`.
- Config agentiche (opzionali, 16.4): `experimental.agentUpgrade` (`'security'` default ·
  `'latest'` · `false`), `experimental.agentFeedback`.
- Upgrade: `npx next@canary upgrade --agent=latest` (agente) oppure `npm i next@latest`.
- Skill ufficiali Next utili: `next-dev-loop`, `next-bundle-optimizer`,
  `next-cache-components-optimizer` (`npx skills add vercel/next.js --skill <nome>`).

## Runtime & framework
| Layer | Scelta | Note |
|---|---|---|
| Framework | **<…>** | |
| Linguaggio | **<…>** strict | |
| Deploy | **<…>** | |
| DB | **<…>** | |
| ORM | **<…>** | |
| Auth | **<…>** | |
| File / storage | **<…>** | |

## Librerie applicative
| Scopo | Libreria | Motivo |
|---|---|---|
| UI kit | **<…>** | |
| Form / validazione | **<…>** | |
| Test | **<…>** | |
| Lint / format | **<…>** | |

## Variabili d'ambiente (contratto)
```
DATABASE_URL=
AUTH_SECRET=
# … un segreto per riga; nessun prefisso NEXT_PUBLIC_ sui segreti
```
Regola: validare l'env allo startup con uno schema (`src/lib/env.ts`).

## Servizi esterni e piani
- **<servizio>**: <account, ambienti sandbox/prod, costi>
