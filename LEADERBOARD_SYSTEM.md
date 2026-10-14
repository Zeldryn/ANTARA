# ANTARA Leaderboard System

## 1. Leaderboard 100% Penjelajahan

Sumber data resmi adalah `user_progress_events` milik akun yang sedang login. Setelah server menghitung seluruh milestone selesai, server membuat satu record unik di `exploration_completions`.

Urutan ranking:

1. `completed_at` paling awal.
2. Jika timestamp sama, ID completion paling awal.

`completed_at` tidak diambil dari jam browser. Timestamp berasal dari database server dan tidak ditimpa setelah record completion pertama tercipta.

### Integrity guard

Completion publik hanya eligible jika:

- seluruh milestone unik benar-benar selesai;
- jumlah event mencukupi total katalog server;
- rentang waktu event pertama sampai event terakhir minimal 300 detik;
- milestone divalidasi terhadap katalog server;
- endpoint progress memiliki same-origin guard dan session rate limit.

Guard ini bukan pengganti anti-cheat server penuh. Karena eksplorasi visual tetap berjalan di browser, pengguna teknis masih dapat mengotomasi browser. Tujuannya adalah mencegah manipulasi trivial seperti POST `progress=100` atau spam instan seluruh milestone.

## 2. Leaderboard Permainan

Leaderboard permainan membaca `verified_game_scores`, bukan tabel legacy `game_scores`.

Endpoint lama `api/leaderboard/submit-score.php` sengaja dinonaktifkan. Browser tidak boleh mengirim angka skor final mentah.

Skema secure run sudah disediakan:

- `game_runs`: identitas run server, user, game, token hash, status, server score, waktu mulai/selesai/kedaluwarsa.
- `verified_game_scores`: hanya hasil run yang telah diverifikasi server.

Saat permainan ANTARA dibuat, logika game harus mengubah `server_score` berdasarkan event yang dapat diverifikasi server, lalu menutup run dan menulis hasil ke `verified_game_scores`. Jangan mengaktifkan kembali endpoint skor mentah.

## 3. Database

Database baru: import `database/antara.sql`.

Database ANTARA yang sudah ada: import sekali `database/leaderboard-migration.sql`. Runtime juga memiliki `CREATE TABLE IF NOT EXISTS` sebagai safety net.
