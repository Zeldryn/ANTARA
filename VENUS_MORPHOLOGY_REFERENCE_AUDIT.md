# ANTARA Venus Destination Morphology Audit

This rework keeps the existing Venus renderer, material, lighting, atmosphere, LOD, streaming, distant-terrain continuation, educational system, and expanded boundary. The change is intentionally limited to destination-scale morphology, spawn composition, and reference transparency.

Scientific topography remains the base elevation source. The region-specific morphology layer is a visualization aid that reinforces large/medium-scale geological signatures when the runtime source is too coarse to show them clearly. It is never presented as measured Magellan elevation. When the local high-resolution GTDR crop is present, the reinforcement weight is reduced substantially.

## 1. Maat Mons

Reference currently shown in ANTARA: NASA/JPL PIA00254, “Venus - 3-D Perspective View of Maat Mons”.

Reference checklist:

1. Dominant macro landform: one enormous broad shield volcano.
2. Secondary landforms: long cooled lava-flow units and fractured volcanic plains.
3. Skyline: broad low-angle edifice, not a sharp cone or mountain chain.
4. Main structural direction: flows extend away from the edifice across the plains.
5. Flat vs rugged proportion: large low-relief foreground, dominant volcanic edifice in middle/far distance.
6. Unique landmark: Maat Mons summit/vent region.
7. Foreground: fractured plains crossed by long lava-flow morphology.
8. Middle distance: gradual lower flanks and overlapping flow surfaces.
9. Horizon: the broad shield body dominates.

Implementation:

- Dedicated `maatMorphologyAt()` with a non-Gaussian shield profile.
- Broad summit zone, long low-angle flanks, irregular shallow summit depression/rim.
- Three long cooled flow corridors with subtle levee-like margins.
- Low-amplitude fractured plain relief outside the edifice.
- Spawn moved onto lower plains north of the volcano and camera looks toward the edifice.
- PIA00254 vertical exaggeration (22.5x) is disclosed in the location card and is not copied literally.

## 2. Maxwell Montes

Reference currently shown in ANTARA: NASA/JPL PIA00149, “Venus - Maxwell Montes and Cleopatra Crater”.

Reference checklist:

1. Dominant macro landform: compressed mountain belt/massif.
2. Secondary landforms: broad connected ridges, deep valleys, Cleopatra impact basin.
3. Skyline: long interconnected ridges, not one central volcano.
4. Main structural direction: long compressional ridge/valley trends.
5. Flat vs rugged proportion: overwhelmingly rugged mountain terrain.
6. Unique landmark: Cleopatra double-ring impact basin.
7. Foreground: valley/ridge terrain inside the mountain system.
8. Middle distance: merging/splitting folds and strong western relief.
9. Horizon: continuous mountain belt with asymmetrical flanks.

Implementation:

- Dedicated `maxwellMorphologyAt()`.
- Six long warped fold/ridge bands on a regional uplift envelope.
- Western escarpment is steeper; eastern shoulder descends more gradually toward Fortuna logic.
- Cleopatra is represented as a large double-ring basin close to the documented ~100 km diameter scale, with a channel relationship.
- Spawn moved into/near the ridge-valley system rather than facing a generic hill.

## 3. Aphrodite Terra / Ovda Regio

Reference currently shown in ANTARA: NASA/JPL PIA00218, “Venus - Interior of Ovda Regio”.

Reference checklist:

1. Dominant macro landform: broad deformed tectonic highland.
2. Secondary landforms: irregular domes/blocks, ridge-valley fabric, extension fractures, large troughs.
3. Skyline: complex highland rather than a single mountain chain.
4. Main structural direction: underlying NE-SW ridge/valley fabric.
5. Flat vs rugged proportion: rugged upland with selected smoother lows.
6. Unique landmark: cross-cutting deformation fabric and large lava-filled valleys.
7. Foreground: intersecting structures visible immediately.
8. Middle distance: curved ridge/valley networks broken by later fractures.
9. Horizon: broad elevated province with no single dominant summit.

Implementation:

- Dedicated `aphroditeMorphologyAt()`.
- Broad highland plus irregular tectonic domes.
- Warped NE-SW ridge/valley fabric at roughly the documented 10-20 km structural spacing.
- Later cross-cutting fracture family and flat-floored fault-controlled troughs.
- Major trough width is intentionally on the order of the ~20 km valley described by NASA.
- Selected lows are smoothed/lowered to read as volcanic infill against deformed upland.
- Spawn/camera changed to reveal overlapping structures immediately.

