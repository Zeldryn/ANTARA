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
