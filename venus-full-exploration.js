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
  const gaussian = (x, z, cx, cz, sx, sz) => Math.exp(-(((x - cx) / sx) ** 2 + ((z - cz) / sz) ** 2));
  const rotatedGaussian = (x, z, cx, cz, sx, sz, angle = 0) => {
    const dx = x - cx, dz = z - cz;
    const ca = Math.cos(angle), sa = Math.sin(angle);
    const rx = dx * ca + dz * sa;
    const rz = -dx * sa + dz * ca;
    return Math.exp(-((rx / sx) ** 2 + (rz / sz) ** 2));
  };
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

  const smoothBand = (value, inner, outer) => 1 - smoothstep((Math.abs(value) - inner) / Math.max(0.0001, outer - inner));

  function maatFlowFields(x, z) {
    // PIA00254 foreground: broad, irregular cooled-flow fields with lighter
    // channels between them. The masks deliberately avoid bilateral symmetry.
    const travel = clamp((z + 24) / 72, 0, 1);
    const envelope = smoothstep((z + 27) / 11) * (1 - smoothstep((z - 51) / 12));
    const ribbon = (distance, width) => Math.exp(-Math.pow(distance / Math.max(0.1, width), 4));
    const bendA = -11.0 - travel * 8.0 + Math.sin((z + 17) * 0.050) * 4.0 + Math.sin(z * 0.019) * 2.0;
    const bendB = 12.0 + travel * 7.0 + Math.sin((z + 3) * 0.047 + 1.4) * 4.2 + Math.sin(z * 0.021) * 1.5;
    const feederA = ribbon(x - bendA, 4.8 + travel * 7.5);
    const feederB = ribbon(x - bendB, 4.4 + travel * 7.0);
    const west = Math.max(
      rotatedGaussian(x, z, -22, 14, 22, 24, -0.13),
      rotatedGaussian(x, z, -33, 37, 27, 18, 0.18),
      rotatedGaussian(x, z, -12, 35, 17, 20, -0.05)
    );
    const east = Math.max(
      rotatedGaussian(x, z, 20, 11, 18, 24, 0.13),
      rotatedGaussian(x, z, 34, 39, 22, 18, -0.12),
      rotatedGaussian(x, z, 13, 34, 15, 21, 0.07)
    );
    const localPatch = Math.max(
      rotatedGaussian(x, z, -5, 8, 12, 8, 0.22),
      rotatedGaussian(x, z, 8, 23, 10, 12, -0.18)
    );
    const regionalWarp = 0.88 + 0.12 * valueNoise(x * 0.035, z * 0.035, 101);
    const radial = Math.hypot((x + 0.8) / 34.5, (z + 26) / 29.5);
    const apronMask = smoothstep((radial - 0.60) / 0.38);
    const broad = Math.max(west * 0.94, east * 0.90, feederA * 0.56, feederB * 0.58, localPatch * 0.42) * envelope * regionalWarp * apronMask;
    const channelPath = 1.5 + Math.sin((z + 8) * 0.044) * 3.4 + Math.sin(z * 0.016 + 0.7) * 1.4;
    const centralLight = ribbon(x - channelPath, 3.8 + travel * 2.4) * envelope * apronMask;
    const sideChannel = ribbon(x + 11 - Math.sin(z * 0.041) * 2.5, 2.8 + travel * 1.7) * envelope * apronMask * 0.55;
    const combined = clamp(broad * (1 - centralLight * 0.74) * (1 - sideChannel * 0.42), 0, 1);
    const edge = clamp(4.2 * combined * (1 - combined), 0, 1);
    const internalLineation = Math.max(
      ridgeWave(x * 0.107 + z * 0.045 + 0.46 * Math.sin(z * 0.031) + valueNoise(x * 0.025, z * 0.025, 133) * 0.6, 13),
      ridgeWave(-x * 0.068 + z * 0.096 + 0.34 * Math.sin(x * 0.028) + valueNoise(x * 0.021, z * 0.021, 139) * 0.5, 14)
    ) * combined;
    return { combined, edge, internalLineation, travel, centralLight, sideChannel };
  }

  function maatHeight(x, z) {
    // Broad shield-volcano morphology derived from PIA00254. The edifice is
    // intentionally wider than it is steep; small lineation rides on top of the
    // macro shape instead of defining it.
    const dx = x + 0.8;
    const dz = z + 26;
    const radial = Math.hypot(dx / 34.5, dz / 29.5);
    const angular = Math.atan2(dz, dx);
    const radialWarp = radial * (1 + 0.045 * Math.sin(angular * 3 + 0.3) + 0.025 * Math.sin(angular * 5 - 0.9));
    const broadBase = 5.35 * Math.exp(-1.08 * Math.pow(radialWarp, 2.35));
    const upperEdifice = 0.92 * Math.exp(-3.00 * Math.pow(radialWarp, 3.10));
    const asymmetricShoulder = 0.66 * rotatedGaussian(x, z, -11, -18, 38, 29, 0.10)
      + 0.30 * rotatedGaussian(x, z, 15, -18, 31, 27, -0.10);

    const summitBench = 0.86 * rotatedGaussian(x, z, -1.0, -25.5, 11.8, 9.0, 0.13)
      + 0.20 * rotatedGaussian(x, z, -4.2, -24.5, 5.5, 4.5, -0.08)
      + 0.16 * rotatedGaussian(x, z, 4.0, -26.0, 5.0, 4.0, 0.12);
    const ventPrimary = -0.43 * rotatedGaussian(x, z, 1.4, -26.0, 4.0, 2.9, 0.28);
    const ventSecondary = -0.15 * rotatedGaussian(x, z, -2.3, -23.8, 2.6, 1.9, -0.30);
    const brokenRim = 0.11 * rotatedGaussian(x, z, 0.2, -25.4, 6.0, 4.6, 0.18)
      * (0.54 + 0.46 * ridgeWave(x * 0.54 + z * 0.21 + 0.30 * Math.sin(z * 0.22), 8));

    // PIA00254 contains layered foreground and midground volcanic relief. Keep
    // this subordinate so it supports, rather than hides, the main edifice.
    const foregroundShelf = 0.58 * rotatedGaussian(x, z, -9.0, -5.0, 12.5, 8.5, -0.08)
      + 0.22 * rotatedGaussian(x, z, -12.0, -2.0, 6.5, 4.8, 0.10);

    const flows = maatFlowFields(x, z);
    const flowRelief = flows.combined * (0.065 + 0.032 * valueNoise(x * 0.075, z * 0.075, 113));
    const flowLevees = flows.edge * 0.045;

    // Low-relief lineation is confined to the slopes and plains. It is subtle
    // enough to read as surface flow / fracture language rather than starburst ridges.
    const edificeEnvelope = clamp(1 - radial / 1.15, 0, 1);
    const slopeLineA = ridgeWave((x * 0.105 + z * 0.040 + 0.30 * Math.sin(z * 0.034)), 13);
    const slopeLineB = ridgeWave((-x * 0.072 + z * 0.092 + 0.22 * Math.sin(x * 0.030)), 14);
    const slopeLineation = (slopeLineA * 0.55 + slopeLineB * 0.45) * edificeEnvelope * smoothstep((radial - 0.20) / 0.60) * 0.060;
    const flowGrooves = flows.internalLineation * 0.028;
    const plainFracture = Math.max(
      ridgeWave(x * 0.145 + z * 0.050 + 0.20 * Math.sin(z * 0.035), 14),
      ridgeWave(-x * 0.092 + z * 0.165 + 0.16 * Math.sin(x * 0.035), 15)
    ) * (1 - edificeEnvelope) * 0.035;
    const plainUndulation = 0.075 * fbm(x * 0.043, z * 0.043, 11, 3);

    return broadBase + upperEdifice + asymmetricShoulder + summitBench + ventPrimary + ventSecondary
      + brokenRim + foregroundShelf + flowRelief + flowLevees + slopeLineation + flowGrooves + plainFracture + plainUndulation;
  }

  function maxwellStructure(x, z) {
    const warp = valueNoise(x * 0.024, z * 0.024, 23) * 4.4;
    const massif = rotatedGaussian(x, z, 8, -18, 31, 55, -0.06);
    // Lakshmi is a broad smooth plain west of Maxwell, not an oval depression.
    const westFade = smoothstep((-x + z * 0.11 - 1 + valueNoise(x * 0.018, z * 0.018, 151) * 6.5) / 31);
    const northSouth = smoothstep((z + 61) / 14) * (1 - smoothstep((z - 55) / 14));
    const lakshmi = clamp(westFade * northSouth * (1 - massif * 0.72), 0, 1);
    const ridgeA = ridgeWave((x + warp + 1.2 * Math.sin(z * 0.055)) * 0.315 + z * 0.048, 8) * massif;
    const ridgeB = ridgeWave((x - warp * 0.58 + 1.0 * Math.sin(z * 0.043 + 0.8)) * 0.205 - z * 0.061 + 0.7, 10) * massif;
    const ridgeFine = ridgeWave((x + warp * 0.35 + 1.1 * Math.sin(z * 0.067)) * 0.49 + z * 0.027 + 1.2, 14) * massif;
    const craterX = 17.5, craterZ = -25.0;
    const craterR = Math.hypot(x - craterX, z - craterZ);
    const cleopatraBowl = Math.exp(-Math.pow(craterR / 5.1, 2));
    const cleopatraOuter = Math.exp(-Math.pow((craterR - 7.0) / 1.55, 2));
    const cleopatraInner = Math.exp(-Math.pow((craterR - 3.3) / 0.95, 2));
    const channelCenter = z + 22 + 0.22 * (x - craterX) + 1.2 * Math.sin((x - craterX) * 0.11);
    const channel = Math.exp(-Math.pow(channelCenter / 2.5, 2)) * smoothstep((x - 15) / 22) * gaussian(x, z, 27, -18, 29, 25);
    return { warp, massif, lakshmi, ridgeA, ridgeB, ridgeFine, cleopatraBowl, cleopatraOuter, cleopatraInner, channel };
  }

  function maxwellHeight(x, z) {
    const s = maxwellStructure(x, z);
    const broadMassif = 7.10 * s.massif + 1.45 * rotatedGaussian(x, z, 17, -32, 18, 30, 0.08);
    const ridges = s.ridgeA * 1.30 + s.ridgeB * 0.62 + s.ridgeFine * 0.24;
    const valleys = -0.58 * ridgeWave(x * 0.145 + z * 0.060 + 0.9 + s.warp * 0.023, 10) * s.massif;
    const westTransition = -1.05 * s.lakshmi;
    const cleopatra = -1.18 * s.cleopatraBowl + 0.42 * s.cleopatraOuter + 0.22 * s.cleopatraInner - 0.28 * s.channel;
    const micro = 0.085 * fbm(x * 0.057, z * 0.057, 23, 3);
    return Math.max(-1.5, broadMassif + ridges + valleys + westTransition + cleopatra + micro);
  }

  function aphroditeStructure(x, z) {
    const envelope = gaussian(x, z, 0, -9, 64, 50);
    const warp = valueNoise(x * 0.027, z * 0.027, 37) * 5.2;
    const fabricNE = ridgeWave((x + z * 0.72 + warp + 1.8 * Math.sin(z * 0.050)) * 0.225, 10) * envelope;
    const fabricNW = ridgeWave((x - z * 0.90 - warp * 0.55 + 1.4 * Math.sin(x * 0.047)) * 0.292 + 0.6, 13) * envelope;
    const fineNE = ridgeWave((x + z * 0.69 + warp * 0.55 + 1.2 * Math.sin(z * 0.073)) * 0.41 + 0.9, 16) * envelope;
    // A broad meandering lava-filled valley dominates the reference, with a less
    // prominent secondary branch. Curvature removes the artificial V shape.
    const mainCenter = x - z * 0.29 - 5.5 + 6.0 * Math.sin((z + 10) * 0.030) + warp * 0.12;
    const mainValley = Math.exp(-Math.pow(mainCenter / 7.2, 2)) * gaussian(x, z, 2, -4, 72, 56);
    const branchCenter = x + z * 0.16 + 26 + 3.5 * Math.sin((z - 4) * 0.040) + warp * 0.08;
    const branchValley = Math.exp(-Math.pow(branchCenter / 5.3, 2)) * gaussian(x, z, -14, -1, 58, 46);
    const broadValley = Math.exp(-Math.pow((x + z * 0.50 + 16 + 2.0 * Math.sin(z * 0.035)) / 9.5, 2)) * gaussian(x, z, -8, -4, 64, 50);
    const blockMask = smoothstep((fbm(x * 0.045, z * 0.045, 57, 2) + 0.62) / 1.18) * envelope;
    return { envelope, warp, fabricNE, fabricNW, fineNE, mainValley, branchValley, broadValley, blockMask };
  }

  function aphroditeHeight(x, z) {
    const s = aphroditeStructure(x, z);
    const upland = 2.85 * gaussian(x, z, 0, -10, 58, 44) + 0.72 * gaussian(x, z, -20, -18, 32, 26);
    const fabrics = s.fabricNE * 0.76 + s.fabricNW * 0.43 + s.fineNE * 0.18;
    const blockRelief = s.blockMask * 0.28;
    const valleys = -0.68 * s.mainValley - 0.18 * s.branchValley - 0.15 * s.broadValley;
    const fractureGrooves = -0.10 * ridgeWave((x - z * 0.90 - s.warp * 0.55) * 0.305 + 0.6, 18) * s.envelope;
    const micro = 0.080 * fbm(x * 0.060, z * 0.060, 37, 3);
    return upland + fabrics + blockRelief + valleys + fractureGrooves + micro;
  }

  function ishtarPlateauMask(x, z) {
    const core = gaussian(x, z, -7, 2, 58, 42);
    const west = gaussian(x, z, -28, 5, 38, 31);
    const east = gaussian(x, z, 18, -7, 39, 31);
    const north = gaussian(x, z, -8, -23, 47, 29);
    const south = gaussian(x, z, 0, 22, 44, 30);
    const southeastNotch = gaussian(x, z, 39, 24, 24, 19);
    const boundaryWarp = valueNoise(x * 0.024, z * 0.024, 97) * 0.11 + valueNoise(x * 0.052, z * 0.052, 109) * 0.035;
    const field = core * 0.62 + west * 0.28 + east * 0.23 + north * 0.21 + south * 0.13 - southeastNotch * 0.12 + boundaryWarp;
    return smoothstep((clamp(field, 0, 1) - 0.27) / 0.58);
  }

  function ishtarStructure(x, z) {
    const plateau = ishtarPlateauMask(x, z);
    // Three principal boundary massifs echo the PIA00093 composition: Akna/Freyja
    // on the west/northwest and Maxwell on the east.
    const maxwell = rotatedGaussian(x, z, 27, -10, 13, 31, -0.05);
    const akna = rotatedGaussian(x, z, -30, -2, 13, 29, 0.08);
    const freyja = rotatedGaussian(x, z, -10, -29, 28, 10, 0.04);
    const eastHills = gaussian(x, z, 47, -2, 24, 44);
    const warp = valueNoise(x * 0.031, z * 0.031, 41) * 3.0;
    return { plateau, maxwell, akna, freyja, eastHills, warp };
  }

  function ishtarHeight(x, z) {
    const s = ishtarStructure(x, z);
    const plateauRelief = 3.05 * s.plateau + 0.24 * gaussian(x, z, -18, 6, 34, 28);
    const maxwell = s.maxwell * (4.55 + ridgeWave((x + s.warp) * 0.36 + z * 0.045, 8) * 1.65);
    const akna = s.akna * (2.05 + ridgeWave((x - s.warp) * 0.29 - z * 0.040, 9) * 0.92);
    const freyja = s.freyja * (1.72 + ridgeWave(x * 0.22 + z * 0.045 + s.warp * 0.022, 9) * 0.72);
    const easternHills = s.eastHills * (0.62 + ridgeWave(x * 0.16 - z * 0.08, 11) * 0.32);
    const interiorLineation = ridgeWave(x * 0.072 + z * 0.032 + 0.22 * Math.sin(x * 0.027), 15) * s.plateau * 0.052;
    const marginFractures = ridgeWave(x * 0.11 + z * 0.21 + s.warp * 0.02, 13) * (s.maxwell + s.akna + s.freyja) * 0.11;
    const southernLowland = -0.62 * gaussian(x, z, 6, 55, 72, 28);
    const micro = 0.050 * fbm(x * 0.052, z * 0.052, 41, 3);
    return plateauRelief + maxwell + akna + freyja + easternHills + interiorLineation + marginFractures + southernLowland + micro;
  }

  function alphaStructure(x, z) {
    const warpA = valueNoise(x * 0.028, z * 0.028, 59) * 8.2;
    const warpB = valueNoise(x * 0.023 + 11, z * 0.023 - 7, 71) * 7.0;
    const core = gaussian(x, z, 2, -8, 43, 36);
    const west = gaussian(x, z, -27, -5, 25, 33);
    const north = gaussian(x, z, 7, -29, 34, 21);
    const east = gaussian(x, z, 31, -3, 23, 30);
    const south = gaussian(x, z, 0, 20, 29, 18);
    const regionalNoise = valueNoise(x * 0.024, z * 0.024, 83) * 0.11;
    const tesseraMask = smoothstep((clamp(core * 0.68 + west * 0.29 + north * 0.21 + east * 0.19 + south * 0.10 + regionalNoise, 0, 1) - 0.27) / 0.50);
    const localWarpA = warpA + 2.8 * Math.sin(z * 0.072) + 1.4 * Math.sin((x + z) * 0.038);
    const localWarpB = warpB + 2.4 * Math.sin(x * 0.067) - 1.6 * Math.sin((x - z) * 0.035);
    const blockMod = 0.68 + 0.32 * smoothstep((fbm(x * 0.050, z * 0.050, 89, 2) + 0.70) / 1.25);
    const packetA = 0.46 + 0.54 * smoothstep((valueNoise(x * 0.034, z * 0.034, 157) + 0.62) / 1.20);
    const packetB = 0.44 + 0.56 * smoothstep((valueNoise(x * 0.031 + 8, z * 0.031 - 5, 173) + 0.60) / 1.18);
    const ridgeA = ridgeWave((x + z * 0.55 + localWarpA) * 0.285, 10) * tesseraMask * blockMod * packetA;
    const ridgeB = ridgeWave((-x * 0.52 + z + localWarpB) * 0.278, 10) * tesseraMask * (1.08 - blockMod * 0.20) * packetB;
    const ridgeFine = ridgeWave((x * 0.18 - z * 0.28 + localWarpA * 0.22 + 1.2) * 0.95, 14) * tesseraMask * (0.62 + packetA * 0.38);
    const faultA = Math.exp(-Math.pow((x - z * 0.42 - 8 - localWarpB * 0.10) / 3.4, 2)) * tesseraMask;
    const faultB = Math.exp(-Math.pow((x + z * 0.58 + 13 + localWarpA * 0.08) / 3.8, 2)) * tesseraMask;
    const faultC = Math.exp(-Math.pow((x - z * 0.08 + 24 + 1.5 * Math.sin(z * 0.05)) / 2.9, 2)) * tesseraMask;
    const lowA = gaussian(x, z, 24, 13, 11, 8);
    const lowB = gaussian(x, z, -27, -4, 10, 12);
    const lowC = gaussian(x, z, 5, 24, 12, 9);
    const boundary = clamp(4 * tesseraMask * (1 - tesseraMask), 0, 1);
    return { warpA, warpB, tesseraMask, ridgeA, ridgeB, ridgeFine, faultA, faultB, faultC, lowA, lowB, lowC, boundary };
  }

  function alphaHeight(x, z) {
    const s = alphaStructure(x, z);
    const upland = 1.70 * s.tesseraMask + 0.34 * gaussian(x, z, -17, -18, 30, 27);
    const ridges = s.ridgeA * 0.56 + s.ridgeB * 0.50 + s.ridgeFine * 0.13;
    const scarps = s.boundary * 0.30;
    const faults = -(s.faultA * 0.48 + s.faultB * 0.38 + s.faultC * 0.20);
    const lavaLows = -(s.lowA * 0.84 + s.lowB * 0.64 + s.lowC * 0.42);
    const outsidePlain = 0.045 * fbm(x * 0.040, z * 0.040, 91, 2) * (1 - s.tesseraMask);
    const micro = 0.070 * fbm(x * 0.070, z * 0.070, 59, 3) * (0.35 + s.tesseraMask * 0.65);
    return upland + ridges + scarps + faults + lavaLows + outsidePlain + micro;
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
      const r = Math.hypot((x + 0.8) / 34.5, (z + 26) / 29.5);
      const flows = maatFlowFields(x, z);
      if (r < 0.25) return "summit";
      if (flows.combined > 0.55 && z > -22) return "lava"; // cooled flow unit
      if (r < 1.02 && (height > 1.8 || slope > 0.27)) return "rugged";
      if (flows.internalLineation > 0.48 || slope > 0.32) return "fracture";
      return "plain";
    }
    if (region.id === "maxwell") {
      const s = maxwellStructure(x, z);
      if (s.cleopatraBowl > 0.42) return "fracture";
      if (s.lakshmi > 0.52 && height < 1.9 && slope < 0.20) return "plain";
      if (height > 7.1 || slope > 0.46 || s.ridgeFine > 0.56) return "rugged";
      return "highland";
    }
    if (region.id === "aphrodite") {
      const s = aphroditeStructure(x, z);
      if (s.mainValley > 0.58 && s.envelope > 0.34) return "lava";
      if (height > 3.0 || Math.max(s.fabricNE, s.fabricNW) > 0.70) return "highland";
      if (s.fabricNW > 0.54 || slope > 0.28) return "fracture";
      return "rugged";
    }
    if (region.id === "ishtar") {
      const s = ishtarStructure(x, z);
      if (s.plateau > 0.58 && slope < 0.18 && Math.max(s.maxwell, s.akna, s.freyja) < 0.32) return "plain";
      if (Math.max(s.maxwell, s.akna, s.freyja) > 0.28 || slope > 0.38) return "rugged";
      return "highland";
    }
    if (region.id === "alpha") {
      const s = alphaStructure(x, z);
      if (Math.max(s.lowA, s.lowB, s.lowC) > 0.52 && height < 1.10) return "lava";
      if (s.tesseraMask > 0.46 && (Math.max(s.ridgeA, s.ridgeB) > 0.30 || height > 1.55)) return "tessera";
      if (s.tesseraMask > 0.22) return "fracture";
      return "plain";
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
      this.regionalVisualization = null;
      this.atmosphericMotes = null;
      this.ambientClock = 0;
      this.material = null;
      this.horizonMaterial = null;
      this.accentResources = [];
      this.textures = [];
      this.frustum = new THREE.Frustum();
      this.projection = new THREE.Matrix4();
      this.cameraDirection = new THREE.Vector3();
      this.tileVector = new THREE.Vector3();
      this.thermalColor = new THREE.Color();
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
      this.regionalVisualization = this.createRegionalVisualization();
      if (this.regionalVisualization) this.group.add(this.regionalVisualization);
      this.atmosphericMotes = this.createAtmosphericMotes();
      if (this.atmosphericMotes) this.group.add(this.atmosphericMotes);
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
      const color = target || new T.Color();
      const low = new T.Color(p.low);
      const mid = new T.Color(p.mid);
      const high = new T.Color(p.high);
      const accent = new T.Color(p.accent);
      const rock = new T.Color(p.rock);

      // Macro/mid tonal distribution comes from the same region structures that
      // shape the terrain. Noise is deliberately limited to subtle micro breakup.
      if (this.region.id === "maat") {
        const flows = maatFlowFields(x, z);
        const radial = Math.hypot((x + 0.8) / 34.5, (z + 26) / 29.5);
        const mountainMask = clamp(1 - radial / 1.20, 0, 1);
        const ventHeat = rotatedGaussian(x, z, 1.4, -26.0, 5.2, 3.7, 0.24);
        const flankLine = Math.max(
          ridgeWave(x * 0.105 + z * 0.040 + 0.30 * Math.sin(z * 0.034), 13),
          ridgeWave(-x * 0.072 + z * 0.092 + 0.22 * Math.sin(x * 0.030), 14)
        ) * mountainMask;

        // PIA00254: golden/yellow-orange edifice and plains, coherent burnt-brown
        // foreground flow fields, thin lighter channels and restrained hot vent.
        color.copy(mid).lerp(high, clamp(mountainMask * 0.76 + Math.max(0, height - 3.8) * 0.035, 0, 0.90));
        if (flows.combined > 0.10) {
          color.lerp(accent, clamp(0.20 + flows.combined * 0.60, 0, 0.76));
          color.lerp(mid, clamp(flows.internalLineation * 0.20, 0, 0.20));
        }
        if (flows.centralLight > 0.24) color.lerp(high, flows.centralLight * 0.18);
        if (cls === "fracture") color.lerp(rock, 0.30 + clamp(flows.internalLineation, 0, 1) * 0.20);
        if (cls === "rugged") color.lerp(high, 0.16 + flankLine * 0.11);
        if (cls === "summit") color.lerp(high, 0.26);
        if (ventHeat > 0.36) {
          this.thermalColor.setHex(ventHeat > 0.74 ? 0xffd75d : 0xf0a33c);
          color.lerp(this.thermalColor, (ventHeat - 0.36) * 0.23);
        }
        const coherent = valueNoise(x * 0.050, z * 0.050, 111);
        const micro = valueNoise(x * 0.30, z * 0.30, 127);
        const tone = 0.985 + coherent * 0.030 + micro * 0.012 + flows.edge * 0.022 + flankLine * 0.018;
        color.multiplyScalar(clamp(tone * (1.015 + slope * 0.050), 0.90, 1.12));
        return color;
      }

      if (this.region.id === "maxwell") {
        const s = maxwellStructure(x, z);
        const ridgeStrength = Math.max(s.ridgeA, s.ridgeB, s.ridgeFine);
        const brightnessBand = smoothstep((height - 2.6) / 3.0) * (1 - 0.34 * smoothstep((height - 8.5) / 1.6));
        color.copy(mid);
        if (s.lakshmi > 0.30) color.lerp(low, clamp(0.14 + s.lakshmi * 0.42, 0, 0.54));
        if (cls === "highland") color.lerp(high, 0.30 + ridgeStrength * 0.24 + brightnessBand * 0.12);
        if (cls === "rugged") color.copy(high).lerp(rock, 0.12 + clamp(slope, 0, 0.75) * 0.16);
        if (s.cleopatraBowl > 0.18) color.lerp(accent, clamp(s.cleopatraBowl * 0.44, 0, 0.38));
        if (s.cleopatraOuter > 0.34) color.lerp(high, s.cleopatraOuter * 0.18);
        const micro = valueNoise(x * 0.16, z * 0.16, 29) * 0.015;
        color.multiplyScalar(clamp(0.95 + ridgeStrength * 0.085 + brightnessBand * 0.07 + micro, 0.83, 1.16));
        return color;
      }

      if (this.region.id === "aphrodite") {
        const s = aphroditeStructure(x, z);
        const fabric = Math.max(s.fabricNE, s.fabricNW, s.fineNE * 0.8);
        const valley = Math.max(s.mainValley, s.branchValley * 0.46, s.broadValley * 0.30);
        color.copy(mid);
        if (cls === "highland") color.lerp(high, 0.36 + fabric * 0.24);
        if (cls === "fracture") color.lerp(rock, 0.28 + s.fabricNW * 0.20);
        if (cls === "lava") color.lerp(accent, 0.40 + valley * 0.20);
        else if (s.branchValley > 0.52) color.lerp(accent, s.branchValley * 0.16);
        if (cls === "rugged") color.lerp(high, fabric * 0.13);
        const micro = valueNoise(x * 0.15, z * 0.15, 43) * 0.014;
        color.multiplyScalar(clamp(0.95 + fabric * 0.080 - valley * 0.055 + micro, 0.84, 1.14));
        return color;
      }

      if (this.region.id === "ishtar") {
        const s = ishtarStructure(x, z);
        const massif = Math.max(s.maxwell, s.akna, s.freyja);
        const altitudeTone = clamp((height + 0.6) / 10.0, 0, 1);
        color.copy(low).lerp(mid, clamp(s.plateau * 0.72 + altitudeTone * 0.18, 0, 0.86));
        color.lerp(high, clamp(altitudeTone * 0.26 + massif * 0.16, 0, 0.38));
        if (cls === "rugged") color.lerp(rock, 0.08 + clamp(slope, 0, 0.7) * 0.11);
        // PIA00093 is color-coded altimetry. Preserve relative elevation and
        // plateau-vs-massif contrast in Venus hues, not literal blue/green.
        color.multiplyScalar(clamp(0.99 + altitudeTone * 0.10 + valueNoise(x * 0.12, z * 0.12, 47) * 0.010, 0.91, 1.16));
        return color;
      }

      if (this.region.id === "alpha") {
        const s = alphaStructure(x, z);
        const tessera = Math.max(s.ridgeA, s.ridgeB, s.ridgeFine * 0.8);
        const localLow = Math.max(s.lowA, s.lowB, s.lowC);
        color.copy(low).lerp(mid, 0.16 + s.tesseraMask * 0.64);
        if (cls === "tessera") color.lerp(high, 0.30 + tessera * 0.18 + s.boundary * 0.10);
        if (cls === "fracture") color.lerp(rock, 0.14 + Math.max(s.faultA, s.faultB, s.faultC) * 0.14);
        if (cls === "lava") color.copy(accent).lerp(mid, 0.12);
        if (localLow > 0.30) color.lerp(accent, localLow * 0.40);
        color.multiplyScalar(clamp(0.94 + tessera * 0.065 + s.boundary * 0.05 + valueNoise(x * 0.15, z * 0.15, 61) * 0.012, 0.84, 1.14));
        return color;
      }

      color.setHex(p.mid);
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

    distantRelief(angle, rt) {
      const depth = smoothstep((rt - 0.12) / 0.88);
      if (depth <= 0) return 0;
      let profile = 0.20;
      if (this.region.id === "maat") {
        profile = 0.14 + ridgeWave(angle * 3.0 + 0.3, 8) * 0.36 + ridgeWave(angle * 6.0 - 0.8, 11) * 0.12;
      } else if (this.region.id === "maxwell") {
        profile = 0.28 + ridgeWave(angle * 3.5 + 0.4, 5) * 1.18 + ridgeWave(angle * 7.0 - 0.9, 8) * 0.42;
      } else if (this.region.id === "aphrodite") {
        profile = 0.20 + ridgeWave(angle * 4.0 + 0.7, 6) * 0.62 + ridgeWave(angle * 7.5 - 0.4, 9) * 0.24;
      } else if (this.region.id === "ishtar") {
        profile = 0.24 + ridgeWave(angle * 3.0 - 0.2, 7) * 0.78 + ridgeWave(angle * 5.5 + 1.1, 10) * 0.24;
      } else if (this.region.id === "alpha") {
        profile = 0.18 + ridgeWave(angle * 5.0 + 0.2, 7) * 0.48 + ridgeWave(angle * 7.0 - 1.0, 8) * 0.34;
      }
      return profile * depth * (0.52 + rt * 0.48);
    }

    createHorizon() {
      const T = this.THREE;
      const radial = 8;
      const angular = this.quality.horizonSegments;
      const inner = this.region.playRadius * 0.76;
      const outer = 150;
      const vertices = [];
      const normals = [];
      const colors = [];
      const indices = [];
      const fogColor = new T.Color(this.region.fog);
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
          const y = lerp(base, base * 0.28 - 0.8, smoothstep(rt)) + this.distantRelief(angle, rt);
          const color = this.colorFor(sourceX, sourceZ, base, 0.08);
          color.lerp(fogColor, smoothstep(rt) * 0.54).multiplyScalar(lerp(0.80, 0.54, rt));
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
      const total = this.quality.accentCount;
      if (!total) return null;

      // Perceived richness comes from composition, not brute-force mesh count.
      // Keep roughly the same instance budget, but cluster it along real regional
      // structures: Maat flow corridors, Maxwell ridge/talus belts, Aphrodite
      // fractures, Ishtar plateau margins and Alpha tessera intersections.
      const rockGeometry = new T.DodecahedronGeometry(0.68, 0);
      const shardGeometry = new T.OctahedronGeometry(0.72, 0);
      const plateGeometry = (() => {
        const ring = [
          [-0.95, -0.42], [-0.42, -0.88], [0.30, -0.82], [0.92, -0.28],
          [0.72, 0.60], [0.08, 0.92], [-0.72, 0.61]
        ];
        const vertices = [];
        const topY = [0.10, 0.14, 0.08, 0.13, 0.09, 0.15, 0.11];
        for (let i = 0; i < ring.length; i += 1) vertices.push(ring[i][0], topY[i], ring[i][1]);
        for (let i = 0; i < ring.length; i += 1) vertices.push(ring[i][0] * 0.96, -0.10, ring[i][1] * 0.96);
        vertices.push(0, 0.105, 0, 0, -0.10, 0);
        const topCenter = ring.length * 2;
        const bottomCenter = topCenter + 1;
        const indices = [];
        for (let i = 0; i < ring.length; i += 1) {
          const next = (i + 1) % ring.length;
          indices.push(topCenter, i, next);
          indices.push(bottomCenter, ring.length + next, ring.length + i);
          indices.push(i, ring.length + i, next, next, ring.length + i, ring.length + next);
        }
        const geometry = new T.BufferGeometry();
        geometry.setAttribute("position", new T.Float32BufferAttribute(vertices, 3));
        geometry.setIndex(indices);
        geometry.computeVertexNormals();
        geometry.computeBoundingSphere();
        return geometry;
      })();

      const volcanic = this.region.id === "maat";
      const rockMaterial = new T.MeshStandardMaterial({ color: 0xffffff, roughness: volcanic ? 0.91 : 0.97, metalness: 0, flatShading: true });
      const plateMaterial = new T.MeshStandardMaterial({ color: 0xffffff, roughness: volcanic ? 0.82 : (this.region.id === "alpha" ? 0.91 : 0.94), metalness: 0, flatShading: true });
      const shardMaterial = new T.MeshStandardMaterial({ color: 0xffffff, roughness: 0.96, metalness: 0, flatShading: true });
      this.accentResources.push(rockGeometry, plateGeometry, shardGeometry, rockMaterial, plateMaterial, shardMaterial);

      const rocks = new T.InstancedMesh(rockGeometry, rockMaterial, total);
      const plates = new T.InstancedMesh(plateGeometry, plateMaterial, total);
      const shards = new T.InstancedMesh(shardGeometry, shardMaterial, total);
      rocks.frustumCulled = plates.frustumCulled = shards.frustumCulled = true;

      const zones = {
        maat: [
          { x: 0, z: 20, rx: 27, rz: 12 },
          { x: -13, z: 7, rx: 13, rz: 28 },
          { x: 14, z: 4, rx: 14, rz: 27 },
          { x: 0, z: -10, rx: 23, rz: 15 }
        ],
        maxwell: [
          { x: -18, z: -4, rx: 19, rz: 27 },
          { x: 6, z: -18, rx: 23, rz: 29 },
          { x: 23, z: -7, rx: 16, rz: 23 }
        ],
        aphrodite: [
          { x: 8, z: -5, rx: 17, rz: 34 },
          { x: -13, z: -12, rx: 27, rz: 23 },
          { x: 20, z: 5, rx: 21, rz: 24 }
        ],
        ishtar: [
          { x: 35, z: -8, rx: 11, rz: 27 },
          { x: -35, z: -3, rx: 11, rz: 26 },
          { x: 0, z: -34, rx: 28, rz: 10 },
          { x: -5, z: 7, rx: 24, rz: 18 }
        ],
        alpha: [
          { x: 0, z: -5, rx: 25, rz: 23 },
          { x: 22, z: 10, rx: 15, rz: 17 },
          { x: -24, z: -4, rx: 15, rz: 19 }
        ]
      }[this.region.id] || [{ x: 0, z: 0, rx: 30, rz: 30 }];

      const dummy = new T.Object3D();
      const instanceColor = new T.Color();
      const rockBase = new T.Color(this.region.palette.rock);
      const plateBase = new T.Color(this.region.palette.mid).lerp(new T.Color(this.region.palette.rock), volcanic ? 0.36 : 0.24);
      const shardBase = new T.Color(this.region.palette.high).lerp(new T.Color(this.region.palette.rock), 0.42);
      const thermalRock = new T.Color(volcanic ? 0x9c4828 : this.region.palette.accent);
      let placedRocks = 0, placedPlates = 0, placedShards = 0;
      const seed = this.region.id.split("").reduce((sum, char) => sum + char.charCodeAt(0), 0);
      const maxAttempts = total * 12;
      const golden = 2.399963229728653;

      for (let i = 0; i < maxAttempts && placedRocks + placedPlates + placedShards < total; i += 1) {
        const zone = zones[i % zones.length];
        const a = i * golden + hash2(i, 19, seed) * 0.72;
        const r = Math.sqrt(hash2(i, 31, seed + 7));
        const x = zone.x + Math.cos(a) * zone.rx * r;
        const z = zone.z + Math.sin(a) * zone.rz * r;
        if (Math.hypot(x, z) > this.region.softBoundaryStart - 4) continue;

        // Preserve the hero sightline from the spawn point toward the main Maat edifice.
        if (this.region.id === "maat" && z > -17 && z < 28 && Math.abs(x) < 4.5 && hash2(i, 55, seed) < 0.72) continue;

        const y = this.heightAt(x, z);
        const normal = this.normalAt(x, z, 0.35);
        const slope = 1 - normal.y;
        const cls = surfaceClass(this.region, x, z, y, slope);
        let useful = true;
        if (this.region.id === "maat") useful = cls === "plain" || cls === "lava" || cls === "rugged";
        else if (this.region.id === "maxwell") useful = cls === "rugged" || cls === "highland";
        else if (this.region.id === "aphrodite") useful = cls === "fracture" || cls === "highland" || cls === "rugged";
        else if (this.region.id === "ishtar") useful = cls === "highland" || cls === "rugged" || (cls === "plain" && i % 5 === 0);
        else if (this.region.id === "alpha") useful = cls === "tessera" || cls === "fracture";
        if (!useful) continue;

        const roll = hash2(i, 71, seed + 3);
        const size = 0.24 + hash2(i, 37, seed + 11) * (this.region.id === "maxwell" ? 1.18 : 0.82);
        const structuralYaw = this.region.id === "maxwell" ? -0.08
          : this.region.id === "aphrodite" ? (i % 2 ? 0.78 : -0.74)
            : this.region.id === "ishtar" ? (Math.abs(x) > 27 ? Math.PI * 0.5 : 0.12)
              : this.region.id === "alpha" ? (i % 2 ? 0.57 : -0.91)
                : (x < 0 ? -0.06 : 0.08);

        dummy.position.set(x, y + 0.06, z);
        dummy.rotation.set((hash2(i, 43, seed) - 0.5) * 0.30, structuralYaw + (hash2(i, 47, seed) - 0.5) * 0.52, (hash2(i, 53, seed) - 0.5) * 0.30);

        const wantsShard = (this.region.id === "maxwell" || cls === "rugged" || cls === "highland") && roll > 0.53;
        const wantsPlate = !wantsShard && (cls === "lava" || cls === "fracture" || cls === "tessera" || (this.region.id === "ishtar" && cls === "plain")) && roll > 0.24;

        if (wantsShard && placedShards < total) {
          dummy.scale.set(size * (0.62 + hash2(i, 59, seed) * 0.50), size * (1.10 + hash2(i, 61, seed) * 1.25), size * (0.55 + hash2(i, 67, seed) * 0.55));
          dummy.position.y += size * 0.22;
          dummy.updateMatrix();
          shards.setMatrixAt(placedShards, dummy.matrix);
          instanceColor.copy(shardBase).multiplyScalar(0.84 + hash2(i, 73, seed) * 0.24);
          shards.setColorAt(placedShards++, instanceColor);
        } else if (wantsPlate && placedPlates < total) {
          dummy.scale.set(size * (1.20 + hash2(i, 79, seed) * 1.30), size * (0.58 + hash2(i, 83, seed) * 0.42), size * (0.90 + hash2(i, 89, seed) * 1.05));
          dummy.updateMatrix();
          plates.setMatrixAt(placedPlates, dummy.matrix);
          instanceColor.copy(plateBase).multiplyScalar(0.86 + hash2(i, 97, seed) * 0.22);
          if (volcanic && cls === "lava") instanceColor.lerp(thermalRock, 0.28);
          plates.setColorAt(placedPlates++, instanceColor);
        } else if (placedRocks < total) {
          dummy.scale.set(size * (0.70 + hash2(i, 101, seed) * 0.70), size * (0.58 + hash2(i, 103, seed) * 0.90), size * (0.70 + hash2(i, 107, seed) * 0.70));
          dummy.updateMatrix();
          rocks.setMatrixAt(placedRocks, dummy.matrix);
          instanceColor.copy(rockBase).multiplyScalar(0.84 + hash2(i, 109, seed) * 0.24);
          rocks.setColorAt(placedRocks++, instanceColor);
        }
      }

      const finalize = (mesh, count) => {
        mesh.count = count;
        mesh.instanceMatrix.needsUpdate = true;
        if (mesh.instanceColor) mesh.instanceColor.needsUpdate = true;
        mesh.computeBoundingSphere?.();
      };
      finalize(rocks, placedRocks);
      finalize(plates, placedPlates);
      finalize(shards, placedShards);

      const group = new T.Group();
      group.name = `venus-geology-accents-${this.region.id}`;
      if (placedRocks) group.add(rocks);
      if (placedPlates) group.add(plates);
      if (placedShards) group.add(shards);
      group.userData.instanceCount = placedRocks + placedPlates + placedShards;
      return group.children.length ? group : null;
    }

    createAtmosphericMotes() {
      const T = this.THREE;
      const count = this.quality.name === "HIGH" ? 56 : this.quality.name === "MEDIUM" ? 40 : 24;
      if (!count) return null;

      // A single Points draw call gives Venus a faint suspended-atmosphere cue.
      // Nothing is regenerated per frame; the complete field only drifts as one object.
      const positions = new Float32Array(count * 3);
      const colors = new Float32Array(count * 3);
      const fogColor = new T.Color(this.region.fog);
      const warmColor = new T.Color(this.region.sun);
      const color = new T.Color();
      const seed = this.region.id.split("").reduce((sum, char) => sum + char.charCodeAt(0), 0);
      const golden = 2.399963229728653;
      for (let i = 0; i < count; i += 1) {
        const a = i * golden + hash2(i, 13, seed) * 0.65;
        const radius = 5 + Math.sqrt(hash2(i, 17, seed + 5)) * (this.region.playRadius * 0.68);
        const x = Math.cos(a) * radius;
        const z = Math.sin(a) * radius;
        const ground = this.heightAt(x, z);
        const y = ground + 0.45 + hash2(i, 23, seed + 11) * (this.region.id === "maat" ? 6.5 : 5.2);
        const p = i * 3;
        positions[p] = x; positions[p + 1] = y; positions[p + 2] = z;
        color.copy(fogColor).lerp(warmColor, 0.12 + hash2(i, 29, seed) * 0.22).multiplyScalar(0.78 + hash2(i, 31, seed) * 0.20);
        colors[p] = color.r; colors[p + 1] = color.g; colors[p + 2] = color.b;
      }

      const canvas = document.createElement("canvas");
      canvas.width = canvas.height = 32;
      const ctx = canvas.getContext("2d");
      const gradient = ctx.createRadialGradient(16, 16, 0, 16, 16, 16);
      gradient.addColorStop(0, "rgba(255,255,255,.86)");
      gradient.addColorStop(0.28, "rgba(255,255,255,.44)");
      gradient.addColorStop(1, "rgba(255,255,255,0)");
      ctx.fillStyle = gradient;
      ctx.fillRect(0, 0, 32, 32);
      const map = new T.CanvasTexture(canvas);
      map.needsUpdate = true;
      this.textures.push(map);

      const geometry = new T.BufferGeometry();
      geometry.setAttribute("position", new T.BufferAttribute(positions, 3));
      geometry.setAttribute("color", new T.BufferAttribute(colors, 3));
      geometry.computeBoundingSphere();
      const baseOpacity = this.region.id === "maat" ? 0.15 : this.region.id === "alpha" || this.region.id === "aphrodite" ? 0.11 : 0.085;
      const material = new T.PointsMaterial({
        map,
        color: 0xffffff,
        vertexColors: true,
        size: this.quality.name === "HIGH" ? 2.0 : 1.65,
        sizeAttenuation: true,
        transparent: true,
        opacity: baseOpacity,
        alphaTest: 0.015,
        depthWrite: false,
        fog: true
      });
      const points = new T.Points(geometry, material);
      points.name = `venus-atmospheric-motes-${this.region.id}`;
      points.frustumCulled = true;
      points.renderOrder = 1;
      points.userData.baseOpacity = baseOpacity;
      points.userData.seed = seed;
      this.accentResources.push(geometry, material);
      return points;
    }

    updateAmbient(delta) {
      if (!this.atmosphericMotes) return;
      this.ambientClock += delta;
      const t = this.ambientClock;
      const seed = this.atmosphericMotes.userData.seed || 0;
      this.atmosphericMotes.position.x = Math.sin(t * 0.055 + seed * 0.01) * 0.38;
      this.atmosphericMotes.position.z = Math.cos(t * 0.043 + seed * 0.013) * 0.30;
      this.atmosphericMotes.position.y = Math.sin(t * 0.031 + seed * 0.017) * 0.05;
      const material = this.atmosphericMotes.material;
      if (material) material.opacity = this.atmosphericMotes.userData.baseOpacity * (0.94 + Math.sin(t * 0.17) * 0.06);
    }

    createRegionalVisualization() {
      if (this.region.id !== "maat") return null;
      const T = this.THREE;
      const group = new T.Group();
      group.name = "maat-illustrative-volcanic-activity";

      const cx = 1.5, cz = -25.7;
      const rimCount = 11;
      const positions = [cx, this.heightAt(cx, cz) + 0.018, cz];
      for (let i = 0; i <= rimCount; i += 1) {
        const a = i / rimCount * Math.PI * 2;
        const radius = 0.62 + 0.22 * Math.sin(a * 3 + 0.7) + 0.10 * Math.sin(a * 5);
        const x = cx + Math.cos(a) * radius * 1.35;
        const z = cz + Math.sin(a) * radius * 0.82;
        positions.push(x, this.heightAt(x, z) + 0.022, z);
      }
      const patchGeometry = new T.BufferGeometry();
      patchGeometry.setAttribute("position", new T.Float32BufferAttribute(positions, 3));
      const indices = [];
      for (let i = 0; i < rimCount; i += 1) indices.push(0, i + 1, i + 2);
      patchGeometry.setIndex(indices);
      patchGeometry.computeVertexNormals();
      const patchMaterial = new T.MeshBasicMaterial({
        color: 0xffdf55,
        transparent: true,
        opacity: 0.68,
        depthWrite: false,
        toneMapped: false,
        side: T.DoubleSide,
        blending: T.AdditiveBlending
      });
      const patch = new T.Mesh(patchGeometry, patchMaterial);
      patch.renderOrder = 3;
      group.add(patch);

      const crackPoints = [];
      const paths = [
        [[1.1, -25.2], [2.2, -24.4], [2.8, -23.6], [3.0, -22.8]],
        [[0.8, -25.8], [0.2, -24.9], [-0.5, -24.2]],
        [[1.9, -26.0], [2.7, -26.6], [3.4, -27.4]],
        [[1.3, -25.5], [1.8, -24.8], [1.2, -24.0], [0.7, -23.2]],
        [[1.5, -25.7], [0.9, -26.4], [0.4, -27.2]]
      ];
      paths.forEach(path => {
        for (let i = 0; i < path.length - 1; i += 1) {
          const a = path[i], b = path[i + 1];
          crackPoints.push(a[0], this.heightAt(a[0], a[1]) + 0.028, a[1]);
          crackPoints.push(b[0], this.heightAt(b[0], b[1]) + 0.028, b[1]);
        }
      });
      const crackGeometry = new T.BufferGeometry();
      crackGeometry.setAttribute("position", new T.Float32BufferAttribute(crackPoints, 3));
      const crackMaterial = new T.LineBasicMaterial({
        color: 0xffb82b,
        transparent: true,
        opacity: 0.82,
        depthWrite: false,
        toneMapped: false,
        blending: T.AdditiveBlending
      });
      const cracks = new T.LineSegments(crackGeometry, crackMaterial);
      cracks.renderOrder = 4;
      group.add(cracks);

      this.accentResources.push(patchGeometry, patchMaterial, crackGeometry, crackMaterial);
      return group;
    }

    createMaterial() {
      const T = this.THREE;
      const size = this.quality.name === "HIGH" ? 160 : 128;
      const materialProfiles = {
        maat:      { repeat: 8.0, normal: 0.48, roughness: 0.88, roughSpread: 38, anisotropy: 0.22 },
        maxwell:   { repeat: 9.5, normal: 0.56, roughness: 0.95, roughSpread: 30, anisotropy: 0.36 },
        aphrodite: { repeat: 9.0, normal: 0.54, roughness: 0.92, roughSpread: 34, anisotropy: 0.33 },
        ishtar:    { repeat: 7.5, normal: 0.40, roughness: 0.93, roughSpread: 30, anisotropy: 0.12 },
        alpha:     { repeat: 9.5, normal: 0.60, roughness: 0.95, roughSpread: 34, anisotropy: 0.40 }
      };
      const profile = materialProfiles[this.region.id] || materialProfiles.maat;
      const detail = new Float32Array(size * size);
      const seed = this.region.id.split("").reduce((sum, char) => sum + char.charCodeAt(0), 0);
      const TAU = Math.PI * 2;

      // Region-specific micro language. These periodic signals are intentionally
      // subtle and seamless; they support the reference morphology but never
      // determine the macro terrain design.
      const microSignal = (u, v) => {
        const base = 0.50 * valueNoise(u * 22, v * 22, seed)
          + 0.28 * valueNoise(u * 54, v * 54, seed + 17)
          + 0.14 * valueNoise(u * 112, v * 112, seed + 31);
        if (this.region.id === "maat") {
          const lineA = Math.sin(TAU * (u * 5 + v * 2 + 0.12 * Math.sin(TAU * v * 2)));
          const lineB = Math.sin(TAU * (-u * 3 + v * 6 + 0.08 * Math.sin(TAU * u * 3)));
          return base * 0.78 + (lineA * 0.13 + lineB * 0.09) * profile.anisotropy;
        }
        if (this.region.id === "maxwell") {
          const folds = Math.sin(TAU * (u * 9 + v * 2 + 0.10 * Math.sin(TAU * v * 2)));
          return base * 0.70 + folds * profile.anisotropy;
        }
        if (this.region.id === "aphrodite") {
          const a = Math.sin(TAU * (u * 7 + v * 5));
          const b = Math.sin(TAU * (u * 5 - v * 7));
          return base * 0.68 + (a + b) * 0.5 * profile.anisotropy;
        }
        if (this.region.id === "alpha") {
          const a = Math.sin(TAU * (u * 8 + v * 5));
          const b = Math.sin(TAU * (-u * 6 + v * 9));
          return base * 0.64 + (a + b) * 0.5 * profile.anisotropy;
        }
        const plateau = Math.sin(TAU * (u * 3 + v * 2));
        return base * 0.90 + plateau * profile.anisotropy * 0.35;
      };

      for (let y = 0; y < size; y += 1) {
        for (let x = 0; x < size; x += 1) {
          const u = x / size, v = y / size;
          detail[y * size + x] = clamp(microSignal(u, v), -1, 1);
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
          // Keep albedo essentially neutral so macro region colors come from the
          // world-space reference masks, not from a generic orange texture.
          const base = clamp(188 + n * 28, 164, 220);
          albedoImage.data[p] = Math.round(base);
          albedoImage.data[p + 1] = Math.round(base);
          albedoImage.data[p + 2] = Math.round(base);
          albedoImage.data[p + 3] = 255;

          const rough = Math.round(clamp(profile.roughness * 255 + (0.5 - n) * profile.roughSpread, 150, 250));
          roughImage.data[p] = rough;
          roughImage.data[p + 1] = rough;
          roughImage.data[p + 2] = rough;
          roughImage.data[p + 3] = 255;

          const dx = sample(x + 1, y) - sample(x - 1, y);
          const dy = sample(x, y + 1) - sample(x, y - 1);
          const nx = -dx * 1.85, ny = -dy * 1.85, nz = 1;
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
        texture.repeat.set(profile.repeat, profile.repeat);
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
        normalScale: new T.Vector2(profile.normal, profile.normal),
        roughness: profile.roughness,
        metalness: 0,
        fog: true,
        dithering: true
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
      for (const resource of this.accentResources) resource?.dispose?.();
      this.accentResources.length = 0;
      this.material?.dispose();
      this.horizonMaterial?.dispose();
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
        return { name: "LOW", tileSize: 24, nearSegments: 26, midSegments: 16, farSegments: 10, horizonSegments: 56, maxDpr: 1.25, minDpr: 0.88, supersample: 1, pixelBudget: 2400000, anisotropy: 4, accentCount: 8 };
      }
      if (cores >= 8 && memory >= 6) {
        return { name: "HIGH", tileSize: 24, nearSegments: 52, midSegments: 32, farSegments: 18, horizonSegments: 80, maxDpr: 1.65, minDpr: 0.95, supersample: 1.10, pixelBudget: 5200000, anisotropy: 8, accentCount: 18 };
      }
      return { name: "MEDIUM", tileSize: 24, nearSegments: 38, midSegments: 24, farSegments: 14, horizonSegments: 72, maxDpr: 1.45, minDpr: 0.92, supersample: 1.05, pixelBudget: 4200000, anisotropy: 6, accentCount: 12 };
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
        this.camera = new T.PerspectiveCamera(this.mobileFov(), 1, 0.05, 220);
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
      const feature = this.region.featureCenter || { x: 0, z: 0 };
      const featureDistance = Math.hypot(this.camera.position.x - feature.x, this.camera.position.z - feature.z);
      this.hudDistance.textContent = `${featureDistance.toFixed(featureDistance < 10 ? 1 : 0)} KM`;
      this.hudRegionType.textContent = this.region.category;
      this.hudData.textContent = "NASA/JPL MAGELLAN · CURATED REGION";
    }

    updateRegionUI() {
      const region = this.region;
      this.hudLocation.textContent = region.name;
      this.hudCoordinates.textContent = formatCoordinate(region.latitude, region.longitudeEast);
      this.hudDistance.textContent = "--";
      this.hudRegionType.textContent = region.category;
      this.hudData.textContent = "NASA/JPL MAGELLAN · CURATED REGION";
      this.infoName.textContent = region.name;
      this.infoType.textContent = `${region.category} · ${region.descriptor}`;
      this.infoCoords.textContent = formatCoordinate(region.latitude, region.longitudeEast);
      this.infoImage.src = region.image;
      this.infoImage.alt = `Referensi Magellan NASA/JPL untuk ${region.name}`;
      this.infoMedia.setAttribute("aria-label", `Perbesar citra referensi Magellan untuk ${region.name}`);
      this.infoDescription.textContent = region.description;
      this.infoFacts.replaceChildren(...region.facts.map(fact => { const li = document.createElement("li"); li.textContent = fact; return li; }));
      this.infoBadge.textContent = `REFERENCE-DRIVEN MORPHOLOGY · ${region.category} · STATIC BOUNDED REGION`;
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
      this.infoCard.setAttribute("aria-hidden", "true");
      this.infoToggle.hidden = true;
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
