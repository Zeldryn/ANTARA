"use strict";

// NASA Blue Marble Next Generation surface mosaic, stored locally for reliable rendering.
const EARTH_SURFACE_TEXTURE = "assets/textures/earth-blue-marble-4k.jpg";
const MARS_TRAVEL_TEXTURE = "assets/textures/mars-surface-2k.jpg";

const EARTH_EXPLORATION_STOPS = [
  {
    title: "Bumi, Dunia yang Aktif",
    kicker: "REKOR & EKSTREM BUMI",
    subtitle: "Satu planet, dari puncak tertinggi sampai jurang samudra terdalam",
    summary: "Bumi bukan sekadar rumah kita. Tektonik, air, es, atmosfer, dan waktu geologi membentuk bentang alam dengan skala ekstrem yang bisa kita petakan langsung pada globe.",
    context: "Urutan ini memakai definisi rekornya secara eksplisit. Everest dibahas berdasarkan elevasi di atas muka laut, Mauna Kea berdasarkan tinggi dari dasar ke puncak, sementara Challenger Deep memakai kedalaman terhadap muka laut.",
    facts: [
      "Sekitar 71% permukaan Bumi tertutup air.",
      "Litosfer Bumi terpecah menjadi lempeng tektonik yang terus bergerak.",
      "Rekor alam dapat berubah makna jika cara pengukurannya berbeda."
    ],
    source: "https://science.nasa.gov/earth/facts/",
    sourceName: "NASA Science",
    location: null
  },
  {
    title: "Mount Everest",
    kicker: "REKOR & EKSTREM",
    subtitle: "Puncak tertinggi di atas muka laut",
    region: "Himalaya · Nepal / Tiongkok",
    summary: "Mount Everest adalah titik dengan elevasi tertinggi di Bumi ketika ketinggian diukur terhadap muka laut rata-rata global.",
    context: "Definisi ini penting. Everest memegang rekor elevasi tertinggi di atas muka laut, tetapi bukan gunung dengan jarak dasar-ke-puncak terbesar. Perbandingan itu muncul pada Mauna Kea.",
    facts: [
      "Elevasi resmi yang disepakati Nepal dan Tiongkok pada 2020 adalah 8.848,86 meter.",
      "Puncaknya berada pada perbatasan Nepal dan Tiongkok di Himalaya.",
      "Ketinggian di sini memakai acuan muka laut, bukan jarak dari pusat Bumi."
    ],
    source: "https://www.tourismdepartment.gov.np/files/statistics/46.pdf",
    sourceName: "Department of Tourism Nepal",
    location: { latitude: 27.9881, longitude: 86.9253 },
    images: [
      {
        src: "https://upload.wikimedia.org/wikipedia/commons/1/13/Everest%2C_South_Col%2C_Himalayas.jpg",
        alt: "Foto Mount Everest dari arah South Col di Himalaya",
        credit: "Vyacheslav Argenberg",
        source: "https://commons.wikimedia.org/wiki/File:Everest,_South_Col,_Himalayas.jpg",
        license: "CC BY 4.0",
        licenseUrl: "https://creativecommons.org/licenses/by/4.0/",
        caption: "Mount Everest · Himalaya",
        fit: "cover",
        type: "FOTO REFERENSI"
      }
    ]
  },
  {
    title: "Challenger Deep",
    kicker: "REKOR & EKSTREM",
    subtitle: "Titik terdalam yang diketahui di samudra Bumi",
    region: "Palung Mariana · Pasifik Barat",
    summary: "Challenger Deep berada di bagian selatan Palung Mariana. Lokasinya tidak terlihat sebagai celah raksasa dari foto satelit biasa, jadi visual pendukung memakai data batimetri yang memang memetakan dasar laut.",
    context: "Kedalaman laut diukur terhadap muka laut dan ditentukan dengan kombinasi survei sonar, tekanan, serta koreksi oseanografi. Pengukuran modern memberi estimasi terdalam sekitar 10.935 meter.",
    facts: [
      "Estimasi NOAA untuk Challenger Deep sekitar 10.935 meter di bawah muka laut.",
      "Kedalamannya lebih besar daripada elevasi Everest di atas muka laut.",
      "Peta warna pada visual adalah batimetri ilmiah, bukan foto optik dasar samudra."
    ],
    source: "https://oceanservice.noaa.gov/facts/oceandepth.html",
    sourceName: "NOAA Ocean Service",
    location: { latitude: 11.35, longitude: 142.20 },
    images: [
      {
        src: "https://omao.noaa.gov/sites/default/files/2025-12/survey%20area.png",
        alt: "Peta batimetri ilmiah wilayah Mariana dan Guam dari NOAA",
        credit: "Shannon Hoy, NOAA",
        source: "https://omao.noaa.gov/marine-operations/news-media/image/mariana-trench-survey-area",
        caption: "Batimetri wilayah Mariana · warna menunjukkan bentuk dasar laut",
        fit: "cover",
        type: "PETA BATIMETRI"
      }
    ]
  },
  {
    title: "Mauna Kea",
    kicker: "REKOR & EKSTREM",
    subtitle: "Raksasa yang sebagian besar tersembunyi di bawah laut",
    region: "Hawaiʻi · Samudra Pasifik",
    summary: "Mauna Kea menunjukkan kenapa kata tertinggi dan tertinggi dari dasar tidak selalu berarti hal yang sama. Sebagian besar tubuh gunung ini berada di bawah Samudra Pasifik.",
    context: "USGS memperkirakan Mauna Kea sekitar 4.205 meter di atas muka laut dan memanjang sekitar 6.000 meter lagi sampai dasar samudra. Total dasar-ke-puncaknya hampir 10.211 meter.",
    facts: [
      "Puncaknya sekitar 4,2 kilometer di atas muka laut.",
      "Dari dasar samudra ke puncak, total tingginya hampir 10,2 kilometer.",
      "Everest tetap memegang rekor elevasi di atas muka laut."
    ],
    source: "https://www.usgs.gov/faqs/how-big-are-hawaiian-volcanoes",
    sourceName: "U.S. Geological Survey",
    location: { latitude: 19.8207, longitude: -155.4681 },
    images: [
      {
        src: "https://d9-wret.s3.us-west-2.amazonaws.com/assets/palladium/production/s3fs-public/thumbnails/image/maunakea2.jpg",
        alt: "Foto Mauna Kea di Hawaiʻi",
        credit: "Scot K. Izuka, USGS",
        source: "https://www.usgs.gov/media/images/mauna-kea-0",
        license: "Public Domain",
        caption: "Mauna Kea · gunung perisai Hawaiʻi",
        fit: "cover",
        type: "FOTO USGS"
      }
    ]
  },
  {
    title: "Vostok, Antarktika",
    kicker: "REKOR & EKSTREM",
    subtitle: "Rekor suhu terendah dari pengukuran langsung di permukaan",
    region: "Dataran Tinggi Antarktika Timur",
    summary: "Antarktika adalah laboratorium alam untuk dingin ekstrem. Rekor suhu udara terendah yang diakui WMO dari pengukuran langsung di permukaan tercatat di Stasiun Vostok.",
    context: "WMO membedakan pengukuran stasiun di permukaan dari estimasi suhu permukaan es berbasis satelit. Rekor stasiun yang diakui adalah -89,2 °C pada 21 Juli 1983.",
    facts: [
      "Rekor pengukuran darat WMO: -89,2 °C.",
      "Tercatat di Stasiun Vostok pada 21 Juli 1983.",
      "Lokasi berada jauh di interior Antarktika dan pada elevasi tinggi."
    ],
    source: "https://wmo.int/media/news/wmo-concludes-evaluation-of-possible-new-record-antarctic-temperature",
    sourceName: "World Meteorological Organization",
    location: { latitude: -78.4667, longitude: 106.8000 },
    images: [
      {
        src: "https://assets.science.nasa.gov/dynamicimage/assets/science/esd/eo/images/imagerecords/36000/36839/Antarctica_AMO_2009027_lrg.jpg?crop=faces%2Cfocalpoint&fit=clip&h=6144&w=6144",
        alt: "Mosaik satelit MODIS Antarktika dari NASA Earth Observatory",
        credit: "NASA MODIS Rapid Response Team, GSFC",
        source: "https://science.nasa.gov/earth/earth-observatory/antarctica-36839/",
        caption: "Antarktika · mosaik MODIS, bukan foto khusus Stasiun Vostok",
        fit: "cover",
        type: "CITRA SATELIT"
      }
    ]
  },
  {
    title: "Furnace Creek",
    kicker: "REKOR & EKSTREM",
    subtitle: "Lokasi rekor panas resmi WMO",
    region: "Death Valley · California, Amerika Serikat",
    summary: "Furnace Creek berada di Death Valley, cekungan gurun yang sangat panas dan rendah. WMO masih mencantumkan pengukuran 56,7 °C pada 10 Juli 1913 sebagai rekor suhu udara tertinggi resmi.",
    context: "Sebagian peneliti sejarah cuaca mempertanyakan akurasi sejumlah rekor lama. Karena itu ANTARA menampilkan statusnya secara jujur: 56,7 °C adalah rekor yang masih diakui WMO, bukan klaim bahwa perdebatan ilmiah sudah tertutup.",
    facts: [
      "Rekor resmi WMO: 56,7 °C pada 10 Juli 1913.",
      "Furnace Creek berada di Death Valley, California.",
      "Rekor lama ini tetap tercatat WMO sambil terbuka terhadap evaluasi bukti baru."
    ],
    source: "https://public.wmo.int/media/news/wmo-verifies-3rd-and-4th-hottest-temperature-recorded-earth",
    sourceName: "World Meteorological Organization",
    location: { latitude: 36.4667, longitude: -116.8500 },
    images: [
      {
        src: "https://www.nps.gov/deva/learn/news/images/130-F-54-C-thermometer_IMG_7890.jpg",
        alt: "Termometer luar ruang di Furnace Creek Visitor Center menunjukkan panas ekstrem",
        credit: "NPS / J. Jurado",
        source: "https://www.nps.gov/deva/learn/news/summer-2020-heat-records.htm",
        caption: "Furnace Creek · dokumentasi panas ekstrem 2020",
        fit: "cover",
        type: "FOTO DOKUMENTASI"
      }
    ]
  },
  {
    title: "Danau Baikal",
    kicker: "REKOR & EKSTREM",
    subtitle: "Danau terdalam di dunia",
    region: "Siberia · Rusia",
    summary: "Danau Baikal membentuk cekungan air tawar yang sangat dalam di Siberia. Kedalamannya mencapai sekitar 1,7 kilometer dan menjadikannya danau terdalam di dunia.",
    context: "Baikal juga sangat tua secara geologi. Citra satelit memperlihatkan bentuk danau memanjang di antara pegunungan, sementara angka kedalamannya berasal dari pengukuran batimetri, bukan dari warna foto.",
    facts: [
      "Kedalaman maksimum sekitar 1,7 kilometer.",
      "NASA menyebut Baikal sebagai danau terdalam di dunia.",
      "Danau ini terbentuk sekitar 25 juta tahun lalu menurut rujukan UNESCO yang dikutip NASA."
    ],
    source: "https://science.nasa.gov/earth/earth-observatory/lake-baikal-at-night-153110/",
    sourceName: "NASA Earth Observatory",
    location: { latitude: 53.50, longitude: 108.00 },
    images: [
      {
        src: "https://assets.science.nasa.gov/dynamicimage/assets/science/esd/eo/images/imagerecords/77000/77871/Russia_amo_2012125_lrg.jpg?crop=faces%2Cfocalpoint&fit=clip&h=4000&w=3200",
        alt: "Citra satelit MODIS Danau Baikal dan wilayah Siberia di sekitarnya",
        credit: "NASA Earth Observatory / Jeff Schmaltz",
        source: "https://science.nasa.gov/earth/earth-observatory/ice-melting-on-lake-baikal-77871/",
        caption: "Danau Baikal · citra MODIS saat es musim semi mencair",
        fit: "cover",
        type: "CITRA SATELIT"
      }
    ]
  }
];

