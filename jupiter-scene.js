"use strict";

const JUPITER_TEXTURE = "assets/textures/jupiter-hubble-inspired-4k.jpg";
const JUPITER_MARS_TEXTURE = "assets/textures/mars-surface-2k.jpg";
const JUPITER_RING_SOURCE = "https://science.nasa.gov/jupiter/jupiter-facts/";

const JUPITER_EXPLORATION_STOPS = Object.freeze([
  {
    kicker: "IDENTITAS JUPITER",
    title: "Raksasa Tata Surya",
    subtitle: "Planet terbesar yang menguasai wilayah luar Tata Surya",
    summary: "Jupiter adalah planet terbesar di Tata Surya dan planet kelima dari Matahari. Ukurannya begitu besar sehingga lebih dari seribu Bumi dapat dimuat ke dalam volumenya, meskipun Jupiter sendiri didominasi gas dan fluida bertekanan tinggi.",
    facts: [
      "Jari-jari rata-rata Jupiter sekitar 69.911 km.",
      "Jarak rata-ratanya dari Matahari sekitar 5,2 AU atau 778 juta km.",
      "Jupiter terbentuk sekitar 4,6 miliar tahun lalu bersama Tata Surya."
    ],
    source: "https://science.nasa.gov/jupiter/jupiter-facts/",
    images: [{ src: "./assets/jupiter-global-card.jpg", alt: "Visualisasi global Jupiter dengan pita atmosfer dan Bintik Merah Besar", credit: "Visualisasi ANTARA berdasarkan data NASA/Hubble", source: "https://science.nasa.gov/asset/hubble/jupiter-global-map-2019/", caption: "Jupiter · pita atmosfer global", fit: "contain" }]
  },
  {
    kicker: "ATMOSFER RAKSASA",
    title: "Lautan Awan",
    subtitle: "Pita atmosfer yang bergerak berlawanan arah",
    summary: "Atmosfer Jupiter terutama tersusun dari hidrogen dan helium. Pita terang dan gelap yang terlihat dari jauh merupakan sistem awan dan jet atmosfer yang bergerak sangat cepat pada lintang berbeda.",
    facts: [
      "Jupiter tidak memiliki permukaan padat seperti Bumi atau Mars.",
      "Awan teratas mengandung senyawa seperti amonia, sementara lapisan yang lebih dalam berada pada tekanan dan suhu jauh lebih tinggi.",
      "Jet atmosfer pada lintang yang berdekatan dapat bergerak ke arah berlawanan dan membentuk batas pita yang tajam."
    ],
    source: "https://science.nasa.gov/jupiter/jupiter-facts/",
    images: [{ src: "./assets/jupiter-atmosphere-diagram.svg", alt: "Diagram edukasi pita atmosfer Jupiter", credit: "Visualisasi ANTARA", source: "https://science.nasa.gov/jupiter/jupiter-facts/", caption: "Zona, sabuk, dan badai atmosfer Jupiter", fit: "contain" }]
  },
  {
    kicker: "BADAI RAKSASA",
    title: "Bintik Merah Besar",
    subtitle: "Antisiklon raksasa di belahan selatan Jupiter",
    summary: "Bintik Merah Besar adalah badai berumur panjang yang menjadi salah satu ciri paling mudah dikenali pada Jupiter. Struktur awannya berputar berlawanan arah jarum jam dan ukurannya masih lebih besar daripada Bumi.",
    facts: [
      "Badai ini telah diamati selama berabad-abad, meskipun ukurannya berubah dari waktu ke waktu.",
      "Awan di sekitar Bintik Merah Besar berinteraksi dengan jet atmosfer dan pusaran lain.",
      "Data Juno menunjukkan struktur badai berlanjut ratusan kilometer ke bawah puncak awan."
    ],
    source: "https://science.nasa.gov/missions/juno/nasas-juno-probes-the-depths-of-jupiters-great-red-spot/",
    images: [{ src: "./assets/jupiter-great-red-spot.jpg", alt: "Detail Bintik Merah Besar pada tekstur atmosfer Jupiter", credit: "Visualisasi ANTARA berdasarkan peta global Jupiter", source: "https://science.nasa.gov/asset/hubble/jupiter-global-map-2019/", caption: "Bintik Merah Besar dan aliran awan sekitarnya", fit: "cover" }]
  },
  {
    kicker: "ROTASI CEPAT",
    title: "Hari Kurang dari 10 Jam",
    subtitle: "Rotasi cepat membentuk planet yang pepat di kutub",
    summary: "Jupiter berotasi lebih cepat daripada planet lain. Satu hari Jupiter hanya sekitar 10 jam, dan atmosfernya menunjukkan rotasi diferensial karena bagian-bagian pada lintang berbeda tidak bergerak dengan laju yang sama.",
    facts: [
      "Rotasi cepat membuat diameter ekuator Jupiter lebih besar daripada diameter kutubnya.",
      "Gerak rotasi membantu membentuk pola jet dan badai atmosfer yang sangat kompleks.",
      "Dalam visualisasi ANTARA, rotasi dibuat lebih dinamis daripada planet batuan tetapi tetap nyaman diamati."
    ],
    source: "https://science.nasa.gov/jupiter/jupiter-facts/",
    images: [{ src: "./assets/jupiter-rotation-diagram.svg", alt: "Diagram rotasi cepat Jupiter", credit: "Visualisasi ANTARA", source: "https://science.nasa.gov/jupiter/jupiter-facts/", caption: "Rotasi cepat dan aliran diferensial Jupiter", fit: "contain" }]
  },
  {
    kicker: "MEDAN MAGNET",
    title: "Magnetosfer Raksasa",
    subtitle: "Lingkungan magnetik dan radiasi yang ekstrem",
    summary: "Medan magnet Jupiter menciptakan magnetosfer raksasa yang menangkap partikel bermuatan dan menghasilkan sabuk radiasi intens. Interaksinya dengan angin surya dan bulan-bulan Jupiter membentuk lingkungan plasma yang sangat aktif.",
    facts: [
      "Magnetosfer Jupiter merupakan struktur terbesar di Tata Surya yang terkait langsung dengan sebuah planet.",
      "Partikel bermuatan yang terperangkap dapat berbahaya bagi wahana antariksa.",
      "Aurora Jupiter jauh lebih energik daripada aurora di Bumi."
    ],
    source: "https://science.nasa.gov/jupiter/jupiter-facts/",
    images: [{ src: "./assets/jupiter-magnetosphere-diagram.svg", alt: "Diagram magnetosfer Jupiter", credit: "Visualisasi ANTARA", source: "https://science.nasa.gov/jupiter/jupiter-facts/", caption: "Lingkungan magnetik Jupiter", fit: "contain" }]
  },
  {
    kicker: "BULAN & CINCIN",
    title: "Sistem Jupiter",
    subtitle: "Bulan Galilea dan cincin debu yang sangat redup",
    summary: "Jupiter memiliki sistem bulan yang kaya. Empat bulan terbesarnya, Io, Europa, Ganymede, dan Callisto, dikenal sebagai bulan Galilea. Jupiter juga memiliki cincin tipis dan gelap yang terutama tersusun dari partikel debu kecil.",
    facts: [
      "Ganymede adalah bulan terbesar di Tata Surya dan ukurannya lebih besar daripada Merkurius.",
      "Europa menyimpan bukti kuat mengenai samudra air asin di bawah kerak esnya.",
      "Cincin Jupiter ditemukan Voyager 1 pada 1979 dan jauh lebih redup daripada cincin Saturnus."
    ],
    source: "https://science.nasa.gov/jupiter/jupiter-facts/",
    images: [
      { src: "./assets/jupiter-moons-diagram.svg", alt: "Diagram Io, Europa, Ganymede, dan Callisto", credit: "Visualisasi ANTARA", source: "https://science.nasa.gov/jupiter/moons/", caption: "Empat bulan Galilea", fit: "contain" },
      { src: "./assets/jupiter-rings-diagram.svg", alt: "Diagram cincin tipis dan berdebu milik Jupiter", credit: "Visualisasi ANTARA", source: "https://science.nasa.gov/photojournal/jupiters-main-ring-and-halo/", caption: "Cincin lokal Jupiter · halo, main ring, gossamer", fit: "contain" }
    ]
  },
  {
    kicker: "EKSPLORASI JUPITER",
    title: "Dari Pioneer ke Juno",
    subtitle: "Lima dekade eksplorasi raksasa gas",
    summary: "Pioneer dan Voyager membuka era flyby Jupiter. Galileo menjadi wahana pertama yang mengorbit Jupiter, sedangkan Juno memasuki orbit polar pada 2016 untuk mempelajari atmosfer, gravitasi, medan magnet, dan interior planet dengan detail baru.",
    facts: [
      "Pioneer 10 menjadi wahana pertama yang melintasi sistem Jupiter pada 1973.",
      "Voyager 1 dan 2 memotret atmosfer, cincin, serta bulan-bulannya pada 1979.",
      "Galileo dan Juno memberikan pengamatan jangka panjang dari orbit Jupiter."
    ],
    source: "https://science.nasa.gov/jupiter/exploration/",
    images: [{ src: "./assets/jupiter-missions-diagram.svg", alt: "Garis waktu misi Pioneer, Voyager, Galileo, dan Juno", credit: "Visualisasi ANTARA", source: "https://science.nasa.gov/jupiter/exploration/", caption: "Tonggak eksplorasi Jupiter", fit: "contain" }]
  }
]);

