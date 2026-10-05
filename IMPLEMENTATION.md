# Penambahan foto eksplorasi Bumi dan Mars

## Berkas
- Diubah: `index.html`, `earth-scene.js`, `mars-scene.js`, `README.md`, `IMPLEMENTATION.md`.
- Baru: `exploration-media.js`, `exploration-media.css`, `assets/exploration/` (13 WebP, `sources.json`, `README.md`), `tools/verify_media.cjs`.
- Renderer planet, shader, tekstur globe, transisi perjalanan, dan sistem koordinat tidak diganti.

## Layout dan data
Foto berada di awal area scroll yang sudah ada, di bawah judul/lokasi. Header, sumber pengetahuan, navigasi, dan tombol kembali tetap berada di luar area scroll. Ukuran kartu tetap memakai aturan proyek sebelumnya. Foto dibatasi 100–140 px pada desktop dan 100 px pada ponsel/laptop pendek. `object-fit: contain` mempertahankan gambar utuh tanpa distorsi; frame navy mengisi ruang kosong.

Tujuh wonder Bumi dan enam topik Mars mendapat field `image`, `imageAlt`, `imageCaption`, `imageCredit`, `imageSource`, `imageLicense`, `imageLicenseUrl`, `imageFit`, `imageWidth`, `imageHeight`. Field sejarah, fakta, negara, koordinat, dan sumber sebelumnya dipertahankan. Empat topik sains Bumi tetap tanpa foto tambahan.

## Gambar asli
Semua gambar disimpan lokal. Tidak ada placeholder atau gambar generatif. Foto Seven Wonders berasal dari Wikimedia Commons dengan kredit/lisensi per gambar. Citra Mars berasal dari NASA: Olympus Mons (Viking), Valles Marineris (Viking), delta Jezero (MRO, warna olahan), tudung es utara (Viking), senja Gale (Curiosity, warna diproses), dan perbandingan badai debu Juni/Juli 2001 (MGS). Daftar sumber lengkap di `assets/exploration/sources.json`.

## CSS
Selector baru: `.exploration-media`, `.exploration-media-frame`, `.exploration-media-status`, `.exploration-media figcaption`, tautan kredit serta state `[hidden]` dan `:focus-visible`. Media query menyesuaikan gambar pada lebar ≤700 px atau tinggi ≤700 px. Warna navy, aksen emas, serif, garis tipis, dan gaya navigasi sebelumnya dipertahankan.

## JavaScript
`ExplorationMedia.render(prefix, stop)` dipakai bersama oleh `EarthScene.setExplorationStop()` dan `MarsScene.setExplorationStop()`. Setiap pergantian membuat node gambar baru sehingga respons load/error lama tidak mengubah slide baru. Memakai alt Indonesia, dimensi eksplisit, decoding async, dan lazy loading. Kegagalan gambar menampilkan pesan singkat tanpa ikon rusak; teks dan sumber tetap terbaca. Topik tanpa gambar menyembunyikan figure.

## Verifikasi
- Ketiga belas aset lokal berhasil dimuat dan memiliki alt text.
- Tujuh pasangan landmark/negara, sejarah, fakta, dan bendera tetap benar.
- Diuji pada 1440×900, 1366×600, 390×844, dan 375×667.
- Kartu, sumber dan navigasi berada dalam viewport; konten panjang tetap scroll internal.
- Pergantian cepat, error gambar, dan pemulihan ke gambar valid berhasil.
- Perjalanan Bumi ke Mars dan kembali, eksplorasi Mars, rotasi serta anotasi Bumi berhasil.
- Mode reduced motion dan animasi normal diperiksa. Tidak ada JavaScript page error.
- Gambar dan screenshot desktop/mobile diperiksa visual.

## Isi ZIP
Proyek lengkap beserta aset lokal, dokumentasi, dan skrip verifikasi. Cache browser, node_modules untuk QA, dan file sementara tidak dimasukkan. Kompresi ZIP dan WebP menjaga ukuran kecil tanpa menghapus aset yang dibutuhkan situs.

