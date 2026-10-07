"use strict";

// Mercury uses a MESSENGER MDIS basemap derived from the USGS/PDS global mosaic.
// Geographic targets use planetocentric latitude and positive-east longitude.
const MERCURY_TEXTURE_LONGITUDE_OFFSET_DEG = 0;
const MERCURY_DEG_TO_RAD = Math.PI / 180;
const MERCURY_TAU = Math.PI * 2;
const MERCURY_EXPLORATION_ROLL = 0.055;
const MERCURY_EXPLORATION_DISTANCE_SCALE_DESKTOP = 1.035;
const MERCURY_EXPLORATION_DISTANCE_SCALE_MOBILE = 1.045;
const MERCURY_EXPLORATION_CENTER_X_DESKTOP = 0.23;
const MERCURY_EXPLORATION_CENTER_Y_DESKTOP = 0.055;
const MERCURY_SURFACE_TEXTURES = Object.freeze({
  desktop: [
    "https://upload.wikimedia.org/wikipedia/commons/thumb/c/c8/Mercury_MESSENGER_MDIS_Basemap_BDR_Mosaic_Global_32ppd.jpg/3840px-Mercury_MESSENGER_MDIS_Basemap_BDR_Mosaic_Global_32ppd.jpg",
    "https://upload.wikimedia.org/wikipedia/commons/thumb/c/c8/Mercury_MESSENGER_MDIS_Basemap_BDR_Mosaic_Global_32ppd.jpg/2560px-Mercury_MESSENGER_MDIS_Basemap_BDR_Mosaic_Global_32ppd.jpg",
    "https://assets.science.nasa.gov/dynamicimage/assets/science/psd/photojournal/pia/pia12/pia12397/PIA12397.jpg?crop=faces%2Cfocalpoint&fit=clip&h=767&w=1533"
  ],
  mobile: [
    "https://upload.wikimedia.org/wikipedia/commons/thumb/c/c8/Mercury_MESSENGER_MDIS_Basemap_BDR_Mosaic_Global_32ppd.jpg/2560px-Mercury_MESSENGER_MDIS_Basemap_BDR_Mosaic_Global_32ppd.jpg",
    "https://assets.science.nasa.gov/dynamicimage/assets/science/psd/photojournal/pia/pia12/pia12397/PIA12397.jpg?crop=faces%2Cfocalpoint&fit=clip&h=767&w=1533"
  ]
});
const MERCURY_TEXTURE_SOURCE = "https://astrogeology.usgs.gov/search/map/mercury_messenger_mdis_global_basemap_bdr_166m";

const wrapMercuryRadians = angle => Math.atan2(Math.sin(angle), Math.cos(angle));
const unwrapMercuryAngleNear = (angle, reference) => reference + wrapMercuryRadians(angle - reference);

const mercuryLocationOrientation = location => {
  const longitude = wrapMercuryRadians((location.longitudeEast + MERCURY_TEXTURE_LONGITUDE_OFFSET_DEG) * MERCURY_DEG_TO_RAD);
  return {
    yaw: -Math.PI / 2 - longitude,
    pitch: location.latitude * MERCURY_DEG_TO_RAD,
    roll: MERCURY_EXPLORATION_ROLL
  };
};

const mercurySurfacePoint = (location, radius = 1) => {
  const latitude = location.latitude * MERCURY_DEG_TO_RAD;
  const longitude = wrapMercuryRadians((location.longitudeEast + MERCURY_TEXTURE_LONGITUDE_OFFSET_DEG) * MERCURY_DEG_TO_RAD);
  const cosLatitude = Math.cos(latitude);
  return {
    x: radius * cosLatitude * Math.cos(longitude),
    y: radius * Math.sin(latitude),
    z: -radius * cosLatitude * Math.sin(longitude)
  };
};

