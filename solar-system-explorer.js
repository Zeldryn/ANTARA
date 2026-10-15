(() => {
  const BODY_DATA = Object.freeze([
    {
      key: 'sun',
      name: 'Matahari',
      short: 'Bintang pusat',
      kind: 'star',
      texture: 'assets/progress-planets/sun.png',
      radius: 2.85,
      semiMajorAu: 0,
      eccentricity: 0,
      orbitalPeriodDays: Infinity,
      rotationHours: '25–35 hari',
      distanceLabel: '0 AU',
      orbitLabel: '—',
      note: 'Matahari menyimpan ~99,8% massa Tata Surya dan menjadi sumber energi bagi seluruh planet.',
      lead: 'Bintang pusat Tata Surya. Semua orbit planet di bawah ini mengitari Matahari dengan periode nyata yang dikompresi supaya tetap mudah diamati.'
    },
    {
      key: 'mercury',
      name: 'Merkurius',
      short: 'Planet batuan terdalam',
      kind: 'planet',
      texture: 'assets/progress-planets/mercury.png',
      radius: 0.34,
      semiMajorAu: 0.387,
      eccentricity: 0.206,
      orbitalPeriodDays: 88,
      rotationHours: '58,6 hari',
      distanceLabel: '0,39 AU',
      orbitLabel: '88 hari',
      note: 'Orbitnya paling lonjong di antara planet utama dan berada paling dekat ke Matahari.',
      lead: 'Merkurius bergerak paling cepat dalam simulasi karena periode revolusinya paling singkat.'
    },
    {
      key: 'venus',
      name: 'Venus',
      short: 'Planet rumah kaca',
      kind: 'planet',
      texture: 'assets/progress-planets/venus.png',
      radius: 0.46,
      semiMajorAu: 0.723,
      eccentricity: 0.007,
      orbitalPeriodDays: 224.7,
      rotationHours: '243 hari (retrograde)',
      distanceLabel: '0,72 AU',
      orbitLabel: '224,7 hari',
      note: 'Venus berputar retrograde dan atmosfernya sangat tebal, tetapi di mode ini ia tetap mengikuti orbit heliosentrisnya.',
      lead: 'Orbit Venus hampir melingkar, sehingga jalurnya tampak lebih stabil dibanding Merkurius.'
    },
    {
      key: 'earth',
      name: 'Bumi',
      short: 'Rumah kita',
      kind: 'planet',
      texture: 'assets/textures/earth-blue-marble-4k.jpg',
      radius: 0.49,
      semiMajorAu: 1,
      eccentricity: 0.017,
      orbitalPeriodDays: 365.25,
      rotationHours: '23,9 jam',
      distanceLabel: '1 AU',
      orbitLabel: '365,25 hari',
      note: 'Bumi dijadikan acuan utama: 1 AU dan 1 tahun Bumi dipakai sebagai baseline skala orbit.',
      lead: 'Klik Bumi kapan saja untuk langsung kembali ke panorama Bumi di ANTARA.'
    },
    {
      key: 'mars',
      name: 'Mars',
      short: 'Planet merah',
      kind: 'planet',
      texture: 'assets/textures/mars-surface-2k.jpg',
      radius: 0.38,
      semiMajorAu: 1.524,
      eccentricity: 0.093,
      orbitalPeriodDays: 687,
      rotationHours: '24,6 jam',
      distanceLabel: '1,52 AU',
      orbitLabel: '687 hari',
      note: 'Jarak Mars yang lebih jauh membuat revolusinya lebih lambat daripada Bumi.',
      lead: 'Mars tetap bergerak terus dalam orbitnya; perbandingan lajunya dengan Bumi langsung terlihat di sini.'
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
      note: 'Sabuk asteroid utama berada di antara Mars dan Jupiter. Di sini divisualisasikan sebagai koridor orbit edukatif.',
      lead: 'Klik label Sabuk Asteroid untuk kembali ke panorama sabuk asteroid ANTARA.'
    },
    {
      key: 'jupiter',
      name: 'Jupiter',
      short: 'Raksasa gas terbesar',
      kind: 'planet',
      texture: 'assets/textures/jupiter-hubble-inspired-4k.jpg',
      radius: 1.16,
      semiMajorAu: 5.203,
      eccentricity: 0.049,
      orbitalPeriodDays: 4331,
      rotationHours: '9,9 jam',
      distanceLabel: '5,20 AU',
      orbitLabel: '11,86 tahun',
      note: 'Jupiter membutuhkan hampir 12 tahun Bumi untuk menyelesaikan satu revolusi.',
      lead: 'Di jarak ini, perbedaan kecepatan orbit planet luar mulai terasa jauh lebih lambat.'
    },
    {
      key: 'saturn',
      name: 'Saturnus',
      short: 'Raksasa bercincin',
      kind: 'planet',
      texture: 'assets/textures/saturn-atmosphere-4k.jpg',
      radius: 0.98,
      semiMajorAu: 9.537,
      eccentricity: 0.057,
      orbitalPeriodDays: 10747,
      rotationHours: '10,7 jam',
      distanceLabel: '9,54 AU',
      orbitLabel: '29,46 tahun',
      note: 'Cincin Saturnus di mode ini divisualisasikan penuh supaya tetap jelas walau skala sistem dikompresi.',
      lead: 'Saturnus memakai cincin 3D tipis agar tetap terasa khas meski seluruh Tata Surya diringkas ke satu panggung.'
    },
    {
      key: 'uranus',
      name: 'Uranus',
      short: 'Ice giant miring',
      kind: 'planet',
      texture: 'assets/textures/uranus-atmosphere-4k.jpg',
      radius: 0.74,
      semiMajorAu: 19.191,
      eccentricity: 0.046,
      orbitalPeriodDays: 30589,
      rotationHours: '17,2 jam (retrograde)',
      distanceLabel: '19,19 AU',
      orbitLabel: '84,0 tahun',
      note: 'Uranus butuh sekitar 84 tahun Bumi untuk satu putaran mengitari Matahari.',
      lead: 'Uranus jauh lebih lambat dan lebih jauh; pola orbit planet luar terlihat jelas dibanding planet dalam.'
    },
    {
      key: 'neptune',
      name: 'Neptunus',
      short: 'Ice giant terluar',
      kind: 'planet',
      texture: 'assets/textures/neptune-atmosphere-4k.jpg',
      radius: 0.72,
      semiMajorAu: 30.07,
      eccentricity: 0.009,
      orbitalPeriodDays: 59800,
      rotationHours: '16,1 jam',
      distanceLabel: '30,07 AU',
      orbitLabel: '164,8 tahun',
      note: 'Neptunus adalah planet utama terjauh; satu revolusinya setara ~164,8 tahun Bumi.',
      lead: 'Dalam simulasi ini Neptunus tetap terus bergerak, tetapi paling lambat di antara semua planet utama.'
    }
  ]);

  const PLANET_KEYS = new Set(BODY_DATA.map(item => item.key));

  class SolarSystemExplorer {
    constructor(options = {}) {
      this.options = options;
      this.root = document.getElementById(options.rootId || 'solar-system-observer');
      this.canvas = document.getElementById(options.canvasId || 'solar-system-canvas');
      this.labelLayer = document.getElementById(options.labelLayerId || 'solar-system-label-layer');
      this.backButton = document.getElementById(options.backButtonId || 'solar-system-back');
      this.clockValue = document.getElementById(options.clockValueId || 'solar-system-clock-value');
      this.detailKicker = document.getElementById(options.detailKickerId || 'solar-system-detail-kicker');
      this.detailName = document.getElementById(options.detailNameId || 'solar-system-detail-name');
      this.detailLead = document.getElementById(options.detailLeadId || 'solar-system-detail-lead');
      this.detailDistance = document.getElementById(options.detailDistanceId || 'solar-system-detail-distance');
      this.detailOrbit = document.getElementById(options.detailOrbitId || 'solar-system-detail-orbit');
      this.detailDay = document.getElementById(options.detailDayId || 'solar-system-detail-day');
      this.detailNote = document.getElementById(options.detailNoteId || 'solar-system-detail-note');
      this.instructions = document.getElementById(options.instructionsId || 'solar-system-instructions');

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
      this.simDaysPerSecond = 12;
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
      this.textureLoader = null;
      this.canvasRect = null;

      if (!this.root || !this.canvas || !this.labelLayer || !this.backButton) return;

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

      this.backButton.addEventListener('click', this.handleBack);
      this.buildLabels();
    }

    computeOrbitRadius(semiMajorAu, kind) {
      if (!semiMajorAu) return 0;
      if (kind === 'asteroid') return 18.4;
      const base = 6.5 + Math.log(semiMajorAu + 1) * 12.2;
      return Number(base.toFixed(3));
    }

    buildLabels() {
      const frag = document.createDocumentFragment();
      for (const body of this.bodyData) {
        if (body.key === 'sun') continue;
        const button = document.createElement('button');
        button.type = 'button';
        button.className = 'solar-system-label';
        button.dataset.key = body.key;
        button.dataset.kind = body.kind;
        button.innerHTML = `<small>${body.kind === 'asteroid' ? 'KORIDOR' : 'PANORAMA'}</small><strong>${body.name}</strong><span>${body.short}</span>`;
        button.addEventListener('mouseenter', () => this.setDetail(body.key));
        button.addEventListener('focus', () => this.setDetail(body.key));
        button.addEventListener('click', event => {
          event.preventDefault();
          event.stopPropagation();
          this.selectPlanet(body.key);
        });
        frag.appendChild(button);
        this.labels.set(body.key, button);
      }
      this.labelLayer.appendChild(frag);
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
      if (!context) throw new Error('WebGL tidak tersedia untuk mode Tata Surya.');
      this.renderer = new this.THREE.WebGLRenderer({ canvas: this.canvas, context, antialias: true, alpha: false });
      this.renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
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

    buildStars() {
      const T = this.THREE;
      const geometry = new T.BufferGeometry();
      const count = 2000;
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
        if (body.kind === 'asteroid') {
          return { key: body.key, texture: null };
        }
        try {
          const texture = body.texture ? await this.loadTexture(body.texture) : null;
          return { key: body.key, texture };
        } catch (error) {
          console.warn('[ANTARA SolarSystem] texture fallback', body.key, error);
          return { key: body.key, texture: null };
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
          const beltGroup = new T.Group();
          beltGroup.name = 'asteroid-belt';
          const beltMaterial = new T.MeshStandardMaterial({ color: 0x8c7a66, roughness: 0.95, metalness: 0.03 });
          for (let i = 0; i < 170; i += 1) {
            const mesh = new T.Mesh(new T.IcosahedronGeometry(0.045 + Math.random() * 0.06, 0), beltMaterial);
            mesh.position.copy(this.computeBodyPosition(body, i / 170 * Math.PI * 2));
            mesh.rotation.set(Math.random() * Math.PI, Math.random() * Math.PI, Math.random() * Math.PI);
            const scale = 0.7 + Math.random() * 1.8;
            mesh.scale.setScalar(scale);
            beltGroup.add(mesh);
          }
          beltGroup.userData.bodyKey = body.key;
          this.systemRoot.add(beltGroup);
          this.bodyMap.set(body.key, { body, group: beltGroup, mesh: beltGroup, anchor: this.computeBodyPosition(body, body.baseAngle) });
          this.clickTargets.push(beltGroup);
          continue;
        }

        const group = new T.Group();
        group.name = body.key;
        const geo = new T.SphereGeometry(body.displayRadius, body.key === 'sun' ? 72 : 64, body.key === 'sun' ? 54 : 48);
        let material;
        if (body.key === 'sun') {
          material = new T.MeshBasicMaterial({ map: loaded.get(body.key), color: 0xffd07e });
        } else {
          material = new T.MeshStandardMaterial({ map: loaded.get(body.key), color: 0xffffff, roughness: body.key === 'earth' ? 0.88 : 0.92, metalness: 0 });
        }
        const mesh = new T.Mesh(geo, material);
        mesh.userData.bodyKey = body.key;
        group.add(mesh);

        if (body.key === 'sun') {
          const glow = new T.Mesh(new T.SphereGeometry(body.displayRadius * 1.22, 52, 38), new T.MeshBasicMaterial({ color: 0xffc26c, transparent: true, opacity: 0.12, side: T.BackSide }));
          group.add(glow);
        }
        if (body.key === 'saturn') {
          const ring = new T.Mesh(new T.RingGeometry(body.displayRadius * 1.35, body.displayRadius * 2.25, 160), new T.MeshBasicMaterial({ map: this.makeRingTexture(0xd0bb8d, 0.56, 0.12), color: 0xd2c0a1, transparent: true, opacity: 0.82, side: T.DoubleSide, depthWrite: false }));
          ring.rotation.x = Math.PI / 2 - 0.28;
          ring.rotation.z = 0.12;
          ring.userData.bodyKey = body.key;
          group.add(ring);
        }
        if (body.key === 'uranus') {
          const ring = new T.Mesh(new T.RingGeometry(body.displayRadius * 1.22, body.displayRadius * 1.58, 120), new T.MeshBasicMaterial({ color: 0xa8cddf, transparent: true, opacity: 0.22, side: T.DoubleSide, depthWrite: false }));
          ring.rotation.x = Math.PI / 2 - 1.05;
          group.add(ring);
        }
        if (body.key === 'neptune') {
          const ring = new T.Mesh(new T.RingGeometry(body.displayRadius * 1.18, body.displayRadius * 1.44, 120), new T.MeshBasicMaterial({ color: 0x6988b1, transparent: true, opacity: 0.18, side: T.DoubleSide, depthWrite: false }));
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
      canvas.width = 1024;
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
      for (const [labelKey, label] of this.labels.entries()) {
        label.classList.toggle('is-active', labelKey === body.key);
      }
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
      this.drag.x = event.clientX;
      this.drag.y = event.clientY;
      this.canvas.setPointerCapture?.(event.pointerId);
    }

    handlePointerMove(event) {
      if (!this.isOpen) return;
      this.updatePointer(event.clientX, event.clientY);
      if (!this.drag.active) return;
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
      this.canvas.releasePointerCapture?.(event.pointerId);
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
      this.raycaster.setFromCamera(this.pointer, this.camera);
      const intersections = this.raycaster.intersectObjects(this.clickTargets, true);
      const hit = intersections.find(entry => entry.object?.userData?.bodyKey || entry.object?.parent?.userData?.bodyKey);
      if (!hit) return;
      const key = hit.object.userData.bodyKey || hit.object.parent?.userData?.bodyKey;
      if (key) this.selectPlanet(key);
    }

    animate(timestamp) {
      if (!this.isOpen) return;
      if (!this.lastTimestamp) this.lastTimestamp = timestamp;
      const deltaSeconds = Math.min(0.05, Math.max(0.001, (timestamp - this.lastTimestamp) / 1000));
      this.lastTimestamp = timestamp;
      this.simDays += deltaSeconds * this.simDaysPerSecond;
      this.orbit.azimuth += this.drag.active ? 0 : deltaSeconds * 0.035;
      this.updateBodies();
      this.updateCamera();
      this.updateLabels();
      this.renderer.render(this.scene, this.camera);
      if (this.clockValue) {
        this.clockValue.textContent = `Hari ke-${Math.round(this.simDays).toLocaleString('id-ID')}`;
      }
      this.animationFrame = requestAnimationFrame(this.animate);
    }

    updateBodies() {
      const T = this.THREE;
      for (const body of this.bodyData) {
        const record = this.bodyMap.get(body.key);
        if (!record) continue;
        if (body.key === 'sun') {
          record.group.rotation.y += 0.0009;
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
        record.mesh.rotation.y += deltaSpin(body.key);
        if (body.key === 'saturn') record.group.rotation.z = 0.28;
      }

      if (this.starField) {
        this.starDrift += 0.0004;
        this.starField.rotation.y = this.starDrift;
      }

      function deltaSpin(key) {
        switch (key) {
          case 'jupiter': return 0.018;
          case 'saturn': return 0.016;
          case 'uranus': return 0.012;
          case 'neptune': return 0.012;
          case 'earth': return 0.02;
          case 'mars': return 0.018;
          case 'venus': return -0.004;
          case 'mercury': return 0.008;
          default: return 0.01;
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

    updateLabels() {
      const width = this.root.clientWidth || window.innerWidth;
      const height = this.root.clientHeight || window.innerHeight;
      for (const body of this.bodyData) {
        if (body.key === 'sun') continue;
        const label = this.labels.get(body.key);
        const record = this.bodyMap.get(body.key);
        if (!label || !record) continue;
        const source = body.kind === 'asteroid' ? record.anchor : record.group.position;
        this.tmpVec.copy(source).project(this.camera);
        const visible = this.tmpVec.z < 1 && this.tmpVec.z > -1;
        const x = (this.tmpVec.x * 0.5 + 0.5) * width;
        const y = (-this.tmpVec.y * 0.5 + 0.5) * height;
        label.style.left = `${x}px`;
        label.style.top = `${y}px`;
        const inside = x > -80 && x < width + 80 && y > -60 && y < height + 60;
        label.style.opacity = visible && inside ? '1' : '0';
        label.style.pointerEvents = visible && inside ? 'auto' : 'none';
      }
    }
  }

  window.ANTARASolarSystemExplorer = SolarSystemExplorer;
})();
