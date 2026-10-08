# Mars Full Exploration Mode

The existing Mars orbit presentation and `Jelajahi Mars` information mode remain intact. `Eksplorasi Pengalaman Penuh` is a separate interaction state layered onto the existing `MarsScene`.

## Rendering strategy

The surface no longer behaves like one large texture stretched across one mesh. Full Exploration now uses a layered game-style terrain pipeline while keeping the existing scientific Mars identity:

1. **Macro geography** from MOLA elevation.
2. **Macro colour** from Viking MDIM 2.1.
3. **Measured mid-frequency image detail** from THEMIS daytime IR where coverage exists.
4. **Small sub-MOLA geometric relief** to fill spatial scales that the 128 px/degree elevation source cannot resolve.
5. **World-space triplanar material detail** for close-range dust, grains, rock breakup, roughness and normal response.

The synthetic layers are deliberately small-scale enhancements. They do not replace named terrain regions, MOLA macro topography, or Viking/THEMIS imagery, and they are not presented as measured rover-scale elevation.

## Scientific terrain and imagery sources

### Project source audit

- Existing orbit/surface colour fallback: `assets/textures/mars-surface-2k.jpg`, 2048 x 1024 RGB.
- Exploration elevation: MOLA-derived geographic tiles, 128 x 128 samples per 1 degree tile.
- Runtime MOLA default: `https://jaanga.github.io/mars-heightmaps-128p/`.
- Viking MDIM 2.1 Colorized Global Mosaic, about 232 m/pixel, provides global surface colour.
- THEMIS daytime infrared mosaic, about 100 m/pixel, contributes measured local luminance/detail at low and medium altitude.
- The local 2K Mars texture remains an immediate fallback while scientific imagery is streamed.

Deployments can self-host compatible endpoints before `mars-full-exploration.js` runs:

```html
<script>
  window.ANTARA_MARS_TERRAIN_BASE = "/assets/mars-mola-128p/";
  window.ANTARA_MARS_VIKING_TEMPLATE = "/mars-imagery/viking/{z}/{row}/{col}.jpg";
  window.ANTARA_MARS_THEMIS_TEMPLATE = "/mars-imagery/themis/{z}/{row}/{col}.jpg";
</script>
```

## Chunked terrain and LOD

Terrain remains split into geographic 1 degree chunks, but the geometry budget is now much more aggressively concentrated around the camera.

HIGH desktop tier:

- centre chunk: 320 subdivisions
- first ring: 176 subdivisions
- second ring: 80 subdivisions
- horizon ring: 36 subdivisions
- radius: 3 chunks around the current tile

MEDIUM and LOW use progressively lighter versions of the same ring strategy. This gives the near field substantially more geometry while preventing distant terrain from consuming the same vertex budget.

Chunk edges use the same continuous height function at every LOD level, so changing ring density does not intentionally change the terrain height at boundaries. Shallow skirts remain as a secondary crack guard.

## Sub-MOLA geometric relief

MOLA remains the authoritative large-scale terrain shape. A deterministic, globally anchored relief field adds only small mid-scale variation below the source elevation resolution.

- Maximum amplitude is intentionally small, around tens of metres on HIGH.
- The function is continuous across neighbouring longitude/latitude chunks.
- The same function is used by rendered geometry and terrain collision lookup, so the camera follows the visible ground rather than the unenhanced MOLA sheet.
- Frequencies are kept large enough for distant LOD rings to represent them without turning the horizon into high-frequency spikes.

This is visual/game-detail synthesis, not additional measured MOLA data.

## Higher-resolution terrain normals

The terrain normal field now combines sampled MOLA slopes with the sub-MOLA relief. HIGH builds a 256 x 256 normal field per 1 degree chunk, MEDIUM uses 192 x 192, and LOW stays at the source-scale 128 x 128 path.

This does not invent new MOLA measurements. It gives the rendered interpolation and synthetic sub-MOLA relief a denser lighting representation so hills, ridges and depressions read more clearly.

## Multi-scale surface material

The close surface material uses three world-space detail frequencies:

- broad material breakup
- mid-frequency rocky/dust variation
- fine grit/rock response near the camera

Detail is sampled with **triplanar mapping** in world space rather than ordinary tile UVs. This avoids obvious texture stretching on steeper terrain and prevents detail phase from restarting at every geographic tile.

Distance-aware blending automatically reduces high-frequency detail as geometry moves away from the camera, so low altitude stays crisp while high altitude returns to coherent macro terrain.

## Normal and roughness response

Three.js normally treats an object-space normal map and a bump map as alternative branches. Full Exploration explicitly keeps the MOLA-derived object-space normal first, then layers the world-space micro-height derivatives on top.

The same multi-scale field also adds controlled roughness variation so the ground reads as dusty, dry, granular and rocky instead of flat plastic.

## Imagery LOD and filtering

- Viking colour LOD stays high farther into the mid-altitude band.
- THEMIS z9 detail can remain active through the low-altitude range where source coverage permits it.
- HIGH retains up to a 768 px assembled patch, close to the useful information available from a 1 degree THEMIS z9 footprint rather than blindly upscaling a giant bitmap.
- Surrounding rings receive a smaller altitude penalty on HIGH so the near/mid terrain does not abruptly lose detail just outside the centre tile.
- Scientific texture upgrades crossfade instead of popping.
- Mipmaps remain enabled.
- Anisotropic filtering uses the renderer-supported tier, up to 16x on HIGH.

## Desktop render quality

