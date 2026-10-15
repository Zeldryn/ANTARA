# ANTARA Audio Top Navigation Responsive Pass

Date: 2026-10-05

## Change
- Moved the AUDIO control from a standalone viewport/footer dock into the cockpit profile/navigation HUD.
- AUDIO is centered above the navigation cluster, visually aligned over the Leaderboard / Progress area.
- The audio control now follows the HUD position instead of using bottom/right viewport coordinates.
- Kept the sci-fi audio node and explicit `AUDIO` hint.
- Planet and Solar System modes still hide the home cockpit audio dock.

## Responsive behavior
- Desktop: 88×34 audio node above the HUD.
- Tablet / medium width: 82×32.
- Phone portrait: 76×30.
- Very short mobile landscape: 70×27 and the whole HUD moves into a fixed safe top band so the audio never clips out of the viewport.
- Short laptops also use a safe fixed top band.

## Browser layout matrix
Validated using Chromium bounding-box checks at:
- 320×568
- 360×640
- 390×844
- 430×932
- 568×320
- 667×375
- 768×1024
- 820×1180
- 844×390
- 1024×600
- 1180×720
- 1366×768
- 1600×600
- 1920×1080

Assertions for every viewport:
- audio is fully inside viewport
- audio is above the cockpit HUD
- audio is centered horizontally
- audio does not overlap the title stack

Result: 14/14 PASS.
