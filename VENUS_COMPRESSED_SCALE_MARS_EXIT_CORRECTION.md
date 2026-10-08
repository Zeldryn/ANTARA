# Venus compressed-scale + Mars full-dive correction

This correction keeps the current Venus material/LOD/education systems and changes only the two requested architectural problems plus quality tuning.

## 1. Dedicated Venus full-dive state
`venus-scene.js` now owns `fullDiveBlend`, geographic full-dive orientation targets, and a full-dive quaternion independently from normal `explorationBlend`. Its render path now follows the Mars transition family: full-dive recenters the planet, suppresses caption/pointer motion, changes apparent planet distance, and interpolates the actual Venus sphere toward the selected destination.

Venus exit uses Mars's 1650 ms initial ascent and 3200 ms (260 ms reduced-motion) dive reversal. The Full Exploration terrain keeps rendering while the normal Venus sphere recedes from the surface-entry framing back toward panorama framing. Disposal still happens only after the transition completes.

## 2. Compressed scientific visualization space
Scientific/source coordinates remain untouched. Each region now has a destination-specific horizontal source-to-render compression and independent vertical relief scale:

- Maat Mons: 7.5x horizontal compression, 1.16x relief
- Maxwell Montes: 6.5x, 1.12x
- Aphrodite/Ovda: 8.0x, 1.10x
- Ishtar/Lakshmi: 7.0x, 1.08x
- Alpha Regio: 9.0x, 1.13x

`sourceKmFromWorld()` maps compact ANTARA render coordinates back into scientific kilometers before latitude/longitude sampling. `worldPointFromReference()` maps authored reference-space spawn/landmark coordinates into compact render space. Radar UVs use scientific/source kilometers, not the compressed render coordinates.

The major morphology functions continue to operate in their authored reference coordinate space, but are evaluated through the same per-region compression transform. This preserves the existing morphology design while making Maat, Maxwell, Ovda, Lakshmi and Alpha readable within a compact expedition scale.

## 3. Playable and visual scale
Playable radii are now roughly 28-34 render km, while the low-detail visual world spans 96/116/134 render km by quality profile. Because each render kilometer maps to multiple scientific kilometers, the visible terrain still represents a planetary-scale footprint while travel remains practical.

## 4. Graphics quality
RENDAH/SEDANG/TINGGI is preserved. The profiles now use smaller chunk sizes and a compact streaming radius appropriate to the compressed world. They still independently affect geometry density, background tessellation, DPR/pixel budget, anisotropy, radar size, microtexture size, shader tier, props and atmosphere.

No non-Venus planet renderer was modified.
