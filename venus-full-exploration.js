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
    CONFIGURING: "configuring",
    SELECTING: "selecting",
    PREPARING: "preparing",
    ENTERING: "entering",
    EXPLORING: "exploring",
    SWITCHING: "switching",
    EXITING: "exiting",
    ERROR: "error"
  });

  const VENUS_QUALITY_STORAGE_KEY = "antara-venus-graphics-quality-v2";
  const QUALITY_PROFILES = Object.freeze({
    LOW: Object.freeze({
      name: "LOW", label: "RENDAH", description: "Performa terbaik",
      tileSize: 10, tileHalfCount: 3, nearSegments: 58, midSegments: 34, farSegments: 20, backgroundSegments: 48,
      maxDpr: 1.18, minDpr: 0.78, supersample: 1.0, pixelBudget: 2250000, anisotropy: 3,
      accentCount: 6, propMultiplier: 5, particleCount: 82, microTextureSize: 192, shaderDetailTier: 2, radarSize: 576,
      visibleDistance: 54, coreVisibleDistance: 21, atmosphereParticles: 72, worldSpan: 96,
      continuationMidSegments: 24, continuationFarSegments: 14, continuationMidScale: 0.92, continuationFarScale: 1.46
    }),
    MEDIUM: Object.freeze({
      name: "MEDIUM", label: "SEDANG", description: "Seimbang",
      tileSize: 9, tileHalfCount: 4, nearSegments: 86, midSegments: 50, farSegments: 28, backgroundSegments: 68,
      maxDpr: 1.45, minDpr: 0.86, supersample: 1.05, pixelBudget: 4100000, anisotropy: 7,
      accentCount: 10, propMultiplier: 6, particleCount: 145, microTextureSize: 320, shaderDetailTier: 3, radarSize: 896,
      visibleDistance: 68, coreVisibleDistance: 29, atmosphereParticles: 128, worldSpan: 116,
      continuationMidSegments: 34, continuationFarSegments: 20, continuationMidScale: 0.94, continuationFarScale: 1.52
    }),
    HIGH: Object.freeze({
      name: "HIGH", label: "TINGGI", description: "Visual terbaik",
      tileSize: 8, tileHalfCount: 4, nearSegments: 122, midSegments: 72, farSegments: 36, backgroundSegments: 88,
      maxDpr: 1.72, minDpr: 0.92, supersample: 1.12, pixelBudget: 5900000, anisotropy: 12,
      accentCount: 15, propMultiplier: 6, particleCount: 220, microTextureSize: 448, shaderDetailTier: 3, radarSize: 1280,
      visibleDistance: 82, coreVisibleDistance: 36, atmosphereParticles: 190, worldSpan: 134,
      continuationMidSegments: 44, continuationFarSegments: 26, continuationMidScale: 0.96, continuationFarScale: 1.58
    })
  });
  const copyQualityProfile = name => ({ ...(QUALITY_PROFILES[name] || QUALITY_PROFILES.MEDIUM) });

  const REGIONS = Object.freeze([
    {
      id: "maat",
      space: { horizontalCompression: 7.5, verticalReliefScale: 1.16, radarExtentKm: 330, movementScale: 0.72 },
      name: "Maat Mons",
      short: "Maat Mons",
      category: "KAWASAN VULKANIK",
      latitude: 0.9,
      longitudeEast: 194.5,
      heading: 0,
      pitch: -0.025,
      spawn: { x: -24, z: 82, altitude: 0.72 },
      lookTarget: { x: 0, z: -46 },
      featureCenter: { x: 0, z: -46 },
      playRadius: 30,
      softBoundaryStart: 25,
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
      fogDensity: 0.0064,
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
      space: { horizontalCompression: 6.5, verticalReliefScale: 1.12, radarExtentKm: 360, movementScale: 0.74 },
      name: "Maxwell Montes",
      short: "Maxwell",
      category: "SABUK PEGUNUNGAN",
      latitude: 65.0,
      longitudeEast: 6.0,
      heading: -0.12,
      pitch: -0.15,
      spawn: { x: -54, z: 18, altitude: 0.62 },
      lookTarget: { x: 12, z: -24 },
      featureCenter: { x: -4, z: -18 },
      playRadius: 34,
      softBoundaryStart: 29,
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
      space: { horizontalCompression: 8.0, verticalReliefScale: 1.10, radarExtentKm: 350, movementScale: 0.70 },
      name: "Aphrodite Terra",
      short: "Aphrodite",
      category: "DATARAN TINGGI TEKTONIK",
      latitude: -1.0,
      longitudeEast: 81.0,
      heading: 0.08,
      pitch: -0.18,
      spawn: { x: -26, z: 34, altitude: 0.58 },
      lookTarget: { x: 34, z: -18 },
      featureCenter: { x: 6, z: -8 },
      playRadius: 30,
      softBoundaryStart: 25,
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
      space: { horizontalCompression: 7.0, verticalReliefScale: 1.08, radarExtentKm: 360, movementScale: 0.72 },
      name: "Ishtar Terra",
      short: "Ishtar",
      category: "DATARAN TINGGI",
      latitude: 65.0,
      longitudeEast: 0.0,
      heading: -0.08,
      pitch: -0.10,
      spawn: { x: -18, z: 24, altitude: 0.68 },
      lookTarget: { x: 92, z: -14 },
      featureCenter: { x: 18, z: -4 },
      playRadius: 33,
      softBoundaryStart: 28,
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
      space: { horizontalCompression: 9.0, verticalReliefScale: 1.13, radarExtentKm: 340, movementScale: 0.68 },
      name: "Alpha Regio",
      short: "Alpha",
      category: "DATARAN TESSERA",
      latitude: -25.0,
      longitudeEast: 4.0,
      heading: 0.18,
      pitch: -0.20,
      spawn: { x: -8, z: 28, altitude: 0.52 },
      lookTarget: { x: 34, z: -24 },
      featureCenter: { x: 8, z: -8 },
      playRadius: 28,
      softBoundaryStart: 23,
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

    sampleOrNaN(latitude, longitudeEast) {
      const regional = this.sampleRegional(latitude, longitudeEast);
      if (Number.isFinite(regional)) return regional;
      if (this.grid) return this.sampleRawGrid(latitude, longitudeEast);
      if (this.emergencyApproximation) return this.sampleEmergency(latitude, longitudeEast);
      return Number.NaN;
    }

    sample(latitude, longitudeEast) {
      const value = this.sampleOrNaN(latitude, longitudeEast);
      if (Number.isFinite(value)) return value;
      throw new Error("Magellan GTDR belum dimuat untuk koordinat ini.");
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
      this.extentKm = region.space?.radarExtentKm || 330;
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
      const size = this.quality.radarSize || (this.quality.name === "HIGH" ? 1280 : this.quality.name === "MEDIUM" ? 896 : 576);
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
      this.continuationMeshes = [];
      this.continuationMaterial = null;
      this.props = null;
      this.particles = null;
      this.resources = [];
      this.referenceElevation = 0;
      this.cosLat = Math.max(0.18, Math.cos(region.latitude * DEG));
      // Render space is deliberately compact. Source geography is sampled through
      // a separate per-destination transform so the visual world remains scientifically
      // anchored without requiring near-1:1 traversal distances.
      this.horizontalCompression = Math.max(1, region.space?.horizontalCompression || 1);
      this.verticalReliefScale = Math.max(0.5, region.space?.verticalReliefScale || 1);
      this.worldSpan = quality.worldSpan || (quality.name === "HIGH" ? 134 : quality.name === "MEDIUM" ? 116 : 96);
      this.continuationMidHalf = this.worldSpan * (quality.continuationMidScale || 0.94);
      this.continuationFarHalf = this.worldSpan * (quality.continuationFarScale || 1.52);
      this.outerScientificBaseline = 0;
      this.tileSize = quality.tileSize || 26;
      this.tileHalfCount = quality.tileHalfCount ?? 4;
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
      const size = this.quality.microTextureSize || (this.quality.name === "HIGH" ? 448 : this.quality.name === "MEDIUM" ? 320 : 192);
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

    sourceKmFromWorld(x, z) {
      return { x: x * this.horizontalCompression, z: z * this.horizontalCompression };
    }

    worldPointFromReference(point = { x: 0, z: 0 }) {
      return { ...point, x: (Number(point.x) || 0) / this.horizontalCompression, z: (Number(point.z) || 0) / this.horizontalCompression };
    }

    geoFromWorld(x, z) {
      const source = this.sourceKmFromWorld(x, z);
      return {
        latitude: clamp(this.region.latitude - source.z / KM_PER_DEG_LAT, -89.49, 89.49),
        longitudeEast: wrapLongitudeEast(this.region.longitudeEast + source.x / (KM_PER_DEG_LAT * this.cosLat))
      };
    }

    scientificHeightAt(x, z) {
      const geo = this.geoFromWorld(x, z);
      return (this.topography.sample(geo.latitude, geo.longitudeEast) - this.referenceElevation) * this.verticalReliefScale;
    }

    estimateOuterScientificBaseline() {
      if (!this.topography.regionalGrid) return 0;
      const extent = this.topography.regionalHalfExtentKm * 0.72;
      const samples = [
        [ extent, 0], [-extent, 0], [0, extent], [0, -extent],
        [ extent * 0.72, extent * 0.72], [-extent * 0.72, extent * 0.72],
        [ extent * 0.72,-extent * 0.72], [-extent * 0.72,-extent * 0.72]
      ];
      const values = [];
      for (const [sx, sz] of samples) {
        const worldX = sx / this.horizontalCompression;
        const worldZ = sz / this.horizontalCompression;
        const geo = this.geoFromWorld(worldX, worldZ);
        const elevation = this.topography.sampleRegional(geo.latitude, geo.longitudeEast);
        if (Number.isFinite(elevation)) values.push((elevation - this.referenceElevation) * this.verticalReliefScale);
      }
      if (!values.length) return 0;
      values.sort((a, b) => a - b);
      return values[Math.floor(values.length / 2)];
    }

    outerBaseHeightAt(x, z) {
      const broad = valueNoise(x * 0.010 + 3.7, z * 0.010 - 6.1, 1703) * 0.13;
      const regional = valueNoise(x * 0.004 - 2.2, z * 0.004 + 4.6, 1709) * 0.09;
      return this.outerScientificBaseline + broad + regional;
    }

    scientificVisualHeightAt(x, z) {
      const geo = this.geoFromWorld(x, z);
      const source = this.sourceKmFromWorld(x, z);
      const sample = this.topography.sampleOrNaN(geo.latitude, geo.longitudeEast);
      const outer = this.outerBaseHeightAt(x, z);
      if (!Number.isFinite(sample)) return outer;
      const measured = (sample - this.referenceElevation) * this.verticalReliefScale;
      if (!this.topography.regionalGrid || this.topography.grid || this.topography.emergencyApproximation) return measured;
      const edge = Math.max(Math.abs(source.x), Math.abs(source.z)) / this.topography.regionalHalfExtentKm;
      const outerMix = smootherstep(clamp((edge - 0.78) / 0.20, 0, 1));
      return lerp(measured, outer, outerMix);
    }

    morphologySourceWeight() {
      // Real elevation remains the base. The regional values below are deliberately modest
      // readability reinforcement for first-person viewing, not a replacement heightmap.
      // Maat and Alpha need slightly stronger meso-scale guidance because their identity is
      // especially easy to lose in 4.641 km/pixel GTDR data at ground level.
      const regionalWeights = { maat: 0.62, maxwell: 0.47, aphrodite: 0.43, ishtar: 0.45, alpha: 0.54 };
      const coarseWeights = { maat: 0.82, maxwell: 0.74, aphrodite: 0.72, ishtar: 0.72, alpha: 0.78 };
      if (this.topography.emergencyApproximation) return 1.0;
      if (this.topography.regionalGrid) return regionalWeights[this.region.id] ?? 0.40;
      if (this.topography.grid) return coarseWeights[this.region.id] ?? 0.70;
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
      // PIA00254: fractured foreground plains, very long flow surfaces and one
      // enormous broad shield. The profile deliberately favors width over height.
      const cx = 0, cz = -46;
      const dx = x - cx, dz = z - cz;
      const radial = Math.hypot(dx / 160, dz / 142);
      const t = clamp(1 - radial, 0, 1);
      const broadProfile = t * 0.68 + smootherstep(t) * 0.32;
      const body = broadProfile * 5.30;
      const upperGate = smootherstep(clamp((t - 0.46) / 0.54, 0, 1));
      const upper = upperGate * 0.78;
      const flankAsymmetry = (valueNoise(x * 0.007, z * 0.007, 1181) * 0.13
        + Math.sin(Math.atan2(dz, dx) * 3.0 + 0.7) * 0.055) * t;

      const summitX = 2.0, summitZ = -47.5;
      const summitR = Math.hypot((x - summitX) / 17.0, (z - summitZ) / 13.0);
      const summitAngle = Math.atan2(z - summitZ, x - summitX);
      const rimRadius = 0.95 + Math.sin(summitAngle * 3.0 + 0.6) * 0.08
        + valueNoise(x * 0.028, z * 0.028, 1201) * 0.05;
      const rim = Math.exp(-(((summitR - rimRadius) / 0.30) ** 2)) * 0.22;
      const depression = -Math.exp(-((summitR / 0.70) ** 2)) * 0.56;
      const collapsedShelf = -this.ellipseGaussian(x, z, -7, -51, 11, 7, 0.08)
        + this.ellipseGaussian(x, z, 10, -43, 14, 8, 0.07);

      const outward = smootherstep(clamp((z + 28) / 34, 0, 1));
      const pathA = x - (18 + Math.sin((z + 12) * 0.020) * 10.0);
      const pathB = x - (-34 + Math.sin((z + 8) * 0.017 + 1.25) * 11.5);
      const pathC = x - (48 + Math.sin((z + 20) * 0.016 - 0.85) * 8.5);
      const flowA = Math.exp(-((pathA / 23) ** 2)) * Math.exp(-(((z - 36) / 124) ** 4)) * outward * 0.15;
      const flowB = Math.exp(-((pathB / 27) ** 2)) * Math.exp(-(((z - 44) / 132) ** 4)) * outward * 0.125;
      const flowC = Math.exp(-((pathC / 21) ** 2)) * Math.exp(-(((z - 32) / 114) ** 4)) * outward * 0.095;
      const leveeA = Math.exp(-(((Math.abs(pathA) - 22) / 4.8) ** 2)) * Math.exp(-(((z - 38) / 122) ** 4)) * outward * 0.035;
      const leveeB = Math.exp(-(((Math.abs(pathB) - 26) / 5.4) ** 2)) * Math.exp(-(((z - 44) / 128) ** 4)) * outward * 0.030;

      const plainMask = clamp(1 - body / 5.0, 0, 1);
      const fractureA = ridge(valueNoise(x * 0.034 + z * 0.010, z * 0.023, 1229));
      const fractureB = ridge(valueNoise(x * 0.017 - z * 0.009, z * 0.031, 1237));
      const fracturedPlain = ((fractureA - 0.60) * 0.068 + (fractureB - 0.61) * 0.042) * plainMask;

      return body + upper + flankAsymmetry + rim + depression + collapsedShelf
        + flowA + flowB + flowC + leveeA + leveeB + fracturedPlain;
    }

    maxwellMorphologyAt(x, z) {
      // PIA00149: the mountain belt is the identity. Cleopatra remains a secondary
      // landmark inside long, connected compressional ridges and deep valleys.
      const { u, v } = this.rotateLocal(x, z, -10, -15, -0.30);
      const beltEnvelope = Math.exp(-((u / 178) ** 6 + (v / 90) ** 4));
      // Keep the base massif lower than the individual folds. Maxwell should read
      // as a directional ridge/valley belt, not as one broad mound with texture.
      const regionalUplift = beltEnvelope * 1.18;
      const ridgeOffsets = [-60, -41, -21, 0, 21, 43, 64];
      let ridgeSystem = 0;
      for (let i = 0; i < ridgeOffsets.length; i += 1) {
        const split = Math.sin(u * 0.011 + i * 0.91) * (2.8 + (i % 3) * 0.7);
        const warp = Math.sin(u * (0.017 + i * 0.0011) + i * 0.72) * (4.8 + i * 0.24)
          + valueNoise(u * 0.010 + i * 1.7, v * 0.009 - i, 1301 + i * 11) * 3.8 + split;
        const width = 7.0 + (i % 3) * 1.5;
        const d = (v - ridgeOffsets[i] - warp) / width;
        const continuity = Math.exp(-((u / (166 - i * 3)) ** 6));
        const breakMask = clamp(0.72 + valueNoise(u * 0.008 + i, v * 0.008 - i, 1331 + i) * 0.32, 0.34, 1.0);
        ridgeSystem += Math.exp(-(d * d)) * continuity * breakMask * (0.76 + (i === 3 ? 0.17 : 0));
      }
      ridgeSystem *= 0.86;

      const valleyWave = Math.cos((v + Math.sin(u * 0.020) * 4.0) * Math.PI / 20.5);
      const valleyFabric = -Math.pow(clamp((-valleyWave + 0.18) / 1.18, 0, 1), 2.0) * beltEnvelope * 0.44;
      const westEscarpment = this.ellipseGaussian(x, z, -78, -8, 22, 108, 1.38)
        * (0.70 + 0.30 * ridge(valueNoise(z * 0.020, x * 0.013, 1367)));
      const eastShoulder = this.ellipseGaussian(x, z, 70, -9, 92, 112, 0.28);

      const craterX = 54, craterZ = -40;
      const craterR = Math.hypot(x - craterX, z - craterZ);
      const outerRim = Math.exp(-(((craterR - 46) / 7.8) ** 2)) * 0.34;
      const innerRim = Math.exp(-(((craterR - 25) / 6.5) ** 2)) * 0.11;
      const basin = -(1 - smootherstep((craterR - 34) / 14)) * 0.52;
      const channelLocal = this.rotateLocal(x, z, 74, -18, 0.72);
      const channel = -Math.exp(-((channelLocal.v / 4.8) ** 2))
        * Math.exp(-((channelLocal.u / 50) ** 4)) * 0.16;

      return regionalUplift + ridgeSystem + valleyFabric + westEscarpment + eastShoulder
        + outerRim + innerRim + basin + channel;
    }

    aphroditeMorphologyAt(x, z) {
      // PIA00218 / Ovda: a broad highland recording several tectonic generations.
      // The dominant visual is a broken fabric of curved ridges, cross-cutting
      // extension fractures, broad troughs and smoother lava-filled lows.
      // Ovda is elevated, but its identity comes from superposed deformation rather
      // than a single smooth massif. Break the macro highland into overlapping lobes.
      const highland = this.ellipseGaussian(x, z, -18, -8, 222, 184, 0.62)
        + this.ellipseGaussian(x, z, -92, 10, 78, 60, 0.28)
        + this.ellipseGaussian(x, z, 76, -34, 84, 66, 0.30);
      const domes = this.ellipseGaussian(x, z, -62, -30, 40, 31, 0.25)
        + this.ellipseGaussian(x, z, 18, -50, 45, 34, 0.23)
        + this.ellipseGaussian(x, z, 76, 31, 42, 32, 0.20)
        + this.ellipseGaussian(x, z, -8, 52, 50, 34, 0.15);

      const primary = this.rotateLocal(x, z, -4, -8, -0.78);
      const primaryEnvelope = Math.exp(-((primary.u / 184) ** 6 + (primary.v / 128) ** 6));
      const ridgeOffsets = [-58, -33, -8, 20, 49];
      let oldFabric = 0;
      for (let i = 0; i < ridgeOffsets.length; i += 1) {
        const warp = Math.sin(primary.u * (0.013 + i * 0.0012) + i * 0.72) * (7.0 + i * 0.65)
          + Math.sin(primary.u * 0.006 - i * 0.51) * 4.0
          + valueNoise(primary.u * 0.008 + i, primary.v * 0.006 - i, 1409 + i * 7) * 4.6;
        const center = primary.v - ridgeOffsets[i] - warp;
        const width = 7.6 + (i % 2) * 1.8;
        const along = Math.exp(-((primary.u / (170 - i * 7)) ** 6));
        const broken = clamp(0.58 + valueNoise(x * 0.009 + i * 0.8, z * 0.009 - i, 1460 + i) * 0.52, 0.12, 1.0);
        const ridgeBand = Math.exp(-((center / width) ** 2)) * (0.18 + (i % 2) * 0.028) * along * broken;
        const adjacentValley = -Math.exp(-(((center - width * 1.55) / (width * 1.30)) ** 2)) * 0.085 * along * broken;
        oldFabric += ridgeBand + adjacentValley;
      }
      oldFabric *= primaryEnvelope;

      const secondary = this.rotateLocal(x, z, 8, -2, 0.58);
      const fractureSpecs = [
        [-58, -82, 72, 0.15], [-18, -38, 92, 0.17], [25, 22, 86, 0.16], [62, 62, 66, 0.13]
      ];
      let crossCutFractures = 0;
      for (let i = 0; i < fractureSpecs.length; i += 1) {
        const [offset, alongCenter, alongLength, amplitude] = fractureSpecs[i];
        const warp = Math.sin(secondary.u * (0.015 + i * 0.0014) + i * 1.23) * (5.0 + i)
          + valueNoise(secondary.u * 0.008 - i, secondary.v * 0.007 + i, 1487 + i * 9) * 4.8;
        const center = secondary.v - offset - warp;
        const along = Math.exp(-(((secondary.u - alongCenter) / alongLength) ** 6));
        const breakMask = clamp(0.52 + valueNoise(x * 0.012 - i, z * 0.011 + i, 1521 + i) * 0.60, 0.05, 1.0);
        crossCutFractures += -Math.exp(-((center / (4.8 + (i % 2) * 1.2)) ** 2)) * along * breakMask * amplitude;
      }

      const grabenA = this.rotateLocal(x, z, 26, -15, 0.42);
      const grabenACenter = grabenA.v - Math.sin(grabenA.u * 0.017) * 6.0;
      const majorGrabenA = -(1 - smoothstep((Math.abs(grabenACenter) - 10.5) / 5.5))
        * Math.exp(-(((grabenA.u - 12) / 92) ** 6)) * 0.47;
      const grabenB = this.rotateLocal(x, z, -48, 30, -0.27);
      const grabenBCenter = grabenB.v - Math.sin(grabenB.u * 0.022 + 1.1) * 6.5;
      const majorGrabenB = -(1 - smoothstep((Math.abs(grabenBCenter) - 7.5) / 5.0))
        * Math.exp(-(((grabenB.u + 8) / 72) ** 6)) * 0.32;

      const blockMask = clamp(0.58 + valueNoise(x * 0.014, z * 0.013, 1571) * 0.52, 0.12, 1.0);
      const tectonicRoughness = ((ridge(valueNoise(primary.u * 0.038, primary.v * 0.023, 1561)) - 0.57) * 0.070
        + (ridge(valueNoise(secondary.u * 0.042, secondary.v * 0.024, 1567)) - 0.58) * 0.055)
        * primaryEnvelope * blockMask;

      const lavaLowA = -this.ellipseGaussian(x, z, 50, 32, 42, 27, 0.33);
      const lavaLowB = -this.ellipseGaussian(x, z, -60, -42, 36, 24, 0.24);
      return highland + domes + oldFabric + crossCutFractures + tectonicRoughness
        + majorGrabenA + majorGrabenB + lavaLowA + lavaLowB;
    }

    ishtarMorphologyAt(x, z) {
      // PIA00093: Lakshmi Planum is an expansive elevated plain bordered only on
      // selected sides by major massifs. The plateau deliberately does not form a
      // closed bowl or ring around the player.
      // A large shifted oval keeps the west/south interior open while the north/east
      // margins curve naturally into mountain provinces. It avoids the rectangular
      // plateau footprint produced by four independent axis gates.
      const warpX = Math.sin((z + 18) * 0.009) * 12
        + valueNoise(z * 0.006, x * 0.003, 1493) * 9;
      const warpZ = Math.sin((x - 6) * 0.008 + 0.9) * 11
        + valueNoise(x * 0.005, z * 0.003, 1499) * 8;
      const plateauX = (x + 82 + warpX) / 274;
      const plateauZ = (z - 76 + warpZ) / 252;
      const plateauMetric = Math.hypot(plateauX, plateauZ);
      const plateauMask = 1 - smootherstep(clamp((plateauMetric - 0.82) / 0.24, 0, 1));
      const plateau = plateauMask * 2.68;
      const interiorUndulation = plateauMask * (
        valueNoise(x * 0.010, z * 0.010, 1501) * 0.035
        + valueNoise(x * 0.0045, z * 0.0045, 1503) * 0.028
      );

      const akna = this.elongatedRange(x, z, -154, -8, Math.PI / 2 - 0.10, 132, 17, 1.70, 1511);
      const freyja = this.elongatedRange(x, z, -50, -145, 0.08, 130, 18, 1.82, 1523);
      const maxwellEdge = this.elongatedRange(x, z, 158, -24, Math.PI / 2 + 0.14, 140, 19, 2.52, 1531);
      const northwesternShoulder = this.elongatedRange(x, z, -104, -108, 0.50, 82, 12, 0.48, 1537);

      const westScarp = this.ellipseGaussian(x, z, -175, 12, 21, 94, 0.22)
        * clamp(0.68 + valueNoise(z * 0.013, x * 0.008, 1549) * 0.34, 0.24, 1.0);
      const northScarp = this.ellipseGaussian(x, z, -20, -150, 88, 18, 0.19)
        * clamp(0.70 + valueNoise(x * 0.012, z * 0.008, 1553) * 0.30, 0.30, 1.0);
      const easternLow = -this.ellipseGaussian(x, z, 205, -8, 84, 126, 0.44);

      return plateau + interiorUndulation + akna + freyja + maxwellEdge
        + northwesternShoulder + westScarp + northScarp + easternLow;
    }

    alphaMorphologyAt(x, z) {
      // PIA00481: Alpha is a province-wide tessera fabric. There is no enclosing
      // basin and no single mountain landmark. Two warped structural families cross
      // almost the whole region, interrupted by fault valleys and smoother lows.
      const broadUpland = 0.70
        + valueNoise(x * 0.0055 + 1.7, z * 0.0055 - 2.2, 1627) * 0.17
        + valueNoise(x * 0.010 - 3.1, z * 0.010 + 1.5, 1629) * 0.07;
      const fabricMask = clamp(0.78 + valueNoise(x * 0.0048, z * 0.0048, 1631) * 0.28, 0.42, 1.0);

      const familyA = this.rotateLocal(x, z, 0, -6, 0.54);
      const warpA = Math.sin(familyA.u * 0.022) * 7.0
        + Math.sin(familyA.u * 0.008 + 1.2) * 4.0
        + valueNoise(familyA.u * 0.009, familyA.v * 0.006, 1601) * 5.0;
      const phaseA = (familyA.v + warpA) * (Math.PI * 2 / 24.0)
        + valueNoise(x * 0.012, z * 0.012, 1607) * 0.58;
      const cosA = Math.cos(phaseA);
      const ridgeA = Math.pow(clamp((cosA + 0.32) / 1.32, 0, 1), 2.0) * 0.25;
      const troughA = -Math.pow(clamp((-cosA + 0.36) / 1.36, 0, 1), 2.1) * 0.16;
      const maskA = clamp(0.72 + valueNoise(x * 0.008 + 2.4, z * 0.009 - 1.8, 1609) * 0.34, 0.22, 1.0);

      const familyB = this.rotateLocal(x, z, 8, -2, -0.76);
      const warpB = Math.sin(familyB.u * 0.020 + 1.7) * 7.2
        + Math.sin(familyB.u * 0.007 - 0.5) * 4.6
        + valueNoise(familyB.u * 0.009, familyB.v * 0.006, 1613) * 5.4;
      const phaseB = (familyB.v + warpB) * (Math.PI * 2 / 29.0)
        + valueNoise(x * 0.011 - 3.0, z * 0.012 + 1.5, 1619) * 0.62;
      const cosB = Math.cos(phaseB);
      const ridgeB = Math.pow(clamp((cosB + 0.30) / 1.30, 0, 1), 2.0) * 0.23;
      const troughB = -Math.pow(clamp((-cosB + 0.38) / 1.38, 0, 1), 2.1) * 0.15;
      const maskB = clamp(0.70 + valueNoise(x * 0.009 - 1.2, z * 0.008 + 2.8, 1621) * 0.36, 0.20, 1.0);

      const tesseraFabric = ((ridgeA + troughA) * maskA + (ridgeB + troughB) * maskB) * fabricMask;
      const blockRelief = (ridge(valueNoise(x * 0.020 + 1.2, z * 0.019 - 2.1, 1637)) - 0.54) * 0.10 * fabricMask;

      const faultA = this.rotateLocal(x, z, 18, -10, 0.17);
      const faultACenter = faultA.v - Math.sin(faultA.u * 0.019) * 5.0;
      const faultValleyA = -(1 - smoothstep((Math.abs(faultACenter) - 5.8) / 4.6))
        * Math.exp(-((faultA.u / 108) ** 6)) * 0.30;
      const faultB = this.rotateLocal(x, z, -42, 32, -0.40);
      const faultBCenter = faultB.v - Math.sin(faultB.u * 0.020 + 0.8) * 5.8;
      const faultValleyB = -(1 - smoothstep((Math.abs(faultBCenter) - 6.8) / 5.0))
        * Math.exp(-((faultB.u / 92) ** 6)) * 0.26;

      const lowA = -this.ellipseGaussian(x, z, -54, -42, 36, 28, 0.29);
      const lowB = -this.ellipseGaussian(x, z, 58, 34, 40, 30, 0.25);
      const eveLow = -this.ellipseGaussian(x, z, 12, 96, 48, 34, 0.22);
      return broadUpland + tesseraFabric + blockRelief + faultValleyA + faultValleyB
        + lowA + lowB + eveLow;
    }

    continuationMorphologyAt(x, z) {
      // Non-playable visual world. Every province keeps its own large-scale terrain
      // grammar beyond the walkable boundary. The continuation is intentionally
      // cheap, but it is never allowed to become a blank skirt, a symmetric ring,
      // or a different terrain family pasted around the playable map.
      if (this.region.id === "maat") {
        const volcano = this.worldPointFromReference({ x: 0, z: -46 });
        const dx = x - volcano.x, dz = z - volcano.z;
        const radius = Math.hypot(dx, dz);
        const plain = valueNoise(x * 0.010, z * 0.010, 1801) * 0.16
          + valueNoise(x * 0.0038, z * 0.0038, 1803) * 0.13
          + (ridge(valueNoise(x * 0.020 + z * 0.004, z * 0.017, 1805)) - 0.56) * 0.055;

        // Broad cooled lava units radiate away from the shield. They are low relief,
        // long, broken and overlapping, so distant Maat remains volcanic plains rather
        // than generic hills or an empty floor.
        const flowAngles = [-1.02, -0.34, 0.38, 1.18, 2.38];
        let flows = 0;
        for (let i = 0; i < flowAngles.length; i += 1) {
          const a = flowAngles[i];
          const ca = Math.cos(a), sa = Math.sin(a);
          const u = dx * ca + dz * sa;
          const v = -dx * sa + dz * ca;
          const warp = Math.sin(u * (0.034 + i * 0.002) + i * 0.75) * (4.0 + (i % 3) * 1.8)
            + valueNoise(u * 0.020 + i, v * 0.012 - i, 1807 + i) * 3.5;
          const forward = smootherstep(clamp((u + 18) / 34, 0, 1))
            * (1 - smootherstep(clamp((u - 148) / 32, 0, 1)));
          const band = Math.exp(-(((v - warp) / (10.0 + (i % 2) * 4.0)) ** 2));
          const broken = clamp(0.52 + valueNoise(x * 0.014 + i, z * 0.013 - i, 1819 + i) * 0.54, 0.08, 1.0);
          flows += band * forward * broken * (0.095 + (i % 3) * 0.020);
          flows += Math.exp(-(((Math.abs(v - warp) - (11 + i % 2 * 3)) / 3.8) ** 2))
            * forward * broken * 0.025;
        }
        const distantRiseA = this.ellipseGaussian(x, z, -118, -138, 88, 72, 0.36);
        const distantRiseB = this.ellipseGaussian(x, z, 142, -92, 104, 82, 0.27);
        const oldPlainBreak = Math.sin((x + z) * 0.030 + valueNoise(x * 0.012, z * 0.012, 1827) * 1.8)
          * Math.exp(-Math.max(0, radius - 24) / 180) * 0.035;
        return 0.16 + plain + flows + distantRiseA + distantRiseB + oldPlainBreak;
      }

      if (this.region.id === "maxwell") {
        const local = this.rotateLocal(x, z, -6, -12, -0.30);
        const offsets = [-150, -112, -77, -43, -12, 22, 60, 103, 148];
        let ridges = 0;
        for (let i = 0; i < offsets.length; i += 1) {
          const warp = Math.sin(local.u * (0.020 + (i % 3) * 0.0023) + i * 0.67) * (6.0 + (i % 4) * 1.8)
            + Math.sin(local.u * 0.0065 - i * 0.42) * 4.0
            + valueNoise(local.u * 0.012 + i, local.v * 0.007 - i, 1831 + i) * 5.0;
          const center = local.v - offsets[i] - warp;
          const width = 8.0 + (i % 3) * 2.2;
          const segment = clamp(0.46 + valueNoise(local.u * 0.009 + i * 2.1, local.v * 0.006 - i, 1847 + i) * 0.62, 0.03, 1.0);
          const branch = 1 + Math.sin(local.u * 0.014 + i * 1.15) * 0.12;
          ridges += Math.exp(-((center / width) ** 2)) * segment * branch * (0.43 + (i % 2) * 0.10);
          ridges -= Math.exp(-(((center - width * 1.55) / (width * 1.30)) ** 2)) * segment * 0.14;
        }
        // A few oblique fold splays break the impression of perfect parallel stripes
        // while keeping a coherent compressional mountain-belt direction.
        const splayA = this.elongatedRange(x, z, 78, 95, -0.07, 96, 13, 0.31, 1861);
        const splayB = this.elongatedRange(x, z, -106, -96, -0.52, 82, 12, 0.27, 1867);
        const broad = 0.25 + valueNoise(local.u * 0.009, local.v * 0.007, 1871) * 0.15;
        return broad + ridges + splayA + splayB;
      }

      if (this.region.id === "aphrodite") {
        // Ovda's distant world uses overlapping upland lobes, an older curved fabric,
        // and a younger oblique fracture generation. Large structures cross instead
        // of turning into Maxwell-style parallel mountain belts.
        const a = this.rotateLocal(x, z, 0, 0, -0.78);
        const b = this.rotateLocal(x, z, 0, 0, 0.57);
        const broadUplands = 0.27
          + this.ellipseGaussian(x, z, -105, 62, 118, 86, 0.24)
          + this.ellipseGaussian(x, z, 106, -74, 126, 92, 0.22)
          + valueNoise(x * 0.007, z * 0.007, 1881) * 0.12;
        const offsetsA = [-134, -76, -22, 39, 108];
        let oldFabric = 0;
        for (let i = 0; i < offsetsA.length; i += 1) {
          const warp = Math.sin(a.u * (0.015 + i * 0.0014) + i * 0.83) * (8 + i * 1.7)
            + Math.sin(a.u * 0.0055 - i * 0.47) * 6.0
            + valueNoise(a.u * 0.010 + i, a.v * 0.006, 1887 + i) * 5.5;
          const center = a.v - offsetsA[i] - warp;
          const along = clamp(0.43 + valueNoise(a.u * 0.008 + i, a.v * 0.005 - i, 1897 + i) * 0.65, 0.02, 1.0);
          oldFabric += Math.exp(-((center / (11 + (i % 2) * 3)) ** 2)) * along * (0.17 + (i % 3) * 0.025);
          oldFabric -= Math.exp(-(((center - 15) / (13 + (i % 2) * 2)) ** 2)) * along * 0.065;
        }
        const offsetsB = [-112, -51, 9, 71, 126];
        let fractures = 0;
        for (let i = 0; i < offsetsB.length; i += 1) {
          const warp = Math.sin(b.u * (0.017 + i * 0.0016) + i * 1.18) * (6.0 + i)
            + valueNoise(b.u * 0.011 - i, b.v * 0.006 + i, 1911 + i) * 4.8;
          const center = b.v - offsetsB[i] - warp;
          const along = clamp(0.40 + valueNoise(b.u * 0.008 + i, b.v * 0.005, 1921 + i) * 0.66, 0.015, 1.0);
          fractures -= Math.exp(-((center / (6.2 + (i % 2) * 1.8)) ** 2)) * along * (0.12 + (i % 2) * 0.035);
        }
        const lavaLowA = -this.ellipseGaussian(x, z, 88, 96, 58, 42, 0.18);
        const lavaLowB = -this.ellipseGaussian(x, z, -116, -80, 52, 38, 0.15);
        return broadUplands + oldFabric + fractures + lavaLowA + lavaLowB;
      }

      if (this.region.id === "ishtar") {
        // Continue Lakshmi as a large open plateau. Mountain systems appear as
        // separate, finite provinces at selected margins rather than a rectangular
        // shell or enclosing ring.
        const warpX = Math.sin(z * 0.018) * 9 + valueNoise(z * 0.010, x * 0.004, 1931) * 7;
        const warpZ = Math.sin(x * 0.015 + 0.8) * 8 + valueNoise(x * 0.009, z * 0.004, 1937) * 6;
        const metric = Math.hypot((x + 46 + warpX) / 162, (z - 44 + warpZ) / 150);
        const plateauMask = 1 - smootherstep(clamp((metric - 0.76) / 0.34, 0, 1));
        const plateau = plateauMask * (1.14
          + valueNoise(x * 0.008, z * 0.008, 1943) * 0.10
          + (ridge(valueNoise(x * 0.016, z * 0.013, 1949)) - 0.55) * 0.045);

        const eastA = this.elongatedRange(x, z, 104, -54, Math.PI / 2 + 0.20, 92, 13, 0.78, 1951);
        const eastB = this.elongatedRange(x, z, 124, 54, Math.PI / 2 - 0.12, 76, 15, 0.62, 1957);
        const northA = this.elongatedRange(x, z, 34, -112, 0.16, 102, 14, 0.70, 1961);
        const northwest = this.elongatedRange(x, z, -94, -96, 0.43, 72, 13, 0.55, 1967);
        const westSegment = this.elongatedRange(x, z, -126, 42, Math.PI / 2 - 0.18, 68, 13, 0.42, 1973);
        const eastLow = -this.ellipseGaussian(x, z, 158, -4, 88, 142, 0.30);
        return plateau + eastA + eastB + northA + northwest + westSegment + eastLow;
      }

      if (this.region.id === "alpha") {
        const a = this.rotateLocal(x, z, 0, 0, 0.54);
        const b = this.rotateLocal(x, z, 0, 0, -0.76);
        const regionalMask = clamp(0.70
          + valueNoise(x * 0.0055 + 2.0, z * 0.0052 - 1.0, 1981) * 0.34
          + valueNoise(x * 0.012 - 3.0, z * 0.011 + 2.0, 1987) * 0.12, 0.24, 1.0);
        const offsetsA = [-146, -106, -62, -20, 28, 76, 126, 166];
        const offsetsB = [-154, -101, -48, 8, 62, 116, 166];
        let fabric = 0;
        for (let i = 0; i < offsetsA.length; i += 1) {
          const warp = Math.sin(a.u * (0.027 + (i % 2) * 0.003) + i * 0.74) * (5.0 + (i % 3) * 1.8)
            + valueNoise(a.u * 0.016 + i, a.v * 0.009, 1993 + i) * 4.4;
          const center = a.v - offsetsA[i] - warp;
          const mask = clamp(0.44 + valueNoise(x * 0.013 + i, z * 0.012 - i, 2003 + i) * 0.62, 0.02, 1.0);
          fabric += Math.exp(-((center / (6.8 + (i % 3) * 1.2)) ** 2)) * mask * 0.15;
          fabric -= Math.exp(-(((center - 10) / 7.8) ** 2)) * mask * 0.075;
        }
        for (let i = 0; i < offsetsB.length; i += 1) {
          const warp = Math.sin(b.u * (0.025 + (i % 3) * 0.002) + i * 0.83) * (5.4 + (i % 2) * 2.0)
            + valueNoise(b.u * 0.016 - i, b.v * 0.009, 2017 + i) * 4.6;
          const center = b.v - offsetsB[i] - warp;
          const mask = clamp(0.43 + valueNoise(x * 0.012 - i, z * 0.013 + i, 2027 + i) * 0.63, 0.02, 1.0);
          fabric += Math.exp(-((center / (7.2 + (i % 2) * 1.5)) ** 2)) * mask * 0.135;
          fabric -= Math.exp(-(((center + 10) / 8.2) ** 2)) * mask * 0.070;
        }
        const smoothLowA = -this.ellipseGaussian(x, z, -112, 78, 54, 42, 0.18);
        const smoothLowB = -this.ellipseGaussian(x, z, 116, -88, 60, 44, 0.16);
        return 0.34 + fabric * regionalMask
          + valueNoise(x * 0.012, z * 0.012, 2039) * 0.08
          + smoothLowA + smoothLowB;
      }
      return 0;
    }

    continuationBlendAt(x, z) {
      const r = Math.hypot(x, z);
      const angle = Math.atan2(z, x);
      const irregularEdge = this.region.playRadius * (0.90
        + Math.sin(angle * 3.0 + 0.4) * 0.055
        + Math.sin(angle * 5.0 - 0.7) * 0.030
        + valueNoise(x * 0.025, z * 0.025, 1993) * 0.055);
      return smootherstep(clamp((r - irregularEdge) / Math.max(4, this.region.playRadius * 0.72), 0, 1));
    }

    morphologyHeightAt(x, z) {
      const source = this.sourceKmFromWorld(x, z);
      const sx = source.x, sz = source.z;
      let morphology = 0;
      if (this.region.id === "maat") morphology = this.maatMorphologyAt(sx, sz);
      else if (this.region.id === "maxwell") morphology = this.maxwellMorphologyAt(sx, sz);
      else if (this.region.id === "aphrodite") morphology = this.aphroditeMorphologyAt(sx, sz);
      else if (this.region.id === "ishtar") morphology = this.ishtarMorphologyAt(sx, sz);
      else if (this.region.id === "alpha") morphology = this.alphaMorphologyAt(sx, sz);
      const sourceWeight = this.morphologyWeight ?? this.morphologySourceWeight();
      // Never attenuate the landmark just because the sample is used by a far LOD.
      return morphology * sourceWeight;
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
        const ellipseR = Math.hypot((x + 8) / 94, (z + 2) / 72);
        const interior = 1 - smootherstep((ellipseR - 0.66) / 0.24);
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
      const source = this.sourceKmFromWorld(x, z);
      return meso * this.morphologyDetailScaleAt(source.x, source.z) * clamp(detailFade, 0, 1);
    }

    heightAt(x, z) {
      return this.scientificHeightAt(x, z) + this.morphologyHeightAt(x, z) + this.microHeightAt(x, z);
    }

    visualHeightAt(x, z, detailScale = 0.18) {
      const continuation = this.continuationMorphologyAt(x, z) * this.continuationBlendAt(x, z);
      return this.scientificVisualHeightAt(x, z)
        + this.morphologyHeightAt(x, z)
        + continuation
        + this.microHeightAt(x, z) * detailScale;
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

    createMaterial(radarTexture, background = false, continuation = false) {
      const T = this.THREE;
      const material = new T.MeshStandardMaterial({
        color: 0xffffff,
        vertexColors: true,
        map: continuation ? null : (radarTexture || null),
        bumpMap: this.detailTexture,
        bumpScale: 0.001,
        roughness: background ? 0.98 : this.quality.name === "HIGH" ? 0.885 : this.quality.name === "MEDIUM" ? 0.90 : 0.92,
        metalness: 0.0,
        fog: true,
        dithering: true
      });
      material.name = continuation ? "venus-province-continuation-material" : background ? "venus-gtdr-background-material" : "venus-gtdr-surface-material";
      material.onBeforeCompile = shader => {
        shader.uniforms.uVenusMicroDetail = { value: this.detailTexture };
        shader.uniforms.uVenusAlbedoDetail = { value: background ? 0.055 : this.quality.name === "HIGH" ? 0.20 : this.quality.name === "MEDIUM" ? 0.16 : 0.12 };
        shader.uniforms.uVenusNormalDetail = { value: background ? 0.7 : this.quality.name === "HIGH" ? 5.1 : this.quality.name === "MEDIUM" ? 3.9 : 2.8 };
        shader.uniforms.uVenusDetailTier = { value: background ? 1.0 : (this.quality.shaderDetailTier || 2.0) };
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
      material.customProgramCacheKey = () => `antara-venus-gtdr-triplanar-v4-${continuation ? "continuation" : background ? "background" : "surface"}-${this.quality.name}`;
      material.needsUpdate = true;
      return material;
    }

    geometryForRect(xMin, xMax, zMin, zMax, segmentsX, segmentsZ, backgroundLevel = 0) {
      const T = this.THREE;
      const row = segmentsX + 1;
      const rows = segmentsZ + 1;
      const positions = new Float32Array(row * rows * 3);
      const colors = new Float32Array(row * rows * 3);
      const uvs = new Float32Array(row * rows * 2);
      const indices = new Uint32Array(segmentsX * segmentsZ * 6);
      let p = 0, c = 0, uv = 0, q = 0;
      const radarExtent = this.radar.extentKm;
      const visual = backgroundLevel > 0;
      const detailScale = backgroundLevel >= 2 ? 0.04 : backgroundLevel === 1 ? 0.11 : 1.0;
      for (let iz = 0; iz <= segmentsZ; iz += 1) {
        const z = lerp(zMin, zMax, iz / segmentsZ);
        for (let ix = 0; ix <= segmentsX; ix += 1) {
          const x = lerp(xMin, xMax, ix / segmentsX);
          const y = visual ? this.visualHeightAt(x, z, detailScale) : this.heightAt(x, z);
          const slope = visual
            ? 0.07 + Math.abs(valueNoise(x * 0.025, z * 0.025, 1901)) * 0.08
            : this.slopeAt(x, z, Math.max(0.18, Math.max((xMax - xMin) / segmentsX, (zMax - zMin) / segmentsZ) * 0.72));
          const color = this.colorAt(x, z, y, slope);
          if (visual) {
            const r = Math.hypot(x, z);
            const fadeStart = this.region.playRadius * 1.10;
            const fadeEnd = Math.max(fadeStart + 1, this.continuationFarHalf * 0.96);
            const farFade = smoothstep((r - fadeStart) / (fadeEnd - fadeStart));
            const strength = backgroundLevel >= 2 ? 0.54 : 0.34;
            color.lerp(this.fogColor, farFade * strength).multiplyScalar(1 - farFade * (backgroundLevel >= 2 ? 0.16 : 0.10));
          }
          positions[p++] = x; positions[p++] = y - (visual ? 0.018 * backgroundLevel : 0); positions[p++] = z;
          colors[c++] = color.r; colors[c++] = color.g; colors[c++] = color.b;
          const source = this.sourceKmFromWorld(x, z);
          uvs[uv++] = clamp((source.x + radarExtent) / (radarExtent * 2), 0, 1);
          uvs[uv++] = clamp((radarExtent - source.z) / (radarExtent * 2), 0, 1);
        }
      }
      for (let iz = 0; iz < segmentsZ; iz += 1) {
        for (let ix = 0; ix < segmentsX; ix += 1) {
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

    geometryForPatch(centerX, centerZ, size, segments, background = false) {
      const half = size / 2;
      return this.geometryForRect(centerX - half, centerX + half, centerZ - half, centerZ + half, segments, segments, background ? 1 : 0);
    }

    createContinuationRing(innerHalf, outerHalf, longSegments, backgroundLevel) {
      const overlap = 0.55;
      const inner = Math.max(1, innerHalf - overlap);
      const outer = outerHalf;
      const width = Math.max(1, outer - inner);
      const long = Math.max(12, longSegments);
      const short = Math.max(5, Math.round(long * width / (outer * 2)));
      const rects = [
        [-outer, -inner, -outer, outer, short, long],
        [ inner,  outer, -outer, outer, short, long],
        [-inner, inner, -outer, -inner, long, short],
        [-inner, inner,  inner,  outer, long, short]
      ];
      for (const [x0, x1, z0, z1, sx, sz] of rects) {
        const geometry = this.geometryForRect(x0, x1, z0, z1, sx, sz, backgroundLevel);
        const mesh = new this.THREE.Mesh(geometry, this.continuationMaterial);
        mesh.name = `venus-${backgroundLevel >= 2 ? "far" : "mid"}-continuation-${this.region.id}-${this.continuationMeshes.length}`;
        mesh.frustumCulled = true;
        mesh.renderOrder = -3 - backgroundLevel;
        this.group.add(mesh);
        this.continuationMeshes.push(mesh);
      }
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
      this.outerScientificBaseline = this.estimateOuterScientificBaseline();
      this.morphologyWeight = this.morphologySourceWeight();
      onProgress(0.24);
      const radarTexture = await this.radar.load().catch(() => null);
      onProgress(0.34);
      this.material = this.createMaterial(radarTexture, false, false);
      // The visual continuation intentionally does not clamp/stretch the final SAR texels.
      // Close interactive chunks keep radar context; outer terrain uses world-space material
      // plus the same regional geometry grammar.
      this.backgroundMaterial = this.createMaterial(null, true, true);
      this.continuationMaterial = this.backgroundMaterial;
      this.resources.push(this.material, this.backgroundMaterial);

      const bgSegments = this.quality.backgroundSegments || (this.quality.name === "HIGH" ? 98 : this.quality.name === "MEDIUM" ? 76 : 52);
      this.background = new this.THREE.Mesh(this.geometryForPatch(0, 0, this.worldSpan, bgSegments, true), this.backgroundMaterial);
      this.background.name = `venus-regional-underlay-${this.region.id}`;
      this.background.frustumCulled = true;
      this.background.renderOrder = -2;
      this.group.add(this.background);

      const coreHalf = this.worldSpan * 0.5;
      this.createContinuationRing(coreHalf, this.continuationMidHalf, this.quality.continuationMidSegments || 34, 1);
      this.createContinuationRing(this.continuationMidHalf, this.continuationFarHalf, this.quality.continuationFarSegments || 20, 2);
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
      const count = Math.max(0, Math.round(this.quality.accentCount * (this.quality.propMultiplier || 5)));
      if (!count) return;
      const geometry = new T.DodecahedronGeometry(0.24, 0);
      const material = new T.MeshStandardMaterial({ color: this.region.palette.rock, roughness: 0.96, metalness: 0 });
      const mesh = new T.InstancedMesh(geometry, material, count);
      mesh.name = `venus-geologic-props-${this.region.id}`;
      const dummy = new T.Object3D();
      let written = 0;
      for (let i = 0; i < count * 5 && written < count; i += 1) {
        const angle = hash2(i, 7, 19) * Math.PI * 2;
        const minRadius = Math.min(2.5, this.region.playRadius * 0.12);
        const radius = minRadius + Math.sqrt(hash2(i, 11, 23)) * Math.max(1, this.region.playRadius - minRadius - 1.5);
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
      const count = this.quality.atmosphereParticles || this.quality.particleCount || (this.quality.name === "LOW" ? 82 : this.quality.name === "HIGH" ? 220 : 145);
      const positions = new Float32Array(count * 3);
      for (let i = 0; i < count; i += 1) {
        const angle = hash2(i, 31, 71) * Math.PI * 2;
        const radius = 8 + Math.sqrt(hash2(i, 37, 73)) * Math.max(48, this.worldSpan * 0.52);
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
      const authoredAnchor = observation.anchor || { x: 0, z: 0 };
      const anchor = this.worldPointFromReference(authoredAnchor);
      const searchRadius = (observation.searchRadius || 11) / this.horizontalCompression;
      const step = Math.max(0.28, (observation.searchStep || 2.75) / this.horizontalCompression);
      const limit = Math.max(6, this.region.playRadius - 3);
      let best = null;
      const evaluate = (x, z) => {
        const radius = Math.hypot(x, z);
        if (radius > limit) return;
        const height = this.heightAt(x, z);
        const slope = this.slopeAt(x, z, 0.45);
        const localRelief = Math.max(
          Math.abs(this.heightAt(x + 0.55, z) - height),
          Math.abs(this.heightAt(x - 0.55, z) - height),
          Math.abs(this.heightAt(x, z + 0.55) - height),
          Math.abs(this.heightAt(x, z - 0.55) - height)
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
        const visibleDistance = this.quality.visibleDistance || 168;
        const coreDistance = this.quality.coreVisibleDistance || 68;
        entry.mesh.visible = distance < visibleDistance && (distance < coreDistance || forwardDot > -0.82);
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
      for (const mesh of this.continuationMeshes) mesh.geometry?.dispose?.();
      this.continuationMeshes.length = 0;
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
      this.continuationMaterial = null;
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
      this.qualityPanel = document.getElementById("venus-quality-panel");
      this.qualityOptions = document.getElementById("venus-quality-options");
      this.qualityClose = document.getElementById("venus-quality-close");
      this.qualityStart = document.getElementById("venus-quality-start");
      this.qualitySelectedLabel = document.getElementById("venus-quality-selected-label");
      this.qualityDeviceNote = document.getElementById("venus-quality-device-note");
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
      this.hudQuality = document.getElementById("venus-hud-quality");
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
      this.recommendedQualityName = this.detectRecommendedQualityName();
      this.selectedQualityName = this.readSavedQualityName() || this.recommendedQualityName;
      this.quality = copyQualityProfile(this.selectedQualityName);
      this.input = new VenusInputManager(this);
      this.tick = this.tick.bind(this);
      this.root.inert = true;
      this.buildSelector();
      this.bindUI();
      this.updateQualityPanel();
    }

    get active() { return this.state !== STATES.IDLE; }

    detectRecommendedQualityName() {
      const width = Math.max(1, window.innerWidth || 1);
      const height = Math.max(1, window.innerHeight || 1);
      const dpr = clamp(window.devicePixelRatio || 1, 1, 3);
      const cores = navigator.hardwareConcurrency || 4;
      const memory = navigator.deviceMemory || 0;
      const coarse = window.matchMedia?.("(pointer: coarse)")?.matches || false;
      const mobile = /Android|iPhone|iPad|iPod|Mobile/i.test(navigator.userAgent || "");
      let maxTexture = 4096;
      let maxRenderbuffer = 4096;
      try {
        const probe = document.createElement("canvas");
        const gl = probe.getContext("webgl2", { powerPreference: "high-performance", antialias: false });
        if (gl) {
          maxTexture = gl.getParameter(gl.MAX_TEXTURE_SIZE) || maxTexture;
          maxRenderbuffer = gl.getParameter(gl.MAX_RENDERBUFFER_SIZE) || maxRenderbuffer;
          gl.getExtension("WEBGL_lose_context")?.loseContext?.();
        }
      } catch {}

      let score = 0;
      if (mobile || coarse) score -= 3;
      if (width <= 820) score -= 1;
      if (cores >= 12) score += 3;
      else if (cores >= 8) score += 2;
      else if (cores <= 4) score -= 2;
      if (memory >= 8) score += 2;
      else if (memory >= 6) score += 1;
      else if (memory > 0 && memory <= 3) score -= 2;
      if (maxTexture >= 8192 && maxRenderbuffer >= 8192) score += 1;
      if (width * height * dpr * dpr > 5_500_000) score -= 1;
      if (dpr > 2.2) score -= 1;
      if (score >= 4) return "HIGH";
      if (score <= -1) return "LOW";
      return "MEDIUM";
    }

    readSavedQualityName() {
      try {
        const saved = localStorage.getItem(VENUS_QUALITY_STORAGE_KEY);
        return QUALITY_PROFILES[saved] ? saved : null;
      } catch {
        return null;
      }
    }

    setQualityChoice(name, { persist = false } = {}) {
      if (!QUALITY_PROFILES[name] || this.renderer) return;
      this.selectedQualityName = name;
      this.quality = copyQualityProfile(name);
      if (persist) {
        try { localStorage.setItem(VENUS_QUALITY_STORAGE_KEY, name); } catch {}
      }
      this.updateQualityPanel();
    }

    updateQualityPanel() {
      const selected = this.selectedQualityName || "MEDIUM";
      this.qualityOptions?.querySelectorAll?.("[data-venus-quality]").forEach(button => {
        const name = button.dataset.venusQuality;
        const isSelected = name === selected;
        button.classList.toggle("is-selected", isSelected);
        button.setAttribute("aria-checked", String(isSelected));
        const recommendation = button.querySelector("[data-quality-recommendation]");
        if (recommendation) recommendation.textContent = name === this.recommendedQualityName ? "DIREKOMENDASIKAN" : "";
      });
      if (this.qualitySelectedLabel) this.qualitySelectedLabel.textContent = QUALITY_PROFILES[selected]?.label || "SEDANG";
      if (this.qualityDeviceNote) this.qualityDeviceNote.textContent = `Rekomendasi browser: ${QUALITY_PROFILES[this.recommendedQualityName]?.label || "SEDANG"}. Anda tetap bebas memilih mode lain.`;
      if (this.hudQuality) this.hudQuality.textContent = QUALITY_PROFILES[selected]?.label || "SEDANG";
    }

    openQualityPanel() {
      this.state = STATES.CONFIGURING;
      this.root.className = "mars-full-exploration venus-full-exploration is-configuring";
      this.qualityPanel.hidden = false;
      this.selector.hidden = true;
      this.updateQualityPanel();
      document.getElementById("mission").classList.add("is-venus-full-selecting");
      document.getElementById("announcement").textContent = "Pilih kualitas grafis untuk Eksplorasi Pengalaman Penuh Venus.";
      requestAnimationFrame(() => this.qualityOptions?.querySelector?.(".is-selected")?.focus({ preventScroll: true }));
    }

    confirmQualitySelection() {
      if (this.state !== STATES.CONFIGURING) return;
      this.setQualityChoice(this.selectedQualityName || this.recommendedQualityName, { persist: true });
      this.qualityPanel.hidden = true;
      this.state = STATES.SELECTING;
      this.root.className = "mars-full-exploration venus-full-exploration is-selecting";
      this.selector.hidden = false;
      document.getElementById("announcement").textContent = "Pilih destinasi Eksplorasi Pengalaman Penuh Venus.";
      requestAnimationFrame(() => this.selector.querySelector("[data-venus-region]")?.focus({ preventScroll: true }));
    }

    cancelPreEntry() {
      if (![STATES.CONFIGURING, STATES.SELECTING].includes(this.state) || this.regionWorld) return;
      this.transitionToken += 1;
      this.state = STATES.IDLE;
      this.qualityPanel.hidden = true;
      this.selector.hidden = false;
      this.root.className = "mars-full-exploration venus-full-exploration";
      this.root.hidden = true;
      this.root.inert = true;
      this.root.setAttribute("aria-hidden", "true");
      this.entryButton.disabled = false;
      document.getElementById("mission").classList.remove("is-venus-full", "is-venus-full-selecting");
      document.getElementById("announcement").textContent = "Kembali ke panorama Venus.";
      this.entryButton.focus({ preventScroll: true });
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
      this.qualityOptions?.addEventListener("click", event => {
        const button = event.target.closest("[data-venus-quality]");
        if (button) this.setQualityChoice(button.dataset.venusQuality);
      });
      this.qualityStart?.addEventListener("click", () => this.confirmQualitySelection());
      this.qualityClose?.addEventListener("click", () => this.cancelPreEntry());
      this.selectorGrid.addEventListener("click", event => {
        const button = event.target.closest("[data-venus-region]");
        if (!button) return;
        const region = REGIONS.find(item => item.id === button.dataset.venusRegion);
        if (region) this.chooseRegion(region);
      });
      this.selectorClose.addEventListener("click", () => {
        if (this.selectorOpenedFromRegion && this.regionWorld) this.closeSelectorToRegion();
        else this.cancelPreEntry();
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
        if (event.key !== "Escape" || ![STATES.CONFIGURING, STATES.SELECTING].includes(this.state)) return;
        event.preventDefault();
        event.stopImmediatePropagation();
        if (this.state === STATES.CONFIGURING) this.cancelPreEntry();
        else if (this.selectorOpenedFromRegion && this.regionWorld) this.closeSelectorToRegion();
        else this.cancelPreEntry();
      }, true);
    }

    enter() {
      if (!this.venus.active || this.venus.travelMode || this.state !== STATES.IDLE) return;
      if (this.venus.exploring) this.venus.exitExploration();
      this.entryButton.disabled = true;
      this.selectorOpenedFromRegion = false;
      this.root.hidden = false;
      this.root.inert = false;
      this.root.setAttribute("aria-hidden", "false");
      this.root.style.setProperty("--surface-opacity", "0");
      this.root.style.setProperty("--entry-progress", "0");
      this.resetEducationUI();
      this.loading.hidden = true;
      this.errorPanel.hidden = true;
      this.infoCard.classList.remove("is-visible");
      this.infoCard.setAttribute("aria-hidden", "true");
      this.infoToggle.hidden = true;
      this.openQualityPanel();
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
        this.setCameraForRegion(region, switching ? 4.8 : 8.5);
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
      const spawn = this.regionWorld.worldPointFromReference(region.spawn);
      const target = region.lookTarget ? this.regionWorld.worldPointFromReference(region.lookTarget) : null;
      const ground = this.regionWorld.heightAt(spawn.x, spawn.z);
      this.lastGround = ground;
      this.cameraAltitude = altitude;
      this.camera.position.set(spawn.x, ground + altitude, spawn.z);
      if (target) {
        const dx = target.x - spawn.x;
        const dz = target.z - spawn.z;
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
      const targetAltitude = clamp(this.region.spawn.altitude * 0.62, 0.28, 0.48);
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
      const targetSpeed = baseSpeed * boost * precision * (this.region.space?.movementScale || 0.72);
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
      if (this.hudQuality) this.hudQuality.textContent = this.quality.label || "SEDANG";
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
      if (this.hudQuality) this.hudQuality.textContent = this.quality.label || "SEDANG";
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

    animateExitRetreat(targetAltitude, duration, token) {
      // Port of Mars Full Exploration's altitude stage: keep the live surface renderer
      // running while the camera rises. Planet-scale recession is owned by VenusScene's
      // dedicated fullDiveBlend, not faked by dragging the local terrain camera backward.
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
          this.root.style.setProperty("--exit-lift", String(eased));
          if (raw < 1) requestAnimationFrame(frame);
          else resolve();
        };
        requestAnimationFrame(frame);
      });
    }

    async exit() {
      if (!this.active || this.state === STATES.EXITING) return;
      if (this.state === STATES.CONFIGURING) {
        this.cancelPreEntry();
        return;
      }
      if (this.state === STATES.SELECTING && !this.regionWorld) {
        this.cancelPreEntry();
        return;
      }
      if (this.state === STATES.ERROR || this.state === STATES.PREPARING || this.state === STATES.SWITCHING) {
        this.failBackToOrbit();
        return;
      }

      this.state = STATES.EXITING;
      const token = ++this.transitionToken;
      // Mars is the exact lifecycle reference: first rise on the live surface, then
      // reverse the dedicated planet full-dive while the surface fades over it.
      this.input.clear();
      this.input.unbind();
      this.selector.hidden = true;
      if (this.qualityPanel) this.qualityPanel.hidden = true;
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
          await this.animateExitRetreat(Math.max(currentAltitude, 18), 1650, token);
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
          const surfaceFade = 1 - smoothstep(raw / 0.62);
          this.root.style.setProperty("--surface-opacity", String(surfaceFade));
          this.root.style.setProperty("--entry-progress", String(1 - eased));
          this.root.style.setProperty("--exit-lift", String(1));

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
      this.root.style.removeProperty("--exit-lift");
      this.selector.hidden = false;
      if (this.qualityPanel) this.qualityPanel.hidden = true;
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
