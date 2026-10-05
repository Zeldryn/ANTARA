# Antariksa

An Indonesian Solar System journey using HTML, CSS, vanilla JavaScript, and local
Three.js assets. Launch from Earth, explore Earth facts and seven modern wonders,
then continue to the existing Mars journey. No backend or build step is needed.

Run locally from this folder:

```sh
python -m http.server 8000
```

Open http://localhost:8000. XAMPP also works when the complete folder is copied
into htdocs. Keep all assets and scripts together. A local HTTP server enables
ES modules, WebGL and audio reliably. Direct file opening may fall back to CSS; precise geographic rotation requires HTTP.

Press **Siap Meluncur?**, then **Jelajahi Bumi**. The first Earth view shows only
**Bumi. / Si Planet Biru.** Exploration contains four science topics followed by
seven modern wonders. Use the arrows or progress bars to select a topic. Selecting
a wonder rotates the existing globe to its latitude and longitude. The gold dot
appears once the globe settles. **Kembali ke panorama Bumi** returns to the intro,
and **Mars** continues the existing camera journey. Venus remains unavailable.
Arrow keys change Earth topics during exploration; Escape exits Earth exploration.
Outside that mode, the existing Escape shortcut returns to the opening.
See `IMPLEMENTATION.md` for coordinates, implementation details and test results.

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


## Foto eksplorasi
Seven Wonders dan keenam topik Mars sekarang memakai gambar lokal WebP. Kredit/lisensi muncul pada kartu; metadata tersedia dalam `assets/exploration/sources.json`. Laporan perubahan dan hasil pengecekan: `IMPLEMENTATION.md`. Jalankan situs melalui server lokal seperti petunjuk di atas.
