"use strict";

/*
 * ANTARA Venus Full Exploration
 *
 * Mars Full Exploration is the architectural template for this module: the same
 * streamed one-degree chunk world, active-radius logic, LOD/culling philosophy,
 * camera/input model, HUD lifecycle, teleport flow, entry/exit transitions and
 * cleanup model are reused here. Venus-specific world content is rebuilt around
 * Magellan GTDR macro relief, Magellan radar context and deterministic geological
 * detail functions that are continuous in world coordinates across chunk borders.
 *
 * Orbit-mode Venus remains owned by VenusScene. This file owns only the lazy
 * surface renderer used after the user explicitly enters Full Exploration.
 */

(() => {
  const DEG = Math.PI / 180;
  const VENUS_RADIUS_KM = 6051.8;
  const KM_PER_DEG_LAT = 2 * Math.PI * VENUS_RADIUS_KM / 360;
  const TILE_SIZE = 128;
  const MAX_EXPLORATION_ALTITUDE_KM = 30;
  const ALTITUDE_LIMIT_WARNING_KM = 29.75;
  const MIN_DATA_LAT = -87.999;
  const MAX_DATA_LAT = 87.999;
  const GTDR_RES = 22.755556;
  const GTDR_HEADER_BYTES = 2048;
  const GTDR_SAMPLES = 1024;
  const GTDR_RADIUS_OFFSET_M = 6039999;
  const GTDR_REFERENCE_RADIUS_M = 6051000;
  const GTDR_BASE = String(window.ANTARA_VENUS_GTDR_BASE || "https://pds-geosciences.wustl.edu/mgn/mgn-v-gxdr-v1/mg_3002/gtdr/sinus/").replace(/\/?$/, "/");
  const MAGELLAN_GLOBAL_RADAR = "https://assets.science.nasa.gov/dynamicimage/assets/science/cds/3d/resources/image/venus/preview.webp?w=2048";

  const STATES = Object.freeze({
    IDLE: "IDLE",
    PREPARING: "PREPARING",
    ENTERING: "ENTERING",
    EXPLORING: "EXPLORING",
    TRAVELLING: "TRAVELLING_TO_LOCATION",
    EXITING: "EXITING",
    ERROR: "ERROR"
  });

  const LANDMARKS = Object.freeze([
    {
      id: "maat",
      name: "Maat Mons",
      type: "Volcanic rise · broad shield volcano and fractured plains",
      category: "VOLCANIC RISE",
      latitude: 0.50,
      longitudeEast: 194.60,
      heading: -0.18,
      profile: "shield",
      frame: "f09",
      frameMeta: { maxLat: 45, minLat: 0, minLon: 180 },
      southFrame: "f17",
      source: "https://planetarynames.wr.usgs.gov/Feature/3550",
      scienceSource: "https://science.nasa.gov/photojournal/venus-3-d-perspective-view-of-maat-mons-2/",
      radarImage: "https://assets.science.nasa.gov/dynamicimage/assets/science/psd/photojournal/pia/pia00/pia00254/PIA00254.jpg?crop=faces%2Cfocalpoint&fit=clip&h=1100&w=1400",
      description: "Maat Mons is rebuilt as a regional volcanic rise: a broad edifice, fractured volcanic plains and long flow-like structures continuing through neighboring chunks instead of a small cone on an empty square.",
      facts: [
        "Magellan perspective products show lava flows extending hundreds of kilometres across fractured plains toward Maat Mons.",
        "The volcanic edifice rises roughly 8 km above the mean Venus radius in NASA/JPL descriptions.",
        "Macro elevation is sampled from Magellan GTDR when the PDS frame is reachable; added flow and fracture relief stays subordinate to that measured shape."
      ]
    },
    {
      id: "maxwell",
      name: "Maxwell Montes",
      type: "Mountain belt · rugged highlands beside Lakshmi Planum",
      category: "MOUNTAIN BELT",
      latitude: 65.20,
      longitudeEast: 3.30,
      heading: 0.48,
      profile: "mountain",
      frame: "f05",
      frameMeta: { maxLat: 90, minLat: 45, minLon: 0 },
      source: "https://planetarynames.wr.usgs.gov/Feature/3766",
      scienceSource: "https://science.nasa.gov/photojournal/venus-lakshmi-planum-and-maxwell-montes/",
      radarImage: "https://assets.science.nasa.gov/dynamicimage/assets/science/psd/photojournal/pia/pia00/pia00241/PIA00241.jpg?crop=faces%2Cfocalpoint&fit=clip&h=1100&w=1400",
      description: "Maxwell is rebuilt as an extensive directional mountain system with organized ridge trains, valleys and the smoother Lakshmi context carried across the streamed world.",
      facts: [
        "NASA/JPL radar imagery contrasts radar-dark smooth Lakshmi lava plains with the strongly deformed Maxwell mountain terrain.",
        "Maxwell is the highest mountain system on Venus and belongs to the larger Ishtar Terra highland province.",
        "The renderer uses elongated regional ridge belts rather than isolated random peaks."
      ]
    },
    {
      id: "aphrodite",
      name: "Aphrodite Terra",
      type: "Equatorial highland · tectonic ridges, valleys and volcanic infill",
      category: "EQUATORIAL HIGHLAND",
      latitude: -5.80,
      longitudeEast: 104.80,
      heading: 0.12,
      profile: "aphrodite",
      frame: "f23",
      frameMeta: { maxLat: 0, minLat: -45, minLon: 90 },
      source: "https://planetarynames.wr.usgs.gov/Feature/317",
      scienceSource: "https://science.nasa.gov/photojournal/venus-ovda-regio/",
      radarImage: "https://assets.science.nasa.gov/dynamicimage/assets/science/psd/photojournal/pia/pia00/pia00146/PIA00146.jpg?crop=faces%2Cfocalpoint&fit=clip&h=1100&w=1400",
      description: "Aphrodite Terra is now a broad highland province. The Ovda-inspired structural field combines older ridge-and-valley fabric with cross-cutting extensional fractures and smoother lava-filled lows.",
      facts: [
        "Ovda Regio in western Aphrodite rises more than 4 km above surrounding plains in NASA descriptions.",
        "Magellan imagery records several generations of deformation, including ridges, curvilinear valleys and later graben.",
        "The highland is represented as a region spanning many chunks, not one central mountain."
      ]
    },
    {
      id: "ishtar",
      name: "Ishtar Terra",
      type: "Northern highland · plateau interior and mountain-bounded margins",
      category: "PLATEAU + MOUNTAIN SYSTEM",
      latitude: 70.40,
      longitudeEast: 27.50,
      heading: -0.42,
      profile: "ishtar",
      frame: "f05",
      frameMeta: { maxLat: 90, minLat: 45, minLon: 0 },
      source: "https://planetarynames.wr.usgs.gov/Feature/2733",
      scienceSource: "https://science.nasa.gov/photojournal/venus-lakshmi-planum/",
      radarImage: "https://assets.science.nasa.gov/dynamicimage/assets/science/psd/photojournal/pia/pia00/pia00240/PIA00240.jpg?crop=faces%2Cfocalpoint&fit=clip&h=1100&w=1400",
      description: "Ishtar is rebuilt around a wide elevated plateau context with comparatively smoother interior sectors, strong topographic transitions and deformed mountain margins continuing beyond the initial camera view.",
      facts: [
        "Lakshmi Planum is a high plateau roughly 3.5 km above mean planetary radius in NASA descriptions.",
        "USGS mapping describes a 3–4 km high volcanic plateau surrounded by Venus's highest mountain ranges and broad deformation zones.",
        "The new world separates smoother plateau terrain from rugged boundaries instead of rendering one flat raised slab."
      ]
    },
    {
      id: "alpha",
      name: "Alpha Regio",
      type: "Tessera upland · intersecting structural fabrics and fault valleys",
      category: "TESSERA UPLAND",
      latitude: -25.50,
      longitudeEast: 0.30,
      heading: 0.35,
      profile: "tessera",
      frame: "f21",
      frameMeta: { maxLat: 0, minLat: -45, minLon: 0 },
      alternateFrame: "f20",
      source: "https://planetarynames.wr.usgs.gov/Feature/203",
      scienceSource: "https://science.nasa.gov/photojournal/venus-false-color-image-of-alpha-regio/",
      radarImage: "https://assets.science.nasa.gov/dynamicimage/assets/science/psd/photojournal/pia/pia00/pia00147/PIA00147.jpg?crop=faces%2Cfocalpoint&fit=clip&h=1100&w=1400",
      description: "Alpha Regio is rebuilt from zero as a tessera province: several intersecting ridge directions, cross-cutting troughs, broad fault valleys, irregular uplifted blocks and smoother lava-filled local lows.",
      facts: [
        "NASA describes Alpha as a roughly 1,300 km-wide topographic upland.",
        "Its radar-bright terrain contains multiple intersecting trends of ridges, troughs and flat-floored fault valleys.",
        "Smooth radar-dark local lows are represented as volcanic infill rather than repeating dunes or generic hills."
      ]
    }
  ]);

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
  const wrapLongitude = longitude => {
    let result = longitude;
    while (result < -180) result += 360;
    while (result >= 180) result -= 360;
    return result;
  };
  const eastLongitude = signedLongitude => ((signedLongitude % 360) + 360) % 360;
  const shortestLongitudeDelta = (from, to) => wrapLongitude(to - from);
  const formatCoordinate = (latitude, longitudeEast) => {
    const latHemisphere = latitude >= 0 ? "N" : "S";
    return `${Math.abs(latitude).toFixed(3)}° ${latHemisphere}  ·  ${eastLongitude(longitudeEast).toFixed(3)}° E`;
  };
  const formatAltitude = km => km < 1 ? `${Math.max(0, km * 1000).toFixed(0)} M` : `${Math.max(0, km).toFixed(km < 10 ? 2 : 1)} KM`;
  const formatSpeed = kmPerSecond => kmPerSecond < 1 ? `${Math.round(kmPerSecond * 1000)} M/S` : `${kmPerSecond.toFixed(2)} KM/S`;

  async function fetchArrayBuffer(url, timeoutMs = 14000) {
    const controller = new AbortController();
    const timer = window.setTimeout(() => controller.abort(), timeoutMs);
    try {
      const response = await fetch(url, { mode: "cors", credentials: "omit", cache: "force-cache", signal: controller.signal });
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      return await response.arrayBuffer();
    } finally {
      window.clearTimeout(timer);
    }
  }

  class MagellanTileProvider {
    constructor() {
      this.cache = new Map();
      this.pending = new Map();
      this.frames = new Map();
      this.pendingFrames = new Map();
      this.generation = 0;
      this.maxCache = 96;
      this.activeRegion = LANDMARKS[0];
      this.activeMode = "FALLBACK";
      this.lastError = "";
      this.sourceLabel = "Magellan GTDR / NASA PDS";
    }

    setRegion(region) {
      this.activeRegion = region || LANDMARKS[0];
    }

    async prepareRegion(region) {
      this.setRegion(region);
      const required = [region.frame, region.alternateFrame, region.southFrame].filter(Boolean);
      try {
        await Promise.all(required.map(frame => this.loadFrame(frame).catch(error => {
          if (frame === region.frame) throw error;
          return null;
        })));
        this.activeMode = this.frames.has(region.frame) ? "GTDR_4_6KM" : "FALLBACK";
        this.lastError = "";
      } catch (error) {
        this.activeMode = "FALLBACK";
        this.lastError = String(error?.message || error || "GTDR unavailable");
      }
      return this.activeMode;
    }

    tileForLocation(latitude, signedLongitude) {
      return {
        lonWest: Math.floor(wrapLongitude(signedLongitude)),
        latNorth: Math.ceil(clamp(latitude, MIN_DATA_LAT, MAX_DATA_LAT))
      };
    }

    tileKey(lonWest, latNorth) {
      return `${this.activeRegion.id}:${Math.floor(wrapLongitude(lonWest))},${Math.floor(latNorth)}`;
    }

    async loadFrame(frame) {
      if (!frame) throw new Error("Missing GTDR frame id.");
      if (this.frames.has(frame)) return this.frames.get(frame);
      if (this.pendingFrames.has(frame)) return this.pendingFrames.get(frame);
      const generation = this.generation;
      const promise = fetchArrayBuffer(`${GTDR_BASE}${frame}.img`).then(buffer => {
        if (generation !== this.generation) throw new Error("Magellan GTDR request cancelled.");
        const minimum = GTDR_HEADER_BYTES + GTDR_SAMPLES * GTDR_SAMPLES * 2;
        if (buffer.byteLength < minimum) throw new Error(`GTDR frame incomplete: ${frame}`);
        const item = { frame, view: new DataView(buffer), lastUsed: performance.now() };
        this.frames.set(frame, item);
        return item;
      }).finally(() => this.pendingFrames.delete(frame));
      this.pendingFrames.set(frame, promise);
      return promise;
    }

    sampleDN(frameData, row, col) {
      const r = clamp(row, 0, GTDR_SAMPLES - 1);
      const c = clamp(col, 0, GTDR_SAMPLES - 1);
      return frameData.view.getInt16(GTDR_HEADER_BYTES + (r * GTDR_SAMPLES + c) * 2, true);
    }

    dnToKm(dn) {
      // GTDR stores signed 16-bit radius offsets. -32678 is the archive NoData sentinel.
      if (!Number.isFinite(dn) || dn === -32678) return null;
      return (dn + GTDR_RADIUS_OFFSET_M - GTDR_REFERENCE_RADIUS_M) / 1000;
    }

    sampleMeasured(region, latitude, signedLongitude) {
      if (this.activeMode !== "GTDR_4_6KM" || !region) return null;
      const lonEast = eastLongitude(signedLongitude);
      const signed = wrapLongitude(signedLongitude);
      let frameName = region.frame;
      let rowF;
      let colF;

      if (region.southFrame && latitude < 0 && this.frames.has(region.southFrame)) {
        frameName = region.southFrame;
        rowF = (0 - latitude) * GTDR_RES;
        colF = (lonEast - 180) * Math.cos(latitude * DEG) * GTDR_RES;
      } else if (region.alternateFrame && signed < 0 && this.frames.has(region.alternateFrame)) {
        frameName = region.alternateFrame;
        rowF = (region.frameMeta.maxLat - latitude) * GTDR_RES;
        colF = (GTDR_SAMPLES - 1) + signed * Math.cos(latitude * DEG) * GTDR_RES;
      } else {
        let lon = lonEast;
        const minLon = region.frameMeta.minLon;
        if (lon < minLon && minLon >= 180) lon += 360;
        rowF = (region.frameMeta.maxLat - latitude) * GTDR_RES;
        colF = (lon - minLon) * Math.cos(latitude * DEG) * GTDR_RES;
      }

      const frame = this.frames.get(frameName);
      if (!frame || rowF < -1 || rowF > GTDR_SAMPLES || colF < -1 || colF > GTDR_SAMPLES) return null;
      frame.lastUsed = performance.now();
      const r0 = Math.floor(rowF), c0 = Math.floor(colF);
      const r1 = r0 + 1, c1 = c0 + 1;
      const ty = clamp(rowF - r0, 0, 1), tx = clamp(colF - c0, 0, 1);
      const values = [
        this.dnToKm(this.sampleDN(frame, r0, c0)),
        this.dnToKm(this.sampleDN(frame, r0, c1)),
        this.dnToKm(this.sampleDN(frame, r1, c0)),
        this.dnToKm(this.sampleDN(frame, r1, c1))
      ];
      const valid = values.filter(Number.isFinite);
      if (!valid.length) return null;
      const fill = valid.reduce((sum, value) => sum + value, 0) / valid.length;
      const h00 = Number.isFinite(values[0]) ? values[0] : fill;
      const h10 = Number.isFinite(values[1]) ? values[1] : fill;
      const h01 = Number.isFinite(values[2]) ? values[2] : fill;
      const h11 = Number.isFinite(values[3]) ? values[3] : fill;
      return lerp(lerp(h00, h10, tx), lerp(h01, h11, tx), ty);
    }

    regionCoords(latitude, signedLongitude, region = this.activeRegion) {
      const centerLon = wrapLongitude(region.longitudeEast > 180 ? region.longitudeEast - 360 : region.longitudeEast);
      const cosLat = Math.max(0.10, Math.cos(region.latitude * DEG));
      return {
        x: shortestLongitudeDelta(centerLon, signedLongitude) * KM_PER_DEG_LAT * cosLat,
        z: -(latitude - region.latitude) * KM_PER_DEG_LAT
      };
    }

    hash(x, z, seed = 0) {
      const s = Math.sin(x * 12.9898 + z * 78.233 + seed * 37.719) * 43758.5453123;
      return s - Math.floor(s);
    }

    valueNoise(x, z, scale = 1, seed = 0) {
      const px = x / scale, pz = z / scale;
      const x0 = Math.floor(px), z0 = Math.floor(pz);
      const tx0 = px - x0, tz0 = pz - z0;
      const tx = tx0 * tx0 * (3 - 2 * tx0);
      const tz = tz0 * tz0 * (3 - 2 * tz0);
      const a = this.hash(x0, z0, seed), b = this.hash(x0 + 1, z0, seed);
      const c = this.hash(x0, z0 + 1, seed), d = this.hash(x0 + 1, z0 + 1, seed);
      return lerp(lerp(a, b, tx), lerp(c, d, tx), tz) * 2 - 1;
    }

    fbm(x, z, baseScale = 90, seed = 0) {
      let sum = 0, amp = 0.56, scale = baseScale, norm = 0;
      for (let octave = 0; octave < 4; octave += 1) {
        sum += this.valueNoise(x, z, scale, seed + octave * 17) * amp;
        norm += amp;
        amp *= 0.5;
        scale *= 0.5;
      }
      return sum / Math.max(norm, 0.001);
    }

    rotate(x, z, degrees) {
      const a = degrees * DEG, c = Math.cos(a), s = Math.sin(a);
      return { u: x * c + z * s, v: -x * s + z * c };
    }

    ridgeFamily(x, z, degrees, spacingKm, sharpness = 5, warp = 0) {
      const q = this.rotate(x, z, degrees);
      const phaseWarp = warp ? Math.sin(q.v / 42 + this.valueNoise(q.u, q.v, 85, 13) * 1.6) * warp : 0;
      const wave = Math.sin((q.u + phaseWarp) * Math.PI / Math.max(1, spacingKm));
      return Math.pow(clamp(1 - Math.abs(wave), 0, 1), sharpness);
    }

    valleyFamily(x, z, degrees, spacingKm, sharpness = 7, warp = 0) {
      return this.ridgeFamily(x, z, degrees, spacingKm, sharpness, warp);
    }

    gaussian(x, z, cx, cz, rx, rz, degrees = 0) {
      const q = this.rotate(x - cx, z - cz, degrees);
      return Math.exp(-((q.u * q.u) / Math.max(1, rx * rx) + (q.v * q.v) / Math.max(1, rz * rz)));
    }

    fallbackMacro(latitude, signedLongitude, region = this.activeRegion) {
      const { x, z } = this.regionCoords(latitude, signedLongitude, region);
      const broadNoise = this.fbm(x, z, 180, 5);
      if (region.profile === "shield") {
        const q = this.rotate(x + 20, z - 8, -8);
        const r = Math.hypot(q.u * 0.82, q.v);
        const shield = 5.1 * Math.exp(-(r * r) / (2 * 155 * 155));
        const shoulder = 0.85 * Math.exp(-((q.u + 115) ** 2) / (2 * 125 * 125) - ((q.v - 45) ** 2) / (2 * 95 * 95));
        const caldera = 0.25 * Math.exp(-(r * r) / (2 * 18 * 18));
        return 0.45 + shield + shoulder - caldera + broadNoise * 0.20;
      }
      if (region.profile === "mountain") {
        const q = this.rotate(x, z, 14);
        const belt = 4.2 * Math.exp(-(q.v * q.v) / (2 * 105 * 105));
        const plateauSide = 1.25 * smoothstep((q.v + 210) / 220);
        return 3.0 + belt + plateauSide + broadNoise * 0.32;
      }
      if (region.profile === "ishtar") {
        const q = this.rotate(x, z, 8);
        const plateau = 3.35 + 0.45 * smoothstep((q.v + 240) / 220);
        const margin = 1.2 * Math.exp(-((Math.abs(q.v) - 185) ** 2) / (2 * 65 * 65));
        return plateau + margin + broadNoise * 0.18;
      }
      if (region.profile === "tessera") {
        const upland = 1.65 + 0.65 * Math.exp(-(x * x + z * z) / (2 * 330 * 330));
        return upland + broadNoise * 0.36;
      }
      const q = this.rotate(x, z, 19);
      const highland = 2.0 + 1.55 * Math.exp(-(q.v * q.v) / (2 * 260 * 260));
      return highland + broadNoise * 0.50;
    }

    surfaceHeight(latitude, signedLongitude, detailStrength = 1, region = this.activeRegion) {
      let macro = this.sampleMeasured(region, latitude, signedLongitude);
      if (!Number.isFinite(macro)) macro = this.fallbackMacro(latitude, signedLongitude, region);
      return macro + this.detailHeight(latitude, signedLongitude, detailStrength, region);
    }

    detailHeight(latitude, signedLongitude, strength = 1, region = this.activeRegion) {
      if (strength <= 0) return 0;
      const { x, z } = this.regionCoords(latitude, signedLongitude, region);
      const fine = this.fbm(x, z, 26, 41) * 0.024;

      if (region.profile === "shield") {
        const r = Math.max(1, Math.hypot(x, z));
        const theta = Math.atan2(z, x);
        const flow = Math.pow(clamp(1 - Math.abs(Math.sin(theta * 11 + r / 22 + Math.sin(theta * 3) * 0.7)), 0, 1), 7);
        const apron = 1 - smoothstep((r - 55) / 300);
        const fractures = this.valleyFamily(x, z, -28, 34, 8, 5);
        return strength * (flow * apron * 0.055 - fractures * 0.030 + fine);
      }

      if (region.profile === "mountain") {
        const q = this.rotate(x, z, 14);
        const envelope = Math.exp(-(q.v * q.v) / (2 * 165 * 165));
        const ridges = this.ridgeFamily(x, z, 14, 17, 6, 5) * 0.18 + this.ridgeFamily(x, z, 20, 31, 5, 7) * 0.09;
        const valleys = this.valleyFamily(x, z, 101, 44, 8, 6) * 0.075;
        return strength * ((ridges - valleys) * envelope + fine * (0.6 + envelope));
      }

      if (region.profile === "ishtar") {
        const q = this.rotate(x, z, 8);
        const interior = clamp(1 - Math.abs(q.v) / 175, 0, 1);
        const margin = 1 - interior;
        const boundaryRidges = (this.ridgeFamily(x, z, 32, 24, 6, 7) * 0.14 + this.ridgeFamily(x, z, -14, 38, 5, 5) * 0.08) * margin;
        const graben = this.valleyFamily(x, z, 86, 55, 8, 7) * 0.055 * (0.35 + margin);
        return strength * (boundaryRidges - graben + fine * (0.35 + margin * 0.8));
      }

      if (region.profile === "tessera") {
        const familyA = this.ridgeFamily(x, z, 28, 15, 6, 7) * 0.145;
        const familyB = this.ridgeFamily(x, z, -38, 22, 6, 9) * 0.130;
        const familyC = this.ridgeFamily(x, z, 5, 34, 7, 6) * 0.070;
        const troughA = this.valleyFamily(x, z, 73, 31, 9, 8) * 0.120;
        const troughB = this.valleyFamily(x, z, -8, 58, 10, 9) * 0.080;
        const blocks = this.fbm(x, z, 72, 83) * 0.085 + this.fbm(x, z, 38, 97) * 0.040;
        const lavaLow = clamp(
          this.gaussian(x, z, 95, -75, 70, 38, 18) +
          this.gaussian(x, z, -130, 110, 52, 82, -33) +
          this.gaussian(x, z, 180, 135, 85, 48, 41), 0, 1);
        const structural = (familyA + familyB + familyC - troughA - troughB + blocks) * (1 - lavaLow * 0.72);
        return strength * (structural - lavaLow * 0.045 + fine * (1 - lavaLow * 0.7));
      }

      // Aphrodite / Ovda: an older NE-SW ridge-valley fabric cut by younger
      // NW-SE extensional graben, with smoother lava-filled lows.
      const oldFabric = this.ridgeFamily(x, z, 42, 19, 6, 8) * 0.125 + this.ridgeFamily(x, z, 48, 34, 5, 9) * 0.070;
      const extension = this.valleyFamily(x, z, -38, 48, 9, 10) * 0.125;
      const longValley = this.gaussian(x, z, 15, -40, 185, 24, -38) * 0.11;
      const lavaLow = clamp(this.gaussian(x, z, -105, 70, 95, 44, 25) + this.gaussian(x, z, 155, -110, 105, 55, -20), 0, 1);
      return strength * ((oldFabric - extension - longValley) * (1 - lavaLow * 0.55) - lavaLow * 0.035 + fine);
    }

    materialSignal(latitude, signedLongitude, region = this.activeRegion) {
      const { x, z } = this.regionCoords(latitude, signedLongitude, region);
      const base = this.fbm(x, z, 55, 131) * 0.5 + 0.5;
      if (region.profile === "shield") {
        const r = Math.hypot(x, z), theta = Math.atan2(z, x);
        const flows = Math.pow(clamp(1 - Math.abs(Math.sin(theta * 9 + r / 28)), 0, 1), 6);
        return { rough: 0.35 + base * 0.30, dark: flows * 0.62, smooth: 0.18 };
      }
      if (region.profile === "mountain") return { rough: 0.68 + base * 0.28, dark: 0.20, smooth: 0.04 };
      if (region.profile === "ishtar") {
        const q = this.rotate(x, z, 8);
        const interior = clamp(1 - Math.abs(q.v) / 175, 0, 1);
        return { rough: 0.42 + (1 - interior) * 0.45, dark: 0.12, smooth: interior * 0.62 };
      }
      if (region.profile === "tessera") return { rough: 0.78 + base * 0.18, dark: 0.28, smooth: 0.06 };
      return { rough: 0.62 + base * 0.28, dark: 0.22, smooth: 0.16 };
    }

    async generateTile(lonWest, latNorth) {
      const region = this.activeRegion;
      const heights = new Float32Array(TILE_SIZE * TILE_SIZE);
      let min = Infinity, max = -Infinity;
      for (let y = 0; y < TILE_SIZE; y += 1) {
        const fy = y / (TILE_SIZE - 1);
        const latitude = latNorth - fy;
        for (let x = 0; x < TILE_SIZE; x += 1) {
          const fx = x / (TILE_SIZE - 1);
          const signedLongitude = wrapLongitude(lonWest + fx);
          let height = this.sampleMeasured(region, latitude, signedLongitude);
          if (!Number.isFinite(height)) height = this.fallbackMacro(latitude, signedLongitude, region);
          const i = y * TILE_SIZE + x;
          heights[i] = height;
          if (height < min) min = height;
          if (height > max) max = height;
        }
        if (y > 0 && y % 24 === 0) await new Promise(resolve => window.setTimeout(resolve, 0));
      }
      return {
        lonWest: Math.floor(wrapLongitude(lonWest)),
        latNorth: Math.floor(latNorth),
        heights,
        min,
        max,
        regionId: region.id,
        sourceMode: this.activeMode,
        lastUsed: performance.now(),
        url: this.activeMode === "GTDR_4_6KM" ? `${GTDR_BASE}${region.frame}.img` : "procedural-fallback"
      };
    }

    async load(lonWest, latNorth) {
      const lon = Math.floor(wrapLongitude(lonWest));
      const lat = Math.floor(clamp(latNorth, -87, 88));
      const key = this.tileKey(lon, lat);
      if (this.cache.has(key)) {
        const tile = this.cache.get(key);
        tile.lastUsed = performance.now();
        return tile;
      }
      if (this.pending.has(key)) return this.pending.get(key);
      const generation = this.generation;
      const promise = this.generateTile(lon, lat).then(tile => {
        if (generation !== this.generation) throw new Error("Magellan terrain request cancelled.");
        this.cache.set(key, tile);
        this.trimCache();
        return tile;
      }).finally(() => this.pending.delete(key));
      this.pending.set(key, promise);
      return promise;
    }

    trimCache() {
      if (this.cache.size <= this.maxCache) return;
      const entries = [...this.cache.entries()].sort((a, b) => a[1].lastUsed - b[1].lastUsed);
      while (entries.length && this.cache.size > this.maxCache) {
        const [key] = entries.shift();
        this.cache.delete(key);
      }
    }

    sampleTile(tile, latitude, signedLongitude) {
      if (!tile) return null;
      const fx = clamp(shortestLongitudeDelta(tile.lonWest, signedLongitude), 0, 1) * (TILE_SIZE - 1);
      const fy = clamp(tile.latNorth - latitude, 0, 1) * (TILE_SIZE - 1);
      const x0 = Math.floor(fx), y0 = Math.floor(fy);
      const x1 = Math.min(TILE_SIZE - 1, x0 + 1), y1 = Math.min(TILE_SIZE - 1, y0 + 1);
      const tx = fx - x0, ty = fy - y0;
      const h00 = tile.heights[y0 * TILE_SIZE + x0];
      const h10 = tile.heights[y0 * TILE_SIZE + x1];
      const h01 = tile.heights[y1 * TILE_SIZE + x0];
      const h11 = tile.heights[y1 * TILE_SIZE + x1];
      return lerp(lerp(h00, h10, tx), lerp(h01, h11, tx), ty);
    }

    sampleCached(latitude, signedLongitude) {
      const address = this.tileForLocation(latitude, signedLongitude);
      const tile = this.cache.get(this.tileKey(address.lonWest, address.latNorth));
      if (!tile) return null;
      tile.lastUsed = performance.now();
      return this.sampleTile(tile, latitude, signedLongitude);
    }

    statusLabel() {
      return this.activeMode === "GTDR_4_6KM"
        ? "MAGELLAN GTDR ~4.6 KM/PX · MAGELLAN RADAR · VENUS MICRO DETAIL"
        : "MAGELLAN GTDR UNAVAILABLE · SCIENCE-INFORMED FALLBACK + RADAR";
    }

    clearTiles() {
      this.generation += 1;
      this.cache.clear();
      this.pending.clear();
    }

    clear() {
      this.clearTiles();
      this.frames.clear();
      this.pendingFrames.clear();
    }
  }

  class VenusImageryProvider {
    constructor(quality, surfaceImage, terrainProvider) {
      this.quality = quality;
      this.provider = terrainProvider;
      this.region = LANDMARKS[0];
      this.patchCache = new Map();
      this.pendingPatches = new Map();
      this.generation = 0;
      this.maxPatchCache = quality.name === "HIGH" ? 84 : quality.name === "MEDIUM" ? 60 : 40;
      this.sourceLabel = "Magellan GTDR elevation · NASA/JPL Magellan radar";

      this.sourceCanvas = document.createElement("canvas");
      this.sourceCanvas.width = Math.max(512, surfaceImage?.width || 2048);
      this.sourceCanvas.height = Math.max(256, surfaceImage?.height || Math.round(this.sourceCanvas.width / 2));
      const context = this.sourceCanvas.getContext("2d", { willReadFrequently: true });
      context.drawImage(surfaceImage, 0, 0, this.sourceCanvas.width, this.sourceCanvas.height);
      this.sourcePixels = context.getImageData(0, 0, this.sourceCanvas.width, this.sourceCanvas.height).data;
      this.sourceWidth = this.sourceCanvas.width;
      this.sourceHeight = this.sourceCanvas.height;
    }

    setRegion(region) {
      this.region = region || LANDMARKS[0];
    }

    profileForAltitude(altitudeKm) {
      const altitude = clamp(altitudeKm, 0, MAX_EXPLORATION_ALTITUDE_KM);
      const textureSize = Math.min(this.quality.textureSize, altitude <= 2.5 ? 512 : altitude <= 7 ? 384 : altitude <= 14 ? 256 : 160);
      const detailStrength = altitude <= 2.5 ? 1 : altitude <= 7 ? 0.78 : altitude <= 14 ? 0.48 : 0.22;
      return { textureSize, detailStrength, key: `${this.region.id}-r${textureSize}-d${Math.round(detailStrength * 100)}` };
    }

    radarPixel(latitude, signedLongitude) {
      const u = ((wrapLongitude(signedLongitude) + 180) / 360 + 1) % 1;
      const v = clamp((90 - latitude) / 180, 0, 1);
      const x = Math.min(this.sourceWidth - 1, Math.max(0, Math.floor(u * (this.sourceWidth - 1))));
      const y = Math.min(this.sourceHeight - 1, Math.max(0, Math.floor(v * (this.sourceHeight - 1))));
      const i = (y * this.sourceWidth + x) * 4;
      return [this.sourcePixels[i], this.sourcePixels[i + 1], this.sourcePixels[i + 2]];
    }

    paletteFor(profile) {
      if (profile === "shield") return { low: [78, 49, 36], mid: [129, 82, 54], high: [168, 116, 72], dark: [52, 34, 30] };
      if (profile === "mountain") return { low: [83, 62, 50], mid: [132, 101, 76], high: [184, 153, 112], dark: [52, 43, 38] };
      if (profile === "ishtar") return { low: [91, 67, 53], mid: [145, 109, 79], high: [181, 145, 105], dark: [57, 44, 38] };
      if (profile === "tessera") return { low: [74, 57, 49], mid: [130, 96, 70], high: [184, 143, 98], dark: [45, 38, 35] };
      return { low: [80, 57, 44], mid: [136, 93, 64], high: [177, 128, 85], dark: [50, 39, 34] };
    }

    async buildPatch(lonWest, latNorth, profile) {
      const key = `${this.region.id}:${lonWest},${latNorth}:${profile.key}`;
      if (this.patchCache.has(key)) {
        const cached = this.patchCache.get(key);
        cached.lastUsed = performance.now();
        return cached.canvas;
      }
      if (this.pendingPatches.has(key)) return this.pendingPatches.get(key);
      const generation = this.generation;
      const promise = (async () => {
        const size = profile.textureSize;
        const canvas = document.createElement("canvas");
        canvas.width = size;
        canvas.height = size;
        const context = canvas.getContext("2d", { alpha: false });
        const image = context.createImageData(size, size);
        const palette = this.paletteFor(this.region.profile);
        const data = image.data;
        const rowsPerYield = this.quality.name === "HIGH" ? 12 : this.quality.name === "MEDIUM" ? 16 : 24;

        for (let y = 0; y < size; y += 1) {
          const fy = y / Math.max(1, size - 1);
          const latitude = latNorth - fy;
          for (let x = 0; x < size; x += 1) {
            const fx = x / Math.max(1, size - 1);
            const signedLongitude = wrapLongitude(lonWest + fx);
            const radar = this.radarPixel(latitude, signedLongitude);
            const radarLum = clamp((radar[0] * 0.299 + radar[1] * 0.587 + radar[2] * 0.114) / 255, 0, 1);
            const signal = this.provider.materialSignal(latitude, signedLongitude, this.region);
            const macroHeight = this.provider.sampleCached(latitude, signedLongitude);
            const heightTone = Number.isFinite(macroHeight) ? clamp((macroHeight + 2) / 12, 0, 1) : 0.45;
            const localNoise = this.provider.valueNoise(
              shortestLongitudeDelta(wrapLongitude(this.region.longitudeEast > 180 ? this.region.longitudeEast - 360 : this.region.longitudeEast), signedLongitude) * 800,
              (latitude - this.region.latitude) * 800,
              34,
              211
            ) * 0.5 + 0.5;
            const tone = clamp(0.38 + radarLum * 0.42 + heightTone * 0.13 + (localNoise - 0.5) * 0.10 * profile.detailStrength, 0, 1);
            const base = tone < 0.52 ? palette.low : tone < 0.76 ? palette.mid : palette.high;
            const t = tone < 0.52 ? tone / 0.52 : tone < 0.76 ? (tone - 0.52) / 0.24 : (tone - 0.76) / 0.24;
            const next = tone < 0.52 ? palette.mid : tone < 0.76 ? palette.high : palette.high;
            const darkMix = clamp(signal.dark * 0.55 + signal.rough * 0.10 - signal.smooth * 0.14, 0, 0.62);
            const i = (y * size + x) * 4;
            for (let c = 0; c < 3; c += 1) {
              const mixed = lerp(base[c], next[c], clamp(t, 0, 1));
              data[i + c] = Math.round(lerp(mixed, palette.dark[c], darkMix));
            }
            data[i + 3] = 255;
          }
          if (y > 0 && y % rowsPerYield === 0) await new Promise(resolve => window.setTimeout(resolve, 0));
        }
        context.putImageData(image, 0, 0);
        if (generation !== this.generation) return null;
        this.patchCache.set(key, { canvas, lastUsed: performance.now() });
        this.trimPatchCache();
        return canvas;
      })().finally(() => this.pendingPatches.delete(key));
      this.pendingPatches.set(key, promise);
      return promise;
    }

    trimPatchCache() {
      if (this.patchCache.size <= this.maxPatchCache) return;
      const entries = [...this.patchCache.entries()].sort((a, b) => a[1].lastUsed - b[1].lastUsed);
      while (entries.length && this.patchCache.size > this.maxPatchCache) {
        const [key] = entries.shift();
        this.patchCache.delete(key);
      }
    }

    prefetch(lonWest, latNorth, profile) {
      this.buildPatch(lonWest, latNorth, profile).catch(() => {});
    }

    clearPatches() {
      this.generation += 1;
      this.patchCache.clear();
      this.pendingPatches.clear();
    }

    clear() {
      this.clearPatches();
      this.sourcePixels = null;
      this.sourceCanvas = null;
    }
  }

  class TerrainManager {
    constructor(THREE, scene, provider, imagery, surfaceImage, quality) {
      this.THREE = THREE;
      this.scene = scene;
      this.provider = provider;
      this.imagery = imagery;
      this.quality = quality;
      this.meshes = new Map();
      this.requestGeneration = 0;
      this.origin = { latitude: 0, signedLongitude: 0 };
      this.lastCenterTile = "";
      this.lastTextureProfile = "";
      this.group = new THREE.Group();
      this.scene.add(this.group);
      this.detailTexture = this.createVenusMicroDetailTexture();

      // View-dependent terrain manager state. Three.js already performs mesh-level
      // frustum culling, but we also keep an explicit visibility state so expensive
      // texture upgrades and terrain shader detail are spent only where the camera
      // can actually benefit from them.
      this.frustum = new THREE.Frustum();
      this.projectionScreenMatrix = new THREE.Matrix4();
      this.cameraForward = new THREE.Vector3();
      this.chunkCenter = new THREE.Vector3();
      this.chunkVector = new THREE.Vector3();
      this.visibilityStats = { visible: 0, buffered: 0, culled: 0, high: 0, medium: 0, low: 0 };
      this.debugEnabled = typeof location !== "undefined" && new URLSearchParams(location.search).get("venusTerrainDebug") === "1";
      this.lastDebugLog = 0;

      // The orbit renderer only has a 2K global color map, so it is retained as
      // a continuity placeholder only. Scientific surface color is upgraded per
      // a geographic Magellan radar patch plus deterministic Venus material detail.
      // Expensive texture work is still promoted only for visible / safety-buffer chunks.
      this.sourceCanvas = document.createElement("canvas");
      this.sourceCanvas.width = surfaceImage.width || 2048;
      this.sourceCanvas.height = surfaceImage.height || 1024;
      const sourceContext = this.sourceCanvas.getContext("2d", { willReadFrequently: true });
      sourceContext.drawImage(surfaceImage, 0, 0, this.sourceCanvas.width, this.sourceCanvas.height);
      this.sourcePixels = sourceContext.getImageData(0, 0, this.sourceCanvas.width, this.sourceCanvas.height).data;
      this.sourceWidth = this.sourceCanvas.width;
      this.sourceHeight = this.sourceCanvas.height;
    }

    createVenusMicroDetailTexture() {
      const THREE = this.THREE;
      const size = this.quality.name === "HIGH" ? 512 : this.quality.name === "MEDIUM" ? 384 : 256;
      const canvas = document.createElement("canvas");
      canvas.width = size;
      canvas.height = size;
      const context = canvas.getContext("2d", { willReadFrequently: true });
      const image = context.createImageData(size, size);
      const data = image.data;

      // Periodic value noise keeps the texture seamless when repeated across
      // adjacent one-degree terrain tiles. This is deliberately micro-detail only:
      // geographic identity comes from Magellan macro relief/radar plus region-specific Venus geology.
      const hash = (x, y, seed) => {
        let h = Math.imul((x + seed * 17) | 0, 374761393) ^ Math.imul((y - seed * 29) | 0, 668265263);
        h = Math.imul(h ^ (h >>> 13), 1274126177);
        return ((h ^ (h >>> 16)) >>> 0) / 4294967295;
      };
      const fade = t => t * t * (3 - 2 * t);
      const wrapCell = (value, cells) => ((value % cells) + cells) % cells;
      const periodicNoise = (u, v, cells, seed) => {
        const px = u * cells;
        const py = v * cells;
        const x0 = Math.floor(px);
        const y0 = Math.floor(py);
        const tx = fade(px - x0);
        const ty = fade(py - y0);
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
          const broad = periodicNoise(u, v, 7, 11);
          const mid = periodicNoise(u, v, 17, 23);
          const fine = periodicNoise(u, v, 43, 47);
          const grit = periodicNoise(u, v, 91, 71);
          const ridge = 1 - Math.abs(mid * 2 - 1);
          const sparseRock = Math.max(0, (grit - 0.78) / 0.22);
          const height = clamp(0.43 + (broad - 0.5) * 0.26 + (mid - 0.5) * 0.24 + (fine - 0.5) * 0.16 + ridge * 0.08 + sparseRock * 0.13, 0.08, 0.94);
          const value = Math.round(height * 255);
          const i = (y * size + x) * 4;
          data[i] = value;
          data[i + 1] = value;
          data[i + 2] = value;
          data[i + 3] = 255;
        }
      }
      context.putImageData(image, 0, 0);

      const texture = new THREE.CanvasTexture(canvas);
      texture.colorSpace = THREE.NoColorSpace;
      texture.wrapS = THREE.RepeatWrapping;
      texture.wrapT = THREE.RepeatWrapping;
      texture.minFilter = THREE.LinearMipmapLinearFilter;
      texture.magFilter = THREE.LinearFilter;
      texture.generateMipmaps = true;
      texture.anisotropy = this.quality.anisotropy || 4;
      // Custom terrain shaders sample this texture in world-space triplanar coordinates.
      // Keep the texture transform neutral; geographic continuity comes from world space,
      // not from resetting a UV phase at every one-degree tile boundary.
      texture.repeat.set(1, 1);
      texture.needsUpdate = true;
      return texture;
    }

    configureTerrainMaterial(material, tile) {
      if (!material || !tile) return material;

      // Keep bumpMap attached so Three compiles derivative helpers, but use a
      // view-dependent uniform to decide how many triplanar layers are worth
      // sampling for this chunk. Tier 3 is the exact premium near-field path;
      // lower tiers only remove detail that is sub-pixel at that distance.
      material.bumpMap = this.detailTexture;
      material.bumpScale = 0.001;
      const materialProfile = this.provider.activeRegion?.profile || "aphrodite";
      const geologicalRoughness = {
        shield: 0.82,       // volcanic plains / flow units
        mountain: 0.95,     // rough highland rock
        ishtar: 0.86,       // smoother plateau + rough margins
        tessera: 0.97,      // intensely fractured terrain
        aphrodite: 0.92     // tectonic highland / lava-filled lows
      };
      material.roughness = geologicalRoughness[materialProfile] ?? 0.91;
      material.userData.venusMaterialProfile = materialProfile;
      material.userData.venusDetailTier = material.userData.venusDetailTier ?? 3;

      material.onBeforeCompile = shader => {
        shader.uniforms.uVenusMicroDetail = { value: this.detailTexture };
        shader.uniforms.uVenusAlbedoDetail = { value: this.quality.name === "HIGH" ? 0.24 : this.quality.name === "MEDIUM" ? 0.19 : 0.13 };
        shader.uniforms.uVenusNormalDetail = { value: this.quality.name === "HIGH" ? 7.2 : this.quality.name === "MEDIUM" ? 5.4 : 3.8 };
        shader.uniforms.uVenusDetailTier = { value: material.userData.venusDetailTier };

        shader.vertexShader = shader.vertexShader
          .replace("#include <common>", "#include <common>\nvarying vec3 vVenusWorldPosition;")
          .replace("#include <begin_vertex>", "#include <begin_vertex>\nvVenusWorldPosition = (modelMatrix * vec4(transformed, 1.0)).xyz;");

        shader.fragmentShader = shader.fragmentShader
          .replace("#include <common>", `#include <common>
            varying vec3 vVenusWorldPosition;
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
            vec3 venusDx = dFdx(vVenusWorldPosition);
            vec3 venusDy = dFdy(vVenusWorldPosition);
            vec3 venusGeomNormal = normalize(cross(venusDx, venusDy));
            if (!gl_FrontFacing) venusGeomNormal = -venusGeomNormal;

            float venusViewDistance = length(cameraPosition - vVenusWorldPosition);
            float venusNearWeight = 1.0 - smoothstep(1.25, 15.0, venusViewDistance);
            float venusMidWeight = 1.0 - smoothstep(7.0, 46.0, venusViewDistance);

            float venusBroad = 0.5;
            float venusFine = 0.5;
            float venusGrit = 0.5;
            float venusRock = 0.0;

            // Uniform branches let horizon / distant chunks skip expensive texture
            // samples. Visible terrain near the camera still executes all three
            // triplanar frequencies exactly as before.
            if (uVenusDetailTier > 0.5) {
              venusBroad = venusTriSample(uVenusMicroDetail, vVenusWorldPosition, venusGeomNormal, 0.18, vec3(0.17, 0.41, 0.73));
            }
            if (uVenusDetailTier > 1.5) {
              venusFine = venusTriSample(uVenusMicroDetail, vVenusWorldPosition, venusGeomNormal, 0.92, vec3(0.61, 0.13, 0.37));
            }
            if (uVenusDetailTier > 2.5) {
              venusGrit = venusTriSample(uVenusMicroDetail, vVenusWorldPosition, venusGeomNormal, 2.35, vec3(0.29, 0.83, 0.07));
              venusRock = smoothstep(0.68, 0.92, venusGrit);
            }

            float venusMicro = (venusBroad - 0.5) * 0.44 * venusMidWeight
              + (venusFine - 0.5) * 0.40 * venusNearWeight
              + (venusGrit - 0.5) * 0.16 * venusNearWeight
              + venusRock * 0.08 * venusNearWeight;
            float venusMicroHeight = ((venusBroad - 0.5) * 0.52 * venusMidWeight
              + (venusFine - 0.5) * 0.34 * venusNearWeight
              + (venusGrit - 0.5) * 0.14 * venusNearWeight);

            diffuseColor.rgb *= clamp(1.0 + venusMicro * uVenusAlbedoDetail, 0.86, 1.14);`)
          .replace("#include <normal_fragment_maps>", `#include <normal_fragment_maps>
            #ifdef USE_BUMPMAP
              if (uVenusDetailTier > 0.5) {
                vec2 venusMicroSlope = vec2(dFdx(venusMicroHeight), dFdy(venusMicroHeight));
                normal = perturbNormalArb(-vViewPosition, normal, venusMicroSlope * uVenusNormalDetail, faceDirection);
              }
            #endif`)
          .replace("#include <roughnessmap_fragment>", `#include <roughnessmap_fragment>
            if (uVenusDetailTier > 2.5) {
              roughnessFactor = clamp(roughnessFactor + (0.5 - venusGrit) * 0.065 + venusRock * 0.035, 0.80, 0.985);
            }`);

        material.userData.venusShader = shader;
      };
      material.customProgramCacheKey = () => `antara-venus-terrain-triplanar-viewlod-v6-${this.quality.name}`;
      material.needsUpdate = true;
      return material;
    }

    setEntryDetailTier(entry, tier) {
      if (!entry?.mesh?.material) return;
      const clampedTier = clamp(Math.round(tier), 0, 3);
      if (entry.detailTier === clampedTier) return;
      entry.detailTier = clampedTier;
      const material = entry.mesh.material;
      material.userData.venusDetailTier = clampedTier;
      const shader = material.userData.venusShader;
      if (shader?.uniforms?.uVenusDetailTier) shader.uniforms.uVenusDetailTier.value = clampedTier;
      const transitionMaterial = entry.textureTransition?.overlay?.material;
      if (transitionMaterial) {
        transitionMaterial.userData.venusDetailTier = clampedTier;
        const overlayShader = transitionMaterial.userData.venusShader;
        if (overlayShader?.uniforms?.uVenusDetailTier) overlayShader.uniforms.uVenusDetailTier.value = clampedTier;
      }
    }

    entryRingFromCamera(entry, cameraGeo) {
      if (!entry || !cameraGeo) return 99;
      const center = this.provider.tileForLocation(cameraGeo.latitude, cameraGeo.signedLongitude);
      const dx = Math.abs(shortestLongitudeDelta(center.lonWest, entry.lonWest));
      const dy = Math.abs(center.latNorth - entry.latNorth);
      return Math.max(dx, dy);
    }

    updateViewDependent(camera, altitudeKm, velocity = null, now = performance.now()) {
      if (!camera || !this.meshes.size) return this.visibilityStats;

      camera.updateMatrixWorld();
      this.group.updateMatrixWorld(true);
      this.projectionScreenMatrix.multiplyMatrices(camera.projectionMatrix, camera.matrixWorldInverse);
      this.frustum.setFromProjectionMatrix(this.projectionScreenMatrix);
      camera.getWorldDirection(this.cameraForward).normalize();
      const cameraGeo = this.geoFromWorld(camera.position.x, camera.position.z);
      // Fine/grit shader weights already reach zero at ~15 km view distance. Only
      // after that point do we cap visible chunks to the broad-detail tier, so this
      // removes wasted samples rather than changing a contribution the user can see.
      const maxTierForAltitude = altitudeKm >= 15 ? 1 : 3;
      const speed = velocity ? Math.hypot(velocity.x || 0, velocity.y || 0, velocity.z || 0) : 0;
      const stats = { visible: 0, buffered: 0, culled: 0, high: 0, medium: 0, low: 0 };
      // Preserve the existing LOD rules, but do not synchronously rebuild every newly
      // visible geometry in the same frame. Two swaps per frame is enough to converge
      // quickly while avoiding the sharp camera-turn hitch seen on Venus.
      let geometrySwapsRemaining = 2;

      for (const entry of this.meshes.values()) {
        const mesh = entry.mesh;
        const sphere = mesh.geometry.boundingSphere;
        if (!sphere) mesh.geometry.computeBoundingSphere();
        const bounds = mesh.geometry.boundingSphere;
        this.chunkCenter.copy(bounds.center).applyMatrix4(mesh.matrixWorld);
        this.chunkVector.copy(this.chunkCenter).sub(camera.position);
        const centerDistance = Math.max(0.0001, this.chunkVector.length());
        const surfaceDistance = Math.max(0, centerDistance - bounds.radius);
        const facing = this.chunkVector.dot(this.cameraForward) / centerDistance;
        const inFrustum = this.frustum.intersectsObject(mesh);

        // Safety buffer keeps nearby / side chunks alive so a fast 180-degree turn
        // never exposes a void. Only the deep rear sector is deactivated entirely.
        const bufferDistance = Math.max(52, 34 + altitudeKm * 2.4 + speed * 1.5);
        const inSafetyBuffer = !inFrustum && facing > -0.62 && surfaceDistance < bufferDistance;
        const active = inFrustum || inSafetyBuffer;
        mesh.visible = active;
        entry.frustumVisible = inFrustum;
        entry.bufferVisible = inSafetyBuffer;
        entry.lastSurfaceDistance = surfaceDistance;

        const ring = this.entryRingFromCamera(entry, cameraGeo);
        if (inFrustum) {
          const desiredSegments = this.segmentsForAltitudeRing(ring, altitudeKm);
          if (entry.segments !== desiredSegments && geometrySwapsRemaining > 0) {
            this.swapEntryGeometry(entry, desiredSegments);
            geometrySwapsRemaining -= 1;
          }
        }

        let detailTier = 0;
        if (inFrustum) {
          const nearLimit = this.quality.name === "HIGH" ? 28 : this.quality.name === "MEDIUM" ? 22 : 16;
          const midLimit = this.quality.name === "HIGH" ? 82 : this.quality.name === "MEDIUM" ? 64 : 48;
          detailTier = surfaceDistance <= nearLimit ? 3 : surfaceDistance <= midLimit ? 2 : 1;
          detailTier = Math.min(detailTier, maxTierForAltitude);
        }
        this.setEntryDetailTier(entry, detailTier);

        if (inFrustum) {
          stats.visible += 1;
          if (detailTier === 3) stats.high += 1;
          else if (detailTier === 2) stats.medium += 1;
          else stats.low += 1;
        } else if (inSafetyBuffer) {
          stats.buffered += 1;
        } else {
          stats.culled += 1;
        }

        // Texture streaming is visibility-aware. The current / visible terrain can
        // still request the full scientific profile, while buffered chunks are only
        // warmed conservatively and deep rear chunks do zero imagery work.
        const elapsed = now - (entry.lastViewTextureRequest || 0);
        if (inFrustum && elapsed > 650) {
          entry.lastViewTextureRequest = now;
          const textureRing = detailTier >= 3 ? ring : ring + (detailTier === 2 ? 1 : 2);
          this.upgradeEntryTexture(entry, altitudeKm, textureRing).catch(() => {});
        } else if (inSafetyBuffer && elapsed > 1800 && ring <= 2) {
          entry.lastViewTextureRequest = now;
          this.upgradeEntryTexture(entry, Math.max(altitudeKm, 12), ring + 2).catch(() => {});
        }
      }

      this.visibilityStats = stats;
      if (this.debugEnabled && now - this.lastDebugLog > 1000) {
        this.lastDebugLog = now;
        console.debug("[ANTARA Venus terrain]", { ...stats, altitudeKm: Number(altitudeKm.toFixed(2)), chunks: this.meshes.size });
      }
      return stats;
    }

    setOrigin(latitude, longitudeEast) {
      this.origin.latitude = clamp(latitude, MIN_DATA_LAT, MAX_DATA_LAT);
      this.origin.signedLongitude = wrapLongitude(longitudeEast > 180 ? longitudeEast - 360 : longitudeEast);
      this.lastCenterTile = "";
    }

    worldFromGeo(latitude, signedLongitude) {
      const cosLatitude = Math.max(0.08, Math.cos(this.origin.latitude * DEG));
      const dLon = shortestLongitudeDelta(this.origin.signedLongitude, signedLongitude);
      return {
        x: dLon * KM_PER_DEG_LAT * cosLatitude,
        z: -(latitude - this.origin.latitude) * KM_PER_DEG_LAT
      };
    }

    geoFromWorld(x, z) {
      const cosLatitude = Math.max(0.08, Math.cos(this.origin.latitude * DEG));
      const latitude = clamp(this.origin.latitude - z / KM_PER_DEG_LAT, MIN_DATA_LAT, MAX_DATA_LAT);
      const signedLongitude = wrapLongitude(this.origin.signedLongitude + x / (KM_PER_DEG_LAT * cosLatitude));
      return { latitude, signedLongitude, longitudeEast: eastLongitude(signedLongitude) };
    }

    subMagellanDetailHeight(latitude, signedLongitude, strength = 1) {
      return this.provider.detailHeight(latitude, signedLongitude, strength, this.provider.activeRegion);
    }

    detailStrengthForSegments() {
      // Keep chunk-edge heights identical across LOD rings. The LOD difference comes
      // from tessellation density, not from changing the terrain function itself.
      return 1;
    }

    desiredRadius() {
      return this.quality.radius;
    }

    segmentsForRing(ring) {
      if (ring === 0) return this.quality.nearSegments;
      if (ring === 1) return this.quality.midSegments;
      if (ring === 2) return this.quality.farSegments;
      return this.quality.horizonSegments || this.quality.farSegments;
    }

    segmentsForOffset(dx, dy) {
      return this.segmentsForRing(Math.max(Math.abs(dx), Math.abs(dy)));
    }

    segmentsForAltitudeRing(ring, altitudeKm) {
      // Geometry LOD is conservative at low altitude. At higher altitude the fine
      // tessellation is sub-pixel, so reduce only those rings where it is visually
      // redundant. The same deterministic height function + skirts keeps seams stable.
      if (altitudeKm >= 24) {
        if (ring === 0) return this.quality.midSegments;
        if (ring === 1) return this.quality.farSegments;
        return this.quality.horizonSegments || this.quality.farSegments;
      }
      return this.segmentsForRing(ring);
    }

    async ensureAround(latitude, signedLongitude, { requiredRadius = 1, onProgress = null, textureAltitude = MAX_EXPLORATION_ALTITUDE_KM } = {}) {
      const center = this.provider.tileForLocation(latitude, signedLongitude);
      const radius = this.desiredRadius();
      const generation = ++this.requestGeneration;
      const desired = new Map();
      const mandatory = [];
      const optional = [];

      for (let dy = -radius; dy <= radius; dy += 1) {
        for (let dx = -radius; dx <= radius; dx += 1) {
          const lonWest = Math.floor(wrapLongitude(center.lonWest + dx));
          const latNorth = center.latNorth - dy;
          if (latNorth > 88 || latNorth < -87) continue;
          const segments = this.segmentsForOffset(dx, dy);
          // Tile identity is independent from LOD. Moving across a boundary now reuses
          // the existing tile material / textures and only swaps geometry when needed.
          const key = this.provider.tileKey(lonWest, latNorth);
          const entry = { key, lonWest, latNorth, segments, dx, dy };
          desired.set(key, entry);
          if (Math.max(Math.abs(dx), Math.abs(dy)) <= requiredRadius) mandatory.push(entry);
          else optional.push(entry);
        }
      }

      // Keep the previous safety ring alive until replacement chunks are ready.
      // This avoids one-frame black/missing squares while crossing tile boundaries.
      let completed = 0;
      const total = Math.max(1, mandatory.length);
      const makeRecord = (entry, tile, mesh) => ({
        mesh,
        tile,
        lonWest: entry.lonWest,
        latNorth: entry.latNorth,
        segments: entry.segments,
        geometryCache: new Map([[entry.segments, mesh.geometry]]),
        textureProfile: "fallback",
        textureLoading: "",
        textureToken: 0,
        detailTier: 3,
        frustumVisible: undefined,
        bufferVisible: false,
        lastViewTextureRequest: 0
      });

      const loadEntry = async entry => {
        if (generation !== this.requestGeneration) return;
        const ring = Math.max(Math.abs(entry.dx), Math.abs(entry.dy));
        if (this.meshes.has(entry.key)) {
          const existing = this.meshes.get(entry.key);
          this.swapEntryGeometry(existing, entry.segments);
          // Mandatory chunks are either the camera tile or its immediate safety ring,
          // so keep their scientific imagery current. Materials/textures are reused.
          await this.upgradeEntryTexture(existing, textureAltitude, ring);
          completed += 1;
          onProgress?.(completed / total);
          return;
        }
        const tile = await this.provider.load(entry.lonWest, entry.latNorth);
        if (generation !== this.requestGeneration) return;
        const mesh = this.createTileMesh(tile, entry.segments);
        this.group.add(mesh);
        const record = makeRecord(entry, tile, mesh);
        this.meshes.set(entry.key, record);
        await this.primeEntryTexture(record, textureAltitude, ring);
        completed += 1;
        onProgress?.(completed / total);
      };

      await Promise.all(mandatory.map(loadEntry));
      if (generation !== this.requestGeneration) return;
      this.lastCenterTile = this.provider.tileKey(center.lonWest, center.latNorth);

      // Outer coverage is created with a fallback albedo but is NOT immediately sent
      // through the expensive high-resolution radar/material path. Venus terrain creation
      // is substantially more CPU-heavy than Mars because each vertex carries regional
      // geology. Stream optional chunks one per animation frame so crossing a tile boundary
      // cannot bunch dozens of geometry builds / LOD swaps into one long main-thread spike.
      const streamOptional = async () => {
        for (const entry of optional) {
          if (generation !== this.requestGeneration) return;
          const existing = this.meshes.get(entry.key);
          if (existing) {
            this.swapEntryGeometry(existing, entry.segments);
          } else {
            const tile = await this.provider.load(entry.lonWest, entry.latNorth);
            if (generation !== this.requestGeneration) return;
            const mesh = this.createTileMesh(tile, entry.segments);
            this.group.add(mesh);
            const record = makeRecord(entry, tile, mesh);
            this.meshes.set(entry.key, record);
            // Start background chunks at shader tier 0. The next visibility pass promotes
            // only terrain that actually enters the camera or its safety buffer.
            this.setEntryDetailTier(record, 0);
          }
          await new Promise(resolve => window.requestAnimationFrame(() => resolve()));
        }
        if (generation === this.requestGeneration) this.prune(desired);
      };
      streamOptional().catch(() => {});
    }

    maybeStream(latitude, signedLongitude, altitudeKm) {
      const center = this.provider.tileForLocation(latitude, signedLongitude);
      const key = this.provider.tileKey(center.lonWest, center.latNorth);
      const profileKey = this.imagery.profileForAltitude(altitudeKm, latitude).key;
      if (key === this.lastCenterTile && profileKey === this.lastTextureProfile) return;
      this.lastTextureProfile = profileKey;
      if (key === this.lastCenterTile) {
        this.refreshTextureLOD(altitudeKm, latitude, signedLongitude);
        return;
      }
      this.ensureAround(latitude, signedLongitude, { requiredRadius: 0, textureAltitude: altitudeKm }).catch(() => {});
    }

    createFallbackAlbedo(tile) {
      const THREE = this.THREE;
      const size = Math.min(192, this.quality.textureSize);
      const canvas = document.createElement("canvas");
      canvas.width = size;
      canvas.height = size;
      const context = canvas.getContext("2d");
      context.imageSmoothingEnabled = true;
      context.imageSmoothingQuality = "high";

      const sourceX = ((tile.lonWest + 180) / 360) * this.sourceWidth;
      const sourceY = ((90 - tile.latNorth) / 180) * this.sourceHeight;
      const sourceW = this.sourceWidth / 360;
      const sourceH = this.sourceHeight / 180;
      context.drawImage(this.sourceCanvas, sourceX, sourceY, sourceW, sourceH, 0, 0, size, size);

      const texture = new THREE.CanvasTexture(canvas);
      texture.colorSpace = THREE.SRGBColorSpace;
      texture.wrapS = THREE.ClampToEdgeWrapping;
      texture.wrapT = THREE.ClampToEdgeWrapping;
      texture.minFilter = THREE.LinearMipmapLinearFilter;
      texture.magFilter = THREE.LinearFilter;
      texture.generateMipmaps = true;
      texture.anisotropy = this.quality.anisotropy || 4;
      texture.needsUpdate = true;
      return texture;
    }

    createMagellanNormalMap(tile, segments) {
      const THREE = this.THREE;
      const size = this.quality.name === "HIGH" ? 256 : this.quality.name === "MEDIUM" ? 192 : TILE_SIZE;
      const data = new Uint8Array(size * size * 4);
      const detailScale = this.detailStrengthForSegments(segments);
      const stepDeg = 1 / Math.max(96, size - 1);
      const centerLat = tile.latNorth - 0.5;
      const spacingX = Math.max(0.04, stepDeg * KM_PER_DEG_LAT * Math.cos(centerLat * DEG));
      const spacingZ = Math.max(0.04, stepDeg * KM_PER_DEG_LAT);
      const sampleStride = size + 2;
      const sampledHeights = new Float32Array(sampleStride * sampleStride);
      let out = 0;

      // Build one shared height field including a one-sample border. The previous
      // version evaluated surfaceHeight four times for every normal texel, which is
      // especially expensive for Venus because each call includes Magellan sampling
      // plus region geology/fBM. One expanded grid preserves the exact same central
      // difference and cross-tile border continuity with roughly a quarter of those calls.
      for (let y = -1; y <= size; y += 1) {
        const fy = y / Math.max(1, size - 1);
        const latitude = clamp(tile.latNorth - fy, MIN_DATA_LAT, MAX_DATA_LAT);
        for (let x = -1; x <= size; x += 1) {
          const fx = x / Math.max(1, size - 1);
          const lon = wrapLongitude(tile.lonWest + fx);
          sampledHeights[(y + 1) * sampleStride + (x + 1)] = this.provider.surfaceHeight(latitude, lon, detailScale);
        }
      }

      for (let y = 0; y < size; y += 1) {
        const row = y + 1;
        for (let x = 0; x < size; x += 1) {
          const col = x + 1;
          const left = sampledHeights[row * sampleStride + col - 1];
          const right = sampledHeights[row * sampleStride + col + 1];
          const north = sampledHeights[(row - 1) * sampleStride + col];
          const south = sampledHeights[(row + 1) * sampleStride + col];
          const dx = (right - left) / Math.max(spacingX * 2, 0.001);
          const dz = (south - north) / Math.max(spacingZ * 2, 0.001);
          let nx = -dx * 0.64, ny = 1, nz = -dz * 0.64;
          const length = Math.hypot(nx, ny, nz) || 1;
          nx /= length; ny /= length; nz /= length;
          data[out++] = Math.round((nx * 0.5 + 0.5) * 255);
          data[out++] = Math.round((ny * 0.5 + 0.5) * 255);
          data[out++] = Math.round((nz * 0.5 + 0.5) * 255);
          data[out++] = 255;
        }
      }
      const texture = new THREE.DataTexture(data, size, size, THREE.RGBAFormat);
      texture.wrapS = THREE.ClampToEdgeWrapping;
      texture.wrapT = THREE.ClampToEdgeWrapping;
      texture.minFilter = THREE.LinearMipmapLinearFilter;
      texture.magFilter = THREE.LinearFilter;
      texture.generateMipmaps = true;
      texture.anisotropy = this.quality.anisotropy || 4;
      texture.needsUpdate = true;
      return texture;
    }

    textureFromCanvas(canvas) {
      const THREE = this.THREE;
      const texture = new THREE.CanvasTexture(canvas);
      texture.colorSpace = THREE.SRGBColorSpace;
      texture.wrapS = THREE.ClampToEdgeWrapping;
      texture.wrapT = THREE.ClampToEdgeWrapping;
      texture.minFilter = THREE.LinearMipmapLinearFilter;
      texture.magFilter = THREE.LinearFilter;
      texture.generateMipmaps = true;
      texture.anisotropy = this.quality.anisotropy || 4;
      texture.needsUpdate = true;
      return texture;
    }

    cancelTextureTransition(entry, disposeCandidate = true) {
      const transition = entry?.textureTransition;
      if (!transition) return;
      transition.cancelled = true;
      const overlay = transition.overlay;
      if (overlay?.parent) overlay.parent.remove(overlay);
      if (overlay?.material) {
        overlay.material.map = null;
        overlay.material.normalMap = null;
        overlay.material.dispose?.();
      }
      if (disposeCandidate && transition.texture && transition.texture !== entry.mesh?.material?.map) {
        transition.texture.dispose?.();
      }
      entry.textureTransition = null;
    }

    async crossfadeEntryTexture(entry, nextTexture, requestToken) {
      if (!entry?.mesh?.parent || requestToken !== entry.textureToken) {
        nextTexture.dispose?.();
        return false;
      }
      this.cancelTextureTransition(entry);
      const mesh = entry.mesh;
      const THREE = this.THREE;
      const overlayMaterial = new THREE.MeshStandardMaterial({
        map: nextTexture,
        normalMap: mesh.material.normalMap,
        normalMapType: THREE.ObjectSpaceNormalMap,
        roughness: mesh.material.roughness,
        metalness: 0,
        color: 0xffffff,
        side: THREE.FrontSide,
        transparent: true,
        opacity: 0,
        depthWrite: false,
        polygonOffset: true,
        polygonOffsetFactor: -1,
        polygonOffsetUnits: -1,
        dithering: true
      });
      overlayMaterial.userData.venusDetailTier = entry.detailTier ?? 0;
      this.configureTerrainMaterial(overlayMaterial, entry.tile);
      const overlay = new THREE.Mesh(mesh.geometry, overlayMaterial);
      overlay.frustumCulled = mesh.frustumCulled;
      overlay.renderOrder = 1;
      mesh.add(overlay);
      const transition = { overlay, texture: nextTexture, cancelled: false };
      entry.textureTransition = transition;

      const reduced = window.matchMedia?.("(prefers-reduced-motion: reduce)")?.matches;
      const duration = reduced ? 0 : 240;
      if (duration > 0) {
        const start = performance.now();
        await new Promise(resolve => {
          const frame = now => {
            if (transition.cancelled || requestToken !== entry.textureToken || !mesh.parent) return resolve();
            const t = smoothstep((now - start) / duration);
            overlayMaterial.opacity = t;
            if (t < 1) requestAnimationFrame(frame);
            else resolve();
          };
          requestAnimationFrame(frame);
        });
      }

      if (transition.cancelled || requestToken !== entry.textureToken || !mesh.parent) {
        if (entry.textureTransition === transition) this.cancelTextureTransition(entry);
        else nextTexture.dispose?.();
        return false;
      }

      const previous = mesh.material.map;
      mesh.material.map = nextTexture;
      mesh.material.needsUpdate = true;
      if (overlay.parent) overlay.parent.remove(overlay);
      overlayMaterial.map = null;
      overlayMaterial.normalMap = null;
      overlayMaterial.dispose();
      entry.textureTransition = null;
      if (previous && previous !== nextTexture) previous.dispose?.();
      return true;
    }

    async upgradeEntryTexture(entry, altitudeKm, ring = 0) {
      if (!entry?.mesh || !entry.tile || !this.imagery) return;
      const latitude = entry.latNorth - 0.5;
      const ringPenalty = this.quality.name === "HIGH" ? 3.5 : this.quality.name === "MEDIUM" ? 5.0 : 7.0;
      const visualAltitude = clamp(altitudeKm + ring * ringPenalty, 0, MAX_EXPLORATION_ALTITUDE_KM);
      const profile = this.imagery.profileForAltitude(visualAltitude, latitude);
      if (entry.textureProfile === profile.key || entry.textureLoading === profile.key) return;
      const requestToken = (entry.textureToken || 0) + 1;
      entry.textureToken = requestToken;
      entry.textureLoading = profile.key;
      try {
        const canvas = await this.imagery.buildPatch(entry.lonWest, entry.latNorth, profile);
        if (!canvas || requestToken !== entry.textureToken || !entry.mesh.parent) return;
        const nextTexture = this.textureFromCanvas(canvas);
        const applied = await this.crossfadeEntryTexture(entry, nextTexture, requestToken);
        if (applied && requestToken === entry.textureToken) entry.textureProfile = profile.key;
      } catch {
        // Keep the current lower LOD texture if the higher detail source is unavailable.
      } finally {
        if (entry.textureLoading === profile.key) entry.textureLoading = "";
      }
    }

    async primeEntryTexture(entry, altitudeKm, ring = 0) {
      if (!entry?.mesh) return;
      const latitude = entry.latNorth - 0.5;
      const ringPenalty = this.quality.name === "HIGH" ? 3.5 : this.quality.name === "MEDIUM" ? 5.0 : 7.0;
      const desiredAltitude = clamp(altitudeKm + ring * ringPenalty, 0, MAX_EXPLORATION_ALTITUDE_KM);
      const desiredProfile = this.imagery.profileForAltitude(desiredAltitude, latitude);
      const coarseProfile = this.imagery.profileForAltitude(MAX_EXPLORATION_ALTITUDE_KM, latitude);
      if (entry.textureProfile === "fallback" && coarseProfile.key !== desiredProfile.key) {
        await this.upgradeEntryTexture(entry, MAX_EXPLORATION_ALTITUDE_KM, 0);
      }
      await this.upgradeEntryTexture(entry, altitudeKm, ring);
    }

    refreshTextureLOD(altitudeKm, latitude, signedLongitude) {
      const center = this.provider.tileForLocation(latitude, signedLongitude);
      const now = performance.now();
      for (const entry of this.meshes.values()) {
        const dx = Math.abs(shortestLongitudeDelta(center.lonWest, entry.lonWest));
        const dy = Math.abs(center.latNorth - entry.latNorth);
        const ring = Math.max(dx, dy);

        // Never run a full imagery refresh over the deep rear/off-screen field.
        // The camera tile is always allowed; other tiles are refreshed only if the
        // previous visibility pass marked them visible or in the safety buffer.
        const shouldRefresh = ring === 0 || entry.frustumVisible === true || entry.bufferVisible === true;
        if (!shouldRefresh) continue;
        if (now - (entry.lastViewTextureRequest || 0) < 480) continue;
        entry.lastViewTextureRequest = now;
        const penalty = entry.frustumVisible === true ? 0 : 2;
        this.upgradeEntryTexture(entry, altitudeKm, ring + penalty).catch(() => {});
      }
    }

    prefetchAhead(latitude, signedLongitude, altitudeKm) {
      const address = this.provider.tileForLocation(latitude, signedLongitude);
      this.provider.load(address.lonWest, address.latNorth).catch(() => {});
      const profile = this.imagery.profileForAltitude(altitudeKm, latitude);
      const coarse = this.imagery.profileForAltitude(MAX_EXPLORATION_ALTITUDE_KM, latitude);
      this.imagery.prefetch(address.lonWest, address.latNorth, coarse);
      if (profile.key !== coarse.key) this.imagery.prefetch(address.lonWest, address.latNorth, profile);
    }

    createTileGeometry(tile, segments) {
      const THREE = this.THREE;
      const verticesPerSide = segments + 1;
      const topVertexCount = verticesPerSide * verticesPerSide;
      const skirtVertexCount = verticesPerSide * 8;
      const positions = new Float32Array((topVertexCount + skirtVertexCount) * 3);
      const uvs = new Float32Array((topVertexCount + skirtVertexCount) * 2);
      const topHeights = new Float32Array(topVertexCount);
      const indices = [];
      let p = 0;
      let uv = 0;
      let heightCursor = 0;
      const detailScale = this.detailStrengthForSegments(segments);

      for (let iz = 0; iz <= segments; iz += 1) {
        const fz = iz / segments;
        const latitude = tile.latNorth - fz;
        for (let ix = 0; ix <= segments; ix += 1) {
          const fx = ix / segments;
          const signedLongitude = wrapLongitude(tile.lonWest + fx);
          const world = this.worldFromGeo(latitude, signedLongitude);
          const baseHeight = this.provider.sampleTile(tile, latitude, signedLongitude);
          const height = baseHeight + this.subMagellanDetailHeight(latitude, signedLongitude, detailScale);
          topHeights[heightCursor++] = height;
          positions[p++] = world.x;
          positions[p++] = height;
          positions[p++] = world.z;
          uvs[uv++] = fx;
          uvs[uv++] = 1 - fz;
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

      const skirtDepth = 0.09;
      let skirtCursor = topVertexCount;
      const addSkirt = edge => {
        const skirtTop = [];
        const skirtBottom = [];
        for (const sourceIndex of edge) {
          const sourceP = sourceIndex * 3;
          const sourceUv = sourceIndex * 2;
          const topIndex = skirtCursor++;
          const bottomIndex = skirtCursor++;
          for (const [targetIndex, yOffset] of [[topIndex, 0], [bottomIndex, -skirtDepth]]) {
            const targetP = targetIndex * 3;
            const targetUv = targetIndex * 2;
            positions[targetP] = positions[sourceP];
            positions[targetP + 1] = positions[sourceP + 1] + yOffset;
            positions[targetP + 2] = positions[sourceP + 2];
            uvs[targetUv] = uvs[sourceUv];
            uvs[targetUv + 1] = uvs[sourceUv + 1];
          }
          skirtTop.push(topIndex);
          skirtBottom.push(bottomIndex);
        }
        for (let i = 0; i < edge.length - 1; i += 1) {
          const a = skirtTop[i];
          const b = skirtTop[i + 1];
          const sa = skirtBottom[i];
          const sb = skirtBottom[i + 1];
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

      const geometry = new THREE.BufferGeometry();
      geometry.setAttribute("position", new THREE.BufferAttribute(positions, 3));
      geometry.setAttribute("uv", new THREE.BufferAttribute(uvs, 2));
      geometry.setIndex(indices);
      geometry.computeVertexNormals();

      // Reuse the already-generated height grid for terrain normals. The rejected
      // implementation called the expensive Venus surfaceHeight pipeline four more
      // times for every vertex. Interior vertices now use their immediate grid
      // neighbours; only the outer border samples one step beyond the tile so adjacent
      // chunks still calculate matching shared-edge normals.
      const normals = geometry.getAttribute("normal");
      const normalStep = 1 / Math.max(1, segments);
      const spacingLat = Math.max(0.04, normalStep * KM_PER_DEG_LAT);
      const spacingLon = Math.max(0.04, normalStep * KM_PER_DEG_LAT * Math.cos((tile.latNorth - 0.5) * DEG));
      let topIndex = 0;
      for (let iz = 0; iz <= segments; iz += 1) {
        const latitude = tile.latNorth - iz / segments;
        for (let ix = 0; ix <= segments; ix += 1, topIndex += 1) {
          const lon = wrapLongitude(tile.lonWest + ix / segments);
          const hL = ix > 0
            ? topHeights[topIndex - 1]
            : this.provider.surfaceHeight(latitude, wrapLongitude(lon - normalStep), detailScale);
          const hR = ix < segments
            ? topHeights[topIndex + 1]
            : this.provider.surfaceHeight(latitude, wrapLongitude(lon + normalStep), detailScale);
          const hN = iz > 0
            ? topHeights[topIndex - verticesPerSide]
            : this.provider.surfaceHeight(clamp(latitude + normalStep, MIN_DATA_LAT, MAX_DATA_LAT), lon, detailScale);
          const hS = iz < segments
            ? topHeights[topIndex + verticesPerSide]
            : this.provider.surfaceHeight(clamp(latitude - normalStep, MIN_DATA_LAT, MAX_DATA_LAT), lon, detailScale);
          let nx = -(hR - hL) / Math.max(spacingLon * 2, 0.001);
          let ny = 1;
          let nz = -(hS - hN) / Math.max(spacingLat * 2, 0.001);
          const n = Math.hypot(nx, ny, nz) || 1;
          normals.setXYZ(topIndex, nx / n, ny / n, nz / n);
        }
      }
      normals.needsUpdate = true;
      geometry.computeBoundingSphere();

      return geometry;
    }

    createTileMesh(tile, segments) {
      const THREE = this.THREE;
      const geometry = this.createTileGeometry(tile, segments);
      const tileTexture = this.createFallbackAlbedo(tile);
      const normalTexture = this.createMagellanNormalMap(tile, segments);
      const material = new THREE.MeshStandardMaterial({
        map: tileTexture,
        normalMap: normalTexture,
        normalMapType: THREE.ObjectSpaceNormalMap,
        roughness: 0.90,
        metalness: 0,
        color: 0xffffff,
        side: THREE.FrontSide,
        dithering: true
      });
      this.configureTerrainMaterial(material, tile);
      const mesh = new THREE.Mesh(geometry, material);
      mesh.frustumCulled = true;
      mesh.userData.magellanTile = `${tile.lonWest},${tile.latNorth}`;
      mesh.userData.surfaceTexture = tileTexture;
      mesh.userData.normalTexture = normalTexture;
      return mesh;
    }

    swapEntryGeometry(entry, segments) {
      if (!entry?.mesh || !entry.tile || !segments || entry.segments === segments) return;
      entry.geometryCache = entry.geometryCache || new Map([[entry.segments, entry.mesh.geometry]]);
      let geometry = entry.geometryCache.get(segments);
      if (!geometry) {
        geometry = this.createTileGeometry(entry.tile, segments);
        entry.geometryCache.set(segments, geometry);
      }
      entry.mesh.geometry = geometry;
      for (const child of entry.mesh.children) {
        if (child?.isMesh) child.geometry = geometry;
      }
      entry.segments = segments;

      // Keep at most two geometry variants per tile. This avoids rebuilding every
      // frame while also preventing a long traversal from accumulating every LOD.
      if (entry.geometryCache.size > 2) {
        for (const [cachedSegments, cachedGeometry] of entry.geometryCache) {
          if (cachedSegments === segments || cachedGeometry === entry.mesh.geometry) continue;
          cachedGeometry.dispose?.();
          entry.geometryCache.delete(cachedSegments);
          break;
        }
      }
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
      this.disposeMesh(entry.mesh);
    }

    disposeMesh(mesh) {
      for (const child of [...mesh.children]) {
        if (!child?.material) continue;
        if (child.material.map && child.material.map !== mesh.material?.map) child.material.map.dispose?.();
        child.material.map = null;
        child.material.normalMap = null;
        child.material.dispose?.();
        mesh.remove(child);
      }
      mesh.geometry.dispose();
      mesh.material?.map?.dispose?.();
      mesh.material?.normalMap?.dispose?.();
      mesh.material?.dispose?.();
    }

    prune(desired) {
      for (const [key, entry] of this.meshes) {
        if (desired.has(key)) continue;
        this.cancelTextureTransition(entry);
        this.group.remove(entry.mesh);
        this.disposeEntry(entry);
        this.meshes.delete(key);
      }
    }

    getHeightAtWorld(x, z) {
      const geo = this.geoFromWorld(x, z);
      const base = this.provider.sampleCached(geo.latitude, geo.signedLongitude);
      if (base === null) return null;
      return base + this.subMagellanDetailHeight(geo.latitude, geo.signedLongitude, 1);
    }

    clearMeshes() {
      this.requestGeneration += 1;
      for (const entry of this.meshes.values()) {
        this.cancelTextureTransition(entry);
        this.group.remove(entry.mesh);
        this.disposeEntry(entry);
      }
      this.meshes.clear();
      this.lastCenterTile = "";
      this.lastTextureProfile = "";
    }

    dispose() {
      this.clearMeshes();
      this.group.removeFromParent();
      this.detailTexture?.dispose?.();
      this.detailTexture = null;
      this.sourcePixels = null;
      this.sourceCanvas = null;
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
      this.pointerLockSupported = typeof document !== "undefined" && "pointerLockElement" in document;
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
        if (document.pointerLockElement === this.controller.viewport) {
          document.exitPointerLock?.();
          this.clear();
          return;
        }
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
      if (event.target.closest("button, a, [data-venus-ui]")) return;
      if (event.pointerType === "mouse") {
        if (event.button !== 0) return;
        this.controller.dismissTutorial();
        if (this.controller.viewport.requestPointerLock) {
          if (document.pointerLockElement !== this.controller.viewport) {
            try { this.controller.viewport.requestPointerLock(); } catch {}
          }
          return;
        }
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
      this.pointerActions.set(event.pointerId, button.dataset.venusControl);
      button.classList.add("is-held");
      this.controller.dismissTutorial();
    }

    onControlEnd(event) {
      const action = this.pointerActions.get(event.pointerId);
      this.pointerActions.delete(event.pointerId);
      if (!action) return;
      const button = event.currentTarget;
      button?.classList?.remove("is-held");
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

  window.VenusFullExploration = class VenusFullExploration {
    constructor(venusScene) {
      this.venus = venusScene;
      this.root = document.getElementById("venus-full-exploration");
      this.viewport = document.getElementById("venus-full-viewport");
      this.entryButton = document.getElementById("venus-full-explore-button");
      this.exitButton = document.getElementById("venus-full-exit");
      this.fullscreenButton = document.getElementById("venus-fullscreen-toggle");
      this.locationButton = document.getElementById("venus-location-toggle");
      this.locationMenu = document.getElementById("venus-location-menu");
      this.loading = document.getElementById("venus-full-loading");
      this.loadingProgress = document.getElementById("venus-full-loading-progress");
      this.loadingStatus = document.getElementById("venus-full-loading-status");
      this.errorPanel = document.getElementById("venus-full-error");
      this.errorMessage = document.getElementById("venus-full-error-message");
      this.errorReturn = document.getElementById("venus-full-error-return");
      this.tutorial = document.getElementById("venus-full-tutorial");
      this.tutorialClose = document.getElementById("venus-tutorial-close");
      this.travelVeil = document.getElementById("venus-travel-veil");
      this.travelLabel = document.getElementById("venus-travel-label");
      this.infoCard = document.getElementById("venus-landmark-card");
      this.infoName = document.getElementById("venus-landmark-name");
      this.infoType = document.getElementById("venus-landmark-type");
      this.infoCoords = document.getElementById("venus-landmark-coords");
      this.infoSource = document.getElementById("venus-landmark-source");
      this.infoCoordinateSource = document.getElementById("venus-landmark-coordinate-source");
      this.infoTopographySource = document.getElementById("venus-landmark-topography-source");
      this.infoImage = document.getElementById("venus-landmark-image");
      this.infoDescription = document.getElementById("venus-landmark-description");
      this.infoFacts = document.getElementById("venus-landmark-facts");
      this.infoDataBadge = document.getElementById("venus-landmark-data-badge");
      this.hudCoordinates = document.getElementById("venus-hud-coordinates");
      this.hudAltitude = document.getElementById("venus-hud-altitude");
      this.hudAltitudeLimit = document.getElementById("venus-hud-altitude-limit");
      this.hudSpeed = document.getElementById("venus-hud-speed");
      this.hudLocation = document.getElementById("venus-hud-location");
      this.hudQuality = document.getElementById("venus-hud-quality");
      this.hudData = document.getElementById("venus-hud-data");

      this.state = STATES.IDLE;
      this.prepared = false;
      this.preparingPromise = null;
      this.resourceGeneration = 0;
      this.frame = null;
      this.previous = 0;
      this.elapsed = 0;
      this.streamClock = 0;
      this.statsClock = 0;
      this.statsFrames = 0;
      this.debugFrames = 0;
      this.debugWindowStart = 0;
      this.lowFpsWindows = 0;
      this.highFpsWindows = 0;
      this.lastGround = 0;
      this.cameraAltitude = 2.8;
      this.speed = 0;
      this.yaw = 0.18;
      this.pitch = -0.28;
      this.lookYawTarget = this.yaw;
      this.lookPitchTarget = this.pitch;
      this.velocity = { x: 0, y: 0, z: 0 };
      this.currentLandmark = LANDMARKS[0];
      this.transitionToken = 0;
      this.infoTimeout = null;
      this.tutorialTimeout = null;
      this.quality = this.detectQuality();
      this.input = new VenusInputManager(this);
      this.tick = this.tick.bind(this);

      this.root.inert = true;
      this.buildLocationMenu();
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

      // Do not classify a strong high-DPI desktop as LOW simply because DPR makes
      // its theoretical pixel count large. Quality selection is capability based;
      // the render-pixel budget below controls the actual resolution separately.
      if (coarse || width <= 760 || cores <= 4 || memory <= 3) {
        return { name: "LOW", radius: 1, nearSegments: 96, midSegments: 52, farSegments: 28, horizonSegments: 22, maxDpr: 1.45, minDpr: 0.92, supersample: 1, pixelBudget: 3000000, anisotropy: 4, radarDetailLevel: 6, structuralDetailLevel: 8, textureSize: 336 };
      }
      if (cores >= 8 && memory >= 6) {
        // Spend the geometry budget where a game would: dense centre chunk, progressively
        // lighter rings toward the horizon. This is materially sharper near the camera
        // without multiplying every distant tile to the same cost.
        return { name: "HIGH", radius: 3, nearSegments: 320, midSegments: 176, farSegments: 80, horizonSegments: 36, maxDpr: 2.4, minDpr: 1.10, supersample: 1.62, pixelBudget: 12000000, anisotropy: 16, radarDetailLevel: 7, structuralDetailLevel: 9, textureSize: 768 };
      }
      return { name: "MEDIUM", radius: 2, nearSegments: 192, midSegments: 112, farSegments: 48, horizonSegments: 32, maxDpr: 2.0, minDpr: 1.0, supersample: 1.30, pixelBudget: 7200000, anisotropy: 8, radarDetailLevel: 7, structuralDetailLevel: 8, textureSize: 544 };
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
      this.errorReturn.addEventListener("click", () => this.failBackToOrbit());
      this.tutorialClose.addEventListener("click", () => this.dismissTutorial(true));
      this.locationButton.addEventListener("click", event => {
        event.stopPropagation();
        const open = !this.locationMenu.classList.contains("is-open");
        this.locationMenu.classList.toggle("is-open", open);
        this.locationButton.setAttribute("aria-expanded", String(open));
      });
      this.locationMenu.addEventListener("click", event => {
        const button = event.target.closest("[data-landmark]");
        if (!button) return;
        this.locationMenu.classList.remove("is-open");
        this.locationButton.setAttribute("aria-expanded", "false");
        const landmark = LANDMARKS.find(item => item.id === button.dataset.landmark);
        if (landmark) this.travelToLandmark(landmark);
      });
      this.fullscreenButton.addEventListener("click", () => this.toggleFullscreen());
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
      document.addEventListener("pointerdown", event => {
        if (!this.active || !this.locationMenu.classList.contains("is-open")) return;
        if (event.target.closest("#venus-location-menu, #venus-location-toggle")) return;
        this.locationMenu.classList.remove("is-open");
        this.locationButton.setAttribute("aria-expanded", "false");
      });
    }

    buildLocationMenu() {
      const fragment = document.createDocumentFragment();
      LANDMARKS.forEach(landmark => {
        const button = document.createElement("button");
        button.type = "button";
        button.setAttribute("role", "menuitem");
        button.dataset.landmark = landmark.id;
        button.innerHTML = `<span>${landmark.name}</span><small>${formatCoordinate(landmark.latitude, landmark.longitudeEast)}</small>`;
        fragment.append(button);
      });
      this.locationMenu.replaceChildren(fragment);
    }

    async enter() {
      if (this.active || !this.venus.active) return;
      if (this.venus.exploring) this.venus.exitExploration();
      this.state = STATES.PREPARING;
      this.transitionToken += 1;
      const token = this.transitionToken;
      this.root.hidden = false;
      this.root.inert = false;
      this.root.setAttribute("aria-hidden", "false");
      this.root.classList.add("is-preparing");
      this.root.classList.remove("is-error", "is-surface-visible", "is-active", "is-exiting");
      this.loading.hidden = false;
      this.errorPanel.hidden = true;
      this.setLoading(0.04, "MENYIAPKAN ENGINE PERMUKAAN VENUS");
      this.entryButton.disabled = true;
      this.venus.caption.inert = true;
      document.getElementById("mission").classList.add("is-venus-full");
      document.getElementById("announcement").textContent = "Menyiapkan Eksplorasi Pengalaman Penuh Venus.";

      try {
        await this.prepare();
        if (token !== this.transitionToken || this.state !== STATES.PREPARING) {
          if (this.state === STATES.IDLE) this.disposeSurface();
          return;
        }
        const landmark = this.currentLandmark || LANDMARKS[0];
        this.setLoading(0.10, `MENYIAPKAN DATA MAGELLAN · ${landmark.name.toUpperCase()}`);
        await this.provider.prepareRegion(landmark);
        if (token !== this.transitionToken || this.state !== STATES.PREPARING) return;
        this.imagery.setRegion(landmark);
        this.hudData.textContent = this.provider.statusLabel();
        this.terrain.setOrigin(landmark.latitude, landmark.longitudeEast);
        this.setLoading(0.18, `MEMUAT PERMUKAAN ${landmark.name.toUpperCase()}`);
        await this.terrain.ensureAround(landmark.latitude, wrapLongitude(landmark.longitudeEast > 180 ? landmark.longitudeEast - 360 : landmark.longitudeEast), {
          requiredRadius: 1,
          textureAltitude: 2.8,
          onProgress: progress => this.setLoading(0.18 + progress * 0.72, "STREAMING CHUNK MAGELLAN + MATERIAL VENUS")
        });
        if (token !== this.transitionToken || this.state !== STATES.PREPARING) return;
        this.setCameraAtLandmark(landmark, { altitude: 58 });
        this.setLoading(1, "PERMUKAAN SIAP");
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
        await this.venus.prepare();
        if (generation !== this.resourceGeneration) throw new Error("Venus exploration preparation cancelled.");
        const THREE = this.venus.THREE;
        if (!THREE || !this.venus.surface) throw new Error("WebGL surface renderer tidak tersedia pada perangkat ini.");
        this.THREE = THREE;

        const canvas = document.createElement("canvas");
        canvas.className = "venus-full-canvas";
        canvas.setAttribute("aria-hidden", "true");
        const context = canvas.getContext("webgl2", {
          alpha: true,
          antialias: this.quality.name !== "LOW",
          powerPreference: "high-performance"
        });
        if (!context) throw new Error("WebGL2 diperlukan untuk terrain Venus 3D.");

        this.renderer = new THREE.WebGLRenderer({ canvas, context, alpha: true, antialias: this.quality.name !== "LOW" });
        this.renderer.outputColorSpace = THREE.SRGBColorSpace;
        this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
        this.renderer.toneMappingExposure = 1.045;
        this.quality.anisotropy = Math.min(this.quality.anisotropy, this.renderer.capabilities.getMaxAnisotropy());
        this.idealDpr = this.calculateIdealDpr();
        this.currentDpr = this.idealDpr;
        this.renderer.setPixelRatio(this.currentDpr);
        // Venus' dense atmospheric haze doubles as the low-cost horizon layer. The
        // terrain boundary is fully attenuated into this colour before the active
        // Mars-style chunk ring ends, so the player never sees a black/square void.
        this.renderer.setClearColor(0xa55f45, 1);
        this.viewport.replaceChildren(canvas);

        this.scene = new THREE.Scene();
        const fogDensity = this.quality.name === "LOW" ? 0.0060 : this.quality.name === "MEDIUM" ? 0.0052 : 0.0047;
        this.scene.fog = new THREE.FogExp2(0xa55f45, fogDensity);
        this.camera = new THREE.PerspectiveCamera(this.mobileFov(), 1, 0.035, 850);
        this.camera.rotation.order = "YXZ";

        const sun = new THREE.DirectionalLight(0xffd5af, 3.2);
        sun.position.set(-70, 95, 45);
        this.scene.add(sun);
        const hemi = new THREE.HemisphereLight(0xe2a27a, 0x401b15, 0.40);
        this.scene.add(hemi);
        const fill = new THREE.DirectionalLight(0x8b6a65, 0.12);
        fill.position.set(40, 18, -55);
        this.scene.add(fill);

        this.moveForward = new THREE.Vector3();
        this.moveRight = new THREE.Vector3();
        this.moveUp = new THREE.Vector3(0, 1, 0);
        this.moveIntent = new THREE.Vector3();

        this.provider = new MagellanTileProvider();
        this.provider.maxCache = this.quality.name === "HIGH" ? 112 : this.quality.name === "MEDIUM" ? 84 : 52;
        this.imagery = new VenusImageryProvider(this.quality, this.venus.surface, this.provider);
        this.terrain = new TerrainManager(THREE, this.scene, this.provider, this.imagery, this.venus.surface, this.quality);
        this.hudQuality.textContent = this.quality.name;
        this.hudData.textContent = this.provider.statusLabel();
        this.resize();
        if (generation !== this.resourceGeneration) {
          this.renderer.dispose();
          this.renderer.domElement?.remove();
          this.renderer = null;
          this.terrain?.dispose();
          this.terrain = null;
          this.provider?.clear();
          this.provider = null;
          this.imagery?.clear();
          this.imagery = null;
          throw new Error("Venus exploration preparation cancelled.");
        }
        this.prepared = true;
      })();
      this.preparingPromise = promise;
      try {
        await promise;
      } finally {
        if (this.preparingPromise === promise) this.preparingPromise = null;
      }
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

    mobileFov() {
      return window.innerWidth <= 760 ? 70 : 66;
    }

    setLoading(progress, status) {
      const percent = clamp(progress, 0, 1);
      this.loadingProgress.style.transform = `scaleX(${percent})`;
      this.loadingStatus.textContent = status;
    }

    showError(error) {
      console.warn("Venus Full Exploration:", error);
      this.stopLoop();
      this.input.unbind();
      this.state = STATES.ERROR;
      this.loading.hidden = true;
      this.errorPanel.hidden = false;
      this.errorMessage.textContent = /MAGELLAN|tile|terrain/i.test(error.message)
        ? "Data elevasi MAGELLAN tidak dapat dimuat. Mode orbit Venus tetap aman. Periksa koneksi internet atau host tile MAGELLAN secara lokal."
        : error.message;
      this.root.classList.add("is-error");
      this.root.classList.remove("is-preparing", "is-active", "is-surface-visible");
      this.entryButton.disabled = false;
      document.getElementById("announcement").textContent = "Eksplorasi permukaan Venus belum dapat dimuat. Panorama Venus tetap tersedia.";
    }

    failBackToOrbit() {
      this.transitionToken += 1;
      this.state = STATES.IDLE;
      this.stopLoop();
      this.input.unbind();
      this.root.className = "mars-full-exploration venus-full-exploration";
      this.root.hidden = true;
      this.root.inert = true;
      this.root.setAttribute("aria-hidden", "true");
      this.errorPanel.hidden = true;
      const pendingPreparation = this.preparingPromise;
      this.disposeSurface();
      this.entryButton.disabled = Boolean(pendingPreparation);
      if (pendingPreparation) {
        pendingPreparation.then(() => {}, () => {}).finally(() => {
          if (this.state === STATES.IDLE) this.entryButton.disabled = false;
        });
      }
      this.venus.setFullExplorationTransition?.(0, this.currentLandmark);
      this.venus.caption.inert = false;
      document.getElementById("mission").classList.remove("is-venus-full");
      if (!this.entryButton.disabled) this.entryButton.focus({ preventScroll: true });
    }

    async runEntryTransition(token) {
      this.state = STATES.ENTERING;
      this.root.classList.remove("is-preparing");
      this.root.classList.add("is-entering");
      this.loading.hidden = true;
      this.input.bind();
      this.startLoop();
      const reduced = this.venus.motion.matches;
      const duration = reduced ? 400 : 4700;
      const start = performance.now();
      const startAltitude = Math.max(46, this.cameraAltitude);
      const targetAltitude = 2.8;

      await new Promise(resolve => {
        const frame = now => {
          if (token !== this.transitionToken || this.state !== STATES.ENTERING) return resolve();
          const raw = clamp((now - start) / duration, 0, 1);
          const eased = smootherstep(raw);
          this.venus.setFullExplorationTransition?.(eased, this.currentLandmark);
          this.root.style.setProperty("--surface-opacity", String(smoothstep((raw - 0.48) / 0.40)));
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
      this.root.style.setProperty("--surface-opacity", "1");
      this.root.style.setProperty("--entry-progress", "1");
      this.velocity.x = this.velocity.y = this.velocity.z = 0;
      this.showTutorial();
      this.showLandmarkInfo(this.currentLandmark);
      document.getElementById("announcement").textContent = `Eksplorasi penuh Venus aktif di ${this.currentLandmark.name}. Gunakan WASD atau kontrol layar untuk bergerak.`;
    }

    setCameraAtLandmark(landmark, { altitude = 2.8 } = {}) {
      this.currentLandmark = landmark;
      this.yaw = landmark.heading || 0;
      this.pitch = -0.28;
      this.syncLookTargets();
      this.camera.position.x = 0;
      this.camera.position.z = 0;
      const ground = this.terrain.getHeightAtWorld(0, 0) ?? 0;
      this.lastGround = ground;
      this.cameraAltitude = altitude;
      this.camera.position.y = ground + altitude;
      this.camera.rotation.set(this.pitch, this.yaw, 0);
      this.updateHUD();
    }

    startLoop() {
      if (!this.active || document.hidden || this.frame) return;
      this.previous = performance.now();
      this.frame = requestAnimationFrame(this.tick);
    }

    stopLoop() {
      cancelAnimationFrame(this.frame);
      this.frame = null;
    }

    tick(now) {
      this.frame = null;
      if (!this.active || document.hidden || !this.prepared) return;
      const delta = Math.min((now - this.previous) / 1000, 0.1);
      this.previous = now;
      this.elapsed += delta;
      this.statsClock += delta;
      this.statsFrames += 1;

      if (this.state === STATES.EXPLORING) this.updateLook(delta);
      this.camera.rotation.set(this.pitch, this.yaw, 0);
      if (this.state === STATES.EXPLORING) this.updateMovement(delta);

      // Resolve chunk visibility/material LOD after the final camera movement for
      // this frame and before rendering. A fast turn therefore promotes the newly
      // visible terrain immediately, while the old rear sector can stop costing GPU.
      const viewAltitude = Math.max(0, this.camera.position.y - this.lastGround);
      this.terrain.updateViewDependent(this.camera, viewAltitude, this.velocity, now);
      this.renderer.render(this.scene, this.camera);

      if (this.terrain.debugEnabled) {
        if (!this.debugWindowStart) this.debugWindowStart = now;
        this.debugFrames += 1;
        const debugElapsed = now - this.debugWindowStart;
        if (debugElapsed >= 1000) {
          const renderInfo = this.renderer.info.render;
          console.debug("[ANTARA Venus render]", {
            fps: Number((this.debugFrames * 1000 / debugElapsed).toFixed(1)),
            frameMs: Number((debugElapsed / this.debugFrames).toFixed(2)),
            calls: renderInfo.calls,
            triangles: renderInfo.triangles,
            lines: renderInfo.lines,
            points: renderInfo.points,
            dpr: Number(this.currentDpr.toFixed(2)),
            chunks: { ...this.terrain.visibilityStats }
          });
          this.debugFrames = 0;
          this.debugWindowStart = now;
        }
      }
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

      // Ask Three.js for the actual camera direction. The previous hand-written
      // sin/cos formula had the X/Z signs opposite to the camera's positive yaw,
      // so W/A/S/D could slide across the world in a direction that did not match
      // where the user was looking. This keeps movement truly camera-relative.
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
      const rawTargetY = this.moveIntent.y * targetSpeed + axes.vertical * verticalSpeed;
      const targetY = rawTargetY > 0 ? rawTargetY * ascentFactor : rawTargetY;
      const moving = horizontalMagnitude > 0 || axes.vertical !== 0;
      const responseRate = moving ? 11.5 : 15.5;
      const response = 1 - Math.exp(-delta * responseRate);
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
        const altitude = clamp(this.camera.position.y - this.lastGround, 0, MAX_EXPLORATION_ALTITUDE_KM);
        this.terrain.maybeStream(geo.latitude, geo.signedLongitude, altitude);
        const lookAheadSeconds = clamp(1.4 + this.speed * 0.08, 1.4, 4.5);
        const aheadGeo = this.terrain.geoFromWorld(
          this.camera.position.x + this.velocity.x * lookAheadSeconds,
          this.camera.position.z + this.velocity.z * lookAheadSeconds
        );
        this.terrain.prefetchAhead(aheadGeo.latitude, aheadGeo.signedLongitude, altitude);
      }
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

    updateHUD() {
      if (!this.prepared || !this.camera) return;
      const geo = this.terrain.geoFromWorld(this.camera.position.x, this.camera.position.z);
      const ground = this.terrain.getHeightAtWorld(this.camera.position.x, this.camera.position.z);
      if (ground !== null) this.lastGround = ground;
      const altitude = Math.max(0, this.camera.position.y - this.lastGround);
      this.cameraAltitude = altitude;
      this.hudCoordinates.textContent = formatCoordinate(geo.latitude, geo.longitudeEast);
      const ceilingActive = this.state === STATES.EXPLORING || this.state === STATES.TRAVELLING;
      const displayAltitude = ceilingActive ? Math.min(altitude, MAX_EXPLORATION_ALTITUDE_KM) : altitude;
      this.hudAltitude.textContent = formatAltitude(displayAltitude);
      this.hudAltitudeLimit.hidden = !ceilingActive || altitude < ALTITUDE_LIMIT_WARNING_KM;
      this.hudAltitudeLimit.textContent = altitude >= MAX_EXPLORATION_ALTITUDE_KM - 0.02 ? "BATAS KETINGGIAN" : "MENDEKATI BATAS 30 KM";
      this.hudSpeed.textContent = formatSpeed(this.speed);
      this.hudLocation.textContent = this.nearestLocation(geo.latitude, geo.signedLongitude);
    }

    nearestLocation(latitude, signedLongitude) {
      let best = null;
      let bestDistance = Infinity;
      for (const landmark of LANDMARKS) {
        const landmarkLon = wrapLongitude(landmark.longitudeEast > 180 ? landmark.longitudeEast - 360 : landmark.longitudeEast);
        const dLat = (latitude - landmark.latitude) * KM_PER_DEG_LAT;
        const dLon = shortestLongitudeDelta(landmarkLon, signedLongitude) * KM_PER_DEG_LAT * Math.cos(latitude * DEG);
        const distance = Math.hypot(dLat, dLon);
        if (distance < bestDistance) { best = landmark; bestDistance = distance; }
      }
      return best && bestDistance < 180 ? best.name : "Permukaan Venus";
    }

    async travelToLandmark(landmark) {
      if (this.state !== STATES.EXPLORING || !landmark || landmark.id === this.currentLandmark?.id) return;
      this.state = STATES.TRAVELLING;
      this.input.clear();
      const token = ++this.transitionToken;
      this.travelLabel.textContent = `NAVIGASI · ${landmark.name.toUpperCase()}`;
      this.travelVeil.classList.add("is-visible");
      this.infoCard.classList.remove("is-visible");
      document.getElementById("announcement").textContent = `Terbang menuju ${landmark.name}.`;

      try {
        const cruiseAltitude = Math.min(MAX_EXPLORATION_ALTITUDE_KM - 2, Math.max(this.cameraAltitude, 24));
        await this.animateCameraAltitude(cruiseAltitude, 1350, token);
        if (token !== this.transitionToken || this.state !== STATES.TRAVELLING) return;
        this.travelVeil.classList.add("is-covered");
        await this.wait(360);
        if (token !== this.transitionToken) return;

        this.terrain.clearMeshes();
        this.provider.clearTiles();
        await this.provider.prepareRegion(landmark);
        if (token !== this.transitionToken || this.state !== STATES.TRAVELLING) return;
        this.imagery.setRegion(landmark);
        this.imagery.clearPatches();
        this.hudData.textContent = this.provider.statusLabel();
        this.terrain.setOrigin(landmark.latitude, landmark.longitudeEast);
        this.currentLandmark = landmark;
        this.yaw = landmark.heading || 0;
        this.pitch = -0.34;
        this.syncLookTargets();
        await this.terrain.ensureAround(landmark.latitude, wrapLongitude(landmark.longitudeEast > 180 ? landmark.longitudeEast - 360 : landmark.longitudeEast), { requiredRadius: 1, textureAltitude: 3.2 });
        if (token !== this.transitionToken) return;
        const ground = this.terrain.getHeightAtWorld(0, 0) ?? 0;
        this.lastGround = ground;
        this.camera.position.set(0, ground + cruiseAltitude, 0);
        this.travelVeil.classList.remove("is-covered");
        await this.animateCameraAltitude(3.2, 1850, token);
        if (token !== this.transitionToken) return;
        this.state = STATES.EXPLORING;
        this.travelVeil.classList.remove("is-visible");
        this.showLandmarkInfo(landmark);
        document.getElementById("announcement").textContent = `Tiba di ${landmark.name}. Eksplorasi bebas dilanjutkan.`;
      } catch (error) {
        console.warn("Venus landmark travel failed", error);
        this.state = STATES.EXPLORING;
        this.travelVeil.classList.remove("is-visible", "is-covered");
      }
    }

    animateCameraAltitude(targetAltitude, duration, token) {
      const ceilingApplies = this.state === STATES.EXPLORING || this.state === STATES.TRAVELLING;
      if (ceilingApplies) targetAltitude = Math.min(targetAltitude, MAX_EXPLORATION_ALTITUDE_KM);
      const startAltitude = this.cameraAltitude;
      const start = performance.now();
      return new Promise(resolve => {
        const frame = now => {
          if (token !== this.transitionToken) return resolve();
          const raw = clamp((now - start) / (this.venus.motion.matches ? 120 : duration), 0, 1);
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

    showLandmarkInfo(landmark) {
      window.clearTimeout(this.infoTimeout);
      this.infoName.textContent = landmark.name;
      this.infoType.textContent = landmark.type;
      this.infoCoords.textContent = formatCoordinate(landmark.latitude, landmark.longitudeEast);
      this.infoSource.href = landmark.scienceSource || landmark.source;
      this.infoCoordinateSource.href = landmark.source;
      this.infoTopographySource.href = "https://pds-geosciences.wustl.edu/missions/magellan/gxdr/index.htm";
      this.infoImage.src = landmark.radarImage || MAGELLAN_GLOBAL_RADAR;
      this.infoImage.alt = `Citra radar Magellan untuk konteks ${landmark.name}`;
      this.infoDescription.textContent = landmark.description || "";
      this.infoFacts.replaceChildren(...(landmark.facts || []).map(text => {
        const item = document.createElement("li");
        item.textContent = text;
        return item;
      }));
      this.infoDataBadge.textContent = this.provider?.activeMode === "GTDR_4_6KM"
        ? "MACRO RELIEF · MAGELLAN GTDR · CHUNKED WORLD"
        : "SCIENCE-INFORMED FALLBACK · CHUNKED WORLD";
      this.infoCard.classList.add("is-visible");
      this.infoTimeout = window.setTimeout(() => this.infoCard.classList.remove("is-visible"), 12000);
    }

    showTutorial() {
      let seen = false;
      try { seen = sessionStorage.getItem("antara-venus-full-tutorial") === "1"; } catch {}
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
        try { sessionStorage.setItem("antara-venus-full-tutorial", "1"); } catch {}
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
      this.locationMenu.classList.remove("is-open");
      this.locationButton.setAttribute("aria-expanded", "false");
      this.tutorial.classList.remove("is-visible");
      this.infoCard.classList.remove("is-visible");
      this.travelVeil.classList.remove("is-visible", "is-covered");
      this.root.classList.add("is-exiting");
      document.getElementById("announcement").textContent = "Meninggalkan permukaan Venus dan kembali ke panorama orbit.";

      if (this.prepared && this.camera) {
        try { await this.animateCameraAltitude(Math.max(this.cameraAltitude, 52), 1650, token); }
        catch {}
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
          this.venus.setFullExplorationTransition?.(1 - eased, this.currentLandmark);
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
      this.root.className = "mars-full-exploration venus-full-exploration";
      this.root.hidden = true;
      this.root.inert = true;
      this.root.setAttribute("aria-hidden", "true");
      this.root.style.removeProperty("--surface-opacity");
      this.root.style.removeProperty("--entry-progress");
      this.entryButton.disabled = false;
      this.venus.setFullExplorationTransition?.(0, this.currentLandmark);
      this.venus.caption.inert = false;
      document.getElementById("mission").classList.remove("is-venus-full");
      document.getElementById("announcement").textContent = "Kembali ke panorama Venus.";
      this.entryButton.focus({ preventScroll: true });
    }

    onVenusStop() {
      if (this.active) {
        this.transitionToken += 1;
        this.state = STATES.IDLE;
        this.stopLoop();
        this.input.unbind();
        this.root.hidden = true;
        this.root.inert = true;
        this.root.setAttribute("aria-hidden", "true");
        this.root.className = "mars-full-exploration venus-full-exploration";
        this.entryButton.disabled = false;
        document.getElementById("mission").classList.remove("is-venus-full");
      }
      this.disposeSurface();
      if (document.fullscreenElement === this.root) document.exitFullscreen().catch(() => {});
    }

    disposeSurface() {
      this.resourceGeneration += 1;
      this.stopLoop();
      this.input.unbind();
      if (this.terrain) {
        this.terrain.dispose();
        this.terrain = null;
      }
      this.provider?.clear();
      this.provider = null;
      this.imagery?.clear();
      this.imagery = null;
      if (this.renderer) {
        this.renderer.dispose();
        this.renderer.domElement?.remove();
        this.renderer = null;
      }
      this.scene = null;
      this.camera = null;
      this.prepared = false;
    }

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
      if (this.prepared) this.resize();
    }

    resize(recalculateDpr = true) {
      if (!this.prepared || !this.renderer || !this.camera) return;
      const width = Math.max(1, this.viewport.clientWidth);
      const height = Math.max(1, this.viewport.clientHeight);
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
