# NAV_SPEC.md — Navigation logic, Smart Transfer

> Approved 2026-08-14 by the product owner. Takes precedence over aesthetic preference and developer convenience.
> Process: `docs/handoff/PROTOCOL.md` · Queue: `docs/handoff/QUEUE.md` · Owner's glossary (RU): `docs/RULES.md`

---

## 0. Context

**Users today:** two co-owners of one car, both driving. No hired drivers.

**Real usage context:** not motion, but **waiting** — airport stand, hotel kerb, petrol station, gap between transfers. Engine running, but the person is not driving at that moment. Conditions are degraded: sun on the screen, sweaty fingers, end-of-day fatigue, mild hurry.

**Purpose:** not to calculate — Excel calculates. To **shorten the time between a question at the kerb and its answer**. The driver asks four: where now → at what time → how much for it → will I make it.

**Competitor: Excel.** It is more powerful and more stable at analysis, and we **do not try to beat it there**. We win in three places it cannot reach: next action instead of a table, one-tap entry, offline on the road. Excel stays the endpoint via CSV export — which doubles as the data safety net.

**Uncontested niche:** two co-owners of one car + pre-booked transfers + flight tracking.

**Principal risk:** not a wrong calculation — **data loss**. Local IndexedDB with no backup: one cache clear wipes a season.

---

## 1. Layout

| # | Tab | The single question it answers | Who and when |
|---|---|---|---|
| 1 | **Смена** | "What's next, and how am I tracking against the norm?" | Driver, all day, at stops |
| 2 | **Учёт** | "Is everything logged and does it reconcile?" | Driver, end of shift |
| 3 | **Бизнес** | "What does it come to, and how do we split it?" | Co-owner, evening / monthly |
| 4 | *(empty)* | — | Reserved for a second car. **Deliberately unused** |

**Test a tab must pass:** it owns a question that does not overlap its neighbours. Fails the test → not a tab.

The fourth slot stays empty on purpose. A "Машина" tab (fuel, servicing, insurance, mileage) will be born on its own once there is a second car or servicing to track. Not before: today that is a single number.

---

## 2. Migration from the old five-tab layout

| Was | Now |
|---|---|
| Диспетчер | → **Смена**. The HUD stops being a modal and becomes the top of the screen |
| Топливо | → **Учёт** (history) + a `⛽` button on Смена. The tab disappears, access gets faster |
| Калькулятор | → **Бизнес**, "daily norm" section. Open, not behind a hidden gesture |
| Аналитика | → **Бизнес** |
| B2B | ❌ **Deleted.** A placeholder occupying 20% of the navigation and delivering nothing |
| Header (`Сегодня €` / `Поездок` / `Месяц €`) | Unchanged. Marked for the driver-mode seam (§5) |

---

## 3. User path — a closed loop

The old version's core defect: **plan and fact were two unconnected worlds.** The calculator showed a pretty annual figure with no link to what was actually done today.

```
   ┌──────────────────────────────────────────────────┐
   │                                                  │
   ▼                                                  │
БИЗНЕС                СМЕНА                УЧЁТ       │
season sliders   →  "norm: 13 trips"    →  reconcile ─┘
(fare, days,        "today 9 of 13"        the day
 owner shares)      ⛽ +€90 · + trip       CSV → Excel
```

| Moment | Screen | Action |
|---|---|---|
| Morning, at the car | Opens → **Смена** | First transfer, time, flight, "0 of 13" |
| Airport, waiting | **Смена** | A glance: flight status, next address |
| Booking by phone | **Смена** | `+ Поездка` — one tap from the start screen |
| Refuelling | **Смена** | `⛽` → `+€90` — two taps, no visual search |
| End of shift | **Учёт** | "Did I log everything?" Gaps, cash vs card |
| Evening, monthly | **Бизнес** | Sliders → shares and taxes → new norm → loop closes |

---

## 4. Seven laws

1. **A tab is a user question**, not an app section. No question of its own → no tab.
2. **Content changes, layout never.** Nothing pops in, moves or disappears.
3. **Always start on Смена.** No contextual cleverness, no restoring the last tab. Predictability *is* the design for fatigue: in that state a person does not read the screen, they recall it.
4. **Air comes from spacing, not from paleness.** Contrast follows importance: hero ≥7:1 and bold, decor muted. One hero per screen. AA (4.5:1) is an indoor threshold, not a Cretan-sun one.
5. **A frequent action is never hidden behind a gesture.** Hidden gestures are for diagnostics only.
6. **Progress in trips, not euros.** A norm has a finish line; a euro figure does not.
7. **No feature without an owner in the budget.**

---

## 5. Deliberately deferred: driver mode

**Not built.** There are two users and both are owners. Building a boundary for a person who does not exist is forbidden by law #7.

**But the seam stays** — near free:

> Every element showing business money (takings, month, shares, taxes, forecast) gets a marker attribute. Today it does nothing. The day a relief driver appears, the mode switches on with one line of CSS instead of a rewrite of three tabs.

**Hired-driver economics:** ~€50/day plus tips. Takings are of no use to them and actively demotivate: €340 passed through their hands, €50 landed. Their mode is **zero euros on screen except their own tips**, plus "9 of 13" as a target. The same progress element serves both modes.

**Important:** a PIN in a client-side PWA is **a curtain, not a lock** — anyone with DevTools reads IndexedDB straight through. A curtain is legitimate for removing noise; calling it protection is not. Real protection is backup, and — once a hired driver exists — a separate build with no economics in it.

**Data model for later:** a trip gets a "performer" field, an expense gets a "vehicle" field. Two fields, free today. Navigation must not be built for them yet.

---

## 6. Risks found during the review

| Risk | Priority |
|---|---|
| 🔴 **The PWA does not exist.** `index.html` has neither `navigator.serviceWorker.register()` nor `<link rel="manifest">` — verified across the whole git history. `sw.js`, `manifest.json`, `build-sw.mjs`, `kill-sw.html` and the "run `npm run build:sw` after every edit" rule are ~150 lines and a ritual around code that **never executed**. There is no offline, and therefore no advantage over Excel. Also: the asset list misses `fuel.*` and `flight.service.js`, and `index.html` loads Chart.js `4.4.0` against `4.4.1` in the cache | Blocker |
| 🔴 **Data loss.** Local IndexedDB, no backup. One cache clear = one season | Blocker |
| 🔴 **"Next transfer" returns past trips** — the hero of the Смена screen | Blocker |
| 🔴 **Timezone: UTC dates in a local context (+3)** — every date and time is off | Blocker |
| 🔴 **Flight status is a simulation passed off as live data.** It decides when to leave for the airport | Blocker |
| 🟡 ESLint installed but never runs; CSP decorative; CSV injection | High |
| 🟡 No version in the UI. The auto-bump hook exists and bumps `package.json`, but nothing renders it | Medium |

---

## 7. Work items

Roles and product laws in short form: `CLAUDE.md`. Execution order and full task list: `docs/handoff/QUEUE.md`.

Navigation cards sit **after** the data fixes, and that is dependency, not preference: `NAV-02` and `NAV-05` push the next transfer and the "9 of 13" progress into the most visible place on screen. While `getNextUpcomingTrip()` returns the past, dates are off by three hours and flight status is invented, navigation would only make the lie louder and more convincing.

The original `FIX-01` ("repair the asset list") is **cancelled**: it would have fixed nothing, because the Service Worker was never registered. Replaced by item 1 in `QUEUE.md`.