window.JupiterScene = class JupiterScene {
  constructor() {
    this.element = document.getElementById("jupiter-scene");
    this.viewport = document.getElementById("jupiter-viewport");
    this.caption = this.element.querySelector(".jupiter-caption");
    this.title = document.getElementById("jupiter-title");
    this.exploreButton = document.getElementById("jupiter-explore-button");
    this.exploration = document.getElementById("jupiter-exploration");
    this.explorationClose = document.getElementById("jupiter-exploration-close");
    this.topicKicker = document.getElementById("jupiter-topic-kicker");
    this.topicTitle = document.getElementById("jupiter-topic-title");
    this.topicSubtitle = document.getElementById("jupiter-topic-subtitle");
    this.topicSummary = document.getElementById("jupiter-topic-summary");
    this.topicFacts = document.getElementById("jupiter-topic-facts");
    this.topicSource = document.getElementById("jupiter-topic-source");
    this.topicCurrent = document.getElementById("jupiter-topic-current");
    this.topicTotal = document.getElementById("jupiter-topic-total");
    this.topicPrev = document.getElementById("jupiter-topic-prev");
    this.topicNext = document.getElementById("jupiter-topic-next");
    this.topicProgress = document.getElementById("jupiter-topic-progress");
    this.contextMedia = document.getElementById("jupiter-context-media");
    this.credit = this.element.querySelector(".jupiter-credit");
    this.beltLabel = document.getElementById("jupiter-belt-label");
    this.ceresLabel = document.getElementById("jupiter-ceres-label");
    this.motion = matchMedia("(prefers-reduced-motion: reduce)");
    this.loading = null;
    this.mode = "pending";
    this.active = false;
    this.exploring = false;
    this.topicIndex = 0;
    this.explorationBlend = 0;
    this.explorationBlendTarget = 0;
    this.frame = null;
    this.previous = 0;
    this.time = 0;
    this.width = 1;
    this.height = 1;
    this.mobile = false;
    this.travelMode = null;
    this.travelCallbacks = {};
    this.travelStartedAt = 0;
    this.travelDuration = 8.1;
    this.travelCoveredFired = false;
    this.travelCompleteFired = false;
    this.renderedRotation = 2.58;
    this.pointer = { x: 0, y: 0 };
    this.cameraOffset = { x: 0, y: 0 };
    this.seed = 0x4a555049;
    this.caption.inert = true;
    this.exploration.inert = true;
    this.topicTotal.textContent = String(JUPITER_EXPLORATION_STOPS.length).padStart(2, "0");
    this.topicProgress.replaceChildren(...JUPITER_EXPLORATION_STOPS.map(() => document.createElement("span")));
    this.setExplorationStop(0, { immediate: true, announce: false });
    this.exploreButton.addEventListener("click", () => this.enterExploration());
    this.explorationClose.addEventListener("click", () => this.exitExploration());
    this.topicPrev.addEventListener("click", () => this.setExplorationStop(this.topicIndex - 1));
    this.topicNext.addEventListener("click", () => this.setExplorationStop(this.topicIndex + 1));
    this.element.addEventListener("pointermove", event => {
      if (event.pointerType !== "mouse" || this.motion.matches || this.travelMode) return;
      const rect = this.element.getBoundingClientRect();
      this.pointer.x = (event.clientX - rect.left) / rect.width - 0.5;
      this.pointer.y = (event.clientY - rect.top) / rect.height - 0.5;
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
  rand() { this.seed = (1664525 * this.seed + 1013904223) >>> 0; return this.seed / 4294967296; }

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
    this.loading = Promise.allSettled([
      import("./assets/vendor/three/three.module.min.js"),
      this.loadImage(JUPITER_TEXTURE),
      this.loadImage(JUPITER_MARS_TEXTURE)
    ]).then(async ([moduleResult, imageResult, marsResult]) => {
      this.surface = imageResult.status === "fulfilled" ? imageResult.value : this.makeFallbackSurface();
      this.marsSurface = marsResult.status === "fulfilled" ? marsResult.value : null;
      if (moduleResult.status === "fulfilled") {
        try { this.createThreeScene(moduleResult.value); }
        catch (error) { console.warn("Jupiter WebGL unavailable; using Canvas fallback.", error); this.createCanvasFallback(); }
      } else this.createCanvasFallback();
      this.resize();
      if (this.renderer?.compileAsync) await this.renderer.compileAsync(this.scene, this.camera);
      this.element.dataset.ready = "true";
      if (this.active) this.render();
    }).catch(error => {
      console.error("Jupiter preparation failed", error);
      this.createCanvasFallback();
      this.resize();
      this.element.dataset.ready = "fallback";
    });
    return this.loading;
  }

  makeFallbackSurface() {
    const c=document.createElement("canvas"); c.width=2048; c.height=1024; const x=c.getContext("2d");
    const bands=["#e9dec7","#c98f68","#f2e8cf","#9b5c47","#d8b58d","#f1e6ce","#a86a4b","#ead8b8","#c28c63"];
    bands.forEach((color,i)=>{x.fillStyle=color;x.fillRect(0,i*c.height/bands.length,c.width,c.height/bands.length+2);});
    x.fillStyle="#b5543a";x.beginPath();x.ellipse(c.width*.2,c.height*.63,130,66,-.1,0,Math.PI*2);x.fill();
    return c;
  }

  createThreeScene(THREE) {
    this.THREE=THREE;
    const canvas=document.createElement("canvas");
    const context=canvas.getContext("webgl2",{alpha:true,antialias:true,powerPreference:"high-performance"});
    if(!context) throw new Error("WebGL2 unavailable");
    this.renderer=new THREE.WebGLRenderer({canvas,context,alpha:true,antialias:true});
    this.renderer.setClearColor(0x030812,0);
    this.renderer.outputColorSpace=THREE.SRGBColorSpace;
    this.renderer.toneMapping=THREE.ACESFilmicToneMapping;
    this.renderer.toneMappingExposure=1.12;
    this.viewport.replaceChildren(canvas);
    this.scene=new THREE.Scene();
    this.camera=new THREE.PerspectiveCamera(34,1,.1,300);
    this.camera.position.set(0,0,6.4);

    const texture=new THREE.Texture(this.surface);
    texture.colorSpace=THREE.SRGBColorSpace;
    texture.wrapS=THREE.RepeatWrapping; texture.wrapT=THREE.ClampToEdgeWrapping;
    texture.minFilter=THREE.LinearMipmapLinearFilter; texture.magFilter=THREE.LinearFilter; texture.generateMipmaps=true;
    texture.anisotropy=Math.min(12,this.renderer.capabilities.getMaxAnisotropy()); texture.needsUpdate=true;
    this.jupiterTexture=texture;
    const bump=texture.clone(); bump.colorSpace=THREE.NoColorSpace; bump.needsUpdate=true;
    this.jupiterMaterial=new THREE.MeshStandardMaterial({map:texture,bumpMap:bump,bumpScale:.012,roughness:.88,metalness:0,color:0xffffff});
    this.planet=new THREE.Mesh(new THREE.SphereGeometry(1,144,96),this.jupiterMaterial);
    this.planet.rotation.set(.055,2.58,.035);
    this.planetGroup=new THREE.Group(); this.planetGroup.add(this.planet); this.scene.add(this.planetGroup);

    const atmosphereMat=new THREE.ShaderMaterial({
      transparent:true,side:THREE.BackSide,depthWrite:false,blending:THREE.AdditiveBlending,
      vertexShader:`varying vec3 vN;varying vec3 vW;void main(){vN=normalize(mat3(modelMatrix)*normal);vec4 w=modelMatrix*vec4(position,1.);vW=w.xyz;gl_Position=projectionMatrix*viewMatrix*w;}`,
      fragmentShader:`precision highp float;varying vec3 vN;varying vec3 vW;void main(){vec3 V=normalize(cameraPosition-vW);float rim=pow(1.-max(dot(normalize(vN),V),0.),3.2);gl_FragColor=vec4(vec3(1.0,.72,.43)*rim*.34,rim*.28);}`
    });
    this.atmosphere=new THREE.Mesh(new THREE.SphereGeometry(1.035,96,64),atmosphereMat); this.planetGroup.add(this.atmosphere);

    const ringTexture=this.makeRingTexture(THREE);
    const ringMat=new THREE.MeshBasicMaterial({map:ringTexture,color:0xb4a58c,transparent:true,opacity:.44,depthTest:true,depthWrite:false,side:THREE.DoubleSide,blending:THREE.NormalBlending});
    this.ring=new THREE.Mesh(new THREE.RingGeometry(1.30,1.88,256,3),ringMat);
    this.ring.rotation.x=Math.PI/2-.14; this.ring.rotation.z=.028; this.planetGroup.add(this.ring);

    const ambient=new THREE.HemisphereLight(0xd8e4f3,0x1a0e0b,1.25); this.scene.add(ambient);
    const key=new THREE.DirectionalLight(0xffedcf,3.0); key.position.set(-4,3.2,5.5); this.scene.add(key);
    const fill=new THREE.DirectionalLight(0xc9d9ef,.55); fill.position.set(3,-1,2); this.scene.add(fill);

    // Mars/Jupiter travel through the asteroid belt is now owned by the dedicated
    // AsteroidBeltScene. Keep Jupiter focused on its own planet and faint rings.
    this.createMarsTravelObject(THREE);
    this.asteroidGroup = null;
    this.asteroidMeshes = [];
    this.asteroidMotion = [];
    this.createStars(THREE);
    canvas.addEventListener("webglcontextlost",e=>{e.preventDefault();this.createCanvasFallback();this.resize();if(this.active)this.render();},{once:true});
    this.mode="webgl"; this.element.dataset.renderer=this.mode;
  }

  makeRingTexture(THREE) {
    const c=document.createElement("canvas");c.width=c.height=1024;const ctx=c.getContext("2d");const im=ctx.createImageData(1024,1024);const d=im.data;
    for(let y=0;y<1024;y++)for(let x=0;x<1024;x++){
      const nx=(x-512)/512,ny=(y-512)/512,r=Math.sqrt(nx*nx+ny*ny);let a=0;
      if(r>.50&&r<.99){const main=Math.exp(-Math.pow((r-.68)/.055,2));const halo=.20*Math.exp(-Math.pow((r-.55)/.10,2));const goss=.13*Math.exp(-Math.pow((r-.84)/.12,2));const grain=.78+.22*Math.sin(x*.41+y*.17+Math.sin(y*.033)*4);a=(main*.34+halo*.20+goss*.18)*grain;}
      const i=(y*1024+x)*4;d[i]=190;d[i+1]=178;d[i+2]=155;d[i+3]=Math.round(255*this.clamp(a));
    }
    ctx.putImageData(im,0,0);const t=new THREE.CanvasTexture(c);t.colorSpace=THREE.SRGBColorSpace;t.needsUpdate=true;return t;
  }

  createMarsTravelObject(THREE) {
    const tex=this.marsSurface?new THREE.Texture(this.marsSurface):null;
    if(tex){tex.colorSpace=THREE.SRGBColorSpace;tex.anisotropy=Math.min(6,this.renderer.capabilities.getMaxAnisotropy());tex.needsUpdate=true;}
    const mat=new THREE.MeshStandardMaterial({map:tex,color:tex?0xffffff:0xa45e40,roughness:.95,metalness:0,transparent:true,opacity:1});
    this.travelMarsMaterial=mat; this.travelMars=new THREE.Mesh(new THREE.SphereGeometry(1,96,64),mat); this.travelMars.rotation.set(.1,.72,.08);
    this.travelMarsGroup=new THREE.Group();this.travelMarsGroup.add(this.travelMars);this.travelMarsGroup.visible=false;this.scene.add(this.travelMarsGroup);
  }

  createAsteroidBelt(THREE) {
    this.asteroidGroup=new THREE.Group(); this.scene.add(this.asteroidGroup);
    this.asteroidMeshes=[]; this.asteroidMotion=[];
    const defs=[
      [new THREE.IcosahedronGeometry(1,1),0x625b52,58],
      [new THREE.DodecahedronGeometry(1,0),0x4e4d4b,46],
      [new THREE.OctahedronGeometry(1,1),0x756554,34]
    ];
    defs.forEach(([geometry,color,count],kind)=>{
      const pos=geometry.attributes.position;
      for(let i=0;i<pos.count;i++){
        const k=.78+.30*this.rand();
        pos.setXYZ(i,pos.getX(i)*k,pos.getY(i)*(0.72+.38*this.rand()),pos.getZ(i)*(0.78+.30*this.rand()));
      }
      pos.needsUpdate=true; geometry.computeVertexNormals();
      const material=new THREE.MeshStandardMaterial({color,roughness:1,metalness:0,transparent:true,opacity:0});
      const mesh=new THREE.InstancedMesh(geometry,material,count);
      mesh.instanceMatrix.setUsage(THREE.DynamicDrawUsage);
      const dummy=new THREE.Object3D();
      const motion=[];
      for(let i=0;i<count;i++){
        const z=-25+this.rand()*20;
        let x=(this.rand()-.5)*13;
        let y=(this.rand()-.5)*6.6;
        const near=z>-10;
        if(near&&Math.abs(x)<1.7&&Math.abs(y)<1.2)x+=x<0?-2.1:2.1;
        const base=kind===2?.11+this.rand()*.18:.055+this.rand()*(near?.22:.14);
        const sx=base*(.75+this.rand()*.5),sy=base*(.55+this.rand()*.7),sz=base*(.65+this.rand()*.6);
        const rx=this.rand()*6.28,ry=this.rand()*6.28,rz=this.rand()*6.28;
        const spinScale=.035+this.rand()*.055;
        const vx=(this.rand()-.5)*spinScale,vy=(this.rand()-.5)*spinScale,vz=(this.rand()-.5)*spinScale;
        dummy.position.set(x,y,z);dummy.scale.set(sx,sy,sz);dummy.rotation.set(rx,ry,rz);dummy.updateMatrix();mesh.setMatrixAt(i,dummy.matrix);
        motion.push({x,y,z,sx,sy,sz,rx,ry,rz,vx,vy,vz});
      }
      mesh.visible=false; this.asteroidGroup.add(mesh); this.asteroidMeshes.push(mesh);
      this.asteroidMotion.push({mesh,motion,dummy});
    });
    this.ceres=new THREE.Mesh(
      new THREE.IcosahedronGeometry(.33,2),
      new THREE.MeshStandardMaterial({color:0x77736c,roughness:1,metalness:0,transparent:true,opacity:0})
    );
    this.ceres.position.set(-3.1,1.4,-11.5);
    this.asteroidGroup.add(this.ceres);
    this.asteroidGroup.visible=false;
  }

  updateAsteroidMotion(beltOpacity) {
    if(!this.asteroidMotion)return;
    this.asteroidMotion.forEach((group,kind)=>{
      group.mesh.material.opacity=beltOpacity*(kind===2?.78:.58);
      group.motion.forEach((a,index)=>{
        group.dummy.position.set(a.x,a.y,a.z);
        group.dummy.scale.set(a.sx,a.sy,a.sz);
        group.dummy.rotation.set(a.rx+this.time*a.vx,a.ry+this.time*a.vy,a.rz+this.time*a.vz);
        group.dummy.updateMatrix();
        group.mesh.setMatrixAt(index,group.dummy.matrix);
      });
      group.mesh.instanceMatrix.needsUpdate=true;
    });
    if(this.ceres){
      this.ceres.material.opacity=this.clamp(beltOpacity);
      this.ceres.rotation.x=this.time*.035;
      this.ceres.rotation.y=this.time*.052;
    }
  }

  createStars(THREE) {
    const count=this.mobile?800:1400, positions=new Float32Array(count*3); for(let i=0;i<count;i++){positions[i*3]=(this.rand()-.5)*90;positions[i*3+1]=(this.rand()-.5)*55;positions[i*3+2]=-8-this.rand()*70;}
    const g=new THREE.BufferGeometry();g.setAttribute("position",new THREE.BufferAttribute(positions,3));this.starfield=new THREE.Points(g,new THREE.PointsMaterial({color:0xb9c9df,size:.11,transparent:true,opacity:.55,depthWrite:false,sizeAttenuation:true}));this.scene.add(this.starfield);
  }

  createCanvasFallback() {
    this.renderer?.dispose?.(); this.renderer=null; const c=document.createElement("canvas");this.canvas=c;this.ctx=c.getContext("2d");this.viewport.replaceChildren(c);this.mode="canvas";this.element.dataset.renderer=this.mode;
  }

  resize() {
    const parent=this.element.parentElement; this.width=Math.max(1,parent.clientWidth);this.height=Math.max(1,parent.clientHeight);this.mobile=this.width<=700;
    if(this.mode==="webgl") {this.renderer.setPixelRatio(Math.min(devicePixelRatio||1,this.mobile?1.55:2));this.renderer.setSize(this.width,this.height);this.camera.aspect=this.width/this.height;this.camera.updateProjectionMatrix();}
    else if(this.mode==="canvas"&&this.canvas){const dpr=Math.min(devicePixelRatio||1,1.5);this.canvas.width=this.width*dpr;this.canvas.height=this.height*dpr;this.canvas.style.width=this.width+"px";this.canvas.style.height=this.height+"px";this.ctx.setTransform(dpr,0,0,dpr,0,0);}
  }

  start({settled=false}={}) {
    this.active=true;this.travelMode=null;this.travelCallbacks={};this.time=settled?8.5:0;this.exploring=false;this.explorationBlend=this.explorationBlendTarget=0;this.element.hidden=false;this.element.style.opacity="1";this.element.classList.remove("is-exploring","is-leaving");this.caption.classList.remove("is-visible");this.caption.inert=true;this.exploration.inert=true;this.setExplorationStop(0,{immediate:true,announce:false});this.pointer.x=this.pointer.y=this.cameraOffset.x=this.cameraOffset.y=0;
    this.prepare();this.resize();cancelAnimationFrame(this.frame);this.previous=performance.now();this.tick(this.previous);
  }

  stop() {
    this.active=false;this.travelMode=null;this.travelCallbacks={};cancelAnimationFrame(this.frame);this.frame=null;this.element.hidden=true;this.element.style.opacity="0";this.element.classList.remove("is-exploring","is-leaving");this.exploring=false;this.caption.inert=true;this.exploration.inert=true;this.contextMedia.replaceChildren();this.contextMedia.hidden=true;this.beltLabel.style.opacity="0";this.ceresLabel.style.opacity="0";
  }

  setExplorationStop(index,{immediate=false,announce=true}={}) {
    const next=Math.max(0,Math.min(JUPITER_EXPLORATION_STOPS.length-1,index));const stop=JUPITER_EXPLORATION_STOPS[next];this.topicIndex=next;
    this.topicKicker.textContent=stop.kicker;this.topicTitle.textContent=stop.title;this.topicSubtitle.textContent=stop.subtitle;this.topicSummary.textContent=stop.summary;this.topicFacts.replaceChildren(...stop.facts.map(f=>{const li=document.createElement("li");li.textContent=f;return li;}));
    this.topicSource.href=stop.source;this.topicCurrent.textContent=String(next+1).padStart(2,"0");this.topicPrev.disabled=next===0;this.topicNext.disabled=next===JUPITER_EXPLORATION_STOPS.length-1;Array.from(this.topicProgress.children).forEach((bar,i)=>bar.classList.toggle("is-active",i===next));
    window.ExplorationMedia?.render?.("jupiter",stop,this.contextMedia);
    if(this.active)this.render(); if(announce&&this.exploring)document.getElementById("announcement").textContent=`Eksplorasi Jupiter ${next+1} dari ${JUPITER_EXPLORATION_STOPS.length}: ${stop.title}.`;
  }

  enterExploration() {
    if(!this.active||this.exploring||this.travelMode)return;this.exploring=true;this.explorationBlendTarget=1;this.element.classList.add("is-exploring");this.caption.inert=true;this.exploration.inert=false;if(this.motion.matches)this.explorationBlend=1;if(!this.frame){this.previous=performance.now();this.tick(this.previous);}document.getElementById("announcement").textContent=`Mode eksplorasi Jupiter dimulai. ${JUPITER_EXPLORATION_STOPS[this.topicIndex].title}.`;requestAnimationFrame(()=>this.topicTitle.focus({preventScroll:true}));
  }

  exitExploration() {
    if(!this.exploring)return;this.exploring=false;this.explorationBlendTarget=0;this.element.classList.remove("is-exploring");this.exploration.inert=true;this.caption.inert=false;if(this.motion.matches)this.explorationBlend=0;if(!this.frame){this.previous=performance.now();this.tick(this.previous);}document.getElementById("announcement").textContent="Kembali ke panorama Jupiter.";requestAnimationFrame(()=>this.exploreButton.focus({preventScroll:true}));
  }

  beginTravelFromMars({onCovered,onComplete,marsRotation=.7}={}) {
    if(this.active&&this.travelMode)return;this.active=true;this.exploring=false;this.travelMode="from-mars";this.travelCallbacks={onCovered,onComplete};this.travelStartedAt=0;this.time=0;this.travelDuration=this.motion.matches?.55:8.2;this.travelCoveredFired=false;this.travelCompleteFired=false;this.element.hidden=false;this.element.style.opacity="1";this.element.classList.add("is-leaving");this.caption.classList.remove("is-visible");this.caption.inert=true;this.exploration.inert=true;this.prepare();this.resize();if(this.travelMars)this.travelMars.rotation.y=marsRotation;cancelAnimationFrame(this.frame);this.previous=performance.now();this.tick(this.previous);
  }

  beginTravelToMars({onCovered,onComplete}={}) {
    if(!this.active||this.travelMode||this.exploring)return;this.travelMode="to-mars";this.travelCallbacks={onCovered,onComplete};this.travelStartedAt=this.time;this.travelDuration=this.motion.matches?.55:8.2;this.travelCoveredFired=false;this.travelCompleteFired=false;this.element.classList.add("is-leaving");this.caption.inert=true;this.pointer.x=this.pointer.y=0;if(!this.frame){this.previous=performance.now();this.tick(this.previous);}
  }

  tick(now) {
    this.frame=null;if(!this.active||document.hidden)return;const delta=Math.min((now-this.previous)/1000,.12);this.previous=now;this.time+=delta;const damp=1-Math.exp(-delta*2.1);this.cameraOffset.x+=(this.pointer.x-this.cameraOffset.x)*damp;this.cameraOffset.y+=(this.pointer.y-this.cameraOffset.y)*damp;const ed=this.motion.matches?1:1-Math.exp(-delta*3);this.explorationBlend+=(this.explorationBlendTarget-this.explorationBlend)*ed;this.render();
    if(this.active&&(!this.motion.matches||this.travelMode||Math.abs(this.explorationBlend-this.explorationBlendTarget)>.002||this.time<14))this.frame=requestAnimationFrame(t=>this.tick(t));
  }

  render() { if(this.travelMode)this.renderTravel(); else this.renderJupiter(); }

  renderJupiter() {
    const blend=this.explorationBlend;const x=this.mobile?0:(.82+blend*.15);const y=this.mobile?(.13-blend*.23):(.02+blend*.01);const scale=this.mobile?.98:1.13;this.renderedRotation=2.58+this.time*.030;
    if(this.mode==="webgl"){
      this.travelMarsGroup.visible=false;if(this.asteroidGroup)this.asteroidGroup.visible=false;this.planetGroup.visible=true;this.planetGroup.position.set(x,y,0);this.planetGroup.scale.setScalar(scale);this.planet.rotation.y=this.renderedRotation;this.ring.rotation.z=.015+Math.sin(this.time*.14)*.008;this.camera.position.set(this.motion.matches?0:this.cameraOffset.x*.13,this.motion.matches?0:-this.cameraOffset.y*.09,6.4);this.camera.lookAt(0,0,0);this.renderer.render(this.scene,this.camera);
    }else this.drawCanvasJupiter(x,y,scale);
    if(this.time>1.1&&!this.travelMode){this.caption.classList.add("is-visible");this.caption.inert=this.exploring;this.credit.style.opacity=this.exploring?"0":".9";}
  }

  renderTravel() {
    const reverse=this.travelMode==="to-mars";const elapsed=reverse?this.time-this.travelStartedAt:this.time;const raw=this.clamp(elapsed/this.travelDuration);const p=this.ease(raw);
    const marsP=reverse?this.smooth(.56,.98,p):1-this.smooth(.02,.29,p);
    const jupiterP=reverse?1-this.smooth(.02,.35,p):this.smooth(.58,.97,p);
    const beltIn=this.smooth(.16,.27,p),beltOut=1-this.smooth(.70,.84,p),beltP=beltIn*beltOut;
    const ceresP=this.smooth(.38,.44,p)*(1-this.smooth(.53,.59,p));
    this.beltLabel.style.opacity=String(this.clamp(beltP*1.35));this.ceresLabel.style.opacity=String(this.clamp(ceresP*1.5));
    if(this.mode==="webgl"){
      this.planetGroup.visible=jupiterP>.005;this.travelMarsGroup.visible=marsP>.005;if(this.asteroidGroup)this.asteroidGroup.visible=beltP>.01;
      const jFinalX=this.mobile?0:.82;
      if(!reverse){
        this.travelMarsGroup.position.set(-p*4.8,0,-p*5.2);this.travelMarsGroup.scale.setScalar(.92*(1-p*.73));this.travelMarsMaterial.opacity=marsP;
        this.planetGroup.position.set(5.5-(5.5-jFinalX)*jupiterP,.03,-5.5*(1-jupiterP));this.planetGroup.scale.setScalar(.14+1.0*jupiterP);
        if(this.asteroidGroup)this.asteroidGroup.position.z=(p-.18)*25;
      }else{
        this.planetGroup.position.set(jFinalX-(jFinalX+4.9)*p,.03,-p*5.6);this.planetGroup.scale.setScalar(1.14-p*.86);this.travelMarsGroup.position.set(5.0-(5.0)*marsP,0,-5.4*(1-marsP));this.travelMarsGroup.scale.setScalar(.18+.74*marsP);this.travelMarsMaterial.opacity=marsP;if(this.asteroidGroup)this.asteroidGroup.position.z=(.82-p)*25;
      }
      this.planet.rotation.y=2.58+this.time*.030;this.travelMars.rotation.y+=.0018;this.updateAsteroidMotion(beltP);
      this.camera.position.set(0,0,6.4);this.camera.lookAt(0,0,0);this.renderer.render(this.scene,this.camera);
    }else this.drawCanvasTravel(p,reverse,marsP,jupiterP,beltP);
    if(!this.travelCoveredFired&&raw>=.10){this.travelCoveredFired=true;this.travelCallbacks.onCovered?.();}
    if(raw>=.999&&!this.travelCompleteFired){this.travelCompleteFired=true;const cb=this.travelCallbacks.onComplete; if(!reverse){this.travelMode=null;this.travelCallbacks={};this.element.classList.remove("is-leaving");this.caption.classList.add("is-visible");this.caption.inert=false;this.credit.style.opacity=".9";this.asteroidGroup&&(this.asteroidGroup.visible=false);document.getElementById("announcement").textContent="Tiba di Jupiter.";} cb?.();}
  }

  drawCanvasJupiter(x,y,scale) {
    const ctx=this.ctx,w=this.width,h=this.height;if(!ctx)return;ctx.clearRect(0,0,w,h);this.drawCanvasStars(ctx,w,h);const r=Math.min(w,h)*(this.mobile?.29:.34)*scale,cx=w*.5+x*Math.min(w,h)*.21,cy=h*.49+y*Math.min(w,h)*.25;this.drawCanvasRing(ctx,cx,cy,r,false);ctx.save();ctx.beginPath();ctx.arc(cx,cy,r,0,Math.PI*2);ctx.clip();ctx.drawImage(this.surface,cx-r,cy-r,r*2,r*2);const g=ctx.createRadialGradient(cx-r*.28,cy-r*.3,r*.05,cx,cy,r);g.addColorStop(0,"#ffffff18");g.addColorStop(.7,"#00000008");g.addColorStop(1,"#00000088");ctx.fillStyle=g;ctx.fillRect(cx-r,cy-r,r*2,r*2);ctx.restore();this.drawCanvasRing(ctx,cx,cy,r,true);
  }
  drawCanvasRing(ctx,x,y,r,front=false){ctx.save();ctx.translate(x,y);ctx.scale(1,.20);ctx.strokeStyle=front?"rgba(198,185,161,.15)":"rgba(174,164,146,.08)";ctx.lineWidth=Math.max(1,r*.038);ctx.beginPath();ctx.arc(0,0,r*1.58,front?0:Math.PI,front?Math.PI:Math.PI*2);ctx.stroke();ctx.restore();}
  drawCanvasStars(ctx,w,h){ctx.fillStyle="#030812";ctx.fillRect(0,0,w,h);ctx.fillStyle="#c6d4e7";for(let i=0;i<120;i++){const x=(i*83%997)/997*w,y=(i*47%613)/613*h;ctx.globalAlpha=.18+(i%5)*.09;ctx.fillRect(x,y,1,1);}ctx.globalAlpha=1;}
  drawCanvasTravel(p,reverse,marsP,jupiterP,beltP){const ctx=this.ctx,w=this.width,h=this.height;this.drawCanvasStars(ctx,w,h);if(beltP>.02){ctx.globalAlpha=beltP*.7;ctx.fillStyle="#75695b";for(let i=0;i<40;i++){let x=((i*137+p*1200)%1300)/1300*w,y=((i*79)%700)/700*h;const s=1+(i%4);ctx.beginPath();ctx.arc(x,y,s,0,Math.PI*2);ctx.fill();}ctx.globalAlpha=1;}if(jupiterP>.01){const r=Math.min(w,h)*(.07+.27*jupiterP),x=w*(reverse?.54:.88-(.34*jupiterP));this.drawCanvasRing(ctx,x,h*.48,r,false);ctx.save();ctx.beginPath();ctx.arc(x,h*.48,r,0,Math.PI*2);ctx.clip();ctx.globalAlpha=jupiterP;ctx.drawImage(this.surface,x-r,h*.48-r,r*2,r*2);ctx.restore();ctx.globalAlpha=1;this.drawCanvasRing(ctx,x,h*.48,r,true);}if(marsP>.01){const r=Math.min(w,h)*(.07+.21*marsP),x=w*(reverse?.82-(.32*marsP):.5-.32*p);ctx.save();ctx.beginPath();ctx.arc(x,h*.5,r,0,Math.PI*2);ctx.clip();ctx.globalAlpha=marsP;if(this.marsSurface)ctx.drawImage(this.marsSurface,x-r,h*.5-r,r*2,r*2);else{ctx.fillStyle="#a65d42";ctx.fill();}ctx.restore();ctx.globalAlpha=1;}}
};

/* ===== ANTARA QUALITY CONSISTENCY PASS: feature-aware Jupiter exploration ===== */
(() => {
  const P = window.JupiterScene?.prototype;
  if (!P || P.__featureAwareV2) return;
  P.__featureAwareV2 = true;
  const wrap = a => Math.atan2(Math.sin(a), Math.cos(a));
  const near = (a, ref) => ref + wrap(a - ref);
  const DEG = Math.PI / 180;
  const VIEWS = [
    { yaw: 2.58, pitch: 0.00, cameraZ: 6.40, label: "JUPITER", context: "PANORAMA ATMOSFER", marker: null, semantic: "" },
    { yaw: 1.18, pitch: 0.015, cameraZ: 6.16, label: "PITA AWAN JUPITER", context: "ZONA & SABUK EKUATORIAL", marker: null, semantic: "bands" },
    { yaw: 0.56, pitch: -0.10, cameraZ: 5.82, label: "GREAT RED SPOT", context: "SEKITAR 22° LS · BADAI ATMOSFER", marker: "grs", semantic: "" },
    { yaw: 2.18, pitch: 0.02, cameraZ: 6.28, label: "ROTASI CEPAT", context: "HARI JUPITER ~10 JAM", marker: null, semantic: "rotation" },
    { yaw: 2.86, pitch: -0.20, cameraZ: 6.48, label: "MAGNETOSFER JUPITER", context: "MEDAN MAGNET & AURORA", marker: null, semantic: "magnetosphere" },
    { yaw: 1.62, pitch: 0.055, cameraZ: 6.68, label: "SISTEM JUPITER", context: "BULAN GALILEA & CINCIN DEBU", marker: null, semantic: "moons" },
    { yaw: 2.42, pitch: 0.01, cameraZ: 6.36, label: "EKSPLORASI JUPITER", context: "PIONEER · VOYAGER · GALILEO · JUNO", marker: null, semantic: "" }
  ];

  P._ensureFeatureState = function() {
    if (this._featureStateReady) return;
    this._featureStateReady = true;
    this.focusState = "IDLE_ROTATION";
    this.focusYaw = this.renderedRotation || 2.58;
    this.focusYawTarget = this.focusYaw;
    this.focusPitch = 0; this.focusPitchTarget = 0;
    this.focusCameraZ = 6.4; this.focusCameraZTarget = 6.4;
    this.focusSettledAt = 0;
    this.focusReticle = document.getElementById("jupiter-focus-reticle");
    this.focusLabel = document.getElementById("jupiter-focus-label");
    this.focusContext = document.getElementById("jupiter-focus-context");
    this.semanticOverlay = document.getElementById("jupiter-semantic-overlay");
    this.semanticLabel = document.getElementById("jupiter-semantic-label");
  };

  const originalCreate = P.createThreeScene;
  P.createThreeScene = function(THREE) {
    originalCreate.call(this, THREE);
    this._ensureFeatureState();
    // A second, very faint cloud shell reuses the existing scientific texture instead
    // of replacing it with procedural noise. Its slightly different drift adds depth.
    this.cloudLayer = new THREE.Mesh(
      new THREE.SphereGeometry(1.008, 144, 96),
      new THREE.MeshStandardMaterial({ map: this.jupiterTexture, transparent: true, opacity: .115, depthWrite: false, roughness: .92, metalness: 0, color: 0xfff4e5 })
    );
    this.planetGroup.add(this.cloudLayer);

    const lat = -22 * DEG, lon = -122 * DEG, c = Math.cos(lat);
    this.grsAnchor = new THREE.Object3D();
    this.grsAnchor.position.set(c * Math.cos(lon), Math.sin(lat), -c * Math.sin(lon));
    this.planet.add(this.grsAnchor);
    this._markerWorld = new THREE.Vector3(); this._planetWorld = new THREE.Vector3(); this._projected = new THREE.Vector3();
    this._surfaceNormal = new THREE.Vector3(); this._toCamera = new THREE.Vector3();

    this.moonGroup = new THREE.Group();
    const moonDefs = [
      [-1.75,.18,.16,.085,0xd7b878],[-1.35,-.24,.08,.072,0xc7d5df],[1.48,.15,-.02,.095,0xb7a889],[1.88,-.19,.12,.082,0x8f8072]
    ];
    moonDefs.forEach(([x,y,z,r,col]) => { const m = new THREE.Mesh(new THREE.SphereGeometry(r,24,16), new THREE.MeshStandardMaterial({color:col,roughness:.92,metalness:0})); m.position.set(x,y,z); this.moonGroup.add(m); });
    this.moonGroup.visible = false; this.planetGroup.add(this.moonGroup);
  };

  const originalStart = P.start;
  P.start = function(opts={}) { this._ensureFeatureState(); originalStart.call(this, opts); this.focusYaw=this.renderedRotation||2.58; this.focusYawTarget=this.focusYaw; this.focusPitch=this.focusPitchTarget=0; this.focusCameraZ=this.focusCameraZTarget=6.4; };

  P._applyTopicView = function(index, immediate=false) {
    this._ensureFeatureState();
    const view = VIEWS[index] || VIEWS[0];
    this.focusYawTarget = near(view.yaw, this.focusYaw);
    this.focusPitchTarget = view.pitch;
    this.focusCameraZTarget = view.cameraZ;
    this.focusState = immediate ? "FOCUSED_IDLE" : "FOCUS_TRANSITION";
    if (immediate || this.motion.matches) { this.focusYaw=this.focusYawTarget; this.focusPitch=this.focusPitchTarget; this.focusCameraZ=this.focusCameraZTarget; this.focusState="FOCUSED_IDLE"; }
    if (this.focusLabel) this.focusLabel.textContent = view.marker ? view.label : "";
    if (this.focusContext) this.focusContext.textContent = view.marker ? view.context : "";
    this._activeMarker = view.marker;
    if (this.semanticOverlay) {
      this.semanticOverlay.className = "jupiter-semantic-overlay" + (view.semantic ? ` is-visible is-${view.semantic}` : "");
      if (this.semanticLabel) this.semanticLabel.textContent = view.semantic === "magnetosphere" ? "MEDAN MAGNET · AURORA POLAR" : view.semantic === "bands" ? "ZONA EKUATORIAL · SABUK UTARA & SELATAN" : view.semantic === "moons" ? "IO · EUROPA · GANYMEDE · CALLISTO" : "";
    }
    if (this.moonGroup) this.moonGroup.visible = view.semantic === "moons";
  };

  P.setExplorationStop = function(index,{immediate=false,announce=true}={}) {
    this._ensureFeatureState();
    const previous = this.topicIndex ?? 0;
    const next=Math.max(0,Math.min(JUPITER_EXPLORATION_STOPS.length-1,index)); const stop=JUPITER_EXPLORATION_STOPS[next]; this.topicIndex=next;
    if (!immediate) {
      this.exploration.classList.remove("is-switching-next","is-switching-prev"); void this.exploration.offsetWidth;
      this.exploration.classList.add(next >= previous ? "is-switching-next" : "is-switching-prev");
      clearTimeout(this._switchTimer); this._switchTimer=setTimeout(()=>this.exploration.classList.remove("is-switching-next","is-switching-prev"),560);
    }
    this.topicKicker.textContent=stop.kicker;this.topicTitle.textContent=stop.title;this.topicSubtitle.textContent=stop.subtitle;this.topicSummary.textContent=stop.summary;this.topicFacts.replaceChildren(...stop.facts.map(f=>{const li=document.createElement("li");li.textContent=f;return li;}));
    this.topicSource.href=stop.source;this.topicCurrent.textContent=String(next+1).padStart(2,"0");this.topicPrev.disabled=next===0;this.topicNext.disabled=next===JUPITER_EXPLORATION_STOPS.length-1;Array.from(this.topicProgress.children).forEach((bar,i)=>bar.classList.toggle("is-active",i===next));
    window.ExplorationMedia?.render?.("jupiter",stop,this.contextMedia); this._applyTopicView(next, immediate || !this.exploring);
    if(this.active){ if(!this.frame){this.previous=performance.now();this.tick(this.previous);} else this.render(); }
    if(announce&&this.exploring)document.getElementById("announcement").textContent=`Eksplorasi Jupiter ${next+1} dari ${JUPITER_EXPLORATION_STOPS.length}: ${stop.title}.`;
  };

  const originalEnter = P.enterExploration;
  P.enterExploration = function(){ this._ensureFeatureState(); originalEnter.call(this); if(this.exploring)this._applyTopicView(this.topicIndex,false); };
  const originalExit = P.exitExploration;
  P.exitExploration = function(){ originalExit.call(this); this.focusState="IDLE_ROTATION"; this._activeMarker=null; this.focusReticle?.classList.remove("is-marker-visible"); this.semanticOverlay && (this.semanticOverlay.className="jupiter-semantic-overlay"); if(this.moonGroup)this.moonGroup.visible=false; };

  P._updateFeatureMotion = function(delta) {
    this._ensureFeatureState();
    if (!this.exploring) return;
    const k = this.motion.matches ? 1 : 1-Math.exp(-delta*2.5);
    this.focusYaw += wrap(this.focusYawTarget-this.focusYaw)*k;
    this.focusPitch += (this.focusPitchTarget-this.focusPitch)*k;
    this.focusCameraZ += (this.focusCameraZTarget-this.focusCameraZ)*k;
    if (Math.abs(wrap(this.focusYawTarget-this.focusYaw))<.008 && Math.abs(this.focusPitchTarget-this.focusPitch)<.005) this.focusState="FOCUSED_IDLE";
  };

  P.tick = function(now) {
    this.frame=null; if(!this.active||document.hidden)return; const delta=Math.min((now-this.previous)/1000,.12); this.previous=now; this.time+=delta;
    const damp=1-Math.exp(-delta*2.1); this.cameraOffset.x+=(this.pointer.x-this.cameraOffset.x)*damp; this.cameraOffset.y+=(this.pointer.y-this.cameraOffset.y)*damp;
    const ed=this.motion.matches?1:1-Math.exp(-delta*3); this.explorationBlend+=(this.explorationBlendTarget-this.explorationBlend)*ed; this._updateFeatureMotion(delta); this.render();
    if(this.active && (!this.motion.matches || this.travelMode || Math.abs(this.explorationBlend-this.explorationBlendTarget)>.002 || this.focusState==="FOCUS_TRANSITION")) this.frame=requestAnimationFrame(t=>this.tick(t));
  };

  P._updateFocusMarker = function() {
    if(!this.focusReticle || !this.exploring || this._activeMarker!=="grs" || !this.grsAnchor || this.mode!=="webgl") { this.focusReticle?.classList.remove("is-marker-visible"); return; }
    this.grsAnchor.getWorldPosition(this._markerWorld); this.planet.getWorldPosition(this._planetWorld);
    this._surfaceNormal.copy(this._markerWorld).sub(this._planetWorld).normalize(); this._toCamera.copy(this.camera.position).sub(this._markerWorld).normalize();
    const facing=this._surfaceNormal.dot(this._toCamera); this._projected.copy(this._markerWorld).project(this.camera);
    const visible=facing>.02&&this._projected.z<1&&Math.abs(this._projected.x)<1.05&&Math.abs(this._projected.y)<1.05;
    if(!visible){this.focusReticle.classList.remove("is-marker-visible");return;}
    const x=(this._projected.x*.5+.5)*this.width,y=(-this._projected.y*.5+.5)*this.height; this.focusReticle.style.left=`${x}px`;this.focusReticle.style.top=`${y}px`;this.focusReticle.style.setProperty("--marker-opacity",".94"); this.focusReticle.classList.add("is-marker-visible"); this.focusReticle.classList.toggle("is-left",x+240>this.width);
  };

  P.renderJupiter = function() {
    this._ensureFeatureState(); const blend=this.explorationBlend; const x=this.mobile?0:(.82+blend*.15), y=this.mobile?(.13-blend*.23):(.02+blend*.01), scale=this.mobile?.98:1.13;
    const idle=2.58+this.time*.030; const subtle=this.exploring&&this.focusState==="FOCUSED_IDLE"?Math.sin(this.time*.16)*.018:0; this.renderedRotation=this.exploring?this.focusYaw+subtle:idle;
    if(this.mode==="webgl"){
      this.travelMarsGroup.visible=false;if(this.asteroidGroup)this.asteroidGroup.visible=false;this.planetGroup.visible=true;this.planetGroup.position.set(x,y,0);this.planetGroup.scale.setScalar(scale);
      this.planetGroup.rotation.x=this.exploring?this.focusPitch:0; this.planetGroup.rotation.z=this.exploring?-.018:0;
      this.planet.rotation.y=this.renderedRotation; if(this.cloudLayer)this.cloudLayer.rotation.y=this.renderedRotation+this.time*.0045;
      this.ring.rotation.z=.015+Math.sin(this.time*.14)*.008;
      const z=this.exploring?this.focusCameraZ:6.4; this.camera.position.set(this.motion.matches?0:this.cameraOffset.x*.13,this.motion.matches?0:-this.cameraOffset.y*.09,z);this.camera.lookAt(0,0,0);this.renderer.render(this.scene,this.camera); this._updateFocusMarker();
    } else { this.drawCanvasJupiter(x,y,scale); this.focusReticle?.classList.remove("is-marker-visible"); }
    if(this.time>1.1&&!this.travelMode){this.caption.classList.add("is-visible");this.caption.inert=this.exploring;this.credit.style.opacity=this.exploring?"0":".9";}
  };
})();
