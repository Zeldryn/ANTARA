"use strict";

// Earth introduction scene. It keeps the existing page structure and renderer isolation.
window.EarthScene = class EarthScene {
  constructor({ onNext } = {}) {
    this.element = document.getElementById("earth-scene");
    this.viewport = document.getElementById("earth-viewport");
    this.information = document.getElementById("earth-information");
    this.title = document.getElementById("earth-title");
    this.nextButton = document.getElementById("earth-next");
    this.motion = window.matchMedia("(prefers-reduced-motion: reduce)");
    this.onNext = typeof onNext === "function" ? onNext : () => {};
    this.active = false;
    this.time = 0;
    this.frame = null;
    this.mode = "pending";
    this.exiting = false;
    this.approaching = false;
    this.exitStartedAt = 0;
    this.pointer = { x: 0, y: 0 };
    this.cameraOffset = { x: 0, y: 0 };
    this.tick = this.tick.bind(this);

    this.stars = Array.from({ length: 220 }, (_, n) => {
      const rand = seed => { const v = Math.sin(seed * 113.7 + 283.1) * 43758.5453; return v - Math.floor(v); };
      return { x: rand(n), y: rand(n + 300), z: rand(n + 600), size: rand(n + 900) };
    });

    this.nextButton.addEventListener("click", () => {
      if (this.active && !this.exiting) this.onNext();
    });
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

  loadImage(path) {
    return new Promise((resolve, reject) => {
      const image = new Image();
      const timeout = setTimeout(() => reject(new Error(`Texture timeout: ${path}`)), 9000);
      image.onload = () => { clearTimeout(timeout); resolve(image); };
      image.onerror = () => { clearTimeout(timeout); reject(new Error(`Texture unavailable: ${path}`)); };
      image.src = path;
    });
  }

  prepare() {
    if (this.loading) return this.loading;
    this.loading = (async () => {
      const [moduleResult, surfaceResult, cloudsResult, roughnessResult, reliefResult] = await Promise.allSettled([
        import("./assets/vendor/three/three.module.min.js"),
        this.loadImage("assets/textures/earth-blue-marble-4k.jpg"),
        this.loadImage("assets/textures/earth-clouds-2k.png"),
        this.loadImage("assets/textures/earth-roughness-2k.jpg"),
        this.loadImage("assets/textures/earth-relief-2k.jpg")
      ]);

      this.surface = surfaceResult.status === "fulfilled" ? surfaceResult.value : this.makeProceduralSurface();
      this.cloudSurface = cloudsResult.status === "fulfilled" ? cloudsResult.value : null;
      this.roughnessSurface = roughnessResult.status === "fulfilled" ? roughnessResult.value : null;
      this.reliefSurface = reliefResult.status === "fulfilled" ? reliefResult.value : null;
      this.element.dataset.texture = surfaceResult.status === "fulfilled" ? "blue-marble" : "procedural";

      if (moduleResult.status === "fulfilled") {
        try { this.createThreeScene(moduleResult.value); }
        catch { this.createCanvasFallback(); }
      } else this.createCanvasFallback();
      this.resize();
      if (this.renderer?.compileAsync) await this.renderer.compileAsync(this.scene, this.camera).catch(() => {});
      if (this.active) this.render();
    })().catch(() => {
      this.surface = this.surface || this.makeProceduralSurface();
      try { this.createCanvasFallback(); }
      catch {
        this.mode = "css";
        this.element.dataset.renderer = "css";
        this.viewport.innerHTML = '<div class="earth-emergency-sphere"></div>';
      }
    });
    return this.loading;
  }

  makeProceduralSurface() {
    const canvas = document.createElement("canvas");
    canvas.width = 1024;
    canvas.height = 512;
    const ctx = canvas.getContext("2d");
    const ocean = ctx.createLinearGradient(0, 0, 0, 512);
    ocean.addColorStop(0, "#173f68");
    ocean.addColorStop(0.48, "#0d4775");
    ocean.addColorStop(1, "#082b4b");
    ctx.fillStyle = ocean;
    ctx.fillRect(0, 0, 1024, 512);
    ctx.fillStyle = "#667b46";
    ctx.beginPath(); ctx.ellipse(220, 195, 105, 68, -.35, 0, Math.PI * 2); ctx.fill();
    ctx.beginPath(); ctx.ellipse(545, 200, 165, 78, .12, 0, Math.PI * 2); ctx.fill();
    ctx.beginPath(); ctx.ellipse(760, 320, 70, 45, .15, 0, Math.PI * 2); ctx.fill();
    return canvas;
  }

  textureFromImage(THREE, image, { srgb = false, anisotropy = 1 } = {}) {
    if (!image) return null;
    const texture = new THREE.Texture(image);
    texture.needsUpdate = true;
    texture.colorSpace = srgb ? THREE.SRGBColorSpace : THREE.NoColorSpace;
    texture.anisotropy = anisotropy;
    return texture;
  }

  createThreeScene(THREE) {
    const canvas = document.createElement("canvas");
    const context = canvas.getContext("webgl2", { alpha: true, antialias: true, powerPreference: "high-performance" });
    if (!context) throw new Error("WebGL2 unavailable");

    this.THREE = THREE;
    this.renderer = new THREE.WebGLRenderer({ canvas, context, alpha: true, antialias: true });
    this.renderer.setClearColor(0x030812, 0);
    this.renderer.setPixelRatio(Math.min(devicePixelRatio || 1, 1.6));
    this.renderer.outputColorSpace = THREE.SRGBColorSpace;
    this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
    this.renderer.toneMappingExposure = 1.02;
    this.viewport.replaceChildren(canvas);

    this.scene = new THREE.Scene();
    this.camera = new THREE.PerspectiveCamera(36, 1, 0.1, 450);
    this.camera.position.z = 6;
    const maxAniso = Math.min(8, this.renderer.capabilities.getMaxAnisotropy());
    const surface = this.textureFromImage(THREE, this.surface, { srgb: true, anisotropy: maxAniso });
    const roughness = this.textureFromImage(THREE, this.roughnessSurface, { anisotropy: maxAniso });
    const relief = this.textureFromImage(THREE, this.reliefSurface, { anisotropy: maxAniso });
    const material = new THREE.MeshStandardMaterial({
      map: surface,
      roughnessMap: roughness,
      bumpMap: relief,
      bumpScale: 0.012,
      roughness: 0.76,
      metalness: 0
    });

    this.planet = new THREE.Mesh(new THREE.SphereGeometry(1, 128, 96), material);
    this.planet.rotation.z = -0.18;
    this.planetGroup = new THREE.Group();
    this.planetGroup.add(this.planet);
    this.scene.add(this.planetGroup);

    if (this.cloudSurface) {
      const cloudTexture = this.textureFromImage(THREE, this.cloudSurface, { srgb: true, anisotropy: maxAniso });
      this.clouds = new THREE.Mesh(
        new THREE.SphereGeometry(1.013, 128, 96),
        new THREE.MeshPhongMaterial({
          map: cloudTexture,
          alphaMap: cloudTexture,
          transparent: true,
          opacity: 0.55,
          depthWrite: false,
          color: 0xffffff,
          shininess: 4
        })
      );
      this.clouds.rotation.z = -0.18;
      this.planetGroup.add(this.clouds);
    }

    const sun = new THREE.DirectionalLight(0xfff0da, 3.75);
    sun.position.set(-4.6, 2.7, 4.5);
    this.scene.add(sun);
    this.scene.add(new THREE.AmbientLight(0x6b83a1, 0.11));
    const fill = new THREE.DirectionalLight(0x4175a8, 0.12);
    fill.position.set(4, -1.5, -3.5);
    this.scene.add(fill);

    this.atmosphere = new THREE.Mesh(new THREE.SphereGeometry(1.028, 96, 64), new THREE.ShaderMaterial({
      transparent: true,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
      vertexShader: `varying vec3 vWorld; varying vec3 vNormal;
        void main(){ vec4 world=modelMatrix*vec4(position,1.); vWorld=world.xyz;
        vNormal=normalize(mat3(modelMatrix)*normal); gl_Position=projectionMatrix*viewMatrix*world; }`,
      fragmentShader: `varying vec3 vWorld; varying vec3 vNormal;
        void main(){ vec3 n=normalize(vNormal); vec3 eye=normalize(cameraPosition-vWorld);
        float rim=pow(1.-max(dot(n,eye),0.),3.1);
        float light=max(dot(n,normalize(vec3(-4.6,2.7,4.5))),0.);
        gl_FragColor=vec4(.12,.43,1.,rim*(.16+.34*light)); }`
    }));
    this.planetGroup.add(this.atmosphere);

    const positions = new Float32Array(this.stars.length * 3);
    this.stars.forEach((star, i) => positions.set([(star.x - 0.5) * 190, (star.y - 0.5) * 140, -20 - star.z * 160], i * 3));
    const geometry = new THREE.BufferGeometry();
    geometry.setAttribute("position", new THREE.BufferAttribute(positions, 3));
    this.starfield = new THREE.Points(geometry, new THREE.PointsMaterial({ color: 0xb5c6dc, size: 0.13, transparent: true, opacity: 0.52, depthWrite: false, sizeAttenuation: true }));
    this.scene.add(this.starfield);

    canvas.addEventListener("webglcontextlost", event => {
      event.preventDefault();
      this.createCanvasFallback();
      this.resize();
      if (this.active) this.render();
    }, { once: true });

    this.mode = "webgl";
    this.element.dataset.renderer = this.mode;
  }

  createCanvasFallback() {
    this.renderer?.dispose();
    this.renderer = null;
    const canvas = document.createElement("canvas");
    const ctx = canvas.getContext("2d");
    if (!ctx) throw new Error("Canvas unavailable");
    this.canvas = canvas;
    this.ctx = ctx;
    this.viewport.replaceChildren(canvas);
    this.mode = "canvas";
    this.element.dataset.renderer = this.mode;
  }

  resize() {
    const parent = this.element.parentElement;
    this.width = parent.clientWidth;
    this.height = parent.clientHeight;
    this.mobile = this.width <= 700;
    const radius = this.mobile ? Math.min(this.width * 0.34, this.height * 0.20) : Math.min(this.height * 0.29, this.width * 0.23);
    this.finalRadius = radius;
    this.finalDistance = this.height / (2 * Math.tan(Math.PI / 10) * radius);
    if (this.mode === "webgl") {
      this.renderer.setSize(this.width, this.height);
      this.camera.aspect = this.width / this.height;
      this.camera.updateProjectionMatrix();
    } else if (this.mode === "canvas") {
      const dpr = Math.min(devicePixelRatio || 1, 1.5);
      this.canvas.width = this.width * dpr;
      this.canvas.height = this.height * dpr;
      this.ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    }
  }

  start({ approach = false } = {}) {
    this.active = true;
    this.time = 0;
    this.exiting = false;
    this.approaching = approach;
    this.exitStartedAt = 0;
    this.element.hidden = false;
    this.element.classList.remove("is-leaving");
    this.information.inert = true;
    this.information.classList.remove("is-visible");
    this.pointer.x = this.pointer.y = this.cameraOffset.x = this.cameraOffset.y = 0;
    this.prepare();
    this.resize();
    cancelAnimationFrame(this.frame);
    this.previous = performance.now();
    this.tick(this.previous);
  }

  beginExit() {
    if (!this.active || this.exiting) return;
    this.exiting = true;
    this.exitStartedAt = this.time;
    this.element.classList.add("is-leaving");
    this.information.inert = true;
    if (!this.frame) { this.previous = performance.now(); this.tick(this.previous); }
  }

  stop() {
    this.active = false;
    cancelAnimationFrame(this.frame);
    this.frame = null;
    this.element.hidden = true;
    this.element.style.opacity = "0";
    this.element.classList.remove("is-leaving");
    this.information.classList.remove("is-visible");
    this.information.inert = true;
    this.time = 0;
  }

  tick(now) {
    this.frame = null;
    if (!this.active || document.hidden) return;
    const delta = Math.min((now - this.previous) / 1000, 0.15);
    this.previous = now;
    this.time += delta;
    const damping = 1 - Math.exp(-delta * 2);
    this.cameraOffset.x += (this.pointer.x - this.cameraOffset.x) * damping;
    this.cameraOffset.y += (this.pointer.y - this.cameraOffset.y) * damping;
    this.render();
    if (!this.motion.matches || this.time < 9 || this.exiting || this.mode === "pending") this.frame = requestAnimationFrame(this.tick);
  }

  render() {
    const clamp = value => Math.max(0, Math.min(1, value));
    const smooth = value => { const v = clamp(value); return v * v * v * (v * (v * 6 - 15) + 10); };
    const t = this.time;
    const reveal = this.motion.matches ? 1 : smooth(t / 1.1);
    const framing = this.motion.matches ? 1 : smooth((t - 0.25) / (this.approaching ? 4.9 : 4.4));
    const infoReveal = this.motion.matches ? 1 : smooth((t - (this.approaching ? 4.6 : 4.3)) / 1.25);
    const exit = this.exiting ? smooth((t - this.exitStartedAt) / (this.motion.matches ? 0.01 : 4.5)) : 0;
    const exitFade = smooth((exit - 0.55) / 0.45);
    this.element.style.opacity = String(reveal * (1 - exitFade));

    if (infoReveal > 0.02 && !this.information.classList.contains("is-visible") && !this.exiting) {
      this.information.classList.add("is-visible");
      this.information.inert = false;
      document.getElementById("announcement").textContent = "Bumi, rumah kita. Planet ketiga dari Matahari.";
      if (document.activeElement === document.body || document.activeElement.id === "launch-button") this.title.focus({ preventScroll: true });
    }

    const drift = this.motion.matches ? 0 : Math.sin(t * 0.32) * 0.025;
    const rotation = 0.55 + (this.motion.matches ? 0 : t * 0.028);
    const introDistance = this.approaching
      ? this.finalDistance * (7.0 - 6.0 * framing)
      : this.finalDistance * (0.58 + framing * 0.42);
    const distance = introDistance * (1 + exit * 5.5);

    if (this.mode === "webgl") {
      const halfHeight = Math.tan(Math.PI / 10) * this.finalDistance;
      const groupX = this.mobile ? 0 : 0.23 * framing;
      const groupY = this.mobile ? 0.25 * framing : 0.055 * framing;
      this.planetGroup.position.set(halfHeight * this.camera.aspect * groupX, halfHeight * groupY + drift, 0);
      this.planet.rotation.y = rotation;
      this.planet.rotation.z = -0.18;
      if (this.clouds) {
        this.clouds.rotation.y = rotation * 1.012 + t * 0.004;
        this.clouds.rotation.z = -0.18;
      }
      if (this.starfield) {
        this.starfield.rotation.y = exit * 0.32;
        this.starfield.rotation.x = exit * 0.055;
      }
      const pointerStrength = 1 - infoReveal * 0.35;
      this.camera.position.set(
        this.motion.matches ? 0 : this.cameraOffset.x * 0.10 * pointerStrength,
        this.motion.matches ? 0 : -this.cameraOffset.y * 0.07 * pointerStrength,
        distance
      );
      this.camera.lookAt(0, 0, 0);
      this.renderer.render(this.scene, this.camera);
    } else if (this.mode === "canvas") {
      this.drawCanvasFallback(framing, rotation, distance, drift);
    } else if (this.mode === "css") {
      const planet = this.viewport.firstElementChild;
      if (!planet) return;
      const radius = this.finalRadius * this.finalDistance / distance;
      planet.style.width = planet.style.height = `${radius * 2}px`;
      planet.style.left = `${this.mobile ? 50 : 50 + 14 * framing}%`;
      planet.style.top = `${this.mobile ? 36 - 5 * framing : 50 - 3 * framing}%`;
      planet.style.backgroundPositionX = `${rotation * -95}px`;
      planet.style.transform = "translate(-50%, -50%) rotate(-10.3deg)";
    }
  }

  drawCanvasFallback(framing, rotation, distance, drift) {
    const ctx = this.ctx;
    const w = this.width;
    const h = this.height;
    ctx.clearRect(0, 0, w, h);
    for (const star of this.stars.slice(0, 110)) {
      ctx.fillStyle = `rgba(179,197,222,${0.12 + star.size * 0.35})`;
      ctx.fillRect(star.x * w, star.y * h, 0.5 + star.size, 0.5 + star.size);
    }
    const radius = this.finalRadius * this.finalDistance / distance;
    const cx = w * (this.mobile ? 0.5 : 0.5 + 0.14 * framing);
    const cy = h * (this.mobile ? 0.36 - 0.05 * framing : 0.5 - 0.03 * framing) + drift * 18;
    ctx.save();
    ctx.beginPath(); ctx.arc(cx, cy, radius, 0, Math.PI * 2); ctx.clip();
    const sourceWidth = this.surface.width;
    const shift = ((rotation / (Math.PI * 2)) % 1 + 1) % 1 * sourceWidth;
    const drawWidth = radius * Math.PI * 2;
    const x = cx - radius - (shift / sourceWidth) * drawWidth;
    ctx.drawImage(this.surface, x, cy - radius, drawWidth, radius * 2);
    ctx.drawImage(this.surface, x + drawWidth, cy - radius, drawWidth, radius * 2);
    const shade = ctx.createRadialGradient(cx - radius * 0.42, cy - radius * 0.28, radius * 0.05, cx, cy, radius * 1.08);
    shade.addColorStop(0, "rgba(255,255,255,.12)");
    shade.addColorStop(0.53, "rgba(15,40,72,.06)");
    shade.addColorStop(1, "rgba(0,3,10,.92)");
    ctx.fillStyle = shade; ctx.fillRect(cx - radius, cy - radius, radius * 2, radius * 2);
    ctx.restore();
    ctx.strokeStyle = "rgba(80,160,255,.24)";
    ctx.lineWidth = Math.max(1, radius * 0.012);
    ctx.beginPath(); ctx.arc(cx, cy, radius * 1.01, 0, Math.PI * 2); ctx.stroke();
  }
};
