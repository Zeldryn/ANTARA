# ANTARA Intro / Cockpit Character Rebuild Report

## Files modified
- `index.html`
- `styles.css`
- `script.js`
- `assets/characters/nara.png`
- `assets/characters/sora.png`
- related project notes (`README.md`, `IMPLEMENTATION.md`)

Earth, Venus, Mars, exploration-media, planet data, texture, and planetary navigation implementation files were not modified.

## What changed
1. The previous inline SVG character implementation was removed from the HTML completely.
2. Nara is now a clean transparent PNG anime illustration with dark hair and the navy/gold ANTARA visual language.
3. The right-side guide is now Sora, a visibly different female anime character with silver hair, different facial design, different silhouette, and a matching ANTARA uniform direction.
4. The old SVG face, body, hair, mouth, eye, arm, gesture, and mannequin styling rules were removed from the character implementation.
5. Character wrappers retain the existing journey-state hooks and now animate the complete illustration subtly for idle, speaking, launch, excitement, and turbulence states.
6. The main progression control was moved structurally into the cockpit stage and positioned at the lower center, directly above the cockpit dashboard.
7. Decorative cockpit layers remain non-interactive. The launch button is explicitly restored as the only main interactive target inside the stage during the home state.
8. The button disappears after the journey begins, preventing it from lingering over the launch animation.
9. Dialogue still follows the active guide and moves between the left and right sides without blocking the centered progression control.
10. The cockpit POV, ANTARA branding, exterior city/environment, dashboard, audio control, launch timeline, and Earth handoff remain intact.

## Validation performed
- `node --check script.js` passed.
- HTML has no duplicate IDs.
- Exactly two `.anime-character` assets are present.
- No inline character SVG remains under `.companion`.
- All local image/script/stylesheet references in `index.html` resolve to existing files.
- Earth, Venus, Mars, and exploration-media JS/CSS hashes are identical to the supplied latest project.
- Chromium/Playwright validation was performed with the full project document inlined because direct localhost navigation is blocked by the environment.
- Tested desktop sizes: `1920x1080`, `1600x900`, `1440x900`, and `1366x768`.
- At all four sizes: no horizontal overflow, the launch button is visible and its center hit-test resolves to `#launch-button`, both anime characters remain visible, no JavaScript page errors were recorded, and clicking the button changes the experience from `home` to `launch`.
- After click, the launch button is hidden as intended.
