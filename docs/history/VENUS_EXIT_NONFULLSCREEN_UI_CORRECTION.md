# Venus Full Exploration — Exit + Non-Fullscreen UI Correction

## Scope

This pass intentionally changes only the Venus Full Exploration exit lifecycle and responsive UI behavior. Terrain morphology, scientific region data, material pipeline, educational content, quality profiles, and other planets remain unchanged.

## Exit root cause found

The previous Venus Full Exploration root had its own opaque Venus gradient background while the normal Venus planetary scene rendered underneath it. The surface canvas/viewport could fade and `fullDiveBlend` could correctly move the planet, but the opaque Full Exploration root continued covering the globe. Visually this looked like a frozen Venus surface followed by a sudden panorama reveal when the root was finally hidden.

The previous Venus exit also unbound input at exit start and carried a separate `finishExitToOrbit` cleanup path rather than mirroring Mars's single cleanup architecture.

## Exit correction

The exit path now follows the current Mars Full Exploration architecture:

1. Set state to EXITING, clear movement state, keep the Full Exploration renderer alive.
2. Keep terrain, atmosphere, and camera rendering while the camera rises.
3. Use the same Mars-family ascent stage and live handoff curve.
4. Reverse the dedicated Venus `fullDiveBlend` while the Full Exploration surface is still visible.
5. Allow the real Venus planetary scene to become visible underneath the fading surface viewport.
6. Continue apparent planet recession toward normal panorama framing using the existing `venus-scene.js` full-dive distance/orientation logic.
7. Only after the visual handoff finishes: stop RAF, unbind input, hide Full Exploration, and dispose terrain/renderer resources.

Important rendering changes:

- `.venus-full-exploration` is transparent during handoff, matching Mars.
- The Venus fallback gradient belongs to `.mars-full-viewport`, which is governed by `--surface-opacity`.
- The Venus canvas is no longer opacity-multiplied a second time.
- Venus atmospheric overlay layers fade out during exit so they cannot mask the emerging planet.
- The obsolete `finishExitToOrbit()` path is removed. Normal and emergency return share one final cleanup path.

`venus-scene.js` already contained the required dedicated `fullDiveBlend`, geographic orientation, quaternion interpolation, caption suppression, pointer suppression, and planet-distance interpolation. Those working systems were preserved rather than rewritten.

## Non-fullscreen responsive correction

The UI now responds to the actual CSS viewport rather than assuming fullscreen height.

- Shared safe-edge variables use safe-area insets and `dvh`-aware vertical spacing.
- Compact behavior now matches the CSS compact range through 1599 px width / 860 px height.
- Mobile HUD sizing uses border-box sizing so it cannot collide with the MENU control.
- Right-side information uses viewport-bounded height with internal scrolling.
- Short desktop windows place contextual observation cards below the toolbar instead of vertically centering into it.
- Short-height layouts reduce vertical density without transform-scaling the interface.
- Mobile/touch-tablet composition remains bottom-sheet based.
- Objective and location-information panels retain independent state. Desktop/laptop may keep both open; mobile temporarily presents the most recently used sheet without resetting the other.
- Fullscreen and normal browser mode share the same responsive architecture.

## Viewport audit

Actual project DOM structure and project CSS were injected into a Chromium CDP layout harness and checked in four UI states: default, location info, objectives, and observation card.

Tested sizes:

- 360×800
- 375×812
- 390×844
- 393×873
- 412×915
- 768×1024
- 1024×768
- 1366×620
- 1366×680
- 1366×768
- 1440×900
- 1536×730
- 1536×864
- 1600×900
- 1920×850
- 1920×1080
- 2560×1440

Result: 68 viewport/state combinations, 0 unintended major-UI overlaps, 0 major elements outside the viewport, and no page-size overflow beyond the tested viewport.

The supplied 5.87-second Mars exit video was also inspected frame-by-frame as the visual reference, alongside `mars-full-exploration.js` and `mars-scene.js` as the code reference.

## Verification

The following automated checks pass:

- Venus responsive UI verifier
- Venus reference/quality/exit verifier
- dedicated exit/UI rebuild verifier
- Venus material/tile pipeline verifier
- Venus morphology verifier
- Venus outer-world verifier
- Venus compressed-scale verifier
- JavaScript syntax check

Browser policy in the execution environment blocks normal localhost/file navigation, so a full interactive WebGL browser session could not be claimed. UI geometry was tested via Chromium CDP using the actual project DOM/CSS, while transition architecture was verified against the actual Mars source plus the supplied Mars video.
