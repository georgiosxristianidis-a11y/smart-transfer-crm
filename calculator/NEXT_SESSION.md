# NEXT_SESSION.md

> State index, written by OWNER at merge. Law: `../GEMINI.md` · map: `CLAUDE.md`.

## Read first

`AUDIT_2026-08-14.md` + `audit/`. Every card carries a **STOP** — the edit boundary. Older docs are partly wrong; the audits win.

## State — 2026-08-23 · v1.1.0

- **Single executor.** GEMINI does 100% of the work; OWNER decides rates, schema, queue, laws. No second model — the net is machine-side.
- **Import Firewall.** `FOREIGN_ORIGIN` in `gate-dv.mjs` fails commits on symbols borrowed from other projects. Global `~/.gemini/GEMINI.md` is principles only and is outranked by root `GEMINI.md`.
- **Hooks versioned.** `core.hooksPath=.githooks`; pre-commit bumps the version and rebuilds `sw.js`.
- **PWA fixed.** `build-sw.mjs` cached a `favicon.ico` that never existed — one 404 killed `cache.addAll()` and offline with it. Assets are scanned and asserted; `CACHE_NAME` follows the version; `manifest.json` got real icons and scope.
- ⚠️ **Actions dead** — `test` job never starts (billing). Merges rely on local gates.

## In progress

Branding WIP uncommitted: `css/style.css`, `index.html`. SVGs and manifest landed in DS-02.

## Next

**CALC-01** — input VAT 24% never reclaimed, ≈€4 900/yr overstated. OWNER pins the rate; the literal-number test lands before the code.
**SHIFT-02** — shift kilometres stored, shown nowhere (`getShiftDistance()` has no caller).

## OWNER decisions pending

ΕΔΧ €45 × 13/day vs ΕΙΧ €130–180 × 1–2/day · `efkaPerOwner` €250 vs €140/mo.
