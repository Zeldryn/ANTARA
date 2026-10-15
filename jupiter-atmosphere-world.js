"use strict";

export class JupiterAtmosphereWorld {
  constructor(root, qualityName = "MEDIUM") {
    this.root = root;
    this.qualityName = qualityName;
    this.canvas = null;
    this.THREE = null;
    this.renderer = null;
    this.scene = null;
    this.camera = null;
    this.clock = null;
    this.frame = null;
    this.destination = null;
    this.yaw = 0;
    this.pitch = -0.04;
    this.velocity = null;
    this.boundary = 54;
    this.softBoundary = 46;
    this.altitudeMin = -15;
    this.altitudeMax = 20;
    this.clouds = [];
    this.animated = [];
    this.lightning = [];
    this.lastLightning = 0;
    this.boundaryStrength = 0;
    this.worldTime = 0;
    this.tmp = {};
    this.textures = [];
  }

  async init() {
    if (this.renderer) return;
    const THREE = await import("./assets/vendor/three/three.module.min.js");
    this.THREE = THREE;
    this.canvas = document.createElement("canvas");
    this.canvas.className = "jupiter-atmosphere-canvas";
    this.canvas.setAttribute("aria-label", "Simulasi POV atmosfer Jupiter");
    this.root.insertBefore(this.canvas, this.root.firstChild);
    this.renderer = new THREE.WebGLRenderer({ canvas: this.canvas, alpha: false, antialias: this.qualityName !== "LOW", powerPreference: "high-performance" });
    this.renderer.outputColorSpace = THREE.SRGBColorSpace;
    this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
    this.renderer.toneMappingExposure = 0.92;
    this.scene = new THREE.Scene();
    this.scene.background = new THREE.Color(0x8c674f);
    this.scene.fog = new THREE.FogExp2(0x9a745b, 0.025);
    this.camera = new THREE.PerspectiveCamera(64, 1, 0.08, 180);
    this.camera.rotation.order = "YXZ";
    this.velocity = new THREE.Vector3();
    this.tmp.forward = new THREE.Vector3();
    this.tmp.right = new THREE.Vector3();
    this.tmp.intent = new THREE.Vector3();
    const hemi = new THREE.HemisphereLight(0xf2d0a5, 0x5a3024, 1.35); hemi.userData.persistent = true; this.scene.add(hemi);
    const key = new THREE.DirectionalLight(0xffe1b5, 2.2); key.position.set(-14, 22, 10); key.userData.persistent = true; this.scene.add(key);
    const fill = new THREE.DirectionalLight(0x7394ac, 0.55); fill.position.set(18, 4, -12); fill.userData.persistent = true; this.scene.add(fill);
    this.clock = new THREE.Clock();
    this.resize();
    window.addEventListener("resize", this._resize = () => this.resize());
  }

  qualityProfile() {
    return ({ LOW:{dpr:1.0, clouds:170, wisps:90}, MEDIUM:{dpr:1.35, clouds:280, wisps:150}, HIGH:{dpr:1.65, clouds:390, wisps:220} })[this.qualityName] || {dpr:1.35,clouds:280,wisps:150};
  }

  resize() {
    if (!this.renderer || !this.camera) return;
    const w = Math.max(2, this.root.clientWidth || innerWidth);
    const h = Math.max(2, this.root.clientHeight || innerHeight);
    this.renderer.setPixelRatio(Math.min(devicePixelRatio || 1, this.qualityProfile().dpr));
    this.renderer.setSize(w, h, false);
    this.camera.aspect = w / h;
    this.camera.updateProjectionMatrix();
  }

  makeCloudTexture() {
    const THREE = this.THREE;
    const c = document.createElement("canvas"); c.width = c.height = 128;
    const ctx = c.getContext("2d");
    const g = ctx.createRadialGradient(64,64,3,64,64,62);
    g.addColorStop(0,"rgba(255,247,226,.90)"); g.addColorStop(.24,"rgba(245,224,193,.76)"); g.addColorStop(.58,"rgba(207,167,130,.38)"); g.addColorStop(1,"rgba(144,96,72,0)");
    ctx.fillStyle = g; ctx.fillRect(0,0,128,128);
    const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; this.textures.push(t); return t;
  }

