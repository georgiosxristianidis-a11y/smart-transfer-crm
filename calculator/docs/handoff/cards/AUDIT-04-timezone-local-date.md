# AUDIT-04 — Timezone: UTC dates used in local context (Crete UTC+3)

**Severity:** CRITICAL · **Size:** S · **Owner:** 🔵 HORSE

## Goal
Dates for trips, fuel entries, stats and exports must use the driver's local timezone (+3 on Crete) rather than UTC, eliminating midnight-to-03:00 date shifts.

## Symptom & root
Between 00:00 and 03:00 local time on Crete (UTC+3), `new Date().toISOString().split('T')[0]` returns yesterday's date. New trips and fuel entries get logged under yesterday, today's revenue in the header is undercounted, and `new Date(t.date)` risks shifting months across timezone boundaries.

## Scope
- `js/shared/utils.js`
- `js/fuel.store.js`
- `js/trips.store.js`
- `js/trips.view.js`
- `js/app.js`
- `js/shared/backup.service.js`
- `test/utils.test.js`
- `test/trips.store.test.js`
- `docs/handoff/cards/AUDIT-04-timezone-local-date.md`

Everything else is off-limits.

## STOP
1. A file outside Scope is needed → stop, escalate to 🟠 LEAD.
2. Tab count, start tab, fixed button position or data schema would change → stop.
3. Google Calendar link format changed from UTC → stop (Google Calendar requires UTC).
4. A second bug found → do not fix it, finish this card.

## Done when
1. `localDateKey()` and `parseLocalDate()` are exported from `shared/utils.js`.
2. All `toISOString().split('T')[0]` calls for local dates are replaced by `localDateKey()`.
3. All `new Date(stringDate)` calls for YYYY-MM-DD parsing are replaced by `parseLocalDate()`.
4. `generateGCalLink()` handles empty `trip.time` without throwing `RangeError`.
5. Unit tests verify date formatting and boundary parsing without day shifts.
6. All gates print 0.

## Gates
- `node --test` — 0 failures
- `node scripts/check-docs-budget.mjs` — prints 0

## Found along the way
trips.store.js:274 — DOM export logic in Store is a legacy violation tracked under AUDIT-07, left untouched here per Scope & STOP.
