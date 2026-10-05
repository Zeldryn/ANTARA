"use strict";

// Scene two owns its renderer and animation loop. Loading is local and optional:
// the flight controller never waits for WebGL, a module, or an image to succeed.
window.MarsScene = class MarsScene {
  constructor() {
    this.element = document.getElementById("mars-scene");
    this.viewport = document.getElementById("mars-viewport");
    this.caption = this.element.querySelector(".mars-caption");
    this.credit = this.element.querySelector(".mars-credit");
    this.motion = window.matchMedia("(prefers-reduced-motion: reduce)");
    this.active = false;
    this.time = 0;
    this.frame = null;
    this.mode = "pending";
    this.pointer = { x: 0, y: 0 };
    this.cameraOffset = { x: 0, y: 0 };
    this.caption.inert = true;
    this.stars = Array.from({ length: 240 }, (_, n) => {
      const rand = seed => { const v = Math.sin(seed * 127.1 + 417.3) * 43758.5453; return v - Math.floor(v); };
      return { x: rand(n), y: rand(n + 400), z: rand(n + 800), size: rand(n + 1200) };
    });
    this.tick = this.tick.bind(this);
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
    this.caption.inert = true;
    this.caption.classList.remove("is-visible");
    this.caption.style.opacity = "0";
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
    this.caption.inert = true;
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
    this.render();
    if (!this.motion.matches || this.time < 14 || this.mode === "pending") this.frame = requestAnimationFrame(this.tick);
  }

  render() {
    const smooth = value => { const v = Math.max(0, Math.min(1, value)); return v * v * v * (v * (v * 6 - 15) + 10); };
    const t = this.time;
    const approach = this.motion.matches ? 1 : smooth((t - 0.6) / 12);
    this.distance = this.finalDistance * Math.pow(15, 1 - approach);
    const rotation = this.motion.matches ? 0.6 : 0.6 + t * 0.024;
    const reveal = smooth(t / (this.motion.matches ? 1 : 1.8));
    this.element.style.opacity = String(reveal);
    const caption = smooth((t - (this.motion.matches ? 1 : 9)) / 2.5);
    this.caption.style.opacity = String(caption);
    this.caption.style.transform = `translateY(${this.motion.matches ? 0 : (1 - caption) * 12}px)`;
    this.credit.style.opacity = String(caption * 0.9);
    this.credit.tabIndex = caption > 0.5 ? 0 : -1;
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
      this.planetGroup.position.set(this.mobile ? 0 : halfHeight * this.camera.aspect * 0.28, halfHeight * (this.mobile ? 0.28 : 0.1) + drift, 0);
      this.planet.rotation.y = rotation;
      this.camera.position.set(this.motion.matches ? 0 : this.cameraOffset.x * 0.13, this.motion.matches ? 0 : -this.cameraOffset.y * 0.09, this.distance);
      this.camera.lookAt(0, 0, 0);
      this.renderer.render(this.scene, this.camera);
    } else if (this.mode === "canvas") {
      // Software sphere: inverse spherical UV mapping + Lambert sunlight. Texture
      // features foreshorten at the limb and rotate through it, unlike a flat disc.
      this.drawFallback(rotation, approach, drift);
    } else if (this.mode === "css") {
      const planet = this.viewport.firstElementChild;
      const radius = this.finalRadius * this.finalDistance / this.distance;
      planet.style.width = planet.style.height = `${radius * 2}px`;
      planet.style.backgroundPositionX = `${-rotation * 100}px`;
      planet.style.left = `${this.mobile ? 50 : 64}%`;
      planet.style.top = `${this.mobile ? 36 : 45}%`;
    }
  }

  drawFallback(rotation, approach, drift) {
    const ctx = this.ctx;
    const w = this.width, h = this.height;
    ctx.clearRect(0, 0, w, h);
    for (const star of this.stars.slice(0, 110)) {
      ctx.fillStyle = `rgba(179,197,222,${0.12 + star.size * 0.35})`;
      ctx.fillRect(star.x * w, star.y * h, 0.5 + star.size, 0.5 + star.size);
    }
    const data = this.sphereImage.data;
    for (let y = 0; y < 360; y++) for (let x = 0; x < 360; x++) {
      const nx = (x + 0.5) / 180 - 1, ny = 1 - (y + 0.5) / 180;
      const r2 = nx * nx + ny * ny;
      const i = (y * 360 + x) * 4;
      if (r2 > 1) { data[i + 3] = 0; continue; }
      const nz = Math.sqrt(1 - r2);
      const u = ((Math.atan2(nz, nx) + rotation) / (Math.PI * 2) + 1) % 1;
      const v = Math.acos(ny) / Math.PI;
      const j = (Math.min(511, Math.floor(v * 512)) * 1024 + Math.floor(u * 1024)) * 4;
      const light = 0.045 + Math.max(0, nx * -0.6 + ny * 0.43 + nz * 0.67) * 1.12;
      data[i] = Math.min(255, this.surfacePixels[j] * light);
      data[i + 1] = Math.min(255, this.surfacePixels[j + 1] * light * 0.97);
      data[i + 2] = Math.min(255, this.surfacePixels[j + 2] * light * 0.93);
      data[i + 3] = Math.min(255, (1 - r2) * 180 * 255);
    }
    this.sphereContext.putImageData(this.sphereImage, 0, 0);
    const radius = this.finalRadius * this.finalDistance / this.distance;
    const cx = w * (0.5 + (this.mobile ? 0 : 0.14 * approach));
    const cy = h * (0.5 - (this.mobile ? 0.14 : 0.05) * approach) - drift * 50;
    ctx.drawImage(this.sphereCanvas, cx - radius, cy - radius, radius * 2, radius * 2);
  }
};
