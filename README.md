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
- Companion: Nara dan Sora
- Teknik karakter: layered inline SVG, bukan PNG karakter statis
- Animasi karakter: breathing, head idle, hair motion, blink acak, mouth frames saat berbicara, launch reaction, turbulence, dan look/point toward Earth
- Dialog: data-driven dan disinkronkan ke fase peluncuran
- Environment: horizon, cloud layers berparalaks, perubahan atmosfer ke ruang angkasa, cockpit shake berlapis, dan Earth reveal
- Handoff: renderer Bumi mulai di belakang kokpit saat fase approach, kemudian kokpit/karakter perlahan menghilang sehingga tidak terjadi hard cut

Tidak ada video background atau poster karakter statis yang dipakai untuk menyamarkan animasi. Aset hero statis lama sudah tidak digunakan dalam build ini.

## Planet exploration

Sistem eksplorasi Bumi, Venus, dan Mars tetap memakai renderer, marker, image preview, lightbox, internal scrolling, audio, dan navigasi planet yang sudah ada. Fix kualitas transisi Venus dan struktur materi umum Mars dari revisi sebelumnya tetap dipertahankan.

## Audio

Audio lokal tetap opsional. Tombol speaker menyimpan preferensi mute dan perjalanan tetap dapat berjalan ketika Web Audio atau salah satu aset audio gagal dimuat.

## Reduced motion

`prefers-reduced-motion` mengurangi camera shake, parallax agresif, dan idle motion besar, tetapi dialog, blink, mouth state, progres perjalanan, serta handoff ke Bumi tetap terbaca dan berfungsi.

Laporan implementasi terbaru ada di `IMPLEMENTATION.md`.