---

# Implementasi eksplorasi Bumi

Bumi kini membuka intro `Bumi.` dan `Si Planet Biru.`. Kartu fakta baru muncul
setelah tombol `Jelajahi Bumi` ditekan. Ada 11 topik: empat fakta sains dan tujuh
keajaiban dunia modern pilihan New7Wonders 2007. Tombol Venus tetap nonaktif
karena planet tersebut belum tersedia dalam proyek sumber.

## Berkas dan sistem yang digunakan

- `index.html`: intro Bumi mengikuti markup hero Mars; kartu eksplorasi Bumi
  memiliki ID sendiri, judul topik, area scroll, sumber, panah, indikator dan
  tombol kembali. Ditambahkan elemen titik lokasi emas.
- `earth-scene.js`: menambahkan `EARTH_EXPLORATION_STOPS`, state `exploring`,
  `topicIndex`, `pose`, `poseTarget`, serta fungsi `wake`, `enterExploration`,
  `exitExploration`, `setExplorationStop`, `applyEarthPose`, `updateMarker`.
  `start`, `stop`, perjalanan antarplanet, `tick`, dan `renderEarth` disesuaikan
  untuk menjaga state intro/eksplorasi. Canvas memakai pemetaan bola seperti Mars.
- `earth-scene.css`: tambahan `.earth-caption`, `.earth-exploration`,
  `.earth-scene.is-exploring`, `.earth-scene.is-leaving`,
  `#earth-topic-progress button`, `.earth-location-dot`, dan aturan layar pendek.
  Kelas presentasi `mars-caption`, `mars-exploration`, `mars-topic-*` tetap dipakai
  bersama sehingga proporsi, tipografi, navigasi dan scroll mengikuti Mars.
- `script.js`: panah kiri/kanan mengubah topik saat eksplorasi Bumi aktif;
  Escape kembali ke panorama Bumi. Di luar mode itu, perilaku perjalanan tetap.
- `README.md`: petunjuk menjalankan dan alur diperbarui.
- `tools/verify_earth.cjs`: uji regresi browser untuk fitur baru.
- `IMPLEMENTATION.md`: laporan perubahan dan validasi ini.

Renderer Three.js, tekstur Blue Marble, tekstur Mars, animasi peluncuran,
perjalanan kamera, audio, dan aset lokal dipertahankan. `mars-scene.js`,
`mars-scene.css`, `styles.css`, serta semua aset identik dengan ZIP sumber.

## Koordinat dan orientasi

Setiap topik menyimpan judul, subtitle, ringkasan, fakta, nama sumber, URL sumber,
dan `location` (null untuk topik global). Lokasi memakai derajat desimal:
latitude positif ke utara, longitude positif ke timur.

| Lokasi | Latitude | Longitude |
| --- | ---: | ---: |
| Tembok Besar Tiongkok, Badaling | 40.354 | 116.006 |
| Petra | 30.3285 | 35.4444 |
| Kristus Penebus | -22.9519 | -43.2105 |
| Machu Picchu | -13.1631 | -72.5450 |
| Chichén Itzá | 20.6843 | -88.5678 |
| Colosseum | 41.8902 | 12.4922 |
| Taj Mahal | 27.1751 | 78.0421 |

Tekstur asli menggunakan pemetaan equirectangular standar, dengan Greenwich di
tengah. Setelah diubah ke radian, titik lokal pada SphereGeometry adalah
`(cos(lat)*cos(lon), sin(lat), -cos(lat)*sin(lon))`.
Target yaw adalah `-PI/2-longitude`, pitch adalah latitude, dan roll adalah nol.
Urutan rotasi `Rz * Rx * Ry` (Euler `ZXY`, dikonversi menjadi quaternion oleh
Three.js) menempatkan titik ke depan globe (+Z), pada bagian yang menghadap kamera.
Ini menggunakan satu rumus untuk semua lokasi, tanpa sudut buatan per landmark.

