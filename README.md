# ANTARA | Antariksa Nusantara

ANTARA adalah pengalaman edukasi Tata Surya berbasis HTML, CSS, vanilla JavaScript, dan aset Three.js lokal. Pengguna memulai perjalanan dari kokpit first-person bersama dua companion animasi, lalu tiba di Bumi sebelum melanjutkan eksplorasi Venus dan Mars.

## Menjalankan proyek

```sh
python -m http.server 8000
```

Buka `http://localhost:8000`. XAMPP juga dapat dipakai dengan menyalin seluruh folder ini ke `htdocs`. Gunakan server HTTP agar ES modules, WebGL, audio, dan aset lokal bekerja konsisten.

## Opening ANTARA

- Brand utama: **ANTARA**
- Nama lengkap: **Antariksa Nusantara**
- CTA: **Yuk, Berangkat!**
- POV peluncuran: first-person dari dalam kokpit
- Companion: Nara dan Aksa
- Teknik karakter: layered inline SVG, bukan PNG karakter statis
- Animasi karakter: breathing, head idle, hair motion, blink acak, mouth frames saat berbicara, launch reaction, turbulence, dan look/point toward Earth
- Dialog: data-driven dan disinkronkan ke fase peluncuran
- Environment: horizon, cloud layers berparalaks, perubahan atmosfer ke ruang angkasa, cockpit shake berlapis, dan Earth reveal
- Handoff: renderer Bumi mulai di belakang kokpit saat fase approach, kemudian kokpit/karakter perlahan menghilang sehingga tidak terjadi hard cut

Tidak ada video background atau poster karakter statis yang dipakai untuk menyamarkan animasi. Aset hero statis lama sudah tidak digunakan dalam build ini.

## Planet exploration

Sistem eksplorasi planet tetap memakai renderer, marker, image preview, lightbox, internal scrolling, audio, dan navigasi yang sudah ada. Bumi kini memiliki **14 slide informasi** yang memisahkan konsep global dari lokasi nyata, serta mode **Eksplorasi Pengalaman Penuh** untuk lima wilayah terkurasi: Everest/Himalaya, Challenger Deep/Mariana, Mauna Kea, Grand Canyon, dan Antarktika.

Earth Full Exploration sekarang selalu membuka **pemilih 5 destinasi terlebih dahulu** sebelum terrain dimuat. Tile elevasi Terrarium baru diminta setelah destinasi dipilih. Nilai elevasi tile membentuk geometry Three.js; material detail per-region memperkaya keterbacaan tanpa mengganti bentuk geografinya. Everest memakai snow/rock blending, Mariana memakai water + depth atmosphere, Mauna Kea memakai volcanic/coastal blending, Grand Canyon memakai canyon strata, dan Antarktika memakai ice-surface material. Terrain tetap dipecah menjadi chunk dengan LOD dan frustum culling. Mariana mempertahankan elevasi negatif sebagai bathymetry.

Mode terrain nyata memerlukan koneksi internet untuk mengambil tile DEM/bathymetry. Jika sumber real gagal dimuat, ANTARA menampilkan error dan tidak menggantinya dengan terrain prosedural fiktif. Detail sumber dan keterbatasan ada di `EARTH_FULL_EXPLORATION.md`. Fix kualitas Mars dan optimasi view-dependent Mars dari revisi sebelumnya tetap dipertahankan tanpa perubahan.

## Audio

Audio lokal tetap opsional. Tombol speaker menyimpan preferensi mute dan perjalanan tetap dapat berjalan ketika Web Audio atau salah satu aset audio gagal dimuat.

## Reduced motion

`prefers-reduced-motion` mengurangi camera shake, parallax agresif, dan idle motion besar, tetapi dialog, blink, mouth state, progres perjalanan, serta handoff ke Bumi tetap terbaca dan berfungsi.

Laporan implementasi terbaru ada di `IMPLEMENTATION.md`.

## Venus expansion

Venus now has 14 educational stops using the existing ANTARA info architecture and a separate hero-level **Eksplorasi Pengalaman Penuh** CTA matching Earth/Mars hierarchy. Full Exploration keeps the five real-coordinate destinations Maat Mons, Maxwell Montes, Aphrodite Terra, Ishtar Terra, and Alpha Regio, but its environment renderer has been rebuilt around scientific elevation data instead of synthetic macro landforms.

### Venus scientific terrain update

The preferred terrain source is a set of compact regional Float32 crops generated from USGS **Venus Magellan Global Topography 4641m v02**. A real NASA PDS one-degree Magellan topography grid is retained as a coarser scientific fallback. Procedural generation is limited to subordinate sub-resolution detail. Magellan SAR is handled independently as material context and is never converted into elevation.

The reachable map remains bounded, while a much larger low-detail terrain layer continues from the same geographic height source toward the dense Venus atmospheric horizon. Prepare the self-contained scientific assets with `python tools/prepare_venus_magellan_data.py`. See `VENUS_FULL_EXPLORATION.md`, `VENUS_SCIENCE_AUDIT.md`, and `assets/venus-data/README.md`.
