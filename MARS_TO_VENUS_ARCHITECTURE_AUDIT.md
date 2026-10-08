# Mars Template -> Venus Full Exploration Rebuild Audit

## Removed from the rejected Venus Full Exploration

The current `venus-full-exploration.js` replaces the old Venus surface implementation instead of layering another renderer over it. The project no longer contains the rejected Full Exploration implementation's fixed/custom square-world generator, custom 9.5 km chunk grid, old radial/generic orange terrain profiles, separate custom top controls, card-collapse/reopen controls, or a second Full Exploration animation loop.

## Mars systems used as the template

The rebuilt Venus module starts from the actual Mars Full Exploration structure and retains its core technical language:

- `TerrainManager` streamed geographic chunk lifecycle
- quality-based radius and LOD tiers
- mandatory center/safety-ring load then outer-ring streaming
- explicit frustum and camera-facing visibility pass
- rear-camera culling with near safety buffer
- bounded geometry cache and texture promotion only for relevant chunks
- `InputManager` Pointer Lock and mobile-control behavior
- delta-time, camera-relative WASD/Q/E/Shift movement
- adaptive DPR
- Mars-style HUD/top actions/location menu/fullscreen
- progress-driven entry/exit lifecycle
- cruise/cover/re-anchor/descend location travel
- stop/dispose/re-entry cleanup model

Mars and Earth source files are not modified by this rebuild.

## Venus-specific systems

Only planetary content differs: Venus radius and atmosphere, Magellan GTDR macro relief, Magellan radar context, Venus material profiles, five Venus POIs and their regional structural models.

### Maat Mons
A broad shield-like volcanic rise with fractured plains and long flow structures. The feature continues across chunks through shared world coordinates.

### Maxwell Montes
An elongated mountain province with directional ridge trains, cross-valleys and smoother neighboring highland/plain context, rather than independent random peaks.

### Aphrodite Terra
A geographically broad highland model based on Ovda-style multi-stage deformation: older ridge/valley fabric, younger cross-cutting extension/graben and smoother lava-filled lows.

### Ishtar Terra
A high plateau context with comparatively smoother interior and rough, deformed mountain margins.

### Alpha Regio
A tessera model built from several intersecting ridge families plus independent trough/fault-valley families, irregular block relief and smoother local volcanic lows. It is not a single mound, dune field or repeating hill noise.

## World continuity

Terrain addresses use one-degree geographic tiles. Height/detail functions are sampled in shared latitude/longitude coordinates rather than local chunk coordinates, so structures cross chunk edges continuously. A world-space gradient provides matching top-surface normals at shared borders, while skirts protect temporary LOD gaps.

The renderer keeps a Mars-style active ring around the player, streams replacement chunks as the camera crosses a geographic tile, and retains a near safety ring during the transition. Camera rotation changes visibility/LOD only. It does not rebuild the world.

Far terrain is blended into dense Venus atmospheric fog before the active ring boundary, and the renderer uses an opaque atmospheric clear color. This prevents a visible square/black edge while preserving strong nearby terrain contrast.
