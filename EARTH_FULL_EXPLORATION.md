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
2. CTA tersebut langsung memulai Full Exploration pada region aktif/default tanpa harus membuka mode informasi Bumi terlebih dahulu.
3. Globe menghadap koordinat region menggunakan pose system Earth yang sudah ada.
4. Renderer lokal disiapkan tanpa memuat semua region sekaligus.
5. 3×3 core tile real dimuat lebih dulu.
6. Setelah core siap, terrain lokal mengambil alih visual dan kontrol aktif.
7. Ring luar dimuat lazy untuk safety buffer. Region selector tetap tersedia melalui `Ganti Wilayah` setelah Full Exploration aktif.
8. Saat user kembali ke selector/keluar, terrain, texture, provider cache, dan renderer lokal dibersihkan.

## Rendering dan performa

- Tile terrain adalah chunk independen.
- Geometry LOD berubah berdasarkan jarak/quality tier.
- `frustumCulled` dan visibility guard menghindari kerja maksimum pada chunk di luar view.
- Material memakai `THREE.FrontSide`.
- HIGH/MEDIUM/LOW menyesuaikan segment density dan pixel ratio sesuai perangkat.
- Outer tiles lazy-loaded, sehingga startup utama ANTARA tidak mengunduh terrain Bumi.
- Collision/minimum clearance mengambil tinggi dari data terrain yang sama.

## Kontrol

Desktop mempertahankan filosofi Mars: WASD bergerak, mouse-look, Q/E turun/naik, Shift boost, fullscreen, region selector, dan exit. Mobile memakai drag-look dan kontrol layar.

## Batasan

Terrain real membutuhkan koneksi jaringan ketika region pertama kali dibuka karena DEM/bathymetry tidak dibundel ke ZIP. Endpoint tile bisa memiliki keterbatasan jaringan/CORS/availability di environment tertentu. ANTARA sengaja tidak menyamarkan kegagalan tersebut dengan terrain fiktif.
