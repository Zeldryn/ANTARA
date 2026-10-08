"use strict";

/*
 * ANTARA · Venus Full Exploration
 *
 * Rebuilt from scratch around two existing ANTARA references:
 * - Mars Full Exploration: camera, input, pointer lock, HUD/action lifecycle,
 *   fullscreen, entry/exit transition language, adaptive DPR and view culling.
 * - Earth Full Exploration: choose a destination before terrain is loaded and
 *   return to the destination selector without leaving the planet.
 *
 * Scientific topography remains the base terrain. A restrained, explicitly
 * reference-guided morphology layer reinforces destination-scale geological
 * signatures where the available runtime dataset is too coarse to communicate
 * them clearly. It is never labelled as measured elevation. Exactly one
 * high-detail region is interactive at a time, while lower-LOD terrain
 * continues far beyond the collision boundary.
 */

(() => {
  const DEG = Math.PI / 180;
  const VENUS_RADIUS_KM = 6051.8;
  const KM_PER_DEG_LAT = 2 * Math.PI * VENUS_RADIUS_KM / 360;
  const MAX_ALTITUDE_KM = 18;
  const MIN_CLEARANCE_KM = 0.12;
  const STATES = Object.freeze({
    IDLE: "idle",
    SELECTING: "selecting",
    PREPARING: "preparing",
    ENTERING: "entering",
    EXPLORING: "exploring",
    SWITCHING: "switching",
    EXITING: "exiting",
    ERROR: "error"
  });

  const REGIONS = Object.freeze([
    {
      id: "maat",
      name: "Maat Mons",
      short: "Maat Mons",
      category: "KAWASAN VULKANIK",
      latitude: 0.9,
      longitudeEast: 194.5,
      heading: 0,
      pitch: -0.08,
      spawn: { x: -22, z: 72, altitude: 2.25 },
      lookTarget: { x: 0, z: -38 },
      featureCenter: { x: 0, z: -38 },
      playRadius: 100,
      softBoundaryStart: 84,
      source: "https://science.nasa.gov/photojournal/venus-3-d-perspective-view-of-maat-mons-2/",
      coordinateSource: "https://planetarynames.wr.usgs.gov/Feature/3550",
      image: "https://assets.science.nasa.gov/dynamicimage/assets/science/psd/photojournal/pia/pia00/pia00254/PIA00254.jpg?crop=faces%2Cfocalpoint&fit=clip&h=1100&w=1400",
      descriptor: "Gunung api besar dengan lereng panjang, dataran retak, dan jejak aliran lava.",
      description: "Wilayah Maat Mons menonjolkan bentang vulkanik Venus: lereng luas, dataran yang terdeformasi, serta pola aliran yang dapat dibandingkan dengan citra radar Magellan.",
      facts: [
        "NASA/JPL menggambarkan Maat Mons sebagai gunung api besar yang menjulang sekitar 8 km di atas radius rata-rata Venus.",
        "Citra Magellan menunjukkan aliran lava yang memanjang jauh dari tubuh gunung api menuju dataran di sekitarnya.",
        "Analisis ulang citra Magellan menemukan sebuah lubang vulkanik di Maat Mons berubah bentuk dan membesar antara Februari dan Oktober 1991, bukti langsung aktivitas vulkanik pada Venus.",
        "Relief ANTARA memakai topografi sebagai bentuk makro, lalu menambahkan detail kecil hanya pada skala yang tidak disediakan data sumber."
      ],
      visualizationNote: "REFERENSI PIA00254 · Perspektif NASA/JPL memperbesar skala vertikal 22,5×. Full Exploration meniru bahasa morfologi Maat Mons tanpa menyalin pembesaran tinggi tersebut, dan tidak menampilkan lava aktif sebagai fakta.",
      palette: { low: 0x7b3f22, mid: 0xd39445, high: 0xf1c56c, accent: 0x64331d, rock: 0x45291b },
      fog: 0xa76537,
      fogDensity: 0.0100,
      sky: 0xb96d39,
      sun: 0xffdc96,
      hemi: 0xf2ad67,
      exposure: 1.04,
      education: {
        intro: "Jelajahi bentuk gunung api Venus, jejak aliran, bukti perubahan permukaan, dan kondisi lingkungan ekstrem di sekitar Maat Mons.",
        objectives: [
          { id: "lereng", label: "Amati bentuk lereng gunung api Venus", discovery: "maat-slope" },
          { id: "aliran", label: "Temukan jejak morfologi aliran lava", discovery: "maat-flow" },
          { id: "vent", label: "Pelajari bukti perubahan lubang vulkanik Maat Mons", discovery: "maat-vent" },
          { id: "atmosfer", label: "Pahami suhu dan tekanan permukaan Venus", discovery: "maat-atmosphere" }
        ],
        observations: [
          {
            id: "maat-slope", type: "TEMUAN GEOLOGI", title: "Lereng Gunung Api yang Sangat Luas",
            lead: "Di depan Anda, relief naik secara bertahap dan membentuk lereng yang jauh lebih luas daripada kerucut gunung api kecil di Bumi.",
            sections: [
              { heading: "YANG DILIHAT", text: "Perubahan ketinggian terjadi dalam jarak yang panjang. Bentuk seperti ini membantu kita membaca Maat Mons sebagai bangunan vulkanik besar, bukan bukit terisolasi." },
              { heading: "CARA TERBENTUK", text: "Aliran lava yang berulang dapat membangun tubuh gunung api yang lebar. Pada Venus, morfologi vulkanik dipelajari terutama dari radar dan topografi karena awan tebal menutupi permukaan." }
            ],
            why: "Kemiringan dan skala lereng membantu ilmuwan menafsirkan bagaimana material vulkanik menumpuk dan menyebar dari pusat erupsi.",
            deepDive: ["Bandingkan perubahan ketinggian di sekitar titik ini dengan dataran yang lebih jauh.", "Jangan menilai warna permukaan sebagai warna asli batuan. Visual ANTARA diberi pencahayaan dan warna untuk keterbacaan."],
            sourceLabel: "NASA/JPL · Magellan · Maat Mons", source: "https://science.nasa.gov/photojournal/venus-3-d-perspective-view-of-maat-mons-2/",
            anchor: { x: -24, z: -6 }, placement: "slope-medium"
          },
          {
            id: "maat-flow", type: "TITIK PENGAMATAN", title: "Jejak Aliran Lava",
            lead: "Pola relief yang memanjang dapat dibaca sebagai konteks aliran vulkanik yang menyebar dari kawasan Maat Mons menuju dataran sekitarnya.",
            sections: [
              { heading: "YANG DILIHAT", text: "Cari bagian permukaan yang lebih halus atau memanjang di antara relief yang lebih kasar. Pada citra radar, pola aliran dapat muncul berbeda karena kekasaran permukaan memengaruhi pantulan radar." },
              { heading: "PENTING UNTUK DIINGAT", text: "Kecerahan radar bukan ketinggian. Permukaan yang terang pada radar dapat disebabkan kekasaran, geometri pengamatan, dan sifat material." }
            ],
            why: "Membaca pola aliran membantu merekonstruksi sejarah vulkanisme tanpa harus melihat erupsi secara langsung.",
            deepDive: ["Magellan memetakan permukaan Venus dengan radar karena awan Venus menghalangi pengamatan biasa pada cahaya tampak.", "Topografi dan citra radar dipakai untuk pertanyaan yang berbeda dan tidak boleh dipertukarkan."],
            sourceLabel: "NASA/JPL · Magellan", source: "https://science.nasa.gov/image-detail/venus-2/",
            anchor: { x: 30, z: 28 }, placement: "flat"
          },
          {
            id: "maat-vent", type: "TEMUAN GEOLOGI", title: "Lubang Vulkanik yang Berubah pada 1991",
            lead: "Analisis citra Magellan dari dua waktu berbeda menunjukkan sebuah lubang vulkanik yang terkait dengan Maat Mons berubah bentuk dan membesar dalam delapan bulan.",
            sections: [
              { heading: "BUKTI PENGAMATAN", text: "Citra Februari dan Oktober 1991 memperlihatkan perubahan ukuran dan bentuk lubang vulkanik. Tim peneliti menafsirkan perubahan itu sebagai bukti langsung aktivitas vulkanik." },
              { heading: "BATAS VISUALISASI", text: "Titik ini tidak mengklaim bahwa bentuk kecil yang Anda lihat adalah lubang vulkanik yang sama persis. ANTARA memakai lokasi ini sebagai ruang belajar untuk memahami bukti Magellan." }
            ],
            why: "Perubahan pada dua citra waktu berbeda memberi bukti kuat bahwa Venus bukan dunia geologi yang sepenuhnya mati.",
            deepDive: ["Data lama dapat menghasilkan penemuan baru ketika dianalisis dengan metode dan pertanyaan yang lebih baik.", "Magellan mengamati permukaan dengan radar, bukan kamera cahaya tampak biasa."],
            sourceLabel: "NASA/JPL · Analisis Magellan 1991", source: "https://www.jpl.nasa.gov/news/nasas-magellan-data-reveals-volcanic-activity-on-venus/",
            anchor: { x: 3, z: -39 }, placement: "elevation-high"
          },
          {
            id: "maat-atmosphere", type: "DATA LINGKUNGAN", title: "Panas dan Tekanan di Permukaan",
            lead: "Permukaan Venus berada dalam lingkungan sekitar 467°C dengan tekanan atmosfer sekitar 93 kali tekanan permukaan laut Bumi.",
            sections: [
              { heading: "SUHU", text: "Atmosfer karbon dioksida yang sangat tebal mempertahankan panas melalui efek rumah kaca ekstrem. Venus menjadi planet dengan permukaan terpanas di Tata Surya." },
              { heading: "TEKANAN", text: "Tekanan permukaan yang sangat tinggi adalah salah satu alasan wahana pendarat Venus harus dirancang untuk lingkungan yang jauh lebih keras daripada Bumi atau Mars." }
            ],
            why: "Geologi Venus tidak dapat dipisahkan dari lingkungannya. Suhu, tekanan, dan atmosfer memengaruhi cara permukaan dipelajari dan bagaimana wahana dapat bertahan.",
            comparison: [{ label: "VENUS", value: "≈93 bar" }, { label: "BUMI", value: "≈1 bar" }],
            deepDive: ["NASA mencantumkan suhu permukaan sekitar 467°C dan tekanan sekitar 93 kali tekanan laut Bumi.", "Awan Venus mengandung tetesan asam sulfat, tetapi kondisi dekat permukaan didominasi atmosfer karbon dioksida yang sangat padat."],
            sourceLabel: "NASA Science · Fakta Venus", source: "https://science.nasa.gov/venus/venus-facts/",
            anchor: { x: -66, z: 42 }, placement: "open"
          },
          {
            id: "maat-magellan", type: "CARA ILMUWAN MENGETAHUI", title: "Mengapa Venus Dipetakan dengan Radar",
            lead: "Awan tebal Venus menutupi permukaan pada cahaya tampak. Magellan memakai radar untuk memperoleh pandangan global terhadap bentang permukaan.",
            sections: [
              { heading: "RADAR", text: "Gelombang radar dapat menembus selimut awan dan dipantulkan kembali oleh permukaan. Pola pantulan membantu mengungkap struktur geologi." },
              { heading: "BUKAN PETA KETINGGIAN LANGSUNG", text: "Pantulan radar yang terang tidak otomatis berarti tempat itu tinggi. Topografi memerlukan pengukuran ketinggian yang terpisah." }
            ],
            why: "Memahami cara data dibuat mencegah kita membaca citra radar seperti foto biasa atau menganggap kecerahan sebagai elevasi.",
            deepDive: ["Magellan memetakan sebagian besar permukaan Venus pada awal 1990-an.", "ANTARA memisahkan penggunaan topografi untuk bentuk makro dan radar untuk konteks permukaan."],
            sourceLabel: "NASA · Magellan", source: "https://science.nasa.gov/image-detail/venus-2/",
            anchor: { x: 72, z: -42 }, placement: "open"
          }
        ]
      }
    },
    {
      id: "maxwell",
      name: "Maxwell Montes",
      short: "Maxwell",
      category: "SABUK PEGUNUNGAN",
      latitude: 65.0,
      longitudeEast: 6.0,
      heading: -0.12,
      pitch: -0.15,
      spawn: { x: -26, z: 48, altitude: 2.85 },
      lookTarget: { x: -6, z: -20 },
      featureCenter: { x: -6, z: -20 },
      playRadius: 96,
      softBoundaryStart: 80,
      source: "https://science.nasa.gov/photojournal/venus-maxwell-montes-and-cleopatra-crater/",
      coordinateSource: "https://planetarynames.wr.usgs.gov/Feature/3766",
      image: "https://assets.science.nasa.gov/dynamicimage/assets/science/psd/photojournal/pia/pia00/pia00149/PIA00149.jpg?crop=faces%2Cfocalpoint&fit=clip&h=1100&w=1400",
      descriptor: "Dataran tinggi ekstrem dengan punggungan memanjang, lembah, dan relief kompresional.",
      description: "Maxwell Montes dibaca sebagai sistem pegunungan terdeformasi. Punggungan dan lembahnya memberi konteks kompresi kerak, sementara dataran tinggi Venus menunjukkan hubungan yang menarik antara elevasi dan pantulan radar.",
      facts: [
        "NASA menyebut Maxwell Montes sebagai pegunungan tertinggi di Venus, hampir 11 km di atas radius rata-rata planet.",
        "Punggungan dan lembah Maxwell serta Fortuna Tessera ditafsirkan konsisten dengan deformasi kompresional.",
        "Sebagian besar Maxwell sangat terang pada radar. Penyebab kimia tepat dari pantulan tinggi di dataran tinggi masih menjadi bidang penelitian."
      ],
      visualizationNote: "REFERENSI PIA00149 · Citra Maxwell adalah radar Magellan. Kecerahan radar tidak diperlakukan sebagai elevasi; Full Exploration mengikuti sabuk punggungan-lembah, lereng barat yang curam, transisi ke Fortuna, dan skala Cleopatra.",
      palette: { low: 0x59402f, mid: 0x98734f, high: 0xddb27a, accent: 0x6b4934, rock: 0x3f3028 },
      fog: 0x80583e,
      fogDensity: 0.0090,
      sky: 0x8d6548,
      sun: 0xffd19a,
      hemi: 0xdba071,
      exposure: 1.02,
      education: {
        intro: "Baca Maxwell Montes sebagai pegunungan tinggi yang terdeformasi: punggungan, perubahan elevasi, pantulan radar, dan kondisi atmosfer yang berubah dengan ketinggian.",
        objectives: [
          { id: "ridge", label: "Temukan punggungan yang menunjukkan kompresi", discovery: "maxwell-ridges" },
          { id: "height", label: "Amati perbedaan elevasi dataran tinggi", discovery: "maxwell-height" },
          { id: "radar", label: "Pelajari pantulan radar dataran tinggi", discovery: "maxwell-radar" },
          { id: "atmosphere", label: "Hubungkan elevasi dengan kondisi atmosfer", discovery: "maxwell-atmosphere" }
        ],
        observations: [
          {
            id: "maxwell-ridges", type: "TEMUAN GEOLOGI", title: "Punggungan dan Lembah Kompresional",
            lead: "Relief linear yang berulang memberi petunjuk bahwa kerak di wilayah Maxwell mengalami deformasi kuat.",
            sections: [
              { heading: "POLA YANG DICARI", text: "Amati punggungan yang memanjang dan lembah di antaranya. Pada data Magellan, pola serupa mendominasi Maxwell dan Fortuna Tessera." },
              { heading: "INTERPRETASI", text: "NASA menjelaskan bahwa punggungan dan lembah luas di Maxwell dan Fortuna konsisten dengan topografi yang terbentuk oleh kompresi." }
            ],
            why: "Bentuk relief dapat menyimpan catatan arah gaya yang pernah bekerja pada kerak planet.",
            deepDive: ["Kompresi dapat melipat atau menebalkan kerak dan membangun pegunungan.", "Venus tidak memiliki sistem lempeng modern yang identik dengan Bumi, jadi mekanisme deformasinya tetap menjadi pertanyaan penting."],
            sourceLabel: "NASA/JPL · Maxwell Montes", source: "https://science.nasa.gov/photojournal/venus-maxwell-montes-and-cleopatra-crater/",
            anchor: { x: -25, z: -10 }, placement: "slope-high"
          },
          {
            id: "maxwell-height", type: "TITIK PENGAMATAN", title: "Dataran Tinggi Ekstrem",
            lead: "Maxwell Montes adalah wilayah pegunungan tertinggi di Venus. Di sini, elevasi menjadi bagian utama cerita geologinya.",
            sections: [
              { heading: "SKALA", text: "NASA mencatat Maxwell hampir 11 km di atas radius rata-rata Venus. Relief seperti ini sangat besar untuk planet berbatu tanpa samudra modern." },
              { heading: "BACA BENTANG", text: "Perhatikan bagaimana elevasi tinggi menyatu dengan punggungan dan lereng, bukan berdiri sebagai satu puncak tunggal yang sederhana." }
            ],
            why: "Perbedaan elevasi membantu membedakan dataran tinggi, sabuk pegunungan, dan dataran yang lebih rendah di sekitarnya.",
            deepDive: ["Topografi berasal dari pengukuran ketinggian, bukan dari terang-gelap citra radar.", "Pada ANTARA, ketinggian kamera dan permukaan mengambil sumber topografi yang sama."],
            sourceLabel: "NASA/JPL · Maxwell Montes", source: "https://science.nasa.gov/photojournal/venus-maxwell-montes-and-cleopatra-crater/",
            anchor: { x: -6, z: -42 }, placement: "elevation-high"
          },
          {
            id: "maxwell-radar", type: "DATA RADAR", title: "Mengapa Maxwell Sangat Terang pada Radar?",
            lead: "Sebagian besar Maxwell Montes memantulkan radar dengan sangat kuat, terutama pada elevasi tinggi.",
            sections: [
              { heading: "YANG DIKETAHUI", text: "Pantulan radar terang umum ditemukan pada dataran tinggi Venus. Kecerahan radar dipengaruhi sifat permukaan dan cara gelombang radar berinteraksi dengannya." },
              { heading: "YANG MASIH DITELITI", text: "Penyebab kimia tepat dari material sangat reflektif di dataran tinggi belum sepenuhnya dipastikan. Beberapa penjelasan melibatkan mineral yang stabil hanya pada rentang kondisi tertentu." }
            ],
            why: "Contoh ini menunjukkan perbedaan antara data pengamatan dan interpretasi: ilmuwan dapat mengukur pantulan, tetapi penyebab fisiknya masih dapat diperdebatkan.",
            deepDive: ["Jangan menyamakan area radar-terang dengan puncak tertinggi secara otomatis.", "Temperatur, tekanan, kimia atmosfer, kekasaran, dan geometri radar semuanya dapat memengaruhi sinyal."],
            sourceLabel: "NASA/JPL · Maxwell Montes", source: "https://science.nasa.gov/photojournal/venus-maxwell-montes-and-cleopatra-crater/",
            anchor: { x: 30, z: -22 }, placement: "elevation-high"
          },
          {
            id: "maxwell-atmosphere", type: "DATA LINGKUNGAN", title: "Atmosfer Berubah dengan Ketinggian",
            lead: "Di Venus, temperatur, tekanan, dan kimia atmosfer berubah ketika elevasi meningkat. Maxwell memberi contoh kuat hubungan antara topografi dan lingkungan.",
            sections: [
              { heading: "ELEVASI", text: "Puncak dan lereng tinggi berada pada kondisi atmosfer yang berbeda dari dataran rendah, walaupun seluruh permukaan Venus tetap sangat panas dan bertekanan tinggi." },
              { heading: "HUBUNGAN DENGAN RADAR", text: "NASA mencatat bahwa perubahan kondisi atmosfer dengan ketinggian mungkin berkaitan dengan material pemantul radar yang stabil pada rentang elevasi tertentu." }
            ],
            why: "Planet tidak hanya berupa batuan. Atmosfer dan topografi dapat berinteraksi dan menghasilkan pola pengamatan yang tidak langsung terlihat dari bentuk medan saja.",
            deepDive: ["Penjelasan kimia untuk dataran tinggi yang sangat reflektif terhadap radar masih diteliti.", "Gunakan bahasa hipotesis ketika penyebab belum terbukti secara pasti."],
            sourceLabel: "NASA/JPL · Maxwell Montes", source: "https://science.nasa.gov/photojournal/venus-maxwell-montes-and-cleopatra-crater/",
            anchor: { x: -58, z: 36 }, placement: "elevation-high"
          },
          {
            id: "maxwell-context", type: "KONTEKS WILAYAH", title: "Maxwell di Tepi Lakshmi Planum",
            lead: "Maxwell Montes berdiri di tepi timur dataran tinggi Ishtar dan berdekatan dengan Lakshmi Planum.",
            sections: [
              { heading: "KONTRAS BENTANG", text: "Lakshmi Planum relatif lebih halus dibanding sabuk pegunungan di sekelilingnya. Peralihan bentuk ini membantu membedakan dataran tinggi dari pegunungan batas." },
              { heading: "SKALA REGIONAL", text: "Ishtar Terra sendiri merupakan dataran tinggi sangat luas, sedangkan Maxwell adalah komponen pegunungan yang menjulang di dalam sistem dataran tinggi itu." }
            ],
            why: "Membaca Maxwell dalam konteks Ishtar mencegah kita menganggap setiap relief tinggi sebagai bentang yang berdiri sendiri.",
            deepDive: ["Pioneer Venus dan Magellan sama-sama berperan dalam membangun pemahaman topografi dan radar Venus.", "Perbandingan wilayah memperjelas hubungan antara dataran tinggi dan sabuk pegunungan."],
            sourceLabel: "NASA/JPL/USGS · Ishtar Terra", source: "https://science.nasa.gov/photojournal/perspective-view-of-ishtar-terra/",
            anchor: { x: 64, z: 48 }, placement: "relief"
          }
        ]
      }
    },
    {
      id: "aphrodite",
      name: "Aphrodite Terra",
      short: "Aphrodite",
      category: "DATARAN TINGGI TEKTONIK",
      latitude: -1.0,
      longitudeEast: 81.0,
      heading: 0.08,
      pitch: -0.18,
      spawn: { x: -38, z: 28, altitude: 2.55 },
      lookTarget: { x: 18, z: -18 },
      featureCenter: { x: 4, z: -10 },
      playRadius: 100,
      softBoundaryStart: 84,
      source: "https://science.nasa.gov/photojournal/venus-interior-of-ovda-regio/",
      coordinateSource: "https://planetarynames.wr.usgs.gov/Feature/317",
      image: "https://assets.science.nasa.gov/dynamicimage/assets/science/psd/photojournal/pia/pia00/pia00218/PIA00218.jpg?crop=faces%2Cfocalpoint&fit=clip&h=1100&w=1400",
      descriptor: "Dataran tinggi ekuatorial dengan punggungan, lembah, retakan silang, dan sejarah deformasi panjang.",
      description: "Aphrodite Terra memakai Ovda Regio sebagai jendela belajar: punggungan dan lembah berarah tertentu dipotong retakan dari episode deformasi lain, lalu beberapa bagian rendah diisi material yang kemungkinan lava.",
      facts: [
        "NASA/JPL mendeskripsikan interior Ovda Regio sebagai medan blok-retak yang dibentuk oleh beberapa peristiwa tektonik.",
        "Punggungan dan lembah dasar berarah timur-laut ke barat-daya lalu dipotong retakan ekstensional berarah barat-laut ke tenggara.",
        "Lembah besar pada citra Magellan terisi material gelap yang kemungkinan lava."
      ],
      visualizationNote: "REFERENSI PIA00218 · Citra Ovda Regio adalah radar Magellan. Full Exploration mengikuti punggungan/lembah NE-SW, retakan yang memotongnya, dan lembah besar yang kemungkinan terisi lava, bukan menyalin terang-gelap radar sebagai tinggi.",
      palette: { low: 0x694126, mid: 0xa96e3c, high: 0xdca35f, accent: 0x5b3824, rock: 0x463025 },
      fog: 0x93603b,
      fogDensity: 0.0095,
      sky: 0xa4683c,
      sun: 0xffcc88,
      hemi: 0xe49c62,
      exposure: 1.03,
      education: {
        intro: "Ikuti jejak deformasi kerak di Aphrodite Terra: punggungan, retakan silang, lembah, dan cara radar Magellan membantu mengungkap permukaan di bawah awan.",
        objectives: [
          { id: "ridges", label: "Identifikasi punggungan dan lembah utama", discovery: "aphrodite-ridges" },
          { id: "fractures", label: "Temukan retakan yang memotong struktur lama", discovery: "aphrodite-fractures" },
          { id: "valley", label: "Pelajari lembah yang kemungkinan terisi lava", discovery: "aphrodite-valley" },
          { id: "radar", label: "Pahami cara Magellan membaca permukaan Venus", discovery: "aphrodite-magellan" }
        ],
        observations: [
          {
            id: "aphrodite-ridges", type: "TEMUAN TEKTONIK", title: "Punggungan dan Lembah yang Terarah",
            lead: "Di Ovda Regio, punggungan dan lembah tidak tersusun acak. Banyak struktur mengikuti arah yang sama dan menyimpan jejak deformasi kerak.",
            sections: [
              { heading: "POLA STRUKTURAL", text: "NASA menggambarkan fabric dasar Ovda sebagai punggungan dan lembah yang cenderung berarah timur-laut ke barat-daya." },
              { heading: "ARTINYA", text: "Pola terarah memberi petunjuk bahwa gaya tektonik bekerja secara regional, bukan hanya pada satu retakan lokal." }
            ],
            why: "Arah struktur membantu ilmuwan merekonstruksi urutan dan orientasi deformasi yang pernah dialami kerak Venus.",
            deepDive: ["Punggungan dapat terbentuk ketika kerak dipendekkan atau dilipat.", "Hubungan potong-memotong antarstruktur membantu menentukan struktur mana yang lebih tua atau lebih muda."],
            sourceLabel: "NASA/JPL · Interior Ovda Regio", source: "https://science.nasa.gov/photojournal/venus-interior-of-ovda-regio/",
            anchor: { x: -30, z: -8 }, placement: "slope-medium"
          },
          {
            id: "aphrodite-fractures", type: "TEMUAN TEKTONIK", title: "Retakan yang Memotong Struktur Lama",
            lead: "Retakan ekstensional memotong pola punggungan yang lebih tua, menunjukkan bahwa Aphrodite mengalami lebih dari satu episode deformasi.",
            sections: [
              { heading: "URUTAN PERISTIWA", text: "Jika satu struktur memotong struktur lain, struktur pemotong biasanya terbentuk kemudian. Prinsip sederhana ini membantu membaca sejarah geologi dari citra radar." },
              { heading: "OVDA REGIO", text: "NASA mencatat retakan berarah barat-laut ke tenggara memotong fabric punggungan yang lebih tua di interior Ovda." }
            ],
            why: "Satu bentang dapat merekam banyak episode geologi. Menentukan urutannya adalah inti interpretasi tektonik.",
            deepDive: ["Retakan tidak otomatis berarti lempeng tektonik seperti di Bumi.", "Aphrodite adalah dataran tinggi besar, bukan benua dalam pengertian geologi Bumi modern."],
            sourceLabel: "NASA/JPL · Interior Ovda Regio", source: "https://science.nasa.gov/photojournal/venus-interior-of-ovda-regio/",
            anchor: { x: 18, z: -14 }, placement: "slope-high"
          },
          {
            id: "aphrodite-valley", type: "TITIK PENGAMATAN", title: "Lembah yang Kemungkinan Terisi Lava",
            lead: "Sebagian lembah besar Ovda diisi material gelap pada radar yang oleh NASA ditafsirkan kemungkinan sebagai lava.",
            sections: [
              { heading: "BENTUK DAN MATERIAL", text: "Topografi memberi tahu kita di mana bagian rendah berada, sedangkan karakter radar membantu membandingkan tekstur dan sifat permukaannya." },
              { heading: "INTERPRETASI", text: "Karena data radar bukan foto warna biasa, istilah 'gelap' dan 'terang' mengacu pada kekuatan pantulan radar, bukan warna batuan." }
            ],
            why: "Menggabungkan topografi dan radar memungkinkan ilmuwan membedakan bentuk permukaan dari sifat material yang menutupinya.",
            deepDive: ["NASA menyebut material gelap di lembah besar Ovda kemungkinan lava.", "Kata 'kemungkinan' penting karena interpretasi geologi harus mengikuti kekuatan bukti."],
            sourceLabel: "NASA/JPL · Interior Ovda Regio", source: "https://science.nasa.gov/photojournal/venus-interior-of-ovda-regio/",
            anchor: { x: 42, z: 26 }, placement: "elevation-low"
          },
          {
            id: "aphrodite-magellan", type: "CARA ILMUWAN MENGETAHUI", title: "Magellan Melihat Melalui Awan",
            lead: "Permukaan Venus tidak mudah dipetakan dengan cahaya tampak dari orbit. Magellan menggunakan radar untuk memetakan bentang di bawah selimut awan.",
            sections: [
              { heading: "KENAPA RADAR", text: "Gelombang radar dapat melewati awan Venus dan kembali dari permukaan, menghasilkan informasi tentang bentuk dan sifat hamburan permukaan." },
              { heading: "RADAR ≠ KETINGGIAN", text: "Area yang lebih terang pada radar tidak otomatis lebih tinggi. Ketinggian berasal dari data topografi, sedangkan kecerahan radar dipengaruhi kekasaran, geometri, dan sifat material." }
            ],
            why: "Mengetahui cara instrumen bekerja membuat kita lebih kritis ketika membaca peta planet yang tidak bisa difoto langsung dengan cara biasa.",
            deepDive: ["Magellan memberi pandangan global pertama yang sangat rinci tentang permukaan di bawah awan Venus.", "ANTARA menggunakan topografi untuk relief makro dan radar sebagai konteks permukaan, bukan sebagai heightmap langsung."],
            sourceLabel: "NASA · Magellan", source: "https://science.nasa.gov/image-detail/venus-2/",
            anchor: { x: -66, z: 18 }, placement: "open"
          },
          {
            id: "aphrodite-transition", type: "KONTEKS GEOLOGI", title: "Dari Dataran ke Dataran Tinggi",
            lead: "Batas antara dataran rendah dan dataran tinggi Ovda menunjukkan bahwa Aphrodite bukan satu permukaan seragam.",
            sections: [
              { heading: "PERALIHAN", text: "Topografi Ovda naik beberapa kilometer di atas dataran sekitarnya. Di sepanjang batasnya, relief dan struktur berubah nyata." },
              { heading: "SKALA", text: "Aphrodite Terra membentang sangat luas di sekitar ekuator Venus. Membaca peralihan lokal membantu memahami satu bagian dari sistem regional yang jauh lebih besar." }
            ],
            why: "Peralihan relief memberi konteks tentang bagaimana deformasi dan vulkanisme membentuk dataran tinggi besar Venus.",
            deepDive: ["Ovda Regio adalah bagian barat Aphrodite Terra.", "Struktur besar tidak harus berarti benua yang terbentuk dengan proses sama seperti benua Bumi."],
            sourceLabel: "NASA/JPL · Ovda Regio", source: "https://science.nasa.gov/photojournal/venus-ovda-regio/",
            anchor: { x: 72, z: -50 }, placement: "relief"
          }
        ]
      }
    },
    {
      id: "ishtar",
      name: "Ishtar Terra",
      short: "Ishtar",
      category: "DATARAN TINGGI",
      latitude: 65.0,
      longitudeEast: 0.0,
      heading: -0.08,
      pitch: -0.10,
      spawn: { x: -34, z: 18, altitude: 2.45 },
      lookTarget: { x: 58, z: -18 },
      featureCenter: { x: 12, z: -4 },
      playRadius: 98,
      softBoundaryStart: 82,
      source: "https://science.nasa.gov/photojournal/perspective-view-of-ishtar-terra/",
      coordinateSource: "https://planetarynames.wr.usgs.gov/Feature/2733",
      image: "https://assets.science.nasa.gov/dynamicimage/assets/science/psd/photojournal/pia/pia00/pia00093/PIA00093.jpg?crop=faces%2Cfocalpoint&fit=clip&h=1100&w=1400",
      descriptor: "Dataran tinggi luas yang tinggi di atas dataran rendah dan dibatasi sabuk pegunungan.",
      description: "Ishtar Terra memperlihatkan hubungan antara interior dataran tinggi yang relatif lebih halus, Lakshmi Planum, dan pegunungan di sekelilingnya. Perbedaan relief ini membuat Ishtar tidak sekadar terlihat sebagai pegunungan generik.",
      facts: [
        "NASA/JPL/USGS menggambarkan Ishtar sebagai dataran tinggi besar sekitar 3,3 km di atas dataran rendah di sekitarnya.",
        "Lakshmi Planum berada di dalam dataran tinggi Ishtar dan dibatasi sistem pegunungan seperti Akna, Freyja, dan Maxwell Montes.",
        "Maxwell Montes di tepi timur Ishtar merupakan titik tertinggi Venus."
      ],
      visualizationNote: "REFERENSI PIA00093 · Perspektif Ishtar berasal dari altimetri radar Pioneer Venus dan memakai warna untuk kode elevasi. Full Exploration mempertahankan komposisi Lakshmi Planum yang luas dengan pegunungan besar di tepinya, bukan warna palsu referensi.",
      palette: { low: 0x604a36, mid: 0xa3845b, high: 0xdabe83, accent: 0x735038, rock: 0x47392f },
      fog: 0x826047,
      fogDensity: 0.0091,
      sky: 0x916a4d,
      sun: 0xffd09a,
      hemi: 0xdca071,
      exposure: 1.02,
      education: {
        intro: "Pelajari Ishtar sebagai dataran tinggi besar: interior Lakshmi Planum, pegunungan batas, perubahan elevasi, dan hubungan antara topografi serta data radar.",
        objectives: [
          { id: "lakshmi", label: "Amati karakter Lakshmi Planum", discovery: "ishtar-lakshmi" },
          { id: "margin", label: "Temukan peralihan menuju pegunungan batas", discovery: "ishtar-margin" },
          { id: "relief", label: "Bandingkan dataran tinggi dengan dataran lebih rendah", discovery: "ishtar-relief" },
          { id: "radar", label: "Pelajari hubungan dataran tinggi dan radar", discovery: "ishtar-radar" }
        ],
        observations: [
          {
            id: "ishtar-lakshmi", type: "TITIK PENGAMATAN", title: "Lakshmi Planum: Interior Dataran Tinggi",
            lead: "Lakshmi Planum adalah bagian interior Ishtar yang relatif lebih halus dibanding pegunungan yang membatasinya.",
            sections: [
              { heading: "BENTUK", text: "Dataran tinggi bukan satu puncak. Ia adalah wilayah luas yang berada pada elevasi tinggi dengan permukaan interior yang dapat lebih halus daripada tepinya." },
              { heading: "KONTEKS", text: "Lakshmi Planum dikelilingi sistem pegunungan, termasuk Akna Montes, Freyja Montes, dan Maxwell Montes." }
            ],
            why: "Membedakan dataran tinggi dari pegunungan membantu membaca skala regional, bukan hanya bentuk bukit di dekat kamera.",
            deepDive: ["Ishtar kira-kira seukuran Australia menurut deskripsi NASA.", "Topografi berwarna pada citra referensi adalah representasi data ketinggian, bukan warna asli permukaan."],
            sourceLabel: "NASA/JPL/USGS · Ishtar Terra", source: "https://science.nasa.gov/photojournal/perspective-view-of-ishtar-terra/",
            anchor: { x: -18, z: 8 }, placement: "flat"
          },
          {
            id: "ishtar-margin", type: "TEMUAN GEOLOGI", title: "Pegunungan di Batas Dataran Tinggi",
            lead: "Di tepi Ishtar, relief meningkat menjadi sabuk pegunungan. Peralihan ini membentuk batas yang jauh lebih kompleks daripada tepi dataran biasa.",
            sections: [
              { heading: "PERALIHAN", text: "Bandingkan area relatif halus dengan lereng dan punggungan yang lebih kuat. Kontras itulah yang membantu mengenali batas dataran tinggi." },
              { heading: "SISTEM PEGUNUNGAN", text: "Maxwell Montes berada di sisi timur Lakshmi Planum, sementara Akna dan Freyja membatasi bagian barat dan barat laut." }
            ],
            why: "Hubungan antara dataran tinggi dan pegunungan memberi petunjuk tentang deformasi kerak dalam skala sangat besar.",
            deepDive: ["Ishtar menunjukkan bahwa topografi Venus memiliki provinsi geologi yang sangat berbeda dari dataran vulkanik luas.", "Batas tidak selalu simetris dan tidak boleh dibayangkan sebagai dinding melingkar."],
            sourceLabel: "NASA/JPL/USGS · Ishtar Terra", source: "https://science.nasa.gov/photojournal/perspective-view-of-ishtar-terra/",
            anchor: { x: 62, z: -18 }, placement: "slope-high"
          },
          {
            id: "ishtar-relief", type: "KONTEKS GEOLOGI", title: "Dataran Tinggi 3,3 km di Atas Dataran Sekitar",
            lead: "NASA menggambarkan Ishtar sebagai dataran tinggi sekitar 3,3 km di atas dataran rendah yang mengelilinginya.",
            sections: [
              { heading: "BACA SKALA", text: "Perubahan ketinggian beberapa kilometer tersebar di wilayah yang sangat luas. Itu berbeda dari satu gunung tunggal dengan kaki dan puncak yang jelas." },
              { heading: "PETA TOPOGRAFI", text: "Data altimetri mengubah perbedaan ketinggian menjadi peta yang dapat dibandingkan dari satu wilayah ke wilayah lain." }
            ],
            why: "Elevasi regional adalah kunci untuk memahami mengapa Ishtar disebut dataran tinggi, bukan sekadar kumpulan pegunungan.",
            deepDive: ["Pioneer Venus menyediakan altimetri penting sebelum Magellan memperluas pemetaan radar Venus.", "Dalam visualisasi ilmiah, skala vertikal kadang diperbesar untuk membuat relief lebih mudah dibaca. Selalu periksa keterangannya."],
            sourceLabel: "NASA/JPL/USGS · Pioneer Venus", source: "https://science.nasa.gov/photojournal/perspective-view-of-ishtar-terra/",
            anchor: { x: -62, z: -28 }, placement: "relief"
          },
          {
            id: "ishtar-radar", type: "DATA RADAR", title: "Dataran Tinggi dan Pantulan Radar",
            lead: "Banyak dataran tinggi Venus menunjukkan pantulan radar yang berbeda dari dataran rendah, tetapi kecerahan radar tidak boleh dibaca sebagai elevasi langsung.",
            sections: [
              { heading: "DUA DATA BERBEDA", text: "Topografi mengukur bentuk dan elevasi. Radar SAR merekam bagaimana permukaan memantulkan gelombang radar." },
              { heading: "INTERPRETASI", text: "Pada Maxwell, NASA membahas material reflektif yang mungkin stabil pada kondisi elevasi tertentu. Penyebab kimia tepatnya masih menjadi penelitian." }
            ],
            why: "Memisahkan jenis data mencegah kesalahan umum: mengubah area terang radar menjadi gunung hanya karena terlihat terang.",
            deepDive: ["Pantulan radar dipengaruhi kekasaran, geometri, dan sifat dielektrik material.", "Ketinggian perlu sumber topografi terpisah."],
            sourceLabel: "NASA/JPL · Maxwell dan Ishtar", source: "https://science.nasa.gov/photojournal/venus-maxwell-montes-and-cleopatra-crater/",
            anchor: { x: 30, z: -62 }, placement: "elevation-high"
          },
          {
            id: "ishtar-atmosphere", type: "DATA LINGKUNGAN", title: "Melihat Dataran Tinggi di Udara yang Sangat Padat",
            lead: "Bahkan di dataran tinggi Ishtar, permukaan tetap berada di bawah atmosfer Venus yang sangat padat dan panas.",
            sections: [
              { heading: "KONTRAS DENGAN BUMI", text: "Naik beberapa kilometer di Bumi mengubah tekanan dan temperatur secara nyata. Venus juga berubah dengan elevasi, tetapi keseluruhan lingkungan permukaannya tetap ekstrem." },
              { heading: "VISIBILITAS", text: "Selimut awan tebal membuat pemetaan orbit pada cahaya tampak biasa sulit. Radar menjadi alat utama untuk membaca permukaan secara global." }
            ],
            why: "Topografi dan atmosfer harus dibaca bersama ketika menjelaskan kondisi di permukaan planet lain.",
            deepDive: ["Venus memiliki suhu permukaan sekitar 467°C dan tekanan sekitar 93 kali tekanan laut Bumi.", "Awan Venus mengandung asam sulfat dan menyelimuti planet secara global."],
            sourceLabel: "NASA Science · Fakta Venus", source: "https://science.nasa.gov/venus/venus-facts/",
            anchor: { x: 66, z: 44 }, placement: "open"
          }
        ]
      }
    },
    {
      id: "alpha",
      name: "Alpha Regio",
      short: "Alpha",
      category: "DATARAN TESSERA",
      latitude: -25.0,
      longitudeEast: 4.0,
      heading: 0.18,
      pitch: -0.20,
      spawn: { x: -6, z: 24, altitude: 2.30 },
      lookTarget: { x: 30, z: -26 },
      featureCenter: { x: 8, z: -10 },
      playRadius: 96,
      softBoundaryStart: 80,
      source: "https://science.nasa.gov/photojournal/venus-three-dimensional-perspective-view-of-alpha-region/",
      coordinateSource: "https://planetarynames.wr.usgs.gov/Feature/203",
      image: "https://assets.science.nasa.gov/dynamicimage/assets/science/psd/photojournal/pia/pia00481/PIA00481.jpg?crop=faces%2Cfocalpoint&fit=clip&h=1100&w=1400",
      descriptor: "Tessera dengan punggungan, palung, dan lembah sesar yang saling berpotongan.",
      description: "Alpha Regio adalah salah satu contoh paling khas medan tessera Venus. Banyak tren struktur berpotongan membentuk pola kompleks, diselingi bagian rendah yang dapat terisi lava lebih halus.",
      facts: [
        "NASA/JPL menggambarkan Alpha Regio sebagai dataran tinggi topografis sekitar 1.300 km yang memiliki banyak set punggungan, palung, dan lembah sesar saling berpotongan.",
        "Area gelap berbentuk bundar hingga memanjang pada radar dapat merupakan bagian rendah lokal yang terisi lava lebih halus.",
        "Tessera dipelajari karena dapat menyimpan catatan geologi tua dan memberi petunjuk tentang sejarah awal permukaan Venus."
      ],
      visualizationNote: "REFERENSI PIA00481 · Perspektif Alpha Regio memperbesar skala vertikal sekitar 23×. Full Exploration mempertahankan pola tessera, punggungan/palung silang, lembah sesar, dan blok poligonal tanpa menyalin pembesaran vertikal tersebut.",
      palette: { low: 0x653719, mid: 0xad7133, high: 0xe8b657, accent: 0x56301a, rock: 0x3f281b },
      fog: 0x975c32,
      fogDensity: 0.0100,
      sky: 0xa76735,
      sun: 0xffca7d,
      hemi: 0xe79a59,
      exposure: 1.03,
      education: {
        intro: "Alpha Regio adalah laboratorium tessera: cari punggungan silang, palung, blok tinggi, dan bagian rendah yang membantu ilmuwan membaca sejarah kerak Venus.",
        objectives: [
          { id: "tessera", label: "Kenali pola punggungan tessera yang berpotongan", discovery: "alpha-tessera" },
          { id: "trough", label: "Temukan palung atau lembah sesar", discovery: "alpha-trough" },
          { id: "low", label: "Pelajari bagian rendah yang terisi lava", discovery: "alpha-lava-low" },
          { id: "history", label: "Pahami mengapa tessera penting bagi sejarah Venus", discovery: "alpha-history" }
        ],
        observations: [
          {
            id: "alpha-tessera", type: "TEMUAN GEOLOGI", title: "Tessera: Punggungan yang Saling Berpotongan",
            lead: "Tessera bukan sekadar medan kasar. Ciri utamanya adalah beberapa set punggungan dan palung yang berpotongan membentuk pola kompleks.",
            sections: [
              { heading: "POLA", text: "Amati struktur dari lebih dari satu arah. Alpha Regio menunjukkan banyak tren punggungan, palung, dan lembah sesar yang membentuk pola poligonal." },
              { heading: "DEFORMASI", text: "Pola silang menunjukkan bahwa kerak mengalami deformasi dalam lebih dari satu arah atau episode, sehingga permukaan menyimpan sejarah yang berlapis." }
            ],
            why: "Tessera adalah salah satu jenis medan paling khas Venus dan menjadi target penting untuk memahami evolusi kerak planet.",
            deepDive: ["Istilah tessera digunakan untuk medan kompleks yang memiliki set struktur saling berpotongan.", "Tidak semua medan kasar di Venus adalah tessera."],
            sourceLabel: "NASA/JPL · Alpha Regio", source: "https://science.nasa.gov/photojournal/venus-three-dimensional-perspective-view-of-alpha-region/",
            anchor: { x: 4, z: -20 }, placement: "slope-high"
          },
          {
            id: "alpha-trough", type: "TITIK PENGAMATAN", title: "Palung dan Lembah Sesar",
            lead: "Di antara punggungan tessera terdapat palung dan lembah sesar berlantai relatif datar yang ikut membentuk pola Alpha Regio.",
            sections: [
              { heading: "BACA RELIEF", text: "Cari bagian rendah yang memanjang di antara relief lebih tinggi. Arah dan hubungan dengan punggungan memberi konteks deformasi." },
              { heading: "BUKAN SUNGAI", text: "Bentuk memanjang tidak otomatis berarti erosi air. Pada Alpha, banyak lembah dikaitkan dengan struktur tektonik dan vulkanik." }
            ],
            why: "Membedakan lembah tektonik dari fitur erosi mencegah analogi Bumi diterapkan secara berlebihan pada Venus.",
            deepDive: ["NASA mendeskripsikan lembah patahan berlantai datar sebagai salah satu struktur Alpha Regio.", "Interpretasi harus menggabungkan bentuk, hubungan antarstruktur, dan data radar."],
            sourceLabel: "NASA/JPL · Alpha Regio", source: "https://science.nasa.gov/photojournal/venus-three-dimensional-perspective-view-of-alpha-region/",
            anchor: { x: 36, z: 10 }, placement: "elevation-low"
          },
          {
            id: "alpha-lava-low", type: "TEMUAN VULKANIK", title: "Bagian Rendah yang Terisi Lava",
            lead: "Di Alpha Regio, beberapa bercak radar gelap yang bulat hingga memanjang berada pada bagian topografi rendah dan diisi lava yang lebih halus.",
            sections: [
              { heading: "KOMBINASI DATA", text: "Topografi mengidentifikasi bagian rendah, sementara radar membantu melihat perbedaan sifat permukaan di dalamnya." },
              { heading: "LAVA LEBIH HALUS", text: "NASA menjelaskan bahwa bagian rendah lokal dapat terisi lava vulkanik yang lebih halus, sehingga respons radarnya berbeda dari tessera kasar di sekitarnya." }
            ],
            why: "Fitur ini menunjukkan bahwa aktivitas vulkanik dapat memodifikasi medan tektonik yang lebih tua tanpa menghapus seluruh pola tessera.",
            deepDive: ["Hubungan saling menutupi dapat membantu menentukan urutan relatif proses geologi.", "Radar gelap tidak berarti batuannya berwarna hitam."],
            sourceLabel: "NASA/JPL · Alpha Regio", source: "https://science.nasa.gov/photojournal/venus-false-color-image-of-alpha-regio/",
            anchor: { x: -38, z: -34 }, placement: "elevation-low"
          },
          {
            id: "alpha-history", type: "MENGAPA PENTING", title: "Tessera dan Sejarah Tua Venus",
            lead: "Tessera menjadi target utama penelitian karena mungkin mempertahankan sebagian permukaan tua yang dapat menyimpan petunjuk tentang kondisi Venus di masa lalu.",
            sections: [
              { heading: "PERTANYAAN BESAR", text: "Ilmuwan ingin mengetahui bagaimana kerak Venus terbentuk dan berubah, serta apakah proses awal planet pernah berbeda dari keadaan sekarang." },
              { heading: "BELUM SEMUA TERJAWAB", text: "Usia absolut dan cara pembentukan semua tessera belum diketahui dengan pasti. Misi seperti DAVINCI dan VERITAS dirancang untuk memperbaiki gambaran itu." }
            ],
            why: "Medan tua dapat bertindak seperti arsip. Jika riwayatnya dapat dibaca, tessera mungkin membantu menjelaskan mengapa Venus dan Bumi berevolusi sangat berbeda.",
            deepDive: ["NASA menyebut Alpha Regio sebagai salah satu permukaan tertua yang menjadi target penting DAVINCI.", "Interpretasi tentang air purba, benua, atau proses pembentuk tessera masih berupa pertanyaan ilmiah yang sedang diuji."],
            sourceLabel: "NASA · DAVINCI · Alpha Regio", source: "https://science.nasa.gov/missions/davinci/davincis-many-firsts-at-venus/",
            anchor: { x: -64, z: 38 }, placement: "open"
          },
          {
            id: "alpha-magellan", type: "CARA ILMUWAN MENGETAHUI", title: "Dari Radar Menjadi Peta Tiga Dimensi",
            lead: "Visual perspektif Alpha Regio dibuat dengan menggabungkan data radar bukaan sintetis dan altimetri untuk membangun gambaran tiga dimensi permukaan.",
            sections: [
              { heading: "DUA LAPIS INFORMASI", text: "Radar SAR memberi pola pantulan permukaan, sedangkan altimetri memberi elevasi. Keduanya dapat digabungkan untuk memahami bentuk dan tekstur regional." },
              { heading: "SKALA VERTIKAL", text: "Beberapa visual ilmiah memperbesar relief vertikal agar struktur lebih mudah dibaca. Karena itu, keterangan visualisasi selalu penting." }
            ],
            why: "Memahami bagaimana visual ilmiah dibuat membantu membedakan data mentah, pemrosesan, dan keputusan visualisasi.",
            deepDive: ["Perspektif Alpha Regio NASA/JPL menggunakan radar dan altimetri Magellan.", "ANTARA juga menjaga pemisahan konsep: kecerahan radar tidak digunakan sebagai elevasi langsung."],
            sourceLabel: "NASA/JPL · Magellan · Alpha Regio", source: "https://science.nasa.gov/photojournal/venus-three-dimensional-perspective-view-of-alpha-region/",
            anchor: { x: 66, z: -46 }, placement: "open"
          }
        ]
      }
    }
  ]);


  const clamp = (value, min, max) => Math.max(min, Math.min(max, value));
  const lerp = (a, b, t) => a + (b - a) * t;
  const smoothstep = value => { const t = clamp(value, 0, 1); return t * t * (3 - 2 * t); };
  const smootherstep = value => { const t = clamp(value, 0, 1); return t * t * t * (t * (t * 6 - 15) + 10); };
  const formatCoordinate = (latitude, longitudeEast) => `${Math.abs(latitude).toFixed(3)}° ${latitude >= 0 ? "N" : "S"}  ·  ${(((longitudeEast % 360) + 360) % 360).toFixed(3)}° E`;
  const formatAltitude = km => km < 1 ? `${Math.max(0, km * 1000).toFixed(0)} M` : `${Math.max(0, km).toFixed(km < 10 ? 2 : 1)} KM`;
  const formatSpeed = kmPerSecond => kmPerSecond < 1 ? `${Math.round(kmPerSecond * 1000)} M/S` : `${kmPerSecond.toFixed(2)} KM/S`;
  const wait = ms => new Promise(resolve => window.setTimeout(resolve, ms));
  const wrapLongitudeEast = longitude => ((longitude % 360) + 360) % 360;
  const hash2 = (x, z, seed = 0) => {
    const value = Math.sin(x * 127.1 + z * 311.7 + seed * 74.7) * 43758.5453123;
    return value - Math.floor(value);
  };
  const valueNoise = (x, z, seed = 0) => {
    const ix = Math.floor(x), iz = Math.floor(z);
    const fx = x - ix, fz = z - iz;
    const sx = fx * fx * (3 - 2 * fx), sz = fz * fz * (3 - 2 * fz);
    const a = hash2(ix, iz, seed), b = hash2(ix + 1, iz, seed);
    const c = hash2(ix, iz + 1, seed), d = hash2(ix + 1, iz + 1, seed);
    return lerp(lerp(a, b, sx), lerp(c, d, sx), sz) * 2 - 1;
  };
  const fbm = (x, z, seed = 0) => {
    let sum = 0, amp = 0.5, freq = 1, norm = 0;
    for (let octave = 0; octave < 4; octave += 1) {
      sum += valueNoise(x * freq, z * freq, seed + octave * 17) * amp;
      norm += amp;
      amp *= 0.5;
      freq *= 2.04;
    }
    return sum / norm;
  };
  const ridge = n => 1 - Math.abs(n);
  const sleepFrame = () => new Promise(resolve => requestAnimationFrame(() => resolve()));

  const VENUS_REGIONAL_TOPO_SIZE = 257;
  const VENUS_REGIONAL_TOPO_HALF_EXTENT_KM = 330;
  const VENUS_REGIONAL_TOPO_TEMPLATE = "assets/venus-data/topography-{region}.f32";
  const VENUS_PDS_TOPO_LOCAL = "assets/venus-data/topogrd.img";
  const VENUS_PDS_TOPO_LOCAL_ASCII = "assets/venus-data/topogrd.dat";
  const VENUS_PDS_TOPO_PROXY = "venus-data-proxy.php?asset=topogrd";
  const VENUS_PDS_TOPO_REMOTE = "https://pds-geosciences.wustl.edu/mgn/mgn-v-rss-5-gravity-l2-v1/mg_5201/images/topogrd.img";
  const VENUS_PDS_TOPO_REMOTE_ASCII = "https://pds-geosciences.wustl.edu/mgn/mgn-v-rss-5-gravity-l2-v1/mg_5201/topo/topogrd.dat";
  const VENUS_WMS_ENDPOINT = "https://planetarymaps.usgs.gov/cgi-bin/mapserv";
  const VENUS_WMS_MAP = "/maps/venus/venus_simp_cyl.map";

  class VenusTopographyProvider {
    constructor(region) {
      this.region = region;
      this.width = 360;
      this.height = 180;
      this.grid = null;
      this.regionalGrid = null;
      this.regionalSize = VENUS_REGIONAL_TOPO_SIZE;
      this.regionalHalfExtentKm = VENUS_REGIONAL_TOPO_HALF_EXTENT_KM;
      this.sourceLabel = "TOPOGRAFI MAGELLAN · PDS GTDR 1°";
      this.sourceUrl = null;
      this.local = false;
      this.emergencyApproximation = false;
    }

    async fetchWithTimeout(url, timeoutMs = 12000) {
      const controller = new AbortController();
      const timer = window.setTimeout(() => controller.abort(), timeoutMs);
      try {
        const response = await fetch(url, { signal: controller.signal, cache: "force-cache", mode: "cors" });
        if (!response.ok) throw new Error(`HTTP ${response.status} saat memuat ${url}`);
        return response;
      } finally {
        window.clearTimeout(timer);
      }
    }

    decodeRegionalFloat32(buffer) {
      const expected = this.regionalSize * this.regionalSize * 4;
      if (buffer.byteLength !== expected) {
        throw new Error(`Ukuran regional GTDR tidak cocok (${buffer.byteLength} byte, perlu ${expected}).`);
      }
      return new Float32Array(buffer.slice(0));
    }

    async loadRegionalGrid() {
      const configured = window.ANTARA_VENUS_TOPOGRAPHY_TEMPLATE;
      const url = configured
        ? String(configured).replace("{region}", this.region.id)
        : VENUS_REGIONAL_TOPO_TEMPLATE.replace("{region}", this.region.id);
      const response = await this.fetchWithTimeout(url, 10000);
      this.regionalGrid = this.decodeRegionalFloat32(await response.arrayBuffer());
      this.sourceLabel = "USGS MAGELLAN GTDR · SUMBER 4,641 KM/PIKSEL";
      this.sourceUrl = url;
      this.local = !/^https?:/i.test(url);
      return true;
    }

    decodeImageBytes(buffer) {
      const bytes = new Uint8Array(buffer);
      if (bytes.byteLength !== this.width * this.height) {
        throw new Error(`Ukuran TOPOGRD.IMG tidak cocok (${bytes.byteLength} byte).`);
      }
      const grid = new Float32Array(bytes.length);
      for (let i = 0; i < bytes.length; i += 1) grid[i] = bytes[i] * 0.0478 - 2.492;
      return grid;
    }

    decodeAscii(text) {
      const matches = text.match(/[-+]?\d+(?:\.\d+)?/g) || [];
      if (matches.length < this.width * this.height) {
        throw new Error(`TOPOGRD.DAT hanya menghasilkan ${matches.length} sampel.`);
      }
      const grid = new Float32Array(this.width * this.height);
      for (let i = 0; i < grid.length; i += 1) grid[i] = Number(matches[i]);
      return grid;
    }

    async load(onProgress = () => {}) {
      if (this.grid || this.regionalGrid) return this;
      let regionalError = null;
      let coarseError = null;
      onProgress(0.03);
      try {
        await this.loadRegionalGrid();
        onProgress(0.82);
        return this;
      } catch (error) {
        regionalError = error;
      }

      const configured = window.ANTARA_VENUS_TOPOGRAPHY_URL;
      const binaryCandidates = [configured, VENUS_PDS_TOPO_LOCAL, VENUS_PDS_TOPO_PROXY, VENUS_PDS_TOPO_REMOTE].filter(Boolean);
      for (const url of binaryCandidates) {
        try {
          const response = await this.fetchWithTimeout(url);
          this.grid = this.decodeImageBytes(await response.arrayBuffer());
          if (!this.regionalGrid) {
            this.sourceLabel = url === VENUS_PDS_TOPO_PROXY
              ? "TOPOGRAFI MAGELLAN PDS · 1° · SIMPANAN SERVER"
              : "TOPOGRAFI MAGELLAN PDS · 1° · CADANGAN";
            this.sourceUrl = url;
            this.local = !/^https?:/i.test(url);
          }
          onProgress(0.82);
          return this;
        } catch (error) {
          coarseError = error;
        }
      }

      for (const url of [VENUS_PDS_TOPO_LOCAL_ASCII, VENUS_PDS_TOPO_REMOTE_ASCII]) {
        try {
          const response = await this.fetchWithTimeout(url, 15000);
          this.grid = this.decodeAscii(await response.text());
          if (!this.regionalGrid) {
            this.sourceLabel = "TOPOGRAFI MAGELLAN PDS · 1° · CADANGAN ASCII";
            this.sourceUrl = url;
            this.local = !/^https?:/i.test(url);
          }
          onProgress(0.82);
          return this;
        } catch (error) {
          coarseError = error;
        }
      }

      // Never hard-stop the experience because a scientific asset is absent.
      // This emergency terrain is deliberately labelled NON-SCIENTIFIC and is
      // used only when local GTDR, the same-origin PHP cache, and direct PDS
      // fallbacks all fail. It keeps ANTARA usable without pretending that
      // generated relief is Magellan elevation data.
      this.emergencyApproximation = true;
      this.sourceLabel = "PRATINJAU LURING · TOPOGRAFI NONILMIAH";
      this.sourceUrl = null;
      this.local = true;
      console.warn("[ANTARA Venus] Scientific topography unavailable; using clearly-labelled offline preview terrain.", { regionalError, coarseError });
      onProgress(0.82);
      return this;
    }

    sampleRegional(latitude, longitudeEast) {
      if (!this.regionalGrid) return Number.NaN;
      let deltaLon = wrapLongitudeEast(longitudeEast) - wrapLongitudeEast(this.region.longitudeEast);
      if (deltaLon > 180) deltaLon -= 360;
      if (deltaLon < -180) deltaLon += 360;
      const cosLat = Math.max(0.18, Math.cos(this.region.latitude * DEG));
      const xKm = deltaLon * KM_PER_DEG_LAT * cosLat;
      const zKm = (this.region.latitude - latitude) * KM_PER_DEG_LAT;
      const u = (xKm / this.regionalHalfExtentKm + 1) * 0.5;
      const v = (zKm / this.regionalHalfExtentKm + 1) * 0.5;
      if (u < 0 || u > 1 || v < 0 || v > 1) return Number.NaN;
      const fx = u * (this.regionalSize - 1);
      const fy = v * (this.regionalSize - 1);
      const x0 = clamp(Math.floor(fx), 0, this.regionalSize - 1);
      const y0 = clamp(Math.floor(fy), 0, this.regionalSize - 1);
      const x1 = clamp(x0 + 1, 0, this.regionalSize - 1);
      const y1 = clamp(y0 + 1, 0, this.regionalSize - 1);
      const tx = fx - x0, ty = fy - y0;
      const a = this.regionalGrid[y0 * this.regionalSize + x0];
      const b = this.regionalGrid[y0 * this.regionalSize + x1];
      const c = this.regionalGrid[y1 * this.regionalSize + x0];
      const d = this.regionalGrid[y1 * this.regionalSize + x1];
      if (![a, b, c, d].every(Number.isFinite)) return Number.NaN;
      return lerp(lerp(a, b, tx), lerp(c, d, tx), ty);
    }

    sampleRawGrid(latitude, longitudeEast) {
      const lat = clamp(latitude, -89.49, 89.49);
      const lon = wrapLongitudeEast(longitudeEast);
      const rowFloat = 89.5 - lat;
      const colFloat = wrapLongitudeEast(lon - 240);
      const r0 = clamp(Math.floor(rowFloat), 0, this.height - 1);
      const r1 = clamp(r0 + 1, 0, this.height - 1);
      const c0 = ((Math.floor(colFloat) % this.width) + this.width) % this.width;
      const c1 = (c0 + 1) % this.width;
      const fr = clamp(rowFloat - Math.floor(rowFloat), 0, 1);
      const fc = clamp(colFloat - Math.floor(colFloat), 0, 1);
      const a = this.grid[r0 * this.width + c0];
      const b = this.grid[r0 * this.width + c1];
      const c = this.grid[r1 * this.width + c0];
      const d = this.grid[r1 * this.width + c1];
      return lerp(lerp(a, b, fc), lerp(c, d, fc), fr);
    }

    sampleEmergency(latitude, longitudeEast) {
      let deltaLon = wrapLongitudeEast(longitudeEast) - wrapLongitudeEast(this.region.longitudeEast);
      if (deltaLon > 180) deltaLon -= 360;
      if (deltaLon < -180) deltaLon += 360;
      const cosLat = Math.max(0.18, Math.cos(this.region.latitude * DEG));
      const x = deltaLon * KM_PER_DEG_LAT * cosLat;
      const z = (this.region.latitude - latitude) * KM_PER_DEG_LAT;

      // Emergency mode deliberately supplies only a subdued regional base.
      // Destination identity is generated by VenusRegionWorld's explicit,
      // region-specific morphology layer so the five worlds do not collapse
      // back into one parameterized noise recipe.
      return valueNoise(x * 0.010, z * 0.010, 701) * 0.16
        + valueNoise(x * 0.026 + 4.7, z * 0.026 - 2.1, 709) * 0.07;
    }

    sample(latitude, longitudeEast) {
      const regional = this.sampleRegional(latitude, longitudeEast);
      if (Number.isFinite(regional)) return regional;
      if (this.grid) return this.sampleRawGrid(latitude, longitudeEast);
      if (this.emergencyApproximation) return this.sampleEmergency(latitude, longitudeEast);
      throw new Error("Magellan GTDR belum dimuat.");
    }

    clear() {
      this.grid = null;
      this.regionalGrid = null;
      this.emergencyApproximation = false;
      this.sourceUrl = null;
    }
  }

  class VenusRadarProvider {
    constructor(THREE, region, quality) {
      this.THREE = THREE;
      this.region = region;
      this.quality = quality;
      this.texture = null;
      this.extentKm = 310;
      this.sourceLabel = "USGS · CITRA RADAR SAR MAGELLAN";
    }

    buildWmsUrl() {
      const latRadius = this.extentKm / KM_PER_DEG_LAT;
      const lonScale = Math.max(0.18, Math.cos(this.region.latitude * DEG));
      const lonRadius = this.extentKm / (KM_PER_DEG_LAT * lonScale);
      const centerLon = this.region.longitudeEast < 3 ? this.region.longitudeEast + 360 : this.region.longitudeEast;
      const minLon = centerLon - lonRadius;
      const maxLon = centerLon + lonRadius;
      const minLat = clamp(this.region.latitude - latRadius, -89.5, 89.5);
      const maxLat = clamp(this.region.latitude + latRadius, -89.5, 89.5);
      const bbox = `${minLon},${minLat},${maxLon},${maxLat}`;
      const size = this.quality.name === "HIGH" ? 1536 : this.quality.name === "MEDIUM" ? 1024 : 768;
      const params = new URLSearchParams({
        map: VENUS_WMS_MAP,
        SERVICE: "WMS",
        VERSION: "1.1.1",
        REQUEST: "GetMap",
        LAYERS: "MAGELLAN",
        STYLES: "",
        SRS: "EPSG:4326",
        BBOX: bbox,
        WIDTH: String(size),
        HEIGHT: String(size),
        FORMAT: "image/png",
        TRANSPARENT: "FALSE"
      });
      return `${VENUS_WMS_ENDPOINT}?${params.toString()}`;
    }

    async load() {
      const configured = window.ANTARA_VENUS_RADAR_TEMPLATE;
      const urls = configured
        ? [String(configured).replace("{region}", this.region.id)]
        : [`assets/venus-data/radar-${this.region.id}.png`, this.buildWmsUrl()];
      let texture = null;
      for (const url of urls) {
        texture = await new Promise((resolve, reject) => {
          const loader = new this.THREE.TextureLoader();
          loader.setCrossOrigin("anonymous");
          loader.load(url, resolve, undefined, reject);
        }).catch(() => null);
        if (texture) {
          this.sourceLabel = /^https?:/i.test(url) ? "USGS · CITRA RADAR SAR MAGELLAN" : "LOCAL · MAGELLAN SAR FMAP";
          break;
        }
      }
      if (!texture) return null;
      texture.colorSpace = this.THREE.SRGBColorSpace;
      texture.wrapS = this.THREE.ClampToEdgeWrapping;
      texture.wrapT = this.THREE.ClampToEdgeWrapping;
      texture.minFilter = this.THREE.LinearMipmapLinearFilter;
      texture.magFilter = this.THREE.LinearFilter;
      texture.anisotropy = Math.min(this.quality.anisotropy, 16);
      this.texture = texture;
      return texture;
    }

    dispose() {
      this.texture?.dispose?.();
      this.texture = null;
    }
  }

  class VenusRegionWorld {
    constructor(THREE, scene, renderer, region, quality) {
      this.THREE = THREE;
      this.scene = scene;
      this.renderer = renderer;
      this.region = region;
      this.quality = quality;
      this.group = new THREE.Group();
      this.group.name = `venus-gtdr-world-${region.id}`;
      this.scene.add(this.group);
      this.topography = new VenusTopographyProvider(region);
      this.radar = new VenusRadarProvider(THREE, region, quality);
      this.material = null;
      this.backgroundMaterial = null;
      this.tiles = [];
      this.background = null;
      this.props = null;
      this.particles = null;
      this.resources = [];
      this.referenceElevation = 0;
      this.cosLat = Math.max(0.18, Math.cos(region.latitude * DEG));
      this.worldSpan = quality.name === "HIGH" ? 560 : quality.name === "MEDIUM" ? 500 : 440;
      this.tileSize = quality.tileSize || 24;
      this.tileHalfCount = 4;
      this.tmpColor = new THREE.Color();
      this.lowColor = new THREE.Color(region.palette.low);
      this.midColor = new THREE.Color(region.palette.mid);
      this.highColor = new THREE.Color(region.palette.high);
      this.rockColor = new THREE.Color(region.palette.rock);
      this.fogColor = new THREE.Color(region.fog);
      this.detailTexture = this.createMicroDetailTexture();
      this.resources.push(this.detailTexture);
      this.frame = 0;
      this.observationGroup = null;
      this.observationMarkers = new Map();
      this.observationTime = 0;
      this.morphologyWeight = 0.82;
    }

    createMicroDetailTexture() {
      const T = this.THREE;
      const size = this.quality.name === "HIGH" ? 512 : this.quality.name === "MEDIUM" ? 384 : 256;
      const data = new Uint8Array(size * size * 4);
      const hash = (x, y, seed) => {
        let h = Math.imul((x + seed * 17) | 0, 374761393) ^ Math.imul((y - seed * 29) | 0, 668265263);
        h = Math.imul(h ^ (h >>> 13), 1274126177);
        return ((h ^ (h >>> 16)) >>> 0) / 4294967295;
      };
      const fade = t => t * t * (3 - 2 * t);
      const wrapCell = (value, cells) => ((value % cells) + cells) % cells;
      const periodicNoise = (u, v, cells, seed) => {
        const px = u * cells, py = v * cells;
        const x0 = Math.floor(px), y0 = Math.floor(py);
        const tx = fade(px - x0), ty = fade(py - y0);
        const a = hash(wrapCell(x0, cells), wrapCell(y0, cells), seed);
        const b = hash(wrapCell(x0 + 1, cells), wrapCell(y0, cells), seed);
        const c = hash(wrapCell(x0, cells), wrapCell(y0 + 1, cells), seed);
        const d = hash(wrapCell(x0 + 1, cells), wrapCell(y0 + 1, cells), seed);
        return lerp(lerp(a, b, tx), lerp(c, d, tx), ty);
      };
      for (let y = 0; y < size; y += 1) {
        const v = y / size;
        for (let x = 0; x < size; x += 1) {
          const u = x / size;
          const broad = periodicNoise(u, v, 8, 337);
          const fine = periodicNoise(u, v, 29, 353);
          const grit = periodicNoise(u, v, 73, 379);
          const fractured = Math.abs(periodicNoise(u, v, 17, 401) - 0.5) * 2;
          const value = clamp(0.48 + (broad - 0.5) * 0.34 + (fine - 0.5) * 0.25 + (grit - 0.5) * 0.12 - fractured * 0.05, 0, 1);
          const byte = Math.round(value * 255);
          const i = (y * size + x) * 4;
          data[i] = byte; data[i + 1] = byte; data[i + 2] = byte; data[i + 3] = 255;
        }
      }
      const texture = new T.DataTexture(data, size, size, T.RGBAFormat, T.UnsignedByteType);
      texture.name = "venus-subresolution-microdetail";
      texture.colorSpace = T.NoColorSpace;
      texture.wrapS = T.RepeatWrapping;
      texture.wrapT = T.RepeatWrapping;
      texture.minFilter = T.LinearMipmapLinearFilter;
      texture.magFilter = T.LinearFilter;
      texture.anisotropy = Math.min(this.quality.anisotropy, 12);
      texture.needsUpdate = true;
      return texture;
    }

    geoFromWorld(x, z) {
      return {
        latitude: clamp(this.region.latitude - z / KM_PER_DEG_LAT, -89.49, 89.49),
        longitudeEast: wrapLongitudeEast(this.region.longitudeEast + x / (KM_PER_DEG_LAT * this.cosLat))
      };
    }

    scientificHeightAt(x, z) {
      const geo = this.geoFromWorld(x, z);
      return this.topography.sample(geo.latitude, geo.longitudeEast) - this.referenceElevation;
    }

    morphologySourceWeight() {
      // The better the measured elevation source, the less synthetic reinforcement is allowed.
      // High-resolution GTDR keeps morphology guidance subtle; the coarse 1-degree fallback needs more help.
      if (this.topography.emergencyApproximation) return 1.0;
      if (this.topography.regionalGrid) return 0.26;
      if (this.topography.grid) return 0.60;
      return 0.76;
    }

    rotateLocal(x, z, cx, cz, angle) {
      const dx = x - cx, dz = z - cz;
      const ca = Math.cos(angle), sa = Math.sin(angle);
      return { u: dx * ca + dz * sa, v: -dx * sa + dz * ca };
    }

    ellipseGaussian(x, z, cx, cz, sx, sz, amplitude = 1) {
      const dx = (x - cx) / sx, dz = (z - cz) / sz;
      return Math.exp(-(dx * dx + dz * dz)) * amplitude;
    }

    curvedFold(u, v, offset, spacingPhase, width, amplitude, seed) {
      const warp = Math.sin(u * 0.043 + spacingPhase) * 3.6
        + valueNoise(u * 0.024 + seed * 0.13, u * 0.008 - seed * 0.07, seed) * 2.0;
      const d = (v - offset - warp) / width;
      return Math.exp(-(d * d)) * amplitude;
    }

    elongatedRange(x, z, cx, cz, angle, length, width, amplitude, seed) {
      const { u, v } = this.rotateLocal(x, z, cx, cz, angle);
      const envelope = Math.exp(-((u / length) ** 4 + (v / width) ** 2));
      const folded = 0.52
        + ridge(valueNoise(u * 0.050 + seed, v * 0.095 - seed, seed + 17)) * 0.34
        + ridge(valueNoise(u * 0.024 - seed, v * 0.052 + seed, seed + 31)) * 0.14;
      return envelope * folded * amplitude;
    }

    maatMorphologyAt(x, z) {
      // Reference grammar: fractured plains -> long cooled lava flows -> one enormous broad shield edifice.
      // The profile is intentionally non-Gaussian so Maat reads as a shield volcano rather than a cone or hill blob.
      const cx = 0, cz = -38;
      const dx = x - cx, dz = z - cz;
      const radial = Math.hypot(dx / 108, dz / 94);
      // A shield-volcano profile: a broad summit zone and long, shallow lower flanks.
      // This piecewise profile avoids the bell-shaped silhouette of a Gaussian mountain.
      const summitZone = 1 - smootherstep((radial - 0.18) / 0.18);
      const flankZone = 1 - smootherstep((radial - 0.22) / 0.78);
      const broadShield = flankZone * 3.55 + summitZone * 0.48;
      const shoulderIrregularity = valueNoise(x * 0.010 + 2.1, z * 0.010 - 1.4, 1193) * flankZone * 0.10;
      const upperShoulder = (1 - smootherstep((radial - 0.30) / 0.20)) * 0.18;

      // Flatten the immediate summit slightly, then cut an irregular shallow depression into it.
      const summitFlat = -(1 - smootherstep(radial / 0.24)) * 0.18;
      const angle = Math.atan2(dz, dx);
      const summitR = Math.hypot((x - 1.8) / 11.5, (z + 38.5) / 8.8);
      const rimRadius = 1.02 + Math.sin(angle * 3.0 + 0.7) * 0.10 + valueNoise(x * 0.035, z * 0.035, 1201) * 0.07;
      const irregularRim = Math.exp(-(((summitR - rimRadius) / 0.30) ** 2)) * 0.22;
      const summitDepression = -Math.exp(-((summitR / 0.78) ** 2)) * 0.46;

      // Cooled flow units extend northward from the edifice across lower fractured plains, matching the logic of PIA00254.
      const northward = smootherstep((z + 20) / 28);
      const flowPathA = x - (16 + Math.sin((z + 12) * 0.026) * 8.5);
      const flowPathB = x - (-28 + Math.sin((z + 4) * 0.022 + 1.35) * 10.0);
      const flowPathC = x - (42 + Math.sin((z + 18) * 0.019 - 0.8) * 7.0);
      const flowA = Math.exp(-((flowPathA / 17) ** 2)) * Math.exp(-(((z - 32) / 92) ** 4)) * northward * 0.16;
      const flowB = Math.exp(-((flowPathB / 21) ** 2)) * Math.exp(-(((z - 38) / 102) ** 4)) * northward * 0.13;
      const flowC = Math.exp(-((flowPathC / 15) ** 2)) * Math.exp(-(((z - 26) / 82) ** 4)) * northward * 0.10;

      // Subtle paired margins suggest levees without turning the flows into raised fantasy rivers.
      const leveeA = Math.exp(-(((Math.abs(flowPathA) - 16) / 3.6) ** 2)) * Math.exp(-(((z - 30) / 90) ** 4)) * northward * 0.055;
      const leveeB = Math.exp(-(((Math.abs(flowPathB) - 20) / 4.2) ** 2)) * Math.exp(-(((z - 38) / 98) ** 4)) * northward * 0.045;

      // The foreground remains a low volcanic plain with fractures and low relief, not a field of random mountains.
      const plainMask = clamp(1 - broadShield / 3.8, 0, 1);
      const fracturedPlain = (ridge(valueNoise(x * 0.055 + z * 0.014, z * 0.031, 1229)) - 0.58) * plainMask * 0.11;
      const oldFlowTexture = (ridge(valueNoise(x * 0.025 - z * 0.010, z * 0.044, 1237)) - 0.60) * plainMask * 0.07;

      return broadShield + shoulderIrregularity + upperShoulder + summitFlat + irregularRim + summitDepression
        + flowA + flowB + flowC + leveeA + leveeB + fracturedPlain + oldFlowTexture;
    }

    maxwellMorphologyAt(x, z) {
      // Maxwell is a connected compressional mountain belt, not a central volcano.
      const { u, v } = this.rotateLocal(x, z, -8, -14, -0.30);
      const beltEnvelope = Math.exp(-((u / 142) ** 6 + (v / 72) ** 4));
      const regionalUplift = beltEnvelope * 2.35;
      const ridges = (
        this.curvedFold(u, v, -46, 0.2, 5.8, 1.02, 1301)
        + this.curvedFold(u, v, -30, 1.1, 5.0, 1.20, 1307)
        + this.curvedFold(u, v, -14, 2.0, 4.7, 1.34, 1319)
        + this.curvedFold(u, v, 3, 2.9, 4.5, 1.42, 1321)
        + this.curvedFold(u, v, 21, 3.8, 5.0, 1.24, 1327)
        + this.curvedFold(u, v, 39, 4.7, 5.7, 1.02, 1333)
      ) * Math.exp(-((u / 138) ** 6));
      const longitudinalValleys = -0.34 * beltEnvelope
        * (0.45 + 0.55 * ridge(valueNoise(u * 0.038, v * 0.016, 1361)));

      // The western flank is intentionally sharper, while the east descends more gradually.
      const westEscarpment = this.ellipseGaussian(x, z, -58, -8, 24, 92, 1.10)
        * (0.65 + 0.35 * ridge(valueNoise(z * 0.028, x * 0.018, 1367)));
      const eastShoulder = this.ellipseGaussian(x, z, 42, -10, 60, 94, 0.58);

      // Cleopatra is kept as a large double-ring basin in the eastern Maxwell frame.
      const craterX = 45, craterZ = -36;
      const craterR = Math.hypot(x - craterX, z - craterZ);
      const outerRim = Math.exp(-(((craterR - 48) / 6.8) ** 2)) * 0.88;
      const innerRim = Math.exp(-(((craterR - 27) / 5.2) ** 2)) * 0.30;
      const basin = -(1 - smootherstep((craterR - 36) / 14)) * 1.18;
      const channelLocal = this.rotateLocal(x, z, 64, -18, 0.72);
      const channel = -Math.exp(-((channelLocal.v / 3.8) ** 2))
        * Math.exp(-((channelLocal.u / 46) ** 4)) * 0.24;

      return regionalUplift + ridges + longitudinalValleys + westEscarpment + eastShoulder
        + outerRim + innerRim + basin + channel;
    }

    aphroditeMorphologyAt(x, z) {
      // Ovda Regio grammar follows the NASA description: broad highland, NE-SW ridge/valley fabric,
      // later NW-SE extension fractures, and large valleys locally filled by smoother volcanic material.
      const highland = this.ellipseGaussian(x, z, -4, -8, 138, 98, 1.52)
        + this.ellipseGaussian(x, z, -52, -2, 68, 52, 0.34)
        + this.ellipseGaussian(x, z, 48, -22, 72, 60, 0.40);

      // Broad irregular domes break the highland into tectonic blocks without turning it into a mountain range.
      const domes = this.ellipseGaussian(x, z, -42, -18, 30, 24, 0.34)
        + this.ellipseGaussian(x, z, 20, -38, 38, 28, 0.30)
        + this.ellipseGaussian(x, z, 54, 18, 32, 25, 0.26);

      // First deformation generation: curved NE-SW ridges spaced roughly 10-20 km apart.
      const primary = this.rotateLocal(x, z, 0, -6, -0.78);
      const primaryWarp = Math.sin(primary.u * 0.030) * 4.4
        + valueNoise(primary.u * 0.015, primary.v * 0.010, 1409) * 3.2;
      const primaryPhase = (primary.v + primaryWarp) * (Math.PI * 2 / 17.0);
      const fabricEnvelope = Math.exp(-((primary.u / 160) ** 6 + (primary.v / 104) ** 6));
      const primaryFabric = Math.cos(primaryPhase) * fabricEnvelope * 0.24;

      // Second generation is represented chiefly as cross-cutting extension fractures, not another pile of peaks.
      const secondary = this.rotateLocal(x, z, 4, -4, 0.58);
      const secondaryWarp = Math.sin(secondary.u * 0.034 + 1.2) * 4.4
        + valueNoise(secondary.u * 0.014, secondary.v * 0.010, 1423) * 4.0;
      const fracturePhase = (secondary.v + secondaryWarp) * (Math.PI * 2 / 26.0)
        + valueNoise(x * 0.017, z * 0.017, 1427) * 0.75;
      const fractureBand = Math.pow(0.5 + 0.5 * Math.cos(fracturePhase + Math.PI), 7.0);
      const crossCutFractures = -fractureBand
        * Math.exp(-((secondary.u / 156) ** 6 + (secondary.v / 112) ** 6)) * 0.40;

      // A later weak wrinkle family adds curved, cross-cut texture without dominating the older fabric.
      const later = this.rotateLocal(x, z, -10, -8, 0.18);
      const laterPhase = (later.v + Math.sin(later.u * 0.025) * 6.0) * (Math.PI * 2 / 31.0);
      const laterRidges = Math.cos(laterPhase)
        * Math.exp(-((later.u / 145) ** 6 + (later.v / 108) ** 6)) * 0.10;

      // Flat-floored fault-controlled troughs. The main trough is close to the ~20 km scale described for Ovda.
      const graben = this.rotateLocal(x, z, 18, -6, 0.66);
      const grabenHalfWidth = 9.5;
      const grabenCore = 1 - smoothstep((Math.abs(graben.v) - grabenHalfWidth) / 4.0);
      const majorGraben = -grabenCore * Math.exp(-((graben.u / 108) ** 6)) * 0.56;

      const curvedValley = this.rotateLocal(x, z, -30, 16, -0.52);
      const valleyCenter = curvedValley.v - Math.sin(curvedValley.u * 0.031) * 7.5;
      const broadValley = -(1 - smoothstep((Math.abs(valleyCenter) - 8.0) / 5.0))
        * Math.exp(-((curvedValley.u / 96) ** 4)) * 0.38;

      // Selected lows read smoother and slightly lower, suggesting volcanic infill against deformed upland.
      const lavaLowA = -this.ellipseGaussian(x, z, 42, 26, 34, 20, 0.38);
      const lavaLowB = -this.ellipseGaussian(x, z, -50, -36, 28, 18, 0.28);
      return highland + domes + primaryFabric + crossCutFractures + laterRidges
        + majorGraben + broadValley + lavaLowA + lavaLowB;
    }

    ishtarMorphologyAt(x, z) {
      // Lakshmi Planum is a broad elevated interior, not an endless mountain field.
      const dx = (x + 10) / 72;
      const dz = (z + 2) / 58;
      const superR = (Math.abs(dx) ** 5 + Math.abs(dz) ** 5) ** (1 / 5);
      const plateauMask = 1 - smootherstep((superR - 0.78) / 0.24);
      const plateau = plateauMask * 2.62;
      const interiorUndulation = plateauMask * valueNoise(x * 0.020, z * 0.020, 1501) * 0.10;

      // Distinct mountain systems occupy selected margins only, avoiding a fake circular wall.
      const akna = this.elongatedRange(x, z, -70, -2, Math.PI / 2 - 0.10, 86, 18, 2.05, 1511);
      const freyja = this.elongatedRange(x, z, -28, -66, 0.12, 78, 19, 2.25, 1523);
      const maxwellEdge = this.elongatedRange(x, z, 70, -18, Math.PI / 2 + 0.18, 92, 20, 3.15, 1531);
      const southwestScarp = this.elongatedRange(x, z, -42, 58, -0.10, 58, 15, 0.72, 1543);

      // A steeper western boundary and a more open southern interior reinforce the plateau contrast.
      const westernStep = this.ellipseGaussian(x, z, -63, 2, 20, 64, 0.54) * plateauMask;
      return plateau + interiorUndulation + akna + freyja + maxwellEdge + southwestScarp + westernStep;
    }

    alphaMorphologyAt(x, z) {
      // Alpha is identified by the fabric of the landscape itself: intersecting ridge/trough systems,
      // polygonal blocks and flat-floored fault valleys. Intersections are blended, not summed into needle peaks.
      const upland = this.ellipseGaussian(x, z, 4, -8, 122, 108, 0.98);
      const envelope = Math.exp(-((x / 132) ** 6 + ((z + 6) / 122) ** 6));

      const familyA = this.rotateLocal(x, z, 0, -6, 0.55);
      const warpA = Math.sin(familyA.u * 0.039) * 5.0
        + valueNoise(familyA.u * 0.014, familyA.v * 0.010, 1601) * 5.4;
      const phaseA = (familyA.v + warpA) * (Math.PI * 2 / 18.5)
        + valueNoise(x * 0.020, z * 0.020, 1607) * 0.95;
      const waveA = Math.cos(phaseA);
      const maskA = clamp(0.72 + valueNoise(x * 0.010 + 2.4, z * 0.012 - 1.8, 1609) * 0.42, 0.20, 1.0);

      const familyB = this.rotateLocal(x, z, 6, -4, -0.72);
      const warpB = Math.sin(familyB.u * 0.031 + 1.7) * 5.8
        + valueNoise(familyB.u * 0.013, familyB.v * 0.010, 1613) * 5.0;
      const phaseB = (familyB.v + warpB) * (Math.PI * 2 / 23.0)
        + valueNoise(x * 0.017 - 3.0, z * 0.019 + 1.5, 1619) * 1.05;
      const waveB = Math.cos(phaseB);
      const maskB = clamp(0.70 + valueNoise(x * 0.011 - 1.2, z * 0.010 + 2.8, 1621) * 0.44, 0.18, 1.0);

      // Two broken, warped structural families form irregular rhomboid/polygonal blocks rather than a perfect grid.
      const tesseraFabric = (waveA * 0.22 * maskA + waveB * 0.20 * maskB + waveA * waveB * 0.035) * envelope;

      // Broad block-scale irregularity makes the intersecting fabric read as tessera blocks rather than a perfect grid.
      const blockRelief = (valueNoise(x * 0.014 + 1.7, z * 0.014 - 2.2, 1627) - 0.48) * envelope * 0.30;

      // Several fault valleys interrupt and offset the fabric. Their floors are deliberately broad and relatively flat.
      const faultA = this.rotateLocal(x, z, 14, -12, 0.18);
      const faultACore = 1 - smoothstep((Math.abs(faultA.v) - 4.8) / 3.8);
      const faultValleyA = -faultACore * Math.exp(-((faultA.u / 88) ** 4)) * 0.46;

      const faultB = this.rotateLocal(x, z, -28, 18, -0.42);
      const faultBCenter = faultB.v - Math.sin(faultB.u * 0.030) * 5.0;
      const faultBCore = 1 - smoothstep((Math.abs(faultBCenter) - 5.5) / 4.2);
      const faultValleyB = -faultBCore * Math.exp(-((faultB.u / 72) ** 4)) * 0.36;

      // Volcanically resurfaced local lows interrupt the older tessera fabric.
      const lowA = -this.ellipseGaussian(x, z, -38, -34, 29, 21, 0.48);
      const lowB = -this.ellipseGaussian(x, z, 46, 24, 31, 22, 0.38);

      // Eve lies directly south of the complex ridged terrain in the NASA reference. Keep it subdued and broad.
      const eveLow = -this.ellipseGaussian(x, z, 10, 78, 38, 24, 0.30);
      const eveRim = Math.exp(-(((Math.hypot((x - 10) / 38, (z - 78) / 24) - 1.0) / 0.18) ** 2)) * 0.08;

      return upland + tesseraFabric + blockRelief + faultValleyA + faultValleyB
        + lowA + lowB + eveLow + eveRim;
    }

    morphologyHeightAt(x, z) {
      let morphology = 0;
      if (this.region.id === "maat") morphology = this.maatMorphologyAt(x, z);
      else if (this.region.id === "maxwell") morphology = this.maxwellMorphologyAt(x, z);
      else if (this.region.id === "aphrodite") morphology = this.aphroditeMorphologyAt(x, z);
      else if (this.region.id === "ishtar") morphology = this.ishtarMorphologyAt(x, z);
      else if (this.region.id === "alpha") morphology = this.alphaMorphologyAt(x, z);
      const sourceWeight = this.morphologyWeight ?? this.morphologySourceWeight();
      const farRadius = this.worldSpan * 0.53;
      const edgeFade = 1 - smoothstep((Math.hypot(x, z) - farRadius * 0.78) / Math.max(1, farRadius * 0.22));
      return morphology * sourceWeight * clamp(edgeFade, 0.18, 1);
    }

    morphologyDetailScaleAt(x, z) {
      if (this.region.id === "maat") {
        const shieldR = Math.hypot(x / 94, (z + 38) / 82);
        const flowA = Math.exp(-(((x - 17) / 17) ** 2)) * Math.exp(-(((z - 20) / 72) ** 2));
        return clamp(1.12 - flowA * 0.34 - Math.max(0, 0.35 - shieldR) * 0.25, 0.68, 1.16);
      }
      if (this.region.id === "maxwell") {
        const craterR = Math.hypot(x - 45, z + 36);
        return craterR < 26 ? 0.82 : 1.13;
      }
      if (this.region.id === "aphrodite") {
        const low = Math.max(
          this.ellipseGaussian(x, z, 42, 26, 34, 21, 1),
          this.ellipseGaussian(x, z, -48, -34, 27, 19, 1)
        );
        return clamp(1.14 - low * 0.58, 0.52, 1.16);
      }
      if (this.region.id === "ishtar") {
        const dx = (x + 10) / 72, dz = (z + 2) / 58;
        const superR = (Math.abs(dx) ** 5 + Math.abs(dz) ** 5) ** (1 / 5);
        const interior = 1 - smootherstep((superR - 0.62) / 0.25);
        return clamp(1.10 - interior * 0.58, 0.50, 1.14);
      }
      if (this.region.id === "alpha") {
        const low = Math.max(
          this.ellipseGaussian(x, z, -38, -34, 28, 22, 1),
          this.ellipseGaussian(x, z, 46, 24, 32, 23, 1)
        );
        return clamp(1.24 - low * 0.76, 0.46, 1.25);
      }
      return 1;
    }

    microHeightAt(x, z) {
      const r = Math.hypot(x, z);
      const detailFade = 1 - smoothstep((r - this.region.playRadius * 0.92) / Math.max(1, this.worldSpan * 0.42 - this.region.playRadius));
      const n1 = fbm(x * 0.080, z * 0.080, 31);
      const n2 = fbm(x * 0.19 + 7.1, z * 0.19 - 3.4, 73);
      const fractured = ridge(valueNoise(x * 0.12, z * 0.12, 109)) - 0.54;
      let meso = n1 * 0.075 + n2 * 0.035 + fractured * 0.035;

      // High-level identity lives in the dedicated morphology systems above.
      // These terms only enrich close-range material and sub-data-scale relief.
      if (this.region.id === "maat") {
        const flowTexture = ridge(valueNoise(x * 0.050 + z * 0.012, z * 0.072, 151));
        meso += (flowTexture - 0.58) * 0.075;
      } else if (this.region.id === "maxwell") {
        const aligned = ridge(valueNoise((x * 0.82 + z * 0.36) * 0.090, (-x * 0.36 + z * 0.82) * 0.038, 191));
        meso += (aligned - 0.56) * 0.11;
      } else if (this.region.id === "aphrodite") {
        const broken = ridge(valueNoise((x + z) * 0.078, (z - x) * 0.032, 229));
        meso += (broken - 0.57) * 0.085;
      } else if (this.region.id === "ishtar") {
        meso += n2 * 0.028;
      } else if (this.region.id === "alpha") {
        const a = ridge(valueNoise((x + z) * 0.115, (z - x) * 0.044, 269));
        const b = ridge(valueNoise((x - z) * 0.105, (x + z) * 0.039, 271));
        meso += (a - 0.55) * 0.095 + (b - 0.56) * 0.085;
      }
      return meso * this.morphologyDetailScaleAt(x, z) * clamp(detailFade, 0, 1);
    }

    heightAt(x, z) {
      return this.scientificHeightAt(x, z) + this.morphologyHeightAt(x, z) + this.microHeightAt(x, z);
    }

    slopeAt(x, z, epsilon = 0.22) {
      const hL = this.heightAt(x - epsilon, z), hR = this.heightAt(x + epsilon, z);
      const hD = this.heightAt(x, z - epsilon), hU = this.heightAt(x, z + epsilon);
      return Math.hypot((hR - hL) / (epsilon * 2), (hU - hD) / (epsilon * 2));
    }

    colorAt(x, z, height, slope, target = this.tmpColor) {
      const localNoise = fbm(x * 0.032 + 4.7, z * 0.032 - 9.2, 313);
      const normalized = clamp((height + 1.2) / 8.8, 0, 1);
      if (normalized < 0.46) target.copy(this.lowColor).lerp(this.midColor, normalized / 0.46);
      else target.copy(this.midColor).lerp(this.highColor, (normalized - 0.46) / 0.54);
      const rockMix = clamp((slope - 0.11) * 1.9 + Math.max(0, localNoise) * 0.13, 0, 0.46);
      target.lerp(this.rockColor, rockMix);
      target.multiplyScalar(0.90 + localNoise * 0.10);
      return target;
    }

    createMaterial(radarTexture, background = false) {
      const T = this.THREE;
      const material = new T.MeshStandardMaterial({
        color: 0xffffff,
        vertexColors: true,
        map: radarTexture || null,
        bumpMap: this.detailTexture,
        bumpScale: 0.001,
        roughness: background ? 0.98 : this.quality.name === "HIGH" ? 0.885 : this.quality.name === "MEDIUM" ? 0.90 : 0.92,
        metalness: 0.0,
        fog: true,
        dithering: true
      });
      material.name = background ? "venus-gtdr-background-material" : "venus-gtdr-surface-material";
      material.onBeforeCompile = shader => {
        shader.uniforms.uVenusMicroDetail = { value: this.detailTexture };
        shader.uniforms.uVenusAlbedoDetail = { value: background ? 0.055 : this.quality.name === "HIGH" ? 0.20 : this.quality.name === "MEDIUM" ? 0.16 : 0.12 };
        shader.uniforms.uVenusNormalDetail = { value: background ? 0.7 : this.quality.name === "HIGH" ? 5.1 : this.quality.name === "MEDIUM" ? 3.9 : 2.8 };
        shader.uniforms.uVenusDetailTier = { value: background ? 1.0 : 3.0 };
        shader.vertexShader = shader.vertexShader
          .replace("#include <common>", "#include <common>\nvarying vec3 vAntaraWorld;")
          .replace("#include <begin_vertex>", "#include <begin_vertex>\nvAntaraWorld = (modelMatrix * vec4(transformed, 1.0)).xyz;");
        shader.fragmentShader = shader.fragmentShader
          .replace("#include <common>", `#include <common>
            varying vec3 vAntaraWorld;
            uniform sampler2D uVenusMicroDetail;
            uniform float uVenusAlbedoDetail;
            uniform float uVenusNormalDetail;
            uniform float uVenusDetailTier;

            float venusTriSample(sampler2D tex, vec3 p, vec3 n, float scale, vec3 phase) {
              vec3 blend = pow(max(abs(n), vec3(0.0001)), vec3(5.0));
              blend /= max(blend.x + blend.y + blend.z, 0.0001);
              float sx = texture2D(tex, p.yz * scale + phase.yz).r;
              float sy = texture2D(tex, p.xz * scale + phase.xz).r;
              float sz = texture2D(tex, p.xy * scale + phase.xy).r;
              return sx * blend.x + sy * blend.y + sz * blend.z;
            }`)
          .replace("#include <map_fragment>", `#include <map_fragment>
            vec3 venusDx = dFdx(vAntaraWorld);
            vec3 venusDy = dFdy(vAntaraWorld);
            vec3 venusGeomNormal = normalize(cross(venusDx, venusDy));
            if (!gl_FrontFacing) venusGeomNormal = -venusGeomNormal;
            float venusViewDistance = length(cameraPosition - vAntaraWorld);
            float venusNearWeight = 1.0 - smoothstep(1.0, 13.0, venusViewDistance);
            float venusMidWeight = 1.0 - smoothstep(6.0, 42.0, venusViewDistance);
            float venusBroad = 0.5;
            float venusFine = 0.5;
            float venusGrit = 0.5;
            if (uVenusDetailTier > 0.5) venusBroad = venusTriSample(uVenusMicroDetail, vAntaraWorld, venusGeomNormal, 0.16, vec3(0.19, 0.47, 0.71));
            if (uVenusDetailTier > 1.5) venusFine = venusTriSample(uVenusMicroDetail, vAntaraWorld, venusGeomNormal, 0.78, vec3(0.63, 0.11, 0.39));
            if (uVenusDetailTier > 2.5) venusGrit = venusTriSample(uVenusMicroDetail, vAntaraWorld, venusGeomNormal, 2.10, vec3(0.31, 0.79, 0.09));
            float venusMicro = (venusBroad - 0.5) * 0.50 * venusMidWeight
              + (venusFine - 0.5) * 0.36 * venusNearWeight
              + (venusGrit - 0.5) * 0.14 * venusNearWeight;
            float venusMicroHeight = (venusBroad - 0.5) * 0.54 * venusMidWeight
              + (venusFine - 0.5) * 0.34 * venusNearWeight
              + (venusGrit - 0.5) * 0.12 * venusNearWeight;
            diffuseColor.rgb *= clamp(1.0 + venusMicro * uVenusAlbedoDetail, 0.87, 1.13);`)
          .replace("#include <normal_fragment_maps>", `#include <normal_fragment_maps>
            #ifdef USE_BUMPMAP
              if (uVenusDetailTier > 1.5) {
                vec2 venusMicroSlope = vec2(dFdx(venusMicroHeight), dFdy(venusMicroHeight));
                normal = perturbNormalArb(-vViewPosition, normal, venusMicroSlope * uVenusNormalDetail, faceDirection);
              }
            #endif`)
          .replace("#include <roughnessmap_fragment>", `#include <roughnessmap_fragment>
            roughnessFactor = clamp(roughnessFactor + (0.5 - venusBroad) * 0.08 + (0.5 - venusGrit) * 0.045 * step(2.5, uVenusDetailTier), 0.72, 1.0);`);
        material.userData.venusShader = shader;
      };
      material.customProgramCacheKey = () => `antara-venus-gtdr-triplanar-v3-${background ? "background" : "surface"}-${this.quality.name}`;
      material.needsUpdate = true;
      return material;
    }

    geometryForPatch(centerX, centerZ, size, segments, background = false) {
      const T = this.THREE;
      const row = segments + 1;
      const positions = new Float32Array(row * row * 3);
      const colors = new Float32Array(row * row * 3);
      const uvs = new Float32Array(row * row * 2);
      const indices = new Uint32Array(segments * segments * 6);
      const half = size / 2;
      let p = 0, c = 0, uv = 0, q = 0;
      const radarExtent = this.radar.extentKm;
      for (let iz = 0; iz <= segments; iz += 1) {
        const z = centerZ - half + size * (iz / segments);
        for (let ix = 0; ix <= segments; ix += 1) {
          const x = centerX - half + size * (ix / segments);
          const scientific = this.scientificHeightAt(x, z);
          const morphology = this.morphologyHeightAt(x, z);
          const micro = background ? this.microHeightAt(x, z) * 0.18 : this.microHeightAt(x, z);
          const y = scientific + morphology + micro - (background ? 0.028 : 0);
          const slope = background ? 0.08 : this.slopeAt(x, z, Math.max(0.18, size / segments * 0.72));
          const color = this.colorAt(x, z, y, slope);
          const farFade = background ? smoothstep(Math.hypot(x, z) / (this.worldSpan * 0.54)) : 0;
          if (background) color.lerp(this.fogColor, farFade * 0.26).multiplyScalar(1 - farFade * 0.12);
          positions[p++] = x; positions[p++] = y; positions[p++] = z;
          colors[c++] = color.r; colors[c++] = color.g; colors[c++] = color.b;
          uvs[uv++] = clamp((x + radarExtent) / (radarExtent * 2), 0, 1);
          uvs[uv++] = clamp((radarExtent - z) / (radarExtent * 2), 0, 1);
        }
      }
      for (let iz = 0; iz < segments; iz += 1) {
        for (let ix = 0; ix < segments; ix += 1) {
          const a = iz * row + ix, b = a + 1, d = (iz + 1) * row + ix, e = d + 1;
          indices[q++] = a; indices[q++] = d; indices[q++] = b;
          indices[q++] = b; indices[q++] = d; indices[q++] = e;
        }
      }
      const geometry = new T.BufferGeometry();
      geometry.setAttribute("position", new T.BufferAttribute(positions, 3));
      geometry.setAttribute("color", new T.BufferAttribute(colors, 3));
      geometry.setAttribute("uv", new T.BufferAttribute(uvs, 2));
      geometry.setIndex(new T.BufferAttribute(indices, 1));
      geometry.computeVertexNormals();
      geometry.computeBoundingSphere();
      return geometry;
    }

    chooseSegments(cx, cz) {
      const distance = Math.hypot(cx, cz);
      if (distance < this.tileSize * 1.25) return this.quality.nearSegments;
      if (distance < this.tileSize * 2.75) return this.quality.midSegments;
      return this.quality.farSegments;
    }

    async build(onProgress = () => {}) {
      onProgress(0.01);
      await this.topography.load(value => onProgress(0.02 + value * 0.20));
      this.referenceElevation = this.topography.sample(this.region.latitude, this.region.longitudeEast);
      this.morphologyWeight = this.morphologySourceWeight();
      onProgress(0.24);
      const radarTexture = await this.radar.load().catch(() => null);
      onProgress(0.34);
      this.material = this.createMaterial(radarTexture, false);
      this.backgroundMaterial = this.createMaterial(radarTexture, true);
      this.resources.push(this.material, this.backgroundMaterial);

      const bgSegments = this.quality.name === "HIGH" ? 118 : this.quality.name === "MEDIUM" ? 92 : 70;
      this.background = new this.THREE.Mesh(this.geometryForPatch(0, 0, this.worldSpan, bgSegments, true), this.backgroundMaterial);
      this.background.name = `venus-scientific-visual-world-${this.region.id}`;
      this.background.frustumCulled = true;
      this.background.renderOrder = -2;
      this.group.add(this.background);
      onProgress(0.48);

      const half = this.tileHalfCount;
      const total = (half * 2 + 1) ** 2;
      let built = 0;
      for (let tz = -half; tz <= half; tz += 1) {
        for (let tx = -half; tx <= half; tx += 1) {
          const cx = tx * this.tileSize, cz = tz * this.tileSize;
          const segments = this.chooseSegments(cx, cz);
          const geometry = this.geometryForPatch(cx, cz, this.tileSize, segments, false);
          const mesh = new this.THREE.Mesh(geometry, this.material);
          mesh.name = `venus-gtdr-chunk-${tx}-${tz}`;
          mesh.frustumCulled = true;
          mesh.renderOrder = 1;
          this.group.add(mesh);
          this.tiles.push({ mesh, cx, cz, segments });
          built += 1;
          if (built % 4 === 0) {
            onProgress(0.48 + (built / total) * 0.35);
            await sleepFrame();
          }
        }
      }
      this.createGeologicalProps();
      this.createAtmosphericParticles();
      onProgress(1);
    }

    createGeologicalProps() {
      const T = this.THREE;
      const count = Math.max(0, this.quality.accentCount * 7);
      if (!count) return;
      const geometry = new T.DodecahedronGeometry(0.24, 0);
      const material = new T.MeshStandardMaterial({ color: this.region.palette.rock, roughness: 0.96, metalness: 0 });
      const mesh = new T.InstancedMesh(geometry, material, count);
      mesh.name = `venus-geologic-props-${this.region.id}`;
      const dummy = new T.Object3D();
      let written = 0;
      for (let i = 0; i < count * 5 && written < count; i += 1) {
        const angle = hash2(i, 7, 19) * Math.PI * 2;
        const radius = 8 + Math.sqrt(hash2(i, 11, 23)) * (this.region.playRadius - 12);
        const x = Math.cos(angle) * radius, z = Math.sin(angle) * radius;
        const slope = this.slopeAt(x, z, 0.35);
        const geologyGate = this.region.id === "maxwell" || this.region.id === "alpha" ? 0.11 : 0.07;
        if (slope < geologyGate && hash2(i, 13, 29) < 0.56) continue;
        const y = this.heightAt(x, z);
        const scale = 0.35 + hash2(i, 17, 31) * (this.region.id === "maxwell" ? 1.9 : 1.25);
        dummy.position.set(x, y + scale * 0.10, z);
        dummy.rotation.set(hash2(i, 2, 37) * 0.8, hash2(i, 3, 41) * Math.PI * 2, hash2(i, 5, 43) * 0.5);
        dummy.scale.set(scale * (0.75 + hash2(i, 19, 47) * 0.45), scale * (0.55 + hash2(i, 23, 53) * 0.50), scale);
        dummy.updateMatrix();
        mesh.setMatrixAt(written, dummy.matrix);
        written += 1;
      }
      mesh.count = written;
      mesh.instanceMatrix.needsUpdate = true;
      mesh.frustumCulled = true;
      this.group.add(mesh);
      this.props = mesh;
      this.resources.push(geometry, material);
    }

    createAtmosphericParticles() {
      const T = this.THREE;
      const count = this.quality.name === "LOW" ? 110 : this.quality.name === "HIGH" ? 260 : 180;
      const positions = new Float32Array(count * 3);
      for (let i = 0; i < count; i += 1) {
        const angle = hash2(i, 31, 71) * Math.PI * 2;
        const radius = 20 + Math.sqrt(hash2(i, 37, 73)) * 120;
        positions[i * 3] = Math.cos(angle) * radius;
        positions[i * 3 + 1] = 3 + hash2(i, 41, 79) * 21;
        positions[i * 3 + 2] = Math.sin(angle) * radius;
      }
      const geometry = new T.BufferGeometry();
      geometry.setAttribute("position", new T.BufferAttribute(positions, 3));
      const material = new T.PointsMaterial({ color: this.region.sun, size: 0.055, transparent: true, opacity: 0.16, depthWrite: false, fog: true });
      this.particles = new T.Points(geometry, material);
      this.particles.name = `venus-atmosphere-particulates-${this.region.id}`;
      this.group.add(this.particles);
      this.resources.push(geometry, material);
    }

    resolveObservationPosition(observation) {
      const anchor = observation.anchor || { x: 0, z: 0 };
      const searchRadius = observation.searchRadius || 11;
      const step = observation.searchStep || 2.75;
      const limit = Math.max(8, this.region.playRadius - 8);
      let best = null;
      const evaluate = (x, z) => {
        const radius = Math.hypot(x, z);
        if (radius > limit) return;
        const height = this.heightAt(x, z);
        const slope = this.slopeAt(x, z, 0.45);
        const localRelief = Math.max(
          Math.abs(this.heightAt(x + 2.2, z) - height),
          Math.abs(this.heightAt(x - 2.2, z) - height),
          Math.abs(this.heightAt(x, z + 2.2) - height),
          Math.abs(this.heightAt(x, z - 2.2) - height)
        );
        const offset = Math.hypot(x - anchor.x, z - anchor.z);
        let score = -offset * 0.035;
        switch (observation.placement) {
          case "slope-high": score += slope * 5.3 + localRelief * 1.8; break;
          case "slope-medium": score += 1.25 - Math.abs(slope - 0.18) * 4.1 + localRelief * 0.6; break;
          case "elevation-high": score += height * 0.72 + localRelief * 0.45 - Math.max(0, slope - 0.75); break;
          case "elevation-low": score += -height * 0.62 + Math.min(localRelief, 0.55) * 0.35 - Math.max(0, slope - 0.8); break;
          case "relief": score += localRelief * 4.2 + slope * 0.8; break;
          case "flat": score += 1.1 - slope * 3.8 + Math.min(localRelief, 0.18) * 0.25; break;
          default: score += 0.85 - slope * 1.35; break;
        }
        if (!best || score > best.score) best = { x, z, y: height, score, slope, localRelief };
      };
      evaluate(anchor.x, anchor.z);
      for (let dz = -searchRadius; dz <= searchRadius; dz += step) {
        for (let dx = -searchRadius; dx <= searchRadius; dx += step) evaluate(anchor.x + dx, anchor.z + dz);
      }
      const chosen = best || { x: anchor.x, z: anchor.z, y: this.heightAt(anchor.x, anchor.z), slope: 0, localRelief: 0 };
      const geo = this.geoFromWorld(chosen.x, chosen.z);
      return { ...observation, x: chosen.x, y: chosen.y, z: chosen.z, slope: chosen.slope, localRelief: chosen.localRelief, geo };
    }

    createEducationalMarkers(observations = []) {
      const T = this.THREE;
      if (this.observationGroup) this.group.remove(this.observationGroup);
      this.observationMarkers.clear();
      const resolved = observations.map(observation => this.resolveObservationPosition(observation));
      if (!resolved.length) return resolved;

      this.observationGroup = new T.Group();
      this.observationGroup.name = `venus-education-markers-${this.region.id}`;
      this.group.add(this.observationGroup);
      const ringGeometry = new T.TorusGeometry(0.34, 0.022, 7, 28);
      const stemGeometry = new T.CylinderGeometry(0.012, 0.012, 0.48, 7);
      const coreGeometry = new T.OctahedronGeometry(0.105, 0);
      this.resources.push(ringGeometry, stemGeometry, coreGeometry);

      resolved.forEach((observation, index) => {
        const marker = new T.Group();
        marker.name = `venus-observation-${observation.id}`;
        marker.position.set(observation.x, observation.y + 0.035, observation.z);
        marker.userData.observationId = observation.id;
        marker.userData.phase = hash2(index + 1, 97, 131) * Math.PI * 2;

        const ringMaterial = new T.MeshBasicMaterial({ color: 0xf1bd75, transparent: true, opacity: 0.48, depthWrite: false, fog: true });
        const stemMaterial = new T.MeshBasicMaterial({ color: 0xf4c889, transparent: true, opacity: 0.24, depthWrite: false, fog: true });
        const coreMaterial = new T.MeshBasicMaterial({ color: 0xffd99f, transparent: true, opacity: 0.82, depthWrite: false, fog: true });
        this.resources.push(ringMaterial, stemMaterial, coreMaterial);

        const ring = new T.Mesh(ringGeometry, ringMaterial);
        ring.rotation.x = Math.PI / 2;
        ring.position.y = 0.025;
        const stem = new T.Mesh(stemGeometry, stemMaterial);
        stem.position.y = 0.27;
        const core = new T.Mesh(coreGeometry, coreMaterial);
        core.position.y = 0.56;
        marker.add(ring, stem, core);
        marker.userData.ring = ring;
        marker.userData.stem = stem;
        marker.userData.core = core;
        marker.userData.materials = { ring: ringMaterial, stem: stemMaterial, core: coreMaterial };
        this.observationGroup.add(marker);
        this.observationMarkers.set(observation.id, marker);
      });
      return resolved;
    }

    updateObservationMarkers(activeId, discoveredIds, delta = 0) {
      this.observationTime += delta;
      for (const [id, marker] of this.observationMarkers) {
        const active = id === activeId;
        const discovered = discoveredIds?.has?.(id);
        const { ring, core, materials } = marker.userData;
        if (!ring || !core || !materials) continue;
        const pulse = 1 + (active ? Math.sin(this.observationTime * 3.0 + marker.userData.phase) * 0.08 : 0);
        marker.scale.setScalar(active ? 1.14 * pulse : discovered ? 0.86 : 1);
        materials.ring.opacity = active ? 0.88 : discovered ? 0.20 : 0.48;
        materials.stem.opacity = active ? 0.42 : discovered ? 0.10 : 0.24;
        materials.core.opacity = active ? 1 : discovered ? 0.38 : 0.82;
        materials.ring.color.setHex(active ? 0xffe0a6 : discovered ? 0xb38d62 : 0xf1bd75);
        materials.core.color.setHex(active ? 0xffe7b9 : discovered ? 0xb9a17f : 0xffd99f);
        core.rotation.y += delta * (active ? 1.35 : 0.42);
      }
    }

    updateVisibility(camera) {
      if (!camera) return;
      this.frame += 1;
      if (this.frame % 12 !== 0) return;
      const headingX = -Math.sin(camera.rotation.y), headingZ = -Math.cos(camera.rotation.y);
      for (const entry of this.tiles) {
        const dx = entry.cx - camera.position.x, dz = entry.cz - camera.position.z;
        const distance = Math.hypot(dx, dz);
        const forwardDot = distance > 0.001 ? (dx * headingX + dz * headingZ) / distance : 1;
        entry.mesh.visible = distance < 170 && (distance < 70 || forwardDot > -0.82);
      }
    }

    updateAmbient(delta) {
      if (this.particles) this.particles.rotation.y += delta * 0.008;
    }

    dispose() {
      this.scene.remove(this.group);
      for (const entry of this.tiles) entry.mesh.geometry.dispose();
      this.tiles.length = 0;
      this.background?.geometry?.dispose?.();
      this.radar.dispose();
      this.topography.clear();
      const seen = new Set();
      for (const resource of this.resources) {
        if (!resource || seen.has(resource)) continue;
        seen.add(resource);
        resource.dispose?.();
      }
      this.resources.length = 0;
      this.group.clear();
      this.background = null;
      this.props = null;
      this.particles = null;
      this.observationGroup = null;
      this.observationMarkers.clear();
      this.material = null;
      this.backgroundMaterial = null;
    }
  }

  class VenusInputManager {
    constructor(controller) {
      this.controller = controller;
      this.keys = new Set();
      this.pointerActions = new Map();
      this.dragPointers = new Map();
      this.dragPointer = null;
      this.bound = false;
      this.abortController = null;
    }

    bind() {
      if (this.bound) return;
      this.bound = true;
      this.abortController = new AbortController();
      const signal = this.abortController.signal;
      const viewport = this.controller.viewport;
      window.addEventListener("keydown", event => this.onKeyDown(event), { signal, capture: true });
      window.addEventListener("keyup", event => this.onKeyUp(event), { signal, capture: true });
      window.addEventListener("blur", () => this.clear(), { signal });
      viewport.addEventListener("pointerdown", event => this.onLookStart(event), { signal });
      viewport.addEventListener("pointermove", event => this.onLookMove(event), { signal });
      viewport.addEventListener("pointerup", event => this.onLookEnd(event), { signal });
      viewport.addEventListener("pointercancel", event => this.onLookEnd(event), { signal });
      viewport.addEventListener("contextmenu", event => event.preventDefault(), { signal });
      document.addEventListener("mousemove", event => this.onLockedMouseMove(event), { signal });
      document.addEventListener("pointerlockchange", () => this.onPointerLockChange(), { signal });
      this.controller.root.querySelectorAll("[data-venus-control]").forEach(button => {
        button.addEventListener("pointerdown", event => this.onControlStart(event, button), { signal });
        button.addEventListener("pointerup", event => this.onControlEnd(event), { signal });
        button.addEventListener("pointercancel", event => this.onControlEnd(event), { signal });
        button.addEventListener("lostpointercapture", event => this.onControlEnd(event), { signal });
        button.addEventListener("contextmenu", event => event.preventDefault(), { signal });
      });
    }

    unbind() {
      if (document.pointerLockElement === this.controller.viewport) document.exitPointerLock?.();
      this.abortController?.abort();
      this.abortController = null;
      this.bound = false;
      this.controller.root?.classList.remove("is-pointer-locked");
      this.clear();
    }

    interactive() { return this.controller.state === STATES.EXPLORING && !this.controller.isObservationCardOpen?.(); }

    onKeyDown(event) {
      if (!this.controller.active) return;
      const key = event.key.toLowerCase();
      if (!["w", "a", "s", "d", "q", "e", "shift", "control", "escape"].includes(key)) return;
      event.preventDefault();
      event.stopImmediatePropagation();
      if (key === "escape") {
        if (event.repeat) return;
        if (this.controller.isObservationCardOpen?.()) {
          this.controller.closeObservationCard?.();
          this.clear();
          return;
        }
        if (this.controller.isObjectivesExpanded?.()) {
          this.controller.collapseObjectives?.();
          this.clear();
          return;
        }
        if (document.pointerLockElement === this.controller.viewport) document.exitPointerLock?.();
        if (this.controller.state === STATES.SELECTING && this.controller.regionWorld) this.controller.closeSelectorToRegion();
        else this.controller.exit();
        return;
      }
      if (!this.interactive()) return;
      if (key === "e" && !event.repeat && this.controller.tryObserveNearby?.()) {
        this.keys.delete("e");
        this.controller.dismissTutorial();
        return;
      }
      this.keys.add(key);
      this.controller.dismissTutorial();
    }

    onKeyUp(event) {
      if (!this.controller.active) return;
      const key = event.key.toLowerCase();
      if (!["w", "a", "s", "d", "q", "e", "shift", "control"].includes(key)) return;
      event.preventDefault();
      event.stopImmediatePropagation();
      this.keys.delete(key);
    }

    onLookStart(event) {
      if (!this.interactive()) return;
      if (event.target.closest("button, a, [data-venus-ui], .venus-region-selector")) return;
      if (event.pointerType === "mouse") {
        if (event.button !== 0) return;
        this.controller.dismissTutorial();
        if (this.controller.viewport.requestPointerLock && document.pointerLockElement !== this.controller.viewport) {
          try { this.controller.viewport.requestPointerLock(); } catch {}
        }
        return;
      }
      this.dragPointer = event.pointerId;
      this.dragPointers.set(event.pointerId, { x: event.clientX, y: event.clientY });
      this.controller.viewport.setPointerCapture?.(event.pointerId);
      this.controller.dismissTutorial();
    }

    onLookMove(event) {
      if (!this.interactive() || this.dragPointer !== event.pointerId) return;
      const previous = this.dragPointers.get(event.pointerId);
      if (!previous) return;
      const dx = event.clientX - previous.x;
      const dy = event.clientY - previous.y;
      previous.x = event.clientX;
      previous.y = event.clientY;
      this.controller.addLookDelta(dx, dy, event.pointerType === "touch" ? "touch" : "mouse");
    }

    onLockedMouseMove(event) {
      if (!this.interactive() || document.pointerLockElement !== this.controller.viewport) return;
      this.controller.addLookDelta(event.movementX || 0, event.movementY || 0, "locked");
    }

    onPointerLockChange() {
      const locked = document.pointerLockElement === this.controller.viewport;
      this.controller.root.classList.toggle("is-pointer-locked", locked);
      if (!locked) this.keys.clear();
    }

    onLookEnd(event) {
      this.dragPointers.delete(event.pointerId);
      if (this.dragPointer === event.pointerId) this.dragPointer = null;
    }

    onControlStart(event, button) {
      if (!this.interactive()) return;
      event.preventDefault();
      event.stopPropagation();
      button.setPointerCapture?.(event.pointerId);
      this.pointerActions.set(event.pointerId, button.dataset.venusControl);
      button.classList.add("is-held");
      this.controller.dismissTutorial();
    }

    onControlEnd(event) {
      const action = this.pointerActions.get(event.pointerId);
      this.pointerActions.delete(event.pointerId);
      if (!action) return;
      event.currentTarget?.classList?.remove("is-held");
    }

    actionActive(action) {
      if ([...this.pointerActions.values()].includes(action)) return true;
      if (action === "forward") return this.keys.has("w");
      if (action === "backward") return this.keys.has("s");
      if (action === "left") return this.keys.has("a");
      if (action === "right") return this.keys.has("d");
      if (action === "down") return this.keys.has("q");
      if (action === "up") return this.keys.has("e");
      return false;
    }

    movementAxes() {
      return {
        forward: Number(this.actionActive("forward")) - Number(this.actionActive("backward")),
        strafe: Number(this.actionActive("right")) - Number(this.actionActive("left")),
        vertical: Number(this.actionActive("up")) - Number(this.actionActive("down"))
      };
    }

    boost() { return this.keys.has("shift"); }
    precision() { return this.keys.has("control"); }
    clear() {
      this.keys.clear();
      this.pointerActions.clear();
      this.dragPointers.clear();
      this.dragPointer = null;
      this.controller.root?.querySelectorAll(".is-held").forEach(button => button.classList.remove("is-held"));
    }
  }

  window.VenusFullExploration = class VenusFullExploration {
    constructor(venusScene) {
      this.venus = venusScene;
      this.root = document.getElementById("venus-full-exploration");
      this.viewport = document.getElementById("venus-full-viewport");
      this.entryButton = document.getElementById("venus-full-explore-button");
      this.selector = document.getElementById("venus-region-selector");
      this.selectorGrid = document.getElementById("venus-region-grid");
      this.selectorClose = document.getElementById("venus-region-selector-close");
      this.exitButton = document.getElementById("venus-full-exit");
      this.fullscreenButton = document.getElementById("venus-fullscreen-toggle");
      this.locationButton = document.getElementById("venus-location-toggle");
      this.loading = document.getElementById("venus-full-loading");
      this.loadingStatus = document.getElementById("venus-full-loading-status");
      this.loadingProgress = document.getElementById("venus-full-loading-progress");
      this.errorPanel = document.getElementById("venus-full-error");
      this.errorMessage = document.getElementById("venus-full-error-message");
      this.errorReturn = document.getElementById("venus-full-error-return");
      this.tutorial = document.getElementById("venus-full-tutorial");
      this.tutorialClose = document.getElementById("venus-tutorial-close");
      this.travelVeil = document.getElementById("venus-travel-veil");
      this.travelLabel = document.getElementById("venus-travel-label");
      this.boundaryHint = document.getElementById("venus-boundary-hint");
      this.infoCard = document.getElementById("venus-landmark-card");
      this.infoMinimize = document.getElementById("venus-landmark-minimize");
      this.infoToggle = document.getElementById("venus-info-toggle");
      this.infoMedia = document.getElementById("venus-landmark-media");
      this.infoName = document.getElementById("venus-landmark-name");
      this.infoType = document.getElementById("venus-landmark-type");
      this.infoCoords = document.getElementById("venus-landmark-coords");
      this.infoImage = document.getElementById("venus-landmark-image");
      this.infoDescription = document.getElementById("venus-landmark-description");
      this.infoFacts = document.getElementById("venus-landmark-facts");
      this.infoBadge = document.getElementById("venus-landmark-data-badge");
      this.infoVisualizationNote = document.getElementById("venus-landmark-visualization-note");
      this.infoSource = document.getElementById("venus-landmark-source");
      this.infoCoordinateSource = document.getElementById("venus-landmark-coordinate-source");
      this.hudCoordinates = document.getElementById("venus-hud-coordinates");
      this.hudAltitude = document.getElementById("venus-hud-altitude");
      this.hudAltitudeLimit = document.getElementById("venus-hud-altitude-limit");
      this.hudSpeed = document.getElementById("venus-hud-speed");
      this.hudLocation = document.getElementById("venus-hud-location");
      this.hudDistance = document.getElementById("venus-hud-distance");
      this.hudRegionType = document.getElementById("venus-hud-region-type");
      this.hudData = document.getElementById("venus-hud-data");
      this.objectivesPanel = document.getElementById("venus-objectives-panel");
      this.objectivesRegion = document.getElementById("venus-objectives-region");
      this.objectivesIntro = document.getElementById("venus-objectives-intro");
      this.objectivesList = document.getElementById("venus-objectives-list");
      this.objectivesCollapse = document.getElementById("venus-objectives-collapse");
      this.objectivesToggle = document.getElementById("venus-objectives-toggle");
      this.discoveryCount = document.getElementById("venus-discovery-count");
      this.discoveryBar = document.getElementById("venus-discovery-bar");
      this.nextTarget = document.getElementById("venus-next-target");
      this.nextTargetName = document.getElementById("venus-next-target-name");
      this.nextTargetDistance = document.getElementById("venus-next-target-distance");
      this.observationPrompt = document.getElementById("venus-observation-prompt");
      this.observationPromptTitle = document.getElementById("venus-observation-prompt-title");
      this.observeButton = document.getElementById("venus-observe-button");
      this.observationCard = document.getElementById("venus-observation-card");
      this.observationClose = document.getElementById("venus-observation-close");
      this.observationType = document.getElementById("venus-observation-type");
      this.observationStatus = document.getElementById("venus-observation-status");
      this.observationTitle = document.getElementById("venus-observation-title");
      this.observationMeta = document.getElementById("venus-observation-meta");
      this.observationLead = document.getElementById("venus-observation-lead");
      this.observationSections = document.getElementById("venus-observation-sections");
      this.observationComparison = document.getElementById("venus-observation-comparison");
      this.observationWhy = document.getElementById("venus-observation-why");
      this.observationMore = document.getElementById("venus-observation-more");
      this.observationDeep = document.getElementById("venus-observation-deep");
      this.observationSourceNote = document.getElementById("venus-observation-source-note");
      this.observationSource = document.getElementById("venus-observation-source");

      this.state = STATES.IDLE;
      this.region = REGIONS[0];
      this.regionWorld = null;
      this.renderer = null;
      this.scene = null;
      this.camera = null;
      this.hemiLight = null;
      this.sunLight = null;
      this.fillLight = null;
      this.frame = null;
      this.previous = 0;
      this.statsClock = 0;
      this.statsFrames = 0;
      this.lowFpsWindows = 0;
      this.highFpsWindows = 0;
      this.currentDpr = 1;
      this.idealDpr = 1;
      this.transitionToken = 0;
      this.resourceGeneration = 0;
      this.preparingPromise = null;
      this.speed = 0;
      this.yaw = 0;
      this.pitch = -0.22;
      this.lookYawTarget = this.yaw;
      this.lookPitchTarget = this.pitch;
      this.velocity = { x: 0, y: 0, z: 0 };
      this.lastGround = 0;
      this.cameraAltitude = 2.7;
      this.selectorOpenedFromRegion = false;
      this.tutorialTimeout = null;
      this.hudClock = 0;
      this.educationClock = 0;
      this.resolvedObservations = [];
      this.discovered = new Set();
      this.nearbyObservation = null;
      this.activeObservation = null;
      this.selectedTarget = null;
      this.quality = this.detectQuality();
      this.input = new VenusInputManager(this);
      this.tick = this.tick.bind(this);
      this.root.inert = true;
      this.buildSelector();
      this.bindUI();
    }

    get active() { return this.state !== STATES.IDLE; }

    detectQuality() {
      const width = window.innerWidth;
      const cores = navigator.hardwareConcurrency || 4;
      const memory = navigator.deviceMemory || 4;
      const coarse = window.matchMedia("(pointer: coarse)").matches;
      if (coarse || width <= 760 || cores <= 4 || memory <= 3) {
        return { name: "LOW", tileSize: 28, nearSegments: 72, midSegments: 44, farSegments: 24, maxDpr: 1.25, minDpr: 0.88, supersample: 1, pixelBudget: 2600000, anisotropy: 4, accentCount: 8 };
      }
      if (cores >= 8 && memory >= 6) {
        return { name: "HIGH", tileSize: 24, nearSegments: 176, midSegments: 104, farSegments: 48, maxDpr: 1.85, minDpr: 0.95, supersample: 1.18, pixelBudget: 6800000, anisotropy: 12, accentCount: 18 };
      }
      return { name: "MEDIUM", tileSize: 26, nearSegments: 112, midSegments: 68, farSegments: 34, maxDpr: 1.55, minDpr: 0.92, supersample: 1.08, pixelBudget: 4700000, anisotropy: 8, accentCount: 12 };
    }

    calculateIdealDpr() {
      const width = Math.max(1, this.viewport?.clientWidth || window.innerWidth);
      const height = Math.max(1, this.viewport?.clientHeight || window.innerHeight);
      const requested = Math.max(window.devicePixelRatio || 1, this.quality.supersample);
      const budget = Math.sqrt(this.quality.pixelBudget / (width * height));
      return clamp(Math.min(requested, this.quality.maxDpr, budget), this.quality.minDpr, this.quality.maxDpr);
    }

    buildSelector() {
      const fragment = document.createDocumentFragment();
      REGIONS.forEach((region, index) => {
        const button = document.createElement("button");
        button.type = "button";
        button.className = "venus-region-card";
        button.dataset.venusRegion = region.id;
        button.innerHTML = `<span class="venus-region-preview venus-region-preview-${region.id}" aria-hidden="true"><i></i><b>${region.short}</b></span><span class="venus-region-index">${String(index + 1).padStart(2, "0")}</span><strong>${region.name}</strong><span class="venus-region-descriptor">${region.descriptor}</span><small>${formatCoordinate(region.latitude, region.longitudeEast)}</small><em>${region.category}</em><span class="venus-region-source">NASA/JPL · referensi Magellan</span>`;
        fragment.append(button);
      });
      this.selectorGrid.replaceChildren(fragment);
    }

    bindUI() {
      this.entryButton.addEventListener("click", () => this.enter());
      this.selectorGrid.addEventListener("click", event => {
        const button = event.target.closest("[data-venus-region]");
        if (!button) return;
        const region = REGIONS.find(item => item.id === button.dataset.venusRegion);
        if (region) this.chooseRegion(region);
      });
      this.selectorClose.addEventListener("click", () => {
        if (this.selectorOpenedFromRegion && this.regionWorld) this.closeSelectorToRegion();
        else this.exit();
      });
      this.exitButton.addEventListener("click", () => this.exit());
      this.locationButton.addEventListener("click", () => this.openSelectorFromRegion());
      this.fullscreenButton.addEventListener("click", () => this.toggleFullscreen());
      this.errorReturn.addEventListener("click", () => this.failBackToOrbit());
      this.tutorialClose.addEventListener("click", () => this.dismissTutorial(true));
      this.infoMinimize.addEventListener("click", event => { event.stopPropagation(); this.hideRegionInfo(); });
      this.infoToggle.addEventListener("click", event => { event.stopPropagation(); this.showRegionInfo(true); });
      this.infoMedia.addEventListener("click", event => { event.stopPropagation(); this.openReferenceImage(); });
      this.objectivesCollapse?.addEventListener("click", () => this.collapseObjectives());
      this.objectivesToggle?.addEventListener("click", () => this.expandObjectives(true));
      this.observeButton?.addEventListener("click", () => this.tryObserveNearby());
      this.observationClose?.addEventListener("click", () => this.closeObservationCard(true));
      document.addEventListener("fullscreenchange", () => this.updateFullscreenLabel());
      document.addEventListener("visibilitychange", () => {
        if (!this.active) return;
        if (document.hidden) this.stopLoop(); else this.startLoop();
      });
      window.addEventListener("resize", () => this.resize());
      window.addEventListener("orientationchange", () => window.setTimeout(() => this.resize(), 120));
      document.addEventListener("keydown", event => {
        if (event.key !== "Escape" || this.state !== STATES.SELECTING) return;
        event.preventDefault();
        event.stopImmediatePropagation();
        if (this.selectorOpenedFromRegion && this.regionWorld) this.closeSelectorToRegion();
        else this.exit();
      }, true);
    }

    enter() {
      if (!this.venus.active || this.venus.travelMode || this.state !== STATES.IDLE) return;
      if (this.venus.exploring) this.venus.exitExploration();
      this.entryButton.disabled = true;
      this.selectorOpenedFromRegion = false;
      this.state = STATES.SELECTING;
      this.root.hidden = false;
      this.root.inert = false;
      this.root.setAttribute("aria-hidden", "false");
      this.root.className = "mars-full-exploration venus-full-exploration is-selecting";
      this.root.style.setProperty("--surface-opacity", "0");
      this.root.style.setProperty("--entry-progress", "0");
      this.selector.hidden = false;
      this.resetEducationUI();
      this.loading.hidden = true;
      this.errorPanel.hidden = true;
      this.infoCard.classList.remove("is-visible");
      this.infoCard.setAttribute("aria-hidden", "true");
      this.infoToggle.hidden = true;
      this.resetEducationUI();
      document.getElementById("mission").classList.add("is-venus-full-selecting");
      document.getElementById("announcement").textContent = "Pilih destinasi Eksplorasi Pengalaman Penuh Venus.";
      requestAnimationFrame(() => this.selector.querySelector("[data-venus-region]")?.focus({ preventScroll: true }));
    }

    async chooseRegion(region) {
      if (![STATES.SELECTING, STATES.EXPLORING].includes(this.state)) return;
      const switching = Boolean(this.regionWorld);
      const token = ++this.transitionToken;
      this.region = region;
      this.selector.hidden = true;
      this.selectorOpenedFromRegion = false;
      this.input.clear();
      this.input.unbind();
      this.stopLoop();
      this.tutorial.classList.remove("is-visible");
      this.infoCard.classList.remove("is-visible");
      this.infoCard.setAttribute("aria-hidden", "true");
      this.infoToggle.hidden = true;
      this.resetEducationUI();
      this.errorPanel.hidden = true;
      this.state = switching ? STATES.SWITCHING : STATES.PREPARING;
      this.root.classList.remove("is-selecting", "is-active", "is-error");
      this.root.classList.add("is-preparing");
      document.getElementById("mission").classList.remove("is-venus-full-selecting");
      document.getElementById("mission").classList.add("is-venus-full");
      this.setLoading(0.03, `MENGUNCI DESTINASI · ${region.name.toUpperCase()}`);
      this.loading.hidden = false;
      this.travelLabel.textContent = `NAVIGASI · ${region.name.toUpperCase()}`;
      if (switching) this.travelVeil.classList.add("is-visible", "is-covered");
      document.getElementById("announcement").textContent = `Menyiapkan wilayah ${region.name}.`;

      try {
        if (!this.venus.startFullExplorationTransition?.(region) && !this.venus.fullExplorationActive) throw new Error("Transisi Venus tidak tersedia.");
        await this.prepareRenderer();
        if (token !== this.transitionToken) return;
        this.disposeRegion();
        this.applyRegionEnvironment(region);
        this.setLoading(0.10, `MEMUAT MAGELLAN GTDR · ${region.category}`);
        this.regionWorld = new VenusRegionWorld(this.THREE, this.scene, this.renderer, region, this.quality);
        await this.regionWorld.build(progress => this.setLoading(0.10 + progress * 0.76, `MEMBANGUN MEDAN GTDR · ${Math.round(progress * 100)}%`));
        if (token !== this.transitionToken) return;
        this.resolvedObservations = this.regionWorld.createEducationalMarkers(region.education?.observations || []);
        this.loadDiscoveryState();
        this.setCameraForRegion(region, switching ? 12 : 24);
        this.updateRegionUI();
        this.setupEducationUI();
        this.setLoading(1, "WILAYAH SIAP");
        await wait(this.venus.motion.matches ? 80 : 180);
        if (token !== this.transitionToken) return;
        if (switching) await this.runRegionSwitchTransition(token);
        else await this.runEntryTransition(token);
      } catch (error) {
        if (token !== this.transitionToken) return;
        this.showError(error);
      }
    }

    async prepareRenderer() {
      if (this.renderer) return;
      if (this.preparingPromise) return this.preparingPromise;
      const generation = this.resourceGeneration;
      const promise = (async () => {
        await this.venus.prepare();
        if (generation !== this.resourceGeneration) throw new Error("Persiapan eksplorasi Venus dibatalkan.");
        const T = this.venus.THREE;
        if (!T) throw new Error("Sistem grafis 3D Venus tidak tersedia pada perangkat ini.");
        this.THREE = T;
        const canvas = document.createElement("canvas");
        canvas.className = "mars-full-canvas venus-full-canvas";
        canvas.setAttribute("aria-hidden", "true");
        const context = canvas.getContext("webgl2", { alpha: true, antialias: this.quality.name !== "LOW", powerPreference: "high-performance" });
        if (!context) throw new Error("WebGL2 diperlukan untuk Eksplorasi Pengalaman Penuh Venus.");
        this.renderer = new T.WebGLRenderer({ canvas, context, alpha: true, antialias: this.quality.name !== "LOW" });
        this.renderer.outputColorSpace = T.SRGBColorSpace;
        this.renderer.toneMapping = T.ACESFilmicToneMapping;
        this.renderer.toneMappingExposure = 1.02;
        this.idealDpr = this.calculateIdealDpr();
        this.currentDpr = this.idealDpr;
        this.renderer.setPixelRatio(this.currentDpr);
        this.renderer.setClearColor(0x7b4a38, 1);
        this.viewport.replaceChildren(canvas);
        this.scene = new T.Scene();
        this.camera = new T.PerspectiveCamera(this.mobileFov(), 1, 0.05, 420);
        this.camera.rotation.order = "YXZ";
        this.hemiLight = new T.HemisphereLight(0xe8b889, 0x2d1a18, 1.0);
        this.sunLight = new T.DirectionalLight(0xffd0a0, 2.45);
        this.sunLight.position.set(-45, 68, 30);
        this.fillLight = new T.DirectionalLight(0xb27862, 0.22);
        this.fillLight.position.set(42, 18, -34);
        this.scene.add(this.hemiLight, this.sunLight, this.fillLight);
        this.moveForward = new T.Vector3();
        this.moveRight = new T.Vector3();
        this.moveIntent = new T.Vector3();
        this.resize();
      })();
      this.preparingPromise = promise;
      try { await promise; }
      finally { if (this.preparingPromise === promise) this.preparingPromise = null; }
    }

    applyRegionEnvironment(region) {
      if (!this.scene || !this.renderer) return;
      this.scene.fog = new this.THREE.FogExp2(region.fog, region.fogDensity);
      this.renderer.setClearColor(region.sky, 1);
      this.renderer.toneMappingExposure = region.exposure || 1.04;
      this.hemiLight.color.set(region.hemi);
      this.hemiLight.groundColor.set(region.id === "maat" ? 0x35110f : 0x2a1715);
      this.hemiLight.intensity = region.id === "maat" ? 1.10 : 1.03;
      this.sunLight.color.set(region.sun);
      this.sunLight.intensity = region.id === "maat" ? 2.58 : 2.38;
      this.fillLight.color.set(region.id === "maat" ? 0xff633d : 0xb65a43);
      this.fillLight.intensity = region.id === "maat" ? 0.34 : 0.25;
      this.root.dataset.region = region.id;
    }

    setCameraForRegion(region, altitude = 2.7) {
      const ground = this.regionWorld.heightAt(region.spawn.x, region.spawn.z);
      this.lastGround = ground;
      this.cameraAltitude = altitude;
      this.camera.position.set(region.spawn.x, ground + altitude, region.spawn.z);
      if (region.lookTarget) {
        const dx = region.lookTarget.x - region.spawn.x;
        const dz = region.lookTarget.z - region.spawn.z;
        this.yaw = Math.atan2(-dx, -dz);
      } else {
        this.yaw = region.heading;
      }
      this.pitch = region.pitch;
      this.lookYawTarget = this.yaw;
      this.lookPitchTarget = this.pitch;
      this.camera.rotation.set(this.pitch, this.yaw, 0, "YXZ");
      this.velocity.x = this.velocity.y = this.velocity.z = 0;
    }

    async runEntryTransition(token) {
      this.state = STATES.ENTERING;
      this.root.classList.remove("is-preparing");
      this.root.classList.add("is-entering");
      this.loading.hidden = true;
      this.startLoop();
      const duration = this.venus.motion.matches ? 360 : 3800;
      const start = performance.now();
      const startAltitude = this.cameraAltitude;
      const targetAltitude = this.region.spawn.altitude;
      await new Promise(resolve => {
        const frame = now => {
          if (token !== this.transitionToken || this.state !== STATES.ENTERING) return resolve();
          const raw = clamp((now - start) / duration, 0, 1);
          const eased = smootherstep(raw);
          this.venus.setFullExplorationTransition?.(eased, this.region);
          this.root.style.setProperty("--surface-opacity", String(smoothstep((raw - 0.30) / 0.45)));
          this.root.style.setProperty("--entry-progress", String(eased));
          const ground = this.regionWorld.heightAt(this.camera.position.x, this.camera.position.z);
          this.lastGround = ground;
          this.cameraAltitude = lerp(startAltitude, targetAltitude, smoothstep((raw - 0.32) / 0.68));
          this.camera.position.y = ground + this.cameraAltitude;
          if (raw < 1) requestAnimationFrame(frame); else resolve();
        };
        requestAnimationFrame(frame);
      });
      if (token !== this.transitionToken) return;
      this.activateRegion();
    }

    async runRegionSwitchTransition(token) {
      this.loading.hidden = true;
      const start = performance.now();
      const duration = this.venus.motion.matches ? 120 : 720;
      await new Promise(resolve => {
        const frame = now => {
          if (token !== this.transitionToken) return resolve();
          const t = clamp((now - start) / duration, 0, 1);
          this.travelVeil.classList.toggle("is-covered", t < 0.45);
          if (t < 1) requestAnimationFrame(frame); else resolve();
        };
        requestAnimationFrame(frame);
      });
      if (token !== this.transitionToken) return;
      this.travelVeil.classList.remove("is-visible", "is-covered");
      this.root.style.setProperty("--surface-opacity", "1");
      this.root.style.setProperty("--entry-progress", "1");
      this.activateRegion();
    }

    activateRegion() {
      this.state = STATES.EXPLORING;
      this.root.classList.remove("is-preparing", "is-entering", "is-selecting");
      this.root.classList.add("is-active", "is-surface-visible");
      this.root.style.setProperty("--surface-opacity", "1");
      this.root.style.setProperty("--entry-progress", "1");
      this.input.bind();
      this.previous = performance.now();
      this.startLoop();
      this.showTutorial();
      this.infoCard.classList.remove("is-visible");
      this.infoCard.setAttribute("aria-hidden", "true");
      this.infoToggle.hidden = false;
      this.expandObjectives(false);
      this.updateHUD();
      this.updateEducation(0);
      document.getElementById("announcement").textContent = `Eksplorasi Venus aktif di ${this.region.name}. Ikuti tujuan eksplorasi untuk menemukan fitur geologi.`;
    }

    openSelectorFromRegion() {
      if (this.state !== STATES.EXPLORING || !this.regionWorld) return;
      this.selectorOpenedFromRegion = true;
      this.state = STATES.SELECTING;
      this.input.unbind();
      this.selector.hidden = false;
      this.root.classList.add("is-selecting");
      this.infoCard.classList.remove("is-visible");
      this.infoCard.setAttribute("aria-hidden", "true");
      this.infoToggle.hidden = true;
      this.objectivesPanel.hidden = true;
      this.objectivesToggle.hidden = true;
      this.observationPrompt.hidden = true;
      this.closeObservationCard(false);
      document.getElementById("announcement").textContent = "Pilih wilayah Venus lain untuk dijelajahi.";
      requestAnimationFrame(() => this.selector.querySelector(`[data-venus-region="${this.region.id}"]`)?.focus({ preventScroll: true }));
    }

    closeSelectorToRegion() {
      if (!this.regionWorld) return;
      this.selector.hidden = true;
      this.selectorOpenedFromRegion = false;
      this.state = STATES.EXPLORING;
      this.root.classList.remove("is-selecting");
      this.input.bind();
      this.startLoop();
      this.expandObjectives(false);
      this.infoToggle.hidden = false;
      this.updateEducation(0);
    }

    addLookDelta(dx, dy, source = "mouse") {
      const sensitivity = source === "touch" ? 0.0034 : source === "locked" ? 0.00175 : 0.0022;
      this.lookYawTarget -= dx * sensitivity;
      this.lookPitchTarget = clamp(this.lookPitchTarget - dy * sensitivity, -1.40, 1.18);
    }

    updateLook(delta) {
      const response = 1 - Math.exp(-delta * 27);
      this.yaw += (this.lookYawTarget - this.yaw) * response;
      this.pitch += (this.lookPitchTarget - this.pitch) * response;
      this.pitch = clamp(this.pitch, -1.40, 1.18);
    }

    startLoop() {
      if (!this.active || document.hidden || this.frame || !this.renderer || !this.regionWorld) return;
      this.previous = performance.now();
      this.frame = requestAnimationFrame(this.tick);
    }

    stopLoop() {
      if (this.frame) cancelAnimationFrame(this.frame);
      this.frame = null;
    }

    tick(now) {
      this.frame = null;
      if (!this.active || document.hidden || !this.renderer || !this.regionWorld) return;
      const delta = Math.min(0.1, Math.max(0.001, (now - this.previous) / 1000));
      this.previous = now;
      this.statsClock += delta;
      this.statsFrames += 1;
      if (this.state === STATES.EXPLORING) {
        this.updateLook(delta);
        this.camera.rotation.set(this.pitch, this.yaw, 0, "YXZ");
        this.updateMovement(delta);
      }
      this.regionWorld.updateVisibility(this.camera, delta);
      this.regionWorld.updateAmbient(delta);
      this.renderer.render(this.scene, this.camera);
      if (this.state === STATES.EXPLORING) {
        this.hudClock += delta;
        if (this.hudClock >= 0.10) {
          this.hudClock = 0;
          this.updateHUD();
          this.updateEducation(0.10);
        }
      }
      this.adaptResolution();
      this.frame = requestAnimationFrame(this.tick);
    }

    isObservationCardOpen() {
      return Boolean(this.observationCard && !this.observationCard.hidden && this.observationCard.getAttribute("aria-hidden") !== "true");
    }

    isObjectivesExpanded() {
      return Boolean(this.objectivesPanel && !this.objectivesPanel.hidden);
    }

    discoveryStorageKey() {
      return `antara-venus-discoveries-${this.region?.id || "venus"}-v1`;
    }

    loadDiscoveryState() {
      const valid = new Set(this.resolvedObservations.map(item => item.id));
      let saved = [];
      try {
        saved = JSON.parse(sessionStorage.getItem(this.discoveryStorageKey()) || "[]");
      } catch (_) {
        saved = [];
      }
      this.discovered = new Set(Array.isArray(saved) ? saved.filter(id => valid.has(id)) : []);
    }

    saveDiscoveryState() {
      try {
        sessionStorage.setItem(this.discoveryStorageKey(), JSON.stringify([...this.discovered]));
      } catch (_) {
        // Progres tetap hidup untuk sesi aktif jika penyimpanan browser tidak tersedia.
      }
    }

    resetEducationUI() {
      this.educationClock = 0;
      this.resolvedObservations = [];
      this.discovered = new Set();
      this.nearbyObservation = null;
      this.activeObservation = null;
      this.selectedTarget = null;
      if (this.objectivesPanel) this.objectivesPanel.hidden = true;
      if (this.objectivesToggle) this.objectivesToggle.hidden = true;
      if (this.observationPrompt) this.observationPrompt.hidden = true;
      if (this.nextTarget) this.nextTarget.hidden = true;
      if (this.observationCard) {
        this.observationCard.hidden = true;
        this.observationCard.setAttribute("aria-hidden", "true");
      }
      if (this.observationMore) this.observationMore.open = false;
      this.root?.classList.remove("is-observation-open");
    }

    setupEducationUI() {
      const education = this.region?.education;
      if (!education) return;
      this.objectivesRegion.textContent = this.region.name;
      this.objectivesIntro.textContent = education.intro || "Temukan dan amati fitur geologi di wilayah ini.";
      this.renderObjectives();
      this.updateDiscoveryUI();
      this.objectivesPanel.hidden = true;
      this.objectivesToggle.hidden = true;
      this.observationPrompt.hidden = true;
      this.observationCard.hidden = true;
      this.observationCard.setAttribute("aria-hidden", "true");
      this.root.classList.remove("is-observation-open");
      this.updateEducation(0);
    }

    renderObjectives() {
      const objectives = this.region?.education?.objectives || [];
      const fragment = document.createDocumentFragment();
      for (const objective of objectives) {
        const item = document.createElement("li");
        item.dataset.discovery = objective.discovery || "";
        item.textContent = objective.label;
        if (objective.discovery && this.discovered.has(objective.discovery)) item.classList.add("is-complete");
        fragment.append(item);
      }
      this.objectivesList.replaceChildren(fragment);
    }

    updateDiscoveryUI() {
      const total = this.resolvedObservations.length;
      const completed = this.resolvedObservations.reduce((count, item) => count + (this.discovered.has(item.id) ? 1 : 0), 0);
      if (this.discoveryCount) this.discoveryCount.textContent = `${completed} / ${total}`;
      if (this.discoveryBar) this.discoveryBar.style.transform = `scaleX(${total ? completed / total : 0})`;
      if (this.objectivesToggle) this.objectivesToggle.textContent = `Tujuan · ${completed} / ${total}`;
      for (const item of this.objectivesList?.querySelectorAll?.("li") || []) {
        item.classList.toggle("is-complete", Boolean(item.dataset.discovery && this.discovered.has(item.dataset.discovery)));
      }
    }

    collapseObjectives() {
      if (!this.objectivesPanel) return;
      this.objectivesPanel.hidden = true;
      this.objectivesToggle.hidden = this.state !== STATES.EXPLORING;
    }

    expandObjectives(focus = false) {
      if (!this.objectivesPanel || !this.region?.education) return;
      if (this.isObservationCardOpen()) this.closeObservationCard(false);
      this.infoCard?.classList.remove("is-visible");
      this.infoCard?.setAttribute("aria-hidden", "true");
      if (this.infoToggle) this.infoToggle.hidden = false;
      this.objectivesPanel.hidden = false;
      this.objectivesToggle.hidden = true;
      if (focus) requestAnimationFrame(() => this.objectivesCollapse?.focus({ preventScroll: true }));
    }

    updateEducation(delta = 0) {
      if (this.state !== STATES.EXPLORING || !this.regionWorld || !this.resolvedObservations.length || !this.camera) {
        if (this.observationPrompt) this.observationPrompt.hidden = true;
        return;
      }

      const px = this.camera.position.x;
      const pz = this.camera.position.z;
      let nearest = null;
      let nearestDistance = Infinity;
      let nearestUndiscovered = null;
      let nearestUndiscoveredDistance = Infinity;

      for (const observation of this.resolvedObservations) {
        const distance = Math.hypot(observation.x - px, observation.z - pz);
        if (distance < nearestDistance) {
          nearestDistance = distance;
          nearest = observation;
        }
        if (!this.discovered.has(observation.id) && distance < nearestUndiscoveredDistance) {
          nearestUndiscoveredDistance = distance;
          nearestUndiscovered = observation;
        }
      }

      const interactionRadius = nearest?.interactRadius || 2.6;
      this.nearbyObservation = nearest && nearestDistance <= interactionRadius ? nearest : null;
      this.selectedTarget = nearestUndiscovered || nearest;

      if (this.nearbyObservation && !this.isObservationCardOpen()) {
        this.observationPromptTitle.textContent = this.nearbyObservation.title;
        this.observationPrompt.hidden = false;
      } else {
        this.observationPrompt.hidden = true;
      }

      if (this.selectedTarget && this.nextTarget) {
        const targetDistance = Math.hypot(this.selectedTarget.x - px, this.selectedTarget.z - pz);
        this.nextTargetName.textContent = this.selectedTarget.title;
        this.nextTargetDistance.textContent = `${targetDistance < 10 ? targetDistance.toFixed(1) : targetDistance.toFixed(0)} km`;
        this.nextTarget.hidden = false;
      } else if (this.nextTarget) {
        this.nextTarget.hidden = true;
      }

      const activeId = this.nearbyObservation?.id || this.selectedTarget?.id || null;
      this.regionWorld.updateObservationMarkers(activeId, this.discovered, delta);
      this.updateDiscoveryUI();
    }

    tryObserveNearby() {
      if (this.state !== STATES.EXPLORING || !this.nearbyObservation) return false;
      this.openObservationCard(this.nearbyObservation);
      return true;
    }

    markDiscovery(observation) {
      if (!observation || this.discovered.has(observation.id)) return false;
      this.discovered.add(observation.id);
      this.saveDiscoveryState();
      this.renderObjectives();
      this.updateDiscoveryUI();
      document.getElementById("announcement").textContent = `Temuan tercatat: ${observation.title}.`;
      return true;
    }

    openObservationCard(observation) {
      if (!observation || !this.observationCard) return;
      const wasNew = this.markDiscovery(observation);
      this.activeObservation = observation;
      this.input.clear();
      if (document.pointerLockElement === this.viewport) document.exitPointerLock?.();
      this.infoCard?.classList.remove("is-visible");
      this.infoCard?.setAttribute("aria-hidden", "true");
      this.collapseObjectives();
      if (this.objectivesToggle) this.objectivesToggle.hidden = true;

      this.observationType.textContent = observation.type || "TITIK PENGAMATAN";
      this.observationStatus.textContent = wasNew ? "TEMUAN BARU" : "SUDAH DIAMATI";
      this.observationTitle.textContent = observation.title;
      const distance = Math.hypot(observation.x - this.camera.position.x, observation.z - this.camera.position.z);
      this.observationMeta.textContent = `${formatCoordinate(observation.geo.latitude, observation.geo.longitudeEast)} · ${distance < 1 ? Math.round(distance * 1000) + " m" : distance.toFixed(1) + " km"} dari posisi Anda`;
      this.observationLead.textContent = observation.lead || "";

      const sections = document.createDocumentFragment();
      for (const section of observation.sections || []) {
        const wrap = document.createElement("section");
        wrap.className = "venus-observation-section";
        const heading = document.createElement("small");
        heading.textContent = section.heading || "PENGAMATAN";
        const text = document.createElement("p");
        text.textContent = section.text || "";
        wrap.append(heading, text);
        sections.append(wrap);
      }
      this.observationSections.replaceChildren(sections);

      if (Array.isArray(observation.comparison) && observation.comparison.length) {
        const comparison = document.createDocumentFragment();
        for (const item of observation.comparison) {
          const cell = document.createElement("div");
          const label = document.createElement("small");
          const value = document.createElement("strong");
          label.textContent = item.label;
          value.textContent = item.value;
          cell.append(label, value);
          comparison.append(cell);
        }
        this.observationComparison.replaceChildren(comparison);
        this.observationComparison.hidden = false;
      } else {
        this.observationComparison.replaceChildren();
        this.observationComparison.hidden = true;
      }

      this.observationWhy.textContent = observation.why || "";
      const deep = document.createDocumentFragment();
      for (const paragraph of observation.deepDive || []) {
        const text = document.createElement("p");
        text.textContent = paragraph;
        deep.append(text);
      }
      this.observationDeep.replaceChildren(deep);
      this.observationMore.hidden = !observation.deepDive?.length;
      this.observationMore.open = false;

      const topography = this.regionWorld?.topography;
      if (topography?.emergencyApproximation) {
        this.observationSourceNote.textContent = "Catatan visualisasi: relief lokal sedang memakai pratinjau luring nonilmiah karena data topografi Magellan tidak tersedia. Penjelasan sains tetap mengikuti sumber di bawah.";
      } else {
        this.observationSourceNote.textContent = `Relief dasar: ${topography?.sourceLabel || "topografi Magellan"}. Morfologi regional dipertegas secara terbatas berdasarkan referensi NASA/JPL agar ciri geologi yang dibahas tetap terbaca tanpa mengubah data radar menjadi elevasi.`;
      }
      this.observationSource.textContent = `Sumber: ${observation.sourceLabel || "NASA"} ↗`;
      this.observationSource.href = observation.source || "https://science.nasa.gov/venus/";

      this.observationCard.hidden = false;
      this.observationCard.setAttribute("aria-hidden", "false");
      this.root.classList.add("is-observation-open");
      this.observationPrompt.hidden = true;
      this.updateEducation(0);
      requestAnimationFrame(() => this.observationClose?.focus({ preventScroll: true }));
    }

    closeObservationCard(focus = false) {
      if (!this.observationCard) return;
      this.observationCard.hidden = true;
      this.observationCard.setAttribute("aria-hidden", "true");
      this.root.classList.remove("is-observation-open");
      this.activeObservation = null;
      if (this.observationMore) this.observationMore.open = false;
      if (this.state === STATES.EXPLORING) {
        if (this.objectivesToggle && this.objectivesPanel?.hidden) this.objectivesToggle.hidden = false;
        this.updateEducation(0);
        if (focus && !this.observationPrompt.hidden) requestAnimationFrame(() => this.observeButton?.focus({ preventScroll: true }));
      }
    }

    updateMovement(delta) {
      const axes = this.input.movementAxes();
      const ground = this.regionWorld.heightAt(this.camera.position.x, this.camera.position.z);
      this.lastGround = ground;
      const clearance = Math.max(0, this.camera.position.y - ground);
      const baseSpeed = clearance < 0.35 ? 0.16 : clearance < 2 ? lerp(0.16, 1.2, (clearance - 0.35) / 1.65) : clearance < 8 ? lerp(1.2, 3.8, (clearance - 2) / 6) : 5.8;
      const boost = this.input.boost() ? 2.7 : 1;
      const precision = this.input.precision() ? 0.30 : 1;
      const targetSpeed = baseSpeed * boost * precision;
      let forward = axes.forward, strafe = axes.strafe;
      const mag = Math.hypot(forward, strafe);
      if (mag > 1) { forward /= mag; strafe /= mag; }
      this.camera.getWorldDirection(this.moveForward);
      this.moveForward.y = 0;
      this.moveForward.normalize();
      this.moveRight.crossVectors(this.moveForward, this.camera.up).normalize();
      this.moveIntent.set(0, 0, 0).addScaledVector(this.moveForward, forward).addScaledVector(this.moveRight, strafe);
      if (this.moveIntent.lengthSq() > 1) this.moveIntent.normalize();

      const currentRadius = Math.hypot(this.camera.position.x, this.camera.position.z);
      const boundaryT = smoothstep((currentRadius - this.region.softBoundaryStart) / Math.max(1, this.region.playRadius - this.region.softBoundaryStart));
      const radialX = currentRadius > 0.001 ? this.camera.position.x / currentRadius : 0;
      const radialZ = currentRadius > 0.001 ? this.camera.position.z / currentRadius : 0;
      const outward = Math.max(0, this.moveIntent.x * radialX + this.moveIntent.z * radialZ);
      const boundaryScale = 1 - boundaryT * outward * 0.93;
      const targetX = this.moveIntent.x * targetSpeed * boundaryScale;
      const targetZ = this.moveIntent.z * targetSpeed * boundaryScale;
      const verticalSpeed = Math.max(0.24, Math.min(5.4, targetSpeed * 0.62));
      const rawY = axes.vertical * verticalSpeed;
      const headroom = Math.max(0, MAX_ALTITUDE_KM - clearance);
      const targetY = rawY > 0 ? rawY * smoothstep(headroom / 1.4) : rawY;
      const moving = mag > 0 || axes.vertical !== 0;
      const response = 1 - Math.exp(-delta * (moving ? 11.5 : 15.5));
      this.velocity.x += (targetX - this.velocity.x) * response;
      this.velocity.z += (targetZ - this.velocity.z) * response;
      this.velocity.y += (targetY - this.velocity.y) * response;

      let nextX = this.camera.position.x + this.velocity.x * delta;
      let nextZ = this.camera.position.z + this.velocity.z * delta;
      const nextRadius = Math.hypot(nextX, nextZ);
      if (nextRadius > this.region.playRadius) {
        const scale = this.region.playRadius / nextRadius;
        nextX *= scale; nextZ *= scale;
        const radialV = this.velocity.x * (nextX / this.region.playRadius) + this.velocity.z * (nextZ / this.region.playRadius);
        if (radialV > 0) { this.velocity.x *= 0.22; this.velocity.z *= 0.22; }
      }
      this.camera.position.x = nextX;
      this.camera.position.z = nextZ;
      this.camera.position.y += this.velocity.y * delta;
      const newGround = this.regionWorld.heightAt(nextX, nextZ);
      this.lastGround = newGround;
      const minimumY = newGround + MIN_CLEARANCE_KM;
      if (this.camera.position.y < minimumY) {
        const correction = 1 - Math.exp(-delta * 17);
        this.camera.position.y = lerp(this.camera.position.y, minimumY + 0.025, correction);
        if (this.camera.position.y < minimumY) this.camera.position.y = minimumY;
        if (this.velocity.y < 0) this.velocity.y *= 0.12;
      }
      const maximumY = newGround + MAX_ALTITUDE_KM;
      if (this.camera.position.y > maximumY) { this.camera.position.y = maximumY; if (this.velocity.y > 0) this.velocity.y = 0; }
      this.speed = Math.hypot(this.velocity.x, this.velocity.y, this.velocity.z);
      const finalRadius = Math.hypot(nextX, nextZ);
      const boundaryVisible = finalRadius > this.region.softBoundaryStart - 4;
      this.boundaryHint.classList.toggle("is-visible", boundaryVisible);
      if (boundaryVisible) this.boundaryHint.textContent = finalRadius > this.region.playRadius - 1 ? "BATAS EKSPLORASI · DUNIA VISUAL TETAP BERLANJUT" : "MENDEKATI BATAS EKSPLORASI";
    }

    updateHUD() {
      if (!this.regionWorld || !this.camera) return;
      const ground = this.regionWorld.heightAt(this.camera.position.x, this.camera.position.z);
      const altitude = Math.max(0, this.camera.position.y - ground);
      this.cameraAltitude = altitude;
      const geo = this.regionWorld.geoFromWorld(this.camera.position.x, this.camera.position.z);
      this.hudCoordinates.textContent = formatCoordinate(geo.latitude, geo.longitudeEast);
      this.hudAltitude.textContent = formatAltitude(altitude);
      this.hudAltitudeLimit.hidden = altitude < MAX_ALTITUDE_KM - 1.0;
      this.hudAltitudeLimit.textContent = altitude >= MAX_ALTITUDE_KM - 0.08 ? "BATAS KETINGGIAN" : "MENDEKATI BATAS";
      this.hudSpeed.textContent = formatSpeed(this.speed);
      this.hudLocation.textContent = this.region.name;
      const feature = this.region.featureCenter || { x: 0, z: 0 };
      const featureDistance = Math.hypot(this.camera.position.x - feature.x, this.camera.position.z - feature.z);
      this.hudDistance.textContent = `${featureDistance.toFixed(featureDistance < 10 ? 1 : 0)} KM`;
      this.hudRegionType.textContent = this.region.category;
      {
        const topo = this.regionWorld?.topography?.sourceLabel || "MAGELLAN GTDR";
        this.hudData.textContent = this.regionWorld?.radar?.texture ? `${topo} + SAR` : `${topo} · CITRA SAR TIDAK TERMUAT`;
      }
    }

    updateRegionUI() {
      const region = this.region;
      this.hudLocation.textContent = region.name;
      this.hudCoordinates.textContent = formatCoordinate(region.latitude, region.longitudeEast);
      this.hudDistance.textContent = "--";
      this.hudRegionType.textContent = region.category;
      {
        const topo = this.regionWorld?.topography?.sourceLabel || "MAGELLAN GTDR";
        this.hudData.textContent = this.regionWorld?.radar?.texture ? `${topo} + SAR` : `${topo} · CITRA SAR TIDAK TERMUAT`;
      }
      this.infoName.textContent = region.name;
      this.infoType.textContent = `${region.category} · ${region.descriptor}`;
      this.infoCoords.textContent = formatCoordinate(region.latitude, region.longitudeEast);
      this.infoImage.src = region.image;
      this.infoImage.alt = `Referensi Magellan NASA/JPL untuk ${region.name}`;
      this.infoMedia.setAttribute("aria-label", `Perbesar citra referensi Magellan untuk ${region.name}`);
      this.infoDescription.textContent = region.description;
      this.infoFacts.replaceChildren(...region.facts.map(fact => { const li = document.createElement("li"); li.textContent = fact; return li; }));
      this.infoBadge.textContent = `${this.regionWorld?.topography?.sourceLabel || "MAGELLAN GTDR"} · MORFOLOGI REFERENSI NASA/JPL · ${region.category}`;
      this.infoVisualizationNote.hidden = !region.visualizationNote;
      this.infoVisualizationNote.textContent = region.visualizationNote || "";
      this.infoSource.href = region.source;
      this.infoSource.textContent = "Referensi morfologi: NASA/JPL ↗";
      this.infoCoordinateSource.href = region.coordinateSource;
    }

    showRegionInfo(focus = false) {
      this.closeObservationCard(false);
      this.collapseObjectives();
      if (this.objectivesToggle) this.objectivesToggle.hidden = true;
      this.infoCard.classList.add("is-visible");
      this.infoCard.setAttribute("aria-hidden", "false");
      this.infoToggle.hidden = true;
      if (focus) requestAnimationFrame(() => this.infoMinimize.focus({ preventScroll: true }));
    }

    hideRegionInfo(focusToggle = true) {
      this.infoCard.classList.remove("is-visible");
      this.infoCard.setAttribute("aria-hidden", "true");
      this.infoToggle.hidden = false;
      if (this.objectivesToggle && this.objectivesPanel?.hidden && this.state === STATES.EXPLORING) this.objectivesToggle.hidden = false;
      if (focusToggle) this.infoToggle.focus({ preventScroll: true });
    }

    openReferenceImage() {
      const media = window.ExplorationMedia;
      if (!media || !this.region?.image) return;
      if (document.pointerLockElement === this.viewport) document.exitPointerLock?.();
      const image = {
        src: this.region.image,
        alt: `Referensi Magellan NASA/JPL untuk ${this.region.name}`,
        credit: "NASA/JPL · Magellan",
        source: this.region.source,
        caption: `${this.region.name} · referensi morfologi untuk membandingkan citra Magellan dengan rekonstruksi ANTARA`,
        type: "CITRA WAHANA"
      };
      media.openLightbox([image], 0, { title: `${this.region.name} · Referensi Magellan` }, this.infoMedia);
    }

    showTutorial() {
      let seen = false;
      try { seen = sessionStorage.getItem("antara-venus-full-tutorial-v2") === "1"; } catch {}
      if (seen) return;
      this.tutorial.classList.add("is-visible");
      window.clearTimeout(this.tutorialTimeout);
      this.tutorialTimeout = window.setTimeout(() => this.dismissTutorial(), 9000);
    }

    dismissTutorial(persist = false) {
      this.tutorial.classList.remove("is-visible");
      window.clearTimeout(this.tutorialTimeout);
      if (persist) { try { sessionStorage.setItem("antara-venus-full-tutorial-v2", "1"); } catch {} }
    }

    adaptResolution() {
      if (this.statsClock < 2.5 || !this.renderer) return;
      const fps = this.statsFrames / this.statsClock;
      this.statsFrames = 0;
      this.statsClock = 0;
      this.idealDpr = this.calculateIdealDpr();
      if (fps < 38) { this.lowFpsWindows += 1; this.highFpsWindows = 0; }
      else if (fps > 56) { this.highFpsWindows += 1; this.lowFpsWindows = Math.max(0, this.lowFpsWindows - 1); }
      else { this.lowFpsWindows = Math.max(0, this.lowFpsWindows - 1); this.highFpsWindows = 0; }
      if (this.lowFpsWindows >= 2 && this.currentDpr > this.quality.minDpr) {
        this.currentDpr = Math.max(this.quality.minDpr, this.currentDpr - 0.12);
        this.renderer.setPixelRatio(this.currentDpr);
        this.resize(false);
        this.lowFpsWindows = 0;
      } else if (this.highFpsWindows >= 3 && this.currentDpr + 0.04 < this.idealDpr) {
        this.currentDpr = Math.min(this.idealDpr, this.currentDpr + 0.10);
        this.renderer.setPixelRatio(this.currentDpr);
        this.resize(false);
        this.highFpsWindows = 0;
      }
    }

    animateExitAltitude(targetAltitude, duration, token) {
      if (!this.regionWorld || !this.camera) return Promise.resolve();
      const groundNow = this.regionWorld.heightAt(this.camera.position.x, this.camera.position.z);
      const startAltitude = Math.max(0, this.camera.position.y - groundNow);
      const start = performance.now();
      return new Promise(resolve => {
        const frame = now => {
          if (token !== this.transitionToken) return resolve();
          const raw = clamp((now - start) / (this.venus.motion.matches ? 120 : duration), 0, 1);
          const eased = smootherstep(raw);
          const ground = this.regionWorld.heightAt(this.camera.position.x, this.camera.position.z);
          this.lastGround = ground;
          this.cameraAltitude = lerp(startAltitude, targetAltitude, eased);
          this.camera.position.y = ground + this.cameraAltitude;
          if (raw < 1) requestAnimationFrame(frame);
          else resolve();
        };
        requestAnimationFrame(frame);
      });
    }

    async exit() {
      if (!this.active || this.state === STATES.EXITING) return;
      if (this.state === STATES.SELECTING && !this.regionWorld) {
        this.finishExitToOrbit();
        return;
      }
      if (this.state === STATES.ERROR || this.state === STATES.PREPARING || this.state === STATES.SWITCHING) {
        this.failBackToOrbit();
        return;
      }

      this.state = STATES.EXITING;
      const token = ++this.transitionToken;
      // Mirror Mars exit behavior: freeze input, but keep the render loop alive so
      // atmosphere, visibility and camera motion continue to render smoothly.
      this.input.clear();
      this.selector.hidden = true;
      this.tutorial.classList.remove("is-visible");
      this.infoCard.classList.remove("is-visible");
      this.infoCard.setAttribute("aria-hidden", "true");
      this.infoToggle.hidden = true;
      this.resetEducationUI();
      this.boundaryHint.classList.remove("is-visible");
      this.root.classList.add("is-exiting");
      document.getElementById("announcement").textContent = "Meninggalkan permukaan Venus dan kembali ke panorama orbit.";
      this.startLoop();

      if (this.regionWorld && this.camera) {
        try {
          const ground = this.regionWorld.heightAt(this.camera.position.x, this.camera.position.z);
          const currentAltitude = Math.max(0, this.camera.position.y - ground);
          await this.animateExitAltitude(Math.max(currentAltitude, 52), 1650, token);
        } catch {}
      }
      if (token !== this.transitionToken) return;

      const reduced = this.venus.motion.matches;
      const duration = reduced ? 260 : 3200;
      const start = performance.now();
      await new Promise(resolve => {
        const frame = now => {
          if (token !== this.transitionToken) return resolve();
          const raw = clamp((now - start) / duration, 0, 1);
          const eased = smootherstep(raw);
          this.root.style.setProperty("--surface-opacity", String(1 - smoothstep(raw / 0.62)));
          this.root.style.setProperty("--entry-progress", String(1 - eased));
          this.venus.setFullExplorationTransition?.(1 - eased, this.region);
          if (raw < 1) requestAnimationFrame(frame);
          else resolve();
        };
        requestAnimationFrame(frame);
      });
      if (token !== this.transitionToken) return;
      this.finishExitToOrbit();
    }

    finishExitToOrbit() {
      this.transitionToken += 1;
      if (document.fullscreenElement === this.root) document.exitFullscreen().catch(() => {});
      this.stopLoop();
      this.input.unbind();
      this.disposeRegion();
      this.disposeRenderer();
      this.venus.endFullExploration?.();
      this.venus.setFullExplorationTransition?.(0, this.region);
      this.venus.caption.inert = false;
      this.state = STATES.IDLE;
      this.selectorOpenedFromRegion = false;
      this.root.className = "mars-full-exploration venus-full-exploration";
      this.root.hidden = true;
      this.root.inert = true;
      this.root.setAttribute("aria-hidden", "true");
      this.root.style.removeProperty("--surface-opacity");
      this.root.style.removeProperty("--entry-progress");
      this.selector.hidden = false;
      this.loading.hidden = true;
      this.errorPanel.hidden = true;
      this.entryButton.disabled = false;
      document.getElementById("mission").classList.remove("is-venus-full", "is-venus-full-selecting");
      document.getElementById("announcement").textContent = "Kembali ke panorama Venus.";
      this.entryButton.focus({ preventScroll: true });
    }

    showError(error) {
      console.warn("Venus Full Exploration:", error);
      this.stopLoop();
      this.input.unbind();
      this.state = STATES.ERROR;
      this.loading.hidden = true;
      this.errorPanel.hidden = false;
      this.errorMessage.textContent = error?.message || "Wilayah Venus tidak dapat dibangun.";
      this.root.classList.add("is-error");
      this.entryButton.disabled = false;
      document.getElementById("announcement").textContent = "Eksplorasi penuh Venus gagal dimuat. Panorama Venus tetap aman.";
    }

    failBackToOrbit() {
      this.transitionToken += 1;
      this.finishExitToOrbit();
    }

    onVenusStop() {
      this.transitionToken += 1;
      this.stopLoop();
      this.input.unbind();
      this.disposeRegion();
      this.disposeRenderer();
      this.resetEducationUI();
      this.state = STATES.IDLE;
      this.root.hidden = true;
      this.root.inert = true;
      this.root.setAttribute("aria-hidden", "true");
      this.root.className = "mars-full-exploration venus-full-exploration";
      this.entryButton.disabled = false;
      document.getElementById("mission").classList.remove("is-venus-full", "is-venus-full-selecting");
      if (document.fullscreenElement === this.root) document.exitFullscreen().catch(() => {});
    }

    disposeRegion() {
      this.regionWorld?.dispose();
      this.regionWorld = null;
      this.infoCard.classList.remove("is-visible");
      this.infoCard.setAttribute("aria-hidden", "true");
      this.infoToggle.hidden = true;
      this.boundaryHint.classList.remove("is-visible");
      this.resolvedObservations = [];
      this.nearbyObservation = null;
      this.activeObservation = null;
      this.selectedTarget = null;
    }

    disposeRenderer() {
      this.resourceGeneration += 1;
      if (this.renderer) {
        this.renderer.dispose();
        this.renderer.domElement?.remove();
      }
      this.renderer = null;
      this.scene = null;
      this.camera = null;
      this.hemiLight = null;
      this.sunLight = null;
      this.fillLight = null;
    }

    setLoading(progress, status) {
      this.loading.hidden = false;
      this.loadingProgress.style.transform = `scaleX(${clamp(progress, 0, 1)})`;
      this.loadingStatus.textContent = status;
    }

    mobileFov() { return window.innerWidth <= 760 ? 70 : 66; }

    async toggleFullscreen() {
      if (!document.fullscreenElement) {
        try { await this.root.requestFullscreen(); } catch {}
      } else if (document.fullscreenElement === this.root) {
        try { await document.exitFullscreen(); } catch {}
      }
      this.updateFullscreenLabel();
    }

    updateFullscreenLabel() {
      const active = document.fullscreenElement === this.root;
      this.fullscreenButton.setAttribute("aria-pressed", String(active));
      this.fullscreenButton.querySelector("span").textContent = active ? "Keluar layar penuh" : "Layar penuh";
      this.resize();
    }

    resize(recalculateDpr = true) {
      if (!this.renderer || !this.camera) return;
      const width = Math.max(1, this.viewport.clientWidth || window.innerWidth);
      const height = Math.max(1, this.viewport.clientHeight || window.innerHeight);
      if (recalculateDpr) {
        this.idealDpr = this.calculateIdealDpr();
        if (!Number.isFinite(this.currentDpr)) this.currentDpr = this.idealDpr;
        this.currentDpr = Math.min(this.currentDpr, this.idealDpr);
        this.renderer.setPixelRatio(this.currentDpr);
      }
      this.renderer.setSize(width, height, false);
      this.camera.aspect = width / height;
      this.camera.fov = this.mobileFov();
      this.camera.updateProjectionMatrix();
    }
  };
})();
