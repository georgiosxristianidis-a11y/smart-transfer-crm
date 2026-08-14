# QUEUE.md — Single work queue

> Owner of this file: 🟠 LEAD-OPUS. Updated on merge.
> Card format and rules: `docs/handoff/PROTOCOL.md` · Product: `docs/NAV_SPEC.md`

**Sort order: by dependency and harm.** First what **lies or loses data**, then structure, then presentation.

> Why not "navigation first": `NAV-02` puts the next transfer at the top of the screen and `NAV-05` puts the "9 of 13" progress next to it. But `getNextUpcomingTrip()` returns past trips, dates are shifted by +3 hours, and the flight status is fabricated. Shipping navigation first would take the lie and place it in the most prominent spot, in the largest type, at the highest contrast. The app would not get better — its error would get louder.

---

## Queue

| # | Task | Owner | Status | Source |
|---|---|---|---|---|
| 1 | Register SW + `<link rel="manifest">` + honest asset list + Chart.js `4.4.0`/`4.4.1` | 🟠 | 🔵 **in progress** | AUDIT P0-01 · cards/01 |
| 2 | Data backup and schema version (JSON export/import, last-backup marker) | 🟠 | — | cards/05 |
| 3 | Timezone: UTC dates in a local context (+3) | 🔵 | — | cards/04 |
| 4 | "Next transfer" returns trips in the past | 🔵 | — | cards/03 |
| 5 | Flight status: stop passing a simulation off as live data | 🟠 | — | cards/02 |
| 6 | **NAV-01** — delete the B2B tab, collapse nav to three: Смена · Учёт · Бизнес | 🔵 | — | NAV_SPEC |
| 7 | **NAV-02** — HUD from modal to the top of the Смена screen | 🔵 | — | NAV_SPEC |
| 8 | **NAV-03** — fuel: history into Учёт, `⛽` button onto Смена | 🔵 + 🟢 | — | NAV_SPEC |
| 9 | **NAV-04** — calculator into Бизнес as "daily norm", persist sliders | 🔵 | — | NAV_SPEC |
| 10 | **NAV-05** — "9 of 13" progress on Смена, one hero per screen | 🔵 + 🟢 | — | NAV_SPEC |
| 11 | ESLint into the gates (installed but never runs) | 🔵 | — | cards/08 |
| 12 | CSP is decorative: `unsafe-inline` + `unsafe-eval` | 🔵 | — | cards/06 |
| 13 | CSV injection + `exportCSV` breaks Store/View | 🔵 | — | cards/07 |
| 14 | **DS-01** — contrast hierarchy in tokens (hero / primary / decor) | 🟢 | — | NAV_SPEC |
| 15 | **NAV-06** — driver-mode seam: marker on money elements | 🔵 | — | NAV_SPEC |
| 16 | **DEV-01** — version in UI + diagnostics screen behind 5 taps | 🔵 | — | NAV_SPEC |
| 17 | Full `innerHTML` re-render + subscription leak | 🔵 | — | cards/10 |
| 18 | Demo fuel data shipped to a real user | 🔵 | — | cards/11 |
| 19 | `alert`/`confirm` and modals without a11y | 🟢 | — | cards/12 |
| 20 | Magic numbers and division by zero in calculations | 🔵 | — | cards/13 |
| 21 | View layer untested (~800 lines, 0%) | 🔵 | — | cards/09 |

**Item 6 stands apart:** `NAV-01` **deletes** code and depends on nothing. It can be taken at any time — it cannot break anything and it shrinks the surface for everything else.

---

## Sources

| Document | Contents |
|---|---|
| `docs/handoff/cards/` (13 cards) | Audit, P0–P2, with a verdict table per layer. Branch `claude/senior-commands-reference-46d236`, commit `c9c9a43` |
| `docs/handoff/AUDIT_2026-08-14.md` (35 findings) | Technical audit P0–P3 with Severity / Size / Owner / STOP fields. Branch `claude/app-audit-diagnostics-32c122`, commit `6d8936e` |
| `docs/NAV_SPEC.md` | 10 navigation cards |

Both audits still live on their own branches and are not merged into `master`. Consolidating them into `docs/handoff/cards/` in the single format is 🟠 LEAD's job at the first merge.

---

## Branches

| Branch | State |
|---|---|
| `master` | `a7d31da` |
| `claude/driver-nav-logic-e0995d` | Current. Spec and protocol |
| `claude/senior-commands-reference-46d236` | `c9c9a43` — rescued cards. Merge, then delete |
| `claude/app-audit-diagnostics-32c122` | `6d8936e` — rescued audit. Merge, then delete |
| `claude/cranky-thompson-9e0a19` | Empty and clean. **Safe to delete** |
