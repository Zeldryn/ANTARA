# Mobile Full Exploration UI Bug Hunt

Scope: Mercury, Venus, Earth, Mars, Jupiter.

## Contract after this pass
- Mobile allows only one large secondary overlay at a time: Goals, Location Info, or Menu.
- Opening Goals closes Location Info and Menu.
- Opening Location Info closes Goals and Menu.
- Opening Menu closes Goals and Location Info.
- While a large overlay is open, touch flight controls are visually parked and cannot receive accidental taps.
- Goals and Info collapsed controls are horizontal compact buttons, never vertical rails.
- Large panels are constrained bottom sheets with internal scrolling and safe-area-aware spacing.
- Menu dropdown opens below the HUD zone instead of over it.
- Desktop behavior remains independent where the planet already supported simultaneous information panels.

## Planet fixes
- Mercury: synchronized objectivesCollapsed/infoMinimized/actionsMenuOpen on mobile.
- Venus: changed mobile behavior from dual-sheet stacking to one-sheet exclusivity; root menu state is now explicit.
- Earth: Menu, Goals, and Info are mutually exclusive on mobile; desktop menu behavior preserved.
- Mars: opening destination info no longer leaves Goals behind it; Menu also closes both secondary panels.
- Jupiter: hardened stale dual-state cleanup and hides sibling compact toggles while a sheet is open.

## Verification
- Node syntax check: Mercury/Venus/Earth/Mars/Jupiter controllers PASS.
- `tools/verify_inner_mobile_panels.cjs`: ALL PASS.
- `tools/verify_venus_panel_state_copy.mjs`: ALL PASS.
- `tools/verify_venus_responsive_ui.mjs`: 36/36 PASS.
- `tools/verify_jupiter_atmosphere.cjs`: PASS, including 14/14 Jupiter-Venus parity flags.
- `tinycss2` parse of final mobile audit stylesheet: 0 errors.
- Duplicate IDs in `index.html`: 0.

Note: Chromium runtime screenshot automation is unavailable in the current execution environment, so validation here is source/state/CSS parsing and project verifier based rather than a claimed physical-device render test.
