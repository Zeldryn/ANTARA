# Venus Reference Fidelity, Exit, and Graphics Quality Report

## Scope

This pass does not replace the current Venus terrain engine. It modifies destination readability, exit presentation, graphics scalability, and image request cost while preserving the current renderer, scientific topography provider, radar integration, material system, educational content, world continuation, and exploration boundary.

## Reference readability changes

- Maat Mons now has a smoother broad shield profile, lower volcanic foreground, long flow corridors, an irregular summit complex, a deliberately composed low-plain spawn view, and less aggressive distance fog.
- Maxwell keeps a connected compressional ridge belt, strong relief asymmetry, deep valleys, and a meaningful Cleopatra basin.
- Aphrodite / Ovda now uses broken curved ridge bands plus a separate younger fracture family, major graben, smoother lows, and additional low-amplitude tectonic lineation.
- Ishtar / Lakshmi uses a rounded and warped plateau instead of a square-looking plateau mask, with selected mountain systems pushed to regional margins.
- Alpha retains two intersecting tessera structural families, broad fault valleys, disrupted blocks, and local smoother lows.

## Distant landmark preservation

The distant visual world continues to call the same `scientificHeightAt()` and `morphologyHeightAt()` used by the playable terrain. Background terrain reduces geometry and microdetail but does not scale down the major morphology height. This prevents LOW quality from flattening the core identity of Maat, Maxwell, Ishtar, or Alpha.

## Venus exit transition

Mars remains the lifecycle reference. Venus now adds a more explicit visible surface retreat before the existing panorama blend:

1. movement input is cleared and unbound,
2. exploration UI fades,
3. terrain remains alive and rendered,
4. camera rises to at least 58 km while receding about 18 km backward,
5. fog density is reduced gradually so terrain remains readable during the retreat,
6. a second 3.4 second cinematic phase continues the retreat toward at least 78 km,
7. `setFullExplorationTransition()` blends the normal Venus planet view in during the retreat,
8. terrain and renderer disposal happen only after the blend completes.

Repeated exit attempts remain guarded by the transition state/token system.

## Pre-entry graphics selector

Clicking `EKSPLORASI PENGALAMAN PENUH` now opens a compact Indonesian quality panel before destination selection.

Visible choices:

- RENDAH, Performa terbaik
- SEDANG, Seimbang
- TINGGI, Visual terbaik

The recommendation is only a heuristic. It considers viewport size, device pixel ratio, logical CPU count, reported device memory when available, coarse-pointer/mobile state, WebGL2 maximum texture size, and maximum renderbuffer size. The player can always choose a different level.

The last confirmed selection is stored in `localStorage` under `antara-venus-graphics-quality-v2`.

## What the quality modes actually change

The selector is not a DPR-only switch. Profiles currently affect:

- chunk tile size and tile count,
- near, mid, and far mesh segments,
- distant background mesh segments,
- DPR limits and pixel budget,
- anisotropy,
- radar WMS request resolution,
- generated microdetail texture size,
- shader detail tier,
- geological prop count,
- atmospheric particle count,
- high-detail visibility distance.

Static terrain triangle estimates from the actual profile/chunk rules:

- RENDAH: about `119,680`
- SEDANG: about `319,360`
- TINGGI: about `669,200`

These are geometry-budget estimates, not measured runtime FPS.

## Asset/request optimization

The Venus Full Exploration radar request is now profile dependent:

- RENDAH: `576`
- SEDANG: `896`
- TINGGI: `1280`

Large NASA dynamic reference-image requests in Venus Info Mode were reduced from 3200 to 5120 pixel-class requests to a maximum requested dimension of 1600 to 1800 pixels for the affected geology slides. Existing smaller cloud imagery remains unchanged. Scientific height data is not destructively compressed.

## Validation performed

Passed:

- `node --check` across all project JavaScript files.
- `tools/verify_venus_morphology.mjs`.
- `tools/verify_venus_reference_quality_exit.mjs`.
- HTML ID uniqueness check for the new quality UI.
- CSS brace-balance check.
- SHA-256 comparison confirming Mars and Earth Full Exploration source files are unchanged from the input ZIP.

Could not complete:

- automated full browser/WebGL traversal, because the available Chromium environment could not reliably load the local test origin after sandbox restrictions were worked around,
- Playwright regression scripts, because Playwright is not installed in the environment.

The report therefore does not claim measured FPS or successful automated browser traversal.
