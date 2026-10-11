# Venus Full Exploration Visual Accuracy Audit

## Target

Venus should look like it belongs to the same technical generation as Mars without inheriting Mars colors, atmosphere or geology.

## Near ground

Near terrain uses the densest quality-dependent tessellation, world-space roughness variation, vertex-color material response and optional Magellan SAR context. The camera ground height comes from the same final height function used by the mesh.

## Mid distance

Chunk density falls with distance while every chunk samples the same geographic terrain provider. This keeps large silhouettes consistent instead of replacing them with unrelated procedural hills.

## Boundary and horizon

The player's collision radius is smaller than the rendered visual world. Beyond the reachable area, a lower-detail scientific terrain layer continues toward the atmospheric horizon. There is no visible wall, circular mountain fence, empty exterior or stretched last row of vertices.

## Venus atmosphere and lighting

Lighting stays diffuse to match the dense cloud-deck environment. Near terrain remains readable. Distance progressively removes contrast and detail until the far terrain disappears into the Venus haze.

## Planet identity

The material palettes remain volcanic brown, basaltic dark tones, ochre and amber atmospheric tints. Procedural microdetail is region-aware, but the macro silhouette comes from Magellan topography.
