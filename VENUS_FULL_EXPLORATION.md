# ANTARA Venus Full Exploration

Venus Full Exploration is now a Venus-specific implementation of the **Mars Full Exploration framework**. The rejected custom Venus world renderer is not used underneath this system.

## Architecture

The surface experience follows Mars for:

- one-degree geographic terrain chunks
- camera-centered active terrain radius
- mandatory near-ring loading and asynchronous outer-ring streaming
- distance geometry LOD
- explicit frustum + camera-direction culling
- near-rear safety buffer for fast turns
- geometry/material reuse and bounded caches
- delta-time camera-relative movement
- Pointer Lock lifecycle
- HUD, top actions, location menu, fullscreen, mobile controls
- entry, location travel, exit, cleanup and re-entry state flow

There is one surface render loop and one active chunk manager.

## No fixed square world

There is no single Full Exploration `PlaneGeometry`. Each visible region is assembled from streamed geographic chunks around the current player tile. Moving into another tile streams the new ring while the previous safety ring remains until replacement chunks are ready.

The terrain function is evaluated in shared geographic/world coordinates. Adjacent chunks therefore share the same border heights and geological structures. Surface normals are also derived from a world-coordinate gradient so lighting does not reset at chunk borders.

Venus' dense atmosphere provides the far-horizon attenuation layer. On HIGH quality the Mars-style radius-3 ring covers roughly 740 km across on Venus; the far boundary is attenuated into the atmospheric clear/fog color rather than exposing a black or rectangular void.

## Scientific terrain pipeline

Macro relief:

`Magellan GTDR / NASA PDS -> geographic one-degree chunks`

If the remote GTDR frame cannot be reached, the HUD explicitly reports a science-informed fallback rather than presenting procedural relief as measured data.

Regional detail:

`Magellan macro relief + region-specific structural model + micro material detail`

The structural model is deterministic in geographic coordinates and is subordinate to measured macro relief. It exists to communicate morphology below GTDR's roughly 4.6 km/pixel sampling scale.

Radar/material context:

`NASA/JPL Magellan radar-derived surface context -> streamed per-chunk albedo -> Venus material profile`

## Five rebuilt regions

- **Maat Mons**: broad volcanic edifice, fractured plains and long flow-like structures.
- **Maxwell Montes**: directional mountain belt, organized ridges and valleys, with smoother Lakshmi context.
- **Aphrodite Terra**: broad highland field with older ridge/valley fabric cut by younger extensional fractures and lava-filled lows.
- **Ishtar Terra**: elevated plateau context with smoother interior sectors and rugged mountain/deformation margins.
- **Alpha Regio**: tessera terrain with multiple crossing ridge families, troughs, fault-valley structure, irregular blocks and smoother volcanic lows.

These are regions that continue through surrounding chunks, not isolated features placed in the middle of empty terrain.

## Educational card

The location card uses the same Mars landmark-card slot in the exploration HUD. It retains the Venus educational content, radar image, coordinate source, science reference and Magellan topography source without introducing a second Venus-specific top-control system.
