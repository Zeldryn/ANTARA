# Laporan perbaikan dan audit ANTARA

Tanggal: 8 Oktober 2026. Acuan: ANTARA-responsif-F12-audio-fixed-2026-10-08.zip.

## Temuan dan perbaikan

1. **Ruang kosong di bawah Info Lokasi dan Tujuan.** Beberapa panel memakai batas atas dan bawah sekaligus, sedangkan kartu materi memakai tinggi tetap. Akibatnya, panel dapat jauh lebih tinggi daripada isi. Tinggi panel sekarang mengikuti isi, batas tinggi dan scroll tetap tersedia untuk materi panjang. Jangkar vertikal dipisahkan untuk PC dan mobile. Posisi bawah pada landscape pendek juga dibatasi agar panel tidak menyentuh area HUD/kontrol.
2. **Selector Info Lokasi Jupiter salah ID.** CSS mengarah ke `jupiter-location-card`, sedangkan elemen HTML bernama `jupiter-landmark-card`. Selector diperbaiki agar aturan panel mobile yang sudah ada diterapkan pada elemen yang benar.
3. **Konfigurasi koneksi database tidak ada dalam paket.** `_bootstrap.php` mewajibkan `api/config/database.php`, tetapi file itu tidak disertakan. Ini berpotensi membuat endpoint PHP gagal sebelum mengirim JSON. Loader sekarang tetap memakai konfigurasi pribadi tersebut jika tersedia; ketika tidak tersedia, ia memakai contoh koneksi generik. Contoh tidak memuat akun pengguna atau kredensial hosting. Struktur kosong tabel users juga disertakan untuk instalasi lokal baru.

## Ruang lingkup perubahan

File lama yang berubah hanya `full-exploration-coherence.css`, `jupiter-full-exploration.css`, `index.html` (versi cache stylesheet), dan `api/_bootstrap.php`. File baru: `api/config/database.example.php`, `database/ANTARA-users-schema.sql`, dan laporan ini. Isi materi, gambar, karakter, audio, bank kuis, data tujuan, gerakan kamera, dan mekanisme permainan tidak diganti.

## Pengujian yang dijalankan

| Objek | Topik jelajah biasa | Masuk, Next/Prev, kembali | Kualitas, 5 tujuan, batal jelajah penuh |
| --- | ---: | --- | --- |
| Matahari | 11 | Lolos simulasi DOM | Tidak memiliki mode penuh pada paket ini |
| Merkurius | 11 | Lolos simulasi DOM | Lolos simulasi DOM |
| Venus | 14 | Lolos simulasi DOM | Lolos simulasi DOM |
| Bumi | 14 | Lolos simulasi DOM | Lolos simulasi DOM |
| Mars | 11 | Lolos simulasi DOM | Lolos simulasi DOM |
| Sabuk Asteroid | 11 | Lolos simulasi DOM | Tidak memiliki mode penuh pada paket ini |
| Jupiter | 11 | Lolos simulasi DOM | Lolos simulasi DOM |
| Saturnus | 11 | Lolos simulasi DOM | Lolos simulasi DOM |
| Uranus | 11 | Lolos simulasi DOM | Lolos simulasi DOM |
| Neptunus | 11 | Lolos simulasi DOM | Lolos simulasi DOM |

- 208 pemeriksaan cascade untuk tinggi dan jangkar 26 panel pada delapan konfigurasi viewport/pointer lolos. Ukuran mencakup PC 1883x784, laptop 1366x768, tablet 1024x768, ponsel 390x844, dan landscape pendek.
- 144 pemeriksaan cascade tombol Tujuan/Info serta posisi/visibilitas audio dari perbaikan sebelumnya tetap lolos.
- Konstruksi dan disposal 20 dunia planet gas, masing-masing lima tujuan Jupiter, Saturnus, Uranus, dan Neptunus, lolos dengan geometri Three.js asli. Nilai atribut geometri tidak mengandung NaN/Infinity. Renderer GPU tidak digunakan pada pemeriksaan ini.
- Halaman utama dan lima halaman Daftar, Leaderboard, Pencapaian, Permainan, Progress tidak menghasilkan error startup dalam simulasi DOM. Semua tautan/aset lokal HTML ditemukan; tidak ada ID HTML duplikat.
- Simulasi respons API: login ditolak tetap mempertahankan sesi tamu; login berhasil menghapus progress tamu tetapi mempertahankan preferensi perangkat; kegagalan jaringan tidak menghapus identitas yang sudah dikonfirmasi; logout mengosongkan identitas. Ini memakai API tiruan, bukan akun nyata.
- Struktur 300 soal lolos pemeriksaan ID, empat pilihan unik, kunci jawaban yang tersedia, dan pembagian lima level berisi 60 soal per level. Kebenaran ilmiah setiap jawaban tidak diaudit ulang pada pekerjaan ini.
- Seluruh JavaScript lolos pemeriksaan sintaks. Semua 23 file PHP lolos parser. Seluruh 38 shader tetap lolos kompilasi OpenGL ES.
- ZIP diperiksa CRC dan kesamaan byte seluruh file sebelum dikirim, lalu ukuran/hash arsip dicek kembali setelah penyimpanan.

## Batas pengujian

Browser cloud tidak dapat menjangkau server proyek lokal (`ERR_CONNECTION_REFUSED`), dan browser lokal untuk pengujian tidak tersedia. Karena itu, pengujian di atas bukan pemeriksaan screenshot/layout visual di Chrome, bukan uji langsung perubahan F12, dan bukan permainan lengkap dengan GPU.

PHP dan MySQL tidak tersedia di lingkungan pengujian. Login/daftar, progress, pencapaian, leaderboard, serta jawaban kuis belum diuji end-to-end terhadap database. Pengujian selector tidak membuktikan pemuatan semua terrain Bumi/Mars/Venus, perpindahan antarplanet penuh, WASD/touch aktual, pointer lock, fullscreen, atau audio browser. Bagian-bagian itu tidak diklaim sudah lulus.

## Pemakaian lokal dan database

Ekstrak ZIP ke folder proyek, lalu buka lewat localhost dan Ctrl+F5. Jika proyek yang sudah berjalan memiliki `api/config/database.php`, pertahankan file milikmu; ZIP ini tidak menyertakan file pribadi itu.

Fallback generik memakai host `127.0.0.1`, port `3306`, nama database `antara`, user XAMPP `root`, dan password kosong. Ini default contoh, bukan pembacaan konfigurasi PC pengguna. Jika pengaturanmu berbeda, gunakan konfigurasi pribadimu atau variabel server `ANTARA_DB_HOST`, `ANTARA_DB_PORT`, `ANTARA_DB_NAME`, `ANTARA_DB_USER`, `ANTARA_DB_PASSWORD`.

Untuk database lokal baru, buat/pilih database yang sesuai lalu impor `database/ANTARA-users-schema.sql`. File hanya membuat tabel users jika belum ada, tanpa data akun, tanpa DROP, tanpa mengubah tabel users yang sudah ada. Tabel pendukung tetap ditangani fungsi ensure_schema proyek. Keberhasilan fungsi tersebut di MySQL belum diuji di sini. Tidak ada file .env atau kredensial hosting yang ditambahkan.
