"use strict";

/* ANTARA Venus Full Exploration
 * Same exploration family as Mars/Earth: lazy Three.js renderer, pointer-lock/free-flight,
 * shared HUD language, one unified renderer for all Venus POIs, chunk streaming, LOD,
 * frustum culling, cinematic entry/exit, clean re-entry, and one reusable education card.
 *
 * Science pipeline:
 * - Macro elevation: NASA PDS Magellan GTDR sinusoidal framelets (~4.64 km/pixel) when reachable.
 * - Macro surface identity: NASA/JPL Magellan radar mosaic.
 * - Micro rendering: procedural rock/fracture detail only, never presented as measured topography.
 * - Fallback terrain exists only to keep the experience functional if remote PDS data cannot load.
 *   The HUD/card explicitly labels that fallback instead of presenting it as measured Magellan data.
 */
(() => {
  const DEG = Math.PI / 180;
  const VENUS_RADIUS_KM = 6051.0;
  const KM_PER_DEG = 2 * Math.PI * VENUS_RADIUS_KM / 360;
  const MAX_ALTITUDE_KM = 20;
  const MIN_CLEARANCE_KM = 0.28;
  const GTDR_RES = 22.755556;
  const GTDR_HEADER_BYTES = 2048;
  const GTDR_SAMPLES = 1024;
  const GTDR_RADIUS_OFFSET_M = 6039999;
  const GTDR_REFERENCE_RADIUS_M = 6051000;
  const GTDR_BASE = "https://pds-geosciences.wustl.edu/mgn/mgn-v-gxdr-v1/mg_3002/gtdr/sinus/";
  const MAGELLAN_GLOBAL_RADAR = "https://assets.science.nasa.gov/dynamicimage/assets/science/cds/3d/resources/image/venus/preview.webp?w=2048";

  const STATES = Object.freeze({
    IDLE: "IDLE", PREPARING: "PREPARING", ENTERING: "ENTERING", EXPLORING: "EXPLORING",
    TRAVELLING: "TRAVELLING", EXITING: "EXITING", ERROR: "ERROR"
  });

  const LOCATIONS = Object.freeze([
    {
      id: "maat", name: "Maat Mons", type: "Gunung api besar · Atla Regio", category: "VOLCANIC RISE",
      latitude: 0.50, longitudeEast: 194.60, heading: -0.18, profile: "shield", frame: "f09",
      frameMeta: { maxLat: 45, minLat: 0, minLon: 180 }, southFrame: "f17",
      description: "Maat Mons adalah salah satu gunung api besar di Atla Regio. Data radar dan altimetri Magellan menunjukkan edifikasi vulkanik yang luas di atas dataran sekitarnya, bukan kerucut simetris sederhana.",
      facts: [
        "Pusat nomenklatur IAU/USGS: 0,50°N · 194,60°E.",
        "Magellan mengamati bentuk gunung api, dataran vulkanik, dan aliran bertekstur radar di sekitarnya.",
        "Analisis ulang citra Magellan menemukan perubahan pada sebuah ventilasi antara dua pengamatan 1991, yang ditafsirkan sebagai bukti aktivitas vulkanik pada saat itu."
      ],
      coordinateSource: "https://planetarynames.wr.usgs.gov/Feature/3550",
      scienceSource: "https://www.jpl.nasa.gov/news/nasas-magellan-data-reveals-volcanic-activity-on-venus/",
      radarImage: "https://assets.science.nasa.gov/dynamicimage/assets/science/psd/photojournal/pia/pia00/pia00106/PIA00106.jpg?crop=faces%2Cfocalpoint&fit=clip&h=900&w=1200",
      radarLabel: "MAGELLAN RADAR + ALTIMETRI · SIMULATED COLOR"
    },
    {
      id: "maxwell", name: "Maxwell Montes", type: "Pegunungan tertinggi Venus", category: "MOUNTAIN BELT",
      latitude: 65.20, longitudeEast: 3.30, heading: 0.48, profile: "mountain", frame: "f05",
      frameMeta: { maxLat: 90, minLat: 45, minLon: 0 },
      description: "Maxwell Montes membentuk sabuk pegunungan berelief tinggi di tepi Ishtar Terra. Citra Magellan memperlihatkan punggungan dan lembah yang terorganisasi, bukan kumpulan puncak alpine acak.",
      facts: [
        "Pusat nomenklatur IAU/USGS: 65,20°N · 3,30°E.",
        "Wilayah Maxwell berhubungan langsung dengan dataran tinggi Ishtar Terra dan Lakshmi Planum.",
        "Radar Magellan memperlihatkan kontras antara dataran Lakshmi yang relatif halus dan terrain Maxwell yang jauh lebih kasar serta terdeformasi."
      ],
      coordinateSource: "https://planetarynames.wr.usgs.gov/Feature/3766",
      scienceSource: "https://science.nasa.gov/photojournal/venus-lakshmi-planum-and-maxwell-montes/",
      radarImage: "https://assets.science.nasa.gov/dynamicimage/assets/science/psd/photojournal/pia/pia00/pia00241/PIA00241.jpg?crop=faces%2Cfocalpoint&fit=clip&h=900&w=1200",
      radarLabel: "MAGELLAN FULL-RESOLUTION RADAR"
    },
    {
      id: "aphrodite", name: "Aphrodite Terra", type: "Dataran tinggi ekuatorial raksasa", category: "EQUATORIAL HIGHLAND",
      latitude: -5.80, longitudeEast: 104.80, heading: 0.12, profile: "highland", frame: "f23",
      frameMeta: { maxLat: 0, minLat: -45, minLon: 90 },
      description: "Aphrodite Terra adalah sistem dataran tinggi ekuatorial yang sangat luas. Wilayahnya mencakup plateau, ridge, chasmata, tessera, dan dataran yang telah mengalami sejarah deformasi serta vulkanisme kompleks.",
      facts: [
        "Pusat nomenklatur IAU/USGS: 5,80°S · 104,80°E.",
        "Ovda Regio di bagian barat Aphrodite Terra memperlihatkan beberapa generasi ridge, lembah, rekahan, dan lava pada radar Magellan.",
        "Aphrodite tidak direpresentasikan sebagai satu gunung tunggal; terrain di mode ini menggunakan konteks highland yang meluas ke horizon."
      ],
      coordinateSource: "https://planetarynames.wr.usgs.gov/Feature/317",
      scienceSource: "https://science.nasa.gov/photojournal/venus-ovda-regio/",
      radarImage: "https://assets.science.nasa.gov/dynamicimage/assets/science/psd/photojournal/pia/pia00/pia00146/PIA00146.jpg?crop=faces%2Cfocalpoint&fit=clip&h=900&w=1200",
      radarLabel: "MAGELLAN RADAR · OVDA REGIO / APHRODITE CONTEXT"
    },
    {
      id: "ishtar", name: "Ishtar Terra", type: "Dataran tinggi utara Venus", category: "PLATEAU + MOUNTAIN SYSTEM",
      latitude: 70.40, longitudeEast: 27.50, heading: -0.42, profile: "plateau", frame: "f05",
      frameMeta: { maxLat: 90, minLat: 45, minLon: 0 },
      description: "Ishtar Terra merupakan dataran tinggi utara yang mencakup Lakshmi Planum dan sistem pegunungan besar. Lakshmi sendiri adalah plateau vulkanik tinggi yang dikelilingi terrain sangat terdeformasi.",
      facts: [
        "Pusat nomenklatur IAU/USGS: 70,40°N · 27,50°E.",
        "Pemetaan USGS menempatkan Lakshmi Planum sekitar 3 sampai 4 km di atas mean planetary radius.",
        "Batas plateau mencakup sabuk pegunungan dan zona deformasi, sehingga konteks regionalnya bukan plateau bulat yang terisolasi."
      ],
      coordinateSource: "https://planetarynames.wr.usgs.gov/Feature/2733",
      scienceSource: "https://astrogeology.usgs.gov/search/map/venus_geologic_map_of_the_lakshmi_planum_quadrangle",
      radarImage: "https://assets.science.nasa.gov/dynamicimage/assets/science/psd/photojournal/pia/pia00/pia00240/PIA00240.jpg?crop=faces%2Cfocalpoint&fit=clip&h=900&w=1200",
      radarLabel: "MAGELLAN RADAR · LAKSHMI / ISHTAR CONTEXT"
    },
    {
      id: "alpha", name: "Alpha Regio", type: "Tessera · terrain berdeformasi kompleks", category: "TESSERA UPLAND",
      latitude: -25.50, longitudeEast: 0.30, heading: 0.35, profile: "tessera", frame: "f21",
      frameMeta: { maxLat: 0, minLat: -45, minLon: 0 }, alternateFrame: "f20",
      description: "Alpha Regio adalah topographic upland dengan pola tessera yang kompleks. Radar Magellan memperlihatkan beberapa set ridge, trough, dan fault valley yang saling berpotongan, bukan noise acak tanpa struktur.",
      facts: [
        "Pusat nomenklatur IAU/USGS: 25,50°S · 0,30°E.",
        "Pola radar-bright Alpha didominasi struktur yang berpotongan dan membentuk terrain berdeformasi kompleks.",
        "Beberapa local lows berisi material radar-dark yang ditafsirkan sebagai permukaan lava yang lebih halus."
      ],
      coordinateSource: "https://planetarynames.wr.usgs.gov/Feature/203",
      scienceSource: "https://science.nasa.gov/photojournal/venus-false-color-image-of-alpha-regio/",
      radarImage: "https://assets.science.nasa.gov/dynamicimage/assets/science/psd/photojournal/pia/pia00/pia00147/PIA00147.jpg?crop=faces%2Cfocalpoint&fit=clip&h=900&w=1200",
      radarLabel: "MAGELLAN RADAR · FALSE / SIMULATED COLOR"
    }
  ]);

  const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
  const lerp = (a, b, t) => a + (b - a) * t;
  const smooth = t => { t = clamp(t, 0, 1); return t * t * (3 - 2 * t); };
  const sleep = ms => new Promise(r => setTimeout(r, ms));
  const eastLon = lon => ((lon % 360) + 360) % 360;
  const fmtCoord = (lat, lon) => `${Math.abs(lat).toFixed(2)}°${lat >= 0 ? "N" : "S"} · ${eastLon(lon).toFixed(2)}°E`;
  const fmtAlt = v => v < 1 ? `${Math.max(0, v * 1000).toFixed(0)} M` : `${Math.max(0, v).toFixed(v < 10 ? 2 : 1)} KM`;

  function qualityTier() {
    const mobile = matchMedia("(max-width: 760px), (pointer: coarse)").matches;
    const low = (navigator.deviceMemory && navigator.deviceMemory <= 4) || (navigator.hardwareConcurrency && navigator.hardwareConcurrency <= 4);
    if (mobile || low) return { name: "MOBILE", outerRadius: 5, chunkSize: 9.5, near: 48, mid: 24, far: 12, horizon: 6, dpr: 1.2, minDpr: .90, maxDpr: 1.35, pixelBudget: 2800000, particles: 420, cacheLimit: 150, lodSwaps: 1 };
    return { name: "HIGH", outerRadius: 7, chunkSize: 9.5, near: 88, mid: 44, far: 20, horizon: 8, dpr: Math.min(1.8, devicePixelRatio || 1), minDpr: 1.0, maxDpr: 1.8, pixelBudget: 7600000, particles: 1050, cacheLimit: 280, lodSwaps: 2 };
  }

  function hash2(x, z) { const s = Math.sin(x * 127.1 + z * 311.7) * 43758.5453123; return s - Math.floor(s); }
  function fbm(x, z) {
    let a = .56, f = .12, sum = 0, norm = 0;
    for (let i = 0; i < 5; i += 1) {
      sum += (Math.sin(x * f * 1.17 + Math.cos(z * f * .71)) * .5 + Math.cos(z * f * 1.03 - Math.sin(x * f * .83)) * .5) * a;
      norm += a; a *= .53; f *= 2.03;
    }
    return sum / Math.max(norm, .001);
  }
  function ridge(v) { return 1 - Math.abs(v); }

  async function fetchArrayBuffer(url, timeoutMs = 12000) {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), timeoutMs);
    try {
      const response = await fetch(url, { mode: "cors", credentials: "omit", cache: "force-cache", signal: controller.signal });
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      return await response.arrayBuffer();
    } finally {
      clearTimeout(timer);
    }
  }

  class MagellanTopographyProvider {
    constructor() {
      this.frames = new Map();
      this.pending = new Map();
      this.active = null;
      this.activeMode = "FALLBACK";
      this.lastError = "";
    }
    async loadFrame(frame) {
      if (this.frames.has(frame)) return this.frames.get(frame);
      if (this.pending.has(frame)) return this.pending.get(frame);
      const promise = fetchArrayBuffer(`${GTDR_BASE}${frame}.img`)
        .then(buffer => {
          if (buffer.byteLength < GTDR_HEADER_BYTES + GTDR_SAMPLES * GTDR_SAMPLES * 2) throw new Error("GTDR frame incomplete");
          const item = { view: new DataView(buffer), frame };
          this.frames.set(frame, item);
          this.pending.delete(frame);
          return item;
        })
        .catch(error => { this.pending.delete(frame); throw error; });
      this.pending.set(frame, promise);
      return promise;
    }
    async prepare(location) {
      this.active = location;
      try {
        await this.loadFrame(location.frame);
        if (location.alternateFrame) { try { await this.loadFrame(location.alternateFrame); } catch {} }
        if (location.southFrame) { try { await this.loadFrame(location.southFrame); } catch {} }
        this.activeMode = "GTDR_4_6KM";
        this.lastError = "";
        return this.activeMode;
      } catch (error) {
        this.activeMode = "FALLBACK";
        this.lastError = String(error?.message || error || "GTDR unavailable");
        return this.activeMode;
      }
    }
    sampleDN(frameData, row, col) {
      row = clamp(row, 0, GTDR_SAMPLES - 1);
      col = clamp(col, 0, GTDR_SAMPLES - 1);
      const offset = GTDR_HEADER_BYTES + (row * GTDR_SAMPLES + col) * 2;
      return frameData.view.getUint16(offset, true);
    }
    dnToKm(dn) {
      if (!dn) return null;
      return (dn + GTDR_RADIUS_OFFSET_M - GTDR_REFERENCE_RADIUS_M) / 1000;
    }
    sample(location, lat, lonEast) {
      if (this.activeMode !== "GTDR_4_6KM") return null;
      let lon = eastLon(lonEast), frameName = location.frame, minLon = location.frameMeta.minLon, colF, rowF;
      const signed = lon > 180 ? lon - 360 : lon;
      if (location.southFrame && lat < 0 && this.frames.has(location.southFrame)) {
        frameName = location.southFrame;
        rowF = (0 - lat) * GTDR_RES;
        colF = (lon - 180) * Math.cos(lat * DEG) * GTDR_RES;
      } else if (location.alternateFrame && signed < 0 && this.frames.has(location.alternateFrame)) {
        frameName = location.alternateFrame;
        rowF = (location.frameMeta.maxLat - lat) * GTDR_RES;
        colF = (GTDR_SAMPLES - 1) + signed * Math.cos(lat * DEG) * GTDR_RES;
      } else {
        if (lon < minLon && minLon > 180) lon += 360;
        rowF = (location.frameMeta.maxLat - lat) * GTDR_RES;
        colF = (lon - minLon) * Math.cos(lat * DEG) * GTDR_RES;
      }
      const item = this.frames.get(frameName);
      if (!item) return null;
      if (rowF < -1 || rowF > GTDR_SAMPLES || colF < -1 || colF > GTDR_SAMPLES) return null;
      const r0 = Math.floor(rowF), c0 = Math.floor(colF), r1 = r0 + 1, c1 = c0 + 1;
      const ty = clamp(rowF - r0, 0, 1), tx = clamp(colF - c0, 0, 1);
      const values = [
        this.dnToKm(this.sampleDN(item, r0, c0)), this.dnToKm(this.sampleDN(item, r0, c1)),
        this.dnToKm(this.sampleDN(item, r1, c0)), this.dnToKm(this.sampleDN(item, r1, c1))
      ];
      const valid = values.filter(Number.isFinite);
      if (!valid.length) return null;
      const fill = valid.reduce((a, b) => a + b, 0) / valid.length;
      const h00 = Number.isFinite(values[0]) ? values[0] : fill;
      const h10 = Number.isFinite(values[1]) ? values[1] : fill;
      const h01 = Number.isFinite(values[2]) ? values[2] : fill;
      const h11 = Number.isFinite(values[3]) ? values[3] : fill;
      return lerp(lerp(h00, h10, tx), lerp(h01, h11, tx), ty);
    }
    statusLabel() {
      return this.activeMode === "GTDR_4_6KM"
        ? "MAGELLAN GTDR TOPOGRAPHY ~4.6 KM/PX · RADAR MACRO · MICRO DETAIL"
        : "MAGELLAN DATA UNAVAILABLE · SCIENCE-LABELLED FALLBACK RELIEF";
    }
  }

  class VenusTerrain {
    constructor(THREE, scene, renderer, quality, provider) {
      this.THREE = THREE; this.scene = scene; this.renderer = renderer; this.quality = quality; this.provider = provider;
      this.poi = LOCATIONS[0]; this.chunkSize = quality.chunkSize; this.chunks = new Map(); this.geometryCache = new Map();
      this.detail = this.makeDetailTexture(); this.material = this.makeMaterial(); this.group = new THREE.Group(); scene.add(this.group);
      this.macroTexture = null; this.lastStreamCX = Infinity; this.lastStreamCZ = Infinity;
    }
    makeDetailTexture() {
      const c = document.createElement("canvas"); c.width = c.height = 256; const ctx = c.getContext("2d"); const img = ctx.createImageData(256, 256);
      for (let y = 0; y < 256; y += 1) for (let x = 0; x < 256; x += 1) {
        const i = (y * 256 + x) * 4; const coarse = hash2(x * .19, y * .19); const fine = hash2(x * 1.9 + 17, y * 1.7 + 5); const vein = Math.abs(Math.sin(x * .11 + y * .07));
        const v = clamp(126 + (coarse - .5) * 40 + (fine - .5) * 30 + vein * 12, 45, 225);
        img.data[i] = v + 20; img.data[i + 1] = v; img.data[i + 2] = v - 18; img.data[i + 3] = 255;
      }
      ctx.putImageData(img, 0, 0); const t = new this.THREE.CanvasTexture(c); t.wrapS = t.wrapT = this.THREE.RepeatWrapping; t.colorSpace = this.THREE.SRGBColorSpace;
      t.anisotropy = Math.min(12, this.renderer.capabilities.getMaxAnisotropy()); t.needsUpdate = true; return t;
    }
    makeMaterial() {
      const T = this.THREE; const bump = this.detail.clone(); bump.colorSpace = T.NoColorSpace; bump.wrapS = bump.wrapT = T.RepeatWrapping; bump.needsUpdate = true;
      const material = new T.MeshStandardMaterial({ map: null, bumpMap: bump, bumpScale: .10, vertexColors: true, roughness: .92, metalness: .015, side: T.FrontSide });
      material.onBeforeCompile = shader => {
        shader.uniforms.uVenusDetail = { value: this.detail };
        shader.uniforms.uVenusDetailScale = { value: .95 };
        shader.vertexShader = shader.vertexShader
          .replace("#include <common>", "#include <common>\nvarying vec3 vVenusWorldPosition;")
          .replace("#include <begin_vertex>", "#include <begin_vertex>\nvVenusWorldPosition = (modelMatrix * vec4(transformed, 1.0)).xyz;");
        shader.fragmentShader = shader.fragmentShader
          .replace("#include <common>", `#include <common>
            varying vec3 vVenusWorldPosition;
            uniform sampler2D uVenusDetail;
            uniform float uVenusDetailScale;
            float venusTriSample(sampler2D tex, vec3 p, vec3 n, float scale) {
              vec3 blend = pow(max(abs(n), vec3(0.0001)), vec3(5.0));
              blend /= max(blend.x + blend.y + blend.z, 0.0001);
              float sx = texture2D(tex, p.yz * scale + vec2(0.17,0.41)).r;
              float sy = texture2D(tex, p.xz * scale + vec2(0.63,0.23)).r;
              float sz = texture2D(tex, p.xy * scale + vec2(0.37,0.79)).r;
              return sx * blend.x + sy * blend.y + sz * blend.z;
            }`)
          .replace("#include <map_fragment>", `#include <map_fragment>
            vec3 venusDx = dFdx(vVenusWorldPosition);
            vec3 venusDy = dFdy(vVenusWorldPosition);
            vec3 venusGeomNormal = normalize(cross(venusDx, venusDy));
            if (!gl_FrontFacing) venusGeomNormal = -venusGeomNormal;
            float venusDistance = length(cameraPosition - vVenusWorldPosition);
            float venusNear = 1.0 - smoothstep(9.0, 44.0, venusDistance);
            float venusBroad = venusTriSample(uVenusDetail, vVenusWorldPosition, venusGeomNormal, uVenusDetailScale * 0.48);
            float venusFine = venusTriSample(uVenusDetail, vVenusWorldPosition, venusGeomNormal, uVenusDetailScale * 2.2);
            float venusMicro = (venusBroad - 0.5) * 0.16 + (venusFine - 0.5) * 0.09 * venusNear;
            diffuseColor.rgb *= clamp(1.0 + venusMicro, 0.84, 1.16);`)
          .replace("#include <normal_fragment_maps>", `#include <normal_fragment_maps>
            #ifdef USE_BUMPMAP
              float venusBump = venusTriSample(uVenusDetail, vVenusWorldPosition, venusGeomNormal, uVenusDetailScale * 2.7);
              vec2 venusSlope = vec2(dFdx(venusBump), dFdy(venusBump));
              normal = perturbNormalArb(-vViewPosition, normal, venusSlope * (3.4 + 2.2 * venusNear), faceDirection);
            #endif`)
          .replace("#include <roughnessmap_fragment>", `#include <roughnessmap_fragment>
            float venusRough = venusTriSample(uVenusDetail, vVenusWorldPosition, venusGeomNormal, uVenusDetailScale * 0.72);
            roughnessFactor = clamp(roughnessFactor + (venusRough - 0.5) * 0.15, 0.68, 0.99);`);
      };
      material.customProgramCacheKey = () => `antara-venus-morphology-terrain-v5-${this.quality.name}`;
      return material;
    }
    geoForWorld(x, z, poi = this.poi) {
      const lat = clamp(poi.latitude - z / KM_PER_DEG, -89.9, 89.9);
      const cosLat = Math.max(.12, Math.cos(poi.latitude * DEG));
      const lon = eastLon(poi.longitudeEast + x / (KM_PER_DEG * cosLat));
      return { lat, lon };
    }
    rotatedCoords(x, z, angleDeg) {
      const a = angleDeg * DEG, c = Math.cos(a), s = Math.sin(a);
      return { u: x * c + z * s, v: -x * s + z * c };
    }
    ridgeBand(x, z, angleDeg, spacingKm, sharpness = 5, warpKm = 0) {
      const q = this.rotatedCoords(x, z, angleDeg);
      const warp = warpKm ? Math.sin(q.v * .13 + fbm(q.v * .22, q.u * .05) * 1.8) * warpKm : 0;
      const frequencyWarp = 1 + fbm(q.u * .055 + 19, q.v * .045 - 7) * .11;
      const phase = (q.u + warp) * Math.PI / Math.max(.4, spacingKm) * frequencyWarp;
      return Math.pow(clamp(ridge(Math.sin(phase)), 0, 1), sharpness);
    }
    troughBand(x, z, angleDeg, spacingKm, sharpness = 7, warpKm = 0) {
      return this.ridgeBand(x, z, angleDeg, spacingKm, sharpness, warpKm);
    }
    gaussianMask(x, z, cx, cz, rx, rz, angleDeg = 0) {
      const q = this.rotatedCoords(x - cx, z - cz, angleDeg);
      return Math.exp(-((q.u * q.u) / Math.max(.01, rx * rx) + (q.v * q.v) / Math.max(.01, rz * rz)));
    }
    regionalSignals(x, z, poi = this.poi) {
      const p = poi.profile;
      if (p === "tessera") {
        const maskA = clamp(.58 + fbm(x * .075 + 7, z * .070 - 13) * .58, .08, 1);
        const maskB = clamp(.55 + fbm(x * .066 - 23, z * .082 + 17) * .60, .06, 1);
        const maskCross = clamp(.34 + fbm(x * .052 + 41, z * .060 + 8) * .52, 0, .82);
        // Alpha is a tessera upland, not a field of tiny periodic bumps. Use several
        // kilometre-scale structural families, with broad domain warping and local masks,
        // so the pattern reads as intersecting ridges / troughs / fault valleys.
        const provinceA = clamp(.30 + this.gaussianMask(x, z, -18, -4, 34, 24, 18), .30, 1);
        const provinceB = clamp(.28 + this.gaussianMask(x, z, 22, 12, 31, 27, -24), .28, 1);
        const ridgeA = this.ridgeBand(x, z, 27, 8.8, 6, 3.2) * maskA * provinceA;
        const ridgeB = this.ridgeBand(x, z, -39, 12.4, 6, 3.6) * maskB * provinceB;
        const trough = this.troughBand(x, z, 70, 19.5, 9, 4.2) * clamp(.55 + fbm(x * .05 - 9, z * .055 + 29) * .55, .12, 1);
        const cross = this.ridgeBand(x, z, 4, 15.2, 7, 2.8) * maskCross;
        const smoothLow = clamp(
          this.gaussianMask(x, z, 13, -9, 10, 6, 22) +
          this.gaussianMask(x, z, -18, 16, 8, 12, -31) +
          this.gaussianMask(x, z, 29, 18, 11, 7, 48) +
          this.gaussianMask(x, z, -34, -22, 12, 8, 8), 0, 1
        );
        return { ridgeA, ridgeB, trough, cross, smoothLow, structure: clamp(ridgeA * .68 + ridgeB * .62 + cross * .22 + trough * .28, 0, 1) };
      }
      if (p === "mountain") {
        const ridgeA = this.ridgeBand(x, z, 12, 4.4, 6, .38);
        const ridgeB = this.ridgeBand(x, z, 16, 7.8, 5, .55);
        const trough = this.troughBand(x, z, 102, 18, 8, .45);
        return { ridgeA, ridgeB, trough, smoothLow: 0, structure: clamp(ridgeA * .72 + ridgeB * .38 + trough * .24, 0, 1) };
      }
      if (p === "shield") {
        const r = Math.hypot(x * .86, z);
        const angle = Math.atan2(z, x);
        const flow = Math.pow(clamp(ridge(Math.sin(angle * 8.0 + r * .34 + Math.sin(angle * 3) * .9)), 0, 1), 5);
        const fracture = this.troughBand(x, z, 24, 16.0, 8, .65);
        const apron = smooth(1 - clamp((r - 9) / 58, 0, 1));
        return { ridgeA: flow * apron, ridgeB: 0, trough: fracture, smoothLow: 0, structure: clamp(flow * .72 * apron + fracture * .18, 0, 1) };
      }
      if (p === "plateau") {
        const r = Math.hypot(x * .72, z);
        const edge = smooth(clamp((r - 15) / 24, 0, 1));
        const marginA = this.ridgeBand(x, z, 34, 7.4, 6, .75) * edge;
        const marginB = this.ridgeBand(x, z, -18, 11.5, 6, .55) * edge;
        const graben = this.troughBand(x, z, 88, 20, 8, .75);
        return { ridgeA: marginA, ridgeB: marginB, trough: graben, smoothLow: 1 - edge, structure: clamp(marginA * .62 + marginB * .42 + graben * .18, 0, 1) };
      }
      // Aphrodite / Ovda style broad highland: several structural generations, but not a uniform cross-hatch.
      const maskA = clamp(.54 + fbm(x * .060 + 11, z * .052 - 18) * .56, .05, 1);
      const maskB = clamp(.40 + fbm(x * .050 - 37, z * .064 + 14) * .52, 0, .92);
      const ridgeA = this.ridgeBand(x, z, 18, 8.6, 5, 2.4) * maskA;
      const ridgeB = this.ridgeBand(x, z, -29, 13.6, 5, 2.8) * maskB;
      const trough = this.troughBand(x, z, 78, 21.5, 8, 3.1) * clamp(.44 + fbm(x * .045 + 5, z * .052 - 21) * .48, .08, .95);
      const lavaLow = clamp(
        this.gaussianMask(x, z, -14, 10, 15, 9, -14) +
        this.gaussianMask(x, z, 26, -17, 17, 10, 31) +
        this.gaussianMask(x, z, 38, 22, 12, 18, -4), 0, 1
      );
      return { ridgeA, ridgeB, trough, smoothLow: lavaLow, structure: clamp(ridgeA * .56 + ridgeB * .42 + trough * .24, 0, 1) };
    }
    regionalStructureHeight(x, z, poi = this.poi, measured = false) {
      const p = poi.profile, s = this.regionalSignals(x, z, poi);
      const scale = measured ? 1 : 1.85;
      const micro = fbm(x * 2.7 + 17, z * 2.7 - 11) * (p === "tessera" ? .026 : .018);
      if (p === "tessera") {
        // Alpha Regio: two cross-cutting ridge populations + fault troughs + irregular upland blocks.
        const blocks = (fbm(x * .18 + 31, z * .18 - 13) * .10 + fbm(x * .39 - 9, z * .31 + 22) * .045) * (1 - s.smoothLow * .72);
        const ridged = ((s.ridgeA - .10) * .105 + (s.ridgeB - .10) * .095 + (s.cross - .08) * .045) * (1 - s.smoothLow * .76);
        const faults = -(s.trough - .04) * .115 * (1 - s.smoothLow * .45);
        const infill = -s.smoothLow * .055;
        return (blocks + ridged + faults + infill + micro) * scale;
      }
      if (p === "mountain") {
        // Maxwell Montes: parallel, elongated compressional ridges instead of random alpine bumps.
        const envelope = .72 + .28 * smooth(1 - clamp(Math.abs(this.rotatedCoords(x, z, 12).v) / 58, 0, 1));
        return (((s.ridgeA - .10) * .125 + (s.ridgeB - .10) * .075 - (s.trough - .04) * .055) * envelope + micro) * scale;
      }
      if (p === "shield") {
        // Maat Mons: radial/ribbon-like flow texture over a broad measured shield and fractured plains.
        const r = Math.hypot(x * .86, z);
        const flowMask = smooth(1 - clamp((r - 4) / 70, 0, 1));
        const plainsFracture = (this.ridgeBand(x, z, -27, 21, 8, .7) - .05) * .030;
        return (((s.ridgeA - .08) * .072 * flowMask - (s.trough - .04) * .027 + plainsFracture) + micro) * scale;
      }
      if (p === "plateau") {
        // Ishtar/Lakshmi context: smoother plateau interior, increasingly deformed margins.
        const edgeStructure = (s.ridgeA - .08) * .095 + (s.ridgeB - .08) * .070 - (s.trough - .04) * .040;
        const interior = fbm(x * .16 + 8, z * .16 - 5) * .020 * s.smoothLow;
        return (edgeStructure + interior + micro * (.55 + .45 * (1 - s.smoothLow))) * scale;
      }
      // Aphrodite / Ovda: broad deformed highland, curvilinear ridge systems, long graben, smoother flooded lows.
      const deformed = ((s.ridgeA - .09) * .080 + (s.ridgeB - .09) * .070 - (s.trough - .04) * .065) * (1 - s.smoothLow * .60);
      const broad = fbm(x * .13 + 42, z * .13 - 27) * .050 * (1 - s.smoothLow * .35);
      return (deformed + broad - s.smoothLow * .035 + micro) * scale;
    }
    fallbackHeight(x, z, poi = this.poi) {
      const n = fbm(x * .62, z * .62), p = poi.profile;
      let base;
      if (p === "shield") {
        const q = this.rotatedCoords(x + 2.8, z - 1.5, -9);
        const r = Math.hypot(q.u * .78, q.v);
        const shoulder = 4.25 * Math.exp(-(r * r) / 1320) + .72 * this.gaussianMask(x, z, -18, 9, 28, 17, 28);
        const caldera = .34 * this.gaussianMask(x, z, 1.5, -1.2, 4.2, 3.1, 18);
        const plainsTilt = .18 * Math.sin((x - z * .34) * .020) + .10 * fbm(x * .12 + 8, z * .12 - 3);
        base = .42 + n * .14 + shoulder - caldera + plainsTilt;
      } else if (p === "mountain") {
        const q = this.rotatedCoords(x, z, 12);
        const massifSide = smooth(clamp((q.v + 22) / 48, 0, 1));
        const longWave = .52 * Math.sin(q.u * .043 + Math.sin(q.v * .018) * .8) * massifSide;
        base = 3.55 + 3.05 * massifSide + longWave + n * (.12 + .12 * massifSide);
      } else if (p === "plateau") {
        const q = this.rotatedCoords(x + 4, z - 2, 11);
        const plateau = smooth(clamp((q.v + 34) / 46, 0, 1));
        const broadStep = .32 * smooth(clamp((q.u + 38) / 76, 0, 1));
        base = 2.70 + 1.10 * plateau + broadStep + n * (.08 + .08 * (1 - plateau));
      } else if (p === "tessera") {
        const broad = fbm(x * .18, z * .18) * .32;
        base = 1.35 + broad;
      } else {
        const q = this.rotatedCoords(x, z, 20);
        base = 1.55 + fbm(q.u * .15, q.v * .15) * .55 + Math.sin(q.u * .045) * .22;
      }
      return base + this.regionalStructureHeight(x, z, poi, false);
    }
    height(x, z, poi = this.poi) {
      const geo = this.geoForWorld(x, z, poi);
      const measured = this.provider.sample(poi, geo.lat, geo.lon);
      if (Number.isFinite(measured)) return measured + this.regionalStructureHeight(x, z, poi, true);
      return this.fallbackHeight(x, z, poi);
    }
    colorFor(h, slope, x, z) {
      const T = this.THREE, p = this.poi.profile, s = this.regionalSignals(x, z, this.poi);
      const granular = (hash2(x * .51, z * .47) - .5) * .055;
      const broad = fbm(x * .12 + 9, z * .12 - 7) * .030;
      let c;
      if (p === "shield") {
        const flowDark = clamp(s.ridgeA * .65 + s.trough * .22, 0, 1);
        c = new T.Color(h > 5.8 ? "#73503d" : h > 2.6 ? "#875c43" : "#9a6a49");
        c.lerp(new T.Color("#5b3b30"), flowDark * .32 + slope * .14);
      } else if (p === "mountain") {
        c = new T.Color(h > 8.2 ? "#a48464" : h > 5.2 ? "#81614c" : "#8f684d");
        c.lerp(new T.Color("#5b4438"), clamp(s.ridgeA * .28 + slope * .34, 0, .48));
      } else if (p === "plateau") {
        c = new T.Color(s.smoothLow > .55 ? "#9a7458" : "#7e5c48");
        c.lerp(new T.Color("#5d4337"), clamp(s.structure * .42 + slope * .20, 0, .50));
      } else if (p === "tessera") {
        c = new T.Color(s.smoothLow > .45 ? "#a67855" : "#80604d");
        c.lerp(new T.Color("#b08a66"), clamp((s.ridgeA + s.ridgeB) * .18, 0, .26));
        c.lerp(new T.Color("#513c34"), clamp(s.trough * .28 + slope * .30, 0, .52));
      } else {
        c = new T.Color(s.smoothLow > .45 ? "#9c7050" : h > 3.0 ? "#80604a" : "#8e674d");
        c.lerp(new T.Color("#5f4437"), clamp(s.structure * .30 + slope * .26, 0, .48));
      }
      c.offsetHSL(0, -0.025, granular + broad - slope * .020);
      return c;
    }
    cacheKey(cx, cz, segments) { return `${this.poi.id}:${this.provider.activeMode}:${cx}:${cz}:${segments}`; }
    geometry(cx, cz, segments) {
      const key = this.cacheKey(cx, cz, segments); const cached = this.geometryCache.get(key);
      if (cached) { cached.lastUsed = performance.now(); return cached.geometry; }
      const T = this.THREE, g = new T.PlaneGeometry(this.chunkSize, this.chunkSize, segments, segments); g.rotateX(-Math.PI / 2);
      const pos = g.attributes.position, uv = g.attributes.uv, colors = new Float32Array(pos.count * 3);
      const ox = cx * this.chunkSize, oz = cz * this.chunkSize;
      const count = segments + 1, heights = new Float32Array(count * count), xs = new Float32Array(count * count), zs = new Float32Array(count * count);
      for (let row = 0; row <= segments; row += 1) for (let col = 0; col <= segments; col += 1) {
        const i = row * count + col, wx = pos.getX(i) + ox, wz = pos.getZ(i) + oz, h = this.height(wx, wz), geo = this.geoForWorld(wx, wz);
        heights[i] = h; xs[i] = wx; zs[i] = wz; pos.setY(i, h); uv.setXY(i, geo.lon / 360, (geo.lat + 90) / 180);
      }
      const hAt = (r, c) => heights[clamp(r, 0, segments) * count + clamp(c, 0, segments)];
      const normals = new Float32Array(pos.count * 3);
      const step = this.chunkSize / Math.max(1, segments);
      for (let row = 0; row <= segments; row += 1) for (let col = 0; col <= segments; col += 1) {
        const i = row * count + col, wx = xs[i], wz = zs[i];
        // Interior gradients reuse the generated grid. Border gradients sample just
        // across the chunk edge, so adjacent chunks derive the same world-space normal.
        const hL = col > 0 ? hAt(row, col - 1) : this.height(wx - step, wz);
        const hR = col < segments ? hAt(row, col + 1) : this.height(wx + step, wz);
        const hD = row > 0 ? hAt(row - 1, col) : this.height(wx, wz - step);
        const hU = row < segments ? hAt(row + 1, col) : this.height(wx, wz + step);
        const gx = (hR - hL) / Math.max(.04, step * 2), gz = (hU - hD) / Math.max(.04, step * 2);
        const invN = 1 / Math.max(.0001, Math.hypot(gx, 1, gz));
        normals[i * 3] = -gx * invN; normals[i * 3 + 1] = invN; normals[i * 3 + 2] = -gz * invN;
        const slope = clamp(Math.hypot(gx, gz) * 1.8, 0, 1), colr = this.colorFor(heights[i], slope, wx, wz);
        colors[i * 3] = colr.r; colors[i * 3 + 1] = colr.g; colors[i * 3 + 2] = colr.b;
      }
      uv.needsUpdate = true; pos.needsUpdate = true;
      g.setAttribute("color", new T.BufferAttribute(colors, 3));
      g.setAttribute("normal", new T.BufferAttribute(normals, 3));
      g.computeBoundingSphere(); g.computeBoundingBox();
      this.geometryCache.set(key, { geometry: g, lastUsed: performance.now() }); this.pruneGeometryCache(); return g;
    }
    pruneGeometryCache() {
      if (this.geometryCache.size <= this.quality.cacheLimit) return;
      const active = new Set([...this.chunks.values()].map(mesh => mesh.geometry));
      const candidates = [...this.geometryCache.entries()].filter(([, v]) => !active.has(v.geometry)).sort((a, b) => a[1].lastUsed - b[1].lastUsed);
      while (this.geometryCache.size > this.quality.cacheLimit && candidates.length) { const [key, value] = candidates.shift(); value.geometry.dispose(); this.geometryCache.delete(key); }
    }
    desiredSegments(ring, distance) {
      const nearBoost = this.poi.profile === "tessera" ? 1.18 : this.poi.profile === "mountain" ? 1.10 : this.poi.profile === "highland" ? 1.06 : 1;
      if (distance < 11) return Math.round(this.quality.near * nearBoost);
      if (distance < 24 || ring <= 1) return Math.round(this.quality.mid * Math.min(1.10, nearBoost));
      if (ring <= 3) return this.quality.far;
      return this.quality.horizon;
    }
    ensureChunk(cx, cz, centerCX, centerCZ, camera) {
      const key = `${cx},${cz}`, ring = Math.max(Math.abs(cx - centerCX), Math.abs(cz - centerCZ));
      let mesh = this.chunks.get(key);
      // LOD must be camera-relative. Measuring from world origin caused newly streamed
      // chunks to enter with the wrong mesh density after the player travelled away.
      const wx = cx * this.chunkSize, wz = cz * this.chunkSize;
      const d = Math.hypot(camera.position.x - wx, camera.position.z - wz);
      const segments = this.desiredSegments(ring, d);
      if (!mesh) {
        mesh = new this.THREE.Mesh(this.geometry(cx, cz, segments), this.material); mesh.position.set(cx * this.chunkSize, 0, cz * this.chunkSize);
        mesh.frustumCulled = true; mesh.userData = { cx, cz, segments, ring }; this.group.add(mesh); this.chunks.set(key, mesh);
      } else { mesh.userData.ring = ring; }
      return mesh;
    }
    stream(camera, force = false) {
      const centerCX = Math.round(camera.position.x / this.chunkSize), centerCZ = Math.round(camera.position.z / this.chunkSize);
      if (!force && centerCX === this.lastStreamCX && centerCZ === this.lastStreamCZ) return;
      this.lastStreamCX = centerCX; this.lastStreamCZ = centerCZ; const keep = new Set();
      for (let dz = -this.quality.outerRadius; dz <= this.quality.outerRadius; dz += 1) for (let dx = -this.quality.outerRadius; dx <= this.quality.outerRadius; dx += 1) {
        const ring = Math.max(Math.abs(dx), Math.abs(dz)); if (ring > this.quality.outerRadius) continue;
        const cx = centerCX + dx, cz = centerCZ + dz, key = `${cx},${cz}`; keep.add(key); this.ensureChunk(cx, cz, centerCX, centerCZ, camera);
      }
      for (const [key, mesh] of this.chunks) if (!keep.has(key)) { this.group.remove(mesh); this.chunks.delete(key); }
      this.pruneGeometryCache();
    }
    updateLOD(camera) {
      this.stream(camera);
      // Rebuilding several dense chunks in one animation frame produces visible spikes.
      // Queue candidates by proximity and pay only a tiny geometry budget per LOD pass.
      const candidates = [];
      for (const mesh of this.chunks.values()) {
        const dx = camera.position.x - mesh.position.x, dz = camera.position.z - mesh.position.z, d = Math.hypot(dx, dz);
        let desired = this.desiredSegments(mesh.userData.ring, d);
        const current = mesh.userData.segments;
        const near = Math.round(this.quality.near * (this.poi.profile === "tessera" ? 1.18 : this.poi.profile === "mountain" ? 1.10 : this.poi.profile === "highland" ? 1.06 : 1));
        const mid = Math.round(this.quality.mid * Math.min(1.10, this.poi.profile === "tessera" ? 1.18 : this.poi.profile === "mountain" ? 1.10 : this.poi.profile === "highland" ? 1.06 : 1));
        // Hysteresis prevents a chunk from oscillating around the 11/24 km boundaries.
        if (current === near && d < 13.0) desired = near;
        else if (current === mid && d >= 9.5 && d < 27.0) desired = mid;
        if (current !== desired) candidates.push({ mesh, desired, d });
      }
      candidates.sort((a, b) => a.d - b.d);
      const budget = this.quality.lodSwaps || 1;
      for (let i = 0; i < Math.min(budget, candidates.length); i += 1) {
        const { mesh, desired } = candidates[i];
        mesh.geometry = this.geometry(mesh.userData.cx, mesh.userData.cz, desired);
        mesh.userData.segments = desired;
      }
    }
    updateVisibility(camera) {
      const dir = new this.THREE.Vector3();
      camera.getWorldDirection(dir); dir.y = 0;
      if (dir.lengthSq() < .0001) dir.set(0, 0, -1); else dir.normalize();
      for (const mesh of this.chunks.values()) {
        const vx = mesh.position.x - camera.position.x, vz = mesh.position.z - camera.position.z;
        const dist = Math.hypot(vx, vz);
        // Keep a generous safety ring fully alive. Far terrain substantially behind the
        // camera is hidden, then becomes visible in the same frame as a fast turn.
        if (dist < 24 || mesh.userData.ring <= 2) { mesh.visible = true; continue; }
        const inv = 1 / Math.max(.001, dist);
        const dot = vx * inv * dir.x + vz * inv * dir.z;
        mesh.visible = dot > -.30;
      }
    }
    async setLocation(poi) {
      this.poi = poi; this.lastStreamCX = Infinity; this.lastStreamCZ = Infinity;
      const mode = await this.provider.prepare(poi);
      const materialProfiles = {
        shield: { roughness: .88, bump: .085 },
        mountain: { roughness: .94, bump: .125 },
        highland: { roughness: .91, bump: .115 },
        plateau: { roughness: .89, bump: .080 },
        tessera: { roughness: .95, bump: .135 }
      };
      const visual = materialProfiles[poi.profile] || materialProfiles.highland;
      this.material.roughness = visual.roughness; this.material.bumpScale = visual.bump;
      for (const mesh of this.chunks.values()) this.group.remove(mesh); this.chunks.clear();
      for (const entry of this.geometryCache.values()) entry.geometry.dispose(); this.geometryCache.clear();
      return mode;
    }
    prime(camera) { this.stream(camera, true); this.updateLOD(camera); }
    setMacroTexture(texture) {
      if (!texture) return; texture.colorSpace = this.THREE.SRGBColorSpace; texture.wrapS = this.THREE.RepeatWrapping; texture.wrapT = this.THREE.ClampToEdgeWrapping;
      texture.anisotropy = Math.min(12, this.renderer.capabilities.getMaxAnisotropy());
      if (this.macroTexture && this.macroTexture !== texture) this.macroTexture.dispose(); this.macroTexture = texture; this.material.map = texture; this.material.needsUpdate = true;
    }
    dispose() {
      for (const mesh of this.chunks.values()) this.group.remove(mesh); this.chunks.clear();
      for (const entry of this.geometryCache.values()) entry.geometry.dispose(); this.geometryCache.clear();
      this.macroTexture?.dispose(); this.detail?.dispose(); this.material.bumpMap?.dispose(); this.material.dispose(); this.scene.remove(this.group);
    }
  }

  class VenusFullExploration {
    constructor(venus) {
      this.venus = venus; this.root = document.getElementById("venus-full-exploration"); this.viewport = document.getElementById("venus-full-viewport"); this.entryButton = document.getElementById("venus-full-explore-button");
      this.exitButton = document.getElementById("venus-full-exit"); this.fullscreenButton = document.getElementById("venus-fullscreen-toggle"); this.locationToggle = document.getElementById("venus-location-toggle"); this.locationMenu = document.getElementById("venus-location-menu");
      this.loading = document.getElementById("venus-full-loading"); this.loadingStatus = document.getElementById("venus-full-loading-status"); this.loadingProgress = document.getElementById("venus-full-loading-progress"); this.error = document.getElementById("venus-full-error"); this.errorMessage = document.getElementById("venus-full-error-message"); this.errorReturn = document.getElementById("venus-full-error-return");
      this.tutorial = document.getElementById("venus-full-tutorial"); this.tutorialClose = document.getElementById("venus-tutorial-close"); this.travelVeil = document.getElementById("venus-travel-veil"); this.travelLabel = document.getElementById("venus-travel-label");
      this.hudLocation = document.getElementById("venus-hud-location"); this.hudCoordinates = document.getElementById("venus-hud-coordinates"); this.hudAltitude = document.getElementById("venus-hud-altitude"); this.hudSpeed = document.getElementById("venus-hud-speed"); this.hudQuality = document.getElementById("venus-hud-quality"); this.hudData = document.getElementById("venus-hud-data");
      this.landmarkCard = document.getElementById("venus-location-card"); this.landmarkName = document.getElementById("venus-landmark-name"); this.landmarkType = document.getElementById("venus-landmark-type"); this.landmarkCoords = document.getElementById("venus-landmark-coords");
      this.landmarkDescription = document.getElementById("venus-landmark-description"); this.landmarkFacts = document.getElementById("venus-landmark-facts"); this.landmarkSource = document.getElementById("venus-landmark-source"); this.landmarkCoordinateSource = document.getElementById("venus-landmark-coordinate-source"); this.landmarkTopographySource = document.getElementById("venus-landmark-topography-source");
      this.landmarkImage = document.getElementById("venus-landmark-image"); this.landmarkImageLabel = document.getElementById("venus-landmark-image-label"); this.landmarkDataBadge = document.getElementById("venus-landmark-data-badge");
      this.cardCollapse = document.getElementById("venus-card-collapse"); this.cardClose = document.getElementById("venus-card-close"); this.cardOpen = document.getElementById("venus-location-info-open");
      this.state = STATES.IDLE; this.location = LOCATIONS[0]; this.quality = qualityTier(); this.keys = new Set(); this.yaw = 0; this.pitch = -.08; this.speed = 0; this.velocity = { x: 0, y: 0, z: 0 }; this.frame = null; this.last = 0; this.lodClock = 0; this.hudClock = 0; this.statsClock = 0; this.statsFrames = 0; this.lowFpsWindows = 0; this.highFpsWindows = 0; this.transitionToken = 0; this.abort = new AbortController(); this.cardClosed = false; this.debugEnabled = new URLSearchParams(location.search).has("venusDebug");
      this.buildMenu(); this.bind();
    }
    get active() { return ![STATES.IDLE, STATES.ERROR].includes(this.state); }
    buildMenu() {
      const f = document.createDocumentFragment(); LOCATIONS.forEach((l, i) => { const b = document.createElement("button"); b.type = "button"; b.dataset.venusLocation = l.id; b.setAttribute("role", "menuitem"); b.innerHTML = `<span>${String(i + 1).padStart(2, "0")}</span><strong>${l.name}</strong><small>${l.type}</small>`; f.append(b); }); this.locationMenu.replaceChildren(f);
    }
    bind() {
      const s = this.abort.signal;
      this.entryButton.addEventListener("click", () => this.enter(), { signal: s }); this.exitButton.addEventListener("click", () => this.exit(), { signal: s }); this.errorReturn.addEventListener("click", () => this.exit(), { signal: s });
      this.locationToggle.addEventListener("click", () => { const open = this.locationMenu.classList.toggle("is-open"); this.locationToggle.setAttribute("aria-expanded", String(open)); }, { signal: s });
      this.locationMenu.addEventListener("click", e => { const b = e.target.closest("[data-venus-location]"); if (!b) return; const l = LOCATIONS.find(x => x.id === b.dataset.venusLocation); if (l) this.travelTo(l); }, { signal: s });
      this.fullscreenButton.addEventListener("click", () => this.toggleFullscreen(), { signal: s }); document.addEventListener("fullscreenchange", () => this.updateFullscreen(), { signal: s }); this.tutorialClose.addEventListener("click", () => { this.tutorial.classList.remove("is-visible"); this.tutorial.classList.add("is-dismissed"); }, { signal: s });
      this.viewport.addEventListener("click", e => { if (e.target.closest?.("[data-venus-ui]")) return; if (this.state === STATES.EXPLORING && !matchMedia("(pointer: coarse)").matches) this.viewport.requestPointerLock?.(); }, { signal: s });
      document.addEventListener("pointerlockchange", () => this.root.classList.toggle("is-pointer-locked", document.pointerLockElement === this.viewport), { signal: s });
      document.addEventListener("mousemove", e => { if (document.pointerLockElement !== this.viewport || this.state !== STATES.EXPLORING) return; this.yaw -= e.movementX * .0024; this.pitch = clamp(this.pitch - e.movementY * .0021, -1.25, 1.05); }, { signal: s });
      window.addEventListener("keydown", e => {
        if (this.state !== STATES.EXPLORING && this.state !== STATES.TRAVELLING) return;
        const move = ["KeyW", "KeyA", "KeyS", "KeyD", "KeyQ", "KeyE", "ShiftLeft", "ShiftRight"].includes(e.code);
        if (!move && e.key !== "Escape") return; e.preventDefault(); e.stopImmediatePropagation();
        if (e.key === "Escape") { if (e.repeat) return; if (document.pointerLockElement === this.viewport) { document.exitPointerLock?.(); this.keys.clear(); return; } this.exit(); return; }
        if (this.state !== STATES.EXPLORING) return; this.keys.add(e.code); this.tutorial.classList.remove("is-visible");
      }, { signal: s, capture: true });
      window.addEventListener("keyup", e => { if (this.keys.has(e.code)) { e.preventDefault(); e.stopImmediatePropagation(); this.keys.delete(e.code); } }, { signal: s, capture: true });
      this.root.querySelectorAll("[data-venus-control]").forEach(b => { const code = b.dataset.venusControl; const on = ev => { ev.preventDefault(); this.keys.add(code); b.classList.add("is-held"); }; const off = ev => { ev.preventDefault(); this.keys.delete(code); b.classList.remove("is-held"); }; b.addEventListener("pointerdown", on, { signal: s }); b.addEventListener("pointerup", off, { signal: s }); b.addEventListener("pointercancel", off, { signal: s }); b.addEventListener("pointerleave", off, { signal: s }); });
      let touch = null; this.viewport.addEventListener("pointerdown", e => { if (e.target.closest?.("[data-venus-ui]")) return; if (e.pointerType === "mouse") return; touch = { x: e.clientX, y: e.clientY }; }, { signal: s });
      this.viewport.addEventListener("pointermove", e => { if (!touch || e.pointerType === "mouse" || this.state !== STATES.EXPLORING) return; this.yaw -= (e.clientX - touch.x) * .006; this.pitch = clamp(this.pitch - (e.clientY - touch.y) * .005, -1.25, 1.05); touch = { x: e.clientX, y: e.clientY }; }, { signal: s }); this.viewport.addEventListener("pointerup", () => touch = null, { signal: s });
      const releasePointer = () => { if (document.pointerLockElement === this.viewport) document.exitPointerLock?.(); };
      this.landmarkCard?.addEventListener("pointerdown", e => { e.stopPropagation(); releasePointer(); }, { signal: s });
      this.cardCollapse?.addEventListener("click", e => { e.stopPropagation(); releasePointer(); this.landmarkCard.classList.toggle("is-collapsed"); this.cardCollapse.setAttribute("aria-expanded", String(!this.landmarkCard.classList.contains("is-collapsed"))); }, { signal: s });
      this.cardClose?.addEventListener("click", e => { e.stopPropagation(); releasePointer(); this.cardClosed = true; this.landmarkCard.classList.remove("is-visible"); this.cardOpen.hidden = false; }, { signal: s });
      this.cardOpen?.addEventListener("click", e => { e.stopPropagation(); releasePointer(); this.cardClosed = false; this.landmarkCard.classList.add("is-visible"); this.landmarkCard.classList.remove("is-collapsed"); this.cardCollapse?.setAttribute("aria-expanded", "true"); this.cardOpen.hidden = true; }, { signal: s });
    }
    async prepareRenderer(token) {
      if (this.renderer) return; this.loadingStatus.textContent = "MENYIAPKAN RENDERER VENUS"; this.loadingProgress.style.transform = "scaleX(.18)";
      const THREE = await import("./assets/vendor/three/three.module.min.js"); if (token !== this.transitionToken) throw new Error("Persiapan dibatalkan."); this.THREE = THREE;
      this.renderer = new THREE.WebGLRenderer({ antialias: true, powerPreference: "high-performance" }); this.currentDpr = this.calculateIdealDpr(); this.renderer.setPixelRatio(this.currentDpr); this.renderer.outputColorSpace = THREE.SRGBColorSpace; this.renderer.toneMapping = THREE.ACESFilmicToneMapping; this.renderer.toneMappingExposure = 1.10; this.renderer.domElement.className = "mars-full-canvas"; this.viewport.replaceChildren(this.renderer.domElement);
      this.scene = new THREE.Scene(); this.scene.background = new THREE.Color("#79513e"); this.scene.fog = new THREE.FogExp2("#9c7058", .0195); this.camera = new THREE.PerspectiveCamera(67, 1, .03, 165); this.camera.rotation.order = "YXZ";
      this.hemi = new THREE.HemisphereLight("#ffe4bd", "#2b1714", 1.42); this.scene.add(this.hemi);
      this.sun = new THREE.DirectionalLight("#ffd0a1", 3.05); this.sun.position.set(-16, 7.2, 9); this.scene.add(this.sun);
      this.topography = new MagellanTopographyProvider(); this.terrain = new VenusTerrain(THREE, this.scene, this.renderer, this.quality, this.topography); this.loadRadarMacroTexture(); this.loadingProgress.style.transform = "scaleX(.52)"; this.makeParticles(); this.loadingProgress.style.transform = "scaleX(.68)"; this.resize(); window.addEventListener("resize", () => this.resize(), { signal: this.abort.signal });
    }
    calculateIdealDpr() {
      const w = Math.max(1, this.viewport?.clientWidth || innerWidth), h = Math.max(1, this.viewport?.clientHeight || innerHeight);
      const budget = Math.sqrt(this.quality.pixelBudget / Math.max(1, w * h));
      return clamp(Math.min(this.quality.dpr, this.quality.maxDpr, budget), this.quality.minDpr, this.quality.maxDpr);
    }
    adaptResolution(dt) {
      this.statsClock += dt; this.statsFrames += 1;
      if (this.statsClock < 1.5 || !this.renderer) return;
      const fps = this.statsFrames / this.statsClock;
      const ideal = this.calculateIdealDpr();
      if (fps < 50 && this.currentDpr > this.quality.minDpr) {
        this.lowFpsWindows += 1; this.highFpsWindows = 0;
        if (this.lowFpsWindows >= 2) { this.currentDpr = Math.max(this.quality.minDpr, this.currentDpr - .10); this.renderer.setPixelRatio(this.currentDpr); this.resize(); this.lowFpsWindows = 0; }
      } else if (fps > 57 && this.currentDpr < ideal - .04) {
        this.highFpsWindows += 1; this.lowFpsWindows = 0;
        if (this.highFpsWindows >= 3) { this.currentDpr = Math.min(ideal, this.currentDpr + .05); this.renderer.setPixelRatio(this.currentDpr); this.resize(); this.highFpsWindows = 0; }
      } else { this.lowFpsWindows = 0; this.highFpsWindows = 0; }
      if (this.debugEnabled) {
        const info = this.renderer.info.render;
        console.debug("[ANTARA Venus render]", { fps: Number(fps.toFixed(1)), frameMs: Number((1000 / Math.max(1, fps)).toFixed(2)), calls: info.calls, triangles: info.triangles, points: info.points, dpr: Number(this.currentDpr.toFixed(2)), chunks: this.terrain?.chunks.size || 0, cache: this.terrain?.geometryCache.size || 0 });
      }
      this.statsClock = 0; this.statsFrames = 0;
    }
    applyLocationEnvironment(location = this.location) {
      if (!this.scene || !this.THREE) return;
      const presets = {
        maat: { bg: "#7c503a", fog: "#a66f4d", density: .0205, sky: "#ffe0b3", ground: "#2d1712", hemi: 1.34, sun: "#ffd1a3", sunI: 2.95, pos: [-16, 6.4, 11], exposure: 1.12 },
        maxwell: { bg: "#725145", fog: "#98715c", density: .0182, sky: "#f6dfc4", ground: "#251816", hemi: 1.22, sun: "#ffd8b4", sunI: 3.35, pos: [-18, 5.4, 7], exposure: 1.16 },
        aphrodite: { bg: "#785442", fog: "#9d735b", density: .0190, sky: "#ffe0bd", ground: "#2a1714", hemi: 1.28, sun: "#ffd2a7", sunI: 3.18, pos: [-14, 6.0, 12], exposure: 1.14 },
        ishtar: { bg: "#735348", fog: "#967360", density: .0185, sky: "#f6dfc9", ground: "#271918", hemi: 1.24, sun: "#ffd9b7", sunI: 3.22, pos: [-17, 5.8, 8], exposure: 1.15 },
        alpha: { bg: "#704f42", fog: "#94705e", density: .0176, sky: "#f2dcc5", ground: "#241817", hemi: 1.18, sun: "#ffd8b5", sunI: 3.42, pos: [-19, 4.8, 10], exposure: 1.17 }
      };
      const p = presets[location.id] || presets.aphrodite;
      this.scene.background.set(p.bg); this.scene.fog.color.set(p.fog); this.scene.fog.density = p.density;
      this.hemi?.color.set(p.sky); this.hemi?.groundColor.set(p.ground); if (this.hemi) this.hemi.intensity = p.hemi;
      this.sun?.color.set(p.sun); if (this.sun) { this.sun.intensity = p.sunI; this.sun.position.set(...p.pos); }
      if (this.renderer) this.renderer.toneMappingExposure = p.exposure;
    }
    async loadRadarMacroTexture() {
      try { const loader = new this.THREE.TextureLoader(); loader.setCrossOrigin?.("anonymous"); const texture = await loader.loadAsync(MAGELLAN_GLOBAL_RADAR); if (this.terrain) this.terrain.setMacroTexture(texture); }
      catch { /* Radar texture is visual context only. Topography status is reported separately. */ }
    }
    makeParticles() {
      const T = this.THREE, count = this.quality.particles, g = new T.BufferGeometry(), a = new Float32Array(count * 3);
      for (let i = 0; i < count; i += 1) { a[i * 3] = (Math.random() - .5) * 74; a[i * 3 + 1] = Math.random() * 20 + .2; a[i * 3 + 2] = (Math.random() - .5) * 74; }
      g.setAttribute("position", new T.BufferAttribute(a, 3)); const m = new T.PointsMaterial({ color: "#ffd09a", size: .025, transparent: true, opacity: .24, depthWrite: false }); this.particles = new T.Points(g, m); this.scene.add(this.particles);
    }
    resize() { if (!this.renderer) return; const r = this.viewport.getBoundingClientRect(), w = Math.max(2, r.width), h = Math.max(2, r.height); this.renderer.setSize(w, h, false); this.camera.aspect = w / h; this.camera.updateProjectionMatrix(); }
    resetCamera() { const h = this.terrain.height(0, 5); this.camera.position.set(0, Math.min(MAX_ALTITUDE_KM - .4, h + 1.55), 6.4); this.yaw = this.location.heading || 0; this.pitch = -.10; this.speed = 0; this.velocity.x = this.velocity.y = this.velocity.z = 0; this.applyCameraRotation(); this.terrain.prime(this.camera); this.terrain.updateVisibility(this.camera); }
    applyCameraRotation() { this.camera.rotation.set(this.pitch, this.yaw, 0, "YXZ"); }
    dataBadgeText() { return this.topography?.activeMode === "GTDR_4_6KM" ? "MACRO RELIEF: MAGELLAN GTDR" : "MACRO RELIEF: FALLBACK (PDS UNAVAILABLE)"; }
    showLocationCard(force = true) { if (!this.landmarkCard) return; if (force) this.cardClosed = false; if (this.cardClosed) return; this.landmarkCard.classList.add("is-visible"); this.landmarkCard.classList.remove("is-collapsed"); this.cardCollapse?.setAttribute("aria-expanded", "true"); if (this.cardOpen) this.cardOpen.hidden = true; }
    syncLocationHUD() {
      const l = this.location; this.hudLocation.textContent = l.name; this.hudCoordinates.textContent = fmtCoord(l.latitude, l.longitudeEast); this.hudQuality.textContent = this.quality.name; this.hudData.textContent = this.topography?.statusLabel?.() || "MAGELLAN DATA PIPELINE";
      this.landmarkName.textContent = l.name; this.landmarkType.textContent = `${l.category} · ${l.type}`; this.landmarkCoords.textContent = fmtCoord(l.latitude, l.longitudeEast); this.landmarkDescription.textContent = l.description;
      this.landmarkFacts.replaceChildren(...l.facts.map(text => { const li = document.createElement("li"); li.textContent = text; return li; }));
      this.landmarkSource.href = l.scienceSource; this.landmarkCoordinateSource.href = l.coordinateSource; this.landmarkTopographySource.href = "https://pds-geosciences.wustl.edu/missions/magellan/gxdr/index.htm"; this.landmarkDataBadge.textContent = this.dataBadgeText(); this.landmarkImageLabel.textContent = l.radarLabel;
      this.landmarkImage.hidden = false; this.landmarkImage.src = l.radarImage; this.landmarkImage.alt = `${l.name}, visual radar Magellan. ${l.radarLabel}.`; this.landmarkImage.onerror = () => { this.landmarkImage.hidden = true; };
      this.root.dataset.location = l.id;
    }
    async enter() {
      if (!this.venus.active || this.venus.exploring || this.state !== STATES.IDLE) return; const token = ++this.transitionToken; this.state = STATES.PREPARING; this.entryButton.disabled = true; this.error.hidden = true; this.loading.hidden = false; this.tutorial.classList.remove("is-dismissed");
      this.root.hidden = false; this.root.setAttribute("aria-hidden", "false"); this.root.className = "mars-full-exploration venus-full-exploration is-preparing"; document.getElementById("mission").classList.add("is-venus-full"); this.venus.beginFullExploration?.(this.location); this.loadingProgress.style.transform = "scaleX(.05)";
      try {
        await this.prepareRenderer(token); if (token !== this.transitionToken) return; this.loadingStatus.textContent = "MEMUAT TOPOGRAFI MAGELLAN"; this.loadingProgress.style.transform = "scaleX(.72)";
        await this.terrain.setLocation(this.location); if (token !== this.transitionToken) return; this.applyLocationEnvironment(this.location); this.resetCamera(); this.syncLocationHUD(); this.loadingStatus.textContent = "MENEMBUS LAPISAN AWAN VENUS"; this.loadingProgress.style.transform = "scaleX(1)"; await sleep(520); if (token !== this.transitionToken) return;
        this.state = STATES.ENTERING; this.root.className = "mars-full-exploration venus-full-exploration is-entering"; await sleep(900); if (token !== this.transitionToken) return; this.loading.hidden = true; this.state = STATES.EXPLORING; this.root.className = "mars-full-exploration venus-full-exploration is-active"; this.tutorial.classList.add("is-visible"); this.showLocationCard(true); this.last = performance.now(); this.loop(this.last); document.getElementById("announcement").textContent = `Eksplorasi penuh Venus dimulai di ${this.location.name}.`;
      } catch (err) { console.error(err); this.state = STATES.ERROR; this.errorMessage.textContent = err.message || "Renderer Venus tidak dapat disiapkan."; this.error.hidden = false; this.loading.hidden = true; }
    }
    updateMovement(dt) {
      if (this.state !== STATES.EXPLORING) return; const T = this.THREE, forward = new T.Vector3(-Math.sin(this.yaw), 0, -Math.cos(this.yaw)), right = new T.Vector3(Math.cos(this.yaw), 0, -Math.sin(this.yaw));
      let dx = 0, dz = 0, dy = 0; if (this.keys.has("KeyW") || this.keys.has("forward")) { dx += forward.x; dz += forward.z; } if (this.keys.has("KeyS") || this.keys.has("backward")) { dx -= forward.x; dz -= forward.z; } if (this.keys.has("KeyA") || this.keys.has("left")) { dx -= right.x; dz -= right.z; } if (this.keys.has("KeyD") || this.keys.has("right")) { dx += right.x; dz += right.z; } if (this.keys.has("KeyQ") || this.keys.has("down")) dy -= 1; if (this.keys.has("KeyE") || this.keys.has("up")) dy += 1;
      const len = Math.hypot(dx, dz) || 1, boost = (this.keys.has("ShiftLeft") || this.keys.has("ShiftRight")) ? 3.1 : 1;
      const targetX = dx / len * 4.3 * boost, targetZ = dz / len * 4.3 * boost, targetY = dy * 3.2 * boost;
      const moving = Math.abs(dx) + Math.abs(dz) + Math.abs(dy) > 0;
      const response = 1 - Math.exp(-dt * (moving ? 12.5 : 17.0));
      this.velocity.x += (targetX - this.velocity.x) * response; this.velocity.z += (targetZ - this.velocity.z) * response; this.velocity.y += (targetY - this.velocity.y) * response;
      this.camera.position.x += this.velocity.x * dt; this.camera.position.z += this.velocity.z * dt; this.camera.position.y += this.velocity.y * dt;
      const ground = this.terrain.height(this.camera.position.x, this.camera.position.z), min = ground + MIN_CLEARANCE_KM;
      if (this.camera.position.y < min) { this.camera.position.y = min; if (this.velocity.y < 0) this.velocity.y *= .12; }
      if (this.camera.position.y > MAX_ALTITUDE_KM) { this.camera.position.y = MAX_ALTITUDE_KM; if (this.velocity.y > 0) this.velocity.y = 0; }
      this.speed = Math.hypot(this.velocity.x, this.velocity.z, this.velocity.y); this.applyCameraRotation();
    }
    geoPosition() { return this.terrain.geoForWorld(this.camera.position.x, this.camera.position.z, this.location); }
    updateHUD() { const g = this.terrain.height(this.camera.position.x, this.camera.position.z), clear = this.camera.position.y - g, geo = this.geoPosition(); this.hudCoordinates.textContent = fmtCoord(geo.lat, geo.lon); this.hudAltitude.textContent = `${fmtAlt(this.camera.position.y)} · ${fmtAlt(clear)} AGL`; this.hudSpeed.textContent = this.speed < 1 ? `${Math.round(this.speed * 1000)} M/S` : `${this.speed.toFixed(2)} KM/S`; }
    loop(now) {
      if (!this.active || !this.renderer) return; const dt = Math.min(.05, Math.max(.001, (now - this.last) / 1000)); this.last = now; this.updateMovement(dt); this.lodClock += dt; this.hudClock += dt;
      if (this.lodClock > .28) { this.terrain.updateLOD(this.camera); this.lodClock = 0; }
      // View culling is cheap enough to resolve every frame after the final camera pose.
      this.terrain.updateVisibility(this.camera);
      if (this.particles) { this.particles.rotation.y += dt * .012; this.particles.position.x = this.camera.position.x * .7; this.particles.position.z = this.camera.position.z * .7; }
      if (this.hudClock > .10) { this.updateHUD(); this.hudClock = 0; }
      this.renderer.render(this.scene, this.camera); this.adaptResolution(dt); this.frame = requestAnimationFrame(t => this.loop(t));
    }
    async travelTo(location) {
      if (this.state !== STATES.EXPLORING || location.id === this.location.id) return; this.state = STATES.TRAVELLING; this.keys.clear(); if (document.pointerLockElement === this.viewport) document.exitPointerLock?.(); this.locationMenu.classList.remove("is-open"); this.locationToggle.setAttribute("aria-expanded", "false"); this.travelLabel.textContent = `MENUJU ${location.name.toUpperCase()}`; this.travelVeil.classList.add("is-visible");
      await sleep(320); this.location = location; this.travelLabel.textContent = `MEMUAT MAGELLAN · ${location.name.toUpperCase()}`; await this.terrain.setLocation(location); this.applyLocationEnvironment(location); this.resetCamera(); this.syncLocationHUD(); await sleep(420); this.travelVeil.classList.remove("is-visible"); this.state = STATES.EXPLORING; this.showLocationCard(true); document.getElementById("announcement").textContent = `Lokasi Venus: ${location.name}.`;
    }
    async exit() {
      if (this.state === STATES.IDLE || this.state === STATES.EXITING) return; const token = ++this.transitionToken; this.state = STATES.EXITING; this.keys.clear(); if (document.pointerLockElement === this.viewport) document.exitPointerLock?.(); this.locationMenu.classList.remove("is-open"); this.landmarkCard?.classList.remove("is-visible"); if (this.cardOpen) this.cardOpen.hidden = true; this.root.classList.add("is-exiting");
      await sleep(720); if (token !== this.transitionToken) return; cancelAnimationFrame(this.frame); this.frame = null; this.root.hidden = true; this.root.setAttribute("aria-hidden", "true"); this.root.className = "mars-full-exploration venus-full-exploration"; document.getElementById("mission").classList.remove("is-venus-full"); this.venus.endFullExploration?.(); this.state = STATES.IDLE; this.entryButton.disabled = false; this.entryButton.focus({ preventScroll: true }); document.getElementById("announcement").textContent = "Kembali ke panorama Venus.";
    }
    forceReset() {
      this.transitionToken += 1; cancelAnimationFrame(this.frame); this.frame = null; this.keys.clear(); if (document.pointerLockElement === this.viewport) document.exitPointerLock?.(); this.root.hidden = true; this.root.setAttribute("aria-hidden", "true"); this.root.className = "mars-full-exploration venus-full-exploration"; document.getElementById("mission").classList.remove("is-venus-full"); this.venus.endFullExploration?.(); this.state = STATES.IDLE; this.entryButton.disabled = false;
    }
    async toggleFullscreen() { try { if (document.fullscreenElement === this.root) await document.exitFullscreen(); else await this.root.requestFullscreen?.(); } catch {} this.updateFullscreen(); }
    updateFullscreen() { const a = document.fullscreenElement === this.root; this.fullscreenButton.setAttribute("aria-pressed", String(a)); this.fullscreenButton.querySelector("span").textContent = a ? "Keluar layar penuh" : "Layar penuh"; }
  }

  window.VenusFullExploration = VenusFullExploration;
})();
