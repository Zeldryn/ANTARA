# Perbaikan render ANTARA, 8 Oktober 2026

Penyebab yang ditemukan:
- Tanda akhir perintah GLSL berubah dari titik koma menjadi titik.
- Shader digabung menjadi satu baris sehingga komentar menelan kode dan directive tidak berada di baris tersendiri.
- Variabel shader Matahari berubah menjadi teks `tepi planet`, yang bukan identifier GLSL valid.
- Referensi HUD Bumi berubah menjadi `earth-hud-permukaan 3D`, sedangkan elemen HTML bernama `earth-hud-terrain`. Pembaruan HUD mengakses elemen null.

Perbaikan memulihkan shader di sembilan scene (Matahari sampai Neptunus, selain sabuk asteroid), material permukaan Bumi/Venus/Mars, referensi HUD Bumi, dan versi cache script terkait. Konten edukasi dipertahankan.

Verifikasi:
- 38 shader asli gagal dikompilasi dengan compiler grafis OpenGL ES.
- Setelah perbaikan, 38 shader lolos kompilasi, termasuk shader standar Three.js yang diperluas dengan detail permukaan.
- Semua file JavaScript lolos node --check.
- Semua referensi file lokal src/href di index.html ditemukan.

Batas pengujian:
Browser pengujian tidak tersedia dan unduhannya gagal. Pengujian visual seluruh perjalanan, setiap tujuan eksplorasi, mobile, PHP, dan database XAMPP belum dilakukan. Hasil ini memperbaiki kerusakan kode yang terbukti, bukan jaminan seluruh 17 permintaan sebelumnya telah terpenuhi.

Pemakaian:
Ekstrak sebagai folder proyek bersih di htdocs, lalu buka lewat localhost. Gunakan pengaturan database lokal milikmu yang sesuai. Refresh halaman dengan Ctrl+F5.

## Perbaikan responsif F12 dan audio

- Tombol Tujuan Mars sebelumnya memiliki top dan bottom bersamaan tanpa height, sehingga bisa memanjang. Tujuan dan Info di delapan planet sekarang memiliki tinggi terbatas, dengan satu sisi vertikal aktif pada setiap mode.
- Pergantian pointer coarse/fine dari DevTools menyegarkan panel eksplorasi yang sedang terbuka.
- Audio pada panorama PC dipindahkan ke kanan bawah.
- Tombol audio disembunyikan dan tidak bisa difokuskan selama kartu jelajah atau jelajah penuh terbuka, termasuk layar pemilihan tujuan/kualitas. Pengaturan mute tetap dipertahankan.
- Tombol audio pada panorama mobile mengikuti titik tengah logo header ANTARA.
- 144 pemeriksaan cascade CSS lolos pada delapan kombinasi ukuran/pointer dan delapan planet. Tes fungsi audio untuk masuk/keluar mode dan perubahan posisi logo juga lolos. Pengujian ini bukan pengujian visual browser.
