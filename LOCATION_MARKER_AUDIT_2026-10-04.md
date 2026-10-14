# LOCATION / PETUNJUK AUDIT – 2026-10-04

Fokus audit: cek satu per satu topik planet yang sedang dibahas, terutama **petunjuk lokasi / marker** dan **konteks gambar**.

## Ringkasan perubahan utama

### Sudah dicek
- Mercury
- Venus
- Earth
- Mars
- Jupiter
- Saturn
- Uranus
- Neptune
- Asteroid Belt
- Sun

### Perubahan yang diterapkan pada pass ini
1. **Jupiter**
   - Penyesuaian anchor Great Red Spot agar petunjuk tidak asal dan lebih masuk dengan fokus tampilan topik badai.

2. **Saturn**
   - Menambah marker spesifik untuk:
     - Titan
     - Enceladus
     - Cassini-Huygens
   - Menambah anchor objek agar reticle bisa menunjuk objek yang memang sedang dibahas.

3. **Uranus**
   - Menambah sistem focus reticle baru di scene Uranus.
   - Menambah petunjuk untuk:
     - Miranda
     - Titania & Oberon
   - Label marker dan konteks ikut ditampilkan.

4. **Neptune**
   - Marker storm diperjelas untuk **Great Dark Spot**.
   - Menambah petunjuk untuk **Triton**.
   - Label reticle sekarang menyesuaikan konteks topik aktif.

## Catatan audit
- Topik yang sifatnya **konsep umum** (mis. ukuran, komposisi, rotasi, interior umum) tidak semua diberi marker karena memang tidak menunjuk satu titik fisik spesifik.
- Topik yang **punya objek / area / target visual spesifik** diprioritaskan untuk marker.
- Planet batuan yang memang sudah memakai sistem location marker (Mercury, Venus, Earth, Mars) dipertahankan.

## File yang diubah
- `jupiter-scene.js`
- `saturn-scene.js`
- `uranus-scene.js`
- `uranus-scene.css`
- `neptune-scene.js`
- `index.html`

## Verifikasi yang dilakukan
- `node --check jupiter-scene.js`
- `node --check saturn-scene.js`
- `node --check uranus-scene.js`
- `node --check neptune-scene.js`
- cek elemen HTML baru via parser (`index.html`)
