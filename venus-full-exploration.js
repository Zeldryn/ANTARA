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
 * The rejected planet-wide Venus terrain/streaming implementation is not used.
 * Exactly one bounded curated Venus region exists in memory at a time.
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
      playRadius: 72,
      softBoundaryStart: 58,
      source: "https://science.nasa.gov/photojournal/venus-3-d-perspective-view-of-maat-mons-2/",
      coordinateSource: "https://planetarynames.wr.usgs.gov/Feature/3550",
      image: "https://assets.science.nasa.gov/dynamicimage/assets/science/psd/photojournal/pia/pia00/pia00254/PIA00254.jpg?crop=faces%2Cfocalpoint&fit=clip&h=1100&w=1400",
      descriptor: "Gunung api perisai besar dengan lereng panjang, dataran retak, dan aliran lava yang memanjang ratusan kilometer.",
      description: "Region ini menyusun komposisi seperti perspektif Magellan: dataran vulkanik berfraktur di depan, transisi aliran di tengah, dan tubuh Maat Mons yang dominan naik di kejauhan.",
      facts: [
        "NASA/JPL menggambarkan Maat Mons sebagai gunung api sekitar 8 km di atas radius rata-rata Venus.",
        "Perspektif Magellan memperlihatkan aliran lava memanjang ratusan kilometer melintasi dataran retak menuju kaki gunung.",
        "Model ANTARA memprioritaskan edifice yang lebar dan lereng gradual, bukan pola radial berbentuk bintang."
      ],
      palette: { low: 0x5b3428, mid: 0x7b4935, high: 0x9a6245, accent: 0x3d211c, rock: 0x6b3f32 },
      fog: 0x7f4c38,
      fogDensity: 0.0105,
      sky: 0x8b563e,
      sun: 0xffd2a0,
      hemi: 0xf0b97f
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
      playRadius: 68,
      softBoundaryStart: 54,
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
      palette: { low: 0x49332d, mid: 0x665047, high: 0x92776a, accent: 0x2d2221, rock: 0x55413b },
      fog: 0x675046,
      fogDensity: 0.0092,
      sky: 0x766053,
      sun: 0xffd8ac,
      hemi: 0xd7b08d
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
      playRadius: 72,
      softBoundaryStart: 58,
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
      palette: { low: 0x493028, mid: 0x714f3d, high: 0x9a7256, accent: 0x33221d, rock: 0x68483c },
      fog: 0x78513f,
      fogDensity: 0.0100,
      sky: 0x845a44,
      sun: 0xffd0a2,
      hemi: 0xe0ad82
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
      playRadius: 70,
      softBoundaryStart: 56,
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
      palette: { low: 0x4a342c, mid: 0x6b5145, high: 0x8c7160, accent: 0x382823, rock: 0x5b463d },
      fog: 0x705447,
      fogDensity: 0.0095,
      sky: 0x7c6252,
      sun: 0xffd5ab,
      hemi: 0xd6af8b
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
      playRadius: 68,
      softBoundaryStart: 54,
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
      palette: { low: 0x4a3026, mid: 0x76503a, high: 0xa07858, accent: 0x39231d, rock: 0x654636 },
      fog: 0x77503c,
      fogDensity: 0.0107,
      sky: 0x825940,
      sun: 0xffd19a,
      hemi: 0xe3ad79
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
  const gaussian = (x, z, cx, cz, sx, sz) => Math.exp(-(((x - cx) / sx) ** 2 + ((z - cz) / sz) ** 2));
  const ridgeWave = (value, power = 6) => Math.pow(Math.abs(Math.sin(value)), power);
  const hash2 = (x, z, seed = 0) => {
    const v = Math.sin(x * 127.1 + z * 311.7 + seed * 74.7) * 43758.5453123;
    return v - Math.floor(v);
  };
  const valueNoise = (x, z, seed = 0) => {
    const x0 = Math.floor(x), z0 = Math.floor(z);
    const fx = smoothstep(x - x0), fz = smoothstep(z - z0);
    const a = hash2(x0, z0, seed), b = hash2(x0 + 1, z0, seed);
    const c = hash2(x0, z0 + 1, seed), d = hash2(x0 + 1, z0 + 1, seed);
    return lerp(lerp(a, b, fx), lerp(c, d, fx), fz) * 2 - 1;
  };
  const fbm = (x, z, seed = 0, octaves = 3) => {
    let amp = 0.5, freq = 1, sum = 0, norm = 0;
    for (let i = 0; i < octaves; i += 1) {
      sum += valueNoise(x * freq, z * freq, seed + i * 19) * amp;
      norm += amp;
      amp *= 0.5;
      freq *= 2.03;
    }
    return norm ? sum / norm : 0;
  };

  function maatHeight(x, z) {
    const mountain = 7.85 * gaussian(x, z, 0, -25, 29, 25);
    const shoulder = 1.38 * gaussian(x, z, -10, -16, 45, 34);
    const summit = -0.42 * gaussian(x, z, 0, -25, 5.2, 4.5);
    // Broad flow aprons cross the foreground plains without producing a radial starburst.
    const flowA = 0.24 * gaussian(x, z, -13, 8, 9, 47) * (0.55 + 0.45 * ridgeWave(x * 0.22 + z * 0.035, 10));
    const flowB = 0.20 * gaussian(x, z, 14, 4, 11, 45) * (0.58 + 0.42 * ridgeWave(x * 0.18 - z * 0.042 + 0.8, 11));
    const flowC = 0.13 * gaussian(x, z, 1, 23, 34, 19) * ridgeWave(x * 0.105 + z * 0.03 + 0.4 * Math.sin(z * 0.035), 12);
    const fractureA = ridgeWave((x * 0.24 + z * 0.08) + 0.55 * Math.sin(z * 0.045), 10) * 0.16;
    const fractureB = ridgeWave((x * -0.12 + z * 0.27) + 0.4 * Math.sin(x * 0.05), 12) * 0.11;
    const plain = 0.14 * fbm(x * 0.055, z * 0.055, 11, 3);
    return mountain + shoulder + summit + flowA + flowB + flowC + fractureA + fractureB + plain;
  }

  function maxwellHeight(x, z) {
    const envelope = gaussian(x, z, 4, -16, 32, 54);
    const massif = 7.7 * envelope + 1.6 * gaussian(x, z, 15, -29, 18, 29);
    const ridgeA = ridgeWave(x * 0.34 + z * 0.055 + 0.5 * Math.sin(z * 0.052), 7) * envelope * 2.2;
    const ridgeB = ridgeWave(x * 0.20 - z * 0.075, 9) * envelope * 0.85;
    const valleys = -0.8 * ridgeWave(x * 0.16 + z * 0.065 + 1.1, 11) * envelope;
    const lakshmi = -1.25 * smoothstep((x + 22) / 18) * gaussian(x, z, -29, 0, 36, 60);
    const micro = 0.18 * fbm(x * 0.065, z * 0.065, 23, 3);
    return Math.max(-1.4, massif + ridgeA + ridgeB + valleys + lakshmi + micro);
  }

  function aphroditeHeight(x, z) {
    const upland = 3.35 * gaussian(x, z, 0, -10, 57, 43) + 0.9 * gaussian(x, z, -18, -18, 31, 25);
    const neSw = ridgeWave((x + z * 0.72) * 0.235, 8) * gaussian(x, z, 0, -8, 64, 48) * 0.82;
    const nwSe = ridgeWave((x - z * 0.88) * 0.31 + 0.6, 12) * gaussian(x, z, 6, -11, 58, 44) * 0.45;
    const rift = -1.25 * Math.exp(-(((x - z * 0.34 - 7) / 5.5) ** 2)) * gaussian(x, z, 0, -5, 70, 55);
    const valley = -0.66 * Math.exp(-(((x + z * 0.55 + 15) / 7.5) ** 2)) * gaussian(x, z, -8, -4, 66, 52);
    const blocks = 0.24 * fbm(x * 0.07, z * 0.07, 37, 3);
    return upland + neSw + nwSe + rift + valley + blocks;
  }

  function ishtarHeight(x, z) {
    // Ishtar is a broad regional highland, not a single flat mesa. Several overlapping
    // uplifts create an irregular plateau while mountain belts define its margins.
    const plateau = 2.45 * gaussian(x, z, -5, -2, 62, 47)
      + 0.82 * gaussian(x, z, -24, 4, 42, 35)
      + 0.54 * gaussian(x, z, 19, -11, 38, 33);
    const easternMargin = gaussian(x, z, 39, -10, 18, 48);
    const westernMargin = gaussian(x, z, -43, -4, 17, 44);
    const northernMargin = gaussian(x, z, -4, -39, 48, 15);
    const mountainEast = easternMargin * (3.55 + ridgeWave(x * 0.36 + z * 0.05 + 0.35 * Math.sin(z * 0.04), 7) * 2.0);
    const mountainWest = westernMargin * (1.95 + ridgeWave(x * 0.28 - z * 0.045, 8) * 1.15);
    const mountainNorth = northernMargin * (1.25 + ridgeWave(x * 0.22 + z * 0.04, 9) * 0.85);
    const interiorLava = 0.11 * ridgeWave(x * 0.075 + z * 0.038 + 0.3 * Math.sin(x * 0.03), 14) * gaussian(x, z, -4, 0, 47, 36);
    const southernLowland = -0.52 * gaussian(x, z, 5, 55, 72, 28);
    const micro = 0.09 * fbm(x * 0.06, z * 0.06, 41, 3);
    return plateau + mountainEast + mountainWest + mountainNorth + interiorLava + southernLowland + micro;
  }

  function alphaHeight(x, z) {
    const upland = 1.9 * gaussian(x, z, 0, -6, 54, 45) + 0.45 * gaussian(x, z, -17, -18, 32, 29);
    const ridgeA = ridgeWave((x + z * 0.55) * 0.36 + 0.25 * Math.sin(z * 0.08), 8) * 0.88;
    const ridgeB = ridgeWave((-x * 0.52 + z) * 0.33 + 0.35 * Math.sin(x * 0.065), 8) * 0.78;
    const ridgeC = ridgeWave((x * 0.18 - z * 0.28) + 1.2, 12) * 0.25;
    const faultA = -0.78 * Math.exp(-(((x - z * 0.42 - 8) / 2.9) ** 2));
    const faultB = -0.58 * Math.exp(-(((x + z * 0.58 + 13) / 3.3) ** 2));
    const lavaLowA = -0.85 * gaussian(x, z, 24, 13, 11, 8);
    const lavaLowB = -0.64 * gaussian(x, z, -27, -4, 10, 12);
    const blocks = 0.20 * fbm(x * 0.085, z * 0.085, 59, 3);
    const envelope = gaussian(x, z, 0, -5, 62, 54);
    return upland + (ridgeA + ridgeB + ridgeC) * envelope + faultA * envelope + faultB * envelope + lavaLowA + lavaLowB + blocks;
  }

  const HEIGHT_FUNCTIONS = Object.freeze({
    maat: maatHeight,
    maxwell: maxwellHeight,
    aphrodite: aphroditeHeight,
    ishtar: ishtarHeight,
    alpha: alphaHeight
  });

  function regionHeight(region, x, z) {
    return HEIGHT_FUNCTIONS[region.id](x, z);
  }

  function surfaceClass(region, x, z, height, slope) {
    if (region.id === "maat") {
      const r = Math.hypot(x, z + 25);
      const flowA = gaussian(x, z, -13, 8, 9, 47);
      const flowB = gaussian(x, z, 14, 4, 11, 45);
      if (r < 9) return "summit";
      if (z > -19 && Math.max(flowA, flowB) > 0.55) return "lava";
      if (slope > 0.32) return "rugged";
      return "plain";
    }
    if (region.id === "maxwell") {
      if (height > 7.0 || slope > 0.55) return "rugged";
      if (x < -20) return "plain";
      return "highland";
    }
    if (region.id === "aphrodite") {
      const rift = Math.abs(x - z * 0.34 - 7);
      if (rift < 6) return "fracture";
      if (height > 3.3) return "highland";
      if (height < 1.0) return "lava";
      return "rugged";
    }
    if (region.id === "ishtar") {
      const interior = gaussian(x, z, -5, -2, 55, 42);
      if (interior > 0.56 && slope < 0.22) return "plain";
      if (Math.abs(x) > 30 || z < -31 || slope > 0.46) return "rugged";
      return "highland";
    }
    if (region.id === "alpha") {
      if (height < 0.85) return "lava";
      if (slope > 0.36) return "tessera";
      return "fracture";
    }
    return "plain";
  }

  class VenusRegionWorld {
    constructor(THREE, scene, renderer, region, quality) {
      this.THREE = THREE;
      this.scene = scene;
      this.renderer = renderer;
      this.region = region;
      this.quality = quality;
      this.group = new THREE.Group();
      this.group.name = `venus-region-${region.id}`;
      this.scene.add(this.group);
      this.tiles = [];
      this.horizon = null;
      this.accentMesh = null;
      this.material = null;
      this.horizonMaterial = null;
      this.accentMaterial = null;
      this.textures = [];
      this.frustum = new THREE.Frustum();
      this.projection = new THREE.Matrix4();
      this.cameraDirection = new THREE.Vector3();
      this.tileVector = new THREE.Vector3();
      this.visibilityClock = 0;
      this.visibilityStats = { visible: 0, buffered: 0, culled: 0, total: 0 };
    }

    async build(onProgress = () => {}) {
      this.material = this.createMaterial();
      this.horizonMaterial = this.material.clone();
      this.horizonMaterial.map = null;
      this.horizonMaterial.normalMap = null;
      this.horizonMaterial.roughnessMap = null;
      this.horizonMaterial.vertexColors = true;
      this.horizonMaterial.roughness = 0.97;
      this.horizonMaterial.needsUpdate = true;

      const tileSize = this.quality.tileSize;
      const halfTiles = 3;
      const specs = [];
      for (let iz = -halfTiles; iz <= halfTiles; iz += 1) {
        for (let ix = -halfTiles; ix <= halfTiles; ix += 1) {
          const cx = ix * tileSize;
          const cz = iz * tileSize;
          const distance = Math.hypot(cx, cz);
          if (distance > this.region.playRadius + tileSize * 0.78) continue;
          const segments = distance <= tileSize * 1.15 ? this.quality.nearSegments
            : distance <= tileSize * 2.25 ? this.quality.midSegments
              : this.quality.farSegments;
          specs.push({ ix, iz, cx, cz, distance, segments });
        }
      }
      specs.sort((a, b) => a.distance - b.distance);

      for (let i = 0; i < specs.length; i += 1) {
        const spec = specs[i];
        const mesh = this.createTile(spec.cx, spec.cz, tileSize, spec.segments);
        this.group.add(mesh);
        this.tiles.push({ mesh, cx: spec.cx, cz: spec.cz, distance: spec.distance, radius: tileSize * 0.74 });
        onProgress((i + 1) / (specs.length + 3) * 0.78);
        if (i % 2 === 1) await new Promise(resolve => requestAnimationFrame(() => resolve()));
      }

      this.horizon = this.createHorizon();
      this.group.add(this.horizon);
      onProgress(0.86);
      await new Promise(resolve => requestAnimationFrame(() => resolve()));
      this.accentMesh = this.createSurfaceAccents();
      if (this.accentMesh) this.group.add(this.accentMesh);
      onProgress(0.96);
      await new Promise(resolve => requestAnimationFrame(() => resolve()));
      this.group.updateMatrixWorld(true);
      this.visibilityStats.total = this.tiles.length;
      onProgress(1);
    }

    heightAt(x, z) {
      return regionHeight(this.region, x, z);
    }

    normalAt(x, z, epsilon = 0.18) {
      const T = this.THREE;
      const hL = this.heightAt(x - epsilon, z);
      const hR = this.heightAt(x + epsilon, z);
      const hD = this.heightAt(x, z - epsilon);
      const hU = this.heightAt(x, z + epsilon);
      return new T.Vector3(hL - hR, epsilon * 2, hD - hU).normalize();
    }

    colorFor(x, z, height, slope, target = null) {
      const T = this.THREE;
      const p = this.region.palette;
      const cls = surfaceClass(this.region, x, z, height, slope);
      let hex = p.mid;
      if (cls === "plain") hex = p.low;
      else if (cls === "lava") hex = p.accent;
      else if (cls === "rugged" || cls === "tessera") hex = p.high;
      else if (cls === "fracture") hex = p.rock;
      else if (cls === "highland" || cls === "summit") hex = p.high;
      const color = target || new T.Color();
      color.setHex(hex);
      const variation = 0.90 + 0.10 * valueNoise(x * 0.12, z * 0.12, this.region.id.length * 13);
      color.multiplyScalar(variation);
      return color;
    }

    createTile(centerX, centerZ, size, segments) {
      const T = this.THREE;
      const row = segments + 1;
      const count = row * row;
      const positions = new Float32Array(count * 3);
      const normals = new Float32Array(count * 3);
      const colors = new Float32Array(count * 3);
      const uvs = new Float32Array(count * 2);
      const indexCount = segments * segments * 6;
      const IndexArray = count > 65535 ? Uint32Array : Uint16Array;
      const indices = new IndexArray(indexCount);
      const half = size / 2;
      const step = size / segments;

      /*
       * Terrain is static after a destination is loaded. Build one expanded
       * height grid and derive both vertices and normals from it. This keeps
       * the expensive morphology functions out of the animation loop and
       * avoids four extra height-function evaluations for every vertex.
       */
      const sampleRow = segments + 3;
      const heightGrid = new Float32Array(sampleRow * sampleRow);
      for (let gz = -1; gz <= segments + 1; gz += 1) {
        const worldZ = centerZ - half + gz * step;
        const gridZ = gz + 1;
        for (let gx = -1; gx <= segments + 1; gx += 1) {
          const worldX = centerX - half + gx * step;
          heightGrid[gridZ * sampleRow + gx + 1] = this.heightAt(worldX, worldZ);
        }
      }
      const sampleHeight = (gx, gz) => heightGrid[(gz + 1) * sampleRow + gx + 1];

      let p = 0, n = 0, c = 0, u = 0;
      const normal = new T.Vector3();
      const color = new T.Color();
      for (let iz = 0; iz <= segments; iz += 1) {
        const vz = iz / segments;
        const localZ = lerp(-half, half, vz);
        const worldZ = centerZ + localZ;
        for (let ix = 0; ix <= segments; ix += 1) {
          const vx = ix / segments;
          const localX = lerp(-half, half, vx);
          const worldX = centerX + localX;
          const height = sampleHeight(ix, iz);
          const hL = sampleHeight(ix - 1, iz);
          const hR = sampleHeight(ix + 1, iz);
          const hD = sampleHeight(ix, iz - 1);
          const hU = sampleHeight(ix, iz + 1);
          normal.set(hL - hR, step * 2, hD - hU).normalize();
          const slope = 1 - Math.max(0, normal.y);
          this.colorFor(worldX, worldZ, height, slope, color);
          positions[p++] = localX; positions[p++] = height; positions[p++] = localZ;
          normals[n++] = normal.x; normals[n++] = normal.y; normals[n++] = normal.z;
          colors[c++] = color.r; colors[c++] = color.g; colors[c++] = color.b;
          uvs[u++] = worldX / 7; uvs[u++] = worldZ / 7;
        }
      }

      let q = 0;
      for (let iz = 0; iz < segments; iz += 1) {
        for (let ix = 0; ix < segments; ix += 1) {
          const a = iz * row + ix;
          const b = a + 1;
          const d = (iz + 1) * row + ix;
          const e = d + 1;
          indices[q++] = a; indices[q++] = d; indices[q++] = b;
          indices[q++] = b; indices[q++] = d; indices[q++] = e;
        }
      }

      const geometry = new T.BufferGeometry();
      geometry.setAttribute("position", new T.BufferAttribute(positions, 3));
      geometry.setAttribute("normal", new T.BufferAttribute(normals, 3));
      geometry.setAttribute("color", new T.BufferAttribute(colors, 3));
      geometry.setAttribute("uv", new T.BufferAttribute(uvs, 2));
      geometry.setIndex(new T.BufferAttribute(indices, 1));
      geometry.computeBoundingSphere();
      const mesh = new T.Mesh(geometry, this.material);
      mesh.position.set(centerX, 0, centerZ);
      mesh.frustumCulled = true;
      mesh.matrixAutoUpdate = false;
      mesh.updateMatrix();
      return mesh;
    }

    createHorizon() {
      const T = this.THREE;
      const radial = 8;
      const angular = this.quality.horizonSegments;
      const inner = this.region.playRadius * 0.76;
      const outer = 190;
      const vertices = [];
      const normals = [];
      const colors = [];
      const indices = [];
      for (let r = 0; r <= radial; r += 1) {
        const rt = r / radial;
        const radius = lerp(inner, outer, rt);
        for (let a = 0; a <= angular; a += 1) {
          const angle = a / angular * Math.PI * 2;
          const x = Math.cos(angle) * radius;
          const z = Math.sin(angle) * radius;
          const sourceX = x * Math.min(1, this.region.playRadius / Math.max(radius, 0.001));
          const sourceZ = z * Math.min(1, this.region.playRadius / Math.max(radius, 0.001));
          const base = this.heightAt(sourceX, sourceZ);
          const y = lerp(base, base * 0.28 - 0.8, smoothstep(rt));
          const color = this.colorFor(sourceX, sourceZ, base, 0.08).multiplyScalar(lerp(0.78, 0.46, rt));
          vertices.push(x, y, z);
          normals.push(0, 1, 0);
          colors.push(color.r, color.g, color.b);
        }
      }
      const row = angular + 1;
      for (let r = 0; r < radial; r += 1) {
        for (let a = 0; a < angular; a += 1) {
          const i = r * row + a;
          indices.push(i, i + row, i + 1, i + 1, i + row, i + row + 1);
        }
      }
      const geometry = new T.BufferGeometry();
      geometry.setAttribute("position", new T.Float32BufferAttribute(vertices, 3));
      geometry.setAttribute("normal", new T.Float32BufferAttribute(normals, 3));
      geometry.setAttribute("color", new T.Float32BufferAttribute(colors, 3));
      geometry.setIndex(indices);
      geometry.computeBoundingSphere();
      const mesh = new T.Mesh(geometry, this.horizonMaterial);
      mesh.frustumCulled = false;
      mesh.renderOrder = -1;
      return mesh;
    }

    createSurfaceAccents() {
      const T = this.THREE;
      const count = this.quality.accentCount;
      if (!count) return null;
      const geometry = new T.BoxGeometry(1.0, 0.12, 0.66, 1, 1, 1);
      this.accentMaterial = new T.MeshStandardMaterial({ color: this.region.palette.rock, roughness: 0.98, metalness: 0 });
      const mesh = new T.InstancedMesh(geometry, this.accentMaterial, count);
      mesh.frustumCulled = true;
      const dummy = new T.Object3D();
      let placed = 0;
      for (let i = 0; i < count * 4 && placed < count; i += 1) {
        const radius = 8 + hash2(i, 9, this.region.id.length) * (this.region.softBoundaryStart - 12);
        const angle = hash2(i, 21, this.region.id.charCodeAt(0)) * Math.PI * 2;
        const x = Math.cos(angle) * radius;
        const z = Math.sin(angle) * radius;
        const y = this.heightAt(x, z);
        const normal = this.normalAt(x, z, 0.35);
        const slope = 1 - normal.y;
        if (slope > 0.63 && this.region.id !== "maxwell" && this.region.id !== "alpha") continue;
        const scale = 0.35 + hash2(i, 31, 7) * 1.1;
        dummy.position.set(x, y + 0.04, z);
        dummy.rotation.set((hash2(i, 41, 3) - 0.5) * 0.18, angle + hash2(i, 52, 5), (hash2(i, 61, 11) - 0.5) * 0.22);
        dummy.scale.set(scale * (0.75 + hash2(i, 73, 2)), scale * 0.35, scale);
        dummy.updateMatrix();
        mesh.setMatrixAt(placed, dummy.matrix);
        placed += 1;
      }
      mesh.count = placed;
      mesh.instanceMatrix.needsUpdate = true;
      return mesh;
    }

    createMaterial() {
      const T = this.THREE;
      const size = 192;
      const detail = new Float32Array(size * size);
      const seed = this.region.id.split("").reduce((sum, char) => sum + char.charCodeAt(0), 0);
      for (let y = 0; y < size; y += 1) {
        for (let x = 0; x < size; x += 1) {
          const u = x / size, v = y / size;
          const n = 0.55 * valueNoise(u * 22, v * 22, seed) + 0.30 * valueNoise(u * 54, v * 54, seed + 17) + 0.15 * valueNoise(u * 112, v * 112, seed + 31);
          detail[y * size + x] = n;
        }
      }
      const albedoCanvas = document.createElement("canvas");
      const roughCanvas = document.createElement("canvas");
      const normalCanvas = document.createElement("canvas");
      albedoCanvas.width = roughCanvas.width = normalCanvas.width = size;
      albedoCanvas.height = roughCanvas.height = normalCanvas.height = size;
      const albedoCtx = albedoCanvas.getContext("2d");
      const roughCtx = roughCanvas.getContext("2d");
      const normalCtx = normalCanvas.getContext("2d");
      const albedoImage = albedoCtx.createImageData(size, size);
      const roughImage = roughCtx.createImageData(size, size);
      const normalImage = normalCtx.createImageData(size, size);
      const sample = (x, y) => detail[((y + size) % size) * size + ((x + size) % size)];
      for (let y = 0; y < size; y += 1) {
        for (let x = 0; x < size; x += 1) {
          const i = y * size + x;
          const p = i * 4;
          const n = detail[i];
          const shade = Math.round(clamp(196 + n * 34, 138, 238));
          albedoImage.data[p] = shade;
          albedoImage.data[p + 1] = shade;
          albedoImage.data[p + 2] = shade;
          albedoImage.data[p + 3] = 255;
          const rough = Math.round(clamp(224 - n * 20, 180, 248));
          roughImage.data[p] = rough; roughImage.data[p + 1] = rough; roughImage.data[p + 2] = rough; roughImage.data[p + 3] = 255;
          const dx = sample(x + 1, y) - sample(x - 1, y);
          const dy = sample(x, y + 1) - sample(x, y - 1);
          const nx = -dx * 1.6, ny = -dy * 1.6, nz = 1;
          const inv = 1 / Math.hypot(nx, ny, nz);
          normalImage.data[p] = Math.round((nx * inv * 0.5 + 0.5) * 255);
          normalImage.data[p + 1] = Math.round((ny * inv * 0.5 + 0.5) * 255);
          normalImage.data[p + 2] = Math.round((nz * inv * 0.5 + 0.5) * 255);
          normalImage.data[p + 3] = 255;
        }
      }
      albedoCtx.putImageData(albedoImage, 0, 0);
      roughCtx.putImageData(roughImage, 0, 0);
      normalCtx.putImageData(normalImage, 0, 0);
      const makeTexture = canvas => {
        const texture = new T.CanvasTexture(canvas);
        texture.wrapS = texture.wrapT = T.RepeatWrapping;
        texture.repeat.set(8, 8);
        texture.anisotropy = Math.min(this.quality.anisotropy, this.renderer.capabilities.getMaxAnisotropy());
        texture.needsUpdate = true;
        this.textures.push(texture);
        return texture;
      };
      const map = makeTexture(albedoCanvas);
      map.colorSpace = T.SRGBColorSpace;
      const roughnessMap = makeTexture(roughCanvas);
      const normalMap = makeTexture(normalCanvas);
      return new T.MeshStandardMaterial({
        color: 0xffffff,
        vertexColors: true,
        map,
        roughnessMap,
        normalMap,
        normalScale: new T.Vector2(0.30, 0.30),
        roughness: 0.91,
        metalness: 0,
        fog: true
      });
    }

    updateVisibility(camera, delta) {
      this.visibilityClock += delta;
      if (this.visibilityClock < 0.075) return;
      this.visibilityClock = 0;
      camera.updateMatrixWorld();
      this.projection.multiplyMatrices(camera.projectionMatrix, camera.matrixWorldInverse);
      this.frustum.setFromProjectionMatrix(this.projection);
      camera.getWorldDirection(this.cameraDirection).normalize();
      let visible = 0, buffered = 0, culled = 0;
      for (const entry of this.tiles) {
        const mesh = entry.mesh;
        const sphere = mesh.geometry.boundingSphere;
        if (!sphere) { mesh.visible = true; visible += 1; continue; }
        const center = this.tileVector.set(entry.cx, 0, entry.cz);
        const dx = entry.cx - camera.position.x;
        const dz = entry.cz - camera.position.z;
        const distance = Math.hypot(dx, dz);
        const inv = distance > 0.001 ? 1 / distance : 0;
        const facing = (dx * this.cameraDirection.x + dz * this.cameraDirection.z) * inv;
        const inFrustum = this.frustum.intersectsObject(mesh);
        const safety = !inFrustum && distance < 34 && facing > -0.55;
        const keep = inFrustum || safety || distance < 22;
        mesh.visible = keep;
        if (inFrustum || distance < 22) visible += 1;
        else if (safety) buffered += 1;
        else culled += 1;
      }
      this.visibilityStats = { visible, buffered, culled, total: this.tiles.length };
    }

    geoFromWorld(x, z) {
      const latitude = this.region.latitude - z / KM_PER_DEG_LAT;
      const cos = Math.max(0.16, Math.cos(this.region.latitude * DEG));
      const longitudeEast = this.region.longitudeEast + x / (KM_PER_DEG_LAT * cos);
      return { latitude, longitudeEast };
    }

    dispose() {
      this.scene.remove(this.group);
      for (const entry of this.tiles) entry.mesh.geometry.dispose();
      this.tiles.length = 0;
      this.horizon?.geometry?.dispose();
      this.accentMesh?.geometry?.dispose();
      this.material?.dispose();
      this.horizonMaterial?.dispose();
      this.accentMaterial?.dispose();
      for (const texture of this.textures) texture.dispose();
      this.textures.length = 0;
      this.group.clear();
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
      this.infoName = document.getElementById("venus-landmark-name");
      this.infoType = document.getElementById("venus-landmark-type");
      this.infoCoords = document.getElementById("venus-landmark-coords");
      this.infoImage = document.getElementById("venus-landmark-image");
      this.infoDescription = document.getElementById("venus-landmark-description");
      this.infoFacts = document.getElementById("venus-landmark-facts");
      this.infoBadge = document.getElementById("venus-landmark-data-badge");
      this.infoSource = document.getElementById("venus-landmark-source");
      this.infoCoordinateSource = document.getElementById("venus-landmark-coordinate-source");
      this.hudCoordinates = document.getElementById("venus-hud-coordinates");
      this.hudAltitude = document.getElementById("venus-hud-altitude");
      this.hudAltitudeLimit = document.getElementById("venus-hud-altitude-limit");
      this.hudSpeed = document.getElementById("venus-hud-speed");
      this.hudLocation = document.getElementById("venus-hud-location");
      this.hudQuality = document.getElementById("venus-hud-quality");
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
      this.infoTimeout = null;
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
        return { name: "LOW", tileSize: 24, nearSegments: 30, midSegments: 20, farSegments: 12, horizonSegments: 64, maxDpr: 1.4, minDpr: 0.90, supersample: 1, pixelBudget: 2900000, anisotropy: 4, accentCount: 32 };
      }
      if (cores >= 8 && memory >= 6) {
        return { name: "HIGH", tileSize: 24, nearSegments: 60, midSegments: 38, farSegments: 22, horizonSegments: 112, maxDpr: 2.1, minDpr: 1.0, supersample: 1.35, pixelBudget: 9000000, anisotropy: 12, accentCount: 88 };
      }
      return { name: "MEDIUM", tileSize: 24, nearSegments: 44, midSegments: 28, farSegments: 16, horizonSegments: 88, maxDpr: 1.75, minDpr: 0.95, supersample: 1.15, pixelBudget: 5600000, anisotropy: 8, accentCount: 56 };
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
        this.setLoading(0.10, `MEMBANGUN ${region.category}`);
        this.regionWorld = new VenusRegionWorld(this.THREE, this.scene, this.renderer, region, this.quality);
        await this.regionWorld.build(progress => this.setLoading(0.10 + progress * 0.76, `MEMBANGUN REGION · ${Math.round(progress * 100)}%`));
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
        this.camera = new T.PerspectiveCamera(this.mobileFov(), 1, 0.03, 380);
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
      this.hemiLight.color.set(region.hemi);
      this.hemiLight.groundColor.set(0x2b1917);
      this.hemiLight.intensity = 1.02;
      this.sunLight.color.set(region.sun);
      this.sunLight.intensity = 2.35;
      this.fillLight.intensity = 0.24;
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
      this.renderer.render(this.scene, this.camera);
      if (this.state === STATES.EXPLORING) this.updateHUD();
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
      if (boundaryVisible) this.boundaryHint.textContent = finalRadius > this.region.playRadius - 1 ? "BATAS EKSPLORASI · REGION TERKURASI" : "MENDEKATI BATAS EKSPLORASI";
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
      this.hudQuality.textContent = this.quality.name;
      this.hudData.textContent = "NASA/JPL MAGELLAN · CURATED REGION";
    }

    updateRegionUI() {
      const region = this.region;
      this.hudLocation.textContent = region.name;
      this.hudCoordinates.textContent = formatCoordinate(region.latitude, region.longitudeEast);
      this.hudQuality.textContent = this.quality.name;
      this.hudData.textContent = "NASA/JPL MAGELLAN · CURATED REGION";
      this.infoName.textContent = region.name;
      this.infoType.textContent = `${region.category} · ${region.descriptor}`;
      this.infoCoords.textContent = formatCoordinate(region.latitude, region.longitudeEast);
      this.infoImage.src = region.image;
      this.infoImage.alt = `Referensi Magellan NASA/JPL untuk ${region.name}`;
      this.infoDescription.textContent = region.description;
      this.infoFacts.replaceChildren(...region.facts.map(fact => { const li = document.createElement("li"); li.textContent = fact; return li; }));
      this.infoBadge.textContent = `REFERENCE-DRIVEN MORPHOLOGY · ${region.category} · STATIC BOUNDED REGION`;
      this.infoSource.href = region.source;
      this.infoSource.textContent = "Referensi morfologi: NASA/JPL ↗";
      this.infoCoordinateSource.href = region.coordinateSource;
    }

    showRegionInfo() {
      window.clearTimeout(this.infoTimeout);
      this.infoCard.classList.add("is-visible");
      this.infoTimeout = window.setTimeout(() => this.infoCard.classList.remove("is-visible"), 11000);
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
      this.stopLoop();
      this.input.unbind();
      this.selector.hidden = true;
      this.tutorial.classList.remove("is-visible");
      this.infoCard.classList.remove("is-visible");
      this.boundaryHint.classList.remove("is-visible");
      this.root.classList.add("is-exiting");
      document.getElementById("announcement").textContent = "Meninggalkan permukaan Venus dan kembali ke panorama orbit.";
      if (this.regionWorld && this.camera) {
        const startY = this.camera.position.y;
        const ground = this.regionWorld.heightAt(this.camera.position.x, this.camera.position.z);
        const targetY = ground + 15;
        const start = performance.now();
        const duration = this.venus.motion.matches ? 120 : 900;
        await new Promise(resolve => {
          const frame = now => {
            if (token !== this.transitionToken) return resolve();
            const t = smootherstep(clamp((now - start) / duration, 0, 1));
            this.camera.position.y = lerp(startY, targetY, t);
            this.renderer.render(this.scene, this.camera);
            if (t < 1) requestAnimationFrame(frame); else resolve();
          };
          requestAnimationFrame(frame);
        });
      }
      if (token !== this.transitionToken) return;
      const duration = this.venus.motion.matches ? 180 : 2100;
      const start = performance.now();
      await new Promise(resolve => {
        const frame = now => {
          if (token !== this.transitionToken) return resolve();
          const raw = clamp((now - start) / duration, 0, 1);
          const eased = smootherstep(raw);
          this.root.style.setProperty("--surface-opacity", String(1 - smoothstep(raw / 0.68)));
          this.venus.setFullExplorationTransition?.(1 - eased, this.region);
          if (raw < 1) requestAnimationFrame(frame); else resolve();
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
