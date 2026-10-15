"use strict";

(() => {
  const STATES = Object.freeze({
    HIDDEN: "hidden",
    SELECTING: "selecting",
    CONFIGURING: "configuring",
    LOADING: "loading",
    EXPLORING: "exploring",
    EXITING: "exiting",
    ERROR: "error"
  });

  const QUALITY_STORAGE_KEY = "antara-mercury-graphics-quality-v1";
  const QUALITY_PROFILES = Object.freeze({
    LOW: Object.freeze({ name: "LOW", label: "RENDAH", segments: 72, worldSize: 160, worldRadius: 58, speed: 22, maxDpr: 1.0, visibleDistance: 78 }),
    MEDIUM: Object.freeze({ name: "MEDIUM", label: "SEDANG", segments: 104, worldSize: 180, worldRadius: 66, speed: 26, maxDpr: 1.35, visibleDistance: 96 }),
    HIGH: Object.freeze({ name: "HIGH", label: "TINGGI", segments: 136, worldSize: 208, worldRadius: 76, speed: 31, maxDpr: 1.7, visibleDistance: 114 })
  });
  const copyQualityProfile = name => ({ ...(QUALITY_PROFILES[name] || QUALITY_PROFILES.MEDIUM) });

  const REGIONS = Object.freeze([
    {
      id: "caloris",
      name: "Caloris Basin (Cekungan Besar)",
      short: "Caloris",
      category: "BEKAS TABRAKAN BESAR",
      latitude: 31.5,
      longitudeEast: 162.7,
      heading: 0,
      source: "https://science.nasa.gov/photojournal/the-mighty-caloris/",
      coordinateSource: "https://science.nasa.gov/photojournal/the-mighty-caloris/",
      image: "https://assets.science.nasa.gov/dynamicimage/assets/science/psd/photojournal/pia/pia19/pia19213/PIA19213.jpg?crop=faces%2Cfocalpoint&fit=clip&h=1200&w=1600",
      descriptor: "Cekungan besar bekas tabrakan raksasa dengan cincin pegunungan dan dataran dari gunung api di bagian dalam.",
      description: "Caloris Basin adalah cekungan raksasa bekas tabrakan. Bekasnya masih terlihat sampai sekarang. Setelah tabrakan besar itu, lava pernah mengisi sebagian daerah di dalamnya.",
      facts: [
        "Diameter Caloris Cekungan besar sekitar 1.550 kilometer.",
        "Bagian dalam cekungan besar diisi dataran dari gunung api yang lebih halus daripada daerah sekitarnya.",
        "Di sisi berlawanan planet terdapat wilayah kacau yang diduga terkait gelombang tabrakan Caloris."
      ],
      palette: { low: 0x141414, mid: 0x30302e, high: 0x66615a, accent: 0xbfa77d },
      terrain: {
        seed: 11,
        craters: [
          { x: 0, z: -6, r: 34, depth: 13 },
          { x: -18, z: 17, r: 7, depth: 2.2 },
          { x: 21, z: 10, r: 9, depth: 2.8 },
          { x: 8, z: -24, r: 5.4, depth: 1.6 }
        ],
        scarps: [{ x1: -42, z1: -16, x2: 36, z2: -30, width: 5, height: 3.6 }],
        domes: [{ x: 0, z: -6, r: 40, height: 2.2 }]
      }
    },
    {
      id: "discovery",
      name: "Discovery Rupes",
      short: "Discovery Rupes",
      category: "TEBING PANJANG",
      latitude: -55.0,
      longitudeEast: 322.2,
      heading: 14,
      source: "https://science.nasa.gov/photojournal/deformation-discovery/",
      coordinateSource: "https://planetarynames.wr.usgs.gov/Feature/1548",
      image: "https://assets.science.nasa.gov/dynamicimage/assets/science/psd/photojournal/pia/pia17/pia17739/PIA17739.jpg?crop=faces%2Cfocalpoint&fit=clip&h=1024&w=1024",
      descriptor: "Tebing raksasa yang terbentuk ketika Merkurius mendingin dan menyusut.",
      description: "Discovery Rupes adalah tebing panjang panjang yang menunjukkan Merkurius pernah menyusut secara di seluruh planet. Saat bagian dalamnya mendingin, kerak terdorong, terlipat, lalu membentuk tebing panjang seperti kerutan pada kulit buah.",
      facts: [
        "Tebing kerut panjang seperti Discovery Rupes adalah ciri khas penyusutan di seluruh planet Merkurius.",
        "Sebagian tebing di Merkurius dapat membentang ratusan kilometer.",
        "MESSENGER membantu membuat peta tebing panjang lebih rinci dibanding era Mariner 10."
      ],
      palette: { low: 0x121314, mid: 0x2c2d2d, high: 0x5b5955, accent: 0xb7a17f },
      terrain: {
        seed: 23,
        craters: [
          { x: -24, z: -18, r: 6.5, depth: 1.8 },
          { x: 26, z: 12, r: 9.2, depth: 2.4 },
          { x: 8, z: -32, r: 4.8, depth: 1.3 }
        ],
        scarps: [
          { x1: -58, z1: -14, x2: 56, z2: 9, width: 7.4, height: 8.6 },
          { x1: -45, z1: -24, x2: 32, z2: -6, width: 4.8, height: 3.4 }
        ],
        domes: []
      }
    },
    {
      id: "beethoven",
      name: "Beethoven Cekungan besar",
      short: "Beethoven",
      category: "CEKUNGAN SANGAT TUA",
      latitude: -21.0,
      longitudeEast: 236.0,
      heading: -18,
      source: "https://science.nasa.gov/photojournal/mapping-beethoven/",
      coordinateSource: "https://science.nasa.gov/photojournal/mapping-beethoven/",
      image: "https://assets.science.nasa.gov/dynamicimage/assets/science/psd/photojournal/pia/pia14/pia14864/PIA14864.jpg?crop=faces%2Cfocalpoint&fit=clip&h=1799&w=1018",
      descriptor: "Cekungan besar tua yang menunjukkan hubungan antara kawah besar, batu dan debu yang terpental, dan dataran sekitarnya.",
      description: "Beethoven Basin adalah contoh cekungan besar tua yang dikelilingi jejak tabrakan dan bentuk naik-turun tanah berumur sangat lama. Di sini kamu bisa melihat bagaimana permukaan Merkurius menyimpan lapisan sejarah tabrakan berulang.",
      facts: [
        "Beethoven Cekungan besar berdiameter sekitar 630 kilometer.",
        "Wilayah ini menampilkan perubahan antara cekungan besar besar dan medan kawah tua.",
        "Cekungan besar yang sangat tua membantu ilmuwan melihat apa yang terjadi dulu awal pemboman di Tata Surya dalam."
      ],
      palette: { low: 0x111112, mid: 0x292929, high: 0x575552, accent: 0xbba98c },
      terrain: {
        seed: 37,
        craters: [
          { x: -5, z: -5, r: 26, depth: 8.8 },
          { x: 20, z: 16, r: 6.8, depth: 1.8 },
          { x: -26, z: 14, r: 8.5, depth: 2.2 },
          { x: -20, z: -28, r: 5.4, depth: 1.2 }
        ],
        scarps: [{ x1: -38, z1: 34, x2: 36, z2: 18, width: 4.8, height: 2.2 }],
        domes: [{ x: -5, z: -5, r: 31, height: 1.4 }]
      }
    },
    {
      id: "rembrandt",
      name: "Rembrandt Cekungan besar",
      short: "Rembrandt",
      category: "CEKUNGAN BANYAK LINGKARAN",
      latitude: -34.67,
      longitudeEast: 100.4,
      heading: 22,
      source: "https://science.nasa.gov/photojournal/rembrandt-basin-in-color/",
      coordinateSource: "https://science.nasa.gov/photojournal/rembrandt-basin-in-color/",
      image: "https://assets.science.nasa.gov/dynamicimage/assets/science/psd/photojournal/pia/pia14/pia14497/PIA14497.jpg?crop=faces%2Cfocalpoint&fit=clip&h=1514&w=1663",
      descriptor: "Cekungan besar raksasa dengan cincin patahan dan dataran luas yang menarik untuk dibandingkan dengan Caloris.",
      description: "Rembrandt Basin menunjukkan bahwa cekungan besar besar di Merkurius tidak semuanya sama. Bentuk cincin, medan retak, dan variasi bentuk tanahnya membantu membandingkan cara tabrakan besar pada lokasi berbeda.",
      facts: [
        "Rembrandt berdiameter sekitar 715 kilometer.",
        "Cekungan besar ini punya sistem cincin dan bentuk gerakan kulit planet di bagian dalamnya.",
        "MESSENGER menemukan detail Rembrandt yang jauh lebih lengkap setelah Mariner 10 tidak sempat memotretnya."
      ],
      palette: { low: 0x121214, mid: 0x2b2b2d, high: 0x5f5a56, accent: 0xc4ac89 },
      terrain: {
        seed: 51,
        craters: [
          { x: 0, z: 0, r: 23, depth: 7.2 },
          { x: -24, z: 24, r: 8.1, depth: 1.8 },
          { x: 22, z: -21, r: 7.6, depth: 1.9 }
        ],
        scarps: [
          { x1: -20, z1: 30, x2: 26, z2: -32, width: 4.4, height: 2.9 },
          { x1: -40, z1: 6, x2: 42, z2: 6, width: 3.8, height: 1.7 }
        ],
        domes: [{ x: 0, z: 0, r: 34, height: 1.0 }]
      }
    },
    {
      id: "prokofiev",
      name: "Prokofiev Crater",
      short: "Prokofiev",
      category: "KUTUB UTARA",
      latitude: 85.42,
      longitudeEast: 52.65,
      heading: -8,
      source: "https://science.nasa.gov/photojournal/icy-view-of-prokofiev/",
      coordinateSource: "https://science.nasa.gov/photojournal/icy-view-of-prokofiev/",
      image: "https://assets.science.nasa.gov/dynamicimage/assets/science/psd/photojournal/pia/pia18/pia18748/PIA18748.jpg?crop=faces%2Cfocalpoint&fit=clip&h=1600&w=1200",
      descriptor: "Wilayah kutub yang terkenal karena endapan cerah terkait es air di kawah permanen gelap.",
      description: "Daerah kutub utara Merkurius menyimpan salah satu kejutan terbesar planet ini: es air di tempat yang tidak pernah terkena cahaya Matahari langsung. Prokofiev sering digunakan sebagai contoh kawasan kutub yang sangat dingin itu.",
      facts: [
        "Radar dan data neutron menunjukkan keberadaan endapan es di kawah kutub Merkurius.",
        "Walau dekat Matahari, dasar kawah yang selalu gelap bisa tetap sangat dingin.",
        "Temuan es kutub menjadikan Merkurius jauh lebih rumit daripada dugaan awal."
      ],
      palette: { low: 0x101112, mid: 0x292b2c, high: 0x626365, accent: 0xd4cec2 },
      terrain: {
        seed: 67,
        craters: [
          { x: 0, z: 0, r: 16, depth: 5.8 },
          { x: -18, z: 18, r: 7.0, depth: 1.8 },
          { x: 17, z: -15, r: 8.2, depth: 2.0 },
          { x: 28, z: 20, r: 5.3, depth: 1.0 }
        ],
        scarps: [{ x1: -48, z1: -8, x2: 34, z2: 18, width: 3.6, height: 1.7 }],
        domes: []
      }
    }
  ]);

  const REGION_BY_ID = new Map(REGIONS.map(region => [region.id, region]));

  const MERCURY_EDUCATION = Object.freeze({
    caloris: Object.freeze({
      intro: "Jelajahi empat bagian Caloris: tepinya, dataran bekas lava, kawah kecil, serta batu dan debu yang pernah terpental.",
      observations: Object.freeze([
        { id: "caloris-rim", label: "Temukan tepi cekungan besar Caloris", title: "Tepi Cekungan besar Raksasa", type: "COBA PERHATIKAN!", x: -22, z: 18, interactRadius: 5.2, lead: "Tanah di sini berubah dari dataran biasa menjadi tepi Caloris yang besar.", why: "Tepi Caloris menunjukkan betapa kuat tabrakan yang membuat cekungan raksasa ini.", source: "https://science.nasa.gov/photojournal/the-mighty-caloris/" },
        { id: "caloris-plains", label: "Amati dataran halus di dalam cekungan besar", title: "Dataran Dari gunung api Caloris", type: "TAHUKAH KAMU?", x: 14, z: 12, interactRadius: 5.0, lead: "Bagian dalam Caloris lebih halus daripada banyak medan kawah tua di sekitarnya.", why: "Dataran halus menunjukkan bahan dari gunung api pernah mengisi bagian dalam cekungan besar setelah tabrakan besar.", source: "https://science.nasa.gov/mercury/" },
        { id: "caloris-secondary", label: "Cari kawah kecil tambahan di sekitar cekungan besar", title: "Kawah Kecil Tambahan", type: "COBA LIHAT!", x: -10, z: -16, interactRadius: 5.0, lead: "Kawah yang lebih kecil dapat terbentuk dari bahan batu dan debu yang terpental yang jatuh kembali setelah tabrakan utama.", why: "Kawah-kawah kecil membantu kita melihat mana bekas tabrakan besar dan mana tabrakan kecil.", source: "https://science.nasa.gov/mercury/" },
        { id: "caloris-batu dan debu yang terpental", label: "Pelajari zona batu dan debu yang terpental Caloris", title: "Jejak Batu dan debu yang terpental", type: "TERNYATA...", x: 23, z: -20, interactRadius: 5.4, lead: "Bahan yang terlempar saat tabrakan besar dapat tersebar jauh dari pusat cekungan besar.", why: "Penyebaran batu dan debu yang terpental menyimpan bekas arah dan skala cara tabrakan yang membentuk Caloris.", source: "https://science.nasa.gov/photojournal/the-mighty-caloris/" }
      ])
    }),
    discovery: Object.freeze({
      intro: "Ikuti empat titik di Discovery Rupes untuk memahami bagaimana Merkurius menyusut dan membentuk tebing panjang.",
      observations: Object.freeze([
        { id: "discovery-main-tebing panjang", label: "Dekati tebing utama Discovery Rupes", title: "Tebing Penyusutan", type: "COBA PERHATIKAN!", x: -30, z: -9, interactRadius: 5.0, lead: "Tebing panjang panjang ini menyerupai kerutan raksasa pada kerak Merkurius.", why: "Saat bagian dalam Merkurius mendingin, volumenya berkurang dan kerak terdorong membentuk sesar dorong serta tebing panjang.", source: "https://science.nasa.gov/photojournal/deformation-discovery/" },
        { id: "discovery-offset", label: "Amati perubahan tinggi di dua sisi tebing", title: "Perbedaan Ketinggian", type: "COBA LIHAT!", x: 10, z: 4, interactRadius: 4.8, lead: "Dua sisi bentuk tidak berada pada ketinggian yang sama.", why: "Perbedaan tinggi membantu mengenali perpindahan kerak akibat dorongan kuat di seluruh planet Merkurius.", source: "https://science.nasa.gov/photojournal/deformation-discovery/" },
        { id: "discovery-crater-cut", label: "Cari kawah yang dipotong bentuk", title: "Tebing panjang Memotong Medan Lama", type: "TERNYATA...", x: 28, z: 17, interactRadius: 5.0, lead: "Bentuk gerakan kulit planet bisa melintasi medan yang lebih tua, termasuk kawah.", why: "Hubungan potong-memotong membantu menentukan urutan kejadian tanah dan batu: bentuk yang memotong biasanya lebih muda.", source: "https://science.nasa.gov/mercury/" },
        { id: "discovery-ridge", label: "Ikuti punggungan tambahan", title: "Punggungan Kecil Tambahan", type: "COBA TELUSURI!", x: -12, z: -27, interactRadius: 5.2, lead: "Di sekitar tebing panjang utama ada bentuk naik-turun tanah kecil yang memperkaya bentuk medan.", why: "Medan gerakan kulit planet tidak selalu berisi satu garis. Punggungan kecil membantu melihat perubahan bentuk yang lebih rumit.", source: "https://science.nasa.gov/mercury/" }
      ])
    }),
    beethoven: Object.freeze({
      intro: "Baca Beethoven sebagai cekungan besar tua: tepi cekungan besar, dasar cekungan, kawah tumpang tindih, dan medan batu dan debu yang terpental yang sudah sangat tererosi.",
      observations: Object.freeze([
        { id: "beethoven-rim", label: "Temukan tepi Beethoven Cekungan besar", title: "Tepi Cekungan besar Tua", type: "COBA PERHATIKAN!", x: -21, z: 18, interactRadius: 5.2, lead: "Tepi Beethoven tidak setajam cekungan besar yang lebih muda karena permukaannya telah lama dipenuhi tabrakan berikutnya.", why: "Derajat pelapukan dan tumpang tindih kawah menunjukkan umur cukup suatu medan.", source: "https://science.nasa.gov/photojournal/mapping-beethoven/" },
        { id: "beethoven-floor", label: "Amati bagian dalam cekungan besar", title: "Dasar Beethoven", type: "TAHUKAH KAMU?", x: 2, z: 2, interactRadius: 5.0, lead: "Bagian dalam cekungan besar memperlihatkan bentuk naik-turun tanah yang lebih rendah dengan banyak bekas tabrakan tambahan.", why: "Dasar cekungan besar masih punya banyak bekas kejadian lama perubahan permukaan setelah tabrakan utama.", source: "https://science.nasa.gov/photojournal/mapping-beethoven/" },
        { id: "beethoven-overlap", label: "Cari kawah yang saling bertumpuk", title: "Kawah Bertumpuk", type: "COBA LIHAT!", x: 23, z: 19, interactRadius: 5.0, lead: "Beberapa kawah tampak saling menimpa karena terbentuk pada waktu yang berbeda.", why: "Tumpang tindih kawah adalah salah satu cara sederhana untuk melihat urutan cukup kejadian tanah dan batu.", source: "https://science.nasa.gov/mercury/" },
        { id: "beethoven-batu dan debu yang terpental", label: "Amati medan kasar di luar cekungan besar", title: "Medan Batu dan debu yang terpental Tua", type: "TERNYATA...", x: -25, z: -22, interactRadius: 5.3, lead: "Medan kasar di luar cekungan besar mencampur batu dan debu yang terpental tua dengan kawah yang muncul kemudian.", why: "Campuran bentuk naik-turun tanah menunjukkan betapa lama permukaan Merkurius terus dibombardir setelah cekungan besar terbentuk.", source: "https://science.nasa.gov/mercury/" }
      ])
    }),
    rembrandt: Object.freeze({
      intro: "Cari empat petunjuk utama di Rembrandt: cincin cekungan besar, retakan bagian dalam, dataran, dan kawah yang memotong bentuk lama.",
      observations: Object.freeze([
        { id: "rembrandt-ring", label: "Temukan pola cincin Rembrandt", title: "Cincin Cekungan besar Rembrandt", type: "COBA PERHATIKAN!", x: -20, z: 17, interactRadius: 5.2, lead: "Bentuk naik-turun tanah melingkar mengelilingi bagian dalam Rembrandt Basin.", why: "Cincin membuat lebih mudah tahu bagaimana kerak merespons tabrakan raksasa dan penyesuaian sesudahnya.", source: "https://science.nasa.gov/photojournal/rembrandt-basin-in-color/" },
        { id: "rembrandt-fracture", label: "Cari bentuk retak di bagian dalam", title: "Retakan Bagian dalam", type: "COBA LIHAT!", x: 9, z: -2, interactRadius: 4.8, lead: "Di dalam cekungan besar terdapat bentuk yang memotong dataran dan membentuk pola gerakan kulit planet.", why: "Retakan dapat muncul ketika kerak mengalami tarikan atau penyesuaian setelah cekungan besar terisi bahan baru.", source: "https://science.nasa.gov/photojournal/rembrandt-basin-in-color/" },
        { id: "rembrandt-plains", label: "Bandingkan dataran dengan cincin cekungan besar", title: "Dataran Bagian dalam", type: "TAHUKAH KAMU?", x: 24, z: 18, interactRadius: 5.1, lead: "Dataran cukup halus perbedaan jelas dengan bentuk naik-turun tanah cincin di sekitarnya.", why: "Perbedaan tekstur membantu memisahkan unit tanah dan batu yang terbentuk oleh cara dan waktu yang berbeda.", source: "https://science.nasa.gov/mercury/" },
        { id: "rembrandt-younger", label: "Cari kawah lebih muda di atas bentuk lama", title: "Kawah yang Lebih Muda", type: "TERNYATA...", x: -18, z: -24, interactRadius: 5.0, lead: "Kawah kecil yang memotong bentuk cekungan besar menunjukkan kejadian yang terjadi sesudah cekungan besar terbentuk.", why: "Prinsip tumpang tindih membantu menyusun urutan kejadian cukup tanpa harus mengetahui umur absolut setiap batuan.", source: "https://science.nasa.gov/mercury/" }
      ])
    }),
    prokofiev: Object.freeze({
      intro: "Prokofiev memperlihatkan paradoks Merkurius: sangat dekat Matahari. Tapi kawah kutub yang selalu gelap dapat menyimpan es.",
      observations: Object.freeze([
        { id: "prokofiev-shadow", label: "Masuki zona dasar kawah yang gelap", title: "Bayangan Permanen", type: "COBA PERHATIKAN!", x: -9, z: 4, interactRadius: 4.8, lead: "Bagian tertentu dari kawah kutub hampir tidak pernah menerima cahaya Matahari langsung.", why: "Tanpa pemanasan langsung, suhu lokal bisa tetap sangat rendah meski Merkurius dekat dengan Matahari.", source: "https://science.nasa.gov/photojournal/icy-view-of-prokofiev/" },
        { id: "prokofiev-ice", label: "Pelajari area terkait endapan es", title: "Endapan Es Kutub", type: "TERNYATA...", x: 8, z: -4, interactRadius: 4.8, lead: "Data radar dan pengukuran MESSENGER mendukung keberadaan bahan kaya es di kawah kutub.", why: "Temuan ini mengubah gambaran Merkurius dari sekadar planet panas menjadi dunia dengan lingkungan sangat kuat yang sangat perbedaan.", source: "https://science.nasa.gov/photojournal/icy-view-of-prokofiev/" },
        { id: "prokofiev-rim", label: "Bandingkan tepi terang dengan dasar gelap", title: "Perbedaan Tepi dan Dasar", type: "COBA LIHAT!", x: 16, z: 15, interactRadius: 5.0, lead: "Tepi kawah dapat menerima cahaya kuat sementara dasar tertentu tetap berada dalam bayangan.", why: "Geometri kutub dan bentuk tinggi-rendah tanah kawah menciptakan mikro-lingkungan suhu yang sangat berbeda dalam jarak pendek.", source: "https://science.nasa.gov/mercury/" },
        { id: "prokofiev-small-craters", label: "Cari kawah kecil di sekitar Prokofiev", title: "Medan Kawah Kutub", type: "COBA TELUSURI!", x: -22, z: -16, interactRadius: 5.2, lead: "Wilayah kutub tetap dipenuhi kawah kecil dan bentuk naik-turun tanah tua seperti bagian Merkurius lainnya.", why: "Kawah-kawah kecil menunjukkan bahwa cara tabrakan terus membentuk permukaan bahkan di wilayah yang menyimpan es.", source: "https://science.nasa.gov/mercury/" }
      ])
    })
  });

  const clamp = (value, min, max) => Math.max(min, Math.min(max, value));
  const lerp = (a, b, t) => a + (b - a) * t;
  const smoothStep = value => {
    const v = clamp(value, 0, 1);
    return v * v * (3 - 2 * v);
  };
  const distance2D = (a, b) => Math.hypot((a.x || 0) - (b.x || 0), (a.z || 0) - (b.z || 0));
  const wait = ms => new Promise(resolve => window.setTimeout(resolve, Math.max(0, ms)));
  const seeded = seed => {
    const x = Math.sin(seed * 127.1 + 311.7) * 43758.5453123;
    return x - Math.floor(x);
  };

  class MercuryFullExploration {
    constructor(mercuryScene) {
      this.mercury = mercuryScene;
      this.root = document.getElementById("mercury-full-exploration");
      this.viewport = document.getElementById("mercury-full-viewport");
      this.entryButton = document.getElementById("mercury-full-explore-button");
      this.regionSelector = document.getElementById("mercury-region-selector");
      this.regionGrid = document.getElementById("mercury-region-grid");
      this.regionClose = document.getElementById("mercury-region-selector-close");
      this.qualityPanel = document.getElementById("mercury-quality-panel");
      this.qualityClose = document.getElementById("mercury-quality-close");
      this.qualityOptions = Array.from(document.querySelectorAll("#mercury-quality-options.venus-quality-option"));
      this.qualityDeviceNote = document.getElementById("mercury-quality-device-note");
      this.qualitySelectedLabel = document.getElementById("mercury-quality-selected-label");
      this.qualityStart = document.getElementById("mercury-quality-start");
      this.loadingCard = document.getElementById("mercury-full-loading");
      this.loadingStatus = document.getElementById("mercury-full-loading-status");
      this.loadingProgress = document.getElementById("mercury-full-loading-progress");
      this.errorCard = document.getElementById("mercury-full-error");
      this.errorMessage = document.getElementById("mercury-full-error-message");
      this.errorReturn = document.getElementById("mercury-full-error-return");
      this.hud = this.root.querySelector("[data-mercury-ui].mars-full-hud");
      this.hudLocation = document.getElementById("mercury-hud-location");
      this.hudCoordinates = document.getElementById("mercury-hud-coordinates");
      this.hudAltitude = document.getElementById("mercury-hud-altitude");
      this.hudSpeed = document.getElementById("mercury-hud-speed");
      this.hudDistance = document.getElementById("mercury-hud-distance");
      this.hudRegionType = document.getElementById("mercury-hud-region-type");
      this.hudQuality = document.getElementById("mercury-hud-quality");
      this.hudData = document.getElementById("mercury-hud-data");
      this.objectivesPanel = document.getElementById("mercury-objectives-panel");
      this.objectivesRegion = document.getElementById("mercury-objectives-region");
      this.objectivesIntro = document.getElementById("mercury-objectives-intro");
      this.objectivesList = document.getElementById("mercury-objectives-list");
      this.discoveryCount = document.getElementById("mercury-discovery-count");
      this.discoveryBar = document.getElementById("mercury-discovery-bar");
      this.nextTarget = document.getElementById("mercury-next-target");
      this.nextTargetName = document.getElementById("mercury-next-target-name");
      this.nextTargetDistance = document.getElementById("mercury-next-target-distance");
      this.objectivesCollapse = document.getElementById("mercury-objectives-collapse");
      this.objectivesToggle = document.getElementById("mercury-objectives-toggle");
      this.observationPrompt = document.getElementById("mercury-observation-prompt");
      this.observationPromptTitle = document.getElementById("mercury-observation-prompt-title");
      this.observeButton = document.getElementById("mercury-observe-button");
      this.observationCard = document.getElementById("mercury-observation-card");
      this.observationClose = document.getElementById("mercury-observation-close");
      this.observationType = document.getElementById("mercury-observation-type");
      this.observationStatus = document.getElementById("mercury-observation-status");
      this.observationTitle = document.getElementById("mercury-observation-title");
      this.observationMeta = document.getElementById("mercury-observation-meta");
      this.observationLead = document.getElementById("mercury-observation-lead");
      this.observationWhy = document.getElementById("mercury-observation-why");
      this.observationSourceNote = document.getElementById("mercury-observation-source-note");
      this.observationSource = document.getElementById("mercury-observation-source");
      this.landmarkCard = document.getElementById("mercury-landmark-card");
      this.landmarkName = document.getElementById("mercury-landmark-name");
      this.landmarkType = document.getElementById("mercury-landmark-type");
      this.landmarkCoords = document.getElementById("mercury-landmark-coords");
      this.landmarkDescription = document.getElementById("mercury-landmark-description");
      this.landmarkFacts = document.getElementById("mercury-landmark-facts");
      this.landmarkImageWrap = document.getElementById("mercury-landmark-media");
      this.landmarkImage = document.getElementById("mercury-landmark-image");
      this.landmarkSource = document.getElementById("mercury-landmark-source");
      this.landmarkCoordinateSource = document.getElementById("mercury-landmark-coordinate-source");
      this.landmarkMinimize = document.getElementById("mercury-landmark-minimize");
      this.infoToggle = document.getElementById("mercury-info-toggle");
      this.locationToggle = document.getElementById("mercury-location-toggle");
      this.actionsMenu = document.getElementById("mercury-actions-menu");
      this.actionsRoot = this.root.querySelector(".venus-full-actions");
      this.actionsMenuToggle = document.getElementById("mercury-actions-menu-toggle");
      this.fullscreenToggle = document.getElementById("mercury-fullscreen-toggle");
      this.exitButton = document.getElementById("mercury-full-exit");
      this.boundaryHint = document.getElementById("mercury-boundary-hint");
      this.tutorial = document.getElementById("mercury-full-tutorial");
      this.tutorialClose = document.getElementById("mercury-tutorial-close");
      this.mobileControls = Array.from(this.root.querySelectorAll("[data-mercury-control]"));

      this.state = STATES.HIDDEN;
      this.active = false;
      this.ready = false;
      this.selectedRegion = REGIONS[0];
      this.currentRegion = null;
      this.visited = new Set();
      this.selectorOpenedFromWorld = false;
      this.recommendedQualityName = this.detectRecommendedQualityName();
      let savedQuality = null;
      try { savedQuality = localStorage.getItem(QUALITY_STORAGE_KEY); } catch (_) {}
      this.quality = copyQualityProfile(savedQuality || this.recommendedQualityName);
      this.qualityDeviceNote.textContent = this.deviceRecommendation();
      this.pointerLocked = false;
      this.dragging = false;
      this.lookPointerId = null;
      this.lookPointer = { x: 0, y: 0 };
      this.look = { yaw: 0, pitch: -0.18 };
      this.lookTarget = { yaw: 0, pitch: -0.18 };
      this.altitudeOffset = 6.0;
      this.movement = { forward: 0, backward: 0, left: 0, right: 0, up: 0, down: 0, fast: 0 };
      this.keys = new Set();
      this.pointerActions = new Map();
      this.regionSwitchInFlight = false;
      this.player = { x: 0, y: 11, z: 52, vx: 0, vz: 0 };
      this.clock = 0;
      this.frame = null;
      this.previous = 0;
      this.objectivesCollapsed = true;
      this.infoMinimized = true;
      this.actionsMenuOpen = false;
      this.regionCards = [];
      this.objectiveItems = [];
      this.discovered = new Set();
      this.currentGoals = [];
      this.goalMarkers = new Map();
      this.goalTime = 0;
      this.nearbyObservation = null;
      this.selectedTarget = null;
      this.activeObservation = null;
      this.progressAnim = 0;
      this.transitionToken = 0;
      this.selectorRestoreState = null;

      this.onPointerLockChange = this.onPointerLockChange.bind(this);
      this.onMouseMove = this.onMouseMove.bind(this);
      this.onKeyDown = this.onKeyDown.bind(this);
      this.onKeyUp = this.onKeyUp.bind(this);
      this.onResize = this.onResize.bind(this);
      this.loop = this.loop.bind(this);

      this.populateRegionGrid();
      this.buildObjectives();
      this.setQuality(this.quality.name, { persist: false });
      this.bindEvents();
      this.setUiVisible(false);
    }

    detectRecommendedQualityName() {
      const memory = navigator.deviceMemory || 4;
      const cores = navigator.hardwareConcurrency || 4;
      const coarse = window.matchMedia?.("(pointer: coarse)")?.matches || false;
      if (coarse || window.innerWidth <= 760 || memory <= 3 || cores <= 4) return "LOW";
      if (memory >= 8 && cores >= 8 && window.innerWidth >= 1200) return "HIGH";
      return "MEDIUM";
    }

    deviceRecommendation() {
      return `Rekomendasi browser: ${QUALITY_PROFILES[this.recommendedQualityName]?.label || "SEDANG"}. Kamu tetap bebas memilih mode lain.`;
    }

    bindEvents() {
      this.entryButton?.addEventListener("click", () => this.openEntryFlow());
      this.regionClose?.addEventListener("click", () => {
        if (this.selectorOpenedFromWorld && this.currentRegion) this.closeSelectorToWorld();
        else this.cancelPreEntry();
      });
      this.qualityClose?.addEventListener("click", () => this.cancelPreEntry());
      this.qualityOptions.forEach(button => {
        button.addEventListener("click", () => this.setQuality(button.dataset.mercuryQuality || "MEDIUM"));
      });
      this.qualityStart?.addEventListener("click", () => this.confirmQualitySelection());
      this.errorReturn?.addEventListener("click", () => this.exit());
      this.locationToggle?.addEventListener("click", () => { this.setActionsMenu(false); this.openSelectorFromWorld(); });
      this.exitButton?.addEventListener("click", () => { this.setActionsMenu(false); this.exit(); });
      this.actionsMenuToggle?.addEventListener("click", event => {
        event.stopPropagation();
        this.setActionsMenu(!this.actionsMenuOpen, true);
      });
      this.fullscreenToggle?.addEventListener("click", () => { this.setActionsMenu(false); this.toggleFullscreen(); });
      this.landmarkImageWrap?.addEventListener("click", () => {
        if (this.currentRegion?.image) window.open(this.currentRegion.image, "_blank", "noopener,noreferrer");
      });
      document.addEventListener("pointerdown", event => {
        if (!this.actionsMenuOpen || this.actionsRoot?.contains(event.target)) return;
        this.setActionsMenu(false);
      });
      this.objectivesCollapse?.addEventListener("click", () => this.setObjectivesCollapsed(true));
      this.objectivesToggle?.addEventListener("click", () => this.setObjectivesCollapsed(false));
      this.observeButton?.addEventListener("click", () => this.tryObserveNearby());
      this.observationClose?.addEventListener("click", () => this.closeObservationCard(true));
      this.landmarkMinimize?.addEventListener("click", event => { event.stopPropagation(); this.setInfoMinimized(true, false, true); });
      this.infoToggle?.addEventListener("click", event => { event.stopPropagation(); this.setActionsMenu(false); this.setInfoMinimized(false, false, true); });
      this.tutorialClose?.addEventListener("click", () => this.dismissTutorial(true));
      this.mobileControls.forEach(button => {
        const control = button.dataset.mercuryControl;
        button.addEventListener("pointerdown", event => {
          if (!this.active || this.state !== STATES.EXPLORING || this.isObservationCardOpen() || this.actionsMenuOpen) return;
          event.preventDefault();
          event.stopPropagation();
          button.setPointerCapture?.(event.pointerId);
          this.pointerActions.set(event.pointerId, control);
          button.classList.add("is-held");
        });
        const endControl = event => {
          const action = this.pointerActions.get(event.pointerId);
          this.pointerActions.delete(event.pointerId);
          if (action) event.currentTarget?.classList?.remove("is-held");
        };
        button.addEventListener("pointerup", endControl);
        button.addEventListener("pointercancel", endControl);
        button.addEventListener("lostpointercapture", endControl);
        button.addEventListener("contextmenu", event => event.preventDefault());
      });
      window.addEventListener("blur", () => this.clearMovementInput());
      this.viewport?.addEventListener("click", event => {
        if (!this.active || this.state !== STATES.EXPLORING) return;
        if (event.pointerType && event.pointerType !== "mouse") return;
        if (document.pointerLockElement !== this.viewport) this.viewport.requestPointerLock?.();
      });
      this.viewport?.addEventListener("pointerdown", event => this.onLookPointerDown(event));
      this.viewport?.addEventListener("pointermove", event => this.onLookPointerMove(event));
      this.viewport?.addEventListener("pointerup", event => this.onLookPointerUp(event));
      this.viewport?.addEventListener("pointercancel", event => this.onLookPointerUp(event));
      this.viewport?.addEventListener("contextmenu", event => event.preventDefault());
      document.addEventListener("pointerlockchange", this.onPointerLockChange);
      document.addEventListener("mousemove", this.onMouseMove);
      window.addEventListener("keydown", this.onKeyDown);
      window.addEventListener("keyup", this.onKeyUp);
      window.addEventListener("resize", this.onResize);
    }

    populateRegionGrid() {
      this.regionGrid.replaceChildren();
      this.regionCards = REGIONS.map((region, index) => {
        const button = document.createElement("button");
        button.type = "button";
        button.className = "venus-region-card mercury-region-card";
        button.dataset.mercuryRegion = region.id;
        button.innerHTML = `<span class="venus-region-preview mercury-region-preview mercury-region-preview-${region.id}" aria-hidden="true"><i></i><b>${region.short}</b></span><span class="venus-region-index">${String(index + 1).padStart(2, "0")}</span><strong>${region.name}</strong><span class="venus-region-descriptor">${region.descriptor}</span><small>${Math.abs(region.latitude).toFixed(2)}°${region.latitude >= 0 ? "N" : "S"} · ${region.longitudeEast.toFixed(2)}°E</small><em>${region.category}</em><span class="venus-region-source">NASA · MESSENGER / USGS</span>`;
        button.addEventListener("click", () => this.handleRegionSelection(region));
        this.regionGrid.appendChild(button);
        return { region, button };
      });
      this.refreshRegionCards();
    }

    educationFor(region = this.currentRegion) {
      return region ? MERCURY_EDUCATION[region.id] || null : null;
    }

    discoveryStorageKey(region = this.currentRegion) {
      return `antara-mercury-discoveries-${region?.id || "mercury"}-v1`;
    }

    loadDiscoveryState() {
      const valid = new Set((this.currentGoals || []).map(goal => goal.id));
      let saved = [];
      try { saved = JSON.parse(sessionStorage.getItem(this.discoveryStorageKey()) || "[]"); } catch (_) { saved = []; }
      this.discovered = new Set(Array.isArray(saved) ? saved.filter(id => valid.has(id)) : []);
    }

    saveDiscoveryState() {
      try { sessionStorage.setItem(this.discoveryStorageKey(), JSON.stringify([...this.discovered])); } catch (_) {}
    }

    buildObjectives() {
      const education = this.educationFor();
      const goals = education?.observations || [];
      this.objectivesList.replaceChildren();
      this.objectiveItems = goals.map((goal, index) => {
        const item = document.createElement("li");
        item.dataset.discovery = goal.id;
        item.innerHTML = `<span class="venus-objective-marker">${String(index + 1).padStart(2, "0")}</span><div><strong>${goal.label}</strong><small>BELUM DIAMATI</small></div>`;
        this.objectivesList.appendChild(item);
        return { goal, item, marker: item.querySelector(".venus-objective-marker"), status: item.querySelector("small") };
      });
      this.updateObjectives();
    }

    setControl(control, pressed) {
      this.movement[control] = pressed ? 1 : 0;
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
      let forward = Number(this.actionActive("forward")) - Number(this.actionActive("backward"));
      let strafe = Number(this.actionActive("right")) - Number(this.actionActive("left"));
      const vertical = Number(this.actionActive("up")) - Number(this.actionActive("down"));
      const magnitude = Math.hypot(forward, strafe);
      if (magnitude > 1) { forward /= magnitude; strafe /= magnitude; }
      return { forward, strafe, vertical };
    }

    clearMovementInput() {
      this.keys.clear();
      this.pointerActions.clear();
      this.movement.forward = 0;
      this.movement.backward = 0;
      this.movement.left = 0;
      this.movement.right = 0;
      this.movement.up = 0;
      this.movement.down = 0;
      this.movement.fast = 0;
      this.root?.querySelectorAll(".is-held").forEach(button => button.classList.remove("is-held"));
    }

    setQuality(name, { persist = true } = {}) {
      this.quality = copyQualityProfile(name);
      this.qualityOptions.forEach(button => {
        const optionName = button.dataset.mercuryQuality;
        const active = optionName === this.quality.name;
        button.classList.toggle("is-selected", active);
        button.setAttribute("aria-checked", String(active));
        const recommendation = button.querySelector("[data-quality-recommendation]");
        if (recommendation) recommendation.textContent = optionName === this.recommendedQualityName ? "DIREKOMENDASIKAN" : "";
      });
      this.qualitySelectedLabel.textContent = this.quality.label;
      this.qualityDeviceNote.textContent = this.deviceRecommendation();
      if (this.hudQuality) this.hudQuality.textContent = this.quality.label;
      if (persist) {
        try { localStorage.setItem(QUALITY_STORAGE_KEY, this.quality.name); } catch (_) {}
      }
    }

    selectRegion(region) {
      this.selectedRegion = region;
      this.refreshRegionCards();
      this.objectivesRegion.textContent = region.name;
    }

    refreshRegionCards() {
      this.regionCards.forEach(({ region, button }) => button.classList.toggle("is-selected", this.selectedRegion?.id === region.id));
    }

    async handleRegionSelection(region) {
      if (!region || this.state !== STATES.SELECTING || this.regionSwitchInFlight) return;
      const switchingFromWorld = Boolean(this.currentRegion);
      if (switchingFromWorld && this.currentRegion.id === region.id) {
        this.selectRegion(region);
        this.closeSelectorToWorld();
        return;
      }
      this.selectRegion(region);
      this.regionSwitchInFlight = true;
      try {
        await this.startSelectedRegion({ switchOnly: switchingFromWorld, targetRegion: region });
      } finally {
        this.regionSwitchInFlight = false;
      }
    }

    openEntryFlow() {
      if (!this.mercury?.active || this.mercury?.exploring || this.active) return;
      if (!this.mercury?.startFullExplorationTransition?.(this.selectedRegion)) return;
      this.active = true;
      this.selectorOpenedFromWorld = false;
      this.entryButton.disabled = true;
      this.root.hidden = false;
      this.root.inert = false;
      this.root.setAttribute("aria-hidden", "false");
      this.root.style.setProperty("--surface-opacity", "0");
      this.root.style.setProperty("--entry-progress", "0");
      this.root.className = "mars-full-exploration venus-full-exploration mercury-full-exploration is-configuring";
      document.getElementById("mission")?.classList.add("is-mercury-full-selecting");
      document.getElementById("mission")?.classList.remove("is-mercury-full");
      this.state = STATES.CONFIGURING;
      this.regionSelector.hidden = true;
      this.qualityPanel.hidden = false;
      this.hideLoading();
      this.hideError();
      this.setUiVisible(false);
      this.boundaryHint.textContent = "";
      this.selectRegion(this.selectedRegion || REGIONS[0]);
      this.setQuality(this.quality.name, { persist: false });
      document.getElementById("announcement").textContent = "Pilih kualitas grafis untuk Jelajah Penuh Merkurius.";
      requestAnimationFrame(() => this.qualityOptions.find(button => button.classList.contains("is-selected"))?.focus({ preventScroll: true }));
    }

    confirmQualitySelection() {
      if (this.state !== STATES.CONFIGURING) return;
      this.setQuality(this.quality.name, { persist: true });
      this.state = STATES.SELECTING;
      this.qualityPanel.hidden = true;
      this.regionSelector.hidden = false;
      this.root.className = "mars-full-exploration venus-full-exploration mercury-full-exploration is-selecting";
      document.getElementById("announcement").textContent = "Pilih destinasi Jelajah Penuh Merkurius.";
      requestAnimationFrame(() => this.regionCards[0]?.button?.focus({ preventScroll: true }));
    }

    cancelPreEntry() {
      if (this.selectorOpenedFromWorld || ![STATES.CONFIGURING, STATES.SELECTING, STATES.ERROR].includes(this.state)) return;
      this.active = false;
      this.state = STATES.HIDDEN;
      this.selectorOpenedFromWorld = false;
      this.qualityPanel.hidden = true;
      this.regionSelector.hidden = true;
      this.root.className = "mars-full-exploration venus-full-exploration mercury-full-exploration";
      document.getElementById("mission")?.classList.remove("is-mercury-full", "is-mercury-full-selecting");
      this.root.hidden = true;
      this.root.inert = true;
      this.root.setAttribute("aria-hidden", "true");
      this.root.style.setProperty("--surface-opacity", "0");
      this.root.style.setProperty("--entry-progress", "0");
      this.entryButton.disabled = false;
      this.currentRegion = null;
      this.mercury.endFullExploration?.();
      document.getElementById("announcement").textContent = "Kembali ke panorama Merkurius.";
      this.entryButton.focus({ preventScroll: true });
    }

    openSelectorFromWorld() {
      if (!this.active || !this.currentRegion || this.state !== STATES.EXPLORING) return;
      this.setActionsMenu(false);
      this.selectorRestoreState = {
        objectivesCollapsed: this.objectivesCollapsed,
        infoMinimized: this.infoMinimized
      };
      this.selectorOpenedFromWorld = true;
      this.state = STATES.SELECTING;
      this.regionSelector.hidden = false;
      this.qualityPanel.hidden = true;
      this.closeObservationCard(false);
      if (this.observationPrompt) this.observationPrompt.hidden = true;
      this.root.classList.add("is-selecting");
      this.root.classList.remove("is-configuring", "is-info-open", "is-objectives-open");
      this.stopLoop();
      this.landmarkCard.hidden = true;
      this.landmarkCard.classList.remove("is-visible");
      this.landmarkCard.setAttribute("aria-hidden", "true");
      this.infoToggle.hidden = true;
      this.objectivesPanel.hidden = true;
      this.objectivesPanel.setAttribute("aria-hidden", "true");
      this.objectivesToggle.hidden = true;
      document.getElementById("announcement").textContent = "Pilih wilayah Merkurius lain untuk dijelajahi.";
      requestAnimationFrame(() => this.regionCards.find(item => item.region.id === this.currentRegion.id)?.button?.focus({ preventScroll: true }));
    }

    closeSelectorToWorld() {
      if (!this.currentRegion) return;
      this.selectorOpenedFromWorld = false;
      this.regionSelector.hidden = true;
      this.state = STATES.EXPLORING;
      this.root.classList.remove("is-selecting");
      this.root.classList.add("is-active", "is-surface-visible");
      const restore = this.selectorRestoreState;
      this.selectorRestoreState = null;
      if (restore) {
        this.objectivesCollapsed = Boolean(restore.objectivesCollapsed);
        this.infoMinimized = Boolean(restore.infoMinimized);
      }
      this.syncSecondaryPanels();
      this.startLoop();
    }

    hideSelector() {
      this.regionSelector.hidden = true;
      this.selectorOpenedFromWorld = false;
    }

    hideQuality() {
      this.qualityPanel.hidden = true;
    }

    setActionsMenu(open, focus = false) {
      const mobile = window.matchMedia?.("(max-width: 820px), (pointer: coarse) and (max-width: 1100px)")?.matches || false;
      const next = Boolean(open && mobile && this.state === STATES.EXPLORING);
      if (next) {
        this.objectivesCollapsed = true;
        this.infoMinimized = true;
      }
      this.actionsMenuOpen = next;
      this.actionsRoot?.classList.toggle("is-open", next);
      this.root.classList.toggle("is-actions-open", next);
      this.actionsMenuToggle?.setAttribute("aria-expanded", String(next));
      if (next) {
        this.clearMovementInput();
        if (document.pointerLockElement === this.viewport) document.exitPointerLock?.();
      }
      this.syncSecondaryPanels();
      if (focus && next) requestAnimationFrame(() => this.actionsMenu?.querySelector("button")?.focus({ preventScroll: true }));
    }

    setUiVisible(visible) {
      const elements = [this.hud, this.actionsMenu?.parentElement, ...this.root.querySelectorAll("[data-mercury-ui].mars-mobile-controls")];
      elements.forEach(element => { if (element) element.hidden = !visible; });
      if (!visible) {
        this.root.classList.remove("is-info-open", "is-objectives-open", "is-observation-open");
        if (this.observationPrompt) this.observationPrompt.hidden = true;
        if (this.observationCard) { this.observationCard.hidden = true; this.observationCard.setAttribute("aria-hidden", "true"); }
        this.objectivesPanel.hidden = true;
        this.objectivesPanel.setAttribute("aria-hidden", "true");
        this.objectivesToggle.hidden = true;
        this.landmarkCard.hidden = true;
        this.landmarkCard.classList.remove("is-visible");
        this.landmarkCard.setAttribute("aria-hidden", "true");
        this.infoToggle.hidden = true;
        this.tutorial.hidden = true;
        this.boundaryHint.textContent = "";
      } else {
        this.syncSecondaryPanels();
      }
    }

    stopLoop() {
      cancelAnimationFrame(this.frame);
      this.frame = null;
    }

    showLoading(message = "MENYIAPKAN DESTINASI", progress = 18) {
      this.loadingCard.hidden = false;
      this.loadingStatus.textContent = message;
      this.loadingProgress.style.width = `${clamp(progress, 0, 100)}%`;
    }

    hideLoading() { this.loadingCard.hidden = true; }
    hideError() { if (this.errorCard) this.errorCard.hidden = true; }
    showError(message) {
      console.warn("Mercury Full Exploration:", message);
      this.hideLoading();
      void this.exit(true);
      document.getElementById("announcement").textContent = "Kembali ke panorama Merkurius.";
    }

    async ensureReady() {
      if (this.ready) return;
      this.showLoading("MEMUAT ENGINE 3D", 22);
      const module = await import("./assets/vendor/three/three.module.min.js");
      this.THREE = module;
      this.createWorld();
      this.ready = true;
      this.showLoading("ENGINE SIAP", 45);
    }

    createWorld() {
      const THREE = this.THREE;
      this.scene = new THREE.Scene();
      this.scene.background = new THREE.Color(0x030405);
      this.scene.fog = new THREE.FogExp2(0x08090a, 0.0085);
      this.camera = new THREE.PerspectiveCamera(68, 1, 0.1, 600);
      this.renderer = new THREE.WebGLRenderer({ antialias: true, alpha: false, powerPreference: "high-performance" });
      this.renderer.outputColorSpace = THREE.SRGBColorSpace;
      this.renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, this.quality.maxDpr));
      this.viewport.replaceChildren(this.renderer.domElement);

      const ambient = new THREE.HemisphereLight(0xbcb7ad, 0x090a0b, 0.72);
      const sun = new THREE.DirectionalLight(0xffdfad, 1.72);
      sun.position.set(28, 44, 14);
      const rim = new THREE.DirectionalLight(0x777a7e, 0.24);
      rim.position.set(-14, 10, -24);
      this.scene.add(ambient, sun, rim);

      const starGeo = new THREE.BufferGeometry();
      const starPositions = [];
      for (let i = 0; i < 420; i += 1) {
        const r1 = seeded(i + 1) * 2 - 1;
        const r2 = seeded(i + 2) * 2 - 1;
        const r3 = seeded(i + 3) * 2 - 1;
        const len = Math.hypot(r1, r2, r3) || 1;
        const distance = 180 + seeded(i + 4) * 180;
        starPositions.push((r1 / len) * distance, (r2 / len) * distance, (r3 / len) * distance);
      }
      starGeo.setAttribute("position", new THREE.Float32BufferAttribute(starPositions, 3));
      const stars = new THREE.Points(starGeo, new THREE.PointsMaterial({ color: 0xcad4e2, size: 0.8, sizeAttenuation: true }));
      this.scene.add(stars);

      this.terrainGroup = new THREE.Group();
      this.scene.add(this.terrainGroup);
      this.resize();
    }

    createMercuryMicroTexture(region) {
      const THREE = this.THREE;
      const size = this.quality.name === "HIGH" ? 320 : this.quality.name === "MEDIUM" ? 224 : 160;
      const data = new Uint8Array(size * size * 4);
      const seed = region.terrain.seed * 97;
      for (let y = 0; y < size; y += 1) {
        for (let x = 0; x < size; x += 1) {
          const i = (y * size + x) * 4;
          const ridge = Math.sin((x + seed) * 0.048) * 10 + Math.cos((y - seed) * 0.052) * 8;
          const octave1 = (seeded(x * 17 + y * 131 + seed) - 0.5) * 28;
          const octave2 = (seeded(x * 47 + y * 61 + seed * 5) - 0.5) * 14;
          const octave3 = (seeded(x * 101 + y * 19 + seed * 9) - 0.5) * 8;
          const streak = Math.sin((x * 0.12 + y * 0.03 + seed) * 0.75) * 6;
          const speckDark = seeded(x * 211 + y * 43 + seed * 3) > 0.962 ? -34 : 0;
          const speckLight = seeded(x * 151 + y * 29 + seed * 7) > 0.982 ? 18 : 0;
          const value = clamp(Math.round(102 + ridge + octave1 + octave2 + octave3 + streak + speckDark + speckLight), 34, 172);
          data[i] = Math.max(0, value - 3);
          data[i + 1] = value;
          data[i + 2] = Math.min(255, value + 2);
          data[i + 3] = 255;
        }
      }
      const texture = new THREE.DataTexture(data, size, size, THREE.RGBAFormat);
      texture.needsUpdate = true;
      texture.wrapS = texture.wrapT = THREE.RepeatWrapping;
      texture.repeat.set(this.quality.name === "HIGH" ? 28 : this.quality.name === "MEDIUM" ? 22 : 16, this.quality.name === "LOW" ? 13 : 18);
      texture.magFilter = THREE.LinearFilter;
      texture.minFilter = THREE.LinearMipmapLinearFilter;
      texture.generateMipmaps = true;
      return texture;
    }

    addRockField(group, region) {
      const THREE = this.THREE;
      const boulderCount = this.quality.name === "HIGH" ? 620 : this.quality.name === "MEDIUM" ? 360 : 180;
      const debrisCount = this.quality.name === "HIGH" ? 1100 : this.quality.name === "MEDIUM" ? 620 : 280;
      const radius = this.quality.worldRadius * 0.97;
      const dummy = new THREE.Object3D();

      const boulderGeo = new THREE.IcosahedronGeometry(1, 0);
      const boulderMat = new THREE.MeshStandardMaterial({ color: 0x232427, roughness: 1, metalness: 0.01, flatShading: true });
      const boulders = new THREE.InstancedMesh(boulderGeo, boulderMat, boulderCount);
      for (let i = 0; i < boulderCount; i += 1) {
        const angle = seeded(region.terrain.seed * 1000 + i * 13) * Math.PI * 2;
        const distance = Math.sqrt(seeded(region.terrain.seed * 2000 + i * 29)) * radius;
        const x = Math.cos(angle) * distance;
        const z = Math.sin(angle) * distance;
        const scale = 0.12 + Math.pow(seeded(region.terrain.seed * 3000 + i * 41), 2.15) * 1.65;
        const y = this.heightAtLocal(x, z, region, true) + scale * 0.44;
        dummy.position.set(x, y, z);
        dummy.rotation.set(
          seeded(i * 71 + region.terrain.seed) * Math.PI,
          seeded(i * 97 + region.terrain.seed) * Math.PI * 2,
          seeded(i * 113 + region.terrain.seed) * Math.PI
        );
        dummy.scale.set(scale * (0.72 + seeded(i * 151) * 0.62), scale * (0.52 + seeded(i * 181) * 0.60), scale);
        dummy.updateMatrix();
        boulders.setMatrixAt(i, dummy.matrix);
      }
      boulders.instanceMatrix.needsUpdate = true;
      boulders.frustumCulled = true;
      group.add(boulders);

      const debrisGeo = new THREE.DodecahedronGeometry(0.55, 0);
      const debrisMat = new THREE.MeshStandardMaterial({ color: 0x16181a, roughness: 1, metalness: 0.0, flatShading: true });
      const debris = new THREE.InstancedMesh(debrisGeo, debrisMat, debrisCount);
      for (let i = 0; i < debrisCount; i += 1) {
        const angle = seeded(region.terrain.seed * 4000 + i * 17) * Math.PI * 2;
        const distance = Math.sqrt(seeded(region.terrain.seed * 5000 + i * 31)) * radius;
        const x = Math.cos(angle) * distance;
        const z = Math.sin(angle) * distance;
        const scale = 0.035 + Math.pow(seeded(region.terrain.seed * 6000 + i * 43), 2.1) * 0.28;
        const y = this.heightAtLocal(x, z, region, true) + scale * 0.36;
        dummy.position.set(x, y, z);
        dummy.rotation.set(
          seeded(i * 19 + region.terrain.seed) * Math.PI,
          seeded(i * 37 + region.terrain.seed) * Math.PI * 2,
          seeded(i * 59 + region.terrain.seed) * Math.PI
        );
        dummy.scale.set(scale * (0.8 + seeded(i * 67) * 0.5), scale * (0.55 + seeded(i * 79) * 0.55), scale);
        dummy.updateMatrix();
        debris.setMatrixAt(i, dummy.matrix);
      }
      debris.instanceMatrix.needsUpdate = true;
      debris.frustumCulled = true;
      group.add(debris);
    }

    microCraterHeight(x, z, seed, detailed = true) {
      if (!detailed) return 0;
      const cellSize = this.quality.name === "LOW" ? 12 : this.quality.name === "MEDIUM" ? 9 : 8;
      const gx = Math.floor(x / cellSize);
      const gz = Math.floor(z / cellSize);
      let h = 0;
      for (let oz = -1; oz <= 1; oz += 1) {
        for (let ox = -1; ox <= 1; ox += 1) {
          const cx = gx + ox;
          const cz = gz + oz;
          const hash = cx * 928371 + cz * 364479 + seed * 811;
          if (seeded(hash) < 0.18) continue;
          const centerX = (cx + 0.1 + seeded(hash + 11) * 0.8) * cellSize;
          const centerZ = (cz + 0.1 + seeded(hash + 23) * 0.8) * cellSize;
          const radius = 0.9 + seeded(hash + 37) * (this.quality.name === "HIGH" ? 3.6 : 2.9);
          const d = Math.hypot(x - centerX, z - centerZ);
          if (d > radius * 1.72) continue;
          const depth = 0.18 + seeded(hash + 53) * 0.95;
          const t = d / radius;
          h += -depth * Math.exp(-Math.pow(t * 2.45, 2));
          h += depth * 0.40 * Math.exp(-Math.pow((t - 1.02) * 7.8, 2));
          h += depth * 0.08 * Math.exp(-Math.pow((t - 1.28) * 4.5, 2));
        }
      }
      return h;
    }

    mediumCraterFieldHeight(x, z, seed, detailed = true) {
      if (!detailed) return 0;
      const cellSize = this.quality.name === "LOW" ? 22 : this.quality.name === "MEDIUM" ? 19 : 16;
      const gx = Math.floor(x / cellSize);
      const gz = Math.floor(z / cellSize);
      let h = 0;
      for (let oz = -1; oz <= 1; oz += 1) {
        for (let ox = -1; ox <= 1; ox += 1) {
          const cx = gx + ox;
          const cz = gz + oz;
          const hash = cx * 211331 + cz * 531497 + seed * 1499;
          if (seeded(hash) < 0.58) continue;
          const centerX = (cx + 0.12 + seeded(hash + 13) * 0.76) * cellSize;
          const centerZ = (cz + 0.12 + seeded(hash + 29) * 0.76) * cellSize;
          const radius = 2.8 + seeded(hash + 47) * (this.quality.name === "HIGH" ? 7.8 : 6.1);
          const d = Math.hypot(x - centerX, z - centerZ);
          if (d > radius * 1.8) continue;
          const depth = 0.55 + seeded(hash + 59) * 1.9;
          const t = d / radius;
          h += -depth * Math.exp(-Math.pow(t * 1.95, 2));
          h += depth * 0.52 * Math.exp(-Math.pow((t - 1.01) * 5.9, 2));
          h += depth * 0.10 * Math.exp(-Math.pow((t - 1.36) * 3.8, 2));
        }
      }
      return h;
    }

    addGoalMarkers(group, region) {
      const THREE = this.THREE;
      this.goalMarkers = new Map();
      this.currentGoals = [...(MERCURY_EDUCATION[region.id]?.observations || [])];
      const markerGroup = new THREE.Group();
      markerGroup.name = "mercury-goal-markers";
      const ringGeometry = new THREE.TorusGeometry(1.15, 0.055, 8, 42);
      const stemGeometry = new THREE.CylinderGeometry(0.024, 0.045, 2.15, 7);
      const coreGeometry = new THREE.OctahedronGeometry(0.20, 0);
      for (const goal of this.currentGoals) {
        const marker = new THREE.Group();
        marker.position.set(goal.x, this.heightAtLocal(goal.x, goal.z, region, true) + 0.08, goal.z);
        const ringMaterial = new THREE.MeshBasicMaterial({ color: 0xc7ccd2, transparent: true, opacity: 0.58, depthWrite: false, fog: true });
        const stemMaterial = new THREE.MeshBasicMaterial({ color: 0x7f8791, transparent: true, opacity: 0.30, depthWrite: false, fog: true });
        const coreMaterial = new THREE.MeshBasicMaterial({ color: 0xd0ba92, transparent: true, opacity: 0.92, depthWrite: false, fog: true });
        const ring = new THREE.Mesh(ringGeometry, ringMaterial);
        ring.rotation.x = Math.PI / 2;
        ring.position.y = 0.04;
        const stem = new THREE.Mesh(stemGeometry, stemMaterial);
        stem.position.y = 1.05;
        const core = new THREE.Mesh(coreGeometry, coreMaterial);
        core.position.y = 2.18;
        marker.add(ring, stem, core);
        marker.userData = { goal, ring, core, materials: { ring: ringMaterial, stem: stemMaterial, core: coreMaterial }, phase: seeded(region.terrain.seed * 31 + goal.x * 17 + goal.z * 23) * Math.PI * 2 };
        markerGroup.add(marker);
        this.goalMarkers.set(goal.id, marker);
      }
      group.add(markerGroup);
    }

    updateGoalMarkers(activeId, delta = 0) {
      this.goalTime += delta;
      for (const [id, marker] of this.goalMarkers) {
        const active = id === activeId;
        const discovered = this.discovered.has(id);
        const { ring, core, materials } = marker.userData || {};
        if (!ring || !core || !materials) continue;
        const pulse = 1 + (active ? Math.sin(this.goalTime * 3.4 + marker.userData.phase) * 0.10 : 0);
        marker.scale.setScalar(active ? 1.16 * pulse : discovered ? 0.84 : 1);
        materials.ring.opacity = active ? 0.96 : discovered ? 0.18 : 0.58;
        materials.stem.opacity = active ? 0.50 : discovered ? 0.10 : 0.30;
        materials.core.opacity = active ? 1 : discovered ? 0.34 : 0.92;
        materials.ring.color.setHex(active ? 0xf0f2f4 : discovered ? 0x737980 : 0xc7ccd2);
        materials.core.color.setHex(active ? 0xffe0aa : discovered ? 0x8b8170 : 0xd0ba92);
        core.rotation.y += delta * (active ? 1.7 : 0.5);
      }
    }

    buildTerrain(region) {
      const THREE = this.THREE;
      const group = new THREE.Group();
      const { worldSize, segments } = this.quality;
      const geometry = new THREE.PlaneGeometry(worldSize, worldSize, segments, segments);
      geometry.rotateX(-Math.PI / 2);
      const position = geometry.attributes.position;
      const colors = [];
      let minY = Infinity;
      let maxY = -Infinity;
      for (let i = 0; i < position.count; i += 1) {
        const x = position.getX(i);
        const z = position.getZ(i);
        const y = this.heightAtLocal(x, z, region, true);
        position.setY(i, y);
        minY = Math.min(minY, y);
        maxY = Math.max(maxY, y);
      }
      position.needsUpdate = true;
      geometry.computeVertexNormals();
      const palette = region.palette;
      const low = new THREE.Color(palette.low);
      const mid = new THREE.Color(palette.mid);
      const high = new THREE.Color(palette.high);
      for (let i = 0; i < position.count; i += 1) {
        const y = position.getY(i);
        const t = (y - minY) / Math.max(1, maxY - minY);
        const color = low.clone().lerp(mid, smoothStep(t * 1.08)).lerp(high, Math.pow(t, 1.9));
        const rockVariation = Math.sin((position.getX(i) + position.getZ(i)) * 0.031 + region.terrain.seed) * 0.028;
        color.offsetHSL(0, -0.035, rockVariation - 0.018);
        colors.push(color.r, color.g, color.b);
      }
      geometry.setAttribute("color", new THREE.Float32BufferAttribute(colors, 3));
      const microTexture = this.createMercuryMicroTexture(region);
      const material = new THREE.MeshStandardMaterial({
        vertexColors: true,
        map: microTexture,
        bumpMap: microTexture,
        bumpScale: this.quality.name === "HIGH" ? 0.86 : this.quality.name === "MEDIUM" ? 0.62 : 0.40,
        roughness: 0.99,
        metalness: 0.015,
        flatShading: false
      });
      const mesh = new THREE.Mesh(geometry, material);
      mesh.receiveShadow = false;
      group.add(mesh);
      this.addRockField(group, region);
      this.addGoalMarkers(group, region);

      const continuationGeometry = new THREE.PlaneGeometry(worldSize * 3, worldSize * 3, Math.max(16, Math.floor(segments * 0.4)), Math.max(16, Math.floor(segments * 0.4)));
      continuationGeometry.rotateX(-Math.PI / 2);
      const continuationPosition = continuationGeometry.attributes.position;
      const continuationColors = [];
      for (let i = 0; i < continuationPosition.count; i += 1) {
        const x = continuationPosition.getX(i);
        const z = continuationPosition.getZ(i);
        const y = this.heightAtLocal(x * 0.48, z * 0.48, region, false) * 0.72 - 5.2;
        continuationPosition.setY(i, y);
        const t = clamp((y + 12) / 18, 0, 1);
        const color = new THREE.Color(region.palette.low).lerp(new THREE.Color(region.palette.mid), t * 0.72);
        continuationColors.push(color.r * 0.58, color.g * 0.59, color.b * 0.60);
      }
      continuationGeometry.setAttribute("color", new THREE.Float32BufferAttribute(continuationColors, 3));
      continuationGeometry.computeVertexNormals();
      const continuationMesh = new THREE.Mesh(continuationGeometry, new THREE.MeshStandardMaterial({ vertexColors: true, roughness: 0.98, metalness: 0.0 }));
      continuationMesh.position.y = -1.4;
      group.add(continuationMesh);

      const skyRing = new THREE.Mesh(
        new THREE.CylinderGeometry(this.quality.worldRadius * 1.9, this.quality.worldRadius * 2.4, 42, 48, 1, true),
        new THREE.MeshBasicMaterial({ color: 0x08090a, transparent: true, opacity: 0.76, side: THREE.BackSide })
      );
      skyRing.position.y = 10;
      group.add(skyRing);

      return { group, mesh, geometry, material };
    }

    heightAtLocal(x, z, region, detailed = true) {
      const style = region.terrain;
      let height = Math.sin((x + style.seed * 4) * 0.041) * 1.85 + Math.cos((z - style.seed * 3) * 0.039) * 1.45;
      height += Math.sin((x + z) * 0.053) * 0.92 + Math.cos((x - z) * 0.047) * 0.72;
      height += Math.sin(x * 0.018 + style.seed * 0.3) * 1.15 + Math.cos(z * 0.022 - style.seed * 0.2) * 0.95;
      if (detailed) {
        height += Math.sin((x * 0.15) + style.seed) * 0.46;
        height += Math.cos((z * 0.14) - style.seed * 0.7) * 0.40;
        height += Math.sin(x * 0.38 + z * 0.28 + style.seed) * 0.22;
        height += Math.cos(x * 0.61 - z * 0.48 - style.seed) * 0.18;
        height += Math.sin((x - z) * 0.21 + style.seed * 1.3) * 0.12;
        height += this.mediumCraterFieldHeight(x, z, style.seed, true);
        height += this.microCraterHeight(x, z, style.seed, true);
      }
      for (const crater of style.craters || []) {
        const d = Math.hypot(x - crater.x, z - crater.z);
        const t = clamp(d / crater.r, 0, 1.75);
        const bowl = -crater.depth * Math.exp(-Math.pow(t * 2.0, 2));
        const rim = crater.depth * 0.48 * Math.exp(-Math.pow((t - 1.02) * 6.1, 2));
        const ejecta = crater.depth * 0.10 * Math.exp(-Math.pow((t - 1.32) * 3.3, 2));
        height += bowl + rim + ejecta;
      }
      for (const dome of style.domes || []) {
        const d = Math.hypot(x - dome.x, z - dome.z);
        const t = clamp(1 - d / dome.r, 0, 1);
        height += Math.pow(t, 2) * dome.height;
      }
      for (const scarp of style.scarps || []) {
        const dx = scarp.x2 - scarp.x1;
        const dz = scarp.z2 - scarp.z1;
        const lengthSquared = dx * dx + dz * dz || 1;
        const u = clamp(((x - scarp.x1) * dx + (z - scarp.z1) * dz) / lengthSquared, 0, 1);
        const px = scarp.x1 + dx * u;
        const pz = scarp.z1 + dz * u;
        const distance = Math.hypot(x - px, z - pz);
        const side = Math.sign((x - scarp.x1) * dz - (z - scarp.z1) * dx) || 1;
        const band = Math.exp(-Math.pow(distance / scarp.width, 2));
        const wrinkle = Math.sin((u * 8.0 + style.seed * 0.3)) * 0.18;
        height += side * band * scarp.height * (0.58 + wrinkle);
      }
      return height;
    }

    applyRegion(region) {
      this.showLoading("MEMBENTUK MEDAN MERKURIUS", 58);
      while (this.terrainGroup.children.length) {
        const child = this.terrainGroup.children[0];
        this.terrainGroup.remove(child);
        child.traverse?.(node => {
          node.geometry?.dispose?.();
          const disposeMaterial = material => {
            if (!material) return;
            const map = material.map || null;
            const bumpMap = material.bumpMap || null;
            map?.dispose?.();
            if (bumpMap && bumpMap !== map) bumpMap.dispose?.();
            material.dispose?.();
          };
          if (Array.isArray(node.material)) node.material.forEach(disposeMaterial);
          else disposeMaterial(node.material);
        });
      }
      const terrain = this.buildTerrain(region);
      this.terrainGroup.add(terrain.group);
      this.terrain = terrain;
      this.currentRegion = region;
      this.currentGoals = [...(this.educationFor(region)?.observations || [])];
      this.loadDiscoveryState();
      this.buildObjectives();
      this.nearbyObservation = null;
      this.selectedTarget = null;
      this.activeObservation = null;
      this.look.yaw = (region.heading || 0) * Math.PI / 180;
      this.look.pitch = -0.14;
      this.lookTarget.yaw = this.look.yaw;
      this.lookTarget.pitch = this.look.pitch;
      this.altitudeOffset = 6.0;
      this.player.x = 0;
      this.player.z = this.quality.worldRadius * 0.7;
      this.player.y = this.heightAtLocal(this.player.x, this.player.z, region, true) + this.altitudeOffset;
      this.updateRegionUi();
    }

    updateRegionUi() {
      if (!this.currentRegion) return;
      const region = this.currentRegion;
      this.hudLocation.textContent = region.name;
      this.hudCoordinates.textContent = `${Math.abs(region.latitude).toFixed(1)}°${region.latitude >= 0 ? "N" : "S"} · ${region.longitudeEast.toFixed(1)}°E`;
      this.hudRegionType.textContent = region.category;
      this.hudQuality.textContent = this.quality.label;
      this.hudData.textContent = "MESSENGER MDIS / MLA · USGS / IAU";
      this.objectivesRegion.textContent = region.name;
      this.objectivesIntro.textContent = this.educationFor(region)?.intro || `Amati titik-titik tanah dan batu utama di ${region.name}.`;
      this.landmarkName.textContent = region.name;
      this.landmarkType.textContent = `${region.category} · ${region.descriptor}`;
      this.landmarkCoords.textContent = `${Math.abs(region.latitude).toFixed(1)}°${region.latitude >= 0 ? "LU" : "LS"} · ${region.longitudeEast.toFixed(1)}°BT`;
      this.landmarkDescription.textContent = region.description;
      this.landmarkFacts.replaceChildren(...region.facts.map(fact => {
        const li = document.createElement("li");
        li.textContent = fact;
        return li;
      }));
      this.landmarkImage.src = region.image;
      this.landmarkImage.alt = region.name;
      this.landmarkSource.href = region.source;
      this.landmarkCoordinateSource.href = region.coordinateSource;
      this.visited.add(region.id);
      window.AntaraProgress?.trackFull?.("mercury", region.id, region.name);
      this.updateObjectives();
    }

    updateObjectives() {
      const total = this.currentGoals.length;
      const done = this.currentGoals.reduce((count, goal) => count + (this.discovered.has(goal.id) ? 1 : 0), 0);
      this.discoveryCount.textContent = `${done} / ${total}`;
      this.discoveryBar.style.width = `${total ? (done / total) * 100 : 0}%`;
      this.discoveryBar.style.transform = "none";
      this.objectivesToggle.textContent = `Tujuan · ${done} / ${total}`;
      this.objectiveItems.forEach(({ goal, item, marker, status }) => {
        const complete = this.discovered.has(goal.id);
        item.classList.toggle("is-complete", complete);
        marker.textContent = complete ? "✓" : String(this.currentGoals.indexOf(goal) + 1).padStart(2, "0");
        status.textContent = complete ? "SUDAH DIAMATI" : "BELUM DIAMATI";
      });
      if (this.selectedTarget) {
        const distance = Math.hypot(this.selectedTarget.x - this.player.x, this.selectedTarget.z - this.player.z);
        this.nextTarget.hidden = false;
        this.nextTargetName.textContent = this.selectedTarget.title;
        this.nextTargetDistance.textContent = `${distance < 10 ? distance.toFixed(1) : distance.toFixed(0)} m`;
      } else if (total && done === total) {
        this.nextTarget.hidden = false;
        this.nextTargetName.textContent = "Semua tujuan selesai";
        this.nextTargetDistance.textContent = `Empat titik ${this.currentRegion?.name || "Merkurius"} sudah diamati.`;
      } else {
        this.nextTarget.hidden = true;
      }
    }

    isObservationCardOpen() {
      return Boolean(this.observationCard && !this.observationCard.hidden && this.observationCard.getAttribute("aria-hidden") !== "true");
    }

    updateEducation(delta = 0) {
      if (this.state !== STATES.EXPLORING || !this.currentGoals.length) {
        if (this.observationPrompt) this.observationPrompt.hidden = true;
        return;
      }
      let nearest = null;
      let nearestDistance = Infinity;
      let nearestUndiscovered = null;
      let nearestUndiscoveredDistance = Infinity;
      for (const goal of this.currentGoals) {
        const distance = Math.hypot(goal.x - this.player.x, goal.z - this.player.z);
        if (distance < nearestDistance) { nearestDistance = distance; nearest = goal; }
        if (!this.discovered.has(goal.id) && distance < nearestUndiscoveredDistance) { nearestUndiscoveredDistance = distance; nearestUndiscovered = goal; }
      }
      const interactionRadius = nearest?.interactRadius || 5.0;
      this.nearbyObservation = nearest && nearestDistance <= interactionRadius ? nearest : null;
      this.selectedTarget = nearestUndiscovered || nearest;
      if (this.nearbyObservation && !this.isObservationCardOpen() && !this.actionsMenuOpen) {
        this.observationPromptTitle.textContent = this.nearbyObservation.title;
        this.observationPrompt.hidden = false;
      } else {
        this.observationPrompt.hidden = true;
      }
      const activeId = this.nearbyObservation?.id || this.selectedTarget?.id || null;
      this.updateGoalMarkers(activeId, delta);
      this.updateObjectives();
    }

    tryObserveNearby() {
      if (this.state !== STATES.EXPLORING || !this.nearbyObservation) return false;
      this.openObservationCard(this.nearbyObservation);
      return true;
    }

    markDiscovery(goal) {
      if (!goal || this.discovered.has(goal.id)) return false;
      this.discovered.add(goal.id);
      this.saveDiscoveryState();
      this.updateObjectives();
      return true;
    }

    openObservationCard(goal) {
      if (!goal || !this.observationCard) return;
      const isNew = this.markDiscovery(goal);
      this.activeObservation = goal;
      this.clearMovementInput();
      if (document.pointerLockElement === this.viewport) document.exitPointerLock?.();
      this.setActionsMenu(false);
      this.observationType.textContent = goal.type || "COBA PERHATIKAN!";
      this.observationStatus.textContent = isNew ? "BARU KAMU LIHAT" : "SUDAH PERNAH KAMU LIHAT";
      this.observationTitle.textContent = goal.title;
      const distance = Math.hypot(goal.x - this.player.x, goal.z - this.player.z);
      this.observationMeta.textContent = `${this.currentRegion?.name || "Merkurius"} · ${distance < 1 ? Math.round(distance * 1000) + " cm" : distance.toFixed(1) + " m"} dari posisimu`;
      this.observationLead.textContent = goal.lead || "";
      this.observationWhy.textContent = goal.why || "";
      this.observationSourceNote.textContent = "Gambaran lokasi dan penjelasan diringkas dari gambar NASA / MESSENGER yang dicantumkan.";
      this.observationSource.href = goal.source || this.currentRegion?.source || "https://science.nasa.gov/mercury/";
      this.observationCard.hidden = false;
      this.observationCard.setAttribute("aria-hidden", "false");
      this.root.classList.add("is-observation-open");
      this.observationPrompt.hidden = true;
      this.syncSecondaryPanels();
      document.getElementById("announcement").textContent = `${goal.title}. Tujuan eksplorasi berhasil diamati.`;
    }

    closeObservationCard(focus = false) {
      if (!this.observationCard) return;
      this.observationCard.hidden = true;
      this.observationCard.setAttribute("aria-hidden", "true");
      this.root.classList.remove("is-observation-open");
      this.activeObservation = null;
      this.syncSecondaryPanels();
      this.updateEducation(0);
      if (focus) requestAnimationFrame(() => this.viewport?.focus?.({ preventScroll: true }));
    }

    syncSecondaryPanels() {
      const exploring = this.state === STATES.EXPLORING;
      const observationOpen = this.isObservationCardOpen();
      const mobile = window.matchMedia?.("(max-width: 820px), (pointer: coarse) and (max-width: 1100px)")?.matches || false;
      if (mobile && !this.objectivesCollapsed && !this.infoMinimized) this.infoMinimized = true;
      const showObjectives = exploring && !this.objectivesCollapsed && !observationOpen;
      const showInfo = exploring && !this.infoMinimized && !observationOpen;
      const mobileSecondaryOpen = mobile && (showObjectives || showInfo);

      this.root.classList.toggle("is-objectives-open", showObjectives);
      this.root.classList.toggle("is-info-open", showInfo);

      this.objectivesPanel.hidden = !showObjectives;
      this.objectivesPanel.setAttribute("aria-hidden", String(!showObjectives));
      this.objectivesToggle.hidden = !exploring || !this.objectivesCollapsed || this.actionsMenuOpen || observationOpen || mobileSecondaryOpen;

      this.landmarkCard.hidden = !showInfo;
      this.landmarkCard.classList.toggle("is-visible", showInfo);
      this.landmarkCard.setAttribute("aria-hidden", String(!showInfo));
      this.infoToggle.hidden = !exploring || !this.infoMinimized || this.actionsMenuOpen || observationOpen || mobileSecondaryOpen;
    }

    setObjectivesCollapsed(collapsed, force = false, focusToggle = false) {
      const mobile = window.matchMedia?.("(max-width: 820px), (pointer: coarse) and (max-width: 1100px)")?.matches || false;
      if (!collapsed && mobile) {
        this.setActionsMenu(false);
        this.infoMinimized = true;
      }
      this.objectivesCollapsed = Boolean(collapsed);
      this.syncSecondaryPanels();
      if (!force) document.getElementById("announcement").textContent = collapsed ? "Panel tujuan diminimalkan." : "Panel tujuan dibuka kembali.";
      if (focusToggle && collapsed && !this.objectivesToggle.hidden) requestAnimationFrame(() => this.objectivesToggle.focus({ preventScroll: true }));
    }

    setInfoMinimized(minimized, force = false, focusPanel = false) {
      const mobile = window.matchMedia?.("(max-width: 820px), (pointer: coarse) and (max-width: 1100px)")?.matches || false;
      if (!minimized && mobile) {
        this.setActionsMenu(false);
        this.objectivesCollapsed = true;
      }
      this.infoMinimized = Boolean(minimized);
      this.syncSecondaryPanels();
      if (!force) document.getElementById("announcement").textContent = minimized ? "Info lokasi disembunyikan." : `Info lokasi ${this.currentRegion?.name || "Merkurius"} ditampilkan.`;
      if (focusPanel && !minimized) requestAnimationFrame(() => this.landmarkCard.querySelector("button, a")?.focus({ preventScroll: true }));
      if (focusPanel && minimized && !this.infoToggle.hidden) requestAnimationFrame(() => this.infoToggle.focus({ preventScroll: true }));
    }

    async startSelectedRegion({ switchOnly = false, targetRegion = null } = {}) {
      const region = targetRegion || this.selectedRegion;
      if (!region || ![STATES.SELECTING, STATES.EXPLORING].includes(this.state)) return false;
      const switching = Boolean(this.currentRegion) || switchOnly;
      const token = ++this.transitionToken;
      const transitionStartedAt = performance.now();
      const minimumLoadingMs = switching ? 1050 : 420;
      this.state = STATES.LOADING;
      this.selectorOpenedFromWorld = false;
      this.hideError();
      this.regionSelector.hidden = true;
      this.qualityPanel.hidden = true;
      this.root.classList.remove("is-selecting", "is-configuring", "is-active", "is-error");
      this.root.classList.add("is-preparing");
      this.setUiVisible(false);
      this.clearMovementInput();
      this.showLoading(switching ? `BERPINDAH KE ${region.name.toUpperCase()}` : `MENYIAPKAN ${region.name.toUpperCase()}`, switching ? 18 : 12);
      try {
        // Give the loading card a real paint before the terrain rebuild starts.
        await new Promise(resolve => requestAnimationFrame(() => requestAnimationFrame(resolve)));
        if (switching) await wait(150);
        await this.ensureReady();
        if (token !== this.transitionToken) return false;
        this.showLoading(switching ? "MENGUNDUH DATA WILAYAH" : "MEMUAT DATA WILAYAH", 42);
        if (switching) await wait(170);
        if (token !== this.transitionToken) return false;
        this.showLoading("MERENDER MEDAN MERKURIUS", 70);
        this.applyRegion(region);
        if (token !== this.transitionToken) return false;
        this.showLoading("MENGATUR PETUNJUK ARAH & INFO LOKASI", 94);
        const remaining = minimumLoadingMs - (performance.now() - transitionStartedAt);
        if (remaining > 0) await wait(remaining);
        if (token !== this.transitionToken) return false;

        this.state = STATES.EXPLORING;
        this.active = true;
        this.root.className = "mars-full-exploration venus-full-exploration mercury-full-exploration is-active is-surface-visible";
        document.getElementById("mission")?.classList.remove("is-mercury-full-selecting");
        document.getElementById("mission")?.classList.add("is-mercury-full");
        this.root.style.setProperty("--surface-opacity", "1");
        this.root.style.setProperty("--entry-progress", "1");
        this.objectivesCollapsed = true;
        // When switching regions, reveal the location card immediately so the change is obvious.
        this.infoMinimized = !switching;
        this.setUiVisible(true);
        this.selectedRegion = region;
        this.mercury.beginFullExploration?.(region);
        this.setActionsMenu(false);
        this.syncSecondaryPanels();
        this.hideLoading();
        if (switching) this.dismissTutorial(false); else this.showTutorial();
        this.resize();
        this.startLoop();
        document.getElementById("announcement").textContent = switching
          ? `Tiba di ${region.name}. Info lokasi dibuka otomatis.`
          : `Jelajah penuh Merkurius aktif di ${region.name}.`;
        return true;
      } catch (error) {
        console.error("Mercury Full Exploration:", error);
        this.showError(error?.message || "Eksplorasi Merkurius tidak dapat dimulai.");
      }
    }

    startLoop() {
      cancelAnimationFrame(this.frame);
      this.previous = performance.now();
      this.frame = requestAnimationFrame(this.loop);
    }

    loop(now) {
      this.frame = requestAnimationFrame(this.loop);
      if (this.state !== STATES.EXPLORING || !this.ready || !this.currentRegion) return;
      const delta = Math.min((now - this.previous) / 1000, 0.05);
      this.previous = now;
      this.clock += delta;
      this.updateLook(delta);
      const speed = this.quality.speed * (this.keys.has("shift") ? 1.65 : 1);
      const axes = this.movementAxes();
      const forward = axes.forward;
      const strafe = axes.strafe;
      const vertical = axes.vertical;
      const sin = Math.sin(this.look.yaw);
      const cos = Math.cos(this.look.yaw);
      // Match Venus / Three.js camera space. Forward follows camera view on XZ,
      // while right is forward × up. This keeps D visually right at every yaw.
      const forwardX = sin;
      const forwardZ = cos;
      const rightX = -cos;
      const rightZ = sin;
      this.player.x += (forwardX * forward + rightX * strafe) * speed * delta;
      this.player.z += (forwardZ * forward + rightZ * strafe) * speed * delta;
      const radius = this.quality.worldRadius;
      const planarDistance = Math.hypot(this.player.x, this.player.z);
      if (planarDistance > radius) {
        const scale = radius / planarDistance;
        this.player.x *= scale;
        this.player.z *= scale;
        this.boundaryHint.textContent = "Batas jelajah tercapai. Area luar tetap terlihat agar dunia terasa berlanjut.";
      } else if (this.boundaryHint.textContent) {
        this.boundaryHint.textContent = "";
      }
      const ground = this.heightAtLocal(this.player.x, this.player.z, this.currentRegion, true);
      const clearance = 2.4;
      if (vertical !== 0) this.altitudeOffset = clamp(this.altitudeOffset + vertical * speed * delta * 0.72, clearance, 42);
      const targetY = ground + Math.max(clearance, this.altitudeOffset);
      this.player.y += (targetY - this.player.y) * Math.min(1, delta * 7.5);
      if (this.player.y < ground + clearance) this.player.y = ground + clearance;
      this.updateCamera();
      this.updateHud(delta, speed);
      this.updateEducation(delta);
      this.renderer.render(this.scene, this.camera);
    }

    updateCamera() {
      const pitch = clamp(this.look.pitch, -1.38, 1.30);
      const cosPitch = Math.cos(pitch);
      const dirX = Math.sin(this.look.yaw) * cosPitch;
      const dirY = Math.sin(pitch);
      const dirZ = Math.cos(this.look.yaw) * cosPitch;
      this.camera.position.set(this.player.x, this.player.y, this.player.z);
      this.camera.lookAt(
        this.player.x + dirX * 34,
        this.player.y + dirY * 34,
        this.player.z + dirZ * 34
      );
    }

    updateHud(delta, speed) {
      const altitude = this.player.y - this.heightAtLocal(this.player.x, this.player.z, this.currentRegion, true);
      const distance = Math.hypot(this.player.x, this.player.z);
      const regionCenterDistance = distance2D({ x: this.player.x, z: this.player.z }, { x: 0, z: 0 });
      this.hudAltitude.textContent = `${altitude.toFixed(1)} M`;
      const axes = this.movementAxes();
      const moveMagnitude = Math.hypot(axes.forward, axes.strafe, axes.vertical);
      this.hudSpeed.textContent = `${(moveMagnitude * speed).toFixed(0)} M/S`;
      this.hudDistance.textContent = `${regionCenterDistance.toFixed(0)} M`;
    }

    onPointerLockChange() {
      this.pointerLocked = document.pointerLockElement === this.viewport;
    }

    applyLookDelta(dx, dy, source = "mouse") {
      // Mercury intentionally uses a calmer camera than the old direct-look path.
      // Desktop pointer-lock is tuned below Venus' raw sensitivity, then eased per frame.
      const sensitivity = source === "touch" ? 0.0030 : source === "locked" ? 0.00135 : 0.0017;
      this.lookTarget.yaw -= dx * sensitivity;
      this.lookTarget.pitch = clamp(this.lookTarget.pitch - dy * sensitivity, -1.34, 1.22);
    }

    updateLook(delta) {
      const response = 1 - Math.exp(-delta * 18);
      this.look.yaw += (this.lookTarget.yaw - this.look.yaw) * response;
      this.look.pitch += (this.lookTarget.pitch - this.look.pitch) * response;
      this.look.pitch = clamp(this.look.pitch, -1.34, 1.22);
    }

    onMouseMove(event) {
      if (!this.active || !this.pointerLocked || this.state !== STATES.EXPLORING || this.isObservationCardOpen() || this.actionsMenuOpen) return;
      this.applyLookDelta(event.movementX || 0, event.movementY || 0, "locked");
    }

    onLookPointerDown(event) {
      if (!this.active || this.state !== STATES.EXPLORING || this.isObservationCardOpen() || this.actionsMenuOpen) return;
      if (event.target.closest("button, a, [data-mercury-ui],.venus-region-selector,.venus-quality-panel,.venus-location-card,.venus-objectives-panel")) return;
      if (event.pointerType === "mouse") return;
      this.lookPointerId = event.pointerId;
      this.lookPointer.x = event.clientX;
      this.lookPointer.y = event.clientY;
      this.viewport.setPointerCapture?.(event.pointerId);
      event.preventDefault();
    }

    onLookPointerMove(event) {
      if (!this.active || this.state !== STATES.EXPLORING || this.isObservationCardOpen() || this.actionsMenuOpen || this.lookPointerId !== event.pointerId) return;
      const dx = event.clientX - this.lookPointer.x;
      const dy = event.clientY - this.lookPointer.y;
      this.lookPointer.x = event.clientX;
      this.lookPointer.y = event.clientY;
      this.applyLookDelta(dx, dy, event.pointerType === "touch" ? "touch" : "mouse");
      event.preventDefault();
    }

    onLookPointerUp(event) {
      if (this.lookPointerId !== event.pointerId) return;
      this.lookPointerId = null;
      this.viewport.releasePointerCapture?.(event.pointerId);
    }

    onKeyDown(event) {
      if (!this.active) return;
      const key = event.key.toLowerCase();
      if (!["w", "a", "s", "d", "q", "e", "shift", "escape"].includes(key)) return;
      event.preventDefault();
      event.stopImmediatePropagation();
      if (key === "escape") {
        if (event.repeat) return;
        this.clearMovementInput();
        if (this.isObservationCardOpen()) this.closeObservationCard(false);
        else if (this.actionsMenuOpen) this.setActionsMenu(false);
        else if (this.regionSelector && !this.regionSelector.hidden && this.currentRegion) this.closeSelectorToWorld();
        else if (this.qualityPanel && !this.qualityPanel.hidden && !this.currentRegion) this.cancelPreEntry();
        else if (!this.infoMinimized) this.setInfoMinimized(true, false, false);
        else if (!this.objectivesCollapsed) this.setObjectivesCollapsed(true);
        else this.exit();
        return;
      }
      if (this.state !== STATES.EXPLORING || this.isObservationCardOpen() || this.actionsMenuOpen) return;
      if (key === "e" && !event.repeat && this.tryObserveNearby()) {
        this.keys.delete("e");
        return;
      }
      this.keys.add(key);
    }

    onKeyUp(event) {
      if (!this.active) return;
      const key = event.key.toLowerCase();
      if (!["w", "a", "s", "d", "q", "e", "shift"].includes(key)) return;
      event.preventDefault();
      event.stopImmediatePropagation();
      this.keys.delete(key);
    }

    onResize() {
      if (!this.ready) return;
      this.resize();
    }

    resize() {
      if (!this.renderer || !this.camera || !this.viewport) return;
      const rect = this.viewport.getBoundingClientRect();
      const width = Math.max(1, Math.floor(rect.width));
      const height = Math.max(1, Math.floor(rect.height));
      this.camera.aspect = width / height;
      this.camera.updateProjectionMatrix();
      this.renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, this.quality.maxDpr));
      this.renderer.setSize(width, height, false);
    }

    animateRetreatAltitude(targetAltitude, duration, token) {
      if (!this.ready || !this.currentRegion || !this.renderer || !this.camera) return Promise.resolve();
      const startAltitude = Math.max(2.4, this.altitudeOffset);
      const start = performance.now();
      const reduced = this.mercury.motion?.matches;
      return new Promise(resolve => {
        const frame = now => {
          if (token !== this.transitionToken || this.state !== STATES.EXITING) return resolve();
          const raw = clamp((now - start) / (reduced ? 120 : duration), 0, 1);
          const eased = smoothStep(raw);
          this.altitudeOffset = lerp(startAltitude, targetAltitude, eased);
          const ground = this.heightAtLocal(this.player.x, this.player.z, this.currentRegion, true);
          this.player.y = ground + this.altitudeOffset;
          this.updateCamera();
          this.updateHud(0, 0);
          this.renderer.render(this.scene, this.camera);
          if (raw < 1) requestAnimationFrame(frame); else resolve();
        };
        requestAnimationFrame(frame);
      });
    }

    showTutorial() {
      let seen = false;
      try { seen = sessionStorage.getItem("antara-mercury-full-tutorial-v2") === "1"; } catch (_) {}
      if (seen) { this.tutorial.hidden = true; return; }
      this.tutorial.hidden = false;
      window.clearTimeout(this.tutorialTimeout);
      this.tutorialTimeout = window.setTimeout(() => this.dismissTutorial(false), 9000);
    }

    dismissTutorial(persist = false) {
      window.clearTimeout(this.tutorialTimeout);
      if (persist) { try { sessionStorage.setItem("antara-mercury-full-tutorial-v2", "1"); } catch (_) {} }
      this.tutorial.hidden = true;
    }

    disposeFullWorld() {
      this.stopLoop();
      try {
        this.scene?.traverse?.(node => {
          node.geometry?.dispose?.();
          const materials = Array.isArray(node.material) ? node.material : node.material ? [node.material] : [];
          materials.forEach(material => {
            Object.values(material || {}).forEach(value => {
              if (value && value.isTexture) value.dispose?.();
            });
            material?.dispose?.();
          });
        });
      } catch (_) {}
      try { this.renderer?.renderLists?.dispose?.(); } catch (_) {}
      try { this.renderer?.dispose?.(); } catch (_) {}
      if (this.viewport) this.viewport.replaceChildren();
      this.renderer = null;
      this.scene = null;
      this.camera = null;
      this.terrainGroup = null;
      this.terrain = null;
      this.ready = false;
    }

    forceReset() {
      this.transitionToken += 1;
      this.active = false;
      this.state = STATES.HIDDEN;
      this.selectorOpenedFromWorld = false;
      this.selectorRestoreState = null;
      this.regionSwitchInFlight = false;
      this.setActionsMenu(false);
      this.stopLoop();
      this.clearMovementInput();
      window.clearTimeout(this.tutorialTimeout);
      this.lookPointerId = null;
      if (document.pointerLockElement === this.viewport) document.exitPointerLock?.();
      this.hideSelector();
      this.hideQuality();
      this.hideLoading();
      this.hideError();
      this.setUiVisible(false);
      this.root.className = "mars-full-exploration venus-full-exploration mercury-full-exploration";
      document.getElementById("mission")?.classList.remove("is-mercury-full", "is-mercury-full-selecting");
      this.root.style.removeProperty("--surface-opacity");
      this.root.style.removeProperty("--entry-progress");
      this.root.hidden = true;
      this.root.inert = true;
      this.root.setAttribute("aria-hidden", "true");
      this.entryButton.disabled = false;
      const region = this.currentRegion;
      this.mercury.setFullExplorationTransition?.(0, region);
      this.mercury.endFullExploration?.();
      this.disposeFullWorld();
      this.currentRegion = null;
      this.infoMinimized = true;
      this.objectivesCollapsed = true;
    }

    async toggleFullscreen() {
      try {
        if (document.fullscreenElement) {
          await document.exitFullscreen();
          this.fullscreenToggle?.setAttribute("aria-pressed", "false");
        } else {
          await this.root.requestFullscreen();
          this.fullscreenToggle?.setAttribute("aria-pressed", "true");
        }
      } catch (_) {}
    }

    async exit(silent = false) {
      if (this.state === STATES.EXITING) return;
      if ([STATES.CONFIGURING, STATES.SELECTING].includes(this.state) && !this.currentRegion) {
        this.cancelPreEntry();
        return;
      }
      if (!this.active || !this.currentRegion || this.state !== STATES.EXPLORING) {
        this.finishExit(silent);
        return;
      }

      this.state = STATES.EXITING;
      const token = ++this.transitionToken;
      this.selectorOpenedFromWorld = false;
      this.selectorRestoreState = null;
      this.setActionsMenu(false);
      this.stopLoop();
      this.clearMovementInput();
      this.lookPointerId = null;
      if (document.pointerLockElement === this.viewport) document.exitPointerLock?.();
      this.regionSelector.hidden = true;
      this.qualityPanel.hidden = true;
      this.hideLoading();
      this.hideError();
      this.root.classList.remove("is-info-open", "is-objectives-open");
      this.landmarkCard.classList.remove("is-visible");
      this.landmarkCard.setAttribute("aria-hidden", "true");
      this.objectivesPanel.setAttribute("aria-hidden", "true");
      this.root.classList.add("is-exiting");
      document.getElementById("announcement").textContent = "Meninggalkan permukaan Merkurius dan kembali ke panorama jalur mengelilingi.";

      try { await this.animateRetreatAltitude(Math.max(this.altitudeOffset, 34), 1450, token); } catch (_) {}
      if (token !== this.transitionToken || this.state !== STATES.EXITING) return;

      const reduced = this.mercury.motion?.matches;
      const duration = reduced ? 260 : 3200;
      const start = performance.now();
      await new Promise(resolve => {
        const frame = now => {
          if (token !== this.transitionToken || this.state !== STATES.EXITING) return resolve();
          const raw = clamp((now - start) / duration, 0, 1);
          const eased = smoothStep(raw);
          this.root.style.setProperty("--surface-opacity", String(1 - smoothStep(raw / 0.62)));
          this.root.style.setProperty("--entry-progress", String(1 - eased));
          this.mercury.setFullExplorationTransition?.(1 - eased, this.currentRegion);
          if (this.ready && this.renderer && this.scene && this.camera) this.renderer.render(this.scene, this.camera);
          if (raw < 1) requestAnimationFrame(frame); else resolve();
        };
        requestAnimationFrame(frame);
      });
      if (token !== this.transitionToken || this.state !== STATES.EXITING) return;
      this.finishExit(silent);
    }

    finishExit(silent = false) {
      if (document.fullscreenElement === this.root) document.exitFullscreen?.().catch?.(() => {});
      this.active = false;
      this.state = STATES.HIDDEN;
      this.selectorOpenedFromWorld = false;
      this.selectorRestoreState = null;
      this.setActionsMenu(false);
      this.stopLoop();
      this.setUiVisible(false);
      this.root.className = "mars-full-exploration venus-full-exploration mercury-full-exploration";
      document.getElementById("mission")?.classList.remove("is-mercury-full", "is-mercury-full-selecting");
      this.root.style.removeProperty("--surface-opacity");
      this.root.style.removeProperty("--entry-progress");
      this.root.hidden = true;
      this.root.inert = true;
      this.root.setAttribute("aria-hidden", "true");
      this.entryButton.disabled = false;
      const region = this.currentRegion;
      this.mercury.setFullExplorationTransition?.(0, region);
      this.mercury.endFullExploration?.();
      this.disposeFullWorld();
      this.currentRegion = null;
      this.infoMinimized = true;
      this.objectivesCollapsed = true;
      if (!silent) {
        document.getElementById("announcement").textContent = "Kembali ke panorama Merkurius.";
        this.entryButton?.focus({ preventScroll: true });
      }
    }

    onMercuryStop() {
      this.transitionToken += 1;
      this.finishExit(true);
    }
  }

  window.MercuryFullExploration = MercuryFullExploration;
})();
