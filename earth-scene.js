"use strict";

// NASA Blue Marble Next Generation surface mosaic, stored locally for reliable rendering.
const EARTH_SURFACE_TEXTURE = "assets/textures/earth-blue-marble-4k.jpg";
const MARS_TRAVEL_TEXTURE = "assets/textures/mars-surface-2k.jpg";

// Earth owns the post-launch Earth view and the lightweight planet-to-planet travel bridge.
// The existing Mars renderer still owns the actual Mars arrival/exploration scene.
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
    this.travelMode = null;
    this.travelStartedAt = 0;
    this.travelDuration = 6.2;
    this.travelRevealFired = false;
    this.travelCoveredFired = false;
    this.travelCompleteFired = false;
    this.travelCallbacks = {};
    this.pointer = { x: 0, y: 0 };
    this.cameraOffset = { x: 0, y: 0 };
    this.tick = this.tick.bind(this);

    this.stars = Array.from({ length: 220 }, (_, n) => {
      const rand = seed => { const v = Math.sin(seed * 113.7 + 283.1) * 43758.5453; return v - Math.floor(v); };
      return { x: rand(n), y: rand(n + 300), z: rand(n + 600), size: rand(n + 900) };
    });

    this.nextButton.addEventListener("click", () => {
      if (this.active && !this.travelMode) this.onNext();
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
      if (event.pointerType !== "mouse" || this.motion.matches || this.travelMode) return;
      const rect = this.element.getBoundingClientRect();
      this.pointer.x = (event.clientX - rect.left) / rect.width - 0.5;
      this.pointer.y = (event.clientY - rect.top) / rect.height - 0.5;
    });
    this.element.addEventListener("pointerleave", () => { this.pointer.x = this.pointer.y = 0; });
  }

  loadImage(src) {
    return new Promise((resolve, reject) => {
      const image = new Image();
      image.decoding = "async";
      image.onload = () => resolve(image);
      image.onerror = reject;
      image.src = src;
    });
  }

  prepare() {
    if (this.loading) return this.loading;
    this.loading = Promise.all([
      this.loadImage(EARTH_SURFACE_TEXTURE),
      this.loadImage(MARS_TRAVEL_TEXTURE),
      import("./assets/vendor/three/three.module.min.js")
    ])
      .then(([earthSurface, marsSurface, THREE]) => {
        this.surface = earthSurface;
        this.marsSurface = marsSurface;
        try { this.createThreeScene(THREE); }
        catch { this.createCanvasFallback(); }
        this.resize();
        if (this.renderer?.compileAsync) return this.renderer.compileAsync(this.scene, this.camera);
      })
      .catch(async () => {
        try {
          if (!this.surface) this.surface = await this.loadImage(EARTH_SURFACE_TEXTURE);
          if (!this.marsSurface) this.marsSurface = await this.loadImage(MARS_TRAVEL_TEXTURE);
          this.createCanvasFallback();
          this.resize();
        } catch {
          this.mode = "css";
          this.element.dataset.renderer = "css";
          this.viewport.innerHTML = '<div class="earth-emergency-sphere"></div>';
          this.resize();
        }
      })
      .finally(() => { if (this.active) this.render(); });
    return this.loading;
  }

  makeAtmosphere(THREE, color, strength = 0.26, radius = 1.024) {
    return new THREE.Mesh(new THREE.SphereGeometry(radius, 72, 48), new THREE.ShaderMaterial({
      transparent: true,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
      uniforms: { glowColor: { value: new THREE.Color(color) }, glowStrength: { value: strength } },
      vertexShader: `varying vec3 vWorld; varying vec3 vNormal;
        void main(){ vec4 world=modelMatrix*vec4(position,1.); vWorld=world.xyz;
        vNormal=normalize(mat3(modelMatrix)*normal); gl_Position=projectionMatrix*viewMatrix*world; }`,
      fragmentShader: `uniform vec3 glowColor; uniform float glowStrength; varying vec3 vWorld; varying vec3 vNormal;
        void main(){ vec3 n=normalize(vNormal); vec3 eye=normalize(cameraPosition-vWorld);
        float rim=pow(1.-max(dot(n,eye),0.),3.4);
        gl_FragColor=vec4(glowColor,rim*glowStrength); }`
    }));
  }

  createTexture(THREE, image, anisotropy) {
    const texture = new THREE.Texture(image);
    texture.needsUpdate = true;
    texture.colorSpace = THREE.SRGBColorSpace;
    texture.anisotropy = Math.min(anisotropy, this.renderer.capabilities.getMaxAnisotropy());
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
    this.renderer.toneMappingExposure = 1.04;
    this.viewport.replaceChildren(canvas);

    this.scene = new THREE.Scene();
    this.camera = new THREE.PerspectiveCamera(36, 1, 0.1, 450);
    this.camera.position.z = 6;

    const sphere = new THREE.SphereGeometry(1, 128, 96);
    const earthTexture = this.createTexture(THREE, this.surface, 8);
    const earthMaterial = new THREE.MeshStandardMaterial({
      map: earthTexture,
      roughness: 0.76,
      metalness: 0,
      transparent: true,
      opacity: 1
    });
    this.planet = new THREE.Mesh(sphere, earthMaterial);
    this.planetGroup = new THREE.Group();
    this.planetGroup.add(this.planet);
    this.atmosphere = this.makeAtmosphere(THREE, 0x3e8fe7, 0.25, 1.025);
    this.planetGroup.add(this.atmosphere);
    this.scene.add(this.planetGroup);

    const marsTexture = this.createTexture(THREE, this.marsSurface, 8);
    this.travelMarsMaterial = new THREE.MeshStandardMaterial({
      map: marsTexture,
      roughness: 0.96,
      metalness: 0,
      transparent: true,
      opacity: 0
    });
    this.travelMars = new THREE.Mesh(sphere.clone(), this.travelMarsMaterial);
    this.travelMarsGroup = new THREE.Group();
    this.travelMarsGroup.add(this.travelMars);
    this.travelMarsAtmosphere = this.makeAtmosphere(THREE, 0xb96542, 0.095, 1.018);
    this.travelMarsAtmosphere.material.opacity = 0;
    this.travelMarsGroup.add(this.travelMarsAtmosphere);
    this.travelMarsGroup.visible = false;
    this.scene.add(this.travelMarsGroup);

    const sun = new THREE.DirectionalLight(0xffefd7, 3.35);
    sun.position.set(-4.8, 2.9, 4.6);
    this.scene.add(sun);
    this.scene.add(new THREE.AmbientLight(0x54759f, 0.095));
    const fill = new THREE.DirectionalLight(0x2c5c92, 0.10);
    fill.position.set(3, -1.5, -2);
    this.scene.add(fill);

    const positions = new Float32Array(this.stars.length * 3);
    this.stars.forEach((star, i) => positions.set([(star.x - 0.5) * 190, (star.y - 0.5) * 140, -20 - star.z * 160], i * 3));
    const geometry = new THREE.BufferGeometry();
    geometry.setAttribute("position", new THREE.BufferAttribute(positions, 3));
    this.starfield = new THREE.Points(geometry, new THREE.PointsMaterial({
      color: 0xb5c6dc,
      size: 0.13,
      transparent: true,
      opacity: 0.52,
      depthWrite: false,
      sizeAttenuation: true
    }));
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

  start({ settled = false } = {}) {
    this.active = true;
    this.time = settled ? 6 : 0;
    this.travelMode = null;
    this.travelCallbacks = {};
    this.travelCompleteFired = false;
    this.element.hidden = false;
    this.element.classList.remove("is-leaving");
    this.information.inert = !settled;
    this.information.classList.toggle("is-visible", settled);
    this.pointer.x = this.pointer.y = this.cameraOffset.x = this.cameraOffset.y = 0;
    this.prepare();
    this.resize();
    cancelAnimationFrame(this.frame);
    this.previous = performance.now();
    this.tick(this.previous);
  }

  beginTravelToMars({ onReveal, onComplete } = {}) {
    if (!this.active || this.travelMode) return;
    this.travelMode = "to-mars";
    this.travelStartedAt = this.time;
    this.travelDuration = this.motion.matches ? 0.4 : 6.2;
    this.travelRevealFired = false;
    this.travelCompleteFired = false;
    this.travelCallbacks = { onReveal, onComplete };
    this.element.classList.add("is-leaving");
    this.information.inert = true;
    this.pointer.x = this.pointer.y = 0;
    if (!this.frame) { this.previous = performance.now(); this.tick(this.previous); }
  }

  beginTravelFromMars({ onCovered, onComplete, marsRotation = 0.9024 } = {}) {
    if (this.active && this.travelMode) return;
    this.active = true;
    this.time = 0;
    this.travelMode = "to-earth";
    this.travelStartedAt = 0;
    this.travelDuration = this.motion.matches ? 0.4 : 6.2;
    this.travelCoveredFired = false;
    this.travelCompleteFired = false;
    this.travelCallbacks = { onCovered, onComplete };
    this.travelMarsStartRotation = marsRotation;
    this.element.hidden = false;
    this.element.style.opacity = "0";
    this.element.classList.add("is-leaving");
    this.information.classList.remove("is-visible");
    this.information.inert = true;
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
    this.element.classList.remove("is-leaving");
    this.information.classList.remove("is-visible");
    this.information.inert = true;
    this.travelMode = null;
    this.travelCallbacks = {};
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
    if (!this.motion.matches || this.time < 8 || this.travelMode || this.mode === "pending") this.frame = requestAnimationFrame(this.tick);
  }

  clamp(value) { return Math.max(0, Math.min(1, value)); }
  smooth(value) {
    const v = this.clamp(value);
    return v * v * v * (v * (v * 6 - 15) + 10);
  }

  render() {
    if (this.travelMode) this.renderTravel();
    else this.renderEarth();
  }

  normalLayout() {
    const halfHeight = Math.tan(Math.PI / 10) * this.finalDistance;
    return {
      halfHeight,
      x: halfHeight * (this.camera?.aspect || this.width / this.height) * (this.mobile ? 0 : 0.23),
      y: halfHeight * (this.mobile ? 0.25 : 0.055)
    };
  }

  renderEarth() {
    const t = this.time;
    const reveal = this.motion.matches ? 1 : this.smooth(t / 1.25);
    const framing = this.motion.matches ? 1 : this.smooth((t - 0.35) / 4.4);
    const infoReveal = this.motion.matches ? 1 : this.smooth((t - 4.3) / 1.35);
    this.element.style.opacity = String(reveal);

    if (infoReveal > 0.02 && !this.information.classList.contains("is-visible")) {
      this.information.classList.add("is-visible");
      this.information.inert = false;
      document.getElementById("announcement").textContent = "Bumi, rumah kita. Planet ketiga dari Matahari.";
      if (document.activeElement === document.body || document.activeElement.id === "launch-button") this.title.focus({ preventScroll: true });
    }

    const drift = this.motion.matches ? 0 : Math.sin(t * 0.32) * 0.025;
    const rotation = 4.58 + (this.motion.matches ? 0 : t * 0.026);
    const distance = this.finalDistance * (0.58 + framing * 0.42);

    if (this.mode === "webgl") {
      const layout = this.normalLayout();
      this.travelMarsGroup.visible = false;
      this.planetGroup.visible = true;
      this.planetGroup.position.set(layout.x * framing, layout.y * framing + drift, 0);
      this.planet.rotation.set(0, rotation, -0.18);
      const pointerStrength = 1 - infoReveal * 0.35;
      this.camera.position.set(
        this.motion.matches ? 0 : this.cameraOffset.x * 0.10 * pointerStrength,
        this.motion.matches ? 0 : -this.cameraOffset.y * 0.07 * pointerStrength,
        distance
      );
      this.camera.lookAt(0, 0, 0);
      this.renderer.render(this.scene, this.camera);
    } else if (this.mode === "canvas") {
      this.drawCanvasEarth(framing, rotation, distance, drift);
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

  travelState() {
    const elapsed = this.time - this.travelStartedAt;
    const progress = this.smooth(elapsed / this.travelDuration);
    const pullback = this.smooth(progress / 0.31);
    const pan = this.smooth((progress - 0.23) / 0.39);
    const approach = this.smooth((progress - 0.58) / 0.42);
    return { elapsed, progress, pullback, pan, approach };
  }

  renderTravel() {
    const state = this.travelState();
    const reverse = this.travelMode === "to-earth";
    const layout = this.normalLayout();
    const aspect = this.camera?.aspect || this.width / this.height;
    const separation = layout.halfHeight * aspect * (this.mobile ? 3.9 : 3.25);
    const marsDestinationX = layout.halfHeight * aspect * (this.mobile ? 0 : 0.28);
    const marsDestinationY = layout.halfHeight * (this.mobile ? 0.28 : 0.10);
    const destinationCameraX = separation + layout.x - marsDestinationX;
    const cameraX = destinationCameraX * (reverse ? 1 - state.pan : state.pan);
    const cameraZ = this.finalDistance * (1 + 1.55 * state.pullback * (1 - state.approach));
    const earthOpacity = reverse ? this.smooth((state.progress - 0.27) / 0.19) : 1;
    const marsOpacity = reverse ? 1 : this.smooth((state.progress - 0.28) / 0.20);
    const earthRotation = 4.72 + this.time * 0.024;
    const marsRotation = reverse
      ? (this.travelMarsStartRotation ?? 0.9024) + state.progress * 0.08
      : 0.62 + state.progress * (0.9024 - 0.62);
    const overlayOpacity = reverse ? this.smooth(state.progress / 0.075) : 1;
    this.element.style.opacity = String(overlayOpacity);

    if (!reverse && state.progress >= 0.86 && !this.travelRevealFired) {
      this.travelRevealFired = true;
      this.travelCallbacks.onReveal?.();
    }
    if (reverse && state.progress >= 0.10 && !this.travelCoveredFired) {
      this.travelCoveredFired = true;
      this.travelCallbacks.onCovered?.();
    }

    if (this.mode === "webgl") {
      this.planetGroup.visible = earthOpacity > 0.002;
      this.travelMarsGroup.visible = marsOpacity > 0.002;
      this.planetGroup.position.set(layout.x, layout.y, 0);
      this.travelMarsGroup.position.set(layout.x + separation, marsDestinationY, 0);
      this.planet.rotation.set(0, earthRotation, -0.18);
      this.travelMars.rotation.set(0.09, marsRotation, -0.07);
      this.planet.material.opacity = earthOpacity;
      this.atmosphere.material.uniforms.glowStrength.value = 0.25 * earthOpacity;
      this.travelMarsMaterial.opacity = marsOpacity;
      this.travelMarsAtmosphere.material.uniforms.glowStrength.value = 0.095 * marsOpacity;

      this.camera.position.set(cameraX, 0, cameraZ);
      const lookOffset = Math.sin(state.pan * Math.PI) * separation * 0.055 * (reverse ? -1 : 1);
      this.camera.lookAt(cameraX + lookOffset, 0, 0);
      this.renderer.render(this.scene, this.camera);
    } else if (this.mode === "canvas") {
      this.drawCanvasTravel(state, reverse, earthOpacity, marsOpacity);
    } else if (this.mode === "css") {
      const planet = this.viewport.firstElementChild;
      if (planet) {
        const radius = this.finalRadius * this.finalDistance / cameraZ;
        const screenPan = reverse ? 1 - state.pan : state.pan;
        planet.style.width = planet.style.height = `${radius * 2}px`;
        planet.style.left = `${64 - screenPan * 95}%`;
        planet.style.top = "47%";
        planet.style.opacity = String(earthOpacity);
      }
    }

    if (state.progress >= 0.999 && !this.travelCompleteFired) {
      this.travelCompleteFired = true;
      const callback = this.travelCallbacks.onComplete;
      if (reverse) {
        this.travelMode = null;
        this.travelCallbacks = {};
        this.time = 6;
        this.element.classList.remove("is-leaving");
        this.element.style.opacity = "1";
        this.information.classList.add("is-visible");
        this.information.inert = false;
        document.getElementById("announcement").textContent = "Kembali ke Bumi.";
      }
      callback?.();
    }
  }

  drawTexturedDisc(image, cx, cy, radius, rotation, opacity, atmosphereColor) {
    if (!image || opacity <= 0.002) return;
    const ctx = this.ctx;
    ctx.save();
    ctx.globalAlpha = opacity;
    ctx.beginPath();
    ctx.arc(cx, cy, radius, 0, Math.PI * 2);
    ctx.clip();
    const sourceWidth = image.width;
    const shift = ((rotation / (Math.PI * 2)) % 1 + 1) % 1 * sourceWidth;
    const drawWidth = radius * Math.PI * 2;
    const x = cx - radius - (shift / sourceWidth) * drawWidth;
    ctx.drawImage(image, x, cy - radius, drawWidth, radius * 2);
    ctx.drawImage(image, x + drawWidth, cy - radius, drawWidth, radius * 2);
    const shade = ctx.createRadialGradient(cx - radius * 0.42, cy - radius * 0.28, radius * 0.04, cx, cy, radius * 1.08);
    shade.addColorStop(0, "rgba(255,245,225,.12)");
    shade.addColorStop(0.55, "rgba(12,28,48,.06)");
    shade.addColorStop(1, "rgba(0,3,10,.90)");
    ctx.fillStyle = shade;
    ctx.fillRect(cx - radius, cy - radius, radius * 2, radius * 2);
    ctx.restore();
    ctx.save();
    ctx.globalAlpha = opacity * 0.42;
    ctx.strokeStyle = atmosphereColor;
    ctx.lineWidth = Math.max(1, radius * 0.012);
    ctx.beginPath();
    ctx.arc(cx, cy, radius * 1.01, 0, Math.PI * 2);
    ctx.stroke();
    ctx.restore();
  }

  drawStars() {
    const ctx = this.ctx;
    for (const star of this.stars.slice(0, 110)) {
      ctx.fillStyle = `rgba(179,197,222,${0.12 + star.size * 0.35})`;
      ctx.fillRect(star.x * this.width, star.y * this.height, 0.5 + star.size, 0.5 + star.size);
    }
  }

  drawCanvasEarth(framing, rotation, distance, drift) {
    const ctx = this.ctx;
    const w = this.width;
    const h = this.height;
    ctx.clearRect(0, 0, w, h);
    this.drawStars();
    const radius = this.finalRadius * this.finalDistance / distance;
    const cx = w * (this.mobile ? 0.5 : 0.5 + 0.14 * framing);
    const cy = h * (this.mobile ? 0.36 - 0.05 * framing : 0.5 - 0.03 * framing) + drift * 18;
    this.drawTexturedDisc(this.surface, cx, cy, radius, rotation, 1, "rgba(80,160,255,.45)");
  }

  drawCanvasTravel(state, reverse, earthOpacity, marsOpacity) {
    const ctx = this.ctx;
    const w = this.width;
    const h = this.height;
    ctx.clearRect(0, 0, w, h);
    this.drawStars();
    const cameraScale = 1 + 1.55 * state.pullback * (1 - state.approach);
    const radius = this.finalRadius / cameraScale;
    const pan = reverse ? 1 - state.pan : state.pan;
    const earthX = w * (this.mobile ? 0.5 : 0.64) - pan * w * 1.08;
    const marsX = earthX + w * 1.08;
    const cy = h * (this.mobile ? 0.36 : 0.47);
    this.drawTexturedDisc(this.surface, earthX, cy, radius, 4.72 + this.time * 0.024, earthOpacity, "rgba(80,160,255,.45)");
    this.drawTexturedDisc(this.marsSurface, marsX, cy, radius, 0.62 + this.time * 0.021, marsOpacity, "rgba(212,117,76,.30)");
  }
};
