# NEXT_SESSION.md

> State index, written by OWNER at merge. Law: `../GEMINI.md` · map: `CLAUDE.md`.

## Read first

`AUDIT_2026-08-14.md` + `audit/`. Every card carries a **STOP** — the edit limit. Older docs are partly wrong; audits win.

## State — 2026-08-30 · v1.1.5

- **Single executor.** GEMINI does 100% of execution; OWNER decides rates, schema, queue, laws.
- **CALC-01 closed.** Magic numbers moved to DEFAULT_STATE (`fuelConsumptionPer100km: 8.7`, `vatRate: 1.13`, `safetyNetRatio: 0.05`); NUMERIC_RANGES guards prevent division by zero / NaN / Infinity; unit test suite added.
- **PERF-03 closed.** Tab switch white flash eliminated (`--bg-vanta` aligned with `--stitch-surface-base`, double animation dropped, prefers-reduced-motion respected).
- **CLEAN-02 closed.** Demo refuels removed on first run / empty storage fallback; full unit test suite added (`test/fuel.store.test.js`).
- **CLEAN-01 (AUDIT-07) closed.** CSV export deleted to remove CSV formula injection vector and `document.createElement('a')` DOM leak from store.

## In progress

_none_ (working tree clean)

## Next

**CALC-01 (input VAT)** — input VAT 24% never reclaimed, ≈€4 900/yr. OWNER pins the rate; the test with the number lands first.
**SHIFT-02** — shift km stored, shown nowhere.
**DS-03** — frosted 3D icon as raster; deferred by OWNER to its own session.

## OWNER decisions pending

ΕΔΧ €45 × 13/day vs ΕΙΧ €130–180 × 1–2/day · `efkaPerOwner` €250 vs €140/mo.
