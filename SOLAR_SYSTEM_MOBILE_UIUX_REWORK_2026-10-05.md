# ANTARA Solar System Mobile UI/UX Rework · 2026-10-05

## Problem addressed
The mobile Solar System observer stacked the title, clock, speed controls, back button, persistent detail card, and instructions before the orbit canvas had room to breathe. The initial Sun detail card also covered the system before the user selected anything.

## Mobile interaction redesign
- Initial mobile view is observation-first. Planet information stays hidden until a body is tapped.
- Tapping a planet no longer jumps immediately to the panorama on mobile.
- First tap selects the body and opens a compact bottom sheet.
- The sheet contains an explicit `MASUK PANORAMA <PLANET>` action plus `LANJUT AMATI`.
- Desktop behavior is preserved: clicking a planet can still jump directly to its panorama.
- Mobile helper copy explicitly says to tap a planet for information.

## Layout changes
- Header becomes a compact two-column title / simulation clock layout.
- Speed controls remain available but shrink into a compact row.
- Back button stays visible in a short second row.
- Planet detail becomes an off-canvas sheet with three compact scientific stats.
- The long note row is hidden on mobile to preserve map visibility.
- Hover card remains desktop-only.

## Audio mobile placement
- Audio control no longer sits over the lower separator on mobile.
- It is moved to the upper-right control area below the quick navigation controls.
- Audio control is hidden inside Solar System observation mode to avoid competing with the simulation header.

## Validation
- `solar-system-explorer.js`: Node syntax check passed.
- `script.js`: Node syntax check passed.
- Duplicate HTML IDs: 0.
- CSS brace balance: 0.
- Required mobile CTA / close controls present.
- Mobile two-step selection wiring present.
- Local Three.js and representative mobile textures present.
