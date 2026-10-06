"use strict";

// Educational copy is kept separate from rendering logic. Facts are condensed from
// NASA Science pages linked per stop so the interface stays concise and verifiable.
//
// Geographic coordinates use the IAU/USGS Mars convention: planetocentric latitude,
// positive-east longitude in the 0..360 degree range. The Solar System Scope texture
// is a standard equirectangular map with -180 degrees at the left edge and 0 degrees
// at its center. Olympus Mons and Valles Marineris align without an extra correction,
// so one global longitude calibration of 0 degrees is used for every marker.
const MARS_TEXTURE_LONGITUDE_OFFSET_DEG = 0;
const MARS_DEG_TO_RAD = Math.PI / 180;
const MARS_TAU = Math.PI * 2;
const MARS_EXPLORATION_ROLL = 0.12;
const MARS_EXPLORATION_DISTANCE_SCALE_DESKTOP = 1.04;
const MARS_EXPLORATION_DISTANCE_SCALE_MOBILE = 1.05;
const MARS_EXPLORATION_CENTER_X_DESKTOP = 0.23;
const MARS_EXPLORATION_CENTER_Y_DESKTOP = 0.055;

const wrapMarsRadians = angle => Math.atan2(Math.sin(angle), Math.cos(angle));
const unwrapMarsAngleNear = (angle, reference) => reference + wrapMarsRadians(angle - reference);

const marsLocationOrientation = location => {
  const longitude = wrapMarsRadians((location.longitudeEast + MARS_TEXTURE_LONGITUDE_OFFSET_DEG) * MARS_DEG_TO_RAD);
  return {
    // THREE.SphereGeometry maps geographic longitude to local
    // (x, z) = (cos(lon), -sin(lon)). Ry(-PI/2-lon), then Rx(lat),
    // brings that exact surface normal to +Z while keeping north toward +Y.
    yaw: -Math.PI / 2 - longitude,
    pitch: location.latitude * MARS_DEG_TO_RAD,
    roll: MARS_EXPLORATION_ROLL
  };
};

const marsSurfacePoint = (location, radius = 1) => {
  const latitude = location.latitude * MARS_DEG_TO_RAD;
  const longitude = wrapMarsRadians((location.longitudeEast + MARS_TEXTURE_LONGITUDE_OFFSET_DEG) * MARS_DEG_TO_RAD);
  const cosLatitude = Math.cos(latitude);
  return {
    x: radius * cosLatitude * Math.cos(longitude),
    y: radius * Math.sin(latitude),
    z: -radius * cosLatitude * Math.sin(longitude)
  };
};

const marsStopOrientation = (stop, index) => {
  if (stop.location) return marsLocationOrientation(stop.location);
  const view = stop.view || {};
  return {
    yaw: Number.isFinite(view.yaw) ? view.yaw : 0.6 + index * 0.16,
    pitch: Number.isFinite(view.pitch) ? view.pitch : 0.09,
    roll: Number.isFinite(view.roll) ? view.roll : MARS_EXPLORATION_ROLL
  };
};

