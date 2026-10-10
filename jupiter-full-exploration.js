"use strict";

(() => {
  const STORAGE_KEY = "antara-jupiter-full-quality-v2";
  const DISCOVERY_PREFIX = "antara-jupiter-atmosphere-discovery-v2:";
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
    facts: "https://science.nasa.gov/jupiter/jupiter-facts/",
    grs: "https://www.jpl.nasa.gov/news/nasas-juno-science-results-offer-first-3d-view-of-jupiter-atmosphere/",
    lightning: "https://www.jpl.nasa.gov/news/shallow-lightning-and-mushballs-reveal-ammonia-to-nasas-juno-scientists/",
    probe: "https://science.nasa.gov/mission/galileo-jupiter-atmospheric-probe/",
    hotspot: "https://www.jpl.nasa.gov/images/pia24298-high-flying-cloud-in-jupiters-atmosphere/",
    polar: "https://science.nasa.gov/photojournal/a-jupiter-circumpolar-cyclone/"
  });

  const DESTINATIONS = Object.freeze([
    {
      id: "grs",
      name: "Great Red Spot",
      short: "GREAT RED SPOT",
      category: "BADAI ANTISIKLON",
      descriptor: "Masuk ke tepi pusaran badai raksasa Jupiter",
      locationLabel: "Udara selatan Jupiter",
      preview: "grs",
      image: "./assets/jupiter-great-red-spot.jpg",
      imageAlt: "Great Red Spot Jupiter pada gambar Cassini",
      imageCaption: "Great Red Spot · Cassini / NASA",
      source: SOURCES.grs,
      lead: "Di sini kamu tidak berdiri di atas tanah. Kamu terbang di antara lapisan awan yang ikut berputar di sekitar Great Red Spot. Juno menunjukkan pusaran ini tidak hanya hidup di permukaan awan. Tapi memanjang jauh ke bawah.",
      facts: [
        "Great Red Spot adalah antibadai berputar raksasa yang telah diamati selama berabad-abad.",
        "Pengukuran Juno membatasi kedalaman Great Red Spot hingga kira-kira 500 km di bawah puncak awan.",
        "Jupiter sendiri paling banyak berisi gas ringan bernama hidrogen dan gas ringan bernama helium. Jadi seluruh pemandangan ini adalah udara, bukan permukaan padat."
      ],
      palette: { sky: 0x5b2f24, fog: 0x8d5b48, fogDensity: 0.0125, cloud: "#e5c3a2", cloud2: "#a65e4b", accent: 0xe6b38d, lightning: 0xffdec0 },
      wind: { x: 1.15, z: -0.45 },
      turbulence: 1.35,
      spawn: { x: -20, y: 9, z: 44, yaw: Math.PI * 0.93, pitch: -0.05 },
      observations: [
        { id: "grs-wall", name: "Dinding Pusaran", category: "ARUS BADAI", position: [4, 5, -15], radius: 11, source: SOURCES.grs, lead: "Awan di sisi pusaran bergerak sebagai bagian dari sistem badai besar yang saling menggeser.", why: "Bentuk atas-bawah dan gerak awan membantu ilmuwan menebak bagaimana energi badai disimpan dan dipindahkan.", facts: ["Great Red Spot adalah antibadai berputar.", "Juno menemukan bentuk badai jauh lebih dalam daripada lapisan awan yang terlihat.", "Warna merahnya berasal dari kimia udara yang masih dipelajari."] },
        { id: "grs-shear", name: "Zona Geser Angin", category: "ARUS ANGIN CEPAT", position: [-28, -3, -6], radius: 10, source: SOURCES.facts, lead: "Di tepi badai, aliran udara bertemu dengan jet timur-barat Jupiter.", why: "Perbedaan arah dan kecepatan angin membantu menjaga pusaran tetap terorganisasi.", facts: ["Sabuk dan zona Jupiter dipisahkan arus angin cepat kuat.", "Arah aliran dapat berlawanan pada lintang yang berdekatan.", "Putaran Jupiter yang sangat cepat ikut membentuk pola pita di seluruh planet."] },
        { id: "grs-deep", name: "Awan Lebih Dalam", category: "LAPISAN TEKANAN", position: [24, -22, 22], radius: 10, source: SOURCES.facts, lead: "Semakin turun, tekanan bertambah dan isi awan berubah.", why: "Lapisan awan yang berbeda menunjukkan tentang suhu, tekanan, dan sirkulasi di udara dalam Jupiter.", facts: ["Lapisan atas kira-kira paling banyak berisi es gas bernama amonia.", "Di bawahnya dapat terbentuk kristal ammonium hydrosulfide.", "Awan air kira-kira berada lebih dalam pada tekanan yang lebih tinggi."] }
      ]
    },
    {
      id: "bands",
      name: "Sabuk & Zona Awan",
      short: "BELTS & ZONES",
      category: "ARUS ANGIN CEPAT DI SELURUH PLANET",
      descriptor: "Terbang di antara pita terang dan gelap Jupiter",
      locationLabel: "Lintang rendah hingga menengah",
      preview: "bands",
      image: "./assets/jupiter-global-card.jpg",
      imageAlt: "Portrait di seluruh planet Jupiter dari Cassini",
      imageCaption: "Belts & Zones · Cassini / NASA",
      source: SOURCES.facts,
      lead: "Pita terang dan gelap Jupiter bukan garis pada permukaan. Ini adalah lapisan awan dan aliran udara yang bergerak dengan pola berbeda.",
      facts: [
        "Pita gelap disebut belts dan pita terang disebut zones.",
        "Jet timur-barat dapat mencapai sekitar 150 m/s pada lintang rendah menurut NASA fact sheet.",
        "Putaran cepat Jupiter membantu mengatur udara menjadi pita-pita panjang."
      ],
      palette: { sky: 0x6b5a49, fog: 0xa99174, fogDensity: 0.0108, cloud: "#efe2c6", cloud2: "#8a6b56", accent: 0xe8d6b3, lightning: 0xffefce },
      wind: { x: 1.65, z: 0.18 },
      turbulence: 0.7,
      spawn: { x: -34, y: 4, z: 38, yaw: Math.PI * 0.83, pitch: -0.02 },
      observations: [
        { id: "bands-zone", name: "Zona Terang", category: "UPWELLING", position: [12, 15, -5], radius: 10, source: SOURCES.facts, lead: "Zona terang mewakili wilayah awan yang berbeda dari belt gelap di sebelahnya.", why: "Perbedaan kecerahan dan gerak menunjukkan sirkulasi atas-bawah serta isi awan yang berubah.", facts: ["Zones biasanya terlihat lebih terang.", "Awan Jupiter mengandung gas bernama amonia dan air pada lapisan berbeda.", "Batas zona sering menjadi lokasi gelombang dan pusaran kecil."] },
        { id: "bands-belt", name: "Sabuk Gelap", category: "BELT", position: [-16, -7, -17], radius: 10, source: SOURCES.facts, lead: "Sabuk gelap adalah bagian dari bentuk pita di seluruh planet yang mengelilingi Jupiter.", why: "Membandingkan belt dan zone membantu menjelaskan sirkulasi udara pada planet yang tidak punya permukaan.", facts: ["Belts tampak lebih gelap daripada zones.", "Arus angin cepat kuat mengalir di batas antar pita.", "Pola pita dapat berubah tetapi tetap menjadi ciri utama Jupiter."] },
        { id: "bands-jet", name: "Batas Jet", category: "SHEAR", position: [34, 2, 17], radius: 9, source: SOURCES.facts, lead: "Di batas pita, dua aliran bisa bergerak dengan arah berbeda dan menciptakan shear.", why: "Shear memicu gelombang, filamen, dan pusaran kecil yang membuat udara Jupiter tampak hidup.", facts: ["Jupiter punya banyak jet timur-barat.", "Kecepatan angin berubah menurut lintang.", "Putaran planet sekitar 9,9 jam memperkuat organisasi udaranya."] }
      ]
    },
    {
      id: "lightning",
      name: "Badai Petir Jovian",
      short: "JOVIAN LIGHTNING",
      category: "GERAKAN PANAS NAIK DAN TURUN & PETIR",
      descriptor: "Turun menuju awan air dan kilatan petir Jupiter",
      locationLabel: "Udara konvektif Jupiter",
      preview: "lightning",
      image: "./assets/jupiter-atmosphere-diagram.svg",
      imageAlt: "Diagram lapisan udara Jupiter",
      imageCaption: "Lapisan awan Jupiter · gambar bantu belajar ANTARA berbasis NASA",
      source: SOURCES.lightning,
      lead: "Juno menemukan petir pada Jupiter bisa muncul lebih tinggi daripada perkiraan lama. Gas amonia dan air bisa bercampur pada kondisi tertentu, membentuk cara yang tidak punya padanan langsung di cuaca Bumi.",
      facts: [
        "Petir dalam telah lama dikaitkan dengan awan air yang berada puluhan kilometer di bawah awan terlihat.",
        "Juno juga mendeteksi shallow lightning pada ketinggian yang lebih tinggi.",
        "Model Juno mengaitkan cara ini dengan campuran gas bernama amonia-air dan pembentukan mushballs."
      ],
      palette: { sky: 0x28333c, fog: 0x6d7780, fogDensity: 0.0145, cloud: "#d7dde0", cloud2: "#7e898f", accent: 0xddeeff, lightning: 0xe9f5ff },
      wind: { x: 0.65, z: 1.15 },
      turbulence: 1.75,
      lightning: true,
      spawn: { x: -22, y: 18, z: 46, yaw: Math.PI * 0.92, pitch: -0.12 },
      observations: [
        { id: "lightning-shallow", name: "Shallow Lightning", category: "PETIR DANGKAL", position: [7, 13, -12], radius: 11, source: SOURCES.lightning, lead: "Kilatan ini merepresentasikan petir yang ditemukan Juno pada ketinggian lebih tinggi dari lokasi petir air klasik.", why: "Penemuan ini mengubah gambaran tentang bagaimana gas bernama amonia dan air bergerak di udara Jupiter.", facts: ["Juno mengamati kilatan kecil pada sisi malam Jupiter.", "Kilatan dangkal terjadi lebih tinggi daripada petir yang hanya bergantung pada awan air dalam.", "Gas amonia menurunkan titik beku campuran air sehingga memungkinkan cara unik."] },
        { id: "lightning-water", name: "Awan Air Dalam", category: "WATER CLOUD", position: [-24, -25, -4], radius: 10, source: SOURCES.facts, lead: "Lapisan lebih dalam kira-kira mengandung awan air dan menjadi lokasi gerakan panas naik dan turun kuat.", why: "Awan air adalah bagian penting untuk memahami energi internal, badai, dan petir Jupiter.", facts: ["NASA menempatkan awan air di bawah lapisan gas bernama amonia dan ammonium hydrosulfide.", "Tekanan dan suhu meningkat saat turun.", "Petir dalam menunjukkan adanya gerakan panas naik dan turun lembap yang kuat."] },
        { id: "lightning-mushball", name: "Zona Mushball", category: "AMONIA-AIR", position: [30, -6, 18], radius: 10, source: SOURCES.lightning, lead: "Juno mengusulkan bahwa campuran gas bernama amonia dan air dapat membentuk bola es lembek yang membawa gas bernama amonia lebih jauh ke bawah.", why: "Cara ini membantu menjelaskan mengapa gas bernama amonia tampak berkurang dari sebagian besar udara atas Jupiter.", facts: ["Mushballs adalah hipotesis fisik yang didukung kombinasi melihat dan mempelajari dan model Juno.", "Mereka dapat membawa gas bernama amonia ke kedalaman yang lebih besar.", "Cara ini berhubungan dengan badai konvektif dan shallow lightning."] }
      ]
    },
    {
      id: "hotspot",
      name: "5-Micron Hot Spot",
      short: "HOT SPOT",
      category: "CELAH AWAN",
      descriptor: "Masuk ke wilayah kering yang membuka pandangan ke udara lebih dalam",
      locationLabel: "Hot spot ekuatorial Jupiter",
      preview: "hotspot",
      image: "./assets/jupiter-global-card.jpg",
      imageAlt: "Hot spot Jupiter dari data Juno",
      imageCaption: "Jupiter hot spot · Juno / NASA",
      source: SOURCES.hotspot,
      lead: "Hot spot adalah celah cukup pada dek awan. Dari wilayah seperti inilah energi cahaya panas dari udara lebih dalam dapat lolos dengan lebih mudah.",
      facts: [
        "Galileo Probe masuk dekat sebuah hot spot pada 1995 dan mengukur udara secara langsung.",
        "Probe mengirim data selama sekitar 58 menit sambil turun ke udara Jupiter.",
        "Hot spot yang dimasuki Galileo ternyata sangat kering dibanding rata-rata di seluruh planet."
      ],
      palette: { sky: 0x4a3c2d, fog: 0x7a654d, fogDensity: 0.0087, cloud: "#c9b18d", cloud2: "#554537", accent: 0xf0c37e, lightning: 0xffd194 },
      wind: { x: 1.3, z: -0.1 },
      turbulence: 0.55,
      spawn: { x: -30, y: 10, z: 45, yaw: Math.PI * 0.9, pitch: -0.08 },
      observations: [
        { id: "hotspot-window", name: "Jendela Inframerah", category: "CLOUD BREAK", position: [10, 6, -13], radius: 10, source: SOURCES.hotspot, lead: "Awan lebih tipis memungkinkan kita melihat lebih jauh ke udara dalam pada jenis cahaya tertentu.", why: "Hot spot membantu ilmuwan membuat peta bentuk atas-bawah dan kandungan uap air Jupiter.", facts: ["Hot spot tampak terang pada cahaya panas tertentu.", "Wilayah ini dapat lebih kering daripada lingkungan sekitarnya.", "Juno mengamati hot spot bersama bentuk awan dan shallow lightning di sekitarnya."] },
        { id: "hotspot-probe", name: "Jejak Galileo Probe", category: "IN-SITU", position: [-22, -16, 3], radius: 10, source: SOURCES.probe, lead: "Galileo Probe menjadi robot antariksa pertama yang langsung memasuki udara Jupiter pada 7 Desember 1995.", why: "Pengukuran langsung memberi data tekanan, suhu, isi, awan, angin, dan petir yang tidak bisa diperoleh hanya dari jauh.", facts: ["Probe mengirim data selama sekitar 58 menit.", "Sinyalnya hilang setelah mencapai tekanan sekitar puluhan udara.", "Probe tidak pernah menemukan tanah karena Jupiter memang tidak punya permukaan padat."] },
        { id: "hotspot-downdraft", name: "Arus Turun Kering", category: "DOWNWELLING", position: [29, -5, 21], radius: 10, source: SOURCES.probe, lead: "Hot spot Galileo adalah wilayah yang cukup kering dengan udara yang bergerak turun.", why: "Arus turun dapat membersihkan awan dan membuat wilayah menjadi transparan pada cahaya panas.", facts: ["Galileo mengukur kandungan air yang lebih rendah dari perkiraan karena masuk ke wilayah yang tidak representatif secara di seluruh planet.", "Juno kemudian membantu memperbarui gambaran tentang penyebaran air Jupiter.", "Hot spot menunjukkan cuaca lokal Jupiter sangat berbeda-beda."] }
      ]
    },
    {
      id: "polar",
      name: "Siklon Kutub",
      short: "POLAR CYCLONES",
      category: "UDARA POLAR",
      descriptor: "Terbang di sekitar pusaran yang memenuhi kutub Jupiter",
      locationLabel: "Kutub utara Jupiter",
      preview: "polar",
      image: "./assets/jupiter-global-card.jpg",
      imageAlt: "Salah satu siklon circumpolar Jupiter pada gambar JunoCam",
      imageCaption: "Circumpolar Badai berputar · JunoCam / NASA",
      source: SOURCES.polar,
      lead: "Di kutub, pola pita berubah menjadi kumpulan pusaran raksasa. Juno melihat satu siklon pusat di kutub utara yang dikelilingi delapan siklon besar.",
      facts: [
        "Kutub utara punya siklon pusat yang dikelilingi delapan siklon circumpolar besar.",
        "Pusaran-pusaran ini dapat bertahan meski udara di sekitarnya sangat turbulen.",
        "Juno adalah misi pertama yang memberi pandangan jelas ke wilayah kutub Jupiter."
      ],
      palette: { sky: 0x35404a, fog: 0x71808a, fogDensity: 0.0118, cloud: "#cbd3d5", cloud2: "#6d777d", accent: 0xd2e1e3, lightning: 0xe9f8ff },
      wind: { x: 0.25, z: 0.75 },
      turbulence: 1.05,
      spawn: { x: -34, y: 13, z: 34, yaw: Math.PI * 0.78, pitch: -0.06 },
      observations: [
        { id: "polar-center", name: "Siklon Pusat", category: "POLAR PUSARAN BADAI", position: [3, 4, -16], radius: 11, source: SOURCES.polar, lead: "Pusaran pusat menjadi jangkar pola badai di kutub utara Jupiter.", why: "Susunan yang cukup tetap menantang model sederhana tentang bagaimana badai besar seharusnya saling bertabrakan.", facts: ["Kutub utara punya satu siklon pusat.", "Delapan siklon besar mengelilinginya.", "Geometri kumpulan badai dapat bertahan dalam jangka panjang."] },
        { id: "polar-ring", name: "Siklon Circumpolar", category: "CIRCUMPOLAR", position: [-27, -3, 8], radius: 10, source: SOURCES.polar, lead: "Siklon besar lain mengitari pusat tanpa langsung menyatu dengannya.", why: "Saling pengaruh antar pusaran badai menunjukkan tentang gerakan bahan yang bisa mengalir pada planet berputar cepat.", facts: ["JunoCam memotret detail pusaran circumpolar.", "Masing-masing badai dapat berukuran sangat besar.", "Kutub Jupiter tampak sangat berbeda dari pita ekuatornya."] },
        { id: "polar-kabut tipis", name: "Kabut Kutub", category: "KABUT TIPIS", position: [25, 18, 20], radius: 9, source: SOURCES.facts, lead: "Lapisan kabut tinggi memberi tekstur tambahan di atas sistem badai kutub.", why: "Butiran kecil butiran kecil di udara dan awan tinggi membantu melacak sirkulasi di atas pusaran besar.", facts: ["Udara atas Jupiter punya kabut tipis dan awan gas bernama amonia.", "Cahaya Matahari menyebar melalui butiran kecil di ketinggian tinggi.", "Bentuk awan atas dapat bergerak berbeda dari lapisan yang lebih dalam."] }
      ]
    }
  ]);

  class JupiterAtmosphereWorld {
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
          const samples = 80;
          const r0 = radius * (0.28 + ring * 0.095);
          for (let i = 0; i <= samples; i++) {
            const t = i / samples * Math.PI * 2;
            const wobble = Math.sin(t * turns + ring * 0.9) * radius * 0.04;
            points.push(new T.Vector3(Math.cos(t) * (r0 + wobble), Math.sin(t * 2 + ring) * 1.2, Math.sin(t) * (r0 * 0.58 + wobble)));
          }
          const geometry = new T.BufferGeometry().setFromPoints(points);
          const line = new T.LineLoop(geometry, material.clone());
          line.rotation.x = (this.rand() - 0.5) * 0.1;
          group.add(line);
        }
        group.userData.rotationSpeed = 0.025 + this.rand() * 0.025;
        this.group.add(group);
        this.vortexGroups.push(group);
        return group;
      };

      if (this.destination.id === "grs") addVortex([4, 4, -15], 31, 3.4, 0xd48263, 0.34);
      if (this.destination.id === "polar") {
        addVortex([3, 4, -16], 24, 4.1, 0xc4d3d6, 0.30);
        const orbitRadius = 36;
        for (let i = 0; i < 8; i++) {
          const a = i / 8 * Math.PI * 2;
          addVortex([Math.cos(a) * orbitRadius, -5 + Math.sin(i) * 3, -16 + Math.sin(a) * orbitRadius * 0.55], 8.5, 2.4, 0x9eacb3, 0.18);
        }
      }
      if (this.destination.id === "hotspot") {
        const disk = new T.Mesh(
          new T.CircleGeometry(28, 64),
          new T.MeshBasicMaterial({ color: 0x34291f, transparent: true, opacity: 0.32, depthWrite: false, side: T.DoubleSide, fog: true })
        );
        disk.rotation.x = -Math.PI / 2;
        disk.position.set(10, 5, -13);
        this.group.add(disk);
      }
      if (this.destination.id === "bands") {
        for (let i = -2; i <= 2; i++) {
          const lineGeometry = new T.BufferGeometry().setFromPoints([
            new T.Vector3(-90, i * 13, -18 + i * 3),
            new T.Vector3(90, i * 13, -18 + i * 3)
          ]);
          const line = new T.Line(lineGeometry, new T.LineBasicMaterial({ color: i % 2 ? 0xe7d1aa : 0x755948, transparent: true, opacity: 0.24, depthWrite: false, fog: true }));
          this.group.add(line);
        }
      }

      const haze = new T.PointLight(accent, this.destination.id === "lightning" ? 0.8 : 0.45, 120, 2);
      haze.position.set(0, 8, -5);
      this.group.add(haze);
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
      return clamp(0.5 * Math.exp((this.maxY - y) / 31.5), 0.45, 6.4);
    }

    layerAtPressure(pressure) {
      if (pressure < 0.95) return "AWAN GAS AMONIA";
      if (pressure < 2.2) return "NH4SH / AWAN MENENGAH";
      return "AWAN AIR LEBIH DALAM";
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

  class JupiterFullExploration {
    constructor(jupiterScene) {
      this.jupiter = jupiterScene;
      this.root = document.getElementById("jupiter-full-exploration");
      this.entryButton = document.getElementById("jupiter-full-explore-button");
      if (!this.jupiter || !this.root || !this.entryButton) return;

      this.viewport = document.getElementById("jupiter-full-viewport");
      this.inputLayer = document.getElementById("jupiter-full-orbit-input");
      this.qualityPanel = document.getElementById("jupiter-quality-panel");
      this.qualityOptions = document.getElementById("jupiter-quality-options");
      this.qualityClose = document.getElementById("jupiter-quality-close");
      this.qualityStart = document.getElementById("jupiter-quality-start");
      this.qualityLabel = document.getElementById("jupiter-quality-selected-label");
      this.qualityNote = document.getElementById("jupiter-quality-device-note");
      this.selector = document.getElementById("jupiter-region-selector");
      this.selectorClose = document.getElementById("jupiter-region-selector-close");
      this.selectorGrid = document.getElementById("jupiter-region-grid");
      this.hudLocation = document.getElementById("jupiter-full-hud-location");
      this.hudDepth = document.getElementById("jupiter-full-hud-depth");
      this.hudSpeed = document.getElementById("jupiter-full-hud-speed");
      this.hudAltitude = document.getElementById("jupiter-full-hud-altitude");
      this.hudTarget = document.getElementById("jupiter-full-hud-target");
      this.hudPressure = document.getElementById("jupiter-full-hud-pressure");
      this.hudType = document.getElementById("jupiter-full-hud-region-type");
      this.hudQuality = document.getElementById("jupiter-full-hud-quality");
      this.hudData = document.getElementById("jupiter-full-hud-data");
      this.objectives = document.getElementById("jupiter-objectives-panel");
      this.objectivesRegion = document.getElementById("jupiter-objectives-region");
      this.objectivesIntro = document.getElementById("jupiter-objectives-intro");
      this.objectivesList = document.getElementById("jupiter-objectives-list");
      this.objectivesCount = document.getElementById("jupiter-discovery-count");
      this.objectivesBar = document.getElementById("jupiter-discovery-bar");
      this.objectivesCollapse = document.getElementById("jupiter-objectives-collapse");
      this.objectivesToggle = document.getElementById("jupiter-objectives-toggle");
      this.nextTarget = document.getElementById("jupiter-next-target");
      this.nextTargetName = document.getElementById("jupiter-next-target-name");
      this.nextTargetDistance = document.getElementById("jupiter-next-target-distance");
      this.info = document.getElementById("jupiter-landmark-card");
      this.infoMinimize = document.getElementById("jupiter-landmark-minimize");
      this.infoToggle = document.getElementById("jupiter-info-toggle");
      this.infoName = document.getElementById("jupiter-landmark-name");
      this.infoType = document.getElementById("jupiter-landmark-type");
      this.infoCoords = document.getElementById("jupiter-landmark-coords");
      this.infoImage = document.getElementById("jupiter-landmark-image");
      this.infoCaption = document.getElementById("jupiter-landmark-image-caption");
      this.infoMedia = document.getElementById("jupiter-landmark-media");
      this.infoDescription = document.getElementById("jupiter-landmark-description");
      this.infoFacts = document.getElementById("jupiter-landmark-facts");
      this.infoSource = document.getElementById("jupiter-landmark-source");
      this.observationPrompt = document.getElementById("jupiter-observation-prompt");
      this.observationPromptTitle = document.getElementById("jupiter-observation-prompt-title");
      this.observeButton = document.getElementById("jupiter-observe-button");
      this.observationCard = document.getElementById("jupiter-observation-card");
      this.observationClose = document.getElementById("jupiter-observation-close");
      this.observationTitle = document.getElementById("jupiter-observation-title");
      this.observationMeta = document.getElementById("jupiter-observation-meta");
      this.observationLead = document.getElementById("jupiter-observation-lead");
      this.observationWhy = document.getElementById("jupiter-observation-why");
      this.observationDeep = document.getElementById("jupiter-observation-deep");
      this.observationSource = document.getElementById("jupiter-observation-source");
      this.observationStatus = document.getElementById("jupiter-observation-status");
      this.actionsRoot = this.root.querySelector(".venus-full-actions");
      this.actionsMenuToggle = document.getElementById("jupiter-actions-menu-toggle");
      this.locationButton = document.getElementById("jupiter-location-toggle");
      this.fullscreenButton = document.getElementById("jupiter-fullscreen-toggle");
      this.exitButton = document.getElementById("jupiter-full-exit");
      this.loading = document.getElementById("jupiter-full-loading");
      this.loadingTitle = document.getElementById("jupiter-full-loading-title");
      this.loadingStatus = document.getElementById("jupiter-full-loading-status");
      this.loadingProgress = document.getElementById("jupiter-full-loading-progress");
      this.errorPanel = document.getElementById("jupiter-full-error");
      this.errorMessage = document.getElementById("jupiter-full-error-message");
      this.errorReturn = document.getElementById("jupiter-full-error-return");
      this.tutorial = document.getElementById("jupiter-full-tutorial");
      this.tutorialClose = document.getElementById("jupiter-tutorial-close");
      this.boundaryHint = document.getElementById("jupiter-boundary-hint");
      this.mobileControls = [...this.root.querySelectorAll("[data-jupiter-control]")];

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
      this.jupiter.fullExploration = this;
      this.jupiter.fullExplorationActive = false;
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
      this.qualityOptions?.querySelectorAll("[data-jupiter-quality]").forEach(button => {
        const selected = button.dataset.jupiterQuality === key;
        button.classList.toggle("is-selected", selected);
        button.setAttribute("aria-checked", String(selected));
        const recommendation = button.querySelector("[data-quality-recommendation]");
        if (recommendation) recommendation.textContent = button.dataset.jupiterQuality === this.recommendedQuality ? "DIREKOMENDASIKAN" : "";
      });
      if (this.qualityLabel) this.qualityLabel.textContent = this.quality.label;
      if (this.hudQuality) this.hudQuality.textContent = this.quality.label;
      if (this.qualityNote) this.qualityNote.textContent = `Rekomendasi perangkat: ${QUALITY[this.recommendedQuality].label}. Kualitas mengatur jumlah awan, ketajaman, dan detail efek udara.`;
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
        button.className = "venus-region-card jupiter-region-card";
        button.dataset.jupiterRegion = destination.id;
        button.innerHTML = `<span class="venus-region-preview jupiter-region-preview jupiter-region-preview-${destination.preview}" aria-hidden="true"><i></i><b>${destination.short}</b></span><span class="venus-region-index">${String(index + 1).padStart(2, "0")}</span><strong>${destination.name}</strong><span class="venus-region-descriptor">${destination.descriptor}</span><small>${destination.locationLabel}</small><em>${destination.category}</em><span class="venus-region-source">NASA / JPL · Juno / Galileo</span>`;
        fragment.append(button);
      });
      this.selectorGrid?.replaceChildren(fragment);
      this.selectDestination(this.selected.id);
    }

    selectDestination(id) {
      this.selected = DESTINATIONS.find(destination => destination.id === id) || DESTINATIONS[0];
      this.selectorGrid?.querySelectorAll("[data-jupiter-region]").forEach(button => {
        const selected = button.dataset.jupiterRegion === this.selected.id;
        button.classList.toggle("is-selected", selected);
        button.setAttribute("aria-pressed", String(selected));
      });
    }

    bind() {
      this.entryButton.addEventListener("click", () => this.openEntryFlow());
      this.qualityClose?.addEventListener("click", () => this.closeEntryFlow());
      this.qualityStart?.addEventListener("click", () => this.showSelector());
      this.qualityOptions?.addEventListener("click", event => {
        const button = event.target.closest("[data-jupiter-quality]");
        if (button) this.applyQuality(button.dataset.jupiterQuality);
      });
      this.selectorClose?.addEventListener("click", () => {
        if (this.state === "selecting-world") this.closeSelectorToWorld();
        else this.closeEntryFlow();
      });
      this.selectorGrid?.addEventListener("click", event => {
        const button = event.target.closest("[data-jupiter-region]");
        if (!button) return;
        const destination = DESTINATIONS.find(item => item.id === button.dataset.jupiterRegion);
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
        if (!this.jupiter.fullExplorationActive) return;
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
        const control = button.dataset.jupiterControl;
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
            window.AntaraProgress?.trackFull?.("jupiter", destination.id, destination.name);
          }
        } catch {}
      }
    }

    openEntryFlow() {
      if (!this.jupiter.active || this.jupiter.travelMode || this.jupiter.fullExplorationActive) return;
      this.syncSavedDestinationProgress();
      if (this.jupiter.exploring) this.jupiter.exitExploration();
      this.state = "configuring";
      this.jupiter.fullExplorationActive = true;
      this.jupiter.element.classList.add("is-jupiter-full-active");
      document.getElementById("mission")?.classList.add("is-jupiter-full");
      this.root.hidden = false;
      this.root.inert = false;
      this.root.setAttribute("aria-hidden", "false");
      this.entryButton.disabled = true;
      this.qualityPanel.hidden = false;
      this.selector.hidden = true;
      if (this.errorPanel) this.errorPanel.hidden = true;
      this.hideWorldUi();
      this.root.classList.remove("is-active", "is-preparing", "is-exiting");
      document.getElementById("announcement").textContent = "Pilih kualitas grafis sebelum masuk ke udara Jupiter.";
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
      document.getElementById("announcement").textContent = "Pilih wilayah udara Jupiter yang ingin dimasuki.";
    }

    async prepareRenderer() {
      if (this.renderer) return;
      await this.jupiter.prepare();
      const T = this.jupiter.THREE;
      if (!T) throw new Error("WebGL2 tidak tersedia. Eksplorasi udara Jupiter memerlukan mesin gambar 3D 3D.");
      this.THREE = T;
      const canvas = document.createElement("canvas");
      canvas.className = "jupiter-full-canvas";
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
        this.world = new JupiterAtmosphereWorld(this.THREE, this.scene, this.renderer, destination, this.quality);
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
        window.AntaraProgress?.trackFull?.("jupiter", destination.id, destination.name);
        if (this.actionsRoot) this.actionsRoot.hidden = false;
        const compactUi = this.isMobileUi();
        this.infoOpen = !compactUi;
        this.objectiveOpen = !compactUi;
        this.actionsOpen = false;
        this.syncPanels();
        this.startLoop();
        this.showTutorial();
        document.getElementById("announcement").textContent = `Tiba di ${destination.name}. Kamu sekarang terbang bebas di udara Jupiter.`;
      } catch (error) {
        console.error("Jupiter Full Exploration failed", error);
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
      this.objectivesToggle.setAttribute("aria-label", `Buka tujuan eksplorasi Jupiter, ${count} dari ${total} selesai`);
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
      console.warn("Jupiter Full Exploration:", error);
      this.forceReset();
      document.getElementById("announcement").textContent = "Kembali ke panorama Jupiter.";
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
      document.getElementById("announcement").textContent = "Kembali ke panorama Jupiter.";
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
      this.jupiter.fullExplorationActive = false;
      this.jupiter.element.classList.remove("is-jupiter-full-active");
      document.getElementById("mission")?.classList.remove("is-jupiter-full");
      this.entryButton.disabled = false;
      this.jupiter.caption.inert = false;
      this.jupiter.resize?.();
    }
  }

  window.JupiterFullExploration = JupiterFullExploration;
  window.ANTARA_JUPITER_FULL_DESTINATIONS = DESTINATIONS;
})();
