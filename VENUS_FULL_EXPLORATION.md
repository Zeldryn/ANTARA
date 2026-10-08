# ANTARA Venus Full Exploration

Venus Full Exploration remains part of the same exploration family as Earth and Mars. The existing Venus panorama, info mode, planet transitions, HUD language, pointer-lock controls, and hero lifecycle are retained.

## Current exploration architecture

The Full Exploration entry stays beside `Jelajahi Venus` in the Venus hero stack. Entry passes through the existing cloud-layer transition, activates one Venus renderer, and supports five POIs without creating five separate scenes:

1. Maat Mons
2. Maxwell Montes
3. Aphrodite Terra
4. Ishtar Terra
5. Alpha Regio

`Lokasi` changes the active scientific region while keeping the same renderer alive. Exit releases controls, removes the HUD, reverses the Venus exploration lifecycle, and restores the Venus panorama.

## Science-driven terrain pipeline

Macro terrain first attempts to load official NASA PDS Magellan GTDR sinusoidal topography framelets at about 4.64 km/pixel. The active frame is lazy-loaded only when Venus Full Exploration or a new POI needs it. Maat and Alpha additionally preload the adjacent archive frame needed to cross an equator/prime-meridian frame boundary cleanly.

When GTDR is available:

`Magellan measured topography -> macro shape -> procedural micro detail -> material/normal/roughness enrichment`

When the remote PDS product cannot be loaded, the renderer falls back to the older feature-class relief so gameplay remains functional, but the HUD and educational card explicitly report `FALLBACK` rather than claiming measured Magellan topography.

The global surface color context remains a NASA/JPL Magellan radar-derived mosaic. This is labelled as radar/simulated-color context, not visible-light photography.

## Continuous local world

The old fixed terrain square is replaced by camera-centered chunk streaming:

- highest useful geometry close to the camera
- medium detail in neighboring terrain
- low-cost terrain toward the horizon
- Three.js frustum culling for out-of-view chunks
- bounded geometry cache
- safety ring that follows the camera
- dense Venus haze for atmospheric attenuation, not for hiding a missing world

This means the user can move forward/backward/left/right and rotate 360 degrees without the intended play area being a tiny isolated terrain island.

## Educational location card

A single reusable compact card appears on entry and after location changes. It updates with:

- location name
- category/type
- real IAU/USGS coordinates
- short explanation
- three important facts
- current terrain-data status
- Magellan radar thumbnail where available
- NASA/JPL/USGS/PDS source links

The card can be collapsed or closed. `Info Lokasi` reopens it. It does not duplicate per-location DOM components.

## Controls

Desktop remains aligned with Earth/Mars:
- WASD movement
- click + mouse look / Pointer Lock
- Q / E descend / ascend
- Shift boost
- ESC releases Pointer Lock first, then exits when pressed again while unlocked

Mobile keeps the established ANTARA directional and altitude controls.

## Scientific scope

See `VENUS_SCIENCE_AUDIT.md` for the required location-by-location comparison of the previous procedural implementation against Magellan/PDS/USGS/NASA references and the fixes applied.

## 2026-09-27 morphology accuracy pass

The flyable Venus world now separates three scales explicitly:

- **Macro**: Magellan GTDR measured elevation whenever the archived PDS frame is available.
- **Regional / meso morphology**: deterministic, radar-informed structural visualization used to restore ridge, trough, graben, flow and tessera character below GTDR's ~4.64 km/pixel sampling. It is not labelled as directly measured elevation.
- **Micro**: triplanar detail, bump/normal response and roughness breakup.

Regional profiles are no longer one universal Venus background:

- Maat Mons: broad asymmetric shield + flow/fractured plains context.
- Maxwell Montes: elongated massif transition + parallel compressional ridge character.
- Aphrodite Terra: broad deformed highland + multiple structural generations + graben + smoother flooded lows.
- Ishtar Terra: smoother plateau/highland interior + deformed mountain-margin transition.
- Alpha Regio: multiple cross-cutting ridge fields + fault/trough network + irregular blocks + smoother local volcanic lows.

Atmospheric fog was reduced enough to preserve nearby geological contrast while keeping a dense Venus horizon. Lighting is now location-tuned and more directional so structural relief reads through haze. The existing educational card, GTDR fallback labels, chunk streaming, LOD, frustum culling, pointer lock and re-entry lifecycle remain in place.
