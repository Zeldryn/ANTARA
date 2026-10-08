# Venus Full Exploration Science Audit

## Scope

This audit covers the five flyable Venus POIs in ANTARA Full Exploration: Maat Mons, Maxwell Montes, Aphrodite Terra, Ishtar Terra, and Alpha Regio. It separates measured large-scale topography from radar surface context and from renderer-only micro detail.

## Data pipeline

### Macro topography

Primary runtime source: NASA PDS Magellan Global Topography Data Record (GTDR), archived PDS3 sinusoidal framelets from `MG_3002/gtdr/sinus/`.

- Frame raster: 1024 x 1024, 16-bit little-endian unsigned integer.
- Image payload begins after the 2048-byte VICAR header.
- Map resolution: 22.755556 pixels/degree, approximately 4641.0589 m/pixel.
- Stored value: `DN = radius_m - 6039999`.
- ANTARA converts radius to elevation relative to the 6051 km reference radius before constructing terrain.
- USGS Magellan Global Topography v2 was used as the current verification reference for global coverage, elevation range, projection, and resolution.

Runtime frame mapping:

| POI | Main GTDR frame | Boundary helper |
| --- | --- | --- |
| Maat Mons | F09 | F17 south of the equator |
| Maxwell Montes | F05 | not required inside current exploration radius |
| Aphrodite Terra | F23 | not required inside current exploration radius |
| Ishtar Terra | F05 | not required inside current exploration radius |
| Alpha Regio | F21 | F20 west of 0 degrees longitude |

If the remote PDS frame cannot be fetched, ANTARA keeps the exploration functional with an explicitly labelled fallback relief. It does not report that fallback as measured Magellan topography.

### Macro surface identity

The terrain material keeps the global NASA/JPL Magellan radar-derived surface context. Radar brightness is treated as radar/scattering information, not visible-light natural color. The educational card labels authentic thumbnails as Magellan radar and, where relevant, simulated/false color.

### Micro detail

Procedural detail is limited to small-scale rendering enrichment: rock breakup, fractures, bump/normal response, roughness variation, and tens-of-meters-scale micro relief. It is never used to replace the large-scale GTDR landform when measured topography is available.

## POI audits

### 1. Maat Mons

**Current implementation before this rework**  
A generic procedural `shield` profile created the entire edifice, caldera, and surroundings.

**Real data reference**  
NASA PDS Magellan GTDR topography; NASA/JPL Magellan radar/altimetry perspective products; IAU/USGS Gazetteer coordinates.

**Mismatch found**  
The old shape was effectively a mathematically symmetric shield with a synthetic summit depression. It did not inherit the real asymmetric regional relief of Atla Regio or the measured macro silhouette. Surroundings ended after a small fixed chunk grid.

**Fix applied**  
F09 GTDR controls the macro surface north of the equator and F17 continues the measured terrain south of it. The terrain streams around the camera so volcanic plains continue toward the haze horizon. Procedural volcanically biased detail remains only at small scale. The location card explains the Magellan context and uses a Magellan radar/altimetry image.

**Final data sources**  
NASA PDS Magellan GTDR; NASA/JPL Magellan; IAU/USGS Gazetteer.

### 2. Maxwell Montes

**Current implementation before this rework**  
A procedural `mountain` profile multiplied intersecting sine ridges and a synthetic massif.

**Real data reference**  
Magellan GTDR F05; NASA/JPL full-resolution radar imagery of Lakshmi Planum and Maxwell Montes; USGS/IAU coordinates.

**Mismatch found**  
The old renderer produced generic alpine-looking peaks rather than the broad high-relief mountain belt and organized ridge/valley context visible in Magellan data.

**Fix applied**  
F05 measured elevation now determines the macro relief. Material shading emphasizes steep ridge surfaces without changing geometry. Streaming terrain extends beyond the immediate Maxwell center so the transition toward Ishtar terrain is no longer an isolated mountain patch.

**Final data sources**  
NASA PDS Magellan GTDR; NASA/JPL Magellan radar; IAU/USGS Gazetteer.

### 3. Aphrodite Terra

**Current implementation before this rework**  
A broad procedural highland wave stood in for an enormous and geologically complex equatorial highland.

