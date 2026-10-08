# ANTARA Venus Full Exploration

## Current architecture

Venus Full Exploration has been rebuilt around the engineering principles used by Mars while keeping a Venus-specific renderer and geology. The old named synthetic macro-height functions are not part of the active renderer.

Only one Venus destination is loaded at a time. The player's collision radius stays limited for performance, but the rendered scientific terrain extends hundreds of kilometers farther through a lower-detail visual world.

## Elevation hierarchy

The active height source is selected in this order:

1. Local regional Float32 crops generated from **USGS Venus Magellan Global Topography 4641m v02**.
2. NASA PDS `topogrd.img`, a real 360 x 180 one-degree Magellan/Pioneer topography grid, used only as a coarse scientific fallback.
3. Remote PDS copies of the same one-degree product if the local fallback is absent.
4. If no legitimate elevation source can be loaded, Venus Full Exploration shows an error instead of substituting fake macro terrain.

The preferred regional files are produced by `tools/prepare_venus_magellan_data.py`. The browser never needs to load the full 65 MB USGS GeoTIFF.

## Procedural detail rule

`heightAt()` is always:

`scientific macro elevation + controlled sub-resolution detail`

Procedural detail is low-amplitude and region-specific. It is used for surface breakup, fractured volcanic crust, ridge texture, tessera-style fine structure and other detail below the source DEM resolution. It does not create the primary mountain, plateau or basin shape.

The same `heightAt()` function drives rendered vertices, slope calculations, props and player ground collision.

## Terrain hierarchy

### High-detail playable terrain

A quality-dependent grid of dense chunks surrounds the destination. Near chunks have the highest tessellation, middle chunks are reduced, and outer chunks are cheaper. Chunk edge coordinates are evaluated from the same world-space height function, preventing independent per-tile terrain shapes.

### Non-playable visual world

A much larger low-detail terrain mesh uses the same scientific provider and the same geographic transform. It extends beyond the collision radius and fades through Venus atmospheric extinction. The player is stopped by movement logic, not by a visible wall or terrain edge.

### Atmosphere

Venus uses dense, warm atmospheric fog and diffuse lighting. Fog is applied after terrain generation and is not used as a substitute for missing geometry.

## Material system

The terrain uses world-space procedural roughness variation, vertex-color geology response and optional Magellan SAR imagery. Local SAR crops are preferred. A USGS Magellan WMS request is only a runtime fallback.

Radar imagery affects surface/material appearance only. Radar brightness is never converted to elevation.

## Performance

The rebuild keeps three quality profiles. Quality changes affect near/mid/far terrain density, DPR, anisotropy, prop count and visual-world resolution. Expensive geological props are instanced. Visibility checks run periodically rather than rebuilding static geometry every frame. Assets, geometry, textures, event listeners and animation state are explicitly disposed on exit or region switch.

## Data preparation

Generate local competition assets with:

```bash
python tools/prepare_venus_magellan_data.py
```

See `assets/venus-data/README.md` for exact data products and file formats.
