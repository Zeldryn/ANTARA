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
    if (mobile || low) return { name: "MOBILE", outerRadius: 5, chunkSize: 9.5, near: 48, mid: 24, far: 12, horizon: 6, dpr: 1.20, minDpr: 0.92, particles: 420, cacheLimit: 190 };
    return { name: "HIGH", outerRadius: 7, chunkSize: 9.5, near: 96, mid: 48, far: 24, horizon: 12, dpr: Math.min(1.8, devicePixelRatio || 1), minDpr: 1.08, particles: 920, cacheLimit: 340 };
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
      this.poi = LOCATIONS[0]; this.chunkSize = quality.chunkSize; this.chunks = new Map(); this.geometryCache = new Map(); this.meshPool = [];
      this.detail = this.makeDetailTexture(); this.materials = [0, 1, 2, 3].map(tier => this.makeMaterial(tier)); this.material = this.materials[3];
      this.group = new THREE.Group(); scene.add(this.group); this.macroTexture = null; this.lastStreamCX = Infinity; this.lastStreamCZ = Infinity;
      this.frustum = new THREE.Frustum(); this.projectionScreenMatrix = new THREE.Matrix4(); this.cameraForward = new THREE.Vector3();
      this.chunkCenter = new THREE.Vector3(); this.chunkVector = new THREE.Vector3(); this.visibilityStats = { visible: 0, buffered: 0, culled: 0, high: 0, medium: 0, low: 0 };
      this.debugEnabled = typeof location !== "undefined" && new URLSearchParams(location.search).get("venusTerrainDebug") === "1";
      this.lastDebugLog = 0; this.lastGeometryBuild = 0; this.pendingGeometry = new Map(); this.geometryQueue = []; this.geometryQueueKeys = new Set(); this.geometryWorkerActive = false; this.locationGeneration = 0;
    }
    makeDetailTexture() {
      const c = document.createElement("canvas"); c.width = c.height = 256; const ctx = c.getContext("2d"); const img = ctx.createImageData(256, 256);
      for (let y = 0; y < 256; y += 1) for (let x = 0; x < 256; x += 1) {
        const i = (y * 256 + x) * 4; const coarse = hash2(x * .19, y * .19); const fine = hash2(x * 1.9 + 17, y * 1.7 + 5); const vein = Math.abs(Math.sin(x * .11 + y * .07));
        const v = clamp(126 + (coarse - .5) * 40 + (fine - .5) * 30 + vein * 12, 45, 225);
        img.data[i] = v; img.data[i + 1] = v; img.data[i + 2] = v; img.data[i + 3] = 255;
      }
      ctx.putImageData(img, 0, 0); const t = new this.THREE.CanvasTexture(c); t.wrapS = t.wrapT = this.THREE.RepeatWrapping; t.colorSpace = this.THREE.NoColorSpace;
      t.minFilter = this.THREE.LinearMipmapLinearFilter; t.magFilter = this.THREE.LinearFilter; t.generateMipmaps = true;
      t.anisotropy = Math.min(8, this.renderer.capabilities.getMaxAnisotropy()); t.needsUpdate = true; return t;
    }
    makeMaterial(detailTier = 3) {
      const T = this.THREE;
      const material = new T.MeshStandardMaterial({ map: null, bumpMap: this.detail, bumpScale: .001, vertexColors: true, roughness: .92, metalness: .015, side: T.FrontSide });
      material.userData.venusDetailTier = detailTier;
      material.onBeforeCompile = shader => {
        shader.uniforms.uVenusDetail = { value: this.detail };
        shader.uniforms.uVenusDetailScale = { value: .95 };
        shader.uniforms.uVenusDetailTier = { value: material.userData.venusDetailTier };
        shader.vertexShader = shader.vertexShader
          .replace("#include <common>", "#include <common>\nvarying vec3 vVenusWorldPosition;")
          .replace("#include <begin_vertex>", "#include <begin_vertex>\nvVenusWorldPosition = (modelMatrix * vec4(transformed, 1.0)).xyz;");
        shader.fragmentShader = shader.fragmentShader
          .replace("#include <common>", `#include <common>
            varying vec3 vVenusWorldPosition;
            uniform sampler2D uVenusDetail;
            uniform float uVenusDetailScale;
            uniform float uVenusDetailTier;
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
            float venusNear = 1.0 - smoothstep(7.0, 34.0, venusDistance);
            float venusMid = 1.0 - smoothstep(18.0, 72.0, venusDistance);
            float venusBroad = 0.5;
            float venusFine = 0.5;
            if (uVenusDetailTier > 0.5) venusBroad = venusTriSample(uVenusDetail, vVenusWorldPosition, venusGeomNormal, uVenusDetailScale * 0.48);
            if (uVenusDetailTier > 1.5) venusFine = venusTriSample(uVenusDetail, vVenusWorldPosition, venusGeomNormal, uVenusDetailScale * 2.15);
            float venusMicroHeight = (venusBroad - 0.5) * 0.62 * venusMid + (venusFine - 0.5) * 0.38 * venusNear;
            float venusMicro = (venusBroad - 0.5) * 0.15 * venusMid + (venusFine - 0.5) * 0.085 * venusNear;
            diffuseColor.rgb *= clamp(1.0 + venusMicro, 0.85, 1.15);`)
          .replace("#include <normal_fragment_maps>", `#include <normal_fragment_maps>
            #ifdef USE_BUMPMAP
              if (uVenusDetailTier > 2.5) {
                vec2 venusSlope = vec2(dFdx(venusMicroHeight), dFdy(venusMicroHeight));
                normal = perturbNormalArb(-vViewPosition, normal, venusSlope * (4.6 + 1.8 * venusNear), faceDirection);
              }
            #endif`)
          .replace("#include <roughnessmap_fragment>", `#include <roughnessmap_fragment>
            if (uVenusDetailTier > 0.5) roughnessFactor = clamp(roughnessFactor + (venusBroad - 0.5) * 0.10 + (venusFine - 0.5) * 0.035 * venusNear, 0.70, 0.99);`);
        material.userData.venusShader = shader;
      };
      material.customProgramCacheKey = () => `antara-venus-morphology-viewlod-v7-${this.quality.name}`;
      return material;
    }
    setMeshDetailTier(mesh, tier) {
      const clamped = clamp(Math.round(tier), 0, 3);
      if (mesh.userData.detailTier === clamped && mesh.material === this.materials[clamped]) return;
      mesh.userData.detailTier = clamped; mesh.material = this.materials[clamped];
      const shader = mesh.material.userData.venusShader;
      if (shader?.uniforms?.uVenusDetailTier) shader.uniforms.uVenusDetailTier.value = clamped;
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
      const frequencyWarp = 1 + Math.sin(q.u * .031 + q.v * .019 + 1.7) * .065 + Math.cos(q.v * .043 - q.u * .012) * .035;
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
    faultValley(x, z, angleDeg, offsetKm, widthKm = 1.4, warpKm = 4.0) {
      const q = this.rotatedCoords(x, z, angleDeg);
      const center = offsetKm + Math.sin(q.v * .055 + offsetKm * .11) * warpKm + Math.sin(q.v * .017 - .8) * warpKm * .65;
      const d = Math.abs(q.u - center);
      return Math.exp(-(d * d) / Math.max(.02, widthKm * widthKm));
    }
    brokenFaultValley(x, z, angleDeg, offsetKm, widthKm = 1.0, warpKm = 4.0, phase = 0) {
      const base = this.faultValley(x, z, angleDeg, offsetKm, widthKm, warpKm);
      const q = this.rotatedCoords(x, z, angleDeg);
      const segmentWave = Math.sin(q.v * .061 + phase * 2.1 + Math.sin(q.v * .017 - phase) * 1.55);
      const segment = smooth(clamp((segmentWave + .62) / 1.10, 0, 1));
      const gateWave = Math.sin(q.v * .027 - phase * 1.7 + Math.sin(q.u * .018 + phase) * 1.35);
      const gate = .06 + .94 * smooth(clamp((gateWave + .70) / 1.16, 0, 1));
      return base * segment * gate;
    }
    brokenRidgeSet(x, z, angleDeg, spacingKm, sharpness, warpKm, phase = 0) {
      // Analytic, deterministic tectonic linework. The expensive low-frequency noise is
      // kept outside this helper so six Alpha ridge populations do not each run their
      // own multi-octave FBM stack for every terrain vertex.
      const q0 = this.rotatedCoords(x, z, angleDeg);
      const lateralWarp = Math.sin(q0.v * .047 + phase) * warpKm * .62
        + Math.sin((q0.v + q0.u * .16) * .018 - phase * .73) * warpKm * .42
        + Math.sin(q0.v * .011 + q0.u * .008 + phase * 1.31) * warpKm * .24;
      const q = this.rotatedCoords(x + Math.cos(angleDeg * DEG) * lateralWarp, z + Math.sin(angleDeg * DEG) * lateralWarp, angleDeg);
      const spacingVar = 1 + .14 * Math.sin(q.v * .031 + phase) + .055 * Math.sin(q.v * .011 - q.u * .008 + phase * 2.2);
      const wave = Math.sin(q.u * Math.PI / Math.max(.58, spacingKm * spacingVar) + phase);
      const crest = Math.pow(clamp(1 - Math.abs(wave), 0, 1), sharpness);

      const continuityWave = Math.sin(q.v * .073 + Math.sin(q.u * .019 + phase) * .92 + phase * 1.7);
      const continuity = .10 + .90 * smooth(clamp((continuityWave + .68) / 1.18, 0, 1));
      const segmentWave = Math.sin(q.v * .121 + phase * 2.3 + Math.sin(q.u * .027 - phase) * 1.18);
      const segmentMask = .06 + .94 * smooth(clamp((segmentWave + .52) / 1.00, 0, 1));
      const crossCutWave = Math.abs(Math.sin(q.v * .067 + phase * 1.9 + Math.sin(q.u * .014) * .84));
      const crossCut = .10 + .90 * smooth(clamp((crossCutWave - .06) / .46, 0, 1));
      return crest * continuity * segmentMask * crossCut;
    }
    regionalSignals(x, z, poi = this.poi) {
      const p = poi.profile;
      if (p === "tessera") {
        // Alpha Regio reference target: intersecting structural trends, fault valleys,
        // irregular upland blocks and smooth volcanic lows. The directions are a
        // deterministic morphology guide, not a claim that radar brightness is height.
        const noiseA = (Math.sin(x * .041 + z * .017 + .7) + Math.cos(z * .047 - x * .013 - 1.3) + Math.sin((x + z) * .021 + 2.1)) / 3;
        const noiseB = (Math.cos(x * .044 - z * .019 - 2.3) + Math.sin(z * .040 + x * .015 + 1.7) + Math.cos((x - z) * .018 - .4)) / 3;
        const broadNoise = noiseA * .56 + noiseB * .44;
        const maskA = clamp(.67 + noiseA * .28, .36, .96);
        const maskB = clamp(.69 + noiseB * .28, .38, .98);
        const maskC = clamp(.50 + (noiseA * .35 - noiseB * .25 + Math.sin((x - z) * .018) * .40) * .25, .22, .78);
        const ridgeA = clamp(this.brokenRidgeSet(x, z, 27, 8.4, 6, 4.2, .35) + this.brokenRidgeSet(x, z, 39, 16.8, 7, 5.0, 2.4) * .34, 0, 1) * maskA;
        const ridgeB = clamp(this.brokenRidgeSet(x, z, -47, 9.8, 6, 4.5, 1.27) + this.brokenRidgeSet(x, z, -61, 18.6, 7, 5.3, .72) * .36, 0, 1) * maskB;
        const cross = clamp(this.brokenRidgeSet(x, z, 76, 13.8, 7, 3.5, 2.15) + this.brokenRidgeSet(x, z, -6, 21.0, 8, 3.1, .18) * .36, 0, 1) * maskC;
        const trough = clamp(
          this.brokenFaultValley(x, z, 71, -24, .92, 4.8, .4) +
          this.brokenFaultValley(x, z, 71, 3, .82, 4.1, 1.7) +
          this.brokenFaultValley(x, z, 71, 29, .96, 5.2, 2.8) +
          this.brokenFaultValley(x, z, -8, -34, .88, 3.7, 3.9) * .48, 0, 1
        );
        const smoothLow = clamp(
          this.gaussianMask(x, z, 13, -9, 10, 6, 22) +
          this.gaussianMask(x, z, -18, 16, 8, 12, -31) +
          this.gaussianMask(x, z, 29, 18, 11, 7, 48) +
          this.gaussianMask(x, z, -34, -22, 12, 8, 8), 0, 1
        );
        const intersection = clamp((ridgeA + ridgeB + cross * .55 - .24) * 1.85, 0, 1);
        const blockField = smooth(clamp((broadNoise + .38) / .72, 0, 1));
        const blocks = clamp(intersection * .58 + blockField * .22, 0, 1) * (1 - smoothLow * .86);
        return { ridgeA, ridgeB, trough, cross, blocks, smoothLow, broadNoise, blockNoise: noiseA * .62 + noiseB * .38, structure: clamp(ridgeA * .47 + ridgeB * .50 + cross * .25 + trough * .38 + blocks * .23, 0, 1) };
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
    regionalStructureHeight(x, z, poi = this.poi, measured = false, signals = null) {
      const p = poi.profile, s = signals || this.regionalSignals(x, z, poi);
      const scale = measured ? 1 : 1.85;
      const micro = p === "tessera"
        ? (Math.sin(x * 2.73 + z * .41) + Math.cos(z * 2.31 - x * .37) + Math.sin((x + z) * 1.67)) * .0065
        : fbm(x * 2.7 + 17, z * 2.7 - 11) * .018;
      if (p === "tessera") {
        // Alpha Regio: two cross-cutting ridge populations + fault troughs + irregular upland blocks.
        const blockRelief = ((s.blocks || 0) - .08) * .085 + (s.blockNoise || 0) * .036;
        const ridged = ((s.ridgeA - .040) * .145 + (s.ridgeB - .040) * .150 + (s.cross - .024) * .112) * (1 - s.smoothLow * .86);
        const faults = -(s.trough - .014) * .102 * (1 - s.smoothLow * .38);
        const infill = -s.smoothLow * .074;
        return (blockRelief + ridged + faults + infill + micro * .60) * scale;
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
    fallbackBaseHeight(x, z, poi = this.poi) {
      const n = fbm(x * .62, z * .62), p = poi.profile;
      let base;
      if (p === "shield") {
        const q = this.rotatedCoords(x + 2.8, z - 1.5, -9); const r = Math.hypot(q.u * .78, q.v);
        const shoulder = 4.25 * Math.exp(-(r * r) / 1320) + .72 * this.gaussianMask(x, z, -18, 9, 28, 17, 28);
        const caldera = .34 * this.gaussianMask(x, z, 1.5, -1.2, 4.2, 3.1, 18);
        const plainsTilt = .18 * Math.sin((x - z * .34) * .020) + .10 * fbm(x * .12 + 8, z * .12 - 3);
        base = .42 + n * .14 + shoulder - caldera + plainsTilt;
      } else if (p === "mountain") {
        const q = this.rotatedCoords(x, z, 12); const massifSide = smooth(clamp((q.v + 22) / 48, 0, 1));
        const longWave = .52 * Math.sin(q.u * .043 + Math.sin(q.v * .018) * .8) * massifSide;
        base = 3.55 + 3.05 * massifSide + longWave + n * (.12 + .12 * massifSide);
      } else if (p === "plateau") {
        const q = this.rotatedCoords(x + 4, z - 2, 11); const plateau = smooth(clamp((q.v + 34) / 46, 0, 1));
        const broadStep = .32 * smooth(clamp((q.u + 38) / 76, 0, 1)); base = 2.70 + 1.10 * plateau + broadStep + n * (.08 + .08 * (1 - plateau));
      } else if (p === "tessera") {
        const broad = fbm(x * .13, z * .13) * .25; base = 1.35 + broad;
      } else {
        const q = this.rotatedCoords(x, z, 20); base = 1.55 + fbm(q.u * .15, q.v * .15) * .55 + Math.sin(q.u * .045) * .22;
      }
      return base;
    }
    terrainSample(x, z, poi = this.poi) {
      const signals = this.regionalSignals(x, z, poi); const geo = this.geoForWorld(x, z, poi); const measured = this.provider.sample(poi, geo.lat, geo.lon);
      const structure = this.regionalStructureHeight(x, z, poi, Number.isFinite(measured), signals);
      const fallbackBase = poi.profile === "tessera" ? 1.35 + (signals.broadNoise || 0) * .25 : this.fallbackBaseHeight(x, z, poi);
      return { height: Number.isFinite(measured) ? measured + structure : fallbackBase + structure, signals };
    }
    fallbackHeight(x, z, poi = this.poi) {
      const signals = this.regionalSignals(x, z, poi); const base = poi.profile === "tessera" ? 1.35 + (signals.broadNoise || 0) * .25 : this.fallbackBaseHeight(x, z, poi);
      return base + this.regionalStructureHeight(x, z, poi, false, signals);
    }
    height(x, z, poi = this.poi) { return this.terrainSample(x, z, poi).height; }
    colorFor(h, slope, x, z, signals = null) {
      const T = this.THREE, p = this.poi.profile, s = signals || this.regionalSignals(x, z, this.poi);
      const granular = (hash2(x * .51, z * .47) - .5) * .055;
      const broad = p === "tessera" ? (s.broadNoise || 0) * .030 : fbm(x * .12 + 9, z * .12 - 7) * .030;
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
    horizonHeight(x, z, poi = this.poi) {
      const geo = this.geoForWorld(x, z, poi); const measured = this.provider.sample(poi, geo.lat, geo.lon);
      if (Number.isFinite(measured)) return measured;
      const p = poi.profile;
      if (p === "shield") {
        const q = this.rotatedCoords(x + 2.8, z - 1.5, -9); const r = Math.hypot(q.u * .78, q.v);
        return .46 + 4.20 * Math.exp(-(r * r) / 1320) + .16 * Math.sin((x - z * .34) * .020);
      }
      if (p === "mountain") {
        const q = this.rotatedCoords(x, z, 12); const massifSide = smooth(clamp((q.v + 22) / 48, 0, 1));
        return 3.55 + 3.05 * massifSide + .42 * Math.sin(q.u * .043 + Math.sin(q.v * .018) * .8) * massifSide;
      }
      if (p === "plateau") {
        const q = this.rotatedCoords(x + 4, z - 2, 11); const plateau = smooth(clamp((q.v + 34) / 46, 0, 1));
        return 2.70 + 1.10 * plateau + .32 * smooth(clamp((q.u + 38) / 76, 0, 1));
      }
      if (p === "tessera") {
        return 1.35 + Math.sin(x * .019 + z * .011) * .10 + Math.sin(z * .016 - x * .008) * .08;
      }
      const q = this.rotatedCoords(x, z, 20);
      return 1.55 + Math.sin(q.u * .045) * .22 + Math.sin(q.u * .015 + q.v * .021) * .16;
    }
    horizonColorFor(h, slope) {
      const T = this.THREE, p = this.poi.profile; let c;
      if (p === "shield") c = new T.Color(h > 4.8 ? "#76513e" : "#936548");
      else if (p === "mountain") c = new T.Color(h > 6.8 ? "#94745a" : "#80604c");
      else if (p === "plateau") c = new T.Color("#80604c");
      else if (p === "tessera") c = new T.Color("#80604d");
      else c = new T.Color(h > 2.7 ? "#80604a" : "#8d664d");
      c.offsetHSL(0, -.02, -slope * .018); return c;
    }
    geometry(cx, cz, segments) {
      const key = this.cacheKey(cx, cz, segments); const cached = this.geometryCache.get(key);
      if (cached) { cached.lastUsed = performance.now(); return cached.geometry; }
      const T = this.THREE, lowCost = segments <= this.quality.horizon, n = segments + 1, topCount = n * n, step = this.chunkSize / segments, half = this.chunkSize * .5;
      const perimeter = [];
      for (let c = 0; c <= segments; c += 1) perimeter.push(c);
      for (let r = 1; r <= segments; r += 1) perimeter.push(r * n + segments);
      for (let c = segments - 1; c >= 0; c -= 1) perimeter.push(segments * n + c);
      for (let r = segments - 1; r >= 1; r -= 1) perimeter.push(r * n);
      const total = topCount + perimeter.length;
      const positions = new Float32Array(total * 3), normals = new Float32Array(total * 3), colors = new Float32Array(total * 3), uvs = new Float32Array(total * 2);
      const heights = new Float32Array(topCount), signals = new Array(topCount); const ox = cx * this.chunkSize, oz = cz * this.chunkSize;
      for (let row = 0; row <= segments; row += 1) for (let col = 0; col <= segments; col += 1) {
        const i = row * n + col, lx = -half + col * step, lz = -half + row * step, wx = lx + ox, wz = lz + oz;
        const sample = lowCost ? { height: this.horizonHeight(wx, wz), signals: null } : this.terrainSample(wx, wz); heights[i] = sample.height; signals[i] = sample.signals;
        positions[i * 3] = lx; positions[i * 3 + 1] = sample.height; positions[i * 3 + 2] = lz;
        const geo = this.geoForWorld(wx, wz); uvs[i * 2] = geo.lon / 360; uvs[i * 2 + 1] = (geo.lat + 90) / 180;
      }
      const hAt = (r, c) => heights[clamp(r, 0, segments) * n + clamp(c, 0, segments)];
      const normalStep = this.chunkSize / this.quality.near;
      for (let row = 0; row <= segments; row += 1) for (let col = 0; col <= segments; col += 1) {
        const i = row * n + col, wx = positions[i * 3] + ox, wz = positions[i * 3 + 2] + oz; let gx, gz;
        if (!lowCost && (row === 0 || row === segments || col === 0 || col === segments)) {
          const hL = this.height(wx - normalStep, wz), hR = this.height(wx + normalStep, wz), hN = this.height(wx, wz - normalStep), hS = this.height(wx, wz + normalStep);
          gx = (hR - hL) / (2 * normalStep); gz = (hS - hN) / (2 * normalStep);
        } else {
          gx = (hAt(row, col + 1) - hAt(row, col - 1)) / (2 * step); gz = (hAt(row + 1, col) - hAt(row - 1, col)) / (2 * step);
        }
        const inv = 1 / Math.max(.0001, Math.hypot(gx, 1, gz)); normals[i * 3] = -gx * inv; normals[i * 3 + 1] = inv; normals[i * 3 + 2] = -gz * inv;
        const slope = clamp(Math.hypot(gx, gz) * 1.75, 0, 1), colr = lowCost ? this.horizonColorFor(heights[i], slope) : this.colorFor(heights[i], slope, wx, wz, signals[i]);
        colors[i * 3] = colr.r; colors[i * 3 + 1] = colr.g; colors[i * 3 + 2] = colr.b;
      }
      const skirtDepth = this.poi.profile === "tessera" ? .22 : .16;
      for (let k = 0; k < perimeter.length; k += 1) {
        const src = perimeter[k], dst = topCount + k;
        positions[dst * 3] = positions[src * 3]; positions[dst * 3 + 1] = positions[src * 3 + 1] - skirtDepth; positions[dst * 3 + 2] = positions[src * 3 + 2];
        normals[dst * 3] = normals[src * 3]; normals[dst * 3 + 1] = normals[src * 3 + 1]; normals[dst * 3 + 2] = normals[src * 3 + 2];
        colors[dst * 3] = colors[src * 3] * .82; colors[dst * 3 + 1] = colors[src * 3 + 1] * .82; colors[dst * 3 + 2] = colors[src * 3 + 2] * .82;
        uvs[dst * 2] = uvs[src * 2]; uvs[dst * 2 + 1] = uvs[src * 2 + 1];
      }
      const indices = [];
      for (let row = 0; row < segments; row += 1) for (let col = 0; col < segments; col += 1) {
        const a = row * n + col, b = a + 1, c = a + n, d = c + 1; indices.push(a, c, b, b, c, d);
      }
      for (let k = 0; k < perimeter.length; k += 1) {
        const next = (k + 1) % perimeter.length, a = perimeter[k], b = perimeter[next], sa = topCount + k, sb = topCount + next; indices.push(a, b, sa, b, sb, sa);
      }
      const g = new T.BufferGeometry(); g.setAttribute("position", new T.BufferAttribute(positions, 3)); g.setAttribute("normal", new T.BufferAttribute(normals, 3)); g.setAttribute("color", new T.BufferAttribute(colors, 3)); g.setAttribute("uv", new T.BufferAttribute(uvs, 2));
      g.setIndex(indices); g.computeBoundingSphere(); g.computeBoundingBox(); this.geometryCache.set(key, { geometry: g, lastUsed: performance.now() }); this.pruneGeometryCache(); return g;
    }
    geometryAsync(cx, cz, segments) {
      const key = this.cacheKey(cx, cz, segments), cached = this.geometryCache.get(key);
      if (cached) { cached.lastUsed = performance.now(); return Promise.resolve(cached.geometry); }
      if (this.pendingGeometry.has(key)) return this.pendingGeometry.get(key);
      if (segments <= this.quality.horizon) return Promise.resolve(this.geometry(cx, cz, segments));

      const generation = this.locationGeneration;
      const task = (async () => {
        const T = this.THREE, n = segments + 1, topCount = n * n, step = this.chunkSize / segments, half = this.chunkSize * .5;
        const perimeter = [];
        for (let c = 0; c <= segments; c += 1) perimeter.push(c);
        for (let r = 1; r <= segments; r += 1) perimeter.push(r * n + segments);
        for (let c = segments - 1; c >= 0; c -= 1) perimeter.push(segments * n + c);
        for (let r = segments - 1; r >= 1; r -= 1) perimeter.push(r * n);
        const total = topCount + perimeter.length;
        const positions = new Float32Array(total * 3), normals = new Float32Array(total * 3), colors = new Float32Array(total * 3), uvs = new Float32Array(total * 2);
        const heights = new Float32Array(topCount), signals = new Array(topCount); const ox = cx * this.chunkSize, oz = cz * this.chunkSize;
        let sliceStart = performance.now();
        const yieldIfNeeded = async () => {
          if (performance.now() - sliceStart < 4.5) return;
          await new Promise(resolve => {
            if (typeof requestAnimationFrame === "function") requestAnimationFrame(() => resolve());
            else setTimeout(resolve, 0);
          });
          sliceStart = performance.now();
          if (generation !== this.locationGeneration) throw new Error("stale Venus geometry build");
          const liveChunk = this.chunks.get(`${cx},${cz}`);
          if (liveChunk && Number.isFinite(liveChunk.userData.targetSegments) && liveChunk.userData.targetSegments !== segments) throw new Error("stale Venus geometry target");
        };

        for (let row = 0; row <= segments; row += 1) {
          for (let col = 0; col <= segments; col += 1) {
            const i = row * n + col, lx = -half + col * step, lz = -half + row * step, wx = lx + ox, wz = lz + oz;
            const sample = this.terrainSample(wx, wz); heights[i] = sample.height; signals[i] = sample.signals;
            positions[i * 3] = lx; positions[i * 3 + 1] = sample.height; positions[i * 3 + 2] = lz;
            const geo = this.geoForWorld(wx, wz); uvs[i * 2] = geo.lon / 360; uvs[i * 2 + 1] = (geo.lat + 90) / 180;
            if ((col & 7) === 7) await yieldIfNeeded();
          }
          await yieldIfNeeded();
        }

        const hAt = (r, c) => heights[clamp(r, 0, segments) * n + clamp(c, 0, segments)];
        const normalStep = this.chunkSize / this.quality.near;
        for (let row = 0; row <= segments; row += 1) {
          for (let col = 0; col <= segments; col += 1) {
            const i = row * n + col, wx = positions[i * 3] + ox, wz = positions[i * 3 + 2] + oz; let gx, gz;
            if (row === 0 || row === segments || col === 0 || col === segments) {
              const hL = this.height(wx - normalStep, wz), hR = this.height(wx + normalStep, wz), hN = this.height(wx, wz - normalStep), hS = this.height(wx, wz + normalStep);
              gx = (hR - hL) / (2 * normalStep); gz = (hS - hN) / (2 * normalStep);
            } else {
              gx = (hAt(row, col + 1) - hAt(row, col - 1)) / (2 * step); gz = (hAt(row + 1, col) - hAt(row - 1, col)) / (2 * step);
            }
            const inv = 1 / Math.max(.0001, Math.hypot(gx, 1, gz)); normals[i * 3] = -gx * inv; normals[i * 3 + 1] = inv; normals[i * 3 + 2] = -gz * inv;
            const slope = clamp(Math.hypot(gx, gz) * 1.75, 0, 1), colr = this.colorFor(heights[i], slope, wx, wz, signals[i]);
            colors[i * 3] = colr.r; colors[i * 3 + 1] = colr.g; colors[i * 3 + 2] = colr.b;
            if ((col & 7) === 7) await yieldIfNeeded();
          }
          await yieldIfNeeded();
        }

        const skirtDepth = this.poi.profile === "tessera" ? .22 : .16;
        for (let k = 0; k < perimeter.length; k += 1) {
          const src = perimeter[k], dst = topCount + k;
          positions[dst * 3] = positions[src * 3]; positions[dst * 3 + 1] = positions[src * 3 + 1] - skirtDepth; positions[dst * 3 + 2] = positions[src * 3 + 2];
          normals[dst * 3] = normals[src * 3]; normals[dst * 3 + 1] = normals[src * 3 + 1]; normals[dst * 3 + 2] = normals[src * 3 + 2];
          colors[dst * 3] = colors[src * 3] * .82; colors[dst * 3 + 1] = colors[src * 3 + 1] * .82; colors[dst * 3 + 2] = colors[src * 3 + 2] * .82;
          uvs[dst * 2] = uvs[src * 2]; uvs[dst * 2 + 1] = uvs[src * 2 + 1];
        }
        const indices = [];
        for (let row = 0; row < segments; row += 1) for (let col = 0; col < segments; col += 1) {
          const a = row * n + col, b = a + 1, c = a + n, d = c + 1; indices.push(a, c, b, b, c, d);
        }
        for (let k = 0; k < perimeter.length; k += 1) {
          const next = (k + 1) % perimeter.length, a = perimeter[k], b = perimeter[next], sa = topCount + k, sb = topCount + next; indices.push(a, b, sa, b, sb, sa);
        }
        if (generation !== this.locationGeneration) throw new Error("stale Venus geometry build");
        const g = new T.BufferGeometry(); g.setAttribute("position", new T.BufferAttribute(positions, 3)); g.setAttribute("normal", new T.BufferAttribute(normals, 3)); g.setAttribute("color", new T.BufferAttribute(colors, 3)); g.setAttribute("uv", new T.BufferAttribute(uvs, 2));
        g.setIndex(indices); g.computeBoundingSphere(); g.computeBoundingBox(); this.geometryCache.set(key, { geometry: g, lastUsed: performance.now() }); this.pruneGeometryCache(); return g;
      })().finally(() => this.pendingGeometry.delete(key));
      this.pendingGeometry.set(key, task); return task;
    }
    queueGeometryUpgrade(mesh, desired, distance, inFrustum) {
      const cacheKey = this.cacheKey(mesh.userData.cx, mesh.userData.cz, desired), cached = this.geometryCache.get(cacheKey);
      if (cached) { cached.lastUsed = performance.now(); mesh.geometry = cached.geometry; mesh.userData.segments = desired; return; }
      if (this.pendingGeometry.has(cacheKey) || this.geometryQueueKeys.has(cacheKey)) return;
      this.geometryQueueKeys.add(cacheKey); this.geometryQueue.push({ mesh, desired, distance, inFrustum, cacheKey, generation: this.locationGeneration, cx: mesh.userData.cx, cz: mesh.userData.cz });
      this.geometryQueue.sort((a, b) => Number(b.inFrustum) - Number(a.inFrustum) || a.distance - b.distance || b.desired - a.desired);
      this.processGeometryQueue();
    }
    async processGeometryQueue() {
      if (this.geometryWorkerActive) return; this.geometryWorkerActive = true;
      try {
        while (this.geometryQueue.length) {
          const item = this.geometryQueue.shift(); this.geometryQueueKeys.delete(item.cacheKey);
          if (item.generation !== this.locationGeneration || !this.chunks.has(`${item.cx},${item.cz}`)) continue;
          const live = this.chunks.get(`${item.cx},${item.cz}`);
          if (!live?.visible || live.userData.targetSegments !== item.desired) continue;
          try {
            const geometry = await this.geometryAsync(item.cx, item.cz, item.desired);
            if (item.generation !== this.locationGeneration) continue;
            const current = this.chunks.get(`${item.cx},${item.cz}`);
            if (current !== item.mesh || !current) continue;
            current.geometry = geometry; current.userData.segments = item.desired;
          } catch (error) {
            if (this.debugEnabled && !String(error?.message || error).includes("stale Venus geometry")) console.warn("[ANTARA Venus geometry]", error);
          }
        }
      } finally { this.geometryWorkerActive = false; }
    }
    pruneGeometryCache() {
      if (this.geometryCache.size <= this.quality.cacheLimit) return;
      const active = new Set([...this.chunks.values()].map(mesh => mesh.geometry));
      const candidates = [...this.geometryCache.entries()].filter(([, v]) => !active.has(v.geometry)).sort((a, b) => a[1].lastUsed - b[1].lastUsed);
      while (this.geometryCache.size > this.quality.cacheLimit && candidates.length) { const [key, value] = candidates.shift(); value.geometry.dispose(); this.geometryCache.delete(key); }
    }
    desiredSegments(ring, distance, altitudeKm = 0) {
      let near = this.quality.near, mid = this.quality.mid, far = this.quality.far, horizon = this.quality.horizon;
      if (altitudeKm > 12) { near = mid; mid = far; far = horizon; }
      if (distance < 12 && ring <= 1) return near;
      if (distance < 29 || ring <= 2) return mid;
      if (distance < 52 || ring <= 4) return far;
      return horizon;
    }
    acquireMesh() { return this.meshPool.pop() || new this.THREE.Mesh(); }
    releaseMesh(mesh) { this.group.remove(mesh); mesh.visible = false; this.meshPool.push(mesh); }
    ensureChunk(cx, cz, centerCX, centerCZ, prime = false) {
      const key = `${cx},${cz}`, ring = Math.max(Math.abs(cx - centerCX), Math.abs(cz - centerCZ)); let mesh = this.chunks.get(key);
      if (!mesh) {
        // New chunks enter as the cheap continuous horizon mesh. Visible chunks are
        // promoted cooperatively after the first render instead of blocking a frame.
        const segments = this.quality.horizon;
        mesh = this.acquireMesh(); mesh.geometry = this.geometry(cx, cz, segments); mesh.material = this.materials[ring <= 1 ? 3 : 0]; mesh.position.set(cx * this.chunkSize, 0, cz * this.chunkSize);
        mesh.frustumCulled = true; mesh.visible = true; mesh.userData = { cx, cz, segments, ring, detailTier: ring <= 1 ? 3 : 0, frustumVisible: false, bufferVisible: false, lastSurfaceDistance: Infinity };
        this.group.add(mesh); this.chunks.set(key, mesh);
      } else mesh.userData.ring = ring;
      return mesh;
    }
    stream(camera, force = false, prime = false) {
      const centerCX = Math.round(camera.position.x / this.chunkSize), centerCZ = Math.round(camera.position.z / this.chunkSize);
      if (!force && centerCX === this.lastStreamCX && centerCZ === this.lastStreamCZ) return;
      this.lastStreamCX = centerCX; this.lastStreamCZ = centerCZ; const keep = new Set();
      for (let dz = -this.quality.outerRadius; dz <= this.quality.outerRadius; dz += 1) for (let dx = -this.quality.outerRadius; dx <= this.quality.outerRadius; dx += 1) {
        const cx = centerCX + dx, cz = centerCZ + dz, key = `${cx},${cz}`; keep.add(key); this.ensureChunk(cx, cz, centerCX, centerCZ, prime);
      }
      for (const [key, mesh] of this.chunks) if (!keep.has(key)) { this.releaseMesh(mesh); this.chunks.delete(key); }
      this.pruneGeometryCache();
    }
    updateViewDependent(camera, altitudeKm = 0, force = false) {
      this.stream(camera, false, false); camera.updateMatrixWorld(); this.group.updateMatrixWorld(true);
      this.projectionScreenMatrix.multiplyMatrices(camera.projectionMatrix, camera.matrixWorldInverse); this.frustum.setFromProjectionMatrix(this.projectionScreenMatrix); camera.getWorldDirection(this.cameraForward).normalize();
      const upgrades = [], stats = { visible: 0, buffered: 0, culled: 0, high: 0, medium: 0, low: 0 };
      for (const mesh of this.chunks.values()) {
        const bounds = mesh.geometry.boundingSphere || (mesh.geometry.computeBoundingSphere(), mesh.geometry.boundingSphere); this.chunkCenter.copy(bounds.center).applyMatrix4(mesh.matrixWorld); this.chunkVector.copy(this.chunkCenter).sub(camera.position);
        const centerDistance = Math.max(.001, this.chunkVector.length()), surfaceDistance = Math.max(0, centerDistance - bounds.radius), facing = this.chunkVector.dot(this.cameraForward) / centerDistance;
        const inFrustum = this.frustum.intersectsObject(mesh); const bufferDistance = Math.max(44, 34 + altitudeKm * 2.5); const inSafetyBuffer = !inFrustum && facing > -.68 && surfaceDistance < bufferDistance; const active = inFrustum || inSafetyBuffer;
        mesh.visible = active; mesh.userData.frustumVisible = inFrustum; mesh.userData.bufferVisible = inSafetyBuffer; mesh.userData.lastSurfaceDistance = surfaceDistance;
        let tier = 0; if (inFrustum) tier = surfaceDistance < 24 ? 3 : surfaceDistance < 58 ? 2 : 1; else if (inSafetyBuffer && surfaceDistance < 32) tier = 1; this.setMeshDetailTier(mesh, tier);
        if (inFrustum) { stats.visible += 1; if (tier === 3) stats.high += 1; else if (tier === 2) stats.medium += 1; else stats.low += 1; }
        else if (inSafetyBuffer) stats.buffered += 1; else stats.culled += 1;
        if (active) {
          const desired = this.desiredSegments(mesh.userData.ring, surfaceDistance, altitudeKm); mesh.userData.targetSegments = desired;
          if (desired !== mesh.userData.segments) upgrades.push({ mesh, desired, distance: surfaceDistance, inFrustum });
        } else {
          mesh.userData.targetSegments = this.quality.horizon;
          if (mesh.userData.segments !== this.quality.horizon) {
            const horizonKey = this.cacheKey(mesh.userData.cx, mesh.userData.cz, this.quality.horizon), horizon = this.geometryCache.get(horizonKey);
            if (horizon) { horizon.lastUsed = performance.now(); mesh.geometry = horizon.geometry; mesh.userData.segments = this.quality.horizon; }
          }
        }
      }
      upgrades.sort((a, b) => Number(b.inFrustum) - Number(a.inFrustum) || a.distance - b.distance);
      // Cached variants can swap immediately. Expensive new variants are generated in
      // cooperative slices so camera input and rendering keep receiving frame time.
      const queueBudget = force ? 16 : 4;
      for (let i = 0; i < Math.min(queueBudget, upgrades.length); i += 1) {
        const item = upgrades[i]; this.queueGeometryUpgrade(item.mesh, item.desired, item.distance, item.inFrustum);
      }
      this.visibilityStats = stats;
      if (this.debugEnabled && performance.now() - this.lastDebugLog > 1000) { this.lastDebugLog = performance.now(); console.debug("[ANTARA Venus terrain]", { ...stats, chunks: this.chunks.size, cache: this.geometryCache.size, altitudeKm: Number(altitudeKm.toFixed(2)) }); }
      return stats;
    }
    async setLocation(poi) {
      this.locationGeneration += 1; this.geometryQueue.length = 0; this.geometryQueueKeys.clear(); this.poi = poi; this.lastStreamCX = Infinity; this.lastStreamCZ = Infinity; const mode = await this.provider.prepare(poi);
      const materialProfiles = { shield: { roughness: .88 }, mountain: { roughness: .94 }, highland: { roughness: .91 }, plateau: { roughness: .89 }, tessera: { roughness: .95 } };
      const visual = materialProfiles[poi.profile] || materialProfiles.highland; for (const material of this.materials) material.roughness = visual.roughness;
      for (const mesh of this.chunks.values()) this.releaseMesh(mesh); this.chunks.clear(); this.pruneGeometryCache(); return mode;
    }
    prime(camera) {
      this.stream(camera, true, true); const ground = this.height(camera.position.x, camera.position.z); const altitude = Math.max(0, camera.position.y - ground); this.updateViewDependent(camera, altitude, true);
    }
    setMacroTexture(texture) {
      if (!texture) return; texture.colorSpace = this.THREE.SRGBColorSpace; texture.wrapS = this.THREE.RepeatWrapping; texture.wrapT = this.THREE.ClampToEdgeWrapping; texture.minFilter = this.THREE.LinearMipmapLinearFilter; texture.magFilter = this.THREE.LinearFilter; texture.generateMipmaps = true;
      texture.anisotropy = Math.min(8, this.renderer.capabilities.getMaxAnisotropy()); if (this.macroTexture && this.macroTexture !== texture) this.macroTexture.dispose(); this.macroTexture = texture;
      for (const material of this.materials) { material.map = texture; material.needsUpdate = true; }
    }
    dispose() {
      this.locationGeneration += 1; this.geometryQueue.length = 0; this.geometryQueueKeys.clear();
      for (const mesh of this.chunks.values()) this.group.remove(mesh); this.chunks.clear(); this.meshPool.length = 0;
      for (const entry of this.geometryCache.values()) entry.geometry.dispose(); this.geometryCache.clear(); this.macroTexture?.dispose(); this.detail?.dispose(); for (const material of this.materials) material.dispose(); this.scene.remove(this.group);
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
      this.state = STATES.IDLE; this.location = LOCATIONS[0]; this.quality = qualityTier(); this.keys = new Set(); this.yaw = 0; this.pitch = -.08; this.speed = 0; this.velocity = { x: 0, y: 0, z: 0 }; this.frame = null; this.last = 0; this.lodClock = 0; this.hudClock = 0; this.transitionToken = 0; this.abort = new AbortController(); this.cardClosed = false;
      this.currentDpr = this.quality.dpr; this.statsClock = 0; this.statsFrames = 0; this.lowFpsWindows = 0; this.highFpsWindows = 0; this.lastGround = 0; this.debugWindowStart = 0; this.debugFrames = 0;
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
      this.renderer = new THREE.WebGLRenderer({ antialias: true, powerPreference: "high-performance" }); this.renderer.setPixelRatio(this.currentDpr); this.renderer.outputColorSpace = THREE.SRGBColorSpace; this.renderer.toneMapping = THREE.ACESFilmicToneMapping; this.renderer.toneMappingExposure = 1.10; this.renderer.domElement.className = "mars-full-canvas"; this.viewport.replaceChildren(this.renderer.domElement);
      this.scene = new THREE.Scene(); this.scene.background = new THREE.Color("#79513e"); this.scene.fog = new THREE.FogExp2("#9c7058", .0195); this.camera = new THREE.PerspectiveCamera(67, 1, .03, 165); this.camera.rotation.order = "YXZ";
      this.hemi = new THREE.HemisphereLight("#ffe4bd", "#2b1714", 1.42); this.scene.add(this.hemi);
      this.sun = new THREE.DirectionalLight("#ffd0a1", 3.05); this.sun.position.set(-16, 7.2, 9); this.scene.add(this.sun);
      this.topography = new MagellanTopographyProvider(); this.terrain = new VenusTerrain(THREE, this.scene, this.renderer, this.quality, this.topography); this.loadRadarMacroTexture(); this.loadingProgress.style.transform = "scaleX(.52)"; this.makeParticles(); this.loadingProgress.style.transform = "scaleX(.68)"; this.resize(); window.addEventListener("resize", () => this.resize(), { signal: this.abort.signal });
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
    resetCamera() { const h = this.terrain.height(0, 5); this.lastGround = h; this.camera.position.set(0, Math.min(MAX_ALTITUDE_KM - .4, h + 1.55), 6.4); this.yaw = this.location.heading || 0; this.pitch = -.10; this.speed = 0; this.velocity.x = this.velocity.y = this.velocity.z = 0; this.applyCameraRotation(); this.terrain.prime(this.camera); }
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
        this.state = STATES.ENTERING; this.root.className = "mars-full-exploration venus-full-exploration is-entering"; await sleep(900); if (token !== this.transitionToken) return; this.loading.hidden = true; this.state = STATES.EXPLORING; this.root.className = "mars-full-exploration venus-full-exploration is-active"; this.tutorial.classList.add("is-visible"); this.showLocationCard(true); this.statsClock = 0; this.statsFrames = 0; this.lowFpsWindows = 0; this.highFpsWindows = 0; this.hudClock = .2; this.last = performance.now(); this.frame = requestAnimationFrame(t => this.loop(t)); document.getElementById("announcement").textContent = `Eksplorasi penuh Venus dimulai di ${this.location.name}.`;
      } catch (err) { console.error(err); this.state = STATES.ERROR; this.errorMessage.textContent = err.message || "Renderer Venus tidak dapat disiapkan."; this.error.hidden = false; this.loading.hidden = true; }
    }
    updateMovement(dt) {
      if (this.state !== STATES.EXPLORING) return; let forward = 0, strafe = 0, vertical = 0;
      if (this.keys.has("KeyW") || this.keys.has("forward")) forward += 1; if (this.keys.has("KeyS") || this.keys.has("backward")) forward -= 1;
      if (this.keys.has("KeyD") || this.keys.has("right")) strafe += 1; if (this.keys.has("KeyA") || this.keys.has("left")) strafe -= 1;
      if (this.keys.has("KeyE") || this.keys.has("up")) vertical += 1; if (this.keys.has("KeyQ") || this.keys.has("down")) vertical -= 1;
      const mag = Math.hypot(forward, strafe); if (mag > 1) { forward /= mag; strafe /= mag; }
      const boost = (this.keys.has("ShiftLeft") || this.keys.has("ShiftRight")) ? 3.1 : 1, targetSpeed = 4.3 * boost;
      const fx = -Math.sin(this.yaw), fz = -Math.cos(this.yaw), rx = Math.cos(this.yaw), rz = -Math.sin(this.yaw);
      const targetX = (fx * forward + rx * strafe) * targetSpeed, targetZ = (fz * forward + rz * strafe) * targetSpeed, targetY = vertical * 3.2 * boost;
      const moving = mag > 0 || vertical !== 0, response = 1 - Math.exp(-dt * (moving ? 12.5 : 16.5));
      this.velocity.x += (targetX - this.velocity.x) * response; this.velocity.z += (targetZ - this.velocity.z) * response; this.velocity.y += (targetY - this.velocity.y) * response;
      this.camera.position.x += this.velocity.x * dt; this.camera.position.z += this.velocity.z * dt; this.camera.position.y += this.velocity.y * dt;
      const ground = this.terrain.height(this.camera.position.x, this.camera.position.z), min = ground + MIN_CLEARANCE_KM; this.lastGround = ground;
      if (this.camera.position.y < min) { const correction = 1 - Math.exp(-dt * 18); this.camera.position.y = lerp(this.camera.position.y, min + .015, correction); if (this.camera.position.y < min) this.camera.position.y = min; if (this.velocity.y < 0) this.velocity.y *= .12; }
      if (this.camera.position.y > MAX_ALTITUDE_KM) { this.camera.position.y = MAX_ALTITUDE_KM; if (this.velocity.y > 0) this.velocity.y = 0; }
      this.speed = Math.hypot(this.velocity.x, this.velocity.y, this.velocity.z); this.applyCameraRotation();
    }
    geoPosition() { return this.terrain.geoForWorld(this.camera.position.x, this.camera.position.z, this.location); }
    updateHUD() { const g = this.lastGround || this.terrain.height(this.camera.position.x, this.camera.position.z), clear = this.camera.position.y - g, geo = this.geoPosition(); this.hudCoordinates.textContent = fmtCoord(geo.lat, geo.lon); this.hudAltitude.textContent = `${fmtAlt(this.camera.position.y)} · ${fmtAlt(clear)} AGL`; this.hudSpeed.textContent = this.speed < 1 ? `${Math.round(this.speed * 1000)} M/S` : `${this.speed.toFixed(2)} KM/S`; }
    adaptResolution() {
      if (this.statsClock < 2.5 || !this.renderer) return; const fps = this.statsFrames / this.statsClock; this.statsFrames = 0; this.statsClock = 0;
      if (fps < 40) { this.lowFpsWindows += 1; this.highFpsWindows = 0; } else if (fps > 57) { this.highFpsWindows += 1; this.lowFpsWindows = Math.max(0, this.lowFpsWindows - 1); } else { this.lowFpsWindows = Math.max(0, this.lowFpsWindows - 1); this.highFpsWindows = 0; }
      if (this.lowFpsWindows >= 2 && this.currentDpr > this.quality.minDpr) { this.currentDpr = Math.max(this.quality.minDpr, this.currentDpr - .12); this.renderer.setPixelRatio(this.currentDpr); this.resize(); this.lowFpsWindows = 0; }
      else if (this.highFpsWindows >= 3 && this.currentDpr + .04 < this.quality.dpr) { this.currentDpr = Math.min(this.quality.dpr, this.currentDpr + .10); this.renderer.setPixelRatio(this.currentDpr); this.resize(); this.highFpsWindows = 0; }
    }
    loop(now) {
      this.frame = null; if (!this.active || !this.renderer || document.hidden) return; const dt = Math.min(.05, Math.max(.001, (now - this.last) / 1000)); this.last = now; this.statsClock += dt; this.statsFrames += 1; this.updateMovement(dt);
      const altitude = Math.max(0, this.camera.position.y - this.lastGround); this.terrain.updateViewDependent(this.camera, altitude, false);
      if (this.particles) { this.particles.rotation.y += dt * .012; this.particles.position.x = this.camera.position.x * .7; this.particles.position.z = this.camera.position.z * .7; }
      this.hudClock += dt; if (this.hudClock > .10) { this.hudClock = 0; this.updateHUD(); }
      this.renderer.render(this.scene, this.camera); this.adaptResolution();
      if (this.terrain.debugEnabled) { if (!this.debugWindowStart) this.debugWindowStart = now; this.debugFrames += 1; const elapsed = now - this.debugWindowStart; if (elapsed >= 1000) { const info = this.renderer.info.render; console.debug("[ANTARA Venus render]", { fps: Number((this.debugFrames * 1000 / elapsed).toFixed(1)), frameMs: Number((elapsed / this.debugFrames).toFixed(2)), calls: info.calls, triangles: info.triangles, dpr: Number(this.currentDpr.toFixed(2)), chunks: { ...this.terrain.visibilityStats } }); this.debugFrames = 0; this.debugWindowStart = now; } }
      this.frame = requestAnimationFrame(t => this.loop(t));
    }
    async travelTo(location) {
      if (this.state !== STATES.EXPLORING || location.id === this.location.id) return; this.state = STATES.TRAVELLING; this.keys.clear(); if (document.pointerLockElement === this.viewport) document.exitPointerLock?.(); this.locationMenu.classList.remove("is-open"); this.locationToggle.setAttribute("aria-expanded", "false"); this.travelLabel.textContent = `MENUJU ${location.name.toUpperCase()}`; this.travelVeil.classList.add("is-visible");
      await sleep(320); this.location = location; this.travelLabel.textContent = `MEMUAT MAGELLAN · ${location.name.toUpperCase()}`; await this.terrain.setLocation(location); this.applyLocationEnvironment(location); this.resetCamera(); this.syncLocationHUD(); this.statsClock = 0; this.statsFrames = 0; await sleep(420); this.travelVeil.classList.remove("is-visible"); this.state = STATES.EXPLORING; this.showLocationCard(true); document.getElementById("announcement").textContent = `Lokasi Venus: ${location.name}.`;
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
