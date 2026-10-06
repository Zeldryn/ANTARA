"use strict";

// Educational copy is kept separate from rendering logic. Facts are condensed from
// NASA Science pages linked per stop so the interface stays concise and verifiable.
//
// Geographic targets use IAU/USGS planetocentric latitude and positive-east longitude.
// The globe uses NASA's Magellan radar-derived equirectangular surface texture. One
// longitude calibration is shared by every Venus target so geographic markers stay
// data-driven rather than being positioned by screen-space guesses.
const VENUS_TEXTURE_LONGITUDE_OFFSET_DEG = 0;
const VENUS_DEG_TO_RAD = Math.PI / 180;
const VENUS_TAU = Math.PI * 2;
const VENUS_EXPLORATION_ROLL = 0.12;
const VENUS_EXPLORATION_DISTANCE_SCALE_DESKTOP = 1.04;
const VENUS_EXPLORATION_DISTANCE_SCALE_MOBILE = 1.05;
const VENUS_EXPLORATION_CENTER_X_DESKTOP = 0.23;
const VENUS_EXPLORATION_CENTER_Y_DESKTOP = 0.055;

const wrapVenusRadians = angle => Math.atan2(Math.sin(angle), Math.cos(angle));
const unwrapVenusAngleNear = (angle, reference) => reference + wrapVenusRadians(angle - reference);

const venusLocationOrientation = location => {
  const longitude = wrapVenusRadians((location.longitudeEast + VENUS_TEXTURE_LONGITUDE_OFFSET_DEG) * VENUS_DEG_TO_RAD);
  return {
    // THREE.SphereGeometry maps geographic longitude to local
    // (x, z) = (cos(lon), -sin(lon)). Ry(-PI/2-lon), then Rx(lat),
    // brings that exact surface normal to +Z while keeping north toward +Y.
    yaw: -Math.PI / 2 - longitude,
    pitch: location.latitude * VENUS_DEG_TO_RAD,
    roll: VENUS_EXPLORATION_ROLL
  };
};

const venusSurfacePoint = (location, radius = 1) => {
  const latitude = location.latitude * VENUS_DEG_TO_RAD;
  const longitude = wrapVenusRadians((location.longitudeEast + VENUS_TEXTURE_LONGITUDE_OFFSET_DEG) * VENUS_DEG_TO_RAD);
  const cosLatitude = Math.cos(latitude);
  return {
    x: radius * cosLatitude * Math.cos(longitude),
    y: radius * Math.sin(latitude),
    z: -radius * cosLatitude * Math.sin(longitude)
  };
};

