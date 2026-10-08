# Earth Full Exploration - ANTARA

## Tujuan

Mode ini menambahkan eksplorasi lokal berbasis terrain nyata tanpa mengubah renderer globe Bumi, transisi antarplanet, atau Mars Full Exploration. Globe tetap menjadi pemilih dunia; renderer terrain lokal hanya aktif setelah pengguna memilih region.

## Region awal

| Region | Koordinat pusat | Karakter | Zoom tile |
| --- | --- | --- | ---: |
| Everest / Himalaya | 27.9881° N, 86.9253° E | alpine / land | 11 |
| Challenger Deep / Mariana | 11.3500° N, 142.2000° E | underwater / abyss | 10 |
| Mauna Kea / Hawaiʻi | 19.8207° N, 155.4681° W | volcanic / coastal | 10 |
| Grand Canyon | 36.1069° N, 112.1129° W | canyon / land | 11 |
| Antarktika / Vostok | 78.4667° S, 106.8000° E | ice-surface / land | 8 |

## Terrain source

Geometry menggunakan RGB **Terrarium elevation tiles** dari public Amazon terrain tile endpoint yang didokumentasikan Mapzen. Decode elevasi mengikuti formula Terrarium:

`elevation_m = red * 256 + green + blue / 256 - 32768`

Mosaik sumber Terrarium menggabungkan dataset terbuka menurut cakupan, termasuk USGS 3DEP di Amerika Serikat, SRTM pada banyak wilayah global, GMTED pada skala lebih jauh, dan NOAA ETOPO1 untuk bathymetry. Karena mosaik bersifat komposit, HUD menyebut provenance aktual sebagai Terrarium/open elevation composite, bukan mengklaim seluruh region berasal dari satu lembaga.

## Integritas geografi

- Nilai height tile membentuk geometry. Tidak ada random-noise terrain sebagai fallback geografi.
- Jika tile real gagal dimuat, mode berhenti dengan pesan error.
- Material detail procedural hanya dipakai sebagai micro-surface/PBR visual agar terrain dekat kamera tidak terlihat seperti heightmap polos; material ini tidak mengubah topografi skala besar.
- Nilai negatif dipertahankan. Challenger Deep tetap berada di bawah referensi sea level.
- Water plane dirender terpisah dari terrain.
- Antarktika dipresentasikan sebagai **surface elevation/ice surface** dari mosaik elevasi yang tersedia, bukan sebagai topografi bedrock subglasial.

## Pipeline runtime

1. Dari panorama Bumi, user memilih `Eksplorasi Pengalaman Penuh` sebagai CTA terpisah tepat di bawah `Jelajahi Bumi`, mengikuti hierarchy panorama Mars.
2. ANTARA membuka **destination selector terlebih dahulu**. Tidak ada lagi auto-entry ke Everest/default region.
3. User memilih Everest, Mariana, Mauna Kea, Grand Canyon, atau Antarktika.
4. Globe menghadap koordinat region menggunakan pose system Earth yang sudah ada dan memulai descent cinematic.
5. Renderer lokal disiapkan tanpa memuat semua region sekaligus.
6. 3×3 core tile real dimuat lebih dulu.
7. Setelah core siap, terrain lokal mengambil alih visual dan kontrol aktif.
8. Ring luar dimuat lazy untuk safety buffer. `Ganti Wilayah` mengembalikan user ke selector yang sama.
9. Saat user kembali ke selector/keluar, terrain, texture, provider cache, dan renderer lokal dibersihkan.

## Rendering visual per destinasi

- Geometry makro tetap berasal dari DEM/bathymetry nyata. Material tidak mengubah bentuk geografi.
- Everest memakai snow/rock blending berbasis elevasi + slope agar ridge tinggi terbaca sebagai Himalaya, bukan gunung cokelat generik.
- Mariana memakai depth-aware seabed color, water material terpisah, underwater fog berdasarkan kedalaman, dan suspended particles yang halus.
- Mauna Kea membedakan bathymetry, shoreline, lower volcanic slopes, basalt, dan summit terrain.
- Grand Canyon memakai stratifikasi warna berbasis elevasi, slope darkening, dan rocky micro-detail.
- Antarktika memakai variasi ice-blue/white, slope shading, dan cold-haze, bukan putih polos.
- Micro-detail diproyeksikan world-space/triplanar agar detail tidak meregang pada slope curam.
- Water memakai animated bump/detail sehingga surface tidak terlihat seperti plane biru statis.

## Rendering dan performa

- Tile terrain adalah chunk independen.
- Geometry LOD berubah berdasarkan jarak/quality tier.
- `frustumCulled` dan visibility guard menghindari kerja maksimum pada chunk di luar view.
- Material memakai `THREE.FrontSide`.
- HIGH/MEDIUM/LOW menyesuaikan segment density dan pixel ratio sesuai perangkat.
- Outer tiles lazy-loaded, sehingga startup utama ANTARA tidak mengunduh terrain Bumi.
- Collision/minimum clearance mengambil tinggi dari data terrain yang sama.

## Kontrol

Desktop mempertahankan filosofi Mars: WASD bergerak, mouse-look, Q/E turun/naik, Shift boost, **ESC untuk keluar**, fullscreen, region selector, dan exit. Mobile memakai drag-look dan kontrol layar.

## Batasan

Terrain real membutuhkan koneksi jaringan ketika region pertama kali dibuka karena DEM/bathymetry tidak dibundel ke ZIP. Endpoint tile bisa memiliki keterbatasan jaringan/CORS/availability di environment tertentu. ANTARA sengaja tidak menyamarkan kegagalan tersebut dengan terrain fiktif.