Yaw dibungkus ke sudut terdekat dari orientasi saat ini. Damping eksponensial
`1-exp(-delta*3.5)` dalam loop animasi yang sama membuat perpindahan halus.
Klik baru mengganti target yang sedang dituju, tanpa membuat loop tambahan.
Mode reduced motion langsung menyelesaikan orientasi. Titik emas diproyeksikan
dari koordinat dunia ke layar, dan muncul ketika lokasi menghadap depan serta
rotasi hampir selesai. Topik global memakai putaran panorama perlahan.

## Konten dan sumber

Keempat topik Bumi mempertahankan informasi air sekitar 71%, atmosfer yang
didominasi nitrogen/oksigen, dan satu-satunya planet dengan kehidupan yang
sejauh ini diketahui. Sumber tampil kecil di bawah isi kartu dan tetap terlihat.

- Sains Bumi: https://science.nasa.gov/earth/facts/
- Daftar tujuh keajaiban: https://world.new7wonders.com/lisbon-on-07-07-2007/
- Tembok Besar: https://whc.unesco.org/en/list/438/
- Petra: https://whc.unesco.org/en/list/326/
- Kristus Penebus: https://world.new7wonders.com/wonders/cristo-redentor-1931-rio-de-janeiro-brazil/
- Machu Picchu: https://whc.unesco.org/en/list/274/
- Chichén Itzá: https://whc.unesco.org/en/list/483/
- Colosseum: https://colosseo.it/en/area/the-colosseum/
- Taj Mahal: https://whc.unesco.org/en/list/252/

## Validasi

Diuji di Chromium dengan WebGL melalui server HTTP lokal:

- Intro Bumi muncul tanpa kartu fakta; tombol Jelajahi Bumi membuka eksplorasi.
- Semua 11 topik dapat dipilih, termasuk tujuh keajaiban dengan informasi sumber.
- Ketujuh lokasi diuji menggunakan normal permukaan setelah rotasi:
  komponen depan `z > 0.999` setelah animasi, dan marker muncul.
- Mengubah pilihan berulang ketika rotasi berlangsung berakhir di target terakhir.
- Panah keyboard mengubah fakta, bukan memicu perjalanan ke Mars.
- Kembali ke panorama, Bumi ke Mars, eksplorasi Mars, topik Mars berikutnya,
  dan Mars kembali ke intro Bumi berhasil; tidak ada error JavaScript.
- Kartu diuji pada 1440x900, 1366x600, 390x844, dan 375x667.
- Uji peluncuran melalui tombol asli berhasil mencapai intro Bumi.
- Pada 375x667, bagian bawah kartu berada di y=592, di atas footer y=608.
  Area isi tetap bisa di-scroll; judul, sumber dan kontrol tetap di luar scroll.
- Reduced motion dan Canvas fallback dengan tekstur lokal melalui HTTP berhasil.
- Sintaks JavaScript diperiksa dengan `node --check`.

Untuk menjalankan uji regresi baru, sediakan Playwright dan Chromium pada
lingkungan pengujian, lalu jalankan `node tools/verify_earth.cjs`.
`BROWSER_EXECUTABLE` dapat menunjuk executable Chromium; `PYTHON` dapat menunjuk
Python. Screenshot uji masuk ke `.tmp`, bukan aset website.
Tidak ada dependensi baru untuk menjalankan website.

Jalankan website lewat Python HTTP server atau XAMPP untuk fitur lengkap.
Pembukaan langsung lewat `file://` dapat memblokir ES module dan pembacaan
piksel tekstur oleh browser. Dalam kondisi itu fallback CSS masih menampilkan
planet dan kartu, tetapi tidak menjamin rotasi latitude yang presisi.
Fallback CSS paling akhir juga digunakan jika gambar atau Canvas tidak tersedia.

