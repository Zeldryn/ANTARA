"use strict";

/*
 * ANTARA · Venus Full Exploration
 *
 * Rebuilt from scratch around two existing ANTARA references:
 * - Mars Full Exploration: camera, input, pointer lock, HUD/action lifecycle,
 *   fullscreen, entry/exit transition language, adaptive DPR and view culling.
 * - Earth Full Exploration: choose a destination before terrain is loaded and
 *   return to the destination selector without leaving the planet.
 *
 * The rejected synthetic Venus macro-terrain renderer is not used.
 * Exactly one high-detail region is interactive at a time, while lower-LOD
 * scientific terrain continues far beyond the collision boundary.
 */

(() => {
  const DEG = Math.PI / 180;
  const VENUS_RADIUS_KM = 6051.8;
  const KM_PER_DEG_LAT = 2 * Math.PI * VENUS_RADIUS_KM / 360;
  const MAX_ALTITUDE_KM = 18;
  const MIN_CLEARANCE_KM = 0.12;
  const STATES = Object.freeze({
    IDLE: "idle",
    SELECTING: "selecting",
    PREPARING: "preparing",
    ENTERING: "entering",
    EXPLORING: "exploring",
    SWITCHING: "switching",
    EXITING: "exiting",
    ERROR: "error"
  });

  const REGIONS = Object.freeze([
    {
      id: "maat",
      name: "Maat Mons",
      short: "Maat Mons",
      category: "VOLCANIC RISE",
      latitude: 0.9,
      longitudeEast: 194.5,
      heading: 0,
      pitch: -0.22,
      spawn: { x: 0, z: 31, altitude: 2.7 },
      featureCenter: { x: 0, z: -25 },
      playRadius: 64,
      softBoundaryStart: 52,
      source: "https://science.nasa.gov/photojournal/venus-3-d-perspective-view-of-maat-mons-2/",
      coordinateSource: "https://planetarynames.wr.usgs.gov/Feature/3550",
      image: "https://assets.science.nasa.gov/dynamicimage/assets/science/psd/photojournal/pia/pia00/pia00254/PIA00254.jpg?crop=faces%2Cfocalpoint&fit=clip&h=1100&w=1400",
      descriptor: "Gunung api perisai besar dengan lereng panjang, dataran retak, dan aliran lava yang memanjang ratusan kilometer.",
      description: "Region ini menyusun komposisi seperti perspektif Magellan: dataran vulkanik berfraktur di depan, transisi aliran di tengah, dan tubuh Maat Mons yang dominan naik di kejauhan.",
      facts: [
        "NASA/JPL menggambarkan Maat Mons sebagai gunung api sekitar 8 km di atas radius rata-rata Venus.",
        "Perspektif Magellan memperlihatkan aliran lava memanjang ratusan kilometer melintasi dataran retak menuju kaki gunung.",
        "Magellan merekam sebuah vent Maat Mons berubah bentuk dan membesar secara signifikan antara Februari dan Oktober 1991, bukti kuat aktivitas vulkanik saat itu.",
        "Model ANTARA memprioritaskan edifice yang lebar dan lereng gradual, bukan pola radial berbentuk bintang."
      ],
      visualizationNote: "VISUALISASI AKTIVITAS VULKANIK · Rekonstruksi ilustratif berdasarkan perubahan vent Magellan 1991. Glow lokal bukan foto observasi langsung lava pijar saat ini.",
      palette: { low: 0x7b3f22, mid: 0xd39445, high: 0xf1c56c, accent: 0x64331d, rock: 0x45291b },
      fog: 0xa76537,
      fogDensity: 0.0100,
      sky: 0xb96d39,
      sun: 0xffdc96,
      hemi: 0xf2ad67,
      exposure: 1.04
    },
    {
      id: "maxwell",
      name: "Maxwell Montes",
      short: "Maxwell",
      category: "MOUNTAIN BELT",
      latitude: 65.0,
      longitudeEast: 6.0,
      heading: -0.12,
      pitch: -0.24,
      spawn: { x: -8, z: 34, altitude: 3.1 },
      featureCenter: { x: 4, z: -16 },
      playRadius: 62,
      softBoundaryStart: 50,
      source: "https://science.nasa.gov/photojournal/venus-maxwell-montes-and-cleopatra-crater/",
      coordinateSource: "https://planetarynames.wr.usgs.gov/Feature/3766",
      image: "https://assets.science.nasa.gov/dynamicimage/assets/science/psd/photojournal/pia/pia00/pia00149/PIA00149.jpg?crop=faces%2Cfocalpoint&fit=clip&h=1100&w=1400",
      descriptor: "Massif tertinggi Venus dengan ridge memanjang, lembah terhubung, dan konteks dataran tinggi Ishtar.",
      description: "Maxwell dibentuk sebagai sistem pegunungan memanjang. Relief utama berasal dari envelope massif dan ridge terarah, bukan pegunungan noise yang berdiri sendiri-sendiri.",
      facts: [
        "NASA/JPL menyebut Maxwell Montes sebagai pegunungan tertinggi di Venus, hampir 11 km di atas radius rata-rata planet.",
        "Magellan memperlihatkan terrain Maxwell yang sangat terdeformasi berdampingan dengan dataran lava Lakshmi yang lebih halus.",
        "Ridge pada region ini dipaksa mengikuti tren struktural regional agar siluetnya terbaca sebagai mountain belt."
      ],
      palette: { low: 0x59402f, mid: 0x98734f, high: 0xddb27a, accent: 0x6b4934, rock: 0x3f3028 },
      fog: 0x80583e,
      fogDensity: 0.0090,
      sky: 0x8d6548,
      sun: 0xffd19a,
      hemi: 0xdba071,
      exposure: 1.02
    },
    {
      id: "aphrodite",
      name: "Aphrodite Terra",
      short: "Aphrodite",
      category: "TECTONIC HIGHLAND",
      latitude: -1.0,
      longitudeEast: 81.0,
      heading: 0.08,
      pitch: -0.20,
      spawn: { x: 4, z: 30, altitude: 2.8 },
      featureCenter: { x: 0, z: -10 },
      playRadius: 64,
      softBoundaryStart: 52,
      source: "https://science.nasa.gov/photojournal/venus-interior-of-ovda-regio/",
      coordinateSource: "https://planetarynames.wr.usgs.gov/Feature/317",
      image: "https://assets.science.nasa.gov/dynamicimage/assets/science/psd/photojournal/pia/pia00/pia00218/PIA00218.jpg?crop=faces%2Cfocalpoint&fit=clip&h=1100&w=1400",
      descriptor: "Highland Ovda-style dengan fabric ridge-valley, fracture silang, rift, dan lava-filled lows.",
      description: "Aphrodite menggunakan interior Ovda sebagai acuan morfologi: fabric ridge dan valley berarah NE–SW dipotong fracture NW–SE, disertai trough besar dan lowland yang lebih halus.",
      facts: [
        "NASA/JPL mendeskripsikan interior Ovda Regio sebagai block-fractured terrain hasil beberapa episode tektonik.",
        "Ridge dan valley dasarnya berarah timur-laut ke barat-daya lalu dipotong fracture ekstensional berarah barat-laut ke tenggara.",
        "Lembah besar pada referensi Magellan diisi material gelap yang kemungkinan lava."
      ],
      palette: { low: 0x694126, mid: 0xa96e3c, high: 0xdca35f, accent: 0x5b3824, rock: 0x463025 },
      fog: 0x93603b,
      fogDensity: 0.0095,
      sky: 0xa4683c,
      sun: 0xffcc88,
      hemi: 0xe49c62,
      exposure: 1.03
    },
    {
      id: "ishtar",
      name: "Ishtar Terra",
      short: "Ishtar",
      category: "ELEVATED PLATEAU",
      latitude: 65.0,
      longitudeEast: 0.0,
      heading: -0.08,
      pitch: -0.18,
      spawn: { x: -4, z: 30, altitude: 2.6 },
      featureCenter: { x: -5, z: -2 },
      playRadius: 63,
      softBoundaryStart: 51,
      source: "https://science.nasa.gov/photojournal/perspective-view-of-ishtar-terra/",
      coordinateSource: "https://planetarynames.wr.usgs.gov/Feature/2733",
      image: "https://assets.science.nasa.gov/dynamicimage/assets/science/psd/photojournal/pia/pia00/pia00093/PIA00093.jpg?crop=faces%2Cfocalpoint&fit=clip&h=1100&w=1400",
      descriptor: "Plateau tinggi luas dengan interior lebih halus dan mountain-bounded margins.",
      description: "Ishtar dibuat sebagai plateau regional yang jelas lebih tinggi dari lowland, dengan interior Lakshmi-like yang relatif halus dan sabuk pegunungan terdeformasi di batasnya.",
      facts: [
        "NASA/JPL menggambarkan Ishtar sebagai plateau besar sekitar 3.3 km di atas lowlands di sekitarnya.",
        "Lakshmi Planum merupakan plateau tinggi yang dikelilingi mountain chains dan terrain yang sangat terdeformasi.",
        "Model memisahkan interior plateau yang lebih halus dari margin pegunungan agar Ishtar tidak terbaca sebagai satu mesa generik."
      ],
      palette: { low: 0x604a36, mid: 0xa3845b, high: 0xdabe83, accent: 0x735038, rock: 0x47392f },
      fog: 0x826047,
      fogDensity: 0.0091,
      sky: 0x916a4d,
      sun: 0xffd09a,
      hemi: 0xdca071,
      exposure: 1.02
    },
    {
      id: "alpha",
      name: "Alpha Regio",
      short: "Alpha",
      category: "TESSERA UPLAND",
      latitude: -25.0,
      longitudeEast: 4.0,
      heading: 0.18,
      pitch: -0.22,
      spawn: { x: 0, z: 28, altitude: 2.5 },
      featureCenter: { x: 0, z: -6 },
      playRadius: 62,
      softBoundaryStart: 50,
      source: "https://science.nasa.gov/photojournal/venus-three-dimensional-perspective-view-of-alpha-region/",
      coordinateSource: "https://planetarynames.wr.usgs.gov/Feature/203",
      image: "https://assets.science.nasa.gov/dynamicimage/assets/science/psd/photojournal/pia/pia00/pia00481/PIA00481.jpg?crop=faces%2Cfocalpoint&fit=clip&h=1100&w=1400",
      descriptor: "Tessera dengan dua keluarga ridge silang, trough, fault valley, block uplift, dan lava-filled local lows.",
      description: "Alpha dibangun sebagai tessera: beberapa tren struktural saling memotong dan membentuk pola polygonal, dengan trough dan fault valley yang memisahkan block upland. Tidak ada dune field atau bukit bulat acak.",
      facts: [
        "NASA/JPL menyebut Alpha Regio sebagai upland sekitar 1,300 km dengan beberapa tren ridge, trough, dan flat-floored fault valleys yang saling berpotongan.",
        "Local dark patches pada data Magellan adalah topographic lows yang terisi lava lebih halus.",
        "Relief procedural hanya mengisi detail kecil; identitas utama region datang dari fabric tessera yang terarah."
      ],
      palette: { low: 0x653719, mid: 0xad7133, high: 0xe8b657, accent: 0x56301a, rock: 0x3f281b },
      fog: 0x975c32,
      fogDensity: 0.0100,
      sky: 0xa76735,
      sun: 0xffca7d,
      hemi: 0xe79a59,
      exposure: 1.03
    }
  ]);


  const clamp = (value, min, max) => Math.max(min, Math.min(max, value));
  const lerp = (a, b, t) => a + (b - a) * t;
  const smoothstep = value => { const t = clamp(value, 0, 1); return t * t * (3 - 2 * t); };
  const smootherstep = value => { const t = clamp(value, 0, 1); return t * t * t * (t * (t * 6 - 15) + 10); };
  const formatCoordinate = (latitude, longitudeEast) => `${Math.abs(latitude).toFixed(3)}° ${latitude >= 0 ? "N" : "S"}  ·  ${(((longitudeEast % 360) + 360) % 360).toFixed(3)}° E`;
  const formatAltitude = km => km < 1 ? `${Math.max(0, km * 1000).toFixed(0)} M` : `${Math.max(0, km).toFixed(km < 10 ? 2 : 1)} KM`;
  const formatSpeed = kmPerSecond => kmPerSecond < 1 ? `${Math.round(kmPerSecond * 1000)} M/S` : `${kmPerSecond.toFixed(2)} KM/S`;
  const wait = ms => new Promise(resolve => window.setTimeout(resolve, ms));
  const wrapLongitudeEast = longitude => ((longitude % 360) + 360) % 360;
  const hash2 = (x, z, seed = 0) => {
    const value = Math.sin(x * 127.1 + z * 311.7 + seed * 74.7) * 43758.5453123;
    return value - Math.floor(value);
  };
  const valueNoise = (x, z, seed = 0) => {
    const ix = Math.floor(x), iz = Math.floor(z);
    const fx = x - ix, fz = z - iz;
    const sx = fx * fx * (3 - 2 * fx), sz = fz * fz * (3 - 2 * fz);
    const a = hash2(ix, iz, seed), b = hash2(ix + 1, iz, seed);
    const c = hash2(ix, iz + 1, seed), d = hash2(ix + 1, iz + 1, seed);
    return lerp(lerp(a, b, sx), lerp(c, d, sx), sz) * 2 - 1;
  };
  const fbm = (x, z, seed = 0) => {
    let sum = 0, amp = 0.5, freq = 1, norm = 0;
    for (let octave = 0; octave < 4; octave += 1) {
      sum += valueNoise(x * freq, z * freq, seed + octave * 17) * amp;
      norm += amp;
      amp *= 0.5;
      freq *= 2.04;
    }
    return sum / norm;
  };
  const ridge = n => 1 - Math.abs(n);
  const sleepFrame = () => new Promise(resolve => requestAnimationFrame(() => resolve()));

  const VENUS_REGIONAL_TOPO_SIZE = 257;
  const VENUS_REGIONAL_TOPO_HALF_EXTENT_KM = 330;
  const VENUS_REGIONAL_TOPO_TEMPLATE = "assets/venus-data/topography-{region}.f32";
  const VENUS_PDS_TOPO_LOCAL = "assets/venus-data/topogrd.img";
  const VENUS_PDS_TOPO_REMOTE = "https://pds-geosciences.wustl.edu/mgn/mgn-v-rss-5-gravity-l2-v1/mg_5201/images/topogrd.img";
  const VENUS_PDS_TOPO_REMOTE_ASCII = "https://pds-geosciences.wustl.edu/mgn/mgn-v-rss-5-gravity-l2-v1/mg_5201/topo/topogrd.dat";
  const VENUS_WMS_ENDPOINT = "https://planetarymaps.usgs.gov/cgi-bin/mapserv";
  const VENUS_WMS_MAP = "/maps/venus/venus_simp_cyl.map";

  class VenusTopographyProvider {
    constructor(region) {
      this.region = region;
      this.width = 360;
      this.height = 180;
      this.grid = null;
      this.regionalGrid = null;
      this.regionalSize = VENUS_REGIONAL_TOPO_SIZE;
      this.regionalHalfExtentKm = VENUS_REGIONAL_TOPO_HALF_EXTENT_KM;
      this.sourceLabel = "MAGELLAN TOPOGRAPHY · PDS GTDR 1°";
      this.sourceUrl = null;
      this.local = false;
    }

    async fetchWithTimeout(url, timeoutMs = 12000) {
      const controller = new AbortController();
      const timer = window.setTimeout(() => controller.abort(), timeoutMs);
      try {
        const response = await fetch(url, { signal: controller.signal, cache: "force-cache", mode: "cors" });
        if (!response.ok) throw new Error(`HTTP ${response.status} saat memuat ${url}`);
        return response;
      } finally {
        window.clearTimeout(timer);
      }
    }

    decodeRegionalFloat32(buffer) {
      const expected = this.regionalSize * this.regionalSize * 4;
      if (buffer.byteLength !== expected) {
        throw new Error(`Ukuran regional GTDR tidak cocok (${buffer.byteLength} byte, perlu ${expected}).`);
      }
      return new Float32Array(buffer.slice(0));
    }

    async loadRegionalGrid() {
      const configured = window.ANTARA_VENUS_TOPOGRAPHY_TEMPLATE;
      const url = configured
        ? String(configured).replace("{region}", this.region.id)
        : VENUS_REGIONAL_TOPO_TEMPLATE.replace("{region}", this.region.id);
      const response = await this.fetchWithTimeout(url, 10000);
      this.regionalGrid = this.decodeRegionalFloat32(await response.arrayBuffer());
      this.sourceLabel = "USGS MAGELLAN GTDR · 4.641 KM/PIX SOURCE";
      this.sourceUrl = url;
      this.local = !/^https?:/i.test(url);
      return true;
    }

    decodeImageBytes(buffer) {
      const bytes = new Uint8Array(buffer);
      if (bytes.byteLength !== this.width * this.height) {
        throw new Error(`Ukuran TOPOGRD.IMG tidak cocok (${bytes.byteLength} byte).`);
      }
      const grid = new Float32Array(bytes.length);
      for (let i = 0; i < bytes.length; i += 1) grid[i] = bytes[i] * 0.0478 - 2.492;
      return grid;
    }

    decodeAscii(text) {
      const matches = text.match(/[-+]?\d+(?:\.\d+)?/g) || [];
      if (matches.length < this.width * this.height) {
        throw new Error(`TOPOGRD.DAT hanya menghasilkan ${matches.length} sampel.`);
      }
      const grid = new Float32Array(this.width * this.height);
      for (let i = 0; i < grid.length; i += 1) grid[i] = Number(matches[i]);
      return grid;
    }

    async load(onProgress = () => {}) {
      if (this.grid || this.regionalGrid) return this;
      let regionalError = null;
      let coarseError = null;
      onProgress(0.03);
      try {
        await this.loadRegionalGrid();
        onProgress(0.82);
        return this;
      } catch (error) {
        regionalError = error;
      }

      const configured = window.ANTARA_VENUS_TOPOGRAPHY_URL;
      const candidates = [configured, VENUS_PDS_TOPO_LOCAL, VENUS_PDS_TOPO_REMOTE].filter(Boolean);
      for (const url of candidates) {
        try {
          const response = await this.fetchWithTimeout(url);
          this.grid = this.decodeImageBytes(await response.arrayBuffer());
          if (!this.regionalGrid) {
            this.sourceLabel = "PDS MAGELLAN TOPOGRAPHY · 1° FALLBACK";
            this.sourceUrl = url;
            this.local = !/^https?:/i.test(url);
          }
          onProgress(0.82);
          return this;
        } catch (error) {
          coarseError = error;
        }
      }
      try {
        const response = await this.fetchWithTimeout(VENUS_PDS_TOPO_REMOTE_ASCII, 15000);
        this.grid = this.decodeAscii(await response.text());
        if (!this.regionalGrid) {
          this.sourceLabel = "PDS MAGELLAN TOPOGRAPHY · 1° ASCII FALLBACK";
          this.sourceUrl = VENUS_PDS_TOPO_REMOTE_ASCII;
          this.local = false;
        }
        onProgress(0.82);
        return this;
      } catch (error) {
        coarseError = error;
      }

      throw new Error(`Data topografi ilmiah Venus tidak tersedia. Jalankan tools/prepare_venus_magellan_data.py untuk membuat crop GTDR lokal. Regional: ${regionalError?.message || "tidak tersedia"}. Fallback: ${coarseError?.message || "tidak tersedia"}.`);
    }

    sampleRegional(latitude, longitudeEast) {
      if (!this.regionalGrid) return Number.NaN;
      let deltaLon = wrapLongitudeEast(longitudeEast) - wrapLongitudeEast(this.region.longitudeEast);
      if (deltaLon > 180) deltaLon -= 360;
      if (deltaLon < -180) deltaLon += 360;
      const cosLat = Math.max(0.18, Math.cos(this.region.latitude * DEG));
      const xKm = deltaLon * KM_PER_DEG_LAT * cosLat;
      const zKm = (this.region.latitude - latitude) * KM_PER_DEG_LAT;
      const u = (xKm / this.regionalHalfExtentKm + 1) * 0.5;
      const v = (zKm / this.regionalHalfExtentKm + 1) * 0.5;
      if (u < 0 || u > 1 || v < 0 || v > 1) return Number.NaN;
      const fx = u * (this.regionalSize - 1);
      const fy = v * (this.regionalSize - 1);
      const x0 = clamp(Math.floor(fx), 0, this.regionalSize - 1);
      const y0 = clamp(Math.floor(fy), 0, this.regionalSize - 1);
      const x1 = clamp(x0 + 1, 0, this.regionalSize - 1);
      const y1 = clamp(y0 + 1, 0, this.regionalSize - 1);
      const tx = fx - x0, ty = fy - y0;
      const a = this.regionalGrid[y0 * this.regionalSize + x0];
      const b = this.regionalGrid[y0 * this.regionalSize + x1];
      const c = this.regionalGrid[y1 * this.regionalSize + x0];
      const d = this.regionalGrid[y1 * this.regionalSize + x1];
      if (![a, b, c, d].every(Number.isFinite)) return Number.NaN;
      return lerp(lerp(a, b, tx), lerp(c, d, tx), ty);
    }

    sampleRawGrid(latitude, longitudeEast) {
      const lat = clamp(latitude, -89.49, 89.49);
      const lon = wrapLongitudeEast(longitudeEast);
      const rowFloat = 89.5 - lat;
      const colFloat = wrapLongitudeEast(lon - 240);
      const r0 = clamp(Math.floor(rowFloat), 0, this.height - 1);
      const r1 = clamp(r0 + 1, 0, this.height - 1);
      const c0 = ((Math.floor(colFloat) % this.width) + this.width) % this.width;
      const c1 = (c0 + 1) % this.width;
      const fr = clamp(rowFloat - Math.floor(rowFloat), 0, 1);
      const fc = clamp(colFloat - Math.floor(colFloat), 0, 1);
      const a = this.grid[r0 * this.width + c0];
      const b = this.grid[r0 * this.width + c1];
      const c = this.grid[r1 * this.width + c0];
      const d = this.grid[r1 * this.width + c1];
      return lerp(lerp(a, b, fc), lerp(c, d, fc), fr);
    }

    sample(latitude, longitudeEast) {
      const regional = this.sampleRegional(latitude, longitudeEast);
      if (Number.isFinite(regional)) return regional;
      if (this.grid) return this.sampleRawGrid(latitude, longitudeEast);
      throw new Error("Magellan GTDR belum dimuat.");
    }

    clear() {
      this.grid = null;
      this.regionalGrid = null;
      this.sourceUrl = null;
    }
  }

  class VenusRadarProvider {
    constructor(THREE, region, quality) {
      this.THREE = THREE;
      this.region = region;
      this.quality = quality;
      this.texture = null;
      this.extentKm = 310;
      this.sourceLabel = "USGS · MAGELLAN SAR FMAP";
    }

    buildWmsUrl() {
      const latRadius = this.extentKm / KM_PER_DEG_LAT;
      const lonScale = Math.max(0.18, Math.cos(this.region.latitude * DEG));
      const lonRadius = this.extentKm / (KM_PER_DEG_LAT * lonScale);
      const centerLon = this.region.longitudeEast < 3 ? this.region.longitudeEast + 360 : this.region.longitudeEast;
      const minLon = centerLon - lonRadius;
      const maxLon = centerLon + lonRadius;
      const minLat = clamp(this.region.latitude - latRadius, -89.5, 89.5);
      const maxLat = clamp(this.region.latitude + latRadius, -89.5, 89.5);
      const bbox = `${minLon},${minLat},${maxLon},${maxLat}`;
      const size = this.quality.name === "HIGH" ? 1536 : this.quality.name === "MEDIUM" ? 1024 : 768;
      const params = new URLSearchParams({
        map: VENUS_WMS_MAP,
        SERVICE: "WMS",
        VERSION: "1.1.1",
        REQUEST: "GetMap",
        LAYERS: "MAGELLAN",
        STYLES: "",
        SRS: "EPSG:4326",
        BBOX: bbox,
        WIDTH: String(size),
        HEIGHT: String(size),
        FORMAT: "image/png",
        TRANSPARENT: "FALSE"
      });
      return `${VENUS_WMS_ENDPOINT}?${params.toString()}`;
    }

    async load() {
      const configured = window.ANTARA_VENUS_RADAR_TEMPLATE;
      const urls = configured
        ? [String(configured).replace("{region}", this.region.id)]
        : [`assets/venus-data/radar-${this.region.id}.png`, this.buildWmsUrl()];
      let texture = null;
      for (const url of urls) {
        texture = await new Promise((resolve, reject) => {
          const loader = new this.THREE.TextureLoader();
          loader.setCrossOrigin("anonymous");
          loader.load(url, resolve, undefined, reject);
        }).catch(() => null);
        if (texture) {
          this.sourceLabel = /^https?:/i.test(url) ? "USGS · MAGELLAN SAR FMAP" : "LOCAL · MAGELLAN SAR FMAP";
          break;
        }
      }
      if (!texture) return null;
      texture.colorSpace = this.THREE.SRGBColorSpace;
      texture.wrapS = this.THREE.ClampToEdgeWrapping;
      texture.wrapT = this.THREE.ClampToEdgeWrapping;
      texture.minFilter = this.THREE.LinearMipmapLinearFilter;
      texture.magFilter = this.THREE.LinearFilter;
      texture.anisotropy = Math.min(this.quality.anisotropy, 16);
      this.texture = texture;
      return texture;
    }

    dispose() {
      this.texture?.dispose?.();
      this.texture = null;
    }
  }

  class VenusRegionWorld {
    constructor(THREE, scene, renderer, region, quality) {
      this.THREE = THREE;
      this.scene = scene;
      this.renderer = renderer;
      this.region = region;
      this.quality = quality;
      this.group = new THREE.Group();
      this.group.name = `venus-gtdr-world-${region.id}`;
      this.scene.add(this.group);
      this.topography = new VenusTopographyProvider(region);
      this.radar = new VenusRadarProvider(THREE, region, quality);
      this.material = null;
      this.backgroundMaterial = null;
      this.tiles = [];
      this.background = null;
      this.props = null;
      this.particles = null;
      this.resources = [];
      this.referenceElevation = 0;
      this.cosLat = Math.max(0.18, Math.cos(region.latitude * DEG));
      this.worldSpan = quality.name === "HIGH" ? 520 : quality.name === "MEDIUM" ? 460 : 400;
      this.tileSize = quality.tileSize || 24;
      this.tileHalfCount = quality.name === "HIGH" ? 4 : quality.name === "MEDIUM" ? 3 : 3;
      this.tmpColor = new THREE.Color();
      this.lowColor = new THREE.Color(region.palette.low);
      this.midColor = new THREE.Color(region.palette.mid);
      this.highColor = new THREE.Color(region.palette.high);
      this.rockColor = new THREE.Color(region.palette.rock);
      this.fogColor = new THREE.Color(region.fog);
      this.detailTexture = this.createMicroDetailTexture();
      this.resources.push(this.detailTexture);
      this.frame = 0;
    }

    createMicroDetailTexture() {
      const T = this.THREE;
      const size = this.quality.name === "HIGH" ? 512 : this.quality.name === "MEDIUM" ? 384 : 256;
      const data = new Uint8Array(size * size * 4);
      const hash = (x, y, seed) => {
        let h = Math.imul((x + seed * 17) | 0, 374761393) ^ Math.imul((y - seed * 29) | 0, 668265263);
        h = Math.imul(h ^ (h >>> 13), 1274126177);
        return ((h ^ (h >>> 16)) >>> 0) / 4294967295;
      };
      const fade = t => t * t * (3 - 2 * t);
      const wrapCell = (value, cells) => ((value % cells) + cells) % cells;
      const periodicNoise = (u, v, cells, seed) => {
        const px = u * cells, py = v * cells;
        const x0 = Math.floor(px), y0 = Math.floor(py);
        const tx = fade(px - x0), ty = fade(py - y0);
        const a = hash(wrapCell(x0, cells), wrapCell(y0, cells), seed);
        const b = hash(wrapCell(x0 + 1, cells), wrapCell(y0, cells), seed);
        const c = hash(wrapCell(x0, cells), wrapCell(y0 + 1, cells), seed);
        const d = hash(wrapCell(x0 + 1, cells), wrapCell(y0 + 1, cells), seed);
        return lerp(lerp(a, b, tx), lerp(c, d, tx), ty);
      };
      for (let y = 0; y < size; y += 1) {
        const v = y / size;
        for (let x = 0; x < size; x += 1) {
          const u = x / size;
          const broad = periodicNoise(u, v, 8, 337);
          const fine = periodicNoise(u, v, 29, 353);
          const grit = periodicNoise(u, v, 73, 379);
          const fractured = Math.abs(periodicNoise(u, v, 17, 401) - 0.5) * 2;
          const value = clamp(0.48 + (broad - 0.5) * 0.34 + (fine - 0.5) * 0.25 + (grit - 0.5) * 0.12 - fractured * 0.05, 0, 1);
          const byte = Math.round(value * 255);
          const i = (y * size + x) * 4;
          data[i] = byte; data[i + 1] = byte; data[i + 2] = byte; data[i + 3] = 255;
        }
      }
      const texture = new T.DataTexture(data, size, size, T.RGBAFormat, T.UnsignedByteType);
      texture.name = "venus-subresolution-microdetail";
      texture.colorSpace = T.NoColorSpace;
      texture.wrapS = T.RepeatWrapping;
      texture.wrapT = T.RepeatWrapping;
      texture.minFilter = T.LinearMipmapLinearFilter;
      texture.magFilter = T.LinearFilter;
      texture.anisotropy = Math.min(this.quality.anisotropy, 12);
      texture.needsUpdate = true;
      return texture;
    }

    geoFromWorld(x, z) {
      return {
        latitude: clamp(this.region.latitude - z / KM_PER_DEG_LAT, -89.49, 89.49),
        longitudeEast: wrapLongitudeEast(this.region.longitudeEast + x / (KM_PER_DEG_LAT * this.cosLat))
      };
    }

    scientificHeightAt(x, z) {
      const geo = this.geoFromWorld(x, z);
      return this.topography.sample(geo.latitude, geo.longitudeEast) - this.referenceElevation;
    }

    microHeightAt(x, z) {
      const r = Math.hypot(x, z);
      const detailFade = 1 - smoothstep((r - this.region.playRadius * 0.92) / Math.max(1, this.worldSpan * 0.42 - this.region.playRadius));
      const n1 = fbm(x * 0.080, z * 0.080, 31);
      const n2 = fbm(x * 0.19 + 7.1, z * 0.19 - 3.4, 73);
      const fractured = ridge(valueNoise(x * 0.12, z * 0.12, 109)) - 0.54;
      let meso = n1 * 0.10 + n2 * 0.045;
      if (this.region.id === "maat") {
        const flow = ridge(valueNoise(x * 0.045 + z * 0.011, z * 0.060, 151));
        meso += (flow - 0.58) * 0.16 + fractured * 0.07;
      } else if (this.region.id === "maxwell") {
        const aligned = ridge(valueNoise((x * 0.82 + z * 0.36) * 0.075, (-x * 0.36 + z * 0.82) * 0.030, 191));
        meso += (aligned - 0.56) * 0.34 + fractured * 0.10;
      } else if (this.region.id === "aphrodite") {
        const a = ridge(valueNoise((x + z) * 0.070, (z - x) * 0.022, 229));
        const b = ridge(valueNoise((x - z) * 0.050, (x + z) * 0.030, 233));
        meso += (a - 0.57) * 0.22 + (b - 0.60) * 0.16;
      } else if (this.region.id === "ishtar") {
        meso += fractured * 0.08 + n2 * 0.05;
      } else if (this.region.id === "alpha") {
        const a = ridge(valueNoise((x + z) * 0.105, (z - x) * 0.036, 269));
        const b = ridge(valueNoise((x - z) * 0.095, (x + z) * 0.031, 271));
        meso += (a - 0.55) * 0.28 + (b - 0.56) * 0.23;
      }
      return meso * clamp(detailFade, 0, 1);
    }

    heightAt(x, z) {
      return this.scientificHeightAt(x, z) + this.microHeightAt(x, z);
    }

    slopeAt(x, z, epsilon = 0.22) {
      const hL = this.heightAt(x - epsilon, z), hR = this.heightAt(x + epsilon, z);
      const hD = this.heightAt(x, z - epsilon), hU = this.heightAt(x, z + epsilon);
      return Math.hypot((hR - hL) / (epsilon * 2), (hU - hD) / (epsilon * 2));
    }

    colorAt(x, z, height, slope, target = this.tmpColor) {
      const localNoise = fbm(x * 0.032 + 4.7, z * 0.032 - 9.2, 313);
      const normalized = clamp((height + 1.2) / 8.8, 0, 1);
      if (normalized < 0.46) target.copy(this.lowColor).lerp(this.midColor, normalized / 0.46);
      else target.copy(this.midColor).lerp(this.highColor, (normalized - 0.46) / 0.54);
      const rockMix = clamp((slope - 0.11) * 1.9 + Math.max(0, localNoise) * 0.13, 0, 0.46);
      target.lerp(this.rockColor, rockMix);
      target.multiplyScalar(0.90 + localNoise * 0.10);
      return target;
    }

    createMaterial(radarTexture, background = false) {
      const T = this.THREE;
      const material = new T.MeshStandardMaterial({
        color: 0xffffff,
        vertexColors: true,
        map: radarTexture || null,
        bumpMap: this.detailTexture,
        bumpScale: 0.001,
        roughness: background ? 0.98 : this.quality.name === "HIGH" ? 0.885 : this.quality.name === "MEDIUM" ? 0.90 : 0.92,
        metalness: 0.0,
        fog: true,
        dithering: true
      });
      material.name = background ? "venus-gtdr-background-material" : "venus-gtdr-surface-material";
      material.onBeforeCompile = shader => {
        shader.uniforms.uVenusMicroDetail = { value: this.detailTexture };
        shader.uniforms.uVenusAlbedoDetail = { value: background ? 0.055 : this.quality.name === "HIGH" ? 0.20 : this.quality.name === "MEDIUM" ? 0.16 : 0.12 };
        shader.uniforms.uVenusNormalDetail = { value: background ? 0.7 : this.quality.name === "HIGH" ? 5.1 : this.quality.name === "MEDIUM" ? 3.9 : 2.8 };
        shader.uniforms.uVenusDetailTier = { value: background ? 1.0 : 3.0 };
        shader.vertexShader = shader.vertexShader
          .replace("#include <common>", "#include <common>\nvarying vec3 vAntaraWorld;")
          .replace("#include <begin_vertex>", "#include <begin_vertex>\nvAntaraWorld = (modelMatrix * vec4(transformed, 1.0)).xyz;");
        shader.fragmentShader = shader.fragmentShader
          .replace("#include <common>", `#include <common>
            varying vec3 vAntaraWorld;
            uniform sampler2D uVenusMicroDetail;
            uniform float uVenusAlbedoDetail;
            uniform float uVenusNormalDetail;
            uniform float uVenusDetailTier;

            float venusTriSample(sampler2D tex, vec3 p, vec3 n, float scale, vec3 phase) {
              vec3 blend = pow(max(abs(n), vec3(0.0001)), vec3(5.0));
              blend /= max(blend.x + blend.y + blend.z, 0.0001);
              float sx = texture2D(tex, p.yz * scale + phase.yz).r;
              float sy = texture2D(tex, p.xz * scale + phase.xz).r;
              float sz = texture2D(tex, p.xy * scale + phase.xy).r;
              return sx * blend.x + sy * blend.y + sz * blend.z;
            }`)
          .replace("#include <map_fragment>", `#include <map_fragment>
            vec3 venusDx = dFdx(vAntaraWorld);
            vec3 venusDy = dFdy(vAntaraWorld);
            vec3 venusGeomNormal = normalize(cross(venusDx, venusDy));
            if (!gl_FrontFacing) venusGeomNormal = -venusGeomNormal;
            float venusViewDistance = length(cameraPosition - vAntaraWorld);
            float venusNearWeight = 1.0 - smoothstep(1.0, 13.0, venusViewDistance);
            float venusMidWeight = 1.0 - smoothstep(6.0, 42.0, venusViewDistance);
            float venusBroad = 0.5;
            float venusFine = 0.5;
            float venusGrit = 0.5;
            if (uVenusDetailTier > 0.5) venusBroad = venusTriSample(uVenusMicroDetail, vAntaraWorld, venusGeomNormal, 0.16, vec3(0.19, 0.47, 0.71));
            if (uVenusDetailTier > 1.5) venusFine = venusTriSample(uVenusMicroDetail, vAntaraWorld, venusGeomNormal, 0.78, vec3(0.63, 0.11, 0.39));
            if (uVenusDetailTier > 2.5) venusGrit = venusTriSample(uVenusMicroDetail, vAntaraWorld, venusGeomNormal, 2.10, vec3(0.31, 0.79, 0.09));
            float venusMicro = (venusBroad - 0.5) * 0.50 * venusMidWeight
              + (venusFine - 0.5) * 0.36 * venusNearWeight
              + (venusGrit - 0.5) * 0.14 * venusNearWeight;
            float venusMicroHeight = (venusBroad - 0.5) * 0.54 * venusMidWeight
              + (venusFine - 0.5) * 0.34 * venusNearWeight
              + (venusGrit - 0.5) * 0.12 * venusNearWeight;
            diffuseColor.rgb *= clamp(1.0 + venusMicro * uVenusAlbedoDetail, 0.87, 1.13);`)
          .replace("#include <normal_fragment_maps>", `#include <normal_fragment_maps>
            #ifdef USE_BUMPMAP
              if (uVenusDetailTier > 1.5) {
                vec2 venusMicroSlope = vec2(dFdx(venusMicroHeight), dFdy(venusMicroHeight));
                normal = perturbNormalArb(-vViewPosition, normal, venusMicroSlope * uVenusNormalDetail, faceDirection);
              }
            #endif`)
          .replace("#include <roughnessmap_fragment>", `#include <roughnessmap_fragment>
            roughnessFactor = clamp(roughnessFactor + (0.5 - venusBroad) * 0.08 + (0.5 - venusGrit) * 0.045 * step(2.5, uVenusDetailTier), 0.72, 1.0);`);
        material.userData.venusShader = shader;
      };
      material.customProgramCacheKey = () => `antara-venus-gtdr-triplanar-v3-${background ? "background" : "surface"}-${this.quality.name}`;
      material.needsUpdate = true;
      return material;
    }

    geometryForPatch(centerX, centerZ, size, segments, background = false) {
      const T = this.THREE;
      const row = segments + 1;
      const positions = new Float32Array(row * row * 3);
      const colors = new Float32Array(row * row * 3);
      const uvs = new Float32Array(row * row * 2);
      const indices = new Uint32Array(segments * segments * 6);
      const half = size / 2;
      let p = 0, c = 0, uv = 0, q = 0;
      const radarExtent = this.radar.extentKm;
      for (let iz = 0; iz <= segments; iz += 1) {
        const z = centerZ - half + size * (iz / segments);
        for (let ix = 0; ix <= segments; ix += 1) {
          const x = centerX - half + size * (ix / segments);
          const scientific = this.scientificHeightAt(x, z);
          const micro = background ? this.microHeightAt(x, z) * 0.18 : this.microHeightAt(x, z);
          const y = scientific + micro - (background ? 0.028 : 0);
          const slope = background ? 0.08 : this.slopeAt(x, z, Math.max(0.18, size / segments * 0.72));
          const color = this.colorAt(x, z, y, slope);
          const farFade = background ? smoothstep(Math.hypot(x, z) / (this.worldSpan * 0.54)) : 0;
          if (background) color.lerp(this.fogColor, farFade * 0.26).multiplyScalar(1 - farFade * 0.12);
          positions[p++] = x; positions[p++] = y; positions[p++] = z;
          colors[c++] = color.r; colors[c++] = color.g; colors[c++] = color.b;
          uvs[uv++] = clamp((x + radarExtent) / (radarExtent * 2), 0, 1);
          uvs[uv++] = clamp((radarExtent - z) / (radarExtent * 2), 0, 1);
        }
      }
      for (let iz = 0; iz < segments; iz += 1) {
        for (let ix = 0; ix < segments; ix += 1) {
          const a = iz * row + ix, b = a + 1, d = (iz + 1) * row + ix, e = d + 1;
          indices[q++] = a; indices[q++] = d; indices[q++] = b;
          indices[q++] = b; indices[q++] = d; indices[q++] = e;
        }
      }
      const geometry = new T.BufferGeometry();
      geometry.setAttribute("position", new T.BufferAttribute(positions, 3));
      geometry.setAttribute("color", new T.BufferAttribute(colors, 3));
      geometry.setAttribute("uv", new T.BufferAttribute(uvs, 2));
      geometry.setIndex(new T.BufferAttribute(indices, 1));
      geometry.computeVertexNormals();
      geometry.computeBoundingSphere();
      return geometry;
    }

    chooseSegments(cx, cz) {
      const distance = Math.hypot(cx, cz);
      if (distance < this.tileSize * 1.25) return this.quality.nearSegments;
      if (distance < this.tileSize * 2.75) return this.quality.midSegments;
      return this.quality.farSegments;
    }

    async build(onProgress = () => {}) {
      onProgress(0.01);
      await this.topography.load(value => onProgress(0.02 + value * 0.20));
      this.referenceElevation = this.topography.sample(this.region.latitude, this.region.longitudeEast);
      onProgress(0.24);
      const radarTexture = await this.radar.load().catch(() => null);
      onProgress(0.34);
      this.material = this.createMaterial(radarTexture, false);
      this.backgroundMaterial = this.createMaterial(radarTexture, true);
      this.resources.push(this.material, this.backgroundMaterial);

      const bgSegments = this.quality.name === "HIGH" ? 118 : this.quality.name === "MEDIUM" ? 92 : 70;
      this.background = new this.THREE.Mesh(this.geometryForPatch(0, 0, this.worldSpan, bgSegments, true), this.backgroundMaterial);
      this.background.name = `venus-scientific-visual-world-${this.region.id}`;
      this.background.frustumCulled = true;
      this.background.renderOrder = -2;
      this.group.add(this.background);
      onProgress(0.48);

      const half = this.tileHalfCount;
      const total = (half * 2 + 1) ** 2;
      let built = 0;
      for (let tz = -half; tz <= half; tz += 1) {
        for (let tx = -half; tx <= half; tx += 1) {
          const cx = tx * this.tileSize, cz = tz * this.tileSize;
          const segments = this.chooseSegments(cx, cz);
          const geometry = this.geometryForPatch(cx, cz, this.tileSize, segments, false);
          const mesh = new this.THREE.Mesh(geometry, this.material);
          mesh.name = `venus-gtdr-chunk-${tx}-${tz}`;
          mesh.frustumCulled = true;
          mesh.renderOrder = 1;
          this.group.add(mesh);
          this.tiles.push({ mesh, cx, cz, segments });
          built += 1;
          if (built % 4 === 0) {
            onProgress(0.48 + (built / total) * 0.35);
            await sleepFrame();
          }
        }
      }
      this.createGeologicalProps();
      this.createAtmosphericParticles();
      onProgress(1);
    }

    createGeologicalProps() {
      const T = this.THREE;
      const count = Math.max(0, this.quality.accentCount * 7);
      if (!count) return;
      const geometry = new T.DodecahedronGeometry(0.24, 0);
      const material = new T.MeshStandardMaterial({ color: this.region.palette.rock, roughness: 0.96, metalness: 0 });
      const mesh = new T.InstancedMesh(geometry, material, count);
      mesh.name = `venus-geologic-props-${this.region.id}`;
      const dummy = new T.Object3D();
      let written = 0;
      for (let i = 0; i < count * 5 && written < count; i += 1) {
        const angle = hash2(i, 7, 19) * Math.PI * 2;
        const radius = 8 + Math.sqrt(hash2(i, 11, 23)) * (this.region.playRadius - 12);
        const x = Math.cos(angle) * radius, z = Math.sin(angle) * radius;
        const slope = this.slopeAt(x, z, 0.35);
        const geologyGate = this.region.id === "maxwell" || this.region.id === "alpha" ? 0.11 : 0.07;
        if (slope < geologyGate && hash2(i, 13, 29) < 0.56) continue;
        const y = this.heightAt(x, z);
        const scale = 0.35 + hash2(i, 17, 31) * (this.region.id === "maxwell" ? 1.9 : 1.25);
        dummy.position.set(x, y + scale * 0.10, z);
        dummy.rotation.set(hash2(i, 2, 37) * 0.8, hash2(i, 3, 41) * Math.PI * 2, hash2(i, 5, 43) * 0.5);
        dummy.scale.set(scale * (0.75 + hash2(i, 19, 47) * 0.45), scale * (0.55 + hash2(i, 23, 53) * 0.50), scale);
        dummy.updateMatrix();
        mesh.setMatrixAt(written, dummy.matrix);
        written += 1;
      }
      mesh.count = written;
      mesh.instanceMatrix.needsUpdate = true;
      mesh.frustumCulled = true;
      this.group.add(mesh);
      this.props = mesh;
      this.resources.push(geometry, material);
    }

    createAtmosphericParticles() {
      const T = this.THREE;
      const count = this.quality.name === "LOW" ? 110 : this.quality.name === "HIGH" ? 260 : 180;
      const positions = new Float32Array(count * 3);
      for (let i = 0; i < count; i += 1) {
        const angle = hash2(i, 31, 71) * Math.PI * 2;
        const radius = 20 + Math.sqrt(hash2(i, 37, 73)) * 120;
        positions[i * 3] = Math.cos(angle) * radius;
        positions[i * 3 + 1] = 3 + hash2(i, 41, 79) * 21;
        positions[i * 3 + 2] = Math.sin(angle) * radius;
      }
      const geometry = new T.BufferGeometry();
      geometry.setAttribute("position", new T.BufferAttribute(positions, 3));
      const material = new T.PointsMaterial({ color: this.region.sun, size: 0.055, transparent: true, opacity: 0.16, depthWrite: false, fog: true });
      this.particles = new T.Points(geometry, material);
      this.particles.name = `venus-atmosphere-particulates-${this.region.id}`;
      this.group.add(this.particles);
      this.resources.push(geometry, material);
    }

    updateVisibility(camera) {
      if (!camera) return;
      this.frame += 1;
      if (this.frame % 12 !== 0) return;
      const headingX = -Math.sin(camera.rotation.y), headingZ = -Math.cos(camera.rotation.y);
      for (const entry of this.tiles) {
        const dx = entry.cx - camera.position.x, dz = entry.cz - camera.position.z;
        const distance = Math.hypot(dx, dz);
        const forwardDot = distance > 0.001 ? (dx * headingX + dz * headingZ) / distance : 1;
        entry.mesh.visible = distance < 170 && (distance < 70 || forwardDot > -0.82);
      }
    }

    updateAmbient(delta) {
      if (this.particles) this.particles.rotation.y += delta * 0.008;
    }

    dispose() {
      this.scene.remove(this.group);
      for (const entry of this.tiles) entry.mesh.geometry.dispose();
      this.tiles.length = 0;
      this.background?.geometry?.dispose?.();
      this.radar.dispose();
      this.topography.clear();
      const seen = new Set();
      for (const resource of this.resources) {
        if (!resource || seen.has(resource)) continue;
        seen.add(resource);
        resource.dispose?.();
      }
      this.resources.length = 0;
      this.group.clear();
      this.background = null;
      this.props = null;
      this.particles = null;
      this.material = null;
      this.backgroundMaterial = null;
    }
  }

  class VenusInputManager {
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
      this.controller.root.querySelectorAll("[data-venus-control]").forEach(button => {
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

    interactive() { return this.controller.state === STATES.EXPLORING; }

    onKeyDown(event) {
      if (!this.controller.active) return;
      const key = event.key.toLowerCase();
      if (!["w", "a", "s", "d", "q", "e", "shift", "control", "escape"].includes(key)) return;
      event.preventDefault();
      event.stopImmediatePropagation();
      if (key === "escape") {
        if (event.repeat) return;
        if (document.pointerLockElement === this.controller.viewport) {
          document.exitPointerLock?.();
          this.clear();
          return;
        }
        if (this.controller.state === STATES.SELECTING && this.controller.regionWorld) this.controller.closeSelectorToRegion();
        else this.controller.exit();
        return;
      }
      if (!this.interactive()) return;
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
      if (!this.interactive()) return;
      if (event.target.closest("button, a, [data-venus-ui], .venus-region-selector")) return;
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
      if (!this.interactive() || this.dragPointer !== event.pointerId) return;
      const previous = this.dragPointers.get(event.pointerId);
      if (!previous) return;
      const dx = event.clientX - previous.x;
      const dy = event.clientY - previous.y;
      previous.x = event.clientX;
      previous.y = event.clientY;
      this.controller.addLookDelta(dx, dy, event.pointerType === "touch" ? "touch" : "mouse");
    }

    onLockedMouseMove(event) {
      if (!this.interactive() || document.pointerLockElement !== this.controller.viewport) return;
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
      if (!this.interactive()) return;
      event.preventDefault();
      event.stopPropagation();
      button.setPointerCapture?.(event.pointerId);
      this.pointerActions.set(event.pointerId, button.dataset.venusControl);
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

    movementAxes() {
      return {
        forward: Number(this.actionActive("forward")) - Number(this.actionActive("backward")),
        strafe: Number(this.actionActive("right")) - Number(this.actionActive("left")),
        vertical: Number(this.actionActive("up")) - Number(this.actionActive("down"))
      };
    }

    boost() { return this.keys.has("shift"); }
    precision() { return this.keys.has("control"); }
    clear() {
      this.keys.clear();
      this.pointerActions.clear();
      this.dragPointers.clear();
      this.dragPointer = null;
      this.controller.root?.querySelectorAll(".is-held").forEach(button => button.classList.remove("is-held"));
    }
  }

  window.VenusFullExploration = class VenusFullExploration {
    constructor(venusScene) {
      this.venus = venusScene;
      this.root = document.getElementById("venus-full-exploration");
      this.viewport = document.getElementById("venus-full-viewport");
      this.entryButton = document.getElementById("venus-full-explore-button");
      this.selector = document.getElementById("venus-region-selector");
      this.selectorGrid = document.getElementById("venus-region-grid");
      this.selectorClose = document.getElementById("venus-region-selector-close");
      this.exitButton = document.getElementById("venus-full-exit");
      this.fullscreenButton = document.getElementById("venus-fullscreen-toggle");
      this.locationButton = document.getElementById("venus-location-toggle");
      this.loading = document.getElementById("venus-full-loading");
      this.loadingStatus = document.getElementById("venus-full-loading-status");
      this.loadingProgress = document.getElementById("venus-full-loading-progress");
      this.errorPanel = document.getElementById("venus-full-error");
      this.errorMessage = document.getElementById("venus-full-error-message");
      this.errorReturn = document.getElementById("venus-full-error-return");
      this.tutorial = document.getElementById("venus-full-tutorial");
      this.tutorialClose = document.getElementById("venus-tutorial-close");
      this.travelVeil = document.getElementById("venus-travel-veil");
      this.travelLabel = document.getElementById("venus-travel-label");
      this.boundaryHint = document.getElementById("venus-boundary-hint");
      this.infoCard = document.getElementById("venus-landmark-card");
      this.infoMinimize = document.getElementById("venus-landmark-minimize");
      this.infoToggle = document.getElementById("venus-info-toggle");
      this.infoMedia = document.getElementById("venus-landmark-media");
      this.infoName = document.getElementById("venus-landmark-name");
      this.infoType = document.getElementById("venus-landmark-type");
      this.infoCoords = document.getElementById("venus-landmark-coords");
      this.infoImage = document.getElementById("venus-landmark-image");
      this.infoDescription = document.getElementById("venus-landmark-description");
      this.infoFacts = document.getElementById("venus-landmark-facts");
      this.infoBadge = document.getElementById("venus-landmark-data-badge");
      this.infoVisualizationNote = document.getElementById("venus-landmark-visualization-note");
      this.infoSource = document.getElementById("venus-landmark-source");
      this.infoCoordinateSource = document.getElementById("venus-landmark-coordinate-source");
      this.hudCoordinates = document.getElementById("venus-hud-coordinates");
      this.hudAltitude = document.getElementById("venus-hud-altitude");
      this.hudAltitudeLimit = document.getElementById("venus-hud-altitude-limit");
      this.hudSpeed = document.getElementById("venus-hud-speed");
      this.hudLocation = document.getElementById("venus-hud-location");
      this.hudDistance = document.getElementById("venus-hud-distance");
      this.hudRegionType = document.getElementById("venus-hud-region-type");
      this.hudData = document.getElementById("venus-hud-data");

      this.state = STATES.IDLE;
      this.region = REGIONS[0];
      this.regionWorld = null;
      this.renderer = null;
      this.scene = null;
      this.camera = null;
      this.hemiLight = null;
      this.sunLight = null;
      this.fillLight = null;
      this.frame = null;
      this.previous = 0;
      this.statsClock = 0;
      this.statsFrames = 0;
      this.lowFpsWindows = 0;
      this.highFpsWindows = 0;
      this.currentDpr = 1;
      this.idealDpr = 1;
      this.transitionToken = 0;
      this.resourceGeneration = 0;
      this.preparingPromise = null;
      this.speed = 0;
      this.yaw = 0;
      this.pitch = -0.22;
      this.lookYawTarget = this.yaw;
      this.lookPitchTarget = this.pitch;
      this.velocity = { x: 0, y: 0, z: 0 };
      this.lastGround = 0;
      this.cameraAltitude = 2.7;
      this.selectorOpenedFromRegion = false;
      this.tutorialTimeout = null;
      this.hudClock = 0;
      this.quality = this.detectQuality();
      this.input = new VenusInputManager(this);
      this.tick = this.tick.bind(this);
      this.root.inert = true;
      this.buildSelector();
      this.bindUI();
    }

    get active() { return this.state !== STATES.IDLE; }

    detectQuality() {
      const width = window.innerWidth;
      const cores = navigator.hardwareConcurrency || 4;
      const memory = navigator.deviceMemory || 4;
      const coarse = window.matchMedia("(pointer: coarse)").matches;
      if (coarse || width <= 760 || cores <= 4 || memory <= 3) {
        return { name: "LOW", tileSize: 28, nearSegments: 72, midSegments: 44, farSegments: 24, maxDpr: 1.25, minDpr: 0.88, supersample: 1, pixelBudget: 2600000, anisotropy: 4, accentCount: 8 };
      }
      if (cores >= 8 && memory >= 6) {
        return { name: "HIGH", tileSize: 24, nearSegments: 176, midSegments: 104, farSegments: 48, maxDpr: 1.85, minDpr: 0.95, supersample: 1.18, pixelBudget: 6800000, anisotropy: 12, accentCount: 18 };
      }
      return { name: "MEDIUM", tileSize: 26, nearSegments: 112, midSegments: 68, farSegments: 34, maxDpr: 1.55, minDpr: 0.92, supersample: 1.08, pixelBudget: 4700000, anisotropy: 8, accentCount: 12 };
    }

    calculateIdealDpr() {
      const width = Math.max(1, this.viewport?.clientWidth || window.innerWidth);
      const height = Math.max(1, this.viewport?.clientHeight || window.innerHeight);
      const requested = Math.max(window.devicePixelRatio || 1, this.quality.supersample);
      const budget = Math.sqrt(this.quality.pixelBudget / (width * height));
      return clamp(Math.min(requested, this.quality.maxDpr, budget), this.quality.minDpr, this.quality.maxDpr);
    }

    buildSelector() {
      const fragment = document.createDocumentFragment();
      REGIONS.forEach((region, index) => {
        const button = document.createElement("button");
        button.type = "button";
        button.className = "venus-region-card";
        button.dataset.venusRegion = region.id;
        button.innerHTML = `<span class="venus-region-preview venus-region-preview-${region.id}" aria-hidden="true"><i></i><b>${region.short}</b></span><span class="venus-region-index">${String(index + 1).padStart(2, "0")}</span><strong>${region.name}</strong><span class="venus-region-descriptor">${region.descriptor}</span><small>${formatCoordinate(region.latitude, region.longitudeEast)}</small><em>${region.category}</em><span class="venus-region-source">NASA/JPL · Magellan reference</span>`;
        fragment.append(button);
      });
      this.selectorGrid.replaceChildren(fragment);
    }

    bindUI() {
      this.entryButton.addEventListener("click", () => this.enter());
      this.selectorGrid.addEventListener("click", event => {
        const button = event.target.closest("[data-venus-region]");
        if (!button) return;
        const region = REGIONS.find(item => item.id === button.dataset.venusRegion);
        if (region) this.chooseRegion(region);
      });
      this.selectorClose.addEventListener("click", () => {
        if (this.selectorOpenedFromRegion && this.regionWorld) this.closeSelectorToRegion();
        else this.exit();
      });
      this.exitButton.addEventListener("click", () => this.exit());
      this.locationButton.addEventListener("click", () => this.openSelectorFromRegion());
      this.fullscreenButton.addEventListener("click", () => this.toggleFullscreen());
      this.errorReturn.addEventListener("click", () => this.failBackToOrbit());
      this.tutorialClose.addEventListener("click", () => this.dismissTutorial(true));
      this.infoMinimize.addEventListener("click", event => { event.stopPropagation(); this.hideRegionInfo(); });
      this.infoToggle.addEventListener("click", event => { event.stopPropagation(); this.showRegionInfo(true); });
      this.infoMedia.addEventListener("click", event => { event.stopPropagation(); this.openReferenceImage(); });
      document.addEventListener("fullscreenchange", () => this.updateFullscreenLabel());
      document.addEventListener("visibilitychange", () => {
        if (!this.active) return;
        if (document.hidden) this.stopLoop(); else this.startLoop();
      });
      window.addEventListener("resize", () => this.resize());
      window.addEventListener("orientationchange", () => window.setTimeout(() => this.resize(), 120));
      document.addEventListener("keydown", event => {
        if (event.key !== "Escape" || this.state !== STATES.SELECTING) return;
        event.preventDefault();
        event.stopImmediatePropagation();
        if (this.selectorOpenedFromRegion && this.regionWorld) this.closeSelectorToRegion();
        else this.exit();
      }, true);
    }

    enter() {
      if (!this.venus.active || this.venus.travelMode || this.state !== STATES.IDLE) return;
      if (this.venus.exploring) this.venus.exitExploration();
      this.entryButton.disabled = true;
      this.selectorOpenedFromRegion = false;
      this.state = STATES.SELECTING;
      this.root.hidden = false;
      this.root.inert = false;
      this.root.setAttribute("aria-hidden", "false");
      this.root.className = "mars-full-exploration venus-full-exploration is-selecting";
      this.root.style.setProperty("--surface-opacity", "0");
      this.root.style.setProperty("--entry-progress", "0");
      this.selector.hidden = false;
      this.loading.hidden = true;
      this.errorPanel.hidden = true;
      this.infoCard.classList.remove("is-visible");
      this.infoCard.setAttribute("aria-hidden", "true");
      this.infoToggle.hidden = true;
      document.getElementById("mission").classList.add("is-venus-full-selecting");
      document.getElementById("announcement").textContent = "Pilih destinasi Eksplorasi Pengalaman Penuh Venus.";
      requestAnimationFrame(() => this.selector.querySelector("[data-venus-region]")?.focus({ preventScroll: true }));
    }

    async chooseRegion(region) {
      if (![STATES.SELECTING, STATES.EXPLORING].includes(this.state)) return;
      const switching = Boolean(this.regionWorld);
      const token = ++this.transitionToken;
      this.region = region;
      this.selector.hidden = true;
      this.selectorOpenedFromRegion = false;
      this.input.clear();
      this.input.unbind();
      this.stopLoop();
      this.tutorial.classList.remove("is-visible");
      this.infoCard.classList.remove("is-visible");
      this.infoCard.setAttribute("aria-hidden", "true");
      this.infoToggle.hidden = true;
      this.errorPanel.hidden = true;
      this.state = switching ? STATES.SWITCHING : STATES.PREPARING;
      this.root.classList.remove("is-selecting", "is-active", "is-error");
      this.root.classList.add("is-preparing");
      document.getElementById("mission").classList.remove("is-venus-full-selecting");
      document.getElementById("mission").classList.add("is-venus-full");
      this.setLoading(0.03, `MENGUNCI DESTINASI · ${region.name.toUpperCase()}`);
      this.loading.hidden = false;
      this.travelLabel.textContent = `NAVIGASI · ${region.name.toUpperCase()}`;
      if (switching) this.travelVeil.classList.add("is-visible", "is-covered");
      document.getElementById("announcement").textContent = `Menyiapkan region ${region.name}.`;

      try {
        if (!this.venus.startFullExplorationTransition?.(region) && !this.venus.fullExplorationActive) throw new Error("Transisi Venus tidak tersedia.");
        await this.prepareRenderer();
        if (token !== this.transitionToken) return;
        this.disposeRegion();
        this.applyRegionEnvironment(region);
        this.setLoading(0.10, `MEMUAT MAGELLAN GTDR · ${region.category}`);
        this.regionWorld = new VenusRegionWorld(this.THREE, this.scene, this.renderer, region, this.quality);
        await this.regionWorld.build(progress => this.setLoading(0.10 + progress * 0.76, `MEMBANGUN TERRAIN GTDR · ${Math.round(progress * 100)}%`));
        if (token !== this.transitionToken) return;
        this.setCameraForRegion(region, switching ? 12 : 24);
        this.updateRegionUI();
        this.setLoading(1, "REGION SIAP");
        await wait(this.venus.motion.matches ? 80 : 180);
        if (token !== this.transitionToken) return;
        if (switching) await this.runRegionSwitchTransition(token);
        else await this.runEntryTransition(token);
      } catch (error) {
        if (token !== this.transitionToken) return;
        this.showError(error);
      }
    }

    async prepareRenderer() {
      if (this.renderer) return;
      if (this.preparingPromise) return this.preparingPromise;
      const generation = this.resourceGeneration;
      const promise = (async () => {
        await this.venus.prepare();
        if (generation !== this.resourceGeneration) throw new Error("Venus exploration preparation cancelled.");
        const T = this.venus.THREE;
        if (!T) throw new Error("Renderer 3D Venus tidak tersedia pada perangkat ini.");
        this.THREE = T;
        const canvas = document.createElement("canvas");
        canvas.className = "mars-full-canvas venus-full-canvas";
        canvas.setAttribute("aria-hidden", "true");
        const context = canvas.getContext("webgl2", { alpha: true, antialias: this.quality.name !== "LOW", powerPreference: "high-performance" });
        if (!context) throw new Error("WebGL2 diperlukan untuk Eksplorasi Pengalaman Penuh Venus.");
        this.renderer = new T.WebGLRenderer({ canvas, context, alpha: true, antialias: this.quality.name !== "LOW" });
        this.renderer.outputColorSpace = T.SRGBColorSpace;
        this.renderer.toneMapping = T.ACESFilmicToneMapping;
        this.renderer.toneMappingExposure = 1.02;
        this.idealDpr = this.calculateIdealDpr();
        this.currentDpr = this.idealDpr;
        this.renderer.setPixelRatio(this.currentDpr);
        this.renderer.setClearColor(0x7b4a38, 1);
        this.viewport.replaceChildren(canvas);
        this.scene = new T.Scene();
        this.camera = new T.PerspectiveCamera(this.mobileFov(), 1, 0.05, 420);
        this.camera.rotation.order = "YXZ";
        this.hemiLight = new T.HemisphereLight(0xe8b889, 0x2d1a18, 1.0);
        this.sunLight = new T.DirectionalLight(0xffd0a0, 2.45);
        this.sunLight.position.set(-45, 68, 30);
        this.fillLight = new T.DirectionalLight(0xb27862, 0.22);
        this.fillLight.position.set(42, 18, -34);
        this.scene.add(this.hemiLight, this.sunLight, this.fillLight);
        this.moveForward = new T.Vector3();
        this.moveRight = new T.Vector3();
        this.moveIntent = new T.Vector3();
        this.resize();
      })();
      this.preparingPromise = promise;
      try { await promise; }
      finally { if (this.preparingPromise === promise) this.preparingPromise = null; }
    }

    applyRegionEnvironment(region) {
      if (!this.scene || !this.renderer) return;
      this.scene.fog = new this.THREE.FogExp2(region.fog, region.fogDensity);
      this.renderer.setClearColor(region.sky, 1);
      this.renderer.toneMappingExposure = region.exposure || 1.04;
      this.hemiLight.color.set(region.hemi);
      this.hemiLight.groundColor.set(region.id === "maat" ? 0x35110f : 0x2a1715);
      this.hemiLight.intensity = region.id === "maat" ? 1.10 : 1.03;
      this.sunLight.color.set(region.sun);
      this.sunLight.intensity = region.id === "maat" ? 2.58 : 2.38;
      this.fillLight.color.set(region.id === "maat" ? 0xff633d : 0xb65a43);
      this.fillLight.intensity = region.id === "maat" ? 0.34 : 0.25;
      this.root.dataset.region = region.id;
    }

    setCameraForRegion(region, altitude = 2.7) {
      const ground = this.regionWorld.heightAt(region.spawn.x, region.spawn.z);
      this.lastGround = ground;
      this.cameraAltitude = altitude;
      this.camera.position.set(region.spawn.x, ground + altitude, region.spawn.z);
      this.yaw = region.heading;
      this.pitch = region.pitch;
      this.lookYawTarget = this.yaw;
      this.lookPitchTarget = this.pitch;
      this.camera.rotation.set(this.pitch, this.yaw, 0, "YXZ");
      this.velocity.x = this.velocity.y = this.velocity.z = 0;
    }

    async runEntryTransition(token) {
      this.state = STATES.ENTERING;
      this.root.classList.remove("is-preparing");
      this.root.classList.add("is-entering");
      this.loading.hidden = true;
      this.startLoop();
      const duration = this.venus.motion.matches ? 360 : 3800;
      const start = performance.now();
      const startAltitude = this.cameraAltitude;
      const targetAltitude = this.region.spawn.altitude;
      await new Promise(resolve => {
        const frame = now => {
          if (token !== this.transitionToken || this.state !== STATES.ENTERING) return resolve();
          const raw = clamp((now - start) / duration, 0, 1);
          const eased = smootherstep(raw);
          this.venus.setFullExplorationTransition?.(eased, this.region);
          this.root.style.setProperty("--surface-opacity", String(smoothstep((raw - 0.30) / 0.45)));
          this.root.style.setProperty("--entry-progress", String(eased));
          const ground = this.regionWorld.heightAt(this.camera.position.x, this.camera.position.z);
          this.lastGround = ground;
          this.cameraAltitude = lerp(startAltitude, targetAltitude, smoothstep((raw - 0.32) / 0.68));
          this.camera.position.y = ground + this.cameraAltitude;
          if (raw < 1) requestAnimationFrame(frame); else resolve();
        };
        requestAnimationFrame(frame);
      });
      if (token !== this.transitionToken) return;
      this.activateRegion();
    }

    async runRegionSwitchTransition(token) {
      this.loading.hidden = true;
      const start = performance.now();
      const duration = this.venus.motion.matches ? 120 : 720;
      await new Promise(resolve => {
        const frame = now => {
          if (token !== this.transitionToken) return resolve();
          const t = clamp((now - start) / duration, 0, 1);
          this.travelVeil.classList.toggle("is-covered", t < 0.45);
          if (t < 1) requestAnimationFrame(frame); else resolve();
        };
        requestAnimationFrame(frame);
      });
      if (token !== this.transitionToken) return;
      this.travelVeil.classList.remove("is-visible", "is-covered");
      this.root.style.setProperty("--surface-opacity", "1");
      this.root.style.setProperty("--entry-progress", "1");
      this.activateRegion();
    }

    activateRegion() {
      this.state = STATES.EXPLORING;
      this.root.classList.remove("is-preparing", "is-entering", "is-selecting");
      this.root.classList.add("is-active", "is-surface-visible");
      this.root.style.setProperty("--surface-opacity", "1");
      this.root.style.setProperty("--entry-progress", "1");
      this.input.bind();
      this.previous = performance.now();
      this.startLoop();
      this.showTutorial();
      this.showRegionInfo();
      this.updateHUD();
      document.getElementById("announcement").textContent = `Eksplorasi Venus aktif di ${this.region.name}.`;
    }

    openSelectorFromRegion() {
      if (this.state !== STATES.EXPLORING || !this.regionWorld) return;
      this.selectorOpenedFromRegion = true;
      this.state = STATES.SELECTING;
      this.input.unbind();
      this.selector.hidden = false;
      this.root.classList.add("is-selecting");
      this.infoCard.classList.remove("is-visible");
      this.infoCard.setAttribute("aria-hidden", "true");
      this.infoToggle.hidden = true;
      document.getElementById("announcement").textContent = "Pilih region Venus lain untuk dijelajahi.";
      requestAnimationFrame(() => this.selector.querySelector(`[data-venus-region="${this.region.id}"]`)?.focus({ preventScroll: true }));
    }

    closeSelectorToRegion() {
      if (!this.regionWorld) return;
      this.selector.hidden = true;
      this.selectorOpenedFromRegion = false;
      this.state = STATES.EXPLORING;
      this.root.classList.remove("is-selecting");
      this.input.bind();
      this.startLoop();
      this.showRegionInfo();
    }

    addLookDelta(dx, dy, source = "mouse") {
      const sensitivity = source === "touch" ? 0.0034 : source === "locked" ? 0.00175 : 0.0022;
      this.lookYawTarget -= dx * sensitivity;
      this.lookPitchTarget = clamp(this.lookPitchTarget - dy * sensitivity, -1.40, 1.18);
    }

    updateLook(delta) {
      const response = 1 - Math.exp(-delta * 27);
      this.yaw += (this.lookYawTarget - this.yaw) * response;
      this.pitch += (this.lookPitchTarget - this.pitch) * response;
      this.pitch = clamp(this.pitch, -1.40, 1.18);
    }

    startLoop() {
      if (!this.active || document.hidden || this.frame || !this.renderer || !this.regionWorld) return;
      this.previous = performance.now();
      this.frame = requestAnimationFrame(this.tick);
    }

    stopLoop() {
      if (this.frame) cancelAnimationFrame(this.frame);
      this.frame = null;
    }

    tick(now) {
      this.frame = null;
      if (!this.active || document.hidden || !this.renderer || !this.regionWorld) return;
      const delta = Math.min(0.1, Math.max(0.001, (now - this.previous) / 1000));
      this.previous = now;
      this.statsClock += delta;
      this.statsFrames += 1;
      if (this.state === STATES.EXPLORING) {
        this.updateLook(delta);
        this.camera.rotation.set(this.pitch, this.yaw, 0, "YXZ");
        this.updateMovement(delta);
      }
      this.regionWorld.updateVisibility(this.camera, delta);
      this.regionWorld.updateAmbient(delta);
      this.renderer.render(this.scene, this.camera);
      if (this.state === STATES.EXPLORING) {
        this.hudClock += delta;
        if (this.hudClock >= 0.10) {
          this.hudClock = 0;
          this.updateHUD();
        }
      }
      this.adaptResolution();
      this.frame = requestAnimationFrame(this.tick);
    }

    updateMovement(delta) {
      const axes = this.input.movementAxes();
      const ground = this.regionWorld.heightAt(this.camera.position.x, this.camera.position.z);
      this.lastGround = ground;
      const clearance = Math.max(0, this.camera.position.y - ground);
      const baseSpeed = clearance < 0.35 ? 0.16 : clearance < 2 ? lerp(0.16, 1.2, (clearance - 0.35) / 1.65) : clearance < 8 ? lerp(1.2, 3.8, (clearance - 2) / 6) : 5.8;
      const boost = this.input.boost() ? 2.7 : 1;
      const precision = this.input.precision() ? 0.30 : 1;
      const targetSpeed = baseSpeed * boost * precision;
      let forward = axes.forward, strafe = axes.strafe;
      const mag = Math.hypot(forward, strafe);
      if (mag > 1) { forward /= mag; strafe /= mag; }
      this.camera.getWorldDirection(this.moveForward);
      this.moveForward.y = 0;
      this.moveForward.normalize();
      this.moveRight.crossVectors(this.moveForward, this.camera.up).normalize();
      this.moveIntent.set(0, 0, 0).addScaledVector(this.moveForward, forward).addScaledVector(this.moveRight, strafe);
      if (this.moveIntent.lengthSq() > 1) this.moveIntent.normalize();

      const currentRadius = Math.hypot(this.camera.position.x, this.camera.position.z);
      const boundaryT = smoothstep((currentRadius - this.region.softBoundaryStart) / Math.max(1, this.region.playRadius - this.region.softBoundaryStart));
      const radialX = currentRadius > 0.001 ? this.camera.position.x / currentRadius : 0;
      const radialZ = currentRadius > 0.001 ? this.camera.position.z / currentRadius : 0;
      const outward = Math.max(0, this.moveIntent.x * radialX + this.moveIntent.z * radialZ);
      const boundaryScale = 1 - boundaryT * outward * 0.93;
      const targetX = this.moveIntent.x * targetSpeed * boundaryScale;
      const targetZ = this.moveIntent.z * targetSpeed * boundaryScale;
      const verticalSpeed = Math.max(0.24, Math.min(5.4, targetSpeed * 0.62));
      const rawY = axes.vertical * verticalSpeed;
      const headroom = Math.max(0, MAX_ALTITUDE_KM - clearance);
      const targetY = rawY > 0 ? rawY * smoothstep(headroom / 1.4) : rawY;
      const moving = mag > 0 || axes.vertical !== 0;
      const response = 1 - Math.exp(-delta * (moving ? 11.5 : 15.5));
      this.velocity.x += (targetX - this.velocity.x) * response;
      this.velocity.z += (targetZ - this.velocity.z) * response;
      this.velocity.y += (targetY - this.velocity.y) * response;

      let nextX = this.camera.position.x + this.velocity.x * delta;
      let nextZ = this.camera.position.z + this.velocity.z * delta;
      const nextRadius = Math.hypot(nextX, nextZ);
      if (nextRadius > this.region.playRadius) {
        const scale = this.region.playRadius / nextRadius;
        nextX *= scale; nextZ *= scale;
        const radialV = this.velocity.x * (nextX / this.region.playRadius) + this.velocity.z * (nextZ / this.region.playRadius);
        if (radialV > 0) { this.velocity.x *= 0.22; this.velocity.z *= 0.22; }
      }
      this.camera.position.x = nextX;
      this.camera.position.z = nextZ;
      this.camera.position.y += this.velocity.y * delta;
      const newGround = this.regionWorld.heightAt(nextX, nextZ);
      this.lastGround = newGround;
      const minimumY = newGround + MIN_CLEARANCE_KM;
      if (this.camera.position.y < minimumY) {
        const correction = 1 - Math.exp(-delta * 17);
        this.camera.position.y = lerp(this.camera.position.y, minimumY + 0.025, correction);
        if (this.camera.position.y < minimumY) this.camera.position.y = minimumY;
        if (this.velocity.y < 0) this.velocity.y *= 0.12;
      }
      const maximumY = newGround + MAX_ALTITUDE_KM;
      if (this.camera.position.y > maximumY) { this.camera.position.y = maximumY; if (this.velocity.y > 0) this.velocity.y = 0; }
      this.speed = Math.hypot(this.velocity.x, this.velocity.y, this.velocity.z);
      const finalRadius = Math.hypot(nextX, nextZ);
      const boundaryVisible = finalRadius > this.region.softBoundaryStart - 4;
      this.boundaryHint.classList.toggle("is-visible", boundaryVisible);
      if (boundaryVisible) this.boundaryHint.textContent = finalRadius > this.region.playRadius - 1 ? "BATAS GERAK · TERRAIN VISUAL BERLANJUT" : "MENDEKATI BATAS GERAK";
    }

    updateHUD() {
      if (!this.regionWorld || !this.camera) return;
      const ground = this.regionWorld.heightAt(this.camera.position.x, this.camera.position.z);
      const altitude = Math.max(0, this.camera.position.y - ground);
      this.cameraAltitude = altitude;
      const geo = this.regionWorld.geoFromWorld(this.camera.position.x, this.camera.position.z);
      this.hudCoordinates.textContent = formatCoordinate(geo.latitude, geo.longitudeEast);
      this.hudAltitude.textContent = formatAltitude(altitude);
      this.hudAltitudeLimit.hidden = altitude < MAX_ALTITUDE_KM - 1.0;
      this.hudAltitudeLimit.textContent = altitude >= MAX_ALTITUDE_KM - 0.08 ? "BATAS KETINGGIAN" : "MENDEKATI BATAS";
      this.hudSpeed.textContent = formatSpeed(this.speed);
      this.hudLocation.textContent = this.region.name;
      const feature = this.region.featureCenter || { x: 0, z: 0 };
      const featureDistance = Math.hypot(this.camera.position.x - feature.x, this.camera.position.z - feature.z);
      this.hudDistance.textContent = `${featureDistance.toFixed(featureDistance < 10 ? 1 : 0)} KM`;
      this.hudRegionType.textContent = this.region.category;
      {
        const topo = this.regionWorld?.topography?.sourceLabel || "MAGELLAN GTDR";
        this.hudData.textContent = this.regionWorld?.radar?.texture ? `${topo} + SAR` : `${topo} · SAR TIDAK TERMUAT`;
      }
    }

    updateRegionUI() {
      const region = this.region;
      this.hudLocation.textContent = region.name;
      this.hudCoordinates.textContent = formatCoordinate(region.latitude, region.longitudeEast);
      this.hudDistance.textContent = "--";
      this.hudRegionType.textContent = region.category;
      {
        const topo = this.regionWorld?.topography?.sourceLabel || "MAGELLAN GTDR";
        this.hudData.textContent = this.regionWorld?.radar?.texture ? `${topo} + SAR` : `${topo} · SAR TIDAK TERMUAT`;
      }
      this.infoName.textContent = region.name;
      this.infoType.textContent = `${region.category} · ${region.descriptor}`;
      this.infoCoords.textContent = formatCoordinate(region.latitude, region.longitudeEast);
      this.infoImage.src = region.image;
      this.infoImage.alt = `Referensi Magellan NASA/JPL untuk ${region.name}`;
      this.infoMedia.setAttribute("aria-label", `Perbesar citra referensi Magellan untuk ${region.name}`);
      this.infoDescription.textContent = region.description;
      this.infoFacts.replaceChildren(...region.facts.map(fact => { const li = document.createElement("li"); li.textContent = fact; return li; }));
      this.infoBadge.textContent = `${this.regionWorld?.topography?.sourceLabel || "MAGELLAN GTDR"} · ${region.category} · VISUAL WORLD BERLANJUT`;
      this.infoVisualizationNote.hidden = !region.visualizationNote;
      this.infoVisualizationNote.textContent = region.visualizationNote || "";
      this.infoSource.href = region.source;
      this.infoSource.textContent = "Referensi morfologi: NASA/JPL ↗";
      this.infoCoordinateSource.href = region.coordinateSource;
    }

    showRegionInfo(focus = false) {
      this.infoCard.classList.add("is-visible");
      this.infoCard.setAttribute("aria-hidden", "false");
      this.infoToggle.hidden = true;
      if (focus) requestAnimationFrame(() => this.infoMinimize.focus({ preventScroll: true }));
    }

    hideRegionInfo() {
      this.infoCard.classList.remove("is-visible");
      this.infoCard.setAttribute("aria-hidden", "true");
      this.infoToggle.hidden = false;
      this.infoToggle.focus({ preventScroll: true });
    }

    openReferenceImage() {
      const media = window.ExplorationMedia;
      if (!media || !this.region?.image) return;
      if (document.pointerLockElement === this.viewport) document.exitPointerLock?.();
      const image = {
        src: this.region.image,
        alt: `Referensi Magellan NASA/JPL untuk ${this.region.name}`,
        credit: "NASA/JPL · Magellan",
        source: this.region.source,
        caption: `${this.region.name} · referensi morfologi untuk membandingkan citra Magellan dengan rekonstruksi ANTARA`,
        type: "CITRA WAHANA"
      };
      media.openLightbox([image], 0, { title: `${this.region.name} · Referensi Magellan` }, this.infoMedia);
    }

    showTutorial() {
      let seen = false;
      try { seen = sessionStorage.getItem("antara-venus-full-tutorial-v2") === "1"; } catch {}
      if (seen) return;
      this.tutorial.classList.add("is-visible");
      window.clearTimeout(this.tutorialTimeout);
      this.tutorialTimeout = window.setTimeout(() => this.dismissTutorial(), 9000);
    }

    dismissTutorial(persist = false) {
      this.tutorial.classList.remove("is-visible");
      window.clearTimeout(this.tutorialTimeout);
      if (persist) { try { sessionStorage.setItem("antara-venus-full-tutorial-v2", "1"); } catch {} }
    }

    adaptResolution() {
      if (this.statsClock < 2.5 || !this.renderer) return;
      const fps = this.statsFrames / this.statsClock;
      this.statsFrames = 0;
      this.statsClock = 0;
      this.idealDpr = this.calculateIdealDpr();
      if (fps < 38) { this.lowFpsWindows += 1; this.highFpsWindows = 0; }
      else if (fps > 56) { this.highFpsWindows += 1; this.lowFpsWindows = Math.max(0, this.lowFpsWindows - 1); }
      else { this.lowFpsWindows = Math.max(0, this.lowFpsWindows - 1); this.highFpsWindows = 0; }
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

    animateExitAltitude(targetAltitude, duration, token) {
      if (!this.regionWorld || !this.camera) return Promise.resolve();
      const groundNow = this.regionWorld.heightAt(this.camera.position.x, this.camera.position.z);
      const startAltitude = Math.max(0, this.camera.position.y - groundNow);
      const start = performance.now();
      return new Promise(resolve => {
        const frame = now => {
          if (token !== this.transitionToken) return resolve();
          const raw = clamp((now - start) / (this.venus.motion.matches ? 120 : duration), 0, 1);
          const eased = smootherstep(raw);
          const ground = this.regionWorld.heightAt(this.camera.position.x, this.camera.position.z);
          this.lastGround = ground;
          this.cameraAltitude = lerp(startAltitude, targetAltitude, eased);
          this.camera.position.y = ground + this.cameraAltitude;
          if (raw < 1) requestAnimationFrame(frame);
          else resolve();
        };
        requestAnimationFrame(frame);
      });
    }

    async exit() {
      if (!this.active || this.state === STATES.EXITING) return;
      if (this.state === STATES.SELECTING && !this.regionWorld) {
        this.finishExitToOrbit();
        return;
      }
      if (this.state === STATES.ERROR || this.state === STATES.PREPARING || this.state === STATES.SWITCHING) {
        this.failBackToOrbit();
        return;
      }

      this.state = STATES.EXITING;
      const token = ++this.transitionToken;
      // Mirror Mars exit behavior: freeze input, but keep the render loop alive so
      // atmosphere, visibility and camera motion continue to render smoothly.
      this.input.clear();
      this.selector.hidden = true;
      this.tutorial.classList.remove("is-visible");
      this.infoCard.classList.remove("is-visible");
      this.infoCard.setAttribute("aria-hidden", "true");
      this.infoToggle.hidden = true;
      this.boundaryHint.classList.remove("is-visible");
      this.root.classList.add("is-exiting");
      document.getElementById("announcement").textContent = "Meninggalkan permukaan Venus dan kembali ke panorama orbit.";
      this.startLoop();

      if (this.regionWorld && this.camera) {
        try {
          const ground = this.regionWorld.heightAt(this.camera.position.x, this.camera.position.z);
          const currentAltitude = Math.max(0, this.camera.position.y - ground);
          await this.animateExitAltitude(Math.max(currentAltitude, 52), 1650, token);
        } catch {}
      }
      if (token !== this.transitionToken) return;

      const reduced = this.venus.motion.matches;
      const duration = reduced ? 260 : 3200;
      const start = performance.now();
      await new Promise(resolve => {
        const frame = now => {
          if (token !== this.transitionToken) return resolve();
          const raw = clamp((now - start) / duration, 0, 1);
          const eased = smootherstep(raw);
          this.root.style.setProperty("--surface-opacity", String(1 - smoothstep(raw / 0.62)));
          this.root.style.setProperty("--entry-progress", String(1 - eased));
          this.venus.setFullExplorationTransition?.(1 - eased, this.region);
          if (raw < 1) requestAnimationFrame(frame);
          else resolve();
        };
        requestAnimationFrame(frame);
      });
      if (token !== this.transitionToken) return;
      this.finishExitToOrbit();
    }

    finishExitToOrbit() {
      this.transitionToken += 1;
      if (document.fullscreenElement === this.root) document.exitFullscreen().catch(() => {});
      this.stopLoop();
      this.input.unbind();
      this.disposeRegion();
      this.disposeRenderer();
      this.venus.endFullExploration?.();
      this.venus.setFullExplorationTransition?.(0, this.region);
      this.venus.caption.inert = false;
      this.state = STATES.IDLE;
      this.selectorOpenedFromRegion = false;
      this.root.className = "mars-full-exploration venus-full-exploration";
      this.root.hidden = true;
      this.root.inert = true;
      this.root.setAttribute("aria-hidden", "true");
      this.root.style.removeProperty("--surface-opacity");
      this.root.style.removeProperty("--entry-progress");
      this.selector.hidden = false;
      this.loading.hidden = true;
      this.errorPanel.hidden = true;
      this.entryButton.disabled = false;
      document.getElementById("mission").classList.remove("is-venus-full", "is-venus-full-selecting");
      document.getElementById("announcement").textContent = "Kembali ke panorama Venus.";
      this.entryButton.focus({ preventScroll: true });
    }

    showError(error) {
      console.warn("Venus Full Exploration:", error);
      this.stopLoop();
      this.input.unbind();
      this.state = STATES.ERROR;
      this.loading.hidden = true;
      this.errorPanel.hidden = false;
      this.errorMessage.textContent = error?.message || "Region Venus tidak dapat dibangun.";
      this.root.classList.add("is-error");
      this.entryButton.disabled = false;
      document.getElementById("announcement").textContent = "Eksplorasi penuh Venus gagal dimuat. Panorama Venus tetap aman.";
    }

    failBackToOrbit() {
      this.transitionToken += 1;
      this.finishExitToOrbit();
    }

    onVenusStop() {
      this.transitionToken += 1;
      this.stopLoop();
      this.input.unbind();
      this.disposeRegion();
      this.disposeRenderer();
      this.state = STATES.IDLE;
      this.root.hidden = true;
      this.root.inert = true;
      this.root.setAttribute("aria-hidden", "true");
      this.root.className = "mars-full-exploration venus-full-exploration";
      this.entryButton.disabled = false;
      document.getElementById("mission").classList.remove("is-venus-full", "is-venus-full-selecting");
      if (document.fullscreenElement === this.root) document.exitFullscreen().catch(() => {});
    }

    disposeRegion() {
      this.regionWorld?.dispose();
      this.regionWorld = null;
      this.infoCard.classList.remove("is-visible");
      this.infoCard.setAttribute("aria-hidden", "true");
      this.infoToggle.hidden = true;
      this.boundaryHint.classList.remove("is-visible");
    }

    disposeRenderer() {
      this.resourceGeneration += 1;
      if (this.renderer) {
        this.renderer.dispose();
        this.renderer.domElement?.remove();
      }
      this.renderer = null;
      this.scene = null;
      this.camera = null;
      this.hemiLight = null;
      this.sunLight = null;
      this.fillLight = null;
    }

    setLoading(progress, status) {
      this.loading.hidden = false;
      this.loadingProgress.style.transform = `scaleX(${clamp(progress, 0, 1)})`;
      this.loadingStatus.textContent = status;
    }

    mobileFov() { return window.innerWidth <= 760 ? 70 : 66; }

    async toggleFullscreen() {
      if (!document.fullscreenElement) {
        try { await this.root.requestFullscreen(); } catch {}
      } else if (document.fullscreenElement === this.root) {
        try { await document.exitFullscreen(); } catch {}
      }
      this.updateFullscreenLabel();
    }

    updateFullscreenLabel() {
      const active = document.fullscreenElement === this.root;
      this.fullscreenButton.setAttribute("aria-pressed", String(active));
      this.fullscreenButton.querySelector("span").textContent = active ? "Keluar layar penuh" : "Layar penuh";
      this.resize();
    }

    resize(recalculateDpr = true) {
      if (!this.renderer || !this.camera) return;
      const width = Math.max(1, this.viewport.clientWidth || window.innerWidth);
      const height = Math.max(1, this.viewport.clientHeight || window.innerHeight);
      if (recalculateDpr) {
        this.idealDpr = this.calculateIdealDpr();
        if (!Number.isFinite(this.currentDpr)) this.currentDpr = this.idealDpr;
        this.currentDpr = Math.min(this.currentDpr, this.idealDpr);
        this.renderer.setPixelRatio(this.currentDpr);
      }
      this.renderer.setSize(width, height, false);
      this.camera.aspect = width / height;
      this.camera.fov = this.mobileFov();
      this.camera.updateProjectionMatrix();
    }
  };
})();
