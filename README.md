# Antariksa

A cinematic Indonesian Solar System opening and Mars approach. HTML, CSS,
vanilla JavaScript, and a locally vendored Three.js renderer for scene two.
No backend, login, lessons, or planet exploration controls.

Run locally from this folder:

```sh
python -m http.server 8000
```

Open http://localhost:8000. Use a local HTTP server so browsers can fetch audio.
Press **Siap Meluncur?** for the 8.3-second launch cinematic: a separate Nusantara
rocket rises from below, ignites, and accelerates vertically out of the scene.
The scene then dissolves into deep space, where a distant Mars approaches over
12 seconds and continues rotating. **Kembali ke bumi** resets it for replay;
**Escape** returns to the opening during flight or the Mars scene.
The speaker button sets or changes mute, including before the first mission.

The scene supports keyboard navigation, a remembered mute preference, reduced
motion, small screens, tab suspension, and silent operation when audio fails.

## Assets

- `assets/mission-key-art.png` and `assets/mission-key-art-portrait.png`: the
  existing illustrated opening scene, with separate desktop/mobile compositions.
- `assets/nusantara-rocket.svg`: original scalable flight vehicle, with metallic
  panels, auxiliary boosters, gold details, and a prominent Indonesian flag.
- `assets/audio/`: original synthesized score and effects, plus replacement
  instructions. Regenerate with `python tools/generate_audio.py` (NumPy needed
  only for asset generation, not for running the site).
- `assets/orbit.svg`: project-native orbit mark.
- `assets/textures/mars-surface-2k.jpg`: Solar System Scope Mars map, CC BY 4.0;
  attribution and license links are in `assets/textures/README.md` and the scene.
- `assets/vendor/three/`: Three.js 0.180.0, unmodified local ES modules, MIT license.

Edit launch timing in `script.js`, appearance in `styles.css`, and copy in
`index.html`. Audio is always optional; it is never required for progression.

`LAUNCH_TIMING` in `script.js` is the shared schedule for the rocket, particles,
status text, and audio. The flight canvas runs only during the launch; it uses a
capped pixel density. Reduced motion replaces flight/vibration with gentle
stationary fades. The speaker remains accessible throughout the sequence.

## Mars scene

`mars-scene.js` owns scene two, `mars-scene.css` its presentation. The initial page
and launch styles are preserved. Three.js is dynamically imported on launch;
the Mars renderer runs only while scene two is visible. The scene uses a real
96 × 64 sphere, a perspective camera that moves closer, a textured rough
material, shallow artistic bump shading, warm directional light, a shadowed
terminator, and subtle limb scattering. Rotation is intentionally cinematic,
not real-time astronomical speed. Pointer parallax and gentle drift are bounded.

WebGL2 is preferred. If unsupported, module loading fails, or the GPU context is
lost, a software sphere renderer maps the same texture using spherical UVs and
sunlight shading. A procedural surface handles a failed texture load. There is
also a minimal CSS fallback for devices unable to allocate any canvas. Reduced
motion uses a stationary, softly revealed planet. Hidden tabs pause scene time,
audio, and rendering; returning or replaying does not accumulate animation loops.

All dependencies are local; serve over HTTP for ES modules and audio. No runtime
CDN requests or API keys are required.

Browser verification (Python standard library, installed Chromium browser):

```sh
python tools/verify_browser.py --browser "path/to/chromium-browser"
```
