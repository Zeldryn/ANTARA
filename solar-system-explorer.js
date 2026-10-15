(() => {
  const BODY_DATA = Object.freeze([
    {
      key: 'sun',
      name: 'Matahari',
      short: 'Bintang pusat',
      kind: 'star',
      texture: null,
      radius: 3.6,
      semiMajorAu: 0,
      eccentricity: 0,
      orbitalPeriodDays: Infinity,
      rotationHours: '25–35 hari',
      distanceLabel: '0 AU',
      orbitLabel: '—',
      note: 'Matahari menyimpan ~99,8% isi Tata Surya dan menjadi sumber energi bagi seluruh planet.',
      lead: 'Bintang pusat Tata Surya. Semua jalur mengelilingi planet di bawah ini mengitari Matahari dengan periode nyata yang diperkecil supaya tetap mudah diamati.'
    },
    {
      key: 'mercury',
      name: 'Merkurius',
      short: 'Planet batuan terdalam',
      kind: 'planet',
      texture: null,
      radius: 0.72,
      semiMajorAu: 0.387,
      eccentricity: 0.206,
      orbitalPeriodDays: 88,
      rotationHours: '58,6 hari',
      distanceLabel: '0,39 AU',
      orbitLabel: '88 hari',
      note: 'Jalurnya paling lonjong di antara planet utama dan berada paling dekat ke Matahari.',
      lead: 'Merkurius bergerak paling cepat dalam tampilan 3D karena periode revolusinya paling singkat.'
    },
    {
      key: 'venus',
      name: 'Venus',
      short: 'Planet rumah kaca',
      kind: 'planet',
      texture: null,
      radius: 0.88,
      semiMajorAu: 0.723,
      eccentricity: 0.007,
      orbitalPeriodDays: 224.7,
      rotationHours: '243 hari (berlawanan arah)',
      distanceLabel: '0,72 AU',
      orbitLabel: '224,7 hari',
      note: 'Venus berputar berlawanan arah dan udaranya sangat tebal. Tapi di mode ini ia tetap mengikuti jalur mengelilingi heliosentrisnya.',
      lead: 'Jalur mengelilingi Venus hampir melingkar. Jadi jalurnya tampak lebih cukup tetap dibanding Merkurius.'
    },
    {
      key: 'earth',
      name: 'Bumi',
      short: 'Rumah kita',
      kind: 'planet',
      texture: 'assets/textures/mobile/earth-1024.webp',
      radius: 0.92,
      semiMajorAu: 1,
      eccentricity: 0.017,
      orbitalPeriodDays: 365.25,
      rotationHours: '23,9 jam',
      distanceLabel: '1 AU',
      orbitLabel: '365,25 hari',
      note: 'Bumi dijadikan acuan utama: 1 AU dan 1 tahun Bumi dipakai sebagai baseline skala jalur mengelilingi.',
      lead: 'Klik Bumi kapan saja untuk langsung kembali ke panorama Bumi di ANTARA.'
    },
    {
      key: 'mars',
      name: 'Mars',
      short: 'Planet merah',
      kind: 'planet',
      texture: 'assets/textures/mobile/mars-1024.webp',
      radius: 0.78,
      semiMajorAu: 1.524,
      eccentricity: 0.093,
      orbitalPeriodDays: 687,
      rotationHours: '24,6 jam',
      distanceLabel: '1,52 AU',
      orbitLabel: '687 hari',
      note: 'Jarak Mars yang lebih jauh membuat revolusinya lebih lambat daripada Bumi.',
      lead: 'Mars tetap bergerak terus dalam jalurnya. perbandingan lajunya dengan Bumi langsung terlihat di sini.'
    },
    {
      key: 'asteroid',
      name: 'Sabuk Asteroid',
      short: 'Ceres · Vesta · sabuk utama',
      kind: 'asteroid',
      radius: 0.24,
      semiMajorAu: 2.77,
      eccentricity: 0.08,
      orbitalPeriodDays: 1681,
      rotationHours: 'Bervariasi',
      distanceLabel: '2,1–3,3 AU',
      orbitLabel: '≈ 4,6 tahun',
      note: 'Sabuk asteroid utama berada di antara Mars dan Jupiter. Di sini divisualisasikan sebagai koridor jalur mengelilingi edukatif.',
      lead: 'Klik label Sabuk Asteroid untuk kembali ke panorama sabuk asteroid ANTARA.'
    },
    {
      key: 'jupiter',
      name: 'Jupiter',
      short: 'Raksasa gas terbesar',
      kind: 'planet',
      texture: 'assets/textures/mobile/jupiter-1024.webp',
      radius: 1.72,
      semiMajorAu: 5.203,
      eccentricity: 0.049,
      orbitalPeriodDays: 4331,
      rotationHours: '9,9 jam',
      distanceLabel: '5,20 AU',
      orbitLabel: '11,86 tahun',
      note: 'Jupiter membutuhkan hampir 12 tahun Bumi untuk menyelesaikan satu perjalanan mengelilingi Matahari.',
      lead: 'Di jarak ini, perbedaan kecepatan jalur mengelilingi planet luar mulai terasa jauh lebih lambat.'
    },
    {
      key: 'saturn',
      name: 'Saturnus',
      short: 'Raksasa bercincin',
      kind: 'planet',
      texture: 'assets/textures/mobile/saturn-1024.webp',
      radius: 1.52,
      semiMajorAu: 9.537,
      eccentricity: 0.057,
      orbitalPeriodDays: 10747,
      rotationHours: '10,7 jam',
      distanceLabel: '9,54 AU',
      orbitLabel: '29,46 tahun',
      note: 'Cincin Saturnus di mode ini divisualisasikan penuh supaya tetap jelas walau skala sistem diperkecil.',
      lead: 'Saturnus memakai cincin 3D tipis agar tetap terasa khas meski seluruh Tata Surya diringkas ke satu panggung.'
    },
    {
      key: 'uranus',
      name: 'Uranus',
      short: 'Raksasa es miring',
      kind: 'planet',
      texture: 'assets/textures/mobile/uranus-1024.webp',
      radius: 1.12,
      semiMajorAu: 19.191,
      eccentricity: 0.046,
      orbitalPeriodDays: 30589,
      rotationHours: '17,2 jam (berlawanan arah)',
      distanceLabel: '19,19 AU',
      orbitLabel: '84,0 tahun',
      note: 'Uranus butuh sekitar 84 tahun Bumi untuk satu putaran mengitari Matahari.',
      lead: 'Uranus jauh lebih lambat dan lebih jauh. pola jalur mengelilingi planet luar terlihat jelas dibanding planet dalam.'
    },
    {
      key: 'neptune',
      name: 'Neptunus',
      short: 'Raksasa es terluar',
      kind: 'planet',
      texture: 'assets/textures/mobile/neptune-1024.webp',
      radius: 1.08,
      semiMajorAu: 30.07,
      eccentricity: 0.009,
      orbitalPeriodDays: 59800,
      rotationHours: '16,1 jam',
      distanceLabel: '30,07 AU',
      orbitLabel: '164,8 tahun',
      note: 'Neptunus adalah planet utama terjauh. satu revolusinya setara ~164,8 tahun Bumi.',
      lead: 'Dalam tampilan 3D ini Neptunus tetap terus bergerak. Tapi paling lambat di antara semua planet utama.'
    }
  ]);

  const PLANET_KEYS = new Set(BODY_DATA.map(item => item.key));

  class SolarSystemExplorer {
    constructor(options = {}) {
      this.options = options;
      this.root = document.getElementById(options.rootId || 'solar-system-observer');
      this.canvas = document.getElementById(options.canvasId || 'solar-system-canvas');
      this.labelLayer = document.getElementById(options.labelLayerId || 'solar-system-label-layer');
      this.hoverCard = null;
      this.hoveredKey = null;
      this.backButton = document.getElementById(options.backButtonId || 'solar-system-back');
      this.clockValue = document.getElementById(options.clockValueId || 'solar-system-clock-value');
      this.speedNote = document.getElementById('solar-system-speed-note');
      this.speedInput = document.getElementById('solar-system-speed-input');
      this.speedDown = document.getElementById('solar-system-speed-down');
      this.speedUp = document.getElementById('solar-system-speed-up');
      this.speedPause = document.getElementById('solar-system-speed-pause');
      this.detailKicker = document.getElementById(options.detailKickerId || 'solar-system-detail-kicker');
      this.detailName = document.getElementById(options.detailNameId || 'solar-system-detail-name');
      this.detailLead = document.getElementById(options.detailLeadId || 'solar-system-detail-lead');
      this.detailDistance = document.getElementById(options.detailDistanceId || 'solar-system-detail-distance');
      this.detailOrbit = document.getElementById(options.detailOrbitId || 'solar-system-detail-orbit');
      this.detailDay = document.getElementById(options.detailDayId || 'solar-system-detail-day');
      this.detailNote = document.getElementById(options.detailNoteId || 'solar-system-detail-note');
      this.instructions = document.getElementById(options.instructionsId || 'solar-system-instructions');
      this.mobileDetailClose = document.getElementById('solar-system-mobile-detail-close');
      this.mobileEnter = document.getElementById('solar-system-mobile-enter');
      this.mobileSelectedKey = null;

      this.isReady = false;
      this.isOpen = false;
      this.sourcePhase = null;
      this.currentHighlightedKey = null;
      this.THREE = null;
      this.renderer = null;
      this.scene = null;
      this.camera = null;
      this.clock = null;
      this.simDays = 0;
      this.simDaysPerSecond = this.readSavedSpeed();
      this.lastNonZeroSpeed = this.simDaysPerSecond > 0 ? this.simDaysPerSecond : 12;
      this.pointer = { x: 0, y: 0 };
      this.drag = { active: false, x: 0, y: 0, moved: false };
      this.orbit = { azimuth: -0.48, polar: 1.06, radius: 54, minRadius: 20, maxRadius: 92 };
      this.resizeObserver = null;
      this.animationFrame = null;
      this.starField = null;
      this.starDrift = 0;
      this.raycaster = null;
      this.bodyMap = new Map();
      this.clickTargets = [];
      this.labels = new Map();
      this.tmpVec = null;
      this.lastTimestamp = 0;
      this.lastRenderTimestamp = 0;
      this.targetFrameMs = window.innerWidth <= 900 ? 1000 / 30 : 1000 / 45;
      this.textureLoader = null;
      this.canvasRect = null;

      if (!this.root || !this.canvas || !this.backButton) return;

      this.bodyData = BODY_DATA.map((body, index) => ({
        ...body,
        orbitRadius: this.computeOrbitRadius(body.semiMajorAu, body.kind),
        baseAngle: index * 0.62,
        tiltDeg: body.key === 'mercury' ? 7 : body.key === 'venus' ? 3.39 : body.key === 'earth' ? 0 : body.key === 'mars' ? 1.85 : body.key === 'asteroid' ? 4 : body.key === 'jupiter' ? 1.31 : body.key === 'saturn' ? 2.49 : body.key === 'uranus' ? 0.77 : body.key === 'neptune' ? 1.77 : 0,
        displayRadius: body.radius
      }));

      this.handlePointerDown = this.handlePointerDown.bind(this);
      this.handlePointerMove = this.handlePointerMove.bind(this);
      this.handlePointerUp = this.handlePointerUp.bind(this);
      this.handleWheel = this.handleWheel.bind(this);
      this.handleResize = this.handleResize.bind(this);
      this.handleCanvasClick = this.handleCanvasClick.bind(this);
      this.animate = this.animate.bind(this);
      this.handleBack = this.handleBack.bind(this);
      this.handleSpeedInput = this.handleSpeedInput.bind(this);

      this.backButton.addEventListener('click', this.handleBack);
      this.mobileDetailClose?.addEventListener('click', () => this.clearMobileSelection());
      this.mobileEnter?.addEventListener('click', () => {
        if (this.mobileSelectedKey) this.selectPlanet(this.mobileSelectedKey);
      });
      this.speedInput?.addEventListener('change', this.handleSpeedInput);
      this.speedInput?.addEventListener('blur', this.handleSpeedInput);
      this.speedDown?.addEventListener('click', () => this.adjustSpeed(-1));
      this.speedUp?.addEventListener('click', () => this.adjustSpeed(1));
      this.speedPause?.addEventListener('click', () => this.togglePause());
      this.syncSpeedControls();
      this.buildHoverCard();
      if (this.labelLayer) {
        this.labelLayer.replaceChildren();
        this.labelLayer.hidden = true;
        this.labelLayer.setAttribute('aria-hidden', 'true');
      }
    }

    isMobileUi() {
      return window.matchMedia('(max-width: 700px), (pointer: coarse) and (max-width: 900px)').matches;
    }

    setMobileSelection(key) {
      if (!this.isMobileUi() || !PLANET_KEYS.has(key)) return;
      const body = this.bodyData.find(item => item.key === key);
      if (!body) return;
      this.mobileSelectedKey = key;
      this.setDetail(key);
      if (this.mobileEnter) this.mobileEnter.textContent = `Masuk Panorama ${body.name}`;
      this.root.classList.add('has-mobile-selection');
      this.detailName?.focus?.({ preventScroll: true });
    }

    clearMobileSelection() {
      this.mobileSelectedKey = null;
      this.root?.classList.remove('has-mobile-selection');
      if (this.mobileEnter) this.mobileEnter.textContent = 'Masuk Panorama';
    }

    readSavedSpeed() {
      try {
        const value = Number(localStorage.getItem('antara-solar-system-speed-v1'));
        return Number.isFinite(value) ? Math.max(0, Math.min(365, value)) : 12;
      } catch {
        return 12;
      }
    }

    setSpeed(value, { persist = true } = {}) {
      const numeric = Number(value);
      const next = Number.isFinite(numeric) ? Math.max(0, Math.min(365, Math.round(numeric * 2) / 2)) : 12;
      this.simDaysPerSecond = next;
      if (next > 0) this.lastNonZeroSpeed = next;
      if (persist) {
        try { localStorage.setItem('antara-solar-system-speed-v1', String(next)); } catch {}
      }
      this.syncSpeedControls();
    }

    adjustSpeed(direction) {
      const current = this.simDaysPerSecond;
      const step = current < 4 ? 0.5 : current < 20 ? 2 : current < 60 ? 5 : 15;
      this.setSpeed(current + step * direction);
    }

    togglePause() {
      if (this.simDaysPerSecond > 0) {
        this.lastNonZeroSpeed = this.simDaysPerSecond;
        this.setSpeed(0);
      } else {
        this.setSpeed(this.lastNonZeroSpeed || 12);
      }
    }

    handleSpeedInput() {
      const raw = String(this.speedInput?.value ?? '').trim();
      if (raw === '') {
        this.syncSpeedControls();
        return;
      }
      this.setSpeed(raw);
    }

    syncSpeedControls() {
      const speed = this.simDaysPerSecond;
      if (this.speedInput && document.activeElement !== this.speedInput) this.speedInput.value = String(speed);
      if (this.speedPause) {
        const paused = speed === 0;
        this.speedPause.textContent = paused ? 'LANJUT' : 'JEDA';
        this.speedPause.setAttribute('aria-pressed', String(paused));
      }
      if (this.speedNote) {
        this.speedNote.textContent = speed === 0 ? 'Tampilan 3D dijeda' : `1 detik ≈ ${Number.isInteger(speed) ? speed : speed.toFixed(1)} hari Bumi`;
      }
    }

    computeOrbitRadius(semiMajorAu, kind) {
      if (!semiMajorAu) return 0;
      if (kind === 'asteroid') return 18.4;
      const base = 6.5 + Math.log(semiMajorAu + 1) * 12.2;
      return Number(base.toFixed(3));
    }

    buildHoverCard() {
      const card = document.createElement('div');
      card.className = 'solar-system-hover-card';
      card.hidden = true;
      card.setAttribute('aria-hidden', 'true');
      card.innerHTML = '<small>OBJEK TATA SURYA</small><strong></strong><span></span><em>Klik untuk membuka panorama</em>';
      this.root.appendChild(card);
      this.hoverCard = card;
    }

    showHoverCard(key, clientX, clientY) {
      const body = this.bodyData.find(item => item.key === key);
      if (!body || !this.hoverCard) return;
      this.hoveredKey = key;
      this.hoverCard.querySelector('strong').textContent = body.name;
      this.hoverCard.querySelector('span').textContent = `${body.distanceLabel} · ${body.orbitLabel}`;
      this.hoverCard.hidden = false;
      this.hoverCard.setAttribute('aria-hidden', 'false');
      this.positionHoverCard(clientX, clientY);
      this.setDetail(key);
      this.canvas.classList.add('is-hovering-body');
    }

    positionHoverCard(clientX, clientY) {
      if (!this.hoverCard || this.hoverCard.hidden) return;
      const rect = this.root.getBoundingClientRect();
      const cardRect = this.hoverCard.getBoundingClientRect();
      const pad = 14;
      const offset = 18;
      let left = clientX - rect.left + offset;
      let top = clientY - rect.top + offset;
      if (left + cardRect.width > rect.width - pad) left = clientX - rect.left - cardRect.width - offset;
      if (top + cardRect.height > rect.height - pad) top = clientY - rect.top - cardRect.height - offset;
      left = Math.max(pad, Math.min(left, rect.width - cardRect.width - pad));
      top = Math.max(pad, Math.min(top, rect.height - cardRect.height - pad));
      this.hoverCard.style.transform = `translate3d(${Math.round(left)}px, ${Math.round(top)}px, 0)`;
    }

    clearHoverCard() {
      this.hoveredKey = null;
      if (this.hoverCard) {
        this.hoverCard.hidden = true;
        this.hoverCard.setAttribute('aria-hidden', 'true');
      }
      this.canvas?.classList.remove('is-hovering-body');
    }

    pickBodyAtPointer() {
      if (!this.raycaster || !this.camera || !this.clickTargets.length) return null;
      this.raycaster.setFromCamera(this.pointer, this.camera);
      const intersections = this.raycaster.intersectObjects(this.clickTargets, true);
      const hit = intersections.find(entry => entry.object?.userData?.bodyKey || entry.object?.parent?.userData?.bodyKey);
      if (!hit) return null;
      return hit.object.userData.bodyKey || hit.object.parent?.userData?.bodyKey || null;
    }

    async ensureReady() {
      if (this.isReady) return true;
      const module = await import('./assets/vendor/three/three.module.min.js');
      this.THREE = module;
      this.raycaster = new this.THREE.Raycaster();
      this.tmpVec = new this.THREE.Vector3();
      this.textureLoader = new this.THREE.TextureLoader();
      this.scene = new this.THREE.Scene();
      this.scene.background = new this.THREE.Color(0x02060d);
      this.camera = new this.THREE.PerspectiveCamera(45, 1, 0.1, 400);
      this.camera.position.set(0, 22, 54);
      const context = this.canvas.getContext('webgl2', { alpha: false, antialias: true }) || this.canvas.getContext('webgl', { alpha: false, antialias: true });
      if (!context) throw new Error('Solar System WebGL initialization failed.');
      this.renderer = new this.THREE.WebGLRenderer({ canvas: this.canvas, context, antialias: false, alpha: false, powerPreference: 'low-power' });
      this.renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, window.innerWidth <= 900 ? 1.25 : 1.5));
      this.renderer.outputColorSpace = this.THREE.SRGBColorSpace;
      this.renderer.toneMapping = this.THREE.ACESFilmicToneMapping;
      this.renderer.toneMappingExposure = 1.14;
      this.renderer.setClearColor(0x02060d, 1);
      this.clock = new this.THREE.Clock();

      await this.buildScene();
      this.attachEvents();
      this.handleResize();
      this.setDetail('sun');
      this.isReady = true;
      return true;
    }

    attachEvents() {
      this.canvas.addEventListener('pointerdown', this.handlePointerDown);
      window.addEventListener('pointermove', this.handlePointerMove, { passive: false });
      window.addEventListener('pointerup', this.handlePointerUp, { passive: true });
      this.canvas.addEventListener('wheel', this.handleWheel, { passive: false });
      this.canvas.addEventListener('click', this.handleCanvasClick);
      window.addEventListener('resize', this.handleResize, { passive: true });
    }

    async buildScene() {
      const T = this.THREE;
      const ambient = new T.HemisphereLight(0x9fc4ef, 0x05070a, 0.48);
      this.scene.add(ambient);
      this.sunLight = new T.PointLight(0xffddb0, 4.6, 240, 1.85);
      this.sunLight.position.set(0, 0, 0);
      this.scene.add(this.sunLight);
      const fill = new T.DirectionalLight(0x8eb2d5, 0.42);
      fill.position.set(-30, 18, -24);
      this.scene.add(fill);

      this.systemRoot = new T.Group();
      this.scene.add(this.systemRoot);
      this.buildStars();
      await this.buildBodies();
    }

    loadTexture(path, { srgb = true } = {}) {
      return new Promise((resolve, reject) => {
        this.textureLoader.load(path, texture => {
          texture.colorSpace = srgb ? this.THREE.SRGBColorSpace : this.THREE.NoColorSpace;
          texture.anisotropy = Math.min(this.renderer.capabilities.getMaxAnisotropy?.() || 4, 8);
          resolve(texture);
        }, undefined, reject);
      });
    }

    makeProceduralTexture(key) {
      const T = this.THREE;
      const canvas = document.createElement('canvas');
      canvas.width = 512;
      canvas.height = 256;
      const ctx = canvas.getContext('2d', { alpha: false });
      const rng = (() => {
        let seed = key === 'sun' ? 11939 : key === 'mercury' ? 8849 : 4721;
        return () => {
          seed = (seed * 1664525 + 1013904223) >>> 0;
          return seed / 4294967296;
        };
      })();

      if (key === 'sun') {
        const g = ctx.createLinearGradient(0, 0, 0, canvas.height);
        g.addColorStop(0, '#ffdf72');
        g.addColorStop(.46, '#f6a323');
        g.addColorStop(1, '#d9640f');
        ctx.fillStyle = g;
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        for (let i = 0; i < 1500; i += 1) {
          const x = rng() * canvas.width;
          const y = rng() * canvas.height;
          const r = .5 + rng() * 2.7;
          ctx.fillStyle = rng() > .5 ? `rgba(255,242,151,${.05 + rng() * .16})` : `rgba(135,45,8,${.04 + rng() * .12})`;
          ctx.beginPath(); ctx.arc(x, y, r, 0, Math.PI * 2); ctx.fill();
        }
      } else if (key === 'mercury') {
        const g = ctx.createLinearGradient(0, 0, 0, canvas.height);
        g.addColorStop(0, '#8f8b84');
        g.addColorStop(.5, '#68645e');
        g.addColorStop(1, '#4b4844');
        ctx.fillStyle = g;
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        for (let i = 0; i < 480; i += 1) {
          const x = rng() * canvas.width;
          const y = rng() * canvas.height;
          const r = 1 + rng() * 8;
          ctx.fillStyle = `rgba(35,33,31,${.05 + rng() * .16})`;
          ctx.beginPath(); ctx.arc(x, y, r, 0, Math.PI * 2); ctx.fill();
          ctx.strokeStyle = `rgba(205,198,185,${.03 + rng() * .09})`;
          ctx.lineWidth = 1;
          ctx.stroke();
        }
      } else {
        const g = ctx.createLinearGradient(0, 0, 0, canvas.height);
        g.addColorStop(0, '#f0c979');
        g.addColorStop(.48, '#d69d49');
        g.addColorStop(1, '#9c622d');
        ctx.fillStyle = g;
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        for (let band = 0; band < 18; band += 1) {
          const y = band / 18 * canvas.height;
          ctx.fillStyle = band % 2 ? 'rgba(255,226,154,.075)' : 'rgba(104,54,26,.055)';
          ctx.fillRect(0, y, canvas.width, 7 + rng() * 10);
        }
        for (let i = 0; i < 120; i += 1) {
          const x = rng() * canvas.width;
          const y = rng() * canvas.height;
          const rx = 6 + rng() * 22;
          const ry = 2 + rng() * 8;
          ctx.fillStyle = `rgba(255,239,186,${.025 + rng() * .07})`;
          ctx.beginPath(); ctx.ellipse(x, y, rx, ry, rng() * .4, 0, Math.PI * 2); ctx.fill();
        }
      }
      const texture = new T.CanvasTexture(canvas);
      texture.colorSpace = T.SRGBColorSpace;
      texture.generateMipmaps = true;
      texture.minFilter = T.LinearMipmapLinearFilter;
      texture.magFilter = T.LinearFilter;
      texture.needsUpdate = true;
      return texture;
    }

    buildStars() {
      const T = this.THREE;
      const geometry = new T.BufferGeometry();
      const count = window.innerWidth <= 900 ? 700 : 1100;
      const positions = new Float32Array(count * 3);
      for (let i = 0; i < count; i += 1) {
        const r = 100 + Math.random() * 140;
        const theta = Math.random() * Math.PI * 2;
        const phi = Math.acos(2 * Math.random() - 1);
        const sinPhi = Math.sin(phi);
        positions[i * 3] = r * sinPhi * Math.cos(theta);
        positions[i * 3 + 1] = r * Math.cos(phi);
        positions[i * 3 + 2] = r * sinPhi * Math.sin(theta);
      }
      geometry.setAttribute('position', new T.BufferAttribute(positions, 3));
      const material = new T.PointsMaterial({ color: 0xd8e7f7, size: 0.22, transparent: true, opacity: 0.8, depthWrite: false });
      this.starField = new T.Points(geometry, material);
      this.scene.add(this.starField);
    }

    async buildBodies() {
      const T = this.THREE;
      const tasks = this.bodyData.map(async body => {
        if (body.kind === 'asteroid') return { key: body.key, texture: null };
        if (!body.texture) return { key: body.key, texture: this.makeProceduralTexture(body.key) };
        try {
          const texture = await this.loadTexture(body.texture);
          return { key: body.key, texture };
        } catch (error) {
          console.warn('[ANTARA SolarSystem] lightweight texture fallback', body.key, error);
          return { key: body.key, texture: this.makeProceduralTexture(body.key) };
        }
      });
      const loaded = new Map((await Promise.all(tasks)).map(item => [item.key, item.texture]));

      for (const body of this.bodyData) {
        if (body.key !== 'sun') {
          const orbit = new T.EllipseCurve(0, 0, body.orbitRadius, body.orbitRadius * Math.sqrt(1 - body.eccentricity ** 2), 0, Math.PI * 2, false, 0);
          const points = orbit.getPoints(180).map(point => new T.Vector3(point.x - body.orbitRadius * body.eccentricity, 0, point.y));
          const orbitGeometry = new T.BufferGeometry().setFromPoints(points);
          const orbitLine = new T.LineLoop(orbitGeometry, new T.LineBasicMaterial({ color: body.kind === 'asteroid' ? 0x49617c : 0x28415a, transparent: true, opacity: body.kind === 'asteroid' ? 0.42 : 0.55 }));
          orbitLine.rotation.x = T.MathUtils.degToRad(body.tiltDeg || 0) * 0.18;
          orbitLine.userData.bodyKey = body.key;
          this.systemRoot.add(orbitLine);
        }

        if (body.kind === 'asteroid') {
          const asteroidCount = window.innerWidth <= 900 ? 70 : 110;
          const geometry = new T.IcosahedronGeometry(0.07, 0);
          const material = new T.MeshStandardMaterial({ color: 0x8c7a66, roughness: 0.97, metalness: 0.01 });
          const belt = new T.InstancedMesh(geometry, material, asteroidCount);
          const dummy = new T.Object3D();
          for (let i = 0; i < asteroidCount; i += 1) {
            const angle = i / asteroidCount * Math.PI * 2 + (Math.random() - .5) * .05;
            const pos = this.computeBodyPosition(body, angle);
            const spread = (Math.random() - .5) * 1.6;
            dummy.position.set(pos.x + Math.cos(angle) * spread, (Math.random() - .5) * .32, pos.z + Math.sin(angle) * spread);
            dummy.rotation.set(Math.random() * Math.PI, Math.random() * Math.PI, Math.random() * Math.PI);
            dummy.scale.setScalar(.65 + Math.random() * 1.35);
            dummy.updateMatrix();
            belt.setMatrixAt(i, dummy.matrix);
          }
          belt.instanceMatrix.needsUpdate = true;
          belt.name = 'asteroid-belt';
          belt.userData.bodyKey = body.key;
          this.systemRoot.add(belt);
          this.bodyMap.set(body.key, { body, group: belt, mesh: belt, anchor: this.computeBodyPosition(body, body.baseAngle) });
          this.clickTargets.push(belt);
          continue;
        }

        const group = new T.Group();
        group.name = body.key;
        const geo = new T.SphereGeometry(body.displayRadius, body.key === 'sun' ? 40 : 32, body.key === 'sun' ? 28 : 24);
        let material;
        if (body.key === 'sun') {
          material = new T.MeshBasicMaterial({ map: loaded.get(body.key), color: 0xffffff });
        } else {
          material = new T.MeshStandardMaterial({ map: loaded.get(body.key), color: 0xffffff, roughness: body.key === 'earth' ? 0.84 : 0.91, metalness: 0, emissive: 0x080b10, emissiveIntensity: 0.28 });
        }
        const mesh = new T.Mesh(geo, material);
        mesh.userData.bodyKey = body.key;
        group.add(mesh);

        // Invisible interaction proxy keeps small inner planets easy to hover/click
        // without visually inflating their model any further.
        if (body.key !== 'sun') {
          const hitRadius = Math.max(body.displayRadius * 1.7, 0.82);
          const hitProxy = new T.Mesh(
            new T.SphereGeometry(hitRadius, 12, 8),
            new T.MeshBasicMaterial({ transparent: true, opacity: 0, depthWrite: false, colorWrite: false })
          );
          hitProxy.userData.bodyKey = body.key;
          hitProxy.userData.interactionProxy = true;
          group.add(hitProxy);
          this.clickTargets.push(hitProxy);
        }

        if (body.key === 'sun') {
          const glow = new T.Mesh(new T.SphereGeometry(body.displayRadius * 1.20, 32, 22), new T.MeshBasicMaterial({ color: 0xffc26c, transparent: true, opacity: 0.12, side: T.BackSide }));
          group.add(glow);
        }
        if (body.key === 'saturn') {
          const ring = new T.Mesh(new T.RingGeometry(body.displayRadius * 1.35, body.displayRadius * 2.25, 96), new T.MeshBasicMaterial({ map: this.makeRingTexture(0xd0bb8d, 0.56, 0.12), color: 0xd2c0a1, transparent: true, opacity: 0.82, side: T.DoubleSide, depthWrite: false }));
          ring.rotation.x = Math.PI / 2 - 0.28;
          ring.rotation.z = 0.12;
          ring.userData.bodyKey = body.key;
          group.add(ring);
        }
        if (body.key === 'uranus') {
          const ring = new T.Mesh(new T.RingGeometry(body.displayRadius * 1.22, body.displayRadius * 1.58, 72), new T.MeshBasicMaterial({ color: 0xa8cddf, transparent: true, opacity: 0.22, side: T.DoubleSide, depthWrite: false }));
          ring.rotation.x = Math.PI / 2 - 1.05;
          group.add(ring);
        }
        if (body.key === 'neptune') {
          const ring = new T.Mesh(new T.RingGeometry(body.displayRadius * 1.18, body.displayRadius * 1.44, 72), new T.MeshBasicMaterial({ color: 0x6988b1, transparent: true, opacity: 0.18, side: T.DoubleSide, depthWrite: false }));
          ring.rotation.x = Math.PI / 2 - 0.5;
          group.add(ring);
        }
        if (body.key !== 'sun') {
          const orbitTilt = T.MathUtils.degToRad(body.tiltDeg || 0) * 0.18;
          group.rotation.x = orbitTilt;
          group.position.copy(this.computeBodyPosition(body, body.baseAngle));
        }
        this.systemRoot.add(group);
        this.bodyMap.set(body.key, { body, group, mesh, anchor: group.position.clone() });
        this.clickTargets.push(mesh);
      }
    }

    makeRingTexture(color = 0xd8c19f, alpha = 0.6, falloff = 0.14) {
      const T = this.THREE;
      const canvas = document.createElement('canvas');
      canvas.width = 512;
      canvas.height = 32;
      const ctx = canvas.getContext('2d');
      const gradient = ctx.createLinearGradient(0, 0, canvas.width, 0);
      gradient.addColorStop(0, 'rgba(0,0,0,0)');
      gradient.addColorStop(0.16, `rgba(${(color >> 16) & 255}, ${(color >> 8) & 255}, ${color & 255}, ${alpha * 0.9})`);
      gradient.addColorStop(0.5, `rgba(${(color >> 16) & 255}, ${(color >> 8) & 255}, ${color & 255}, ${alpha})`);
      gradient.addColorStop(1 - falloff, `rgba(${(color >> 16) & 255}, ${(color >> 8) & 255}, ${color & 255}, ${alpha * 0.72})`);
      gradient.addColorStop(1, 'rgba(0,0,0,0)');
      ctx.fillStyle = gradient;
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      for (let i = 0; i < 64; i += 1) {
        const x = Math.random() * canvas.width;
        const w = 2 + Math.random() * 12;
        const o = 0.04 + Math.random() * 0.08;
        ctx.fillStyle = `rgba(255,255,255,${o})`;
        ctx.fillRect(x, 0, w, canvas.height);
      }
      const texture = new T.CanvasTexture(canvas);
      texture.colorSpace = T.SRGBColorSpace;
      texture.needsUpdate = true;
      return texture;
    }

    computeBodyPosition(body, angle) {
      const a = body.orbitRadius;
      const b = a * Math.sqrt(1 - body.eccentricity ** 2);
      const x = a * Math.cos(angle) - a * body.eccentricity;
      const z = b * Math.sin(angle);
      return new this.THREE.Vector3(x, 0, z);
    }

    open({ sourcePhase } = {}) {
      if (!this.root) return;
      this.sourcePhase = sourcePhase || this.sourcePhase || 'earth';
      this.root.hidden = false;
      this.root.setAttribute('aria-hidden', 'false');
      this.isOpen = true;
      this.ensureReady().then(() => {
        this.handleResize();
        this.start();
        this.setDetail(this.sourcePhase);
        if (this.isMobileUi()) this.clearMobileSelection();
      }).catch(error => {
        console.error('[ANTARA SolarSystem] failed to open', error);
        this.options.onError?.(error);
      });
    }

    close() {
      this.isOpen = false;
      if (this.animationFrame) cancelAnimationFrame(this.animationFrame);
      this.animationFrame = null;
      this.lastTimestamp = 0;
      this.lastRenderTimestamp = 0;
      this.clearHoverCard();
      this.clearMobileSelection();
      this.root.hidden = true;
      this.root.setAttribute('aria-hidden', 'true');
    }

    start() {
      if (!this.isReady || this.animationFrame) return;
      this.clock.start();
      this.animationFrame = requestAnimationFrame(this.animate);
    }

    handleBack() {
      this.options.onExit?.(this.sourcePhase);
    }

    selectPlanet(key) {
      if (!PLANET_KEYS.has(key)) return;
      this.options.onSelectPlanet?.(key, this.sourcePhase);
    }

    setDetail(key) {
      const body = this.bodyData.find(item => item.key === key) || this.bodyData[0];
      this.currentHighlightedKey = body.key;
      if (this.detailKicker) this.detailKicker.textContent = body.key === 'sun' ? 'PUSAT SISTEM' : body.kind === 'asteroid' ? 'WILAYAH DIAMATI' : 'PLANET TERSOROT';
      if (this.detailName) this.detailName.textContent = body.name;
      if (this.detailLead) this.detailLead.textContent = body.lead;
      if (this.detailDistance) this.detailDistance.textContent = body.distanceLabel;
      if (this.detailOrbit) this.detailOrbit.textContent = body.orbitLabel;
      if (this.detailDay) this.detailDay.textContent = body.rotationHours;
      if (this.detailNote) this.detailNote.textContent = body.note;
    }

    handlePointerDown(event) {
      if (!this.isOpen) return;
      this.drag.active = true;
      this.drag.moved = false;
      this.canvas.classList.add('is-dragging');
      this.clearHoverCard();
      this.drag.x = event.clientX;
      this.drag.y = event.clientY;
      this.canvas.setPointerCapture?.(event.pointerId);
    }

    handlePointerMove(event) {
      if (!this.isOpen) return;
      if (!this.drag.active && event.target !== this.canvas) {
        this.clearHoverCard();
        return;
      }
      this.updatePointer(event.clientX, event.clientY);
      if (!this.drag.active) {
        if (this.isMobileUi()) return;
        const key = this.pickBodyAtPointer();
        if (key) this.showHoverCard(key, event.clientX, event.clientY);
        else this.clearHoverCard();
        return;
      }
      const dx = event.clientX - this.drag.x;
      const dy = event.clientY - this.drag.y;
      if (Math.abs(dx) + Math.abs(dy) > 2) this.drag.moved = true;
      this.drag.x = event.clientX;
      this.drag.y = event.clientY;
      this.orbit.azimuth -= dx * 0.005;
      this.orbit.polar = Math.max(0.38, Math.min(Math.PI / 2.2, this.orbit.polar + dy * 0.0045));
      event.preventDefault();
    }

    handlePointerUp(event) {
      if (!this.isOpen) return;
      this.drag.active = false;
      this.canvas.classList.remove('is-dragging');
      this.canvas.releasePointerCapture?.(event.pointerId);
      this.updatePointer(event.clientX, event.clientY);
      if (this.isMobileUi()) {
        this.clearHoverCard();
        return;
      }
      const key = this.pickBodyAtPointer();
      if (key) this.showHoverCard(key, event.clientX, event.clientY);
      else this.clearHoverCard();
    }

    handleWheel(event) {
      if (!this.isOpen) return;
      this.orbit.radius = Math.max(this.orbit.minRadius, Math.min(this.orbit.maxRadius, this.orbit.radius + event.deltaY * 0.025));
      event.preventDefault();
    }

    handleResize() {
      if (!this.isReady || !this.root || this.root.hidden) return;
      const width = this.root.clientWidth || window.innerWidth;
      const height = this.root.clientHeight || window.innerHeight;
      this.renderer.setSize(width, height, false);
      this.camera.aspect = width / Math.max(1, height);
      this.camera.updateProjectionMatrix();
      this.canvasRect = this.canvas.getBoundingClientRect();
      if (!this.isMobileUi()) this.clearMobileSelection();
    }

    updatePointer(clientX, clientY) {
      if (!this.canvasRect) this.canvasRect = this.canvas.getBoundingClientRect();
      const rect = this.canvasRect;
      this.pointer.x = ((clientX - rect.left) / rect.width) * 2 - 1;
      this.pointer.y = -((clientY - rect.top) / rect.height) * 2 + 1;
    }

    handleCanvasClick(event) {
      if (!this.isOpen || this.drag.moved || !this.raycaster || !this.camera) return;
      this.updatePointer(event.clientX, event.clientY);
      const key = this.pickBodyAtPointer();
      if (!key) return;
      if (this.isMobileUi()) {
        this.setMobileSelection(key);
        return;
      }
      this.selectPlanet(key);
    }

    animate(timestamp) {
      if (!this.isOpen) return;
      if (this.lastRenderTimestamp && timestamp - this.lastRenderTimestamp < this.targetFrameMs) {
        this.animationFrame = requestAnimationFrame(this.animate);
        return;
      }
      if (!this.lastTimestamp) this.lastTimestamp = timestamp;
      const deltaSeconds = Math.min(0.08, Math.max(0.001, (timestamp - this.lastTimestamp) / 1000));
      this.lastTimestamp = timestamp;
      this.lastRenderTimestamp = timestamp;
      this.simDays += deltaSeconds * this.simDaysPerSecond;
      this.orbit.azimuth += this.drag.active ? 0 : deltaSeconds * 0.035;
      this.updateBodies(deltaSeconds);
      this.updateCamera();
      this.renderer.render(this.scene, this.camera);
      if (this.clockValue) {
        this.clockValue.textContent = `Hari ke-${Math.round(this.simDays).toLocaleString('id-ID')}`;
      }
      this.animationFrame = requestAnimationFrame(this.animate);
    }

    updateBodies(deltaSeconds = 1 / 60) {
      const T = this.THREE;
      for (const body of this.bodyData) {
        const record = this.bodyMap.get(body.key);
        if (!record) continue;
        if (body.key === 'sun') {
          record.group.rotation.y += 0.054 * deltaSeconds;
          continue;
        }
        if (body.kind === 'asteroid') {
          const beltAngle = body.baseAngle + (this.simDays / body.orbitalPeriodDays) * Math.PI * 2;
          record.group.rotation.y = beltAngle;
          record.anchor = this.computeBodyPosition(body, beltAngle);
          continue;
        }
        const angle = body.baseAngle + (this.simDays / body.orbitalPeriodDays) * Math.PI * 2;
        const position = this.computeBodyPosition(body, angle);
        record.group.position.copy(position);
        record.mesh.rotation.y += deltaSpin(body.key) * deltaSeconds;
        if (body.key === 'saturn') record.group.rotation.z = 0.28;
      }

      if (this.starField) {
        this.starDrift += 0.0004;
        this.starField.rotation.y = this.starDrift;
      }

      function deltaSpin(key) {
        switch (key) {
          case 'jupiter': return 1.08;
          case 'saturn': return 0.96;
          case 'uranus': return 0.72;
          case 'neptune': return 0.72;
          case 'earth': return 1.2;
          case 'mars': return 1.08;
          case 'venus': return -0.24;
          case 'mercury': return 0.48;
          default: return 0.6;
        }
      }
    }

    updateCamera() {
      const radius = this.orbit.radius;
      const sinPolar = Math.sin(this.orbit.polar);
      const x = radius * sinPolar * Math.cos(this.orbit.azimuth);
      const y = radius * Math.cos(this.orbit.polar);
      const z = radius * sinPolar * Math.sin(this.orbit.azimuth);
      this.camera.position.set(x, y + 4, z);
      this.camera.lookAt(0, 0, 0);
    }


  }

  window.ANTARASolarSystemExplorer = SolarSystemExplorer;
})();
