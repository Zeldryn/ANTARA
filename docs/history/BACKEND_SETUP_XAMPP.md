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
game_scores
achievements
user_achievements
```

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