ZIP hasil memuat proyek lengkap beserta asetnya. Cache browser dan screenshot
sementara dari ZIP sumber tidak disertakan karena tidak digunakan website.

## Penyempurnaan label dan sejarah tujuh keajaiban

Berkas diubah: `index.html`, `earth-scene.js`, `earth-scene.css`, dan laporan ini.
Aset baru: tujuh SVG dalam `assets/flags/`, beserta README dan lisensi MIT
flag-icons 7.5.0. Tidak ada framework, dependensi runtime, atau permintaan CDN baru.

Data tiap keajaiban kini menambahkan `displayCountry`, `cityOrRegion`, `history`,
dan `flag`. `summary` tetap menjadi overview; koordinat tetap berada di `location`.
Masing-masing kartu memuat tiga fakta singkat. Negara pada globe memakai bahasa
Indonesia: Tiongkok, Yordania, Brasil, Peru, Meksiko, Italia, India.

Label globe memiliki titik, cincin, garis penghubung, nama tempat, dan nama negara.
Label muncul setelah rotasi selesai mendekati tujuan, disembunyikan langsung saat
berpindah tujuan, dan diletakkan di atas titik pada ponsel. Bendera hanya tampil
kecil di samping lokasi dalam kartu, bukan pada globe. Bendera menggunakan SVG
lokal agar konsisten di Windows dan tidak bergantung pada dukungan emoji.

Sejarah yang ditambahkan:

| Tempat | Latar sejarah dalam kartu |
| --- | --- |
| Tembok Besar Tiongkok | Penyatuan benteng oleh Qin Shi Huang, pembangunan lintas dinasti sampai Ming, fungsi pertahanan. |
| Petra | Ibu kota Nabatea dan jaringan perdagangan kafilah pada masa Helenistik dan Romawi. |
| Kristus Penebus | Pembangunan 1922–1931, Paul Landowski dan Heitor da Silva Costa, makna keagamaan dan budaya. |
| Machu Picchu | Pembangunan Inka abad ke-15, ruang upacara, hunian, pertanian, dan teknik tata ruang. |
| Chichén Itzá | Asal kota Maya periode Klasik, perkembangan bangunan abad ke-6 sampai ke-10 dan pengaruh Meksiko tengah. |
| Colosseum | Dinasti Flavia abad pertama Masehi, pertarungan gladiator, pertunjukan publik dan teknik Romawi. |
| Taj Mahal | Shah Jahan dan Mumtaz Mahal, makam selesai 1648, bangunan pelengkap sampai 1653. |

Sumber institusional tetap terdapat pada setiap kartu. Tautan sumber di bagian
sebelumnya digunakan untuk memeriksa sejarah dan fakta tambahan.

CSS baru: `.earth-topic-meta`, `.earth-country-flag`, `.earth-history`,
`.earth-content-heading`, `.earth-location-ring`, `.earth-location-line`,
`.earth-location-label`, `.earth-location-title`, `.earth-location-country`.
`.earth-location-dot` mendapatkan state `.is-relocating` dan `.is-left`.

JavaScript: `setExplorationStop` mengisi metadata, sejarah, fakta, dan label;
`positionMarker` menyatukan penempatan anotasi WebGL/Canvas;
`updateMarker` dan `drawCanvasEarth` memakainya. Pemilihan reduced motion
menerapkan orientasi langsung. ResizeObserver menjaga ukuran renderer sesuai
kotak scene setelah perubahan ukuran viewport. Rumus koordinat, aset planet,
renderer utama, navigasi dan animasi perjalanan dipertahankan.

Validasi browser mencakup ketujuh pasangan nama/negara, pemuatan bendera,
sejarah, jumlah fakta, normal/reduced motion, pergantian target, scroll internal,
Canvas fallback, dan navigasi menuju eksplorasi Mars. Identitas navy/emas,
ukuran kartu, tipografi, dan komposisi desktop dipertahankan.
