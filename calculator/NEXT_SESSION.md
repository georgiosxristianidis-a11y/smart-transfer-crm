# NEXT_SESSION.md

> State index. Written only by 🟠 LEAD, at merge time.
> Content: `docs/handoff/`. Map: `CLAUDE.md` · glossary (RU): `docs/RULES.md`.

## ⚠️ Read before touching any code

`AUDIT_2026-08-14.md` (35 findings) + `docs/handoff/audit/` (13 cards). Every card carries a **STOP** field — the edit boundary. Older docs are partly wrong; the audits win.

## State — 2026-08-19 · v1.1.0

- Card = branch = commit; a pre-commit hook blocks commits on `master`.
- Merged to date: see `QUEUE.md` status column. v1.1.0 closed AUDIT-02/04/06/08, INFRA-01/02, NAV-02/03, **DATA-10** (shift entity, IDB v3, schema v2).
- Since: **DATA-11** (shift UI, PR #6 → `e658c6b`). A trip binds to a shift **on completion**, not on create — the hotel list predates any shift, so binding on create holds the norm at 0.
- ⚠️ **Actions dead** — the `test` job never starts (billing). PROTOCOL §4's gate is off; DATA-11 merged on local gates. Fix in Billing & plans or every PR merges CI-unverified.

## In progress

*None.*

## Next

**SHIFT-02** (no card yet) — shift kilometres are stored, shown nowhere (`getShiftDistance()` has no caller). Pairs with a shift-history screen, left out of DATA-11.

**CALC-01** — input VAT 24% never reclaimed, ≈€4 900/yr overstated. 🟠 pins the rate per expense line first.

## Owner decisions not yet executed

- Defaults model which business: ΕΔΧ €45 × 13/day or ΕΙΧ €130–180 × 1–2/day.
- Confirm `efkaPerOwner`: store €250/mo vs field €140/mo — €2 640/yr on two owners.