const MARS_EXPLORATION_STOPS = Object.freeze([
  {
    title: "MARS",
    kicker: "DASAR PLANET",
    subtitle: "Kenalan dengan Dunia Merah",
    summary: "Mars adalah dunia berbatu keempat dari Matahari. Ia lebih kecil dan lebih dingin daripada Bumi, tetapi permukaannya menyimpan banyak jejak yang membuat ilmuwan bertanya: seperti apa Mars miliaran tahun lalu?",
    facts: [
      "Radius Mars sekitar 3.390 km, kira-kira setengah radius Bumi.",
      "Mars memiliki dua bulan kecil bernama Phobos dan Deimos.",
      "Mars termasuk dunia yang paling banyak dieksplorasi robot, dan rover telah menjelajahi langsung permukaannya."
    ],
    source: "https://science.nasa.gov/mars/facts/",
    sourceName: "NASA Science",
    view: { yaw: 0.60, pitch: 0.09, roll: MARS_EXPLORATION_ROLL },
    shift: { x: 0, y: 0 }
  },
  {
    title: "UKURAN & GRAVITASI",
    kicker: "SKALA PLANET",
    subtitle: "Dunia Kecil dengan Tarikan Lebih Ringan",
    summary: "Mars jauh lebih kecil daripada Bumi, jadi gravitasinya juga lebih lemah. Massamu tidak berubah, tetapi beratmu di permukaan Mars akan terasa jauh lebih ringan.",
    facts: [
      "Diameter rata-rata Mars sekitar 6.780 km, sekitar 53% diameter Bumi.",
      "Gravitasi permukaannya sekitar 3,7 m/s², atau kira-kira 38% gravitasi Bumi.",
      "Benda yang berbobot 100 N di Bumi akan berbobot sekitar 38 N di Mars, walaupun massanya tetap sama."
    ],
    source: "https://www.jpl.nasa.gov/news/press_kits/insight/landing/facts/mars-at-a-glance/",
    sourceName: "NASA/JPL",
    view: { yaw: 0.78, pitch: 0.06, roll: MARS_EXPLORATION_ROLL },
    shift: { x: 0, y: 0 }
  },
  {
    title: "HARI & TAHUN MARS",
    kicker: "ROTASI & ORBIT",
    subtitle: "Seharinya Mirip Bumi, Tahunnya Jauh Lebih Lama",
    summary: "Satu hari di Mars hampir terasa familiar, hanya sedikit lebih panjang dari hari di Bumi. Tapi kalau menunggu ulang tahun Mars, kamu harus sabar lebih lama karena satu tahunnya hampir dua kali tahun Bumi.",
    facts: [
      "Satu hari Mars disebut sol dan berlangsung sekitar 24,6 jam.",
      "Satu tahun Mars berlangsung 669,6 sol, setara sekitar 687 hari Bumi.",
      "Sumbu Mars miring sekitar 25°, sehingga Mars memiliki musim; orbitnya yang lebih elips membuat panjang tiap musim tidak sama."
    ],
    source: "https://science.nasa.gov/mars/facts/",
    sourceName: "NASA Science",
    view: { yaw: 0.96, pitch: 0.11, roll: MARS_EXPLORATION_ROLL },
    shift: { x: 0, y: 0 }
  },
  {
    title: "ATMOSFER & SUHU",
    kicker: "LINGKUNGAN MARS",
    subtitle: "Dingin, Berdebu, dan Berudara Tipis",
    summary: "Udara Mars sangat tipis dan kebanyakan berisi karbon dioksida. Karena panas mudah lepas, dunia ini bisa berubah dari cukup hangat di lokasi tertentu menjadi sangat dingin pada malam hari atau di daerah kutub.",
    facts: [
      "Atmosfer Mars terutama terdiri dari karbon dioksida, dengan nitrogen dan argon sebagai komponen penting lainnya.",
      "Tekanan atmosfer di permukaan Mars kurang dari 1% tekanan rata-rata di permukaan Bumi.",
      "Suhu permukaan dapat mencapai sekitar 20°C pada kondisi hangat lokal dan turun hingga sekitar −153°C pada kondisi sangat dingin."
    ],
    source: "https://science.nasa.gov/mars/facts/",
    sourceName: "NASA Science",
    view: { yaw: 1.14, pitch: 0.05, roll: MARS_EXPLORATION_ROLL },
    shift: { x: 0, y: 0 }
  },
  {
    title: "KENAPA MARS BERWARNA MERAH?",
    kicker: "WARNA PERMUKAAN",
    subtitle: "Ternyata “karat” yang membuatnya merah",
    summary: "Rahasia warna merah Mars ada pada besi di batuan dan debunya. Saat besi itu teroksidasi, terbentuk oksida besi yang mirip karat dan memberi warna merah-jingga pada permukaan.",
    facts: [
      "Mineral yang mengandung besi tersebar luas pada material permukaan Mars.",
      "Oksidasi menghasilkan oksida besi yang memberi warna merah, cokelat, dan jingga.",
      "Debu halus berwarna kemerahan terangkat ke atmosfer dan membuat Mars tampak merah dari kejauhan."
    ],
    source: "https://science.nasa.gov/mars/facts/",
    sourceName: "NASA Science",
    view: { yaw: 1.32, pitch: 0.10, roll: MARS_EXPLORATION_ROLL },
    shift: { x: 0, y: 0 }
  },
  {
    images: [
      {
        src: "assets/exploration/olympus-mons.webp",
        alt: "Mosaik Viking Orbiter memperlihatkan Olympus Mons di Mars",
        credit: "NASA/JPL/USGS",
        source: "https://science.nasa.gov/photojournal/olympus-mons/",
        license: "NASA image policy",
        licenseUrl: "https://www.nasa.gov/nasa-brand-center/images-and-media/",
        caption: "Olympus Mons · mosaik Viking",
        fit: "cover"
      },
      {
        src: "https://assets.science.nasa.gov/dynamicimage/assets/science/psd/photojournal/pia/pia04/pia04689/PIA04689.jpg?crop=faces%2Cfocalpoint&fit=clip&h=2305&w=1537",
        alt: "Citra Mars Global Surveyor memperlihatkan wilayah puncak dan dinding kaldera Olympus Mons",
        credit: "NASA/JPL/Malin Space Science Systems",
        source: "https://science.nasa.gov/photojournal/top-of-olympus-mons/",
        license: "NASA image policy",
        licenseUrl: "https://www.nasa.gov/nasa-brand-center/images-and-media/",
        caption: "Puncak dan kaldera Olympus Mons",
        fit: "cover"
      }
    ],
    title: "Olympus Mons",
    kicker: "GUNUNG API RAKSASA",
    subtitle: "Gunung api raksasa yang menjulang di dunia Mars",
    summary: "Olympus Mons bukan sekadar gunung besar. Ini adalah gunung api perisai raksasa yang tumbuh sangat lama dan menjadi salah satu pemandangan paling ekstrem di dunia Mars.",
    facts: [
      "Tingginya sekitar 27 km di atas dataran sekitarnya.",
      "Lebar dasarnya lebih dari 600 km.",
      "Puncaknya memiliki kompleks kaldera hasil runtuhan setelah magma terkuras."
    ],
    source: "https://science.nasa.gov/photojournal/olympus-mons/",
    location: { label: "Olympus Mons", latitude: 18.65, longitudeEast: 226.20, source: "https://planetarynames.wr.usgs.gov/Feature/4453" },
    shift: { x: 0.00, y: -0.01 }
  },
  {
    images: [
      {
        src: "assets/exploration/valles-marineris.webp",
        alt: "Mosaik Viking memperlihatkan sistem ngarai Valles Marineris di Mars",
        credit: "NASA/JPL-Caltech",
        source: "https://science.nasa.gov/resource/valles-marineris-the-grand-canyon-of-mars/",
        license: "NASA image policy",
        licenseUrl: "https://www.nasa.gov/nasa-brand-center/images-and-media/",
        caption: "Valles Marineris · mosaik luas",
        fit: "cover"
      },
      {
        src: "https://assets.science.nasa.gov/dynamicimage/assets/science/psd/photojournal/pia/pia22/pia22238/PIA22238.jpg?crop=faces%2Cfocalpoint&fit=clip&h=1800&w=2880",
        alt: "Citra HiRISE berwarna olahan memperlihatkan batuan di kedalaman Valles Marineris",
        credit: "NASA/JPL-Caltech/Univ. of Arizona",
        source: "https://science.nasa.gov/photojournal/geologic-history-revealed-in-valles-marineris/",
        license: "NASA image policy",
        licenseUrl: "https://www.nasa.gov/nasa-brand-center/images-and-media/",
        caption: "Detail geologi Valles Marineris",
        fit: "cover"
      }
    ],
    title: "Valles Marineris",
    kicker: "NGARAI PLANET",
    subtitle: "Ngarai raksasa yang membelah permukaan Mars",
    summary: "Valles Marineris membentang sangat panjang di dekat ekuator Mars. Kemungkinan besar kisahnya dimulai dari retakan besar pada kerak, lalu proses geologi dan erosi membuatnya makin lebar dan dalam.",
    facts: [
      "Panjangnya sekitar 3.870 km.",
      "Lebarnya mencapai sekitar 600 km di bagian terlebar.",
      "Kedalamannya dapat mencapai sekitar 9,3 km dari tepi ke dasar."
    ],
    source: "https://science.nasa.gov/mars/facts/",
    location: { label: "Valles Marineris", latitude: -14.01, longitudeEast: 301.41, source: "https://planetarynames.wr.usgs.gov/Feature/6288" },
    shift: { x: 0.018, y: 0.018 }
  },
  {
    images: [
      {
        src: "assets/exploration/jezero.webp",
        alt: "Citra berwarna olahan memperlihatkan endapan delta di Kawah Jezero, Mars",
        credit: "NASA/JPL-Caltech/MSSS/JHU-APL",
        source: "https://science.nasa.gov/photojournal/jezero-crater-mars-2020s-landing-site/",
        license: "NASA image policy",
        licenseUrl: "https://www.nasa.gov/nasa-brand-center/images-and-media/",
        caption: "Delta Jezero · citra orbital",
        fit: "cover"
      },
      {
        src: "https://assets.science.nasa.gov/dynamicimage/assets/science/psd/mars/downloadable_items/4/5/45791_PIA24485_K4_ZCAM_main_sol004_Delta_Remnant_unannotated.jpg?crop=faces%2Cfocalpoint&fit=clip&h=1200&w=1648",
        alt: "Pandangan Perseverance dari permukaan menuju sisa delta di Kawah Jezero",
        credit: "NASA/JPL-Caltech/ASU/MSSS",
        source: "https://science.nasa.gov/resource/perseverance-view-of-the-delta-in-jezero-crater/",
        license: "NASA image policy",
        licenseUrl: "https://www.nasa.gov/nasa-brand-center/images-and-media/",
        caption: "Delta Jezero dari permukaan Mars",
        fit: "cover"
      }
    ],
    title: "Kawah Jezero",
    kicker: "JEJAK AIR PURBA",
    subtitle: "Bekas danau purba yang dijelajahi Perseverance",
    summary: "Kawah Jezero pernah menjadi rumah bagi danau dan delta sungai purba. Itulah sebabnya Perseverance menjelajahinya: tempat seperti ini bisa menyimpan petunjuk tentang seperti apa Mars miliaran tahun lalu.",
    facts: [
      "Diameter kawahnya sekitar 45 km.",
      "Lebih dari 3,5 miliar tahun lalu, air pernah mengalir masuk dan membentuk danau serta delta.",
      "Perseverance mendarat di sini pada 18 Februari 2021 untuk mencari tanda kehidupan mikroba purba dan mengumpulkan sampel."
    ],
    source: "https://science.nasa.gov/mission/mars-2020-perseverance/",
    location: { label: "Kawah Jezero", latitude: 18.41, longitudeEast: 77.69, source: "https://planetarynames.wr.usgs.gov/Feature/14300" },
    shift: { x: -0.012, y: 0.03 }
  },
  {
    images: [
      {
        src: "assets/exploration/polar-cap.webp",
        alt: "Citra Viking 1 memperlihatkan tudung es kutub utara Mars pada musim panas",
        credit: "NASA/JPL/USGS",
        source: "https://science.nasa.gov/photojournal/north-polar-ice-cap/",
        license: "NASA image policy",
        licenseUrl: "https://www.nasa.gov/nasa-brand-center/images-and-media/",
        caption: "Tudung es kutub utara Mars",
        fit: "cover"
      },
      {
        src: "https://assets.science.nasa.gov/dynamicimage/assets/science/psd/photojournal/pia/pia25/pia25614/PIA25614.jpg?crop=faces%2Cfocalpoint&fit=clip&h=1397&w=490",
        alt: "Citra Mars Odyssey memperlihatkan lapisan es dan debu pada tudung kutub selatan Mars",
        credit: "NASA/JPL-Caltech/ASU",
        source: "https://science.nasa.gov/photojournal/pj-south-polar-cap-11/",
        license: "NASA image policy",
        licenseUrl: "https://www.nasa.gov/nasa-brand-center/images-and-media/",
        caption: "Lapisan tudung es kutub selatan Mars",
        fit: "cover"
      }
    ],
    title: "Tudung Es Kutub",
    kicker: "ES YANG BERUBAH MUSIM",
    subtitle: "Es yang tumbuh dan menyusut mengikuti musim",
    summary: "Kutub Mars tidak selalu terlihat sama. Saat musim dingin datang, es karbon dioksida ikut menumpuk; ketika sinar Matahari kembali kuat, sebagian lapisan itu menyusut lagi.",
    facts: [
      "Lapisan es musiman mengandung karbon dioksida beku atau dry ice.",
      "Pada musim panas utara, tudung yang tersisa terutama berupa es air.",
      "Di kutub selatan, es air tetap tertutup lapisan tipis es karbon dioksida bahkan saat musim panas."
    ],
    source: "https://science.nasa.gov/earth/frozen-ice-on-earth-and-well-beyond/",
    // The plural topic is anchored to the named north-polar residual-cap region,
    // Planum Boreum, instead of an invented screen coordinate.
    location: { label: "Planum Boreum", latitude: 87.32, longitudeEast: 54.96, source: "https://planetarynames.wr.usgs.gov/Feature/4754" },
    shift: { x: 0.008, y: -0.045 }
  },
  {
    images: [
      {
        src: "assets/exploration/atmosphere.webp",
        alt: "Citra Curiosity memperlihatkan senja kebiruan di atmosfer berdebu Kawah Gale, Mars",
        credit: "NASA/JPL-Caltech/MSSS/Texas A&M Univ.",
        source: "https://science.nasa.gov/photojournal/sunset-in-mars-gale-crater/",
        license: "NASA image policy",
        licenseUrl: "https://www.nasa.gov/nasa-brand-center/images-and-media/",
        caption: "Senja kebiruan di Kawah Gale",
        fit: "cover"
      },
      {
        src: "https://assets.science.nasa.gov/dynamicimage/assets/science/psd/photojournal/pia/pia04/pia04271/PIA04271.jpg?crop=faces%2Cfocalpoint&fit=clip&h=540&w=810",
        alt: "Citra Mars Global Surveyor memperlihatkan lapisan tipis haze di limb Mars",
        credit: "NASA/JPL/Malin Space Science Systems",
        source: "https://science.nasa.gov/photojournal/the-martian-limb/",
        license: "NASA image policy",
        licenseUrl: "https://www.nasa.gov/nasa-brand-center/images-and-media/",
        caption: "Haze atmosfer pada limb Mars",
        fit: "cover"
      }
    ],
    title: "Atmosfer Mars",
    kicker: "UDARA YANG SANGAT TIPIS",
    subtitle: "Udara supertipis di dunia merah",
    summary: "Mars punya atmosfer, tetapi sangat tipis dibandingkan Bumi. Udara ini sulit menyimpan panas, sementara debu halus yang melayang membuat langit dunia merah tampak berkabut kemerahan.",
    facts: [
      "Pengukuran Curiosity di Gale Crater menunjukkan sekitar 95,9% atmosfer berupa karbon dioksida.",
      "Tekanan atmosfer permukaan Mars kurang dari 1% tekanan atmosfer Bumi.",
      "Gas lain yang penting antara lain nitrogen dan argon."
    ],
    source: "https://science.nasa.gov/resource/the-five-most-abundant-gases-in-the-martian-atmosphere/",
    // This global topic is spatially anchored to Gale because the panel's measurement
    // is specifically from Curiosity/SAM at Gale Crater.
    location: { label: "Gale Crater · SAM", latitude: -5.37, longitudeEast: 137.81, source: "https://planetarynames.wr.usgs.gov/Feature/2071" },
    shift: { x: 0.028, y: -0.005 }
  },
  {
    images: [
      {
        src: "assets/exploration/dust-storm.webp",
        alt: "Perbandingan Mars pada badai debu besar tahun 2001",
        credit: "NASA/JPL-Caltech/MSSS",
        source: "https://science.nasa.gov/resource/the-2001-great-dust-storms-hellassyrtis-major/",
        license: "NASA image policy",
        licenseUrl: "https://www.nasa.gov/nasa-brand-center/images-and-media/",
        caption: "Badai debu besar Mars 2001",
        fit: "cover"
      },
      {
        src: "https://assets.science.nasa.gov/dynamicimage/assets/science/psd/photojournal/pia/pia22/pia22519/PIA22519.jpg?crop=faces%2Cfocalpoint&fit=clip&h=709&w=1438",
        alt: "Peta Mars Reconnaissance Orbiter memperlihatkan perkembangan badai debu raksasa tahun 2018",
        credit: "NASA/JPL-Caltech/MSSS",
        source: "https://science.nasa.gov/photojournal/2018-giant-dust-storm-on-mars/",
        license: "NASA image policy",
        licenseUrl: "https://www.nasa.gov/nasa-brand-center/images-and-media/",
        caption: "Badai debu raksasa Mars 2018",
        fit: "cover"
      }
    ],
    title: "Badai Debu & Musim",
    kicker: "CUACA PLANET MERAH",
    subtitle: "Saat debu bisa menyelimuti hampir seluruh dunia Mars",
    summary: "Mars juga punya empat musim, tetapi semuanya berjalan dalam tahun yang jauh lebih panjang. Perubahan musim menggerakkan atmosfer tipisnya dan kadang memicu badai debu yang tumbuh menjadi raksasa.",
    facts: [
      "Satu tahun Mars berlangsung sekitar 687 hari Bumi, sehingga musimnya lebih panjang.",
      "Badai debu besar paling aktif pada musim semi dan musim panas di belahan selatan.",
      "Sebagian badai dapat berkembang hingga mencakup hampir seluruh planet dan mengurangi cahaya untuk wahana bertenaga surya."
    ],
    source: "https://science.nasa.gov/helio-and-you-seasons-on-earth-mars-and-beyond/",
    // NASA documents Hellas as a frequent origin region for major/global dust storms.
    location: { label: "Hellas Planitia", latitude: -42.43, longitudeEast: 70.50, source: "https://planetarynames.wr.usgs.gov/Feature/2432" },
    shift: { x: -0.025, y: 0.008 }
  }
]);