**Real data reference**  
Magellan GTDR F23 for the selected Aphrodite center; NASA/JPL Ovda Regio radar products; USGS geologic mapping of Ovda/Aphrodite terrain; IAU/USGS coordinates.

**Mismatch found**  
The old scene reduced Aphrodite Terra to one local hill-like highland and did not express a continuing regional plateau/ridge/chasmata context.

**Fix applied**  
Measured GTDR controls regional height while the streaming ring keeps broad highland terrain present in every viewing direction. Procedural detail adds only local fractures and rock response. The educational card explicitly explains that Aphrodite is a huge regional highland, not a single isolated mountain.

**Final data sources**  
NASA PDS Magellan GTDR; NASA/JPL Magellan radar; USGS Astrogeology geologic mapping; IAU/USGS Gazetteer.

### 4. Ishtar Terra

**Current implementation before this rework**  
A round procedural `plateau` profile plus synthetic rim ridge represented the whole Ishtar context.

**Real data reference**  
Magellan GTDR F05; USGS geologic map of the Lakshmi Planum quadrangle; NASA/JPL Magellan Lakshmi Planum radar products; IAU/USGS coordinates.

**Mismatch found**  
A circular mesa did not match the complex plateau, mountain belts, tessera blocks, and deformed margins of western Ishtar Terra.

**Fix applied**  
Measured F05 elevation now supplies the macro highland. The renderer no longer injects a giant artificial plateau. The surrounding chunk field continues the measured regional relief while materials and micro detail provide local rock readability.

**Final data sources**  
NASA PDS Magellan GTDR; USGS Astrogeology; NASA/JPL Magellan; IAU/USGS Gazetteer.

### 5. Alpha Regio

**Current implementation before this rework**  
A procedural `tessera` profile generated intersecting sine ridges and treated them as Alpha's large-scale geometry.

**Real data reference**  
Magellan GTDR F21 plus F20 across the 0-degree boundary; NASA/JPL Magellan Alpha Regio radar imagery; IAU/USGS Gazetteer coordinates.

**Mismatch found**  
The old macro terrain was random intersecting ridge noise rather than the actual topographic upland. It could also become discontinuous immediately west of the prime meridian because Alpha's center lies close to 0 degrees longitude.

**Fix applied**  
GTDR provides the upland macro relief on both sides of the longitude boundary. The tessera-like procedural component is now small-scale surface enrichment only. Radar thumbnails and card copy explain the observed intersecting ridges, troughs, and fault valleys without claiming the renderer reproduces meter-scale fractures measured by Magellan altimetry.

**Final data sources**  
NASA PDS Magellan GTDR; NASA/JPL Magellan radar; IAU/USGS Gazetteer.

## World-density rework

The old Venus renderer used a fixed 3x3 or 5x5 terrain patch centered on spawn. The new manager streams a safety ring around the current camera chunk.

Desktop HIGH:
- chunk size 9.5 km
- outer radius 7 chunks
- near / mid / far / horizon geometry tiers: 88 / 44 / 20 / 8 segments

Mobile/low-end:
- outer radius 5 chunks
- near / mid / far / horizon tiers: 48 / 24 / 12 / 6 segments

Chunks use Three.js frustum culling and lower geometry density with distance. Old chunks leave the active set only after the camera has moved into a new streaming center. Dense Venus haze reduces far contrast, but the terrain still physically exists behind the haze rather than ending at a visible square edge.

## Educational card

One reusable `venus-location-card` is updated for all five POIs. It contains:
- name and geology category
- coordinates
- concise description
- three verified fact rows
- current topography pipeline status
- NASA/JPL/USGS/PDS source links
- authentic Magellan radar thumbnail with an explicit radar/simulated-color label
- collapse, close, and reopen controls

The card is pointer-lock aware. ESC releases pointer lock first; the user can then interact with the card and reacquire mouse look from the viewport.

## Scientific honesty rules retained

1. Radar imagery is never called ordinary photography.
2. GTDR macro topography is identified separately from procedural micro detail.
3. A failed PDS request triggers an explicit fallback label.
4. No uncertain dimensions, feature ages, or geologic mechanisms are invented by the Full Exploration card.
5. Coordinates come from IAU/USGS nomenclature records.
