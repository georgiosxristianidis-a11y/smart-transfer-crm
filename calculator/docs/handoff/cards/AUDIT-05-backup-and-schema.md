# AUDIT-05 — Data backup, schema version and persistence

**Severity:** CRITICAL · **Size:** M · **Owner:** 🟢 GEMINI 3.7

## Goal
Provide full business data backup/restore (trips, fuel, calc settings) via JSON snapshot with schema versioning and persistent storage request so user data is never silently lost.

## Symptom & root
Storage is fragmented across IndexedDB and localStorage with no full export/import or schema version (`audit/05`). Browser cache clears or disk pressure silently wipe all season data.

## Scope
- `js/shared/backup.service.js`
- `js/shared/db.js`
- `js/trips.store.js`
- `js/fuel.store.js`
- `js/calculator.store.js`
- `index.html`
- `test/backup.service.test.js`
- `docs/handoff/cards/AUDIT-05-backup-and-schema.md`
- `docs/handoff/QUEUE.md`

Everything else is off-limits.

## STOP
1. A file outside Scope is needed → stop, escalate to 🟠 LEAD.
2. Tab count, start tab, or fixed button position changes → stop.
3. System emojis or unvetted SVG icons used → stop (use Material Symbols Maps SVGs).
4. A second bug found → do not fix it. Log it below, finish this card.

## Done when
1. Full JSON backup export/import works for trips, fuel, and calculator settings with `schemaVersion: 2`.
2. Storage requests `navigator.storage.persist()`.
3. `generateId` uses `crypto.randomUUID()`.
4. Unit tests pass (export, import, schema validation, bad json fallback).
5. All gates print 0.

## Gates
- `npm test` — 0 failures
- `npm run docs:budget` — prints 0
- `npm run build:sw` — assets up to date