## 4. Ishtar Terra / Lakshmi Planum

Reference currently shown in ANTARA: NASA/JPL/USGS PIA00093, “Perspective View of Ishtar Terra”, derived from Pioneer Venus radar altimetry.

Reference checklist:

1. Dominant macro landform: large elevated plateau/plain.
2. Secondary landforms: Akna/Freyja/Maxwell-type mountainous margins appropriate to the reference framing.
3. Skyline: broad plateau broken by dramatic margin ranges.
4. Main structural direction: plateau interior versus directional mountain boundaries.
5. Flat vs rugged proportion: substantial smooth/high interior contrasted with rugged edges.
6. Unique landmark: Lakshmi Planum plateau-to-mountain relationship.
7. Foreground: relatively broad plateau surface.
8. Middle distance: approach to steep deformed boundary terrain.
9. Horizon: one or more major mountain margins, not mountains everywhere.

Implementation:

- Dedicated `ishtarMorphologyAt()`.
- Superellipse-like elevated plateau interior with subdued undulation.
- Distinct elongated mountain systems occupy selected margins only.
- Maxwell-side relief is strongest, with west/northwest margin systems and a more open interior.
- Spawn placed on/near the plateau and camera composed toward the mountain boundary.
- The reference’s color-coded altimetry is explicitly treated as data visualization rather than natural surface color.

## 5. Alpha Regio

Reference currently shown in ANTARA: NASA/JPL PIA00481, “Venus - Three-Dimensional Perspective View of Alpha Region”.

Reference checklist:

1. Dominant macro landform: tessera upland.
2. Secondary landforms: intersecting ridges, troughs, flat-floored fault valleys, polygonal blocks, local volcanic lows.
3. Skyline: no single giant landmark; structural texture itself is the identity.
4. Main structural direction: at least two major intersecting deformation families.
5. Flat vs rugged proportion: mostly deformed tessera interrupted by smoother local lows.
6. Unique landmark: cross-hatched/polygonal structural fabric; Eve lies south of the complex terrain in the reference.
7. Foreground: intersecting lineations visible immediately.
8. Middle distance: broken/offset tessera blocks and fault valleys.
9. Horizon: persistent complex deformation rather than one peak or ridge belt.

Implementation:

- Dedicated `alphaMorphologyAt()`.
- Two independently warped, differently spaced structural families with non-orthogonal trends.
- Low-frequency masks break/offset the families so the result is not a perfect grid.
- Broad fault valleys cut through the fabric.
- Local resurfaced lows interrupt the tessera, plus a subdued broad Eve-related low south of the main ridged terrain.
- Crossing waves are blended rather than summed into needle-like peaks.
- Spawn placed inside the tessera field with the initial camera aimed across intersecting structures.
- PIA00481’s ~23x vertical exaggeration is disclosed and not copied literally.

## Preservation and runtime rules

- `scientificHeightAt()` remains the measured-data baseline.
- `heightAt()` combines measured topography, reference-guided morphology, and only then sub-resolution microdetail.
- High-resolution regional GTDR: morphology reinforcement weight 0.26.
- Coarse scientific 1-degree fallback: morphology reinforcement weight 0.60.
- Clearly labelled emergency non-scientific preview: morphology reinforcement weight 1.00.
- Radar remains a material/surface-context source and is never converted directly into elevation.
- Existing HIGH/MEDIUM/LOW profiles, near/mid/far terrain, distant world continuation, collision, ground sampling, education, objectives, discoveries, Indonesian UI, and expanded boundaries are preserved.

## Internal morphology validation

The implementation was sampled with the same neutral gray presentation and no material/color differentiation. The five height fields produced visibly different large-scale compositions:

- Maat: single broad shield and low plains.
- Maxwell: directional connected ridge belt with a large basin.
- Aphrodite/Ovda: broad highland with cross-cut structures and troughs.
- Ishtar/Lakshmi: broad plateau bounded by selected mountain systems.
- Alpha: broken cross-hatched tessera fabric with fault valleys and local lows.

Full browser/WebGL traversal could not be automated in the build environment because Chromium access to local HTTP was blocked by administrator policy. Static source validation, Node syntax checks, and direct sampling of the actual runtime morphology methods were used instead.