const VENUS_EXPLORATION_STOPS = Object.freeze([
  {
    images: [
      {
        src: "https://assets.science.nasa.gov/dynamicimage/assets/science/psd/photojournal/pia/pia23/pia23791/PIA23791.jpg?crop=faces%2Cfocalpoint&fit=clip&h=1096&w=2245",
        alt: "Citra Venus oleh Mariner 10 memperlihatkan lapisan awan global Venus",
        credit: "NASA/JPL-Caltech",
        source: "https://science.nasa.gov/photojournal/mariner-10-image-of-venus/",
        license: "NASA image policy",
        licenseUrl: "https://www.nasa.gov/nasa-brand-center/images-and-media/",
        caption: "Venus dalam cahaya ultraviolet · Mariner 10",
        fit: "cover"
      }
    ],
    title: "Dunia Paling Panas",
    kicker: "SUHU EKSTREM",
    subtitle: "Panasnya bahkan mengalahkan Merkurius",
    summary: "Dari jauh Venus tampak tenang, tetapi permukaannya luar biasa panas. Atmosfer karbon dioksida yang sangat tebal memerangkap panas begitu kuat sehingga siang dan malam sama-sama ekstrem.",
    facts: [
      "Suhu rata-rata permukaannya sekitar 464 °C.",
      "Venus lebih panas daripada Merkurius walaupun letaknya lebih jauh dari Matahari.",
      "Efek rumah kaca ekstrem menjadi penyebab utama kondisi panas di permukaan."
    ],
    source: "https://science.nasa.gov/resource/solar-system-temperatures/",
    location: null,
    orientation: { yaw: 0.72, pitch: 0.08, roll: 0.10 },
    shift: { x: 0.00, y: 0.00 }
  },
  {
    images: [
      {
        src: "https://assets.science.nasa.gov/dynamicimage/assets/science/psd/photojournal/pia/pia23/pia23791/PIA23791.jpg?crop=faces%2Cfocalpoint&fit=clip&h=1096&w=2245",
        alt: "Citra ultraviolet Mariner 10 memperlihatkan struktur awan Venus",
        credit: "NASA/JPL-Caltech",
        source: "https://science.nasa.gov/photojournal/mariner-10-image-of-venus/",
        license: "NASA image policy",
        licenseUrl: "https://www.nasa.gov/nasa-brand-center/images-and-media/",
        caption: "Lapisan awan Venus · Mariner 10",
        fit: "cover"
      },
      {
        src: "https://assets.science.nasa.gov/dynamicimage/assets/science/psd/solar/2023/09/p/i/a/0/PIA00072-3.jpg?crop=faces%2Cfocalpoint&fit=clip&h=800&w=800",
        alt: "Citra Galileo yang diwarnai memperlihatkan pola awan Venus",
        credit: "NASA/JPL-Caltech",
        source: "https://science.nasa.gov/photojournal/venus-cloud-patterns/",
        license: "NASA image policy",
        licenseUrl: "https://www.nasa.gov/nasa-brand-center/images-and-media/",
        caption: "Pola awan Venus · Galileo",
        fit: "cover"
      }
    ],
    title: "Awan Tebal Venus",
    kicker: "ATMOSFER VENUS",
    subtitle: "Selimut udara superpadat di dunia Venus",
    summary: "Venus diselimuti atmosfer yang jauh lebih rapat daripada Bumi. Sebagian besarnya karbon dioksida, lalu di atasnya terbentang awan tebal yang mengandung tetesan asam sulfat.",
    facts: [
      "Karbon dioksida merupakan komponen utama atmosfer Venus.",
      "Tekanan di permukaan sekitar 93 kali tekanan udara di permukaan Bumi.",
      "Awan tebal Venus mengandung tetesan asam sulfat dan menyembunyikan permukaan dari pengamatan cahaya tampak."
    ],
    source: "https://science.nasa.gov/venus/venus-facts/",
    location: null,
    orientation: { yaw: 1.16, pitch: 0.04, roll: 0.10 },
    shift: { x: 0.00, y: 0.00 }
  },
  {
    images: [],
    title: "Putarannya Bikin Heran",
    kicker: "ROTASI ANEH",
    subtitle: "Sehari di Venus lebih lama daripada setahunnya",
    summary: "Venus punya cara berputar yang tidak biasa. Ia berputar sangat lambat dan berlawanan arah dengan kebanyakan dunia lain, sampai satu putarannya lebih lama daripada satu kali mengelilingi Matahari.",
    facts: [
      "Periode rotasi sidereal Venus sekitar 243 hari Bumi.",
      "Venus mengorbit Matahari dalam sekitar 225 hari Bumi.",
      "Rotasinya retrograde, sehingga Matahari akan tampak terbit dari barat dan terbenam di timur."
    ],
    source: "https://science.nasa.gov/venus/venus-facts/",
    location: null,
    orientation: { yaw: 1.58, pitch: 0.06, roll: 0.10 },
    shift: { x: 0.00, y: 0.00 }
  },
  {
    images: [
      {
        src: "https://assets.science.nasa.gov/dynamicimage/assets/science/psd/photojournal/pia/pia00/pia00254/PIA00254.jpg?crop=faces%2Cfocalpoint&fit=clip&h=4000&w=5000",
        alt: "Perspektif tiga dimensi Maat Mons dari data radar dan altimetri Magellan",
        credit: "NASA/JPL-Caltech",
        source: "https://science.nasa.gov/photojournal/venus-3-d-perspective-view-of-maat-mons-2/",
        license: "NASA image policy",
        licenseUrl: "https://www.nasa.gov/nasa-brand-center/images-and-media/",
        caption: "Maat Mons · radar dan altimetri Magellan",
        fit: "cover"
      },
      {
        src: "https://d2pn8kiwq2w21t.cloudfront.net/original_images/jpegPIA00487.jpg",
        alt: "Citra radar Magellan memperlihatkan kubah vulkanik pada sisi Maat Mons",
        credit: "NASA/JPL-Caltech",
        source: "https://science.nasa.gov/photojournal/venus-volcanic-domes-on-flank-of-volcanic-maat-in-east-ovda-region/",
        license: "NASA image policy",
        licenseUrl: "https://www.nasa.gov/nasa-brand-center/images-and-media/",
        caption: "Kubah vulkanik di sisi Maat Mons",
        fit: "cover"
      }
    ],
    title: "Maat Mons",
    kicker: "DUNIA VULKANIK",
    subtitle: "Raksasa vulkanik yang bersembunyi di balik awan",
    summary: "Di balik awan Venus ada Maat Mons, salah satu gunung api raksasanya. Radar Magellan membantu kita melihat bentuknya, bahkan memberi petunjuk kuat bahwa aktivitas vulkanik modern pernah terjadi di wilayah ini.",
    facts: [
      "Pusat fitur Maat Mons tercatat sekitar 0,5° LU dan 194,6° BT pada basis data IAU/USGS.",
      "Puncak Maat Mons mencapai sekitar 8 km di atas permukaan rata-rata Venus.",
      "Analisis ulang citra Magellan menemukan perubahan ventilasi antara Februari dan Oktober 1991 yang ditafsirkan sebagai bukti erupsi."
    ],
    source: "https://www.jpl.nasa.gov/news/nasas-magellan-data-reveals-volcanic-activity-on-venus/",
    location: { label: "Maat Mons", latitude: 0.50, longitudeEast: 194.60, source: "https://planetarynames.wr.usgs.gov/Feature/3550" },
    shift: { x: 0.005, y: 0.005 }
  },
  {
    images: [
      {
        src: "https://assets.science.nasa.gov/dynamicimage/assets/science/psd/photojournal/pia/pia00/pia00241/PIA00241.jpg?crop=faces%2Cfocalpoint&fit=clip&h=4603&w=3663",
        alt: "Citra radar Magellan memperlihatkan Maxwell Montes di Venus",
        credit: "NASA/JPL-Caltech",
        source: "https://science.nasa.gov/photojournal/venus-lakshmi-planum-and-maxwell-montes/",
        license: "NASA image policy",
        licenseUrl: "https://www.nasa.gov/nasa-brand-center/images-and-media/",
        caption: "Maxwell Montes · citra radar Magellan",
        fit: "cover"
      },
      {
        src: "https://assets.science.nasa.gov/dynamicimage/assets/science/psd/photojournal/pia/pia00/pia00149/PIA00149.jpg?crop=faces%2Cfocalpoint&fit=clip&h=4600&w=5120",
        alt: "Citra radar Magellan memperlihatkan Maxwell Montes dan Cleopatra Patera",
        credit: "NASA/JPL-Caltech",
        source: "https://science.nasa.gov/photojournal/venus-maxwell-montes-and-cleopatra-crater/",
        license: "NASA image policy",
        licenseUrl: "https://www.nasa.gov/nasa-brand-center/images-and-media/",
        caption: "Maxwell Montes dan Cleopatra Patera",
        fit: "cover"
      }
    ],
    title: "Maxwell Montes",
    kicker: "PEGUNUNGAN TERTINGGI",
    subtitle: "Atap tertinggi yang kita kenal di dunia Venus",
    summary: "Dekat kutub utara Venus berdiri Maxwell Montes, wilayah tertinggi yang kita kenal di dunia ini. Bentuk pegunungannya juga memberi ilmuwan petunjuk tentang bagaimana kerak Venus pernah terdorong dan terlipat.",
    facts: [
      "Pusat Maxwell Montes tercatat sekitar 65,2° LU dan 3,3° BT pada basis data IAU/USGS.",
      "Pegunungan ini menjulang sekitar 11 km di atas radius rata-rata Venus.",
      "Citra radar memperlihatkan punggungan dan struktur kompleks yang membantu ilmuwan mempelajari deformasi kerak Venus."
    ],
    source: "https://science.nasa.gov/photojournal/venus-lakshmi-planum-and-maxwell-montes/",
    location: { label: "Maxwell Montes", latitude: 65.20, longitudeEast: 3.30, source: "https://planetarynames.wr.usgs.gov/Feature/3766" },
    shift: { x: -0.008, y: -0.018 }
  },
  {
    images: [
      {
        src: "https://assets.science.nasa.gov/dynamicimage/assets/science/psd/photojournal/pia/pia23/pia23791/PIA23791.jpg?crop=faces%2Cfocalpoint&fit=clip&h=1096&w=2245",
        alt: "Mariner 10 memperlihatkan awan global Venus dalam citra ultraviolet",
        credit: "NASA/JPL-Caltech",
        source: "https://science.nasa.gov/photojournal/mariner-10-image-of-venus/",
        license: "NASA image policy",
        licenseUrl: "https://www.nasa.gov/nasa-brand-center/images-and-media/",
        caption: "Awan Venus · Mariner 10",
        fit: "cover"
      },
      {
        src: "https://assets.science.nasa.gov/dynamicimage/assets/science/cds/3d/resources/image/venus/preview.webp?w=2048",
        alt: "Peta global permukaan Venus yang disusun dari citra radar Magellan",
        credit: "NASA/JPL-Caltech",
        source: "https://science.nasa.gov/3d-resources/venus-surface-texture/",
        license: "NASA image policy",
        licenseUrl: "https://www.nasa.gov/nasa-brand-center/images-and-media/",
        caption: "Peta radar global Venus · Magellan",
        fit: "cover"
      }
    ],
    title: "Awan & Eksplorasi",
    kicker: "MELIHAT DI BALIK AWAN",
    subtitle: "Radar membantu kita mengintip dunia di balik awan",
    summary: "Awan Venus terlalu tebal untuk melihat permukaannya dengan cahaya biasa. Karena itu ilmuwan memakai radar seperti pada misi Magellan untuk mengintip menembus awan dan menemukan gunung, dataran, serta jejak vulkanik.",
    facts: [
      "Magellan menggunakan radar untuk menghasilkan pemetaan global beresolusi tinggi terhadap permukaan Venus.",
      "Misi DAVINCI dirancang untuk mempelajari atmosfer Venus secara langsung, sedangkan VERITAS dirancang untuk menyelidiki permukaan dan sejarah geologinya.",
      "Gabungan pengamatan atmosfer dan radar membantu ilmuwan memahami mengapa Venus berkembang sangat berbeda dari Bumi."
    ],
    source: "https://science.nasa.gov/venus/",
    location: null,
    orientation: { yaw: 2.02, pitch: 0.08, roll: 0.10 },
    shift: { x: 0.00, y: 0.00 }
  }
]);

