# CALC-00 — license regime and minimum fare

**Severity:** HIGH · **Size:** S · **Owner:** 🟠 LEAD-OPUS

## Goal
The calculator states which licence it is modelling and warns when the fare
sits below the legal floor of that regime.

## Symptom & root
The fare slider spans €20–150 with no regime attached
(`index.html:127`), and `getCalculations()` never asks under which licence the
work is done (`js/calculator.store.js:152`). Under ΕΙΧ με οδηγό a contract has
a legal minimum (~€82 on the islands, ΥΑ 89095/2026); under ΕΔΧ ΤΑΞΙ the meter
sets the price and no floor applies. Today the default (€45) silently models a
configuration that is lawful in one regime and fineable in the other, and
nothing on screen says which one is meant.

## Scope
- `js/calculator.store.js`
- `js/calculator.view.js`
- `index.html`
- `css/style.css`
- `test/calculator.store.test.js`

Everything else is off-limits.

## STOP
1. A file outside Scope is needed → stop, escalate to 🟠 LEAD.
2. Tab count, start tab, fixed button position or data schema would change → stop.
3. Temptation to clamp `checkGross` to the minimum → stop. The store flags,
   it never rewrites a number the owner typed.
4. Temptation to also add input VAT, hotel commission, seasons or depreciation
   → those are CALC-01…03. Log, do not build.
5. `npm test` red for an unrelated reason → stop, open a separate card.

## Done when
- `licenseMode` (`edx` | `eix`) persists through save/load and rejects any
  other value.
- `metrics.minFare` and `metrics.fareBelowMinimum` are exposed.
- Switching to ΕΙΧ at €45 shows a warning under the fare slider; switching back
  to ΕΔΧ hides it.
- Default stays `edx` — existing saved states keep their current numbers.

## Gates
- `npm test` — 0 failures
- `npm run docs:budget` — prints 0
- `npm run build:sw` — asset list regenerated

## Found along the way
- `efkaPerOwner` is €250/mo; field research suggests €140/mo. Owner to confirm.
