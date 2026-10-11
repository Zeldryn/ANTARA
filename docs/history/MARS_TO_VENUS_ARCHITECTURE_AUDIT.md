# Mars to Venus Architecture Audit

## Mars systems studied

The current Mars implementation was used as the technical benchmark for terrain density, quality profiles, camera-relative movement, ground sampling, adaptive DPR, input lifecycle, culling, cleanup, entry/exit behavior and the separation between high-detail local terrain and cheaper distant coverage.

Mars source files were not modified.

## What was removed from Venus

The active Venus Full Exploration no longer uses the old macro terrain functions that manually sculpted Maat Mons, Maxwell Montes, Aphrodite Terra, Ishtar Terra and Alpha Regio. The previous synthetic macro-landscape, fake edge continuation and decoration-first terrain hierarchy are not retained underneath the new renderer.

## New Venus-specific architecture

Venus now has:

- `VenusTopographyProvider` for real Magellan elevation;
- preferred preprocessed USGS GTDR 4.641 km/pixel regional Float32 grids;
- PDS one-degree Magellan topography as a coarse scientific fallback;
- `VenusRadarProvider` for independent Magellan SAR material context;
- a dense near/mid/far playable terrain grid;
- a large low-detail non-playable scientific visual world;
- world-space material roughness/detail;
- low-amplitude region-specific sub-resolution geology;
- instanced geological props;
- shared terrain/collision sampling;
- explicit scene/resource cleanup.

## Playable world versus visual world

Movement remains constrained to each destination's performance-friendly radius. The rendering boundary is much farther away. The exterior terrain is generated from the same geographic elevation source instead of stretching the last row of playable vertices or surrounding the player with a mountain ring.

The result is intentionally asymmetric: physics stops, terrain does not visibly stop.

## Scientific separation

Elevation and radar are kept separate.

- GTDR controls macro height.
- SAR contributes surface context and material variation.
- Procedural detail adds only sub-resolution relief and roughness.

If real topography cannot be loaded, the renderer reports the missing data rather than claiming random noise is Magellan terrain.
