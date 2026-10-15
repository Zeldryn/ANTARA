# Outer Planets Full Exploration · Venus Action Parity Audit
Date: 2026-10-05

## Scope
Compared Venus Full Exploration against Jupiter, Saturn, Uranus, and Neptune as a bug-hunt and feature-parity pass.

## Root cause found
Venus keeps `.venus-full-actions` present in markup, while the four outer-planet action roots were authored with `hidden`. Their controllers attempted to remove `hidden` only after entering the exploring state. That made the action bar vulnerable to stale visibility state after entry, selector, observation, or responsive transitions.

## Fixes
- Removed initial `hidden` from outer-planet action roots to match Venus markup architecture.
- Added a final shared stylesheet `outer-planets-full-actions-parity.css` loaded after legacy/mobile exploration styles.
- Desktop now exposes three direct actions:
  - Pindah Wilayah
  - Layar penuh
  - Keluar dari Eksplorasi
- Mobile keeps a 44×44 Menu control, then exposes the same three actions in a dropdown.
- Added an explicit `[hidden]` author rule so controller-driven hidden state always wins over the shared `display` rules.
- Region selector lifecycle now:
  - closes action menu
  - releases pointer lock
  - clears movement input
  - hides action bar while selector is open
  - focuses current region in selector
  - restores action bar and focus when returning to world
- Mobile Menu now focuses its first action like Venus.
- Added visibility-change loop pause/resume.
- Added orientation-change resize behavior.
- Added `is-selecting` state cleanup during world activation/reset.
- Updated stale cache-only verifier assertions so future asset version bumps do not create false negatives.

## Venus-relevant feature parity checked for all four planets
1. Quality selection
2. Region selection
3. Direct desktop action bar
4. Mobile Menu action dropdown
5. Pindah Wilayah from active world
6. Return from region selector
7. Fullscreen toggle
8. Dynamic fullscreen label
9. Exit button
10. ESC layer stack and exit
11. One-click desktop pointer lock
12. Mobile controls
13. Objectives panel
14. Location info panel
15. Observation prompt/card
16. Discovery persistence
17. Loading state
18. Error fallback
19. Tutorial
20. Soft boundary
21. Visibility pause/resume
22. Orientation resize
23. Mobile panel exclusivity
24. Global chrome hidden during Full Exploration

## Verification
- Outer Venus action parity verifier: 93/93 PASS
- Jupiter atmosphere verifier: PASS, 14/14 feature groups
- Venus responsive verifier: 36/36 PASS
- Venus exit UI verifier: ALL PASS after stale cache assertion update
- Inner mobile panel verifier: ALL PASS after stale cache assertion update
- JavaScript syntax: Venus/Jupiter/Saturn/Uranus/Neptune PASS
- Duplicate IDs: 0
- CSS parse errors: 0 for shared + four outer Full Exploration stylesheets
