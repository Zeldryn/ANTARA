"use strict";

const SATURN_TEXTURE = "assets/textures/saturn-atmosphere-4k.jpg";
const SATURN_JUPITER_TEXTURE = "assets/textures/jupiter-hubble-inspired-4k.jpg";

const SATURN_EXPLORATION_STOPS = Object.freeze([
  {
    kicker: "IDENTITAS SATURNUS",
    title: "Raksasa Bercincin",
    subtitle: "Planet keenam dari Matahari dan raksasa gas terbesar kedua",
    summary: "Saturnus adalah planet keenam dari Matahari dan planet terbesar kedua setelah Jupiter. Planet ini didominasi hidrogen dan helium, tanpa permukaan padat tempat wahana dapat mendarat.",
    facts: [
      "Diameter ekuator Saturnus sekitar 120.500 km, kira-kira sembilan kali lebar Bumi.",
      "Jarak rata-ratanya dari Matahari sekitar 9,5 AU atau 1,4 miliar km.",
      "Satu hari Saturnus berlangsung sekitar 10,7 jam, sementara satu tahunnya sekitar 29,4 tahun Bumi."
    ],
    source: "https://science.nasa.gov/saturn/facts/",
    images: [{ src: "./assets/saturn-identity-diagram.svg", alt: "Diagram identitas Saturnus dan sistem cincinnya", credit: "Visualisasi ANTARA berdasarkan NASA Science", source: "https://science.nasa.gov/saturn/facts/", caption: "Saturnus · raksasa gas keenam dari Matahari", fit: "contain" }]
  },
  {
    kicker: "CINCIN SATURNUS",
    title: "Arsitektur Es dan Debu",
    subtitle: "Sistem cincin luas dengan celah dan struktur radial yang rumit",
    summary: "Cincin Saturnus tersusun dari sangat banyak partikel es, material batuan, dan debu. Struktur cincinnya terbagi menjadi pita-pita dengan kepadatan berbeda, termasuk celah gelap Cassini Division yang memisahkan cincin A dan B.",
    facts: [
      "Cincin utama sangat lebar tetapi secara vertikal sangat tipis dibanding bentangnya.",
      "Cassini Division terlihat sebagai celah gelap di antara dua wilayah cincin utama yang terang.",
      "Partikel cincin mengorbit Saturnus secara individual, bukan sebagai satu cakram padat."
    ],
    source: "https://science.nasa.gov/saturn/facts/",
    images: [{ src: "./assets/saturn-rings-diagram.svg", alt: "Diagram struktur cincin Saturnus dengan Cassini Division", credit: "Visualisasi ANTARA", source: "https://science.nasa.gov/saturn/facts/", caption: "Struktur cincin dan Cassini Division", fit: "contain" }]
  },
  {
    kicker: "ATMOSFER DAN AWAN",
    title: "Pita yang Lebih Lembut",
    subtitle: "Atmosfer hidrogen-helium dengan jet dan badai cepat",
    summary: "Saturnus diselimuti awan berwarna kuning, cokelat, dan abu-abu dengan pita yang lebih halus daripada Jupiter. Atmosfer atasnya mempunyai jet cepat dan badai yang dapat tumbuh besar secara periodik.",
    facts: [
      "Atmosfer Saturnus terutama tersusun dari hidrogen dan helium.",
      "Kecepatan angin di wilayah ekuator dapat mencapai sekitar 500 meter per detik.",
      "Kontras pita Saturnus cenderung lebih lembut daripada pita atmosfer Jupiter."
    ],
    source: "https://science.nasa.gov/saturn/facts/",
    images: [{ src: "./assets/saturn-atmosphere-diagram.svg", alt: "Diagram atmosfer dan pita awan Saturnus", credit: "Visualisasi ANTARA", source: "https://science.nasa.gov/saturn/facts/", caption: "Pita awan dan sirkulasi atmosfer Saturnus", fit: "contain" }]
  },
  {
    kicker: "HEXAGON KUTUB UTARA",
    title: "Jet Enam Sisi",
    subtitle: "Pola sirkulasi atmosfer yang mengelilingi kutub utara",
    summary: "Kutub utara Saturnus memiliki pola jet berbentuk enam sisi yang terkenal sebagai hexagon. Fitur berskala planet ini pertama kali terlihat pada data Voyager dan kemudian diamati dengan detail tinggi oleh Cassini.",
    facts: [
      "Hexagon bukan struktur padat, melainkan pola aliran atmosfer.",
      "Pola ini berputar bersama sistem atmosfer kutub utara Saturnus.",
      "Cassini menghasilkan salah satu pandangan warna dan detail terbaik terhadap hexagon."
    ],
    source: "https://science.nasa.gov/mission/cassini/about-the-mission/",
    images: [{ src: "./assets/saturn-hexagon-diagram.svg", alt: "Diagram edukasi hexagon kutub utara Saturnus", credit: "Visualisasi ANTARA berdasarkan pengamatan Cassini", source: "https://science.nasa.gov/mission/cassini/about-the-mission/", caption: "Hexagon kutub utara Saturnus", fit: "contain" }]
  },
  {
    kicker: "BULAN-BULAN SATURNUS",
    title: "Sistem Dunia Kecil",
    subtitle: "Titan, Rhea, Iapetus, Dione, Tethys, Mimas, dan banyak lainnya",
    summary: "Saturnus dikelilingi sistem bulan yang sangat beragam. Titan mendominasi dari sisi ukuran, sementara Enceladus menjadi salah satu objek paling menarik karena aktivitas plume dan bukti samudra air di bawah permukaannya.",
    facts: [
      "Titan adalah bulan terbesar Saturnus dan bulan terbesar kedua di Tata Surya.",
      "Rhea, Iapetus, Dione, Tethys, dan Mimas memperlihatkan sejarah geologi yang berbeda-beda.",
      "Interaksi beberapa bulan dengan cincin membantu membentuk dan mempertahankan struktur cincin tertentu."
    ],
    source: "https://science.nasa.gov/saturn/moons/facts/",
    images: [{ src: "./assets/saturn-moons-diagram.svg", alt: "Diagram bulan-bulan penting Saturnus", credit: "Visualisasi ANTARA", source: "https://science.nasa.gov/saturn/moons/facts/", caption: "Beberapa bulan penting dalam sistem Saturnus", fit: "contain" }]
  },
  {
    kicker: "TITAN & ENCELADUS",
    title: "Dua Dunia yang Mengubah Pertanyaan",
    subtitle: "Danau hidrokarbon, atmosfer tebal, plume es, dan samudra tersembunyi",
    summary: "Titan memiliki atmosfer tebal yang didominasi nitrogen serta sungai, danau, dan laut hidrokarbon cair di permukaannya. Enceladus memuntahkan uap air dan partikel es dari retakan di kutub selatan, memberi bukti kuat tentang samudra di bawah kerak es.",
    facts: [
      "Titan adalah satu-satunya bulan yang diketahui memiliki atmosfer tebal.",
      "Titan memiliki badan cair stabil di permukaan, terutama metana dan etana.",
      "Plume Enceladus memasok material ke cincin E Saturnus dan membawa material dari lingkungan samudra bawah permukaan."
    ],
    source: "https://science.nasa.gov/saturn/moons/titan/facts/",
    images: [{ src: "./assets/saturn-titan-enceladus.svg", alt: "Diagram Titan dan Enceladus", credit: "Visualisasi ANTARA berdasarkan NASA Science", source: "https://science.nasa.gov/saturn/moons/facts/", caption: "Titan dan Enceladus · dua laboratorium alam", fit: "contain" }]
  },
  {
    kicker: "EKSPLORASI SATURNUS",
    title: "Dari Flyby ke Cassini-Huygens",
    subtitle: "Empat dekade pengamatan jarak dekat mengubah pemahaman Saturnus",
    summary: "Pioneer 11 membuka era flyby Saturnus, disusul Voyager 1 dan 2. Cassini kemudian mengorbit Saturnus dari 2004 hingga 2017, sementara wahana Huygens mendarat di Titan dan mengirim data langsung dari permukaannya.",
    facts: [
      "Pioneer 11 menjadi wahana pertama yang melintasi Saturnus pada 1979.",
      "Voyager 1 dan 2 memperluas pemetaan cincin, atmosfer, dan bulan Saturnus pada awal 1980-an.",
      "Cassini-Huygens mempelajari sistem Saturnus selama lebih dari satu dekade dan Huygens mendarat di Titan pada 2005."
    ],
    source: "https://science.nasa.gov/mission/cassini/about-the-mission/",
    images: [{ src: "./assets/saturn-missions-diagram.svg", alt: "Garis waktu eksplorasi Saturnus dari Pioneer hingga Cassini-Huygens", credit: "Visualisasi ANTARA", source: "https://science.nasa.gov/mission/cassini/about-the-mission/", caption: "Tonggak eksplorasi Saturnus", fit: "contain" }]
  }
]);

