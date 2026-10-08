# ANTARA Venus Full Exploration Rebuild Report

## Scope

Only Venus Full Exploration environment rendering was rebuilt. Venus normal/info mode, planet navigation, landing/cockpit systems, Sun, Mercury, Earth, Mars, Asteroid Belt, Jupiter, Saturn, Uranus, Neptune, global audio, and established NEXT/PREVIOUS behavior were not redesigned by this task.

## Removed from the active Venus terrain path

The active Full Exploration renderer no longer uses the previous destination-specific synthetic macro-height system. In particular, the old manually sculpted macro functions for Maat Mons, Maxwell Montes, Aphrodite Terra, Ishtar Terra and Alpha Regio are not present in `venus-full-exploration.js`.

The renderer also no longer relies on a fake outer-world skirt or a visible geometric boundary to create scale.

## New terrain architecture

`VenusTopographyProvider` is now the authoritative macro-height provider.

Preferred data path:

`USGS Magellan GTDR 4641m global GeoTIFF -> preprocessing tool -> 257 x 257 regional Float32 crop -> browser terrain sampling`

Fallback data path:

`NASA PDS Magellan/Pioneer one-degree topography -> archived byte scaling -> browser terrain sampling`

The foreground consists of quality-dependent near/mid/far terrain chunks. A separate much larger low-detail terrain mesh uses the same geographic provider and continues beyond the reachable radius.

## Scientific datasets actually referenced by code

### USGS Venus Magellan Global Topography 4641m v02

Used by the preprocessing tool as the preferred source for the five compact regional elevation files. The runtime only reports this source if a generated `topography-{region}.f32` file actually loads.

### NASA PDS `topogrd.img`

Used by the runtime as a coarse scientific fallback. The archived byte conversion is implemented directly:

`elevation_km = DN * 0.0478 - 2.492`

### USGS Magellan SAR WMS

Used only as surface/material context through the `MAGELLAN` layer or equivalent local `radar-{region}.png` files. Radar brightness is never used as height.

## Elevation usage

The final world height is:

`scientific macro elevation + controlled sub-resolution regional detail`

The exact same final height function drives:

- foreground mesh vertices;
- visual-world terrain vertices;
- slope calculations;
- geological prop placement;
- player ground height and collision clearance.

## Procedural detail restriction

Procedural functions now operate only below the scientific DEM scale. Their amplitude is subordinate to the scientific macro terrain and they fade toward the outer visual world. They add fractured volcanic crust, directional ridge texture, tessera-like fine structure, roughness and near-ground breakup. They do not create the primary mountain, plateau, basin or regional silhouette.

## Material rebuild

The Venus material now combines:

- scientific terrain geometry;
- optional Magellan SAR surface context;
- altitude/slope-aware vertex color variation;
- a periodic microdetail DataTexture used only for sub-resolution material detail;
- triplanar microdetail sampling in world space;
- view-distance-dependent albedo breakup;
- derivative-based micro normal response;
- world-space roughness variation;
- dense Venus atmospheric fog and diffuse illumination.

The micro texture is not the macro terrain source.

## LOD and world continuation

HIGH, MEDIUM and LOW profiles control chunk size, near/mid/far vertex density, background terrain density, DPR, anisotropy and prop count.

The player remains constrained to a small region radius, but the LOW-detail visual world spans roughly 400 to 520 km across depending on quality. The camera far plane is 420 km and Venus atmospheric extinction removes the distant terrain naturally before a geometric edge is exposed.

The boundary message explicitly describes a movement boundary while the visual terrain continues.

## Performance work

- scientific assets are preprocessed into compact regional files rather than loading a 65 MB global GeoTIFF in the browser;
- high-detail terrain exists only around the playable region;
- the exterior world uses substantially cheaper geometry;
- geological rocks are instanced;
- visibility checks are throttled rather than rebuilding terrain every frame;
- procedural microdetail is generated once and reused;
- radar/topography resources are cached for the active region and disposed on switch/exit;
- no static terrain geometry is regenerated each animation frame;
- adaptive DPR from the established Full Exploration controller remains active.

## Mars systems reused as engineering references

Mars was used as the benchmark for:

- measured-data-first terrain philosophy;
- quality tiers;
- high-detail near terrain plus cheaper distance rendering;
- triplanar microdetail material strategy;
- camera-relative movement;
- shared render/collision height logic;
- input and Pointer Lock lifecycle;
- adaptive DPR;
- cleanup and exit discipline.

Mars source files were not changed.

## Data availability in this generated ZIP

The build environment used for this rebuild could not download binary planetary datasets through its container network. Therefore this ZIP intentionally does not contain fabricated GTDR or SAR assets.

`tools/prepare_venus_magellan_data.py` was added to generate the real local assets on a machine with internet access. Run it once before the competition deployment. This behavior follows the requirement to document a missing external scientific asset instead of substituting random procedural terrain and calling it Magellan data.

## Verification performed

Completed:

- `node --check` on every top-level project JavaScript file;
- Python syntax compilation for the Magellan preprocessing tool;
- direct unit test of regional GTDR Float32 decoding and coordinate sampling;
- direct unit test of final `heightAt()` and slope sampling;
- terrain geometry vertex/index generation test;
- material shader injection test for triplanar detail and micro normal perturbation;
- disposal path test for the Venus world object;
- project-wide search confirming the rejected named Venus macro-height functions are absent from the active source;
- documentation audit to remove claims about the superseded Venus streaming/framelet implementation.

A headless Chromium visual regression run was attempted, but this execution environment blocks Chromium navigation with `ERR_BLOCKED_BY_ADMINISTRATOR`. No browser screenshot result is claimed from that failed test. Full interactive browser validation should therefore be run after generating the local scientific assets on the target machine.