// Earth owns the post-launch Earth view and the lightweight planet-to-planet travel bridge.
// The existing Mars renderer still owns the actual Mars arrival/exploration scene.
window.EarthScene = class EarthScene {
  constructor({ onNext } = {}) {
    this.element = document.getElementById("earth-scene");
    this.viewport = document.getElementById("earth-viewport");
    this.information = document.getElementById("earth-information");
    this.title = document.getElementById("earth-title");
    this.nextButton = document.getElementById("earth-next");
    this.motion = window.matchMedia("(prefers-reduced-motion: reduce)");
    this.onNext = typeof onNext === "function" ? onNext : () => {};
    this.active = false;
    this.time = 0;
    this.frame = null;
    this.mode = "pending";
    this.travelMode = null;
    this.travelStartedAt = 0;
    this.travelDuration = 6.2;
    this.travelRevealFired = false;
    this.travelCoveredFired = false;
    this.travelCompleteFired = false;
    this.travelCallbacks = {};
    this.travelTarget = "mars";
    this.travelTargetStartRotation = 0.9024;
    this.pointer = { x: 0, y: 0 };
    this.cameraOffset = { x: 0, y: 0 };
    this.tick = this.tick.bind(this);
    this.exploring = false;
    this.topicIndex = 0;
    this.pose = { yaw: 4.58, pitch: 0, roll: -0.18 };
    this.poseTarget = { ...this.pose };
    this.exploration = document.getElementById("earth-exploration");
    this.exploreButton = document.getElementById("earth-explore-button");
    this.marker = this.element.querySelector(".earth-location-dot");
    this.exploreButton.addEventListener("click", () => this.enterExploration());
    document.getElementById("earth-exploration-close").addEventListener("click", () => this.exitExploration());
    document.getElementById("earth-topic-prev").addEventListener("click", () => this.setExplorationStop(this.topicIndex - 1));
    document.getElementById("earth-topic-next").addEventListener("click", () => this.setExplorationStop(this.topicIndex + 1));
    const progress = document.getElementById("earth-topic-progress");
    progress.removeAttribute("aria-hidden");
    progress.replaceChildren(...EARTH_EXPLORATION_STOPS.map((stop, index) => {
      const button = document.createElement("button");
      button.type = "button";
      button.setAttribute("aria-label", stop.title);
      button.title = stop.title;
      button.addEventListener("click", () => this.setExplorationStop(index));
      return button;
    }));
    this.setExplorationStop(0);

    this.stars = Array.from({ length: 220 }, (_, n) => {
      const rand = seed => { const v = Math.sin(seed * 113.7 + 283.1) * 43758.5453; return v - Math.floor(v); };
      return { x: rand(n), y: rand(n + 300), z: rand(n + 600), size: rand(n + 900) };
    });

    this.nextButton.addEventListener("click", () => {
      if (this.active && !this.travelMode) this.onNext();
    });
    window.addEventListener("resize", () => { if (this.active) { this.resize(); this.render(); } });
    // Observe the actual scene box as viewport-unit layout settles after resizing.
    if (window.ResizeObserver) {
      this.sizeObserver = new ResizeObserver(() => {
        if (this.active) { this.resize(); this.render(); }
      });
      this.sizeObserver.observe(this.element.parentElement);
    }
    document.addEventListener("visibilitychange", () => {
      if (!this.active) return;
      cancelAnimationFrame(this.frame);
      this.frame = null;
      if (!document.hidden) { this.previous = performance.now(); this.tick(this.previous); }
    });
    this.motion.addEventListener("change", () => {
      if (!this.active) return;
      this.render();
      if (!this.motion.matches && !this.frame) { this.previous = performance.now(); this.tick(this.previous); }
    });
    this.element.addEventListener("pointermove", event => {
      if (event.pointerType !== "mouse" || this.motion.matches || this.travelMode) return;
      const rect = this.element.getBoundingClientRect();
      this.pointer.x = (event.clientX - rect.left) / rect.width - 0.5;
      this.pointer.y = (event.clientY - rect.top) / rect.height - 0.5;
    });
    this.element.addEventListener("pointerleave", () => { this.pointer.x = this.pointer.y = 0; });
  }


  wake() {
    if (this.active && !this.frame) { this.previous = performance.now(); this.tick(this.previous); }
  }

  enterExploration() {
    if (!this.active || this.travelMode || this.exploring) return;
    this.exploring = true;
    this.information.inert = true;
    this.exploration.inert = false;
    this.element.classList.add("is-exploring");
    this.setExplorationStop(this.topicIndex);
    document.getElementById("earth-topic-title").focus({ preventScroll: true });
  }

  exitExploration(focus = true) {
    this.exploring = false;
    this.exploration.inert = true;
    this.element.classList.remove("is-exploring");
    this.information.inert = false;
    this.marker.style.opacity = "0";
    if (focus) this.exploreButton.focus({ preventScroll: true });
    this.wake();
  }

  setExplorationStop(index) {
    this.topicIndex = Math.max(0, Math.min(EARTH_EXPLORATION_STOPS.length - 1, index));
    const stop = EARTH_EXPLORATION_STOPS[this.topicIndex];
    window.ExplorationMedia.render("earth", stop);
    const get = name => document.getElementById(`earth-topic-${name}`);
    get("title").textContent = stop.title;
    get("kicker").textContent = stop.kicker || "REKOR & EKSTREM";
    get("subtitle").textContent = stop.region || stop.subtitle;
    get("context-section").hidden = !stop.context;
    get("context").textContent = stop.context || "";
    get("facts-heading").hidden = false;
    this.marker.classList.add("is-relocating");
    this.marker.style.opacity = "0";
    document.getElementById("earth-marker-title").textContent = stop.location ? stop.title : "";
    document.getElementById("earth-marker-region").textContent = stop.region || "";
    get("summary").textContent = stop.summary;
    get("facts").replaceChildren(...stop.facts.map(text => { const li = document.createElement("li"); li.textContent = text; return li; }));
    get("scroll").scrollTop = 0;
    get("source").href = stop.source;
    get("source").textContent = `Sumber: ${stop.sourceName} ↗`;
    const photoSource = document.getElementById("earth-photo-source");
    photoSource.hidden = true;
    photoSource.removeAttribute("href");
    photoSource.textContent = "";
    get("current").textContent = String(this.topicIndex + 1).padStart(2, "0");
    get("total").textContent = String(EARTH_EXPLORATION_STOPS.length).padStart(2, "0");
    get("prev").disabled = this.topicIndex === 0;
    get("next").disabled = this.topicIndex === EARTH_EXPLORATION_STOPS.length - 1;
    [...get("progress").children].forEach((button, i) => {
      button.classList.toggle("is-active", i === this.topicIndex);
      button.setAttribute("aria-current", i === this.topicIndex ? "step" : "false");
    });
    this.exploration.classList.remove("is-switching");
    if (this.exploring) {
      void this.exploration.offsetWidth;
      this.exploration.classList.add("is-switching");
      document.getElementById("announcement").textContent = `Eksplorasi Bumi ${this.topicIndex + 1}: ${stop.title}.`;
    }
    if (stop.location) {
      // Blue Marble: u=(longitude+180)/360, v=(90-latitude)/180.
      // SphereGeometry local point: (cos(lat)cos(lon), sin(lat), -cos(lat)sin(lon)).
      // Rz * Rx(latitude) * Ry(-pi/2-longitude) brings it to the front (+Z).
      const yaw = -Math.PI / 2 - stop.location.longitude * Math.PI / 180;
      const delta = Math.atan2(Math.sin(yaw - this.pose.yaw), Math.cos(yaw - this.pose.yaw));
      this.poseTarget = { yaw: this.pose.yaw + delta, pitch: stop.location.latitude * Math.PI / 180, roll: 0 };
      if (this.motion.matches && this.active && this.exploring) {
        this.pose = { ...this.poseTarget };
        this.render();
      }
    }
    this.wake();
  }

  applyEarthPose() {
    const T = this.THREE;
    this.planet.quaternion.setFromEuler(new T.Euler(this.pose.pitch, this.pose.yaw, this.pose.roll, "ZXY"));
  }

  updateMarker() {
    const location = EARTH_EXPLORATION_STOPS[this.topicIndex].location;
    if (!this.exploring || !location || this.travelMode || this.mode !== "webgl") { this.marker.style.opacity = "0"; return; }
    const T = this.THREE, lat = location.latitude * Math.PI / 180, lon = location.longitude * Math.PI / 180;
    const normal = new T.Vector3(Math.cos(lat)*Math.cos(lon), Math.sin(lat), -Math.cos(lat)*Math.sin(lon)).applyQuaternion(this.planet.quaternion);
    const point = normal.clone().multiplyScalar(1.006).add(this.planetGroup.position);
    const visible = normal.dot(this.camera.position.clone().sub(point)) > 0;
    const settled = Math.abs(this.poseTarget.yaw-this.pose.yaw) + Math.abs(this.poseTarget.pitch-this.pose.pitch) < 0.025;
    point.project(this.camera);
    this.positionMarker((point.x+1)*this.width/2, (1-point.y)*this.height/2, visible && settled);
  }

  positionMarker(x, y, visible) {
    this.marker.style.left = `${x}px`;
    this.marker.style.top = `${y}px`;
    this.marker.classList.toggle("is-relocating", !visible);
    const placeLeft = !this.mobile && x + 250 > this.width - 20;
    this.marker.classList.toggle("is-left", placeLeft);
    this.marker.classList.toggle("is-below", y < (this.mobile ? 150 : 135));
    // Keep the narrow-screen label above the target and within the viewport.
    const labelWidth = Math.min(200, this.width - 32);
    const center = Math.max(16 + labelWidth/2, Math.min(this.width-16-labelWidth/2, x));
    this.marker.style.setProperty("--label-shift", `${center-x}px`);
    this.marker.style.opacity = visible ? ".9" : "0";
  }

  loadImage(src) {
    return new Promise((resolve, reject) => {
      const image = new Image();
      image.decoding = "async";
      image.onload = () => resolve(image);
      image.onerror = reject;
      image.src = src;
    });
  }

  makeVenusTravelSurface() {
    // Same deterministic procedural fallback used by VenusScene when the NASA
    // Magellan texture is unavailable. Keeping this local means the cinematic
    // bridge never depends on a network request before navigation can start.
    const canvas = document.createElement("canvas");
    canvas.width = 512; canvas.height = 256;
    const ctx = canvas.getContext("2d");
    const pixels = ctx.createImageData(512, 256);
    for (let y = 0; y < 256; y++) for (let x = 0; x < 512; x++) {
      const longitude = x / 512 * Math.PI * 2;
      const latitude = y / 256 * Math.PI;
      const large = Math.sin(longitude * 3 + Math.sin(latitude * 6)) * Math.cos(latitude * 5 + Math.sin(longitude * 2));
      const fine = Math.sin(longitude * 51 + Math.cos(latitude * 27)) * Math.sin(latitude * 43) * 8;
      const dust = 26 * large + fine;
      const polar = Math.pow(Math.abs(Math.cos(latitude)), 38) * 65;
      const i = (y * 512 + x) * 4;
      pixels.data.set([177 + dust + polar * 0.45, 125 + dust * 0.72 + polar * 0.38, 68 + dust * 0.42 + polar * 0.22, 255], i);
    }
    ctx.putImageData(pixels, 0, 0);
    return canvas;
  }

  setVenusTravelSurface(surface) {
    if (!surface) return;
    // The travel bridge must render the exact surface that VenusScene resolved.
    // This prevents a detailed Magellan Venus from being replaced by the 512×256
    // procedural bridge texture during the slide animation.
    this.venusSurface = surface;
    if (this.travelVenusTexture) {
      this.travelVenusTexture.image = surface;
      this.travelVenusTexture.needsUpdate = true;
    }
    if (this.travelVenusRelief) {
      this.travelVenusRelief.image = surface;
      this.travelVenusRelief.needsUpdate = true;
    }
    if (this.active && this.travelMode && this.travelTarget === "venus") this.renderTravel();
  }

  prepare() {
    if (this.loading) return this.loading;
    if (!this.venusSurface) this.venusSurface = this.makeVenusTravelSurface();
    this.loading = Promise.all([
      this.loadImage(EARTH_SURFACE_TEXTURE),
      this.loadImage(MARS_TRAVEL_TEXTURE),
      import("./assets/vendor/three/three.module.min.js")
    ])
      .then(([earthSurface, marsSurface, THREE]) => {
        this.surface = earthSurface;
        this.marsSurface = marsSurface;
        try { this.createThreeScene(THREE); }
        catch { this.createCanvasFallback(); }
        this.resize();
        if (this.renderer?.compileAsync) return this.renderer.compileAsync(this.scene, this.camera);
      })
      .catch(async () => {
        try {
          if (!this.surface) this.surface = await this.loadImage(EARTH_SURFACE_TEXTURE);
          if (!this.marsSurface) this.marsSurface = await this.loadImage(MARS_TRAVEL_TEXTURE);
          this.createCanvasFallback();
          this.resize();
        } catch {
          this.mode = "css";
          this.element.dataset.renderer = "css";
          this.viewport.innerHTML = '<div class="earth-emergency-sphere"></div>';
          this.resize();
        }
      })
      .finally(() => { if (this.active) this.render(); });
    return this.loading;
  }

  makeAtmosphere(THREE, color, strength = 0.26, radius = 1.024) {
    return new THREE.Mesh(new THREE.SphereGeometry(radius, 72, 48), new THREE.ShaderMaterial({
      transparent: true,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
      uniforms: { glowColor: { value: new THREE.Color(color) }, glowStrength: { value: strength } },
      vertexShader: `varying vec3 vWorld; varying vec3 vNormal;
        void main(){ vec4 world=modelMatrix*vec4(position,1.); vWorld=world.xyz;
        vNormal=normalize(mat3(modelMatrix)*normal); gl_Position=projectionMatrix*viewMatrix*world; }`,
      fragmentShader: `uniform vec3 glowColor; uniform float glowStrength; varying vec3 vWorld; varying vec3 vNormal;
        void main(){ vec3 n=normalize(vNormal); vec3 eye=normalize(cameraPosition-vWorld);
        float rim=pow(1.-max(dot(n,eye),0.),3.4);
        gl_FragColor=vec4(glowColor,rim*glowStrength); }`
    }));
  }

  createTexture(THREE, image, anisotropy) {
    const texture = new THREE.Texture(image);
    texture.needsUpdate = true;
    texture.colorSpace = THREE.SRGBColorSpace;
    texture.anisotropy = Math.min(anisotropy, this.renderer.capabilities.getMaxAnisotropy());
    return texture;
  }

  createThreeScene(THREE) {
    const canvas = document.createElement("canvas");
    const context = canvas.getContext("webgl2", { alpha: true, antialias: true, powerPreference: "high-performance" });
    if (!context) throw new Error("WebGL2 unavailable");

    this.THREE = THREE;
    this.renderer = new THREE.WebGLRenderer({ canvas, context, alpha: true, antialias: true });
    this.renderer.setClearColor(0x030812, 0);
    this.renderer.setPixelRatio(Math.min(devicePixelRatio || 1, 1.6));
    this.renderer.outputColorSpace = THREE.SRGBColorSpace;
    this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
    this.renderer.toneMappingExposure = 1.04;
    this.viewport.replaceChildren(canvas);

    this.scene = new THREE.Scene();
    this.camera = new THREE.PerspectiveCamera(36, 1, 0.1, 450);
    this.camera.position.z = 6;

    const sphere = new THREE.SphereGeometry(1, 128, 96);
    const earthTexture = this.createTexture(THREE, this.surface, 8);
    const earthMaterial = new THREE.MeshStandardMaterial({
      map: earthTexture,
      roughness: 0.76,
      metalness: 0,
      transparent: true,
      opacity: 1
    });
    this.planet = new THREE.Mesh(sphere, earthMaterial);
    this.planetGroup = new THREE.Group();
    this.planetGroup.add(this.planet);
    this.atmosphere = this.makeAtmosphere(THREE, 0x3e8fe7, 0.25, 1.025);
    this.planetGroup.add(this.atmosphere);
    this.scene.add(this.planetGroup);

    const marsTexture = this.createTexture(THREE, this.marsSurface, 8);
    this.travelMarsMaterial = new THREE.MeshStandardMaterial({
      map: marsTexture,
      roughness: 0.96,
      metalness: 0,
      transparent: true,
      opacity: 0
    });
    this.travelMars = new THREE.Mesh(sphere.clone(), this.travelMarsMaterial);
    this.travelMarsGroup = new THREE.Group();
    this.travelMarsGroup.add(this.travelMars);
    this.travelMarsAtmosphere = this.makeAtmosphere(THREE, 0xb96542, 0.095, 1.018);
    this.travelMarsAtmosphere.material.opacity = 0;
    this.travelMarsGroup.add(this.travelMarsAtmosphere);
    this.travelMarsGroup.visible = false;
    this.scene.add(this.travelMarsGroup);

    this.travelVenusTexture = this.createTexture(THREE, this.venusSurface, 8);
    this.travelVenusRelief = this.travelVenusTexture.clone();
    this.travelVenusRelief.colorSpace = THREE.NoColorSpace;
    this.travelVenusRelief.needsUpdate = true;
    this.travelVenusMaterial = new THREE.MeshStandardMaterial({
      map: this.travelVenusTexture,
      bumpMap: this.travelVenusRelief,
      bumpScale: 0.018,
      roughness: 0.98,
      metalness: 0,
      transparent: true,
      opacity: 0
    });
    this.travelVenus = new THREE.Mesh(sphere.clone(), this.travelVenusMaterial);
    this.travelVenusGroup = new THREE.Group();
    this.travelVenusGroup.add(this.travelVenus);
    this.travelVenusAtmosphere = this.makeAtmosphere(THREE, 0xd5a05e, 0.12, 1.018);
    this.travelVenusAtmosphere.material.opacity = 0;
    this.travelVenusGroup.add(this.travelVenusAtmosphere);
    this.travelVenusGroup.visible = false;
    this.scene.add(this.travelVenusGroup);

    const sun = new THREE.DirectionalLight(0xffefd7, 3.35);
    sun.position.set(-4.8, 2.9, 4.6);
    this.scene.add(sun);
    this.scene.add(new THREE.AmbientLight(0x54759f, 0.095));
    const fill = new THREE.DirectionalLight(0x2c5c92, 0.10);
    fill.position.set(3, -1.5, -2);
    this.scene.add(fill);

    const positions = new Float32Array(this.stars.length * 3);
    this.stars.forEach((star, i) => positions.set([(star.x - 0.5) * 190, (star.y - 0.5) * 140, -20 - star.z * 160], i * 3));
    const geometry = new THREE.BufferGeometry();
    geometry.setAttribute("position", new THREE.BufferAttribute(positions, 3));
    this.starfield = new THREE.Points(geometry, new THREE.PointsMaterial({
      color: 0xb5c6dc,
      size: 0.13,
      transparent: true,
      opacity: 0.52,
      depthWrite: false,
      sizeAttenuation: true
    }));
    this.scene.add(this.starfield);

    canvas.addEventListener("webglcontextlost", event => {
      event.preventDefault();
      this.createCanvasFallback();
      this.resize();
      if (this.active) this.render();
    }, { once: true });

    this.mode = "webgl";
    this.element.dataset.renderer = this.mode;
  }

  createCanvasFallback() {
    this.renderer?.dispose();
    this.renderer = null;
    const canvas = document.createElement("canvas");
    const ctx = canvas.getContext("2d");
    if (!ctx) throw new Error("Canvas unavailable");
    this.canvas = canvas;
    this.ctx = ctx;
    // Use the same inverse spherical sampling as Mars, including latitude.
    const source = document.createElement("canvas");
    source.width = 1024; source.height = 512;
    const sourceContext = source.getContext("2d", { willReadFrequently: true });
    sourceContext.drawImage(this.surface, 0, 0, 1024, 512);
    this.surfacePixels = sourceContext.getImageData(0, 0, 1024, 512).data;
    this.sphereCanvas = document.createElement("canvas");
    this.sphereCanvas.width = this.sphereCanvas.height = 360;
    this.sphereContext = this.sphereCanvas.getContext("2d");
    this.sphereImage = this.sphereContext.createImageData(360, 360);
    this.viewport.replaceChildren(canvas);
    this.mode = "canvas";
    this.element.dataset.renderer = this.mode;
  }

  resize() {
    const parent = this.element.parentElement;
    this.width = parent.clientWidth;
    this.height = parent.clientHeight;
    this.mobile = this.width <= 700;
    const radius = this.mobile ? Math.min(this.width * 0.34, this.height * 0.20) : Math.min(this.height * 0.29, this.width * 0.23);
    this.finalRadius = radius;
    this.finalDistance = this.height / (2 * Math.tan(Math.PI / 10) * radius);

    if (this.mode === "webgl") {
      this.renderer.setSize(this.width, this.height);
      this.camera.aspect = this.width / this.height;
      this.camera.updateProjectionMatrix();
    } else if (this.mode === "canvas") {
      const dpr = Math.min(devicePixelRatio || 1, 1.5);
      this.canvas.width = this.width * dpr;
      this.canvas.height = this.height * dpr;
      this.ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    }
  }

  start({ settled = false } = {}) {
    this.exitExploration(false);
    this.active = true;
    this.time = settled ? 6 : 0;
    this.travelMode = null;
    this.travelCallbacks = {};
    this.travelCompleteFired = false;
    this.element.hidden = false;
    this.element.classList.remove("is-leaving");
    this.information.inert = !settled;
    this.information.classList.toggle("is-visible", settled);
    this.pointer.x = this.pointer.y = this.cameraOffset.x = this.cameraOffset.y = 0;
    this.prepare();
    this.resize();
    cancelAnimationFrame(this.frame);
    this.previous = performance.now();
    this.tick(this.previous);
  }

  beginTravelToPlanet(target, { onReveal, onComplete } = {}) {
    if (!this.active || this.travelMode || !["mars", "venus"].includes(target)) return;
    this.exitExploration(false);
    this.travelTarget = target;
    this.travelMode = `to-${target}`;
    this.travelStartedAt = this.time;
    this.travelDuration = this.motion.matches ? 0.4 : 6.2;
    this.travelRevealFired = false;
    this.travelCompleteFired = false;
    this.travelCallbacks = { onReveal, onComplete };
    this.element.classList.add("is-leaving");
    this.information.inert = true;
    this.pointer.x = this.pointer.y = 0;
    if (!this.frame) { this.previous = performance.now(); this.tick(this.previous); }
  }

  beginTravelToMars(callbacks = {}) {
    this.beginTravelToPlanet("mars", callbacks);
  }

  beginTravelToVenus(callbacks = {}) {
    this.beginTravelToPlanet("venus", callbacks);
  }

  beginTravelFromPlanet(target, { onCovered, onComplete, targetRotation } = {}) {
    if ((this.active && this.travelMode) || !["mars", "venus"].includes(target)) return;
    this.exitExploration(false);
    this.active = true;
    this.time = 0;
    this.travelTarget = target;
    this.travelMode = `to-earth-from-${target}`;
    this.travelStartedAt = 0;
    this.travelDuration = this.motion.matches ? 0.4 : 6.2;
    this.travelCoveredFired = false;
    this.travelCompleteFired = false;
    this.travelCallbacks = { onCovered, onComplete };
    this.travelTargetStartRotation = targetRotation ?? (target === "venus" ? 0.3984 : 0.9024);
    this.element.hidden = false;
    this.element.style.opacity = "0";
    this.element.classList.add("is-leaving");
    this.information.classList.remove("is-visible");
    this.information.inert = true;
    this.pointer.x = this.pointer.y = this.cameraOffset.x = this.cameraOffset.y = 0;
    this.prepare();
    this.resize();
    cancelAnimationFrame(this.frame);
    this.previous = performance.now();
    this.tick(this.previous);
  }

  beginTravelFromMars({ onCovered, onComplete, marsRotation = 0.9024 } = {}) {
    this.beginTravelFromPlanet("mars", { onCovered, onComplete, targetRotation: marsRotation });
  }

  beginTravelFromVenus({ onCovered, onComplete, venusRotation = 0.3984 } = {}) {
    this.beginTravelFromPlanet("venus", { onCovered, onComplete, targetRotation: venusRotation });
  }

  stop() {
    this.active = false;
    this.exitExploration(false);
    cancelAnimationFrame(this.frame);
    this.frame = null;
    this.element.hidden = true;
    this.element.style.opacity = "0";
    this.element.classList.remove("is-leaving");
    this.information.classList.remove("is-visible");
    this.information.inert = true;
    this.travelMode = null;
    this.travelCallbacks = {};
    this.time = 0;
  }

  tick(now) {
    this.frame = null;
    if (!this.active || document.hidden) return;
    const delta = Math.min((now - this.previous) / 1000, 0.15);
    this.previous = now;
    this.time += delta;
    const damping = 1 - Math.exp(-delta * 2);
    this.cameraOffset.x += (this.pointer.x - this.cameraOffset.x) * damping;
    this.cameraOffset.y += (this.pointer.y - this.cameraOffset.y) * damping;
    const location = EARTH_EXPLORATION_STOPS[this.topicIndex].location;
    if (!this.exploring || !location) this.poseTarget = { yaw: this.pose.yaw + (this.motion.matches ? 0 : delta * .026), pitch: 0, roll: -.18 };
    if (!this.exploring || !location) this.pose.yaw = this.poseTarget.yaw;
    const easing = this.motion.matches ? 1 : 1 - Math.exp(-delta * 3.5);
    for (const key of ["yaw", "pitch", "roll"]) this.pose[key] += (this.poseTarget[key] - this.pose[key]) * easing;
    this.render();
    if (!this.motion.matches || this.time < 8 || this.travelMode || this.mode === "pending") this.frame = requestAnimationFrame(this.tick);
  }

  clamp(value) { return Math.max(0, Math.min(1, value)); }
  smooth(value) {
    const v = this.clamp(value);
    return v * v * v * (v * (v * 6 - 15) + 10);
  }

  render() {
    if (this.travelMode) this.renderTravel();
    else this.renderEarth();
  }

  normalLayout() {
    const halfHeight = Math.tan(Math.PI / 10) * this.finalDistance;
    return {
      halfHeight,
      x: halfHeight * (this.camera?.aspect || this.width / this.height) * (this.mobile ? 0 : 0.23),
      y: halfHeight * (this.mobile ? 0.25 : 0.055)
    };
  }

  renderEarth() {
    const t = this.time;
    const reveal = this.motion.matches ? 1 : this.smooth(t / 1.55);
    const framing = this.motion.matches ? 1 : this.smooth((t - 0.15) / 4.9);
    const infoReveal = this.motion.matches ? 1 : this.smooth((t - 4.3) / 1.35);
    this.element.style.opacity = String(reveal);

    if (infoReveal > 0.02 && !this.information.classList.contains("is-visible")) {
      this.information.classList.add("is-visible");
      this.information.inert = this.exploring;
      document.getElementById("announcement").textContent = "Bumi, rumah kita. Planet ketiga dari Matahari.";
      if (!this.exploring && (document.activeElement === document.body || document.activeElement.id === "launch-button")) this.title.focus({ preventScroll: true });
    }

    const drift = this.motion.matches ? 0 : Math.sin(t * 0.32) * 0.025;
    const rotation = 4.58 + (this.motion.matches ? 0 : t * 0.026);
    const distance = this.finalDistance * (0.52 + framing * 0.48);

    if (this.mode === "webgl") {
      const layout = this.normalLayout();
      this.travelMarsGroup.visible = false;
      this.travelVenusGroup.visible = false;
      this.planetGroup.visible = true;
      this.planetGroup.position.set(layout.x * framing, layout.y * framing + drift, 0);
      this.applyEarthPose();
      const pointerStrength = 1 - infoReveal * 0.35;
      this.camera.position.set(
        this.motion.matches ? 0 : this.cameraOffset.x * 0.10 * pointerStrength,
        this.motion.matches ? 0 : -this.cameraOffset.y * 0.07 * pointerStrength,
        distance
      );
      this.camera.lookAt(0, 0, 0);
      this.planet.material.opacity = 1;
      this.atmosphere.material.uniforms.glowStrength.value = .25;
      this.renderer.render(this.scene, this.camera);
      this.updateMarker();
    } else if (this.mode === "canvas") {
      this.drawCanvasEarth(framing, rotation, distance, drift);
    } else if (this.mode === "css") {
      const planet = this.viewport.firstElementChild;
      if (!planet) return;
      const radius = this.finalRadius * this.finalDistance / distance;
      planet.style.width = planet.style.height = `${radius * 2}px`;
      planet.style.left = `${this.mobile ? 50 : 50 + 14 * framing}%`;
      planet.style.top = `${this.mobile ? 36 - 5 * framing : 50 - 3 * framing}%`;
      planet.style.backgroundPositionX = `${rotation * -95}px`;
      planet.style.transform = "translate(-50%, -50%) rotate(-10.3deg)";
    }
  }

  travelState() {
    const elapsed = this.time - this.travelStartedAt;
    const progress = this.smooth(elapsed / this.travelDuration);
    const pullback = this.smooth(progress / 0.31);
    const pan = this.smooth((progress - 0.23) / 0.39);
    const approach = this.smooth((progress - 0.58) / 0.42);
    return { elapsed, progress, pullback, pan, approach };
  }

  renderTravel() {
    // This is the original Earth → Mars travel timeline generalized only by
    // target planet and horizontal direction. Mars remains direction +1; Venus
    // uses direction -1. All phase timings, depth, easing and reveal thresholds
    // are intentionally shared 1:1.
    const state = this.travelState();
    const reverse = this.travelMode.startsWith("to-earth");
    const target = this.travelTarget === "venus" ? "venus" : "mars";
    const direction = target === "venus" ? -1 : 1;
    const layout = this.normalLayout();
    const aspect = this.camera?.aspect || this.width / this.height;
    const separationMagnitude = layout.halfHeight * aspect * (this.mobile ? 3.9 : 3.25);
    const separation = separationMagnitude * direction;
    const destinationX = layout.halfHeight * aspect * (this.mobile ? 0 : 0.28);
    const destinationY = layout.halfHeight * (this.mobile ? 0.28 : 0.10);
    const destinationCameraX = separation + layout.x - destinationX;
    const cameraX = destinationCameraX * (reverse ? 1 - state.pan : state.pan);
    const cameraZ = this.finalDistance * (1 + 1.55 * state.pullback * (1 - state.approach));
    const earthOpacity = reverse ? this.smooth((state.progress - 0.27) / 0.19) : 1;
    const targetOpacity = reverse ? 1 : this.smooth((state.progress - 0.28) / 0.20);
    const earthRotation = 4.72 + this.time * 0.024;
    const targetFinalRotation = target === "venus" ? 0.3984 : 0.9024;
    const targetStartRotation = 0.62;
    const targetRotation = reverse
      ? (this.travelTargetStartRotation ?? targetFinalRotation) + state.progress * 0.08
      : targetStartRotation + state.progress * (targetFinalRotation - targetStartRotation);
    const overlayOpacity = reverse ? this.smooth(state.progress / 0.075) : 1;
    this.element.style.opacity = String(overlayOpacity);

    if (!reverse && state.progress >= 0.86 && !this.travelRevealFired) {
      this.travelRevealFired = true;
      this.travelCallbacks.onReveal?.();
    }
    if (reverse && state.progress >= 0.10 && !this.travelCoveredFired) {
      this.travelCoveredFired = true;
      this.travelCallbacks.onCovered?.();
    }

    if (this.mode === "webgl") {
      const targetGroup = target === "venus" ? this.travelVenusGroup : this.travelMarsGroup;
      const otherGroup = target === "venus" ? this.travelMarsGroup : this.travelVenusGroup;
      const targetMesh = target === "venus" ? this.travelVenus : this.travelMars;
      const targetMaterial = target === "venus" ? this.travelVenusMaterial : this.travelMarsMaterial;
      const targetAtmosphere = target === "venus" ? this.travelVenusAtmosphere : this.travelMarsAtmosphere;
      const atmosphereStrength = target === "venus" ? 0.12 : 0.095;
      otherGroup.visible = false;
      this.planetGroup.visible = earthOpacity > 0.002;
      targetGroup.visible = targetOpacity > 0.002;
      this.planetGroup.position.set(layout.x, layout.y, 0);
      targetGroup.position.set(layout.x + separation, destinationY, 0);
      this.applyEarthPose();
      targetMesh.rotation.set(0.09, targetRotation, target === "venus" ? 0.12 : -0.07);
      this.planet.material.opacity = earthOpacity;
      this.atmosphere.material.uniforms.glowStrength.value = 0.25 * earthOpacity;
      targetMaterial.opacity = targetOpacity;
      targetAtmosphere.material.uniforms.glowStrength.value = atmosphereStrength * targetOpacity;

      this.camera.position.set(cameraX, 0, cameraZ);
      const lookOffset = Math.sin(state.pan * Math.PI) * separationMagnitude * 0.055 * direction * (reverse ? -1 : 1);
      this.camera.lookAt(cameraX + lookOffset, 0, 0);
      this.renderer.render(this.scene, this.camera);
    } else if (this.mode === "canvas") {
      this.drawCanvasTravel(state, reverse, earthOpacity, targetOpacity, target, direction);
    } else if (this.mode === "css") {
      const planet = this.viewport.firstElementChild;
      if (planet) {
        const radius = this.finalRadius * this.finalDistance / cameraZ;
        const screenPan = reverse ? 1 - state.pan : state.pan;
        planet.style.width = planet.style.height = `${radius * 2}px`;
        planet.style.left = `${64 - direction * screenPan * 95}%`;
        planet.style.top = "47%";
        planet.style.opacity = String(earthOpacity);
      }
    }

    if (state.progress >= 0.999 && !this.travelCompleteFired) {
      this.travelCompleteFired = true;
      const callback = this.travelCallbacks.onComplete;
      if (reverse) {
        this.travelMode = null;
        this.travelCallbacks = {};
        this.time = 6;
        this.element.classList.remove("is-leaving");
        this.element.style.opacity = "1";
        this.information.classList.add("is-visible");
        this.information.inert = false;
        document.getElementById("announcement").textContent = "Kembali ke Bumi.";
      }
      callback?.();
    }
  }

  drawTexturedDisc(image, cx, cy, radius, rotation, opacity, atmosphereColor) {
    if (!image || opacity <= 0.002) return;
    const ctx = this.ctx;
    ctx.save();
    ctx.globalAlpha = opacity;
    ctx.beginPath();
    ctx.arc(cx, cy, radius, 0, Math.PI * 2);
    ctx.clip();
    const sourceWidth = image.width;
    const shift = ((rotation / (Math.PI * 2)) % 1 + 1) % 1 * sourceWidth;
    const drawWidth = radius * Math.PI * 2;
    const x = cx - radius - (shift / sourceWidth) * drawWidth;
    ctx.drawImage(image, x, cy - radius, drawWidth, radius * 2);
    ctx.drawImage(image, x + drawWidth, cy - radius, drawWidth, radius * 2);
    const shade = ctx.createRadialGradient(cx - radius * 0.42, cy - radius * 0.28, radius * 0.04, cx, cy, radius * 1.08);
    shade.addColorStop(0, "rgba(255,245,225,.12)");
    shade.addColorStop(0.55, "rgba(12,28,48,.06)");
    shade.addColorStop(1, "rgba(0,3,10,.90)");
    ctx.fillStyle = shade;
    ctx.fillRect(cx - radius, cy - radius, radius * 2, radius * 2);
    ctx.restore();
    ctx.save();
    ctx.globalAlpha = opacity * 0.42;
    ctx.strokeStyle = atmosphereColor;
    ctx.lineWidth = Math.max(1, radius * 0.012);
    ctx.beginPath();
    ctx.arc(cx, cy, radius * 1.01, 0, Math.PI * 2);
    ctx.stroke();
    ctx.restore();
  }

  drawStars() {
    const ctx = this.ctx;
    for (const star of this.stars.slice(0, 110)) {
      ctx.fillStyle = `rgba(179,197,222,${0.12 + star.size * 0.35})`;
      ctx.fillRect(star.x * this.width, star.y * this.height, 0.5 + star.size, 0.5 + star.size);
    }
  }

  drawCanvasEarth(framing, rotation, distance, drift) {
    const ctx = this.ctx;
    const w = this.width;
    const h = this.height;
    ctx.clearRect(0, 0, w, h);
    this.drawStars();
    const radius = this.finalRadius * this.finalDistance / distance;
    const cx = w * (this.mobile ? 0.5 : 0.5 + 0.14 * framing);
    const cy = h * (this.mobile ? 0.36 - 0.05 * framing : 0.5 - 0.03 * framing) + drift * 18;
    const { yaw, pitch, roll } = this.pose;
    const cosYaw = Math.cos(yaw), sinYaw = Math.sin(yaw);
    const cosPitch = Math.cos(pitch), sinPitch = Math.sin(pitch);
    const cosRoll = Math.cos(roll), sinRoll = Math.sin(roll);
    const data = this.sphereImage.data;
    for (let y = 0; y < 360; y++) for (let x = 0; x < 360; x++) {
      const nx = (x + 0.5) / 180 - 1, ny = 1 - (y + 0.5) / 180;
      const r2 = nx * nx + ny * ny;
      const i = (y * 360 + x) * 4;
      if (r2 > 1) { data[i + 3] = 0; continue; }
      const nz = Math.sqrt(1 - r2);

      // Inverse of Rz(roll) * Rx(pitch) * Ry(yaw): screen normal -> Earth local.
      const zx = cosRoll * nx + sinRoll * ny;
      const zy = -sinRoll * nx + cosRoll * ny;
      const zz = nz;
      const px = zx;
      const py = cosPitch * zy + sinPitch * zz;
      const pz = -sinPitch * zy + cosPitch * zz;
      const lx = cosYaw * px - sinYaw * pz;
      const ly = py;
      const lz = sinYaw * px + cosYaw * pz;

      const longitude = Math.atan2(-lz, lx);
      const u = ((longitude + Math.PI) / (Math.PI * 2) + 1) % 1;
      const v = Math.acos(Math.max(-1, Math.min(1, ly))) / Math.PI;
      const sampleX = Math.min(1023, Math.max(0, Math.floor(u * 1024)));
      const sampleY = Math.min(511, Math.max(0, Math.floor(v * 512)));
      const j = (sampleY * 1024 + sampleX) * 4;
      const light = 0.045 + Math.max(0, nx * -0.6 + ny * 0.43 + nz * 0.67) * 1.12;
      data[i] = Math.min(255, this.surfacePixels[j] * light);
      data[i + 1] = Math.min(255, this.surfacePixels[j + 1] * light * 0.97);
      data[i + 2] = Math.min(255, this.surfacePixels[j + 2] * light * 0.93);
      data[i + 3] = Math.min(255, (1 - r2) * 180 * 255);
    }
    this.sphereContext.putImageData(this.sphereImage, 0, 0);
    ctx.drawImage(this.sphereCanvas, cx-radius, cy-radius, radius*2, radius*2);
    const location = EARTH_EXPLORATION_STOPS[this.topicIndex].location;
    const settled = Math.abs(this.poseTarget.yaw-yaw)+Math.abs(this.poseTarget.pitch-pitch) < .025;
    if (this.exploring && location && settled) {
      this.positionMarker(cx, cy, true);
    } else this.marker.style.opacity = "0";
  }

  drawCanvasTravel(state, reverse, earthOpacity, targetOpacity, target = "mars", direction = 1) {
    const ctx = this.ctx;
    const w = this.width;
    const h = this.height;
    ctx.clearRect(0, 0, w, h);
    this.drawStars();
    const cameraScale = 1 + 1.55 * state.pullback * (1 - state.approach);
    const radius = this.finalRadius / cameraScale;
    const pan = reverse ? 1 - state.pan : state.pan;
    const earthX = w * (this.mobile ? 0.5 : 0.64) - direction * pan * w * 1.08;
    const targetX = earthX + direction * w * 1.08;
    const cy = h * (this.mobile ? 0.36 : 0.47);
    const targetSurface = target === "venus" ? this.venusSurface : this.marsSurface;
    const targetRotation = target === "venus" ? 0.62 + this.time * -0.012 : 0.62 + this.time * 0.021;
    const targetAtmosphere = target === "venus" ? "rgba(214,166,98,.34)" : "rgba(212,117,76,.30)";
    this.drawTexturedDisc(this.surface, earthX, cy, radius, 4.72 + this.time * 0.024, earthOpacity, "rgba(80,160,255,.45)");
    this.drawTexturedDisc(targetSurface, targetX, cy, radius, targetRotation, targetOpacity, targetAtmosphere);
  }

};
