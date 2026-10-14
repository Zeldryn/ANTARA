# Quiz ANTARA MVP

## Gameplay
- 15 soal per run, 3 soal dari setiap level bank 300 soal ANTARA.
- Level 1-5 memakai batas waktu 10, 9, 8, 7, dan 6 detik.
- Skor dihitung di server dari base score level, bonus sisa waktu, dan streak.
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
