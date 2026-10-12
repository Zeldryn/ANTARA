# ANTARA Backend Setup, XAMPP + PHP + MySQL

Backend ini memakai PHP, PDO, session cookie, dan MySQL/MariaDB. Konfigurasi default cocok dengan instalasi XAMPP standar yang memakai user MySQL `root` tanpa password.

## 1. Taruh project di htdocs

Ekstrak folder project ke:

```text
C:\xampp\htdocs\ANTARA
```

Pastikan file utama berada di:

```text
C:\xampp\htdocs\ANTARA\index.html
C:\xampp\htdocs\ANTARA\api\health.php
C:\xampp\htdocs\ANTARA\database\antara.sql
```

## 2. Jalankan Apache dan MySQL

Buka XAMPP Control Panel, lalu tekan Start pada:

```text
Apache
MySQL
```

Keduanya harus berstatus Running.

## 3. Buat database ANTARA

Buka phpMyAdmin:

```text
http://localhost/phpmyadmin/
```

Pilih tab Import, lalu pilih file:

```text
database/antara.sql
```

Jalankan import. File SQL akan membuat database `antara` dan tabel:

```text
users
user_progress
user_progress_events
game_scores
achievements
user_achievements
```

## Progress eksplorasi per akun

Versi ini menyimpan milestone eksplorasi unik per akun di tabel `user_progress_events`. Membuka topik atau destinasi yang sama berkali-kali tidak menambah progress lagi.

Untuk instalasi database baru, cukup import `database/antara.sql` seperti biasa.

Untuk database ANTARA yang sudah pernah dibuat sebelumnya, import sekali file:

```text
database/progress-migration.sql
```

Backend juga akan mencoba membuat tabel tersebut otomatis saat endpoint progress pertama kali dipakai, selama user MySQL mempunyai izin `CREATE TABLE`. File migration tetap disediakan agar deployment ke server lomba bisa dilakukan secara eksplisit.

Endpoint yang dipakai sistem progress:

```text
POST api/progress/mark.php
GET  api/progress/get.php
```

`mark.php` mengambil `user_id` dari session login. Karena itu progress tidak dikirim berdasarkan ID user dari browser dan tidak dapat ditulis ke akun lain hanya dengan mengganti payload.

## 4. Cek koneksi backend

Buka:

```text
http://localhost/ANTARA/api/health.php
```

Jika benar, responsnya kurang lebih:

```json
{"success":true,"database":"connected","php":"8.x.x"}
```

Jika muncul pesan database belum dapat dihubungi, cek apakah MySQL sudah Running dan cek konfigurasi di:

```text
api/config/database.php
```

Konfigurasi default:

```text
Host     : 127.0.0.1
Port     : 3306
Database : antara
User     : root
Password : kosong
```

Jika MySQL XAMPP milikmu memakai password, isi `$pass` di `api/config/database.php` atau gunakan environment variable `ANTARA_DB_PASS`.

## 5. Buka ANTARA melalui localhost

Jangan buka `index.html` dengan double click atau alamat `file:///` karena PHP tidak akan dijalankan.

Gunakan:

```text
http://localhost/ANTARA/
```

Klik `MASUK KE ANTARA`. Halaman akun sekarang memiliki mode `DAFTAR` dan `MASUK`.

## 6. Tes pendaftaran

Daftarkan akun baru. Setelah berhasil:

1. Data user masuk ke tabel `users`.
2. Password disimpan sebagai hash, bukan password mentah.
3. PHP membuat session login.
4. Browser kembali ke homepage.
5. HUD ANTARA menampilkan nama user yang sedang login.

Untuk melihat isi akun, buka tabel `users` di phpMyAdmin.

## 7. Tes login

Keluar dari sesi akun, lalu masuk kembali menggunakan salah satu dari:

```text
username + password
email + password
```

Session disimpan dengan cookie `ANTARA_SESSION` yang bersifat HttpOnly dan SameSite=Lax.

## Endpoint yang tersedia

```text
GET  api/health.php
POST api/auth/register.php
POST api/auth/login.php
GET  api/auth/me.php
POST api/auth/logout.php

GET  api/progress/get.php
POST api/progress/save.php

GET  api/leaderboard/get.php?game=general
POST api/leaderboard/submit-score.php
```

Endpoint progress dan submit score memerlukan user yang sedang login.

## Contoh payload progress

```json
{
  "planet": "earth",
  "progress": 100
}
```

## Contoh payload score

```json
{
  "game": "general",
  "score": 1250
}
```

Frontend leaderboard dan progress ANTARA belum dipaksa memakai endpoint ini. API dan tabelnya sudah disiapkan agar integrasi berikutnya tidak perlu membongkar sistem akun.

## Leaderboard aman

Versi ini menambahkan dua jalur leaderboard:

- **100% Penjelajahan**: dibuat otomatis dari progress akun dan timestamp database server.
- **Permainan**: membaca hanya skor dari `verified_game_scores`; endpoint skor mentah lama dinonaktifkan.

Jika database `antara` sudah pernah dibuat sebelum fitur leaderboard ini, import sekali:

```sql
SOURCE database/leaderboard-migration.sql;
```

Atau import file `database/leaderboard-migration.sql` melalui phpMyAdmin. Untuk instalasi database baru, `database/antara.sql` sudah memuat tabel yang diperlukan.

## Achievement unlock notification

Versi ini menambahkan notifikasi medali per akun. Achievement baru tetap dihitung server-side dari progress, aktivitas peluncuran, dan leaderboard. Browser hanya mengambil antrean notifikasi yang memang sudah dibuka oleh akun tersebut.

Jika database `antara` sudah memiliki sistem achievement dari versi sebelumnya, import ulang migration achievement sekali:

```sql
SOURCE database/achievement-migration.sql;
```

Migration menambahkan `user_achievements.notified_at`. Medali lama ditandai sudah diumumkan agar pengguna tidak menerima spam toast lama setelah update. Medali yang terbuka setelah upgrade akan memiliki `notified_at = NULL` sampai endpoint notifikasi mengirimkannya ke akun terkait.

Endpoint tambahan:

```text
GET api/achievements/notifications.php
```

Endpoint ini memerlukan session login. Hasil notifikasi diklaim dari database per `user_id`, jadi akun berbeda memiliki antrean medali berbeda.

## Audio sejak halaman awal

Homepage sekarang langsung mencoba memutar musik latar dan ambience fasilitas sebelum tombol `MULAI PERJALANAN` ditekan. Browser tertentu memblokir autoplay audio bersuara sebelum interaksi pengguna. Pada kondisi tersebut ANTARA tidak menganggap audio rusak: kontrol audio akan menunjukkan bahwa satu interaksi diperlukan, lalu musik dimulai pada klik/tap/keyboard pertama. Preferensi `SUARA MATI` tetap dihormati.
