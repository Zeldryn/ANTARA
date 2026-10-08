"use strict";

(() => {
  const TERRARIUM_TEMPLATE = "https://s3.amazonaws.com/elevation-tiles-prod/terrarium/{z}/{x}/{y}.png";
  const MAPZEN_SOURCE = "Mapzen Terrain Tiles · Amazon Public Dataset";
  const KM_PER_DEG_LAT = 111.32;
  const EARTH_RADIUS_KM = 6371.0088;
  const DEG = Math.PI / 180;
  const STATES = Object.freeze({ IDLE: "idle", SELECTING: "selecting", PREPARING: "preparing", ACTIVE: "active", EXITING: "exiting" });

  const REGIONS = Object.freeze([
    {
      id: "everest",
      name: "Everest / Himalaya",
      short: "Himalaya",
      latitude: 27.9881,
      longitude: 86.9253,
      zoom: 11,
      mode: "land",
      terrainStyle: "alpine",
      feature: "Puncak Everest",
      sourceLabel: "Terrarium DEM · global SRTM / open elevation composite",
      sourceDetail: "Mapzen Terrain Tiles menggabungkan SRTM 30 m secara global bersama sumber elevasi terbuka lain. Bentuk terrain yang dirender berasal dari nilai elevasi tile, bukan noise procedural.",
      startAltitude: 3.2,
      maxClearance: 14,
      pitch: -0.22,
      yaw: 0.02,
      educational: ["Everest summit", "Lhotse", "Pembentukan Himalaya akibat tumbukan India–Eurasia"]
    },
    {
      id: "mariana",
      name: "Mariana / Challenger Deep",
      short: "Mariana",
      latitude: 11.35,
      longitude: 142.20,
      zoom: 10,
      mode: "underwater",
      terrainStyle: "abyss",
      feature: "Challenger Deep",
      sourceLabel: "Terrarium bathymetry · NOAA ETOPO1 composite",
      sourceDetail: "Mapzen memakai NOAA ETOPO1 untuk mengisi bathymetry. Nilai negatif dipertahankan sebagai kedalaman di bawah muka laut.",
      startAltitude: 9.0,
      startAbsoluteY: -1.1,
      maxClearance: 12,
      pitch: -0.16,
      yaw: 0.08,
      educational: ["Challenger Deep", "Sumbu Palung Mariana", "Konteks subduksi Lempeng Pasifik"]
    },
    {
      id: "maunakea",
      name: "Mauna Kea / Hawaiʻi",
      short: "Mauna Kea",
      latitude: 19.8207,
      longitude: -155.4681,
      zoom: 10,
      mode: "coastal",
      terrainStyle: "volcanic",
      feature: "Mauna Kea",
      sourceLabel: "Terrarium DEM + bathymetry · open elevation composite",
      sourceDetail: "Terrain mempertahankan elevasi darat dan nilai negatif bathymetry sehingga konteks gunung di atas serta di bawah muka laut dapat dijelaskan dalam satu model.",
      startAltitude: 3.0,
      maxClearance: 13,
      pitch: -0.24,
      yaw: -0.05,
      educational: ["Puncak Mauna Kea", "Garis muka laut", "Hubungan tubuh gunung dengan dasar samudra"]
    },
    {
      id: "grandcanyon",
      name: "Grand Canyon",
      short: "Grand Canyon",
      latitude: 36.1069,
      longitude: -112.1129,
      zoom: 11,
      mode: "land",
      terrainStyle: "canyon",
      feature: "Grand Canyon",
      sourceLabel: "Terrarium DEM · USGS/open elevation composite",
      sourceDetail: "Di Amerika Serikat Mapzen memasukkan data elevasi USGS resolusi tinggi ke mosaik Terrain Tiles. Terrain tetap berasal dari DEM nyata.",
      startAltitude: 1.8,
      maxClearance: 10,
      pitch: -0.24,
      yaw: 0.18,
      educational: ["Koridor Grand Canyon", "Colorado River", "Relief dan erosi batuan berlapis"]
    },
    {
      id: "antarctica",
      name: "Antarktika / Vostok",
      short: "Antarktika",
      latitude: -78.4667,
      longitude: 106.8,
      zoom: 8,
      mode: "land",
      terrainStyle: "ice",
      feature: "Dataran Tinggi Antarktika",
      sourceLabel: "Terrarium surface elevation · global open elevation composite",
      sourceDetail: "Mode ini menampilkan elevasi permukaan yang tersedia pada mosaik global. Ini BUKAN visualisasi bedrock sub-ice dan tidak dipresentasikan sebagai topografi di bawah lapisan es.",
      startAltitude: 2.2,
      maxClearance: 12,
      pitch: -0.15,
      yaw: -0.12,
      educational: ["Permukaan es Antarktika Timur", "Konteks Stasiun Vostok", "Perbedaan ice surface dan bedrock subglacial"]
    }
  ]);

  const clamp = (value, min, max) => Math.max(min, Math.min(max, value));
  const lerp = (a, b, t) => a + (b - a) * t;
  const smoothstep = value => { const t = clamp(value, 0, 1); return t * t * (3 - 2 * t); };
  const wrapLongitude = lon => { let v = lon; while (v < -180) v += 360; while (v >= 180) v -= 360; return v; };
  const formatLatLon = (lat, lon) => `${Math.abs(lat).toFixed(4)}° ${lat >= 0 ? "N" : "S"} · ${Math.abs(lon).toFixed(4)}° ${lon >= 0 ? "E" : "W"}`;
  const formatKm = km => Math.abs(km) < 1 ? `${Math.round(km * 1000)} M` : `${km.toFixed(Math.abs(km) < 10 ? 2 : 1)} KM`;
  const wait = ms => new Promise(resolve => window.setTimeout(resolve, ms));

  class TerrariumProvider {
    constructor() {
      this.cache = new Map();
      this.pending = new Map();
      this.generation = 0;
      this.maxCache = 42;
    }

    address(latitude, longitude, zoom) {
      const n = 2 ** zoom;
      const lat = clamp(latitude, -85.05112878, 85.05112878);
      const xFloat = (wrapLongitude(longitude) + 180) / 360 * n;
      const latRad = lat * DEG;
      const yFloat = (1 - Math.asinh(Math.tan(latRad)) / Math.PI) / 2 * n;
      return { xFloat, yFloat, x: ((Math.floor(xFloat) % n) + n) % n, y: clamp(Math.floor(yFloat), 0, n - 1), zoom };
    }

    longitudeForX(x, zoom) {
      return x / (2 ** zoom) * 360 - 180;
    }

    latitudeForY(y, zoom) {
      const n = Math.PI - 2 * Math.PI * y / (2 ** zoom);
      return 180 / Math.PI * Math.atan(Math.sinh(n));
    }

    key(z, x, y) { return `${z}/${x}/${y}`; }
    url(z, x, y) { return TERRARIUM_TEMPLATE.replace("{z}", z).replace("{x}", x).replace("{y}", y); }

    async load(z, x, y) {
      const n = 2 ** z;
      const safeX = ((x % n) + n) % n;
      const safeY = clamp(y, 0, n - 1);
      const key = this.key(z, safeX, safeY);
      if (this.cache.has(key)) {
        const tile = this.cache.get(key);
        tile.lastUsed = performance.now();
        return tile;
      }
      if (this.pending.has(key)) return this.pending.get(key);
      const generation = this.generation;
      const promise = new Promise((resolve, reject) => {
        const image = new Image();
        image.crossOrigin = "anonymous";
        image.decoding = "async";
        const src = this.url(z, safeX, safeY);
        let settled = false;
        const timer = window.setTimeout(() => {
          if (settled) return;
          settled = true;
          image.src = "";
          reject(new Error(`Timeout saat memuat DEM: ${src}`));
        }, 16000);
        image.onload = () => {
          if (settled) return;
          settled = true;
          clearTimeout(timer);
          if (generation !== this.generation) return reject(new Error("Permintaan DEM dibatalkan."));
          try {
            const canvas = document.createElement("canvas");
            canvas.width = 256;
            canvas.height = 256;
            const context = canvas.getContext("2d", { willReadFrequently: true });
            context.drawImage(image, 0, 0, 256, 256);
            const rgba = context.getImageData(0, 0, 256, 256).data;
            const heights = new Float32Array(256 * 256);
            let min = Infinity, max = -Infinity;
            for (let i = 0, p = 0; p < heights.length; p += 1, i += 4) {
              const meters = rgba[i] * 256 + rgba[i + 1] + rgba[i + 2] / 256 - 32768;
              heights[p] = meters / 1000;
              min = Math.min(min, heights[p]);
              max = Math.max(max, heights[p]);
            }
            const tile = { z, x: safeX, y: safeY, heights, min, max, lastUsed: performance.now(), src };
            this.cache.set(key, tile);
            this.trim();
            resolve(tile);
          } catch (error) {
            reject(new Error(`DEM Terrarium tidak dapat dibaca: ${error.message}`));
          }
        };
        image.onerror = () => {
          if (settled) return;
          settled = true;
          clearTimeout(timer);
          reject(new Error(`Tile elevasi real tidak tersedia: ${src}`));
        };
        image.src = src;
      }).finally(() => this.pending.delete(key));
      this.pending.set(key, promise);
      return promise;
    }

    trim() {
      if (this.cache.size <= this.maxCache) return;
      const sorted = [...this.cache.entries()].sort((a, b) => a[1].lastUsed - b[1].lastUsed);
      while (this.cache.size > this.maxCache && sorted.length) this.cache.delete(sorted.shift()[0]);
    }

    sampleTile(tile, u, v) {
      const x = clamp(u, 0, 0.999999) * 255;
      const y = clamp(v, 0, 0.999999) * 255;
      const x0 = Math.floor(x), y0 = Math.floor(y), x1 = Math.min(255, x0 + 1), y1 = Math.min(255, y0 + 1);
      const tx = x - x0, ty = y - y0;
      const h00 = tile.heights[y0 * 256 + x0], h10 = tile.heights[y0 * 256 + x1];
      const h01 = tile.heights[y1 * 256 + x0], h11 = tile.heights[y1 * 256 + x1];
      return lerp(lerp(h00, h10, tx), lerp(h01, h11, tx), ty);
    }

    sampleCached(latitude, longitude, zoom) {
      const a = this.address(latitude, longitude, zoom);
      const tile = this.cache.get(this.key(zoom, a.x, a.y));
      if (!tile) return null;
      tile.lastUsed = performance.now();
      return this.sampleTile(tile, a.xFloat - Math.floor(a.xFloat), a.yFloat - Math.floor(a.yFloat));
    }

    clear() {
      this.generation += 1;
      this.pending.clear();
      this.cache.clear();
    }
  }

  class EarthTerrainManager {
    constructor(THREE, scene, renderer, provider, region, quality) {
      this.THREE = THREE;
      this.scene = scene;
      this.renderer = renderer;
      this.provider = provider;
      this.region = region;
      this.quality = quality;
      this.entries = new Map();
      this.frustum = new THREE.Frustum();
      this.projection = new THREE.Matrix4();
      this.forward = new THREE.Vector3();
      this.toChunk = new THREE.Vector3();
      this.bounds = { minX: Infinity, maxX: -Infinity, minZ: Infinity, maxZ: -Infinity };
      this.centerAddress = provider.address(region.latitude, region.longitude, region.zoom);
      this.centerXFloat = this.centerAddress.xFloat;
      this.centerYFloat = this.centerAddress.yFloat;
      this.material = this.createMaterial();
      this.water = null;
    }

    createDetailTexture() {
      const T = this.THREE;
      const canvas = document.createElement("canvas");
      canvas.width = canvas.height = 192;
      const ctx = canvas.getContext("2d");
      const image = ctx.createImageData(192, 192);
      const seed = this.region.id.split("").reduce((a, c) => a + c.charCodeAt(0), 0);
      for (let y = 0; y < 192; y += 1) {
        for (let x = 0; x < 192; x += 1) {
          const p = (y * 192 + x) * 4;
          const wave = Math.sin((x + seed) * 0.31) * Math.cos((y - seed) * 0.27);
          const grain = Math.sin((x * 17.13 + y * 9.71 + seed) * 1.77);
          const value = Math.round(clamp(132 + wave * 22 + grain * 16, 70, 190));
          image.data[p] = image.data[p + 1] = image.data[p + 2] = value;
          image.data[p + 3] = 255;
        }
      }
      ctx.putImageData(image, 0, 0);
      const texture = new T.CanvasTexture(canvas);
      texture.wrapS = texture.wrapT = T.RepeatWrapping;
      texture.repeat.set(this.region.id === "mariana" ? 28 : 20, this.region.id === "mariana" ? 28 : 20);
      texture.colorSpace = T.SRGBColorSpace;
      texture.anisotropy = Math.min(this.quality.anisotropy, this.renderer.capabilities.getMaxAnisotropy());
      return texture;
    }

    createMaterial() {
      const T = this.THREE;
      const detail = this.createDetailTexture();
      const colors = {
        alpine: 0x9b978b,
        abyss: 0x3b5360,
        volcanic: 0x51463f,
        canyon: 0x9c6347,
        ice: 0xd7e8ef
      };
      const material = new T.MeshStandardMaterial({
        color: colors[this.region.terrainStyle] || 0x887663,
        map: detail,
        bumpMap: detail,
        bumpScale: this.region.terrainStyle === "ice" ? 0.018 : this.region.terrainStyle === "abyss" ? 0.035 : 0.07,
        roughness: this.region.terrainStyle === "ice" ? 0.72 : 0.90,
        metalness: 0,
        vertexColors: true,
        side: T.FrontSide
      });
      material.userData.detailTexture = detail;
      return material;
    }

    colorForElevation(heightKm) {
      const T = this.THREE;
      if (this.region.terrainStyle === "alpine") {
        if (heightKm > 6.1) return new T.Color(0xe9eef0);
        if (heightKm > 4.6) return new T.Color(0xb9b7ad);
        if (heightKm > 3.0) return new T.Color(0x81786a);
        return new T.Color(0x59665a);
      }
      if (this.region.terrainStyle === "volcanic") {
        if (heightKm > 2.5) return new T.Color(0x7b7067);
        if (heightKm > 0) return new T.Color(0x554942);
        if (heightKm > -2.5) return new T.Color(0x263e43);
        return new T.Color(0x142c36);
      }
      if (this.region.terrainStyle === "canyon") {
        if (heightKm > 2.0) return new T.Color(0xb47b5c);
        if (heightKm > 1.1) return new T.Color(0x92563f);
        return new T.Color(0x6b3d31);
      }
      if (this.region.terrainStyle === "ice") {
        if (heightKm > 3.2) return new T.Color(0xf4fbff);
        if (heightKm > 1.5) return new T.Color(0xd9ecf3);
        return new T.Color(0xb9d6df);
      }
      const depth = clamp((-heightKm - 2) / 9, 0, 1);
      return new T.Color().setRGB(lerp(0.25, 0.06, depth), lerp(0.36, 0.15, depth), lerp(0.40, 0.20, depth));
    }

    tileCenterWorld(tile) {
      const lonW = this.provider.longitudeForX(tile.x, tile.z);
      const lonE = this.provider.longitudeForX(tile.x + 1, tile.z);
      const latN = this.provider.latitudeForY(tile.y, tile.z);
      const latS = this.provider.latitudeForY(tile.y + 1, tile.z);
      const lon = wrapLongitude((lonW + lonE) * 0.5);
      const lat = (latN + latS) * 0.5;
      const cos = Math.max(0.08, Math.cos(this.region.latitude * DEG));
      return {
        x: wrapLongitude(lon - this.region.longitude) * KM_PER_DEG_LAT * cos,
        z: -(lat - this.region.latitude) * KM_PER_DEG_LAT
      };
    }

    geometryFor(entry, segments) {
      if (entry.geometries.has(segments)) return entry.geometries.get(segments);
      const T = this.THREE;
      const geometry = new T.PlaneGeometry(1, 1, segments, segments);
      const position = geometry.attributes.position;
      const colors = new Float32Array(position.count * 3);
      const cos = Math.max(0.08, Math.cos(this.region.latitude * DEG));
      let minX = Infinity, maxX = -Infinity, minZ = Infinity, maxZ = -Infinity;
      for (let row = 0; row <= segments; row += 1) {
        const v = row / segments;
        const tileY = entry.tile.y + v;
        const lat = this.provider.latitudeForY(tileY, entry.tile.z);
        for (let col = 0; col <= segments; col += 1) {
          const u = col / segments;
          const index = row * (segments + 1) + col;
          const lon = this.provider.longitudeForX(entry.tile.x + u, entry.tile.z);
          const height = this.provider.sampleTile(entry.tile, u, v);
          const x = wrapLongitude(lon - this.region.longitude) * KM_PER_DEG_LAT * cos;
          const z = -(lat - this.region.latitude) * KM_PER_DEG_LAT;
          position.setXYZ(index, x, height, z);
          const c = this.colorForElevation(height);
          colors[index * 3] = c.r;
          colors[index * 3 + 1] = c.g;
          colors[index * 3 + 2] = c.b;
          minX = Math.min(minX, x); maxX = Math.max(maxX, x);
          minZ = Math.min(minZ, z); maxZ = Math.max(maxZ, z);
        }
      }
      geometry.setAttribute("color", new T.BufferAttribute(colors, 3));
      position.needsUpdate = true;
      geometry.computeVertexNormals();
      geometry.computeBoundingSphere();
      geometry.computeBoundingBox();
      geometry.userData.bounds = { minX, maxX, minZ, maxZ };
      entry.geometries.set(segments, geometry);
      if (entry.geometries.size > 3) {
        const first = entry.geometries.keys().next().value;
        if (first !== segments) { entry.geometries.get(first)?.dispose(); entry.geometries.delete(first); }
      }
      return geometry;
    }

    segmentSet() {
      if (this.quality.name === "HIGH") return { high: 72, medium: 42, low: 22 };
      if (this.quality.name === "MEDIUM") return { high: 52, medium: 32, low: 18 };
      return { high: 34, medium: 22, low: 14 };
    }

    desiredSegments(entry, camera) {
      const set = this.segmentSet();
      const center = entry.center;
      const dx = camera.position.x - center.x;
      const dz = camera.position.z - center.z;
      const distance = Math.hypot(dx, dz);
      const clearance = Math.max(0.1, camera.position.y - (this.heightAtWorld(camera.position.x, camera.position.z) ?? 0));
      if (this.quality.name === "LOW") return distance < 18 && clearance < 5 ? set.high : set.low;
      if (distance < 18 && clearance < 5) return set.high;
      if (distance < 45 && clearance < 12) return set.medium;
      return set.low;
    }

    async loadEntry(z, x, y, ring) {
      const tile = await this.provider.load(z, x, y);
      const key = this.provider.key(z, tile.x, tile.y);
      if (this.entries.has(key)) return this.entries.get(key);
      const entry = { key, tile, ring, geometries: new Map(), center: this.tileCenterWorld(tile), mesh: null, currentSegments: 0 };
      const set = this.segmentSet();
      const segments = ring === 0 ? set.high : ring === 1 ? set.medium : set.low;
      const geometry = this.geometryFor(entry, segments);
      const mesh = new this.THREE.Mesh(geometry, this.material);
      mesh.frustumCulled = true;
      mesh.castShadow = false;
      mesh.receiveShadow = false;
      entry.mesh = mesh;
      entry.currentSegments = segments;
      this.scene.add(mesh);
      const b = geometry.userData.bounds;
      this.bounds.minX = Math.min(this.bounds.minX, b.minX); this.bounds.maxX = Math.max(this.bounds.maxX, b.maxX);
      this.bounds.minZ = Math.min(this.bounds.minZ, b.minZ); this.bounds.maxZ = Math.max(this.bounds.maxZ, b.maxZ);
      this.entries.set(key, entry);
      return entry;
    }

    coordsForRadius(radius) {
      const c = this.centerAddress;
      const coords = [];
      for (let dy = -radius; dy <= radius; dy += 1) {
        for (let dx = -radius; dx <= radius; dx += 1) {
          coords.push({ x: c.x + dx, y: c.y + dy, ring: Math.max(Math.abs(dx), Math.abs(dy)) });
        }
      }
      coords.sort((a, b) => a.ring - b.ring);
      return coords;
    }

    async loadCore(onProgress) {
      const coords = this.coordsForRadius(1);
      for (let i = 0; i < coords.length; i += 1) {
        const c = coords[i];
        await this.loadEntry(this.region.zoom, c.x, c.y, c.ring);
        onProgress?.((i + 1) / coords.length);
      }
      this.ensureWater();
    }

    async loadExtended() {
      if (this.quality.radius < 2) return;
      const coords = this.coordsForRadius(2).filter(c => c.ring === 2);
      for (const c of coords) {
        try { await this.loadEntry(this.region.zoom, c.x, c.y, 2); }
        catch { /* Core terrain already guarantees a complete visible area. */ }
      }
      this.resizeWater();
    }

    ensureWater() {
      if (!['underwater', 'coastal'].includes(this.region.mode)) return;
      const T = this.THREE;
      const width = Math.max(120, this.bounds.maxX - this.bounds.minX + 20);
      const depth = Math.max(120, this.bounds.maxZ - this.bounds.minZ + 20);
      const geometry = new T.PlaneGeometry(width, depth, 1, 1);
      geometry.rotateX(-Math.PI / 2);
      const material = new T.MeshPhysicalMaterial({
        color: this.region.mode === "underwater" ? 0x0a3951 : 0x125b75,
        transparent: true,
        opacity: this.region.mode === "underwater" ? 0.58 : 0.46,
        roughness: 0.20,
        metalness: 0,
        transmission: 0.05,
        depthWrite: false,
        side: T.DoubleSide
      });
      this.water = new T.Mesh(geometry, material);
      this.water.position.y = 0;
      this.scene.add(this.water);
    }

    resizeWater() {
      if (!this.water) return;
      const width = Math.max(120, this.bounds.maxX - this.bounds.minX + 20);
      const depth = Math.max(120, this.bounds.maxZ - this.bounds.minZ + 20);
      this.water.geometry.dispose();
      this.water.geometry = new this.THREE.PlaneGeometry(width, depth, 1, 1);
      this.water.geometry.rotateX(-Math.PI / 2);
    }

    geoAtWorld(x, z) {
      const cos = Math.max(0.08, Math.cos(this.region.latitude * DEG));
      return {
        latitude: this.region.latitude - z / KM_PER_DEG_LAT,
        longitude: wrapLongitude(this.region.longitude + x / (KM_PER_DEG_LAT * cos))
      };
    }

    heightAtWorld(x, z) {
      const geo = this.geoAtWorld(x, z);
      return this.provider.sampleCached(geo.latitude, geo.longitude, this.region.zoom);
    }

    distanceToFeature(x, z) { return Math.hypot(x, z); }

    update(camera) {
      this.projection.multiplyMatrices(camera.projectionMatrix, camera.matrixWorldInverse);
      this.frustum.setFromProjectionMatrix(this.projection);
      camera.getWorldDirection(this.forward);
      for (const entry of this.entries.values()) {
        const targetSegments = this.desiredSegments(entry, camera);
        if (targetSegments !== entry.currentSegments) {
          entry.mesh.geometry = this.geometryFor(entry, targetSegments);
          entry.currentSegments = targetSegments;
        }
        this.toChunk.set(entry.center.x - camera.position.x, 0, entry.center.z - camera.position.z);
        const distance = Math.max(0.001, this.toChunk.length());
        const facing = this.toChunk.normalize().dot(this.forward);
        const safelyBehind = facing < -0.62 && distance > 32;
        entry.mesh.visible = !safelyBehind;
      }
    }

    clampPosition(position) {
      const margin = 4;
      position.x = clamp(position.x, this.bounds.minX + margin, this.bounds.maxX - margin);
      position.z = clamp(position.z, this.bounds.minZ + margin, this.bounds.maxZ - margin);
    }

    dispose() {
      for (const entry of this.entries.values()) {
        this.scene.remove(entry.mesh);
        for (const geometry of entry.geometries.values()) geometry.dispose();
      }
      this.entries.clear();
      if (this.water) {
        this.scene.remove(this.water);
        this.water.geometry.dispose();
        this.water.material.dispose();
        this.water = null;
      }
      this.material.userData.detailTexture?.dispose();
      this.material.dispose();
    }
  }

  class EarthFullInput {
    constructor(controller) {
      this.controller = controller;
      this.keys = new Set();
      this.dragging = false;
      this.pointerId = null;
      this.last = { x: 0, y: 0 };
      this.mobile = new Set();
      this.bind();
    }

    bind() {
      document.addEventListener("keydown", event => {
        if (!this.controller.active) return;
        if (["KeyW", "KeyA", "KeyS", "KeyD", "KeyQ", "KeyE", "ShiftLeft", "ShiftRight"].includes(event.code)) {
          event.preventDefault(); this.keys.add(event.code);
        }
        if (event.code === "Escape" && document.pointerLockElement === this.controller.viewport) document.exitPointerLock?.();
      });
      document.addEventListener("keyup", event => this.keys.delete(event.code));
      this.controller.viewport.addEventListener("click", () => {
        if (!this.controller.active || window.matchMedia("(pointer: coarse)").matches) return;
        this.controller.viewport.requestPointerLock?.();
      });
      document.addEventListener("mousemove", event => {
        if (!this.controller.active || document.pointerLockElement !== this.controller.viewport) return;
        this.controller.lookYawTarget -= event.movementX * 0.0018;
        this.controller.lookPitchTarget = clamp(this.controller.lookPitchTarget - event.movementY * 0.0016, -1.18, 0.48);
      });
      this.controller.viewport.addEventListener("pointerdown", event => {
        if (!this.controller.active || event.pointerType === "mouse") return;
        this.dragging = true; this.pointerId = event.pointerId; this.last = { x: event.clientX, y: event.clientY };
        this.controller.viewport.setPointerCapture?.(event.pointerId);
      });
      this.controller.viewport.addEventListener("pointermove", event => {
        if (!this.dragging || event.pointerId !== this.pointerId) return;
        const dx = event.clientX - this.last.x, dy = event.clientY - this.last.y;
        this.last = { x: event.clientX, y: event.clientY };
        this.controller.lookYawTarget -= dx * 0.004;
        this.controller.lookPitchTarget = clamp(this.controller.lookPitchTarget - dy * 0.0035, -1.18, 0.48);
      });
      const end = event => {
        if (event.pointerId !== this.pointerId) return;
        this.dragging = false; this.pointerId = null;
      };
      this.controller.viewport.addEventListener("pointerup", end);
      this.controller.viewport.addEventListener("pointercancel", end);
      document.querySelectorAll("[data-earth-control]").forEach(button => {
        const action = button.dataset.earthControl;
        const down = event => { event.preventDefault(); this.mobile.add(action); button.setPointerCapture?.(event.pointerId); };
        const up = event => { event.preventDefault(); this.mobile.delete(action); };
        button.addEventListener("pointerdown", down); button.addEventListener("pointerup", up); button.addEventListener("pointercancel", up); button.addEventListener("pointerleave", up);
      });
    }

    pressed(code) { return this.keys.has(code); }
    mobilePressed(action) { return this.mobile.has(action); }
    reset() { this.keys.clear(); this.mobile.clear(); this.dragging = false; }
  }

  window.EarthFullExploration = class EarthFullExploration {
    constructor(earth) {
      this.earth = earth;
      this.root = document.getElementById("earth-full-exploration");
      this.viewport = document.getElementById("earth-full-viewport");
      this.entryButton = document.getElementById("earth-full-explore-button");
      this.selector = document.getElementById("earth-region-selector");
      this.selectorGrid = document.getElementById("earth-region-grid");
      this.selectorClose = document.getElementById("earth-region-selector-close");
      this.exitButton = document.getElementById("earth-full-exit");
      this.regionButton = document.getElementById("earth-region-toggle");
      this.fullscreenButton = document.getElementById("earth-fullscreen-toggle");
      this.loading = document.getElementById("earth-full-loading");
      this.loadingStatus = document.getElementById("earth-full-loading-status");
      this.loadingProgress = document.getElementById("earth-full-loading-progress");
      this.errorPanel = document.getElementById("earth-full-error");
      this.errorMessage = document.getElementById("earth-full-error-message");
      this.errorReturn = document.getElementById("earth-full-error-return");
      this.tutorial = document.getElementById("earth-full-tutorial");
      this.tutorialClose = document.getElementById("earth-tutorial-close");
      this.hudLocation = document.getElementById("earth-hud-location");
      this.hudCoordinates = document.getElementById("earth-hud-coordinates");
      this.hudAltitude = document.getElementById("earth-hud-altitude");
      this.hudTerrain = document.getElementById("earth-hud-terrain");
      this.hudDistance = document.getElementById("earth-hud-distance");
      this.hudData = document.getElementById("earth-hud-data");
      this.hudQuality = document.getElementById("earth-hud-quality");
      this.landmarkTitle = document.getElementById("earth-landmark-name");
      this.landmarkType = document.getElementById("earth-landmark-type");
      this.landmarkCoords = document.getElementById("earth-landmark-coords");
      this.landmarkSource = document.getElementById("earth-landmark-source");
      this.state = STATES.IDLE;
      this.region = REGIONS[0];
      this.quality = this.detectQuality();
      this.provider = null;
      this.terrain = null;
      this.renderer = null;
      this.scene = null;
      this.camera = null;
      this.frame = null;
      this.previous = 0;
      this.yaw = 0;
      this.pitch = -0.2;
      this.lookYawTarget = 0;
      this.lookPitchTarget = -0.2;
      this.speed = 0;
      this.transitionToken = 0;
      this.input = new EarthFullInput(this);
      this.root.inert = true;
      this.buildSelector();
      this.bindUI();
    }

    get active() { return this.state === STATES.ACTIVE; }

    detectQuality() {
      const cores = navigator.hardwareConcurrency || 4;
      const memory = navigator.deviceMemory || 4;
      const coarse = matchMedia("(pointer: coarse)").matches;
      if (coarse || innerWidth < 760 || cores <= 4 || memory <= 3) return { name: "LOW", radius: 1, maxDpr: 1.35, pixelBudget: 2600000, anisotropy: 4 };
      if (cores >= 8 && memory >= 6) return { name: "HIGH", radius: 2, maxDpr: 2.0, pixelBudget: 8200000, anisotropy: 12 };
      return { name: "MEDIUM", radius: 2, maxDpr: 1.7, pixelBudget: 5200000, anisotropy: 8 };
    }

    calculateDpr() {
      const pixels = Math.max(1, (this.viewport.clientWidth || innerWidth) * (this.viewport.clientHeight || innerHeight));
      return clamp(Math.min(devicePixelRatio || 1, this.quality.maxDpr, Math.sqrt(this.quality.pixelBudget / pixels)), 0.9, this.quality.maxDpr);
    }

    buildSelector() {
      const fragment = document.createDocumentFragment();
      REGIONS.forEach(region => {
        const button = document.createElement("button");
        button.type = "button";
        button.className = "earth-region-card";
        button.dataset.earthRegion = region.id;
        button.innerHTML = `<span class="earth-region-index">${String(REGIONS.indexOf(region) + 1).padStart(2, "0")}</span><strong>${region.name}</strong><small>${formatLatLon(region.latitude, region.longitude)}</small><em>${region.mode === "underwater" ? "BATHYMETRY" : region.mode === "coastal" ? "LAND + OCEAN" : "REAL DEM"}</em><span class="earth-region-source">${region.sourceLabel}</span>`;
        fragment.append(button);
      });
      this.selectorGrid.replaceChildren(fragment);
    }

    bindUI() {
      this.entryButton.addEventListener("click", () => this.enter());
      this.selectorGrid.addEventListener("click", event => {
        const button = event.target.closest("[data-earth-region]");
        if (!button) return;
        const region = REGIONS.find(item => item.id === button.dataset.earthRegion);
        if (region) this.enterRegion(region);
      });
      this.selectorClose.addEventListener("click", () => this.exit());
      this.exitButton.addEventListener("click", () => this.exit());
      this.regionButton.addEventListener("click", () => this.returnToSelector());
      this.fullscreenButton.addEventListener("click", () => this.toggleFullscreen());
      this.errorReturn.addEventListener("click", () => this.failBack());
      this.tutorialClose.addEventListener("click", () => this.tutorial.classList.add("is-dismissed"));
      document.addEventListener("fullscreenchange", () => this.updateFullscreenLabel());
      window.addEventListener("resize", () => this.resize());
      document.addEventListener("visibilitychange", () => {
        if (!this.active) return;
        if (document.hidden) this.stopLoop(); else this.startLoop();
      });
    }

    enter() {
      if (!this.earth.active || this.earth.travelMode || this.state !== STATES.IDLE) return;
      this.entryButton.disabled = true;
      this.root.hidden = false;
      this.root.inert = false;
      this.root.setAttribute("aria-hidden", "false");
      this.selector.hidden = true;
      this.errorPanel.hidden = true;
      this.loading.hidden = true;
      document.getElementById("announcement").textContent = `Memulai Eksplorasi Pengalaman Penuh Bumi di ${this.region.name}.`;
      this.enterRegion(this.region);
    }

    setLoading(progress, text) {
      this.loading.hidden = false;
      this.loadingProgress.style.transform = `scaleX(${clamp(progress, 0, 1)})`;
      this.loadingStatus.textContent = text;
    }

    async enterRegion(region) {
      if (![STATES.IDLE, STATES.SELECTING, STATES.ACTIVE].includes(this.state)) return;
      this.transitionToken += 1;
      const token = this.transitionToken;
      this.stopLoop();
      this.input.reset();
      this.region = region;
      this.state = STATES.PREPARING;
      this.selector.hidden = true;
      this.errorPanel.hidden = true;
      this.root.className = "earth-full-exploration is-preparing";
      document.getElementById("mission").classList.remove("is-earth-full-selecting");
      document.getElementById("mission").classList.add("is-earth-full");
      this.earth.beginFullExplorationFocus?.(region);
      this.setLoading(0.04, `MENGUNCI KOORDINAT ${region.short.toUpperCase()}`);
      document.getElementById("announcement").textContent = `Menyiapkan terrain real ${region.name}.`;

      try {
        await this.earth.prepare();
        if (token !== this.transitionToken) return;
        await wait(matchMedia("(prefers-reduced-motion: reduce)").matches ? 80 : 720);
        this.setLoading(0.10, "MEMUAT MESIN TERRAIN BUMI");
        await this.prepareRenderer();
        if (token !== this.transitionToken) return;
        await this.loadRegionTerrain(region, token);
        if (token !== this.transitionToken) return;
        this.setLoading(1, "TERRAIN REAL SIAP");
        await wait(180);
        if (token !== this.transitionToken) return;
        this.activateRegion();
      } catch (error) {
        if (token !== this.transitionToken) return;
        this.showError(error);
      }
    }

    async prepareRenderer() {
      if (!this.earth.THREE) throw new Error("Renderer 3D Bumi tidak tersedia pada perangkat ini.");
      const T = this.earth.THREE;
      this.THREE = T;
      if (this.renderer) return;
      const canvas = document.createElement("canvas");
      canvas.className = "earth-full-canvas";
      canvas.setAttribute("aria-hidden", "true");
      const context = canvas.getContext("webgl2", { alpha: true, antialias: this.quality.name !== "LOW", powerPreference: "high-performance" });
      if (!context) throw new Error("WebGL2 diperlukan untuk terrain Bumi 3D.");
      this.renderer = new T.WebGLRenderer({ canvas, context, alpha: true, antialias: this.quality.name !== "LOW" });
      this.renderer.outputColorSpace = T.SRGBColorSpace;
      this.renderer.toneMapping = T.ACESFilmicToneMapping;
      this.renderer.toneMappingExposure = 1.05;
      this.renderer.setPixelRatio(this.calculateDpr());
      this.renderer.setClearColor(0x071522, 1);
      this.viewport.replaceChildren(canvas);
      this.scene = new T.Scene();
      this.scene.fog = new T.FogExp2(0x9bb5c3, 0.006);
      this.camera = new T.PerspectiveCamera(this.mobileFov(), 1, 0.02, 650);
      this.camera.rotation.order = "YXZ";
      this.scene.add(new T.HemisphereLight(0xd9edff, 0x3d322b, 0.78));
      const sun = new T.DirectionalLight(0xfff0d2, 2.6); sun.position.set(-45, 70, 35); this.scene.add(sun);
      const fill = new T.DirectionalLight(0x91b9dc, 0.24); fill.position.set(45, 20, -30); this.scene.add(fill);
      this.move = new T.Vector3(); this.forward = new T.Vector3(); this.right = new T.Vector3();
      this.resize();
    }

    mobileFov() { return innerWidth < 760 ? 64 : 58; }

    async loadRegionTerrain(region, token) {
      this.disposeTerrain();
      this.provider = new TerrariumProvider();
      this.terrain = new EarthTerrainManager(this.THREE, this.scene, this.renderer, this.provider, region, this.quality);
      this.setLoading(0.14, "MENGUNDUH TILE ELEVASI REAL");
      await this.terrain.loadCore(progress => this.setLoading(0.14 + progress * 0.70, `MEMBANGUN TERRAIN REAL · ${Math.round(progress * 100)}%`));
      if (token !== this.transitionToken) return;
      this.setCameraForRegion(region);
      this.updateRegionUI();
      void this.terrain.loadExtended();
    }

    setCameraForRegion(region) {
      const ground = this.terrain.heightAtWorld(0, 0) ?? 0;
      const zOffset = region.id === "grandcanyon" ? 11 : region.id === "antarctica" ? 14 : region.id === "mariana" ? 18 : 12;
      const y = Number.isFinite(region.startAbsoluteY) ? region.startAbsoluteY : ground + region.startAltitude;
      this.camera.position.set(0, y, zOffset);
      this.yaw = region.yaw || 0;
      this.pitch = region.pitch || -0.2;
      this.lookYawTarget = this.yaw;
      this.lookPitchTarget = this.pitch;
      this.applyCameraRotation();
      this.terrain.clampPosition(this.camera.position);
    }

    updateRegionUI() {
      const region = this.region;
      this.hudLocation.textContent = region.name;
      this.hudCoordinates.textContent = formatLatLon(region.latitude, region.longitude);
      this.hudQuality.textContent = this.quality.name;
      this.hudData.textContent = region.sourceLabel;
      this.landmarkTitle.textContent = region.feature;
      this.landmarkType.textContent = region.sourceDetail;
      this.landmarkCoords.textContent = formatLatLon(region.latitude, region.longitude);
      this.landmarkSource.href = "https://www.mapzen.com/blog/terrain-tile-service/";
      this.landmarkSource.textContent = "Provenance terrain: Mapzen / Amazon Public Dataset ↗";
      this.root.dataset.region = region.id;
    }

    activateRegion() {
      this.state = STATES.ACTIVE;
      this.root.classList.remove("is-preparing");
      this.root.classList.add("is-active", "is-surface-visible");
      this.loading.hidden = true;
      this.earth.completeFullExplorationHandoff?.();
      this.tutorial.classList.remove("is-dismissed");
      this.previous = performance.now();
      this.startLoop();
      this.updateHUD();
      document.getElementById("announcement").textContent = `Eksplorasi terrain real ${this.region.name} aktif.`;
    }

    applyCameraRotation() {
      this.camera.rotation.set(this.pitch, this.yaw, 0, "YXZ");
    }

    startLoop() {
      if (!this.active || this.frame) return;
      this.previous = performance.now();
      const tick = now => {
        if (!this.active) { this.frame = null; return; }
        const dt = Math.min(0.05, Math.max(0.001, (now - this.previous) / 1000));
        this.previous = now;
        this.update(dt);
        this.renderer.render(this.scene, this.camera);
        this.frame = requestAnimationFrame(tick);
      };
      this.frame = requestAnimationFrame(tick);
    }

    stopLoop() { if (this.frame) cancelAnimationFrame(this.frame); this.frame = null; }

    update(dt) {
      const smoothing = 1 - Math.exp(-dt * 12);
      this.yaw += (this.lookYawTarget - this.yaw) * smoothing;
      this.pitch += (this.lookPitchTarget - this.pitch) * smoothing;
      this.applyCameraRotation();

      const boost = this.input.pressed("ShiftLeft") || this.input.pressed("ShiftRight");
      const base = this.region.id === "mariana" ? 3.8 : 5.4;
      const speed = base * (boost ? 3.2 : 1);
      let forward = 0, strafe = 0, vertical = 0;
      if (this.input.pressed("KeyW") || this.input.mobilePressed("forward")) forward += 1;
      if (this.input.pressed("KeyS") || this.input.mobilePressed("backward")) forward -= 1;
      if (this.input.pressed("KeyD") || this.input.mobilePressed("right")) strafe += 1;
      if (this.input.pressed("KeyA") || this.input.mobilePressed("left")) strafe -= 1;
      if (this.input.pressed("KeyE") || this.input.mobilePressed("up")) vertical += 1;
      if (this.input.pressed("KeyQ") || this.input.mobilePressed("down")) vertical -= 1;

      this.forward.set(-Math.sin(this.yaw), 0, -Math.cos(this.yaw));
      this.right.set(Math.cos(this.yaw), 0, -Math.sin(this.yaw));
      this.move.set(0, 0, 0).addScaledVector(this.forward, forward).addScaledVector(this.right, strafe);
      if (this.move.lengthSq() > 1) this.move.normalize();
      this.camera.position.addScaledVector(this.move, speed * dt);
      this.camera.position.y += vertical * speed * 0.72 * dt;
      this.terrain.clampPosition(this.camera.position);

      const ground = this.terrain.heightAtWorld(this.camera.position.x, this.camera.position.z);
      if (ground != null) {
        const minClearance = this.region.id === "mariana" ? 0.18 : 0.12;
        this.camera.position.y = Math.max(this.camera.position.y, ground + minClearance);
        this.camera.position.y = Math.min(this.camera.position.y, ground + this.region.maxClearance);
      }
      this.speed = this.move.length() * speed;
      this.terrain.update(this.camera);
      this.updateEnvironment();
      this.updateHUD();
    }

    updateEnvironment() {
      if (!this.scene?.fog) return;
      const underwater = this.region.id === "mariana" && this.camera.position.y < -0.05;
      if (underwater) {
        this.scene.fog.color.set(0x052637);
        this.scene.fog.density = 0.035;
        this.renderer.setClearColor(0x031b29, 1);
        this.root.classList.add("is-underwater");
      } else {
        const fogColors = { everest: 0xb8cad5, maunakea: 0x91a8b0, grandcanyon: 0xc7a58f, antarctica: 0xd9e7ec, mariana: 0x7ca0af };
        this.scene.fog.color.set(fogColors[this.region.id] || 0xaabcc7);
        this.scene.fog.density = this.region.id === "antarctica" ? 0.009 : 0.006;
        this.renderer.setClearColor(this.region.id === "grandcanyon" ? 0xa9bac5 : 0x789cad, 1);
        this.root.classList.remove("is-underwater");
      }
    }

    updateHUD() {
      if (!this.terrain || !this.camera) return;
      const geo = this.terrain.geoAtWorld(this.camera.position.x, this.camera.position.z);
      const ground = this.terrain.heightAtWorld(this.camera.position.x, this.camera.position.z) ?? 0;
      const clearance = this.camera.position.y - ground;
      this.hudCoordinates.textContent = formatLatLon(geo.latitude, geo.longitude);
      this.hudTerrain.textContent = ground < 0 ? `${formatKm(Math.abs(ground))} DI BAWAH LAUT` : `${formatKm(ground)} AMSL`;
      if (this.region.id === "mariana" && this.camera.position.y < 0) this.hudAltitude.textContent = `${formatKm(Math.abs(this.camera.position.y))} DEPTH`;
      else this.hudAltitude.textContent = `${formatKm(this.camera.position.y)} AMSL · ${formatKm(clearance)} AGL`;
      this.hudDistance.textContent = formatKm(this.terrain.distanceToFeature(this.camera.position.x, this.camera.position.z));
    }

    async returnToSelector() {
      if (!this.active) return;
      this.stopLoop();
      this.input.reset();
      this.state = STATES.SELECTING;
      this.root.className = "earth-full-exploration is-selecting";
      this.selector.hidden = false;
      this.loading.hidden = true;
      document.getElementById("mission").classList.remove("is-earth-full");
      document.getElementById("mission").classList.add("is-earth-full-selecting");
      this.disposeTerrain();
      this.earth.returnFromFullExplorationToSelector?.();
      requestAnimationFrame(() => this.selector.querySelector(`[data-earth-region="${this.region.id}"]`)?.focus({ preventScroll: true }));
    }

    async exit() {
      if (![STATES.ACTIVE, STATES.PREPARING, STATES.SELECTING].includes(this.state)) return;
      this.transitionToken += 1;
      this.state = STATES.EXITING;
      this.stopLoop();
      this.input.reset();
      if (document.pointerLockElement === this.viewport) document.exitPointerLock?.();
      this.root.classList.add("is-exiting");
      await wait(matchMedia("(prefers-reduced-motion: reduce)").matches ? 50 : 520);
      this.disposeTerrain();
      this.disposeRenderer();
      this.root.hidden = true;
      this.root.inert = true;
      this.root.setAttribute("aria-hidden", "true");
      this.root.className = "earth-full-exploration";
      document.getElementById("mission").classList.remove("is-earth-full", "is-earth-full-selecting");
      this.earth.endFullExplorationFocus?.();
      this.state = STATES.IDLE;
      this.entryButton.disabled = false;
      this.entryButton.focus({ preventScroll: true });
      document.getElementById("announcement").textContent = "Kembali ke panorama Bumi.";
    }

    showError(error) {
      this.state = STATES.PREPARING;
      this.root.classList.add("is-error");
      this.loading.hidden = true;
      this.errorPanel.hidden = false;
      this.errorMessage.textContent = `${error?.message || "Data terrain real tidak dapat dimuat."} ANTARA tidak mengganti data yang gagal dengan terrain procedural.`;
      console.error("Earth Full Exploration:", error);
    }

    failBack() { this.exit(); }

    disposeTerrain() {
      this.terrain?.dispose(); this.terrain = null;
      this.provider?.clear(); this.provider = null;
    }

    disposeRenderer() {
      if (!this.renderer) return;
      this.renderer.dispose();
      this.renderer.domElement?.remove();
      this.renderer = null;
      this.scene = null;
      this.camera = null;
    }

    resize() {
      if (!this.renderer || !this.camera) return;
      const width = Math.max(1, this.viewport.clientWidth || innerWidth);
      const height = Math.max(1, this.viewport.clientHeight || innerHeight);
      this.renderer.setSize(width, height, false);
      this.renderer.setPixelRatio(this.calculateDpr());
      this.camera.aspect = width / height;
      this.camera.fov = this.mobileFov();
      this.camera.updateProjectionMatrix();
    }

    forceReset() {
      this.transitionToken += 1;
      this.stopLoop();
      this.input.reset();
      if (document.pointerLockElement === this.viewport) document.exitPointerLock?.();
      this.disposeTerrain();
      this.disposeRenderer();
      this.root.hidden = true;
      this.root.inert = true;
      this.root.setAttribute("aria-hidden", "true");
      this.root.className = "earth-full-exploration";
      this.selector.hidden = false;
      document.getElementById("mission").classList.remove("is-earth-full", "is-earth-full-selecting");
      this.earth.endFullExplorationFocus?.();
      this.state = STATES.IDLE;
      this.entryButton.disabled = false;
    }

    async toggleFullscreen() {
      try {
        if (document.fullscreenElement === this.root) await document.exitFullscreen();
        else await this.root.requestFullscreen();
      } catch { /* Fullscreen is optional. */ }
    }

    updateFullscreenLabel() {
      const active = document.fullscreenElement === this.root;
      this.fullscreenButton.setAttribute("aria-pressed", String(active));
      this.fullscreenButton.querySelector("span").textContent = active ? "Keluar layar penuh" : "Layar penuh";
      if (this.renderer) window.setTimeout(() => this.resize(), 80);
    }
  };
})();
