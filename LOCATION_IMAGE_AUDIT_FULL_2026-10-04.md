# ANTARA — Full Location + Image Audit
Date: 2026-10-04

Audit scope: every Solar System stop from Sun through Neptune, with emphasis on (1) whether a location/object marker is scientifically meaningful, (2) whether its visual media matches the topic, and (3) whether diagram-only topics still show an observational image first.

## Marker policy used

- **Rocky-world named surface feature** → coordinate marker is appropriate when a reliable location exists.
- **Atmospheric feature that drifts** → do not pretend it has a permanent longitude. Use a visual/historical context marker and explain the limitation.
- **Moon / dwarf planet / discrete body** → marker may point to the rendered object, but its orbital position is labelled as model/illustrative unless real-time ephemerides are used.
- **Spacecraft mission** → do not pin a fake point on a planet. Use trajectory/orbit context instead.
- **Global concept** (interior, rotation, atmosphere, scale, magnetic field, seasons) → no fake location marker.
- **Image policy** → observational / spacecraft / telescope / satellite imagery is displayed before ANTARA diagrams when available. Diagrams remain secondary teaching aids.

## 1. Sun

- No geographic marker added.
- Sunspots, flares and CME locations are dynamic and are not permanent surface coordinates.
- Every Sun topic now effectively shows an observational solar image first when its own topic contains only a diagram.
- Dynamic diagrams remain educational secondary media.

Decision: **No fake pins. Correct.**

## 2. Mercury

Specific marker topics:

- **Prokofiev — polar water ice**
  - Added marker: 85.77° N, 62.92° E.
  - Replaced generic polar-temperature lead image with NASA/MESSENGER Prokofiev imagery.
  - Marker, text and image now refer to the same example location.
- **Caloris Basin**
  - Existing marker retained: 31.5° N, 162.7° E.
  - Existing MESSENGER Caloris image retained.

Global topics such as rotation, core size, sodium tail and planetary contraction remain unpinned.

Decision: **2 scientifically meaningful surface markers.**

## 3. Venus

Verified marker topics:

- Maat Mons — 0.5° N, 194.6° E
- Maxwell Montes — 65.2° N, 3.3° E
- Alpha Regio / tessera terrain — 25.5° S, 0.3° E
- Mead crater — 12.5° N, 57.4° E

Each of the four marker topics already uses matching Magellan / NASA radar imagery. No additional pin was forced onto global atmosphere, greenhouse, temperature, pressure or rotation topics.

Decision: **Existing Venus location system retained.**

## 4. Earth

Verified location topics:

- Mount Everest
- Mauna Kea
- Challenger Deep
- Antarctica / Vostok context
- Furnace Creek
- Lake Baikal

Each has dedicated real-world photo, satellite image, or bathymetric map media. Global ocean, atmosphere, tectonics, magnetosphere, interior, Earth-Moon and habitability topics remain global.

Decision: **Existing Earth marker logic retained.**

## 5. Mars

Verified specific markers:

- Olympus Mons
- Valles Marineris
- Jezero crater
- Planum Boreum
- Gale crater / SAM measurement context

Corrections:

- **Polar-cap image mismatch fixed.** The marker pointed to northern Planum Boreum while the former image showed the south polar cap. It now uses a NASA image of the northern ice cap / Planum Boreum context.
- **Global dust-storm Hellas marker removed.** A planet-wide dust-storm lesson should not imply one fixed storm location. The topic keeps its real NASA 2018 storm imagery but is treated as a global phenomenon.

Decision: **5 justified location markers; no forced pin for global dust storms.**

## 6. Asteroid Belt

- Ceres remains a rendered object marker.
- Its UI explicitly says **MODEL CERES · POSISI ILUSTRATIF** so users are not led to believe the field is a live orbital ephemeris.
- Vesta keeps its genuine Dawn image, but no fake point is added because the 3D asteroid field does not model Vesta with scientifically meaningful orbital coordinates.
- Concept topics get an observational Ceres image before ANTARA diagrams when they otherwise have only diagrams.

Decision: **Do not fake live asteroid positions.**

## 7. Jupiter

