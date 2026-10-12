# ANTARA 157-163: database dan localhost

Semua tahap berasal dari snapshot lengkap asli. Nomor adalah urutan paket rekonstruksi, bukan hash/nomor commit GitHub resmi.
157 logo resmi; 158 progres berbasis event; 159 dua leaderboard; 160 pencapaian; 161 gambar medal; 162 notifikasi + audio; 163 perluasan info planet.
Referensi file dan judul commit tersedia di COMMIT_ORDER.txt. Perubahan bytes ada di VERIFICATION.json.

## Jalankan lokal
Salin folder ANTARA ke C:\xampp\htdocs\ANTARA. Start Apache dan MySQL.
Buka http://localhost/ANTARA/ dan http://localhost/ANTARA/api/health.php.
Gunakan PHP 8.1+ dengan PDO MySQL, session, MySQL/MariaDB yang mendukung InnoDB dan CHECK.
Default generik lokal: 127.0.0.1:3306, database antara, user root tanpa password. Sesuaikan environment server jika instalasimu berbeda.
Jangan buka HTML lewat file:// atau server statis untuk menguji PHP.

## Database BARU
Buat database di phpMyAdmin/panel, pilih database itu, lalu import export/stage-NNN/antara.sql sesuai tahap yang digunakan.
Untuk tahap akhir gunakan export/stage-163/antara.sql. SQL portabel ini tidak memiliki CREATE DATABASE atau USE.
Export berisi skema tabel, bukan export database lokal berjalan atau dump data akun.
SQL project asli tetap ada di ANTARA/database/ untuk provenance; pada hosting pakai export portabel.

## UPGRADE database dari tahap 156
Backup database sendiri terlebih dahulu di lingkungan admin, bukan ke ZIP commit.
Import migrasi berikut ke database aplikasi yang DIPILIH, tanpa menghapus tabel atau akun:
- Saat masuk 158: export/stage-158/progress-migration.sql, menambah user_progress_events.
- Saat masuk 159: export/stage-159/leaderboard-migration.sql, menambah exploration_completions, game_runs, verified_game_scores.
- Saat masuk 160: export/stage-160/achievement-migration.sql, menambah user_activity_events.
- Saat masuk 162: export/stage-162/achievement-migration.sql, menambah user_achievements.notified_at jika belum ada dan menandai medali lama sudah dinotifikasikan.
157, 161, dan 163 tidak menambah struktur tabel.
Kalau langsung lompat 156 ke 163, import progress-migration, leaderboard-migration, achievement-migration dari export/stage-163/ dalam urutan tersebut.
CREATE TABLE IF NOT EXISTS pada skema fresh tidak menambah kolom ke tabel yang sudah ada. Karena itu upgrade 162 wajib memakai migrasinya, bukan hanya import ulang antara.sql.
Migrasi tersebut adalah file asli dari snapshot, dengan USE dihapus untuk nama database hosting yang berbeda. Belum diuji eksekusi MySQL di sesi ini.
Catalog medali berasal dari kode _achievements.php dan di-seed/update oleh backend. Kode ini bukan dump data pengguna.

## Hosting dan konfigurasi
Backend aplikasi PHP tetap disertakan. File .env, credential nyata, cookie/session, dump akun, phpMyAdmin/XAMPP runtime tidak disertakan.
api/config/database.php adalah kode generik getenv yang dibutuhkan aplikasi, bukan konfigurasi rahasia lokal.
Tetapkan ANTARA_DB_HOST, ANTARA_DB_PORT, ANTARA_DB_NAME, ANTARA_DB_USER, ANTARA_DB_PASS melalui environment server/panel di luar repository.
Admin harus menyiapkan database, hak akses dan session writable sesuai kebutuhan source. Jangan hardcode password ke kode.
Source menggunakan CREATE TABLE untuk ensure schema dan ALTER saat upgrade tertentu, serta INSERT/UPDATE catalog. Akun database harus mengizinkan operasi tersebut; import saja tidak membuktikan hak akses runtime cukup.
Gunakan HTTPS. database/.htaccess memblokir HTTP direktori SQL pada Apache; pada server lain admin perlu aturan setara atau menyimpan SQL di luar webroot.
Panduan historis docs/history bisa menyebut htdocs root. Untuk paket ini ikuti alamat /ANTARA/ di atas.

## Uji deployment TEST
python tools/deploy_smoke.py http://localhost/ANTARA/
Skrip sesuai tahap, membuat satu akun tes, memeriksa auth/session, progres/event, profil/password, leaderboard dan pencapaian sesuai endpoint yang tersedia.
Sejak 159 pengiriman skor mentah harus mendapat HTTP 410. Skrip memeriksa penolakan itu dan pembacaan leaderboard, bukan bukti gameplay/score run penuh sudah berfungsi.
Sejak 162 skrip memeriksa notifikasi tidak mengirim medali yang sama dua kali berturut-turut.
Hapus akun tes via admin menggunakan ID yang dicetak; foreign keys membersihkan data relasinya. Password tes tidak disimpan atau dicetak.
Backend PHP/MySQL dan render browser BELUM diuji di sesi pembuatan bundel. Cek HTTP aset bukan tes database.
Jalankan tes ini sesudah migrasi, lalu cek tampilan/logo, jalur mulai perjalanan, progres, leaderboard, medali, notifikasi dan audio di browser localhost tujuan.
Stage historis ini dipertahankan apa adanya, bukan audit menyeluruh keamanan produksi atau bukti keaslian aktivitas pengguna.
