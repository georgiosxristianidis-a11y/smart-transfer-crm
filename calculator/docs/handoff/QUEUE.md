# QUEUE.md — Single work queue

> Owner of this file: 🟠 LEAD-OPUS. Updated on merge.
> Card format and rules: `docs/handoff/PROTOCOL.md` · Product: `docs/NAV_SPEC.md`

**Sort order: by dependency and harm.** First what **lies or loses data**, then structure, then presentation.

> Why not "navigation first": `NAV-02` puts the next transfer at the top of the screen and `NAV-05` puts the "9 of 13" progress next to it. But `getNextUpcomingTrip()` returns past trips, dates are shifted by +3 hours, and the flight status is fabricated. Shipping navigation first would take the lie and place it in the most prominent spot, in the largest type, at the highest contrast. The app would not get better — its error would get louder.

---

## Queue

| # | Task | Owner | Status | Source |
|---|---|---|---|---|
| 1 | Register SW + `<link rel="manifest">` + honest asset list + Chart.js `4.4.1` | 🟠 | ✅ **merged** | AUDIT P0-01 · audit/01 |
| 2 | Data backup and schema version (JSON export/import, last-backup marker) | 🟠 | — | audit/05 |
| 3 | Timezone: UTC dates in a local context (+3) | 🔵 | — | audit/04 |
| 4 | "Next transfer" returns trips in the past | 🔵 | — | audit/03 |
| 5 | Flight status: stop passing a simulation off as live data | 🟠 | — | audit/02 |
| 6 | **NAV-01** — delete the B2B tab, collapse nav to three: Смена · Учёт · Бизнес | 🔵 | — | NAV_SPEC |
| 7 | **NAV-02** — HUD from modal to the top of the Смена screen | 🔵 | — | NAV_SPEC |
| 8 | **NAV-03** — fuel: history into Учёт, `⛽` button onto Смена | 🔵 + 🟢 | — | NAV_SPEC |
| 9 | **NAV-04** — calculator into Бизнес as "daily norm", persist sliders | 🔵 | — | NAV_SPEC |
| 10 | **NAV-05** — "9 of 13" progress on Смена, one hero per screen | 🔵 + 🟢 | — | NAV_SPEC |
| 11 | ESLint into the gates (installed but never runs) | 🔵 | — | audit/08 |
| 12 | CSP is decorative: `unsafe-inline` + `unsafe-eval` | 🔵 | — | audit/06 |
| 13 | CSV injection + `exportCSV` breaks Store/View | 🔵 | — | audit/07 |
| 14 | **DS-01** — contrast hierarchy in tokens (hero / primary / decor) | 🟢 | — | NAV_SPEC |
| 15 | **NAV-06** — driver-mode seam: marker on money elements | 🔵 | — | NAV_SPEC |
| 16 | **DEV-01** — version in UI + diagnostics screen behind 5 taps | 🔵 | — | NAV_SPEC |
| 17 | Full `innerHTML` re-render + subscription leak | 🔵 | — | audit/10 |
| 18 | Demo fuel data shipped to a real user | 🔵 | — | audit/11 |
| 19 | `alert`/`confirm` and modals without a11y | 🟢 | — | audit/12 |
| 20 | Magic numbers and division by zero in calculations | 🔵 | — | audit/13 |
| 21 | View layer untested (~800 lines, 0%) | 🔵 | — | audit/09 |

**Item 6 stands apart:** `NAV-01` **deletes** code and depends on nothing. It can be taken at any time — it cannot break anything and it shrinks the surface for everything else.

---

## Sources

| Document | Contents |
|---|---|
| `docs/handoff/audit/` (13 cards) | Audit P0–P2 with a per-layer verdict table. Imported as `07be5ac` |
| `docs/handoff/AUDIT_2026-08-14.md` (35 findings) | Technical audit P0–P3 with Severity / Size / Owner / STOP fields. Branch imported as `5fc2a6f` |
| `docs/NAV_SPEC.md` | 10 navigation cards |

Both audits are merged into `master`. `docs/handoff/audit/` holds imported findings (read-only history); `docs/handoff/cards/` holds work cards in the single format. Turning a finding into a work card is 🟠 LEAD's job when the queue reaches it.

---

## Branches

| Branch | State |
|---|---|
| `master` | Spec, protocol, queue, audits merged in; item 1 (AUDIT-01) merged (`f24979c`) |

