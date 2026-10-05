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

const MARS_EXPLORATION_STOPS = Object.freeze([
  {
    title: "Olympus Mons",
    kicker: "GUNUNG API RAKSASA",
    subtitle: "Gunung api terbesar yang dikenal di Tata Surya",
    summary: "Olympus Mons adalah gunung api perisai raksasa yang mendominasi wilayah vulkanik Mars. Ukurannya menunjukkan betapa lama aktivitas vulkanik dapat membangun bentang alam di Planet Merah.",
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
    title: "Valles Marineris",
    kicker: "NGARAI PLANET",
    subtitle: "Sistem ngarai terbesar di Tata Surya",
    summary: "Valles Marineris membelah wilayah dekat ekuator Mars. Sistem ngarai ini kemungkinan berawal dari retakan besar pada kerak Mars, lalu diperlebar oleh proses geologi dan erosi.",
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
    title: "Kawah Jezero",
    kicker: "JEJAK AIR PURBA",
    subtitle: "Laboratorium alam bagi Perseverance",
    summary: "Jezero dipilih karena bukti menunjukkan kawah ini pernah menampung danau serta delta sungai purba. Daerah seperti ini dapat menyimpan petunjuk tentang kondisi Mars miliaran tahun lalu.",
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
    title: "Tudung Es Kutub",
    kicker: "ES YANG BERUBAH MUSIM",
    subtitle: "Air beku dan karbon dioksida beku",
    summary: "Kutub Mars berubah mengikuti musim. Lapisan es karbon dioksida tumbuh saat musim dingin dan menyusut ketika wilayah kutub kembali menerima lebih banyak sinar Matahari.",
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
    title: "Atmosfer Mars",
    kicker: "UDARA YANG SANGAT TIPIS",
    subtitle: "Didominasi karbon dioksida",
    summary: "Mars memiliki atmosfer yang jauh lebih tipis daripada Bumi. Udara tipis ini sulit menahan panas, sementara debu halus yang tersuspensi membuat langit Mars tampak berkabut kemerahan.",
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
    title: "Badai Debu & Musim",
    kicker: "CUACA PLANET MERAH",
    subtitle: "Debu dapat menyelimuti hampir seluruh planet",
    summary: "Mars memiliki empat musim seperti Bumi, tetapi tahun Mars jauh lebih panjang. Perubahan musim membantu menggerakkan atmosfer tipisnya dan dapat memicu badai debu raksasa.",
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
    this.topicSummary = document.getElementById("mars-topic-summary");
    this.topicFacts = document.getElementById("mars-topic-facts");
    this.topicSource = document.getElementById("mars-topic-source");
    this.topicCurrent = document.getElementById("mars-topic-current");
    this.topicTotal = document.getElementById("mars-topic-total");
    this.topicProgress = document.getElementById("mars-topic-progress");
    this.topicPrev = document.getElementById("mars-topic-prev");
    this.topicNext = document.getElementById("mars-topic-next");
    this.focusReticle = document.getElementById("mars-focus-reticle");
    this.focusLabel = document.getElementById("mars-focus-label");
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
    this.markerLocalPoint = marsSurfacePoint(MARS_EXPLORATION_STOPS[0].location);
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
    this.topicIndex = nextIndex;
    const orientation = marsLocationOrientation(stop.location);
    this.topicYawTarget = immediate ? orientation.yaw : unwrapMarsAngleNear(orientation.yaw, this.topicYaw);
    this.topicPitchTarget = orientation.pitch;
    this.topicRollTarget = orientation.roll;
    this.topicShiftTarget = { ...stop.shift };
    this.markerLocalPoint = marsSurfacePoint(stop.location);
    if (this.markerAnchor) this.markerAnchor.position.set(this.markerLocalPoint.x, this.markerLocalPoint.y, this.markerLocalPoint.z);
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
    this.topicSource.href = stop.source;
    this.topicCurrent.textContent = String(nextIndex + 1).padStart(2, "0");
    this.topicPrev.disabled = nextIndex === 0;
    this.topicNext.disabled = nextIndex === MARS_EXPLORATION_STOPS.length - 1;
    Array.from(this.topicProgress.children).forEach((bar, i) => bar.classList.toggle("is-active", i === nextIndex));
    this.focusLabel.textContent = stop.location.label;
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
    // Start from the arrival pose, then converge on the selected geographic target.
    this.topicYaw = this.renderedRotation;
    this.topicPitch = 0.09;
    this.topicRoll = MARS_EXPLORATION_ROLL;
    const orientation = marsLocationOrientation(MARS_EXPLORATION_STOPS[this.topicIndex].location);
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

  start() {
    this.active = true;
    this.time = 0;
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

  setReticleProjection(x, y, visible) {
    if (!this.focusReticle) return;
    this.focusReticle.style.left = `${x}px`;
    this.focusReticle.style.top = `${y}px`;
    this.focusReticle.style.setProperty("--marker-opacity", visible ? ".92" : "0");
  }

  updateMarkerProjectionWebGL() {
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
    const exploreZoom = 1 - this.explorationBlend * (this.mobile ? 0.13 : 0.24);
    this.distance = arrivalDistance * exploreZoom;
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
      document.getElementById("announcement").textContent = "Tujuan pertama: Mars.";
      // Never steal focus from someone using mute during the approach.
      if (document.activeElement === document.body || document.activeElement.id === "launch-button") document.getElementById("mars-title").focus({ preventScroll: true });
    }
    const drift = this.motion.matches ? 0 : Math.sin(t * 0.24) * 0.018;
    if (this.mode === "webgl") {
      const halfHeight = Math.tan(Math.PI / 10) * this.finalDistance;
      const baseX = this.mobile ? 0 : 0.28;
      const exploreX = this.mobile ? this.topicShift.x * 0.7 : 0.39 + this.topicShift.x;
      const baseY = this.mobile ? 0.28 : 0.1;
      const exploreY = this.mobile ? 0.20 + this.topicShift.y : 0.075 + this.topicShift.y;
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
      const cssLeft = this.mobile ? 50 + this.explorationBlend * this.topicShift.x * 60 : 64 + this.explorationBlend * (5 + this.topicShift.x * 45);
      const cssTop = this.mobile ? 36 - this.explorationBlend * (8 - this.topicShift.y * 35) : 45 - this.explorationBlend * (2 - this.topicShift.y * 35);
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
    const exploreX = this.mobile ? this.topicShift.x * 0.12 : 0.19 + this.topicShift.x * 0.42;
    const cx = w * (0.5 + arrivalX * (1 - this.explorationBlend) + exploreX * this.explorationBlend);
    const arrivalY = this.mobile ? 0.14 : 0.05;
    const exploreY = this.mobile ? 0.21 - this.topicShift.y * 0.3 : 0.065 - this.topicShift.y * 0.3;
    const cy = h * (0.5 - arrivalY * (1 - this.explorationBlend) - exploreY * this.explorationBlend) - drift * 50 * (1 - this.explorationBlend * 0.45);
    ctx.drawImage(this.sphereCanvas, cx - radius, cy - radius, radius * 2, radius * 2);
    this.updateMarkerProjectionFallback(yaw, pitch, roll, cx, cy, radius);
  }
};
