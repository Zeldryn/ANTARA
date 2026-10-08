# Venus Full Exploration Visual Accuracy Audit

## Purpose

This pass compares ANTARA's five Venus exploration environments against the scientific reference imagery already used by the educational cards. The renderer keeps Magellan GTDR as the measured macro-elevation source when the PDS frame is reachable. Because GTDR is ~4.64 km/pixel and cannot resolve the smaller ridge, fault, graben, lava-flow and tessera fabrics visible in Magellan SAR, ANTARA adds a deterministic **radar-informed regional morphology layer** at meso scale and a separate micro-detail material layer.

The meso layer is a visualization aid, not a claim that every rendered ridge is a directly measured elevation profile. Its role is to make the flyable scene communicate the same *kind* of geology shown in the authentic radar reference without replacing the measured macro topography.

## Alpha Regio

**Before**
- fallback geometry multiplied two simple sine-ridge fields;
- repeated rounded cells could read as dunes or bump spam;
- ridge density and direction stayed too uniform across the world;
- haze and uniform orange-brown shading reduced structural readability.

**Scientific reference**
- NASA/JPL PIA00147 and PIA00481;
- Alpha is a broad topographic upland with multiple intersecting trends of ridges, troughs and flat-floored fault valleys;
- local circular/oblong lows can be smoother lava-filled surfaces;
- published perspective products exaggerate relief substantially, so ANTARA does not copy their vertical scale literally.

**Fix**
- two independently warped ridge populations at different dominant directions;
- a third localized structural field and a separate fault/trough network;
- low-frequency masks vary ridge strength and spacing across the region;
- four irregular smooth-low masks suppress structural relief locally and visually read as smoother infill;
- fallback macro surface no longer uses a radial or cone-hill distribution;
- GTDR measured macro relief remains underneath this morphology layer when available;
- Alpha gets the highest near-camera geometry boost of the five locations;
- fog density and ambient wash are reduced while a lower directional light exposes ridge/trough relief.

## Maat Mons

**Before**
- fallback shield was narrow and close to a symmetric isolated cone;
- regional plains did not carry enough volcanic-flow structure.

**Scientific reference**
- NASA/JPL PIA00254 / PIA00106;
- Maat is a broad shield-volcano landform set in fractured volcanic plains;
- Magellan perspectives show lava flows extending hundreds of kilometers toward the edifice;
- NASA perspective products use large vertical exaggeration, which is not copied literally.

**Fix**
- fallback shield footprint widened substantially and made asymmetric;
- summit depression remains subtle rather than becoming a giant caldera;
- broad volcanic plains continue through the streaming world;
- radial/ribbon-like flow texture is strongest around the edifice and fades outward;
- long fractured-plain structures remain outside the central volcano;
- measured GTDR remains the macro shape whenever available.

## Maxwell Montes

**Before**
- generic intersecting procedural mountain bumps;
- insufficient distinction between an organized mountain belt and random alpine terrain.

**Scientific reference**
- NASA/JPL PIA00241;
- western Maxwell rises sharply above Lakshmi Planum;
- Maxwell contains parallel ridges about 2–7 km apart and is interpreted as compressional terrain;
- Lakshmi's adjacent plains are comparatively smooth and radar-dark.

**Fix**
- fallback becomes a one-sided transition from smoother highland/plain context into an elongated massif rather than an isolated mound;
- near-surface structural layer uses dominant parallel ridges with spacing centered inside the observed 2–7 km range plus broader belt-scale relief;
- cross-troughs are subordinate rather than equal-strength crosshatch;
- low-angle directional illumination increases ridge-shadow readability;
- near-camera geometry is selectively increased without raising far/horizon tessellation.

## Aphrodite Terra / Ovda context

**Before**
- broad highland existed, but two global ridge fields could read as a repeating diamond grid.

**Scientific reference**
- NASA/JPL PIA00146 (Ovda Regio, western Aphrodite Terra);
- highland rises above surrounding plains and contains several generations of structures;
- irregular broad domes/ridges and curvilinear valleys were flooded and later fractured;
- later extension formed long graben/fault valleys;
- the northern boundary includes a curvilinear mountain belt.

**Fix**
- structural generations now use separate low-frequency activation masks;
- ridge fields are more strongly warped and have different spacing/frequency behavior;
- long fault/trough structures are independently masked;
- several smoother lava-low zones locally suppress ridge texture;
- broad highland variation continues across every streamed chunk instead of ending at a central POI.

## Ishtar Terra / Lakshmi context

**Before**
- fallback was a round plateau with an obvious radial edge.

**Scientific reference**
- NASA/JPL PIA00240 and PIA00241;
- Lakshmi Planum is a high, relatively smooth volcanic plateau;
- its boundaries transition into intensely deformed terrain and mountain systems such as Maxwell Montes;
- the regional relationship is not a circular mesa.

**Fix**
- fallback plateau is now a broad directional highland transition instead of a circular island;
- interior relief is intentionally smoother;
- deformation increases toward the regional margin using two ridge populations plus long graben-like troughs;
- measured GTDR stays authoritative for large-scale elevation when available.

## Atmosphere, material and lighting

The previous default fog density was reduced and made location-specific. Venus remains dense and hazy, but nearby terrain receives more contrast. Hemisphere fill was reduced, while a stronger low-angle directional light reveals ridges, troughs and fractures. Location-specific vertex palettes now separate smooth lows, ridge belts, steep slopes, volcanic flows and deformed terrain instead of tinting the entire world one orange-brown value.

The global Magellan radar-derived texture continues to provide macro surface context. The shader keeps triplanar procedural detail for local roughness/bump response. Radar imagery remains labelled as radar/simulated-color material, not natural-color photography.

## Performance

The existing camera-centered chunk streamer is preserved:
- HIGH outer radius: 7 chunks;
- MOBILE outer radius: 5 chunks;
- near / mid / far / horizon LOD remains distance dependent;
- only Alpha, Maxwell and Aphrodite receive small near/mid geometry multipliers because their morphology benefits from extra local vertices;
- horizon geometry and frustum culling remain low-cost;
- no new permanent object field or rock-spam system was added.

## Reference sources

- NASA/JPL, Alpha Regio PIA00147 / PIA00481
- NASA/JPL, Maat Mons PIA00254 / PIA00106
- NASA/JPL, Lakshmi Planum and Maxwell Montes PIA00241
- NASA/JPL, Lakshmi Planum PIA00240
- NASA/JPL, Ovda Regio PIA00146
- USGS Astrogeology, Venus Magellan Global Topography 4641m v02
- NASA PDS Magellan GXDR / GTDR archive
- IAU/USGS Gazetteer of Planetary Nomenclature
