# ANTARA Account Progress

Progress eksplorasi sekarang terikat ke akun yang sedang login dan disimpan di MySQL.

## Yang dihitung

- Setiap topik pada mode Jelajah biasa dihitung satu milestone saat topik itu benar-benar dibuka.
- Setiap destinasi pada Eksplorasi Penuh dihitung satu milestone setelah destinasi berhasil dimasuki.
- Milestone yang sama hanya dihitung satu kali per akun walaupun dibuka berkali-kali.
- Planet tanpa Eksplorasi Penuh tetap dapat mencapai 100% dari seluruh topik Jelajah biasa yang tersedia.

## Total milestone versi project ini

| Objek | Jelajah biasa | Eksplorasi penuh | Total |
| --- | ---: | ---: | ---: |
| Matahari | 11 | 0 | 11 |
| Merkurius | 11 | 0 | 11 |
| Venus | 14 | 5 | 19 |
| Bumi | 14 | 5 | 19 |
| Mars | 11 | 4 | 15 |
| Sabuk Asteroid | 11 | 0 | 11 |
| Jupiter | 11 | 0 | 11 |
| Saturnus | 11 | 0 | 11 |
| Uranus | 11 | 0 | 11 |
| Neptunus | 11 | 0 | 11 |
| **Total** | **116** | **14** | **130** |

## Penyimpanan

Tabel `user_progress_events` menyimpan pasangan unik:

```text
user_id + planet_code + event_type + event_key
```

Unique key di database menjadi pengaman utama agar reload, klik cepat, atau kembali ke lokasi lama tidak menggandakan progress. Frontend juga menahan request duplikat agar trafik lebih ringan.

Tabel lama `user_progress` tetap dipertahankan sebagai ringkasan persentase per planet untuk kompatibilitas.

## Halaman progress

`progress.html` menampilkan:

- persentase keseluruhan akun;
- jumlah milestone selesai dari 130;
- jumlah objek yang sudah mulai dijelajahi;
- jumlah objek yang sudah 100%;
- persentase dan rincian setiap objek;
- jumlah topik Jelajah biasa;
- jumlah destinasi Eksplorasi Penuh jika tersedia;
- status belum dimulai, sedang dijelajahi, atau selesai.

Halaman juga mempunyai state khusus untuk akun belum login, akun baru tanpa progress, dan kegagalan database.
