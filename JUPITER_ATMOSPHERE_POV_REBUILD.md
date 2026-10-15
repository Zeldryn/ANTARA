# Jupiter Full Exploration, Atmospheric POV Rebuild

Tanggal audit: 5 Oktober 2026

## Tujuan

Jupiter Full Exploration diubah dari mode inspeksi planet menjadi pengalaman 3D POV yang benar-benar berada di dalam atmosfer. Venus tetap menjadi baseline fitur dan perilaku UI. Karena Jupiter tidak memiliki permukaan sejati, pemain tidak mendarat di tanah. Pemain terbang bebas, turun ke lapisan awan yang lebih dalam, membaca tekanan simulasi, mendekati titik observasi, dan dibatasi oleh volume eksplorasi yang dibuat sengaja agar performa tetap terkendali.

## Dasar sains

Implementasi mengambil konsep dari NASA dan JPL, lalu mengompres skala dunia nyata menjadi volume permainan yang kecil dan dapat dijelajahi.

- Jupiter sebagian besar tersusun atas hidrogen dan helium serta tidak memiliki permukaan sejati.
- Tiga lapisan awan utama diperkirakan terdiri dari es amonia, ammonium hydrosulfide, lalu awan air yang lebih dalam.
- Belt dan zone dibentuk oleh aliran atmosfer timur-barat yang kuat.
- Great Red Spot adalah anticyclone besar. Data Juno membatasi kedalamannya sekitar 500 km di bawah puncak awan.
- Juno menemukan shallow lightning yang melibatkan campuran amonia dan air, serta mekanisme mushball yang dapat membawa material lebih dalam.
- Galileo Atmospheric Probe memasuki atmosfer Jupiter pada 7 Desember 1995 dan mengirim data selama sekitar 58 menit.

Sumber yang digunakan di dalam konten eksplorasi:

- https://science.nasa.gov/jupiter/jupiter-facts/
- https://www.jpl.nasa.gov/news/nasas-juno-science-results-offer-first-3d-view-of-jupiter-atmosphere/
- https://www.jpl.nasa.gov/news/shallow-lightning-and-mushballs-reveal-ammonia-to-nasas-juno-scientists/
- https://science.nasa.gov/mission/galileo-jupiter-atmospheric-probe/
- https://www.jpl.nasa.gov/images/pia24298-high-flying-cloud-in-jupiters-atmosphere/
- https://science.nasa.gov/photojournal/a-jupiter-circumpolar-cyclone/

## Fitur baru

- Renderer WebGL terpisah khusus Jupiter Full Exploration.
- Gerakan POV bebas dengan WASD atau tombol arah.
- Q untuk turun, E untuk naik, Shift untuk boost.
- Click and drag untuk melihat sekeliling tanpa pointer lock, sehingga kursor tetap tersedia.
- Kontrol mobile untuk gerak dan perubahan ketinggian.
- HUD kedalaman relatif, lapisan awan, kecepatan simulasi, tekanan simulasi, wilayah, dan kualitas grafis.
- Volume map dibatasi dengan soft boundary. Kabut makin tebal dan pemain didorong kembali sebelum keluar dari area permainan.
- Lapisan atmosfer berubah menurut ketinggian: awan amonia, lapisan menengah NH4SH, dan awan air yang lebih dalam.
- Turbulensi, streak awan, cloud particles, dan variasi atmosfer per wilayah.
- Pilihan kualitas LOW, MEDIUM, HIGH.
- Penyimpanan discovery per wilayah menggunakan localStorage.
- Exit transition tetap merender dunia saat kamera mundur dan naik sebelum resource dibersihkan.

## Lima wilayah eksplorasi

1. Great Red Spot
2. Sabuk dan Zona Awan
3. Badai Petir Jovian
4. 5-Micron Hot Spot
5. Siklon Kutub

Masing-masing wilayah memiliki tiga titik observasi. Total ada 15 discovery point dengan penjelasan, fakta, dan sumber sains.

## Parity terhadap Venus

Verifier membandingkan kategori fitur utama Jupiter terhadap implementasi Venus. Semua kategori berikut terdeteksi tersedia:

- Quality selection
- Region selection
- Free movement
- Look control
- Objectives
- Observation/discovery interaction
- Info card
- Boundary gimmick
- Loading state
- Error fallback
- Responsive panels
- Exit transition

## Bug yang dibereskan saat audit

- Full Exploration lama hanya memindahkan renderer panorama/orbit ke overlay. Sekarang menggunakan dunia atmosfer sendiri.
- Tidak ada lagi konsep tanah palsu atau landing surface pada Jupiter.
- Pointer lock tidak digunakan, sehingga kursor tidak tiba-tiba hilang saat membuka informasi.
- Panel Info dan Objectives di mobile dibuat saling menutup agar tidak bertabrakan.
- UI error fallback ditambahkan untuk kegagalan WebGL atau inisialisasi world.
- Canvas lama tidak dipakai ulang sebagai map Full Exploration, mengurangi konflik lifecycle antar mode.
- Resource Three.js world dan renderer dibersihkan ketika keluar atau pindah wilayah.
- Boundary hard clamp ditambah di belakang soft boundary untuk mencegah kamera keluar dari volume simulasi.
- Semua ID DOM yang dipakai script diverifikasi ada dan tidak memiliki duplikat di index.html.
- Semua aset lokal baru yang direferensikan diverifikasi tersedia.

## Verifikasi

Perintah regression test:

```bash
node --check jupiter-full-exploration.js
node tools/verify_jupiter_atmosphere.cjs
```

Hasil terakhir:

```text
destinations: 5
observations: 15
qualitySelection: true
regionSelection: true
freeMovement: true
lookControl: true
objectives: true
observations: true
infoCard: true
boundaryGimmick: true
loading: true
errorFallback: true
responsivePanels: true
exitTransition: true
pass: true
```

Runtime browser otomatis sempat dicoba melalui Chromium. Environment pengujian memblokir akses localhost, private IP, dan file URL melalui policy organisasi, jadi hasil browser runtime tidak diklaim sebagai lulus. Static checks dan regression verifier di atas lulus.
