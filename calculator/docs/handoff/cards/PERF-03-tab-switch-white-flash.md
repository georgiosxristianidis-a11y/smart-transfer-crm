# PERF-03 — white flash and dropped frames on tab switch

**Severity:** HIGH · **Size:** S · **Owner:** G

## Goal
Switching tabs shows the app, not a white frame, and holds 60 fps — worst on the 4th nav item.

## Symptom & root
`css/style.css:7` — `html, body { background: var(--bg-vanta) }`. **`--bg-vanta` is defined nowhere** (one use, zero declarations). The root background resolves to transparent, and the only painted background is the fixed `.cosmic-bg` div at `z-index: -2`.

`js/app.js:179` wraps the switch in `document.startViewTransition`. During a root transition the live page is replaced by `::view-transition-old(root)` / `::view-transition-new(root)` snapshots over the browser base canvas — which is white, because the root paints nothing. Hence a white flash for the whole 0.3 s cross-fade (`css/style.css:628`).

Frame cost stacks on top: the cross-fade runs at the same time as `.tab-content.active { animation: fadeUp 0.35s }`, and both snapshots must rasterise 17 `backdrop-filter` layers. The 4th tab is worst because `tab-calc` also builds the Chart.js doughnut on first activation (`calculator.view.js:234`).

## Scope
- `css/tokens.css`
- `css/style.css`
- `js/app.js`

Everything else is off-limits.

## STOP
1. Tab count, start tab or nav positions would change → stop, escalate to OWNER.
2. A hex colour would be written into JS → stop.
3. Chart.js internals or the calculation path would change → stop, that is another card.
4. A second bug found → log it below, finish this card.

## Done when
- The root paints an opaque base from a token; no white frame on any of the four nav items.
- Tab switching runs one animation, not two.
- `prefers-reduced-motion` skips the transition entirely.
- The chart is not built inside the transition callback.

## Gates
- `npm run lint` — 0
- `npm test` — 0 failures
- `node ../.gemini/scripts/gate-dv.mjs` — 0 violations

## Found along the way
<empty>
