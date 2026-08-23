# DS-02 — logo identity: one geometry, two weights

**Severity:** MEDIUM · **Size:** S · **Owner:** G

## Goal
The mark stays legible as a 16 px browser tab and as a masked launcher icon, without splitting the identity into two different drawings.

## Symptom & root
The Neon Streamline variant is a monoline: five thin luminous strokes plus a glow. Rendered at `favicon.svg` size it smudges, and on a white browser tab teal-on-transparent has almost no contrast. `logo.svg` drew its squircle inside the canvas (`rect x=4 y=4`), so a maskable crop would cut the corners, and the beacon at `92,18` sat 53.8 units from centre — outside the 51.2 safe circle.

## Scope
- `favicon.svg`
- `logo.svg`
- `logo-horizontal.svg`
- `manifest.json`

Everything else is off-limits.

## STOP
1. A file outside Scope is needed → stop, escalate to OWNER.
2. A colour outside `css/tokens.css` would be introduced → stop.
3. The geometry would change (a second, different mark) → stop: this card is about weight, not shape.
4. A second bug found → log it below, finish this card.

## Done when
- `favicon.svg`: obsidian plate, two ribbons, `stroke-width` 3, solid beacon, no filter. Smallest feature ≥ 2 px at 16 px.
- `logo.svg`: full-bleed plate, mark scaled 0.82 about centre, every painted point inside the safe circle (centre 64,64 r 51.2).
- Every mark colour ≥ 7:1 against the plate (`#0C0622`), per DS-01 sunlight grade.
- `manifest.json` splits purposes: `favicon.svg` any, `logo.svg` maskable.

## Gates
- `npm test` — 0 failures
- `npm run docs:budget` — prints 0
- `npm run build:sw` — assets exist on disk

## Found along the way
- `--brand-elite-pink` in `tokens.css` is a name imported from another project. The colour is naturalised, the name is not. Rename touches every usage — its own card.
