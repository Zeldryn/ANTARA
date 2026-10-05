"use strict";

// Earth introduction scene. It reuses the project's local Three.js build and keeps
// its own renderer so the existing Mars scene can remain untouched.
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

  prepare() {
    if (this.loading) return this.loading;
    this.loading = import("./assets/vendor/three/three.module.min.js")
      .then(THREE => {
        this.surface = this.makeProceduralSurface();
        try { this.createThreeScene(THREE); }
        catch { this.createCanvasFallback(); }
        this.resize();
        if (this.renderer) return this.renderer.compileAsync(this.scene, this.camera);
      })
      .catch(() => {
        this.surface = this.makeProceduralSurface();
        try { this.createCanvasFallback(); }
        catch {
          this.mode = "css";
          this.element.dataset.renderer = "css";
          this.viewport.innerHTML = '<div class="earth-emergency-sphere"></div>';
        }
      })
      .finally(() => { if (this.active) this.render(); });
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

    const land = (points, fill) => {
      ctx.beginPath();
      ctx.moveTo(points[0][0], points[0][1]);
      points.slice(1).forEach(point => ctx.lineTo(point[0], point[1]));
      ctx.closePath();
      ctx.fillStyle = fill;
      ctx.fill();
    };

    // Broad continent silhouettes. They are intentionally restrained because the
    // scene is an educational introduction, not a geographic map interface.
    land([[48,120],[93,78],[164,70],[207,106],[231,151],[201,188],[153,181],[116,207],[80,176]], "#687b43");
    land([[197,190],[232,203],[257,256],[251,326],[226,393],[198,365],[183,301],[175,239]], "#526f3d");
    land([[430,112],[474,76],[560,74],[621,101],[690,96],[759,126],[806,155],[783,184],[722,186],[680,165],[626,178],[575,169],[535,144],[493,154]], "#6d7d48");
    land([[486,181],[545,174],[590,208],[608,273],[584,343],[548,389],[509,342],[490,278],[470,222]], "#607a42");
    land([[747,292],[793,279],[842,303],[850,340],[816,361],[775,349]], "#657948");
    land([[943,323],[978,317],[998,342],[983,365],[950,360]], "#6e7e4c");
    land([[326,77],[354,63],[380,74],[369,103],[338,107]], "#798653");

    // Arid regions add the warm mineral variation visible from orbit.
    land([[470,182],[532,177],[577,203],[567,233],[514,238],[478,216]], "#9a8254");
    land([[633,126],[688,112],[728,131],[708,153],[659,156]], "#8f8051");
    land([[775,298],[820,295],[842,316],[817,337],[786,330]], "#8e7e54");

    // Polar ice.
    ctx.fillStyle = "#d7e2df";
    ctx.fillRect(0, 0, 1024, 20);
    ctx.fillStyle = "#c7d5d3";
    ctx.fillRect(0, 492, 1024, 20);

    // Soft cloud bands keep the planet visually alive without a separate texture.
    ctx.lineCap = "round";
    for (let i = 0; i < 34; i++) {
      const seed = Math.sin(i * 71.31) * 10000;
      const x = ((seed - Math.floor(seed)) * 1120) - 48;
      const ySeed = Math.sin((i + 50) * 51.13) * 10000;
      const y = 45 + (ySeed - Math.floor(ySeed)) * 410;
      const lengthSeed = Math.sin((i + 90) * 91.9) * 10000;
      const length = 45 + (lengthSeed - Math.floor(lengthSeed)) * 120;
      ctx.strokeStyle = `rgba(235,244,247,${0.10 + (i % 4) * 0.025})`;
      ctx.lineWidth = 5 + (i % 5) * 2;
      ctx.beginPath();
      ctx.moveTo(x, y);
      ctx.bezierCurveTo(x + length * 0.3, y - 10, x + length * 0.65, y + 12, x + length, y - 3);
      ctx.stroke();
    }
    return canvas;
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

    const texture = new THREE.CanvasTexture(this.surface);
    texture.colorSpace = THREE.SRGBColorSpace;
    texture.anisotropy = Math.min(4, this.renderer.capabilities.getMaxAnisotropy());
    const material = new THREE.MeshStandardMaterial({ map: texture, roughness: 0.84, metalness: 0 });
    this.planet = new THREE.Mesh(new THREE.SphereGeometry(1, 96, 64), material);
    this.planet.rotation.z = -0.18;
    this.planetGroup = new THREE.Group();
    this.planetGroup.add(this.planet);
    this.scene.add(this.planetGroup);

    const sun = new THREE.DirectionalLight(0xfff0d8, 3.25);
    sun.position.set(-4.5, 2.7, 4.2);
    this.scene.add(sun, new THREE.AmbientLight(0x7996bd, 0.22));
    const fill = new THREE.DirectionalLight(0x4f88c7, 0.22);
    fill.position.set(3, -1, -2);
    this.scene.add(fill);

    this.atmosphere = new THREE.Mesh(new THREE.SphereGeometry(1.025, 64, 40), new THREE.ShaderMaterial({
      transparent: true,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
      vertexShader: `varying vec3 vWorld; varying vec3 vNormal;
        void main(){ vec4 world=modelMatrix*vec4(position,1.); vWorld=world.xyz;
        vNormal=normalize(mat3(modelMatrix)*normal); gl_Position=projectionMatrix*viewMatrix*world; }`,
      fragmentShader: `varying vec3 vWorld; varying vec3 vNormal;
        void main(){ vec3 n=normalize(vNormal); vec3 eye=normalize(cameraPosition-vWorld);
        float rim=pow(1.-max(dot(n,eye),0.),3.2);
        gl_FragColor=vec4(.16,.48,.95,rim*.38); }`
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

  start() {
    this.active = true;
    this.time = 0;
    this.exiting = false;
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
    if (!this.frame) {
      this.previous = performance.now();
      this.tick(this.previous);
    }
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
    if (!this.motion.matches || this.time < 8 || this.exiting || this.mode === "pending") this.frame = requestAnimationFrame(this.tick);
  }

  render() {
    const clamp = value => Math.max(0, Math.min(1, value));
    const smooth = value => { const v = clamp(value); return v * v * v * (v * (v * 6 - 15) + 10); };
    const t = this.time;
    const reveal = this.motion.matches ? 1 : smooth(t / 1.25);
    const framing = this.motion.matches ? 1 : smooth((t - 0.35) / 4.4);
    const infoReveal = this.motion.matches ? 1 : smooth((t - 4.3) / 1.35);
    const exit = this.exiting ? smooth((t - this.exitStartedAt) / (this.motion.matches ? 0.01 : 1.1)) : 0;
    const opacity = reveal * (1 - exit);
    this.element.style.opacity = String(opacity);

    if (infoReveal > 0.02 && !this.information.classList.contains("is-visible")) {
      this.information.classList.add("is-visible");
      this.information.inert = false;
      document.getElementById("announcement").textContent = "Bumi, rumah kita. Planet ketiga dari Matahari.";
      if (document.activeElement === document.body || document.activeElement.id === "launch-button") this.title.focus({ preventScroll: true });
    }

    const drift = this.motion.matches ? 0 : Math.sin(t * 0.32) * 0.025;
    const rotation = 0.55 + (this.motion.matches ? 0 : t * 0.035);
    const distance = this.finalDistance * (0.58 + framing * 0.42 + exit * 0.18);

    if (this.mode === "webgl") {
      const halfHeight = Math.tan(Math.PI / 10) * this.finalDistance;
      const groupX = this.mobile ? 0 : 0.23 * framing;
      const groupY = this.mobile ? 0.25 * framing : 0.055 * framing;
      this.planetGroup.position.set(halfHeight * this.camera.aspect * groupX, halfHeight * groupY + drift, 0);
      this.planet.rotation.y = rotation;
      this.planet.rotation.z = -0.18;
      this.atmosphere.rotation.y = rotation * 0.965;
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
      planet.style.transform = `translate(-50%, -50%) rotate(${-10.3}deg)`;
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
    ctx.beginPath();
    ctx.arc(cx, cy, radius, 0, Math.PI * 2);
    ctx.clip();
    const sourceWidth = this.surface.width;
    const sourceHeight = this.surface.height;
    const shift = ((rotation / (Math.PI * 2)) % 1 + 1) % 1 * sourceWidth;
    const drawWidth = radius * Math.PI * 2;
    const x = cx - radius - (shift / sourceWidth) * drawWidth;
    ctx.drawImage(this.surface, x, cy - radius, drawWidth, radius * 2);
    ctx.drawImage(this.surface, x + drawWidth, cy - radius, drawWidth, radius * 2);
    const shade = ctx.createRadialGradient(cx - radius * 0.42, cy - radius * 0.28, radius * 0.05, cx, cy, radius * 1.08);
    shade.addColorStop(0, "rgba(255,255,255,.18)");
    shade.addColorStop(0.55, "rgba(20,50,80,.08)");
    shade.addColorStop(1, "rgba(0,4,12,.88)");
    ctx.fillStyle = shade;
    ctx.fillRect(cx - radius, cy - radius, radius * 2, radius * 2);
    ctx.restore();
    ctx.strokeStyle = "rgba(80,160,255,.20)";
    ctx.lineWidth = Math.max(1, radius * 0.012);
    ctx.beginPath();
    ctx.arc(cx, cy, radius * 1.01, 0, Math.PI * 2);
    ctx.stroke();
  }
};
