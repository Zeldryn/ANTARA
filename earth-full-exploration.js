"use strict";

(() => {
  const TERRARIUM_TEMPLATE = "https://s3.amazonaws.com/elevation-tiles-prod/terrarium/{z}/{x}/{y}.png";
  const MAPZEN_SOURCE = "Mapzen Terrain Tiles · Amazon Public Dataset";
  const KM_PER_DEG_LAT = 111.32;
  const EARTH_RADIUS_KM = 6371.0088;
  const DEG = Math.PI / 180;
  const STATES = Object.freeze({ IDLE: "idle", SELECTING: "selecting", PREPARING: "preparing", ENTERING: "entering", ACTIVE: "active", EXITING: "exiting" });

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
      descriptor: "Punggungan bersalju, batu alpine, dan horizon tertinggi di Bumi.",
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
      descriptor: "Turun menembus kolom air menuju bathymetry Challenger Deep.",
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
      descriptor: "Gunung api samudra dengan lereng basalt dan konteks pulau Hawaiʻi.",
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
      descriptor: "Lapisan batuan merah-cokelat dan relief ngarai yang terukir erosi.",
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
      descriptor: "Bentang es polar cerah dengan variasi biru-putih dan atmosfer dingin.",
      educational: ["Permukaan es Antarktika Timur", "Konteks Stasiun Vostok", "Perbedaan ice surface dan bedrock subglacial"]
    }
  ]);

  const REGION_VISUALS = Object.freeze({
    everest: { skyTop: 0x5f89a9, skyHorizon: 0xd9e6ed, fog: 0xc7d8e2, fogDensity: 0.0027, hemiSky: 0xe7f5ff, hemiGround: 0x4a4540, sun: 0xfff4df, sunIntensity: 3.05, exposure: 1.15 },
    mariana: { skyTop: 0x061925, skyHorizon: 0x163c50, fog: 0x082d3d, fogDensity: 0.028, hemiSky: 0x5d91a8, hemiGround: 0x07131b, sun: 0x79b8cf, sunIntensity: 0.72, exposure: 0.92 },
    maunakea: { skyTop: 0x4c8cba, skyHorizon: 0xc5e4ed, fog: 0xa8c7d1, fogDensity: 0.0034, hemiSky: 0xe9f8ff, hemiGround: 0x3d352f, sun: 0xffe8c6, sunIntensity: 2.85, exposure: 1.10 },
    grandcanyon: { skyTop: 0x6495bd, skyHorizon: 0xe2c5a6, fog: 0xcdb7a1, fogDensity: 0.0030, hemiSky: 0xf3e7d6, hemiGround: 0x5b3627, sun: 0xffd9aa, sunIntensity: 3.20, exposure: 1.08 },
    antarctica: { skyTop: 0x7ca9c8, skyHorizon: 0xecf7fb, fog: 0xe0edf2, fogDensity: 0.0042, hemiSky: 0xf7fdff, hemiGround: 0x7c9cab, sun: 0xf5fbff, sunIntensity: 2.45, exposure: 1.20 }
  });

  const clamp = (value, min, max) => Math.max(min, Math.min(max, value));
  const lerp = (a, b, t) => a + (b - a) * t;
  const smoothstep = value => { const t = clamp(value, 0, 1); return t * t * (3 - 2 * t); };
  const smootherstep = value => { const t = clamp(value, 0, 1); return t * t * t * (t * (t * 6 - 15) + 10); };
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
      this.sky = null;
      this.particles = null;
      this.environmentTime = 0;
    }

    createSurfaceTexture(kind = "detail") {
      const T = this.THREE;
      const size = this.quality.name === "LOW" ? 128 : 256;
      const canvas = document.createElement("canvas");
      canvas.width = canvas.height = size;
      const ctx = canvas.getContext("2d");
      const image = ctx.createImageData(size, size);
      const seed = this.region.id.split("").reduce((a, c) => a + c.charCodeAt(0), 0);
      const style = this.region.terrainStyle;
      const palette = {
        alpine: [232, 235, 233], abyss: [196, 210, 215], volcanic: [216, 210, 202], canyon: [229, 205, 188], ice: [238, 248, 252]
      }[style] || [225, 225, 220];
      for (let y = 0; y < size; y += 1) {
        const py = y / size * Math.PI * 2;
        for (let x = 0; x < size; x += 1) {
          const px = x / size * Math.PI * 2;
          const p = (y * size + x) * 4;
          const broad = Math.sin(px * 3 + seed * 0.013) * Math.cos(py * 4 - seed * 0.017);
          const mid = Math.sin(px * 11 + py * 7 + seed * 0.021) * 0.55 + Math.cos(px * 8 - py * 13) * 0.45;
          const fine = Math.sin(px * 31 + py * 23 + seed) * Math.cos(px * 19 - py * 29 - seed) * 0.5;
          const n = clamp(broad * 0.34 + mid * 0.42 + fine * 0.24, -1, 1);
          let r, g, b;
          if (kind === "bump") {
            const v = Math.round(clamp(128 + n * 76, 22, 234));
            r = g = b = v;
          } else if (kind === "roughness") {
            const base = style === "ice" ? 178 : style === "abyss" ? 220 : style === "volcanic" ? 236 : 224;
            const v = Math.round(clamp(base + n * 23, 120, 252));
            r = g = b = v;
          } else {
            const strength = style === "canyon" ? 0.14 : style === "volcanic" ? 0.12 : 0.09;
            const factor = 1 + n * strength;
            r = Math.round(clamp(palette[0] * factor, 160, 255));
            g = Math.round(clamp(palette[1] * factor, 160, 255));
            b = Math.round(clamp(palette[2] * factor, 160, 255));
          }
          image.data[p] = r; image.data[p + 1] = g; image.data[p + 2] = b; image.data[p + 3] = 255;
        }
      }
      ctx.putImageData(image, 0, 0);
      const texture = new T.CanvasTexture(canvas);
      texture.wrapS = texture.wrapT = T.RepeatWrapping;
      texture.colorSpace = kind === "detail" ? T.SRGBColorSpace : T.NoColorSpace;
      texture.anisotropy = Math.min(this.quality.anisotropy, this.renderer.capabilities.getMaxAnisotropy());
      texture.needsUpdate = true;
      return texture;
    }

    configureTerrainMaterial(material, textures) {
      const style = this.region.terrainStyle;
      const detailScale = style === "ice" ? 0.70 : style === "abyss" ? 0.45 : style === "canyon" ? 0.82 : 0.95;
      const fineScale = style === "canyon" ? 3.4 : style === "ice" ? 2.0 : 2.8;
      const microStrength = this.quality.name === "HIGH" ? 0.22 : this.quality.name === "MEDIUM" ? 0.17 : 0.11;
      material.bumpMap = textures.bump;
      material.bumpScale = 0.001;
      material.onBeforeCompile = shader => {
        shader.uniforms.uEarthDetail = { value: textures.detail };
        shader.uniforms.uEarthBump = { value: textures.bump };
        shader.uniforms.uEarthRough = { value: textures.roughness };
        shader.uniforms.uEarthDetailScale = { value: detailScale };
        shader.uniforms.uEarthFineScale = { value: fineScale };
        shader.uniforms.uEarthMicroStrength = { value: microStrength };
        shader.vertexShader = shader.vertexShader
          .replace("#include <common>", "#include <common>\nvarying vec3 vEarthWorldPosition;")
          .replace("#include <begin_vertex>", "#include <begin_vertex>\nvEarthWorldPosition = (modelMatrix * vec4(transformed, 1.0)).xyz;");
        shader.fragmentShader = shader.fragmentShader
          .replace("#include <common>", `#include <common>
            varying vec3 vEarthWorldPosition;
            uniform sampler2D uEarthDetail;
            uniform sampler2D uEarthBump;
            uniform sampler2D uEarthRough;
            uniform float uEarthDetailScale;
            uniform float uEarthFineScale;
            uniform float uEarthMicroStrength;
            float earthTriSample(sampler2D tex, vec3 p, vec3 n, float scale, vec3 phase) {
              vec3 blend = pow(max(abs(n), vec3(0.0001)), vec3(5.0));
              blend /= max(blend.x + blend.y + blend.z, 0.0001);
              float sx = texture2D(tex, p.yz * scale + phase.yz).r;
              float sy = texture2D(tex, p.xz * scale + phase.xz).r;
              float sz = texture2D(tex, p.xy * scale + phase.xy).r;
              return sx * blend.x + sy * blend.y + sz * blend.z;
            }`)
          .replace("#include <map_fragment>", `#include <map_fragment>
            vec3 earthDx = dFdx(vEarthWorldPosition);
            vec3 earthDy = dFdy(vEarthWorldPosition);
            vec3 earthGeomNormal = normalize(cross(earthDx, earthDy));
            if (!gl_FrontFacing) earthGeomNormal = -earthGeomNormal;
            float earthViewDistance = length(cameraPosition - vEarthWorldPosition);
            float earthNear = 1.0 - smoothstep(8.0, 48.0, earthViewDistance);
            float earthBroad = earthTriSample(uEarthDetail, vEarthWorldPosition, earthGeomNormal, uEarthDetailScale, vec3(0.17,0.43,0.71));
            float earthFine = earthTriSample(uEarthDetail, vEarthWorldPosition, earthGeomNormal, uEarthFineScale, vec3(0.63,0.11,0.29));
            float earthMicro = (earthBroad - 0.5) * 0.68 + (earthFine - 0.5) * 0.32 * earthNear;
            diffuseColor.rgb *= clamp(1.0 + earthMicro * uEarthMicroStrength, 0.84, 1.16);`)
          .replace("#include <normal_fragment_maps>", `#include <normal_fragment_maps>
            #ifdef USE_BUMPMAP
              float earthBumpBroad = earthTriSample(uEarthBump, vEarthWorldPosition, earthGeomNormal, uEarthDetailScale * 1.25, vec3(0.31,0.59,0.07));
              float earthBumpFine = earthTriSample(uEarthBump, vEarthWorldPosition, earthGeomNormal, uEarthFineScale * 1.35, vec3(0.79,0.23,0.47));
              float earthMicroHeight = (earthBumpBroad - 0.5) * 0.55 + (earthBumpFine - 0.5) * 0.45 * earthNear;
              vec2 earthMicroSlope = vec2(dFdx(earthMicroHeight), dFdy(earthMicroHeight));
              normal = perturbNormalArb(-vViewPosition, normal, earthMicroSlope * (4.2 + 2.4 * earthNear), faceDirection);
            #endif`)
          .replace("#include <roughnessmap_fragment>", `#include <roughnessmap_fragment>
            float earthRoughSample = earthTriSample(uEarthRough, vEarthWorldPosition, earthGeomNormal, uEarthDetailScale * 0.9, vec3(0.41,0.19,0.83));
            roughnessFactor = clamp(roughnessFactor + (earthRoughSample - 0.5) * 0.18, 0.55, 0.99);`);
        material.userData.earthShader = shader;
      };
      material.customProgramCacheKey = () => `antara-earth-region-material-v3-${this.region.id}-${this.quality.name}`;
      material.needsUpdate = true;
      return material;
    }

    createMaterial() {
      const T = this.THREE;
      const textures = {
        detail: this.createSurfaceTexture("detail"),
        bump: this.createSurfaceTexture("bump"),
        roughness: this.createSurfaceTexture("roughness")
      };
      const baseRoughness = { alpine: 0.84, abyss: 0.93, volcanic: 0.91, canyon: 0.88, ice: 0.68 }[this.region.terrainStyle] ?? 0.88;
      const material = new T.MeshStandardMaterial({
        color: 0xffffff,
        roughness: baseRoughness,
        metalness: 0,
        vertexColors: true,
        side: T.FrontSide
      });
      material.userData.surfaceTextures = textures;
      return this.configureTerrainMaterial(material, textures);
    }

    colorForElevation(heightKm, slope = 0, x = 0, z = 0) {
      const T = this.THREE;
      const mix = (a, b, t) => new T.Color(a).lerp(new T.Color(b), clamp(t, 0, 1));
      const variation = Math.sin(x * 0.19 + z * 0.13) * 0.5 + Math.cos(x * 0.07 - z * 0.17) * 0.5;
      if (this.region.terrainStyle === "alpine") {
        const low = mix(0x566052, 0x726f63, smoothstep((heightKm - 2.8) / 1.8));
        const rock = mix(0x77746d, 0xa7a7a2, smoothstep((heightKm - 4.1) / 1.6));
        let base = low.lerp(rock, smoothstep((heightKm - 3.7) / 1.4));
        const snow = clamp(smoothstep((heightKm - 4.65) / 1.35) * (1 - slope * 0.48) + smoothstep((heightKm - 6.5) / 0.8) * 0.42, 0, 1);
        base.lerp(new T.Color(0xf3f7f8), snow);
        if (slope > 0.58) base.lerp(new T.Color(0x676765), (slope - 0.58) * 0.48);
        return base.multiplyScalar(0.96 + variation * 0.035);
      }
      if (this.region.terrainStyle === "volcanic") {
        if (heightKm < -0.05) {
          const depth = clamp((-heightKm) / 5.2, 0, 1);
          return mix(0x2a6976, 0x123448, depth);
        }
        if (heightKm < 0.16) return mix(0x6b7056, 0x76664f, heightKm / 0.16);
        if (heightKm < 1.6) return mix(0x39533f, 0x514b3e, heightKm / 1.6);
        if (heightKm < 3.0) return mix(0x4b443d, 0x67584d, (heightKm - 1.6) / 1.4);
        return mix(0x655a52, 0x83786e, smoothstep((heightKm - 3.0) / 1.2));
      }
      if (this.region.terrainStyle === "canyon") {
        const normalized = clamp((heightKm - 0.4) / 2.6, 0, 1);
        const stripe = 0.5 + 0.5 * Math.sin(heightKm * 21 + variation * 2.4);
        let base = mix(0x6f392d, 0xc37a4e, normalized);
        base.lerp(new T.Color(stripe > 0.52 ? 0xd39768 : 0x7f4736), 0.18 + stripe * 0.11);
        if (slope > 0.52) base.lerp(new T.Color(0x63352b), (slope - 0.52) * 0.55);
        return base.multiplyScalar(0.97 + variation * 0.03);
      }
      if (this.region.terrainStyle === "ice") {
        let base = mix(0xb9d9e7, 0xf7fcff, smoothstep((heightKm - 0.8) / 2.8));
        base.lerp(new T.Color(0x9fc7da), clamp(slope * 0.34, 0, 0.34));
        const windScour = smoothstep((variation + 1) * 0.5) * 0.12;
        base.lerp(new T.Color(0xe0f2f8), windScour);
        return base;
      }
      const depth = clamp((-heightKm - 2.0) / 9.0, 0, 1);
      let base = mix(0x435e67, 0x172d3a, depth);
      const sediment = clamp((variation + 1) * 0.5, 0, 1);
      base.lerp(new T.Color(0x52615d), sediment * 0.12 * (1 - depth));
      if (slope > 0.55) base.lerp(new T.Color(0x293c43), (slope - 0.55) * 0.28);
      return base;
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
      const count = segments + 1;
      const heights = new Float32Array(count * count);
      const xs = new Float32Array(count * count);
      const zs = new Float32Array(count * count);
      const cos = Math.max(0.08, Math.cos(this.region.latitude * DEG));
      let minX = Infinity, maxX = -Infinity, minZ = Infinity, maxZ = -Infinity;

      for (let row = 0; row <= segments; row += 1) {
        const v = row / segments;
        const tileY = entry.tile.y + v;
        const lat = this.provider.latitudeForY(tileY, entry.tile.z);
        for (let col = 0; col <= segments; col += 1) {
          const u = col / segments;
          const index = row * count + col;
          const lon = this.provider.longitudeForX(entry.tile.x + u, entry.tile.z);
          const height = this.provider.sampleTile(entry.tile, u, v);
          const x = wrapLongitude(lon - this.region.longitude) * KM_PER_DEG_LAT * cos;
          const z = -(lat - this.region.latitude) * KM_PER_DEG_LAT;
          heights[index] = height; xs[index] = x; zs[index] = z;
          position.setXYZ(index, x, height, z);
          minX = Math.min(minX, x); maxX = Math.max(maxX, x);
          minZ = Math.min(minZ, z); maxZ = Math.max(maxZ, z);
        }
      }

      const sampleHeight = (row, col) => heights[clamp(row, 0, segments) * count + clamp(col, 0, segments)];
      for (let row = 0; row <= segments; row += 1) {
        for (let col = 0; col <= segments; col += 1) {
          const index = row * count + col;
          const left = sampleHeight(row, col - 1), right = sampleHeight(row, col + 1);
          const up = sampleHeight(row - 1, col), down = sampleHeight(row + 1, col);
          const dx = Math.max(0.03, Math.abs(xs[row * count + Math.min(segments, col + 1)] - xs[row * count + Math.max(0, col - 1)]));
          const dz = Math.max(0.03, Math.abs(zs[Math.min(segments, row + 1) * count + col] - zs[Math.max(0, row - 1) * count + col]));
          const gx = (right - left) / dx;
          const gz = (down - up) / dz;
          const slope = clamp(Math.hypot(gx, gz) * 2.15, 0, 1);
          const c = this.colorForElevation(heights[index], slope, xs[index], zs[index]);
          colors[index * 3] = c.r;
          colors[index * 3 + 1] = c.g;
          colors[index * 3 + 2] = c.b;
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
      if (this.quality.name === "HIGH") return { high: 144, medium: 72, low: 30 };
      if (this.quality.name === "MEDIUM") return { high: 96, medium: 52, low: 24 };
      return { high: 56, medium: 32, low: 18 };
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
      this.ensureEnvironment();
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

    createWaterTexture() {
      const T = this.THREE;
      const size = 192;
      const canvas = document.createElement("canvas");
      canvas.width = canvas.height = size;
      const ctx = canvas.getContext("2d");
      const image = ctx.createImageData(size, size);
      for (let y = 0; y < size; y += 1) {
        const py = y / size * Math.PI * 2;
        for (let x = 0; x < size; x += 1) {
          const px = x / size * Math.PI * 2;
          const p = (y * size + x) * 4;
          const wave = Math.sin(px * 6 + py * 2) * 0.46 + Math.sin(px * 11 - py * 7) * 0.29 + Math.cos(px * 3 + py * 13) * 0.25;
          const v = Math.round(clamp(128 + wave * 54, 55, 205));
          image.data[p] = image.data[p + 1] = image.data[p + 2] = v;
          image.data[p + 3] = 255;
        }
      }
      ctx.putImageData(image, 0, 0);
      const texture = new T.CanvasTexture(canvas);
      texture.wrapS = texture.wrapT = T.RepeatWrapping;
      texture.repeat.set(this.region.mode === "underwater" ? 11 : 18, this.region.mode === "underwater" ? 11 : 18);
      texture.colorSpace = T.NoColorSpace;
      texture.anisotropy = Math.min(8, this.renderer.capabilities.getMaxAnisotropy());
      return texture;
    }

    ensureWater() {
      if (!["underwater", "coastal"].includes(this.region.mode)) return;
      const T = this.THREE;
      const width = Math.max(120, this.bounds.maxX - this.bounds.minX + 20);
      const depth = Math.max(120, this.bounds.maxZ - this.bounds.minZ + 20);
      const geometry = new T.PlaneGeometry(width, depth, 48, 48);
      geometry.rotateX(-Math.PI / 2);
      const waves = this.createWaterTexture();
      const material = new T.MeshPhysicalMaterial({
        color: this.region.mode === "underwater" ? 0x0a506e : 0x197f9c,
        transparent: true,
        opacity: this.region.mode === "underwater" ? 0.50 : 0.66,
        roughness: this.region.mode === "underwater" ? 0.24 : 0.16,
        metalness: 0,
        transmission: this.region.mode === "underwater" ? 0.08 : 0.16,
        clearcoat: this.region.mode === "underwater" ? 0.18 : 0.46,
        clearcoatRoughness: 0.22,
        bumpMap: waves,
        bumpScale: this.region.mode === "underwater" ? 0.055 : 0.035,
        depthWrite: false,
        side: T.DoubleSide
      });
      material.userData.waveTexture = waves;
      this.water = new T.Mesh(geometry, material);
      this.water.position.y = 0;
      this.water.renderOrder = 3;
      this.scene.add(this.water);
    }

    ensureEnvironment() {
      const T = this.THREE;
      const visual = REGION_VISUALS[this.region.id] || REGION_VISUALS.maunakea;
      const geometry = new T.SphereGeometry(430, 32, 18);
      const material = new T.ShaderMaterial({
        side: T.BackSide,
        depthWrite: false,
        fog: false,
        uniforms: {
          uTop: { value: new T.Color(visual.skyTop) },
          uHorizon: { value: new T.Color(visual.skyHorizon) },
          uUnderwater: { value: this.region.mode === "underwater" ? 1 : 0 }
        },
        vertexShader: `varying vec3 vSkyPos; void main(){ vSkyPos=position; gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.0); }`,
        fragmentShader: `varying vec3 vSkyPos; uniform vec3 uTop; uniform vec3 uHorizon; uniform float uUnderwater; void main(){ float h=clamp(normalize(vSkyPos).y*0.5+0.5,0.0,1.0); h=smoothstep(0.12,0.92,h); vec3 col=mix(uHorizon,uTop,h); if(uUnderwater>0.5){ col*=mix(0.48,0.82,h); } gl_FragColor=vec4(col,1.0); }`
      });
      this.sky = new T.Mesh(geometry, material);
      this.sky.renderOrder = -20;
      this.scene.add(this.sky);

      if (this.region.mode === "underwater") {
        const count = this.quality.name === "LOW" ? 260 : 520;
        const positions = new Float32Array(count * 3);
        let state = 1847;
        const rand = () => { state = (state * 1664525 + 1013904223) >>> 0; return state / 4294967296; };
        for (let i = 0; i < count; i += 1) {
          positions[i * 3] = (rand() - 0.5) * 90;
          positions[i * 3 + 1] = -0.3 - rand() * 11;
          positions[i * 3 + 2] = (rand() - 0.5) * 90;
        }
        const pointsGeometry = new T.BufferGeometry();
        pointsGeometry.setAttribute("position", new T.BufferAttribute(positions, 3));
        const pointsMaterial = new T.PointsMaterial({ color:0xa8c6cf, size:this.quality.name === "LOW" ? 0.035 : 0.025, transparent:true, opacity:0.24, depthWrite:false, sizeAttenuation:true });
        this.particles = new T.Points(pointsGeometry, pointsMaterial);
        this.scene.add(this.particles);
      }
    }

    resizeWater() {
      if (!this.water) return;
      const width = Math.max(120, this.bounds.maxX - this.bounds.minX + 20);
      const depth = Math.max(120, this.bounds.maxZ - this.bounds.minZ + 20);
      this.water.geometry.dispose();
      this.water.geometry = new this.THREE.PlaneGeometry(width, depth, 48, 48);
      this.water.geometry.rotateX(-Math.PI / 2);
    }

    updateEnvironment(dt, camera) {
      this.environmentTime += dt;
      if (this.water?.material?.userData?.waveTexture) {
        const wave = this.water.material.userData.waveTexture;
        wave.offset.x = (wave.offset.x + dt * 0.006) % 1;
        wave.offset.y = (wave.offset.y + dt * 0.0035) % 1;
      }
      if (this.sky && camera) this.sky.position.copy(camera.position);
      if (this.particles && camera) {
        this.particles.position.x += (camera.position.x - this.particles.position.x) * Math.min(1, dt * 0.65);
        this.particles.position.z += (camera.position.z - this.particles.position.z) * Math.min(1, dt * 0.65);
        this.particles.rotation.y += dt * 0.012;
      }
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
        this.water.material.userData.waveTexture?.dispose?.();
        this.water.material.dispose();
        this.water = null;
      }
      if (this.sky) {
        this.scene.remove(this.sky);
        this.sky.geometry.dispose();
        this.sky.material.dispose();
        this.sky = null;
      }
      if (this.particles) {
        this.scene.remove(this.particles);
        this.particles.geometry.dispose();
        this.particles.material.dispose();
        this.particles = null;
      }
      const textures = this.material.userData.surfaceTextures || {};
      Object.values(textures).forEach(texture => texture?.dispose?.());
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
        if (event.code === "Escape") {
          event.preventDefault();
          event.stopImmediatePropagation();
          if (document.pointerLockElement === this.controller.viewport) document.exitPointerLock?.();
          this.controller.exit();
        }
      });
      document.addEventListener("keyup", event => this.keys.delete(event.code));
      this.controller.viewport.addEventListener("click", () => {
        if (!this.controller.active || window.matchMedia("(pointer: coarse)").matches) return;
        this.controller.viewport.requestPointerLock?.();
      });
      document.addEventListener("pointerlockchange", () => {
        if (document.pointerLockElement === this.controller.viewport) {
          this.hadEarthPointerLock = true;
          return;
        }
        if (this.hadEarthPointerLock && this.controller.active) {
          this.hadEarthPointerLock = false;
          this.controller.exit();
        }
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
      this.hemiLight = null;
      this.sunLight = null;
      this.fillLight = null;
      this.frame = null;
      this.previous = 0;
      this.yaw = 0;
      this.pitch = -0.2;
      this.lookYawTarget = 0;
      this.lookPitchTarget = -0.2;
      this.speed = 0;
      this.transitionToken = 0;
      this.entryTargetY = 0;
      this.entryStartY = 0;
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
        button.innerHTML = `<span class="earth-region-preview earth-region-preview-${region.id}" aria-hidden="true"><i></i><b>${region.short}</b></span><span class="earth-region-index">${String(REGIONS.indexOf(region) + 1).padStart(2, "0")}</span><strong>${region.name}</strong><span class="earth-region-descriptor">${region.descriptor}</span><small>${formatLatLon(region.latitude, region.longitude)}</small><em>${region.mode === "underwater" ? "BATHYMETRY" : region.mode === "coastal" ? "LAND + OCEAN" : "REAL DEM"}</em><span class="earth-region-source">${region.sourceLabel}</span>`;
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
      document.addEventListener("keydown", event => {
        if (event.code !== "Escape") return;
        if (this.state === STATES.SELECTING || this.state === STATES.PREPARING || this.state === STATES.ENTERING) {
          event.preventDefault();
          event.stopImmediatePropagation();
          this.exit();
        }
      });
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
      this.state = STATES.SELECTING;
      this.root.hidden = false;
      this.root.inert = false;
      this.root.setAttribute("aria-hidden", "false");
      this.root.className = "earth-full-exploration is-selecting";
      this.selector.hidden = false;
      this.errorPanel.hidden = true;
      this.loading.hidden = true;
      document.getElementById("mission").classList.add("is-earth-full-selecting");
      this.earth.beginFullExplorationFocus?.(null);
      document.getElementById("announcement").textContent = "Pilih destinasi untuk Eksplorasi Pengalaman Penuh Bumi.";
      requestAnimationFrame(() => this.selector.querySelector("[data-earth-region]")?.focus({ preventScroll:true }));
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
      this.tutorial.classList.add("is-dismissed");
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
        await this.runEntryTransition(token);
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
      this.hemiLight = new T.HemisphereLight(0xd9edff, 0x3d322b, 0.78); this.scene.add(this.hemiLight);
      this.sunLight = new T.DirectionalLight(0xfff0d2, 2.6); this.sunLight.position.set(-45, 70, 35); this.scene.add(this.sunLight);
      this.fillLight = new T.DirectionalLight(0x91b9dc, 0.24); this.fillLight.position.set(45, 20, -30); this.scene.add(this.fillLight);
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
      this.setCameraForRegion(region, { entry: true });
      this.updateRegionUI();
      void this.terrain.loadExtended();
    }

    setCameraForRegion(region, { entry = false } = {}) {
      const ground = this.terrain.heightAtWorld(0, 0) ?? 0;
      const zOffset = region.id === "grandcanyon" ? 11 : region.id === "antarctica" ? 14 : region.id === "mariana" ? 18 : 12;
      const targetY = Number.isFinite(region.startAbsoluteY) ? region.startAbsoluteY : ground + region.startAltitude;
      const entryLift = region.mode === "underwater" ? 18 : 38;
      this.entryTargetY = targetY;
      this.entryStartY = targetY + entryLift;
      this.camera.position.set(0, entry ? this.entryStartY : targetY, zOffset);
      this.yaw = region.yaw || 0;
      this.pitch = region.pitch || -0.2;
      this.lookYawTarget = this.yaw;
      this.lookPitchTarget = this.pitch;
      this.applyCameraRotation();
      this.terrain.clampPosition(this.camera.position);
    }

    updateRegionUI() {
      const region = this.region;
      this.applyRegionLighting();
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

    applyRegionLighting() {
      if (!this.scene || !this.renderer) return;
      const visual = REGION_VISUALS[this.region.id] || REGION_VISUALS.maunakea;
      this.scene.fog.color.set(visual.fog);
      this.scene.fog.density = visual.fogDensity;
      this.renderer.toneMappingExposure = visual.exposure;
      this.renderer.setClearColor(visual.skyHorizon, 1);
      if (this.hemiLight) {
        this.hemiLight.color.set(visual.hemiSky);
        this.hemiLight.groundColor.set(visual.hemiGround);
        this.hemiLight.intensity = this.region.id === "mariana" ? 0.48 : this.region.id === "antarctica" ? 0.92 : 0.82;
      }
      if (this.sunLight) {
        this.sunLight.color.set(visual.sun);
        this.sunLight.intensity = visual.sunIntensity;
        if (this.region.id === "grandcanyon") this.sunLight.position.set(-52, 44, 28);
        else if (this.region.id === "everest") this.sunLight.position.set(-38, 78, 24);
        else this.sunLight.position.set(-45, 66, 35);
      }
      if (this.fillLight) this.fillLight.intensity = this.region.id === "mariana" ? 0.10 : 0.27;
    }

    async runEntryTransition(token) {
      this.state = STATES.ENTERING;
      this.root.classList.remove("is-preparing");
      this.root.classList.add("is-entering");
      this.loading.hidden = true;
      const reduced = this.earth.motion?.matches || matchMedia("(prefers-reduced-motion: reduce)").matches;
      const duration = reduced ? 400 : 4700;
      const start = performance.now();
      const startY = this.entryStartY;
      const targetY = this.entryTargetY;

      await new Promise(resolve => {
        const frame = now => {
          if (token !== this.transitionToken || this.state !== STATES.ENTERING) return resolve();
          const raw = clamp((now - start) / duration, 0, 1);
          const eased = smootherstep(raw);
          const surface = smoothstep((raw - 0.48) / 0.40);
          this.earth.setFullExplorationTransition?.(eased, this.region);
          this.root.style.setProperty("--surface", String(surface));
          this.root.style.setProperty("--entry-progress", String(eased));
          this.camera.position.y = lerp(startY, targetY, smoothstep((raw - 0.46) / 0.54));
          this.terrain?.update(this.camera);
          this.renderer?.render(this.scene, this.camera);
          if (raw < 1) requestAnimationFrame(frame); else resolve();
        };
        requestAnimationFrame(frame);
      });

      if (token !== this.transitionToken || this.state !== STATES.ENTERING) return;
      this.activateRegion();
    }

    activateRegion() {
      this.state = STATES.ACTIVE;
      this.root.classList.remove("is-preparing", "is-entering");
      this.root.classList.add("is-active", "is-surface-visible");
      this.root.style.setProperty("--surface", "1");
      this.root.style.setProperty("--entry-progress", "1");
      this.loading.hidden = true;
      this.earth.setFullExplorationTransition?.(1, this.region);
      this.earth.completeFullExplorationHandoff?.();
      this.tutorial.classList.remove("is-dismissed");
      this.previous = performance.now();
      this.startLoop();
      this.updateHUD();
      document.getElementById("announcement").textContent = `Eksplorasi terrain real ${this.region.name} aktif. Gunakan WASD atau kontrol layar untuk bergerak.`;
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
      this.terrain.updateEnvironment(dt, this.camera);
      this.updateEnvironment();
      this.updateHUD();
    }

    updateEnvironment() {
      if (!this.scene?.fog) return;
      const visual = REGION_VISUALS[this.region.id] || REGION_VISUALS.maunakea;
      const underwater = this.region.id === "mariana" && this.camera.position.y < -0.05;
      if (underwater) {
        const depth = clamp(Math.abs(this.camera.position.y) / 10.5, 0, 1);
        this.scene.fog.color.set(0x082c3c).lerp(new this.THREE.Color(0x03151f), depth * 0.72);
        this.scene.fog.density = lerp(0.018, 0.052, depth);
        this.renderer.setClearColor(new this.THREE.Color(0x0c3a4d).lerp(new this.THREE.Color(0x02111a), depth * 0.78), 1);
        this.root.classList.add("is-underwater");
      } else {
        this.scene.fog.color.set(visual.fog);
        this.scene.fog.density = visual.fogDensity;
        this.renderer.setClearColor(visual.skyHorizon, 1);
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
      this.earth.setFullExplorationTransition?.(0, this.region);
      this.earth.returnFromFullExplorationToSelector?.();
      requestAnimationFrame(() => this.selector.querySelector(`[data-earth-region="${this.region.id}"]`)?.focus({ preventScroll: true }));
    }

    async exit() {
      if (![STATES.ACTIVE, STATES.PREPARING, STATES.SELECTING, STATES.ENTERING].includes(this.state)) return;
      const previousState = this.state;
      const token = ++this.transitionToken;
      this.state = STATES.EXITING;
      this.stopLoop();
      this.input.reset();
      if (document.pointerLockElement === this.viewport) document.exitPointerLock?.();
      this.tutorial.classList.add("is-dismissed");
      this.root.classList.add("is-exiting");
      document.getElementById("announcement").textContent = "Meninggalkan terrain Bumi dan kembali ke panorama orbit.";

      const canAnimateSurface = Boolean(this.renderer && this.camera && this.terrain && [STATES.ACTIVE, STATES.ENTERING].includes(previousState));
      if (canAnimateSurface) {
        const reduced = this.earth.motion?.matches || matchMedia("(prefers-reduced-motion: reduce)").matches;
        const liftDuration = reduced ? 120 : 1650;
        const liftStart = performance.now();
        const fromY = this.camera.position.y;
        const toY = Math.max(fromY, this.entryStartY || fromY + 38);
        await new Promise(resolve => {
          const frame = now => {
            if (token !== this.transitionToken || this.state !== STATES.EXITING) return resolve();
            const raw = clamp((now - liftStart) / liftDuration, 0, 1);
            this.camera.position.y = lerp(fromY, toY, smootherstep(raw));
            this.terrain?.update(this.camera);
            this.renderer?.render(this.scene, this.camera);
            if (raw < 1) requestAnimationFrame(frame); else resolve();
          };
          requestAnimationFrame(frame);
        });
        if (token !== this.transitionToken || this.state !== STATES.EXITING) return;

        const duration = reduced ? 260 : 3200;
        const start = performance.now();
        await new Promise(resolve => {
          const frame = now => {
            if (token !== this.transitionToken || this.state !== STATES.EXITING) return resolve();
            const raw = clamp((now - start) / duration, 0, 1);
            const eased = smootherstep(raw);
            this.root.style.setProperty("--surface", String(1 - smoothstep(raw / 0.62)));
            this.root.style.setProperty("--entry-progress", String(1 - eased));
            this.earth.setFullExplorationTransition?.(1 - eased, this.region);
            this.renderer?.render(this.scene, this.camera);
            if (raw < 1) requestAnimationFrame(frame); else resolve();
          };
          requestAnimationFrame(frame);
        });
        if (token !== this.transitionToken || this.state !== STATES.EXITING) return;
      } else if (previousState === STATES.SELECTING || previousState === STATES.PREPARING) {
        await wait((this.earth.motion?.matches || matchMedia("(prefers-reduced-motion: reduce)").matches) ? 20 : 220);
        if (token !== this.transitionToken || this.state !== STATES.EXITING) return;
      }
      this.finishExit();
    }

    finishExit() {
      if (document.fullscreenElement === this.root) document.exitFullscreen().catch(() => {});
      this.stopLoop();
      this.input.reset();
      this.disposeTerrain();
      this.disposeRenderer();
      this.root.hidden = true;
      this.root.inert = true;
      this.root.setAttribute("aria-hidden", "true");
      this.root.className = "earth-full-exploration";
      this.root.style.removeProperty("--surface");
      this.root.style.removeProperty("--entry-progress");
      document.getElementById("mission").classList.remove("is-earth-full", "is-earth-full-selecting");
      this.earth.setFullExplorationTransition?.(0, this.region);
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
      this.root.style.removeProperty("--surface");
      this.root.style.removeProperty("--entry-progress");
      this.selector.hidden = false;
      document.getElementById("mission").classList.remove("is-earth-full", "is-earth-full-selecting");
      this.earth.setFullExplorationTransition?.(0, this.region);
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
