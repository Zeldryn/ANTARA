# ANTARA | branding + animated cockpit companions

## Ringkasan terbaru
Opening sekarang menggunakan identitas **ANTARA / Antariksa Nusantara** dan perjalanan peluncuran first-person dari dalam kokpit. Implementasi tidak memakai karakter PNG statis, video background, atau third-person rocket shot. Dua karakter companion adalah rig SVG berlapis yang dianimasikan per bagian dan berbicara melalui speech bubble yang mengikuti timeline perjalanan.

### Branding
- Primary logo text: `ANTARA`.
- Expanded name: `Antariksa Nusantara`.
- `<title>`: `ANTARA | Antariksa Nusantara`.
- Metadata, aria label logo, homepage, kokpit, dan status peluncuran sudah konsisten.
- API internal lama `window.AntariksaUIAudio` dipertahankan sebagai compatibility bridge karena bukan identitas visual dan dipakai shared media system.

### Character animation technique
- Layered inline SVG.
- Layer terpisah: body, head, hair back/front/strand, eyes, pupils, three mouth frames, arms, pointing gesture, seatbelt, patch.
- Idle: body breathing, independent head motion, hair sway.
- Blink: timer acak sekitar 2–6 detik dengan peluang double blink ringan.
- Talking: mouth closed/half/open berganti frame dan head talk motion.
- Launch: body shifts dengan acceleration lag yang berbeda dari camera.
- Clouds: turbulence state menggerakkan head/hair lebih kuat.
- Earth reveal: character state berubah menjadi looking-earth / pointing.

### Dialogue timeline
1. Nara: “Ayo, kita jelajah bersama!”
2. Aksa: “Tujuan pertama kita dekat banget. Bumi!”
3. Nara: “Wah, mesinnya mulai nyala!”
4. Aksa: “Pegangan, ya. Kita segera berangkat!”
5. Nara: “Kita terbang!”
6. Aksa: “Lihat awannya!”
7. Nara: “Wah, putih semua!”
8. Aksa: “Kita sudah makin tinggi!”
9. Nara: “Eh, lihat di depan!”
10. Aksa: “Itu Bumi! Rumah kita.”
11. Nara: “Yuk, kita lihat lebih dekat!”

Dialog berasal dari satu `DIALOGUE_TIMELINE` dan dipicu berdasarkan `LAUNCH_TIMING`, bukan timeout acak yang terpisah dari perjalanan.

### First-person environment
- Tidak ada external rocket shot di opening/launch.
- Front-window world berisi horizon, multiple cloud layers, atmosfer, bintang, dan Earth reveal.
- Cockpit frame/dashboard mempunyai transform sendiri.
- Camera shake, character lag, dan cloud motion menggunakan amplitudo berbeda sehingga depth tidak terasa seperti satu gambar digeser bersama.
- Saat `prefers-reduced-motion`, shake/parallax dikurangi tanpa menghilangkan dialog/progres.

### Earth handoff
Pada fase `approach`, Earth renderer existing dimulai di belakang cockpit. `--handoff` kemudian menurunkan prominence cockpit dan companion sementara Earth mendominasi view. Setelah timeline selesai, launch layer fade singkat lalu dilepas. Existing Earth scene tetap menjadi source of truth setelah handoff.

### Planet systems
Renderer Earth/Venus/Mars, lokasi/marker, exploration cards, image previews, lightbox, Venus travel surface fix, dan Mars content order tidak dibangun ulang. Perubahan utama berada di `index.html`, `styles.css`, dan `script.js`.

---

# Refinement marker visual Earth + Mars

## Ringkasan terbaru
Refinement ini memindahkan visual eksplorasi dari board kiri ke annotation marker untuk **dua planet sekaligus: Bumi dan Mars**. Rendering planet, tekstur, koordinat, animasi perjalanan antarplanet, dan identitas visual navy/emas yang sudah ada tidak diganti. Board kiri sekarang kembali menjadi area informasi yang dominan teks.

