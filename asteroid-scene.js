"use strict";

const ASTEROID_MARS_TEXTURE = "./assets/textures/mars-surface-2k.jpg";
const ASTEROID_JUPITER_TEXTURE = "./assets/textures/jupiter-hubble-inspired-4k.jpg";
const ASTEROID_TEXTURE_ROOT = "./assets/textures/asteroids/";
const ASTEROID_VARIANTS = Object.freeze(["charcoal", "brown-gray", "dusty", "metallic-rock"]);
const ASTEROID_EXPLORATION_STOPS = Object.freeze([
  {
    kicker: "IDENTITAS SABUK ASTEROID",
    title: "Bukan Lorong Batu",
    subtitle: "Wilayah luas sisa pembentukan Tata Surya",
    summary: "Sabuk asteroid utama adalah wilayah besar di antara orbit Mars dan Jupiter yang dihuni banyak benda berbatu. Jarak antarbenda tetap sangat besar, sehingga sabuk ini bukan dinding asteroid yang rapat.",
    facts: [
      "Mayoritas asteroid yang dikenal mengorbit Matahari di sabuk utama antara Mars dan Jupiter.",
      "Ukurannya beragam, dari bongkahan kecil sampai objek besar seperti Vesta dan planet katai Ceres.",
      "Asteroid adalah sisa material dari masa awal pembentukan Tata Surya sekitar 4,6 miliar tahun lalu."
    ],
    source: "https://science.nasa.gov/solar-system/asteroids/facts/",
    images: [{ src: "./assets/asteroid-belt/overview.svg", alt: "Ilustrasi sabuk asteroid yang renggang", credit: "Visualisasi ANTARA", source: "https://science.nasa.gov/solar-system/asteroids/facts/", caption: "Sabuk asteroid adalah wilayah luas dengan banyak ruang kosong.", fit: "contain" }]
  },
  {
    kicker: "LOKASI DI TATA SURYA",
    title: "Di Antara Dua Dunia",
    subtitle: "Setelah Mars, sebelum Jupiter",
    summary: "Sabuk asteroid utama menempati wilayah di antara orbit Mars dan Jupiter. Dalam perjalanan ANTARA, sabuk ini menjadi destinasi mandiri sebelum pengguna melanjutkan perjalanan menuju Jupiter.",
    facts: [
      "Sabuk utama bukan cincin milik Jupiter; objek-objeknya mengorbit Matahari.",
      "Orbit asteroid tersebar pada rentang jarak yang luas dan memiliki eksentrisitas serta kemiringan berbeda.",
      "Gravitasi Jupiter sangat memengaruhi dinamika sabuk dan membentuk celah-celah resonansi tertentu."
    ],
    source: "https://science.nasa.gov/solar-system/asteroids/facts/",
    images: [{ src: "./assets/asteroid-belt/location.svg", alt: "Diagram lokasi sabuk asteroid di antara Mars dan Jupiter", credit: "Visualisasi ANTARA", source: "https://science.nasa.gov/solar-system/asteroids/facts/", caption: "Posisi sabuk utama relatif terhadap Mars dan Jupiter.", fit: "contain" }]
  },
  {
    kicker: "ASAL-USUL PEMBENTUKAN",
    title: "Planet yang Tak Pernah Jadi",
    subtitle: "Jejak kondisi awal Tata Surya",
    summary: "Material di kawasan ini terbentuk bersama komponen Tata Surya lain. Gangguan gravitasi, terutama dari Jupiter yang besar, menghambat banyak material untuk menyatu menjadi satu planet besar.",
    facts: [
      "Asteroid menyimpan petunjuk tentang material dan proses yang bekerja saat planet-planet mulai terbentuk.",
      "Tabrakan selama miliaran tahun memecah, mengubah, dan mengelompokkan ulang banyak benda di sabuk utama.",
      "Karena sejarahnya panjang, asteroid yang berbeda dapat memiliki struktur dan komposisi yang sangat berbeda."
    ],
    source: "https://science.nasa.gov/resource/fact-sheet-dawn-to-the-asteroid-belt/",
    images: [{ src: "./assets/asteroid-belt/formation.svg", alt: "Diagram pembentukan sabuk asteroid", credit: "Visualisasi ANTARA", source: "https://science.nasa.gov/resource/fact-sheet-dawn-to-the-asteroid-belt/", caption: "Material awal Tata Surya yang tidak menjadi satu planet.", fit: "contain" }]
  },
  {
    kicker: "CERES DAN OBJEK BESAR",
    title: "Ceres, Vesta, dan Tetangga Besarnya",
    subtitle: "Objek menonjol di antara jutaan benda kecil",
    summary: "Ceres adalah objek terbesar di sabuk asteroid dan diklasifikasikan sebagai planet katai. Vesta adalah salah satu benda paling masif berikutnya dan memperlihatkan sejarah geologi yang kompleks.",
    facts: [
      "Ceres ditemukan Giuseppe Piazzi pada 1801 dan menjadi planet katai pada 2006.",
      "Ceres memiliki radius sekitar 476 kilometer dan menyumbang sekitar seperempat massa total sabuk asteroid.",
      "Vesta memiliki kerak, mantel, dan inti yang terdiferensiasi, karakteristik yang membuatnya sangat penting bagi ilmu keplanetan."
    ],
    source: "https://science.nasa.gov/dwarf-planets/ceres/facts/",
    images: [{ src: "./assets/asteroid-belt/ceres-vesta.svg", alt: "Ilustrasi Ceres dan Vesta", credit: "Visualisasi ANTARA", source: "https://science.nasa.gov/dwarf-planets/ceres/facts/", caption: "Ceres dan Vesta adalah dua dunia utama di sabuk asteroid.", fit: "contain" }]
  },
  {
    kicker: "KOMPOSISI ASTEROID",
    title: "Batuan, Karbon, dan Logam",
    subtitle: "Tidak semua asteroid tersusun dari material yang sama",
    summary: "Permukaan asteroid dapat gelap kaya karbon, berbatu kaya silikat, atau mengandung proporsi logam yang lebih besar. Variasi komposisi ini merupakan rekaman kimia lingkungan tempat mereka terbentuk dan berevolusi.",
    facts: [
      "Asteroid tipe C cenderung gelap dan kaya material karbonan.",
      "Asteroid tipe S lebih kaya silikat dan material berbatu.",
      "Beberapa asteroid mengandung logam dalam jumlah tinggi; 16 Psyche diperkirakan merupakan campuran batuan dan logam."
    ],
    source: "https://science.nasa.gov/solar-system/asteroids/facts/",
    images: [{ src: "./assets/asteroid-belt/composition.svg", alt: "Diagram variasi komposisi asteroid", credit: "Visualisasi ANTARA", source: "https://www.jpl.nasa.gov/press-kits/psyche/quick-facts/", caption: "Komposisi asteroid dapat berbeda secara drastis.", fit: "contain" }]
  },
  {
    kicker: "SEJARAH PENEMUAN",
    title: "Dari Planet Baru ke Sabuk Asteroid",
    subtitle: "Klasifikasi berubah seiring bertambahnya penemuan",
    summary: "Ceres awalnya dianggap sebagai planet. Setelah semakin banyak benda ditemukan pada kawasan yang sama, astronom mulai memandang wilayah itu sebagai populasi objek tersendiri yang kini dikenal sebagai sabuk asteroid.",
    facts: [
      "Ceres ditemukan pada 1801, disusul Pallas, Juno, dan Vesta dalam beberapa tahun berikutnya.",
      "Pada abad ke-19, istilah asteroid dan sabuk asteroid makin luas digunakan untuk objek-objek tersebut.",
      "Klasifikasi modern menempatkan Ceres sebagai planet katai sementara banyak tetangganya disebut asteroid."
    ],
    source: "https://science.nasa.gov/dwarf-planets/ceres/exploration/",
    images: [{ src: "./assets/asteroid-belt/history.svg", alt: "Garis waktu sejarah penemuan sabuk asteroid", credit: "Visualisasi ANTARA", source: "https://science.nasa.gov/dwarf-planets/ceres/exploration/", caption: "Perubahan cara astronom mengklasifikasikan objek di antara Mars dan Jupiter.", fit: "contain" }]
  },
  {
    kicker: "MISI EKSPLORASI ASTEROID",
    title: "Dawn, Psyche, dan Dunia Kecil",
    subtitle: "Wahana antariksa membaca arsip awal Tata Surya",
    summary: "NASA Dawn mengorbit Vesta lalu Ceres, memberi pandangan dekat pada dua benda besar dengan karakter sangat berbeda. Misi Psyche melanjutkan eksplorasi asteroid dengan target 16 Psyche di bagian luar sabuk utama.",
    facts: [
      "Dawn mengorbit Vesta pada 2011–2012 dan Ceres mulai 2015.",
      "Dawn menjadi misi pertama yang mengorbit dua target Tata Surya di luar sistem Bumi-Bulan.",
      "Psyche dirancang untuk mempelajari asteroid kaya logam dan membantu memahami pembentukan inti planet."
    ],
    source: "https://science.nasa.gov/dwarf-planets/ceres/exploration/",
    images: [{ src: "./assets/asteroid-belt/missions.svg", alt: "Diagram eksplorasi asteroid oleh wahana antariksa", credit: "Visualisasi ANTARA", source: "https://science.nasa.gov/dwarf-planets/ceres/exploration/", caption: "Dawn dan Psyche mewakili era eksplorasi langsung sabuk asteroid.", fit: "contain" }]
  }
]);

