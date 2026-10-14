# Quiz ANTARA MVP

## Gameplay
- 15 soal per run, 3 soal dari setiap level bank 300 soal ANTARA.
- Batas waktu bersifat adaptif per soal. Server menghitung beban baca dari teks pertanyaan + empat opsi, menambahkan waktu berpikir sesuai level, lalu membatasi hasil ke rentang yang wajar.
- Rentang aktual bank saat ini: Pemula 17–22 dtk, Dasar 10–15 dtk, Menengah 10–14 dtk, Sulit 18–25 dtk, Ahli 20–28 dtk.
- Skor dihitung di server dari base score level, bonus proporsi sisa waktu adaptif, dan streak.
- Browser tidak dapat mengirim skor akhir mentah ke leaderboard.

## API
- `POST api/quiz/start.php` membuat secure run dan memberikan soal pertama.
- `POST api/quiz/answer.php` memverifikasi jawaban, waktu, streak, dan poin.
- `POST api/quiz/next.php` memulai timer server untuk soal berikutnya.
- Hasil akhir dicatat ke `verified_game_scores` dengan `game_code = quiz`.

## Achievement
- Kuis Pertama
- Orbit Streak x5
- Jawaban Kilat
- Lintasan Sempurna
- Komandan Kuis (5.000 poin)

## Bank soal
`api/quiz/_bank.php` dihasilkan dari file Markdown bank 300 soal dan sengaja berada di sisi server agar kunci jawaban tidak dikirim sebelum soal dijawab.