  clearWorld() {
    if (!this.scene) return;
    [...this.scene.children].forEach(obj => {
      if (obj.userData?.persistent) return;
      this.scene.remove(obj);
      obj.traverse?.(child => { child.geometry?.dispose?.(); if (Array.isArray(child.material)) child.material.forEach(m=>m.dispose?.()); else child.material?.dispose?.(); });
    });
    this.clouds.length = 0; this.animated.length = 0; this.lightning.length = 0;
    this.textures.splice(0).forEach(t => t.dispose?.());
  }

  async build(destination) {
    await this.init();
    this.clearWorld();
    this.destination = destination;
    const THREE = this.THREE;
    const style = destination.style || {};
    this.scene.background.set(style.sky || 0x92694f);
    this.scene.fog.color.set(style.fog || 0x9b7459);
    this.scene.fog.density = style.fogDensity || 0.026;
    this.camera.position.set(...(destination.spawn || [0, 2, 28]));
    this.yaw = destination.yaw ?? Math.PI;
    this.pitch = destination.pitch ?? -0.04;
    this.velocity.set(0,0,0);

    const texture = this.makeCloudTexture();
    const profile = this.qualityProfile();
    const cloudMat = new THREE.SpriteMaterial({ map:texture, color:style.cloud || 0xe8caa7, transparent:true, opacity:.46, depthWrite:false, fog:true });
    const darkMat = new THREE.SpriteMaterial({ map:texture, color:style.darkCloud || 0x8b5945, transparent:true, opacity:.34, depthWrite:false, fog:true });
    const brightMat = new THREE.SpriteMaterial({ map:texture, color:style.brightCloud || 0xffead0, transparent:true, opacity:.42, depthWrite:false, fog:true });
    const rand = this.seeded(destination.seed || 7);
    const group = new THREE.Group(); this.scene.add(group);
    for (let i=0;i<profile.clouds;i++) {
      const mat = i%7===0 ? brightMat : i%4===0 ? darkMat : cloudMat;
      const s = new THREE.Sprite(mat.clone());
      const r = Math.sqrt(rand()) * 76, a = rand()*Math.PI*2;
      s.position.set(Math.cos(a)*r, (rand()-.5)*30, Math.sin(a)*r);
      const size = 5 + rand()*15; s.scale.set(size*(1.3+rand()*1.9), size*(.52+rand()*.9), 1);
      s.material.opacity *= .58 + rand()*.55;
      s.userData.drift = (rand()-.5)*.34; s.userData.baseY = s.position.y; s.userData.phase = rand()*Math.PI*2;
      group.add(s); this.clouds.push(s);
    }

    this.addLayer(-9, style.deep || 0x744838, .32, 0.11);
    this.addLayer(9, style.upper || 0xd9b18d, .22, -0.08);
    this.addBandCurtains(style);
    this.addDestinationFeature(destination);
    this.addBoundaryHaze(style);
    this.look();
    this.render();
  }

  seeded(seed) { let s = seed >>> 0; return () => ((s = Math.imul(1664525,s)+1013904223>>>0) / 4294967296); }

  addLayer(y, color, opacity, drift) {
    const THREE = this.THREE;
    const geo = new THREE.PlaneGeometry(180,180,1,1);
    const mat = new THREE.MeshBasicMaterial({ color, transparent:true, opacity, depthWrite:false, side:THREE.DoubleSide, fog:true });
    const mesh = new THREE.Mesh(geo,mat); mesh.rotation.x = -Math.PI/2; mesh.position.y = y; mesh.userData.drift = drift; this.scene.add(mesh); this.animated.push(mesh);
  }

  addBandCurtains(style) {
    const THREE=this.THREE;
    const colors = [style.band1||0xc99a72, style.band2||0x8d5b46, style.band3||0xe0bc91, style.band4||0x9e6b52];
    for(let i=0;i<7;i++){
      const geo=new THREE.PlaneGeometry(150,7+Math.random()*7);
      const mat=new THREE.MeshBasicMaterial({color:colors[i%colors.length],transparent:true,opacity:.11,side:THREE.DoubleSide,depthWrite:false,fog:true});
      const p=new THREE.Mesh(geo,mat); p.position.set(0,-11+i*4.1,-45+i*15); p.rotation.y=(i%2?.13:-.11); p.userData.drift=(i%2?1:-1)*(.12+i*.01); this.scene.add(p); this.animated.push(p);
    }
  }