window.SaturnScene = class SaturnScene {
  constructor() {
    this.element=document.getElementById("saturn-scene");
    this.viewport=document.getElementById("saturn-viewport");
    this.caption=this.element.querySelector(".saturn-caption");
    this.title=document.getElementById("saturn-title");
    this.exploreButton=document.getElementById("saturn-explore-button");
    this.exploration=document.getElementById("saturn-exploration");
    this.explorationClose=document.getElementById("saturn-exploration-close");
    this.topicKicker=document.getElementById("saturn-topic-kicker");
    this.topicTitle=document.getElementById("saturn-topic-title");
    this.topicSubtitle=document.getElementById("saturn-topic-subtitle");
    this.topicSummary=document.getElementById("saturn-topic-summary");
    this.topicFacts=document.getElementById("saturn-topic-facts");
    this.topicSource=document.getElementById("saturn-topic-source");
    this.topicCurrent=document.getElementById("saturn-topic-current");
    this.topicTotal=document.getElementById("saturn-topic-total");
    this.topicPrev=document.getElementById("saturn-topic-prev");
    this.topicNext=document.getElementById("saturn-topic-next");
    this.topicProgress=document.getElementById("saturn-topic-progress");
    this.contextMedia=document.getElementById("saturn-context-media");
    this.credit=this.element.querySelector(".saturn-credit");
    this.motion=matchMedia("(prefers-reduced-motion: reduce)");
    this.loading=null; this.mode="pending"; this.active=false; this.exploring=false; this.topicIndex=0;
    this.explorationBlend=0; this.explorationBlendTarget=0; this.frame=null; this.previous=0; this.time=0;
    this.width=1; this.height=1; this.mobile=false; this.travelMode=null; this.travelCallbacks={};
    this.travelStartedAt=0; this.travelDuration=8.3; this.travelCoveredFired=false; this.travelCompleteFired=false;
    this.renderedRotation=2.2; this.pointer={x:0,y:0}; this.cameraOffset={x:0,y:0};
    this.caption.inert=true; this.exploration.inert=true;
    this.topicTotal.textContent=String(SATURN_EXPLORATION_STOPS.length).padStart(2,"0");
    this.topicProgress.replaceChildren(...SATURN_EXPLORATION_STOPS.map(()=>document.createElement("span")));
    this.setExplorationStop(0,{immediate:true,announce:false});
    this.exploreButton.addEventListener("click",()=>this.enterExploration());
    this.explorationClose.addEventListener("click",()=>this.exitExploration());
    this.topicPrev.addEventListener("click",()=>this.setExplorationStop(this.topicIndex-1));
    this.topicNext.addEventListener("click",()=>this.setExplorationStop(this.topicIndex+1));
    this.element.addEventListener("pointermove",event=>{
      if(event.pointerType!=="mouse"||this.motion.matches||this.travelMode)return;
      const rect=this.element.getBoundingClientRect();
      this.pointer.x=(event.clientX-rect.left)/rect.width-.5; this.pointer.y=(event.clientY-rect.top)/rect.height-.5;
    });
    this.element.addEventListener("pointerleave",()=>{this.pointer.x=this.pointer.y=0;});
    addEventListener("resize",()=>{if(this.active||!this.element.hidden)this.resize();});
    document.addEventListener("visibilitychange",()=>{if(!document.hidden&&this.active&&!this.frame){this.previous=performance.now();this.tick(this.previous);}});
  }
  clamp(v,a=0,b=1){return Math.min(b,Math.max(a,v));}
  smooth(a,b,v){const t=this.clamp((v-a)/(b-a));return t*t*(3-2*t);}
  ease(v){return 1-Math.pow(1-this.clamp(v),3);}
  loadImage(src){return new Promise((resolve,reject)=>{const image=new Image();image.decoding="async";image.onload=async()=>{try{await image.decode?.();}catch(_){}resolve(image);};image.onerror=()=>reject(new Error(`Unable to load ${src}`));image.src=src;});}

  prepare(){
    if(this.loading)return this.loading;
    this.loading=Promise.allSettled([import("./assets/vendor/three/three.module.min.js"),this.loadImage(SATURN_TEXTURE),this.loadImage(SATURN_JUPITER_TEXTURE)]).then(async([moduleResult,imageResult,jupiterResult])=>{
      this.surface=imageResult.status==="fulfilled"?imageResult.value:this.makeFallbackSurface();
      this.jupiterSurface=jupiterResult.status==="fulfilled"?jupiterResult.value:null;
      if(moduleResult.status==="fulfilled"){
        try{this.createThreeScene(moduleResult.value);}catch(error){console.warn("Saturn WebGL unavailable; using Canvas fallback.",error);this.createCanvasFallback();}
      }else this.createCanvasFallback();
      this.resize();
      if(this.renderer?.compileAsync)await this.renderer.compileAsync(this.scene,this.camera);
      this.element.dataset.ready="true";
      if(this.active)this.render();
    }).catch(error=>{console.error("Saturn preparation failed",error);this.createCanvasFallback();this.resize();this.element.dataset.ready="fallback";});
    return this.loading;
  }

  makeFallbackSurface(){
    const c=document.createElement("canvas");c.width=2048;c.height=1024;const x=c.getContext("2d");
    const g=x.createLinearGradient(0,0,0,c.height);[
      [0,"#b89f72"],[.12,"#dfc991"],[.25,"#cfb27a"],[.38,"#ead7a5"],[.51,"#d7bb82"],[.64,"#ead6a0"],[.78,"#c9aa71"],[1,"#9e855d"]
    ].forEach(([p,col])=>g.addColorStop(p,col));x.fillStyle=g;x.fillRect(0,0,c.width,c.height);
    x.globalAlpha=.16;for(let i=0;i<90;i++){x.fillStyle=i%2?"#fff3cf":"#7a6546";x.fillRect(0,(i*73)%c.height,c.width,1+(i%3));}x.globalAlpha=1;return c;
  }

  createThreeScene(THREE){
    this.THREE=THREE;const canvas=document.createElement("canvas");const context=canvas.getContext("webgl2",{alpha:true,antialias:true,powerPreference:"high-performance"});if(!context)throw new Error("WebGL2 unavailable");
    this.renderer=new THREE.WebGLRenderer({canvas,context,alpha:true,antialias:true});this.renderer.setClearColor(0x02060d,0);this.renderer.outputColorSpace=THREE.SRGBColorSpace;this.renderer.toneMapping=THREE.ACESFilmicToneMapping;this.renderer.toneMappingExposure=1.07;
    this.viewport.replaceChildren(canvas);this.scene=new THREE.Scene();this.camera=new THREE.PerspectiveCamera(34,1,.1,300);this.camera.position.set(0,0,7.0);

    const texture=new THREE.Texture(this.surface);texture.colorSpace=THREE.SRGBColorSpace;texture.wrapS=THREE.RepeatWrapping;texture.wrapT=THREE.ClampToEdgeWrapping;texture.minFilter=THREE.LinearMipmapLinearFilter;texture.magFilter=THREE.LinearFilter;texture.generateMipmaps=true;texture.anisotropy=Math.min(12,this.renderer.capabilities.getMaxAnisotropy());texture.needsUpdate=true;this.saturnTexture=texture;
    const bump=texture.clone();bump.colorSpace=THREE.NoColorSpace;bump.needsUpdate=true;
    this.planetMaterial=new THREE.MeshStandardMaterial({map:texture,bumpMap:bump,bumpScale:.006,roughness:.92,metalness:0,color:0xffffff});
    this.planet=new THREE.Mesh(new THREE.SphereGeometry(1,160,112),this.planetMaterial);this.planet.scale.y=.905;this.planet.rotation.set(0,2.2,0);
    this.planetGroup=new THREE.Group();this.planetGroup.rotation.set(-.28,0,-.14);this.planetGroup.add(this.planet);this.scene.add(this.planetGroup);

    const atmosphereMat=new THREE.ShaderMaterial({transparent:true,side:THREE.BackSide,depthWrite:false,blending:THREE.AdditiveBlending,vertexShader:`varying vec3 vN;varying vec3 vW;void main(){vN=normalize(mat3(modelMatrix)*normal);vec4 w=modelMatrix*vec4(position,1.);vW=w.xyz;gl_Position=projectionMatrix*viewMatrix*w;}`,fragmentShader:`precision highp float;varying vec3 vN;varying vec3 vW;void main(){vec3 V=normalize(cameraPosition-vW);float rim=pow(1.-max(dot(normalize(vN),V),0.),3.5);gl_FragColor=vec4(vec3(1.0,.79,.47)*rim*.27,rim*.22);}`});
    this.atmosphere=new THREE.Mesh(new THREE.SphereGeometry(1.028,112,80),atmosphereMat);this.atmosphere.scale.y=.905;this.planetGroup.add(this.atmosphere);

    this.ring=this.createRingSystem(THREE);this.planetGroup.add(this.ring);
    this.ringShadow=this.createRingShadowShell(THREE);this.ringShadow.scale.y=.905;this.planetGroup.add(this.ringShadow);

    const hemi=new THREE.HemisphereLight(0xf7e6c2,0x15100b,.92);this.scene.add(hemi);
    const key=new THREE.DirectionalLight(0xffedc8,3.2);key.position.set(-4.5,3.4,5.8);this.scene.add(key);
    const fill=new THREE.DirectionalLight(0xaec6e6,.34);fill.position.set(4,-1.2,2.5);this.scene.add(fill);

    this.createJupiterTravelObject(THREE);this.createStars(THREE);
    canvas.addEventListener("webglcontextlost",e=>{e.preventDefault();this.createCanvasFallback();this.resize();if(this.active)this.render();},{once:true});
    this.mode="webgl";this.element.dataset.renderer="webgl";
  }

  createRingSystem(THREE){
    const geometry=new THREE.RingGeometry(1.28,2.48,512,4);
    const material=new THREE.ShaderMaterial({transparent:true,side:THREE.DoubleSide,depthTest:true,depthWrite:false,blending:THREE.NormalBlending,uniforms:{uTime:{value:0},uOpacity:{value:1},uLightDir:{value:new THREE.Vector3(-.56,.42,.71).normalize()}},vertexShader:`varying float vR;varying vec3 vLocal;void main(){vLocal=position;vR=(length(position.xy)-1.28)/(2.48-1.28);gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.0);}`,fragmentShader:`precision highp float;varying float vR;varying vec3 vLocal;uniform float uTime;uniform float uOpacity;uniform vec3 uLightDir;float h(float x){return fract(sin(x*917.13)*43758.5453);}void main(){float r=clamp(vR,0.,1.);float A=smoothstep(.06,.10,r)*(1.-smoothstep(.32,.36,r));float B=smoothstep(.39,.43,r)*(1.-smoothstep(.71,.76,r));float C=smoothstep(.79,.82,r)*(1.-smoothstep(.96,.985,r));float cassiniGap=smoothstep(.345,.365,r)*(1.-smoothstep(.385,.415,r));float cassini=1.-.94*cassiniGap;float fine=.72+.18*sin(r*680.0)+.08*sin(r*1470.0+1.2)+.05*sin(r*3040.0+.4);float density=(A*.47+B*.88+C*.26)*cassini*fine;float grain=.92+.08*h(floor(r*2400.0));density*=grain;vec3 col=mix(vec3(.55,.49,.39),vec3(.95,.90,.78),smoothstep(.28,.70,density));col=mix(col,vec3(.76,.70,.60),C*.5);vec2 p=vLocal.xy;vec2 L=normalize(uLightDir.xy);float along=dot(p,L);float side=abs(p.x*L.y-p.y*L.x);float planetShadow=(1.-smoothstep(-.55,.05,along))*(1.-smoothstep(.76,1.03,side));density*=mix(1.0,.28,planetShadow);float edge=smoothstep(0.,.018,r)*smoothstep(1.,.982,r);float alpha=clamp(density*.88,0.,.82)*edge*uOpacity;if(alpha<.012)discard;gl_FragColor=vec4(col,alpha);}`});
    const ring=new THREE.Mesh(geometry,material);ring.rotation.x=Math.PI/2;ring.rotation.z=0.;ring.renderOrder=1;return ring;
  }

  createRingShadowShell(THREE){
    const material=new THREE.ShaderMaterial({transparent:true,depthWrite:false,depthTest:true,side:THREE.FrontSide,vertexShader:`varying vec3 vP;varying vec3 vN;void main(){vP=position;vN=normal;gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.0);}`,fragmentShader:`precision highp float;varying vec3 vP;varying vec3 vN;void main(){float band=1.-smoothstep(.018,.105,abs(vP.y+.035));float lit=smoothstep(-.55,.55,dot(normalize(vN),normalize(vec3(-.6,.42,.68))));float a=band*lit*.15;if(a<.004)discard;gl_FragColor=vec4(.10,.07,.035,a);}`});
    return new THREE.Mesh(new THREE.SphereGeometry(1.008,128,80),material);
  }

  createJupiterTravelObject(THREE){
    const material=new THREE.MeshStandardMaterial({color:0xffffff,roughness:.9,metalness:0,transparent:true,opacity:1});
    if(this.jupiterSurface){const tex=new THREE.Texture(this.jupiterSurface);tex.colorSpace=THREE.SRGBColorSpace;tex.wrapS=THREE.RepeatWrapping;tex.needsUpdate=true;material.map=tex;}
    this.travelJupiterMaterial=material;this.travelJupiter=new THREE.Mesh(new THREE.SphereGeometry(1,112,72),material);this.travelJupiter.rotation.y=2.58;this.travelJupiterGroup=new THREE.Group();this.travelJupiterGroup.add(this.travelJupiter);
    const rt=new THREE.RingGeometry(1.3,1.88,160,2);const rm=new THREE.MeshBasicMaterial({color:0x948b7d,transparent:true,opacity:.17,depthTest:true,depthWrite:false,side:THREE.DoubleSide});const r=new THREE.Mesh(rt,rm);r.rotation.x=Math.PI/2-.14;this.travelJupiterGroup.add(r);this.scene.add(this.travelJupiterGroup);this.travelJupiterGroup.visible=false;
  }

  createStars(THREE){
    const count=this.mobile?350:700,positions=new Float32Array(count*3);for(let i=0;i<count;i++){const a=i*12.9898;positions[i*3]=(Math.sin(a)*.5)*34;positions[i*3+1]=(Math.sin(a*1.71+.3)*.5)*20;positions[i*3+2]=-4-Math.abs(Math.sin(a*2.11))*45;}const g=new THREE.BufferGeometry();g.setAttribute("position",new THREE.BufferAttribute(positions,3));const m=new THREE.PointsMaterial({color:0xbecbdd,size:.025,transparent:true,opacity:.55,sizeAttenuation:true});this.stars=new THREE.Points(g,m);this.scene.add(this.stars);
  }

  createCanvasFallback(){this.renderer?.dispose?.();this.renderer=null;const c=document.createElement("canvas");this.canvas=c;this.ctx=c.getContext("2d");this.viewport.replaceChildren(c);this.mode="canvas";this.element.dataset.renderer="canvas";}

  resize(){
    const rect=this.viewport.getBoundingClientRect();this.width=Math.max(1,Math.floor(rect.width));this.height=Math.max(1,Math.floor(rect.height));this.mobile=this.width<=700||this.height>this.width*1.18;
    const dpr=Math.min(devicePixelRatio||1,this.mobile?1.5:2);
    if(this.mode==="webgl"&&this.renderer){this.renderer.setPixelRatio(dpr);this.renderer.setSize(this.width,this.height,false);this.camera.aspect=this.width/this.height;this.camera.updateProjectionMatrix();}
    else if(this.canvas){this.canvas.width=Math.max(1,Math.floor(this.width*dpr));this.canvas.height=Math.max(1,Math.floor(this.height*dpr));this.canvas.style.width=this.width+"px";this.canvas.style.height=this.height+"px";this.ctx.setTransform(dpr,0,0,dpr,0,0);}
    if(this.active)this.render();
  }

  start({settled=false}={}){this.active=true;this.travelMode=null;this.travelCallbacks={};this.time=settled?8.5:0;this.exploring=false;this.explorationBlend=this.explorationBlendTarget=0;this.element.hidden=false;this.element.style.opacity="1";this.element.classList.remove("is-exploring","is-leaving");this.caption.classList.remove("is-visible");this.caption.inert=true;this.exploration.inert=true;this.setExplorationStop(0,{immediate:true,announce:false});this.pointer.x=this.pointer.y=this.cameraOffset.x=this.cameraOffset.y=0;this.prepare();this.resize();cancelAnimationFrame(this.frame);this.previous=performance.now();this.tick(this.previous);}
  stop(){this.active=false;this.travelMode=null;this.travelCallbacks={};cancelAnimationFrame(this.frame);this.frame=null;this.element.hidden=true;this.element.style.opacity="0";this.element.classList.remove("is-exploring","is-leaving");this.exploring=false;this.caption.inert=true;this.exploration.inert=true;this.contextMedia.replaceChildren();this.contextMedia.hidden=true;}

  setExplorationStop(index,{immediate=false,announce=true}={}){const next=Math.max(0,Math.min(SATURN_EXPLORATION_STOPS.length-1,index)),stop=SATURN_EXPLORATION_STOPS[next];this.topicIndex=next;this.topicKicker.textContent=stop.kicker;this.topicTitle.textContent=stop.title;this.topicSubtitle.textContent=stop.subtitle;this.topicSummary.textContent=stop.summary;this.topicFacts.replaceChildren(...stop.facts.map(f=>{const li=document.createElement("li");li.textContent=f;return li;}));this.topicSource.href=stop.source;this.topicCurrent.textContent=String(next+1).padStart(2,"0");this.topicPrev.disabled=next===0;this.topicNext.disabled=next===SATURN_EXPLORATION_STOPS.length-1;Array.from(this.topicProgress.children).forEach((bar,i)=>bar.classList.toggle("is-active",i===next));window.ExplorationMedia?.render?.("saturn",stop,this.contextMedia);if(this.active)this.render();if(announce&&this.exploring)document.getElementById("announcement").textContent=`Eksplorasi Saturnus ${next+1} dari ${SATURN_EXPLORATION_STOPS.length}: ${stop.title}.`;}
  enterExploration(){if(!this.active||this.exploring||this.travelMode)return;this.exploring=true;this.explorationBlendTarget=1;this.element.classList.add("is-exploring");this.caption.inert=true;this.exploration.inert=false;if(this.motion.matches)this.explorationBlend=1;if(!this.frame){this.previous=performance.now();this.tick(this.previous);}document.getElementById("announcement").textContent=`Mode eksplorasi Saturnus dimulai. ${SATURN_EXPLORATION_STOPS[this.topicIndex].title}.`;requestAnimationFrame(()=>this.topicTitle.focus({preventScroll:true}));}
  exitExploration(){if(!this.exploring)return;this.exploring=false;this.explorationBlendTarget=0;this.element.classList.remove("is-exploring");this.exploration.inert=true;this.caption.inert=false;if(this.motion.matches)this.explorationBlend=0;if(!this.frame){this.previous=performance.now();this.tick(this.previous);}document.getElementById("announcement").textContent="Kembali ke panorama Saturnus.";requestAnimationFrame(()=>this.exploreButton.focus({preventScroll:true}));}

  beginTravelFromJupiter({onCovered,onComplete,jupiterRotation=2.58}={}){if(this.active&&this.travelMode)return;this.active=true;this.exploring=false;this.travelMode="from-jupiter";this.travelCallbacks={onCovered,onComplete};this.travelStartedAt=0;this.time=0;this.travelDuration=this.motion.matches?.55:8.3;this.travelCoveredFired=false;this.travelCompleteFired=false;this.element.hidden=false;this.element.style.opacity="1";this.element.classList.add("is-leaving");this.caption.classList.remove("is-visible");this.caption.inert=true;this.exploration.inert=true;if(this.mode==="pending"){this.surface=this.surface||this.makeFallbackSurface();this.createCanvasFallback();}this.prepare();this.resize();if(this.travelJupiter)this.travelJupiter.rotation.y=jupiterRotation;cancelAnimationFrame(this.frame);this.previous=performance.now();this.tick(this.previous);}
  beginTravelToJupiter({onCovered,onComplete}={}){if(!this.active||this.travelMode||this.exploring)return;this.travelMode="to-jupiter";this.travelCallbacks={onCovered,onComplete};this.travelStartedAt=this.time;this.travelDuration=this.motion.matches?.55:8.3;this.travelCoveredFired=false;this.travelCompleteFired=false;this.element.classList.add("is-leaving");this.caption.inert=true;this.pointer.x=this.pointer.y=0;if(!this.frame){this.previous=performance.now();this.tick(this.previous);}}

  tick(now){this.frame=null;if(!this.active||document.hidden)return;const delta=Math.min((now-this.previous)/1000,.12);this.previous=now;this.time+=delta;const damp=1-Math.exp(-delta*2.0);this.cameraOffset.x+=(this.pointer.x-this.cameraOffset.x)*damp;this.cameraOffset.y+=(this.pointer.y-this.cameraOffset.y)*damp;const ed=this.motion.matches?1:1-Math.exp(-delta*3);this.explorationBlend+=(this.explorationBlendTarget-this.explorationBlend)*ed;this.render();if(this.active&&(!this.motion.matches||this.travelMode||Math.abs(this.explorationBlend-this.explorationBlendTarget)>.002||this.time<14))this.frame=requestAnimationFrame(t=>this.tick(t));}
  render(){if(this.travelMode)this.renderTravel();else this.renderSaturn();}

  renderSaturn(){const blend=this.explorationBlend;const x=this.mobile?0:(.66+blend*.1),y=this.mobile?(-.03-blend*.12):(.015+blend*.01),scale=this.mobile?.76:1.0;this.renderedRotation=2.2+this.time*.026;if(this.mode==="webgl"){this.travelJupiterGroup.visible=false;this.planetGroup.visible=true;this.planetGroup.position.set(x,y,0);this.planetGroup.scale.setScalar(scale);this.planet.rotation.y=this.renderedRotation;this.ring.material.uniforms.uTime.value=this.time;this.camera.position.set(this.motion.matches?0:this.cameraOffset.x*.11,this.motion.matches?0:-this.cameraOffset.y*.07,7.0);this.camera.lookAt(0,0,0);this.renderer.render(this.scene,this.camera);}else this.drawCanvasSaturn(x,y,scale);if(this.time>1.1&&!this.travelMode){this.caption.classList.add("is-visible");this.caption.inert=this.exploring;this.credit.style.opacity=this.exploring?"0":".9";}}

  renderTravel(){const reverse=this.travelMode==="to-jupiter",elapsed=reverse?this.time-this.travelStartedAt:this.time,raw=this.clamp(elapsed/this.travelDuration),p=this.ease(raw);const jP=reverse?this.smooth(.58,.98,p):1-this.smooth(.02,.31,p),sP=reverse?1-this.smooth(.02,.39,p):this.smooth(.47,.97,p);if(this.mode==="webgl"){this.planetGroup.visible=sP>.003;this.travelJupiterGroup.visible=jP>.003;const finalX=this.mobile?0:.66;if(!reverse){this.travelJupiterGroup.position.set(-p*5.3,0,-p*5.4);this.travelJupiterGroup.scale.setScalar(.96*(1-p*.76));this.travelJupiterMaterial.opacity=jP;this.planetGroup.position.set(6.2-(6.2-finalX)*sP,.01,-6.2*(1-sP));this.planetGroup.scale.setScalar(.10+.90*sP);}else{this.planetGroup.position.set(finalX-(finalX+5.4)*p,.01,-p*6.0);this.planetGroup.scale.setScalar(1.0-p*.79);this.travelJupiterGroup.position.set(5.8-(5.8)*jP,0,-5.6*(1-jP));this.travelJupiterGroup.scale.setScalar(.15+.82*jP);this.travelJupiterMaterial.opacity=jP;}this.planet.rotation.y=2.2+this.time*.026;this.ring.material.uniforms.uTime.value=this.time;this.travelJupiter.rotation.y+=.0016;this.camera.position.set(0,0,7.0);this.camera.lookAt(0,0,0);this.renderer.render(this.scene,this.camera);}else this.drawCanvasTravel(p,reverse,jP,sP);if(!this.travelCoveredFired&&raw>=.11){this.travelCoveredFired=true;this.travelCallbacks.onCovered?.();}if(raw>=.999&&!this.travelCompleteFired){this.travelCompleteFired=true;const cb=this.travelCallbacks.onComplete;if(!reverse){this.travelMode=null;this.travelCallbacks={};this.element.classList.remove("is-leaving");this.caption.classList.add("is-visible");this.caption.inert=false;this.credit.style.opacity=".9";document.getElementById("announcement").textContent="Tiba di Saturnus.";}cb?.();}}

  drawCanvasStars(ctx,w,h){ctx.fillStyle="#02060d";ctx.fillRect(0,0,w,h);ctx.fillStyle="#c5d3e3";for(let i=0;i<150;i++){const x=(i*83%997)/997*w,y=(i*47%613)/613*h;ctx.globalAlpha=.15+(i%5)*.08;ctx.fillRect(x,y,1,1);}ctx.globalAlpha=1;}
  drawCanvasRings(ctx,cx,cy,r,front=false){ctx.save();ctx.translate(cx,cy);ctx.rotate(-.17);ctx.scale(1,.30);const spans=[[1.35,1.55,"rgba(187,171,139,.35)"],[1.60,1.95,"rgba(232,219,187,.72)"],[2.04,2.36,"rgba(213,196,158,.53)"]];for(const [a,b,col] of spans){ctx.strokeStyle=col;ctx.lineWidth=Math.max(1,r*(b-a));ctx.beginPath();ctx.arc(0,0,r*(a+b)/2,front?0:Math.PI,front?Math.PI:Math.PI*2);ctx.stroke();}ctx.restore();}
  drawCanvasSaturn(x,y,scale){const ctx=this.ctx,w=this.width,h=this.height;if(!ctx)return;this.drawCanvasStars(ctx,w,h);const r=Math.min(w,h)*(this.mobile?.22:.29)*scale,cx=w*.5+x*Math.min(w,h)*.19,cy=h*.49+y*Math.min(w,h)*.22;this.drawCanvasRings(ctx,cx,cy,r,false);ctx.save();ctx.beginPath();ctx.ellipse(cx,cy,r,r*.905,0,0,Math.PI*2);ctx.clip();ctx.drawImage(this.surface,cx-r,cy-r*.905,r*2,r*1.81);const g=ctx.createRadialGradient(cx-r*.3,cy-r*.3,r*.08,cx,cy,r);g.addColorStop(0,"#ffffff16");g.addColorStop(.7,"#00000008");g.addColorStop(1,"#0000007f");ctx.fillStyle=g;ctx.fillRect(cx-r,cy-r,r*2,r*2);ctx.restore();this.drawCanvasRings(ctx,cx,cy,r,true);}
  drawCanvasTravel(p,reverse,jP,sP){const ctx=this.ctx,w=this.width,h=this.height;this.drawCanvasStars(ctx,w,h);if(sP>.01){const r=Math.min(w,h)*(.055+.23*sP),x=w*(reverse?.53:.91-(.37*sP));this.drawCanvasRings(ctx,x,h*.49,r,false);ctx.save();ctx.beginPath();ctx.ellipse(x,h*.49,r,r*.905,0,0,Math.PI*2);ctx.clip();ctx.globalAlpha=sP;ctx.drawImage(this.surface,x-r,h*.49-r*.905,r*2,r*1.81);ctx.restore();ctx.globalAlpha=1;this.drawCanvasRings(ctx,x,h*.49,r,true);}if(jP>.01){const r=Math.min(w,h)*(.06+.23*jP),x=w*(reverse?.84-(.34*jP):.5-.34*p);ctx.save();ctx.beginPath();ctx.arc(x,h*.5,r,0,Math.PI*2);ctx.clip();ctx.globalAlpha=jP;if(this.jupiterSurface)ctx.drawImage(this.jupiterSurface,x-r,h*.5-r,r*2,r*2);else{ctx.fillStyle="#c49a6c";ctx.fill();}ctx.restore();ctx.globalAlpha=1;}}
};
