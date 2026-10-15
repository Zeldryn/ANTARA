# NEPTUNE FULL EXPLORATION REBUILD · 2026-10-05

## Tujuan
Membangun ulang Full Exploration Neptunus menjadi pengalaman POV 3D free-flight dengan Venus sebagai template UI/UX dan Jupiter sebagai benchmark fungsi/controller.

## Grounding lingkungan NASA
Referensi utama menggunakan NASA Science / JPL / Voyager 2:
- https://science.nasa.gov/neptune/neptune-facts/
- https://science.nasa.gov/mission/voyager/fact-sheet/
- https://science.nasa.gov/photojournal/neptunes-clouds/
- https://science.nasa.gov/photojournal/neptune-clouds-on-the-dark-spot/
- https://science.nasa.gov/resource/neptunes-rings/
- https://science.nasa.gov/resource/neptune-ring-arcs/
- https://science.nasa.gov/neptune/moons/facts/
- https://science.nasa.gov/asset/webb/triton-voyager-2/

Prinsip visual:
- Neptunus tidak memiliki permukaan padat untuk didarati.
- Atmosfer didominasi H2/He dengan metana dan angin lebih dari sekitar 2.000 km/jam.
- Warna tidak sengaja dibuat biru neon berlebihan; NASA menjelaskan citra Voyager populer pernah diproses untuk memperjelas fitur.
- Great Dark Spot diperlakukan sebagai vortex atmosfer, bukan noda permukaan permanen.
- Awan putih tinggi direpresentasikan sebagai awan es metana yang cepat berubah.
- Sistem cincin dibuat redup/berdebu dengan Adams Ring dan ring arcs.
- Triton dibuat sebagai koridor flyby dingin dengan plume/geyser nitrogen.

## Lima wilayah playable
1. Super Winds Neptunus
2. Great Dark Spot
3. Awan Metana Tinggi
4. Cincin Gelap & Ring Arcs
5. Koridor Triton & Voyager 2

Masing-masing wilayah memiliki 3 observation point, total 15 discovery point unik.

## Parity Venus/Jupiter
- Quality selector
- Region selector
- Renderer POV mandiri
- WASD free movement
- Q/E vertical movement
- Shift boost
- 1× click pointer lock desktop
- Mobile drag + D-pad
- HUD
- Tujuan eksplorasi bernomor
- Info Lokasi
- Proximity AMATI / observation card
- Discovery persistence localStorage
- Soft boundary gimmick
- Menu
- Fullscreen
- Exit transition
- Loading state
- Error fallback
- Tutorial desktop/mobile
- Hide global masthead/footer saat Full Exploration
- Mobile panel exclusivity

## Bug hunt yang ditemukan dan diperbaiki
- Full Exploration lama masih orbital-only.
- Markup lama tidak memiliki viewport renderer mandiri, boundary hint, dan error state setara Jupiter.
- Copy-state Uranus sempat menyisakan region ID `magnetosphere`, `miranda`, dan `rings` pada HUD/boundary. Diganti ke ID Neptunus yang benar.
- Space regions rings/Triton dipisahkan dari cloud-field atmosfer sehingga tidak memiliki awan palsu.
- Discovery storage menggunakan `this.current` sehingga progress wilayah tersimpan pada key yang benar.
- Selector/data attributes diselaraskan ke `data-neptune-*`.
- Selector CSS lama dari Uranus dibersihkan.
- Lighting renderer diubah dari warm giant lighting ke cool blue-white Neptunus.
- Cache version CSS/JS dinaikkan agar browser tidak memakai Full Exploration lama.

## Verifikasi
- 5 region, 15 unique observation points.
- DOM references complete.
- Local science diagram assets complete.
- Neptune controller method parity dengan Jupiter: 48/48 method names.
- Feature parity verifier: 22/22 PASS.
- Duplicate HTML ID: 0.
- CSS parse error: 0.
- JS syntax: PASS.
- Automated Chromium WebGL runtime tidak dapat divalidasi di environment ini karena GPU/ANGLE headless gagal inisialisasi; tidak diklaim sebagai runtime browser PASS.