  addDestinationFeature(d) {
    const THREE=this.THREE;
    if(d.id === "grs") {
      const g=new THREE.Group(); g.position.set(0,0,-7);
      for(let i=0;i<15;i++){
        const geo=new THREE.TorusGeometry(5.2+i*.52,.16+.025*i,10,80);
        const mat=new THREE.MeshBasicMaterial({color:i<5?0xf0b17e:i<10?0xc86d50:0x8e493c,transparent:true,opacity:.20+.018*i,depthWrite:false});
        const ring=new THREE.Mesh(geo,mat); ring.scale.x=1.75; ring.position.z=(i-7)*.08; ring.userData.spin=(i%2?1:-1)*(.045+i*.006); g.add(ring); this.animated.push(ring);
      }
      this.scene.add(g); d.target=[0,0,-7];
    } else if(d.id === "jet-boundary") {
      for(let i=0;i<20;i++){
        const geo=new THREE.PlaneGeometry(70,1.0+Math.random()*1.6);
        const mat=new THREE.MeshBasicMaterial({color:i%2?0xd4a27e:0x8e5844,transparent:true,opacity:.24,side:THREE.DoubleSide,depthWrite:false});
        const m=new THREE.Mesh(geo,mat); m.position.set((i%2?1:-1)*3,(i-10)*.55,-8+(i%3)*1.1); m.rotation.z=(i%2?.025:-.025); m.userData.drift=(i%2?1:-1)*(.55+Math.random()*.4); this.scene.add(m); this.animated.push(m);
      } d.target=[0,0,-8];
    } else if(d.id === "ammonia-tower") {
      const g=new THREE.Group(); g.position.set(0,-2,-8);
      for(let i=0;i<22;i++){
        const geo=new THREE.SphereGeometry(1,20,14); const mat=new THREE.MeshPhongMaterial({color:i%4===0?0xffffff:0xe9ded1,transparent:true,opacity:.18,shininess:5,depthWrite:false});
        const m=new THREE.Mesh(geo,mat); const ang=i*2.399; const rr=.4+Math.sqrt(i)*.95; m.position.set(Math.cos(ang)*rr,i*.62,Math.sin(ang)*rr*.65); m.scale.set(2.3+Math.random()*1.5,1.2+Math.random()*1.7,2+Math.random()*1.4); m.userData.float=.05+Math.random()*.06; g.add(m); this.animated.push(m);
      } this.scene.add(g); d.target=[0,6,-8];
    } else if(d.id === "water-lightning") {
      const g=new THREE.Group(); g.position.set(0,-4,-8); this.scene.add(g);
      for(let i=0;i<9;i++){ const geo=new THREE.SphereGeometry(1,16,12); const mat=new THREE.MeshPhongMaterial({color:0x6d7481,transparent:true,opacity:.25,depthWrite:false}); const m=new THREE.Mesh(geo,mat);m.position.set((Math.random()-.5)*18,(Math.random()-.5)*8,(Math.random()-.5)*10);m.scale.set(5+Math.random()*4,2+Math.random()*2,4+Math.random()*3);g.add(m);}
      const light=new THREE.PointLight(0xbfdcff,0,45,2);light.position.set(0,2,-7);this.scene.add(light);this.lightning.push(light); d.target=[0,-2,-8];
    } else if(d.id === "hot-spot") {
      const glow=new THREE.PointLight(0xff8d4b,4.2,55,2); glow.position.set(0,-9,-10); this.scene.add(glow);
      const geo=new THREE.RingGeometry(5.5,12,96); const mat=new THREE.MeshBasicMaterial({color:0x40251f,transparent:true,opacity:.72,side:THREE.DoubleSide,depthWrite:false}); const ring=new THREE.Mesh(geo,mat);ring.rotation.x=-Math.PI/2;ring.position.set(0,-7,-9);this.scene.add(ring);
      d.target=[0,-7,-9];
    }
  }

  addBoundaryHaze(style) {
    const THREE=this.THREE;
    const geo=new THREE.CylinderGeometry(56,56,46,96,1,true);
    const mat=new THREE.MeshBasicMaterial({color:style.fog||0x9a745b,transparent:true,opacity:.18,side:THREE.BackSide,depthWrite:false,fog:false});
    const c=new THREE.Mesh(geo,mat); c.position.y=2; this.scene.add(c); this.boundaryMesh=c;
  }

