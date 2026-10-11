# Deploy database ANTARA (141A)

Gunakan snapshot 141A untuk backend. Snapshot 141 masih merekam query SQL asli yang bermasalah.
141A berasal dari 141 + empat file hotfix asli; perubahan packaging dicatat dalam laporan.

## Lokal
1. PHP 8.1+ dengan PDO MySQL, MySQL 8 atau MariaDB yang mendukung CHECK dan InnoDB.
2. Salin ANTARA ke C:\xampp\htdocs\ANTARA. Jalankan Apache dan MySQL.
3. Buat database antara di phpMyAdmin, pilih database tersebut, lalu import export/antara-schema.sql dari bundel luar.
4. Default aplikasi adalah 127.0.0.1:3306, database antara, root tanpa password, hanya sesuai instalasi lokal standar.
5. Buka http://localhost/ANTARA/api/health.php, harus mengembalikan database connected. Buka http://localhost/ANTARA/ untuk aplikasi.

## Hosting
Buat database dan akun aplikasi di panel hosting. Import export/antara-schema.sql ke database yang dipilih.
File export tidak mengandung CREATE DATABASE atau USE, sehingga nama database hosting bebas.
Tetapkan environment server ANTARA_DB_HOST, ANTARA_DB_PORT, ANTARA_DB_NAME, ANTARA_DB_USER, ANTARA_DB_PASS sesuai database hosting.
Kode database.php menggunakan getenv; kode generik ini diperlukan, bukan konfigurasi lokal atau rahasia.
Jangan isi password ke kode, commit .env, atau upload folder instalasi XAMPP/MySQL.
Jika panel tidak menyediakan environment untuk PHP, minta admin menyetel variabel tersebut melalui konfigurasi server di luar repository.
Aktifkan HTTPS dan pastikan session PHP dapat menyimpan cookie. Gunakan akun database aplikasi, bukan root.
Host harus menjalankan PHP; hosting statis saja tidak menjalankan backend ini.

## Export dan verifikasi
export/antara-schema.sql adalah skema fresh dari SQL snapshot 141, berisi lima tabel tanpa data akun.
Ini bukan export database lokal berjalan karena database tersebut tidak tersedia di sesi ini.
Untuk migrasi data yang sudah ada, export database aplikasi sendiri lewat phpMyAdmin; tinjau data pribadi sebelum dibagikan kepada admin.
Jangan salin folder mysql/data. Jangan import skema lama ini ke database versi terbaru tanpa memeriksa migrasi.
Skema ini sesuai backend tahap 141A, bukan skema fitur dari snapshot sesudahnya.

Jalankan pada deployment TEST setelah import SQL (membuat satu akun tes):
python tools/deploy_smoke.py http://localhost/ANTARA/
Skrip menguji health, register, duplicate register, sesi, logout, login username/email, progres yang tidak menurun, dan skor leaderboard.
Hapus akun tes dengan ID yang dicetak menggunakan akses admin; foreign keys menghapus progres dan skor terkait.
Skrip tidak menyimpan atau mencetak password. Jangan jalankan ke production tanpa menerima pembuatan akun tes.

PHP/MySQL tidak tersedia di lingkungan pembuatan bundel: tes backend ini belum dijalankan.
Tes HTTP statis tidak membuktikan koneksi database. Wajib jalankan smoke test pada server tujuan.
Frontend progres/leaderboard snapshot ini belum terintegrasi penuh dengan API; endpoint tersedia untuk integrasi berikutnya.
Periksa render dan alur daftar/login di browser server tujuan juga.
Untuk produksi, audit lanjutan autentikasi, pembatasan request, dan validasi skor diperlukan; hotfix SQL ini bukan audit keamanan menyeluruh.
