# Mars Full Exploration Mode

The existing Mars orbit presentation and `Jelajahi Mars` information mode remain intact. `Eksplorasi Pengalaman Penuh` is a separate interaction state layered onto the existing `MarsScene`.

## Scientific terrain and imagery pipeline

The surface uses separate elevation and imagery sources instead of stretching the orbit texture across a huge mesh.

### Source audit from this project

- Existing orbit/surface color fallback: `assets/textures/mars-surface-2k.jpg`, exactly 2048 x 1024 RGB.
- Existing project has no dedicated high-resolution Mars surface normal map or roughness map.
- Exploration elevation source: MOLA-derived geographic tiles, 128 x 128 samples for each 1 degree tile.
- MOLA-derived object-space normals are generated from those measured height samples, not from procedural noise.
- Real surface imagery LOD is therefore streamed separately instead of upscaling the 2K fallback.

### Elevation

- MGS Mars Orbiter Laser Altimeter (MOLA) topography derived from the NASA Planetary Data System.
- Runtime default: `https://jaanga.github.io/mars-heightmaps-128p/`
- Geographic 1 degree PNG tiles at 128 samples per degree.
- Only terrain near the camera is loaded and cached.
- Near-camera geometry now uses denser interpolation (up to 224 subdivisions per 1 degree chunk on HIGH) so the measured MOLA surface is shaded more smoothly at grazing angles. It does not claim extra measured elevation samples beyond MOLA.

### Surface imagery

The original local `assets/textures/mars-surface-2k.jpg` remains only as an immediate fallback while scientific imagery tiles load.

Runtime texture LOD uses NASA Trek geographic WMTS tiles:

- Viking MDIM 2.1 Colorized Global Mosaic, about 232 m/pixel, as the real global color source.
- THEMIS daytime infrared mosaic, about 100 m/pixel, as a restrained high-frequency detail source at low altitude where coverage is available.
- Texture zoom increases as camera altitude decreases.
- A lower texture LOD stays visible until the requested higher LOD finishes loading.
- Scientific texture upgrades crossfade briefly instead of popping from blurry to sharp in one frame.
- The system prefetches data in the current movement direction.
- Mipmaps and the full renderer-supported anisotropic filtering tier are enabled for shallow viewing angles.
- MOLA-derived object-space normals preserve measured macro relief.
- A separate seamless micro-detail layer adds sub-tile dust/rock roughness for close-range readability. This layer is visual material detail only and does not replace MOLA geography or Viking/THEMIS imagery.

Deployments can self-host compatible tile endpoints before `mars-full-exploration.js` runs:

```html
<script>
  window.ANTARA_MARS_TERRAIN_BASE = "/assets/mars-mola-128p/";
  window.ANTARA_MARS_VIKING_TEMPLATE = "/mars-imagery/viking/{z}/{row}/{col}.jpg";
  window.ANTARA_MARS_THEMIS_TEMPLATE = "/mars-imagery/themis/{z}/{row}/{col}.jpg";
</script>
```

The implementation does not replace missing scientific tiles with procedural geography. Existing lower LOD imagery stays visible when a sharper imagery request is unavailable. The micro-detail layer only affects fine material appearance and bump response, while large-scale colour and terrain shape remain scientific-source driven.

## Chunking and seams

- Terrain is divided into geographic 1 degree chunks.
- Geometry density decreases with distance from the camera.
- Terrain chunks include shallow skirts to hide cracks at LOD borders.
- Unneeded chunks, materials, normal textures, and imagery textures are disposed.
- Image, terrain, and generated patch caches are bounded.

## 30 km exploration ceiling

Manual full-exploration navigation is terrain-relative and limited to 30 km above the local sampled MOLA surface.

- Desktop `E` cannot exceed 30 km.
- Shift boost cannot bypass the limit.
- Mobile ascend controls use the same movement path and cannot bypass the limit.
- As the camera approaches the ceiling, upward velocity is progressively reduced.
- At 30 km the upward component becomes zero while horizontal flight stays available.
- Landmark travel cruises below the ceiling.
- Entry from orbit and exit back to orbit are cinematic states, so those transitions are allowed above 30 km while player controls are not active.
- The HUD displays an understated altitude-limit status near 30 km.

## Architecture

- `MarsScene`: existing orbit renderer and normal Mars interaction.
- `MarsFullExploration`: lifecycle and explicit exploration states.
- `MolaTileProvider`: MOLA tile addressing, loading, decoding, elevation sampling, cache.
- `MarsImageryProvider`: NASA Trek imagery tile loading, texture LOD, patch assembly, directional prefetch, cache.
- `TerrainManager`: chunk generation, geometry LOD, texture LOD, skirts, normal detail, collision lookup, cleanup.
- `MarsInputManager`: scoped keyboard, pointer-lock mouse, and touch input.
- States: `IDLE`, `PREPARING`, `ENTERING`, `EXPLORING`, `TRAVELLING_TO_LOCATION`, `EXITING`, `ERROR`.

## Controls

Desktop:

- `W A S D`: camera-relative movement
- click viewport: pointer-lock mouse look
- `Q / E`: descend / ascend
- `Shift`: temporary speed boost
- `Ctrl`: precision movement
- `Esc`: release pointer lock first, then normal exploration exit behavior remains available

Mobile:

- lower-left D-pad: movement with hold and multi-touch support
- drag open viewport: look around
- lower-right `+ / -`: altitude
- location, fullscreen, and exit controls remain separate

## Performance and cleanup

Quality tiers independently control geometry density, terrain radius, imagery LOD, texture size, micro-detail density, anisotropy, and render DPR. HIGH desktop quality preserves more THEMIS patch resolution, uses denser near terrain, and raises the DPR floor modestly. Dynamic resolution can still reduce renderer DPR after sustained low FPS without lowering the underlying terrain source data. Leaving Mars disposes the dedicated surface renderer, terrain geometry, generated textures, imagery caches, and input state.