### Berkas diubah
- `index.html`
- `exploration-media.js`
- `exploration-media.css`
- `earth-scene.js`
- `earth-scene.css`
- `mars-scene.js`
- `mars-scene.css`
- `tools/verify_media.cjs`
- `IMPLEMENTATION.md`

### Perilaku baru
- Figure gambar besar di card Mars juga dihapus.
- `#earth-marker-media` menempel pada marker landmark Bumi.
- `#mars-marker-media` menempel pada reticle titik eksplorasi Mars.
- Satu pilihan aktif menampilkan maksimal dua frame visual: foto utama dan foto pendukung. Data mendukung `secondaryImage` / `secondaryImageAlt`; bila belum tersedia, frame kedua memakai crop detail dari foto lokal yang sama sehingga tidak mengarang aset baru.
- Pergantian topik merender ulang preview, lalu preview tetap tersembunyi selama planet bergerak dan muncul setelah marker mencapai posisi yang stabil.
- Posisi preview membalik ke kiri saat ruang kanan sempit, berpindah ke bawah bila marker terlalu dekat bagian atas, dan pada layar sempit pusat cluster dikunci agar tetap berada di viewport.
- Credit/lisensi gambar tetap tersedia sebagai teks kecil di board melalui `#earth-photo-source` dan `#mars-photo-source`.
- Marker Mars sekarang menampilkan nama lokasi serta koordinat ringkas, lalu memakai sistem preview yang sama dengan Earth.

### CSS penting
Shared: `.exploration-marker-media`, `.exploration-marker-gallery`, `.exploration-marker-frame`, `.exploration-marker-status`, `.exploration-marker-meta`, `.exploration-photo-source`.

Earth: `.earth-location-dot.is-left`, `.earth-location-dot.is-below`, dan aturan marker-media di dalam `.earth-location-dot`.

Mars: `.mars-focus-title`, `.mars-focus-context`, `.mars-focus-reticle.is-marker-visible`, `.mars-focus-reticle.is-relocating`, `.mars-focus-reticle.is-left`, `.mars-focus-reticle.is-below`, dan aturan marker-media di dalam `.mars-focus-reticle`.

### JavaScript penting
- `ExplorationMedia.render(prefix, stop)` sekarang merender ke marker-side host, bukan ke card.
- `EarthScene.positionMarker()` menambah adaptive left/below placement tanpa mengubah rumus koordinat atau rotasi Bumi.
- `EarthScene.setExplorationStop()` menjaga link attribution gambar sebagai teks di card.
- `MarsScene.setExplorationStop()` merender preview marker, mengisi koordinat context, dan menyembunyikan marker lama saat perpindahan.
- `MarsScene.topicIsSettled()` menentukan kapan marker/preview baru boleh muncul.
- `MarsScene.setReticleProjection()` menangani reveal setelah settle dan adaptive left/below/clamped placement.

### Validasi build
- `node --check` lulus untuk `exploration-media.js`, `earth-scene.js`, `mars-scene.js`, `script.js`, dan `tools/verify_media.cjs`.
- `index.html` berhasil diparse.
- `styles.css`, `exploration-media.css`, `earth-scene.css`, dan `mars-scene.css` berhasil diparse dengan `tinycss2` tanpa syntax error.
- DOM lama `earth-topic-media` / `mars-topic-media` sudah tidak ada; host marker baru untuk Earth dan Mars tersedia.
- Renderer/tekstur planet dan jalur navigasi antarplanet tidak diganti.

---

# Penambahan foto eksplorasi Bumi dan Mars

## Berkas
- Diubah: `index.html`, `earth-scene.js`, `mars-scene.js`, `README.md`, `IMPLEMENTATION.md`.
- Baru: `exploration-media.js`, `exploration-media.css`, `assets/exploration/` (13 WebP, `sources.json`, `README.md`), `tools/verify_media.cjs`.
- Renderer planet, shader, tekstur globe, transisi perjalanan, dan sistem koordinat tidak diganti.