HIGH desktop quality now prioritizes a visibly denser presentation:

- supersample target: 1.62 DPR when the device/pixel budget allows it
- maximum DPR: 2.4
- render pixel budget: 12 million pixels
- 16x requested anisotropy, clamped to GPU capability
- reduced full-exploration fog density for clearer terrain readability
- ACES tone mapping retained with a small exposure adjustment

Dynamic resolution is still active. Sustained low FPS can lower DPR without replacing the underlying geometry or texture source data.

## 30 km exploration ceiling

Manual navigation remains terrain-relative and limited to 30 km above the local sampled/enhanced ground.

- Desktop `E` cannot exceed 30 km.
- Shift boost cannot bypass the limit.
- Mobile ascend controls use the same movement path.
- Near the ceiling, upward velocity is progressively reduced.
- At 30 km, upward velocity becomes zero while horizontal flight remains available.
- Landmark travel stays below the gameplay ceiling.
- Entry/exit cinematics may pass above 30 km because manual controls are not active in those states.

## Architecture

- `MarsScene`: existing orbit renderer and normal Mars interaction.
- `MarsFullExploration`: lifecycle and exploration states.
- `MolaTileProvider`: MOLA addressing, loading, decoding, interpolation and cache.
- `MarsImageryProvider`: NASA Trek imagery loading, scientific texture LOD, patch assembly and directional prefetch.
- `TerrainManager`: chunk LOD, continuous sub-MOLA relief, normal generation, triplanar multi-scale material, texture LOD, collision and cleanup.
- `MarsInputManager`: scoped keyboard, pointer-lock mouse and touch input.
- States: `IDLE`, `PREPARING`, `ENTERING`, `EXPLORING`, `TRAVELLING_TO_LOCATION`, `EXITING`, `ERROR`.

## Controls

Desktop:

- `W A S D`: camera-relative movement
- click viewport: pointer-lock mouse look
- `Q / E`: descend / ascend
- `Shift`: speed boost
- `Ctrl`: precision movement
- `Esc`: release pointer lock first

Mobile:

- lower-left D-pad: movement
- drag viewport: look around
- lower-right `+ / -`: altitude
- location, fullscreen and exit controls remain unchanged

## Cleanup and fallback behaviour

Image, terrain and generated-patch caches remain bounded. Unneeded meshes, materials, normal textures and imagery textures are disposed. If a higher scientific imagery LOD is unavailable, the current lower LOD stays visible rather than being replaced by fabricated geography. Leaving Full Exploration disposes the dedicated surface renderer and its terrain resources.

## View-dependent performance overhaul

The GAME-QUALITY terrain now keeps the near-camera visual path intact while reducing work that cannot materially contribute to the current frame.

### Camera/frustum activation

- Terrain remains spatially split into geographic chunks.
- `THREE.Frustum` is evaluated against every loaded chunk before the frame is rendered.
- Chunks intersecting the camera frustum stay active.
- A conservative side/near-camera safety buffer stays prepared so a fast 180 degree turn does not reveal empty terrain.
- Deep rear/off-screen chunks are marked inactive and stop requesting expensive scientific imagery upgrades.
- Terrain materials are explicitly `THREE.FrontSide`; no unnecessary double-sided terrain rasterization is enabled.

### View-dependent material cost

The premium triplanar material now has four runtime detail tiers without changing the near-field appearance:

- Tier 3: broad + fine + grit triplanar detail, micro-normal and roughness response.
- Tier 2: broad + fine detail for visible mid-distance terrain.
- Tier 1: broad material breakup only for visible far/horizon terrain, and for high-altitude views only after the original fine/grit shader weights have already faded to zero.
- Tier 0: no triplanar micro-detail sampling for off-screen/inactive chunks.

Low-altitude terrain directly in view therefore keeps the same full material path. The optimization removes expensive samples where those frequencies are already sub-pixel or invisible.

### Altitude-aware geometry LOD

The existing distance-ring geometry remains at full low-altitude density. At higher altitude, only visible chunks are allowed to swap to a lighter geometry tier:

- below 24 km: original GAME-QUALITY ring densities are preserved
- 24 to 30 km: center and surrounding visible rings use progressively lighter tessellation because metre-scale relief is sub-pixel from that height

The deterministic height function is identical across LODs and skirts remain active, reducing the chance of visible cracks at boundaries.

### Chunk reuse and streaming

Terrain identity is now based on the geographic tile rather than `tile + segment count`. Crossing a tile boundary therefore reuses the existing material, scientific imagery and normal texture. Geometry variants are swapped and cached instead of destroying/recreating the whole terrain resource. Only two geometry variants are retained per tile to prevent traversal from growing memory indefinitely.

The old safety ring is also retained until replacement background chunks are ready, so streaming should not expose black squares or missing terrain edges.

### Visibility-aware imagery

Outer background chunks begin with the existing fallback albedo and are not automatically sent through the most expensive Viking/THEMIS upgrade path. Visible chunks request the appropriate scientific LOD, side-buffer chunks are warmed conservatively, and deep rear chunks do no imagery refresh work until needed.

Movement-direction prefetch remains active.

### Optional performance diagnostics

Normal users see no debug UI. Add `?marsTerrainDebug=1` to the page URL during development to log approximately once per second:

- FPS / frame time
- renderer draw calls
- rendered triangle count
- DPR
- visible / buffered / culled terrain chunk counts
- active material-detail tiers

This instrumentation is disabled by default and does not alter the normal ANTARA interface.
