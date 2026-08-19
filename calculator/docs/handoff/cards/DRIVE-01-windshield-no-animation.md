# DRIVE-01 — Nothing Animates on a Windshield

**Severity:** MEDIUM · **Size:** S · **Owner:** 🟢 GEMINI 3.7

## Goal
Eliminate all looping animations, pulsing dots, and distracting motion effects inside the Windshield/Driver HUD mode (`.hud-overlay`) and provide strict reduced-motion safeguards, preventing driver distraction and peripheral vision fatigue.

## Symptom & root
When mounted on a car windshield (`.hud-overlay`), flashing/pulsing dots (such as `flightPulse`, `conflictPulse`, `shimmer`, and button active bounciness) stay in the driver's peripheral field of view, creating visual fatigue and violating road safety principle (Product Law #2 in `NAV_SPEC.md`: "Content changes, layout never. Nothing pops in, moves or disappears").

## Scope
- `css/style.css`
- `docs/handoff/cards/DRIVE-01-windshield-no-animation.md`
- `docs/handoff/QUEUE.md`

Everything else is off-limits.

## STOP
1. A file outside Scope is needed → stop, escalate to 🟠 LEAD.
2. Tab count, start tab, fixed button position, or data schema would change → stop.
3. System emojis or toxic red colors introduced → stop.
4. A second bug found → do not fix it. Log it below, finish this card.

## Done when
1. `.hud-overlay` and all its child elements enforce `animation: none !important` and `transition: none !important`.
2. Global `@media (prefers-reduced-motion: reduce)` disables continuous looping animations.
3. All quality gates pass (0 failures, docs budget within limits).

## Gates
- `npm test` — 0 failures
- `npm run docs:budget` — prints 0

## Found along the way
*None.*