const MERCURY_EXPLORATION_STOPS = Object.freeze([
  {
    images: [
      {
        src: "https://assets.science.nasa.gov/dynamicimage/assets/science/psd/photojournal/pia/pia12/pia12397/PIA12397.jpg?crop=faces%2Cfocalpoint&fit=clip&h=767&w=1533",
        alt: "Mosaik global permukaan Merkurius dari citra MESSENGER dan Mariner 10",
        credit: "NASA/JHU APL/Carnegie/USGS",
        source: "https://science.nasa.gov/photojournal/full-global-mercury-mosaic/",
        license: "NASA image policy",
        licenseUrl: "https://www.nasa.gov/nasa-brand-center/images-and-media/",
        caption: "Mosaik global Merkurius · MESSENGER",
        fit: "cover"
      }
    ],
    title: "Planet Terkecil",
    kicker: "POSISI & UKURAN",
    subtitle: "Dunia batuan paling dekat dengan Matahari",
    summary: "Merkurius adalah planet terdekat dari Matahari sekaligus planet utama terkecil di Tata Surya. Ukurannya hanya sedikit lebih besar daripada Bulan, tetapi permukaannya menyimpan sejarah tumbukan yang sangat panjang.",
    facts: [
      "Jari-jari Merkurius sekitar 2.440 km, dengan diameter sekitar 4.880 km.",
      "Jarak rata-ratanya dari Matahari sekitar 58 juta km atau 0,39 AU.",
      "Merkurius adalah planet batuan tanpa cincin dan tanpa satelit alami."
    ],
    source: "https://science.nasa.gov/mercury/facts/",
    location: null,
    orientation: { yaw: 0.62, pitch: 0.06, roll: MERCURY_EXPLORATION_ROLL },
    shift: { x: 0, y: 0 }
  },
  {
    images: [
      {
        src: "./assets/mercury-orbit-rotation.svg",
        alt: "Diagram orbit Merkurius dan resonansi rotasi tiga banding dua",
        credit: "ANTARA · data NASA Science",
        source: "https://science.nasa.gov/mercury/facts/",
        caption: "Orbit 88 hari dan resonansi spin-orbit 3:2",
        fit: "contain"
      }
    ],
    title: "Tahun 88 Hari",
    kicker: "ORBIT & ROTASI",
    subtitle: "Gerak cepat mengelilingi Matahari, rotasi yang jauh lebih lambat",
    summary: "Merkurius menyelesaikan satu orbit hanya dalam sekitar 88 hari Bumi. Rotasinya jauh lebih lambat dan terkunci dalam resonansi 3:2, sehingga tiga putaran pada sumbu terjadi selama dua kali orbit.",
    facts: [
      "Satu tahun Merkurius berlangsung sekitar 88 hari Bumi.",
      "Rotasi siderealnya sekitar 59 hari Bumi.",
      "Satu hari Matahari di Merkurius, dari siang ke siang berikutnya, berlangsung sekitar 176 hari Bumi."
    ],
    source: "https://science.nasa.gov/mercury/facts/",
    location: null,
    orientation: { yaw: 1.04, pitch: 0.04, roll: MERCURY_EXPLORATION_ROLL },
    shift: { x: 0, y: 0 }
  },
  {
    images: [
      {
        src: "https://assets.science.nasa.gov/dynamicimage/assets/science/psd/photojournal/pia/pia19/pia19247/PIA19247.jpg?crop=faces%2Cfocalpoint&fit=clip&h=1550&w=2044",
        alt: "Peta suhu maksimum wilayah kutub utara Merkurius dari data MESSENGER",
        credit: "NASA/JHU APL/Carnegie",
        source: "https://science.nasa.gov/photojournal/hot-and-cold/",
        license: "NASA image policy",
        licenseUrl: "https://www.nasa.gov/nasa-brand-center/images-and-media/",
        caption: "Hot and Cold · suhu permukaan kutub Merkurius",
        fit: "cover",
        position: "50% 56%"
      },
      {
        src: "./assets/mercury-temperature-diagram.svg",
        alt: "Diagram edukasi kontras suhu sisi siang dan malam Merkurius",
        credit: "ANTARA · data NASA Science",
        source: "https://science.nasa.gov/mercury/facts/",
        caption: "Kontras suhu siang dan malam Merkurius",
        fit: "contain"
      }
    ],
    title: "Panas dan Dingin Ekstrem",
    kicker: "SUHU PERMUKAAN",
    subtitle: "Tanpa atmosfer tebal untuk menahan dan menyebarkan panas",
    summary: "Kedekatannya dengan Matahari membuat sisi siang Merkurius sangat panas, tetapi malamnya bisa membeku ekstrem. Perbedaan ini terjadi karena Merkurius hampir tidak memiliki atmosfer tebal yang mampu menyimpan panas.",
    facts: [
      "Suhu permukaan pada siang hari dapat mencapai sekitar 430 °C.",
      "Pada malam hari suhu dapat turun hingga sekitar -180 °C.",
      "Wilayah kutub yang selalu teduh bahkan dapat mempertahankan es air di dalam kawah tertentu."
    ],
    source: "https://science.nasa.gov/mercury/facts/",
    location: null,
    orientation: { yaw: 1.42, pitch: 0.08, roll: MERCURY_EXPLORATION_ROLL },
    shift: { x: 0, y: 0 }
  },
  {
    images: [
      {
        src: "https://assets.science.nasa.gov/dynamicimage/assets/science/psd/photojournal/pia/pia19/pia19418/PIA19418.jpg?crop=faces%2Cfocalpoint&fit=clip&h=3094&w=4096",
        alt: "Peta emisi sodium pada eksosfer dan ekor Merkurius dari MESSENGER",
        credit: "NASA/JHU APL/Carnegie",
        source: "https://science.nasa.gov/photojournal/mercurys-sodium-tail-2/",
        license: "NASA image policy",
        licenseUrl: "https://www.nasa.gov/nasa-brand-center/images-and-media/",
        caption: "Mercury's Sodium Tail · MESSENGER MASCS/UVVS",
        fit: "contain"
      },
      {
        src: "./assets/mercury-exosphere-diagram.svg",
        alt: "Diagram edukasi eksosfer tipis dan ekor sodium Merkurius",
        credit: "ANTARA · data NASA MESSENGER",
        source: "https://science.nasa.gov/photojournal/mercurys-sodium-tail-2/",
        caption: "Eksosfer tipis dan ekor sodium",
        fit: "contain"
      }
    ],
    title: "Eksosfer yang Sangat Tipis",
    kicker: "HAMPIR TANPA ATMOSFER",
    subtitle: "Partikel tipis menggantikan selimut udara seperti di Bumi",
    summary: "Merkurius tidak memiliki atmosfer padat. Di sekelilingnya hanya ada eksosfer sangat tipis yang tersusun dari atom-atom yang terlepas dari permukaan akibat angin Matahari dan tumbukan mikrometeoroid.",
    facts: [
      "Eksosfer Merkurius mengandung antara lain oksigen, natrium, hidrogen, helium, dan kalium.",
      "Gravitasi permukaan Merkurius sekitar 3,7 m/s².",
      "Merkurius memiliki 0 bulan dan 0 cincin."
    ],
    source: "https://science.nasa.gov/mercury/facts/",
    location: null,
    orientation: { yaw: 1.84, pitch: 0.02, roll: MERCURY_EXPLORATION_ROLL },
    shift: { x: 0, y: 0 }
  },
  {
    images: [
      {
        src: "https://assets.science.nasa.gov/dynamicimage/assets/science/psd/photojournal/pia/pia19/pia19213/PIA19213.jpg?crop=faces%2Cfocalpoint&fit=clip&h=3130&w=3130",
        alt: "Mosaik MESSENGER memperlihatkan cekungan tumbukan Caloris di Merkurius",
        credit: "NASA/JHU APL/Carnegie/USGS",
        source: "https://science.nasa.gov/photojournal/the-mighty-caloris/",
        license: "NASA image policy",
        licenseUrl: "https://www.nasa.gov/nasa-brand-center/images-and-media/",
        caption: "Caloris Basin · MESSENGER",
        fit: "cover"
      }
    ],
    title: "Caloris Planitia",
    kicker: "CEKUNGAN TUMBUKAN",
    subtitle: "Salah satu cekungan tumbukan terbesar di Tata Surya",
    summary: "Caloris adalah bekas tumbukan raksasa yang menjadi salah satu ciri paling menonjol di Merkurius. Cekungan ini dikelilingi pegunungan cincin dan sebagian lantainya kemudian tertutup aliran lava.",
    facts: [
      "Caloris Basin berdiameter sekitar 1.525 km.",
      "Pusat Caloris Basin berada sekitar 31,5° LU dan 162,7° BT pada pemetaan MESSENGER NASA.",
      "Bentang tumbukan raksasa ini membantu ilmuwan mempelajari sejarah awal kerak Merkurius."
    ],
    source: "https://science.nasa.gov/photojournal/the-mighty-caloris/",
    location: { label: "Caloris Basin", latitude: 31.5, longitudeEast: 162.7, source: "https://science.nasa.gov/photojournal/the-mighty-caloris/" },
    shift: { x: 0.006, y: -0.005 }
  },
  {
    images: [
      {
        src: "https://assets.science.nasa.gov/dynamicimage/assets/science/psd/photojournal/pia/pia18/pia18151/PIA18151.jpg?crop=faces%2Cfocalpoint&fit=clip&h=703&w=1100",
        alt: "Peta struktur tektonik Merkurius yang memperlihatkan ribuan punggungan dan tebing kontraksi",
        credit: "NASA/JHU APL/Carnegie/USGS",
        source: "https://science.nasa.gov/photojournal/the-incredible-shrinking-mercury/",
        license: "NASA image policy",
        licenseUrl: "https://www.nasa.gov/nasa-brand-center/images-and-media/",
        caption: "Jejak kontraksi global Merkurius · MESSENGER",
        fit: "cover"
      }
    ],
    title: "Planet yang Menyusut",
    kicker: "TEBING & KONTRAKSI",
    subtitle: "Pendinginan interior meninggalkan tebing panjang di seluruh permukaan",
    summary: "Saat interior Merkurius mendingin selama miliaran tahun, planet ini menyusut. Keraknya terdorong dan patah, membentuk tebing curam atau lobate scarps yang memotong kawah dan dataran tua.",
    facts: [
      "Lobate scarps adalah bukti bahwa kerak Merkurius mengalami pemendekan akibat kontraksi global.",
      "Sebagian tebing memanjang hingga ratusan kilometer.",
      "MESSENGER memetakan struktur tektonik ini dengan cakupan global yang jauh lebih lengkap."
    ],
    source: "https://science.nasa.gov/mercury/facts/",
    location: null,
    orientation: { yaw: 2.44, pitch: -0.04, roll: MERCURY_EXPLORATION_ROLL },
    shift: { x: 0, y: 0 }
  },
  {
    images: [
      {
        src: "https://www.esa.int/var/esa/storage/images/esa_multimedia/images/2024/09/bepicolombo_says_goodbye_to_mercury_for_the_fourth_time/26299692-11-eng-GB/BepiColombo_says_goodbye_to_Mercury_for_the_fourth_time.jpg",
        alt: "Merkurius dipotret wahana ESA JAXA BepiColombo saat lintasan dekat 2024",
        credit: "ESA/BepiColombo/MTM",
        source: "https://www.esa.int/ESA_Multimedia/Images/2024/09/BepiColombo_says_goodbye_to_Mercury_for_the_fourth_time",
        license: "CC BY-SA 3.0 IGO / ESA Standard Licence",
        licenseUrl: "https://creativecommons.org/licenses/by-sa/3.0/igo/",
        caption: "BepiColombo dekat Merkurius · M-CAM 2",
        fit: "cover",
        position: "50% 43%"
      },
      {
        src: "./assets/mercury-missions-timeline.svg",
        alt: "Linimasa eksplorasi Merkurius dari Mariner 10, MESSENGER hingga BepiColombo",
        credit: "ANTARA · data NASA dan ESA",
        source: "https://www.esa.int/Science_Exploration/Space_Science/BepiColombo",
        caption: "Linimasa eksplorasi Merkurius",
        fit: "contain"
      }
    ],
    title: "Dari Mariner 10 ke BepiColombo",
    kicker: "EKSPLORASI MERKURIUS",
    subtitle: "Sedikit wahana pernah berani masuk ke lingkungan sedekat ini dengan Matahari",
    summary: "Mariner 10 membuka era eksplorasi Merkurius pada 1970-an. MESSENGER kemudian menjadi wahana pertama yang mengorbit Merkurius dan memetakan planet ini secara global. Kini BepiColombo melanjutkan penyelidikan dengan dua orbiter ilmiah.",
    facts: [
      "Mariner 10 melakukan tiga lintasan dekat Merkurius pada 1974-1975.",
      "MESSENGER mengorbit Merkurius selama lebih dari empat tahun dan menyelesaikan misinya pada 30 April 2015.",
      "BepiColombo memulai fase kedatangan pada September 2026 setelah Mercury Transfer Module berhasil dipisahkan; penangkapan ke orbit Merkurius direncanakan 21 November 2026 dan fase sains utama mulai April 2027."
    ],
    source: "https://www.esa.int/Enabling_Support/Operations/BepiColombo_begins_Mercury_arrival_with_MTM_separation_success",
    location: null,
    orientation: { yaw: 2.92, pitch: 0.05, roll: MERCURY_EXPLORATION_ROLL },
    shift: { x: 0, y: 0 }
  }
]);

