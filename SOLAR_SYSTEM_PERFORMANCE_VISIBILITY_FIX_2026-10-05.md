# Solar System Observer Performance / Visibility Fix · 2026-10-05

## Bugs fixed
- Planet meshes were technically present but visually too small relative to compressed orbit scale.
- Solar System mode loaded multiple 4K/2K textures at once and could spike GPU/RAM usage.
- Asteroid belt used many independent meshes/draw calls.
- Renderer DPR and frame rate had no dedicated cap for this overview mode.

## Changes
- Planet visual radius is now intentionally exaggerated while orbit distance remains separately compressed.
- Earth, Mars, Jupiter, Saturn, Uranus and Neptune use existing local 1024x512 WebP textures.
- Sun, Mercury and Venus use lightweight deterministic procedural CanvasTextures.
- Planet sphere geometry reduced to 32x24 segments, Sun 40x28.
- Asteroid belt converted to InstancedMesh, 70 instances mobile / 110 desktop.
- Stars reduced to 700 mobile / 1100 desktop.
- Solar renderer DPR capped and configured as a low-overhead WebGL context.
- Render loop capped to 30 FPS mobile / 45 FPS desktop while orbital time continues to advance from real elapsed time.
- Direct click/label jump to panorama remains intact.

## Static verification
- solar-system-explorer.js syntax: PASS
- script.js syntax: PASS
- no 4K/2K references in Solar System renderer: PASS
- all local lightweight textures exist: PASS
- duplicate HTML IDs: 0
- CSS brace parse: PASS
- approximate decoded texture memory for this mode: ~13.5 MB
