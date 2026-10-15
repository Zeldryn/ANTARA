# ANTARA Jupiter Full Exploration - Atmospheric POV Rebuild

## Goal
Venus remains the interaction baseline, but Jupiter is not treated as a rocky world. The rebuilt Full Exploration uses a bounded free-flight volume inside a procedural Jovian atmosphere. There is no fake ground or landing surface.

## Science grounding used
- Jupiter has no true solid surface accessible to a spacecraft.
- Its visible bands are ammonia/water cloud systems in a hydrogen-helium atmosphere.
- Likely cloud layers include ammonia ice, ammonium hydrosulfide, and deeper water cloud/vapor layers.
- Strong east-west jet streams create belts and zones.
- Great Red Spot is a long-lived anticyclonic storm.
- Juno observations reveal deep atmospheric structure and lightning, including shallow lightning.
- Hot spots are breaks in the cloud deck that reveal deeper, warmer atmospheric layers.

Primary references are NASA Science / JPL pages linked from each in-app destination card.

## Five atmospheric destinations
1. Great Red Spot
2. Belt / Zone Jet Boundary
3. Ammonia Cloud Tower
4. Deep Water-Cloud Lightning Storm
5. Atmospheric Hot Spot

## Venus parity checklist
- Pre-entry graphics quality selector: YES
- Five destination selector: YES
- Independent 3D renderer: YES
- Free WASD movement: YES
- Vertical Q/E movement: YES
- Mouse/touch look: YES
- Mobile directional + altitude controls: YES
- Soft bounded play space: YES
- World-continuation gimmick: YES, cylindrical haze + extended clouds/bands
- Dynamic HUD: YES
- Location card + real/science reference: YES
- Objectives panel: YES
- Discovery progress: YES
- Discovery persistence: YES, localStorage
- Proximity-gated observation: YES
- Educational observation card: YES
- Fullscreen action: YES
- Destination switching without leaving Full Exploration: YES
- Continuous animated exit: YES
- Return to standard Jupiter panorama: YES

## Bug-hunt fixes made during rebuild
- Removed the old orbital-only Full Exploration behavior.
- Removed rings and Galilean moons from the Full Exploration destination map because they do not belong inside the requested atmospheric POV map.
- Fixed control loop stopping after observation UI closes.
- Fixed destination-specific lights leaking between destination rebuilds.
- Added boost key handling to the key-state system.
- Corrected Great Red Spot vortex orientation for the forward POV camera.
- Added resource cleanup for procedural cloud textures.
- Verified every `getElementById()` used by Jupiter Full Exploration exists in `index.html`.
- Verified required local Jupiter media and Three.js module files exist.
- Ran `node --check` successfully on the rebuilt controller and atmospheric renderer module.

## Testing limitation
A Chromium runtime test was attempted in the execution environment, but local/file navigation was blocked by the environment administrator policy. Static JavaScript syntax, DOM-ID references, local asset references, and module paths were verified instead. A final browser QA pass on the target host is still recommended, especially WebGL/mobile GPU performance.
