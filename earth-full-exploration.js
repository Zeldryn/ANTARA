"use strict";

(() => {
  /*
   * ANTARA Earth Full Exploration
   *
   * Architecture intentionally mirrors the proven Mars full-exploration system:
   * - one exploration world from the user's point of view
   * - local streamed DEM tiles around the camera internally
   * - geometry LOD, frustum/view dependent activation, look-ahead prefetch
   * - Mars-style pointer-lock controls, camera smoothing, clearance and 30 km ceiling
   * - the same staged panorama -> surface entry and surface -> panorama exit lifecycle
   *
   * Earth-specific content remains Earth-specific. Elevation comes from Mapzen
   * Terrarium tiles (Amazon Public Dataset). Broad surface colour comes from the
   * project's NASA Blue Marble image, while Earth material/atmosphere/water detail
   * is generated locally so the close view does not become a stretched 4K globe.
   */

  const TERRARIUM_TEMPLATE = "https://s3.amazonaws.com/elevation-tiles-prod/terrarium/{z}/{x}/{y}.png";
  const MAPZEN_SOURCE = "Terrarium DEM · Mapzen / Amazon Public Dataset";
  const KM_PER_DEG_LAT = 111.32;
  const DEG = Math.PI / 180;
  const MIN_DATA_LAT = -84.8;
  const MAX_DATA_LAT = 84.8;
  const MAX_EXPLORATION_ALTITUDE_KM = 30;
  const ALTITUDE_LIMIT_WARNING_KM = 27.5;
  const TILE_SIZE = 256;

  // One entry anchor only. This is NOT a destination system. Once the handoff is
  // complete, terrain streams continuously around the camera like Mars.
  const EARTH_ENTRY = Object.freeze({
    name: "Jawa · Indonesia",
    latitude: -7.55,
    longitude: 110.44,
    heading: -0.12,
    pitch: -0.27
  });

  const STATES = Object.freeze({
    IDLE: "idle",
    PREPARING: "preparing",
    ENTERING: "entering",
    EXPLORING: "exploring",
    EXITING: "exiting",
    ERROR: "error"
  });

  const clamp = (value, min, max) => Math.max(min, Math.min(max, value));
  const lerp = (a, b, t) => a + (b - a) * t;
  const smoothstep = value => {
    const t = clamp(value, 0, 1);
    return t * t * (3 - 2 * t);
  };
  const smootherstep = value => {
    const t = clamp(value, 0, 1);
    return t * t * t * (t * (t * 6 - 15) + 10);
  };
  const wrapLongitude = lon => {
    let value = lon;
    while (value < -180) value += 360;
    while (value >= 180) value -= 360;
    return value;
  };
  const shortestLongitudeDelta = (from, to) => wrapLongitude(to - from);
  const formatLatLon = (lat, lon) => `${Math.abs(lat).toFixed(4)}° ${lat >= 0 ? "N" : "S"} · ${Math.abs(lon).toFixed(4)}° ${lon >= 0 ? "E" : "W"}`;
  const formatAltitude = km => km < 1 ? `${Math.round(km * 1000)} M` : `${km.toFixed(km < 10 ? 2 : 1)} KM`;
  const formatElevation = km => {
    const absolute = Math.abs(km);
    const formatted = absolute < 1 ? `${Math.round(absolute * 1000)} M` : `${absolute.toFixed(absolute < 10 ? 2 : 1)} KM`;
    return km < 0 ? `${formatted} BSL` : `${formatted} AMSL`;
  };
  const formatSpeed = kmPerSecond => {
    const metresPerSecond = kmPerSecond * 1000;
    if (metresPerSecond < 1000) return `${Math.round(metresPerSecond)} M/S`;
    return `${kmPerSecond.toFixed(kmPerSecond < 10 ? 2 : 1)} KM/S`;
  };

  class TerrariumProvider {
    constructor(zoom) {
      this.zoom = zoom;
      this.cache = new Map();
      this.pending = new Map();
      this.generation = 0;
      this.maxCache = 96;
    }

    address(latitude, longitude, zoom = this.zoom) {
      const n = 2 ** zoom;
      const lat = clamp(latitude, -85.05112878, 85.05112878);
      const xFloat = (wrapLongitude(longitude) + 180) / 360 * n;
      const latRad = lat * DEG;
      const yFloat = (1 - Math.asinh(Math.tan(latRad)) / Math.PI) / 2 * n;
      return {
        xFloat,
        yFloat,
        x: ((Math.floor(xFloat) % n) + n) % n,
        y: clamp(Math.floor(yFloat), 0, n - 1),
        zoom
      };
    }

    longitudeForX(x, zoom = this.zoom) {
      return x / (2 ** zoom) * 360 - 180;
    }

    latitudeForY(y, zoom = this.zoom) {
      const n = Math.PI - 2 * Math.PI * y / (2 ** zoom);
      return 180 / Math.PI * Math.atan(Math.sinh(n));
    }

    tileKey(z, x, y) {
      const n = 2 ** z;
      const safeX = ((x % n) + n) % n;
      const safeY = clamp(y, 0, n - 1);
      return `${z}/${safeX}/${safeY}`;
    }

    tileForLocation(latitude, longitude) {
      const address = this.address(latitude, longitude, this.zoom);
      return { z: this.zoom, x: address.x, y: address.y };
    }

    url(z, x, y) {
      return TERRARIUM_TEMPLATE.replace("{z}", z).replace("{x}", x).replace("{y}", y);
    }

    async load(z, x, y) {
      const n = 2 ** z;
      const safeX = ((x % n) + n) % n;
      const safeY = clamp(y, 0, n - 1);
      const key = this.tileKey(z, safeX, safeY);
      const cached = this.cache.get(key);
      if (cached) {
        cached.lastUsed = performance.now();
        return cached;
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
        }, 18000);

        image.onload = () => {
          if (settled) return;
          settled = true;
          clearTimeout(timer);
          if (generation !== this.generation) {
            reject(new Error("Permintaan DEM dibatalkan."));
            return;
          }
          try {
            const canvas = document.createElement("canvas");
            canvas.width = TILE_SIZE;
            canvas.height = TILE_SIZE;
            const context = canvas.getContext("2d", { willReadFrequently: true });
            if (!context) throw new Error("Canvas DEM tidak tersedia.");
            context.drawImage(image, 0, 0, TILE_SIZE, TILE_SIZE);
            const rgba = context.getImageData(0, 0, TILE_SIZE, TILE_SIZE).data;
            const heights = new Float32Array(TILE_SIZE * TILE_SIZE);
            let min = Infinity;
            let max = -Infinity;
            for (let i = 0, p = 0; p < heights.length; p += 1, i += 4) {
              const metres = rgba[i] * 256 + rgba[i + 1] + rgba[i + 2] / 256 - 32768;
              const km = metres / 1000;
              heights[p] = km;
              min = Math.min(min, km);
              max = Math.max(max, km);
            }
            const tile = { z, x: safeX, y: safeY, heights, min, max, src, lastUsed: performance.now() };
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

    sampleTile(tile, latitude, longitude) {
      const address = this.address(latitude, longitude, tile.z);
      const n = 2 ** tile.z;
      // Sample relative to THIS tile, not the fractional part of the global
      // Web-Mercator coordinate. The latter folds exact east/south borders back
      // to zero and creates visible seams between streamed chunks.
      let localX = address.xFloat - tile.x;
      if (localX < -0.5) localX += n;
      if (localX > n - 0.5) localX -= n;
      const localY = address.yFloat - tile.y;
      const u = clamp(localX, 0, 1);
      const v = clamp(localY, 0, 1);
      const x = u * (TILE_SIZE - 1);
      const y = v * (TILE_SIZE - 1);
      const x0 = Math.floor(x);
      const y0 = Math.floor(y);
      const x1 = Math.min(TILE_SIZE - 1, x0 + 1);
      const y1 = Math.min(TILE_SIZE - 1, y0 + 1);
      const tx = x - x0;
      const ty = y - y0;
      const h00 = tile.heights[y0 * TILE_SIZE + x0];
      const h10 = tile.heights[y0 * TILE_SIZE + x1];
      const h01 = tile.heights[y1 * TILE_SIZE + x0];
      const h11 = tile.heights[y1 * TILE_SIZE + x1];
      return lerp(lerp(h00, h10, tx), lerp(h01, h11, tx), ty);
    }

    sampleCached(latitude, longitude) {
      const address = this.address(latitude, longitude, this.zoom);
      const tile = this.cache.get(this.tileKey(this.zoom, address.x, address.y));
      if (!tile) return null;
      tile.lastUsed = performance.now();
      return this.sampleTile(tile, latitude, longitude);
    }

    trim() {
      if (this.cache.size <= this.maxCache) return;
      const sorted = [...this.cache.entries()].sort((a, b) => a[1].lastUsed - b[1].lastUsed);
      while (this.cache.size > this.maxCache && sorted.length) {
        this.cache.delete(sorted.shift()[0]);
      }
    }

    clear() {
      this.generation += 1;
      this.pending.clear();
      this.cache.clear();
    }
  }

  class EarthTerrainManager {
    constructor(THREE, scene, renderer, provider, surfaceImage, quality) {
      this.THREE = THREE;
      this.scene = scene;
      this.renderer = renderer;
      this.provider = provider;
      this.quality = quality;
      this.group = new THREE.Group();
      this.group.name = "ANTARA Earth streamed terrain";
      this.scene.add(this.group);
      this.meshes = new Map();
      this.origin = { latitude: EARTH_ENTRY.latitude, longitude: EARTH_ENTRY.longitude };
      this.requestGeneration = 0;
      this.lastCenterTile = "";
      this.frustum = new THREE.Frustum();
      this.projectionScreenMatrix = new THREE.Matrix4();
      this.cameraForward = new THREE.Vector3();
      this.chunkCenter = new THREE.Vector3();
      this.chunkVector = new THREE.Vector3();
      this.visibilityStats = { visible: 0, buffered: 0, culled: 0, high: 0, medium: 0, low: 0 };
      this.water = null;
      this.sky = null;
      this.environmentTime = 0;
      this.surfaceImage = surfaceImage || null;
      this.detailTexture = this.createDetailTexture();
      this.roughnessTexture = this.createRoughnessTexture();
    }

    setOrigin(latitude, longitude) {
      this.origin.latitude = clamp(latitude, MIN_DATA_LAT, MAX_DATA_LAT);
      this.origin.longitude = wrapLongitude(longitude);
      this.lastCenterTile = "";
    }

    worldFromGeo(latitude, longitude) {
      const cosLatitude = Math.max(0.08, Math.cos(this.origin.latitude * DEG));
      return {
        x: shortestLongitudeDelta(this.origin.longitude, longitude) * KM_PER_DEG_LAT * cosLatitude,
        z: -(latitude - this.origin.latitude) * KM_PER_DEG_LAT
      };
    }

    geoFromWorld(x, z) {
      const cosLatitude = Math.max(0.08, Math.cos(this.origin.latitude * DEG));
      const latitude = clamp(this.origin.latitude - z / KM_PER_DEG_LAT, MIN_DATA_LAT, MAX_DATA_LAT);
      const longitude = wrapLongitude(this.origin.longitude + x / (KM_PER_DEG_LAT * cosLatitude));
      return { latitude, longitude };
    }

    createDetailTexture() {
      const T = this.THREE;
      const size = this.quality.name === "LOW" ? 128 : 256;
      const canvas = document.createElement("canvas");
      canvas.width = canvas.height = size;
      const context = canvas.getContext("2d");
      const image = context.createImageData(size, size);
      for (let y = 0; y < size; y += 1) {
        for (let x = 0; x < size; x += 1) {
          const p = (y * size + x) * 4;
          const nx = x / size * Math.PI * 2;
          const ny = y / size * Math.PI * 2;
          const broad = Math.sin(nx * 3.1 + ny * 1.7) * Math.cos(ny * 4.3 - nx * 1.4);
          const mid = Math.sin(nx * 11.7 - ny * 8.2) * 0.55 + Math.cos(nx * 7.4 + ny * 13.1) * 0.45;
          const fine = Math.sin(nx * 29.3 + ny * 23.9) * Math.cos(nx * 21.7 - ny * 31.1);
          const value = Math.round(clamp(128 + broad * 18 + mid * 23 + fine * 12, 35, 225));
          image.data[p] = value;
          image.data[p + 1] = value;
          image.data[p + 2] = value;
          image.data[p + 3] = 255;
        }
      }
      context.putImageData(image, 0, 0);
      const texture = new T.CanvasTexture(canvas);
      texture.wrapS = texture.wrapT = T.RepeatWrapping;
      texture.colorSpace = T.NoColorSpace;
      texture.anisotropy = Math.min(this.quality.anisotropy, this.renderer.capabilities.getMaxAnisotropy());
      texture.needsUpdate = true;
      return texture;
    }

    createRoughnessTexture() {
      const T = this.THREE;
      const size = 128;
      const canvas = document.createElement("canvas");
      canvas.width = canvas.height = size;
      const context = canvas.getContext("2d");
      const image = context.createImageData(size, size);
      for (let y = 0; y < size; y += 1) {
        for (let x = 0; x < size; x += 1) {
          const p = (y * size + x) * 4;
          const wave = Math.sin(x * 0.31 + y * 0.11) * 0.55 + Math.cos(x * 0.09 - y * 0.27) * 0.45;
          const value = Math.round(clamp(210 + wave * 24, 145, 248));
          image.data[p] = image.data[p + 1] = image.data[p + 2] = value;
          image.data[p + 3] = 255;
        }
      }
      context.putImageData(image, 0, 0);
      const texture = new T.CanvasTexture(canvas);
      texture.wrapS = texture.wrapT = T.RepeatWrapping;
      texture.colorSpace = T.NoColorSpace;
      texture.anisotropy = Math.min(8, this.renderer.capabilities.getMaxAnisotropy());
      texture.needsUpdate = true;
      return texture;
    }

    createSurfacePatch(tile) {
      if (!this.surfaceImage) return null;
      const T = this.THREE;
      const size = this.quality.textureSize;
      const canvas = document.createElement("canvas");
      canvas.width = canvas.height = size;
      const context = canvas.getContext("2d");
      context.imageSmoothingEnabled = true;
      context.imageSmoothingQuality = "high";
      const lonW = this.provider.longitudeForX(tile.x, tile.z);
      const lonE = this.provider.longitudeForX(tile.x + 1, tile.z);
      const latN = this.provider.latitudeForY(tile.y, tile.z);
      const latS = this.provider.latitudeForY(tile.y + 1, tile.z);
      const sourceWidth = this.surfaceImage.naturalWidth || this.surfaceImage.width || 4096;
      const sourceHeight = this.surfaceImage.naturalHeight || this.surfaceImage.height || 2048;
      const sx = clamp((lonW + 180) / 360 * sourceWidth, 0, sourceWidth - 1);
      const sy = clamp((90 - latN) / 180 * sourceHeight, 0, sourceHeight - 1);
      const sw = Math.max(1, (lonE - lonW) / 360 * sourceWidth);
      const sh = Math.max(1, (latN - latS) / 180 * sourceHeight);
      context.drawImage(this.surfaceImage, sx, sy, Math.min(sw, sourceWidth - sx), Math.min(sh, sourceHeight - sy), 0, 0, size, size);

      // Add only high-frequency visual detail. Macro geography remains Blue Marble.
      context.globalCompositeOperation = "soft-light";
      context.globalAlpha = 0.18;
      context.drawImage(this.detailTexture.image, 0, 0, size, size);
      context.globalAlpha = 1;
      context.globalCompositeOperation = "source-over";

      const texture = new T.CanvasTexture(canvas);
      texture.colorSpace = T.SRGBColorSpace;
      texture.wrapS = texture.wrapT = T.ClampToEdgeWrapping;
      texture.minFilter = T.LinearMipmapLinearFilter;
      texture.magFilter = T.LinearFilter;
      texture.generateMipmaps = true;
      texture.anisotropy = Math.min(this.quality.anisotropy, this.renderer.capabilities.getMaxAnisotropy());
      texture.needsUpdate = true;
      return texture;
    }

    earthMaterialColor(heightKm, latitude, slope, longitude) {
      const T = this.THREE;
      const mix = (a, b, t) => new T.Color(a).lerp(new T.Color(b), clamp(t, 0, 1));
      const absLat = Math.abs(latitude);
      const moisture = 0.5 + 0.5 * Math.sin(longitude * DEG * 5.1 + latitude * DEG * 3.7);
      const snowLine = clamp(5.4 - absLat * 0.055, 0.5, 5.4);

      if (heightKm < -0.03) {
        const depth = clamp(-heightKm / 8, 0, 1);
        return mix(0x6c8078, 0x334953, depth).multiplyScalar(0.92);
      }
      if (absLat > 68) {
        const ice = mix(0xd5e9ef, 0xf7fcff, clamp((absLat - 68) / 16, 0, 1));
        return ice.lerp(new T.Color(0xaecbd8), clamp(slope * 0.24, 0, 0.24));
      }
      if (heightKm >= snowLine) {
        const snow = mix(0xdce7e8, 0xf8fbfb, smoothstep((heightKm - snowLine) / 1.8));
        return snow.lerp(new T.Color(0xaeb6b4), clamp(slope * 0.32, 0, 0.30));
      }
      if (heightKm > 2.25 || slope > 0.62) {
        const rock = mix(0x9b8d78, 0xc5bca9, clamp((heightKm - 1.7) / 2.5, 0, 1));
        return rock.lerp(new T.Color(0x706d68), clamp((slope - 0.5) * 0.65, 0, 0.34));
      }
      if (heightKm < 0.12) {
        return moisture > 0.45 ? mix(0xb5aa78, 0x8fa45f, moisture) : mix(0xc7a66d, 0xa98c59, moisture + 0.35);
      }
      if (absLat < 30) {
        return moisture > 0.38 ? mix(0x6f8b55, 0x93aa67, moisture) : mix(0xaa8d5c, 0x8c8152, moisture);
      }
      if (absLat < 52) {
        return mix(0x7e8d61, 0xa19a72, clamp(heightKm / 1.9, 0, 1));
      }
      return mix(0x8c9678, 0xb3ad91, clamp((absLat - 52) / 16, 0, 1));
    }

    configureTerrainMaterial(material) {
      material.onBeforeCompile = shader => {
        shader.uniforms.uEarthDetail = { value: this.detailTexture };
        shader.uniforms.uEarthRough = { value: this.roughnessTexture };
        shader.uniforms.uEarthDetailTier = { value: 3 };
        shader.vertexShader = shader.vertexShader
          .replace("#include <common>", "#include <common>\nvarying vec3 vEarthWorldPosition;")
          .replace("#include <begin_vertex>", "#include <begin_vertex>\nvEarthWorldPosition = (modelMatrix * vec4(transformed, 1.0)).xyz;");
        shader.fragmentShader = shader.fragmentShader
          .replace("#include <common>", `#include <common>
            varying vec3 vEarthWorldPosition;
            uniform sampler2D uEarthDetail;
            uniform sampler2D uEarthRough;
            uniform float uEarthDetailTier;
            float earthTriSample(sampler2D tex, vec3 p, vec3 n, float scale, vec3 phase) {
              vec3 blend = pow(max(abs(n), vec3(0.0001)), vec3(5.0));
              blend /= max(blend.x + blend.y + blend.z, 0.0001);
              float sx = texture2D(tex, p.yz * scale + phase.yz).r;
              float sy = texture2D(tex, p.xz * scale + phase.xz).r;
              float sz = texture2D(tex, p.xy * scale + phase.xy).r;
              return sx * blend.x + sy * blend.y + sz * blend.z;
            }`)
          .replace("#include <map_fragment>", `#include <map_fragment>
            if (uEarthDetailTier > 0.5) {
              vec3 dx = dFdx(vEarthWorldPosition);
              vec3 dy = dFdy(vEarthWorldPosition);
              vec3 geomN = normalize(cross(dx, dy));
              if (!gl_FrontFacing) geomN = -geomN;
              float viewDistance = length(cameraPosition - vEarthWorldPosition);
              float nearWeight = 1.0 - smoothstep(12.0, 72.0, viewDistance);
              float broad = earthTriSample(uEarthDetail, vEarthWorldPosition, geomN, 0.52, vec3(0.17,0.43,0.71));
              float fine = uEarthDetailTier > 1.5 ? earthTriSample(uEarthDetail, vEarthWorldPosition, geomN, 2.45, vec3(0.63,0.11,0.29)) : 0.5;
              float micro = (broad - 0.5) * 0.11 + (fine - 0.5) * 0.075 * nearWeight;
              diffuseColor.rgb *= clamp(1.0 + micro, 0.86, 1.14);
            }`)
          .replace("#include <roughnessmap_fragment>", `#include <roughnessmap_fragment>
            if (uEarthDetailTier > 1.5) {
              vec3 dx = dFdx(vEarthWorldPosition);
              vec3 dy = dFdy(vEarthWorldPosition);
              vec3 geomN = normalize(cross(dx, dy));
              float roughSample = earthTriSample(uEarthRough, vEarthWorldPosition, geomN, 0.72, vec3(0.41,0.19,0.83));
              roughnessFactor = clamp(roughnessFactor + (roughSample - 0.5) * 0.16, 0.56, 0.99);
            }`);
        material.userData.earthShader = shader;
      };
      material.customProgramCacheKey = () => `antara-earth-streamed-material-v1-${this.quality.name}`;
      material.needsUpdate = true;
      return material;
    }

    setEntryDetailTier(entry, tier) {
      const next = clamp(Math.round(tier), 0, 3);
      if (!entry?.mesh?.material || entry.detailTier === next) return;
      entry.detailTier = next;
      const shader = entry.mesh.material.userData.earthShader;
      if (shader?.uniforms?.uEarthDetailTier) shader.uniforms.uEarthDetailTier.value = next;
    }

    segmentSet() {
      return {
        high: this.quality.nearSegments,
        medium: this.quality.midSegments,
        low: this.quality.farSegments,
        horizon: this.quality.horizonSegments
      };
    }

    segmentsForRing(ring) {
      const set = this.segmentSet();
      if (ring === 0) return set.high;
      if (ring === 1) return set.medium;
      if (ring === 2) return set.low;
      return set.horizon;
    }

    segmentsForAltitudeRing(ring, altitudeKm) {
      const set = this.segmentSet();
      if (altitudeKm >= 22) {
        if (ring === 0) return set.medium;
        if (ring === 1) return set.low;
        return set.horizon;
      }
      if (altitudeKm >= 10 && ring >= 2) return set.horizon;
      return this.segmentsForRing(ring);
    }

    createTileGeometry(tile, segments) {
      const T = this.THREE;
      const verticesPerSide = segments + 1;
      const topCount = verticesPerSide * verticesPerSide;
      const skirtCount = verticesPerSide * 8;
      const positions = new Float32Array((topCount + skirtCount) * 3);
      const uvs = new Float32Array((topCount + skirtCount) * 2);
      const colors = new Float32Array((topCount + skirtCount) * 3);
      const indices = [];
      const heights = new Float32Array(topCount);
      const lats = new Float32Array(topCount);
      const lons = new Float32Array(topCount);
      const xs = new Float32Array(topCount);
      const zs = new Float32Array(topCount);
      let p = 0;
      let uv = 0;

      for (let iz = 0; iz <= segments; iz += 1) {
        const fy = iz / segments;
        const tileY = tile.y + fy;
        const latitude = this.provider.latitudeForY(tileY, tile.z);
        for (let ix = 0; ix <= segments; ix += 1) {
          const fx = ix / segments;
          const longitude = wrapLongitude(this.provider.longitudeForX(tile.x + fx, tile.z));
          const world = this.worldFromGeo(latitude, longitude);
          const height = this.provider.sampleTile(tile, latitude, longitude);
          const index = iz * verticesPerSide + ix;
          positions[p++] = world.x;
          positions[p++] = height;
          positions[p++] = world.z;
          uvs[uv++] = fx;
          uvs[uv++] = 1 - fy;
          heights[index] = height;
          lats[index] = latitude;
          lons[index] = longitude;
          xs[index] = world.x;
          zs[index] = world.z;
        }
      }

      const sampleHeight = (row, col) => heights[clamp(row, 0, segments) * verticesPerSide + clamp(col, 0, segments)];
      for (let row = 0; row <= segments; row += 1) {
        for (let col = 0; col <= segments; col += 1) {
          const index = row * verticesPerSide + col;
          const left = sampleHeight(row, col - 1);
          const right = sampleHeight(row, col + 1);
          const north = sampleHeight(row - 1, col);
          const south = sampleHeight(row + 1, col);
          const leftIndex = row * verticesPerSide + Math.max(0, col - 1);
          const rightIndex = row * verticesPerSide + Math.min(segments, col + 1);
          const northIndex = Math.max(0, row - 1) * verticesPerSide + col;
          const southIndex = Math.min(segments, row + 1) * verticesPerSide + col;
          const dx = Math.max(0.03, Math.abs(xs[rightIndex] - xs[leftIndex]));
          const dz = Math.max(0.03, Math.abs(zs[southIndex] - zs[northIndex]));
          const gx = (right - left) / dx;
          const gz = (south - north) / dz;
          const slope = clamp(Math.hypot(gx, gz) * 2.0, 0, 1);
          const colour = this.earthMaterialColor(heights[index], lats[index], slope, lons[index]);
          // Keep Blue Marble broad albedo readable while still adding elevation-aware
          // rock, vegetation, snow and seafloor character.
          coloursWrite(colors, index, colour);
        }
      }

      for (let z = 0; z < segments; z += 1) {
        for (let x = 0; x < segments; x += 1) {
          const a = z * verticesPerSide + x;
          const b = a + 1;
          const c = a + verticesPerSide;
          const d = c + 1;
          indices.push(a, c, b, b, c, d);
        }
      }

      const skirtDepth = 0.12;
      let skirtCursor = topCount;
      const addSkirt = edge => {
        const top = [];
        const bottom = [];
        for (const sourceIndex of edge) {
          const sourceP = sourceIndex * 3;
          const sourceUv = sourceIndex * 2;
          const sourceColour = sourceIndex * 3;
          const topIndex = skirtCursor++;
          const bottomIndex = skirtCursor++;
          for (const [targetIndex, yOffset] of [[topIndex, 0], [bottomIndex, -skirtDepth]]) {
            const targetP = targetIndex * 3;
            const targetUv = targetIndex * 2;
            const targetColour = targetIndex * 3;
            positions[targetP] = positions[sourceP];
            positions[targetP + 1] = positions[sourceP + 1] + yOffset;
            positions[targetP + 2] = positions[sourceP + 2];
            uvs[targetUv] = uvs[sourceUv];
            uvs[targetUv + 1] = uvs[sourceUv + 1];
            colors[targetColour] = colors[sourceColour];
            colors[targetColour + 1] = colors[sourceColour + 1];
            colors[targetColour + 2] = colors[sourceColour + 2];
          }
          top.push(topIndex);
          bottom.push(bottomIndex);
        }
        for (let i = 0; i < edge.length - 1; i += 1) {
          const a = top[i];
          const b = top[i + 1];
          const sa = bottom[i];
          const sb = bottom[i + 1];
          indices.push(a, sa, b, b, sa, sb);
        }
      };

      const north = [];
      const south = [];
      const west = [];
      const east = [];
      for (let i = 0; i <= segments; i += 1) {
        north.push(i);
        south.push(segments * verticesPerSide + i);
        west.push(i * verticesPerSide);
        east.push(i * verticesPerSide + segments);
      }
      addSkirt(north);
      addSkirt(south);
      addSkirt(west);
      addSkirt(east);

      const geometry = new T.BufferGeometry();
      geometry.setAttribute("position", new T.BufferAttribute(positions, 3));
      geometry.setAttribute("uv", new T.BufferAttribute(uvs, 2));
      geometry.setAttribute("color", new T.BufferAttribute(colors, 3));
      geometry.setIndex(indices);
      geometry.computeVertexNormals();
      geometry.computeBoundingSphere();
      return geometry;
    }

    createTileMesh(tile, segments) {
      const T = this.THREE;
      const geometry = this.createTileGeometry(tile, segments);
      const map = this.createSurfacePatch(tile);
      const material = new T.MeshStandardMaterial({
        map,
        vertexColors: true,
        color: 0xffffff,
        roughness: 0.86,
        metalness: 0,
        side: T.FrontSide,
        dithering: true
      });
      this.configureTerrainMaterial(material);
      const mesh = new T.Mesh(geometry, material);
      mesh.frustumCulled = true;
      mesh.userData.earthTile = `${tile.z}/${tile.x}/${tile.y}`;
      mesh.userData.surfaceTexture = map;
      return mesh;
    }

    swapEntryGeometry(entry, segments) {
      if (!entry?.mesh || !segments || entry.segments === segments) return;
      entry.geometryCache = entry.geometryCache || new Map([[entry.segments, entry.mesh.geometry]]);
      let geometry = entry.geometryCache.get(segments);
      if (!geometry) {
        geometry = this.createTileGeometry(entry.tile, segments);
        entry.geometryCache.set(segments, geometry);
      }
      entry.mesh.geometry = geometry;
      entry.segments = segments;
      if (entry.geometryCache.size > 2) {
        for (const [cachedSegments, cachedGeometry] of entry.geometryCache) {
          if (cachedSegments === segments || cachedGeometry === entry.mesh.geometry) continue;
          cachedGeometry.dispose?.();
          entry.geometryCache.delete(cachedSegments);
          break;
        }
      }
    }

    async ensureAround(latitude, longitude, { requiredRadius = 1, onProgress = null } = {}) {
      const center = this.provider.tileForLocation(latitude, longitude);
      const radius = this.quality.radius;
      const generation = ++this.requestGeneration;
      const desired = new Map();
      const mandatory = [];
      const optional = [];
      const n = 2 ** center.z;

      for (let dy = -radius; dy <= radius; dy += 1) {
        for (let dx = -radius; dx <= radius; dx += 1) {
          const x = ((center.x + dx) % n + n) % n;
          const y = center.y + dy;
          if (y < 0 || y >= n) continue;
          const ring = Math.max(Math.abs(dx), Math.abs(dy));
          const entry = { z: center.z, x, y, ring, key: this.provider.tileKey(center.z, x, y) };
          desired.set(entry.key, entry);
          if (ring <= requiredRadius) mandatory.push(entry);
          else optional.push(entry);
        }
      }

      let completed = 0;
      const total = Math.max(1, mandatory.length);
      const loadEntry = async entry => {
        if (generation !== this.requestGeneration) return;
        const segments = this.segmentsForRing(entry.ring);
        const existing = this.meshes.get(entry.key);
        if (existing) {
          this.swapEntryGeometry(existing, segments);
          completed += 1;
          onProgress?.(completed / total);
          return;
        }
        const tile = await this.provider.load(entry.z, entry.x, entry.y);
        if (generation !== this.requestGeneration) return;
        const mesh = this.createTileMesh(tile, segments);
        const record = {
          key: entry.key,
          tile,
          mesh,
          ring: entry.ring,
          segments,
          geometryCache: new Map([[segments, mesh.geometry]]),
          detailTier: 3,
          frustumVisible: undefined,
          bufferVisible: false,
          lastSurfaceDistance: Infinity
        };
        this.group.add(mesh);
        this.meshes.set(entry.key, record);
        completed += 1;
        onProgress?.(completed / total);
      };

      await Promise.all(mandatory.map(loadEntry));
      if (generation !== this.requestGeneration) return;
      this.lastCenterTile = this.provider.tileKey(center.z, center.x, center.y);
      this.ensureEnvironment();

      Promise.allSettled(optional.map(async entry => {
        if (generation !== this.requestGeneration) return;
        const segments = this.segmentsForRing(entry.ring);
        const existing = this.meshes.get(entry.key);
        if (existing) {
          this.swapEntryGeometry(existing, segments);
          return;
        }
        const tile = await this.provider.load(entry.z, entry.x, entry.y);
        if (generation !== this.requestGeneration) return;
        const mesh = this.createTileMesh(tile, segments);
        const record = {
          key: entry.key,
          tile,
          mesh,
          ring: entry.ring,
          segments,
          geometryCache: new Map([[segments, mesh.geometry]]),
          detailTier: 0,
          frustumVisible: undefined,
          bufferVisible: false,
          lastSurfaceDistance: Infinity
        };
        this.group.add(mesh);
        this.meshes.set(entry.key, record);
        this.setEntryDetailTier(record, 0);
      })).then(() => {
        if (generation === this.requestGeneration) this.prune(desired);
      });
    }

    entryRingFromCamera(entry, cameraGeo) {
      const center = this.provider.tileForLocation(cameraGeo.latitude, cameraGeo.longitude);
      const n = 2 ** center.z;
      let dx = Math.abs(center.x - entry.tile.x);
      dx = Math.min(dx, n - dx);
      const dy = Math.abs(center.y - entry.tile.y);
      return Math.max(dx, dy);
    }

    updateViewDependent(camera, altitudeKm, velocity = null) {
      if (!camera || !this.meshes.size) return this.visibilityStats;
      camera.updateMatrixWorld();
      this.group.updateMatrixWorld(true);
      this.projectionScreenMatrix.multiplyMatrices(camera.projectionMatrix, camera.matrixWorldInverse);
      this.frustum.setFromProjectionMatrix(this.projectionScreenMatrix);
      camera.getWorldDirection(this.cameraForward).normalize();
      const cameraGeo = this.geoFromWorld(camera.position.x, camera.position.z);
      const speed = velocity ? Math.hypot(velocity.x || 0, velocity.y || 0, velocity.z || 0) : 0;
      const maxTier = altitudeKm >= 15 ? 1 : altitudeKm >= 8 ? 2 : 3;
      const stats = { visible: 0, buffered: 0, culled: 0, high: 0, medium: 0, low: 0 };

      for (const entry of this.meshes.values()) {
        const mesh = entry.mesh;
        if (!mesh.geometry.boundingSphere) mesh.geometry.computeBoundingSphere();
        const sphere = mesh.geometry.boundingSphere;
        this.chunkCenter.copy(sphere.center).applyMatrix4(mesh.matrixWorld);
        this.chunkVector.copy(this.chunkCenter).sub(camera.position);
        const centerDistance = Math.max(0.0001, this.chunkVector.length());
        const surfaceDistance = Math.max(0, centerDistance - sphere.radius);
        const facing = this.chunkVector.dot(this.cameraForward) / centerDistance;
        const inFrustum = this.frustum.intersectsObject(mesh);
        const bufferDistance = Math.max(56, 34 + altitudeKm * 2.5 + speed * 1.6);
        const inSafetyBuffer = !inFrustum && facing > -0.64 && surfaceDistance < bufferDistance;
        const active = inFrustum || inSafetyBuffer;
        mesh.visible = active;
        entry.frustumVisible = inFrustum;
        entry.bufferVisible = inSafetyBuffer;
        entry.lastSurfaceDistance = surfaceDistance;

        const ring = this.entryRingFromCamera(entry, cameraGeo);
        if (inFrustum) {
          this.swapEntryGeometry(entry, this.segmentsForAltitudeRing(ring, altitudeKm));
        }

        let tier = 0;
        if (inFrustum) {
          const nearLimit = this.quality.name === "HIGH" ? 34 : this.quality.name === "MEDIUM" ? 27 : 20;
          const midLimit = this.quality.name === "HIGH" ? 94 : this.quality.name === "MEDIUM" ? 72 : 52;
          tier = surfaceDistance <= nearLimit ? 3 : surfaceDistance <= midLimit ? 2 : 1;
          tier = Math.min(tier, maxTier);
        }
        this.setEntryDetailTier(entry, tier);

        if (inFrustum) {
          stats.visible += 1;
          if (tier === 3) stats.high += 1;
          else if (tier === 2) stats.medium += 1;
          else stats.low += 1;
        } else if (inSafetyBuffer) {
          stats.buffered += 1;
        } else {
          stats.culled += 1;
        }
      }
      this.visibilityStats = stats;
      return stats;
    }

    maybeStream(latitude, longitude) {
      const center = this.provider.tileForLocation(latitude, longitude);
      const key = this.provider.tileKey(center.z, center.x, center.y);
      if (key === this.lastCenterTile) return;
      this.ensureAround(latitude, longitude, { requiredRadius: 0 }).catch(() => {});
    }

    prefetchAhead(latitude, longitude) {
      const address = this.provider.tileForLocation(latitude, longitude);
      this.provider.load(address.z, address.x, address.y).catch(() => {});
    }

    ensureEnvironment() {
      if (!this.sky) this.createSky();
      if (!this.water) this.createWater();
    }

    createSky() {
      const T = this.THREE;
      const geometry = new T.SphereGeometry(520, 32, 18);
      const material = new T.ShaderMaterial({
        side: T.BackSide,
        depthWrite: false,
        fog: false,
        uniforms: {
          uTop: { value: new T.Color(0x4d8db9) },
          uHorizon: { value: new T.Color(0xc6dce6) },
          uHaze: { value: 0.50 }
        },
        vertexShader: `varying vec3 vSkyPos; void main(){ vSkyPos=position; gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.0); }`,
        fragmentShader: `varying vec3 vSkyPos; uniform vec3 uTop; uniform vec3 uHorizon; uniform float uHaze; void main(){ float h=clamp(normalize(vSkyPos).y*0.5+0.5,0.0,1.0); h=smoothstep(0.10,0.94,h); vec3 col=mix(uHorizon,uTop,h); float horizonGlow=1.0-abs(normalize(vSkyPos).y); col += vec3(0.07,0.10,0.12)*pow(horizonGlow,3.0)*uHaze; gl_FragColor=vec4(col,1.0); }`
      });
      this.sky = new T.Mesh(geometry, material);
      this.sky.renderOrder = -20;
      this.scene.add(this.sky);
    }

    createWater() {
      const T = this.THREE;
      const geometry = new T.PlaneGeometry(1200, 1200, this.quality.name === "LOW" ? 32 : 64, this.quality.name === "LOW" ? 32 : 64);
      geometry.rotateX(-Math.PI / 2);
      const material = new T.MeshPhysicalMaterial({
        color: 0x176d88,
        transparent: true,
        opacity: 0.78,
        roughness: 0.18,
        metalness: 0,
        transmission: 0.06,
        clearcoat: 0.46,
        clearcoatRoughness: 0.22,
        depthWrite: true,
        side: T.DoubleSide
      });
      material.onBeforeCompile = shader => {
        shader.uniforms.uEarthWaterTime = { value: 0 };
        shader.vertexShader = shader.vertexShader
          .replace("#include <common>", "#include <common>\nuniform float uEarthWaterTime;\nvarying vec3 vEarthWaterWorld;")
          .replace("#include <begin_vertex>", `#include <begin_vertex>
            float waveA = sin((position.x + uEarthWaterTime * 1.6) * 0.12) * 0.018;
            float waveB = cos((position.z - uEarthWaterTime * 1.1) * 0.16) * 0.014;
            transformed.y += waveA + waveB;
            vEarthWaterWorld = (modelMatrix * vec4(transformed,1.0)).xyz;`);
        material.userData.earthWaterShader = shader;
      };
      material.customProgramCacheKey = () => "antara-earth-water-v1";
      this.water = new T.Mesh(geometry, material);
      // A tiny offset avoids z-fighting where DEM ocean samples resolve to
      // exactly sea level while keeping the water plane effectively at 0 m.
      this.water.position.y = 0.004;
      this.water.renderOrder = 2;
      this.scene.add(this.water);
    }

    updateEnvironment(delta, camera) {
      this.environmentTime += delta;
      if (this.sky && camera) this.sky.position.copy(camera.position);
      if (this.water && camera) {
        this.water.position.x = camera.position.x;
        this.water.position.z = camera.position.z;
        const shader = this.water.material.userData.earthWaterShader;
        if (shader?.uniforms?.uEarthWaterTime) shader.uniforms.uEarthWaterTime.value = this.environmentTime;
      }
    }

    getHeightAtWorld(x, z) {
      const geo = this.geoFromWorld(x, z);
      return this.provider.sampleCached(geo.latitude, geo.longitude);
    }

    disposeEntry(entry) {
      if (!entry?.mesh) return;
      const activeGeometry = entry.mesh.geometry;
      if (entry.geometryCache) {
        for (const geometry of entry.geometryCache.values()) {
          if (geometry !== activeGeometry) geometry.dispose?.();
        }
        entry.geometryCache.clear();
      }
      activeGeometry?.dispose?.();
      entry.mesh.material?.map?.dispose?.();
      entry.mesh.material?.dispose?.();
      this.group.remove(entry.mesh);
    }

    prune(desired) {
      for (const [key, entry] of this.meshes) {
        if (desired.has(key)) continue;
        this.disposeEntry(entry);
        this.meshes.delete(key);
      }
    }

    clearMeshes() {
      this.requestGeneration += 1;
      for (const entry of this.meshes.values()) this.disposeEntry(entry);
      this.meshes.clear();
      this.lastCenterTile = "";
    }

    dispose() {
      this.clearMeshes();
      this.group.removeFromParent();
      if (this.water) {
        this.scene.remove(this.water);
        this.water.geometry.dispose();
        this.water.material.dispose();
        this.water = null;
      }
      if (this.sky) {
        this.scene.remove(this.sky);
        this.sky.geometry.dispose();
        this.sky.material.dispose();
        this.sky = null;
      }
      this.detailTexture?.dispose?.();
      this.roughnessTexture?.dispose?.();
      this.detailTexture = null;
      this.roughnessTexture = null;
    }
  }

  function coloursWrite(array, index, colour) {
    const p = index * 3;
    // Vertex colours multiply the Blue Marble map. Bias toward white so the map
    // remains authoritative for broad geography instead of becoming recoloured art.
    array[p] = clamp(0.72 + colour.r * 0.28, 0, 1);
    array[p + 1] = clamp(0.72 + colour.g * 0.28, 0, 1);
    array[p + 2] = clamp(0.72 + colour.b * 0.28, 0, 1);
  }

  class EarthInputManager {
    constructor(controller) {
      this.controller = controller;
      this.keys = new Set();
      this.pointerActions = new Map();
      this.dragPointers = new Map();
      this.dragPointer = null;
      this.bound = false;
      this.abortController = null;
    }

    bind() {
      if (this.bound) return;
      this.bound = true;
      this.abortController = new AbortController();
      const signal = this.abortController.signal;
      const viewport = this.controller.viewport;
      window.addEventListener("keydown", event => this.onKeyDown(event), { signal, capture: true });
      window.addEventListener("keyup", event => this.onKeyUp(event), { signal, capture: true });
      window.addEventListener("blur", () => this.clear(), { signal });
      viewport.addEventListener("pointerdown", event => this.onLookStart(event), { signal });
      viewport.addEventListener("pointermove", event => this.onLookMove(event), { signal });
      viewport.addEventListener("pointerup", event => this.onLookEnd(event), { signal });
      viewport.addEventListener("pointercancel", event => this.onLookEnd(event), { signal });
      viewport.addEventListener("contextmenu", event => event.preventDefault(), { signal });
      document.addEventListener("mousemove", event => this.onLockedMouseMove(event), { signal });
      document.addEventListener("pointerlockchange", () => this.onPointerLockChange(), { signal });

      this.controller.root.querySelectorAll("[data-earth-control]").forEach(button => {
        button.addEventListener("pointerdown", event => this.onControlStart(event, button), { signal });
        button.addEventListener("pointerup", event => this.onControlEnd(event), { signal });
        button.addEventListener("pointercancel", event => this.onControlEnd(event), { signal });
        button.addEventListener("lostpointercapture", event => this.onControlEnd(event), { signal });
        button.addEventListener("contextmenu", event => event.preventDefault(), { signal });
      });
    }

    unbind() {
      if (document.pointerLockElement === this.controller.viewport) document.exitPointerLock?.();
      this.abortController?.abort();
      this.abortController = null;
      this.bound = false;
      this.controller.root?.classList.remove("is-pointer-locked");
      this.clear();
    }

    isInteractive() {
      return this.controller.state === STATES.EXPLORING;
    }

    onKeyDown(event) {
      if (!this.controller.active) return;
      const key = event.key.toLowerCase();
      const relevant = ["w", "a", "s", "d", "q", "e", "shift", "control", "escape"].includes(key);
      if (!relevant) return;
      event.preventDefault();
      event.stopImmediatePropagation();
      if (key === "escape") {
        if (event.repeat) return;
        if (document.pointerLockElement === this.controller.viewport) document.exitPointerLock?.();
        this.clear();
        this.controller.exit();
        return;
      }
      if (!this.isInteractive()) return;
      this.keys.add(key);
      this.controller.dismissTutorial();
    }

    onKeyUp(event) {
      if (!this.controller.active) return;
      const key = event.key.toLowerCase();
      if (!["w", "a", "s", "d", "q", "e", "shift", "control"].includes(key)) return;
      event.preventDefault();
      event.stopImmediatePropagation();
      this.keys.delete(key);
    }

    onLookStart(event) {
      if (!this.isInteractive()) return;
      if (event.target.closest("button, a, [data-earth-ui]")) return;
      if (event.pointerType === "mouse") {
        if (event.button !== 0) return;
        this.controller.dismissTutorial();
        if (this.controller.viewport.requestPointerLock && document.pointerLockElement !== this.controller.viewport) {
          try { this.controller.viewport.requestPointerLock(); } catch {}
        }
        return;
      }
      this.dragPointer = event.pointerId;
      this.dragPointers.set(event.pointerId, { x: event.clientX, y: event.clientY });
      this.controller.viewport.setPointerCapture?.(event.pointerId);
      this.controller.dismissTutorial();
    }

    onLookMove(event) {
      if (!this.isInteractive() || this.dragPointer !== event.pointerId) return;
      const previous = this.dragPointers.get(event.pointerId);
      if (!previous) return;
      const dx = event.clientX - previous.x;
      const dy = event.clientY - previous.y;
      previous.x = event.clientX;
      previous.y = event.clientY;
      this.controller.addLookDelta(dx, dy, event.pointerType === "touch" ? "touch" : "mouse");
    }

    onLockedMouseMove(event) {
      if (!this.isInteractive() || document.pointerLockElement !== this.controller.viewport) return;
      this.controller.addLookDelta(event.movementX || 0, event.movementY || 0, "locked");
    }

    onPointerLockChange() {
      const locked = document.pointerLockElement === this.controller.viewport;
      this.controller.root.classList.toggle("is-pointer-locked", locked);
      if (!locked) this.keys.clear();
    }

    onLookEnd(event) {
      this.dragPointers.delete(event.pointerId);
      if (this.dragPointer === event.pointerId) this.dragPointer = null;
    }

    onControlStart(event, button) {
      if (!this.isInteractive()) return;
      event.preventDefault();
      event.stopPropagation();
      button.setPointerCapture?.(event.pointerId);
      this.pointerActions.set(event.pointerId, button.dataset.earthControl);
      button.classList.add("is-held");
      this.controller.dismissTutorial();
    }

    onControlEnd(event) {
      const action = this.pointerActions.get(event.pointerId);
      this.pointerActions.delete(event.pointerId);
      if (!action) return;
      event.currentTarget?.classList?.remove("is-held");
    }

    actionActive(action) {
      if ([...this.pointerActions.values()].includes(action)) return true;
      if (action === "forward") return this.keys.has("w");
      if (action === "backward") return this.keys.has("s");
      if (action === "left") return this.keys.has("a");
      if (action === "right") return this.keys.has("d");
      if (action === "down") return this.keys.has("q");
      if (action === "up") return this.keys.has("e");
      return false;
    }

    boost() { return this.keys.has("shift"); }
    precision() { return this.keys.has("control"); }

    movementAxes() {
      return {
        forward: Number(this.actionActive("forward")) - Number(this.actionActive("backward")),
        strafe: Number(this.actionActive("right")) - Number(this.actionActive("left")),
        vertical: Number(this.actionActive("up")) - Number(this.actionActive("down"))
      };
    }

    clear() {
      this.keys.clear();
      this.pointerActions.clear();
      this.dragPointers.clear();
      this.dragPointer = null;
      this.controller.root?.querySelectorAll(".is-held").forEach(button => button.classList.remove("is-held"));
    }
  }

  window.EarthFullExploration = class EarthFullExploration {
    constructor(earthScene) {
      this.earth = earthScene;
      this.root = document.getElementById("earth-full-exploration");
      this.viewport = document.getElementById("earth-full-viewport");
      this.entryButton = document.getElementById("earth-full-explore-button");
      this.exitButton = document.getElementById("earth-full-exit");
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
      this.hudAltitudeLimit = document.getElementById("earth-hud-altitude-limit");
      this.hudTerrain = document.getElementById("earth-hud-terrain");
      this.hudSpeed = document.getElementById("earth-hud-speed");
      this.hudQuality = document.getElementById("earth-hud-quality");
      this.hudData = document.getElementById("earth-hud-data");

      this.state = STATES.IDLE;
      this.prepared = false;
      this.preparingPromise = null;
      this.resourceGeneration = 0;
      this.frame = null;
      this.previous = 0;
      this.streamClock = 0;
      this.statsClock = 0;
      this.statsFrames = 0;
      this.lowFpsWindows = 0;
      this.highFpsWindows = 0;
      this.lastGround = 0;
      this.cameraAltitude = 2.8;
      this.speed = 0;
      this.yaw = EARTH_ENTRY.heading;
      this.pitch = EARTH_ENTRY.pitch;
      this.lookYawTarget = this.yaw;
      this.lookPitchTarget = this.pitch;
      this.velocity = { x: 0, y: 0, z: 0 };
      this.transitionToken = 0;
      this.tutorialTimeout = null;
      this.quality = this.detectQuality();
      this.currentDpr = null;
      this.idealDpr = null;
      this.input = new EarthInputManager(this);
      this.tick = this.tick.bind(this);
      this.root.inert = true;
      this.bindUI();
    }

    get active() {
      return this.state !== STATES.IDLE;
    }

    detectQuality() {
      const width = window.innerWidth;
      const cores = navigator.hardwareConcurrency || 4;
      const memory = navigator.deviceMemory || 4;
      const coarse = window.matchMedia("(pointer: coarse)").matches;
      if (coarse || width <= 760 || cores <= 4 || memory <= 3) {
        return {
          name: "LOW", radius: 1, zoom: 8,
          nearSegments: 72, midSegments: 42, farSegments: 24, horizonSegments: 18,
          maxDpr: 1.45, minDpr: 0.90, supersample: 1,
          pixelBudget: 3000000, anisotropy: 4, textureSize: 256
        };
      }
      if (cores >= 8 && memory >= 6) {
        return {
          name: "HIGH", radius: 3, zoom: 9,
          nearSegments: 192, midSegments: 112, farSegments: 56, horizonSegments: 28,
          maxDpr: 2.25, minDpr: 1.05, supersample: 1.45,
          pixelBudget: 10500000, anisotropy: 16, textureSize: 512
        };
      }
      return {
        name: "MEDIUM", radius: 2, zoom: 9,
        nearSegments: 128, midSegments: 76, farSegments: 40, horizonSegments: 24,
        maxDpr: 1.9, minDpr: 0.98, supersample: 1.22,
        pixelBudget: 6500000, anisotropy: 8, textureSize: 384
      };
    }

    calculateIdealDpr() {
      const width = Math.max(1, this.viewport?.clientWidth || window.innerWidth);
      const height = Math.max(1, this.viewport?.clientHeight || window.innerHeight);
      const cssPixels = width * height;
      const deviceDpr = window.devicePixelRatio || 1;
      const requested = Math.max(deviceDpr, this.quality.supersample || 1);
      const budgetDpr = Math.sqrt(this.quality.pixelBudget / cssPixels);
      return clamp(Math.min(requested, this.quality.maxDpr, budgetDpr), this.quality.minDpr, this.quality.maxDpr);
    }

    bindUI() {
      this.entryButton.addEventListener("click", () => this.enter());
      this.exitButton.addEventListener("click", () => this.exit());
      this.fullscreenButton.addEventListener("click", () => this.toggleFullscreen());
      this.errorReturn.addEventListener("click", () => this.failBackToOrbit());
      this.tutorialClose.addEventListener("click", () => this.dismissTutorial(true));
      document.addEventListener("fullscreenchange", () => this.updateFullscreenLabel());
      document.addEventListener("visibilitychange", () => {
        if (!this.active) return;
        if (document.hidden) this.stopLoop();
        else this.startLoop();
      });
      window.addEventListener("resize", () => {
        if (this.prepared) this.resize();
      });
      window.addEventListener("orientationchange", () => {
        if (this.prepared) window.setTimeout(() => this.resize(), 120);
      });
    }

    async enter() {
      if (this.active || !this.earth.active || this.earth.travelMode) return;
      if (this.earth.exploring) this.earth.exitExploration(false);
      this.state = STATES.PREPARING;
      const token = ++this.transitionToken;
      this.root.hidden = false;
      this.root.inert = false;
      this.root.setAttribute("aria-hidden", "false");
      this.root.className = "earth-full-exploration is-preparing";
      this.root.style.setProperty("--surface", "0");
      this.root.style.setProperty("--entry-progress", "0");
      this.loading.hidden = false;
      this.errorPanel.hidden = true;
      this.entryButton.disabled = true;
      this.tutorial.classList.remove("is-visible");
      document.getElementById("mission").classList.add("is-earth-full");
      this.earth.beginFullExplorationFocus?.(EARTH_ENTRY);
      this.setLoading(0.04, "MENGHUBUNGKAN DATA ELEVASI BUMI");
      document.getElementById("announcement").textContent = "Menyiapkan Eksplorasi Pengalaman Penuh Bumi.";

      try {
        await this.prepare();
        if (token !== this.transitionToken || this.state !== STATES.PREPARING) return;
        this.terrain.clearMeshes();
        this.terrain.setOrigin(EARTH_ENTRY.latitude, EARTH_ENTRY.longitude);
        this.setLoading(0.16, "MEMUAT TERRAIN STREAMING DI SEKITAR KAMERA");
        await this.terrain.ensureAround(EARTH_ENTRY.latitude, EARTH_ENTRY.longitude, {
          requiredRadius: 1,
          onProgress: progress => this.setLoading(0.16 + progress * 0.72, `MEMBANGUN TERRAIN REAL · ${Math.round(progress * 100)}%`)
        });
        if (token !== this.transitionToken || this.state !== STATES.PREPARING) return;
        this.setCameraAtEntry({ altitude: 58 });
        this.setLoading(1, "PERMUKAAN BUMI SIAP");
        await this.wait(180);
        if (token !== this.transitionToken) return;
        await this.runEntryTransition(token);
      } catch (error) {
        if (token !== this.transitionToken) return;
        this.showError(error);
      }
    }

    async prepare() {
      if (this.prepared) return;
      if (this.preparingPromise) return this.preparingPromise;
      const generation = this.resourceGeneration;
      const promise = (async () => {
        await this.earth.prepare();
        if (generation !== this.resourceGeneration) throw new Error("Earth exploration preparation cancelled.");
        const T = this.earth.THREE;
        if (!T) throw new Error("Renderer 3D Bumi tidak tersedia pada perangkat ini.");
        this.THREE = T;

        const canvas = document.createElement("canvas");
        canvas.className = "earth-full-canvas";
        canvas.setAttribute("aria-hidden", "true");
        const context = canvas.getContext("webgl2", {
          alpha: true,
          antialias: this.quality.name !== "LOW",
          powerPreference: "high-performance"
        });
        if (!context) throw new Error("WebGL2 diperlukan untuk terrain Bumi 3D.");

        this.renderer = new T.WebGLRenderer({ canvas, context, alpha: true, antialias: this.quality.name !== "LOW" });
        this.renderer.outputColorSpace = T.SRGBColorSpace;
        this.renderer.toneMapping = T.ACESFilmicToneMapping;
        this.renderer.toneMappingExposure = 1.08;
        this.quality.anisotropy = Math.min(this.quality.anisotropy, this.renderer.capabilities.getMaxAnisotropy());
        this.idealDpr = this.calculateIdealDpr();
        this.currentDpr = this.idealDpr;
        this.renderer.setPixelRatio(this.currentDpr);
        this.renderer.setClearColor(0x9fc4d4, 1);
        this.viewport.replaceChildren(canvas);

        this.scene = new T.Scene();
        const fogDensity = this.quality.name === "LOW" ? 0.0034 : this.quality.name === "MEDIUM" ? 0.0026 : 0.0020;
        this.scene.fog = new T.FogExp2(0xb8cfd8, fogDensity);
        this.camera = new T.PerspectiveCamera(this.mobileFov(), 1, 0.025, 900);
        this.camera.rotation.order = "YXZ";

        this.sunLight = new T.DirectionalLight(0xfff1d8, 3.05);
        this.sunLight.position.set(-68, 96, 42);
        this.scene.add(this.sunLight);
        this.hemiLight = new T.HemisphereLight(0xdff5ff, 0x46503f, 0.72);
        this.scene.add(this.hemiLight);
        this.fillLight = new T.DirectionalLight(0x91b9d7, 0.20);
        this.fillLight.position.set(48, 28, -58);
        this.scene.add(this.fillLight);

        this.moveForward = new T.Vector3();
        this.moveRight = new T.Vector3();
        this.moveIntent = new T.Vector3();

        this.provider = new TerrariumProvider(this.quality.zoom);
        this.provider.maxCache = this.quality.name === "HIGH" ? 132 : this.quality.name === "MEDIUM" ? 88 : 48;
        this.terrain = new EarthTerrainManager(T, this.scene, this.renderer, this.provider, this.earth.surface, this.quality);
        this.hudQuality.textContent = this.quality.name;
        this.hudData.textContent = MAPZEN_SOURCE;

        if (generation !== this.resourceGeneration) {
          this.renderer.dispose();
          this.renderer.domElement?.remove();
          this.renderer = null;
          this.terrain?.dispose();
          this.terrain = null;
          this.provider?.clear();
          this.provider = null;
          throw new Error("Earth exploration preparation cancelled.");
        }
        this.prepared = true;
        this.resize();
      })();
      this.preparingPromise = promise;
      try {
        await promise;
      } finally {
        if (this.preparingPromise === promise) this.preparingPromise = null;
      }
    }

    mobileFov() {
      return window.innerWidth <= 760 ? 70 : 66;
    }

    setLoading(progress, status) {
      this.loading.hidden = false;
      this.loadingProgress.style.transform = `scaleX(${clamp(progress, 0, 1)})`;
      this.loadingStatus.textContent = status;
    }

    setCameraAtEntry({ altitude = 2.8 } = {}) {
      this.yaw = EARTH_ENTRY.heading;
      this.pitch = EARTH_ENTRY.pitch;
      this.syncLookTargets();
      this.camera.position.x = 0;
      this.camera.position.z = 0;
      const ground = this.terrain.getHeightAtWorld(0, 0) ?? 0;
      this.lastGround = ground;
      this.cameraAltitude = altitude;
      this.camera.position.y = ground + altitude;
      this.camera.rotation.set(this.pitch, this.yaw, 0);
      this.velocity.x = this.velocity.y = this.velocity.z = 0;
      this.updateHUD();
    }

    async runEntryTransition(token) {
      this.state = STATES.ENTERING;
      this.root.classList.remove("is-preparing");
      this.root.classList.add("is-entering");
      this.loading.hidden = true;
      this.input.bind();
      this.startLoop();
      const reduced = this.earth.motion?.matches || window.matchMedia("(prefers-reduced-motion: reduce)").matches;
      const duration = reduced ? 400 : 4700;
      const start = performance.now();
      const startAltitude = Math.max(46, this.cameraAltitude);
      const targetAltitude = 2.8;

      await new Promise(resolve => {
        const frame = now => {
          if (token !== this.transitionToken || this.state !== STATES.ENTERING) return resolve();
          const raw = clamp((now - start) / duration, 0, 1);
          const eased = smootherstep(raw);
          this.earth.setFullExplorationTransition?.(eased, EARTH_ENTRY);
          this.root.style.setProperty("--surface", String(smoothstep((raw - 0.48) / 0.40)));
          this.root.style.setProperty("--entry-progress", String(eased));
          this.cameraAltitude = lerp(startAltitude, targetAltitude, smoothstep((raw - 0.46) / 0.54));
          const ground = this.terrain.getHeightAtWorld(this.camera.position.x, this.camera.position.z);
          if (ground !== null) {
            this.lastGround = ground;
            this.camera.position.y = ground + this.cameraAltitude;
          }
          if (raw < 1) requestAnimationFrame(frame);
          else resolve();
        };
        requestAnimationFrame(frame);
      });

      if (token !== this.transitionToken || this.state !== STATES.ENTERING) return;
      this.state = STATES.EXPLORING;
      this.root.classList.remove("is-entering");
      this.root.classList.add("is-active", "is-surface-visible");
      this.root.style.setProperty("--surface", "1");
      this.root.style.setProperty("--entry-progress", "1");
      this.velocity.x = this.velocity.y = this.velocity.z = 0;
      this.earth.completeFullExplorationHandoff?.();
      this.showTutorial();
      document.getElementById("announcement").textContent = "Eksplorasi penuh Bumi aktif. Terrain akan di-stream mengikuti pergerakan kamera.";
    }

    addLookDelta(dx, dy, source = "mouse") {
      const sensitivity = source === "touch" ? 0.0034 : source === "locked" ? 0.00175 : 0.0022;
      this.lookYawTarget -= dx * sensitivity;
      this.lookPitchTarget = clamp(this.lookPitchTarget - dy * sensitivity, -1.40, 1.20);
    }

    syncLookTargets() {
      this.lookYawTarget = this.yaw;
      this.lookPitchTarget = this.pitch;
    }

    updateLook(delta) {
      const response = 1 - Math.exp(-delta * 27);
      this.yaw += (this.lookYawTarget - this.yaw) * response;
      this.pitch += (this.lookPitchTarget - this.pitch) * response;
      this.pitch = clamp(this.pitch, -1.40, 1.20);
    }

    startLoop() {
      if (!this.active || document.hidden || this.frame || !this.prepared) return;
      this.previous = performance.now();
      this.frame = requestAnimationFrame(this.tick);
    }

    stopLoop() {
      if (this.frame) cancelAnimationFrame(this.frame);
      this.frame = null;
    }

    tick(now) {
      this.frame = null;
      if (!this.active || document.hidden || !this.prepared) return;
      const delta = Math.min((now - this.previous) / 1000, 0.1);
      this.previous = now;
      this.statsClock += delta;
      this.statsFrames += 1;

      if (this.state === STATES.EXPLORING) this.updateLook(delta);
      this.camera.rotation.set(this.pitch, this.yaw, 0);
      if (this.state === STATES.EXPLORING) this.updateMovement(delta);
      const altitude = Math.max(0, this.camera.position.y - this.lastGround);
      this.terrain.updateViewDependent(this.camera, altitude, this.velocity);
      this.terrain.updateEnvironment(delta, this.camera);
      this.updateAtmosphere(altitude);
      this.renderer.render(this.scene, this.camera);
      this.updateHUD();
      this.adaptResolution();
      this.frame = requestAnimationFrame(this.tick);
    }

    updateMovement(delta) {
      const axes = this.input.movementAxes();
      const ground = this.terrain.getHeightAtWorld(this.camera.position.x, this.camera.position.z);
      if (ground !== null) this.lastGround = ground;
      const clearance = Math.max(0, this.camera.position.y - this.lastGround);
      const baseSpeed = clearance < 0.25 ? 0.14
        : clearance < 1 ? lerp(0.14, 0.82, (clearance - 0.25) / 0.75)
          : clearance < 8 ? lerp(0.82, 4.2, (clearance - 1) / 7)
            : clearance < 40 ? lerp(4.2, 14.5, (clearance - 8) / 32)
              : 24;
      const boost = this.input.boost() ? 3 : 1;
      const precision = this.input.precision() ? 0.28 : 1;
      const targetSpeed = baseSpeed * boost * precision;

      let forward = axes.forward;
      let strafe = axes.strafe;
      const horizontalMagnitude = Math.hypot(forward, strafe);
      if (horizontalMagnitude > 1) {
        forward /= horizontalMagnitude;
        strafe /= horizontalMagnitude;
      }

      this.camera.getWorldDirection(this.moveForward);
      this.moveRight.crossVectors(this.moveForward, this.camera.up).normalize();
      this.moveIntent.set(0, 0, 0);
      this.moveIntent.addScaledVector(this.moveForward, forward);
      this.moveIntent.addScaledVector(this.moveRight, strafe);
      if (horizontalMagnitude > 1) this.moveIntent.normalize();

      const targetX = this.moveIntent.x * targetSpeed;
      const targetZ = this.moveIntent.z * targetSpeed;
      const verticalSpeed = Math.max(0.22, Math.min(8, targetSpeed * 0.58));
      const headroom = Math.max(0, MAX_EXPLORATION_ALTITUDE_KM - clearance);
      const ascentFactor = smoothstep(headroom / 1.6);
      const rawTargetY = axes.vertical * verticalSpeed;
      const targetY = rawTargetY > 0 ? rawTargetY * ascentFactor : rawTargetY;
      const moving = horizontalMagnitude > 0 || axes.vertical !== 0;
      const response = 1 - Math.exp(-delta * (moving ? 11.5 : 15.5));
      this.velocity.x += (targetX - this.velocity.x) * response;
      this.velocity.z += (targetZ - this.velocity.z) * response;
      this.velocity.y += (targetY - this.velocity.y) * response;

      const nextX = this.camera.position.x + this.velocity.x * delta;
      const nextZ = this.camera.position.z + this.velocity.z * delta;
      const nextGeo = this.terrain.geoFromWorld(nextX, nextZ);
      if (nextGeo.latitude > MIN_DATA_LAT && nextGeo.latitude < MAX_DATA_LAT) {
        this.camera.position.x = nextX;
        this.camera.position.z = nextZ;
      }
      this.camera.position.y += this.velocity.y * delta;

      const newGround = this.terrain.getHeightAtWorld(this.camera.position.x, this.camera.position.z);
      if (newGround !== null) this.lastGround = newGround;
      const safeClearance = clearance < 2 ? 0.11 : 0.16;
      const minimumY = this.lastGround + safeClearance;
      if (this.camera.position.y < minimumY) {
        const correction = 1 - Math.exp(-delta * 17);
        this.camera.position.y = lerp(this.camera.position.y, minimumY + 0.025, correction);
        if (this.camera.position.y < minimumY) this.camera.position.y = minimumY;
        if (this.velocity.y < 0) this.velocity.y *= 0.12;
      }
      const maximumY = this.lastGround + MAX_EXPLORATION_ALTITUDE_KM;
      if (this.camera.position.y >= maximumY) {
        this.camera.position.y = maximumY;
        if (this.velocity.y > 0) this.velocity.y = 0;
      }

      this.speed = Math.hypot(this.velocity.x, this.velocity.y, this.velocity.z);
      this.streamClock += delta;
      if (this.streamClock > 0.36) {
        this.streamClock = 0;
        const geo = this.terrain.geoFromWorld(this.camera.position.x, this.camera.position.z);
        this.terrain.maybeStream(geo.latitude, geo.longitude);
        const lookAheadSeconds = clamp(1.4 + this.speed * 0.08, 1.4, 4.5);
        const aheadGeo = this.terrain.geoFromWorld(
          this.camera.position.x + this.velocity.x * lookAheadSeconds,
          this.camera.position.z + this.velocity.z * lookAheadSeconds
        );
        this.terrain.prefetchAhead(aheadGeo.latitude, aheadGeo.longitude);
      }
    }

    updateAtmosphere(altitude) {
      if (!this.scene?.fog || !this.renderer) return;
      const geo = this.terrain.geoFromWorld(this.camera.position.x, this.camera.position.z);
      const polar = clamp((Math.abs(geo.latitude) - 50) / 32, 0, 1);
      const high = clamp(altitude / MAX_EXPLORATION_ALTITUDE_KM, 0, 1);
      const horizon = new this.THREE.Color(0xb9d0da).lerp(new this.THREE.Color(0xdcebf0), polar * 0.35);
      const thinAir = new this.THREE.Color(0x779db2);
      this.scene.fog.color.copy(horizon).lerp(thinAir, high * 0.28);
      const baseDensity = this.quality.name === "LOW" ? 0.0034 : this.quality.name === "MEDIUM" ? 0.0026 : 0.0020;
      this.scene.fog.density = lerp(baseDensity, baseDensity * 0.36, high);
      this.renderer.setClearColor(new this.THREE.Color(0xb7d2df).lerp(new this.THREE.Color(0x507997), high * 0.58), 1);
      if (this.terrain.sky?.material?.uniforms) {
        this.terrain.sky.material.uniforms.uHaze.value = lerp(0.58, 0.20, high);
      }
    }

    updateHUD() {
      if (!this.terrain || !this.camera) return;
      const geo = this.terrain.geoFromWorld(this.camera.position.x, this.camera.position.z);
      const ground = this.terrain.getHeightAtWorld(this.camera.position.x, this.camera.position.z);
      if (ground !== null) this.lastGround = ground;
      const altitude = clamp(this.camera.position.y - this.lastGround, 0, MAX_EXPLORATION_ALTITUDE_KM);
      this.cameraAltitude = altitude;
      this.hudLocation.textContent = this.locationLabel(geo.latitude, geo.longitude);
      this.hudCoordinates.textContent = formatLatLon(geo.latitude, geo.longitude);
      this.hudAltitude.textContent = formatAltitude(altitude);
      this.hudTerrain.textContent = formatElevation(this.lastGround);
      this.hudSpeed.textContent = formatSpeed(this.speed);
      const ceilingActive = this.state === STATES.EXPLORING || this.state === STATES.ENTERING;
      this.hudAltitudeLimit.hidden = !ceilingActive || altitude < ALTITUDE_LIMIT_WARNING_KM;
      this.hudAltitudeLimit.textContent = altitude >= MAX_EXPLORATION_ALTITUDE_KM - 0.02 ? "BATAS KETINGGIAN" : "MENDEKATI BATAS 30 KM";
    }

    locationLabel(latitude, longitude) {
      const absLat = Math.abs(latitude);
      const zone = absLat < 23.5 ? "ZONA TROPIS" : absLat < 40 ? "ZONA SUBTROPIS" : absLat < 66.5 ? "LINTANG MENENGAH" : "ZONA POLAR";
      const hemisphere = latitude >= 0 ? "UTARA" : "SELATAN";
      return `BUMI · ${zone} ${hemisphere}`;
    }

    adaptResolution() {
      if (this.statsClock < 2.5 || !this.renderer) return;
      const fps = this.statsFrames / this.statsClock;
      this.statsFrames = 0;
      this.statsClock = 0;
      this.idealDpr = this.calculateIdealDpr();
      if (fps < 38) {
        this.lowFpsWindows += 1;
        this.highFpsWindows = 0;
      } else if (fps > 56) {
        this.highFpsWindows += 1;
        this.lowFpsWindows = Math.max(0, this.lowFpsWindows - 1);
      } else {
        this.lowFpsWindows = Math.max(0, this.lowFpsWindows - 1);
        this.highFpsWindows = 0;
      }

      if (this.lowFpsWindows >= 2 && this.currentDpr > this.quality.minDpr) {
        this.currentDpr = Math.max(this.quality.minDpr, this.currentDpr - 0.12);
        this.renderer.setPixelRatio(this.currentDpr);
        this.resize(false);
        this.lowFpsWindows = 0;
      } else if (this.highFpsWindows >= 3 && this.currentDpr + 0.04 < this.idealDpr) {
        this.currentDpr = Math.min(this.idealDpr, this.currentDpr + 0.10);
        this.renderer.setPixelRatio(this.currentDpr);
        this.resize(false);
        this.highFpsWindows = 0;
      }
    }

    animateCameraAltitude(targetAltitude, duration, token) {
      targetAltitude = Math.max(this.cameraAltitude, targetAltitude);
      const startAltitude = this.cameraAltitude;
      const start = performance.now();
      const reduced = this.earth.motion?.matches || window.matchMedia("(prefers-reduced-motion: reduce)").matches;
      return new Promise(resolve => {
        const frame = now => {
          if (token !== this.transitionToken) return resolve();
          const raw = clamp((now - start) / (reduced ? 120 : duration), 0, 1);
          const eased = smootherstep(raw);
          const ground = this.terrain.getHeightAtWorld(this.camera.position.x, this.camera.position.z) ?? this.lastGround;
          this.lastGround = ground;
          this.cameraAltitude = lerp(startAltitude, targetAltitude, eased);
          this.camera.position.y = ground + this.cameraAltitude;
          if (raw < 1) requestAnimationFrame(frame);
          else resolve();
        };
        requestAnimationFrame(frame);
      });
    }

    showTutorial() {
      let seen = false;
      try { seen = sessionStorage.getItem("antara-earth-full-tutorial-v2") === "1"; } catch {}
      if (seen) return;
      this.tutorial.classList.add("is-visible");
      window.clearTimeout(this.tutorialTimeout);
      this.tutorialTimeout = window.setTimeout(() => this.dismissTutorial(), 9000);
    }

    dismissTutorial(persist = false) {
      if (!this.tutorial.classList.contains("is-visible")) return;
      this.tutorial.classList.remove("is-visible");
      window.clearTimeout(this.tutorialTimeout);
      if (persist) {
        try { sessionStorage.setItem("antara-earth-full-tutorial-v2", "1"); } catch {}
      }
    }

    async exit() {
      if (!this.active || this.state === STATES.EXITING) return;
      if (this.state === STATES.ERROR || this.state === STATES.PREPARING) {
        this.failBackToOrbit();
        return;
      }
      this.state = STATES.EXITING;
      const token = ++this.transitionToken;
      this.input.clear();
      this.tutorial.classList.remove("is-visible");
      this.root.classList.add("is-exiting");
      document.getElementById("announcement").textContent = "Meninggalkan permukaan Bumi dan kembali ke panorama orbit.";

      if (this.prepared && this.camera) {
        try { await this.animateCameraAltitude(Math.max(this.cameraAltitude, 52), 1650, token); }
        catch {}
      }
      if (token !== this.transitionToken) return;

      const reduced = this.earth.motion?.matches || window.matchMedia("(prefers-reduced-motion: reduce)").matches;
      const duration = reduced ? 260 : 3200;
      const start = performance.now();
      await new Promise(resolve => {
        const frame = now => {
          if (token !== this.transitionToken) return resolve();
          const raw = clamp((now - start) / duration, 0, 1);
          const eased = smootherstep(raw);
          this.root.style.setProperty("--surface", String(1 - smoothstep(raw / 0.62)));
          this.root.style.setProperty("--entry-progress", String(1 - eased));
          this.earth.setFullExplorationTransition?.(1 - eased, EARTH_ENTRY);
          if (raw < 1) requestAnimationFrame(frame);
          else resolve();
        };
        requestAnimationFrame(frame);
      });
      if (token !== this.transitionToken) return;
      this.finishExit();
    }

    finishExit() {
      if (document.fullscreenElement === this.root) document.exitFullscreen().catch(() => {});
      this.state = STATES.IDLE;
      this.stopLoop();
      this.input.unbind();
      this.root.className = "earth-full-exploration";
      this.root.hidden = true;
      this.root.inert = true;
      this.root.setAttribute("aria-hidden", "true");
      this.root.style.removeProperty("--surface");
      this.root.style.removeProperty("--entry-progress");
      this.entryButton.disabled = false;
      this.earth.setFullExplorationTransition?.(0, EARTH_ENTRY);
      this.earth.endFullExplorationFocus?.();
      document.getElementById("mission").classList.remove("is-earth-full");
      document.getElementById("announcement").textContent = "Kembali ke panorama Bumi.";
      this.entryButton.focus({ preventScroll: true });
    }

    showError(error) {
      console.error("Earth Full Exploration:", error);
      this.stopLoop();
      this.input.unbind();
      this.state = STATES.ERROR;
      this.loading.hidden = true;
      this.errorPanel.hidden = false;
      this.errorMessage.textContent = /DEM|tile|terrain|Terrarium/i.test(error?.message || "")
        ? "Data elevasi Terrarium tidak dapat dimuat. Panorama Bumi tetap aman. Periksa koneksi internet atau host tile elevasi secara lokal."
        : (error?.message || "Terrain Bumi belum dapat dimuat.");
      this.root.classList.add("is-error");
      this.root.classList.remove("is-preparing", "is-entering", "is-active", "is-surface-visible");
      this.entryButton.disabled = false;
      document.getElementById("announcement").textContent = "Eksplorasi penuh Bumi belum dapat dimuat. Panorama Bumi tetap tersedia.";
    }

    failBackToOrbit() {
      this.transitionToken += 1;
      this.state = STATES.IDLE;
      this.disposeSurface();
      this.root.className = "earth-full-exploration";
      this.root.hidden = true;
      this.root.inert = true;
      this.root.setAttribute("aria-hidden", "true");
      this.root.style.removeProperty("--surface");
      this.root.style.removeProperty("--entry-progress");
      this.errorPanel.hidden = true;
      this.loading.hidden = true;
      this.entryButton.disabled = false;
      this.earth.setFullExplorationTransition?.(0, EARTH_ENTRY);
      this.earth.endFullExplorationFocus?.();
      document.getElementById("mission").classList.remove("is-earth-full");
      this.entryButton.focus({ preventScroll: true });
    }

    disposeSurface() {
      this.resourceGeneration += 1;
      this.stopLoop();
      this.input.unbind();
      this.terrain?.dispose();
      this.terrain = null;
      this.provider?.clear();
      this.provider = null;
      if (this.renderer) {
        this.renderer.dispose();
        this.renderer.domElement?.remove();
        this.renderer = null;
      }
      this.scene = null;
      this.camera = null;
      this.prepared = false;
      this.preparingPromise = null;
    }

    forceReset() {
      this.transitionToken += 1;
      this.state = STATES.IDLE;
      if (document.fullscreenElement === this.root) document.exitFullscreen().catch(() => {});
      this.disposeSurface();
      this.root.hidden = true;
      this.root.inert = true;
      this.root.setAttribute("aria-hidden", "true");
      this.root.className = "earth-full-exploration";
      this.root.style.removeProperty("--surface");
      this.root.style.removeProperty("--entry-progress");
      this.errorPanel.hidden = true;
      this.loading.hidden = true;
      this.entryButton.disabled = false;
      document.getElementById("mission").classList.remove("is-earth-full");
      this.earth.setFullExplorationTransition?.(0, EARTH_ENTRY);
      this.earth.endFullExplorationFocus?.();
    }

    async toggleFullscreen() {
      try {
        if (document.fullscreenElement === this.root) await document.exitFullscreen();
        else await this.root.requestFullscreen();
      } catch {}
      this.updateFullscreenLabel();
    }

    updateFullscreenLabel() {
      const active = document.fullscreenElement === this.root;
      this.fullscreenButton.setAttribute("aria-pressed", String(active));
      this.fullscreenButton.querySelector("span").textContent = active ? "Keluar layar penuh" : "Layar penuh";
      if (this.prepared) this.resize();
    }

    resize(recalculateDpr = true) {
      if (!this.prepared || !this.renderer || !this.camera) return;
      const width = Math.max(1, this.viewport.clientWidth || window.innerWidth);
      const height = Math.max(1, this.viewport.clientHeight || window.innerHeight);
      if (recalculateDpr) {
        this.idealDpr = this.calculateIdealDpr();
        if (!Number.isFinite(this.currentDpr)) this.currentDpr = this.idealDpr;
        if (this.currentDpr > this.idealDpr) this.currentDpr = this.idealDpr;
        this.renderer.setPixelRatio(this.currentDpr);
      }
      this.renderer.setSize(width, height, false);
      this.camera.aspect = width / height;
      this.camera.fov = this.mobileFov();
      this.camera.updateProjectionMatrix();
    }

    wait(ms) {
      return new Promise(resolve => window.setTimeout(resolve, ms));
    }
  };
})();
