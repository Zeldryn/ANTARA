"use strict";

(() => {
  const STORAGE_KEY = "antara-saturn-full-quality-v3";
  const DISCOVERY_PREFIX = "antara-saturn-mode terbang-discovery-v1:";
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
    facts: "https://science.nasa.gov/saturn/facts/",
    hexagon: "https://science.nasa.gov/photojournal/nasa-cassinis-last-look-at-saturns-hexagon/",
    storms: "https://science.nasa.gov/photojournal/saturn-storm/",
    rings: "https://science.nasa.gov/photojournal/true-colors-of-saturns-rings/",
    titan: "https://science.nasa.gov/photojournal/titans-surface/",
    enceladus: "https://science.nasa.gov/photojournal/high-phase-plumes/",
    cassini: "https://science.nasa.gov/mission/cassini/about-the-mission/"
  });

  const DESTINATIONS = Object.freeze([
    {
      id: "hexagon",
      name: "Hexagon Kutub Utara",
      short: "HEXAGON",
      category: "ARUS ANGIN CEPAT POLAR",
      descriptor: "Terbang di atas pola enam sisi raksasa di kutub Saturnus",
      locationLabel: "Kutub utara Saturnus",
      preview: "hexagon",
      image: "./assets/saturn-hexagon-diagram.svg",
      imageAlt: "Diagram edukasi hexagon kutub utara Saturnus",
      imageCaption: "Hexagon kutub utara · ANTARA berbasis Cassini",
      source: SOURCES.hexagon,
      lead: "Saturnus tidak punya tanah untuk didarati. Di wilayah kutub utara, kamu terbang di atas pola arus angin cepat raksasa berbentuk enam sisi yang mengurung badai kutub di tengahnya.",
      facts: [
        "Hexagon adalah pola gelombang udara, bukan bangunan atau benda padat.",
        "Lebarnya sekitar 30.000 kilometer sehingga lebih besar dari diameter Bumi.",
        "Voyager pertama kali melihatnya, lalu Cassini mengamatinya jauh lebih detail."
      ],
      palette: { sky: 0x293745, fog: 0x5d7383, fogDensity: 0.012, cloud: "#d9dfdd", cloud2: "#83929c", accent: 0xc7d7df, lightning: 0xeef7ff },
      wind: { x: 0.45, z: 0.72 },
      turbulence: 1.05,
      spawn: { x: -20, y: 14, z: 42, yaw: Math.PI * 0.88, pitch: -0.08 },
      observations: [
        { id: "hexagon-edge", name: "Tepi Hexagon", category: "BATAS GELOMBANG", position: [4, 8, -15], radius: 11, source: SOURCES.hexagon, lead: "Garis sudut pada hexagon menandai jalur arus angin cepat yang cukup tetap di udara utara Saturnus.", why: "Bentuk hampir geometris seperti ini sangat jarang pada udara planet dan membantu ilmuwan menguji model bahan yang bisa mengalir berputar cepat.", facts: ["Hexagon bukan permukaan padat.", "Ia tersusun dari aliran udara dan perbedaan kecepatan angin.", "Bentuknya bisa bertahan sangat lama."] },
        { id: "hexagon-pusaran badai", name: "Pusaran Kutub", category: "POLAR PUSARAN BADAI", position: [-26, -2, 7], radius: 10, source: SOURCES.hexagon, lead: "Di tengah hexagon terdapat badai kutub yang berputar cepat.", why: "Pusaran ini menunjukkan kutub Saturnus bukan wilayah tenang, melainkan pusat gerakan cuaca skala besar.", facts: ["Cassini melihat mata badai kutub di pusat bentuk ini.", "Awan di sekitarnya bergerak sangat cepat.", "Pusaran membantu membuat peta energi di kutub Saturnus."] },
        { id: "hexagon-kabut tipis", name: "Kabut Tinggi", category: "KABUT TIPIS", position: [24, 18, 20], radius: 9, source: SOURCES.facts, lead: "Lapisan kabut halus menutupi bagian atas udara dan memperlembut tampilan warna Saturnus.", why: "Kabut atas membantu ilmuwan melihat bentuk atas-bawah udara dan perubahan musim Saturnus.", facts: ["Udara atas Saturnus tampak lebih lembut daripada Jupiter.", "Butiran kecil di udara dan butiran kecil menyebarkan cahaya Matahari.", "Warna kutub dapat berubah menurut musim."] }
      ]
    },
    {
      id: "storms",
      name: "Pita Awan & Badai Besar",
      short: "STORMS",
      category: "ARUS ANGIN CEPAT DI SELURUH PLANET",
      descriptor: "Masuk ke pita awan pucat dan sel badai Saturnus",
      locationLabel: "Lintang tengah Saturnus",
      preview: "rings",
      image: "./assets/saturn-atmosphere-diagram.svg",
      imageAlt: "Diagram edukasi udara Saturnus",
      imageCaption: "Udara Saturnus · ANTARA berbasis NASA",
      source: SOURCES.storms,
      lead: "Warna Saturnus tampak lebih lembut dibanding Jupiter. Tapi udaranya tetap penuh pita, gelombang, dan badai yang digerakkan angin sangat cepat.",
      facts: [
        "Arus angin cepat ekuatorial Saturnus dapat bergerak sangat cepat.",
        "Planet ini kadang memunculkan badai besar musiman yang dikenal sebagai Great White Spot.",
        "Tidak ada permukaan padat. semua yang kamu lihat adalah lapisan udara."
      ],
      palette: { sky: 0x5d5648, fog: 0x95846d, fogDensity: 0.0105, cloud: "#ece2cb", cloud2: "#b19879", accent: 0xe3d0ad, lightning: 0xffefd4 },
      wind: { x: 1.28, z: 0.22 },
      turbulence: 0.82,
      spawn: { x: -32, y: 7, z: 40, yaw: Math.PI * 0.84, pitch: -0.04 },
      observations: [
        { id: "storms-belt", name: "Pita Awan", category: "BELT / ZONE", position: [10, 12, -6], radius: 10, source: SOURCES.facts, lead: "Pita terang dan lebih gelap di Saturnus berasal dari sirkulasi udara pada lintang berbeda.", why: "Membandingkan pita awan membuat kita lebih mudah tahu bagaimana putaran cepat mengatur cuaca skala planet.", facts: ["Pita Saturnus biasanya lebih halus daripada milik Jupiter.", "Isi awan atas tetap paling banyak berisi es gas bernama amonia.", "Warna dan perbedaan bisa berubah mengikuti musim."] },
        { id: "storms-cell", name: "Sel Badai", category: "PANAS NAIK DAN TURUN", position: [-18, -6, -18], radius: 10, source: SOURCES.storms, lead: "Sel badai ini mewakili wilayah gerakan panas naik dan turun yang mengangkat bahan dari lapisan lebih dalam.", why: "Badai membantu memindahkan panas dari bagian dalam Saturnus ke udara atas.", facts: ["Great White Spot adalah contoh badai raksasa periodik Saturnus.", "Gerakan panas naik dan turun kuat dapat mengubah pola awan dalam waktu cukup singkat.", "Data Cassini membantu membuat peta bentuk badai seperti ini."] },
        { id: "storms-deep", name: "Lapisan Lebih Dalam", category: "TEKANAN", position: [28, -20, 19], radius: 10, source: SOURCES.facts, lead: "Semakin turun, tekanan naik dan jenis awan berubah dari es gas bernama amonia menuju lapisan yang lebih hangat dan rapat.", why: "Bentuk atas-bawah udara membuat ilmuwan lebih mudah tahu isi, suhu, dan energi internal Saturnus.", facts: ["Bagian atas udara mengandung es gas bernama amonia.", "Di bawahnya dapat terbentuk awan ammonium hydrosulfide dan air.", "Tidak ada garis batas tegas antara udara dan bagian dalam Saturnus."] }
      ]
    },
    {
      id: "rings",
      name: "Cincin & Cassini Division",
      short: "RINGS",
      category: "BUTIRAN ES",
      descriptor: "Terbang sejajar bidang cincin dan melewati celah Cassini Division",
      locationLabel: "Bidang cincin Saturnus",
      preview: "cassini",
      image: "./assets/saturn-rings-diagram.svg",
      imageAlt: "Diagram edukasi cincin Saturnus",
      imageCaption: "Sistem cincin Saturnus · ANTARA berbasis Cassini",
      source: SOURCES.rings,
      lead: "Di sini kamu tidak menginjak tanah. Kamu terbang di jalur jelajah yang meniru bidang cincin Saturnus: hamparan butiran kecil es, celah, dan bayangan yang membelah cahaya.",
      facts: [
        "Cincin Saturnus tersusun dari butiran kecil es, debu, dan pecahan batu dengan ukuran beragam.",
        "Cassini Division adalah celah besar antara cincin A dan B.",
        "Banyak bagian cincin sangat lebar namun ketebalannya kecil dibanding lebarnya."
      ],
      palette: { sky: 0x141921, fog: 0x394757, fogDensity: 0.007, cloud: "#d6d1c2", cloud2: "#8e897b", accent: 0xe7e0cd, lightning: 0xfdf9ee },
      wind: { x: 0.18, z: -0.05 },
      turbulence: 0.35,
      spawn: { x: -24, y: 2, z: 46, yaw: Math.PI * 0.9, pitch: -0.03 },
      observations: [
        { id: "rings-a", name: "A Ring", category: "RING PLANE", position: [8, 1, -16], radius: 10, source: SOURCES.rings, lead: "Bagian ini mewakili salah satu sabuk cincin terang yang kaya butiran kecil es.", why: "Cincin menunjukkan bagaimana gaya tarikan dan tabrakan kecil membentuk bentuk sangat tipis tetapi sangat luas.", facts: ["Banyak butiran kecil cincin memantulkan cahaya dengan baik karena kaya es.", "Setiap butiran kecil mengelilingi Saturnus secara individual.", "Tepi cincin dapat dipengaruhi pola gerak khusus tarikan dengan bulan-bulan Saturnus."] },
        { id: "rings-division", name: "Cassini Division", category: "CELAH CINCIN", position: [-25, 4, 4], radius: 10, source: SOURCES.rings, lead: "Cassini Division tampak seperti celah gelap yang memisahkan cincin utama Saturnus.", why: "Celah ini membantu menjelaskan bagaimana pola gerak khusus jalur membersihkan atau mengganggu bahan cincin.", facts: ["Cassini Division tidak sepenuhnya kosong. Tapi jauh lebih renggang.", "Pola gerak khusus dengan bulan Mimas ikut berperan pada bentuk ini.", "Perbedaan antar cincin membuat sistem Saturnus sangat ikonik."] },
        { id: "rings-rain", name: "Ring Rain", category: "SALING PENGARUH", position: [27, 8, 20], radius: 9, source: SOURCES.cassini, lead: "Sebagian bahan cincin bisa perlahan jatuh ke udara Saturnus sebagai 'ring rain'.", why: "Fenomena ini menunjukkan cincin tidak abadi dan terus bertemu dengan planet induknya.", facts: ["Butiran sangat kecil dari Matahari dapat mengikuti garis gaya magnet ke udara Saturnus.", "Cassini membantu mengukur keterkaitan antara cincin dan udara.", "Ilmuwan memperkirakan cincin berevolusi sepanjang waktu."] }
      ]
    },
    {
      id: "titan",
      name: "Koridor Titan",
      short: "TITAN",
      category: "BULAN PUNYA UDARA",
      descriptor: "Mendekati Titan dan terbang di koridor kabut oranyenya",
      locationLabel: "Jalur mengelilingi Titan",
      preview: "titan",
      image: "./assets/saturn-titan-enceladus.svg",
      imageAlt: "Diagram Titan dan Enceladus pada sistem Saturnus",
      imageCaption: "Titan · ANTARA berbasis Cassini-Huygens",
      source: SOURCES.titan,
      lead: "Titan adalah bulan terbesar Saturnus. Dalam tampilan 3D ini kamu terbang pada jalur jelajah dekat Titan sambil melihat kabut tebal dan petunjuk tentang danau cairan dingin yang bukan air di bawahnya.",
      facts: [
        "Titan punya udara tebal yang paling banyak berisi nitrogen.",
        "Di permukaannya ada sungai, danau, dan laut gas bernama metana-etana.",
        "Huygens mendarat di Titan pada 2005 dan mengirim foto langsung dari permukaan."
      ],
      palette: { sky: 0x3d3023, fog: 0x8c6f47, fogDensity: 0.0102, cloud: "#e0ba82", cloud2: "#8f6738", accent: 0xf2cb8b, lightning: 0xffe1b0 },
      wind: { x: 0.55, z: 0.14 },
      turbulence: 0.46,
      spawn: { x: -18, y: 10, z: 42, yaw: Math.PI * 0.86, pitch: -0.03 },
      observations: [
        { id: "titan-kabut tipis", name: "Kabut Udara Titan", category: "KABUT TIPIS", position: [7, 9, -13], radius: 11, source: SOURCES.titan, lead: "Kabut oranye Titan membuat permukaannya sulit dilihat pada cahaya tampak.", why: "Kabut dan butiran kecil di udara Titan menjadi kunci untuk memahami kimia organik di udara bulan ini.", facts: ["Udara Titan paling banyak berisi nitrogen.", "Kabut terbentuk dari cara fotokimia di udara atas.", "Warna oranye Titan berasal dari butiran kecil di udara rumit yang disebut tholin."] },
        { id: "titan-lakes", name: "Jejak Laut Gas bernama metana", category: "CAIRAN DINGIN", position: [-20, -8, 0], radius: 10, source: SOURCES.titan, lead: "Radar Cassini menunjukkan keberadaan laut dan danau gas bernama metana-etana di Titan, terutama di daerah kutub.", why: "Titan adalah satu-satunya dunia selain Bumi yang diketahui punya cairan cukup tetap di permukaannya.", facts: ["Cairan Titan terutama gas bernama metana dan etana, bukan air.", "Ada hujan, aliran sungai, dan penguapan dalam siklus gas bernama metana Titan.", "Suhu permukaannya sangat dingin, sekitar -179 °C."] },
        { id: "titan-huygens", name: "Jejak Huygens", category: "MISI", position: [27, 4, 19], radius: 9, source: SOURCES.titan, lead: "Pendarat Huygens turun melalui udara Titan dan mengambil data langsung selama penurunan hingga permukaan.", why: "Misi ini memberi gambaran paling langsung tentang rupa permukaan Titan dan sifat udaranya.", facts: ["Huygens adalah bagian dari misi Cassini-Huygens.", "Ia mendarat pada Januari 2005.", "Foto Huygens menunjukkan lanskap yang dibentuk cairan di masa lalu atau kini."] }
      ]
    },
    {
      id: "enceladus",
      name: "Koridor Semburan Enceladus",
      short: "ENCELADUS",
      category: "BULAN ES AKTIF",
      descriptor: "Melewati semburan es Enceladus dan butiran kecil cincin E",
      locationLabel: "Jalur mengelilingi Enceladus",
      preview: "enceladus",
      image: "./assets/saturn-titan-enceladus.svg",
      imageAlt: "Diagram Titan dan Enceladus pada sistem Saturnus",
      imageCaption: "Enceladus · ANTARA berbasis Cassini",
      source: SOURCES.enceladus,
      lead: "Enceladus tampak kecil dan terang. Tapi dari retakan kutub selatannya keluar semburan uap air dan butiran kecil es. Di koridor ini kamu terbang di dekat semburan yang memberi bahan pada cincin E Saturnus.",
      facts: [
        "Enceladus punya samudra di seluruh planet di bawah kerak es.",
        "Semburan kutub selatannya menyemburkan uap air, es, dan zat kecil lain ke ruang angkasa.",
        "Bahan semburan ikut memasok butiran kecil ke cincin E Saturnus."
      ],
      palette: { sky: 0x0f1620, fog: 0x516676, fogDensity: 0.0082, cloud: "#e7edf0", cloud2: "#9eb4c2", accent: 0xeef9ff, lightning: 0xf3fdff },
      wind: { x: 0.15, z: 0.62 },
      turbulence: 0.28,
      spawn: { x: -24, y: 8, z: 44, yaw: Math.PI * 0.92, pitch: -0.06 },
      observations: [
        { id: "enceladus-tiger", name: "Tiger Stripes", category: "RETAKAN POLAR", position: [5, 4, -16], radius: 10, source: SOURCES.enceladus, lead: "Retakan di kutub selatan Enceladus menjadi jalur keluarnya bahan dari bawah permukaan.", why: "Retakan ini adalah penghubung langsung ke samudra bawah es yang membuat Enceladus sangat menarik secara astrobiologi.", facts: ["Empat retakan utama ini dijuluki tiger stripes.", "Daerah kutub selatan lebih hangat daripada lingkungan sekitarnya.", "Retakan aktif memancarkan semburan ke ruang angkasa."] },
        { id: "enceladus-semburan", name: "Semburan Es", category: "JET", position: [-24, 14, 8], radius: 10, source: SOURCES.enceladus, lead: "Semburan semburan membawa uap air, butir es, dan senyawa lain ke luar angkasa.", why: "Cassini bisa menganalisis isi semburan tanpa harus mendarat atau mengebor lapisan es.", facts: ["Semburan mengandung air, garam, dan zat kecil organik sederhana.", "Aktivitas ini mengindikasikan adanya air cair di bawah kerak.", "Semburan menjadi salah satu alasan Enceladus dianggap calon lingkungan layak huni. "] },
        { id: "enceladus-ocean", name: "Petunjuk Samudra", category: "ASTROBIOLOGI", position: [29, -3, 19], radius: 9, source: SOURCES.enceladus, lead: "Data Cassini menunjukkan Enceladus menyimpan samudra di seluruh planet di bawah lapisan esnya.", why: "Air cair, energi, dan bahan kimia menjadikan Enceladus salah satu target terpenting dalam pencarian lingkungan yang mungkin mendukung kehidupan.", facts: ["Samudra Enceladus berada di bawah lapisan es di seluruh planet.", "Analisis butiran kecil semburan menunjukkan adanya saling pengaruh air-batuan di dasar samudra.", "Cincin E Saturnus sebagian besar dipasok oleh aktivitas Enceladus."] }
      ]
    }
  ]);

  class SaturnAtmosphereWorld {
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
      this.streakTexture = this.makeStreakTexture("rgba(255,245,225,.34)", "rgba(91,64,48,.32)");

      this.sky = new T.Mesh(
        new T.SphereGeometry(150, 48, 28),
        new T.MeshBasicMaterial({ color: palette.sky, side: T.BackSide, depthWrite: false, fog: false })
      );
      this.group.add(this.sky);

      this.buildCloudPoints(this.cloudTextureA, Math.round(this.quality.clouds * 0.62), 17, 0.42, 0);
      this.buildCloudPoints(this.cloudTextureB, Math.round(this.quality.clouds * 0.38), 12, 0.26, 1);
      this.buildStreakLayers();
      this.buildDestinationFeature();
      this.buildMarkers();
      if (this.destination.lightning) this.buildLightning();
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
          color: i % 2 ? 0xd8c7aa : 0x8b715c
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
      const addVortex = (center, radius, turns, color, opacity) => {
        const group = new T.Group();
        group.position.set(center[0], center[1], center[2]);
        const material = new T.LineBasicMaterial({ color, transparent: true, opacity, depthWrite: false, fog: true });
        for (let ring = 0; ring < 8; ring++) {
          const points = [];
          const samples = 72;
          const r0 = radius * (0.28 + ring * 0.095);
          for (let i = 0; i <= samples; i++) {
            const t = i / samples * Math.PI * 2;
            const wobble = Math.sin(t * turns + ring * 0.8) * radius * 0.04;
            points.push(new T.Vector3(Math.cos(t) * (r0 + wobble), Math.sin(t * 2 + ring) * 1.0, Math.sin(t) * (r0 * 0.58 + wobble)));
          }
          const geometry = new T.BufferGeometry().setFromPoints(points);
          const line = new T.LineLoop(geometry, material.clone());
          line.rotation.x = (this.rand() - 0.5) * 0.08;
          group.add(line);
        }
        group.userData.rotationSpeed = 0.018 + this.rand() * 0.02;
        this.group.add(group);
        this.vortexGroups.push(group);
        return group;
      };
      const addMoon = (position, radius, colorA, colorB) => {
        const sphere = new T.Mesh(
          new T.SphereGeometry(radius, 24, 18),
          new T.MeshPhongMaterial({ color: colorA, emissive: colorB, emissiveIntensity: 0.08, shininess: 12, transparent: true, opacity: 0.96, fog: true })
        );
        sphere.position.set(...position);
        this.group.add(sphere);
        return sphere;
      };
      const addRingPlane = () => {
        const ringMaterial = new T.MeshBasicMaterial({ color: 0xe6e0d1, transparent: true, opacity: 0.18, side: T.DoubleSide, depthWrite: false, fog: true });
        const ring = new T.Mesh(new T.RingGeometry(18, 95, 120, 1), ringMaterial);
        ring.rotation.x = -Math.PI / 2;
        ring.position.y = -1.5;
        this.group.add(ring);
        const gap = new T.Mesh(new T.RingGeometry(46, 58, 96, 1), new T.MeshBasicMaterial({ color: 0x18202a, transparent: true, opacity: 0.30, side: T.DoubleSide, depthWrite: false, fog: true }));
        gap.rotation.x = -Math.PI / 2;
        gap.position.y = -1.45;
        this.group.add(gap);
        const particles = new T.Group();
        for (let i = 0; i < 180; i++) {
          const geom = new T.PlaneGeometry(0.28 + this.rand() * 0.5, 0.1 + this.rand() * 0.16);
          const mat = new T.MeshBasicMaterial({ color: i % 4 ? 0xe6ddca : 0xbeb6a8, transparent: true, opacity: 0.35 + this.rand() * 0.25, side: T.DoubleSide, depthWrite: false, fog: true });
          const part = new T.Mesh(geom, mat);
          const radius = 24 + this.rand() * 64;
          const a = this.rand() * Math.PI * 2;
          part.position.set(Math.cos(a) * radius, -1 + (this.rand() - 0.5) * 2.3, Math.sin(a) * radius * 0.46);
          part.rotation.x = -Math.PI / 2;
          part.rotation.z = this.rand() * Math.PI;
          particles.add(part);
        }
        particles.userData.rotationSpeed = 0.01;
        this.group.add(particles);
        this.vortexGroups.push(particles);
      };
      const addPlume = (x, z) => {
        const plume = new T.PointLight(0xeefbff, 0.65, 40, 2);
        plume.position.set(x, 10, z);
        this.group.add(plume);
        for (let i = 0; i < 3; i++) {
          const geo = new T.CylinderGeometry(0.25, 2.2 + i * 0.55, 16 + i * 4, 18, 1, true);
          const mat = new T.MeshBasicMaterial({ color: 0xeefcff, transparent: true, opacity: 0.06 + i * 0.03, side: T.DoubleSide, depthWrite: false, fog: true });
          const column = new T.Mesh(geo, mat);
          column.position.set(x + (i - 1) * 1.8, 6 + i * 2.4, z);
          this.group.add(column);
        }
      };

      if (this.destination.id === "hexagon") {
        const points = [];
        const radius = 28;
        for (let i = 0; i <= 6; i++) {
          const a = Math.PI / 6 + i / 6 * Math.PI * 2;
          points.push(new T.Vector3(Math.cos(a) * radius, 5, Math.sin(a) * radius * 0.62 - 14));
        }
        const hex = new T.Line(new T.BufferGeometry().setFromPoints(points), new T.LineBasicMaterial({ color: 0xd5e1e7, transparent: true, opacity: 0.42, depthWrite: false, fog: true }));
        this.group.add(hex);
        addVortex([0, 4, -14], 16, 3.6, 0xc2d3dc, 0.28);
      }
      if (this.destination.id === "storms") {
        for (let i = -2; i <= 2; i++) {
          const lineGeometry = new T.BufferGeometry().setFromPoints([
            new T.Vector3(-88, i * 12, -18 + i * 4),
            new T.Vector3(88, i * 12, -18 + i * 4)
          ]);
          const line = new T.Line(lineGeometry, new T.LineBasicMaterial({ color: i % 2 ? 0xe7d8bc : 0x9b7f62, transparent: true, opacity: 0.22, depthWrite: false, fog: true }));
          this.group.add(line);
        }
        addVortex([-16, -4, -16], 18, 2.9, 0xf1ddc5, 0.16);
      }
      if (this.destination.id === "rings") {
        addRingPlane();
        addMoon([50, 18, -36], 5.8, 0xcfc7b6, 0x3a3125);
      }
      if (this.destination.id === "titan") {
        addMoon([38, 12, -34], 12, 0xcda76b, 0x4e351d);
        const hazeShell = new T.Mesh(new T.SphereGeometry(13.6, 24, 18), new T.MeshBasicMaterial({ color: 0xe2bb7d, transparent: true, opacity: 0.08, side: T.DoubleSide, depthWrite: false, fog: false }));
        hazeShell.position.set(38, 12, -34);
        this.group.add(hazeShell);
      }
      if (this.destination.id === "enceladus") {
        addMoon([34, 9, -30], 8.5, 0xe4eef4, 0x3c5d72);
        addPlume(34, -30);
      }

      const light = new T.PointLight(accent, this.destination.id === "storms" ? 0.52 : 0.38, 120, 2);
      light.position.set(0, 8, -5);
      this.group.add(light);
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
      if (this.destination.id === "rings") {
        if (pressure < 0.8) return "BIDANG CINCIN";
        if (pressure < 1.6) return "TEPI CINCIN / BAYANGAN";
        return "KORIDOR EDUKASI";
      }
      if (this.destination.id === "titan") {
        if (pressure < 0.9) return "KABUT TITAN";
        if (pressure < 2.1) return "UDARA N2";
        return "KORIDOR TERBANG LEWAT DEKAT";
      }
      if (this.destination.id === "enceladus") {
        if (pressure < 0.9) return "SEMBURAN ES";
        if (pressure < 2.1) return "RING E";
        return "KORIDOR TERBANG LEWAT DEKAT";
      }
      if (pressure < 0.95) return "KABUT ATAS / ES GAS AMONIA";
      if (pressure < 2.2) return "LAPISAN MENENGAH";
      return "AWAN LEBIH DALAM";
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

  class SaturnFullExploration {
    constructor(saturnScene) {
      this.saturn = saturnScene;
      this.root = document.getElementById("saturn-full-exploration");
      this.entryButton = document.getElementById("saturn-full-explore-button");
      if (!this.saturn || !this.root || !this.entryButton) return;

      this.viewport = document.getElementById("saturn-full-viewport");
      this.inputLayer = document.getElementById("saturn-full-orbit-input");
      this.qualityPanel = document.getElementById("saturn-quality-panel");
      this.qualityOptions = document.getElementById("saturn-quality-options");
      this.qualityClose = document.getElementById("saturn-quality-close");
      this.qualityStart = document.getElementById("saturn-quality-start");
      this.qualityLabel = document.getElementById("saturn-quality-selected-label");
      this.qualityNote = document.getElementById("saturn-quality-device-note");
      this.selector = document.getElementById("saturn-region-selector");
      this.selectorClose = document.getElementById("saturn-region-selector-close");
      this.selectorGrid = document.getElementById("saturn-region-grid");
      this.hudLocation = document.getElementById("saturn-full-hud-location");
      this.hudDepth = document.getElementById("saturn-full-hud-depth");
      this.hudSpeed = document.getElementById("saturn-full-hud-speed");
      this.hudAltitude = document.getElementById("saturn-full-hud-altitude");
      this.hudTarget = document.getElementById("saturn-full-hud-target");
      this.hudPressure = document.getElementById("saturn-full-hud-pressure");
      this.hudType = document.getElementById("saturn-full-hud-region-type");
      this.hudQuality = document.getElementById("saturn-full-hud-quality");
      this.hudData = document.getElementById("saturn-full-hud-data");
      this.objectives = document.getElementById("saturn-objectives-panel");
      this.objectivesRegion = document.getElementById("saturn-objectives-region");
      this.objectivesIntro = document.getElementById("saturn-objectives-intro");
      this.objectivesList = document.getElementById("saturn-objectives-list");
      this.objectivesCount = document.getElementById("saturn-discovery-count");
      this.objectivesBar = document.getElementById("saturn-discovery-bar");
      this.objectivesCollapse = document.getElementById("saturn-objectives-collapse");
      this.objectivesToggle = document.getElementById("saturn-objectives-toggle");
      this.nextTarget = document.getElementById("saturn-next-target");
      this.nextTargetName = document.getElementById("saturn-next-target-name");
      this.nextTargetDistance = document.getElementById("saturn-next-target-distance");
      this.info = document.getElementById("saturn-landmark-card");
      this.infoMinimize = document.getElementById("saturn-landmark-minimize");
      this.infoToggle = document.getElementById("saturn-info-toggle");
      this.infoName = document.getElementById("saturn-landmark-name");
      this.infoType = document.getElementById("saturn-landmark-type");
      this.infoCoords = document.getElementById("saturn-landmark-coords");
      this.infoImage = document.getElementById("saturn-landmark-image");
      this.infoCaption = document.getElementById("saturn-landmark-image-caption");
      this.infoMedia = document.getElementById("saturn-landmark-media");
      this.infoDescription = document.getElementById("saturn-landmark-description");
      this.infoFacts = document.getElementById("saturn-landmark-facts");
      this.infoSource = document.getElementById("saturn-landmark-source");
      this.observationPrompt = document.getElementById("saturn-observation-prompt");
      this.observationPromptTitle = document.getElementById("saturn-observation-prompt-title");
      this.observeButton = document.getElementById("saturn-observe-button");
      this.observationCard = document.getElementById("saturn-observation-card");
      this.observationClose = document.getElementById("saturn-observation-close");
      this.observationTitle = document.getElementById("saturn-observation-title");
      this.observationMeta = document.getElementById("saturn-observation-meta");
      this.observationLead = document.getElementById("saturn-observation-lead");
      this.observationWhy = document.getElementById("saturn-observation-why");
      this.observationDeep = document.getElementById("saturn-observation-deep");
      this.observationSource = document.getElementById("saturn-observation-source");
      this.observationStatus = document.getElementById("saturn-observation-status");
      this.actionsRoot = this.root.querySelector(".venus-full-actions");
      this.actionsMenuToggle = document.getElementById("saturn-actions-menu-toggle");
      this.locationButton = document.getElementById("saturn-location-toggle");
      this.fullscreenButton = document.getElementById("saturn-fullscreen-toggle");
      this.exitButton = document.getElementById("saturn-full-exit");
      this.loading = document.getElementById("saturn-full-loading");
      this.loadingTitle = document.getElementById("saturn-full-loading-title");
      this.loadingStatus = document.getElementById("saturn-full-loading-status");
      this.loadingProgress = document.getElementById("saturn-full-loading-progress");
      this.errorPanel = document.getElementById("saturn-full-error");
      this.errorMessage = document.getElementById("saturn-full-error-message");
      this.errorReturn = document.getElementById("saturn-full-error-return");
      this.tutorial = document.getElementById("saturn-full-tutorial");
      this.tutorialClose = document.getElementById("saturn-tutorial-close");
      this.boundaryHint = document.getElementById("saturn-boundary-hint");
      this.mobileControls = [...this.root.querySelectorAll("[data-saturn-control]")];

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
      this.saturn.fullExploration = this;
      this.saturn.fullExplorationActive = false;
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
      this.qualityOptions?.querySelectorAll("[data-saturn-quality]").forEach(button => {
        const selected = button.dataset.saturnQuality === key;
        button.classList.toggle("is-selected", selected);
        button.setAttribute("aria-checked", String(selected));
        const recommendation = button.querySelector("[data-quality-recommendation]");
        if (recommendation) recommendation.textContent = button.dataset.saturnQuality === this.recommendedQuality ? "DIREKOMENDASIKAN" : "";
      });
      if (this.qualityLabel) this.qualityLabel.textContent = this.quality.label;
      if (this.hudQuality) this.hudQuality.textContent = this.quality.label;
      if (this.qualityNote) this.qualityNote.textContent = `Rekomendasi perangkat: ${QUALITY[this.recommendedQuality].label}. Kualitas mengatur jumlah awan, butiran kecil cincin, detail marker, dan ketajaman mesin gambar 3D.`;
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
        button.className = "venus-region-card saturn-region-card";
        button.dataset.saturnRegion = destination.id;
        button.innerHTML = `<span class="venus-region-preview saturn-region-preview saturn-region-preview-${destination.preview}" aria-hidden="true"><i></i><b>${destination.short}</b></span><span class="venus-region-index">${String(index + 1).padStart(2, "0")}</span><strong>${destination.name}</strong><span class="venus-region-descriptor">${destination.descriptor}</span><small>${destination.locationLabel}</small><em>${destination.category}</em><span class="venus-region-source">NASA / JPL · Cassini-Huygens</span>`;
        fragment.append(button);
      });
      this.selectorGrid?.replaceChildren(fragment);
      this.selectDestination(this.selected.id);
    }

    selectDestination(id) {
      this.selected = DESTINATIONS.find(destination => destination.id === id) || DESTINATIONS[0];
      this.selectorGrid?.querySelectorAll("[data-saturn-region]").forEach(button => {
        const selected = button.dataset.saturnRegion === this.selected.id;
        button.classList.toggle("is-selected", selected);
        button.setAttribute("aria-pressed", String(selected));
      });
    }

    bind() {
      this.entryButton.addEventListener("click", () => this.openEntryFlow());
      this.qualityClose?.addEventListener("click", () => this.closeEntryFlow());
      this.qualityStart?.addEventListener("click", () => this.showSelector());
      this.qualityOptions?.addEventListener("click", event => {
        const button = event.target.closest("[data-saturn-quality]");
        if (button) this.applyQuality(button.dataset.saturnQuality);
      });
      this.selectorClose?.addEventListener("click", () => {
        if (this.state === "selecting-world") this.closeSelectorToWorld();
        else this.closeEntryFlow();
      });
      this.selectorGrid?.addEventListener("click", event => {
        const button = event.target.closest("[data-saturn-region]");
        if (!button) return;
        const destination = DESTINATIONS.find(item => item.id === button.dataset.saturnRegion);
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
        if (!this.saturn.fullExplorationActive) return;
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
        const control = button.dataset.saturnControl;
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
            window.AntaraProgress?.trackFull?.("saturn", destination.id, destination.name);
          }
        } catch {}
      }
    }

    openEntryFlow() {
      if (!this.saturn.active || this.saturn.travelMode || this.saturn.fullExplorationActive) return;
      this.syncSavedDestinationProgress();
      if (this.saturn.exploring) this.saturn.exitExploration();
      this.state = "configuring";
      this.saturn.fullExplorationActive = true;
      this.saturn.element.classList.add("is-saturn-full-active");
      document.getElementById("mission")?.classList.add("is-saturn-full");
      this.root.hidden = false;
      this.root.inert = false;
      this.root.setAttribute("aria-hidden", "false");
      this.entryButton.disabled = true;
      this.qualityPanel.hidden = false;
      this.selector.hidden = true;
      if (this.errorPanel) this.errorPanel.hidden = true;
      this.hideWorldUi();
      this.root.classList.remove("is-active", "is-preparing", "is-exiting");
      document.getElementById("announcement").textContent = "Pilih kualitas grafis sebelum masuk ke koridor eksplorasi Saturnus.";
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
      document.getElementById("announcement").textContent = "Pilih wilayah Saturnus yang ingin kamu jelajahi.";
    }

    async prepareRenderer() {
      if (this.renderer) return;
      await this.saturn.prepare();
      const T = this.saturn.THREE;
      if (!T) throw new Error("WebGL2 tidak tersedia. Jelajah penuh Saturnus memerlukan mesin gambar 3D 3D.");
      this.THREE = T;
      const canvas = document.createElement("canvas");
      canvas.className = "saturn-full-canvas";
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
      this.scene.add(new T.HemisphereLight(0xece2cf, 0x2a2521, 1.05));
      const key = new T.DirectionalLight(0xffe7c2, 1.05);
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
        [22, 180, "MEMUAT DATA UDARA"],
        [48, 220, "MEMBENTUK LAPISAN AWAN"],
        [71, 220, "MENYIAPKAN ARUS & TURBULENSI"],
        [91, 200, "MENGUNCI BATAS EKSPLORASI"],
        [100, 180, "SIAP MENEMBUS AWAN"]
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
      this.showLoading(`MEMASUKI ${destination.name.toUpperCase()}`, "MENYIAPKAN UDARA", 7);
      try {
        await this.prepareRenderer();
        if (token !== this.transitionToken) return;
        this.disposeWorld();
        this.scene.fog = new this.THREE.FogExp2(destination.palette.fog, destination.palette.fogDensity);
        this.renderer.setClearColor(destination.palette.sky, 1);
        this.renderer.toneMappingExposure = destination.id === "hotspot" ? 1.10 : 1.02;
        this.world = new SaturnAtmosphereWorld(this.THREE, this.scene, this.renderer, destination, this.quality);
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
        window.AntaraProgress?.trackFull?.("saturn", destination.id, destination.name);
        if (this.actionsRoot) this.actionsRoot.hidden = false;
        const compactUi = this.isMobileUi();
        this.infoOpen = !compactUi;
        this.objectiveOpen = !compactUi;
        this.actionsOpen = false;
        this.syncPanels();
        this.startLoop();
        this.showTutorial();
        document.getElementById("announcement").textContent = `Tiba di ${destination.name}. Kamu sekarang menjelajahi tampilan 3D 3D Saturnus.`;
      } catch (error) {
        console.error("Saturn Full Exploration failed", error);
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
          if (this.camera.position.y < this.world.minY + 5) this.boundaryHint.textContent = "BATAS TEKANAN TAMPILAN 3D · TEKANAN MENINGKAT TERLALU CEPAT";
          else if (this.camera.position.y > this.world.maxY - 5) this.boundaryHint.textContent = "BATAS LAPISAN ATAS · ARUS MEMBALIKKAN ROBOT ANTARIKSA";
          else this.boundaryHint.textContent = boundary > 0.82 ? "BATAS EKSPLORASI · ARUS JET MEMBALIKKAN ROBOT ANTARIKSA" : "MENDEKATI BATAS EKSPLORASI";
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
      this.objectivesToggle.setAttribute("aria-label", `Buka tujuan eksplorasi Saturnus, ${count} dari ${total} selesai`);
    }

    updateRegionUI() {
      const destination = this.current;
      if (!destination) return;
      this.hudLocation.textContent = destination.name;
      this.hudType.textContent = destination.category;
      this.hudQuality.textContent = this.quality.label;
      this.hudData.textContent = "NASA / JPL · MODEL UDARA SEDERHANA";
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
      this.hudPressure.textContent = `${pressure.toFixed(pressure < 1 ? 2 : 1)} BAR SIM`;
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
      console.warn("Saturn Full Exploration:", error);
      this.forceReset();
      document.getElementById("announcement").textContent = "Kembali ke panorama Saturnus.";
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
      document.getElementById("announcement").textContent = "Kembali ke panorama Saturnus.";
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
      this.saturn.fullExplorationActive = false;
      this.saturn.element.classList.remove("is-saturn-full-active");
      document.getElementById("mission")?.classList.remove("is-saturn-full");
      this.entryButton.disabled = false;
      this.saturn.caption.inert = false;
      this.saturn.resize?.();
    }
  }

  window.SaturnFullExploration = SaturnFullExploration;
  window.ANTARA_SATURN_FULL_DESTINATIONS = DESTINATIONS;
})();
