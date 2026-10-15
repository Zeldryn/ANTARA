# Mobile Panorama Action Dock · 2026-10-05

## Perubahan
- Khusus mobile/coarse pointer, tombol `Amati Seluruh Tata Surya` dan `Kembali ke Kokpit` dipindahkan dari area atas ke action dock di bawah kontrol panorama planet.
- Caption panorama seluruh objek dinaikkan untuk membuat gap yang konsisten di atas dock.
- Sangat pendek/landscape menggunakan versi dock 44px agar tetap muat.
- Saat panel informasi planet (`is-exploring`) aktif, action dock disembunyikan supaya tidak menimpa konten edukasi.
- Desktop tidak diubah.

## Cakupan panorama
Matahari, Merkurius, Venus, Bumi, Mars, Sabuk Asteroid, Jupiter, Saturnus, Uranus, Neptunus.

## QA
- 10 panorama × 7 mobile viewport = 70 layout cases.
- Minimum measured gap between planet controls/caption and global action dock: >= 8px.
- Dock remains inside viewport in portrait and short landscape test matrix.