// Scene two owns its renderer and animation loop. Loading is local and optional:
// the flight controller never waits for WebGL, a module, or an image to succeed.
window.MarsScene = class MarsScene {
  constructor() {
    this.element = document.getElementById("mars-scene");
    this.viewport = document.getElementById("mars-viewport");
    this.caption = this.element.querySelector(".mars-caption");
    this.credit = this.element.querySelector(".mars-credit");
    this.exploreButton = document.getElementById("mars-explore-button");
    this.exploration = document.getElementById("mars-exploration");
    this.explorationClose = document.getElementById("mars-exploration-close");
    this.topicTitle = document.getElementById("mars-topic-title");
    this.topicKicker = document.getElementById("mars-topic-kicker");
    this.topicSubtitle = document.getElementById("mars-topic-subtitle");
    this.topicScroll = document.getElementById("mars-topic-scroll");
    this.topicSummary = document.getElementById("mars-topic-summary");
    this.topicFacts = document.getElementById("mars-topic-facts");
    this.topicSource = document.getElementById("mars-topic-source");
    this.photoSource = document.getElementById("mars-photo-source");
    this.topicCurrent = document.getElementById("mars-topic-current");
    this.topicTotal = document.getElementById("mars-topic-total");
    this.topicProgress = document.getElementById("mars-topic-progress");
    this.topicPrev = document.getElementById("mars-topic-prev");
    this.topicNext = document.getElementById("mars-topic-next");
    this.focusReticle = document.getElementById("mars-focus-reticle");
    this.focusLabel = document.getElementById("mars-focus-label");
    this.focusContext = document.getElementById("mars-focus-context");
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
    this.topicRoll = MARS_EXPLORATION_ROLL;
    this.topicRollTarget = MARS_EXPLORATION_ROLL;
    this.topicShift = { x: 0, y: 0 };
    this.topicShiftTarget = { x: 0, y: 0 };
    this.renderedRotation = 0.6;
    const firstGeographicStop = MARS_EXPLORATION_STOPS.find(stop => stop.location);
    this.markerLocalPoint = marsSurfacePoint(firstGeographicStop.location);
    this.topicHasLocation = Boolean(MARS_EXPLORATION_STOPS[0].location);
    this.caption.inert = true;
    this.exploration.inert = true;
    this.stars = Array.from({ length: 240 }, (_, n) => {
      const rand = seed => { const v = Math.sin(seed * 127.1 + 417.3) * 43758.5453; return v - Math.floor(v); };
      return { x: rand(n), y: rand(n + 400), z: rand(n + 800), size: rand(n + 1200) };
    });
    this.tick = this.tick.bind(this);
    this.topicTotal.textContent = String(MARS_EXPLORATION_STOPS.length).padStart(2, "0");
    this.topicProgress.replaceChildren(...MARS_EXPLORATION_STOPS.map(() => document.createElement("span")));
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

  setExplorationStop(index, { immediate = false, announce = true } = {}) {
    const nextIndex = Math.max(0, Math.min(MARS_EXPLORATION_STOPS.length - 1, index));
    const stop = MARS_EXPLORATION_STOPS[nextIndex];
    window.ExplorationMedia.render("mars", stop);
    this.focusReticle.classList.remove("is-marker-visible");
    this.focusReticle.classList.add("is-relocating");
    this.focusReticle.style.setProperty("--marker-opacity", "0");
    this.topicIndex = nextIndex;
    this.topicHasLocation = Boolean(stop.location);
    const orientation = marsStopOrientation(stop, nextIndex);
    this.topicYawTarget = immediate ? orientation.yaw : unwrapMarsAngleNear(orientation.yaw, this.topicYaw);
    this.topicPitchTarget = orientation.pitch;
    this.topicRollTarget = orientation.roll;
    this.topicShiftTarget = { ...(stop.shift || { x: 0, y: 0 }) };
    if (stop.location) {
      this.markerLocalPoint = marsSurfacePoint(stop.location);
      if (this.markerAnchor) this.markerAnchor.position.set(this.markerLocalPoint.x, this.markerLocalPoint.y, this.markerLocalPoint.z);
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
    this.topicSource.textContent = `Sumber: ${stop.sourceName || "NASA Science"} ↗`;
    this.photoSource.hidden = true;
    this.photoSource.removeAttribute("href");
    this.photoSource.textContent = "";
    this.topicCurrent.textContent = String(nextIndex + 1).padStart(2, "0");
    this.topicPrev.disabled = nextIndex === 0;
    this.topicNext.disabled = nextIndex === MARS_EXPLORATION_STOPS.length - 1;
    Array.from(this.topicProgress.children).forEach((bar, i) => bar.classList.toggle("is-active", i === nextIndex));
    if (stop.location) {
      this.focusLabel.textContent = stop.location.label;
      const latitudeHemisphere = stop.location.latitude >= 0 ? "N" : "S";
      const longitude = ((stop.location.longitudeEast % 360) + 360) % 360;
      this.focusContext.textContent = `MARS · ${Math.abs(stop.location.latitude).toFixed(2)}°${latitudeHemisphere} · ${longitude.toFixed(2)}°E`;
    } else {
      this.focusLabel.textContent = "";
      this.focusContext.textContent = "";
    }
    if (!immediate && !this.motion.matches) this.exploration.classList.add("is-switching");

    if (this.active) {
      if (!this.motion.matches && !this.frame) { this.previous = performance.now(); this.tick(this.previous); }
      else this.render();
    }
    if (announce && this.exploring) document.getElementById("announcement").textContent = `Eksplorasi Mars ${nextIndex + 1} dari ${MARS_EXPLORATION_STOPS.length}: ${stop.title}.`;
  }

  enterExploration() {
    if (!this.active || this.exploring) return;
    this.exploring = true;
    // Start from the arrival pose, then converge on the selected topic pose.
    this.topicYaw = this.renderedRotation;
    this.topicPitch = 0.09;
    this.topicRoll = MARS_EXPLORATION_ROLL;
    const selectedStop = MARS_EXPLORATION_STOPS[this.topicIndex];
    this.topicHasLocation = Boolean(selectedStop.location);
    const orientation = marsStopOrientation(selectedStop, this.topicIndex);
    this.topicYawTarget = unwrapMarsAngleNear(orientation.yaw, this.topicYaw);
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
    document.getElementById("announcement").textContent = `Mode eksplorasi Mars dimulai. ${MARS_EXPLORATION_STOPS[this.topicIndex].title}.`;
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
    document.getElementById("announcement").textContent = "Kembali ke panorama Mars.";
    this.exploreButton.focus({ preventScroll: true });
  }

  prepare() {
    if (this.loading) return this.loading;
    this.loading = (async () => {
      const [moduleResult, imageResult] = await Promise.allSettled([
        import("./assets/vendor/three/three.module.min.js"),
        new Promise((resolve, reject) => {
          const image = new Image();
          const timeout = setTimeout(() => reject(new Error("Texture timeout")), 8000);
          image.onload = () => { clearTimeout(timeout); resolve(image); };
          image.onerror = () => { clearTimeout(timeout); reject(new Error("Texture unavailable")); };
          image.src = "assets/textures/mars-surface-2k.jpg";
        })
      ]);
      this.surface = imageResult.status === "fulfilled" ? imageResult.value : this.makeProceduralSurface();
      this.element.dataset.texture = imageResult.status === "fulfilled" ? "map" : "procedural";
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
      this.viewport.innerHTML = '<div class="mars-emergency-sphere"></div>';
    });
    return this.loading;
  }

  createThreeScene(THREE) {
    const canvas = document.createElement("canvas");
    const context = canvas.getContext("webgl2", { alpha: true, antialias: true, powerPreference: "low-power" });
    if (!context) throw new Error("WebGL2 unavailable");
    this.THREE = THREE;
    this.renderer = new THREE.WebGLRenderer({ canvas, context, alpha: true, antialias: true });
    this.renderer.setClearColor(0x030812, 0);
    this.renderer.setPixelRatio(Math.min(devicePixelRatio || 1, 1.5));
    this.renderer.outputColorSpace = THREE.SRGBColorSpace;
    this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
    this.renderer.toneMappingExposure = 1.08;
    this.viewport.replaceChildren(canvas);
    this.scene = new THREE.Scene();
    this.camera = new THREE.PerspectiveCamera(36, 1, 0.1, 450);
    this.camera.position.z = 6;
    const texture = new THREE.Texture(this.surface);
    texture.colorSpace = THREE.SRGBColorSpace;
    texture.anisotropy = Math.min(4, this.renderer.capabilities.getMaxAnisotropy());
    texture.needsUpdate = true;
    const relief = texture.clone();
    relief.colorSpace = THREE.NoColorSpace;
    relief.needsUpdate = true;
    const material = new THREE.MeshStandardMaterial({ map: texture, bumpMap: relief, bumpScale: 0.018, roughness: 0.98, metalness: 0 });
    this.planet = new THREE.Mesh(new THREE.SphereGeometry(1, 96, 64), material);
    this.planet.rotation.set(0.09, 0.6, 0.12);
    this.planetGroup = new THREE.Group();
    this.planetGroup.add(this.planet);
    this.scene.add(this.planetGroup);

    // Real geographic anchor attached to the Mars mesh. The existing DOM reticle
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
    const sun = new THREE.DirectionalLight(0xffe2c2, 2.6);
    sun.position.set(-3.5, 2.5, 4);
    this.scene.add(sun, new THREE.AmbientLight(0x899bb7, 0.13));
    const fill = new THREE.DirectionalLight(0x6e88aa, 0.13);
    fill.position.set(4, -1, -3);
    this.scene.add(fill);
    // Thin warm limb scattering; it is deliberately much subtler than an Earth halo.
    this.atmosphere = new THREE.Mesh(new THREE.SphereGeometry(1.013, 64, 40), new THREE.ShaderMaterial({
      transparent: true, depthWrite: false, blending: THREE.AdditiveBlending,
      vertexShader: `varying vec3 vWorld; varying vec3 vNormal;
        void main(){ vec4 world=modelMatrix*vec4(position,1.); vWorld=world.xyz;
        vNormal=normalize(mat3(modelMatrix)*normal); gl_Position=projectionMatrix*viewMatrix*world; }`,
      fragmentShader: `varying vec3 vWorld; varying vec3 vNormal;
        void main(){ vec3 n=normalize(vNormal); vec3 eye=normalize(cameraPosition-vWorld);
        float rim=pow(1.-max(dot(n,eye),0.),4.);
        float sun=max(dot(n,normalize(vec3(-3.5,2.5,4.))),0.);
        gl_FragColor=vec4(.64,.29,.14,rim*(.035+.19*sun)); }`
    }));
    this.planetGroup.add(this.atmosphere);
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

  makeProceduralSurface() {
    const canvas = document.createElement("canvas");
    canvas.width = 512; canvas.height = 256;
    const ctx = canvas.getContext("2d");
    const pixels = ctx.createImageData(512, 256);
    for (let y = 0; y < 256; y++) for (let x = 0; x < 512; x++) {
      const longitude = x / 512 * Math.PI * 2;
      const latitude = y / 256 * Math.PI;
      const large = Math.sin(longitude * 3 + Math.sin(latitude * 6)) * Math.cos(latitude * 5 + Math.sin(longitude * 2));
      const fine = Math.sin(longitude * 51 + Math.cos(latitude * 27)) * Math.sin(latitude * 43) * 8;
      const dust = 26 * large + fine;
      const polar = Math.pow(Math.abs(Math.cos(latitude)), 38) * 65;
      const i = (y * 512 + x) * 4;
      pixels.data.set([153 + dust + polar, 79 + dust * 0.65 + polar, 46 + dust * 0.4 + polar, 255], i);
    }
    ctx.putImageData(pixels, 0, 0);
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
    map.width = 1024; map.height = 512;
    const mapContext = map.getContext("2d");
    mapContext.drawImage(this.surface, 0, 0, 1024, 512);
    this.surfacePixels = mapContext.getImageData(0, 0, 1024, 512).data;
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
    this.time = settled ? 12.6 : 0;
    this.announced = false;
    this.element.hidden = false;
    this.exploring = false;
    this.explorationBlend = this.explorationBlendTarget = 0;
    this.topicYaw = this.topicYawTarget = 0.6;
    this.topicPitch = this.topicPitchTarget = 0.09;
    this.topicRoll = this.topicRollTarget = MARS_EXPLORATION_ROLL;
    this.topicShift = { x: 0, y: 0 };
    this.topicShiftTarget = { ...MARS_EXPLORATION_STOPS[0].shift };
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
    if (!this.motion.matches || this.time < 14 || this.mode === "pending" || explorationMoving) this.frame = requestAnimationFrame(this.tick);
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
    if (!this.topicHasLocation) {
      this.focusReticle?.style.setProperty("--marker-opacity", "0");
      this.focusReticle?.classList.remove("is-marker-visible");
      return;
    }
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
    if (!this.topicHasLocation) {
      this.focusReticle?.style.setProperty("--marker-opacity", "0");
      this.focusReticle?.classList.remove("is-marker-visible");
      return;
    }
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

  render() {
    const smooth = value => { const v = Math.max(0, Math.min(1, value)); return v * v * v * (v * (v * 6 - 15) + 10); };
    const t = this.time;
    const approach = this.motion.matches ? 1 : smooth((t - 0.6) / 12);
    const arrivalDistance = this.finalDistance * Math.pow(15, 1 - approach);
    const explorationDistanceScale = this.mobile
      ? MARS_EXPLORATION_DISTANCE_SCALE_MOBILE
      : MARS_EXPLORATION_DISTANCE_SCALE_DESKTOP;
    const explorationFramingScale = 1 + this.explorationBlend * (explorationDistanceScale - 1);
    this.distance = arrivalDistance * explorationFramingScale;
    const arrivalYaw = this.motion.matches ? 0.6 : 0.6 + t * 0.024;
    const exploreYaw = this.topicYaw + (this.motion.matches ? 0 : Math.sin(t * 0.14) * 0.012);
    const fallbackYaw = arrivalYaw * (1 - this.explorationBlend) + exploreYaw * this.explorationBlend;
    const fallbackPitch = 0.09 * (1 - this.explorationBlend) + this.topicPitch * this.explorationBlend;
    const fallbackRoll = MARS_EXPLORATION_ROLL * (1 - this.explorationBlend) + this.topicRoll * this.explorationBlend;
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
      document.getElementById("announcement").textContent = "Mars, si Planet Merah.";
      // Never steal focus from someone using mute during the approach.
      if (document.activeElement === document.body || document.activeElement.id === "launch-button") document.getElementById("mars-title").focus({ preventScroll: true });
    }
    const drift = this.motion.matches ? 0 : Math.sin(t * 0.24) * 0.018;
    if (this.mode === "webgl") {
      const halfHeight = Math.tan(Math.PI / 10) * this.finalDistance;
      const baseX = this.mobile ? 0 : 0.28;
      const exploreX = this.mobile ? this.topicShift.x * 0.7 : MARS_EXPLORATION_CENTER_X_DESKTOP + this.topicShift.x;
      const baseY = this.mobile ? 0.28 : 0.1;
      const exploreY = this.mobile ? 0.20 + this.topicShift.y : MARS_EXPLORATION_CENTER_Y_DESKTOP + this.topicShift.y;
      const groupX = baseX * (1 - this.explorationBlend) + exploreX * this.explorationBlend;
      const groupY = baseY * (1 - this.explorationBlend) + exploreY * this.explorationBlend;
      this.planetGroup.position.set(halfHeight * this.camera.aspect * groupX, halfHeight * groupY + drift * (1 - this.explorationBlend * 0.45), 0);

      // Preserve the arrival pose, but in exploration orient the real sphere from
      // geographic latitude/longitude. Composition is Rz * Rx * Ry so the chosen
      // surface normal points toward +Z while Mars north remains upright.
      this.arrivalEuler.set(0.09, arrivalYaw, MARS_EXPLORATION_ROLL, "XYZ");
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

      // Inverse of Rz(roll) * Rx(pitch) * Ry(yaw): screen normal -> Mars local.
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
      const u = ((longitude + Math.PI) / MARS_TAU + 1) % 1;
      const v = Math.acos(Math.max(-1, Math.min(1, ly))) / Math.PI;
      const sampleX = Math.min(1023, Math.max(0, Math.floor(u * 1024)));
      const sampleY = Math.min(511, Math.max(0, Math.floor(v * 512)));
      const j = (sampleY * 1024 + sampleX) * 4;
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
