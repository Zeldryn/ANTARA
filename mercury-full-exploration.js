"use strict";

(() => {
  const STATES = Object.freeze({
    HIDDEN: "hidden",
    SELECTING: "selecting",
    CONFIGURING: "configuring",
    LOADING: "loading",
    EXPLORING: "exploring",
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
      name: "Caloris Basin",
      short: "Caloris",
      category: "BASIN TUMBUKAN",
      latitude: 30.8,
      longitudeEast: 162.0,
      heading: 0,
      source: "https://science.nasa.gov/mercury/",
      coordinateSource: "https://planetarynames.wr.usgs.gov/Feature/967",
      image: "https://science.nasa.gov/wp-content/uploads/2023/04/pia19423-mercury-caloris-basin.jpg",
      descriptor: "Basin tumbukan raksasa dengan cincin pegunungan dan dataran vulkanik di bagian dalam.",
      description: "Caloris Basin adalah salah satu cekungan tumbukan terbesar di Tata Surya. Daerah ini membantu kita memahami tabrakan purba, rekahan antipodal, dan bagaimana lava kemudian mengisi bagian dalam basin.",
      facts: [
        "Diameter Caloris Basin sekitar 1.550 kilometer.",
        "Bagian dalam basin diisi dataran vulkanik yang lebih halus daripada daerah sekitarnya.",
        "Di sisi berlawanan planet terdapat wilayah kacau yang diduga terkait gelombang tumbukan Caloris."
      ],
      palette: { low: 0x4f4037, mid: 0x8b725d, high: 0xbfa17b, accent: 0xd9ba8f },
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
      category: "TEBING KERUT",
      latitude: 56.0,
      longitudeEast: 38.0,
      heading: 14,
      source: "https://science.nasa.gov/mercury/",
      coordinateSource: "https://planetarynames.wr.usgs.gov/Feature/1543",
      image: "https://www.nasa.gov/wp-content/uploads/2023/03/mercury-discovery-rupes.jpg",
      descriptor: "Tebing raksasa yang terbentuk ketika Merkurius mendingin dan menyusut.",
      description: "Discovery Rupes adalah scarp panjang yang menjadi bukti bahwa Merkurius pernah menyusut secara global. Saat interiornya mendingin, kerak terdorong, terlipat, lalu membentuk tebing panjang seperti kerutan pada kulit buah.",
      facts: [
        "Lobate scarp seperti Discovery Rupes adalah ciri khas penyusutan global Merkurius.",
        "Sebagian tebing di Merkurius dapat membentang ratusan kilometer.",
        "MESSENGER membantu memetakan scarp lebih rinci dibanding era Mariner 10."
      ],
      palette: { low: 0x40352f, mid: 0x766155, high: 0xa78d73, accent: 0xd3b28c },
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
      name: "Beethoven Basin",
      short: "Beethoven",
      category: "BASIN PURBA",
      latitude: -20.0,
      longitudeEast: 124.0,
      heading: -18,
      source: "https://science.nasa.gov/mercury/",
      coordinateSource: "https://planetarynames.wr.usgs.gov/Feature/670",
      image: "https://www.nasa.gov/wp-content/uploads/2023/03/mercury-beethoven-basin.jpg",
      descriptor: "Basin tua yang menunjukkan hubungan antara kawah besar, ejecta, dan dataran sekitarnya.",
      description: "Beethoven Basin adalah contoh basin tua yang dikelilingi jejak tumbukan dan relief berumur sangat lama. Di sini kamu bisa melihat bagaimana permukaan Merkurius menyimpan lapisan sejarah tabrakan berulang.",
      facts: [
        "Beethoven Basin berdiameter sekitar 630 kilometer.",
        "Wilayah ini menampilkan peralihan antara basin besar dan medan kawah tua.",
        "Basin purba membantu ilmuwan menelusuri sejarah awal pemboman di Tata Surya dalam."
      ],
      palette: { low: 0x3d322f, mid: 0x6e5d57, high: 0x9f8a7b, accent: 0xd1b695 },
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
      name: "Rembrandt Basin",
      short: "Rembrandt",
      category: "BASIN MULTI-CINCIN",
      latitude: -33.0,
      longitudeEast: 273.0,
      heading: 22,
      source: "https://science.nasa.gov/mercury/",
      coordinateSource: "https://planetarynames.wr.usgs.gov/Feature/12614",
      image: "https://www.nasa.gov/wp-content/uploads/2023/03/rembrandt-basin-mercury.jpg",
      descriptor: "Basin raksasa dengan cincin patahan dan dataran luas yang menarik untuk dibandingkan dengan Caloris.",
      description: "Rembrandt Basin menunjukkan bahwa basin besar di Merkurius tidak semuanya sama. Struktur cincin, medan retak, dan variasi reliefnya membantu membandingkan proses tumbukan besar pada lokasi berbeda.",
      facts: [
        "Rembrandt berdiameter sekitar 715 kilometer.",
        "Basin ini memiliki sistem cincin dan struktur tektonik di bagian dalamnya.",
        "MESSENGER menemukan detail Rembrandt yang jauh lebih lengkap setelah Mariner 10 tidak sempat memotretnya."
      ],
      palette: { low: 0x413430, mid: 0x7b665c, high: 0xad9485, accent: 0xe0c199 },
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
      latitude: 83.6,
      longitudeEast: 117.1,
      heading: -8,
      source: "https://science.nasa.gov/mercury/",
      coordinateSource: "https://planetarynames.wr.usgs.gov/Feature/12636",
      image: "https://www.nasa.gov/wp-content/uploads/2023/03/mercury-polar-ice.jpg",
      descriptor: "Wilayah kutub yang terkenal karena endapan cerah terkait es air di kawah permanen gelap.",
      description: "Daerah kutub utara Merkurius menyimpan salah satu kejutan terbesar planet ini: es air di tempat yang tidak pernah terkena cahaya Matahari langsung. Prokofiev sering digunakan sebagai contoh kawasan kutub yang sangat dingin itu.",
      facts: [
        "Radar dan data neutron menunjukkan keberadaan endapan es di kawah kutub Merkurius.",
        "Walau dekat Matahari, dasar kawah yang selalu gelap dapat tetap sangat dingin.",
        "Temuan es kutub menjadikan Merkurius jauh lebih kompleks daripada dugaan awal."
      ],
      palette: { low: 0x3c3534, mid: 0x69635e, high: 0xb6aa9b, accent: 0xe8ddcf },
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

  const clamp = (value, min, max) => Math.max(min, Math.min(max, value));
  const lerp = (a, b, t) => a + (b - a) * t;
  const smoothStep = value => {
    const v = clamp(value, 0, 1);
    return v * v * (3 - 2 * v);
  };
  const distance2D = (a, b) => Math.hypot((a.x || 0) - (b.x || 0), (a.z || 0) - (b.z || 0));
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
      this.qualityOptions = Array.from(document.querySelectorAll("#mercury-quality-options .venus-quality-option"));
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
      this.quality = copyQualityProfile(localStorage.getItem(QUALITY_STORAGE_KEY));
      this.qualityDeviceNote.textContent = this.deviceRecommendation();
      this.pointerLocked = false;
      this.dragging = false;
      this.look = { yaw: 0, pitch: -0.18 };
      this.movement = { forward: 0, backward: 0, left: 0, right: 0, up: 0, down: 0, fast: 0 };
      this.player = { x: 0, y: 11, z: 52, vx: 0, vz: 0 };
      this.clock = 0;
      this.frame = null;
      this.previous = 0;
      this.objectivesCollapsed = false;
      this.infoMinimized = false;
      this.regionCards = [];
      this.objectiveItems = [];
      this.progressAnim = 0;

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

    deviceRecommendation() {
      const memory = navigator.deviceMemory || 4;
      if (window.innerWidth <= 768 || memory <= 4) return "Rekomendasi: RENDAH atau SEDANG untuk HP dan laptop ringan.";
      if (memory >= 8) return "Rekomendasi: SEDANG atau TINGGI untuk perangkat yang lebih kuat.";
      return "Rekomendasi: SEDANG untuk keseimbangan visual dan performa.";
    }

    bindEvents() {
      this.entryButton?.addEventListener("click", () => this.openEntryFlow());
      this.regionClose?.addEventListener("click", () => {
        if (this.state === STATES.EXPLORING) this.hideSelector();
        else this.exit();
      });
      this.qualityClose?.addEventListener("click", () => this.showSelector());
      this.qualityOptions.forEach(button => {
        button.addEventListener("click", () => this.setQuality(button.dataset.mercuryQuality || "MEDIUM"));
      });
      this.qualityStart?.addEventListener("click", () => this.startSelectedRegion());
      this.errorReturn?.addEventListener("click", () => this.showSelector());
      this.locationToggle?.addEventListener("click", () => {
        if (this.regionSelector.hidden) this.showSelector(true);
        else this.hideSelector();
      });
      this.exitButton?.addEventListener("click", () => this.exit());
      this.actionsMenuToggle?.addEventListener("click", () => {
        const expanded = this.actionsMenuToggle.getAttribute("aria-expanded") === "true";
        this.actionsMenuToggle.setAttribute("aria-expanded", String(!expanded));
      });
      this.fullscreenToggle?.addEventListener("click", () => this.toggleFullscreen());
      this.objectivesCollapse?.addEventListener("click", () => this.setObjectivesCollapsed(true));
      this.objectivesToggle?.addEventListener("click", () => this.setObjectivesCollapsed(false));
      this.landmarkMinimize?.addEventListener("click", () => this.setInfoMinimized(true));
      this.infoToggle?.addEventListener("click", () => this.setInfoMinimized(false));
      this.tutorialClose?.addEventListener("click", () => this.tutorial.hidden = true);
      this.mobileControls.forEach(button => {
        const control = button.dataset.mercuryControl;
        const start = event => { event.preventDefault(); this.setControl(control, true); };
        const end = event => { event.preventDefault(); this.setControl(control, false); };
        button.addEventListener("pointerdown", start);
        button.addEventListener("pointerup", end);
        button.addEventListener("pointerleave", end);
        button.addEventListener("pointercancel", end);
      });
      this.viewport?.addEventListener("click", () => {
        if (!this.active || this.state !== STATES.EXPLORING) return;
        if (document.pointerLockElement !== this.viewport) this.viewport.requestPointerLock?.();
      });
      document.addEventListener("pointerlockchange", this.onPointerLockChange);
      document.addEventListener("mousemove", this.onMouseMove);
      window.addEventListener("keydown", this.onKeyDown);
      window.addEventListener("keyup", this.onKeyUp);
      window.addEventListener("resize", this.onResize);
    }

    populateRegionGrid() {
      this.regionGrid.replaceChildren();
      this.regionCards = REGIONS.map(region => {
        const button = document.createElement("button");
        button.type = "button";
        button.className = "venus-region-card";
        button.innerHTML = `<small>${region.category}</small><strong>${region.name}</strong><span>${Math.abs(region.latitude).toFixed(1)}°${region.latitude >= 0 ? "N" : "S"} · ${region.longitudeEast.toFixed(1)}°E</span><p>${region.descriptor}</p><em>NASA / USGS / MESSENGER</em>`;
        button.addEventListener("click", () => {
          this.selectRegion(region);
          if (this.state === STATES.EXPLORING) this.startSelectedRegion({ switchOnly: true });
          else this.showQuality();
        });
        this.regionGrid.appendChild(button);
        return { region, button };
      });
      this.refreshRegionCards();
    }

    buildObjectives() {
      this.objectivesList.replaceChildren();
      this.objectiveItems = REGIONS.map((region, index) => {
        const item = document.createElement("li");
        item.innerHTML = `<span class="venus-objective-marker">${String(index + 1).padStart(2, "0")}</span><div><strong>${region.name}</strong><small>${region.category} · ${region.descriptor}</small></div>`;
        this.objectivesList.appendChild(item);
        return { region, item, marker: item.querySelector(".venus-objective-marker") };
      });
      this.updateObjectives();
    }

    setControl(control, pressed) {
      if (control === "forward") this.movement.forward = pressed ? 1 : 0;
      if (control === "backward") this.movement.backward = pressed ? 1 : 0;
      if (control === "left") this.movement.left = pressed ? 1 : 0;
      if (control === "right") this.movement.right = pressed ? 1 : 0;
      if (control === "up") this.movement.up = pressed ? 1 : 0;
      if (control === "down") this.movement.down = pressed ? 1 : 0;
    }

    setQuality(name, { persist = true } = {}) {
      this.quality = copyQualityProfile(name);
      this.qualityOptions.forEach(button => {
        const active = button.dataset.mercuryQuality === this.quality.name;
        button.classList.toggle("is-selected", active);
        button.setAttribute("aria-checked", String(active));
      });
      this.qualitySelectedLabel.textContent = this.quality.label;
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

    openEntryFlow() {
      if (!this.mercury?.startFullExplorationTransition?.(this.selectedRegion)) return;
      this.active = true;
      this.root.hidden = false;
      this.root.setAttribute("aria-hidden", "false");
      this.root.classList.add("is-setup-open");
      this.state = STATES.SELECTING;
      this.showSelector();
      this.hideQuality();
      this.hideLoading();
      this.hideError();
      this.setUiVisible(false);
      this.boundaryHint.textContent = "";
      this.tutorial.hidden = false;
      this.objectivesCollapsed = false;
      this.infoMinimized = false;
      this.setObjectivesCollapsed(false, true);
      this.setInfoMinimized(false, true);
      this.selectRegion(this.selectedRegion || REGIONS[0]);
    }

    showSelector(compact = false) {
      this.state = this.state === STATES.EXPLORING ? STATES.EXPLORING : STATES.SELECTING;
      this.regionSelector.hidden = false;
      this.root.classList.add("is-setup-open");
      this.hideQuality();
      this.regionClose.setAttribute("aria-label", this.state === STATES.EXPLORING ? "Tutup pemilih destinasi Merkurius" : "Tutup Eksplorasi Merkurius");
      if (compact) this.regionSelector.scrollIntoView({ block: "nearest" });
    }

    hideSelector() {
      this.regionSelector.hidden = true;
      if (this.qualityPanel.hidden) this.root.classList.remove("is-setup-open");
    }

    showQuality() {
      this.state = STATES.CONFIGURING;
      this.qualityPanel.hidden = false;
      this.regionSelector.hidden = true;
      this.root.classList.add("is-setup-open");
    }

    hideQuality() {
      this.qualityPanel.hidden = true;
    }

    setUiVisible(visible) {
      [this.hud, this.objectivesPanel, this.objectivesToggle, this.landmarkCard, this.infoToggle, this.actionsMenu.parentElement, this.tutorial, ...this.root.querySelectorAll("[data-mercury-ui].mars-mobile-controls")].forEach(element => {
        if (!element) return;
        if (visible) element.hidden = false;
        else element.hidden = true;
      });
      if (!visible) {
        this.boundaryHint.textContent = "";
      }
    }

    showLoading(message = "MENYIAPKAN DESTINASI", progress = 18) {
      this.loadingCard.hidden = false;
      this.loadingStatus.textContent = message;
      this.loadingProgress.style.width = `${clamp(progress, 0, 100)}%`;
    }

    hideLoading() { this.loadingCard.hidden = true; }
    hideError() { this.errorCard.hidden = true; }
    showError(message) {
      this.state = STATES.ERROR;
      this.errorCard.hidden = false;
      this.errorMessage.textContent = message || "Eksplorasi Merkurius belum dapat dimuat.";
      this.hideLoading();
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
      this.scene.background = new THREE.Color(0x05080c);
      this.scene.fog = new THREE.FogExp2(0x0a090a, 0.011);
      this.camera = new THREE.PerspectiveCamera(68, 1, 0.1, 600);
      this.renderer = new THREE.WebGLRenderer({ antialias: true, alpha: false, powerPreference: "high-performance" });
      this.renderer.outputColorSpace = THREE.SRGBColorSpace;
      this.renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, this.quality.maxDpr));
      this.viewport.replaceChildren(this.renderer.domElement);

      const ambient = new THREE.HemisphereLight(0xd8c3a4, 0x1a1412, 1.22);
      const sun = new THREE.DirectionalLight(0xffe4b7, 1.55);
      sun.position.set(28, 44, 14);
      const rim = new THREE.DirectionalLight(0x9a8470, 0.38);
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
        const color = low.clone().lerp(mid, smoothStep(t * 1.1)).lerp(high, Math.pow(t, 1.8));
        const warm = clamp(Math.sin((position.getX(i) + position.getZ(i)) * 0.02) * 0.06 + 0.07, 0, 0.12);
        color.offsetHSL(0.008, 0.01, warm - 0.04);
        colors.push(color.r, color.g, color.b);
      }
      geometry.setAttribute("color", new THREE.Float32BufferAttribute(colors, 3));
      const material = new THREE.MeshStandardMaterial({ vertexColors: true, roughness: 0.96, metalness: 0.04, flatShading: false });
      const mesh = new THREE.Mesh(geometry, material);
      mesh.receiveShadow = false;
      group.add(mesh);

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
        continuationColors.push(color.r * 0.9, color.g * 0.88, color.b * 0.86);
      }
      continuationGeometry.setAttribute("color", new THREE.Float32BufferAttribute(continuationColors, 3));
      continuationGeometry.computeVertexNormals();
      const continuationMesh = new THREE.Mesh(continuationGeometry, new THREE.MeshStandardMaterial({ vertexColors: true, roughness: 0.98, metalness: 0.0 }));
      continuationMesh.position.y = -1.4;
      group.add(continuationMesh);

      const skyRing = new THREE.Mesh(
        new THREE.CylinderGeometry(this.quality.worldRadius * 1.9, this.quality.worldRadius * 2.4, 42, 48, 1, true),
        new THREE.MeshBasicMaterial({ color: 0x15100f, transparent: true, opacity: 0.52, side: THREE.BackSide })
      );
      skyRing.position.y = 10;
      group.add(skyRing);

      return { group, mesh, geometry, material };
    }

    heightAtLocal(x, z, region, detailed = true) {
      const style = region.terrain;
      let height = Math.sin((x + style.seed * 4) * 0.045) * 1.6 + Math.cos((z - style.seed * 3) * 0.042) * 1.2;
      height += Math.sin((x + z) * 0.06) * 0.65 + Math.cos((x - z) * 0.05) * 0.45;
      if (detailed) {
        height += Math.sin((x * 0.18) + style.seed) * 0.26;
        height += Math.cos((z * 0.16) - style.seed * 0.7) * 0.22;
      }
      for (const crater of style.craters || []) {
        const d = Math.hypot(x - crater.x, z - crater.z);
        const t = clamp(d / crater.r, 0, 1.6);
        const bowl = -crater.depth * Math.exp(-Math.pow(t * 2.1, 2));
        const rim = crater.depth * 0.42 * Math.exp(-Math.pow((t - 1.02) * 6.5, 2));
        height += bowl + rim;
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
        height += side * band * scarp.height * 0.55;
      }
      return height;
    }

    applyRegion(region) {
      this.showLoading("MEMBENTUK MEDAN MERKURIUS", 58);
      while (this.terrainGroup.children.length) {
        const child = this.terrainGroup.children.pop();
        child.traverse?.(node => {
          node.geometry?.dispose?.();
          node.material?.dispose?.();
        });
        this.scene.remove(child);
      }
      const terrain = this.buildTerrain(region);
      this.terrainGroup.add(terrain.group);
      this.terrain = terrain;
      this.currentRegion = region;
      this.look.yaw = (region.heading || 0) * Math.PI / 180;
      this.look.pitch = -0.19;
      this.player.x = 0;
      this.player.z = this.quality.worldRadius * 0.7;
      this.player.y = this.heightAtLocal(this.player.x, this.player.z, region, true) + 8.5;
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
      this.objectivesIntro.textContent = `Lima misi Merkurius memakai sumber ilmiah yang jelas. Lokasi aktif saat ini adalah ${region.name}, tetapi kamu bisa berpindah ke empat destinasi lain dari menu Wilayah.`;
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
      const total = REGIONS.length;
      const done = this.visited.size;
      this.discoveryCount.textContent = `${done} / ${total}`;
      this.discoveryBar.style.width = `${(done / total) * 100}%`;
      this.objectivesToggle.textContent = `Tujuan · ${done} / ${total}`;
      let next = null;
      this.objectiveItems.forEach(({ region, item }) => {
        const complete = this.visited.has(region.id);
        const current = this.currentRegion?.id === region.id;
        item.classList.toggle("is-complete", complete);
        item.classList.toggle("is-current", current);
        if (!complete && !next) next = region;
      });
      if (next) {
        this.nextTarget.hidden = false;
        this.nextTargetName.textContent = next.name;
        this.nextTargetDistance.textContent = "Pilih lewat menu Wilayah";
      } else {
        this.nextTarget.hidden = false;
        this.nextTargetName.textContent = "Semua misi selesai";
        this.nextTargetDistance.textContent = "Kamu sudah membuka 5 destinasi Merkurius.";
      }
    }

    setObjectivesCollapsed(collapsed, force = false) {
      this.objectivesCollapsed = collapsed;
      this.objectivesPanel.hidden = collapsed;
      this.objectivesToggle.hidden = !collapsed;
      if (!force) document.getElementById("announcement").textContent = collapsed ? "Panel tujuan diminimalkan." : "Panel tujuan dibuka kembali.";
    }

    setInfoMinimized(minimized, force = false) {
      this.infoMinimized = minimized;
      this.landmarkCard.hidden = minimized;
      this.infoToggle.hidden = !minimized;
      if (!force) document.getElementById("announcement").textContent = minimized ? "Info lokasi disembunyikan." : "Info lokasi ditampilkan kembali.";
    }

    async startSelectedRegion({ switchOnly = false } = {}) {
      if (!this.selectedRegion) return;
      this.state = STATES.LOADING;
      this.hideError();
      this.hideSelector();
      this.hideQuality();
      this.root.classList.remove("is-setup-open");
      this.showLoading(switchOnly ? "BERPINDAH WILAYAH" : "MENYIAPKAN EKSPLORASI", switchOnly ? 32 : 18);
      try {
        await this.ensureReady();
        this.showLoading("MERENDER MEDAN ILMIAH", 74);
        this.applyRegion(this.selectedRegion);
        this.showLoading("MENGATUR NAVIGASI", 92);
        if (switchOnly) this.boundaryHint.textContent = `Berpindah ke ${this.selectedRegion.name}.`;
        this.state = STATES.EXPLORING;
        this.active = true;
        this.setUiVisible(true);
        this.hideLoading();
        this.tutorial.hidden = false;
        this.root.hidden = false;
        this.root.setAttribute("aria-hidden", "false");
        this.mercury.beginFullExploration?.(this.selectedRegion);
        this.actionsMenuToggle.setAttribute("aria-expanded", "false");
        this.setObjectivesCollapsed(this.objectivesCollapsed, true);
        this.setInfoMinimized(this.infoMinimized, true);
        this.startLoop();
        document.getElementById("announcement").textContent = `Eksplorasi penuh Merkurius dimulai di ${this.selectedRegion.name}.`;
      } catch (error) {
        console.error(error);
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
      const speed = this.quality.speed * (this.movement.fast ? 1.65 : 1);
      const forward = this.movement.forward - this.movement.backward;
      const strafe = this.movement.right - this.movement.left;
      const vertical = this.movement.up - this.movement.down;
      const sin = Math.sin(this.look.yaw);
      const cos = Math.cos(this.look.yaw);
      this.player.x += (sin * forward + cos * strafe) * speed * delta;
      this.player.z += (cos * forward - sin * strafe) * speed * delta;
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
      const clearance = 2.6;
      const targetY = ground + clearance + 4.2 + vertical * speed * 0.24;
      this.player.y = Math.max(ground + clearance, this.player.y + (targetY - this.player.y) * Math.min(1, delta * 4));
      this.updateCamera();
      this.updateHud(delta, speed);
      this.renderer.render(this.scene, this.camera);
    }

    updateCamera() {
      const pitch = clamp(this.look.pitch, -1.1, 0.28);
      const radius = 14;
      const offsetX = Math.sin(this.look.yaw) * Math.cos(pitch) * radius;
      const offsetZ = Math.cos(this.look.yaw) * Math.cos(pitch) * radius;
      const offsetY = Math.sin(-pitch) * radius * 0.72 + 4.6;
      this.camera.position.set(this.player.x - offsetX, this.player.y + offsetY, this.player.z - offsetZ);
      this.camera.lookAt(this.player.x + Math.sin(this.look.yaw) * 18, this.player.y + 1.2 + Math.sin(-pitch) * 5, this.player.z + Math.cos(this.look.yaw) * 18);
    }

    updateHud(delta, speed) {
      const altitude = this.player.y - this.heightAtLocal(this.player.x, this.player.z, this.currentRegion, true);
      const distance = Math.hypot(this.player.x, this.player.z);
      const regionCenterDistance = distance2D({ x: this.player.x, z: this.player.z }, { x: 0, z: 0 });
      this.hudAltitude.textContent = `${altitude.toFixed(1)} M`;
      const moveMagnitude = Math.hypot(this.movement.forward - this.movement.backward, this.movement.right - this.movement.left, this.movement.up - this.movement.down);
      this.hudSpeed.textContent = `${(moveMagnitude * speed).toFixed(0)} M/S`;
      this.hudDistance.textContent = `${regionCenterDistance.toFixed(0)} M`;
    }

    onPointerLockChange() {
      this.pointerLocked = document.pointerLockElement === this.viewport;
    }

    onMouseMove(event) {
      if (!this.active || !this.pointerLocked || this.state !== STATES.EXPLORING) return;
      this.look.yaw -= event.movementX * 0.0025;
      this.look.pitch = clamp(this.look.pitch - event.movementY * 0.0018, -1.05, 0.24);
    }

    onKeyDown(event) {
      if (!this.active) return;
      if (event.key === "w" || event.key === "W") this.movement.forward = 1;
      if (event.key === "s" || event.key === "S") this.movement.backward = 1;
      if (event.key === "a" || event.key === "A") this.movement.left = 1;
      if (event.key === "d" || event.key === "D") this.movement.right = 1;
      if (event.key === "q" || event.key === "Q") this.movement.down = 1;
      if (event.key === "e" || event.key === "E") this.movement.up = 1;
      if (event.key === "Shift") this.movement.fast = 1;
      if (event.key === "Escape") {
        event.preventDefault();
        if (this.regionSelector && !this.regionSelector.hidden) this.hideSelector();
        else if (this.qualityPanel && !this.qualityPanel.hidden) this.showSelector();
        else if (!this.objectivesCollapsed) this.setObjectivesCollapsed(true);
        else this.exit();
      }
    }

    onKeyUp(event) {
      if (event.key === "w" || event.key === "W") this.movement.forward = 0;
      if (event.key === "s" || event.key === "S") this.movement.backward = 0;
      if (event.key === "a" || event.key === "A") this.movement.left = 0;
      if (event.key === "d" || event.key === "D") this.movement.right = 0;
      if (event.key === "q" || event.key === "Q") this.movement.down = 0;
      if (event.key === "e" || event.key === "E") this.movement.up = 0;
      if (event.key === "Shift") this.movement.fast = 0;
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

    exit(silent = false) {
      if (!this.active && !this.root.hidden) {
        this.root.hidden = true;
        this.root.setAttribute("aria-hidden", "true");
      }
      this.active = false;
      this.state = STATES.HIDDEN;
      cancelAnimationFrame(this.frame);
      this.frame = null;
      this.movement.forward = this.movement.backward = this.movement.left = this.movement.right = this.movement.up = this.movement.down = this.movement.fast = 0;
      if (document.pointerLockElement === this.viewport) document.exitPointerLock?.();
      this.root.hidden = true;
      this.root.setAttribute("aria-hidden", "true");
      this.hideSelector();
      this.hideQuality();
      this.hideLoading();
      this.hideError();
      this.setUiVisible(false);
      this.mercury.endFullExploration?.();
      if (!silent) document.getElementById("announcement").textContent = "Keluar dari Eksplorasi Penuh Merkurius.";
      this.entryButton?.focus({ preventScroll: true });
    }

    onMercuryStop() {
      this.exit(true);
    }
  }

  window.MercuryFullExploration = MercuryFullExploration;
})();
