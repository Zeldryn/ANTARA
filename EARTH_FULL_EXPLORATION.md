# Earth Full Exploration

Earth Full Exploration is one unified exploration mode built from the same core architecture and lifecycle philosophy as Mars Full Exploration. The five featured Earth destinations are navigation anchors inside that one world, not separate renderers.

## User flow

1. Open the Earth panorama.
2. Press **Eksplorasi Pengalaman Penuh** as a separate high-level action.
3. The Earth panorama performs the staged Mars-style approach transition.
4. ANTARA hands off into one streamed Earth terrain world at the Java entry anchor.
5. Explore freely, or open **Lokasi** to travel to Everest, Challenger Deep, Mauna Kea, Grand Canyon, or Antarctica / Mount Vinson.
6. A destination change raises the camera, preloads the target DEM, re-anchors the same terrain manager, then descends into the new area.
7. Press **ESC** or **Keluar dari Eksplorasi** to run the reverse surface-to-orbit transition and restore the same Earth panorama state.

The five locations never create five independent Earth scenes, cameras, terrain engines, or full-exploration renderers.

## Terrain architecture

The renderer keeps the experience unified while loading only the terrain needed around the camera:

- Mapzen Terrarium tiles provide real land elevation values.
- Terrarium decoding uses `elevation_m = red * 256 + green + blue / 256 - 32768`.
- Terrain is split internally into streamed Web-Mercator tiles.
- Mandatory inner tiles load before a surface handoff; outer tiles continue asynchronously.
- Camera movement triggers tile streaming and velocity-based look-ahead prefetch.
- Geometry density changes by ring and altitude.
- A Three.js frustum plus a turn-safety buffer controls view-dependent activation.
- Old chunks are pruned only after replacement coverage is ready.
- Destination travel preloads the target tiles before the current terrain is removed.
- Resources are reusable across normal enter/exit cycles and fully disposed when the Earth scene is reset.

This mirrors the Mars principle: one explorable world in the UI, chunking/LOD/culling internally.

## Featured destinations

The **Lokasi** menu exposes five anchors inside the active Earth renderer:

- **Everest / Himalaya**: snow and exposed-rock material profile, colder high-altitude lighting and haze.
- **Mariana Trench / Challenger Deep**: underwater camera space, deep-ocean material profile, sea surface overhead, suspended-particle ambience, and a local Challenger Deep bathymetric fallback when the Terrarium ocean tile is flattened at sea level.
- **Mauna Kea / Hawai‘i**: basaltic volcanic material profile with island/ocean context and a clearer tropical atmosphere.
- **Grand Canyon**: warm layered sediment material profile, erosion-oriented terrain readability, and drier haze.
- **Antarctica / Mount Vinson**: ice/snow material profile, exposed rock on steep terrain, and bright polar atmosphere.

The destination profiles use the same terrain geometry pipeline. They do not replace it with hand-built demo maps.

## Earth-specific rendering

Earth does not reuse Martian visuals. The unified Earth renderer combines:

- broad albedo from the project's Earth / Blue Marble surface asset,
- elevation-, latitude-, slope-, and destination-aware material colour,
- generated high-frequency rock, silt, basalt, strata, snow, and ice detail textures,
- triplanar detail modulation and roughness variation,
- animated sea-level water treatment,
- Earth sky, aerial haze, distance falloff, and destination-aware lighting,
- real terrain elevation/depth feedback in the HUD.

The initial spawn remains Java, Indonesia. It is the orbit-to-surface entry anchor only. Featured locations are selected after the user is already inside Full Exploration.

## Controls

Desktop follows Mars:

- **WASD** move
- **Click + Mouse** look around / pointer lock
- **Q / E** descend / ascend
- **Shift** accelerate
- **Ctrl** precision movement
- **ESC** exit full exploration

Mobile keeps drag-look, directional controls, and altitude controls.

## Destination travel lifecycle

A destination switch uses the active renderer and terrain manager:

1. Disable movement and release pointer lock.
2. Raise to a safe cruise altitude.
3. Preload the target DEM tiles.
4. Cover the handoff with the Earth travel veil.
5. Clear only the old terrain meshes, then re-anchor the same terrain manager.
6. Build the destination material/environment profile and required terrain tiles.
7. Reposition the same camera and descend to exploration altitude.
8. Restore controls, update the HUD, and show destination metadata.

If travel fails, the controller attempts to rebuild the previous anchor instead of leaving the camera in an empty scene.

## Entry / exit lifecycle

Normal-motion entry uses the same high-level Mars staging: 4.7 s panorama-to-surface blend with the local surface becoming dominant in the latter half of the approach. Exit first raises the camera to orbital handoff altitude, then performs the reverse 3.2 s globe blend before restoring the Earth panorama.

Reduced-motion users receive shortened transitions while keeping the same state changes.

## Re-entry safety

The controller uses explicit `idle`, `preparing`, `entering`, `exploring`, `travelling_to_location`, `exiting`, and `error` states. Input listeners are abortable, pointer-lock state is cleared on exit/travel, transition tokens cancel stale animations, partial preparation failures dispose their resources, destination cards/menus/underwater state are cleared during reset, and a normal exit returns the renderer to a reusable state for repeated entry.
