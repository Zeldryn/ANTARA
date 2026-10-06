# ANTARA Opening / Cockpit V4

## Files modified
- `index.html`
- `styles.css`
- `script.js`
- `README.md`
- `IMPLEMENTATION.md`
- New character assets under `assets/characters/nara/` and `assets/characters/sora/`

## Cockpit
The opening remains active from the first frame and now uses a deeper physical cockpit composition: layered front-window rim, thicker side pillars, upper frame, gold edge lighting, and a larger three-bank lower dashboard. The START button stays centered above the dashboard.

## Character sprite system
The old inline SVG character rigs were removed from `index.html`. Nara and Sora now use actual WebP image assets with transparent backgrounds. Each character has eight distinct sprite files. Two image slots are stacked per character so state changes crossfade instead of hard-cutting.

### Nara sprites
`idle`, `happy`, `talking`, `excited`, `pointing`, `thinking`, `surprised`, `confident`

### Sora sprites
`idle`, `smile`, `talking`, `curious`, `supportive`, `thinking`, `surprised`, `confident`

## Dialogue-driven state
Every launch dialogue cue now contains `speaker`, `text`, `emotion`, `sprite`, and `otherSprite`. Sprite selection is deterministic and matched to the meaning of each line. Animation is secondary: subtle breathing, launch reaction, turbulence, and talking motion remain on the sprite container.

## Scope protection
Earth, Venus, Mars, exploration media, and their dedicated JS/CSS files were not modified in this pass.

## Validation performed
- `node --check` passed for `script.js`, `earth-scene.js`, `venus-scene.js`, and `mars-scene.js`.
- No duplicate HTML IDs.
- All HTML asset references resolve.
- All 16 character sprite references resolve.
- All `getElementById()` targets used by `script.js` exist.
- CSS opening and closing brace counts match.
- Checksums confirm Earth/Venus/Mars and exploration-media implementation files are unchanged from the previous project ZIP.

A full browser screenshot test could not be completed in this environment because Chromium navigation to both localhost and file URLs is blocked by administrator policy.
