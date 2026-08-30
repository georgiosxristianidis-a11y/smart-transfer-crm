# QUEUE.md — Work queue

> Owner: `G` = GEMINI. Order: integrity & loss first, then structure, then presentation. Rules: `PROTOCOL.md` · `NAV_SPEC.md`.

---

## Queue

| # | Task | Owner | Status | Source |
|---|---|---|---|---|
| 1 | Register SW + manifest + honest asset list + Chart.js `4.4.1` | 🟠 | ✅ **merged** | audit/01 |
| 2 | Data backup and schema version (JSON export/import) | 🟢 | ✅ **merged** | audit/05 |
| 3 | Timezone: UTC dates in a local context (+3) | 🔵 | ✅ **done** (AUDIT-04) | audit/04 |
| 4 | "Next transfer" returns trips in the past | 🔵 | ✅ **merged** | audit/03 |
| 5 | Flight status: stop passing a simulation off as live data | G | — | audit/02 |
| 6 | **NAV-01** — delete B2B, collapse nav to Смена · Учёт · Бизнес | 🔵 | ✅ **merged** | NAV_SPEC |
| 7 | **NAV-02** — HUD from modal to the top of the Смена screen | 🔵 | ✅ **merged** | NAV_SPEC |
| 8 | **NAV-03** — fuel history into Учёт, button onto Смена | 🔵 + 🟢 | ✅ **merged** | NAV_SPEC |
| 9 | **NAV-04** — calculator into Бизнес as "daily norm", persist sliders | G | — | NAV_SPEC |
| 10 | **NAV-05** — "9 of 13" progress on Смена, one hero per screen | 🔵 + 🟢 | ✅ **merged** | NAV_SPEC |
| 11 | ESLint into the gates (installed but never runs) | 🔵 | ✅ **merged** | audit/08 |
| 12 | CSP decorative: `unsafe-inline` + `unsafe-eval` | 🔵 | ✅ **done** (AUDIT-06) | audit/06 |
| 13 | CSV injection + `exportCSV` breaks Store/View | G | ✅ **done** (CLEAN-01) | audit/07 |
| 14 | **DS-01** — contrast hierarchy in tokens (hero / primary / decor) | 🟢 | ✅ **merged** | NAV_SPEC |
| 15 | **NAV-06** — driver-mode seam: marker on money elements | G | — | NAV_SPEC |
| 16 | **DEV-01** — version in UI + diagnostics behind 5 taps | G | — | NAV_SPEC |
| 17 | Full `innerHTML` re-render + subscription leak | G | — | audit/10 |
| 18 | Demo fuel data shipped to a real user | G | ✅ **done** (CLEAN-02) | audit/11 |
| 19 | `alert`/`confirm` and modals without a11y | G | — | audit/12 |
| 20 | Magic numbers and division by zero in calculations | G | ✅ **done** (CALC-01) | audit/13 |
| 21 | View layer untested (~800 lines) | G | — | audit/09 |
| 22 | **CALC-00** — licence regime (ΕΔΧ / ΕΙХ) and minimum fare | 🟠 | ✅ **merged** | economics review |
| 23 | **CALC-01** — input VAT 24% never reclaimed (≈€4 900/yr) | G | — | economics review |
| 24 | **CALC-02** — hotel commission per pickup: absent from the model | G | — | economics review |
| 25 | **CALC-03** — shoulder/winter seasons; reserve replaces the 5% magic | G | — | economics |
| 26 | **CALC-04** — depreciation, 22% tax, break-even fare | G | — | economics |
| 27 | **DATA-10** — shift as an entity (IDB v3), trip gains `shiftId` | 🟠 | ✅ **done** (no UI) | DATA-10 |
| 28 | **INFRA-02** — lint gate red on the import parser | 🟠 | ✅ **done** | INFRA-02 |
| 29 | **DATA-11** — shift UI: open/close, norm by shift | 🔵 | ✅ **merged** | card |
| 30 | **GEM-01** — handover: import firewall, auto-bump, PWA manifest | G | ✅ **done** | 23.08 |
| 31 | **DS-02** — logo: one geometry, two weights; maskable safe zone | G | ✅ **done** | card |
| 32 | **PERF-03** — white flash on tab switch: root paints nothing | G | ✅ **done** (PERF-03) | card |

**CALC is money math:** OWNER pins rates in card; test with literal number lands first.

---

## Sources
`docs/handoff/audit/` — P0–P2 verdicts · `AUDIT_2026-08-14.md` · `NAV_SPEC.md` · `cards/`


