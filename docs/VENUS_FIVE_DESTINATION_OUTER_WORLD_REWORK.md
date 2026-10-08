# Venus Five-Destination Morphology + Outer-World Continuation Rework

This correction starts from `ANTARA-venus-compressed-scale-mars-exit-correction.zip` as the source of truth.

## Scope kept intact

- Existing Venus material/shader quality
- Existing compressed scientific coordinate transform
- Existing educational objectives/cards/markers
- Existing Indonesian UI
- Existing LOW / MEDIUM / HIGH quality selector
- Existing Mars-family Venus full-dive exit architecture
- Existing non-Venus planet implementations

## Regional morphology changes

### Maat Mons
- Reinforced a very broad shield-volcano profile rather than a cone or isolated hill.
- Preserved long lower slopes and an irregular summit depression/rim.
- Strengthened long cooled flow corridors, subtle levees, and fractured volcanic plains.
- Prevented far-LOD morphology attenuation so the shield silhouette survives at distance.

### Maxwell Montes
- Reduced the impression of one broad mound.
- Expanded the connected compressional ridge/valley fabric and strengthened directional mountain-belt structure.
- Kept western relief substantially steeper than the eastern transition.
- Reduced Cleopatra's dominance while keeping the basin/rim recognizable as a secondary landmark.

### Aphrodite Terra / Ovda Regio
- Replaced overly uniform highland/ridge behavior with overlapping upland lobes.
- Added broken curved ridge generations, oblique cross-cutting fractures, multiple large graben/troughs, and smoother volcanic lows.
- Emphasized superposed tectonic fabrics rather than Maxwell-like mountain chains.

### Ishtar Terra / Lakshmi Planum
- Expanded the broad elevated plateau grammar.
- Kept the interior open with low-amplitude relief.
- Concentrated mountain systems into selected margins rather than enclosing the map with a ring/wall.
- Continued the plateau and margin relationship into the non-playable world.

### Alpha Regio
- Removed the basin/enclosing-wall impression.
- Spread tessera deformation across the province.
- Uses two warped structural families with troughs/fault valleys, broken blocks, and local smoother lows.
- Identity comes from province-wide intersecting fabric rather than a central landmark.

## Outer-world continuation

The former single low-detail background is now extended by two additional non-playable layers:

1. core regional underlay
2. medium-detail province continuation
3. far low-detail province continuation
4. atmospheric horizon

Each region has its own continuation grammar:

- Maat: volcanic plains, cooled flow bands, broad distant rises
- Maxwell: connected ridge/valley mountain belts and oblique splays
- Aphrodite: overlapping uplands, old curved fabric, younger cross-cutting fractures and lows
- Ishtar: Lakshmi-like plateau continuation with finite mountain provinces at selected margins
- Alpha: intersecting tessera fabrics, fault troughs, broken structural lows

The continuation meshes are non-playable and deliberately cheaper than the core terrain. They do not stretch the final edge row of the playable mesh and do not reuse clamped radar texels.

## LOD / performance

LOW / MEDIUM / HIGH now each define separate continuation segment budgets. Far continuation always has fewer segments than the core underlay, while morphology remains sampled from the same region-specific functions. This reduces geometry cost without flattening the main geological identity.

## Validation performed

- `node --check venus-full-exploration.js`
- `node --check venus-scene.js`
- `tools/verify_venus_morphology.mjs`
- `tools/verify_venus_compressed_scale.mjs`
- `tools/verify_venus_reference_quality_exit.mjs`
- `tools/verify_venus_outer_world.mjs`

The outer-world audit samples multiple rings outside each playable radius and verifies:

- finite terrain values
- non-flat relief
- region-specific continuation
- continuation blending outside the playable core
- lower geometry cost for mid/far continuation
- no single generic outer-ring signature reused by all five regions

## Testing limitation

The automated source/geometry audits do not replace an actual browser/WebGL traversal. The final project should still be visually checked in the target XAMPP/browser environment from spawn, near the playable limit, and from elevated terrain in all five regions.
