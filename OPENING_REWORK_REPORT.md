# ANTARA Intro / Rocket POV Repair Report

## Files modified
- `index.html`
- `styles.css`
- `script.js`

Earth, Venus, Mars, exploration-media, planet data, texture, and planetary navigation implementation files were not modified.

## What changed
1. The opening still starts directly inside the cockpit POV. The click begins the journey instead of revealing the cockpit.
2. The large visual `Ayo Keliling Tata Surya!` heading was removed. A small `SELAMAT DATANG DI ANTARA` kicker remains so it cannot collide with the header.
3. The START control now lives in a deliberate top-level interaction layer. The cockpit stage and every decorative descendant are explicitly non-interactive, while the launch button, brand link, and audio control keep pointer input.
4. The opening stack was consolidated into a controlled order: environment, atmospheric layers, crew, cockpit frame/dashboard, speech UI, vignette, START UI, then global navigation.
5. Both old crew SVG presentations were replaced with new female anime/manga-inspired rigs. Nara and Aksa use distinct hair, eyes, silhouettes, cel shading, and navy/gold ANTARA uniform details.
6. The new crew rigs preserve blinking, breathing, head movement, mouth animation, launch/turbulence reaction, expression changes, and pointing/looking states from the existing timeline.
7. Crew sizing is tied to viewport height and reduced across narrower/shorter desktop layouts so they do not cover the center flight path, START control, or cockpit instruments.
8. The cockpit dashboard remains visible and sits in front of the lower crew bodies, which makes the characters feel seated inside the vehicle instead of pasted over the controls.
9. The exterior departure environment gained deeper skyline layers, windows/lights, terrain depth, hangars, launch tower, beacons, terminal lighting, and road/ground cues.
10. Existing layered cloud visuals and the city → sky → clouds → atmosphere → space timeline remain intact.
11. Existing Earth handoff logic and all planet implementations remain intact.

## Root cause of the START problem
The project had accumulated multiple generations of opening CSS with competing stacking rules. The launch stage, intro layer, masthead, speech layer, cockpit frame, and character layers were being restacked by later override blocks. Even though the JavaScript click listener existed, this made the interaction layer fragile and dependent on CSS ordering.

The repair removes that ambiguity by enforcing one final opening stack and by making every decorative cockpit layer `pointer-events: none`. The launch button is the only primary START target above the cockpit visuals.

## Validation performed
- `node --check script.js` passed.
- HTML parsed with no duplicate IDs.
- Exactly one `launchButton.addEventListener("click", ...)` remains.
- Planet-scene and exploration-media JS/CSS hashes match the supplied latest project.
- Chromium headless flow test was run with all project HTML/CSS/JS inlined because the environment blocks localhost/file navigation.
- Tested viewport sizes: `1920x1080`, `1600x900`, `1440x900`, `1366x768`.
- At all four sizes: no horizontal overflow, the START button center resolves to `#launch-button`, no JavaScript console errors were recorded, and clicking START changed the state from `home` to `launch`.
- A longer runtime check reached the `liftoff` phase with no JavaScript console errors.

## Environment note
The container blocks direct Chromium navigation to localhost and `file://`, so the browser validation used the complete document with local CSS/JS inlined into an `about:blank` page. This still exercised DOM layout, stacking, pointer hit testing, event listeners, state transition, and launch timing code.
