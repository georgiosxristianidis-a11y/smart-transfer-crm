# NEXT_SESSION.md

> State index, written by OWNER at merge. Law: `../GEMINI.md` · map: `CLAUDE.md`.

## Read first

`AUDIT_2026-08-14.md` + `audit/`. Every card carries a **STOP** — the edit limit. Older docs are partly wrong; audits win.

## State — 2026-08-30 · v1.1.6

- **Single executor.** GEMINI executes 100%; OWNER decides rates, schema, queue, laws.
- **DATA-14 closed.** TripsStore.completeTrip(tripId, shiftId) atomic complete & shift bind.
- **PERF-04 closed.** Shifts timer pauses on background/screen lock via visibilitychange.
- **DB-01 closed.** IndexedDB singleton across stores, onversionchange handling, unit tests.
- **SHIFT-02 closed.** Closed shifts history with distance ("+N км") in Учёт (`shifts.view.js`).
- **CALC-01 closed.** Magic numbers moved to DEFAULT_STATE, NUMERIC_RANGES guards added.
- **PERF-03 closed.** Tab switch white flash eliminated (`--bg-vanta` aligned).
- **CLEAN-02 closed.** Demo refuels removed on empty storage fallback.
- **CLEAN-01 closed.** CSV export deleted to remove formula injection vector.

## In progress

_none_ (working tree clean)

## Next

**CALC-01 (input VAT)** — input VAT 24% never reclaimed, ≈€4 900/yr. OWNER pins the rate; test with literal number lands first.
**DS-03** — frosted 3D icon as raster; deferred by OWNER to its own session.

## OWNER decisions pending

ΕΔΧ €45 × 13/day vs ΕΙΧ €130–180 × 1–2/day · `efkaPerOwner` €250 vs €140/mo.
