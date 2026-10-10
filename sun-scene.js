"use strict";

const SUN_INFO_STOPS = Object.freeze([
  {
    title: "Bintang Kita",
    kicker: "IDENTITAS MATAHARI",
    subtitle: "Bintang G2 V yang menjadi pusat gravitasi dan sumber energi Tata Surya",
    summary: "Matahari adalah bintang deret utama yang berusia sekitar 4,5 miliar tahun. Hampir seluruh massa Tata Surya berada di Matahari, sehingga gravitasinya mengikat planet, asteroid, komet, dan debu dalam satu sistem.",
    facts: [
      "Diameter Matahari sekitar 1,4 juta km dan radiusnya sekitar 700.000 km.",
      "Jarak rata-rata Matahari ke Bumi sekitar 150 juta km atau 1 satuan astronomi.",
      "Matahari mengandung sekitar 99,8% massa Tata Surya."
    ],
    source: "https://science.nasa.gov/sun/facts/",
    images: [
      { src: "./assets/sun-identity-diagram.svg", alt: "Diagram identitas dan skala Matahari", credit: "ANTARA · data NASA", source: "https://science.nasa.gov/sun/facts/", caption: "Identitas dan skala Matahari", fit: "contain" },
      { src: "https://svs.gsfc.nasa.gov/vis/a000000/a003900/a003988/SDOHMIintensity_Jewelbox.01000.jpg", alt: "Fotosfer Matahari dalam cahaya tampak yang direkam Solar Dynamics Observatory", credit: "NASA/SDO/HMI", source: "https://svs.gsfc.nasa.gov/3988/", caption: "Fotosfer Matahari · SDO/HMI", fit: "contain" }
    ]
  },
  {
    title: "Mesin Fusi",
    kicker: "ENERGI & FUSI NUKLIR",
    subtitle: "Tekanan dan suhu ekstrem di inti mengubah hidrogen menjadi helium",
    summary: "Energi Matahari berasal dari fusi nuklir di inti. Dalam rantai proton-proton, inti hidrogen bergabung menjadi helium dan sebagian massa berubah menjadi energi yang kemudian bergerak keluar melalui interior Matahari.",
    facts: [
      "Suhu inti Matahari sekitar 15 juta °C.",
      "Fusi menghasilkan tekanan keluar yang membantu menahan keruntuhan gravitasi Matahari.",
      "Energi dari inti membutuhkan perjalanan panjang sebelum akhirnya mencapai fotosfer dan dipancarkan ke ruang angkasa."
    ],
    source: "https://science.nasa.gov/sun/facts/",
    images: [
      { src: "./assets/sun-fusion-diagram.svg", alt: "Diagram sederhana fusi proton-proton di inti Matahari", credit: "ANTARA · data NASA", source: "https://science.nasa.gov/sun/facts/", caption: "Fusi hidrogen di inti Matahari", fit: "contain" }
    ]
  },
  {
    title: "Dari Inti ke Corona",
    kicker: "STRUKTUR MATAHARI",
    subtitle: "Lapisan internal dan atmosfer Matahari memiliki cara transport energi yang berbeda",
    summary: "Matahari tersusun atas inti, zona radiatif, dan zona konveksi. Di atasnya terdapat fotosfer yang kita lihat, kromosfer yang tipis, zona transisi, lalu corona yang sangat renggang tetapi dapat mencapai suhu jutaan derajat.",
    facts: [
      "Energi bergerak lewat radiasi di zona radiatif dan lewat aliran plasma di zona konveksi.",
      "Fotosfer memiliki suhu sekitar 5.500 °C.",
      "Corona dapat mencapai sekitar 2 juta °C, jauh lebih panas daripada fotosfer."
    ],
    source: "https://science.nasa.gov/sun/facts/",
    images: [
      { src: "./assets/sun-structure-diagram.svg", alt: "Diagram lapisan Matahari dari inti hingga corona", credit: "ANTARA · data NASA", source: "https://science.nasa.gov/sun/facts/", caption: "Struktur internal dan atmosfer Matahari", fit: "contain" }
    ]
  },
  {
    title: "Permukaan yang Selalu Bergerak",
    kicker: "FOTOSFER & GRANULASI",
    subtitle: "Konveksi plasma membentuk granulasi, sementara medan magnet membentuk daerah aktif",
    summary: "Fotosfer bukan permukaan padat. Pola granular muncul saat plasma panas naik, mendingin, lalu turun kembali. Daerah dengan medan magnet sangat kuat dapat menekan aliran panas dan tampak sebagai sunspot yang lebih gelap.",
    facts: [
      "Granulasi adalah jejak konveksi yang terlihat di fotosfer.",
      "Sunspot lebih dingin daripada fotosfer di sekitarnya dan dapat bertahan dari hari hingga bulan.",
      "Matahari berotasi secara diferensial: sekitar 25 hari di ekuator dan sekitar 36 hari di kutub."
    ],
    source: "https://science.nasa.gov/sun/sunspots/",
    images: [
      { src: "./assets/sun-surface-diagram.svg", alt: "Diagram granulasi, sunspot, dan daerah aktif Matahari", credit: "ANTARA · data NASA", source: "https://science.nasa.gov/sun/sunspots/", caption: "Granulasi dan sunspot", fit: "contain" },
      { src: "https://svs.gsfc.nasa.gov/vis/a000000/a003900/a003933/HMI_IcChangingSpots.00300.jpg", alt: "Sunspot pada fotosfer Matahari yang diamati Solar Dynamics Observatory", credit: "NASA/SDO/HMI", source: "https://svs.gsfc.nasa.gov/3933/", caption: "Sunspot dalam cahaya tampak · SDO/HMI", fit: "contain" }
    ]
  },
  {
    title: "Medan Magnet & Letupan",
    kicker: "REKOR & EKSTREM",
    subtitle: "Medan magnet yang kusut menyimpan energi untuk flare, prominence, dan CME",
    summary: "Plasma bermuatan membawa dan membengkokkan medan magnet Matahari. Ketika konfigurasi magnetik berubah cepat, energi dapat dilepaskan sebagai flare. Struktur magnetik juga menopang prominence dan dapat melontarkan awan plasma besar sebagai coronal mass ejection.",
    facts: [
      "Flare adalah pelepasan energi lokal yang sangat kuat dari daerah aktif.",
      "Prominence adalah lengkungan plasma yang mengikuti medan magnet dan dapat bertahan jauh lebih lama.",
      "CME membawa plasma dan medan magnet ke ruang antarplanet dan merupakan salah satu pemicu utama cuaca antariksa."
    ],
    source: "https://science.nasa.gov/sun/solar-storms-and-flares/",
    images: [
      { src: "./assets/sun-magnetic-activity-diagram.svg", alt: "Diagram prominence, flare, dan coronal mass ejection", credit: "ANTARA · data NASA", source: "https://science.nasa.gov/sun/solar-storms-and-flares/", caption: "Aktivitas magnetik Matahari", fit: "contain" },
      { src: "https://svs.gsfc.nasa.gov/vis/a010000/a014700/a014701/SDO_10-03-24_1219UTC_131-171_RedScreen_4k.jpg", alt: "Flare kuat yang direkam Solar Dynamics Observatory", credit: "NASA/SDO", source: "https://svs.gsfc.nasa.gov/14701/", caption: "Solar flare · SDO", fit: "contain" }
    ]
  },
  {
    title: "Angin Surya",
    kicker: "CUACA ANTARIKSA",
    subtitle: "Aliran plasma dari corona menghubungkan Matahari dengan seluruh Tata Surya",
    summary: "Material yang lolos dari corona menjadi angin surya. Aliran partikel bermuatan ini membawa medan magnet Matahari dan membentuk heliosfer. Ketika kondisi angin surya dan letupan Matahari mencapai planet, keduanya dapat memicu aurora sekaligus mengganggu teknologi.",
    facts: [
      "Angin surya mengalir terus-menerus dari corona dan membentuk heliosfer.",
      "Interaksi angin surya dengan magnetosfer Bumi dapat menghasilkan aurora.",
      "Cuaca antariksa yang kuat dapat memengaruhi satelit, komunikasi, navigasi, dan jaringan listrik."
    ],
    source: "https://science.nasa.gov/sun/what-is-the-solar-wind/",
    images: [
      { src: "./assets/sun-solar-wind-diagram.svg", alt: "Diagram angin surya dari corona menuju magnetosfer Bumi", credit: "ANTARA · data NASA", source: "https://science.nasa.gov/sun/what-is-the-solar-wind/", caption: "Angin surya dan magnetosfer Bumi", fit: "contain" }
    ]
  },
  {
    title: "Mengamati Bintang Terdekat",
    kicker: "MISI HELIOFISIKA",
    subtitle: "Armada observatorium mempelajari Matahari dari fotosfer hingga corona",
    summary: "Tidak ada satu wahana yang dapat menjawab semua pertanyaan tentang Matahari. SDO memantau aktivitas secara terus-menerus, SOHO mempelajari interior hingga angin surya, Solar Orbiter mengamati Matahari dari perspektif baru, dan Parker Solar Probe terbang langsung menembus corona.",
    facts: [
      "Solar Dynamics Observatory diluncurkan pada 2010 untuk mengamati Matahari dengan resolusi tinggi dan cadence cepat.",
      "SOHO adalah misi ESA-NASA yang telah mengamati Matahari sejak 1995.",
      "Parker Solar Probe menjadi wahana pertama yang terbang melalui corona pada 2021."
    ],
    source: "https://science.nasa.gov/mission/parker-solar-probe/",
    images: [
      { src: "./assets/sun-missions-diagram.svg", alt: "Diagram misi utama pengamatan Matahari", credit: "ANTARA · data NASA dan ESA", source: "https://science.nasa.gov/mission/parker-solar-probe/", caption: "Armada pengamat Matahari", fit: "contain" }
    ]
  }
]);

