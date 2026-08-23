# NEXT_SESSION.md

> State index, written by OWNER at merge. Law: `../GEMINI.md` · map: `CLAUDE.md`.

## Read first

`AUDIT_2026-08-14.md` + `audit/`. Every card carries a **STOP** — the edit limit. Older docs are partly wrong; audits win.

## State — 2026-08-23 · v1.1.2

- **Single executor.** GEMINI does 100% of the work; OWNER decides rates, schema, queue, laws.
- **Import Firewall.** `FOREIGN_ORIGIN` in `gate-dv.mjs` fails commits on symbols borrowed from other projects; the global `~/.gemini/GEMINI.md` is principles only and is outranked here.
- **Hooks versioned.** `core.hooksPath=.githooks`; pre-commit bumps the version, rebuilds `sw.js`.
- **PWA fixed.** `build-sw.mjs` cached a `favicon.ico` that never existed — one 404 killed `cache.addAll()` and offline with it. Assets are asserted at build.
- ⚠️ **Actions dead** — `test` never starts (billing). Merges rely on local gates.

## In progress

Branding WIP uncommitted: `css/style.css`, `index.html`. SVGs landed in DS-02.

## Next

**PERF-03** — white flash on tab switch: `--bg-vanta` (`style.css:7`) is declared nowhere, so the root paints nothing under the view transition.
**CALC-01** — input VAT 24% never reclaimed, ≈€4 900/yr. OWNER pins the rate; the test with the number lands first.
**SHIFT-02** — shift km stored, shown nowhere.
**DS-03** — frosted 3D icon as raster; deferred by OWNER to its own session.

## OWNER decisions pending

ΕΔΧ €45 × 13/day vs ΕΙΧ €130–180 × 1–2/day · `efkaPerOwner` €250 vs €140/mo.
