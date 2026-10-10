"use strict";

(() => {
  const STORAGE_KEY = "antara-neptune-full-quality-v3";
  const DISCOVERY_PREFIX = "antara-neptune-mode terbang-discovery-v1:";
  const QUALITY = Object.freeze({
    LOW: { name: "LOW", label: "RENDAH", dpr: 1.0, clouds: 220, streaks: 7, markerSegments: 28 },
    MEDIUM: { name: "MEDIUM", label: "SEDANG", dpr: 1.35, clouds: 360, streaks: 10, markerSegments: 40 },
    HIGH: { name: "HIGH", label: "TINGGI", dpr: 1.7, clouds: 520, streaks: 13, markerSegments: 56 }
  });

  const clamp = (value, min, max) => Math.max(min, Math.min(max, value));
  const lerp = (a, b, t) => a + (b - a) * t;
  const smoothstep = value => {
    const t = clamp(value, 0, 1);
    return t * t * (3 - 2 * t);
  };
  const delay = ms => new Promise(resolve => window.setTimeout(resolve, ms));
  const deg = radians => radians * 180 / Math.PI;

  const SOURCES = Object.freeze({
    facts: "https://science.nasa.gov/neptune/neptune-facts/",
    voyager: "https://science.nasa.gov/mission/voyager/fact-sheet/",
    clouds: "https://science.nasa.gov/photojournal/neptunes-clouds/",
    darkspot: "https://science.nasa.gov/photojournal/neptune-clouds-on-the-dark-spot/",
    rings: "https://science.nasa.gov/resource/neptunes-rings/",
    arcs: "https://science.nasa.gov/resource/neptune-ring-arcs/",
    moons: "https://science.nasa.gov/neptune/moons/facts/",
    triton: "https://science.nasa.gov/asset/webb/triton-voyager-2/"
  });

  const DESTINATIONS = Object.freeze([
    {
      id: "super-winds",
      name: "Angin super cepat Neptunus",
      short: "ANGIN SUPER CEPAT",
      category: "UDARA RAKSASA ES",
      descriptor: "Terbang menembus arus angin cepat tercepat di antara planet utama",
      locationLabel: "Udara di seluruh planet Neptunus",
      preview: "winds",
      image: "./assets/neptune-winds-diagram.svg",
      imageAlt: "Diagram edukasi angin sangat kuat Neptunus",
      imageCaption: "Angin Neptunus · ANTARA berbasis NASA",
      source: SOURCES.facts,
      lead: "Neptunus adalah dunia paling berangin di Tata Surya. Di map ini kamu terbang di antara pita awan dan arus angin sangat cepat yang secara nyata dapat melampaui 2.000 km/jam.",
      facts: [
        "Udara Neptunus terutama tersusun dari gas ringan bernama hidrogen dan gas ringan bernama helium dengan sedikit gas bernama metana.",
        "NASA mencatat angin Neptunus dapat melampaui 1.200 mph atau sekitar 2.000 km/jam.",
        "Neptunus tidak punya permukaan padat. udaranya berangsur menyatu dengan lapisan bahan yang bisa mengalir bertekanan tinggi."
      ],
      palette: { sky: 0x2d6f8d, fog: 0x68a4bd, fogDensity: 0.0104, cloud: "#d9f1f6", cloud2: "#70a9bd", accent: 0xc8f2ff, lightning: 0xeffcff },
      wind: { x: 2.10, z: 0.42 }, turbulence: 1.08,
      spawn: { x: -31, y: 9, z: 43, yaw: Math.PI * 0.88, pitch: -0.04 },
      observations: [
        { id: "winds-jet", name: "Arus angin cepat Supersonik", category: "ANGIN SUPER CEPAT", position: [9, 11, -14], radius: 10, source: SOURCES.facts, lead: "Arus angin sangat cepat di udara Neptunus melaju sangat cepat mengitari planet.", why: "Kecepatan sangat kuat ini menunjukkan bahwa cuaca Neptunus tidak hanya digerakkan cahaya Matahari. Tapi juga energi internal planet.", facts: ["Angin dapat melebihi 2.000 km/jam.", "Kecepatan angin berbeda menurut lintang.", "Pola awan Voyager 2 membantu ilmuwan mengukur arah dan kecepatan arus."] },
        { id: "winds-methane", name: "Kabut Gas bernama metana", category: "MENYERAP CAHAYA", position: [-23, -4, -13], radius: 10, source: SOURCES.facts, lead: "Gas bernama metana di udara menyerap cahaya merah dan ikut memberi warna biru pada Neptunus.", why: "Warna cahaya memungkinkan ilmuwan mengenali zat kecil udara dari jarak miliaran kilometer.", facts: ["Gas bernama metana hanya sebagian kecil udara.", "Ia menyerap kuat cahaya merah.", "NASA kini menekankan warna asli Neptunus lebih lembut daripada banyak gambar Voyager yang dicara untuk perbedaan."] },
        { id: "winds-deep", name: "Lapisan Lebih Dalam", category: "TEKANAN", position: [29, -19, 18], radius: 10, source: SOURCES.facts, lead: "Semakin turun, tekanan meningkat dan udara berangsur menjadi bahan yang bisa mengalir kaya air, gas bernama metana, dan gas bernama amonia pada keadaan yang sangat keras.", why: "Neptunus adalah raksasa es. Bentuk dalamnya berbeda dari raksasa gas seperti Jupiter dan Saturnus.", facts: ["Sebagian besar isi planet berada dalam bahan yang bisa mengalir panas dan rapat yang disebut bahan 'icy'.", "Tidak ada batas tanah yang dapat didarati.", "Tekanan sangat kuat menjaga bahan tetap dalam bentuk yang tidak kita jumpai di permukaan Bumi."] }
      ]
    },
    {
      id: "dark-spot",
      name: "Great Dark Spot",
      short: "BADAI GELAP",
      category: "BADAI GELAP",
      descriptor: "Masuk ke sisi pusaran gelap dan awan pendampingnya",
      locationLabel: "Udara Neptunus · zona badai",
      preview: "storm",
      image: "./assets/neptune-storm-diagram.svg",
      imageAlt: "Diagram edukasi Great Dark Spot Neptunus",
      imageCaption: "Great Dark Spot · ANTARA berbasis Voyager 2 / NASA",
      source: SOURCES.darkspot,
      lead: "Voyager 2 melihat Great Dark Spot pada 1989, sebuah pusaran badai seukuran Bumi. Badai itu kemudian menghilang, sementara pusaran badai gelap baru terus muncul di udara Neptunus.",
      facts: [
        "Great Dark Spot Voyager 2 berukuran kira-kira sebesar Bumi.",
        "Dark spot bukan noda di permukaan. Tapi sistem badai udara.",
        "Pusaran badai Neptunus bisa muncul, berubah lintang, dan akhirnya menghilang."
      ],
      palette: { sky: 0x254f73, fog: 0x557f9e, fogDensity: 0.0124, cloud: "#dfeef5", cloud2: "#486b88", accent: 0xcbefff, lightning: 0xf3fbff },
      wind: { x: 1.62, z: -0.64 }, turbulence: 1.52,
      spawn: { x: -22, y: 11, z: 43, yaw: Math.PI * 0.91, pitch: -0.07 },
      observations: [
        { id: "spot-wall", name: "Dinding Pusaran badai", category: "PUSARAN BADAI", position: [5, 5, -16], radius: 11, source: SOURCES.darkspot, lead: "Tepi pusaran badai adalah wilayah dengan perbedaan arah angin dan bentuk awan yang kuat.", why: "Batas badai membuat ilmuwan lebih mudah tahu bagaimana pusaran besar bertahan di udara tanpa permukaan padat.", facts: ["Dark spot adalah pusaran badai udara.", "Great Dark Spot 1989 tidak lagi terlihat beberapa tahun kemudian.", "Hubble telah mengamati dark spot lain pada masa berbeda."] },
        { id: "spot-companion", name: "Bright Companion Cloud", category: "AWAN TINGGI", position: [-25, 13, 4], radius: 10, source: SOURCES.darkspot, lead: "Awan putih terang dapat terbentuk di dekat pusaran badai besar dan berada lebih tinggi daripada awan utama utama.", why: "Awan pendamping menunjukkan tentang gerakan udara atas-bawah di sekitar badai.", facts: ["Voyager 2 melihat awan putih dekat Great Dark Spot.", "Pada jenis cahaya gas bernama metana, awan tinggi terlihat sangat terang karena berada di atas banyak gas penyerap.", "Bagian ini dapat berubah dalam hitungan jam hingga hari."] },
        { id: "spot-scooter", name: "Jejak Scooter", category: "AWAN CEPAT", position: [28, -4, 20], radius: 9, source: SOURCES.voyager, lead: "Voyager 2 menjuluki satu awan kecil yang bergerak cepat sebagai Scooter.", why: "Pergerakan awan kecil menjadi penanda alami untuk mengukur arus angin Neptunus.", facts: ["Scooter tampak bergerak ke timur dengan cepat.", "Voyager menggunakan bagian awan sebagai pelacak angin.", "Cuaca Neptunus tetap aktif meski menerima sangat sedikit energi Matahari."] }
      ]
    },
    {
      id: "methane-clouds",
      name: "Awan Gas bernama metana Tinggi",
      short: "HIGH CLOUDS",
      category: "AWAN ES GAS metana",
      descriptor: "Terbang di antara awan putih tipis yang berubah sangat cepat",
      locationLabel: "Lapisan atas udara Neptunus",
      preview: "clouds",
      image: "./assets/neptune-clouds-diagram.svg",
      imageAlt: "Diagram edukasi awan gas bernama metana Neptunus",
      imageCaption: "Awan tinggi Neptunus · ANTARA berbasis Voyager 2",
      source: SOURCES.clouds,
      lead: "Voyager 2 melihat awan putih seperti awan tipis yang terbentuk dari gas bernama metana beku. Awan ini dapat muncul dan menghilang hanya dalam beberapa hingga puluhan jam.",
      facts: [
        "Awan putih tinggi Neptunus mengandung kristal es metana, bukan es air seperti awan tipis Bumi.",
        "NASA mendokumentasikan perubahan awan dalam skala beberapa hingga puluhan jam.",
        "Awan tinggi sangat berguna untuk melacak aliran udara di bawahnya."
      ],
      palette: { sky: 0x3f7fa0, fog: 0x78adc0, fogDensity: 0.0096, cloud: "#f2fbff", cloud2: "#a1c9d8", accent: 0xe9fbff, lightning: 0xffffff },
      wind: { x: 1.86, z: 0.20 }, turbulence: 0.86,
      spawn: { x: -28, y: 16, z: 41, yaw: Math.PI * 0.86, pitch: -0.05 },
      observations: [
        { id: "clouds-awan tipis", name: "Awan tipis Gas bernama metana", category: "ES metana", position: [8, 15, -13], radius: 10, source: SOURCES.clouds, lead: "Awan putih tipis ini berada tinggi di atas awan utama utama.", why: "Karena terletak tinggi, awan tampak cerah dan mudah dilacak dari luar planet.", facts: ["Butiran esnya berisi gas bernama metana beku.", "Suhu udara atas sangat rendah.", "Awan dapat berubah cepat dalam rentang beberapa jam."] },
        { id: "clouds-wave", name: "Gelombang Awan", category: "GELOMBANG DI UDARA", position: [-22, 2, -10], radius: 10, source: SOURCES.clouds, lead: "Pola awan dapat menyimpan bekas gelombang dan gangguan pada aliran udara.", why: "Awan membantu kita melihat arah gerak udara yang sebenarnya tidak terlihat.", facts: ["Awan terpisah mengikuti arus angin sangat cepat.", "Gelombang dapat mengubah bentuk awan dengan cepat.", "Ilmuwan perlu melihatnya berkali-kali karena bentuk awan bisa cepat berubah."] },
        { id: "clouds-kabut tipis", name: "Kabut tipis Atas", category: "KABUT TIPIS", position: [29, 20, 19], radius: 9, source: SOURCES.facts, lead: "Lapisan kabut tipis tinggi menyebarkan cahaya di atas lapisan udara utama Neptunus.", why: "Kabut tipis membantu menjelaskan bentuk warna dan kecerahan tepi planet planet.", facts: ["Udara atas punya butiran kabut tipis.", "Gas bernama metana menyerap kuat pada jenis cahaya merah dan cahaya panas tertentu.", "Awan tinggi dapat muncul di atas sebagian besar gas bernama metana penyerap sehingga terlihat lebih terang."] }
      ]
    },
    {
      id: "rings-arcs",
      name: "Cincin Gelap & Bagian cincin yang terang",
      short: "RING ARCS",
      category: "SISTEM CINCIN BERDEBU",
      descriptor: "Terbang sejajar cincin tipis dan gumpalan arc pada Adams Ring",
      locationLabel: "Adams Ring · sistem cincin Neptunus",
      preview: "rings",
      image: "./assets/neptune-rings-diagram.svg",
      imageAlt: "Diagram edukasi cincin dan arc Neptunus",
      imageCaption: "Cincin Neptunus · ANTARA berbasis Voyager 2 / NASA",
      source: SOURCES.rings,
      lead: "Neptunus punya sedikitnya lima cincin utama yang gelap dan berdebu. Pada Adams Ring, bahan tidak tersebar merata tetapi membentuk arc terang yang aneh.",
      facts: [
        "Lima cincin utama dikenal sebagai Galle, Leverrier, Lassell, Arago, dan Adams.",
        "Adams Ring punya arc terkenal seperti Liberté, Egalité, Fraternité, dan Courage.",
        "Galatea, bulan kecil dekat Adams Ring, kira-kira membantu menjaga bentuk arc tetap terkumpul."
      ],
      palette: { sky: 0x07101d, fog: 0x24394f, fogDensity: 0.0066, cloud: "#7699ae", cloud2: "#33495a", accent: 0xc9e9f8, lightning: 0xf3fbff },
      wind: { x: 0.08, z: -0.02 }, turbulence: 0.16,
      spawn: { x: -23, y: 3, z: 47, yaw: Math.PI * 0.91, pitch: -0.02 },
      observations: [
        { id: "rings-adams", name: "Adams Ring", category: "OUTER RING", position: [8, 1, -16], radius: 10, source: SOURCES.rings, lead: "Adams adalah cincin utama terluar dan lokasi ring arcs paling terkenal.", why: "Cincin tipis ini memperlihatkan bagaimana tarikan bulan kecil bisa mengatur butiran kecil debu pada jarak sangat besar.", facts: ["Adams berada sekitar 62.930 km dari pusat Neptunus.", "Cincin Neptunus mengandung banyak butiran kecil debu kecil.", "Geometri pencahayaan tertentu membuat cincin jauh lebih mudah terlihat."] },
        { id: "rings-arcs", name: "Fraternité & Bagian cincin yang terang", category: "ARC", position: [-25, 5, 5], radius: 10, source: SOURCES.arcs, lead: "Arc adalah bagian ring yang jauh lebih padat daripada lingkungan sekitarnya.", why: "Secara sederhana bahan jalur mengelilingi seharusnya menyebar. Bertahannya arc berarti ada cara kerja tarikan yang menahan bentuk tersebut.", facts: ["Voyager 2 memotret arc di Adams Ring.", "Arc berisi beberapa gumpalan terpisah.", "Saling pengaruh dengan Galatea dianggap penting dalam menjaga bentuk arc."] },
        { id: "rings-galatea", name: "Jejak Galatea", category: "BULAN PENGGEMBALA", position: [29, 8, 20], radius: 9, source: SOURCES.facts, lead: "Galatea mengelilingi sedikit di dalam Adams Ring dan saling bertemu tarikan dengan bahan cincin.", why: "Bulan kecil bisa membentuk bentuk cincin tanpa perlu menyentuh butiran kecil secara langsung.", facts: ["Galatea adalah bulan kecil bagian dalam Neptunus.", "Pola gerak khusus tarikannya dikaitkan dengan kestabilan ring arcs.", "Sistem cincin Neptunus cukup redup dibanding Saturnus."] }
      ]
    },
    {
      id: "triton",
      name: "Koridor Triton & Voyager 2",
      short: "TRITON",
      category: "BULAN YANG BERGERAK BERLAWANAN ARAH",
      descriptor: "Terbang lewat dekat Triton, semburan nitrogen, dan lintasan Voyager 2",
      locationLabel: "Jalur mengelilingi Triton",
      preview: "triton",
      image: "./assets/neptune-triton-diagram.svg",
      imageAlt: "Diagram edukasi Triton dan sistem Neptunus",
      imageCaption: "Triton · ANTARA berbasis Voyager 2 / NASA",
      source: SOURCES.moons,
      lead: "Triton adalah bulan terbesar Neptunus dan bergerak berlawanan arah, petunjuk kuat bahwa ia kemungkinan benda Sabuk Kuiper yang tertangkap. Voyager 2 melihat geyser bahan es menyembur dari permukaannya.",
      facts: [
        "Triton adalah satu-satunya bulan besar di Tata Surya dengan jalur yang berlawanan arah.",
        "Suhu permukaannya sekitar -235 °C.",
        "Voyager 2 mengamati geyser atau semburan yang menyemburkan bahan lebih dari 8 km ke atas."
      ],
      palette: { sky: 0x0a1421, fog: 0x314c63, fogDensity: 0.0069, cloud: "#dbe6e8", cloud2: "#887f78", accent: 0xe8f5fa, lightning: 0xffffff },
      wind: { x: 0.10, z: 0.16 }, turbulence: 0.18,
      spawn: { x: -24, y: 10, z: 45, yaw: Math.PI * 0.92, pitch: -0.05 },
      observations: [
        { id: "triton-berlawanan arah", name: "Jalur mengelilingi Berlawanan arah", category: "JALUR MENGELILINGI TERTANGKAP", position: [5, 6, -16], radius: 10, source: SOURCES.moons, lead: "Triton mengelilingi berlawanan arah dengan putaran Neptunus.", why: "Jalur mengelilingi berlawanan arah yang sangat kuat mendukung gagasan bahwa Triton terbentuk di tempat lain lalu tertangkap tarikan Neptunus.", facts: ["Triton kemungkinan berasal dari Sabuk Kuiper.", "Penangkapannya mungkin mengacaukan sistem bulan awal Neptunus.", "Jalur mengelilingi Triton perlahan berubah akibat saling pengaruh pasang surut."] },
        { id: "triton-geyser", name: "Geyser Nitrogen", category: "SEMBURAN", position: [-24, 14, 8], radius: 10, source: SOURCES.moons, lead: "Voyager 2 melihat semburan gelap menyembur dari permukaan beku Triton.", why: "Aktivitas pada dunia sedingin Triton menunjukkan bahwa energi dan perubahan permukaan tetap mungkin terjadi jauh dari Matahari.", facts: ["Semburan mencapai lebih dari 8 km di atas permukaan.", "Bahannya dikaitkan dengan nitrogen beku dan cara pemanasan musiman.", "Jejak semburan dapat terbawa angin tipis Triton."] },
        { id: "triton-voyager", name: "Jejak Voyager 2", category: "TERBANG LEWAT DEKAT 1989", position: [30, 4, 20], radius: 9, source: SOURCES.voyager, lead: "Voyager 2 adalah satu-satunya robot antariksa yang pernah melihat Neptunus dan Triton dari dekat.", why: "Terbang lewat dekat Agustus 1989 masih menjadi fondasi utama pengetahuan detail-dekat tentang sistem Neptunus.", facts: ["Voyager 2 melakukan terbang lewat dekat Neptunus pada Agustus 1989.", "Robot antariksa menemukan cincin, bulan, badai, dan bentuk udara baru.", "Triton menjadi target terbang lewat dekat penting setelah closest approach ke Neptunus."] }
      ]
    }
  ]);

  class NeptuneAtmosphereWorld {
    constructor(THREE, scene, renderer, destination, quality) {
      this.THREE = THREE;
      this.scene = scene;
      this.renderer = renderer;
      this.destination = destination;
      this.quality = quality;
      this.group = new THREE.Group();
      this.scene.add(this.group);
      this.seed = this.seedFromString(destination.id);
      this.cloudGroups = [];
      this.streaks = [];
      this.vortexGroups = [];
      this.markerObjects = [];
      this.lightningLines = [];
      this.elapsed = 0;
      this.lightningTimer = 1.2 + this.rand() * 2.4;
      this.lightningFlash = 0;
      this.playRadius = 88;
      this.softBoundaryStart = 72;
      this.minY = -40;
      this.maxY = 38;
      this.baseFogDensity = destination.palette.fogDensity;
      this.tmp = new THREE.Vector3();
      this.build();
    }

    seedFromString(value) {
      let hash = 2166136261;
      for (let i = 0; i < value.length; i++) {
        hash ^= value.charCodeAt(i);
        hash = Math.imul(hash, 16777619);
      }
      return hash >>> 0;
    }

    rand() {
      this.seed = (1664525 * this.seed + 1013904223) >>> 0;
      return this.seed / 4294967296;
    }

    makeCloudTexture(colorA, colorB) {
      const canvas = document.createElement("canvas");
      canvas.width = canvas.height = 256;
      const ctx = canvas.getContext("2d");
      const grad = ctx.createRadialGradient(128, 128, 8, 128, 128, 124);
      grad.addColorStop(0, colorA);
      grad.addColorStop(0.36, colorA);
      grad.addColorStop(0.72, colorB);
      grad.addColorStop(1, "rgba(0,0,0,0)");
      ctx.fillStyle = grad;
      ctx.fillRect(0, 0, 256, 256);
      for (let i = 0; i < 90; i++) {
        const x = 28 + this.rand() * 200;
        const y = 28 + this.rand() * 200;
        const r = 5 + this.rand() * 24;
        const alpha = 0.018 + this.rand() * 0.05;
        const g = ctx.createRadialGradient(x, y, 0, x, y, r);
        g.addColorStop(0, `rgba(255,255,255,${alpha})`);
        g.addColorStop(1, "rgba(255,255,255,0)");
        ctx.fillStyle = g;
        ctx.beginPath();
        ctx.arc(x, y, r, 0, Math.PI * 2);
        ctx.fill();
      }
      const texture = new this.THREE.CanvasTexture(canvas);
      texture.colorSpace = this.THREE.SRGBColorSpace;
      texture.minFilter = this.THREE.LinearMipmapLinearFilter;
      texture.magFilter = this.THREE.LinearFilter;
      texture.generateMipmaps = true;
      texture.needsUpdate = true;
      return texture;
    }

    makeStreakTexture(colorA, colorB) {
      const canvas = document.createElement("canvas");
      canvas.width = 1024;
      canvas.height = 192;
      const ctx = canvas.getContext("2d");
      const g = ctx.createLinearGradient(0, 0, 0, 192);
      g.addColorStop(0, "rgba(255,255,255,0)");
      g.addColorStop(0.22, colorA);
      g.addColorStop(0.5, colorB);
      g.addColorStop(0.78, colorA);
      g.addColorStop(1, "rgba(255,255,255,0)");
      ctx.fillStyle = g;
      ctx.fillRect(0, 0, 1024, 192);
      ctx.globalCompositeOperation = "destination-out";
      for (let i = 0; i < 70; i++) {
        const y = this.rand() * 192;
        ctx.globalAlpha = 0.06 + this.rand() * 0.12;
        ctx.fillRect(0, y, 1024, 1 + this.rand() * 5);
      }
      ctx.globalCompositeOperation = "source-over";
      ctx.globalAlpha = 1;
      const texture = new this.THREE.CanvasTexture(canvas);
      texture.colorSpace = this.THREE.SRGBColorSpace;
      texture.wrapS = this.THREE.RepeatWrapping;
      texture.wrapT = this.THREE.ClampToEdgeWrapping;
      texture.minFilter = this.THREE.LinearMipmapLinearFilter;
      texture.magFilter = this.THREE.LinearFilter;
      texture.needsUpdate = true;
      return texture;
    }

    build() {
      const T = this.THREE;
      const palette = this.destination.palette;
      this.cloudTextureA = this.makeCloudTexture(palette.cloud, "rgba(255,255,255,0)");
      this.cloudTextureB = this.makeCloudTexture(palette.cloud2, "rgba(0,0,0,0)");
      this.streakTexture = this.makeStreakTexture("rgba(224,248,255,.38)", "rgba(54,108,138,.32)");

      this.sky = new T.Mesh(
        new T.SphereGeometry(150, 48, 28),
        new T.MeshBasicMaterial({ color: palette.sky, side: T.BackSide, depthWrite: false, fog: false })
      );
      this.group.add(this.sky);

      const atmospheric = ["super-winds", "dark-spot", "methane-clouds"].includes(this.destination.id);
      if (atmospheric) {
        this.buildCloudPoints(this.cloudTextureA, Math.round(this.quality.clouds * 0.62), 17, 0.38, 0);
        this.buildCloudPoints(this.cloudTextureB, Math.round(this.quality.clouds * 0.38), 12, 0.22, 1);
        this.buildStreakLayers();
      } else {
        this.buildSpaceStars();
      }
      this.buildDestinationFeature();
      this.buildMarkers();
    }

    buildSpaceStars() {
      const T = this.THREE;
      const count = this.quality.name === "LOW" ? 240 : this.quality.name === "HIGH" ? 620 : 420;
      const positions = new Float32Array(count * 3);
      for (let i = 0; i < count; i++) {
        const theta = this.rand() * Math.PI * 2;
        const v = this.rand() * 2 - 1;
        const phi = Math.acos(v);
        const radius = 112 + this.rand() * 24;
        positions[i * 3] = Math.sin(phi) * Math.cos(theta) * radius;
        positions[i * 3 + 1] = Math.cos(phi) * radius;
        positions[i * 3 + 2] = Math.sin(phi) * Math.sin(theta) * radius;
      }
      const geometry = new T.BufferGeometry();
      geometry.setAttribute("position", new T.BufferAttribute(positions, 3));
      const points = new T.Points(geometry, new T.PointsMaterial({
        color: 0xd8f5f5,
        size: this.quality.name === "HIGH" ? 0.68 : 0.82,
        sizeAttenuation: true,
        transparent: true,
        opacity: 0.58,
        depthWrite: false,
        fog: false
      }));
      this.group.add(points);
    }

    buildCloudPoints(texture, count, size, opacity, layerIndex) {
      const T = this.THREE;
      const positions = new Float32Array(count * 3);
      const phases = new Float32Array(count);
      for (let i = 0; i < count; i++) {
        const angle = this.rand() * Math.PI * 2;
        const radius = 8 + Math.sqrt(this.rand()) * 104;
        positions[i * 3] = Math.cos(angle) * radius + (this.rand() - 0.5) * 24;
        positions[i * 3 + 1] = this.minY - 8 + this.rand() * (this.maxY - this.minY + 16);
        positions[i * 3 + 2] = Math.sin(angle) * radius + (this.rand() - 0.5) * 24;
        phases[i] = this.rand() * Math.PI * 2;
      }
      const geometry = new T.BufferGeometry();
      geometry.setAttribute("position", new T.BufferAttribute(positions, 3));
      geometry.userData.phases = phases;
      const material = new T.PointsMaterial({
        map: texture,
        transparent: true,
        opacity,
        alphaTest: 0.02,
        depthWrite: false,
        size,
        sizeAttenuation: true,
        blending: T.NormalBlending,
        fog: true,
        color: 0xffffff
      });
      const points = new T.Points(geometry, material);
      points.userData.layerIndex = layerIndex;
      points.frustumCulled = true;
      this.group.add(points);
      this.cloudGroups.push(points);
    }

    buildStreakLayers() {
      const T = this.THREE;
      const count = this.quality.streaks;
      for (let i = 0; i < count; i++) {
        const geometry = new T.PlaneGeometry(220, 34, 1, 1);
        const material = new T.MeshBasicMaterial({
          map: this.streakTexture,
          transparent: true,
          opacity: 0.10 + this.rand() * 0.16,
          depthWrite: false,
          side: T.DoubleSide,
          fog: true,
          color: i % 2 ? 0xd8eff7 : 0x638da4
        });
        const plane = new T.Mesh(geometry, material);
        plane.rotation.x = -Math.PI / 2 + (this.rand() - 0.5) * 0.08;
        plane.rotation.z = (this.rand() - 0.5) * 0.16;
        plane.position.set((this.rand() - 0.5) * 40, this.minY + (i + 0.5) / count * (this.maxY - this.minY), (this.rand() - 0.5) * 30);
        plane.userData.baseX = plane.position.x;
        plane.userData.baseZ = plane.position.z;
        plane.userData.speed = 0.7 + this.rand() * 1.8;
        plane.userData.phase = this.rand() * Math.PI * 2;
        this.group.add(plane);
        this.streaks.push(plane);
      }
    }

    buildDestinationFeature() {
      const T = this.THREE;
      const accent = this.destination.palette.accent;
      const addVortex=(center,radius,turns,color,opacity)=>{
        const group=new T.Group(); group.position.set(...center);
        for(let ring=0;ring<9;ring++){
          const points=[]; const samples=84; const r0=radius*(.25+ring*.085);
          for(let i=0;i<=samples;i++){
            const t=i/samples*Math.PI*2;
            const wobble=Math.sin(t*turns+ring*.82)*radius*.045;
            points.push(new T.Vector3(Math.cos(t)*(r0+wobble),Math.sin(t*2+ring)*1.05,Math.sin(t)*(r0*.60+wobble)));
          }
          group.add(new T.Line(new T.BufferGeometry().setFromPoints(points),new T.LineBasicMaterial({color,transparent:true,opacity,depthWrite:false,fog:true})));
        }
        group.userData.rotationSpeed=.022+this.rand()*.022; this.group.add(group); this.vortexGroups.push(group); return group;
      };
      const addMoon=(position,radius,colorA,colorB)=>{
        const moon=new T.Mesh(new T.SphereGeometry(radius,30,22),new T.MeshPhongMaterial({color:colorA,emissive:colorB,emissiveIntensity:.06,shininess:8,transparent:true,opacity:.98,fog:true}));
        moon.position.set(...position); this.group.add(moon); return moon;
      };
      const addNeptuneRings=()=>{
        const base=new T.Mesh(new T.RingGeometry(29,92,144,1),new T.MeshBasicMaterial({color:0x6f8591,transparent:true,opacity:.085,side:T.DoubleSide,depthWrite:false,fog:true}));
        base.rotation.x=-Math.PI/2; base.position.y=-1; this.group.add(base);
        const adams=new T.Mesh(new T.RingGeometry(70,72,160,1),new T.MeshBasicMaterial({color:0xaec7d3,transparent:true,opacity:.20,side:T.DoubleSide,depthWrite:false,fog:true}));
        adams.rotation.copy(base.rotation); adams.position.copy(base.position); this.group.add(adams);
        const arcs=new T.Group();
        const arcAngles=[-.35,-.18,.02,.18];
        arcAngles.forEach((offset,index)=>{
          const curve=new T.EllipseCurve(0,0,71,33,offset,offset+.26,false,0);
          const pts=curve.getPoints(36).map(p=>new T.Vector3(p.x,-.5,p.y));
          const line=new T.Line(new T.BufferGeometry().setFromPoints(pts),new T.LineBasicMaterial({color:index===2?0xdbeaf0:0x98b2c0,transparent:true,opacity:.42,depthWrite:false,fog:true}));
          arcs.add(line);
        });
        arcs.userData.rotationSpeed=.006; this.group.add(arcs); this.vortexGroups.push(arcs);
      };
      const addTritonPlume=(moon)=>{
        for(let i=0;i<4;i++){
          const geo=new T.CylinderGeometry(.14,.65+i*.24,9+i*2.3,14,1,true);
          const mat=new T.MeshBasicMaterial({color:0xe6f4f7,transparent:true,opacity:.08+i*.025,side:T.DoubleSide,depthWrite:false,fog:true});
          const p=new T.Mesh(geo,mat); p.position.set(-2+i*1.25,7+i*.7,1); moon.add(p);
        }
      };
      if(this.destination.id==="super-winds"){
        for(let i=-3;i<=3;i++){
          const z=-20+i*2.4;
          const line=new T.Line(new T.BufferGeometry().setFromPoints([new T.Vector3(-95,i*10,z),new T.Vector3(95,i*10,z+4)]),new T.LineBasicMaterial({color:i%2?0xc9edf7:0x4f91ad,transparent:true,opacity:.19,depthWrite:false,fog:true}));
          this.group.add(line);
        }
      }
      if(this.destination.id==="dark-spot"){
        addVortex([3,4,-16],30,3.8,0x183c60,.34);
        addVortex([-21,11,2],10,2.6,0xdff7ff,.15);
      }
      if(this.destination.id==="methane-clouds"){
        for(let i=0;i<5;i++){
          const cloud=new T.Mesh(new T.PlaneGeometry(34+this.rand()*26,6+this.rand()*4),new T.MeshBasicMaterial({color:0xf2fbff,transparent:true,opacity:.09+.04*this.rand(),side:T.DoubleSide,depthWrite:false,fog:true}));
          cloud.position.set(-32+i*16,12+i*2,-18+(i%2)*15); cloud.rotation.x=-Math.PI/2+.08; cloud.userData.baseX=cloud.position.x; cloud.userData.baseZ=cloud.position.z; cloud.userData.speed=1.8+this.rand(); cloud.userData.phase=this.rand()*Math.PI*2; this.group.add(cloud); this.streaks.push(cloud);
        }
      }
      if(this.destination.id==="rings-arcs") addNeptuneRings();
      if(this.destination.id==="triton"){
        const moon=addMoon([35,8,-32],10.5,0xb8beb9,0x443a39);
        addTritonPlume(moon);
        const orbit=new T.Line(new T.BufferGeometry().setFromPoints(Array.from({length:97},(_,i)=>{const a=i/96*Math.PI*2;return new T.Vector3(Math.cos(a)*47,0,Math.sin(a)*25);})),new T.LineBasicMaterial({color:0xadc7d2,transparent:true,opacity:.12,depthWrite:false,fog:true})); this.group.add(orbit);
      }
      const light=new T.PointLight(accent,this.destination.id==="dark-spot"?.52:.36,120,2); light.position.set(0,9,-5); this.group.add(light);
    }

    buildMarkers() {
      const T = this.THREE;
      this.destination.observations.forEach((obs, index) => {
        const group = new T.Group();
        group.position.set(...obs.position);
        const ring = new T.Mesh(
          new T.TorusGeometry(2.2, 0.08, 8, this.quality.markerSegments),
          new T.MeshBasicMaterial({ color: this.destination.palette.accent, transparent: true, opacity: 0.68, depthWrite: false, fog: true })
        );
        ring.rotation.x = Math.PI / 2;
        const dot = new T.Mesh(
          new T.SphereGeometry(0.18, 10, 8),
          new T.MeshBasicMaterial({ color: 0xffffff, transparent: true, opacity: 0.9, depthWrite: false, fog: true })
        );
        const stemGeometry = new T.BufferGeometry().setFromPoints([new T.Vector3(0, -2.8, 0), new T.Vector3(0, 2.8, 0)]);
        const stem = new T.Line(stemGeometry, new T.LineBasicMaterial({ color: this.destination.palette.accent, transparent: true, opacity: 0.28, depthWrite: false, fog: true }));
        group.add(ring, dot, stem);
        group.userData.observation = obs;
        group.userData.index = index;
        group.userData.ring = ring;
        group.userData.dot = dot;
        this.group.add(group);
        this.markerObjects.push(group);
      });
    }

    buildLightning() {
      const T = this.THREE;
      for (let bolt = 0; bolt < 4; bolt++) {
        const points = [];
        let x = -20 + this.rand() * 40;
        let y = 26 - bolt * 5;
        let z = -14 + this.rand() * 28;
        points.push(new T.Vector3(x, y, z));
        for (let i = 0; i < 9; i++) {
          x += (this.rand() - 0.5) * 4.5;
          y -= 3 + this.rand() * 2.4;
          z += (this.rand() - 0.5) * 4.0;
          points.push(new T.Vector3(x, y, z));
        }
        const geometry = new T.BufferGeometry().setFromPoints(points);
        const material = new T.LineBasicMaterial({ color: this.destination.palette.lightning, transparent: true, opacity: 0, depthWrite: false, fog: true });
        const line = new T.Line(geometry, material);
        this.group.add(line);
        this.lightningLines.push(line);
      }
    }

    pressureAt(y) {
      return clamp(0.45 * Math.exp((this.maxY - y) / 33.5), 0.35, 5.8);
    }

    layerAtPressure(pressure) {
      if (this.destination.id === "rings-arcs") {
        if (pressure < 0.8) return "ADAMS RING";
        if (pressure < 1.6) return "RING ARCS";
        return "KORIDOR CINCIN";
      }
      if (this.destination.id === "triton") {
        if (pressure < 0.9) return "TERBANG LEWAT DEKAT TRITON";
        if (pressure < 2.0) return "SEMBURAN NITROGEN";
        return "KORIDOR VOYAGER";
      }
      if (pressure < 0.95) return "AWAN GAS metana TINGGI";
      if (pressure < 2.2) return "KABUT TIPIS / LAPISAN AWAN UTAMA";
      return "UDARA RAKSASA ES DALAM";
    }

    boundaryFactor(position) {
      const radial = Math.hypot(position.x, position.z);
      const radialFactor = smoothstep((radial - this.softBoundaryStart) / Math.max(1, this.playRadius - this.softBoundaryStart));
      const topFactor = smoothstep((position.y - (this.maxY - 10)) / 10);
      const bottomFactor = smoothstep(((this.minY + 10) - position.y) / 10);
      return Math.max(radialFactor, topFactor, bottomFactor);
    }

    update(delta, camera, discovered) {
      this.elapsed += delta;
      const wind = this.destination.wind;
      this.cloudGroups.forEach((points, index) => {
        points.position.x += wind.x * delta * (index ? 0.34 : 0.22);
        points.position.z += wind.z * delta * (index ? 0.34 : 0.22);
        if (points.position.x > 16) points.position.x -= 32;
        if (points.position.x < -16) points.position.x += 32;
        if (points.position.z > 16) points.position.z -= 32;
        if (points.position.z < -16) points.position.z += 32;
        points.rotation.y += delta * (index ? -0.0025 : 0.0035);
      });
      this.streaks.forEach((plane, index) => {
        plane.position.x = plane.userData.baseX + Math.sin(this.elapsed * 0.08 + plane.userData.phase) * 10 + wind.x * Math.sin(this.elapsed * 0.03 + index) * 3;
        plane.position.z = plane.userData.baseZ + Math.cos(this.elapsed * 0.07 + plane.userData.phase) * 8 + wind.z * Math.cos(this.elapsed * 0.025 + index) * 3;
        plane.material.opacity = 0.10 + 0.07 * (1 + Math.sin(this.elapsed * 0.16 + plane.userData.phase));
      });
      this.vortexGroups.forEach((group, index) => {
        group.rotation.y += delta * group.userData.rotationSpeed * (index % 2 ? -1 : 1);
      });
      this.markerObjects.forEach(group => {
        const obs = group.userData.observation;
        const pulse = 1 + Math.sin(this.elapsed * 2.2 + group.userData.index) * 0.12;
        group.userData.ring.scale.setScalar(pulse);
        group.userData.dot.scale.setScalar(1 + Math.sin(this.elapsed * 3 + group.userData.index) * 0.25);
        const done = discovered?.has(obs.id);
        group.userData.ring.material.opacity = done ? 0.22 : 0.66;
        group.userData.dot.material.opacity = done ? 0.35 : 0.9;
        group.lookAt(camera.position.x, group.position.y, camera.position.z);
      });

      if (this.lightningLines.length) {
        this.lightningTimer -= delta;
        if (this.lightningTimer <= 0) {
          this.lightningFlash = 0.16 + this.rand() * 0.16;
          this.lightningTimer = 1.5 + this.rand() * 3.8;
        }
        this.lightningFlash = Math.max(0, this.lightningFlash - delta);
        const visible = this.lightningFlash > 0;
        this.lightningLines.forEach((line, index) => {
          line.material.opacity = visible ? (index === 0 ? 0.95 : 0.45 + this.rand() * 0.35) : 0;
        });
      }

      const edge = this.boundaryFactor(camera.position);
      if (this.scene.fog) this.scene.fog.density = this.baseFogDensity * (1 + edge * 1.75);
    }

    disposeMaterial(material) {
      if (!material) return;
      const list = Array.isArray(material) ? material : [material];
      list.forEach(mat => {
        Object.values(mat).forEach(value => {
          if (value && value.isTexture) value.dispose?.();
        });
        mat.dispose?.();
      });
    }

    disposeObject(object) {
      object.traverse?.(child => {
        child.geometry?.dispose?.();
        if (child.material) this.disposeMaterial(child.material);
      });
    }

    dispose() {
      this.disposeObject(this.group);
      this.group.removeFromParent();
      this.cloudTextureA?.dispose?.();
      this.cloudTextureB?.dispose?.();
      this.streakTexture?.dispose?.();
      this.cloudGroups = [];
      this.streaks = [];
      this.vortexGroups = [];
      this.markerObjects = [];
      this.lightningLines = [];
    }
  }

  class NeptuneFullExploration {
    constructor(neptuneScene) {
      this.neptune = neptuneScene;
      this.root = document.getElementById("neptune-full-exploration");
      this.entryButton = document.getElementById("neptune-full-explore-button");
      if (!this.neptune || !this.root || !this.entryButton) return;

      this.viewport = document.getElementById("neptune-full-viewport");
      this.inputLayer = document.getElementById("neptune-full-orbit-input");
      this.qualityPanel = document.getElementById("neptune-quality-panel");
      this.qualityOptions = document.getElementById("neptune-quality-options");
      this.qualityClose = document.getElementById("neptune-quality-close");
      this.qualityStart = document.getElementById("neptune-quality-start");
      this.qualityLabel = document.getElementById("neptune-quality-selected-label");
      this.qualityNote = document.getElementById("neptune-quality-device-note");
      this.selector = document.getElementById("neptune-region-selector");
      this.selectorClose = document.getElementById("neptune-region-selector-close");
      this.selectorGrid = document.getElementById("neptune-region-grid");
      this.hudLocation = document.getElementById("neptune-full-hud-location");
      this.hudDepth = document.getElementById("neptune-full-hud-depth");
      this.hudSpeed = document.getElementById("neptune-full-hud-speed");
      this.hudAltitude = document.getElementById("neptune-full-hud-altitude");
      this.hudTarget = document.getElementById("neptune-full-hud-target");
      this.hudPressure = document.getElementById("neptune-full-hud-pressure");
      this.hudType = document.getElementById("neptune-full-hud-region-type");
      this.hudQuality = document.getElementById("neptune-full-hud-quality");
      this.hudData = document.getElementById("neptune-full-hud-data");
      this.objectives = document.getElementById("neptune-objectives-panel");
      this.objectivesRegion = document.getElementById("neptune-objectives-region");
      this.objectivesIntro = document.getElementById("neptune-objectives-intro");
      this.objectivesList = document.getElementById("neptune-objectives-list");
      this.objectivesCount = document.getElementById("neptune-discovery-count");
      this.objectivesBar = document.getElementById("neptune-discovery-bar");
      this.objectivesCollapse = document.getElementById("neptune-objectives-collapse");
      this.objectivesToggle = document.getElementById("neptune-objectives-toggle");
      this.nextTarget = document.getElementById("neptune-next-target");
      this.nextTargetName = document.getElementById("neptune-next-target-name");
      this.nextTargetDistance = document.getElementById("neptune-next-target-distance");
      this.info = document.getElementById("neptune-landmark-card");
      this.infoMinimize = document.getElementById("neptune-landmark-minimize");
      this.infoToggle = document.getElementById("neptune-info-toggle");
      this.infoName = document.getElementById("neptune-landmark-name");
      this.infoType = document.getElementById("neptune-landmark-type");
      this.infoCoords = document.getElementById("neptune-landmark-coords");
      this.infoImage = document.getElementById("neptune-landmark-image");
      this.infoCaption = document.getElementById("neptune-landmark-image-caption");
      this.infoMedia = document.getElementById("neptune-landmark-media");
      this.infoDescription = document.getElementById("neptune-landmark-description");
      this.infoFacts = document.getElementById("neptune-landmark-facts");
      this.infoSource = document.getElementById("neptune-landmark-source");
      this.observationPrompt = document.getElementById("neptune-observation-prompt");
      this.observationPromptTitle = document.getElementById("neptune-observation-prompt-title");
      this.observeButton = document.getElementById("neptune-observe-button");
      this.observationCard = document.getElementById("neptune-observation-card");
      this.observationClose = document.getElementById("neptune-observation-close");
      this.observationTitle = document.getElementById("neptune-observation-title");
      this.observationMeta = document.getElementById("neptune-observation-meta");
      this.observationLead = document.getElementById("neptune-observation-lead");
      this.observationWhy = document.getElementById("neptune-observation-why");
      this.observationDeep = document.getElementById("neptune-observation-deep");
      this.observationSource = document.getElementById("neptune-observation-source");
      this.observationStatus = document.getElementById("neptune-observation-status");
      this.actionsRoot = this.root.querySelector(".venus-full-actions");
      this.actionsMenuToggle = document.getElementById("neptune-actions-menu-toggle");
      this.locationButton = document.getElementById("neptune-location-toggle");
      this.fullscreenButton = document.getElementById("neptune-fullscreen-toggle");
      this.exitButton = document.getElementById("neptune-full-exit");
      this.loading = document.getElementById("neptune-full-loading");
      this.loadingTitle = document.getElementById("neptune-full-loading-title");
      this.loadingStatus = document.getElementById("neptune-full-loading-status");
      this.loadingProgress = document.getElementById("neptune-full-loading-progress");
      this.errorPanel = document.getElementById("neptune-full-error");
      this.errorMessage = document.getElementById("neptune-full-error-message");
      this.errorReturn = document.getElementById("neptune-full-error-return");
      this.tutorial = document.getElementById("neptune-full-tutorial");
      this.tutorialClose = document.getElementById("neptune-tutorial-close");
      this.boundaryHint = document.getElementById("neptune-boundary-hint");
      this.mobileControls = [...this.root.querySelectorAll("[data-neptune-control]")];

      this.state = "idle";
      this.current = null;
      this.selected = DESTINATIONS[0];
      this.discovered = new Set();
      this.activeObservation = null;
      this.nearbyObservation = null;
      this.infoOpen = false;
      this.objectiveOpen = true;
      this.actionsOpen = false;
      this.transitionToken = 0;
      this.renderer = null;
      this.scene = null;
      this.camera = null;
      this.world = null;
      this.THREE = null;
      this.frame = null;
      this.previous = 0;
      this.velocity = null;
      this.moveForward = null;
      this.moveRight = null;
      this.moveIntent = null;
      this.yaw = 0;
      this.pitch = 0;
      this.lookYawTarget = 0;
      this.lookPitchTarget = 0;
      this.drag = null;
      this.keys = new Set();
      this.mobileHeld = new Set();
      this.speed = 0;
      this.recommendedQuality = this.detectRecommendedQuality();
      this.quality = QUALITY[this.readQuality()] || QUALITY[this.recommendedQuality];
      this.resizeHandler = () => this.resize();

      this.buildSelector();
      this.applyQuality(this.quality.name, false);
      this.bind();
      this.neptune.fullExploration = this;
      this.neptune.fullExplorationActive = false;
    }

    detectRecommendedQuality() {
      const memory = Number(navigator.deviceMemory || 4);
      const cores = Number(navigator.hardwareConcurrency || 4);
      const pixels = innerWidth * innerHeight * (devicePixelRatio || 1);
      if (memory <= 2 || cores <= 4 || pixels > 6000000) return "LOW";
      if (memory >= 8 && cores >= 8 && pixels < 5000000) return "HIGH";
      return "MEDIUM";
    }

    readQuality() {
      try { return localStorage.getItem(STORAGE_KEY) || this.recommendedQuality; }
      catch { return this.recommendedQuality; }
    }

    applyQuality(name, persist = true) {
      const key = QUALITY[name] ? name : this.recommendedQuality;
      this.quality = QUALITY[key];
      if (persist) {
        try { localStorage.setItem(STORAGE_KEY, key); } catch {}
      }
      this.qualityOptions?.querySelectorAll("[data-neptune-quality]").forEach(button => {
        const selected = button.dataset.neptuneQuality === key;
        button.classList.toggle("is-selected", selected);
        button.setAttribute("aria-checked", String(selected));
        const recommendation = button.querySelector("[data-quality-recommendation]");
        if (recommendation) recommendation.textContent = button.dataset.neptuneQuality === this.recommendedQuality ? "DIREKOMENDASIKAN" : "";
      });
      if (this.qualityLabel) this.qualityLabel.textContent = this.quality.label;
      if (this.hudQuality) this.hudQuality.textContent = this.quality.label;
      if (this.qualityNote) this.qualityNote.textContent = `Rekomendasi perangkat: ${QUALITY[this.recommendedQuality].label}. Kualitas mengatur jumlah awan, detail udara, detail marker, dan ketajaman mesin gambar 3D.`;
      if (this.renderer) {
        this.renderer.setPixelRatio(Math.min(devicePixelRatio || 1, this.quality.dpr));
        this.resize();
      }
    }

    buildSelector() {
      const fragment = document.createDocumentFragment();
      DESTINATIONS.forEach((destination, index) => {
        const button = document.createElement("button");
        button.type = "button";
        button.className = "venus-region-card neptune-region-card";
        button.dataset.neptuneRegion = destination.id;
        button.innerHTML = `<span class="venus-region-preview neptune-region-preview neptune-region-preview-${destination.preview}" aria-hidden="true"><i></i><b>${destination.short}</b></span><span class="venus-region-index">${String(index + 1).padStart(2, "0")}</span><strong>${destination.name}</strong><span class="venus-region-descriptor">${destination.descriptor}</span><small>${destination.locationLabel}</small><em>${destination.category}</em><span class="venus-region-source">NASA / JPL · Voyager 2 / Hubble / NASA Science</span>`;
        fragment.append(button);
      });
      this.selectorGrid?.replaceChildren(fragment);
      this.selectDestination(this.selected.id);
    }

    selectDestination(id) {
      this.selected = DESTINATIONS.find(destination => destination.id === id) || DESTINATIONS[0];
      this.selectorGrid?.querySelectorAll("[data-neptune-region]").forEach(button => {
        const selected = button.dataset.neptuneRegion === this.selected.id;
        button.classList.toggle("is-selected", selected);
        button.setAttribute("aria-pressed", String(selected));
      });
    }

    bind() {
      this.entryButton.addEventListener("click", () => this.openEntryFlow());
      this.qualityClose?.addEventListener("click", () => this.closeEntryFlow());
      this.qualityStart?.addEventListener("click", () => this.showSelector());
      this.qualityOptions?.addEventListener("click", event => {
        const button = event.target.closest("[data-neptune-quality]");
        if (button) this.applyQuality(button.dataset.neptuneQuality);
      });
      this.selectorClose?.addEventListener("click", () => {
        if (this.state === "selecting-world") this.closeSelectorToWorld();
        else this.closeEntryFlow();
      });
      this.selectorGrid?.addEventListener("click", event => {
        const button = event.target.closest("[data-neptune-region]");
        if (!button) return;
        const destination = DESTINATIONS.find(item => item.id === button.dataset.neptuneRegion);
        if (!destination) return;
        this.selectDestination(destination.id);
        if (this.state === "selecting-world") {
          if (destination.id === this.current?.id) this.closeSelectorToWorld();
          else void this.chooseDestination(destination, true);
        } else void this.chooseDestination(destination, false);
      });
      this.infoMinimize?.addEventListener("click", () => { this.infoOpen = false; this.syncPanels(); });
      this.infoToggle?.addEventListener("click", () => {
        this.setActionsMenu(false);
        this.infoOpen = true;
        this.objectiveOpen = false;
        this.syncPanels();
        this.infoMinimize?.focus({ preventScroll: true });
      });
      this.objectivesCollapse?.addEventListener("click", () => { this.objectiveOpen = false; this.syncPanels(); });
      this.objectivesToggle?.addEventListener("click", () => {
        this.setActionsMenu(false);
        this.objectiveOpen = true;
        this.infoOpen = false;
        this.syncPanels();
        this.objectivesCollapse?.focus({ preventScroll: true });
      });
      this.observeButton?.addEventListener("click", () => this.observeNearby());
      this.observationClose?.addEventListener("click", () => this.closeObservation());
      this.actionsMenuToggle?.addEventListener("click", event => { event.stopPropagation(); this.setActionsMenu(!this.actionsOpen); });
      this.locationButton?.addEventListener("click", () => { this.setActionsMenu(false); this.openSelectorFromWorld(); });
      this.fullscreenButton?.addEventListener("click", () => { this.setActionsMenu(false); void this.toggleFullscreen(); });
      this.exitButton?.addEventListener("click", () => { this.setActionsMenu(false); void this.exit(); });
      this.errorReturn?.addEventListener("click", () => this.forceReset());
      this.tutorialClose?.addEventListener("click", () => this.hideTutorial(true));
      document.addEventListener("fullscreenchange", () => this.updateFullscreenLabel());
      document.addEventListener("pointerdown", event => {
        if (this.actionsOpen && !this.actionsRoot?.contains(event.target)) this.setActionsMenu(false);
      });
      this.bindInput();
      addEventListener("resize", this.resizeHandler, { passive: true });
    }

    bindInput() {
      const movementCodes = new Set(["KeyW", "KeyA", "KeyS", "KeyD", "KeyQ", "KeyE", "ArrowUp", "ArrowDown", "ArrowLeft", "ArrowRight", "ShiftLeft", "ShiftRight"]);
      document.addEventListener("keydown", event => {
        if (!this.neptune.fullExplorationActive) return;
        if (event.key === "Escape") {
          event.preventDefault();
          event.stopImmediatePropagation();
          if (!this.observationCard?.hidden) return this.closeObservation();
          if (this.actionsOpen) return this.setActionsMenu(false);
          if (this.infoOpen) { this.infoOpen = false; this.syncPanels(); return; }
          if (this.objectiveOpen) { this.objectiveOpen = false; this.syncPanels(); return; }
          if (this.state === "selecting-world") return this.closeSelectorToWorld();
          if (this.state === "exploring") void this.exit();
          return;
        }
        if (this.state !== "exploring") return;
        if (event.code === "KeyE" && this.nearbyObservation && !this.observationPrompt.hidden && this.observationCard.hidden) {
          event.preventDefault();
          event.stopImmediatePropagation();
          this.observeNearby();
          return;
        }
        if (!movementCodes.has(event.code)) return;
        event.preventDefault();
        event.stopImmediatePropagation();
        this.keys.add(event.code);
      }, true);
      document.addEventListener("keyup", event => this.keys.delete(event.code), true);

      this.inputLayer?.addEventListener("pointerdown", event => {
        if (this.state !== "exploring" || !this.observationCard.hidden) return;
        if (event.button !== undefined && event.button !== 0) return;

        // Match Venus: desktop uses one click to enter pointer-lock mouse look.
        // Touch keeps drag-look because pointer lock is not appropriate on mobile.
        if (event.pointerType === "mouse") {
          this.hideTutorial(true);
          if (this.inputLayer.requestPointerLock && document.pointerLockElement !== this.inputLayer) {
            try { this.inputLayer.requestPointerLock(); } catch {}
          }
          return;
        }

        this.drag = { id: event.pointerId, x: event.clientX, y: event.clientY };
        try { this.inputLayer.setPointerCapture(event.pointerId); } catch {}
      });
      this.inputLayer?.addEventListener("pointermove", event => {
        if (event.pointerType === "mouse") return;
        if (!this.drag || this.drag.id !== event.pointerId || this.state !== "exploring") return;
        const dx = event.clientX - this.drag.x;
        const dy = event.clientY - this.drag.y;
        this.drag.x = event.clientX;
        this.drag.y = event.clientY;
        this.lookYawTarget -= dx * 0.0037;
        this.lookPitchTarget = clamp(this.lookPitchTarget - dy * 0.0030, -1.18, 1.18);
      });
      document.addEventListener("mousemove", event => {
        if (this.state !== "exploring" || document.pointerLockElement !== this.inputLayer || !this.observationCard.hidden) return;
        this.lookYawTarget -= (event.movementX || 0) * 0.00255;
        this.lookPitchTarget = clamp(this.lookPitchTarget - (event.movementY || 0) * 0.00225, -1.18, 1.18);
      });
      document.addEventListener("pointerlockchange", () => {
        const locked = document.pointerLockElement === this.inputLayer;
        this.root.classList.toggle("is-pointer-locked", locked);
        if (!locked) this.keys.clear();
      });
      const endDrag = event => {
        if (this.drag?.id !== event.pointerId) return;
        this.drag = null;
        try { this.inputLayer.releasePointerCapture(event.pointerId); } catch {}
      };
      this.inputLayer?.addEventListener("pointerup", endDrag);
      this.inputLayer?.addEventListener("pointercancel", endDrag);

      this.mobileControls.forEach(button => {
        const control = button.dataset.neptuneControl;
        const release = event => {
          this.mobileHeld.delete(control);
          try { button.releasePointerCapture(event.pointerId); } catch {}
        };
        button.addEventListener("pointerdown", event => {
          if (this.state !== "exploring" || !this.observationCard.hidden) return;
          event.preventDefault();
          event.stopPropagation();
          try { button.setPointerCapture(event.pointerId); } catch {}
          this.mobileHeld.add(control);
        });
        button.addEventListener("pointerup", release);
        button.addEventListener("pointercancel", release);
        button.addEventListener("lostpointercapture", () => this.mobileHeld.delete(control));
      });
    }

    syncSavedDestinationProgress() {
      for (const destination of DESTINATIONS) {
        try {
          const saved = JSON.parse(localStorage.getItem(`${DISCOVERY_PREFIX}${destination.id}`) || "[]");
          if (Array.isArray(saved) && saved.length > 0) {
            window.AntaraProgress?.trackFull?.("neptune", destination.id, destination.name);
          }
        } catch {}
      }
    }

    openEntryFlow() {
      if (!this.neptune.active || this.neptune.travelMode || this.neptune.fullExplorationActive) return;
      this.syncSavedDestinationProgress();
      if (this.neptune.exploring) this.neptune.exitExploration();
      this.state = "configuring";
      this.neptune.fullExplorationActive = true;
      this.neptune.element.classList.add("is-neptune-full-active");
      document.getElementById("mission")?.classList.add("is-neptune-full");
      this.root.hidden = false;
      this.root.inert = false;
      this.root.setAttribute("aria-hidden", "false");
      this.entryButton.disabled = true;
      this.qualityPanel.hidden = false;
      this.selector.hidden = true;
      if (this.errorPanel) this.errorPanel.hidden = true;
      this.hideWorldUi();
      this.root.classList.remove("is-active", "is-preparing", "is-exiting");
      document.getElementById("announcement").textContent = "Pilih kualitas grafis sebelum masuk ke Eksplorasi Penuh Neptunus.";
    }

    closeEntryFlow() {
      if (!["configuring", "selecting"].includes(this.state)) return;
      this.forceReset();
      requestAnimationFrame(() => this.entryButton.focus({ preventScroll: true }));
    }

    showSelector() {
      if (this.state !== "configuring") return;
      this.applyQuality(this.quality.name);
      this.state = "selecting";
      this.qualityPanel.hidden = true;
      this.selector.hidden = false;
      document.getElementById("announcement").textContent = "Pilih wilayah Neptunus yang ingin kamu jelajahi.";
    }

    async prepareRenderer() {
      if (this.renderer) return;
      await this.neptune.prepare();
      const T = this.neptune.THREE;
      if (!T) throw new Error("WebGL2 tidak tersedia. Jelajah penuh Neptunus memerlukan mesin gambar 3D 3D.");
      this.THREE = T;
      const canvas = document.createElement("canvas");
      canvas.className = "neptune-full-canvas";
      canvas.setAttribute("aria-hidden", "true");
      const context = canvas.getContext("webgl2", { alpha: false, antialias: this.quality.name !== "LOW", powerPreference: "high-performance" });
      if (!context) throw new Error("WebGL2 tidak tersedia pada browser ini.");
      this.renderer = new T.WebGLRenderer({ canvas, context, alpha: false, antialias: this.quality.name !== "LOW" });
      this.renderer.outputColorSpace = T.SRGBColorSpace;
      this.renderer.toneMapping = T.ACESFilmicToneMapping;
      this.renderer.toneMappingExposure = 1.03;
      this.renderer.setPixelRatio(Math.min(devicePixelRatio || 1, this.quality.dpr));
      this.viewport.replaceChildren(canvas);
      this.scene = new T.Scene();
      this.camera = new T.PerspectiveCamera(this.mobileFov(), 1, 0.08, 420);
      this.camera.rotation.order = "YXZ";
      this.velocity = new T.Vector3();
      this.moveForward = new T.Vector3();
      this.moveRight = new T.Vector3();
      this.moveIntent = new T.Vector3();
      this.scene.add(new T.HemisphereLight(0xddeffc, 0x071522, 1.05));
      const key = new T.DirectionalLight(0xd8f2ff, 1.05);
      key.position.set(-35, 50, 24);
      this.scene.add(key);
      this.resize();
    }

    mobileFov() {
      return matchMedia("(max-width: 820px)").matches ? 68 : 62;
    }

    resize() {
      if (!this.renderer || !this.camera || !this.viewport) return;
      const rect = this.viewport.getBoundingClientRect();
      const width = Math.max(1, rect.width || innerWidth);
      const height = Math.max(1, rect.height || innerHeight);
      this.renderer.setSize(width, height, false);
      this.camera.aspect = width / height;
      this.camera.fov = this.mobileFov();
      this.camera.updateProjectionMatrix();
    }

    showLoading(title, status, progress = 5) {
      this.hideWorldUi();
      this.loading.hidden = false;
      this.loadingTitle.textContent = title;
      this.loadingStatus.textContent = status;
      this.loadingProgress.style.width = `${progress}%`;
    }

    async loadingSequence(token, label) {
      const reduced = matchMedia("(prefers-reduced-motion: reduce)").matches;
      const stages = reduced ? [[100, 50, "SIAP TERBANG"]] : [
        [22, 180, "MEMUAT DATA WILAYAH"],
        [48, 220, "MEMBENTUK LINGKUNGAN 3D"],
        [71, 220, "MENYIAPKAN GERAKAN LOKAL"],
        [91, 200, "MENGUNCI BATAS EKSPLORASI"],
        [100, 180, "SIAP MENJELAJAH"]
      ];
      for (const [progress, time, text] of stages) {
        if (token !== this.transitionToken) return;
        this.loadingStatus.textContent = text;
        this.loadingProgress.style.width = `${progress}%`;
        await delay(time);
      }
      if (this.loadingTitle) this.loadingTitle.textContent = label;
    }

    async chooseDestination(destination, switching) {
      if (!switching && !["selecting", "configuring"].includes(this.state)) return;
      if (switching && this.state !== "selecting-world") return;
      const token = ++this.transitionToken;
      this.state = "preparing";
      this.current = destination;
      this.selectDestination(destination.id);
      this.selector.hidden = true;
      this.qualityPanel.hidden = true;
      if (this.errorPanel) this.errorPanel.hidden = true;
      this.root.classList.add("is-preparing");
      this.showLoading(`MEMASUKI ${destination.name.toUpperCase()}`, "MENYIAPKAN LINGKUNGAN", 7);
      try {
        await this.prepareRenderer();
        if (token !== this.transitionToken) return;
        this.disposeWorld();
        this.scene.fog = new this.THREE.FogExp2(destination.palette.fog, destination.palette.fogDensity);
        this.renderer.setClearColor(destination.palette.sky, 1);
        this.renderer.toneMappingExposure = destination.id === "dark-spot" ? 1.06 : 1.02;
        this.world = new NeptuneAtmosphereWorld(this.THREE, this.scene, this.renderer, destination, this.quality);
        this.loadDiscoveryState();
        this.setCamera(destination.spawn, switching ? 1 : 0);
        this.updateRegionUI();
        this.buildObjectives();
        await this.loadingSequence(token, destination.name);
        if (token !== this.transitionToken) return;
        this.loading.hidden = true;
        this.root.classList.remove("is-preparing");
        this.root.classList.add("is-active");
        this.state = "exploring";
        window.AntaraProgress?.trackFull?.("neptune", destination.id, destination.name);
        if (this.actionsRoot) this.actionsRoot.hidden = false;
        const compactUi = this.isMobileUi();
        this.infoOpen = !compactUi;
        this.objectiveOpen = !compactUi;
        this.actionsOpen = false;
        this.syncPanels();
        this.startLoop();
        this.showTutorial();
        document.getElementById("announcement").textContent = `Tiba di ${destination.name}. Kamu sekarang menjelajahi tampilan 3D 3D Neptunus.`;
      } catch (error) {
        console.error("Neptune Full Exploration failed", error);
        if (token !== this.transitionToken) return;
        this.showError(error);
      }
    }

    setCamera(spawn, switching = 0) {
      const T = this.THREE;
      this.camera.position.set(spawn.x, spawn.y + (switching ? 3 : 14), spawn.z + (switching ? 4 : 18));
      this.yaw = spawn.yaw;
      this.pitch = spawn.pitch;
      this.lookYawTarget = this.yaw;
      this.lookPitchTarget = this.pitch;
      this.camera.rotation.set(this.pitch, this.yaw, 0, "YXZ");
      this.velocity.set(0, 0, 0);
      this.speed = 0;
      this.camera.up.set(0, 1, 0);
      this.tmpDirection = new T.Vector3();
    }

    startLoop() {
      if (this.frame) return;
      this.previous = performance.now();
      const tick = now => {
        this.frame = null;
        if (!["exploring", "exiting"].includes(this.state) || !this.renderer || !this.camera || !this.scene) return;
        const delta = Math.min(0.045, Math.max(0.001, (now - this.previous) / 1000));
        this.previous = now;
        if (this.state === "exploring") {
          this.updateLook(delta);
          this.updateMovement(delta);
          this.updateEducation();
          this.updateHUD();
        }
        this.world?.update(delta, this.camera, this.discovered);
        this.renderer.render(this.scene, this.camera);
        this.frame = requestAnimationFrame(tick);
      };
      this.frame = requestAnimationFrame(tick);
    }

    stopLoop() {
      if (this.frame) cancelAnimationFrame(this.frame);
      this.frame = null;
    }

    updateLook(delta) {
      const response = 1 - Math.exp(-delta * 13);
      this.yaw += (this.lookYawTarget - this.yaw) * response;
      this.pitch += (this.lookPitchTarget - this.pitch) * response;
      const turbulence = this.current?.turbulence || 0;
      const roll = Math.sin(performance.now() * 0.0017) * 0.004 * turbulence + Math.sin(performance.now() * 0.0031) * 0.002 * turbulence;
      this.camera.rotation.set(this.pitch, this.yaw, roll, "YXZ");
    }

    movementAxes() {
      let forward = 0, strafe = 0, vertical = 0;
      if (this.keys.has("KeyW") || this.keys.has("ArrowUp") || this.mobileHeld.has("forward")) forward += 1;
      if (this.keys.has("KeyS") || this.keys.has("ArrowDown") || this.mobileHeld.has("backward")) forward -= 1;
      if (this.keys.has("KeyA") || this.keys.has("ArrowLeft") || this.mobileHeld.has("left")) strafe -= 1;
      if (this.keys.has("KeyD") || this.keys.has("ArrowRight") || this.mobileHeld.has("right")) strafe += 1;
      if ((this.keys.has("KeyE") && !(this.nearbyObservation && !this.observationPrompt.hidden)) || this.mobileHeld.has("up")) vertical += 1;
      if (this.keys.has("KeyQ") || this.mobileHeld.has("down")) vertical -= 1;
      return { forward, strafe, vertical };
    }

    updateMovement(delta) {
      if (!this.world || !this.camera) return;
      const axes = this.movementAxes();
      let forward = axes.forward;
      let strafe = axes.strafe;
      const mag = Math.hypot(forward, strafe);
      if (mag > 1) { forward /= mag; strafe /= mag; }
      const boost = this.keys.has("ShiftLeft") || this.keys.has("ShiftRight") ? 1.9 : 1;
      const baseSpeed = 8.4 * boost;
      this.camera.getWorldDirection(this.moveForward);
      this.moveForward.y = 0;
      if (this.moveForward.lengthSq() < 0.001) this.moveForward.set(0, 0, -1);
      this.moveForward.normalize();
      this.moveRight.crossVectors(this.moveForward, this.camera.up).normalize();
      this.moveIntent.set(0, 0, 0).addScaledVector(this.moveForward, forward).addScaledVector(this.moveRight, strafe);
      if (this.moveIntent.lengthSq() > 1) this.moveIntent.normalize();

      const radial = Math.hypot(this.camera.position.x, this.camera.position.z);
      const edge = smoothstep((radial - this.world.softBoundaryStart) / Math.max(1, this.world.playRadius - this.world.softBoundaryStart));
      const radialX = radial > 0.001 ? this.camera.position.x / radial : 0;
      const radialZ = radial > 0.001 ? this.camera.position.z / radial : 0;
      const outward = Math.max(0, this.moveIntent.x * radialX + this.moveIntent.z * radialZ);
      const boundaryScale = 1 - edge * outward * 0.94;
      const wind = this.current.wind;
      const turbulence = this.current.turbulence;
      const targetX = this.moveIntent.x * baseSpeed * boundaryScale + wind.x * 0.42;
      const targetZ = this.moveIntent.z * baseSpeed * boundaryScale + wind.z * 0.42;
      const verticalScale = axes.vertical > 0 && this.camera.position.y > this.world.maxY - 8 ? smoothstep((this.world.maxY - this.camera.position.y) / 8) : 1;
      const lowerScale = axes.vertical < 0 && this.camera.position.y < this.world.minY + 8 ? smoothstep((this.camera.position.y - this.world.minY) / 8) : 1;
      const targetY = axes.vertical * 5.4 * Math.min(verticalScale, lowerScale) + Math.sin(performance.now() * 0.0027) * 0.08 * turbulence;
      const response = 1 - Math.exp(-delta * (mag || axes.vertical ? 7.8 : 4.8));
      this.velocity.x += (targetX - this.velocity.x) * response;
      this.velocity.y += (targetY - this.velocity.y) * response;
      this.velocity.z += (targetZ - this.velocity.z) * response;

      let nextX = this.camera.position.x + this.velocity.x * delta;
      let nextY = this.camera.position.y + this.velocity.y * delta;
      let nextZ = this.camera.position.z + this.velocity.z * delta;
      const nextRadius = Math.hypot(nextX, nextZ);
      if (nextRadius > this.world.playRadius) {
        const scale = this.world.playRadius / nextRadius;
        nextX *= scale;
        nextZ *= scale;
        this.velocity.x *= 0.24;
        this.velocity.z *= 0.24;
      }
      if (nextY > this.world.maxY) { nextY = this.world.maxY; if (this.velocity.y > 0) this.velocity.y *= 0.12; }
      if (nextY < this.world.minY) { nextY = this.world.minY; if (this.velocity.y < 0) this.velocity.y *= 0.12; }
      this.camera.position.set(nextX, nextY, nextZ);
      this.speed = this.velocity.length() * 35;

      const boundary = this.world.boundaryFactor(this.camera.position);
      if (this.boundaryHint) {
        this.boundaryHint.classList.toggle("is-visible", boundary > 0.3);
        if (boundary > 0.3) {
          const atmospheric = ["super-winds", "dark-spot", "methane-clouds"].includes(this.current?.id);
          if (this.camera.position.y < this.world.minY + 5) this.boundaryHint.textContent = atmospheric ? "BATAS TEKANAN TAMPILAN 3D · KONDISI MAKIN SANGAT BERAT" : "BATAS KORIDOR BAWAH · AUTOPILOT MEMBALIKKAN ROBOT ANTARIKSA";
          else if (this.camera.position.y > this.world.maxY - 5) this.boundaryHint.textContent = atmospheric ? "BATAS LAPISAN ATAS · ARUS MEMBALIKKAN ROBOT ANTARIKSA" : "BATAS KORIDOR ATAS · AUTOPILOT MEMBALIKKAN ROBOT ANTARIKSA";
          else this.boundaryHint.textContent = boundary > 0.82 ? (atmospheric ? "BATAS EKSPLORASI · ARUS MEMBALIKKAN ROBOT ANTARIKSA" : "BATAS EKSPLORASI · AUTOPILOT MENGOREKSI JALUR") : "MENDEKATI BATAS EKSPLORASI";
        }
      }
    }

    updateEducation() {
      if (!this.current || !this.camera) return;
      let nearest = null;
      let nearestDistance = Infinity;
      this.current.observations.forEach(observation => {
        const [x, y, z] = observation.position;
        const distance = Math.hypot(this.camera.position.x - x, this.camera.position.y - y, this.camera.position.z - z);
        if (distance < nearestDistance) { nearestDistance = distance; nearest = observation; }
      });
      const reachable = nearest && nearestDistance <= nearest.radius;
      this.nearbyObservation = reachable ? nearest : null;
      const overlayPanelOpen = this.infoOpen || this.objectiveOpen || this.actionsOpen;
      if (reachable && this.observationCard.hidden && !overlayPanelOpen) {
        this.observationPrompt.hidden = false;
        this.observationPromptTitle.textContent = nearest.name;
      } else {
        this.observationPrompt.hidden = true;
      }
      const next = this.current.observations.find(obs => !this.discovered.has(obs.id));
      if (this.nextTargetName) this.nextTargetName.textContent = next ? next.name : "Semua temuan selesai!";
      if (this.nextTargetDistance) {
        if (!next) this.nextTargetDistance.textContent = "Semua titik edukasi wilayah ini sudah kamu amati.";
        else {
          const [x, y, z] = next.position;
          const distance = Math.hypot(this.camera.position.x - x, this.camera.position.y - y, this.camera.position.z - z);
          this.nextTargetDistance.textContent = `${distance.toFixed(distance < 10 ? 1 : 0)} unit tampilan 3D · dekati penanda`;
        }
      }
    }

    observeNearby() {
      const observation = this.nearbyObservation;
      if (!observation || this.state !== "exploring") return;
      const fresh = !this.discovered.has(observation.id);
      this.discovered.add(observation.id);
      this.saveDiscoveryState();
      this.activeObservation = observation;
      this.observationPrompt.hidden = true;
      this.observationTitle.textContent = observation.name;
      this.observationMeta.textContent = `${observation.category} · ${this.current.name}`;
      this.observationLead.textContent = observation.lead;
      this.observationWhy.textContent = observation.why;
      this.observationDeep.replaceChildren(...observation.facts.map(fact => {
        const p = document.createElement("p");
        p.textContent = fact;
        return p;
      }));
      this.observationSource.href = observation.source;
      this.observationStatus.textContent = fresh ? "BARU KAMU AMATI" : "SUDAH PERNAH DIAMATI";
      this.observationCard.hidden = false;
      this.observationCard.setAttribute("aria-hidden", "false");
      this.releasePointerLock();
      this.keys.clear();
      this.mobileHeld.clear();
      this.buildObjectives();
      this.syncPanels();
      document.getElementById("announcement").textContent = `${observation.name} berhasil diamati.`;
    }

    closeObservation() {
      if (!this.observationCard || this.observationCard.hidden) return;
      this.observationCard.hidden = true;
      this.observationCard.setAttribute("aria-hidden", "true");
      this.activeObservation = null;
      this.syncPanels();
    }

    discoveryStorageKey() {
      return `${DISCOVERY_PREFIX}${this.current?.id || "none"}`;
    }

    loadDiscoveryState() {
      this.discovered = new Set();
      if (!this.current) return;
      try {
        const parsed = JSON.parse(localStorage.getItem(this.discoveryStorageKey()) || "[]");
        const allowed = new Set(this.current.observations.map(obs => obs.id));
        parsed.filter(id => allowed.has(id)).forEach(id => this.discovered.add(id));
      } catch {}
    }

    saveDiscoveryState() {
      try { localStorage.setItem(this.discoveryStorageKey(), JSON.stringify([...this.discovered])); } catch {}
    }

    buildObjectives() {
      if (!this.current || !this.objectivesList) return;
      if (this.objectivesRegion) this.objectivesRegion.textContent = this.current.name;
      if (this.objectivesIntro) this.objectivesIntro.textContent = "Terbang mendekati penanda sains. Saat cukup dekat, tekan E atau tombol AMATI untuk mencatat temuan.";
      const fragment = document.createDocumentFragment();
      this.current.observations.forEach((observation, index) => {
        const done = this.discovered.has(observation.id);
        const li = document.createElement("li");
        li.className = done ? "is-complete" : "";
        li.innerHTML = `<span class="venus-objective-marker">${done ? "✓" : String(index + 1).padStart(2, "0")}</span><div><strong>${observation.name}</strong><small>${done ? "SUDAH DIAMATI" : observation.category}</small></div>`;
        fragment.append(li);
      });
      this.objectivesList.replaceChildren(fragment);
      const total = this.current.observations.length;
      const count = this.discovered.size;
      this.objectivesCount.textContent = `${count} / ${total}`;
      this.objectivesBar.style.width = `${total ? count / total * 100 : 0}%`;
      this.objectivesToggle.textContent = `TUJUAN · ${count} / ${total}`;
      this.objectivesToggle.setAttribute("aria-label", `Buka tujuan eksplorasi Neptunus, ${count} dari ${total} selesai`);
    }

    updateRegionUI() {
      const destination = this.current;
      if (!destination) return;
      this.hudLocation.textContent = destination.name;
      this.hudType.textContent = destination.category;
      this.hudQuality.textContent = this.quality.label;
      this.hudData.textContent = "NASA / JPL · VOYAGER 2 · MODEL SEDERHANA NEPTUNUS";
      this.infoName.textContent = destination.name;
      this.infoType.textContent = `${destination.category} · ${destination.descriptor}`;
      this.infoCoords.textContent = destination.locationLabel;
      this.infoImage.src = destination.image;
      this.infoImage.alt = destination.imageAlt;
      this.infoCaption.textContent = destination.imageCaption;
      this.infoMedia.href = destination.source;
      this.infoDescription.textContent = destination.lead;
      this.infoFacts.replaceChildren(...destination.facts.map(fact => {
        const li = document.createElement("li");
        li.textContent = fact;
        return li;
      }));
      this.infoSource.href = destination.source;
    }

    updateHUD() {
      if (!this.world || !this.camera) return;
      const pressure = this.world.pressureAt(this.camera.position.y);
      const depth = this.world.maxY - this.camera.position.y;
      this.hudDepth.textContent = `${depth.toFixed(1)} KM CUKUP · ${this.world.layerAtPressure(pressure)}`;
      this.hudSpeed.textContent = `${Math.round(this.speed)} M/S SIM`;
      const altitude = Math.max(0, this.camera.position.y - this.world.minY);
      if (this.hudAltitude) this.hudAltitude.textContent = `${altitude.toFixed(1)} KM CUKUP`;
      const remaining = this.current?.observations?.filter(obs => !this.discovered.has(obs.id)) || [];
      if (this.hudTarget) {
        if (!remaining.length) this.hudTarget.textContent = "SELESAI";
        else {
          let nearestDistance = Infinity;
          for (const obs of remaining) {
            const [x, y, z] = obs.position;
            nearestDistance = Math.min(nearestDistance, Math.hypot(this.camera.position.x - x, this.camera.position.y - y, this.camera.position.z - z));
          }
          this.hudTarget.textContent = `${nearestDistance.toFixed(nearestDistance < 10 ? 1 : 0)} UNIT`;
        }
      }
      if (["rings-arcs", "triton"].includes(this.current.id)) {
        this.hudPressure.textContent = this.current.id === "rings-arcs" ? "VAKUM · RING SIM" : "VAKUM · TERBANG LEWAT DEKAT";
      } else {
        this.hudPressure.textContent = `${pressure.toFixed(pressure < 1 ? 2 : 1)} BAR SIM`;
      }
      this.hudLocation.textContent = this.current.name;
      this.hudType.textContent = this.current.category;
      this.hudQuality.textContent = this.quality.label;
    }

    isMobileUi() {
      return matchMedia("(max-width: 820px), (pointer: coarse) and (max-width: 1100px)").matches;
    }

    syncPanels() {
      const exploring = this.state === "exploring";
      const observationOpen = !this.observationCard.hidden;
      const mobile = this.isMobileUi();
      let showInfo = exploring && this.infoOpen && !observationOpen;
      let showObjectives = exploring && this.objectiveOpen && !observationOpen;
      if (mobile && showInfo && showObjectives) {
        this.objectiveOpen = false;
        showObjectives = false;
      }
      const mobileSecondaryOpen = mobile && (showInfo || showObjectives);
      this.info.hidden = !showInfo;
      this.info.classList.toggle("is-visible", showInfo);
      this.info.setAttribute("aria-hidden", String(!showInfo));
      this.infoToggle.hidden = !exploring || showInfo || observationOpen || this.actionsOpen || mobileSecondaryOpen;
      this.objectives.hidden = !showObjectives;
      this.objectives.setAttribute("aria-hidden", String(!showObjectives));
      this.objectivesToggle.hidden = !exploring || showObjectives || observationOpen || this.actionsOpen || mobileSecondaryOpen;
      this.actionsRoot.hidden = !exploring;
      this.root.classList.toggle("is-info-open", showInfo);
      this.root.classList.toggle("is-objectives-open", showObjectives);
      this.root.classList.toggle("is-observation-open", observationOpen);
    }

    releasePointerLock() {
      if (document.pointerLockElement === this.inputLayer) {
        try { document.exitPointerLock?.(); } catch {}
      }
      this.root.classList.remove("is-pointer-locked");
      this.drag = null;
    }

    hideWorldUi() {
      this.releasePointerLock();
      this.keys.clear();
      this.mobileHeld.clear();
      this.drag = null;
      this.actionsRoot.hidden = true;
      this.info.hidden = true;
      this.objectives.hidden = true;
      this.infoToggle.hidden = true;
      this.objectivesToggle.hidden = true;
      this.observationPrompt.hidden = true;
      this.observationCard.hidden = true;
      this.boundaryHint?.classList.remove("is-visible");
    }

    openSelectorFromWorld() {
      if (this.state !== "exploring") return;
      this.releasePointerLock();
      this.keys.clear();
      this.mobileHeld.clear();
      this.state = "selecting-world";
      this.selector.hidden = false;
      this.info.hidden = true;
      this.objectives.hidden = true;
      this.infoToggle.hidden = true;
      this.objectivesToggle.hidden = true;
      this.observationPrompt.hidden = true;
      this.closeObservation();
    }

    closeSelectorToWorld() {
      if (this.state !== "selecting-world") return;
      this.state = "exploring";
      this.selector.hidden = true;
      this.syncPanels();
    }

    setActionsMenu(open) {
      const mobile = this.isMobileUi();
      const observationOpen = Boolean(this.observationCard && !this.observationCard.hidden);
      this.actionsOpen = Boolean(open && mobile && this.state === "exploring" && !observationOpen);
      if (this.actionsOpen) {
        this.infoOpen = false;
        this.objectiveOpen = false;
        this.releasePointerLock();
        this.keys.clear();
        this.mobileHeld.clear();
      }
      this.actionsRoot.classList.toggle("is-open", this.actionsOpen);
      this.root.classList.toggle("is-actions-open", this.actionsOpen);
      this.actionsMenuToggle.setAttribute("aria-expanded", String(this.actionsOpen));
      this.syncPanels();
    }

    async toggleFullscreen() {
      try {
        if (document.fullscreenElement) await document.exitFullscreen();
        else await this.root.requestFullscreen();
      } catch {}
      this.updateFullscreenLabel();
    }

    updateFullscreenLabel() {
      const span = this.fullscreenButton?.querySelector("span");
      if (span) span.textContent = document.fullscreenElement ? "Keluar layar penuh" : "Layar penuh";
      this.fullscreenButton?.setAttribute("aria-pressed", String(Boolean(document.fullscreenElement)));
    }

    showTutorial() {
      this.tutorial.classList.add("is-visible");
      window.clearTimeout(this.tutorialTimeout);
      this.tutorialTimeout = window.setTimeout(() => this.hideTutorial(false), 9000);
    }

    hideTutorial() {
      this.tutorial.classList.remove("is-visible");
      window.clearTimeout(this.tutorialTimeout);
    }

    showError(error) {
      console.warn("Neptune Full Exploration:", error);
      this.forceReset();
      document.getElementById("announcement").textContent = "Kembali ke panorama Neptunus.";
    }

    async exit() {
      if (!["exploring", "selecting-world"].includes(this.state)) return;
      const token = ++this.transitionToken;
      this.state = "exiting";
      this.root.classList.add("is-exiting");
      this.selector.hidden = true;
      this.hideWorldUi();
      this.keys.clear();
      this.mobileHeld.clear();
      const start = performance.now();
      const duration = matchMedia("(prefers-reduced-motion: reduce)").matches ? 100 : 760;
      const startPos = this.camera?.position.clone();
      const startFov = this.camera?.fov || 62;
      await new Promise(resolve => {
        const frame = now => {
          if (token !== this.transitionToken || !this.camera || !startPos) return resolve();
          const t = clamp((now - start) / duration, 0, 1);
          const eased = smoothstep(t);
          this.camera.position.x = lerp(startPos.x, startPos.x * 0.25, eased);
          this.camera.position.y = lerp(startPos.y, this.world ? this.world.maxY + 24 : startPos.y + 24, eased);
          this.camera.position.z = lerp(startPos.z, startPos.z + 54, eased);
          this.camera.fov = lerp(startFov, 42, eased);
          this.camera.updateProjectionMatrix();
          if (t < 1) requestAnimationFrame(frame); else resolve();
        };
        requestAnimationFrame(frame);
      });
      if (token !== this.transitionToken) return;
      this.forceReset();
      document.getElementById("announcement").textContent = "Kembali ke panorama Neptunus.";
      requestAnimationFrame(() => this.entryButton.focus({ preventScroll: true }));
    }

    disposeWorld() {
      this.world?.dispose?.();
      this.world = null;
    }

    disposeRenderer() {
      this.stopLoop();
      this.disposeWorld();
      if (this.scene) {
        [...this.scene.children].forEach(child => {
          if (child.isLight) this.scene.remove(child);
        });
      }
      this.renderer?.dispose?.();
      this.renderer?.forceContextLoss?.();
      this.renderer = null;
      this.scene = null;
      this.camera = null;
      this.THREE = null;
      this.viewport?.replaceChildren();
    }

    forceReset() {
      ++this.transitionToken;
      this.stopLoop();
      this.hideTutorial(false);
      this.releasePointerLock();
      this.disposeRenderer();
      this.state = "idle";
      this.current = null;
      this.nearbyObservation = null;
      this.activeObservation = null;
      this.infoOpen = false;
      this.objectiveOpen = true;
      this.actionsOpen = false;
      this.root.classList.remove("is-active", "is-preparing", "is-exiting", "is-info-open", "is-objectives-open", "is-observation-open", "is-actions-open");
      this.root.hidden = true;
      this.root.inert = true;
      this.root.setAttribute("aria-hidden", "true");
      this.qualityPanel.hidden = true;
      this.selector.hidden = true;
      this.loading.hidden = true;
      if (this.errorPanel) this.errorPanel.hidden = true;
      this.observationPrompt.hidden = true;
      this.observationCard.hidden = true;
      this.info.hidden = true;
      this.objectives.hidden = true;
      this.infoToggle.hidden = true;
      this.objectivesToggle.hidden = true;
      this.actionsRoot.hidden = true;
      this.boundaryHint?.classList.remove("is-visible");
      this.neptune.fullExplorationActive = false;
      this.neptune.element.classList.remove("is-neptune-full-active");
      document.getElementById("mission")?.classList.remove("is-neptune-full");
      this.entryButton.disabled = false;
      this.neptune.caption.inert = false;
      this.neptune.resize?.();
    }
  }

  window.NeptuneFullExploration = NeptuneFullExploration;
  window.ANTARA_NEPTUNE_FULL_DESTINATIONS = DESTINATIONS;
})();
