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
    if (mobile || low) return { name: "MOBILE", outerRadius: 5, chunkSize: 9.5, near: 48, mid: 24, far: 12, horizon: 6, dpr: 1.2, particles: 420, cacheLimit: 150 };
    return { name: "HIGH", outerRadius: 7, chunkSize: 9.5, near: 88, mid: 44, far: 20, horizon: 8, dpr: Math.min(1.8, devicePixelRatio || 1), particles: 1050, cacheLimit: 280 };
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
      material.customProgramCacheKey = () => `antara-venus-science-terrain-v4-${this.quality.name}`;
      return material;
    }
    geoForWorld(x, z, poi = this.poi) {
      const lat = clamp(poi.latitude - z / KM_PER_DEG, -89.9, 89.9);
      const cosLat = Math.max(.12, Math.cos(poi.latitude * DEG));
      const lon = eastLon(poi.longitudeEast + x / (KM_PER_DEG * cosLat));
      return { lat, lon };
    }
    fallbackHeight(x, z, poi = this.poi) {
      const n = fbm(x, z), micro = Math.sin(x * 1.6 + z * .3) * Math.cos(z * 1.25 - x * .22) * .045;
      if (poi.profile === "shield") { const r = Math.hypot(x * .86, z); return .35 + n * .32 + 5.4 * Math.exp(-(r * r) / 92) - .55 * Math.exp(-(r * r) / 2.3) + micro; }
      if (poi.profile === "mountain") { const a = ridge(Math.sin((x + z * .32) * .46)), b = ridge(Math.sin((z - x * .18) * .58)); return 4.7 + n * .44 + a * b * 1.2 + micro; }
      if (poi.profile === "plateau") { const r = Math.hypot(x * .72, z); return 2.2 + 2.0 * smooth(1 - r / 24) + n * .28 + micro; }
      if (poi.profile === "tessera") { const a = ridge(Math.sin(x * .62 + z * .25)), b = ridge(Math.sin(z * .58 - x * .31)); return 1.1 + n * .24 + a * b * .7 + micro; }
      return 1.2 + n * .34 + Math.sin(x * .10) * Math.cos(z * .08) * .45 + micro;
    }
    microHeight(x, z) {
      const p = this.poi.profile;
      const base = fbm(x * 2.4 + 17, z * 2.4 - 11) * (p === "tessera" ? .045 : .028);
      if (p === "tessera") return base + ridge(Math.sin(x * .85 + z * .31)) * ridge(Math.sin(z * .72 - x * .28)) * .035;
      if (p === "mountain") return base + ridge(Math.sin(x * .34 + z * .11)) * .018;
      if (p === "highland") return base + Math.sin(x * .27 + z * .16) * .018;
      if (p === "shield") return base + Math.sin(x * .19 - z * .07) * .012;
      return base;
    }
    height(x, z, poi = this.poi) {
      const geo = this.geoForWorld(x, z, poi);
      const measured = this.provider.sample(poi, geo.lat, geo.lon);
      if (Number.isFinite(measured)) return measured + this.microHeight(x, z);
      return this.fallbackHeight(x, z, poi);
    }
    colorFor(h, slope, x, z) {
      const T = this.THREE, p = this.poi.profile;
      const variation = (hash2(x * .51, z * .47) - .5) * .10;
      let c;
      if (p === "shield") c = h > 6 ? new T.Color("#6d4129") : h > 3 ? new T.Color("#82492d") : new T.Color("#995a34");
      else if (p === "mountain") c = h > 8 ? new T.Color("#9e724b") : h > 5 ? new T.Color("#7b4b31") : new T.Color("#8f5736");
      else if (p === "plateau") c = h > 5 ? new T.Color("#865333") : new T.Color("#a16239");
      else if (p === "tessera") c = slope > .45 ? new T.Color("#74402b") : new T.Color(h > 2.5 ? "#875036" : "#9d5b37");
      else c = slope > .50 ? new T.Color("#6e402d") : new T.Color(h > 3 ? "#7e4a31" : "#9a5b38");
      c.offsetHSL(0, 0, variation - slope * .035); return c;
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
      for (let row = 0; row <= segments; row += 1) for (let col = 0; col <= segments; col += 1) {
        const i = row * count + col; const dx = Math.max(.04, Math.abs(xs[row * count + Math.min(segments, col + 1)] - xs[row * count + Math.max(0, col - 1)]));
        const dz = Math.max(.04, Math.abs(zs[Math.min(segments, row + 1) * count + col] - zs[Math.max(0, row - 1) * count + col]));
        const gx = (hAt(row, col + 1) - hAt(row, col - 1)) / dx, gz = (hAt(row + 1, col) - hAt(row - 1, col)) / dz;
        const slope = clamp(Math.hypot(gx, gz) * 1.8, 0, 1), colr = this.colorFor(heights[i], slope, xs[i], zs[i]);
        colors[i * 3] = colr.r; colors[i * 3 + 1] = colr.g; colors[i * 3 + 2] = colr.b;
      }
      uv.needsUpdate = true; pos.needsUpdate = true; g.setAttribute("color", new T.BufferAttribute(colors, 3)); g.computeVertexNormals(); g.computeBoundingSphere(); g.computeBoundingBox();
      this.geometryCache.set(key, { geometry: g, lastUsed: performance.now() }); this.pruneGeometryCache(); return g;
    }
    pruneGeometryCache() {
      if (this.geometryCache.size <= this.quality.cacheLimit) return;
      const active = new Set([...this.chunks.values()].map(mesh => mesh.geometry));
      const candidates = [...this.geometryCache.entries()].filter(([, v]) => !active.has(v.geometry)).sort((a, b) => a[1].lastUsed - b[1].lastUsed);
      while (this.geometryCache.size > this.quality.cacheLimit && candidates.length) { const [key, value] = candidates.shift(); value.geometry.dispose(); this.geometryCache.delete(key); }
    }
    desiredSegments(ring, distance) {
      if (distance < 11) return this.quality.near;
      if (distance < 24 || ring <= 1) return this.quality.mid;
      if (ring <= 3) return this.quality.far;
      return this.quality.horizon;
    }
    ensureChunk(cx, cz, centerCX, centerCZ) {
      const key = `${cx},${cz}`, ring = Math.max(Math.abs(cx - centerCX), Math.abs(cz - centerCZ));
      let mesh = this.chunks.get(key);
      const d = Math.hypot((cx * this.chunkSize), (cz * this.chunkSize));
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
        const cx = centerCX + dx, cz = centerCZ + dz, key = `${cx},${cz}`; keep.add(key); this.ensureChunk(cx, cz, centerCX, centerCZ);
      }
      for (const [key, mesh] of this.chunks) if (!keep.has(key)) { this.group.remove(mesh); this.chunks.delete(key); }
      this.pruneGeometryCache();
    }
    updateLOD(camera) {
      this.stream(camera);
      for (const mesh of this.chunks.values()) {
        const dx = camera.position.x - mesh.position.x, dz = camera.position.z - mesh.position.z, d = Math.hypot(dx, dz);
        const desired = this.desiredSegments(mesh.userData.ring, d);
        if (mesh.userData.segments !== desired) { mesh.geometry = this.geometry(mesh.userData.cx, mesh.userData.cz, desired); mesh.userData.segments = desired; }
      }
    }
    async setLocation(poi) {
      this.poi = poi; this.lastStreamCX = Infinity; this.lastStreamCZ = Infinity;
      const mode = await this.provider.prepare(poi);
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
      this.state = STATES.IDLE; this.location = LOCATIONS[0]; this.quality = qualityTier(); this.keys = new Set(); this.yaw = 0; this.pitch = -.08; this.speed = 0; this.frame = null; this.last = 0; this.lodClock = 0; this.transitionToken = 0; this.abort = new AbortController(); this.cardClosed = false;
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
      this.renderer = new THREE.WebGLRenderer({ antialias: true, powerPreference: "high-performance" }); this.renderer.setPixelRatio(this.quality.dpr); this.renderer.outputColorSpace = THREE.SRGBColorSpace; this.renderer.toneMapping = THREE.ACESFilmicToneMapping; this.renderer.toneMappingExposure = 1.10; this.renderer.domElement.className = "mars-full-canvas"; this.viewport.replaceChildren(this.renderer.domElement);
      this.scene = new THREE.Scene(); this.scene.background = new THREE.Color("#8a4d2d"); this.scene.fog = new THREE.FogExp2("#b86b3d", .028); this.camera = new THREE.PerspectiveCamera(67, 1, .03, 165); this.camera.rotation.order = "YXZ";
      this.scene.add(new THREE.HemisphereLight("#ffe0aa", "#32130d", 1.75)); const sun = new THREE.DirectionalLight("#ffd3a0", 2.55); sun.position.set(-8, 12, 5); this.scene.add(sun);
      this.topography = new MagellanTopographyProvider(); this.terrain = new VenusTerrain(THREE, this.scene, this.renderer, this.quality, this.topography); this.loadRadarMacroTexture(); this.loadingProgress.style.transform = "scaleX(.52)"; this.makeParticles(); this.loadingProgress.style.transform = "scaleX(.68)"; this.resize(); window.addEventListener("resize", () => this.resize(), { signal: this.abort.signal });
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
    resetCamera() { const h = this.terrain.height(0, 5); this.camera.position.set(0, Math.min(MAX_ALTITUDE_KM - .4, h + 1.55), 6.4); this.yaw = this.location.heading || 0; this.pitch = -.10; this.speed = 0; this.applyCameraRotation(); this.terrain.prime(this.camera); }
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
        await this.terrain.setLocation(this.location); if (token !== this.transitionToken) return; this.resetCamera(); this.syncLocationHUD(); this.loadingStatus.textContent = "MENEMBUS LAPISAN AWAN VENUS"; this.loadingProgress.style.transform = "scaleX(1)"; await sleep(520); if (token !== this.transitionToken) return;
        this.state = STATES.ENTERING; this.root.className = "mars-full-exploration venus-full-exploration is-entering"; await sleep(900); if (token !== this.transitionToken) return; this.loading.hidden = true; this.state = STATES.EXPLORING; this.root.className = "mars-full-exploration venus-full-exploration is-active"; this.tutorial.classList.add("is-visible"); this.showLocationCard(true); this.last = performance.now(); this.loop(this.last); document.getElementById("announcement").textContent = `Eksplorasi penuh Venus dimulai di ${this.location.name}.`;
      } catch (err) { console.error(err); this.state = STATES.ERROR; this.errorMessage.textContent = err.message || "Renderer Venus tidak dapat disiapkan."; this.error.hidden = false; this.loading.hidden = true; }
    }
    updateMovement(dt) {
      if (this.state !== STATES.EXPLORING) return; const T = this.THREE, forward = new T.Vector3(-Math.sin(this.yaw), 0, -Math.cos(this.yaw)), right = new T.Vector3(Math.cos(this.yaw), 0, -Math.sin(this.yaw));
      let dx = 0, dz = 0, dy = 0; if (this.keys.has("KeyW") || this.keys.has("forward")) { dx += forward.x; dz += forward.z; } if (this.keys.has("KeyS") || this.keys.has("backward")) { dx -= forward.x; dz -= forward.z; } if (this.keys.has("KeyA") || this.keys.has("left")) { dx -= right.x; dz -= right.z; } if (this.keys.has("KeyD") || this.keys.has("right")) { dx += right.x; dz += right.z; } if (this.keys.has("KeyQ") || this.keys.has("down")) dy -= 1; if (this.keys.has("KeyE") || this.keys.has("up")) dy += 1;
      const len = Math.hypot(dx, dz) || 1, boost = (this.keys.has("ShiftLeft") || this.keys.has("ShiftRight")) ? 3.1 : 1, move = 4.3 * boost * dt; this.camera.position.x += dx / len * move; this.camera.position.z += dz / len * move; this.camera.position.y += dy * 3.2 * boost * dt;
      const ground = this.terrain.height(this.camera.position.x, this.camera.position.z), min = ground + MIN_CLEARANCE_KM; this.camera.position.y = clamp(this.camera.position.y, min, MAX_ALTITUDE_KM); this.speed = Math.hypot(dx, dz, dy) * 4.3 * boost; this.applyCameraRotation();
    }
    geoPosition() { return this.terrain.geoForWorld(this.camera.position.x, this.camera.position.z, this.location); }
    updateHUD() { const g = this.terrain.height(this.camera.position.x, this.camera.position.z), clear = this.camera.position.y - g, geo = this.geoPosition(); this.hudCoordinates.textContent = fmtCoord(geo.lat, geo.lon); this.hudAltitude.textContent = `${fmtAlt(this.camera.position.y)} · ${fmtAlt(clear)} AGL`; this.hudSpeed.textContent = this.speed < 1 ? `${Math.round(this.speed * 1000)} M/S` : `${this.speed.toFixed(2)} KM/S`; }
    loop(now) {
      if (!this.active || !this.renderer) return; const dt = Math.min(.05, Math.max(.001, (now - this.last) / 1000)); this.last = now; this.updateMovement(dt); this.lodClock += dt;
      if (this.lodClock > .32) { this.terrain.updateLOD(this.camera); this.lodClock = 0; }
      if (this.particles) { this.particles.rotation.y += dt * .012; this.particles.position.x = this.camera.position.x * .7; this.particles.position.z = this.camera.position.z * .7; }
      this.updateHUD(); this.renderer.render(this.scene, this.camera); this.frame = requestAnimationFrame(t => this.loop(t));
    }
    async travelTo(location) {
      if (this.state !== STATES.EXPLORING || location.id === this.location.id) return; this.state = STATES.TRAVELLING; this.keys.clear(); if (document.pointerLockElement === this.viewport) document.exitPointerLock?.(); this.locationMenu.classList.remove("is-open"); this.locationToggle.setAttribute("aria-expanded", "false"); this.travelLabel.textContent = `MENUJU ${location.name.toUpperCase()}`; this.travelVeil.classList.add("is-visible");
      await sleep(320); this.location = location; this.travelLabel.textContent = `MEMUAT MAGELLAN · ${location.name.toUpperCase()}`; await this.terrain.setLocation(location); this.resetCamera(); this.syncLocationHUD(); await sleep(420); this.travelVeil.classList.remove("is-visible"); this.state = STATES.EXPLORING; this.showLocationCard(true); document.getElementById("announcement").textContent = `Lokasi Venus: ${location.name}.`;
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
