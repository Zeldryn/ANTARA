# Quiz ANTARA Mastery Stack - Test Report

## Static / syntax
- `node --check permainan.js`: PASS
- `php -l` untuk `_quiz.php`, `start.php`, `answer.php`, `next.php`, `_achievements.php`: PASS
- Required DOM IDs: PASS
- Duplicate DOM IDs pada `permainan.html`: 0

## Bank selection
- Total bank: 300 soal
- Distribusi bank: 60 soal × 5 level
- Sampel run baru: 75 soal unik
- Distribusi sampel: 15 soal pada masing-masing level

## Mastery simulation
Simulasi sengaja memberi jawaban salah pada beberapa slot dan satu slot salah dua kali.
- Semua 5 level akhirnya mencapai 15/15: PASS
- Soal belum pernah dicoba diprioritaskan sebelum retry: PASS
- Soal salah kembali ke antrean: PASS
- Soal yang sudah benar tidak muncul lagi: PASS
- Level berikutnya baru dibuka setelah 15/15: PASS

## Limitation
Environment pengujian ini memiliki PDO tetapi tidak memiliki driver/server MySQL aktif, sehingga transaksi SQL MySQL nyata tidak dapat diuji end-to-end di sini. Schema, query contract, state simulation, syntax, bank distribution, dan client/server field contract telah diaudit statis.
