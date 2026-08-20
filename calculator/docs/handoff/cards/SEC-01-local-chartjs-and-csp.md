# SEC-01 — Chart.js local, `unsafe-eval` gone, offline actually offline

**Severity:** HIGH · **Size:** M · **Owner:** 🟠 LEAD-OPUS

## Goal
Third-party code stops being fetched at runtime, the CSP stops being decorative, and the app finally loads with no network.

## Symptom & root
- `index.html:6` — CSP carries `'unsafe-inline' 'unsafe-eval'` and whitelists `cdn.jsdelivr.net`. With `unsafe-eval` allowed and a CDN script without SRI, any injected string runs with full access to IndexedDB and localStorage — including the Telegram token SYNC-01 stores there. Queue item 12.
- `index.html:15` — Chart.js loads from jsDelivr at runtime: the first offline launch has no charts.
- `sw.js` `ASSETS` omits `js/shared/backup.service.js`, which `app.js:7` imports — the offline launch breaks on it. The `build:sw` gate (`CLAUDE.md:34`) was not run.

## Scope
- `vendor/chart.umd.min.js` — **new**, vendored, pinned to 4.4.1.
- `index.html` — local script tag, CSP tightened.
- `sw.js` — **regenerated only**, never hand-edited.
- `scripts/build-sw.mjs` — include `vendor/` if it does not yet.

Everything else is off-limits.

## STOP
1. File outside Scope → stop, escalate.
2. Upgrading Chart.js → **no**, pin 4.4.1 exactly; a version change is its own card.
3. Dropping `'unsafe-inline'` from `style-src` → separate card, it breaks inline styles.
4. Hand-editing `ASSETS` in `sw.js` → forbidden; run the generator.
5. Second bug found → log below, do not fix.

## Done when
1. `grep -n "cdn.jsdelivr" index.html sw.js` returns nothing.
2. `'unsafe-eval'` is gone from the CSP and charts still render.
3. `sw.js` `ASSETS` contains every file under `js/` including `shared/backup.service.js`, plus `vendor/`, and was produced by the generator.
4. DevTools offline, hard reload: the app opens, tabs switch, charts draw.

## Gates
- `npm test` — 0 failures
- `npm run build:sw` — prints 0 and leaves `sw.js` unchanged on a second run
- `npm run docs:budget` — prints 0

## Found along the way
_(empty)_
