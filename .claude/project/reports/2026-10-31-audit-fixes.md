# Audit fixes — public site and project contracts

> **Ultimo aggiornamento:** 31 ottobre 2026 · **da:** Codex (su mandato Giovanni)

## Scope and baseline

Implementation by Codex on Giovanni’s mandate; Git author Antonio per AGENTS.md, no co-author. Branch based on `origin/main` `5fda95d`, deliberately independent of agent PRs #6/#7/#8. Review and merge belong to Antonio. No manual deploy, merge, cloud writes, notification email or Vertex/ISTAT query performed.

## Verified and corrected

- A1: recounted governments (55 V1, 13 V2, 1 NV), budget laws (89 V1, 57 NV), legislatures (17 V1, 1 V2, 2 NV), promises (383 V1, 51 V2). Global description now declares verification levels and governments from 1945; budget introduction distinguishes verified and unverified records. Budget-law coverage remains 1946, correctly independent of government coverage.
- A2: corrected remaining daily/one-day claims in acts, corrections, contributing and two headings in the data routine. Kept daily PR review unchanged. Cron `0 6 */3 * *` resets its day-of-month step each month; it does not guarantee an exact rolling 72-hour interval. No installed cloud prompt modified.
- A3: architecture now reflects cookie-free Vercel Analytics with query/fragment stripping, seven finance checks, current client modules and missing public routes. Audit’s client inventory was incomplete: main has thirteen use-client modules; archive-search and nav-links exist, bars has no use-client directive. Document follows actual source instead of copying audit’s list.
- A4: filled stack tables and real env contract, removed fake DB/auth/webhook/action examples, documented archive GET index, published promise horizon enum and measure model, and aligned roadmap. Legal review stays unchecked; publishing privacy/contact does not prove legal approval.
- A5: added robots/sitemap metadata routes and read-only CI for lint, typecheck, test, build, visible-page check. Actions pinned by SHA; Node24, 15-minute timeout, no cloud identity/secrets, npm ci. Sitemap contains only the fifteen public root pages and sixty-nine government pages, no API/assistant, no fabricated modification dates.
- A6: added Banca d’Italia TCCE0325 integration contract and corrected integration registry. Resend status remains explicitly unverified: running routines do not prove configuration, provider acceptance or email delivery. No test email sent.

## Regression evidence

Baseline `npm test`: 65/65, 12 files. After corrections: same 65/65, lint, typecheck and production build PASS. `npm run check:pages`: 87 pages, zero problems. `actionlint .github/workflows/ci.yml`: PASS. Generated sitemap: 84 unique canonical URLs, every URL found in prerender manifest; robots links sitemap and excludes API/assistant paths. These crawler exclusions are not access control.

SHA-256 map of all 28 files in data/ identical before and after; no data, schemas, finance calculations, interactions, styling, dependencies or agent changes. Existing next/font build downloads are separate from data-source/Vertex calls.

Deterministic content gate before and after: 69 cases, zero mismatch, embedded claim self-test 32 cases PASS; complete outputs saved during session. `diff -u` of outputs: empty. This is not a semantic validation of the installed cloud routine, which was not touched. The only prompt changes in this branch state the existing schedule.

## Hub and remaining ownership

WEBMASTER state is reconciled separately: canonical memory, handoff, README/roadmap, missing refresh report and author/IAM documentation. IAM readback confirms ten human bindings; no grants changed. Local ports 8794/8789 have no listeners. Eight raw files match their tracked gzip evidence byte for byte and receive exact ignore rules; none deleted.

Old PRs #1/#3/#4/#5 are still OPEN/non-draft and ancestors of #6; closure/draft conversion requires coordination with Antonio. No old PR edited. Signed MS-2026-021 PDF is absent locally and cannot be reconstructed. Six closed-plan archival moves and remaining unique untracked evidence are left intact to avoid broad reference churn or data loss. Agent activation, cloud wiring, privacy approval, legal gates, cost/credit and live provider tests remain pending.

## Rollback

Revert this fix commit after review; no data migration or cloud rollback needed. CI’s first remote run and actual sitemap/robots publication are separate evidence from local build and require observation after push/merge. Original clone branch will be restored after handoff.
