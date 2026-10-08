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

Sistem eksplorasi planet tetap memakai renderer, marker, image preview, lightbox, internal scrolling, audio, dan navigasi yang sudah ada. Bumi tetap memiliki **14 slide informasi** untuk mode edukasi normal, sementara **Eksplorasi Pengalaman Penuh** sekarang merupakan satu world eksplorasi terpadu yang mengikuti arsitektur inti Mars.

Earth Full Exploration langsung menjalankan approach bergaya Mars menuju satu streamed Earth terrain world. Di dalam mode yang sama, menu **Lokasi** menyediakan lima featured anchor: Everest / Himalaya, Challenger Deep / Mariana, Mauna Kea / Hawai‘i, Grand Canyon, dan Antarctica / Mount Vinson. Perpindahan lokasi tidak membuat renderer atau terrain engine baru: kamera naik, target DEM dipreload, terrain manager yang sama di-reanchor, lalu kamera turun kembali ke area eksplorasi.

Elevasi daratan memakai tile Terrarium real, sementara engine memuat chunk di sekitar kamera, melakukan LOD, frustum/view-dependent culling, look-ahead prefetch, serta pruning tile lama. Visual tiap anchor tetap Earth-specific melalui Blue Marble/albedo Bumi, material detail per lokasi, snow/ice, basalt, canyon strata, sea-level water, sky, dan aerial haze. Challenger Deep mendapat bathymetric fallback lokal ketika sumber Terrarium meratakan samudra ke sea level, sehingga eksplorasi hadal tidak berubah menjadi bidang laut kosong. Controls, pointer-lock, camera feel, entry/exit lifecycle, dan resource handling tetap mengikuti filosofi Mars tanpa mengubah implementasi Mars itu sendiri.

Mode terrain nyata memerlukan koneksi internet untuk mengambil tile DEM Terrarium. Jika tile wajib gagal dimuat, ANTARA menampilkan error/rollback alih-alih meninggalkan terrain kosong. Detail sumber dan keterbatasan ada di `EARTH_FULL_EXPLORATION.md`. Fix kualitas Mars dan optimasi view-dependent Mars dari revisi sebelumnya tetap dipertahankan tanpa perubahan.

## Audio

Audio lokal tetap opsional. Tombol speaker menyimpan preferensi mute dan perjalanan tetap dapat berjalan ketika Web Audio atau salah satu aset audio gagal dimuat.

## Reduced motion

`prefers-reduced-motion` mengurangi camera shake, parallax agresif, dan idle motion besar, tetapi dialog, blink, mouth state, progres perjalanan, serta handoff ke Bumi tetap terbaca dan berfungsi.

Laporan implementasi terbaru ada di `IMPLEMENTATION.md`.