- Great Red Spot remains the one precise feature marker.
- Marker was recalibrated against the actual project texture:
  - detected visual center ≈ 22.10° S
  - texture-relative longitude ≈ -110.00°
  - code marker now uses -22° / -110° texture-relative placement.
- UI explicitly describes GRS as a **dynamic storm**, not a permanent longitude.
- GRS topic now uses a dedicated NASA/JPL Cassini JPEG.
- All runtime Hubble `.tif` URLs were removed from the Jupiter lesson data and replaced by web-safe NASA/JPL JPEGs.
- Polar cyclones, bands, magnetosphere, rings and Galilean moons use semantic/object visualization rather than fake geographic points.

Decision: **GRS marker matches the displayed GRS while avoiding a false permanent-longitude claim.**

## 8. Saturn

Specific marker/object context:

- North-pole hexagon marker retained.
- Ring-system marker / Cassini Division annotation retained.
- Titan now has an object marker.
- Enceladus now has an object marker.

Cassini-Huygens correction:

- Removed fake single-point Cassini marker.
- Mission topic now shows a representative orbit/path visualization around Saturn instead.
- This communicates “Cassini explored the Saturn system” without pretending the mission occurred at one fixed planetary coordinate.

Moon marker labels explicitly state **POSISI MODEL**, because they are not real-time orbital ephemerides.

Decision: **feature markers + moon object markers + mission trajectory context.**

## 9. Uranus

- Miranda now has a rendered-moon marker.
- Titania and Oberon now receive two independent marker reticles instead of pointing at only one moon.
- Marker labels explicitly identify positions as model context.
- Axis, seasons, atmosphere, interior, rings and magnetosphere remain semantic/global visualizations rather than fake points.
- Voyager 2 mission remains a mission/history topic, not a planetary surface marker.

Decision: **all named moon-object topics can identify the correct rendered body.**

## 10. Neptune

- Great Dark Spot is now represented as a **historical Voyager 1989 latitude context**, around 22.5° S.
- A dedicated visual overlay marks that historical latitude while the official Voyager image provides the observational evidence.
- UI says **GREAT DARK SPOT · 1989 / ZONA HISTORIS · ~22,5° LS**, explicitly avoiding the claim that the storm is permanent.
- Triton now has an object marker with model-position disclosure.
- Rings, wind, clouds and magnetosphere retain global/semantic visualization.

Decision: **historical storm context + moon marker, no permanent-storm fiction.**

---

# Media integrity result

The shared media layer was tested against all **116 normal exploration topics**:

- Sun: 11 / 11 observational-first
- Mercury: 11 / 11
- Venus: 14 / 14
- Earth: 14 / 14
- Mars: 11 / 11
- Asteroid Belt: 11 / 11
- Jupiter: 11 / 11
- Saturn: 11 / 11
- Uranus: 11 / 11
- Neptune: 11 / 11

**Total: 116 / 116 topics now resolve to an observational image before a diagram.**

This does not mean every topic needs a unique photograph; global/abstract topics may use a real image of that world as grounding, then a diagram as the explanatory second visual.

# Technical checks

- `node --check` passed for all 10 scene JS files and `exploration-media.js`.
- Modified CSS parsed with zero `tinycss2` syntax errors.
- `index.html` contains no duplicate IDs after adding the second Uranus moon reticle.
- All local `assets/...` references used by affected files exist.
- Runtime lesson files contain no remote `.tif/.tiff` image references.
- Marker projection math test: Titan, Enceladus, Miranda, Titania, Oberon, Triton, Neptune historical GDS, and Jupiter GRS all project inside the desktop viewport for their selected topic views.
- Jupiter GRS texture scan independently measured its red-spot center at approximately latitude -22.10°, texture-relative longitude -109.998°, consistent with the -22° / -110° marker used in code.

# Important limitation

A full end-to-end browser navigation run against `localhost` / `file://` is blocked by the execution environment's browser administrator policy. The audit therefore uses source validation, media-resolution logic tests, DOM/ID checks, CSS parsing, and Three.js projection math. External NASA/USGS/NOAA image availability remains dependent on network access when the site is run.