const ASTEROID_INFO_VIEWS = Object.freeze([
  { x:0, y:0, z:8.4, lookX:0, lookY:0, marker:false },
  { x:-.45, y:.05, z:9.15, lookX:0, lookY:0, marker:false },
  { x:.55, y:-.12, z:8.75, lookX:.25, lookY:0, marker:false },
  { x:2.85, y:1.05, z:7.15, lookX:2.75, lookY:.95, marker:true },
  { x:-1.15, y:-.35, z:6.95, lookX:-.8, lookY:-.25, marker:false },
  { x:.35, y:.18, z:8.7, lookX:.15, lookY:.1, marker:false },
  { x:-.25, y:.05, z:8.25, lookX:0, lookY:0, marker:false }
]);

window.AsteroidBeltScene = class AsteroidBeltScene {
  constructor() {
    this.element = document.getElementById("asteroid-scene");
    this.viewport = document.getElementById("asteroid-viewport");
    this.caption = this.element.querySelector(".asteroid-caption");
    this.exploreButton = document.getElementById("asteroid-explore-button");
    this.exploration = document.getElementById("asteroid-exploration");
    this.explorationClose = document.getElementById("asteroid-exploration-close");
    this.topicKicker = document.getElementById("asteroid-topic-kicker");
    this.topicTitle = document.getElementById("asteroid-topic-title");
    this.topicSubtitle = document.getElementById("asteroid-topic-subtitle");
    this.topicSummary = document.getElementById("asteroid-topic-summary");
    this.topicFacts = document.getElementById("asteroid-topic-facts");
    this.topicSource = document.getElementById("asteroid-topic-source");
    this.topicCurrent = document.getElementById("asteroid-topic-current");
    this.topicTotal = document.getElementById("asteroid-topic-total");
    this.topicPrev = document.getElementById("asteroid-topic-prev");
    this.topicNext = document.getElementById("asteroid-topic-next");
    this.topicProgress = document.getElementById("asteroid-topic-progress");
    this.contextMedia = document.getElementById("asteroid-context-media");
    this.ceresBadge = document.getElementById("asteroid-ceres-badge");
    this.focusReticle = document.getElementById("asteroid-focus-reticle");
    this.motion = matchMedia("(prefers-reduced-motion: reduce)");
    this.loading = null;
    this.active = false;
    this.exploring = false;
    this.topicIndex = 0;
    this.frame = null;
    this.previous = 0;
    this.time = 0;
    this.width = 1;
    this.height = 1;
    this.mobile = false;
    this.travelMode = null;
    this.travelDirection = 1;
    this.travelStartedAt = 0;
    this.travelDuration = 7.4;
    this.travelCallbacks = {};
    this.travelCoveredFired = false;
    this.travelCompleteFired = false;
    this.pointer = { x: 0, y: 0 };
    this.cameraOffset = { x: 0, y: 0 };
    this.focusCamera = { x:0, y:0, z:8.4, lookX:0, lookY:0 };
    this.focusTarget = { ...this.focusCamera };
    this.seed = 0x41535452;
    this.caption.inert = true;
    this.exploration.inert = true;
    this.topicTotal.textContent = String(ASTEROID_EXPLORATION_STOPS.length).padStart(2, "0");
    this.topicProgress.replaceChildren(...ASTEROID_EXPLORATION_STOPS.map(() => document.createElement("span")));
    this.setExplorationStop(0, { announce: false });
    this.exploreButton.addEventListener("click", () => this.enterExploration());
    this.explorationClose.addEventListener("click", () => this.exitExploration());
    this.topicPrev.addEventListener("click", () => this.setExplorationStop(this.topicIndex - 1));
    this.topicNext.addEventListener("click", () => this.setExplorationStop(this.topicIndex + 1));
    this.element.addEventListener("pointermove", event => {
      if (event.pointerType !== "mouse" || this.motion.matches || this.travelMode) return;
      const rect = this.element.getBoundingClientRect();
      this.pointer.x = (event.clientX - rect.left) / rect.width - .5;
      this.pointer.y = (event.clientY - rect.top) / rect.height - .5;
    });
    this.element.addEventListener("pointerleave", () => { this.pointer.x = this.pointer.y = 0; });
    addEventListener("resize", () => { if (this.active || !this.element.hidden) this.resize(); });
    document.addEventListener("visibilitychange", () => {
      if (!document.hidden && this.active && !this.frame) { this.previous = performance.now(); this.tick(this.previous); }
    });
  }

  clamp(v, a=0, b=1) { return Math.min(b, Math.max(a, v)); }
  smooth(a,b,v) { const t=this.clamp((v-a)/(b-a)); return t*t*(3-2*t); }
  ease(v) { return 1-Math.pow(1-this.clamp(v),3); }
  travelSmooth(v) { const t=this.clamp(v); return t*t*t*(t*(t*6-15)+10); }
  travelState() {
    const elapsed=this.time-this.travelStartedAt;
    const progress=this.travelSmooth(elapsed/this.travelDuration);
    const pullback=this.travelSmooth(progress/.31);
    const pan=this.travelSmooth((progress-.23)/.39);
    const approach=this.travelSmooth((progress-.58)/.42);
    return {elapsed,progress,pullback,pan,approach};
  }
  rand() { this.seed = (1664525*this.seed + 1013904223) >>> 0; return this.seed / 4294967296; }

  loadImage(src) {
    return new Promise((resolve,reject) => {
      const image = new Image();
      image.decoding = "async";
      image.onload = async () => { try { await image.decode?.(); } catch (_) {} resolve(image); };
      image.onerror = () => reject(new Error(`Unable to load ${src}`));
      image.src = src;
    });
  }

  prepare() {
    if (this.loading) return this.loading;
    const textureFiles = ASTEROID_VARIANTS.flatMap(name => [
      `${ASTEROID_TEXTURE_ROOT}${name}-albedo.png`, `${ASTEROID_TEXTURE_ROOT}${name}-bump.png`, `${ASTEROID_TEXTURE_ROOT}${name}-roughness.png`
    ]);
    textureFiles.push(`${ASTEROID_TEXTURE_ROOT}ceres-albedo.png`, `${ASTEROID_TEXTURE_ROOT}ceres-bump.png`, `${ASTEROID_TEXTURE_ROOT}ceres-roughness.png`, ASTEROID_MARS_TEXTURE, ASTEROID_JUPITER_TEXTURE);
    this.loading = Promise.allSettled([import("./assets/vendor/three/three.module.min.js"), ...textureFiles.map(src => this.loadImage(src))]).then(async results => {
      const moduleResult = results[0];
      const images = results.slice(1).map(r => r.status === "fulfilled" ? r.value : null);
      const map = new Map(textureFiles.map((src,i) => [src, images[i]]));
      this.loadedImages = map;
      if (moduleResult.status === "fulfilled") {
        try { this.createThreeScene(moduleResult.value, map); }
        catch (error) { console.warn("Asteroid WebGL unavailable; using Canvas fallback.", error); this.createCanvasFallback(); }
      } else this.createCanvasFallback();
      this.resize();
      if (this.renderer?.compileAsync) await this.renderer.compileAsync(this.scene, this.camera);
      this.element.dataset.ready = this.renderer ? "true" : "fallback";
      if (this.active) this.render();
    }).catch(error => {
      console.error("Asteroid belt preparation failed", error);
      this.createCanvasFallback();
      this.resize();
      this.element.dataset.ready = "fallback";
    });
    return this.loading;
  }

  makeTexture(THREE, image, { srgb=false }={}) {
    if (!image) return null;
    const texture = new THREE.Texture(image);
    texture.colorSpace = srgb ? THREE.SRGBColorSpace : THREE.NoColorSpace;
    texture.wrapS = THREE.RepeatWrapping;
    texture.wrapT = THREE.ClampToEdgeWrapping;
    texture.minFilter = THREE.LinearMipmapLinearFilter;
    texture.magFilter = THREE.LinearFilter;
    texture.generateMipmaps = true;
    texture.anisotropy = Math.min(8, this.renderer.capabilities.getMaxAnisotropy());
    texture.needsUpdate = true;
    return texture;
  }

  deformGeometry(THREE, variant) {
    const geometry = new THREE.SphereGeometry(1, 48, 32);
    const attr = geometry.attributes.position;
    const squash = [
      [1.15,.82,.93], [.93,1.08,.79], [1.23,.75,.86], [.86,1.17,.92]
    ][variant % 4];
    const phase = variant * 1.731 + .35;
    for (let i=0;i<attr.count;i++) {
      let x=attr.getX(i), y=attr.getY(i), z=attr.getZ(i);
      const wave = Math.sin(x*4.7 + phase)*.075 + Math.sin(y*6.1-z*3.8+phase)*.055 + Math.sin((x+y+z)*8.3)*.035;
      const ridge = Math.abs(Math.sin(x*3.1 + y*4.2 + z*2.3 + phase))*.045;
      const f = 1 + wave - ridge;
      attr.setXYZ(i, x*f*squash[0], y*f*squash[1], z*f*squash[2]);
    }
    geometry.computeVertexNormals();
    geometry.attributes.position.needsUpdate = true;
    return geometry;
  }

  createThreeScene(THREE, images) {
    this.THREE = THREE;
    const canvas = document.createElement("canvas");
    const context = canvas.getContext("webgl2", { alpha:true, antialias:true, powerPreference:"high-performance" });
    if (!context) throw new Error("WebGL2 unavailable");
    this.renderer = new THREE.WebGLRenderer({ canvas, context, alpha:true, antialias:true });
    this.renderer.setClearColor(0x02060d, 0);
    this.renderer.outputColorSpace = THREE.SRGBColorSpace;
    this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
    this.renderer.toneMappingExposure = 1.08;
    this.viewport.replaceChildren(canvas);
    this.scene = new THREE.Scene();
    this.camera = new THREE.PerspectiveCamera(38,1,.08,180);
    this.camera.position.set(0,0,8.4);

    this.scene.add(new THREE.HemisphereLight(0xb6c1d0,0x130d09,.7));
    const key = new THREE.DirectionalLight(0xffe6bc,2.7); key.position.set(-4.5,4.1,7); this.scene.add(key);
    const rim = new THREE.DirectionalLight(0x7187a5,.55); rim.position.set(5,-3,-7); this.scene.add(rim);

    const starCount = this.mobile ? 700 : 1200;
    const starPositions = new Float32Array(starCount*3);
    for(let i=0;i<starCount;i++) {
      starPositions[i*3]=(this.rand()-.5)*75;
      starPositions[i*3+1]=(this.rand()-.5)*42;
      starPositions[i*3+2]=-8-this.rand()*48;
    }
    const starGeometry = new THREE.BufferGeometry(); starGeometry.setAttribute("position",new THREE.BufferAttribute(starPositions,3));
    this.stars = new THREE.Points(starGeometry,new THREE.PointsMaterial({color:0xcbd6e5,size:.035,transparent:true,opacity:.72,depthWrite:false}));
    this.scene.add(this.stars);

    this.materials = ASTEROID_VARIANTS.map((name,index) => {
      const map = this.makeTexture(THREE, images.get(`${ASTEROID_TEXTURE_ROOT}${name}-albedo.png`), {srgb:true});
      const bump = this.makeTexture(THREE, images.get(`${ASTEROID_TEXTURE_ROOT}${name}-bump.png`));
      const rough = this.makeTexture(THREE, images.get(`${ASTEROID_TEXTURE_ROOT}${name}-roughness.png`));
      return new THREE.MeshStandardMaterial({
        map, bumpMap:bump, bumpScale:.055 + index*.009, roughnessMap:rough,
        roughness:index===3?.68:.91, metalness:index===3?.12:.015,
        color:0xffffff, transparent:true, opacity:1
      });
    });
    this.geometries = ASTEROID_VARIANTS.map((_,i) => this.deformGeometry(THREE,i));
    this.fieldGroup = new THREE.Group(); this.scene.add(this.fieldGroup);
    this.asteroidMeshes=[]; this.asteroidMotion=[];
    const counts = this.mobile ? [17,15,13,11] : [30,28,24,20];
    counts.forEach((count,kind) => {
      const mesh = new THREE.InstancedMesh(this.geometries[kind],this.materials[kind],count);
      mesh.instanceMatrix.setUsage(THREE.DynamicDrawUsage);
      mesh.frustumCulled=false;
      const dummy=new THREE.Object3D(), motion=[];
      for(let i=0;i<count;i++) {
        const near=i<2;
        let x=(this.rand()-.5)*(near?13:32), y=(this.rand()-.5)*(near?9:18), z=near?1.4-this.rand()*4:-2-this.rand()*20;
        if(near && Math.abs(x)<2.6) x += x<0?-3.1:3.1;
        const scale=near ? .17+this.rand()*.26 : .05+Math.pow(this.rand(),1.9)*.19;
        const rot=new THREE.Euler(this.rand()*6.2,this.rand()*6.2,this.rand()*6.2);
        const speed=new THREE.Vector3((this.rand()-.5)*.045,(this.rand()-.5)*.04,(this.rand()-.5)*.038);
        motion.push({x,y,z,scale,rot,speed,phase:this.rand()*6.28});
        dummy.position.set(x,y,z); dummy.scale.setScalar(scale); dummy.rotation.copy(rot); dummy.updateMatrix(); mesh.setMatrixAt(i,dummy.matrix);
      }
      mesh.instanceMatrix.needsUpdate=true; this.fieldGroup.add(mesh); this.asteroidMeshes.push(mesh); this.asteroidMotion.push({mesh,motion,dummy});
    });

    this.featured = [
      this.makeFeaturedAsteroid(0,-4.35,1.8,.7,.46),
      this.makeFeaturedAsteroid(1,4.55,-1.65,.25,.58),
      this.makeFeaturedAsteroid(2,2.55,2.45,-2.4,.42),
      this.makeFeaturedAsteroid(3,-2.45,-2.55,-3.0,.38)
    ];
    this.featured.forEach(item=>this.fieldGroup.add(item.mesh));

    const ceresMap=this.makeTexture(THREE,images.get(`${ASTEROID_TEXTURE_ROOT}ceres-albedo.png`),{srgb:true});
    const ceresBump=this.makeTexture(THREE,images.get(`${ASTEROID_TEXTURE_ROOT}ceres-bump.png`));
    const ceresRough=this.makeTexture(THREE,images.get(`${ASTEROID_TEXTURE_ROOT}ceres-roughness.png`));
    this.ceresMaterial=new THREE.MeshStandardMaterial({map:ceresMap,bumpMap:ceresBump,bumpScale:.055,roughnessMap:ceresRough,roughness:.94,metalness:0,transparent:true});
    this.ceres=new THREE.Mesh(new THREE.SphereGeometry(1,72,48),this.ceresMaterial); this.ceres.position.set(4.25,2.05,-2.8); this.ceres.scale.setScalar(.56); this.fieldGroup.add(this.ceres);
    this.vesta=new THREE.Mesh(this.geometries[2],this.materials[2]);this.vesta.position.set(2.25,-1.42,-2.55);this.vesta.scale.setScalar(.43);this.vesta.rotation.set(.8,1.45,.25);this.fieldGroup.add(this.vesta);
    this.ceresWorld=new THREE.Vector3();this.ceresProjected=new THREE.Vector3();

    const marsMap=this.makeTexture(THREE,images.get(ASTEROID_MARS_TEXTURE),{srgb:true});
    const marsMat=new THREE.MeshStandardMaterial({map:marsMap,roughness:.86,transparent:true,opacity:1});
    this.travelMars=new THREE.Mesh(new THREE.SphereGeometry(1,96,64),marsMat); this.travelMarsGroup=new THREE.Group(); this.travelMarsGroup.add(this.travelMars); this.scene.add(this.travelMarsGroup); this.travelMarsGroup.visible=false;

    const jMap=this.makeTexture(THREE,images.get(ASTEROID_JUPITER_TEXTURE),{srgb:true});
    const jBump=jMap?.clone(); if(jBump){jBump.colorSpace=THREE.NoColorSpace;jBump.needsUpdate=true;}
    this.travelJupiterMaterial=new THREE.MeshStandardMaterial({map:jMap,bumpMap:jBump,bumpScale:.012,roughness:.88,transparent:true,opacity:1});
    this.travelJupiter=new THREE.Mesh(new THREE.SphereGeometry(1,120,80),this.travelJupiterMaterial);
    this.travelJupiterGroup=new THREE.Group(); this.travelJupiterGroup.add(this.travelJupiter);
    const ringTex=this.makeRingTexture(THREE);
    this.travelRingMaterial=new THREE.MeshBasicMaterial({map:ringTex,color:0xa99b84,transparent:true,opacity:.38,depthTest:true,depthWrite:false,side:THREE.DoubleSide});
    this.travelRing=new THREE.Mesh(new THREE.RingGeometry(1.30,1.88,220,3),this.travelRingMaterial); this.travelRing.rotation.x=Math.PI/2-.14; this.travelRing.rotation.z=.028; this.travelJupiterGroup.add(this.travelRing);
    this.scene.add(this.travelJupiterGroup); this.travelJupiterGroup.visible=false;
  }

  makeFeaturedAsteroid(kind,x,y,z,scale) {
    const mesh=new this.THREE.Mesh(this.geometries[kind],this.materials[kind]);
    mesh.position.set(x,y,z); mesh.scale.setScalar(scale); mesh.rotation.set(this.rand()*3,this.rand()*3,this.rand()*3);
    return {mesh,speed:new this.THREE.Vector3(.04+this.rand()*.05,.025+this.rand()*.035,.02+this.rand()*.04)};
  }

  makeRingTexture(THREE) {
    const c=document.createElement("canvas"); c.width=1024;c.height=32;const x=c.getContext("2d");const image=x.createImageData(c.width,c.height);
    for(let px=0;px<c.width;px++){const u=px/(c.width-1);let a=0;a+=Math.exp(-Math.pow((u-.31)/.085,2))*.27;a+=Math.exp(-Math.pow((u-.58)/.12,2))*.18;a+=Math.exp(-Math.pow((u-.80)/.07,2))*.09;a*=.76+.18*Math.sin(px*.091)+.06*Math.sin(px*.37);for(let py=0;py<c.height;py++){const i=(py*c.width+px)*4;image.data[i]=180;image.data[i+1]=166;image.data[i+2]=143;image.data[i+3]=Math.max(0,Math.min(255,Math.floor(a*255)));}}x.putImageData(image,0,0);const t=new THREE.CanvasTexture(c);t.colorSpace=THREE.SRGBColorSpace;t.needsUpdate=true;return t;
  }

  createCanvasFallback() {
    this.renderer=null;
    this.canvas=document.createElement("canvas"); this.ctx=this.canvas.getContext("2d"); this.viewport.replaceChildren(this.canvas);
  }

  resize() {
    const rect=this.viewport.getBoundingClientRect(); this.width=Math.max(1,Math.round(rect.width));this.height=Math.max(1,Math.round(rect.height));this.mobile=this.width<701;
    const dpr=Math.min(devicePixelRatio||1,this.mobile?1.55:2);
    if(this.renderer){this.renderer.setPixelRatio(dpr);this.renderer.setSize(this.width,this.height,false);this.camera.aspect=this.width/this.height;this.camera.updateProjectionMatrix();}
    else if(this.canvas){this.canvas.width=Math.round(this.width*dpr);this.canvas.height=Math.round(this.height*dpr);this.canvas.style.width=`${this.width}px`;this.canvas.style.height=`${this.height}px`;this.ctx.setTransform(dpr,0,0,dpr,0,0);}
  }

  updateAsteroids(delta, visibility=1) {
    if(!this.renderer)return;
    this.materials.forEach(mat=>mat.opacity=visibility);
    this.ceresMaterial.opacity=visibility;
    this.asteroidMotion.forEach((group,kind)=>{
      group.motion.forEach((m,i)=>{
        m.rot.x+=m.speed.x*delta;m.rot.y+=m.speed.y*delta;m.rot.z+=m.speed.z*delta;
        const drift=Math.sin(this.time*.09+m.phase)*.09;
        group.dummy.position.set(m.x+drift*(kind%2?1:-1),m.y+Math.cos(this.time*.08+m.phase)*.06,m.z);
        group.dummy.rotation.copy(m.rot);group.dummy.scale.setScalar(m.scale);group.dummy.updateMatrix();group.mesh.setMatrixAt(i,group.dummy.matrix);
      });
      group.mesh.instanceMatrix.needsUpdate=true;
    });
    this.featured.forEach((item,i)=>{item.mesh.rotation.x+=item.speed.x*delta;item.mesh.rotation.y+=item.speed.y*delta;item.mesh.rotation.z+=item.speed.z*delta;item.mesh.position.y+=Math.sin(this.time*.13+i)*.00045;});
    this.ceres.rotation.y+=delta*.055; this.ceres.rotation.x=.08+Math.sin(this.time*.07)*.015;
    if(this.vesta){this.vesta.rotation.y+=delta*.041;this.vesta.rotation.x+=delta*.013;}
  }

  start({settled=false}={}) {
    this.active=true;this.exploring=false;this.travelMode=null;this.element.hidden=false;this.element.style.opacity="1";this.element.classList.remove("is-leaving","is-exploring");this.caption.classList.toggle("is-visible",settled);this.caption.inert=!settled;this.exploration.inert=true;this.prepare();this.resize();cancelAnimationFrame(this.frame);this.previous=performance.now();this.tick(this.previous);
    if(!settled) requestAnimationFrame(()=>requestAnimationFrame(()=>{if(this.active&&!this.travelMode){this.caption.classList.add("is-visible");this.caption.inert=false;}}));
  }

  stop() {
    this.active=false;this.exploring=false;this.travelMode=null;cancelAnimationFrame(this.frame);this.frame=null;this.element.classList.remove("is-leaving","is-exploring");this.caption.classList.remove("is-visible");this.caption.inert=true;this.exploration.inert=true;this.element.hidden=true;this.element.style.opacity="0";window.ExplorationMedia?.closeLightbox?.({restoreFocus:false});
  }

  setExplorationStop(index,{announce=true,immediate=false}={}) {
    const previous=this.topicIndex;
    const next=Math.max(0,Math.min(ASTEROID_EXPLORATION_STOPS.length-1,index));const stop=ASTEROID_EXPLORATION_STOPS[next];this.topicIndex=next;
    const view=ASTEROID_INFO_VIEWS[next]||ASTEROID_INFO_VIEWS[0];this.focusTarget={x:view.x,y:view.y,z:view.z,lookX:view.lookX,lookY:view.lookY};
    if(immediate||this.motion.matches){this.focusCamera={...this.focusTarget};}
    if(!immediate&&this.exploring){this.exploration.classList.remove("is-switching-next","is-switching-prev");void this.exploration.offsetWidth;this.exploration.classList.add(next>=previous?"is-switching-next":"is-switching-prev");clearTimeout(this._topicSwitchTimer);this._topicSwitchTimer=setTimeout(()=>this.exploration.classList.remove("is-switching-next","is-switching-prev"),560);}
    this.focusReticle?.classList.remove("is-marker-visible");
    this.topicKicker.textContent=stop.kicker;this.topicTitle.textContent=stop.title;this.topicSubtitle.textContent=stop.subtitle;this.topicSummary.textContent=stop.summary;this.topicFacts.replaceChildren(...stop.facts.map(text=>{const li=document.createElement("li");li.textContent=text;return li;}));this.topicSource.href=stop.source;this.topicCurrent.textContent=String(next+1).padStart(2,"0");this.topicPrev.disabled=next===0;this.topicNext.disabled=next===ASTEROID_EXPLORATION_STOPS.length-1;Array.from(this.topicProgress.children).forEach((bar,i)=>bar.classList.toggle("is-active",i===next));window.ExplorationMedia?.render?.("asteroid",stop,this.contextMedia);
    if(announce&&this.exploring)document.getElementById("announcement").textContent=`Eksplorasi Sabuk Asteroid ${next+1} dari ${ASTEROID_EXPLORATION_STOPS.length}: ${stop.title}.`;
  }

  enterExploration() {
    if(!this.active||this.exploring||this.travelMode)return;this.exploring=true;this.element.classList.add("is-exploring");this.caption.inert=true;this.exploration.inert=false;const view=ASTEROID_INFO_VIEWS[this.topicIndex]||ASTEROID_INFO_VIEWS[0];this.focusTarget={x:view.x,y:view.y,z:view.z,lookX:view.lookX,lookY:view.lookY};if(!this.frame){this.previous=performance.now();this.tick(this.previous);}document.getElementById("announcement").textContent=`Mode eksplorasi Sabuk Asteroid dimulai. ${ASTEROID_EXPLORATION_STOPS[this.topicIndex].title}.`;requestAnimationFrame(()=>this.topicTitle.focus({preventScroll:true}));
  }

  exitExploration() {
    if(!this.exploring)return;this.exploring=false;this.focusTarget={x:0,y:0,z:8.4,lookX:0,lookY:0};this.focusReticle?.classList.remove("is-marker-visible");this.element.classList.remove("is-exploring");this.exploration.inert=true;this.caption.inert=false;window.ExplorationMedia?.closeLightbox?.({restoreFocus:false});document.getElementById("announcement").textContent="Kembali ke panorama Sabuk Asteroid.";requestAnimationFrame(()=>this.exploreButton.focus({preventScroll:true}));
  }

  beginTravel(mode,{onCovered,onComplete,marsRotation=.7,direction=1}={}) {
    if(this.travelMode)return;
    this.active=true;this.exploring=false;this.travelMode=mode;this.travelDirection=direction>=0?1:-1;
    this.travelCallbacks={onCovered,onComplete};this.travelStartedAt=0;this.time=0;this.travelDuration=this.motion.matches?.6:(mode.includes("jupiter")?7.8:7.0);
    this.travelCoveredFired=false;this.travelCompleteFired=false;this.element.hidden=false;this.element.style.opacity="1";this.element.classList.add("is-leaving");this.element.classList.remove("is-exploring");this.caption.classList.remove("is-visible");this.caption.inert=true;this.exploration.inert=true;this.prepare();this.resize();if(this.travelMars)this.travelMars.rotation.y=marsRotation;cancelAnimationFrame(this.frame);this.previous=performance.now();this.tick(this.previous);
  }
  beginTravelFromMars(options={}){this.beginTravel("from-mars",options);}
  beginTravelToMars(options={}){this.beginTravel("to-mars",options);}
  beginTravelToJupiter(options={}){this.beginTravel("to-jupiter",options);}
  beginTravelFromJupiter(options={}){this.beginTravel("from-jupiter",options);}

  tick(now) {
    this.frame=null;if(!this.active||document.hidden)return;const delta=Math.min((now-this.previous)/1000,.12);this.previous=now;this.time+=delta;const damp=1-Math.exp(-delta*2.15);this.cameraOffset.x+=(this.pointer.x-this.cameraOffset.x)*damp;this.cameraOffset.y+=(this.pointer.y-this.cameraOffset.y)*damp;const focusEase=this.motion.matches?1:1-Math.exp(-delta*2.1);for(const key of ["x","y","z","lookX","lookY"])this.focusCamera[key]+=(this.focusTarget[key]-this.focusCamera[key])*focusEase;this.updateAsteroids(delta,this.travelMode?this.currentBeltVisibility():1);this.render();this.frame=requestAnimationFrame(t=>this.tick(t));
  }

  currentBeltVisibility() {
    if(!this.travelMode)return 1;
    const state=this.travelState();
    const fieldIsDestination=this.travelMode==="from-mars"||this.travelMode==="from-jupiter";
    return fieldIsDestination ? this.travelSmooth((state.progress-.18)/.30) : 1-this.travelSmooth((state.progress-.70)/.25);
  }

  render() { if(this.travelMode)this.renderTravel(); else this.renderPanorama(); }

  renderPanorama() {
    if(!this.renderer&&!this.ctx)return;
    const focus=this.exploring?this.focusCamera:{x:0,y:0,z:8.4,lookX:0,lookY:0};
    const bx=this.mobile?focus.x:focus.x+this.cameraOffset.x*.28, by=this.mobile?focus.y:focus.y-this.cameraOffset.y*.18;
    if(this.renderer){this.travelMarsGroup.visible=false;this.travelJupiterGroup.visible=false;this.fieldGroup.visible=true;this.fieldGroup.position.set(Math.sin(this.time*.035)*.13,Math.cos(this.time*.028)*.07,0);this.fieldGroup.rotation.y=Math.sin(this.time*.018)*.012;this.camera.position.set(bx,by,focus.z);this.camera.lookAt(focus.lookX,focus.lookY,-2.3);this.stars.position.x=0;this.stars.rotation.y=this.time*.0009;this.renderer.render(this.scene,this.camera);this.updateCeresFocusMarker();}else{this.drawCanvasPanorama();this.focusReticle?.classList.remove("is-marker-visible");}
    if(this.ceresBadge){const alpha=.62+.2*Math.sin(this.time*.32);this.ceresBadge.style.opacity=String(alpha);}
  }

  updateCeresFocusMarker(){
    const view=ASTEROID_INFO_VIEWS[this.topicIndex]||ASTEROID_INFO_VIEWS[0];
    if(!this.focusReticle||!this.exploring||!view.marker||!this.renderer||!this.ceres){this.focusReticle?.classList.remove("is-marker-visible");return;}
    this.ceres.getWorldPosition(this.ceresWorld);this.ceresProjected.copy(this.ceresWorld).project(this.camera);
    const visible=this.ceresProjected.z<1&&Math.abs(this.ceresProjected.x)<1.05&&Math.abs(this.ceresProjected.y)<1.05;
    if(!visible){this.focusReticle.classList.remove("is-marker-visible");return;}
    const x=(this.ceresProjected.x*.5+.5)*this.width,y=(-this.ceresProjected.y*.5+.5)*this.height;this.focusReticle.style.left=`${x}px`;this.focusReticle.style.top=`${y}px`;this.focusReticle.style.setProperty("--marker-opacity",".94");this.focusReticle.classList.add("is-marker-visible");this.focusReticle.classList.toggle("is-left",x+240>this.width);
  }

  renderTravel() {
    if(!this.renderer&&!this.ctx)return;
    const state=this.travelState();
    const raw=this.clamp((this.time-this.travelStartedAt)/this.travelDuration);
    const mode=this.travelMode;
    const direction=this.travelDirection>=0?1:-1;
    const aspect=this.camera?.aspect||this.width/this.height;
    const halfHeight=Math.tan((38*Math.PI/180)/2)*8.4;
    const separationMagnitude=halfHeight*aspect*(this.mobile?3.9:3.25);
    const separation=separationMagnitude*direction;
    const cameraX=separation*state.pan;
    const cameraZ=8.4*(1+1.45*state.pullback*(1-state.approach));
    const sourceAlpha=1-this.travelSmooth((state.progress-.70)/.25);
    const destinationAlpha=this.travelSmooth((state.progress-.20)/.28);
    const fieldIsDestination=mode==="from-mars"||mode==="from-jupiter";
    const belt=fieldIsDestination?destinationAlpha:sourceAlpha;
    const sourceIsMars=mode==="from-mars";
    const destinationIsMars=mode==="to-mars";
    const sourceIsJupiter=mode==="from-jupiter";
    const destinationIsJupiter=mode==="to-jupiter";

    if(this.renderer){
      this.fieldGroup.visible=belt>.008;
      this.travelMarsGroup.visible=sourceIsMars||destinationIsMars;
      this.travelJupiterGroup.visible=sourceIsJupiter||destinationIsJupiter;
      this.materials.forEach(mat=>mat.opacity=belt);this.ceresMaterial.opacity=belt;
      const fieldX=fieldIsDestination?separation:0;
      this.fieldGroup.position.set(fieldX,0,0);
      this.fieldGroup.rotation.y=Math.sin(this.time*.018)*.012;

      if(sourceIsMars||destinationIsMars){
        const alpha=sourceIsMars?sourceAlpha:destinationAlpha;
        this.travelMarsGroup.position.set(destinationIsMars?separation:0,-.03,0);
        this.travelMarsGroup.scale.setScalar(1.08);
        this.travelMars.material.opacity=alpha;
      }
      if(sourceIsJupiter||destinationIsJupiter){
        const alpha=sourceIsJupiter?sourceAlpha:destinationAlpha;
        this.travelJupiterGroup.position.set(destinationIsJupiter?separation:0,.02,0);
        this.travelJupiterGroup.scale.setScalar(1.16);
        this.travelJupiterMaterial.opacity=alpha;this.travelRingMaterial.opacity=.38*alpha;
      }

      this.travelMars.rotation.y+=.0022;this.travelJupiter.rotation.y+=.0046;this.travelRing.rotation.z=.015+Math.sin(this.time*.14)*.006;
      this.stars.position.x=cameraX*.94;
      this.stars.rotation.y=this.time*.0009;
      this.camera.position.set(cameraX,0,cameraZ);
      const lookOffset=Math.sin(state.pan*Math.PI)*separationMagnitude*.055*direction;
      this.camera.lookAt(cameraX+lookOffset,0,-1.4);
      this.renderer.render(this.scene,this.camera);
    } else this.drawCanvasTravel(state,mode,belt,direction,sourceAlpha,destinationAlpha);

    if(!this.travelCoveredFired&&raw>.12){this.travelCoveredFired=true;this.travelCallbacks.onCovered?.();}
    if(raw>=.999&&!this.travelCompleteFired){
      this.travelCompleteFired=true;const cb=this.travelCallbacks.onComplete;const arrivesBelt=mode==="from-mars"||mode==="from-jupiter";
      if(arrivesBelt){this.travelMode=null;this.travelCallbacks={};this.element.classList.remove("is-leaving");this.caption.classList.add("is-visible");this.caption.inert=false;this.materials?.forEach(mat=>mat.opacity=1);if(this.ceresMaterial)this.ceresMaterial.opacity=1;document.getElementById("announcement").textContent="Tiba di Sabuk Asteroid.";}
      cb?.();
    }
  }

  drawStars(ctx,w,h){ctx.fillStyle="#030811";ctx.fillRect(0,0,w,h);ctx.fillStyle="#b9c7d5";for(let i=0;i<120;i++){const x=(i*137.3)%w,y=(i*83.7)%h,s=i%11===0?1.2:.55;ctx.globalAlpha=.25+(i%7)*.07;ctx.fillRect(x,y,s,s);}ctx.globalAlpha=1;}
  drawRock(ctx,x,y,r,seed,alpha=1){ctx.save();ctx.globalAlpha=alpha;ctx.translate(x,y);ctx.rotate(seed*.41);ctx.beginPath();for(let i=0;i<12;i++){const a=i/12*Math.PI*2,rr=r*(.78+.22*Math.sin(seed*1.7+i*2.31));const px=Math.cos(a)*rr,py=Math.sin(a)*rr*(.72+.12*Math.sin(seed));i?ctx.lineTo(px,py):ctx.moveTo(px,py);}ctx.closePath();const g=ctx.createRadialGradient(-r*.35,-r*.35,r*.05,0,0,r*1.1);g.addColorStop(0,"#a5957e");g.addColorStop(.45,"#675d52");g.addColorStop(1,"#25231f");ctx.fillStyle=g;ctx.fill();ctx.fillStyle="#19181488";for(let c=0;c<4;c++){const cr=r*(.08+.05*((c+seed)%3));ctx.beginPath();ctx.ellipse(r*(.25*Math.sin(seed+c*3)),r*(.2*Math.cos(seed+c*2)),cr,cr*.65,c,0,Math.PI*2);ctx.fill();}ctx.restore();}
  drawCanvasPanorama(){const ctx=this.ctx,w=this.width,h=this.height;this.drawStars(ctx,w,h);for(let i=0;i<45;i++){const depth=(i%9)/9, x=((i*179+this.time*2.2)%1200)/1200*w,y=((i*97)%690)/690*h,r=2+depth*10;this.drawRock(ctx,x,y,r,i*.83,.36+.48*depth);}this.drawRock(ctx,w*.2,h*.36,44,2.4,.95);this.drawRock(ctx,w*.81,h*.64,58,5.7,.95);ctx.fillStyle="#d4d0c5";ctx.beginPath();ctx.arc(w*.72,h*.28,25,0,Math.PI*2);ctx.fill();}
  drawCanvasTravel(state,mode,belt,direction,sourceAlpha,destinationAlpha){
    const ctx=this.ctx,w=this.width,h=this.height;this.drawStars(ctx,w,h);
    const pull=1+1.25*state.pullback*(1-state.approach);
    const pan=state.pan*direction;
    const toScreenX=world=>w*.5+(world-pan)*w*.34;
    const fieldIsDestination=mode==="from-mars"||mode==="from-jupiter";
    const fieldWorld=fieldIsDestination?direction:0;
    if(belt>.01){
      for(let i=0;i<38;i++){const depth=(i%9)/9,x=toScreenX(fieldWorld+((((i*179)%1200)/1200)-.5)*1.65),y=((i*97)%690)/690*h,r=(2+depth*9)/pull;this.drawRock(ctx,x,y,r,i*.83,belt*(.34+.5*depth));}
      this.drawRock(ctx,toScreenX(fieldWorld-.48),h*.36,42/pull,2.4,.94*belt);
      this.drawRock(ctx,toScreenX(fieldWorld+.50),h*.64,54/pull,5.7,.94*belt);
    }
    if(mode.includes("mars")){const isSource=mode==="from-mars",alpha=isSource?sourceAlpha:destinationAlpha,world=isSource?0:direction,r=92/pull,x=toScreenX(world);ctx.globalAlpha=alpha;ctx.fillStyle="#a45d46";ctx.beginPath();ctx.arc(x,h*.5,r,0,Math.PI*2);ctx.fill();}
    if(mode.includes("jupiter")){const isSource=mode==="from-jupiter",alpha=isSource?sourceAlpha:destinationAlpha,world=isSource?0:direction,r=108/pull,x=toScreenX(world);ctx.globalAlpha=alpha;ctx.strokeStyle="#8e816c88";ctx.lineWidth=6/pull;ctx.beginPath();ctx.ellipse(x,h*.5,r*1.7,r*.32,-.08,0,Math.PI*2);ctx.stroke();ctx.fillStyle="#d0b18f";ctx.beginPath();ctx.arc(x,h*.5,r,0,Math.PI*2);ctx.fill();}
    ctx.globalAlpha=1;
  }
};


