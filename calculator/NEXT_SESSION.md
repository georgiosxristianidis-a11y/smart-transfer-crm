# NEXT_SESSION.md

> State index. Written only by 🟠 LEAD, at merge time.
> Content lives in `docs/handoff/`. Document map: `CLAUDE.md`. Owner's glossary (RU): `docs/RULES.md`.

## ⚠️ Read before touching any code

`docs/handoff/AUDIT_2026-08-14.md` (35 findings) and `docs/handoff/cards/` (13 cards). Every card carries a **STOP** field — the edit boundary. Do not cross it. Older docs are partly wrong; the audits supersede them.

## State — 2026-08-14

- Navigation approved: **three tabs — `Смена` · `Учёт` · `Бизнес`**, fourth slot deliberately empty.
- Multi-agent protocol approved: sequential by default, card = branch = commit, squash into `master`.
- Docs budget gate added (`npm run docs:budget`). System docs are English; `docs/RULES.md` is the single Russian file.
- Both rescued audits merged into `master`. Work queue consolidated in `docs/handoff/QUEUE.md`.

## In progress

| # | Task | Owner | Where |
|---|---|---|---|
| 1 | Register SW + manifest + honest asset list + Chart.js version | 🔵 HORSE | `claude/sw-manifest-chartjs-6b2de2` — `wip 6911012`, stopped early, unverified |

## Next

2. Backup and schema version · 3. Timezone +3 · 4. "Next transfer" returns the past · 5. Flight status stops being a simulation.

`NAV-01` (delete B2B, collapse to three tabs) depends on nothing and can be taken at any time.

## Owner decisions not yet executed

- Create the private remote. The code exists on one disk only.
- Add a gate refusing commits made directly on `master`.