## Layout dan data
Foto berada di awal area scroll yang sudah ada, di bawah judul/lokasi. Header, sumber pengetahuan, navigasi, dan tombol kembali tetap berada di luar area scroll. Ukuran kartu tetap memakai aturan proyek sebelumnya. Foto dibatasi 100–140 px pada desktop dan 100 px pada ponsel/laptop pendek. `object-fit: contain` mempertahankan gambar utuh tanpa distorsi; frame navy mengisi ruang kosong.

Tujuh wonder Bumi dan enam topik Mars mendapat field `image`, `imageAlt`, `imageCaption`, `imageCredit`, `imageSource`, `imageLicense`, `imageLicenseUrl`, `imageFit`, `imageWidth`, `imageHeight`. Field sejarah, fakta, negara, koordinat, dan sumber sebelumnya dipertahankan. Empat topik sains Bumi tetap tanpa foto tambahan.

## Gambar asli

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
setelah tombol `Jelajahi Bumi` ditekan. Ada 14 topik: enam konsep/sistem Bumi, enam Rekor & Ekstrem berbasis lokasi nyata, sistem Bumi–Bulan, dan habitabilitas. Slide non-lokasi memakai diagram/visualisasi, sedangkan slide lokasi mempertahankan rotasi globe, marker, callout, dan koordinat nyata.

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
| Kristus Penebus | -22.9519 | -43.2105 |

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
- Kristus Penebus: https://world.new7wonders.com/wonders/cristo-redentor-1931-rio-de-janeiro-brazil/

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

## Rekor & Ekstrem Bumi

Earth exploration kini memakai tujuh stop bertema **Rekor & Ekstrem**: satu intro
planet aktif dan enam lokasi alam yang dapat dipetakan pada globe. Cabang landmark
buatan manusia dihapus dari data, marker, UI, listener, manifest media, dan aset.

Arsitektur Earth yang sudah matang tetap dipakai: globe 3D, rotasi halus menuju
koordinat, marker terjangkar, callout, panel informasi, media pendukung, lightbox,
serta transisi panorama dan eksplorasi.

Stop yang dipakai adalah Mount Everest, Challenger Deep, Mauna Kea, Vostok,
Furnace Creek, dan Danau Baikal. Setiap kartu menjelaskan definisi rekornya agar
perbandingan tidak menyesatkan. Challenger Deep memakai visual batimetri, bukan
foto optik dasar laut.

Media Earth memakai foto, citra satelit, atau visual ilmiah autentik dengan sumber
dan kredit. Label **REKOR & EKSTREM** juga dipakai secara selektif pada satu topik
ekstrem yang sudah ada di Sun, Mercury, Venus, Mars, Asteroid Belt, Jupiter,
Saturn, Uranus, dan Neptune tanpa mengubah jumlah slide atau sistem interaksi
masing-masing objek.

## Earth: Rekor & Ekstrem Bumi

Earth exploration now uses seven stops: an active-Earth introduction followed by Mount Everest, Challenger Deep, Mauna Kea, Vostok Antarctica, Furnace Creek, and Lake Baikal. The existing globe rotation, latitude/longitude marker anchoring, callout, marker-side media, zoom lightbox, and panorama/info transitions are reused.

The content intentionally distinguishes measurement definitions: Everest is highest above mean sea level, Mauna Kea is compared base-to-summit, and Challenger Deep is measured below sea level. Mariana imagery is bathymetry, not a fabricated optical trench photo.

`REKOR & EKSTREM` is also used as a recurring kicker on one existing educational stop for the Sun, Mercury, Venus, Mars, Asteroid Belt, Jupiter, Saturn, Uranus, and Neptune without forcing identical physical feature categories.
