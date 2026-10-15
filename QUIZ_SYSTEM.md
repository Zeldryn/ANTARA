# Quiz ANTARA - Mastery Stack

## Gameplay
- Satu run penuh memiliki 5 level: Pemula, Dasar, Menengah, Sulit, dan Ahli.
- Setiap level mengambil 15 soal acak dari 60 soal yang tersedia pada level tersebut.
- Total slot unik per run adalah 75 soal (5 × 15).
- Level berikutnya terkunci sampai seluruh 15 soal pada level aktif berstatus benar.
- Jawaban salah atau timeout tidak mengakhiri run. Soal tersebut masuk antrean retry dan akan disajikan lagi setelah soal yang belum pernah dicoba habis.
- Soal yang sudah benar tidak pernah disajikan lagi pada run yang sama, sehingga poin tidak dapat digandakan lewat retry.
- Batas waktu tetap adaptif per soal. Server menghitung beban baca dan level kesulitan.
- Run server berlaku 90 menit untuk memberi ruang pada 75 soal + retry.

## Progression
1. PEMULA: kuasai 15/15.
2. DASAR terbuka setelah Pemula 15/15.
3. MENENGAH terbuka setelah Dasar 15/15.
4. SULIT terbuka setelah Menengah 15/15.
5. AHLI terbuka setelah Sulit 15/15.
6. Leaderboard baru menerima skor final ketika Ahli juga selesai 15/15.

UI menampilkan `DIKUASAI x / 15`. Setelah 15 soal sudah pernah dicoba tetapi masih ada yang salah, UI memberi warning dan hanya mengulang soal yang belum benar. Setelah 15/15, tombol berubah menjadi `NAIK KE <LEVEL BERIKUTNYA>`.

## API
- `POST api/quiz/start.php`: membuat satu secure run berisi 75 slot soal dan mengaktifkan soal pertama level Pemula.
- `POST api/quiz/answer.php`: memverifikasi jawaban, waktu, streak, poin, attempt, dan mastery stack.
- `POST api/quiz/next.php`: mengaktifkan timer server untuk soal berikutnya atau membuka level berikutnya setelah 15/15.
- Hasil final dicatat ke `verified_game_scores` dengan `game_code = quiz` setelah kelima level selesai.

## Database
`quiz_run_questions` menambahkan:
- `attempt_count`: jumlah percobaan pada slot soal.
- `first_try_correct`: 1 jika slot dikuasai pada percobaan pertama.

`antara_quiz_ensure_schema()` meng-upgrade tabel lama otomatis jika kolom tersebut belum ada.

## Achievement
- Kuis Pertama: menyelesaikan kelima level.
- Orbit Streak x5: lima jawaban benar berturut-turut.
- Jawaban Kilat: sedikitnya lima jawaban benar <= 3 detik.
- Lintasan Sempurna: satu stack 15/15 benar seluruhnya pada percobaan pertama.
- Komandan Kuis: skor terverifikasi >= 5.000 poin.

## Bank soal
`api/quiz/_bank.php` berisi 300 soal: 60 soal pada masing-masing dari 5 level. Kunci jawaban tetap berada di server.
