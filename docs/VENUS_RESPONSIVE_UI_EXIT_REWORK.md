# Venus Full Exploration Responsive UI + Mars Exit Rework

## Scope

This pass intentionally does **not** rebuild the Venus terrain, morphology, scientific material pipeline, or educational content. It focuses on the existing Venus Full Exploration interface and the surface-to-panorama exit lifecycle.

## Responsive UI architecture

The persistent interface now follows progressive disclosure instead of keeping every large panel visible at once.

- **Large desktop:** compact left telemetry, optional objective panel, optional scientific panel, horizontal top controls, restrained bottom hints.
- **Laptop / compact desktop:** narrower telemetry and science panels, reduced padding and decorative labels, wrapped control hints, viewport-aware max heights, and large-panel exclusivity.
- **Phone / touch tablet:** compact top status, 44px menu button, compact `Tujuan` and `Info Lokasi` controls, touch navigation, and bottom-sheet information/objective/observation panels.
- **Short viewports:** typography, padding, and panel height reduce independently of viewport width.

Safe-area insets are respected for notches and gesture navigation. Panels use `dvh`, `clamp()`, flex/grid reflow, internal scrolling, and a small documented z-layer system rather than arbitrary high z-index values.

## Panel behavior

Default exploration state keeps the world clear:

- compact exploration HUD visible
- location information hidden
- objectives minimized to a summary button
- top navigation visible
- desktop hints visible only where appropriate
- touch controls shown on phone / touch tablet

Objective and location-information panels now keep independent user-controlled state. Desktop/laptop may show both simultaneously; mobile presents the most recently used sheet while remembering the other panel state. ESC closes the most recently interacted secondary panel first.

## Mobile / touch-tablet behavior

Desktop sidebars are not squeezed onto touch layouts. Location information, objective details, and observation content become bottom sheets with internal scroll. Persistent keyboard hints are removed. Touch controls remain at practical 48px targets and are temporarily de-emphasized while a reading sheet is open so controls do not collide with educational content.

## Resize / fullscreen

The responsive state is refreshed on normal resize, orientation change, fullscreen entry, and fullscreen exit. Layout remains CSS-driven; JavaScript is used only for behavior such as preserving panel state, mobile sheet ordering, ESC priority, and the mobile action menu.

## Mars exit parity

The current project Mars implementation was used as the source of truth. Venus now follows the same transition responsibilities:

1. movement input locks while the Full Exploration render loop stays alive;
2. the live surface camera rises using the same 52 km target / 1650 ms Mars pattern;
3. the actual Venus planetary scene remains active underneath the exploration scene;
4. `fullDiveBlend` runs backward through the same 3200 ms handoff family used by Mars;
5. the surface opacity follows the same supporting fade curve while planet scale and distance continue changing;
6. Venus keeps the selected destination's geographic orientation during the first part of the retreat;
7. the panorama caption/pointer return as `fullDiveBlend` reaches zero;
8. Full Exploration terrain and renderer resources are disposed only after the visual handoff is complete.

Reduced-motion users receive a shortened version of the same conceptual transition rather than a hard cut.

## Validation performed

Syntax and source-level checks cover the responsive layout hooks, safe-area handling, user-controlled panel state, fullscreen/orientation behavior, touch target rules, z-index architecture, dedicated `fullDiveBlend` state, Mars timing/curve parity, live render-loop handoff, and post-transition cleanup order.

A browser layout harness using the project's actual HTML and CSS was rendered at:

- 360×800
- 375×812
- 390×844
- 393×873
- 412×915
- 768×1024
- 1024×768
- 1366×768
- 1440×900
- 1536×864
- 1600×900
- 1920×1080
- 2560×1440

For default, information, objectives, and observation states, the harness detected no viewport overflow and no collisions among the major HUD, action, panel, toggle, and control-hint regions. A separate coarse-pointer 1024×768 tablet pass verified the touch-tablet composition and 48px movement/altitude controls.

The Mars exit video supplied with the project task was also inspected alongside the actual `mars-full-exploration.js` and `mars-scene.js` transition code. The implementation intentionally follows the code architecture, not just the visible fade timing.
