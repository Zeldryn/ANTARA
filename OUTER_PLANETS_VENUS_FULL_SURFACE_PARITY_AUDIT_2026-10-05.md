# Outer Planets · Venus Full Surface Parity Audit · 2026-10-05

## Scope
Compared Venus Full Exploration against Jupiter, Saturn, Uranus and Neptune using Venus as the UI/lifecycle source of truth.

## Root cause found
All four outer Full Exploration sections inherit `.mars-full-exploration`, whose base CSS starts with `--surface-opacity: 0`.

Venus explicitly changes `--surface-opacity` to `1` after entry. The four outer controllers did not. As a result, the following elements existed in HTML but rendered fully transparent:
- top-left exploration HUD
- top-right action controls
- bottom desktop control/help rail
- mobile D-pad and altitude controls

The Objective and Info Location toggles remained visible because their styling did not depend on the Mars surface opacity variable, which made the UI look as if the other features were missing.

## Fix
For Jupiter, Saturn, Uranus and Neptune:
- Set `--surface-opacity: 1` and `--entry-progress: 1` when the world enters `exploring` state.
- Remove the inline surface variables during `forceReset()`.
- Add a defensive `.is-active` CSS parity guard in `outer-planets-full-actions-parity.css`.
- Explicitly keep desktop help visible on fine-pointer desktop layouts.
- Explicitly show mobile controls on coarse-pointer / <=760px layouts.
- Keep mobile button pointer events active.
- Preserve the existing Venus-like panel priority and observation behavior.

## Venus parity surfaces verified per planet
1. Exploration HUD
2. Pindah Wilayah
3. Fullscreen
4. Keluar dari Eksplorasi
5. Desktop bottom help
6. Mobile forward / left / right / backward
7. Mobile up / down
8. Objectives
9. Info Lokasi
10. Observation prompt/card
11. Quality selector
12. Region selector
13. Tutorial
14. Loading/error fallback
15. Boundary hint
16. ESC stack / pointer lock lifecycle

## Verification
- `verify_outer_venus_surface_parity.cjs`: 39/39 PASS
- `verify_outer_venus_action_parity.cjs`: 93/93 PASS
- `verify_outer_observe_while_reading.cjs`: 20/20 PASS
- `verify_jupiter_atmosphere.cjs`: PASS
- JS syntax: PASS for all four outer controllers
- duplicate HTML IDs: 0
- CSS brace check: PASS
