# ANTARA Venus Destination Morphology Audit

This audit describes the current runtime implementation after the reference-fidelity rework. The existing scientific topography provider, radar material system, triplanar surface material, atmospheric rendering, chunk LOD, educational system, and expanded exploration boundaries remain in use.

The five destinations now have separate high-level morphology systems. Real topography remains the baseline. A destination-specific reference-guided meso layer reinforces large geological signatures that are difficult to read from coarse planetary datasets at first-person scale. The layer is explicitly a visualization aid, not a claim that every generated ridge or lava margin was measured by Magellan altimetry.

## 1. Maat Mons

Primary reference: NASA/JPL PIA00254, Venus 3-D Perspective View of Maat Mons.

Reference grammar:

1. One enormous broad shield volcano.
2. Long volcanic slopes rather than a steep cone.
3. Low fractured volcanic plains in the foreground.
4. Long cooled lava-flow morphology crossing the plains.
5. A recognizable summit region rather than a single pointed vertex.

Current implementation:

- `maatMorphologyAt()` builds one broad shield with a roughly 300 km regional footprint in the visualization coordinate system.
- The lower body uses a smooth zero-slope toe so the edifice grows out of the plain instead of ending in a circular cliff.
- The summit contains an irregular rim, shallow depression, and overlapping upper surfaces.
- Multiple long flow corridors and subtle levee-like margins cross the lower plains.
- Spawn is on the low northern volcanic plain at `x=-24, z=82`, aimed toward the summit area near `x=0, z=-46`.
- Maat fog density is reduced to `0.0064` so the shield silhouette survives at the intended first-view distance while still retaining dense Venus haze.
- The 22.5x vertical exaggeration used by PIA00254 is not reproduced.

## 2. Maxwell Montes

Primary reference: NASA/JPL PIA00149, Maxwell Montes and Cleopatra Crater.

Reference grammar:

1. Long connected mountain system.
2. Repeated broad ridges and deep valleys.
3. Directional compressional structure.
4. Strong west-east relief asymmetry.
5. Cleopatra as a major impact structure when included in the frame.

Current implementation:

- `maxwellMorphologyAt()` creates six long warped compressional ridge bands on a regional uplift.
- Valleys remain continuous between the ridges rather than becoming isolated noise pits.
- The western side receives stronger escarpment relief and the eastern side transitions more gradually.
- Cleopatra is represented at roughly 100 km-class visual diameter using a double-ring basin and surrounding rough terrain.
- Spawn sits inside the ridge-valley system rather than outside a generic mountain blob.

## 3. Aphrodite Terra / Ovda Regio

Primary reference: NASA/JPL PIA00218, Interior of Ovda Regio.

Reference grammar:

1. Broad tectonic highland.
2. Older NE-SW ridge and valley fabric.
3. Younger cross-cutting fracture family.
4. Large fault-controlled troughs and graben.
5. Smoother selected lows interpreted as possible volcanic infill.

Current implementation:

- `aphroditeMorphologyAt()` starts with a broad highland and irregular dome-scale blocks.
- Six curved and discontinuous older ridge bands replace the previous globally repeating stripe field.
- Four younger broken fracture corridors cut across the older fabric at a different structural orientation.
- Two large trough systems dominate selected parts of the province.
- Small broken lineations fill the spaces between major structures without turning the region into random mountains.
- Selected lows are reduced and smoothed to strengthen the contrast between deformed upland and possible lava-filled terrain.

## 4. Ishtar Terra / Lakshmi Planum

Primary reference: NASA/JPL/USGS PIA00093, Perspective View of Ishtar Terra.

Reference grammar:

1. Large elevated plateau or plain.
2. Comparatively smooth, open interior.
3. Major deformed mountain terrain on selected margins.
4. Strong plateau-versus-mountain contrast.
5. No requirement for mountains to cover the entire destination.

Current implementation:

- `ishtarMorphologyAt()` uses a rounded, warped plateau footprint rather than a square or rectangular superellipse arena.
- Lakshmi Planum receives a high, broad interior with very low undulation.
- Akna-like, Freyja-like, and Maxwell-side relief are confined to selected margins.
- The eastern exterior drops toward lower complex terrain instead of being enclosed by an equal mountain ring.
- Spawn is inside the plateau and the initial view points toward the eastern mountain margin so the large-scale contrast is immediately readable.

## 5. Alpha Regio

Primary reference: NASA/JPL PIA00481, Three-Dimensional Perspective View of Alpha Region.

Reference grammar:

1. Tessera terrain rather than ordinary hills.
2. At least two intersecting structural families.
3. Troughs and flat-floored fault valleys.
4. Broken polygonal blocks and complex lineation.
5. Local smoother lows interrupting the tessera fabric.

Current implementation:

- `alphaMorphologyAt()` contains two independently warped structural families with different spacing and direction.
- Ridge intersections are blended rather than summed, preventing forests of spike-like peaks.
- Broad fault valleys cut through the tessera fabric.
- Local resurfaced lows break up the deformed upland.
- A subdued southern Eve-related low is retained as regional context.
- Spawn sits within the tessera field and looks across intersecting structures.

## Scientific-data and visualization weights

`heightAt()` uses this order:

1. scientific topography,
2. reference-guided regional morphology,
3. sub-resolution microdetail.

Current reference-guided morphology weights when a local regional GTDR crop is available:

- Maat Mons: `0.52`
- Maxwell Montes: `0.40`
- Aphrodite / Ovda: `0.36`
- Ishtar / Lakshmi: `0.38`
- Alpha Regio: `0.46`

When only the coarse scientific 1-degree fallback is available, the weights rise to `0.78`, `0.70`, `0.68`, `0.68`, and `0.74` respectively because the coarse grid cannot carry enough meso-scale identity at first-person scale.

The clearly labelled emergency non-scientific preview uses weight `1.0`. Radar brightness is never converted directly into elevation.

## Neutral-geometry validation

`tools/verify_venus_morphology.mjs` samples the actual runtime morphology functions with material differences removed. The current validation checks:

- Maat broad shield, low spawn plain, and summit depression/rim.
- Maxwell west-east asymmetry and large Cleopatra basin/rim relation.
- Aphrodite highland versus major troughs.
- Ishtar elevated plateau versus selected mountain margin.
- Alpha tessera lows and fault-valley interruptions.
- Cross-region height-field correlation to reject a five-map reskin.

Current highest pair correlation in the neutral height-field audit is below the failure threshold of `0.90`.

Browser/WebGL visual traversal was attempted. The build environment could start Chromium only after disabling its sandbox, but the local test origin was then denied browser storage/access and the full local page could not be exercised reliably. Playwright is also not installed. Therefore the shipped validation does not claim a successful automated browser walkthrough. JavaScript syntax validation and direct execution of the actual morphology methods are used instead.
