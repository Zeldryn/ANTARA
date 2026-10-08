# Venus Material / Tile Pipeline Fix

## Scope

This pass intentionally stops destination-morphology polishing and fixes the shared Venus terrain rendering pipeline first. Existing compressed scientific world scale, educational systems, quality selector, destination morphology, outer-world logic, and Mars-family exit behavior are preserved.

## Root causes found in the current project

1. **Two terrain sheets occupied the same core area.** The detailed GTDR chunks sat over a large regional underlay generated from a different simplified height function. The small vertical offset was not enough to guarantee separation, so the surfaces could intersect. That produced irregular orange/tan islands and the visual impression that textured terrain was pasted over a second terrain layer.
2. **Core and continuation terrain used different material families.** The detailed chunks used radar imagery while the underlay/continuation relied mostly on vertex color. The transition could therefore reveal rectangular changes in albedo/exposure.
3. **Radar alpha/no-data was not repaired as surface data.** Missing pixels could expose the underlying Venus color instead of being reconstructed into an opaque, continuous radar context.
4. **Chunk normals were computed independently.** Adjacent chunks with different tessellation could shade differently at an otherwise identical world position, making tile rectangles visible under directional/diffuse lighting.
5. **LOD edge grids were not consistently nested.** This increased the chance of T-junctions/cracks along near/mid/far core tiles.
6. **Separate mid/far continuation rectangles created another avoidable LOD seam.** Their independently tessellated boundaries were unnecessary because distance already controls detail reduction.
7. **Alpha Regio depended on a remote image hotlink.** A failed remote request caused the reference to disappear from the information UI.

## Pipeline corrections

### One opaque Venus surface

- Radar imagery is no longer assigned to `MeshStandardMaterial.map`.
- Terrain remains opaque (`transparent=false`, `alphaTest=0`, depth write/test enabled).
- Radar is sampled inside the shared world-space shader as geological albedo context only.
- Texture alpha never controls terrain opacity.
- If radar imagery is unavailable, the same Venus material remains active with vertex-color + world-space procedural surface detail. There is no orange fallback sheet underneath it.

### No-data reconstruction

`VenusRadarProvider.sanitizeTexture()` now:

- detects transparent pixels,
- detects dominant edge-connected no-data plateaus,
- flood-fills missing pixels from neighboring valid radar samples,
- locally averages repaired boundaries,
- forces output alpha to 255,
- rejects an image if nearly all pixels are invalid,
- rejects imagery whose pixels cannot be safely inspected instead of trusting an unknown tile.

The WMS request also explicitly asks for an opaque image (`TRANSPARENT=FALSE`).

### Shared world/geographic radar projection

Radar is sampled from `vAntaraWorld.xz` using the scientific-to-render compression ratio. Neighboring chunks therefore evaluate the same radar coordinate at the same world position. Coverage is feathered near the radar crop edge into the same underlying Venus material instead of clamping a remote tile or revealing a different material.

### Removed intersecting regional underlay

The full-sheet `venus-regional-underlay-*` core mesh has been removed. Detailed core chunks are now the only terrain surface inside the core world.

### Chunk continuity

- Core LOD segment counts are integer-nested:
  - LOW: 56 / 28 / 14
  - MEDIUM: 84 / 42 / 21
  - HIGH: 120 / 60 / 30
- Fine core edges are stitched to coarser neighbor edges.
- Vertex normals are sampled from the shared world-space height function using central differences. They are no longer independently recomputed per chunk.
- Identical world positions therefore receive compatible heights, colors, radar samples, and normals across chunk boundaries.

### Continuation / far terrain

The former stacked MID + FAR continuation rectangles were replaced by one continuous non-playable continuation ring from the core edge toward the atmospheric horizon. Geometry/material detail still decreases continuously with distance, but there is no second rectangular material/mesh handoff. The first continuation vertices use exactly the same height/color/normal logic as the core boundary.

Major regional silhouettes and morphology are preserved by the existing region-specific continuation functions. Performance comes from low tessellation and distance-based detail reduction, not from replacing far terrain with a generic orange slab.

## Alpha Regio reference

The broken remote Alpha Regio hotlink was removed from both Venus Info Mode and the Full Exploration destination selector.

The project now ships a local fallback asset:

`assets/venus-alpha-regio-reference.svg`

It is explicitly labelled as an ANTARA morphology diagram based on the NASA/JPL Magellan PIA00481 scientific description, **not as an original NASA image**. This makes the UI self-contained and prevents another CORS/hotlink failure.

The official scientific reference remains:

https://science.nasa.gov/photojournal/venus-three-dimensional-perspective-view-of-alpha-region/

A helper is included at `tools/fetch_alpha_reference.py` to cache the official PIA00481 JPEG on a development machine with internet access. The current execution environment could not download the NASA binary, so the project does not falsely claim that the bundled SVG is the original PIA00481 raster.

## Verification

`tools/verify_venus_material_pipeline.mjs` verifies:

- radar is not used as an opacity-bearing material map,
- world-space radar projection is shared across chunks,
- coverage feathering exists,
- the overlapping underlay is gone,
- transparent/no-data radar pixels are repaired and forced opaque,
- shader discard is not used,
- core LOD grids are compatible,
- core/continuation boundary heights match,
- neighboring mixed-LOD chunk edge heights match,
- neighboring normals match,
- Alpha Regio uses a local project asset.

The existing morphology, compressed-scale, graphics/exit, and outer-world verifiers are also run after this fix to ensure the five destinations keep their distinct geology and the previous working systems are not regressed.