// Mercury owns its renderer and animation loop. Loading is local and optional:
// the flight controller never waits for WebGL, a module, or an image to succeed.
window.MercuryScene = class MercuryScene {
  constructor() {
    this.element = document.getElementById("mercury-scene");
    this.viewport = document.getElementById("mercury-viewport");
    this.caption = this.element.querySelector(".mercury-caption");
    this.credit = this.element.querySelector(".mercury-credit");
    this.exploreButton = document.getElementById("mercury-explore-button");
    this.exploration = document.getElementById("mercury-exploration");
    this.explorationClose = document.getElementById("mercury-exploration-close");
    this.topicTitle = document.getElementById("mercury-topic-title");
    this.topicKicker = document.getElementById("mercury-topic-kicker");
    this.topicSubtitle = document.getElementById("mercury-topic-subtitle");
    this.topicScroll = document.getElementById("mercury-topic-scroll");
    this.topicSummary = document.getElementById("mercury-topic-summary");
    this.topicFacts = document.getElementById("mercury-topic-facts");
    this.topicSource = document.getElementById("mercury-topic-source");
    this.photoSource = document.getElementById("mercury-photo-source");
    this.topicCurrent = document.getElementById("mercury-topic-current");
    this.topicTotal = document.getElementById("mercury-topic-total");
    this.topicProgress = document.getElementById("mercury-topic-progress");
    this.topicPrev = document.getElementById("mercury-topic-prev");
    this.topicNext = document.getElementById("mercury-topic-next");
    this.focusReticle = document.getElementById("mercury-focus-reticle");
    this.focusLabel = document.getElementById("mercury-focus-label");
    this.focusContext = document.getElementById("mercury-focus-context");
    this.markerMedia = document.getElementById("mercury-marker-media");
    this.contextMedia = document.getElementById("mercury-context-media");
    this.motion = window.matchMedia("(prefers-reduced-motion: reduce)");
    this.active = false;
    this.time = 0;
    this.frame = null;
    this.mode = "pending";
    this.pointer = { x: 0, y: 0 };
    this.cameraOffset = { x: 0, y: 0 };
    this.exploring = false;
    this.explorationBlend = 0;
    this.explorationBlendTarget = 0;
    this.topicIndex = 0;
    this.topicYaw = 0.6;
    this.topicYawTarget = 0.6;
    this.topicPitch = 0.09;
    this.topicPitchTarget = 0.09;
    this.topicRoll = MERCURY_EXPLORATION_ROLL;
    this.topicRollTarget = MERCURY_EXPLORATION_ROLL;
    this.topicShift = { x: 0, y: 0 };
    this.topicShiftTarget = { x: 0, y: 0 };
    this.renderedRotation = 0.6;
    this.venusSurface = null;
    this.travelMode = null;
    this.travelStartedAt = 0;
    this.travelDuration = 6.2;
    this.travelCallbacks = {};
    this.travelRevealFired = false;
    this.travelCoveredFired = false;
    this.travelCompleteFired = false;
    this.travelTargetStartRotation = 0.3984;
    const firstGeographicStop = MERCURY_EXPLORATION_STOPS.find(stop => stop.location);
    this.markerLocalPoint = mercurySurfacePoint(firstGeographicStop.location);
    this.hasActiveLocation = false;
    this.caption.inert = true;
    this.exploration.inert = true;
    this.stars = Array.from({ length: 240 }, (_, n) => {
      const rand = seed => { const v = Math.sin(seed * 127.1 + 417.3) * 43758.5453; return v - Math.floor(v); };
      return { x: rand(n), y: rand(n + 400), z: rand(n + 800), size: rand(n + 1200) };
    });
    this.tick = this.tick.bind(this);
    this.topicTotal.textContent = String(MERCURY_EXPLORATION_STOPS.length).padStart(2, "0");
    this.topicProgress.replaceChildren(...MERCURY_EXPLORATION_STOPS.map(() => document.createElement("span")));
    this.setExplorationStop(0, { immediate: true, announce: false });
    this.exploreButton.addEventListener("click", () => this.enterExploration());
    this.explorationClose.addEventListener("click", () => this.exitExploration());
    this.topicPrev.addEventListener("click", () => this.setExplorationStop(this.topicIndex - 1));
    this.topicNext.addEventListener("click", () => this.setExplorationStop(this.topicIndex + 1));
    window.addEventListener("resize", () => { if (this.active) { this.resize(); this.render(); } });
    document.addEventListener("visibilitychange", () => {
      if (!this.active) return;
      cancelAnimationFrame(this.frame);
      this.frame = null;
      if (!document.hidden) { this.previous = performance.now(); this.tick(this.previous); }
    });
    this.motion.addEventListener("change", () => {
      if (!this.active) return;
      this.render();
      if (!this.motion.matches && !this.frame) { this.previous = performance.now(); this.tick(this.previous); }
    });
    this.element.addEventListener("pointermove", event => {
      if (event.pointerType !== "mouse" || this.motion.matches) return;
      const rect = this.element.getBoundingClientRect();
      this.pointer.x = (event.clientX - rect.left) / rect.width - 0.5;
      this.pointer.y = (event.clientY - rect.top) / rect.height - 0.5;
    });
    this.element.addEventListener("pointerleave", () => { this.pointer.x = this.pointer.y = 0; });
  }

  setVenusTravelSurface(surface) {
    if (!surface) return;
    this.venusSurface = surface;
    if (this.mode === "webgl" && this.THREE && this.travelVenusMaterial) {
      const texture = new this.THREE.Texture(surface);
      texture.colorSpace = this.THREE.SRGBColorSpace;
      texture.anisotropy = Math.min(8, this.renderer.capabilities.getMaxAnisotropy());
      texture.needsUpdate = true;
      const previous = this.travelVenusMaterial.map;
      this.travelVenusMaterial.map = texture;
      this.travelVenusMaterial.needsUpdate = true;
      previous?.dispose?.();
    }
  }

  makeVenusTravelSurface() {
    const canvas = document.createElement("canvas");
    canvas.width = 768; canvas.height = 384;
    const ctx = canvas.getContext("2d");
    const gradient = ctx.createLinearGradient(0, 0, 0, canvas.height);
    gradient.addColorStop(0, "#c5a16d");
    gradient.addColorStop(.45, "#9b6f3c");
    gradient.addColorStop(1, "#5f422c");
    ctx.fillStyle = gradient; ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.globalAlpha = .20;
    for (let i = 0; i < 95; i++) {
      const x = (Math.sin(i * 91.7) * .5 + .5) * canvas.width;
      const y = (Math.sin(i * 47.3 + 1.2) * .5 + .5) * canvas.height;
      const r = 12 + ((i * 37) % 58);
      ctx.strokeStyle = i % 2 ? "#ead0a1" : "#533922";
      ctx.lineWidth = 4 + (i % 5);
      ctx.beginPath(); ctx.ellipse(x, y, r * 2.4, r * .48, i * .17, 0, Math.PI * 2); ctx.stroke();
    }
    return canvas;
  }

  setExplorationStop(index, { immediate = false, announce = true } = {}) {
    const nextIndex = Math.max(0, Math.min(MERCURY_EXPLORATION_STOPS.length - 1, index));
    const stop = MERCURY_EXPLORATION_STOPS[nextIndex];
    this.topicIndex = nextIndex;
    this.hasActiveLocation = Boolean(stop.location);

    this.markerMedia.replaceChildren();
    this.markerMedia.hidden = true;
    this.contextMedia.replaceChildren();
    this.contextMedia.hidden = true;
    window.ExplorationMedia.render("mercury", stop, this.hasActiveLocation ? this.markerMedia : this.contextMedia);

    this.focusReticle.classList.remove("is-marker-visible");
    this.focusReticle.classList.add("is-relocating");
    const orientation = stop.location ? mercuryLocationOrientation(stop.location) : stop.orientation;
    this.topicYawTarget = immediate ? orientation.yaw : unwrapMercuryAngleNear(orientation.yaw, this.topicYaw);
    this.topicPitchTarget = orientation.pitch;
    this.topicRollTarget = orientation.roll ?? MERCURY_EXPLORATION_ROLL;
    this.topicShiftTarget = { ...(stop.shift || { x: 0, y: 0 }) };

    if (stop.location) {
      this.markerLocalPoint = mercurySurfacePoint(stop.location);
      if (this.markerAnchor) this.markerAnchor.position.set(this.markerLocalPoint.x, this.markerLocalPoint.y, this.markerLocalPoint.z);
      this.focusLabel.textContent = stop.location.label;
      const latitudeHemisphere = stop.location.latitude >= 0 ? "N" : "S";
      const longitude = ((stop.location.longitudeEast % 360) + 360) % 360;
      this.focusContext.textContent = `MERCURY · ${Math.abs(stop.location.latitude).toFixed(2)}°${latitudeHemisphere} · ${longitude.toFixed(2)}°E`;
    } else {
      this.focusLabel.textContent = "";
      this.focusContext.textContent = "";
    }

    if (immediate || this.motion.matches) {
      this.topicYaw = this.topicYawTarget;
      this.topicPitch = this.topicPitchTarget;
      this.topicRoll = this.topicRollTarget;
      this.topicShift = { ...this.topicShiftTarget };
    }

    this.exploration.classList.remove("is-switching");
    void this.exploration.offsetWidth;
    this.topicKicker.textContent = stop.kicker;
    this.topicTitle.textContent = stop.title;
    this.topicSubtitle.textContent = stop.subtitle;
    this.topicSummary.textContent = stop.summary;
    this.topicFacts.replaceChildren(...stop.facts.map(fact => {
      const item = document.createElement("li");
      item.textContent = fact;
      return item;
    }));
    if (this.topicScroll) this.topicScroll.scrollTop = 0;
    this.topicSource.href = stop.source;
    this.photoSource.hidden = true;
    this.photoSource.removeAttribute("href");
    this.photoSource.textContent = "";
    this.topicCurrent.textContent = String(nextIndex + 1).padStart(2, "0");
    this.topicPrev.disabled = nextIndex === 0;
    this.topicNext.disabled = nextIndex === MERCURY_EXPLORATION_STOPS.length - 1;
    Array.from(this.topicProgress.children).forEach((bar, i) => bar.classList.toggle("is-active", i === nextIndex));
    if (!immediate && !this.motion.matches) this.exploration.classList.add("is-switching");

    if (this.active) {
      if (!this.motion.matches && !this.frame) { this.previous = performance.now(); this.tick(this.previous); }
      else this.render();
    }
    if (announce && this.exploring) document.getElementById("announcement").textContent = `Eksplorasi Merkurius ${nextIndex + 1} dari ${MERCURY_EXPLORATION_STOPS.length}: ${stop.title}.`;
  }

  enterExploration() {
    if (!this.active || this.exploring) return;
    this.exploring = true;
    // Start from the arrival pose, then converge on the selected geographic target.
    this.topicYaw = this.renderedRotation;
    this.topicPitch = 0.09;
    this.topicRoll = MERCURY_EXPLORATION_ROLL;
    const activeStop = MERCURY_EXPLORATION_STOPS[this.topicIndex];
    const orientation = activeStop.location ? mercuryLocationOrientation(activeStop.location) : activeStop.orientation;
    this.topicYawTarget = unwrapMercuryAngleNear(orientation.yaw, this.topicYaw);
    this.topicPitchTarget = orientation.pitch;
    this.topicRollTarget = orientation.roll;
    this.explorationBlendTarget = 1;
    this.element.classList.add("is-exploring");
    this.caption.inert = true;
    this.exploration.inert = false;
    if (this.motion.matches) {
      this.explorationBlend = 1;
      this.topicYaw = this.topicYawTarget;
      this.topicPitch = this.topicPitchTarget;
      this.topicRoll = this.topicRollTarget;
      this.topicShift = { ...this.topicShiftTarget };
      this.render();
    } else if (!this.frame) {
      this.previous = performance.now();
      this.tick(this.previous);
    }
    document.getElementById("announcement").textContent = `Mode eksplorasi Merkurius dimulai. ${MERCURY_EXPLORATION_STOPS[this.topicIndex].title}.`;
    this.topicTitle.focus({ preventScroll: true });
  }

  exitExploration() {
    if (!this.exploring) return;
    this.exploring = false;
    this.explorationBlendTarget = 0;
    this.element.classList.remove("is-exploring");
    this.focusReticle.classList.remove("is-marker-visible");
    this.focusReticle.classList.add("is-relocating");
    this.exploration.inert = true;
    this.caption.inert = false;
    if (this.motion.matches) { this.explorationBlend = 0; this.render(); }
    else if (!this.frame) { this.previous = performance.now(); this.tick(this.previous); }
    document.getElementById("announcement").textContent = "Kembali ke panorama Merkurius.";
    this.exploreButton.focus({ preventScroll: true });
  }

  surfaceTextureCandidates() {
    const compact = Math.min(window.innerWidth || 9999, window.innerHeight || 9999) <= 820
      || (navigator.deviceMemory && navigator.deviceMemory <= 4);
    const defaults = compact ? MERCURY_SURFACE_TEXTURES.mobile : MERCURY_SURFACE_TEXTURES.desktop;
    const override = typeof window.ANTARA_MERCURY_TEXTURE === "string" ? window.ANTARA_MERCURY_TEXTURE.trim() : "";
    return override ? [override, ...defaults] : defaults;
  }

  loadImage(url, { timeoutMs = 18000, crossOrigin = true } = {}) {
    return new Promise((resolve, reject) => {
      const image = new Image();
      const timeout = setTimeout(() => {
        image.onload = image.onerror = null;
        reject(new Error(`Timed out loading ${url}`));
      }, timeoutMs);
      image.onload = async () => {
        clearTimeout(timeout);
        try { if (typeof image.decode === "function") await image.decode(); } catch (_) {}
        resolve(image);
      };
      image.onerror = () => { clearTimeout(timeout); reject(new Error(`Unable to load ${url}`)); };
      if (crossOrigin && /^https?:/i.test(url)) image.crossOrigin = "anonymous";
      image.decoding = "async";
      image.src = url;
    });
  }

  async loadMercurySurface() {
    const errors = [];
    for (const url of this.surfaceTextureCandidates()) {
      try {
        const image = await this.loadImage(url);
        if (image.naturalWidth < 1400 || image.naturalHeight < 700) throw new Error("Mercury map resolution too small");
        this.surfaceSource = url;
        return image;
      } catch (error) {
        errors.push(error);
      }
    }
    const error = new Error("No scientific Mercury surface texture could be loaded");
    error.causes = errors;
    throw error;
  }

  showTextureWarning() {
    let warning = this.element.querySelector(".mercury-texture-warning");
    if (!warning) {
      warning = document.createElement("div");
      warning.className = "mercury-texture-warning";
      warning.setAttribute("role", "status");
      warning.textContent = "Tekstur ilmiah Merkurius tidak dapat dimuat. Periksa koneksi aset.";
      this.element.append(warning);
    }
    warning.hidden = false;
  }

  hideTextureWarning() {
    const warning = this.element.querySelector(".mercury-texture-warning");
    if (warning) warning.hidden = true;
  }

  preloadExplorationImages() {
    if (this.infoImagePreloadStarted) return;
    this.infoImagePreloadStarted = true;
    const urls = [...new Set(MERCURY_EXPLORATION_STOPS.flatMap(stop => stop.images || []).map(image => image.src).filter(Boolean))];
    const work = () => {
      this.infoImagePreloads = urls.map(url => {
        const image = new Image();
        image.decoding = "async";
        image.src = url;
        return image;
      });
    };
    if ("requestIdleCallback" in window) requestIdleCallback(work, { timeout: 2500 });
    else setTimeout(work, 700);
  }

  prepare() {
    if (this.loading) return this.loading;
    this.loading = (async () => {
      const [moduleResult, imageResult] = await Promise.allSettled([
        import("./assets/vendor/three/three.module.min.js"),
        this.loadMercurySurface()
      ]);
      if (imageResult.status === "fulfilled") {
        this.surface = imageResult.value;
        this.element.dataset.texture = "scientific-map";
        this.element.dataset.textureWidth = String(this.surface.naturalWidth || this.surface.width || 0);
        this.hideTextureWarning();
      } else {
        this.surface = this.makeMissingTextureSurface();
        this.element.dataset.texture = "missing";
        this.showTextureWarning();
        console.error("Mercury scientific surface failed to load", imageResult.reason);
      }
      this.preloadExplorationImages();
      if (moduleResult.status === "fulfilled") {
        try { this.createThreeScene(moduleResult.value); }
        catch { this.createCanvasFallback(); }
      } else this.createCanvasFallback();
      this.resize();
      // Compile during the launch so arrival does not pay the shader startup cost.
      if (this.renderer) await this.renderer.compileAsync(this.scene, this.camera);
      if (this.active) this.render();
    })().catch(() => {
      // Even a device that cannot allocate a canvas can still show the CSS sphere.
      this.mode = "css";
      this.element.dataset.renderer = "css";
      this.viewport.innerHTML = '<div class="mercury-emergency-sphere"></div>';
    });
    return this.loading;
  }

  createThreeScene(THREE) {
    const canvas = document.createElement("canvas");
    const context = canvas.getContext("webgl2", { alpha: true, antialias: true, powerPreference: "high-performance" });
    if (!context) throw new Error("WebGL2 unavailable");
    this.THREE = THREE;
    this.renderer = new THREE.WebGLRenderer({ canvas, context, alpha: true, antialias: true });
    this.renderer.setClearColor(0x030812, 0);
    this.renderer.setPixelRatio(Math.min(devicePixelRatio || 1, window.innerWidth <= 700 ? 1.6 : 2));
    this.renderer.outputColorSpace = THREE.SRGBColorSpace;
    this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
    this.renderer.toneMappingExposure = 1.08;
    this.viewport.replaceChildren(canvas);
    this.scene = new THREE.Scene();
    this.camera = new THREE.PerspectiveCamera(36, 1, 0.1, 450);
    this.camera.position.z = 6;
    const texture = new THREE.Texture(this.surface);
    texture.colorSpace = THREE.SRGBColorSpace;
    texture.wrapS = THREE.RepeatWrapping;
    texture.wrapT = THREE.ClampToEdgeWrapping;
    texture.minFilter = THREE.LinearMipmapLinearFilter;
    texture.magFilter = THREE.LinearFilter;
    texture.generateMipmaps = true;
    texture.anisotropy = Math.max(1, Math.min(12, this.renderer.capabilities.getMaxAnisotropy()));
    texture.needsUpdate = true;
    const relief = texture.clone();
    relief.colorSpace = THREE.NoColorSpace;
    relief.minFilter = THREE.LinearMipmapLinearFilter;
    relief.magFilter = THREE.LinearFilter;
    relief.generateMipmaps = true;
    relief.anisotropy = texture.anisotropy;
    relief.needsUpdate = true;
    const material = new THREE.MeshStandardMaterial({
      map: texture,
      bumpMap: relief,
      bumpScale: 0.034,
      roughness: 0.91,
      metalness: 0,
      color: 0xffffff
    });
    material.map.name = "Mercury MESSENGER/USGS surface";
    material.bumpMap.name = "Mercury relief from MESSENGER surface";
    this.planet = new THREE.Mesh(new THREE.SphereGeometry(1, 128, 96), material);
    this.planet.rotation.set(0.09, 0.6, 0.12);
    this.planetGroup = new THREE.Group();
    this.planetGroup.add(this.planet);
    this.scene.add(this.planetGroup);

    // Real geographic anchor attached to the Mercury mesh. The existing DOM reticle
    // only visualizes this 3D point after projection into screen space.
    this.markerAnchor = new THREE.Object3D();
    this.markerAnchor.position.set(
      this.markerLocalPoint.x,
      this.markerLocalPoint.y,
      this.markerLocalPoint.z
    );
    this.planet.add(this.markerAnchor);

    this.markerWorldPosition = new THREE.Vector3();
    this.planetWorldPosition = new THREE.Vector3();
    this.markerProjectedPosition = new THREE.Vector3();
    this.markerSurfaceNormal = new THREE.Vector3();
    this.markerToCamera = new THREE.Vector3();
    this.arrivalEuler = new THREE.Euler();
    this.arrivalQuaternion = new THREE.Quaternion();
    this.exploreQuaternion = new THREE.Quaternion();
    this.yawQuaternion = new THREE.Quaternion();
    this.pitchQuaternion = new THREE.Quaternion();
    this.rollQuaternion = new THREE.Quaternion();
    this.axisX = new THREE.Vector3(1, 0, 0);
    this.axisY = new THREE.Vector3(0, 1, 0);
    this.axisZ = new THREE.Vector3(0, 0, 1);
    const sun = new THREE.DirectionalLight(0xfff5e8, 2.55);
    sun.position.set(-4.7, 2.8, 4.5);
    this.scene.add(sun, new THREE.AmbientLight(0xaeb4bb, 0.12));
    const fill = new THREE.DirectionalLight(0x6f7782, 0.09);
    fill.position.set(4, -1, -3);
    this.scene.add(fill);
    // Thin warm limb scattering; it is deliberately much subtler than an Earth halo.
    this.atmosphere = new THREE.Mesh(new THREE.SphereGeometry(1.008, 64, 40), new THREE.ShaderMaterial({
      transparent: true, depthWrite: false, blending: THREE.AdditiveBlending,
      vertexShader: `varying vec3 vWorld; varying vec3 vNormal;
        void main(){ vec4 world=modelMatrix*vec4(position,1.); vWorld=world.xyz;
        vNormal=normalize(mat3(modelMatrix)*normal); gl_Position=projectionMatrix*viewMatrix*world; }`,
      fragmentShader: `varying vec3 vWorld; varying vec3 vNormal;
        void main(){ vec3 n=normalize(vNormal); vec3 eye=normalize(cameraPosition-vWorld);
        float rim=pow(1.-max(dot(n,eye),0.),4.);
        float sun=max(dot(n,normalize(vec3(-4.7,2.8,4.5))),0.);
        gl_FragColor=vec4(.86,.81,.72,rim*(.012+.035*sun)); }`
    }));
    this.planetGroup.add(this.atmosphere);
    const travelSurface = this.venusSurface || this.makeVenusTravelSurface();
    const travelTexture = new THREE.Texture(travelSurface);
    travelTexture.colorSpace = THREE.SRGBColorSpace;
    travelTexture.anisotropy = Math.min(8, this.renderer.capabilities.getMaxAnisotropy());
    travelTexture.needsUpdate = true;
    this.travelVenusMaterial = new THREE.MeshStandardMaterial({ map: travelTexture, roughness: 0.97, metalness: 0, transparent: true, opacity: 1, color: 0xffd19a });
    this.travelVenus = new THREE.Mesh(new THREE.SphereGeometry(1, 112, 80), this.travelVenusMaterial);
    this.travelVenusGroup = new THREE.Group();
    this.travelVenusGroup.add(this.travelVenus);
    const travelGlow = new THREE.Mesh(new THREE.SphereGeometry(1.013, 64, 40), new THREE.MeshBasicMaterial({ color: 0xd99043, transparent: true, opacity: 0.05, blending: THREE.AdditiveBlending, depthWrite: false }));
    this.travelVenusGlow = travelGlow;
    this.travelVenusGroup.add(travelGlow);
    this.travelVenusGroup.visible = false;
    this.scene.add(this.travelVenusGroup);

    const positions = new Float32Array(this.stars.length * 3);
    this.stars.forEach((star, i) => positions.set([(star.x - 0.5) * 190, (star.y - 0.5) * 140, -20 - star.z * 160], i * 3));
    const geometry = new THREE.BufferGeometry();
    geometry.setAttribute("position", new THREE.BufferAttribute(positions, 3));
    this.starfield = new THREE.Points(geometry, new THREE.PointsMaterial({ color: 0xb5c6dc, size: 0.13, transparent: true, opacity: 0.55, depthWrite: false, sizeAttenuation: true }));
    this.scene.add(this.starfield);
    canvas.addEventListener("webglcontextlost", event => {
      event.preventDefault();
      // Continue the same cinematic clock in the software fallback after GPU loss.
      this.createCanvasFallback();
      this.resize();
      if (this.active) this.render();
    }, { once: true });
    this.mode = "webgl";
    this.element.dataset.renderer = this.mode;
  }

  makeMissingTextureSurface() {
    const canvas = document.createElement("canvas");
    canvas.width = 1024;
    canvas.height = 512;
    const ctx = canvas.getContext("2d");
    const gradient = ctx.createLinearGradient(0, 0, canvas.width, canvas.height);
    gradient.addColorStop(0, "#77756f");
    gradient.addColorStop(0.52, "#55534f");
    gradient.addColorStop(1, "#343434");
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    return canvas;
  }

  createCanvasFallback() {
    this.renderer?.dispose();
    this.renderer = null;
    this.canvas = document.createElement("canvas");
    this.ctx = this.canvas.getContext("2d");
    if (!this.ctx) throw new Error("Canvas unavailable");
    this.viewport.replaceChildren(this.canvas);
    const map = document.createElement("canvas");
    map.width = 1536; map.height = 768;
    const mapContext = map.getContext("2d", { willReadFrequently: true });
    mapContext.imageSmoothingEnabled = true;
    mapContext.imageSmoothingQuality = "high";
    mapContext.drawImage(this.surface, 0, 0, map.width, map.height);
    this.surfacePixels = mapContext.getImageData(0, 0, map.width, map.height).data;
    this.sphereCanvas = document.createElement("canvas");
    this.sphereCanvas.width = this.sphereCanvas.height = 360;
    this.sphereContext = this.sphereCanvas.getContext("2d");
    this.sphereImage = this.sphereContext.createImageData(360, 360);
    this.mode = "canvas";
    this.element.dataset.renderer = this.mode;
  }

  resize() {
    const parent = this.element.parentElement;
    this.width = parent.clientWidth;
    this.height = parent.clientHeight;
    this.mobile = this.width <= 700;
    const radius = this.mobile ? Math.min(this.width * 0.37, this.height * 0.21) : Math.min(this.height * 0.30, this.width * 0.24);
    this.finalDistance = this.height / (2 * Math.tan(Math.PI / 10) * radius);
    this.finalRadius = radius;
    if (this.mode === "webgl") {
      this.renderer.setPixelRatio(Math.min(devicePixelRatio || 1, this.mobile ? 1.6 : 2));
      this.renderer.setSize(this.width, this.height);
      this.camera.aspect = this.width / this.height;
      this.camera.updateProjectionMatrix();
    } else if (this.mode === "canvas") {
      const dpr = Math.min(devicePixelRatio || 1, 1.5);
      this.canvas.width = this.width * dpr; this.canvas.height = this.height * dpr;
      this.ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    }
  }

  start({ settled = false } = {}) {
    this.active = true;
    this.travelMode = null;
    this.travelCallbacks = {};
    this.travelCompleteFired = false;
    this.time = settled ? 12.6 : 0;
    this.announced = false;
    this.element.hidden = false;
    this.exploring = false;
    this.explorationBlend = this.explorationBlendTarget = 0;
    this.topicYaw = this.topicYawTarget = 0.6;
    this.topicPitch = this.topicPitchTarget = 0.09;
    this.topicRoll = this.topicRollTarget = MERCURY_EXPLORATION_ROLL;
    this.topicShift = { x: 0, y: 0 };
    this.topicShiftTarget = { ...MERCURY_EXPLORATION_STOPS[0].shift };
    this.element.classList.remove("is-exploring");
    this.caption.inert = true;
    this.exploration.inert = true;
    this.caption.classList.remove("is-visible");
    this.caption.style.opacity = "0";
    this.setExplorationStop(0, { immediate: true, announce: false });
    this.pointer.x = this.pointer.y = this.cameraOffset.x = this.cameraOffset.y = 0;
    this.prepare();
    this.resize();
    cancelAnimationFrame(this.frame);
    this.previous = performance.now();
    this.tick(this.previous);
  }

  stop() {
    this.active = false;
    this.travelMode = null;
    this.travelCallbacks = {};
    if (this.travelVenusGroup) this.travelVenusGroup.visible = false;
    cancelAnimationFrame(this.frame);
    this.frame = null;
    this.element.hidden = true;
    this.element.style.opacity = "0";
    this.element.classList.remove("is-exploring");
    this.exploring = false;
    this.explorationBlend = this.explorationBlendTarget = 0;
    this.caption.inert = true;
    this.exploration.inert = true;
    this.credit.tabIndex = -1;
    this.time = 0;
  }

  tick(now) {
    this.frame = null;
    if (!this.active || document.hidden) return;
    // Pause time when hidden; cap only anomalous gaps, not ordinary low frame rates.
    const delta = Math.min((now - this.previous) / 1000, 0.15);
    this.previous = now;
    this.time += delta;
    const damping = 1 - Math.exp(-delta * 2);
    this.cameraOffset.x += (this.pointer.x - this.cameraOffset.x) * damping;
    this.cameraOffset.y += (this.pointer.y - this.cameraOffset.y) * damping;
    const exploreDamping = this.motion.matches ? 1 : 1 - Math.exp(-delta * 2.5);
    const topicDamping = this.motion.matches ? 1 : 1 - Math.exp(-delta * 2.15);
    this.explorationBlend += (this.explorationBlendTarget - this.explorationBlend) * exploreDamping;
    this.topicYaw += (this.topicYawTarget - this.topicYaw) * topicDamping;
    this.topicPitch += (this.topicPitchTarget - this.topicPitch) * topicDamping;
    this.topicRoll += (this.topicRollTarget - this.topicRoll) * topicDamping;
    this.topicShift.x += (this.topicShiftTarget.x - this.topicShift.x) * topicDamping;
    this.topicShift.y += (this.topicShiftTarget.y - this.topicShift.y) * topicDamping;
    this.render();
    const explorationMoving = Math.abs(this.explorationBlendTarget - this.explorationBlend) > 0.001
      || Math.abs(this.topicYawTarget - this.topicYaw) > 0.001
      || Math.abs(this.topicPitchTarget - this.topicPitch) > 0.001
      || Math.abs(this.topicRollTarget - this.topicRoll) > 0.001;
    if (!this.motion.matches || this.time < 14 || this.mode === "pending" || explorationMoving || this.travelMode) this.frame = requestAnimationFrame(this.tick);
  }

  topicIsSettled() {
    const angularError = Math.abs(this.topicYawTarget - this.topicYaw)
      + Math.abs(this.topicPitchTarget - this.topicPitch)
      + Math.abs(this.topicRollTarget - this.topicRoll);
    const shiftError = Math.abs(this.topicShiftTarget.x - this.topicShift.x)
      + Math.abs(this.topicShiftTarget.y - this.topicShift.y);
    return this.explorationBlend > .94 && angularError < .03 && shiftError < .012;
  }

  setReticleProjection(x, y, visible) {
    if (!this.focusReticle) return;
    this.focusReticle.style.left = `${x}px`;
    this.focusReticle.style.top = `${y}px`;
    const show = Boolean(visible && this.exploring && this.topicIsSettled());
    this.focusReticle.classList.toggle("is-marker-visible", show);
    this.focusReticle.classList.toggle("is-relocating", !show);
    this.focusReticle.classList.toggle("is-left", this.width > 700 && x + 250 > this.width - 20);
    this.focusReticle.classList.toggle("is-below", y < (this.width <= 700 ? 180 : 135));
    const previewWidth = this.width <= 700 ? Math.min(200, this.width - 32) : 214;
    const safeCenter = Math.max(16 + previewWidth / 2, Math.min(this.width - 16 - previewWidth / 2, x));
    this.focusReticle.style.setProperty("--marker-shift", `${safeCenter - x}px`);
    this.focusReticle.style.setProperty("--marker-opacity", show ? ".92" : "0");
  }

  updateMarkerProjectionWebGL() {
    if (!this.hasActiveLocation) { this.setReticleProjection(0, 0, false); return; }
    if (!this.markerAnchor || !this.planet || !this.camera || !this.width || !this.height) return;
    this.markerAnchor.getWorldPosition(this.markerWorldPosition);
    this.planet.getWorldPosition(this.planetWorldPosition);
    this.markerSurfaceNormal.copy(this.markerWorldPosition).sub(this.planetWorldPosition).normalize();
    this.markerToCamera.copy(this.camera.position).sub(this.markerWorldPosition).normalize();
    const facing = this.markerSurfaceNormal.dot(this.markerToCamera);
    this.markerProjectedPosition.copy(this.markerWorldPosition).project(this.camera);
    const ndcX = this.markerProjectedPosition.x;
    const ndcY = this.markerProjectedPosition.y;
    const visible = this.exploring && facing > 0.015 && this.markerProjectedPosition.z < 1
      && Math.abs(ndcX) < 1.15 && Math.abs(ndcY) < 1.15;
    this.setReticleProjection((ndcX * 0.5 + 0.5) * this.width, (-ndcY * 0.5 + 0.5) * this.height, visible);
  }

  updateMarkerProjectionFallback(yaw, pitch, roll, cx, cy, radius) {
    if (!this.hasActiveLocation) { this.setReticleProjection(0, 0, false); return; }
    const point = this.markerLocalPoint;
    const cosYaw = Math.cos(yaw), sinYaw = Math.sin(yaw);
    const cosPitch = Math.cos(pitch), sinPitch = Math.sin(pitch);
    const cosRoll = Math.cos(roll), sinRoll = Math.sin(roll);

    const x1 = cosYaw * point.x + sinYaw * point.z;
    const y1 = point.y;
    const z1 = -sinYaw * point.x + cosYaw * point.z;
    const x2 = x1;
    const y2 = cosPitch * y1 - sinPitch * z1;
    const z2 = sinPitch * y1 + cosPitch * z1;
    const x3 = cosRoll * x2 - sinRoll * y2;
    const y3 = sinRoll * x2 + cosRoll * y2;
    const z3 = z2;

    this.setReticleProjection(cx + radius * x3, cy - radius * y3, this.exploring && z3 > 0.015);
  }


  clamp(value) { return Math.max(0, Math.min(1, value)); }
  smooth(value) {
    const v = this.clamp(value);
    return v * v * v * (v * (v * 6 - 15) + 10);
  }

  normalLayout() {
    const halfHeight = Math.tan(Math.PI / 10) * this.finalDistance;
    return {
      halfHeight,
      x: halfHeight * (this.camera?.aspect || this.width / this.height) * (this.mobile ? 0 : 0.28),
      y: halfHeight * (this.mobile ? 0.28 : 0.10)
    };
  }

  beginTravelToVenus({ onReveal, onComplete } = {}) {
    if (!this.active || this.travelMode || this.exploring) return;
    this.travelMode = "to-venus";
    this.travelStartedAt = this.time;
    this.travelDuration = this.motion.matches ? 0.45 : 6.2;
    this.travelRevealFired = false;
    this.travelCompleteFired = false;
    this.travelCallbacks = { onReveal, onComplete };
    this.element.classList.add("is-leaving");
    this.caption.inert = true;
    this.pointer.x = this.pointer.y = 0;
    if (!this.frame) { this.previous = performance.now(); this.tick(this.previous); }
  }

  beginTravelFromVenus({ onCovered, onComplete, venusRotation = 0.3984 } = {}) {
    if (this.active && this.travelMode) return;
    this.active = true;
    this.exploring = false;
    this.explorationBlend = this.explorationBlendTarget = 0;
    this.travelMode = "from-venus";
    this.travelStartedAt = 0;
    this.time = 0;
    this.travelDuration = this.motion.matches ? 0.45 : 6.2;
    this.travelCoveredFired = false;
    this.travelCompleteFired = false;
    this.travelTargetStartRotation = venusRotation;
    this.travelCallbacks = { onCovered, onComplete };
    this.element.hidden = false;
    this.element.style.opacity = "0";
    this.element.classList.add("is-leaving");
    this.caption.classList.remove("is-visible");
    this.caption.inert = true;
    this.exploration.inert = true;
    this.pointer.x = this.pointer.y = this.cameraOffset.x = this.cameraOffset.y = 0;
    this.prepare();
    this.resize();
    cancelAnimationFrame(this.frame);
    this.previous = performance.now();
    this.tick(this.previous);
  }

  travelState() {
    const elapsed = this.time - this.travelStartedAt;
    const progress = this.smooth(elapsed / this.travelDuration);
    return {
      progress,
      pullback: this.smooth(progress / 0.31),
      pan: this.smooth((progress - 0.23) / 0.39),
      approach: this.smooth((progress - 0.58) / 0.42)
    };
  }

  render() {
    if (this.travelMode) this.renderTravel();
    else this.renderMercury();
  }

  renderTravel() {
    const state = this.travelState();
    const reverse = this.travelMode === "from-venus";
    const layout = this.normalLayout();
    const aspect = this.camera?.aspect || this.width / this.height;
    const direction = 1;
    const separationMagnitude = layout.halfHeight * aspect * (this.mobile ? 3.9 : 3.25);
    const separation = separationMagnitude * direction;
    const destinationX = layout.halfHeight * aspect * (this.mobile ? 0 : 0.28);
    const destinationY = layout.halfHeight * (this.mobile ? 0.28 : 0.10);
    const destinationCameraX = separation + layout.x - destinationX;
    const cameraX = destinationCameraX * (reverse ? 1 - state.pan : state.pan);
    const cameraZ = this.finalDistance * (1 + 1.55 * state.pullback * (1 - state.approach));
    const mercuryOpacity = reverse ? this.smooth((state.progress - 0.27) / 0.19) : 1;
    const venusOpacity = reverse ? 1 : this.smooth((state.progress - 0.28) / 0.20);
    const mercuryRotation = 0.62 - this.time * 0.012;
    const venusFinalRotation = 0.3984;
    const venusStartRotation = reverse ? this.travelTargetStartRotation : 0.62;
    const venusRotation = reverse
      ? venusStartRotation + state.progress * 0.08
      : venusStartRotation + state.progress * (venusFinalRotation - venusStartRotation);
    this.element.style.opacity = String(reverse ? this.smooth(state.progress / 0.075) : 1);

    if (!reverse && state.progress >= 0.86 && !this.travelRevealFired) {
      this.travelRevealFired = true;
      this.travelCallbacks.onReveal?.();
    }
    if (reverse && state.progress >= 0.10 && !this.travelCoveredFired) {
      this.travelCoveredFired = true;
      this.travelCallbacks.onCovered?.();
    }

    this.caption.style.opacity = "0";
    this.credit.style.opacity = "0";
    this.focusReticle.style.setProperty("--marker-opacity", "0");

    if (this.mode === "webgl") {
      this.planetGroup.visible = mercuryOpacity > 0.002;
      this.travelVenusGroup.visible = venusOpacity > 0.002;
      this.planetGroup.position.set(layout.x, layout.y, 0);
      this.travelVenusGroup.position.set(layout.x + separation, destinationY, 0);
      this.planet.rotation.set(0.09, mercuryRotation, MERCURY_EXPLORATION_ROLL);
      this.planet.material.opacity = mercuryOpacity;
      this.planet.material.transparent = mercuryOpacity < 0.999;
      this.planet.material.depthWrite = mercuryOpacity >= 0.999;
      this.atmosphere.visible = mercuryOpacity > 0.035;
      this.travelVenus.rotation.set(0.09, venusRotation, 0.12);
      this.travelVenusMaterial.opacity = venusOpacity;
      this.travelVenusGlow.material.opacity = 0.05 * venusOpacity;
      this.camera.position.set(cameraX, 0, cameraZ);
      const lookOffset = Math.sin(state.pan * Math.PI) * separationMagnitude * 0.055 * direction * (reverse ? -1 : 1);
      this.camera.lookAt(cameraX + lookOffset, 0, 0);
      this.renderer.render(this.scene, this.camera);
    } else if (this.mode === "canvas") {
      this.drawCanvasTravel(state, reverse, mercuryOpacity, venusOpacity);
    } else if (this.mode === "css") {
      const planet = this.viewport.firstElementChild;
      if (planet) {
        const radius = this.finalRadius * this.finalDistance / cameraZ;
        const screenPan = reverse ? 1 - state.pan : state.pan;
        planet.style.width = planet.style.height = `${radius * 2}px`;
        planet.style.left = `${64 - direction * screenPan * 95}%`;
        planet.style.top = "47%";
        planet.style.opacity = String(mercuryOpacity);
      }
    }

    if (state.progress >= 0.999 && !this.travelCompleteFired) {
      this.travelCompleteFired = true;
      const callback = this.travelCallbacks.onComplete;
      if (reverse) {
        this.travelMode = null;
        this.travelCallbacks = {};
        this.time = 12.6;
        this.element.classList.remove("is-leaving");
        this.element.style.opacity = "1";
        this.caption.classList.add("is-visible");
        this.caption.inert = false;
        this.caption.style.opacity = "1";
        this.credit.style.opacity = ".9";
        // WebGL owns these render objects. Canvas/CSS fallbacks intentionally do not,
        // so transition finalization must not dereference them before the shared
        // onComplete callback can promote the global phase to "mercury".
        if (this.mode === "webgl") {
          if (this.planet?.material) {
            this.planet.material.opacity = 1;
            this.planet.material.transparent = false;
            this.planet.material.depthWrite = true;
          }
          if (this.travelVenusGroup) this.travelVenusGroup.visible = false;
        }
        document.getElementById("announcement").textContent = "Tiba di orbit Merkurius.";
      }
      callback?.();
    }
  }

  drawTexturedDisc(image, cx, cy, radius, rotation, opacity, atmosphereColor) {
    if (!image || opacity <= 0.002) return;
    const ctx = this.ctx;
    ctx.save();
    ctx.globalAlpha = opacity;
    ctx.beginPath(); ctx.arc(cx, cy, radius, 0, Math.PI * 2); ctx.clip();
    const sourceWidth = image.width;
    const shift = ((rotation / MERCURY_TAU) % 1 + 1) % 1 * sourceWidth;
    const drawWidth = radius * Math.PI * 2;
    const x = cx - radius - (shift / sourceWidth) * drawWidth;
    ctx.drawImage(image, x, cy - radius, drawWidth, radius * 2);
    ctx.drawImage(image, x + drawWidth, cy - radius, drawWidth, radius * 2);
    const shade = ctx.createRadialGradient(cx - radius * .42, cy - radius * .28, radius * .04, cx, cy, radius * 1.08);
    shade.addColorStop(0, "rgba(255,244,223,.18)");
    shade.addColorStop(.48, "rgba(45,42,38,.06)");
    shade.addColorStop(1, "rgba(0,2,7,.94)");
    ctx.fillStyle = shade; ctx.fillRect(cx-radius, cy-radius, radius*2, radius*2);
    ctx.restore();
    ctx.save(); ctx.globalAlpha = opacity * .20; ctx.strokeStyle = atmosphereColor;
    ctx.lineWidth = Math.max(1, radius * .008); ctx.beginPath(); ctx.arc(cx, cy, radius * 1.006, 0, Math.PI * 2); ctx.stroke(); ctx.restore();
  }

  drawCanvasTravel(state, reverse, mercuryOpacity, venusOpacity) {
    const ctx = this.ctx, w = this.width, h = this.height;
    ctx.clearRect(0, 0, w, h);
    for (const star of this.stars.slice(0, 110)) {
      ctx.fillStyle = `rgba(179,197,222,${0.12 + star.size * 0.35})`;
      ctx.fillRect(star.x * w, star.y * h, 0.5 + star.size, 0.5 + star.size);
    }
    const pullScale = 1 / (1 + 1.55 * state.pullback * (1 - state.approach));
    const r = this.finalRadius * pullScale;
    const pan = reverse ? 1 - state.pan : state.pan;
    const mercuryX = w * (this.mobile ? .5 : .64) - pan * w * .92;
    const venusX = mercuryX + w * (this.mobile ? 1.02 : .84);
    const cy = h * (this.mobile ? .36 : .47);
    this.drawTexturedDisc(this.surface, mercuryX, cy, r, .62 - this.time * .012, mercuryOpacity, "rgba(224,215,202,.28)");
    this.drawTexturedDisc(this.venusSurface || this.makeVenusTravelSurface(), venusX, cy, r, .62, venusOpacity, "rgba(224,151,70,.45)");
  }

  renderMercury() {
    const smooth = value => { const v = Math.max(0, Math.min(1, value)); return v * v * v * (v * (v * 6 - 15) + 10); };
    const t = this.time;
    const approach = this.motion.matches ? 1 : smooth((t - 0.6) / 12);
    const arrivalDistance = this.finalDistance * Math.pow(15, 1 - approach);
    const explorationDistanceScale = this.mobile
      ? MERCURY_EXPLORATION_DISTANCE_SCALE_MOBILE
      : MERCURY_EXPLORATION_DISTANCE_SCALE_DESKTOP;
    const explorationFramingScale = 1 + this.explorationBlend * (explorationDistanceScale - 1);
    this.distance = arrivalDistance * explorationFramingScale;
    const arrivalYaw = this.motion.matches ? 0.6 : 0.6 - t * 0.016;
    const exploreYaw = this.topicYaw + (this.motion.matches ? 0 : Math.sin(t * 0.14) * 0.012);
    const fallbackYaw = arrivalYaw * (1 - this.explorationBlend) + exploreYaw * this.explorationBlend;
    const fallbackPitch = 0.09 * (1 - this.explorationBlend) + this.topicPitch * this.explorationBlend;
    const fallbackRoll = MERCURY_EXPLORATION_ROLL * (1 - this.explorationBlend) + this.topicRoll * this.explorationBlend;
    this.renderedRotation = fallbackYaw;
    const reveal = smooth(t / (this.motion.matches ? 1 : 1.8));
    this.element.style.opacity = String(reveal);
    const caption = smooth((t - (this.motion.matches ? 1 : 9)) / 2.5);
    this.caption.style.opacity = String(caption);
    this.caption.style.transform = `translateY(${this.motion.matches ? 0 : (1 - caption) * 12}px)`;
    this.credit.style.opacity = String(caption * 0.9);
    this.credit.tabIndex = caption > 0.5 && !this.exploring ? 0 : -1;
    if (caption > 0.5 && !this.announced) {
      this.announced = true;
      this.caption.inert = false;
      this.caption.classList.add("is-visible");
      document.getElementById("announcement").textContent = "Merkurius, planet terkecil dan terdekat dari Matahari.";
      // Never steal focus from someone using mute during the approach.
      if (document.activeElement === document.body || document.activeElement.id === "launch-button") document.getElementById("mercury-title").focus({ preventScroll: true });
    }
    const drift = this.motion.matches ? 0 : Math.sin(t * 0.24) * 0.018;
    if (this.mode === "webgl") {
      const halfHeight = Math.tan(Math.PI / 10) * this.finalDistance;
      const baseX = this.mobile ? 0 : 0.28;
      const exploreX = this.mobile ? this.topicShift.x * 0.7 : MERCURY_EXPLORATION_CENTER_X_DESKTOP + this.topicShift.x;
      const baseY = this.mobile ? 0.28 : 0.1;
      const exploreY = this.mobile ? 0.20 + this.topicShift.y : MERCURY_EXPLORATION_CENTER_Y_DESKTOP + this.topicShift.y;
      const groupX = baseX * (1 - this.explorationBlend) + exploreX * this.explorationBlend;
      const groupY = baseY * (1 - this.explorationBlend) + exploreY * this.explorationBlend;
      this.travelVenusGroup.visible = false;
      this.atmosphere.visible = true;
      this.planetGroup.visible = true;
      this.planet.material.opacity = 1;
      this.planet.material.transparent = false;
      this.planet.material.depthWrite = true;
      this.planetGroup.position.set(halfHeight * this.camera.aspect * groupX, halfHeight * groupY + drift * (1 - this.explorationBlend * 0.45), 0);

      // Preserve the arrival pose, but in exploration orient the real sphere from
      // geographic latitude/longitude. Composition is Rz * Rx * Ry so the chosen
      // surface normal points toward +Z while Mercury north remains upright.
      this.arrivalEuler.set(0.09, arrivalYaw, MERCURY_EXPLORATION_ROLL, "XYZ");
      this.arrivalQuaternion.setFromEuler(this.arrivalEuler);
      this.yawQuaternion.setFromAxisAngle(this.axisY, exploreYaw);
      this.pitchQuaternion.setFromAxisAngle(this.axisX, this.topicPitch);
      this.rollQuaternion.setFromAxisAngle(this.axisZ, this.topicRoll);
      this.exploreQuaternion.copy(this.rollQuaternion).multiply(this.pitchQuaternion).multiply(this.yawQuaternion);
      this.planet.quaternion.copy(this.arrivalQuaternion).slerp(this.exploreQuaternion, this.explorationBlend);

      const pointerStrength = 1 - this.explorationBlend * 0.55;
      this.camera.position.set(this.motion.matches ? 0 : this.cameraOffset.x * 0.13 * pointerStrength, this.motion.matches ? 0 : -this.cameraOffset.y * 0.09 * pointerStrength, this.distance);
      this.camera.lookAt(0, 0, 0);
      this.renderer.render(this.scene, this.camera);
      this.updateMarkerProjectionWebGL();
    } else if (this.mode === "canvas") {
      // Software fallback applies the same true geographic transform to texture and marker.
      this.drawFallback(fallbackYaw, fallbackPitch, fallbackRoll, approach, drift);
    } else if (this.mode === "css") {
      const planet = this.viewport.firstElementChild;
      const radius = this.finalRadius * this.finalDistance / this.distance;
      planet.style.width = planet.style.height = `${radius * 2}px`;
      planet.style.backgroundPositionX = `${-fallbackYaw * 100}px`;
      this.focusReticle.style.setProperty("--marker-opacity", "0");
      const cssLeft = this.mobile ? 50 + this.explorationBlend * this.topicShift.x * 60 : 64 + this.explorationBlend * (this.topicShift.x * 45);
      const cssTop = this.mobile ? 36 - this.explorationBlend * (8 - this.topicShift.y * 35) : 45 + this.explorationBlend * (2 + this.topicShift.y * 35);
      planet.style.left = `${cssLeft}%`;
      planet.style.top = `${cssTop}%`;
    }
  }

  drawFallback(yaw, pitch, roll, approach, drift) {
    const ctx = this.ctx;
    const w = this.width, h = this.height;
    ctx.clearRect(0, 0, w, h);
    for (const star of this.stars.slice(0, 110)) {
      ctx.fillStyle = `rgba(179,197,222,${0.12 + star.size * 0.35})`;
      ctx.fillRect(star.x * w, star.y * h, 0.5 + star.size, 0.5 + star.size);
    }

    const cosYaw = Math.cos(yaw), sinYaw = Math.sin(yaw);
    const cosPitch = Math.cos(pitch), sinPitch = Math.sin(pitch);
    const cosRoll = Math.cos(roll), sinRoll = Math.sin(roll);
    const data = this.sphereImage.data;
    for (let y = 0; y < 360; y++) for (let x = 0; x < 360; x++) {
      const nx = (x + 0.5) / 180 - 1, ny = 1 - (y + 0.5) / 180;
      const r2 = nx * nx + ny * ny;
      const i = (y * 360 + x) * 4;
      if (r2 > 1) { data[i + 3] = 0; continue; }
      const nz = Math.sqrt(1 - r2);

      // Inverse of Rz(roll) * Rx(pitch) * Ry(yaw): screen normal -> Mercury local.
      const zx = cosRoll * nx + sinRoll * ny;
      const zy = -sinRoll * nx + cosRoll * ny;
      const zz = nz;
      const px = zx;
      const py = cosPitch * zy + sinPitch * zz;
      const pz = -sinPitch * zy + cosPitch * zz;
      const lx = cosYaw * px - sinYaw * pz;
      const ly = py;
      const lz = sinYaw * px + cosYaw * pz;

      const longitude = Math.atan2(-lz, lx);
      const u = ((longitude + Math.PI) / MERCURY_TAU + 1) % 1;
      const v = Math.acos(Math.max(-1, Math.min(1, ly))) / Math.PI;
      const sampleX = Math.min(1535, Math.max(0, Math.floor(u * 1536)));
      const sampleY = Math.min(767, Math.max(0, Math.floor(v * 768)));
      const j = (sampleY * 1536 + sampleX) * 4;
      const light = 0.045 + Math.max(0, nx * -0.6 + ny * 0.43 + nz * 0.67) * 1.12;
      data[i] = Math.min(255, this.surfacePixels[j] * light);
      data[i + 1] = Math.min(255, this.surfacePixels[j + 1] * light * 0.97);
      data[i + 2] = Math.min(255, this.surfacePixels[j + 2] * light * 0.93);
      data[i + 3] = Math.min(255, (1 - r2) * 180 * 255);
    }
    this.sphereContext.putImageData(this.sphereImage, 0, 0);
    const radius = this.finalRadius * this.finalDistance / this.distance;
    const arrivalX = this.mobile ? 0 : 0.14 * approach;
    const exploreX = this.mobile ? this.topicShift.x * 0.12 : 0.14 + this.topicShift.x * 0.42;
    const cx = w * (0.5 + arrivalX * (1 - this.explorationBlend) + exploreX * this.explorationBlend);
    const arrivalY = this.mobile ? 0.14 : 0.05;
    const exploreY = this.mobile ? 0.21 - this.topicShift.y * 0.3 : 0.03 - this.topicShift.y * 0.3;
    const cy = h * (0.5 - arrivalY * (1 - this.explorationBlend) - exploreY * this.explorationBlend) - drift * 50 * (1 - this.explorationBlend * 0.45);
    ctx.drawImage(this.sphereCanvas, cx - radius, cy - radius, radius * 2, radius * 2);
    this.updateMarkerProjectionFallback(yaw, pitch, roll, cx, cy, radius);
  }
};