/* ===== ANTARA VISUAL HANDOFF FIX: borrow the real Jupiter group in belt transitions ===== */
(() => {
  const P = window.AsteroidBeltScene?.prototype;
  if (!P || P.__jupiterVisualHandoffV1) return;
  P.__jupiterVisualHandoffV1 = true;

  const JUPITER_LIGHT = {
    exposure: 1.12,
    hemiSky: 0xd8e4f3, hemiGround: 0x1a0e0b, hemiIntensity: 1.25,
    keyColor: 0xffedcf, keyIntensity: 3.0, keyPosition: [-4,3.2,5.5],
    fillColor: 0xc9d9ef, fillIntensity: .55, fillPosition: [3,-1,2]
  };

  P.bindJupiterVisualSource = function(jupiterScene) {
    if (!jupiterScene) return false;
    this._jupiterVisualOwner = jupiterScene;
    if (!this.scene || !jupiterScene.scene || !jupiterScene.planetGroup || this.mode!=="webgl" || jupiterScene.mode!=="webgl") return false;
    if (!this._legacyTravelJupiterGroup) {
      this._legacyTravelJupiterGroup=this.travelJupiterGroup;
      this._legacyTravelJupiter=this.travelJupiter;
      this._legacyTravelJupiterMaterial=this.travelJupiterMaterial;
      this._legacyTravelRing=this.travelRing;
      this._legacyTravelRingMaterial=this.travelRingMaterial;
    }
    return true;
  };

  P._snapshotBaseLighting = function() {
    if (this._baseLighting || !this.scene) return;
    const hemi=this.scene.children.find(o=>o.isHemisphereLight);
    const dirs=this.scene.children.filter(o=>o.isDirectionalLight);
    this._transitionHemi=hemi; this._transitionKey=dirs[0]||null; this._transitionFill=dirs[1]||null;
    const snapLight=l=>l?{color:l.color.clone(),intensity:l.intensity,position:l.position.clone()}:null;
    this._baseLighting={
      exposure:this.renderer?.toneMappingExposure ?? 1.08,
      hemi:hemi?{color:hemi.color.clone(),groundColor:hemi.groundColor.clone(),intensity:hemi.intensity}:null,
      key:snapLight(this._transitionKey), fill:snapLight(this._transitionFill)
    };
  };

  P._mixJupiterLighting = function(amount) {
    if (!this.renderer || !this.THREE) return;
    this._snapshotBaseLighting(); const a=this.clamp(amount); const THREE=this.THREE;
    const mixColor=(target,from,to,t)=>target.copy(from).lerp(new THREE.Color(to),t);
    if (this._transitionHemi && this._baseLighting.hemi) {
      mixColor(this._transitionHemi.color,this._baseLighting.hemi.color,JUPITER_LIGHT.hemiSky,a);
      mixColor(this._transitionHemi.groundColor,this._baseLighting.hemi.groundColor,JUPITER_LIGHT.hemiGround,a);
      this._transitionHemi.intensity=this._baseLighting.hemi.intensity+(JUPITER_LIGHT.hemiIntensity-this._baseLighting.hemi.intensity)*a;
    }
    const applyDir=(light,base,color,intensity,pos)=>{if(!light||!base)return;mixColor(light.color,base.color,color,a);light.intensity=base.intensity+(intensity-base.intensity)*a;light.position.copy(base.position).lerp(new THREE.Vector3(...pos),a);};
    applyDir(this._transitionKey,this._baseLighting.key,JUPITER_LIGHT.keyColor,JUPITER_LIGHT.keyIntensity,JUPITER_LIGHT.keyPosition);
    applyDir(this._transitionFill,this._baseLighting.fill,JUPITER_LIGHT.fillColor,JUPITER_LIGHT.fillIntensity,JUPITER_LIGHT.fillPosition);
    this.renderer.toneMappingExposure=this._baseLighting.exposure+(JUPITER_LIGHT.exposure-this._baseLighting.exposure)*a;
  };

  P._restoreBaseLighting = function() {
    if (!this._baseLighting || !this.renderer) return;
    const b=this._baseLighting;
    if(this._transitionHemi&&b.hemi){this._transitionHemi.color.copy(b.hemi.color);this._transitionHemi.groundColor.copy(b.hemi.groundColor);this._transitionHemi.intensity=b.hemi.intensity;}
    const restore=(l,x)=>{if(l&&x){l.color.copy(x.color);l.intensity=x.intensity;l.position.copy(x.position);}};
    restore(this._transitionKey,b.key);restore(this._transitionFill,b.fill);this.renderer.toneMappingExposure=b.exposure;
  };

  P._borrowJupiterVisual = function({jupiterRotation,jupiterTime}={}) {
    const owner=this._jupiterVisualOwner;
    if(!owner||!this.scene||!owner.planetGroup||this.mode!=="webgl"||owner.mode!=="webgl") return false;
    this.bindJupiterVisualSource(owner);
    if(this._legacyTravelJupiterGroup)this._legacyTravelJupiterGroup.visible=false;
    this.scene.add(owner.planetGroup);
    this.travelJupiterGroup=owner.planetGroup; this.travelJupiter=owner.planet;
    this.travelJupiterMaterial=owner.jupiterMaterial; this.travelRing=owner.ring; this.travelRingMaterial=owner.ring?.material;
    this._borrowedJupiter=true;
    this._jupiterVisualTimeStart=Number.isFinite(jupiterTime)?jupiterTime:(Number.isFinite(owner.time)?owner.time:8.5);
    this._jupiterRotationStart=Number.isFinite(jupiterRotation)?jupiterRotation:(Number.isFinite(owner.renderedRotation)?owner.renderedRotation:2.58);
    if(this.travelJupiter)this.travelJupiter.rotation.y=this._jupiterRotationStart;
    if(owner.moonGroup)owner.moonGroup.visible=false;
    return true;
  };

  P._releaseJupiterVisual = function() {
    if(!this._borrowedJupiter)return;
    const owner=this._jupiterVisualOwner;
    this._jupiterVisualEndRotation=this.travelJupiter?.rotation.y ?? this._jupiterRotationStart;
    this._jupiterVisualEndTime=this._jupiterVisualTimeCurrent ?? this._jupiterVisualTimeStart;
    if(owner?.scene&&owner?.planetGroup){owner.scene.add(owner.planetGroup);owner.time=this._jupiterVisualEndTime;owner.renderedRotation=this._jupiterVisualEndRotation;owner.rotationBase=this._jupiterVisualEndRotation-owner.time*.030;owner.planet.rotation.y=this._jupiterVisualEndRotation;}
    this.travelJupiterGroup=this._legacyTravelJupiterGroup;this.travelJupiter=this._legacyTravelJupiter;this.travelJupiterMaterial=this._legacyTravelJupiterMaterial;this.travelRing=this._legacyTravelRing;this.travelRingMaterial=this._legacyTravelRingMaterial;
    this._borrowedJupiter=false; this._restoreBaseLighting();
  };

  P.getJupiterVisualRotation=function(){return Number.isFinite(this._jupiterVisualEndRotation)?this._jupiterVisualEndRotation:(this._jupiterVisualOwner?.renderedRotation??2.58);};
  P.getJupiterVisualTime=function(){return Number.isFinite(this._jupiterVisualEndTime)?this._jupiterVisualEndTime:(this._jupiterVisualOwner?.time??8.5);};

  const originalBegin=P.beginTravel;
  P.beginTravel=function(mode,options={}){
    if(mode.includes("jupiter"))this._borrowJupiterVisual(options);
    return originalBegin.call(this,mode,options);
  };

  const originalRenderTravel=P.renderTravel;
  P.renderTravel=function(){
    if(!this.travelMode?.includes("jupiter") || !this._borrowedJupiter || !this.renderer) return originalRenderTravel.call(this);
    const state=this.travelState();
    const raw=this.clamp((this.time-this.travelStartedAt)/this.travelDuration),mode=this.travelMode,direction=this.travelDirection>=0?1:-1;
    const aspect=this.camera?.aspect||this.width/this.height,halfHeight=Math.tan((38*Math.PI/180)/2)*8.4;
    const separationMagnitude=halfHeight*aspect*(this.mobile?3.9:3.25),separation=separationMagnitude*direction;
    const cameraX=separation*state.pan,cameraZ=8.4*(1+1.45*state.pullback*(1-state.approach));
    const sourceAlpha=1-this.travelSmooth((state.progress-.70)/.25),destinationAlpha=this.travelSmooth((state.progress-.20)/.28);
    const fieldIsDestination=mode==="from-jupiter",belt=fieldIsDestination?destinationAlpha:sourceAlpha;
    const sourceIsJupiter=mode==="from-jupiter",destinationIsJupiter=mode==="to-jupiter";

    this.fieldGroup.visible=belt>.008; this.materials.forEach(mat=>mat.opacity=belt); this.ceresMaterial.opacity=belt;
    this.fieldGroup.position.set(fieldIsDestination?separation:0,0,0); this.fieldGroup.rotation.y=Math.sin(this.time*.018)*.012;

    const owner=this._jupiterVisualOwner,heroX=this.mobile?0:.82,heroY=this.mobile?.13:.02,heroScale=this.mobile?.98:1.13;
    const projectionRatio=(8.4*Math.tan(19*Math.PI/180))/(6.4*Math.tan(17*Math.PI/180));
    const lane=destinationIsJupiter?separation:0;
    this.travelJupiterGroup.visible=true; this.travelJupiterGroup.position.set(lane+heroX*projectionRatio,heroY*projectionRatio,0); this.travelJupiterGroup.scale.setScalar(heroScale*projectionRatio);
    this.travelJupiterGroup.rotation.x=0;this.travelJupiterGroup.rotation.z=0;
    const elapsed=Math.max(0,this.time-this.travelStartedAt),visualTime=this._jupiterVisualTimeStart+elapsed,rotation=this._jupiterRotationStart+elapsed*.030;
    this._jupiterVisualTimeCurrent=visualTime;this.travelJupiter.rotation.y=rotation;
    if(owner?.cloudLayer)owner.cloudLayer.rotation.y=rotation+visualTime*.0045;
    if(owner?.ring)owner.ring.rotation.z=.015+Math.sin(visualTime*.14)*.008;
    if(owner?.atmosphere)owner.atmosphere.visible=true;

    const jAmount=sourceIsJupiter?sourceAlpha:destinationAlpha; this._mixJupiterLighting(jAmount);
    this.stars.position.x=cameraX*.94;this.stars.rotation.y=this.time*.0009;this.camera.position.set(cameraX,0,cameraZ);
    const lookOffset=Math.sin(state.pan*Math.PI)*separationMagnitude*.055*direction;this.camera.lookAt(cameraX+lookOffset,0,-1.4);this.renderer.render(this.scene,this.camera);

    if(!this.travelCoveredFired&&raw>.12){this.travelCoveredFired=true;this.travelCallbacks.onCovered?.();}
    if(raw>=.999&&!this.travelCompleteFired){
      this.travelCompleteFired=true;const cb=this.travelCallbacks.onComplete;const arrivesBelt=mode==="from-jupiter";
      this._releaseJupiterVisual();
      if(arrivesBelt){this.travelMode=null;this.travelCallbacks={};this.element.classList.remove("is-leaving");this.caption.classList.add("is-visible");this.caption.inert=false;this.materials?.forEach(mat=>mat.opacity=1);if(this.ceresMaterial)this.ceresMaterial.opacity=1;document.getElementById("announcement").textContent="Tiba di Sabuk Asteroid.";}
      cb?.();
    }
  };
})();
