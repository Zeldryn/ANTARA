# Earth Full Exploration

Earth Full Exploration is now one unified exploration mode built from the same core architecture and lifecycle philosophy as Mars Full Exploration.

## User flow

1. Open the Earth panorama.
2. Press **Eksplorasi Pengalaman Penuh** as a separate high-level action.
3. The Earth panorama performs the staged Mars-style approach transition.
4. ANTARA hands off into one streamed Earth terrain world.
5. The user explores continuously with the Mars control language.
6. Press **ESC** or **Keluar dari Eksplorasi** to run the reverse surface-to-orbit transition and restore the same Earth panorama state.

There is no destination selector and there are no separate Everest, Mariana, Mauna Kea, Grand Canyon, or Antarctica full-exploration renderers. Named POIs can be layered on later without changing the core world architecture.

## Terrain architecture

The renderer keeps the experience unified while loading only the terrain needed around the camera:

- Mapzen Terrarium tiles provide real elevation values.
- Terrarium decoding uses `elevation_m = red * 256 + green + blue / 256 - 32768`.
- Terrain is split internally into streamed Web-Mercator tiles.
- Mandatory inner tiles load before the surface handoff; outer tiles continue asynchronously.
- Camera movement triggers tile streaming and velocity-based look-ahead prefetch.
- Geometry density changes by ring and altitude.
- A Three.js frustum plus a turn-safety buffer controls view-dependent activation.
- Old chunks are pruned only after the replacement coverage is ready.
- Resources are reusable across normal enter/exit cycles and fully disposed when the Earth scene is reset.

This mirrors the Mars principle: one explorable world in the UI, chunking/LOD/culling internally.

## Earth-specific rendering

Earth does not reuse Martian visuals. The unified Earth renderer adds:

- broad albedo derived from the project's Earth surface / Blue Marble asset,
- elevation-, latitude-, and slope-aware land colouring,
- local rock/soil/vegetation/snow/ice detail,
- animated sea-level water treatment,
- Earth sky, aerial haze, distance falloff, and altitude-dependent atmosphere,
- real terrain elevation in the HUD.

The current entry anchor is Java, Indonesia. It is only the initial spawn/orbit target, not a destination system. Once exploration starts, terrain streams around the camera continuously.

## Controls

Desktop follows Mars:

- **WASD** move
- **Click + Mouse** look around / pointer lock
- **Q / E** descend / ascend
- **Shift** accelerate
- **Ctrl** precision movement
- **ESC** exit full exploration

Mobile keeps drag-look, directional controls, and altitude controls.

## Entry / exit lifecycle

Normal-motion entry uses the same high-level Mars staging: 4.7 s panorama-to-surface blend with the local surface becoming dominant in the latter half of the approach. Exit first raises the camera to orbital handoff altitude, then performs the reverse 3.2 s globe blend before restoring the Earth panorama.

Reduced-motion users receive shortened transitions while keeping the same state changes.

## Re-entry safety

The controller uses explicit `idle`, `preparing`, `entering`, `exploring`, `exiting`, and `error` states. Input listeners are abortable, pointer-lock state is cleared on exit, transition tokens cancel stale animations, partial preparation failures dispose their resources, and a normal exit returns the renderer to a reusable state for repeated entry.
