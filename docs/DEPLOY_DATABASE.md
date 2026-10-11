# ANTARA 142-156: localhost dan database

Semua ZIP tahap berisi folder ANTARA/. Lanjutan dimulai setelah 141A.
142-146 adalah rekonstruksi eksplisit: salinan source tahap sebelumnya + file hotfix asli.
147-156 adalah snapshot lengkap asli dengan file XAMPP dan cache dikeluarkan.
Lihat COMMIT_ORDER.txt dan VERIFICATION.json untuk perubahan, provenance, dan daftar penghapusan.

## Lokal XAMPP
Salin ANTARA ke C:\xampp\htdocs\ANTARA. Jalankan Apache dan MySQL.
Buka http://localhost/ANTARA/ dan http://localhost/ANTARA/api/health.php.
PHP 8.1+ dan PDO MySQL diperlukan. Server statis atau membuka file HTML langsung tidak menjalankan API.
Default generik: host 127.0.0.1, port 3306, database antara, akun root tanpa password (lokal standar saja).

## Database
Skema semua tahap sama persis dengan tahap 141A, terdiri dari lima tabel.
Jika database 141A sudah diimport dan API health terhubung, TIDAK perlu import ulang.
Untuk database baru: buat database, pilih di phpMyAdmin, import export/antara-schema.sql dari bundel luar.
Export ini adalah skema fresh tanpa data akun; bukan export database lokal berjalan.
Tidak ada CREATE DATABASE/USE dalam export portabel, sehingga nama database hosting dapat berbeda.
Jangan gunakan SQL versi ini untuk snapshot project sesudah 156 tanpa memeriksa migrasinya.

## Hosting
Kode backend aplikasi tetap disertakan; folder XAMPP/dashboard, phpMyAdmin, .env, credential dan dump pengguna tidak disertakan.
Tetapkan ANTARA_DB_HOST, ANTARA_DB_PORT, ANTARA_DB_NAME, ANTARA_DB_USER, ANTARA_DB_PASS melalui environment server/panel hosting, di luar repository.
api/config/database.php adalah kode generik getenv yang dibutuhkan aplikasi, bukan file konfigurasi rahasia lokal.
Gunakan user aplikasi dengan akses database yang sesuai. Jangan hardcode password atau mengganti konfigurasi umum XAMPP dalam repository.
Host wajib mendukung PHP, PDO MySQL, session dan MySQL/MariaDB dengan InnoDB. Gunakan HTTPS.
Pengaturan session writable dan environment harus disiapkan admin server; ZIP tidak bisa membawa konfigurasi rahasia tersebut.
database/.htaccess memblokir akses direktori SQL pada Apache. Pada server lain, admin harus memblokir direktori tersebut atau menyimpan SQL di luar webroot.

## Tes pada deployment TEST
python tools/deploy_smoke.py http://localhost/ANTARA/
Skrip membuat satu akun tes, menguji health/register/login/session, progres persisten, leaderboard, pengubahan profil dan password.
Hapus akun tes menggunakan ID yang dicetak setelah tes. Relasi foreign key menghapus progres/skor terkait.
Password tes tidak disimpan atau dicetak. Tes harus dijalankan pada database uji.
Backend PHP/MySQL belum diuji langsung dalam sesi pembuatan bundel. Tes HTTP statis bukan tes database.
Render browser dan alur tombol/More/dropdown juga perlu diuji pada localhost tujuan.
Stage 156 menambahkan gerbang login mulai perjalanan. Ini mencerminkan sumber asli, bukan perubahan baru packaging.
Frontend progres/pencapaian pada tahap historis ini belum sepenuhnya memakai API; endpoint backend tidak menjamin seluruh UI sudah terintegrasi.
Panduan lama di docs/history berasal dari ZIP sumber dan dapat menyebut htdocs root. Untuk paket ini ikuti panduan di atas.