window.SunScene = class SunScene {
  constructor() {
    this.element = document.getElementById("sun-scene");
    this.viewport = document.getElementById("sun-viewport");
    this.caption = this.element.querySelector(".sun-caption");
    this.credit = this.element.querySelector(".sun-credit");
    this.exploreButton = document.getElementById("sun-explore-button");
    this.nextButton = document.getElementById("sun-next-object");
    this.exploration = document.getElementById("sun-exploration");
    this.explorationClose = document.getElementById("sun-exploration-close");
    this.topicTitle = document.getElementById("sun-topic-title");
    this.topicKicker = document.getElementById("sun-topic-kicker");
    this.topicSubtitle = document.getElementById("sun-topic-subtitle");
    this.topicScroll = document.getElementById("sun-topic-scroll");
    this.topicSummary = document.getElementById("sun-topic-summary");
    this.topicFacts = document.getElementById("sun-topic-facts");
    this.topicSource = document.getElementById("sun-topic-source");
    this.photoSource = document.getElementById("sun-photo-source");
    this.topicCurrent = document.getElementById("sun-topic-current");
    this.topicTotal = document.getElementById("sun-topic-total");
    this.topicProgress = document.getElementById("sun-topic-progress");
    this.topicPrev = document.getElementById("sun-topic-prev");
    this.topicNext = document.getElementById("sun-topic-next");
    this.contextMedia = document.getElementById("sun-context-media");
    this.motion = window.matchMedia("(prefers-reduced-motion: reduce)");

    this.active = false;
    this.mode = "pending";
    this.loading = null;
    this.time = 0;
    this.previous = 0;
    this.frame = null;
    this.width = 1;
    this.height = 1;
    this.mobile = window.ANTARA_RENDER_PROFILE?.mobile ?? (window.innerWidth <= 700);
    this.pointer = { x: 0, y: 0 };
    this.cameraOffset = { x: 0, y: 0 };
    this.exploring = false;
    this.explorationBlend = 0;
    this.explorationBlendTarget = 0;
    this.topicIndex = 0;
    this.renderedRotation = 0.35;
    this.mercurySurface = null;
    this.travelMode = null;
    this.travelStartedAt = 0;
    this.travelDuration = 6.4;
    this.travelCallbacks = {};
    this.travelRevealFired = false;
    this.travelCoveredFired = false;
    this.travelCompleteFired = false;
    this.travelMercuryStartRotation = 0.62;
    this.solarEvent = { state: "cooldown", stateAt: 0, nextAt: 4.8, strength: 0, serial: 0, region: 0 };
    this.regionActivity = [.62, .78, .55, .69, .48, .74, .58, .66];
    this.particleCursor = 0;
    this.lastParticleSpawn = 0;
    this.lastAmbientParticleSpawn = 0;
    this.lastSecondaryBurst = 0;

    this.caption.inert = true;
    this.exploration.inert = true;
    this.credit.tabIndex = -1;
    this.tick = this.tick.bind(this);
    this.topicTotal.textContent = String(SUN_INFO_STOPS.length).padStart(2, "0");
    this.topicProgress.replaceChildren(...SUN_INFO_STOPS.map(() => document.createElement("span")));
    this.setExplorationStop(0, { immediate: true, announce: false });

    this.exploreButton.addEventListener("click", () => this.enterExploration());
    this.explorationClose.addEventListener("click", () => this.exitExploration());
    this.topicPrev.addEventListener("click", () => this.setExplorationStop(this.topicIndex - 1));
    this.topicNext.addEventListener("click", () => this.setExplorationStop(this.topicIndex + 1));
    window.addEventListener("resize", () => { if (this.active) { this.resize(); this.render(); } });
    document.addEventListener("visibilitychange", () => {
      if (!this.active) return;
      cancelAnimationFrame(this.frame);
      this.frame = null;
      if (!document.hidden) { this.previous = performance.now(); this.tick(this.previous); }
    });
    this.element.addEventListener("pointermove", event => {
      if (event.pointerType !== "mouse" || this.motion.matches || this.exploring) return;
      const rect = this.element.getBoundingClientRect();
      this.pointer.x = (event.clientX - rect.left) / Math.max(rect.width, 1) - 0.5;
      this.pointer.y = (event.clientY - rect.top) / Math.max(rect.height, 1) - 0.5;
    });
    this.element.addEventListener("pointerleave", () => { this.pointer.x = this.pointer.y = 0; });
  }

  clamp(value) { return Math.max(0, Math.min(1, value)); }
  smooth(value) { const v = this.clamp(value); return v * v * v * (v * (v * 6 - 15) + 10); }

  setMercuryTravelSurface(surface) {
    if (!surface) return;
    this.mercurySurface = surface;
    if (!this.THREE || !this.travelMercuryMaterial) return;
    this.replaceMercuryTravelTexture(surface);
  }

  replaceMercuryTravelTexture(surface) {
    const THREE = this.THREE;
    const texture = new THREE.Texture(surface);
    texture.colorSpace = THREE.SRGBColorSpace;
    texture.wrapS = THREE.RepeatWrapping;
    texture.wrapT = THREE.ClampToEdgeWrapping;
    texture.minFilter = THREE.LinearMipmapLinearFilter;
    texture.magFilter = THREE.LinearFilter;
    texture.generateMipmaps = true;
    texture.anisotropy = Math.max(1, Math.min(12, this.renderer.capabilities.getMaxAnisotropy()));
    texture.needsUpdate = true;
    const old = this.travelMercuryMaterial.map;
    this.travelMercuryMaterial.map = texture;
    this.travelMercuryMaterial.needsUpdate = true;
    old?.dispose?.();
  }

  makeMercuryFallbackSurface() {
    const canvas = document.createElement("canvas"); canvas.width = 1024; canvas.height = 512;
    const ctx = canvas.getContext("2d");
    const g = ctx.createLinearGradient(0, 0, canvas.width, canvas.height);
    g.addColorStop(0, "#8a8983"); g.addColorStop(.55, "#575650"); g.addColorStop(1, "#2e2f31");
    ctx.fillStyle = g; ctx.fillRect(0, 0, canvas.width, canvas.height);
    return canvas;
  }

  async prepare() {
    if (this.loading) return this.loading;
    this.loading = (async () => {
      try {
        const THREE = await import("./assets/vendor/three/three.module.min.js");
        this.createThreeScene(THREE);
        this.mode = "webgl";
        this.element.dataset.renderer = this.mode;
        this.resize();
        if (this.renderer?.compileAsync) await this.renderer.compileAsync(this.scene, this.camera);
      } catch (error) {
        console.warn("Sun WebGL renderer unavailable; using Canvas fallback.", error);
        this.createCanvasFallback();
      }
      if (this.active) this.render();
    })().catch(error => {
      console.error("Sun preparation failed", error);
      this.createCssFallback();
    });
    return this.loading;
  }

  createThreeScene(THREE) {
    const canvas = document.createElement("canvas");
    const antialias = !window.ANTARA_RENDER_PROFILE?.mobile;
    const context = canvas.getContext("webgl2", { alpha: true, antialias, powerPreference: "high-performance" });
    if (!context) throw new Error("WebGL2 unavailable");
    this.THREE = THREE;
    this.renderer = new THREE.WebGLRenderer({ canvas, context, alpha: true, antialias });
    this.renderer.setClearColor(0x020409, 0);
    const cap = window.ANTARA_RENDER_PROFILE?.mobile ? 1.1 : 2;
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, cap));
    this.renderer.outputColorSpace = THREE.SRGBColorSpace;
    this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
    this.renderer.toneMappingExposure = 1.24;
    this.viewport.replaceChildren(canvas);
    this.scene = new THREE.Scene();
    this.camera = new THREE.PerspectiveCamera(35, 1, 0.1, 240);
    this.camera.position.set(0, 0, 6.1);

    this.solarActiveDirections = [
      new THREE.Vector3(-.49, .29, .82).normalize(),
      new THREE.Vector3(.43, -.27, .86).normalize(),
      new THREE.Vector3(.08, .57, .82).normalize(),
      new THREE.Vector3(.58, .24, .78).normalize(),
      new THREE.Vector3(-.18, -.58, .79).normalize(),
      new THREE.Vector3(-.66, -.08, .75).normalize(),
      new THREE.Vector3(.31, .49, .815).normalize(),
      new THREE.Vector3(-.34, .55, .76).normalize()
    ];

    const photosphereMaterial = new THREE.ShaderMaterial({
      uniforms: {
        uTime: { value: 0 },
        uFlare: { value: 0 },
        uActivity: { value: 0.68 },
        uRegionStrengthsA: { value: new THREE.Vector4(...this.regionActivity.slice(0, 4)) },
        uRegionStrengthsB: { value: new THREE.Vector4(...this.regionActivity.slice(4, 8)) },
        uFlareDirection: { value: this.solarActiveDirections[0].clone() }
      },
      toneMapped: false,
      vertexShader: `varying vec3 vWorldNormal; varying vec3 vWorld; varying vec2 vUv;
        void main(){ vWorldNormal=normalize(mat3(modelMatrix)*normal); vUv=uv; vec4 world=modelMatrix*vec4(position,1.0); vWorld=world.xyz; gl_Position=projectionMatrix*viewMatrix*world; }`,
      fragmentShader: `precision highp float; varying vec3 vWorldNormal; varying vec3 vWorld; varying vec2 vUv; uniform float uTime; uniform float uFlare; uniform float uActivity; uniform vec4 uRegionStrengthsA; uniform vec4 uRegionStrengthsB; uniform vec3 uFlareDirection;
        float hash(vec3 p){ p=fract(p*.3183099+.1); p*=17.; return fract(p.x*p.y*p.z*(p.x+p.y+p.z)); }
        float noise(vec3 p){ vec3 i=floor(p), f=fract(p); f=f*f*(3.-2.*f); return mix(mix(mix(hash(i+vec3(0,0,0)),hash(i+vec3(1,0,0)),f.x),mix(hash(i+vec3(0,1,0)),hash(i+vec3(1,1,0)),f.x),f.y),mix(mix(hash(i+vec3(0,0,1)),hash(i+vec3(1,0,1)),f.x),mix(hash(i+vec3(0,1,1)),hash(i+vec3(1,1,1)),f.x),f.y),f.z); }
        float fbm4(vec3 p){ float v=0.; float a=.53; for(int i=0;i<4;i++){v+=a*noise(p); p=p*2.07+vec3(3.7,1.9,5.3); a*=.48;} return v; }
        float fbm5(vec3 p){ float v=0.; float a=.52; for(int i=0;i<5;i++){v+=a*noise(p); p=p*2.03+vec3(4.1,2.3,5.9); a*=.49;} return v; }
        mat2 rot(float a){float c=cos(a),s=sin(a);return mat2(c,-s,s,c);}
        vec3 driftDirection(vec3 d,float yaw,float pitch){d.xz=rot(yaw)*d.xz;d.yz=rot(pitch)*d.yz;return normalize(d);}
        float regionMask(vec3 n,vec3 d,float edge,float wobble,float phase){float irregular=(fbm4(n*10.7+vec3(phase,-phase*.63,phase*.37))-.48)*wobble;return smoothstep(edge,edge+.060,dot(n,d)+irregular);}
        float contour(float v,float bands,float width){float f=abs(fract(v*bands)-.5);return 1.0-smoothstep(width,width*2.5,f);}
        void main(){
          vec3 n=normalize(vWorldNormal); float t=uTime;

          float slowA=fbm5(n*2.7+vec3(t*.0052,-t*.0034,t*.0026));
          float slowB=fbm4(n*5.7+vec3(-t*.0071,t*.0051,-t*.0038)+slowA*1.7);
          vec3 flowVec=vec3(
            fbm4(n*4.7+vec3(7.1,t*.0042,-3.4)),
            fbm4(n*4.9+vec3(-2.8,5.7,-t*.0047)),
            fbm4(n*5.1+vec3(t*.0033,-6.3,2.1))
          )-.5;
          vec3 warped=normalize(n+flowVec*.165+(slowA-.5)*.072+(slowB-.5)*.045);

          vec3 q=warped*15.8+flowVec*3.35;
          float convectA=fbm5(q+vec3(t*.022,-t*.014,t*.010));
          float convectB=fbm4(q*1.72+vec3(-t*.031,t*.023,-t*.015)+slowA*1.95);
          float convectC=fbm4(q*3.15+vec3(t*.041,-t*.033,t*.024));
          float convection=clamp(convectA*.50+convectB*.33+convectC*.17,0.0,1.0);

          float edgeProbe=fbm4(q+vec3(.14,-.11,.08));
          float localGradient=clamp(abs(convectA-edgeProbe)*5.8,0.0,1.0);
          float folded=1.0-abs(convectB*2.0-1.0);
          float microFold=1.0-abs(convectC*2.0-1.0);
          float cellCore=smoothstep(.42,.86,microFold)*(.58+.42*convectB);
          float lane=smoothstep(.12,.70,localGradient)*(.45+.55*(1.0-folded));
          float granulation=clamp(convection*.76+cellCore*.24-lane*.15,0.0,1.0);

          float streakSourceA=fbm5(warped*5.9+flowVec*2.2+vec3(t*.014,-t*.020,t*.011));
          float streakSourceB=fbm4(warped*9.7+vec3(-t*.024,t*.015,t*.019)+slowB*2.3);
          float streakSourceC=fbm4(warped*14.8+flowVec*1.4+vec3(t*.029,t*.011,-t*.023));
          float streakA=contour(streakSourceA+slowA*.32,5.2,.040);
          float streakB=contour(streakSourceB+streakSourceA*.28,6.8,.032);
          float streakC=contour(streakSourceC+streakSourceB*.21,8.4,.025);
          float lineDistribution=.42+.58*smoothstep(.30,.76,fbm4(warped*3.35+vec3(-t*.010,t*.007,t*.005)+slowA*.9));
          float plasmaLines=clamp(streakA*.78+streakB*.54+streakC*.32,0.0,1.0);
          plasmaLines*=lineDistribution*(.44+.56*smoothstep(.34,.80,convection));
          float lineHalo=clamp(contour(streakSourceA+slowA*.32,5.2,.080)*.48+contour(streakSourceB+streakSourceA*.28,6.8,.060)*.34,0.0,1.0)*lineDistribution;

          vec3 d0=driftDirection(vec3(-.49,.29,.82),.050*sin(t*.025),.030*sin(t*.018+1.1));
          vec3 d1=driftDirection(vec3(.43,-.27,.86),.045*sin(t*.021+2.4),.034*sin(t*.017+.7));
          vec3 d2=driftDirection(vec3(.08,.57,.82),.052*sin(t*.019+4.1),.028*sin(t*.023+2.2));
          vec3 d3=driftDirection(vec3(.58,.24,.78),.046*sin(t*.022+5.0),.032*sin(t*.016+3.5));
          vec3 d4=driftDirection(vec3(-.18,-.58,.79),.050*sin(t*.020+1.7),.031*sin(t*.018+5.2));
          vec3 d5=driftDirection(vec3(-.66,-.08,.75),.047*sin(t*.023+3.6),.027*sin(t*.015+2.8));
          vec3 d6=driftDirection(vec3(.31,.49,.815),.042*sin(t*.018+5.5),.036*sin(t*.020+4.4));
          vec3 d7=driftDirection(vec3(-.34,.55,.76),.049*sin(t*.016+.8),.030*sin(t*.024+6.1));

          float ar0=regionMask(n,d0,.890,.066,t*.004);
          float ar1=regionMask(n,d1,.905,.062,t*.004+2.3);
          float ar2=regionMask(n,d2,.918,.060,t*.004+4.7);
          float ar3=regionMask(n,d3,.910,.064,t*.004+7.1);
          float ar4=regionMask(n,d4,.915,.060,t*.004+8.4);
          float ar5=regionMask(n,d5,.902,.064,t*.004+10.2);
          float ar6=regionMask(n,d6,.922,.056,t*.004+12.1);
          float ar7=regionMask(n,d7,.914,.059,t*.004+13.8);

          float flash0=.58+.42*sin(t*.83+0.2); float flash1=.60+.40*sin(t*.69+2.1);
          float flash2=.62+.38*sin(t*.91+4.7); float flash3=.58+.42*sin(t*.74+1.5);
          float flash4=.64+.36*sin(t*.79+5.8); float flash5=.59+.41*sin(t*.87+3.3);
          float flash6=.61+.39*sin(t*.72+6.4); float flash7=.60+.40*sin(t*.95+4.0);
          flash0*=flash0;flash1*=flash1;flash2*=flash2;flash3*=flash3;flash4*=flash4;flash5*=flash5;flash6*=flash6;flash7*=flash7;

          float activeField=clamp(
            ar0*uRegionStrengthsA.x*(.62+.38*flash0)+ar1*uRegionStrengthsA.y*(.62+.38*flash1)+
            ar2*uRegionStrengthsA.z*(.62+.38*flash2)+ar3*uRegionStrengthsA.w*(.62+.38*flash3)+
            ar4*uRegionStrengthsB.x*(.62+.38*flash4)+ar5*uRegionStrengthsB.y*(.62+.38*flash5)+
            ar6*uRegionStrengthsB.z*(.62+.38*flash6)+ar7*uRegionStrengthsB.w*(.62+.38*flash7),0.0,2.15);
          float eruptionField=clamp(
            ar0*uRegionStrengthsA.x*pow(flash0,3.2)+ar1*uRegionStrengthsA.y*pow(flash1,3.2)+
            ar2*uRegionStrengthsA.z*pow(flash2,3.2)+ar3*uRegionStrengthsA.w*pow(flash3,3.2)+
            ar4*uRegionStrengthsB.x*pow(flash4,3.2)+ar5*uRegionStrengthsB.y*pow(flash5,3.2)+
            ar6*uRegionStrengthsB.z*pow(flash6,3.2)+ar7*uRegionStrengthsB.w*pow(flash7,3.2),0.0,1.65);
          float eruptionEdges=clamp(
            4.0*ar0*(1.0-ar0)*uRegionStrengthsA.x*pow(flash0,4.0)+
            4.0*ar1*(1.0-ar1)*uRegionStrengthsA.y*pow(flash1,4.0)+
            4.0*ar2*(1.0-ar2)*uRegionStrengthsA.z*pow(flash2,4.0)+
            4.0*ar3*(1.0-ar3)*uRegionStrengthsA.w*pow(flash3,4.0)+
            4.0*ar4*(1.0-ar4)*uRegionStrengthsB.x*pow(flash4,4.0)+
            4.0*ar5*(1.0-ar5)*uRegionStrengthsB.y*pow(flash5,4.0)+
            4.0*ar6*(1.0-ar6)*uRegionStrengthsB.z*pow(flash6,4.0)+
            4.0*ar7*(1.0-ar7)*uRegionStrengthsB.w*pow(flash7,4.0),0.0,1.6);

          float spotTexture0=smoothstep(.47,.70,fbm4(n*30.0+vec3(t*.003,-t*.002,t*.001)));
          float spotTexture1=smoothstep(.49,.72,fbm4(n*35.0+vec3(-t*.002,t*.0025,-t*.0015)+4.3));
          float spotTexture2=smoothstep(.51,.74,fbm4(n*32.0+vec3(t*.0016,t*.0011,-t*.0021)+7.8));
          float pen0=regionMask(n,d0,.934,.046,t*.003+.6)*(.62+.38*spotTexture0)*(.30+.70*uRegionStrengthsA.x);
          float pen1=regionMask(n,d1,.947,.043,t*.003+3.1)*(.64+.36*spotTexture1)*(.30+.70*uRegionStrengthsA.y);
          float pen4=regionMask(n,d4,.952,.041,t*.003+5.8)*(.66+.34*spotTexture2)*(.26+.62*uRegionStrengthsB.x);
          float pen5=regionMask(n,d5,.958,.038,t*.003+8.2)*(.68+.32*spotTexture0)*(.24+.58*uRegionStrengthsB.y);
          float umbra0=regionMask(n,d0,.970,.029,t*.002+.8)*spotTexture0*(.38+.62*uRegionStrengthsA.x);
          float umbra1=regionMask(n,d1,.976,.027,t*.002+3.7)*spotTexture1*(.40+.60*uRegionStrengthsA.y);
          float umbra4=regionMask(n,d4,.978,.025,t*.002+6.3)*spotTexture2*(.34+.56*uRegionStrengthsB.x);
          float umbra=clamp(umbra0+.78*umbra1+.58*umbra4,0.0,1.0);
          float penumbra=clamp(pen0+.78*pen1+.52*pen4+.38*pen5-umbra*.48,0.0,1.0);

          vec3 deepOrange=vec3(1.00,.105,.0025);
          vec3 hotOrange=vec3(1.00,.235,.006);
          vec3 goldenOrange=vec3(1.00,.405,.016);
          vec3 hotGold=vec3(1.00,.625,.065);
          vec3 whiteGold=vec3(1.00,.865,.34);

          vec3 col=mix(deepOrange,hotOrange,.42+.30*slowA);
          col=mix(col,goldenOrange,.28+.50*granulation);
          col=mix(col,hotGold,smoothstep(.58,.91,granulation)*(.22+.14*convectC));
          col=mix(col,vec3(1.00,.285,.004),lane*.13);
          col*=.94+.07*slowB+.11*convection;

          col+=vec3(1.00,.46,.018)*lineHalo*(.075+.065*uActivity);
          col+=vec3(1.00,.74,.105)*plasmaLines*(.17+.14*uActivity);
          col+=whiteGold*pow(plasmaLines,2.6)*(.050+.050*uActivity);

          col=mix(col,vec3(.50,.105,.006),penumbra*.48);
          col=mix(col,vec3(.125,.013,.0018),umbra*.72);

          float facing=max(dot(n,normalize(cameraPosition-vWorld)),0.0);
          float limb=.88+.14*pow(facing,.38);
          col*=limb;
          col=mix(col,vec3(1.00,.39,.014),(1.0-facing)*.095);

          float faculae=smoothstep(.55,.79,fbm4(warped*18.0+vec3(t*.018,-t*.013,t*.010)))*pow(1.0-facing,.54)*(1.0-umbra);
          col+=vec3(1.00,.71,.12)*faculae*(.060+.070*uActivity);
          col+=vec3(1.00,.64,.055)*activeField*(.085+.135*uActivity)*(1.0-umbra*.58);
          col+=whiteGold*pow(activeField*.62,2.0)*(.040+.060*uActivity);
          col+=vec3(1.00,.93,.48)*eruptionField*(.075+.115*uActivity);
          col+=vec3(1.00,.78,.16)*eruptionEdges*(.11+.14*uActivity);

          float flareCore=smoothstep(.961,.997,dot(n,normalize(uFlareDirection))+(fbm4(n*25.0+vec3(t*.021))-.48)*.030);
          float flareHalo=smoothstep(.888,.982,dot(n,normalize(uFlareDirection))+(fbm4(n*10.0-vec3(t*.009))-.48)*.044);
          col+=vec3(1.00,.975,.62)*(flareCore*.98+flareHalo*.28)*uFlare;

          col=clamp(col,vec3(0.0),vec3(1.0));
          gl_FragColor=vec4(col,1.0);
          #include <colorspace_fragment>
        }`
    });
    this.photosphereMaterial = photosphereMaterial;
    this.photosphere = new THREE.Mesh(new THREE.SphereGeometry(1, this.mobile ? 80 : 144, this.mobile ? 56 : 104), photosphereMaterial);
    this.photosphere.rotation.set(0.07, 0.35, -0.04);
    this.sunGroup = new THREE.Group();
    this.sunGroup.add(this.photosphere);
    this.scene.add(this.sunGroup);

    this.chromosphere = new THREE.Mesh(new THREE.SphereGeometry(1.018, this.mobile ? 64 : 96, this.mobile ? 44 : 64), new THREE.ShaderMaterial({
      uniforms: { uTime: { value: 0 }, uFlare: { value: 0 } }, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, toneMapped: false,
      vertexShader: `varying vec3 vWorldNormal; varying vec3 vWorld; void main(){vWorldNormal=normalize(mat3(modelMatrix)*normal); vec4 w=modelMatrix*vec4(position,1.); vWorld=w.xyz; gl_Position=projectionMatrix*viewMatrix*w;}`,
      fragmentShader: `varying vec3 vWorldNormal; varying vec3 vWorld; uniform float uTime; uniform float uFlare; void main(){float rim=pow(1.-max(dot(normalize(vWorldNormal),normalize(cameraPosition-vWorld)),0.),3.0); float pulse=.76+.18*sin(uTime*.42+vWorldNormal.y*21.); gl_FragColor=vec4(1.0,.43,.045,rim*(.175+.105*pulse+.075*uFlare));\n#include <colorspace_fragment>\n}`
    }));
    this.sunGroup.add(this.chromosphere);

    this.corona = this.createCoronaMesh(THREE, 4.55, 0.26, 1.0);
    this.corona.position.z = -0.12;
    this.corona.renderOrder = -2;
    this.scene.add(this.corona);
    this.coronaOuter = this.createCoronaMesh(THREE, 5.85, 0.105, 2.37);
    this.coronaOuter.position.z = -0.18;
    this.coronaOuter.renderOrder = -3;
    this.scene.add(this.coronaOuter);

    this.prominenceGroup = new THREE.Group();
    this.createProminences(THREE);
    this.sunGroup.add(this.prominenceGroup);
    this.createParticleSystem(THREE);
    this.createStarfield(THREE);
    this.createMercuryTravelObject(THREE);

    canvas.addEventListener("webglcontextlost", event => {
      event.preventDefault();
      this.createCanvasFallback();
      this.resize();
      if (this.active) this.render();
    }, { once: true });
  }

  createCoronaMesh(THREE, scale, baseOpacity, seed) {
    const geometry = new THREE.PlaneGeometry(scale, scale, 1, 1);
    const material = new THREE.ShaderMaterial({
      uniforms: { uTime: { value: 0 }, uOpacity: { value: baseOpacity }, uSeed: { value: seed }, uFlare: { value: 0 } },
      transparent: true, depthWrite: false, depthTest: false, blending: THREE.AdditiveBlending, toneMapped: false,
      vertexShader: `varying vec2 vUv; void main(){vUv=uv; gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.);}`,
      fragmentShader: `precision highp float; varying vec2 vUv; uniform float uTime; uniform float uOpacity; uniform float uSeed; uniform float uFlare;
        float h(float x){return fract(sin(x*127.1+uSeed*91.7)*43758.5453);}
        void main(){
          vec2 p=vUv-.5; float r=length(p)*2.; float a=atan(p.y,p.x); if(r<.395||r>1.) discard;
          float bend=.22*sin(a*2.0-uTime*.018+uSeed)+.10*sin(a*7.0+uTime*.026);
          float wave=sin(a*5.0+bend+uSeed*2.1+uTime*.058)*.5+.5;
          float wave2=sin(a*9.0-bend*1.6-uTime*.041+uSeed*4.7)*.5+.5;
          float wave3=sin(a*15.0+uTime*.027+uSeed*7.3)*.5+.5;
          float streams=pow(.13+.87*wave,3.0)*.46+pow(.12+.88*wave2,4.0)*.35+pow(.17+.83*wave3,5.0)*.19;
          float hotA=pow(.5+.5*sin(a*3.0-uTime*.31+uSeed*1.7),5.0)*(.55+.45*sin(uTime*.77+uSeed));
          float hotB=pow(.5+.5*sin(a*5.0+uTime*.23+uSeed*3.3),7.0)*(.58+.42*sin(uTime*.63+uSeed*2.1));
          float hotC=pow(.5+.5*sin(a*8.0-uTime*.18+uSeed*5.1),9.0)*(.60+.40*sin(uTime*.91+uSeed*.8));
          float localHeat=clamp(hotA*.58+hotB*.40+hotC*.28,0.0,1.35);
          float asym=.58+.24*sin(a*2.1+uSeed+uTime*.021)+.18*sin(a*3.7-uTime*.015+uSeed*.7);
          float radialRipple=1.0+.035*sin(a*6.0-uTime*.032+uSeed*3.0)+.018*sin(a*11.0+uTime*.023);
          float fall=pow(1.-smoothstep(.39,1.,r/radialRipple),1.58);
          float inner=smoothstep(.39,.475,r);
          float shimmer=.86+.14*sin(uTime*.64+a*13.0+uSeed*2.0);
          float alpha=inner*fall*(.12+.88*streams)*clamp(asym,.28,1.1)*uOpacity*shimmer;
          alpha*=1.0+localHeat*.95+uFlare*.32;
          float radial=clamp((r-.39)*1.76,0.,1.);
          vec3 col=mix(vec3(1.,.94,.48),vec3(1.,.28,.012),radial);
          col=mix(col,vec3(1.,.52,.028),clamp(localHeat*.62,0.0,1.0));
          gl_FragColor=vec4(col,alpha);
          #include <colorspace_fragment>
        }`
    });
    return new THREE.Mesh(geometry, material);
  }

  createProminences(THREE) {
    const specs = [
      { a: -2.48, span: .46, h: .235, z: .038, width: .030, phase: .4, region: 0 },
      { a: -1.72, span: .25, h: .135, z: -.018, width: .018, phase: 6.4, region: 5 },
      { a: -1.02, span: .35, h: .185, z: -.028, width: .023, phase: 5.3, region: 4 },
      { a: -.36, span: .22, h: .120, z: .028, width: .017, phase: 8.1, region: 2 },
      { a: .48, span: .42, h: .220, z: .052, width: .028, phase: 2.2, region: 1 },
      { a: 1.22, span: .28, h: .145, z: .018, width: .019, phase: 7.0, region: 6 },
      { a: 1.92, span: .38, h: .200, z: -.012, width: .024, phase: 4.1, region: 3 },
      { a: 2.58, span: .27, h: .150, z: .026, width: .019, phase: 9.2, region: 7 }
    ];
    this.prominences = specs.map((spec, index) => this.createProminenceRibbon(THREE, spec, index));
  }

  createProminenceRibbon(THREE, spec, index) {
    const segments = 112;
    const positions = new Float32Array((segments + 1) * 2 * 3);
    const uvs = new Float32Array((segments + 1) * 2 * 2);
    const along = new Float32Array((segments + 1) * 2);
    const indices = [];
    const a0 = spec.a - spec.span * .5;
    const a1 = spec.a + spec.span * .5;
    for (let i = 0; i <= segments; i++) {
      const t = i / segments;
      const baseArch = Math.pow(Math.sin(Math.PI * t), 1.08);
      const arch = baseArch * (0.84 + .11 * Math.sin(t * 8.0 + spec.phase) + .05 * Math.sin(t * 19.0 + spec.phase * 1.9));
      const angleWarp = Math.sin(t * 11.0 + spec.phase) * .012 * baseArch + Math.sin(t * 27.0 + spec.phase * .8) * .005 * baseArch;
      const angle = a0 + (a1 - a0) * t + angleWarp;
      const ripple = (Math.sin(t * 17.0 + spec.phase) * .014 + Math.sin(t * 31.0 + spec.phase * 1.7) * .006) * baseArch;
      const radius = 1.004 + spec.h * arch + ripple;
      const cx = Math.cos(angle) * radius;
      const cy = Math.sin(angle) * radius;
      const cz = spec.z + Math.sin(Math.PI * t) * .018 + Math.sin(t * 13.0 + spec.phase) * .004 * arch;
      const radialX = Math.cos(angle);
      const radialY = Math.sin(angle);
      const taper = Math.pow(Math.sin(Math.PI * t), .62);
      const irregular = .72 + .20 * Math.sin(t * 23.0 + spec.phase) + .08 * Math.sin(t * 47.0 + spec.phase * .6);
      const halfWidth = spec.width * taper * Math.max(.48, irregular);
      for (let side = 0; side < 2; side++) {
        const sign = side ? 1 : -1;
        const vi = (i * 2 + side) * 3;
        positions[vi] = cx + radialX * halfWidth * sign;
        positions[vi + 1] = cy + radialY * halfWidth * sign;
        positions[vi + 2] = cz;
        const ui = (i * 2 + side) * 2;
        uvs[ui] = t;
        uvs[ui + 1] = side;
        along[i * 2 + side] = t;
      }
      if (i < segments) {
        const a = i * 2, b = a + 1, c = a + 2, d = a + 3;
        indices.push(a, c, b, b, c, d);
      }
    }
    const geometry = new THREE.BufferGeometry();
    geometry.setAttribute("position", new THREE.BufferAttribute(positions, 3));
    geometry.setAttribute("uv", new THREE.BufferAttribute(uvs, 2));
    geometry.setAttribute("aAlong", new THREE.BufferAttribute(along, 1));
    geometry.setIndex(indices);
    const material = new THREE.ShaderMaterial({
      uniforms: { uTime: { value: 0 }, uPhase: { value: spec.phase }, uStrength: { value: .72 + index * .04 } },
      transparent: true, depthWrite: false, side: THREE.DoubleSide, blending: THREE.AdditiveBlending, toneMapped: false,
      vertexShader: `attribute float aAlong; varying vec2 vUv; varying float vAlong; uniform float uTime; uniform float uPhase; void main(){vUv=uv;vAlong=aAlong;vec3 p=position;float arch=sin(3.14159265*aAlong);float wobble=(sin(aAlong*17.0+uTime*.39+uPhase)*.009+sin(aAlong*31.0-uTime*.27+uPhase)*.0045+sin(aAlong*53.0+uTime*.18+uPhase*2.0)*.0025)*arch;p.xy+=normalize(p.xy)*wobble;gl_Position=projectionMatrix*modelViewMatrix*vec4(p,1.0);}`,
      fragmentShader: `precision highp float; varying vec2 vUv; varying float vAlong; uniform float uTime; uniform float uPhase; uniform float uStrength; void main(){float edge=1.0-abs(vUv.y*2.0-1.0);edge=smoothstep(0.0,.76,edge);float taper=pow(max(sin(3.14159265*vAlong),0.0),.52);float pulse=.68+.32*sin(vAlong*14.0-uTime*.36+uPhase);float pulse2=.72+.28*sin(vAlong*29.0+uTime*.21+uPhase*1.7);float strands=.58+.42*sin(vAlong*47.0+uTime*.18+uPhase*2.0);float attach=1.0-smoothstep(0.0,.22,min(vAlong,1.0-vAlong));float core=pow(edge,2.6);float alpha=edge*taper*max(.18,pulse*pulse2)*(.62+.38*strands)*uStrength;vec3 col=mix(vec3(1.0,.16,.006),vec3(1.0,.82,.18),.24+.46*edge+.24*attach);col=mix(col,vec3(1.0,.95,.50),core*.28);gl_FragColor=vec4(col,alpha*.96);\n#include <colorspace_fragment>\n}`
    });
    const mesh = new THREE.Mesh(geometry, material);
    mesh.renderOrder = 3;
    mesh.userData.prominence = { region: spec.region ?? (index % 4), baseAngle: spec.a, phase: spec.phase, index };
    this.prominenceGroup.add(mesh);
    return mesh;
  }

  updateProminences(blend = 0, flareStrength = 0) {
    if (!this.prominences) return;
    this.prominenceGroup.rotation.z = this.time * .0011;
    this.prominences.forEach((mesh, i) => {
      const meta = mesh.userData.prominence || { region: i % 4, phase: i * 1.7 };
      const localActivity = this.regionActivity?.[meta.region] ?? .5;
      const slowCycle = .5 + .5 * Math.sin(this.time * (.095 + i * .0070) + meta.phase * 1.37);
      const secondCycle = .5 + .5 * Math.sin(this.time * (.047 + i * .0049) + meta.phase * 2.11 + 1.2);
      const sparkCycle = .5 + .5 * Math.sin(this.time * (.21 + i * .013) + meta.phase * 3.7);
      const envelope = Math.pow(Math.max(0, slowCycle * .55 + secondCycle * .27 + sparkCycle * .18), 1.18);
      const eventBoost = this.solarEvent.region === meta.region ? flareStrength * .34 : 0;
      const strength = (.16 + .88 * envelope * (.48 + .58 * localActivity) + eventBoost) * (1 - .12 * blend);
      mesh.material.uniforms.uTime.value = this.time;
      mesh.material.uniforms.uStrength.value = strength;
      mesh.rotation.z = .028 * Math.sin(this.time * (.028 + i * .0028) + meta.phase);
      const radialBreath = 1 + .032 * Math.sin(this.time * (.095 + i * .007) + meta.phase * 1.8) * (.35 + .65 * envelope);
      mesh.scale.set(radialBreath, radialBreath, 1);
      mesh.visible = strength > .07;
    });
  }

  createParticleSystem(THREE) {
    const high = window.innerWidth > 900 && (navigator.deviceMemory || 8) >= 6;
    this.particleCount = high ? 440 : window.innerWidth <= 700 ? 150 : 280;
    const positions = new Float32Array(this.particleCount * 3);
    const life = new Float32Array(this.particleCount);
    const size = new Float32Array(this.particleCount);
    this.particleVelocity = Array.from({ length: this.particleCount }, () => new THREE.Vector3());
    this.particleLife = life;
    for (let i=0;i<this.particleCount;i++){ positions[i*3+0]=999; positions[i*3+1]=999; positions[i*3+2]=999; life[i]=0; size[i]=1; }
    const geometry = new THREE.BufferGeometry();
    geometry.setAttribute("position", new THREE.BufferAttribute(positions,3));
    geometry.setAttribute("aLife", new THREE.BufferAttribute(life,1));
    geometry.setAttribute("aSize", new THREE.BufferAttribute(size,1));
    const material = new THREE.ShaderMaterial({
      uniforms: { uPixelRatio: { value: Math.min(window.devicePixelRatio||1,2) } }, transparent:true, depthWrite:false, blending:THREE.AdditiveBlending, toneMapped:false,
      vertexShader:`attribute float aLife; attribute float aSize; varying float vLife; uniform float uPixelRatio; void main(){vLife=aLife; vec4 mv=modelViewMatrix*vec4(position,1.); gl_PointSize=(2.5+5.6*aSize)*uPixelRatio*(3.5/max(-mv.z,1.)); gl_Position=projectionMatrix*mv;}`,
      fragmentShader:`varying float vLife; void main(){vec2 q=gl_PointCoord-.5; float d=length(q); if(d>.5)discard; float a=smoothstep(.5,.07,d)*smoothstep(0.,.16,vLife)*smoothstep(1.,.48,vLife); vec3 c=mix(vec3(1.,.10,.004),vec3(1.,.88,.30),vLife); c=mix(c,vec3(1.,.97,.67),pow(vLife,3.0)*.28); gl_FragColor=vec4(c,a*.92);\n#include <colorspace_fragment>\n}`
    });
    this.particleGeometry=geometry; this.particles=new THREE.Points(geometry,material); this.particles.renderOrder=4; this.sunGroup.add(this.particles);
  }

  updateSolarMaterial(flareScale = 1, activityScale = 1) {
    if (!this.photosphereMaterial) return;
    const uniforms = this.photosphereMaterial.uniforms;
    const regionActivity = this.regionActivity || (this.regionActivity = [.62, .78, .55, .69, .48, .74, .58, .66]);
    for (let i = 0; i < regionActivity.length; i++) {
      const waveA = .5 + .5 * Math.sin(this.time * (.105 + i * .0107) + i * 1.73);
      const waveB = .5 + .5 * Math.sin(this.time * (.047 + i * .0061) + i * 2.91 + 1.2);
      const waveC = .5 + .5 * Math.sin(this.time * (.231 + i * .014) + i * .83 + 4.1);
      let value = .24 + .38 * waveA + .24 * waveB + .15 * Math.pow(waveC, 3);
      if (this.solarEvent.region === i) value += this.solarEvent.strength * .46 * activityScale;
      regionActivity[i] = this.clamp(value);
    }
    uniforms.uTime.value = this.time;
    uniforms.uFlare.value = this.solarEvent.strength * flareScale;
    uniforms.uActivity.value = .58 + .24 * regionActivity.reduce((a,b)=>a+b,0) / regionActivity.length + .13 * this.solarEvent.strength * activityScale;
    if (uniforms.uRegionStrengthsA?.value?.set) uniforms.uRegionStrengthsA.value.set(regionActivity[0], regionActivity[1], regionActivity[2], regionActivity[3]);
    if (uniforms.uRegionStrengthsB?.value?.set) uniforms.uRegionStrengthsB.value.set(regionActivity[4], regionActivity[5], regionActivity[6], regionActivity[7]);
    const direction = this.solarActiveDirections?.[this.solarEvent.region % (this.solarActiveDirections?.length||1)];
    if (direction && uniforms.uFlareDirection?.value?.copy) uniforms.uFlareDirection.value.copy(direction);
  }

  createStarfield(THREE) {
    const count = 300, positions = new Float32Array(count*3);
    for(let i=0;i<count;i++){
      const a=Math.sin((i+1)*91.17)*43758.5453, b=Math.sin((i+1)*17.53)*14375.921, c=Math.sin((i+1)*63.71)*19731.411;
      positions[i*3]=(a-Math.floor(a)-.5)*180; positions[i*3+1]=(b-Math.floor(b)-.5)*110; positions[i*3+2]=-14-(c-Math.floor(c))*130;
    }
    const g=new THREE.BufferGeometry(); g.setAttribute("position",new THREE.BufferAttribute(positions,3));
    this.starfield=new THREE.Points(g,new THREE.PointsMaterial({color:0xb5c4d7,size:.105,transparent:true,opacity:.44,depthWrite:false,sizeAttenuation:true,toneMapped:false})); this.scene.add(this.starfield);
  }

  createMercuryTravelObject(THREE) {
    const texture = new THREE.Texture(this.mercurySurface || this.makeMercuryFallbackSurface());
    texture.colorSpace=THREE.SRGBColorSpace; texture.wrapS=THREE.RepeatWrapping; texture.wrapT=THREE.ClampToEdgeWrapping;
    texture.minFilter=THREE.LinearMipmapLinearFilter; texture.magFilter=THREE.LinearFilter; texture.generateMipmaps=true;
    texture.anisotropy=Math.max(1,Math.min(12,this.renderer.capabilities.getMaxAnisotropy())); texture.needsUpdate=true;
    this.travelMercuryMaterial=new THREE.MeshStandardMaterial({map:texture,roughness:.91,metalness:0,color:0xffffff,transparent:true,opacity:1});
    this.travelMercury=new THREE.Mesh(new THREE.SphereGeometry(1,this.mobile?64:112,this.mobile?44:80),this.travelMercuryMaterial);
    this.travelMercuryGroup=new THREE.Group(); this.travelMercuryGroup.add(this.travelMercury);
    const key=new THREE.DirectionalLight(0xfff4dd,2.2); key.position.set(-4.5,2.6,4.2); this.scene.add(key,new THREE.AmbientLight(0xb5bdc7,.09));
    this.travelMercuryGroup.visible=false; this.scene.add(this.travelMercuryGroup);
  }

  createCanvasFallback() {
    this.renderer?.dispose?.(); this.renderer=null; this.THREE=null;
    this.canvas=document.createElement("canvas"); this.ctx=this.canvas.getContext("2d");
    if(!this.ctx) return this.createCssFallback();
    this.viewport.replaceChildren(this.canvas); this.mode="canvas"; this.element.dataset.renderer=this.mode; this.resize();
  }

  createCssFallback() {
    this.mode="css"; this.element.dataset.renderer=this.mode;
    this.viewport.innerHTML='<div class="sun-emergency-corona" aria-hidden="true"></div><div class="sun-emergency-sphere" aria-hidden="true"></div><div class="sun-emergency-mercury" aria-hidden="true"></div>';
    this.resize();
  }

  preloadInfoImages() {
    if (navigator.connection?.saveData) return;
    SUN_INFO_STOPS.flatMap(stop => stop.images || []).forEach(item => {
      if (!item.src || item.src.startsWith("./")) return;
      const img = new Image(); img.decoding="async"; img.src=item.src;
    });
  }

  start({ settled = false } = {}) {
    this.active=true; this.travelMode=null; this.element.hidden=false; this.element.style.opacity="1"; this.element.classList.remove("is-leaving");
    this.caption.classList.toggle("is-visible", settled); this.caption.inert=!settled; this.caption.style.opacity=settled?"1":"0"; this.credit.style.opacity=settled?".9":"0";
    this.credit.tabIndex=0; this.exploring=false; this.explorationBlend=this.explorationBlendTarget=0; this.exploration.inert=true; this.element.classList.remove("is-exploring");
    this.pointer.x=this.pointer.y=this.cameraOffset.x=this.cameraOffset.y=0; this.prepare(); this.resize(); cancelAnimationFrame(this.frame); this.previous=performance.now(); this.tick(this.previous);
    if(!settled) requestAnimationFrame(()=>requestAnimationFrame(()=>{ if(!this.active||this.travelMode)return; this.caption.classList.add("is-visible"); this.caption.inert=false; this.caption.style.opacity="1"; this.credit.style.opacity=".9"; }));
  }

  stop() {
    this.active=false; this.travelMode=null; this.travelCallbacks={}; cancelAnimationFrame(this.frame); this.frame=null;
    this.element.hidden=true; this.element.style.opacity="0"; this.element.classList.remove("is-exploring","is-leaving");
    this.exploring=false; this.explorationBlend=this.explorationBlendTarget=0; this.caption.inert=true; this.exploration.inert=true; this.credit.tabIndex=-1;
    if(this.travelMercuryGroup) this.travelMercuryGroup.visible=false;
    window.ExplorationMedia?.closeLightbox?.({restoreFocus:false});
  }

  resize() {
    const rect=this.viewport.getBoundingClientRect(); this.width=Math.max(1,Math.round(rect.width||window.innerWidth)); this.height=Math.max(1,Math.round(rect.height||window.innerHeight)); this.mobile=this.width<=700;
    if(this.renderer&&this.camera){ const cap=this.mobile?1.1:2; this.renderer.setPixelRatio(Math.min(window.devicePixelRatio||1,cap)); this.renderer.setSize(this.width,this.height,false); this.camera.aspect=this.width/this.height; this.camera.updateProjectionMatrix(); if(this.particles?.material?.uniforms?.uPixelRatio)this.particles.material.uniforms.uPixelRatio.value=Math.min(window.devicePixelRatio||1,cap); }
    if(this.canvas){ const dpr=Math.min(window.devicePixelRatio||1,this.mobile?1:1.8); this.canvas.width=Math.round(this.width*dpr); this.canvas.height=Math.round(this.height*dpr); this.canvas.style.width=`${this.width}px`; this.canvas.style.height=`${this.height}px`; this.ctx.setTransform(dpr,0,0,dpr,0,0); }
  }

  tick(now) {
    this.frame=null; if(!this.active||document.hidden)return; if(window.ANTARA_RENDER_PROFILE&&!window.ANTARA_RENDER_PROFILE.shouldRender(this,now)){this.frame=requestAnimationFrame(t=>this.tick(t));return;} const delta=Math.min((now-this.previous)/1000,.12); this.previous=now; this.time+=delta;
    const damping=1-Math.exp(-delta*2.3); this.cameraOffset.x+=(this.pointer.x-this.cameraOffset.x)*damping; this.cameraOffset.y+=(this.pointer.y-this.cameraOffset.y)*damping;
    const expDamping=this.motion.matches?1:1-Math.exp(-delta*2.7); this.explorationBlend+=(this.explorationBlendTarget-this.explorationBlend)*expDamping;
    this.updateSolarEvent(delta); this.render();
    if(!this.motion.matches||this.travelMode||Math.abs(this.explorationBlendTarget-this.explorationBlend)>.001||this.time<12) this.frame=requestAnimationFrame(this.tick);
  }

  updateSolarEvent(delta) {
    const e=this.solarEvent;
    if(this.motion.matches){ e.strength=0; return; }
    const regionCount=this.solarActiveDirections?.length||8;
    if(e.state==="cooldown"&&this.time>=e.nextAt){ e.state="prepare"; e.stateAt=this.time; e.region=(e.serial*5+2)%regionCount; }
    if(e.state==="prepare"){
      e.strength=this.smooth((this.time-e.stateAt)/1.25)*.38;
      if(this.time-e.stateAt>=1.25){
        e.state="flare"; e.stateAt=this.time;
        this.spawnBurst(e.region, e.serial%3===2?36:22);
        const secondary=(e.region+3+(e.serial%3))%regionCount;
        this.spawnBurst(secondary, 8+(e.serial%4)*2);
        this.lastSecondaryBurst=this.time;
      }
    } else if(e.state==="flare"){
      const p=this.clamp((this.time-e.stateAt)/1.55); e.strength=.38+.78*Math.sin(p*Math.PI);
      if(this.time-this.lastParticleSpawn>.14){
        this.lastParticleSpawn=this.time;
        this.spawnBurst(e.region,3+(e.serial%3));
      }
      if(this.time-this.lastSecondaryBurst>.48){
        this.lastSecondaryBurst=this.time;
        const secondary=(e.region+2+Math.floor(this.time*1.7)%5)%regionCount;
        this.spawnBurst(secondary,2+(e.serial%2));
      }
      if(p>=1){ e.state="decay"; e.stateAt=this.time; }
    } else if(e.state==="decay"){
      e.strength=(1-this.smooth((this.time-e.stateAt)/2.15))*.36;
      if(this.time-e.stateAt>=2.15){ e.state="cooldown"; e.stateAt=this.time; e.strength=0; e.serial++; e.nextAt=this.time+6.6+(e.serial%4)*1.9; }
    }
    if(this.time-this.lastAmbientParticleSpawn>.78){
      const base=Math.floor(this.time/.78);
      const idx=(base*3+e.serial*2)%regionCount;
      const activity=this.regionActivity?.[idx] ?? .55;
      if(activity>.46) this.spawnBurst(idx, activity>.78?3:activity>.62?2:1);
      if(base%4===1){
        const secondary=(idx+4+(base%3))%regionCount;
        const secondActivity=this.regionActivity?.[secondary] ?? .5;
        if(secondActivity>.57) this.spawnBurst(secondary,1+(secondActivity>.80?2:0));
      }
      this.lastAmbientParticleSpawn=this.time;
    }
    this.updateParticles(delta);
  }

  spawnBurst(region=0,count=8){
    if(!this.particleGeometry||!this.THREE)return; const positions=this.particleGeometry.attributes.position.array, life=this.particleGeometry.attributes.aLife.array, size=this.particleGeometry.attributes.aSize.array;
    const source=this.solarActiveDirections?.[region%(this.solarActiveDirections?.length||1)];
    const base=source?source.clone():new this.THREE.Vector3(-.49,.31,.815).normalize();
    for(let n=0;n<count;n++){
      const i=this.particleCursor++%this.particleCount; const seed=(i+1)*(this.solarEvent.serial+3)*12.9898+n*7.31; const r=Math.sin(seed)*43758.5453, r2=Math.sin(seed*1.73)*19171.17; const j1=r-Math.floor(r)-.5, j2=r2-Math.floor(r2)-.5;
      const tangent=new this.THREE.Vector3(-base.y,base.x,.18*j1).normalize(); const p=base.clone().multiplyScalar(1.02).addScaledVector(tangent,j1*.08);
      positions[i*3]=p.x; positions[i*3+1]=p.y; positions[i*3+2]=p.z; life[i]=1; size[i]=.45+Math.abs(j2)*.9;
      this.particleVelocity[i].copy(base).multiplyScalar(.28+.38*Math.abs(j2)).addScaledVector(tangent,j1*.22).add(new this.THREE.Vector3(0,j2*.035,.026*j1));
    }
    this.particleGeometry.attributes.position.needsUpdate=true; this.particleGeometry.attributes.aLife.needsUpdate=true; this.particleGeometry.attributes.aSize.needsUpdate=true;
  }

  updateParticles(delta){
    if(!this.particleGeometry)return; const pos=this.particleGeometry.attributes.position.array, life=this.particleGeometry.attributes.aLife.array; let dirty=false;
    for(let i=0;i<this.particleCount;i++){ if(life[i]<=0)continue; dirty=true; life[i]=Math.max(0,life[i]-delta*(.24+(i%7)*.010)); const v=this.particleVelocity[i]; const x=pos[i*3],y=pos[i*3+1]; const bend=.046*delta; v.x+=-y*bend; v.y+=x*bend; pos[i*3]+=v.x*delta; pos[i*3+1]+=v.y*delta; pos[i*3+2]+=v.z*delta; if(life[i]<=0){pos[i*3]=pos[i*3+1]=pos[i*3+2]=999;} }
    if(dirty){this.particleGeometry.attributes.position.needsUpdate=true; this.particleGeometry.attributes.aLife.needsUpdate=true;}
  }

  enterExploration(){
    if(!this.active||this.travelMode||this.exploring)return;
    this.exploring=true;
    this.explorationBlendTarget=1;
    this.element.classList.add("is-exploring");
    this.caption.inert=true;
    this.credit.tabIndex=-1;
    this.exploration.inert=false;
    this.setExplorationStop(this.topicIndex,{immediate:true,announce:false});
    if(this.motion.matches){this.explorationBlend=1;this.render();}
    else if(!this.frame){this.previous=performance.now();this.tick(this.previous);}
    document.getElementById("announcement").textContent=`Mode eksplorasi Matahari dimulai. ${SUN_INFO_STOPS[this.topicIndex].title}.`;
    requestAnimationFrame(()=>this.topicTitle.focus({preventScroll:true}));
  }

  exitExploration(){
    if(!this.exploring)return;
    window.ExplorationMedia?.closeLightbox?.({restoreFocus:false});
    this.exploring=false;
    this.explorationBlendTarget=0;
    this.element.classList.remove("is-exploring");
    this.exploration.inert=true;
    this.caption.inert=false;
    this.credit.tabIndex=0;
    this.contextMedia.hidden=true;
    this.contextMedia.replaceChildren();
    if(this.motion.matches){this.explorationBlend=0;this.render();}
    else if(!this.frame){this.previous=performance.now();this.tick(this.previous);}
    document.getElementById("announcement").textContent="Kembali ke panorama Matahari.";
    requestAnimationFrame(()=>this.exploreButton.focus({preventScroll:true}));
  }

  setExplorationStop(index,{immediate=false,announce=true}={}){
    const total=SUN_INFO_STOPS.length; this.topicIndex=Math.max(0,Math.min(total-1,index)); const stop=SUN_INFO_STOPS[this.topicIndex];
    const apply=()=>{
      this.topicKicker.textContent=stop.kicker; this.topicTitle.textContent=stop.title; this.topicSubtitle.textContent=stop.subtitle; this.topicSummary.textContent=stop.summary;
      this.topicFacts.replaceChildren(...stop.facts.map(text=>{const li=document.createElement("li");li.textContent=text;return li;}));
      this.topicSource.href=stop.source; this.topicCurrent.textContent=String(this.topicIndex+1).padStart(2,"0"); [...this.topicProgress.children].forEach((el,i)=>el.classList.toggle("is-active",i===this.topicIndex));
      this.topicPrev.disabled=this.topicIndex===0; this.topicNext.disabled=this.topicIndex===total-1;
      if(this.exploring) window.ExplorationMedia?.render?.("sun",stop,this.contextMedia);
      if(announce) document.getElementById("announcement").textContent=`Topik Matahari: ${stop.title}.`;
      if(this.topicScroll) this.topicScroll.scrollTop=0;
    };
    if(immediate){apply();return;} this.exploration.classList.add("is-changing"); requestAnimationFrame(()=>requestAnimationFrame(()=>{apply();this.exploration.classList.remove("is-changing");}));
  }

  beginTravelToMercury({onReveal,onComplete}={}){
    if(!this.active||this.travelMode||this.exploring)return; this.travelMode="to-mercury"; this.travelStartedAt=this.time; this.travelDuration=this.motion.matches ? 0.45 : 6.4; this.travelRevealFired=false; this.travelCompleteFired=false; this.travelCallbacks={onReveal,onComplete}; this.element.classList.add("is-leaving"); this.caption.inert=true; this.pointer.x=this.pointer.y=0; if(!this.frame){this.previous=performance.now();this.tick(this.previous);}
  }

  beginTravelFromMercury({onCovered,onComplete,mercuryRotation=.62}={}){
    if(this.active&&this.travelMode)return; this.active=true; this.exploring=false; this.explorationBlend=this.explorationBlendTarget=0; this.travelMode="from-mercury"; this.time=0; this.travelStartedAt=0; this.travelDuration=this.motion.matches ? 0.45 : 6.4; this.travelCoveredFired=false; this.travelCompleteFired=false; this.travelMercuryStartRotation=mercuryRotation; this.travelCallbacks={onCovered,onComplete}; this.element.hidden=false; this.element.style.opacity="0"; this.element.classList.add("is-leaving"); this.caption.classList.remove("is-visible"); this.caption.inert=true; this.exploration.inert=true; this.prepare(); this.resize(); cancelAnimationFrame(this.frame); this.previous=performance.now(); this.tick(this.previous);
  }

  travelState(){ const p=this.smooth((this.time-this.travelStartedAt)/this.travelDuration); return {progress:p,depart:this.smooth(p/.34),cross:this.smooth((p-.18)/.57),arrive:this.smooth((p-.58)/.42)}; }

  render(){ if(this.travelMode)this.renderTravel(); else this.renderSun(); }

  normalLayout(){ const dist=5.45; const half=Math.tan((35*Math.PI/180)/2)*dist; return {distance:dist,half,x:half*(this.width/this.height)*(this.mobile?0:.25),y:half*(this.mobile?.30:.08),scale:this.mobile?.78:1}; }

  renderSun(){
    const layout=this.normalLayout(); const blend=this.explorationBlend; const groupX=layout.x + blend*layout.half*(this.mobile?0:.20); const groupY=layout.y + blend*layout.half*(this.mobile?.24:0); const groupScale=layout.scale*(1-blend*(this.mobile?.08:.06)); const cameraX=this.cameraOffset.x*.12*(1-blend), cameraY=-this.cameraOffset.y*.08*(1-blend);
    this.renderedRotation=.35+this.time*.008;
    if(this.mode==="webgl"){
      this.renderer.toneMappingExposure=1.24;
      this.sunGroup.visible=true; this.sunGroup.position.set(groupX,groupY,0); this.sunGroup.scale.setScalar(groupScale); this.photosphere.rotation.y=this.renderedRotation; this.updateSolarMaterial(1,1);
      this.chromosphere.material.uniforms.uTime.value=this.time; this.chromosphere.material.uniforms.uFlare.value=this.solarEvent.strength;
      this.corona.material.uniforms.uTime.value=this.time; this.corona.material.uniforms.uFlare.value=this.solarEvent.strength; this.corona.position.x=groupX; this.corona.position.y=groupY; this.corona.scale.setScalar(groupScale);
      this.coronaOuter.material.uniforms.uTime.value=this.time*.78; this.coronaOuter.material.uniforms.uFlare.value=this.solarEvent.strength; this.coronaOuter.position.x=groupX; this.coronaOuter.position.y=groupY; this.coronaOuter.scale.setScalar(groupScale);
      this.updateProminences(blend,this.solarEvent.strength);
      if(this.travelMercuryGroup)this.travelMercuryGroup.visible=false;
      this.camera.position.set(cameraX,cameraY,layout.distance); this.camera.lookAt(cameraX*.24,cameraY*.16,0); this.renderer.render(this.scene,this.camera);
    } else if(this.mode==="canvas") this.drawCanvasSun(layout,blend); else {
      const sphere=this.viewport.querySelector(".sun-emergency-sphere"), corona=this.viewport.querySelector(".sun-emergency-corona"); const left=50+(this.mobile?0:7)+blend*(this.mobile?0:6); const top=(this.mobile?38:49)-blend*(this.mobile?8:0); if(sphere){sphere.style.left=`${left}%`;sphere.style.top=`${top}%`;sphere.style.transform=`translate(-50%,-50%) scale(${groupScale}) rotate(${this.renderedRotation*.18}rad)`;} if(corona){corona.style.left=`${left}%`;corona.style.top=`${top}%`;corona.style.transform=`translate(-50%,-50%) scale(${groupScale*(1+.03*Math.sin(this.time*.2))})`;}
    }
  }

  renderTravel(){
    const s=this.travelState(), reverse=this.travelMode==="from-mercury", layout=this.normalLayout(); const span=layout.half*(this.width/this.height)*(this.mobile?4.6:4.0);
    const sunP=reverse?this.smooth((s.progress-.04)/.18):1-s.depart*.82; const mercuryP=reverse?1-s.depart:this.smooth((s.progress-.48)/.34); const sunX=layout.x+(reverse?(1-s.cross)*(-span):s.cross*(-span)); const mercuryX=layout.x+(reverse?s.cross*span:(1-s.cross)*span); const sunScale=layout.scale*(reverse?(.26+.74*s.arrive):(1-.72*s.depart)); const mercuryScale=reverse?(1-.70*s.depart):(.25+.75*s.arrive);
    this.element.style.opacity=String(reverse?this.smooth(s.progress/.08):1); this.caption.style.opacity="0"; this.credit.style.opacity="0";
    if(!reverse&&s.progress>=.84&&!this.travelRevealFired){this.travelRevealFired=true;this.travelCallbacks.onReveal?.();}
    if(reverse&&s.progress>=.20&&!this.travelCoveredFired){this.travelCoveredFired=true;this.travelCallbacks.onCovered?.();}
    if(this.mode==="webgl"){
      this.sunGroup.visible=sunP>.01; this.sunGroup.position.set(sunX,layout.y,0); this.sunGroup.scale.setScalar(sunScale); this.photosphere.rotation.y=.35+this.time*.008; this.updateSolarMaterial(.55,.7); this.updateProminences(.08,this.solarEvent.strength*.55);
      this.chromosphere.material.uniforms.uTime.value=this.time; this.chromosphere.material.uniforms.uFlare.value=this.solarEvent.strength*.55; this.corona.position.set(sunX,layout.y,-.12); this.corona.scale.setScalar(sunScale); this.corona.material.uniforms.uTime.value=this.time; this.corona.material.uniforms.uFlare.value=this.solarEvent.strength*.55; this.corona.material.uniforms.uOpacity.value=.26*(.45+.55*sunP); this.coronaOuter.position.set(sunX,layout.y,-.18); this.coronaOuter.scale.setScalar(sunScale); this.coronaOuter.material.uniforms.uTime.value=this.time*.78; this.coronaOuter.material.uniforms.uFlare.value=this.solarEvent.strength*.55; this.coronaOuter.material.uniforms.uOpacity.value=.105*(.35+.65*sunP);
      this.travelMercuryGroup.visible=mercuryP>.01; this.travelMercuryGroup.position.set(mercuryX,layout.y,0); this.travelMercuryGroup.scale.setScalar(mercuryScale); this.travelMercury.rotation.set(.09,(reverse?this.travelMercuryStartRotation:.62)+this.time*.014,.12); this.travelMercuryMaterial.opacity=this.clamp(mercuryP); this.travelMercuryMaterial.depthWrite=mercuryP>.98;
      this.camera.position.set(0,0,layout.distance*(1+.42*Math.sin(s.cross*Math.PI))); this.camera.lookAt(0,0,0); this.renderer.toneMappingExposure=1.18+.07*(reverse?s.arrive:1-s.depart*.20); this.renderer.render(this.scene,this.camera);
    } else if(this.mode==="canvas") this.drawCanvasTravel(s,reverse,{sunX,sunScale,mercuryX,mercuryScale,sunP,mercuryP,layout});
    else if(this.mode==="css") {
      const sphere=this.viewport.querySelector(".sun-emergency-sphere"), corona=this.viewport.querySelector(".sun-emergency-corona"), mercury=this.viewport.querySelector(".sun-emergency-mercury");
      const toPercent=x=>50+(x-layout.x)/(layout.half*(this.width/this.height))*20;
      if(sphere){sphere.style.left=`${toPercent(sunX)}%`;sphere.style.opacity=String(sunP);sphere.style.transform=`translate(-50%,-50%) scale(${sunScale})`;}
      if(corona){corona.style.left=`${toPercent(sunX)}%`;corona.style.opacity=String(.7*sunP);corona.style.transform=`translate(-50%,-50%) scale(${sunScale})`;}
      if(mercury){mercury.style.display=mercuryP>.01?"block":"none";mercury.style.left=`${toPercent(mercuryX)}%`;mercury.style.opacity=String(mercuryP);mercury.style.transform=`translate(-50%,-50%) scale(${mercuryScale})`;}
    }
    if(s.progress>=.999&&!this.travelCompleteFired){ this.travelCompleteFired=true; const callback=this.travelCallbacks.onComplete; if(reverse){ this.travelMode=null; this.travelCallbacks={}; this.element.classList.remove("is-leaving"); this.element.style.opacity="1"; this.caption.classList.add("is-visible"); this.caption.inert=false; this.caption.style.opacity="1"; this.credit.style.opacity=".9"; if(this.travelMercuryGroup)this.travelMercuryGroup.visible=false; if(this.renderer)this.renderer.toneMappingExposure=1.24; document.getElementById("announcement").textContent="Tiba di Matahari."; } callback?.(); }
  }

  drawCanvasSun(layout,blend){
    const ctx=this.ctx,w=this.width,h=this.height; ctx.clearRect(0,0,w,h); this.drawCanvasStars(ctx,w,h); const x=w*.5+(this.mobile?0:w*.07)+blend*(this.mobile?0:w*.06), y=h*(.49+layout.y*.02)-blend*(this.mobile?h*.08:0), r=Math.min(w,h)*(this.mobile?.29:.34)*(1-blend*(this.mobile?.08:.06)); this.drawSunDisc(ctx,x,y,r,1); if(this.solarEvent.strength>.12)this.drawCanvasEjecta(ctx,x,y,r,this.solarEvent.strength);
  }

  drawCanvasStars(ctx,w,h){ ctx.save(); for(let i=0;i<180;i++){const a=Math.sin((i+2)*91.17)*43758.5453,b=Math.sin((i+4)*17.53)*14375.921;const x=(a-Math.floor(a))*w,y=(b-Math.floor(b))*h;ctx.globalAlpha=.12+(i%7)*.035;ctx.fillStyle="#c9d7e6";ctx.fillRect(x,y,i%11===0?1.4:.8,i%11===0?1.4:.8);} ctx.restore(); }

  drawSunDisc(ctx,x,y,r,opacity=1){
    ctx.save();
    ctx.globalAlpha=opacity;
    const corona=ctx.createRadialGradient(x,y,r*.78,x,y,r*1.52);
    corona.addColorStop(0,"rgba(255,226,125,0)");
    corona.addColorStop(.34,"rgba(255,190,70,.18)");
    corona.addColorStop(.62,"rgba(255,105,18,.10)");
    corona.addColorStop(1,"rgba(255,70,8,0)");
    ctx.fillStyle=corona;ctx.beginPath();ctx.arc(x,y,r*1.56,0,Math.PI*2);ctx.fill();

    const g=ctx.createRadialGradient(x-r*.14,y-r*.16,r*.03,x,y,r);
    g.addColorStop(0,"#ffe07a");g.addColorStop(.20,"#ffb62d");g.addColorStop(.52,"#ff7910");g.addColorStop(.84,"#f84c08");g.addColorStop(1,"#d93605");
    ctx.fillStyle=g;ctx.beginPath();ctx.arc(x,y,r,0,Math.PI*2);ctx.fill();ctx.clip();

    ctx.globalCompositeOperation="soft-light";
    for(let i=0;i<112;i++){
      const a0=Math.sin((i+5)*12.9898)*43758.5453, b0=Math.sin((i+11)*78.233)*19642.349;
      const fa=a0-Math.floor(a0), fb=b0-Math.floor(b0);
      const baseAng=fa*Math.PI*2+Math.sin(this.time*.021+i*.37)*.045;
      const baseRad=Math.sqrt(fb)*r*.86;
      const length=r*(.055+(i%9)*.0065);
      const bend=.34*Math.sin(i*1.91+this.time*.037);
      const sx=x+Math.cos(baseAng)*baseRad, sy=y+Math.sin(baseAng)*baseRad;
      ctx.beginPath();ctx.moveTo(sx,sy);
      const tang=baseAng+Math.PI*.5+bend;
      const mx=sx+Math.cos(tang)*length*.58+Math.cos(baseAng)*length*.11;
      const my=sy+Math.sin(tang)*length*.58+Math.sin(baseAng)*length*.11;
      const ex=sx+Math.cos(tang)*length+Math.cos(baseAng)*length*.05;
      const ey=sy+Math.sin(tang)*length+Math.sin(baseAng)*length*.05;
      ctx.quadraticCurveTo(mx,my,ex,ey);
      const flicker=.72+.28*Math.sin(this.time*(.55+(i%7)*.035)+i*1.71);
      ctx.globalAlpha=(.055+(i%6)*.014)*flicker;
      ctx.strokeStyle=i%7===0?"#fff1a0":i%3===0?"#ffcf42":"#ff6c0d";
      ctx.lineWidth=Math.max(.8,r*(.0024+(i%5)*.00065));ctx.stroke();
    }
    ctx.globalCompositeOperation="overlay";
    for(let i=0;i<44;i++){
      const a0=Math.sin((i+41)*41.17)*27182.817, b0=Math.sin((i+17)*19.73)*31415.926;
      const fa=a0-Math.floor(a0), fb=b0-Math.floor(b0), ang=fa*Math.PI*2+this.time*.002*(i%2?1:-1);
      const rad=Math.sqrt(fb)*r*.78, span=.20+(i%7)*.027;
      ctx.beginPath();
      for(let j=0;j<=16;j++){
        const u=j/16-.5, aa=ang+u*span, wave=Math.sin(u*10+i*.71+this.time*.044)*r*.007;
        const rr=rad+wave+r*.018*Math.sin((u+.5)*Math.PI);
        const px=x+Math.cos(aa)*rr, py=y+Math.sin(aa)*rr;
        if(j===0)ctx.moveTo(px,py);else ctx.lineTo(px,py);
      }
      const pulse=.62+.38*Math.sin(this.time*(.38+(i%5)*.047)+i*.91);
      ctx.globalAlpha=(.045+(i%5)*.012)*pulse;ctx.strokeStyle=i%3?"#ffbe31":"#fff0a0";ctx.lineWidth=Math.max(1,r*(.0040+(i%3)*.0009));ctx.stroke();
    }

    ctx.globalCompositeOperation="source-over";
    ctx.globalAlpha=.55;ctx.fillStyle="#7c2d0b";
    ctx.beginPath();ctx.ellipse(x-r*.37,y-r*.18,r*.070,r*.030,-.25,0,Math.PI*2);ctx.fill();
    ctx.beginPath();ctx.ellipse(x+r*.28,y+r*.23,r*.052,r*.025,.32,0,Math.PI*2);ctx.fill();
    ctx.globalAlpha=.25;ctx.fillStyle="#421506";
    ctx.beginPath();ctx.ellipse(x-r*.37,y-r*.18,r*.035,r*.014,-.25,0,Math.PI*2);ctx.fill();
    ctx.beginPath();ctx.ellipse(x+r*.28,y+r*.23,r*.025,r*.011,.32,0,Math.PI*2);ctx.fill();
    ctx.restore();

    ctx.save();ctx.globalCompositeOperation="lighter";ctx.shadowColor="#ffd45f";ctx.shadowBlur=r*.020;
    const arcs=[[-2.45,.62,.34],[-1.03,.40,.22],[.48,.53,.29],[1.89,.45,.25],[2.58,.30,.18]];
    for(let i=0;i<arcs.length;i++){const [a,span,hh]=arcs[i];for(let strand=0;strand<3;strand++){ctx.beginPath();const steps=54;for(let j=0;j<=steps;j++){const t=j/steps,arch=Math.pow(Math.sin(Math.PI*t),1.08),ang=a-span*.5+span*t;const ripple=(Math.sin(t*17+i*2.1+strand*.8+this.time*.05)*.009+Math.sin(t*31+i-this.time*.03)*.004)*arch;const rr=r*(1+hh*arch+ripple)+(strand-1)*r*.005*arch;const px=x+Math.cos(ang)*rr,py=y+Math.sin(ang)*rr;if(j===0)ctx.moveTo(px,py);else ctx.lineTo(px,py);}ctx.globalAlpha=.14+strand*.055;ctx.strokeStyle=strand===1?"#ffd15c":"#ff7624";ctx.lineWidth=Math.max(.65,r*(.0028+strand*.0013));ctx.stroke();}}
    ctx.restore();
  }

  drawCanvasEjecta(ctx,x,y,r,strength){ ctx.save();ctx.translate(x,y);ctx.rotate(-.72);ctx.strokeStyle=`rgba(255,158,70,${.12+.30*strength})`;ctx.lineWidth=2;for(let i=0;i<9;i++){ctx.beginPath();ctx.moveTo(r*.86,(i-4)*r*.015);ctx.quadraticCurveTo(r*(1.05+i*.025),-r*(.10+i*.018),r*(1.25+i*.06),-r*(.16+i*.025));ctx.stroke();}ctx.restore(); }

  drawCanvasTravel(s,reverse,state){ const ctx=this.ctx,w=this.width,h=this.height;ctx.clearRect(0,0,w,h);this.drawCanvasStars(ctx,w,h);const worldScale=Math.min(w,h)*.34/state.layout.scale,screenX=v=>w*.5+(v-state.layout.x)*worldScale;const y=h*.49;this.drawSunDisc(ctx,screenX(state.sunX),y,Math.min(w,h)*.34*state.sunScale/state.layout.scale,state.sunP);this.drawMercuryCanvas(ctx,screenX(state.mercuryX),y,Math.min(w,h)*.30*state.mercuryScale,state.mercuryP); }

  drawMercuryCanvas(ctx,x,y,r,opacity){ if(opacity<=.01)return;ctx.save();ctx.globalAlpha=opacity;ctx.beginPath();ctx.arc(x,y,r,0,Math.PI*2);ctx.clip();if(this.mercurySurface){ctx.drawImage(this.mercurySurface,x-r,y-r,r*2,r*2);}else{const g=ctx.createRadialGradient(x-r*.3,y-r*.3,0,x,y,r);g.addColorStop(0,"#aaa69c");g.addColorStop(.6,"#696761");g.addColorStop(1,"#242529");ctx.fillStyle=g;ctx.fillRect(x-r,y-r,r*2,r*2);}ctx.restore(); }
};