  look() { if (!this.camera) return; this.camera.rotation.y=this.yaw; this.camera.rotation.x=this.pitch; }
  addLook(dx,dy){ this.yaw -= dx*.0024; this.pitch = Math.max(-1.25,Math.min(1.25,this.pitch-dy*.0022)); this.look(); }

  updateMovement(dt, keys) {
    if(!this.camera) return;
    const f = (keys.has("KeyW")||keys.has("ArrowUp")?1:0) - (keys.has("KeyS")||keys.has("ArrowDown")?1:0);
    const s = (keys.has("KeyD")||keys.has("ArrowRight")?1:0) - (keys.has("KeyA")||keys.has("ArrowLeft")?1:0);
    const v = (keys.has("KeyE")?1:0) - (keys.has("KeyQ")?1:0);
    const boost = keys.has("ShiftLeft")||keys.has("ShiftRight") ? 1.9 : 1;
    this.camera.getWorldDirection(this.tmp.forward); this.tmp.forward.y=0; this.tmp.forward.normalize();
    this.tmp.right.crossVectors(this.tmp.forward,this.camera.up).normalize();
    this.tmp.intent.set(0,0,0).addScaledVector(this.tmp.forward,f).addScaledVector(this.tmp.right,s); if(this.tmp.intent.lengthSq()>1)this.tmp.intent.normalize();
    const speed=10.5*boost; const response=1-Math.exp(-dt*6.5);
    this.velocity.x += (this.tmp.intent.x*speed-this.velocity.x)*response;
    this.velocity.z += (this.tmp.intent.z*speed-this.velocity.z)*response;
    this.velocity.y += (v*6.5*boost-this.velocity.y)*response;
    this.camera.position.addScaledVector(this.velocity,dt);
    const r=Math.hypot(this.camera.position.x,this.camera.position.z); this.boundaryStrength=Math.max(0,Math.min(1,(r-this.softBoundary)/(this.boundary-this.softBoundary)));
    if(r>this.boundary){ const k=this.boundary/r; this.camera.position.x*=k;this.camera.position.z*=k;this.velocity.x*=-.12;this.velocity.z*=-.12; }
    this.camera.position.y=Math.max(this.altitudeMin,Math.min(this.altitudeMax,this.camera.position.y));
    if(this.camera.position.y===this.altitudeMin&&this.velocity.y<0)this.velocity.y=0;if(this.camera.position.y===this.altitudeMax&&this.velocity.y>0)this.velocity.y=0;
  }

  distanceToTarget() { if(!this.camera||!this.destination?.target)return Infinity; const [x,y,z]=this.destination.target; return this.camera.position.distanceTo(new this.THREE.Vector3(x,y,z)); }

  tick(dt, keys) {
    this.worldTime += dt; this.updateMovement(dt,keys);
    for(const o of this.animated){ if(o.userData.spin)o.rotation.z += o.userData.spin*dt; if(o.userData.drift){o.position.x += o.userData.drift*dt; if(o.position.x>78)o.position.x=-78;if(o.position.x<-78)o.position.x=78;} if(o.userData.float)o.position.y += Math.sin(this.worldTime*o.userData.float*12+o.id)*.002; }
    for(const s of this.clouds){ s.position.y=s.userData.baseY+Math.sin(this.worldTime*.18+s.userData.phase)*.55; }
    if(this.destination?.id==="water-lightning"){
      const pulse=Math.sin(this.worldTime*4.7)+Math.sin(this.worldTime*11.9); const hit=pulse>1.72?5.6:0; this.lightning.forEach(l=>l.intensity=hit);
    }
    if(this.boundaryMesh)this.boundaryMesh.material.opacity=.16+this.boundaryStrength*.42;
    this.render();
  }

  render(){ this.renderer?.render(this.scene,this.camera); }
  dispose(){ cancelAnimationFrame(this.frame); window.removeEventListener("resize",this._resize); this.clearWorld(); this.renderer?.dispose?.(); this.canvas?.remove(); this.renderer=null;this.canvas=null; }
}
