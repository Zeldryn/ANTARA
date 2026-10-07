# Mars Full Exploration Mode

This project keeps the existing Mars orbit presentation and the existing `Jelajahi Mars` information mode intact. `Eksplorasi Pengalaman Penuh` is implemented as a separate interaction state layered onto the existing `MarsScene`.

## Terrain data

The surface geometry is driven by Mars Orbiter Laser Altimeter (MOLA) topography from the NASA Planetary Data System (PDS), not by brightness from the Mars color texture.

Runtime tile source by default:

- `https://jaanga.github.io/mars-heightmaps-128p/`
- 1 degree PNG tiles derived from the PDS MOLA 128 pixels/degree MEGDR products
- The original data source is the PDS Geosciences Node MGS MOLA MEGDR archive

The tiled derivative is used because loading a full high-resolution Mars DEM into a browser would be wasteful. Only tiles around the camera are requested and cached.

Jaanga's tile repository is distributed under CC BY 4.0 and credits the PDS Geosciences Node as the upstream data source.

## Self-hosting terrain tiles

To avoid a runtime dependency on the public tile host, mirror the same tile directory structure on your own host and set this before `mars-full-exploration.js` runs:

```html
<script>
  window.ANTARA_MARS_TERRAIN_BASE = "/assets/mars-mola-128p/";
</script>
```

Expected layout example:

```text
assets/mars-mola-128p/
  +77/
    128p+77+19.png
  -134/
    128p-134+19.png
```

The implementation deliberately does not invent procedural terrain when MOLA data is unavailable. It reports the failure and preserves the normal Mars experience.

## Architecture

- `MarsScene`: existing orbit renderer and normal Mars interaction.
- `MarsFullExploration`: explicit lifecycle/state controller.
- `MolaTileProvider`: tile addressing, loading, decoding, bilinear elevation sampling, bounded cache.
- `TerrainManager`: geographic mapping, terrain chunk generation, LOD, streaming, collision height lookup, GPU cleanup.
- `MarsInputManager`: scoped keyboard, pointer, and touch state. Listeners are active only while needed.
- Full exploration states: `IDLE`, `PREPARING`, `ENTERING`, `EXPLORING`, `TRAVELLING_TO_LOCATION`, `EXITING`, `ERROR`.

## Controls

Desktop:

- `W A S D`: camera-relative movement
- drag: look around
- `Q / E`: descend / ascend
- `Shift`: temporary speed boost
- `Ctrl`: precision movement
- `Esc`: exit exploration

Mobile:

- lower-left D-pad: movement with hold and multi-touch support
- drag open viewport: look around
- lower-right `+ / -`: altitude
- dedicated location, fullscreen, and exit controls

## Performance and cleanup

The terrain system uses distance-based chunk detail, bounded tile caching, frustum culling, quality tiers, pixel-ratio caps, frame-time movement, and dynamic resolution reduction after sustained low FPS. Leaving Mars disposes the dedicated surface renderer, terrain geometries, terrain material/texture, and cache. Ordinary exit back to Mars orbit keeps the prepared surface renderer available for a fast re-entry without adding duplicate input listeners.
