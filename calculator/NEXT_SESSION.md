# NEXT_SESSION.md

> State index. Written only by 🟠 LEAD, at merge time.
> Content lives in `docs/handoff/`. Document map: `CLAUDE.md`. Owner's glossary (RU): `docs/RULES.md`.

## ⚠️ Read before touching any code

`docs/handoff/AUDIT_2026-08-14.md` (35 findings) and `docs/handoff/audit/` (13 cards). Every card carries a **STOP** field — the edit boundary. Do not cross it. Older docs are partly wrong; the audits supersede them.

## State — 2026-08-16

- Protocol: sequential by default, card = branch = commit, squash into `master`. Remote is live; PRs gate on CI.
- Merged: AUDIT-01 (SW + manifest), AUDIT-03, AUDIT-05 + DATA-01 (backup, schema v2), NAV-01 (delete B2B tab), NAV-05, DS-01, **CALC-00** (licence regime ΕΔΧ/ΕΙΧ + minimum fare).

## In progress

*None.*

## Next

**CALC-01** — input VAT 24% is never reclaimed: fuel, servicing, tyres and overheads are expensed gross, overstating cost by ≈€4 900/yr. 🟠 writes the card (which expense line carries which rate — insurance and ΕΦΚΑ are exempt) before 🔵 codes it.

Open and independent: items 3, 5.

## Owner decisions not yet executed

- Which business the defaults model: ΕΔΧ €45 × 13/day or ΕΙΧ €130–180 × 1–2/day. CALC-00 made it a switch, so only defaults hang on it.
- Confirm `efkaPerOwner`: store says €250/mo, field research €140/mo — €2 640/yr on two owners.
- Add a gate refusing commits made directly on `master`.
