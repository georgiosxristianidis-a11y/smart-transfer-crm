# QUEUE.md — Single work queue

> Owner: 🟠 LEAD-OPUS. Updated on merge.
> Card format and rules: `docs/handoff/PROTOCOL.md` · Product: `docs/NAV_SPEC.md`

**Sort order: by dependency and harm.** First what **lies or loses data**, then structure, then presentation.

> Why not "navigation first": while dates are +3h off and the flight status is fabricated, `NAV-02` would only move the lie into the largest type at the highest contrast. Full reasoning: `NAV_SPEC.md` §7.

---

## Queue

| # | Task | Owner | Status | Source |
|---|---|---|---|---|
| 1 | Register SW + `<link rel="manifest">` + honest asset list + Chart.js `4.4.1` | 🟠 | ✅ **merged** | AUDIT P0-01 · audit/01 |
| 2 | Data backup and schema version (JSON export/import, last-backup marker) | 🟢 | ✅ **merged** | audit/05 |
| 3 | Timezone: UTC dates in a local context (+3) | 🔵 | ✅ **done** (AUDIT-04) | audit/04 |
| 4 | "Next transfer" returns trips in the past | 🔵 | ✅ **merged** | audit/03 |
| 5 | Flight status: stop passing a simulation off as live data | 🟠 | — | audit/02 |
| 6 | **NAV-01** — delete the B2B tab, collapse nav to three: Смена · Учёт · Бизнес | 🔵 | ✅ **merged** | NAV_SPEC |
| 7 | **NAV-02** — HUD from modal to the top of the Смена screen | 🔵 | ✅ **merged** | NAV_SPEC |
| 8 | **NAV-03** — fuel: history into Учёт, `⛽` button onto Смена | 🔵 + 🟢 | ✅ **merged** | NAV_SPEC |
| 9 | **NAV-04** — calculator into Бизнес as "daily norm", persist sliders | 🔵 | — | NAV_SPEC |
| 10 | **NAV-05** — "9 of 13" progress on Смена, one hero per screen | 🔵 + 🟢 | ✅ **merged** | NAV_SPEC |
| 11 | ESLint into the gates (installed but never runs) | 🔵 | ✅ **merged** | audit/08 |
| 12 | CSP is decorative: `unsafe-inline` + `unsafe-eval` | 🔵 | ✅ **done** (AUDIT-06) | audit/06 |
| 13 | CSV injection + `exportCSV` breaks Store/View | 🔵 | — | audit/07 |
| 14 | **DS-01** — contrast hierarchy in tokens (hero / primary / decor) | 🟢 | ✅ **merged** | NAV_SPEC |
| 15 | **NAV-06** — driver-mode seam: marker on money elements | 🔵 | — | NAV_SPEC |
| 16 | **DEV-01** — version in UI + diagnostics screen behind 5 taps | 🔵 | — | NAV_SPEC |
| 17 | Full `innerHTML` re-render + subscription leak | 🔵 | — | audit/10 |
| 18 | Demo fuel data shipped to a real user | 🔵 | — | audit/11 |
| 19 | `alert`/`confirm` and modals without a11y | 🟢 | — | audit/12 |
| 20 | Magic numbers and division by zero in calculations | 🔵 | — | audit/13 |
| 21 | View layer untested (~800 lines, 0%) | 🔵 | — | audit/09 |
| 22 | **CALC-00** — licence regime (ΕΔΧ / ΕΙΧ) and minimum fare | 🟠 | ✅ **merged** | economics review |
| 23 | **CALC-01** — input VAT 24% is never reclaimed (≈€4 900/yr overstated) | 🟠 card · 🔵 code | — | economics review |
| 24 | **CALC-02** — hotel commission per pickup: absent from the model entirely | 🟠 card · 🔵 code | — | economics review |
| 25 | **CALC-03** — shoulder and winter seasons; winter reserve replaces the 5% magic number | 🔵 | — | economics review |
| 26 | **CALC-04** — depreciation, 22% profit tax, break-even fare | 🟠 card · 🔵 code | — | economics review |
| 27 | **DATA-10** — shift as an entity (IDB v3), trip gains `shiftId`/`actualLanding` | 🟠 | ✅ **done** (no UI) | DATA-10 |
| 28 | **INFRA-02** — lint gate red on the import parser | 🟠 | ✅ **done** | INFRA-02 |
| 29 | **DATA-11** — shift UI: open/close, norm by shift | 🔵 | — | card |

**CALC is money math:** 🟠 pins rates and formula in the card before 🔵 types. A wrong VAT rate on the wrong line fails no test, it silently inflates profit. Item 25 also settles item 20's magic `netRevenue * 0.05`.

**Owner decision, defaults only:** ΕΔΧ €45 × 13/day or ΕΙΧ €130–180 × 1–2/day. CALC-00 made it a switch, nothing is blocked.

---

## Sources

| Doc | Contents |
|---|---|
| `docs/handoff/audit/` | Audit P0–P2, per-layer verdicts |
| `docs/handoff/AUDIT_2026-08-14.md` | 35 findings P0–P3 with STOP fields |
| `docs/NAV_SPEC.md` | 10 navigation cards |

`audit/` is read-only history; `cards/` holds work cards.