// Venus owns its renderer and animation loop. Loading is local and optional:
// the flight controller never waits for WebGL, a module, or an image to succeed.
window.VenusScene = class VenusScene {
  constructor() {
    this.element = document.getElementById("venus-scene");
    this.viewport = document.getElementById("venus-viewport");
    this.caption = this.element.querySelector(".venus-caption");
    this.credit = this.element.querySelector(".venus-credit");
    this.exploreButton = document.getElementById("venus-explore-button");
    this.exploration = document.getElementById("venus-exploration");
    this.explorationClose = document.getElementById("venus-exploration-close");
    this.topicTitle = document.getElementById("venus-topic-title");
    this.topicKicker = document.getElementById("venus-topic-kicker");
    this.topicSubtitle = document.getElementById("venus-topic-subtitle");
    this.topicScroll = document.getElementById("venus-topic-scroll");
    this.topicSummary = document.getElementById("venus-topic-summary");
    this.topicFacts = document.getElementById("venus-topic-facts");
    this.topicSource = document.getElementById("venus-topic-source");
    this.photoSource = document.getElementById("venus-photo-source");
    this.topicCurrent = document.getElementById("venus-topic-current");
    this.topicTotal = document.getElementById("venus-topic-total");
    this.topicProgress = document.getElementById("venus-topic-progress");
    this.topicPrev = document.getElementById("venus-topic-prev");
    this.topicNext = document.getElementById("venus-topic-next");
    this.focusReticle = document.getElementById("venus-focus-reticle");
    this.focusLabel = document.getElementById("venus-focus-label");
    this.focusContext = document.getElementById("venus-focus-context");
    this.markerMedia = document.getElementById("venus-marker-media");
    this.contextMedia = document.getElementById("venus-context-media");
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
    this.topicRoll = VENUS_EXPLORATION_ROLL;
    this.topicRollTarget = VENUS_EXPLORATION_ROLL;
    this.topicShift = { x: 0, y: 0 };
    this.topicShiftTarget = { x: 0, y: 0 };
    this.renderedRotation = 0.6;
    const firstGeographicStop = VENUS_EXPLORATION_STOPS.find(stop => stop.location);
    this.markerLocalPoint = venusSurfacePoint(firstGeographicStop.location);
    this.hasActiveLocation = false;
    this.caption.inert = true;
    this.exploration.inert = true;
    this.stars = Array.from({ length: 240 }, (_, n) => {
      const rand = seed => { const v = Math.sin(seed * 127.1 + 417.3) * 43758.5453; return v - Math.floor(v); };
      return { x: rand(n), y: rand(n + 400), z: rand(n + 800), size: rand(n + 1200) };
    });
    this.tick = this.tick.bind(this);
    this.topicTotal.textContent = String(VENUS_EXPLORATION_STOPS.length).padStart(2, "0");
    this.topicProgress.replaceChildren(...VENUS_EXPLORATION_STOPS.map(() => document.createElement("span")));
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
    const nextIndex = Math.max(0, Math.min(VENUS_EXPLORATION_STOPS.length - 1, index));
    const stop = VENUS_EXPLORATION_STOPS[nextIndex];
    this.topicIndex = nextIndex;
    this.hasActiveLocation = Boolean(stop.location);

    this.markerMedia.replaceChildren();
    this.markerMedia.hidden = true;
    this.contextMedia.replaceChildren();
    this.contextMedia.hidden = true;
    window.ExplorationMedia.render("venus", stop, this.hasActiveLocation ? this.markerMedia : this.contextMedia);

    this.focusReticle.classList.remove("is-marker-visible");
    this.focusReticle.classList.add("is-relocating");
    const orientation = stop.location ? venusLocationOrientation(stop.location) : stop.orientation;
    this.topicYawTarget = immediate ? orientation.yaw : unwrapVenusAngleNear(orientation.yaw, this.topicYaw);
    this.topicPitchTarget = orientation.pitch;
    this.topicRollTarget = orientation.roll ?? VENUS_EXPLORATION_ROLL;
    this.topicShiftTarget = { ...(stop.shift || { x: 0, y: 0 }) };

    if (stop.location) {
      this.markerLocalPoint = venusSurfacePoint(stop.location);
      if (this.markerAnchor) this.markerAnchor.position.set(this.markerLocalPoint.x, this.markerLocalPoint.y, this.markerLocalPoint.z);
      this.focusLabel.textContent = stop.location.label;
      const latitudeHemisphere = stop.location.latitude >= 0 ? "N" : "S";
      const longitude = ((stop.location.longitudeEast % 360) + 360) % 360;
      this.focusContext.textContent = `VENUS · ${Math.abs(stop.location.latitude).toFixed(2)}°${latitudeHemisphere} · ${longitude.toFixed(2)}°E`;
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
    this.topicNext.disabled = nextIndex === VENUS_EXPLORATION_STOPS.length - 1;
    Array.from(this.topicProgress.children).forEach((bar, i) => bar.classList.toggle("is-active", i === nextIndex));
    if (!immediate && !this.motion.matches) this.exploration.classList.add("is-switching");

    if (this.active) {
      if (!this.motion.matches && !this.frame) { this.previous = performance.now(); this.tick(this.previous); }
      else this.render();
    }
    if (announce && this.exploring) document.getElementById("announcement").textContent = `Eksplorasi Venus ${nextIndex + 1} dari ${VENUS_EXPLORATION_STOPS.length}: ${stop.title}.`;
  }

  enterExploration() {
    if (!this.active || this.exploring) return;
    this.exploring = true;
    // Start from the arrival pose, then converge on the selected geographic target.
    this.topicYaw = this.renderedRotation;
    this.topicPitch = 0.09;
    this.topicRoll = VENUS_EXPLORATION_ROLL;
    const activeStop = VENUS_EXPLORATION_STOPS[this.topicIndex];
    const orientation = activeStop.location ? venusLocationOrientation(activeStop.location) : activeStop.orientation;
    this.topicYawTarget = unwrapVenusAngleNear(orientation.yaw, this.topicYaw);
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
    document.getElementById("announcement").textContent = `Mode eksplorasi Venus dimulai. ${VENUS_EXPLORATION_STOPS[this.topicIndex].title}.`;
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
    document.getElementById("announcement").textContent = "Kembali ke panorama Venus.";
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
          image.crossOrigin = "anonymous";
          image.src = "https://assets.science.nasa.gov/dynamicimage/assets/science/cds/3d/resources/image/venus/preview.webp?w=2048";
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
      this.viewport.innerHTML = '<div class="venus-emergency-sphere"></div>';
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

    // Real geographic anchor attached to the Venus mesh. The existing DOM reticle
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
    const sun = new THREE.DirectionalLight(0xffe5b8, 2.45);
    sun.position.set(-3.5, 2.5, 4);
    this.scene.add(sun, new THREE.AmbientLight(0xb99866, 0.18));
    const fill = new THREE.DirectionalLight(0x8e7351, 0.15);
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
        gl_FragColor=vec4(.91,.58,.19,rim*(.055+.22*sun)); }`
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
      pixels.data.set([177 + dust + polar * 0.45, 125 + dust * 0.72 + polar * 0.38, 68 + dust * 0.42 + polar * 0.22, 255], i);
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
    this.topicRoll = this.topicRollTarget = VENUS_EXPLORATION_ROLL;
    this.topicShift = { x: 0, y: 0 };
    this.topicShiftTarget = { ...VENUS_EXPLORATION_STOPS[0].shift };
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

  render() {
    const smooth = value => { const v = Math.max(0, Math.min(1, value)); return v * v * v * (v * (v * 6 - 15) + 10); };
    const t = this.time;
    const approach = this.motion.matches ? 1 : smooth((t - 0.6) / 12);
    const arrivalDistance = this.finalDistance * Math.pow(15, 1 - approach);
    const explorationDistanceScale = this.mobile
      ? VENUS_EXPLORATION_DISTANCE_SCALE_MOBILE
      : VENUS_EXPLORATION_DISTANCE_SCALE_DESKTOP;
    const explorationFramingScale = 1 + this.explorationBlend * (explorationDistanceScale - 1);
    this.distance = arrivalDistance * explorationFramingScale;
    const arrivalYaw = this.motion.matches ? 0.6 : 0.6 - t * 0.016;
    const exploreYaw = this.topicYaw + (this.motion.matches ? 0 : Math.sin(t * 0.14) * 0.012);
    const fallbackYaw = arrivalYaw * (1 - this.explorationBlend) + exploreYaw * this.explorationBlend;
    const fallbackPitch = 0.09 * (1 - this.explorationBlend) + this.topicPitch * this.explorationBlend;
    const fallbackRoll = VENUS_EXPLORATION_ROLL * (1 - this.explorationBlend) + this.topicRoll * this.explorationBlend;
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
      document.getElementById("announcement").textContent = "Venus, si Planet Terpanas.";
      // Never steal focus from someone using mute during the approach.
      if (document.activeElement === document.body || document.activeElement.id === "launch-button") document.getElementById("venus-title").focus({ preventScroll: true });
    }
    const drift = this.motion.matches ? 0 : Math.sin(t * 0.24) * 0.018;
    if (this.mode === "webgl") {
      const halfHeight = Math.tan(Math.PI / 10) * this.finalDistance;
      const baseX = this.mobile ? 0 : 0.28;
      const exploreX = this.mobile ? this.topicShift.x * 0.7 : VENUS_EXPLORATION_CENTER_X_DESKTOP + this.topicShift.x;
      const baseY = this.mobile ? 0.28 : 0.1;
      const exploreY = this.mobile ? 0.20 + this.topicShift.y : VENUS_EXPLORATION_CENTER_Y_DESKTOP + this.topicShift.y;
      const groupX = baseX * (1 - this.explorationBlend) + exploreX * this.explorationBlend;
      const groupY = baseY * (1 - this.explorationBlend) + exploreY * this.explorationBlend;
      this.planetGroup.position.set(halfHeight * this.camera.aspect * groupX, halfHeight * groupY + drift * (1 - this.explorationBlend * 0.45), 0);

      // Preserve the arrival pose, but in exploration orient the real sphere from
      // geographic latitude/longitude. Composition is Rz * Rx * Ry so the chosen
      // surface normal points toward +Z while Venus north remains upright.
      this.arrivalEuler.set(0.09, arrivalYaw, VENUS_EXPLORATION_ROLL, "XYZ");
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

      // Inverse of Rz(roll) * Rx(pitch) * Ry(yaw): screen normal -> Venus local.
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
      const u = ((longitude + Math.PI) / VENUS_TAU + 1) % 1;
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
