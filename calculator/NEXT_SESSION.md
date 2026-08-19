# NEXT_SESSION.md

> State index. Written only by 🟠 LEAD, at merge time.
> Content lives in `docs/handoff/`. Document map: `CLAUDE.md`. Owner's glossary (RU): `docs/RULES.md`.

## ⚠️ Read before touching any code

`docs/handoff/AUDIT_2026-08-14.md` (35 findings) and `docs/handoff/audit/` (13 cards). Every card carries a **STOP** field — the edit boundary. Do not cross it. Older docs are partly wrong; the audits supersede them.

## State — 2026-08-19 · v1.1.0

- Card = branch = commit. A pre-commit hook now blocks direct commits on `master`.
- Merged before: AUDIT-01, AUDIT-03, AUDIT-05 + DATA-01, NAV-01, NAV-05, DS-01, CALC-00.
- This release: AUDIT-02 (honest flight status), AUDIT-04, AUDIT-06 (strict CSP), AUDIT-08 + INFRA-01/02 (lint gate green at last), CSV/WhatsApp import, NAV-02, NAV-03, **DATA-10** (shift entity, IDB v3, envelope schema v2).

## In progress

*None.*

## Next

**DATA-11** — shift UI. DATA-10 stores and backs up a shift; nothing on screen opens, closes or shows one.

**CALC-01** — input VAT 24% never reclaimed, ≈€4 900/yr overstated. 🟠 pins the rate per expense line before 🔵 codes it.

## Owner decisions not yet executed

- Defaults model which business: ΕΔΧ €45 × 13/day or ΕΙΧ €130–180 × 1–2/day.
- Confirm `efkaPerOwner`: store says €250/mo, field research €140/mo — €2 640/yr on two owners.
