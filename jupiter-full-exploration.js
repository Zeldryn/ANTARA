"use strict";

(() => {
  const STORAGE_KEY = "antara-jupiter-full-quality-v1";
  const QUALITY = Object.freeze({
    LOW: { name: "LOW", label: "RENDAH", dpr: 1.0 },
    MEDIUM: { name: "MEDIUM", label: "SEDANG", dpr: 1.5 },
    HIGH: { name: "HIGH", label: "TINGGI", dpr: 2.0 }
  });

  const DESTINATIONS = Object.freeze([
    {
      id:"grs", name:"Great Red Spot", short:"GREAT RED SPOT", category:"BADAI RAKSASA", descriptor:"Terbang menembus tepi anticyclone raksasa", locationLabel:"Atmosfer selatan Jupiter · sekitar 22° LS",
      image:"assets/jupiter-great-red-spot.jpg", imageAlt:"Great Red Spot Jupiter", imageCaption:"Great Red Spot · referensi NASA/Juno", source:"https://science.nasa.gov/jupiter/jupiter-facts/",
      facts:["Great Red Spot adalah badai anticyclone raksasa yang telah diamati selama berabad-abad.","Awan Jupiter bergerak dalam jet timur-barat yang sangat cepat, sementara pusaran besar dapat bertahan lama.","Tidak ada tanah di bawahmu: semakin dalam, gas menjadi makin rapat, panas, dan bertekanan tinggi."],
      lead:"Masuk ke tepi Great Red Spot sebagai wahana atmosfer. Pusaran yang kamu lihat adalah visualisasi skala-terkompresi, bukan permukaan padat.", why:"Struktur pusaran membantu ilmuwan memahami bagaimana energi, konveksi, dan jet stream mempertahankan badai raksasa di planet tanpa permukaan padat.",
      preview:"grs", seed:31, spawn:[0,2,29], yaw:Math.PI, pitch:-.03, target:[0,0,-7], style:{sky:0x9f7358,fog:0xa2765b,cloud:0xe6c2a0,darkCloud:0x8d493d,brightCloud:0xffdfbc,deep:0x6c3b32,upper:0xd5a47c,band1:0xc97959,band2:0x834239,band3:0xe4b48b,band4:0x9b5d49}
    },
    {
      id:"jet-boundary", name:"Batas Belt & Zone", short:"BELT / ZONE", category:"JET STREAM", descriptor:"Dua pita atmosfer bergerak berlawanan arah", locationLabel:"Pita awan lintang menengah Jupiter",
      image:"assets/jupiter-global-card.jpg", imageAlt:"Pita awan Jupiter", imageCaption:"Belts & zones · referensi citra Jupiter", source:"https://science.nasa.gov/jupiter/jupiter-facts/",
      facts:["Pita gelap disebut belts dan pita terang disebut zones.","Jet stream di batas pita dapat bergerak ke arah berlawanan dan membentuk shear yang kuat.","Juno menemukan pola belts dan zones berlanjut sekitar 3.000 km ke bawah puncak awan."],
      lead:"Terbang sejajar dengan perbatasan dua aliran jet. Visual dibuat memanjang agar arah angin mudah dibaca saat kamu bergerak bebas.", why:"Batas belt-zone adalah tempat ideal untuk melihat shear, gelombang, dan pusaran kecil yang lahir dari perbedaan kecepatan angin.",
      preview:"bands", seed:73, spawn:[0,1,30], yaw:Math.PI, pitch:0, target:[0,0,-8], style:{sky:0xa78266,fog:0xae8769,cloud:0xe1c5a7,darkCloud:0x765248,brightCloud:0xf5e0c7,deep:0x755246,upper:0xd9b796,band1:0xd8b18e,band2:0x775044,band3:0xf0d3ad,band4:0x91634e}
    },
    {
      id:"ammonia-tower", name:"Awan Amonia Menjulang", short:"AMMONIA TOWER", category:"KONVEKSI AWAN", descriptor:"Menembus awan terang yang naik lebih tinggi", locationLabel:"Lapisan awan atas Jupiter",
      image:"assets/jupiter-atmosphere-diagram.svg", imageAlt:"Diagram atmosfer Jupiter", imageCaption:"Lapisan atmosfer Jupiter · visual edukasi ANTARA", source:"https://science.nasa.gov/photojournal/layered-swirls/",
      facts:["Puncak awan Jupiter diperkirakan didominasi kristal es amonia.","JunoCam melihat awan terang kecil yang menonjol lebih tinggi daripada awan di sekitarnya.","Lapisan awan Jupiter secara keseluruhan diperkirakan mencakup puluhan kilometer secara vertikal."],
      lead:"Terbang mengitari menara konvektif terang. Bentuk 3D ini adalah analog visual untuk awan yang menonjol di atas deck awan sekitarnya.", why:"Awan yang menjulang memberi petunjuk tentang udara yang naik, kondensasi, dan transfer panas dari atmosfer lebih dalam.",
      preview:"polar", seed:91, spawn:[0,3,29], yaw:Math.PI, pitch:.02, target:[0,6,-8], style:{sky:0x9c806d,fog:0xa88d78,cloud:0xe8ded1,darkCloud:0x807064,brightCloud:0xffffff,deep:0x6d5b54,upper:0xe9d9c6,band1:0xd5b99a,band2:0x817064,band3:0xeee2d3,band4:0x967c69}
    },
    {
      id:"water-lightning", name:"Badai Air & Kilat", short:"DEEP LIGHTNING", category:"BADAI DALAM", descriptor:"Turun menuju awan air dan kilat atmosfer", locationLabel:"Di bawah puncak awan terlihat",
      image:"assets/jupiter-atmosphere-diagram.svg", imageAlt:"Diagram lapisan awan Jupiter", imageCaption:"Lapisan awan · amonia, ammonium hydrosulfide, air", source:"https://science.nasa.gov/asset/hubble/probing-storm-systems-on-jupiter-graphic/",
      facts:["Kilat Jupiter terdeteksi pada badai konvektif dan dapat berasal dari lapisan awan air yang lebih dalam.","Juno juga menemukan shallow lightning pada ketinggian lebih tinggi daripada yang diperkirakan sebelumnya.","Semakin turun, tekanan dan suhu meningkat cepat sehingga wahana nyata akan menghadapi lingkungan yang makin ekstrem."],
      lead:"Turun ke lapisan yang lebih gelap dan aktif. Kilat menyala sesekali di sekitar awan badai untuk menandai konveksi kuat.", why:"Kilat adalah petunjuk langsung bahwa ada pemisahan muatan, konveksi, dan material kondensasi di dalam badai Jupiter.",
      preview:"grs", seed:127, spawn:[0,4,30], yaw:Math.PI, pitch:-.12, target:[0,-2,-8], style:{sky:0x58606b,fog:0x626a73,fogDensity:.032,cloud:0x8c9198,darkCloud:0x3f444c,brightCloud:0xc6d2dc,deep:0x343a43,upper:0x7d8389,band1:0x6e747b,band2:0x3e444b,band3:0x8c9297,band4:0x555c64}
    },
    {
      id:"hot-spot", name:"Hot Spot Atmosfer Dalam", short:"HOT SPOT", category:"JENDELA ATMOSFER", descriptor:"Celah awan menuju lapisan lebih hangat dan kering", locationLabel:"Hot spot dekat wilayah ekuatorial",
      image:"assets/jupiter-global-card.jpg", imageAlt:"Jupiter dan struktur awannya", imageCaption:"Atmosfer Jupiter · referensi NASA", source:"https://science.nasa.gov/photojournal/high-flying-cloud-in-jupiters-atmosphere/",
      facts:["Hot spot adalah celah pada deck awan yang memberi pandangan ke atmosfer yang lebih dalam.","Wilayah ini relatif lebih hangat dan kering daripada awan tebal di sekelilingnya.","Juno menggunakan pengamatan dekat untuk mempelajari struktur vertikal dan dinamika hot spot Jupiter."],
      lead:"Terbang menuju lubang gelap di deck awan. Cahaya hangat dari bawah dipakai sebagai gimmick visual untuk menegaskan bahwa kamu melihat lebih dalam, bukan menuju tanah.", why:"Hot spot membantu ilmuwan menembus lapisan awan atas dan menghubungkan cuaca yang terlihat dengan sirkulasi atmosfer di bawahnya.",
      preview:"bands", seed:163, spawn:[0,2,31], yaw:Math.PI, pitch:-.10, target:[0,-7,-9], style:{sky:0x8a654f,fog:0x8f674f,fogDensity:.029,cloud:0xc39875,darkCloud:0x5d3b31,brightCloud:0xe5bf95,deep:0x412a25,upper:0xb88b69,band1:0xb87a58,band2:0x644033,band3:0xd4a47c,band4:0x82523f}
    }
  ]);

  const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
  const delay = ms => new Promise(resolve => window.setTimeout(resolve, ms));

  class JupiterFullExploration {
    constructor(scene) {
      this.scene = scene;
      this.root = document.getElementById("jupiter-full-exploration");
      this.entryButton = document.getElementById("jupiter-full-explore-button");
      if (!scene || !this.root || !this.entryButton) return;
      this.viewportPlaceholder = null;
      this.viewportMounted = false;

      this.qualityPanel = document.getElementById("jupiter-quality-panel");
      this.qualityOptions = document.getElementById("jupiter-quality-options");
      this.qualityClose = document.getElementById("jupiter-quality-close");
      this.qualityStart = document.getElementById("jupiter-quality-start");
      this.qualityLabel = document.getElementById("jupiter-quality-selected-label");
      this.qualityNote = document.getElementById("jupiter-quality-device-note");
      this.selector = document.getElementById("jupiter-region-selector");
      this.selectorClose = document.getElementById("jupiter-region-selector-close");
      this.selectorGrid = document.getElementById("jupiter-region-grid");
      this.hudTarget = document.getElementById("jupiter-full-hud-location");
      this.hudView = document.getElementById("jupiter-full-hud-view");
      this.hudZoom = document.getElementById("jupiter-full-hud-zoom");
      this.hudType = document.getElementById("jupiter-full-hud-region-type");
      this.hudQuality = document.getElementById("jupiter-full-hud-quality");
      this.objectives = document.getElementById("jupiter-objectives-panel");
      this.objectivesList = document.getElementById("jupiter-objectives-list");
      this.objectivesCount = document.getElementById("jupiter-discovery-count");
      this.objectivesBar = document.getElementById("jupiter-discovery-bar");
      this.objectivesCollapse = document.getElementById("jupiter-objectives-collapse");
      this.objectivesToggle = document.getElementById("jupiter-objectives-toggle");
      this.nextTarget = document.getElementById("jupiter-next-target");
      this.nextTargetName = document.getElementById("jupiter-next-target-name");
      this.nextTargetDistance = document.getElementById("jupiter-next-target-distance");
      this.info = document.getElementById("jupiter-landmark-card");
      this.infoMinimize = document.getElementById("jupiter-landmark-minimize");
      this.infoToggle = document.getElementById("jupiter-info-toggle");
      this.infoName = document.getElementById("jupiter-landmark-name");
      this.infoType = document.getElementById("jupiter-landmark-type");
      this.infoCoords = document.getElementById("jupiter-landmark-coords");
      this.infoImage = document.getElementById("jupiter-landmark-image");
      this.infoCaption = document.getElementById("jupiter-landmark-image-caption");
      this.infoMedia = document.getElementById("jupiter-landmark-media");
      this.infoDescription = document.getElementById("jupiter-landmark-description");
      this.infoFacts = document.getElementById("jupiter-landmark-facts");
      this.infoSource = document.getElementById("jupiter-landmark-source");
      this.observationPrompt = document.getElementById("jupiter-observation-prompt");
      this.observationPromptTitle = document.getElementById("jupiter-observation-prompt-title");
      this.observeButton = document.getElementById("jupiter-observe-button");
      this.observationCard = document.getElementById("jupiter-observation-card");
      this.observationClose = document.getElementById("jupiter-observation-close");
      this.observationTitle = document.getElementById("jupiter-observation-title");
      this.observationMeta = document.getElementById("jupiter-observation-meta");
      this.observationLead = document.getElementById("jupiter-observation-lead");
      this.observationWhy = document.getElementById("jupiter-observation-why");
      this.observationDeep = document.getElementById("jupiter-observation-deep");
      this.observationSource = document.getElementById("jupiter-observation-source");
      this.observationStatus = document.getElementById("jupiter-observation-status");
      this.actionsRoot = this.root.querySelector(".venus-full-actions");
      this.actionsMenuToggle = document.getElementById("jupiter-actions-menu-toggle");
      this.actionsMenu = document.getElementById("jupiter-actions-menu");
      this.locationButton = document.getElementById("jupiter-location-toggle");
      this.fullscreenButton = document.getElementById("jupiter-fullscreen-toggle");
      this.exitButton = document.getElementById("jupiter-full-exit");
      this.loading = document.getElementById("jupiter-full-loading");
      this.loadingTitle = document.getElementById("jupiter-full-loading-title");
      this.loadingStatus = document.getElementById("jupiter-full-loading-status");
      this.loadingProgress = document.getElementById("jupiter-full-loading-progress");
      this.tutorial = document.getElementById("jupiter-full-tutorial");
      this.tutorialClose = document.getElementById("jupiter-tutorial-close");
      this.inputLayer = document.getElementById("jupiter-full-orbit-input");
      this.mobileControls = this.root.querySelectorAll("[data-jupiter-control]");

      this.state = "idle";
      this.current = null;
      this.selected = DESTINATIONS[0];
      this.discovered = new Set();
      try {
        const saved = JSON.parse(localStorage.getItem("antara-jupiter-full-discoveries-v2") || "[]");
        if (Array.isArray(saved)) saved.forEach(id => { if (DESTINATIONS.some(d => d.id === id)) this.discovered.add(id); });
      } catch {}
      this.objectiveOpen = true;
      this.infoOpen = false;
      this.actionsOpen = false;
      this.panelSnapshot = null;
      this.transitionToken = 0;
      this.promptTimer = null;
      this.drag = null;
      this.keyState = new Set();
      this.controlFrame = null;
      this.world = null;
      this.worldModule = null;
      this.boundaryHint = null;
      this.recommendedQuality = this.detectRecommendedQuality();
      this.quality = QUALITY[this.readQuality()] || QUALITY[this.recommendedQuality];

      this.buildSelector();
      this.buildObjectives();
      this.bind();
      this.applyQuality(this.quality.name, false);
      this.scene.fullExploration = this;
      this.scene.fullExplorationActive = false;
    }

    detectRecommendedQuality() {
      const memory = Number(navigator.deviceMemory || 4);
      const cores = Number(navigator.hardwareConcurrency || 4);
      const pixels = window.innerWidth * window.innerHeight * (window.devicePixelRatio || 1);
      if (memory <= 2 || cores <= 4 || pixels > 5500000) return "LOW";
      if (memory >= 8 && cores >= 8 && pixels < 5000000) return "HIGH";
      return "MEDIUM";
    }

    readQuality() {
      try { return localStorage.getItem(STORAGE_KEY) || this.recommendedQuality; } catch { return this.recommendedQuality; }
    }

    applyQuality(name, persist = true) {
      const key = QUALITY[name] ? name : this.recommendedQuality;
      this.quality = QUALITY[key];
      if (persist) { try { localStorage.setItem(STORAGE_KEY, key); } catch {} }
      this.scene.fullExplorationQualityDpr = this.quality.dpr;
      if (this.world) this.world.qualityName = this.quality.name;
      this.qualityOptions?.querySelectorAll("[data-jupiter-quality]").forEach(button => {
        const selected = button.dataset.jupiterQuality === key;
        button.classList.toggle("is-selected", selected);
        button.setAttribute("aria-checked", String(selected));
        const badge = button.querySelector("[data-quality-recommendation]");
        if (badge) badge.textContent = button.dataset.jupiterQuality === this.recommendedQuality ? "DIREKOMENDASIKAN" : "";
      });
      if (this.qualityLabel) this.qualityLabel.textContent = this.quality.label;
      if (this.hudQuality) this.hudQuality.textContent = this.quality.label;
      if (this.qualityNote) this.qualityNote.textContent = `Rekomendasi perangkat saat ini: ${QUALITY[this.recommendedQuality].label}. Mode ini mengatur kepadatan awan dan ketajaman renderer atmosfer Jupiter.`;
      this.scene.resize?.();
    }

    buildSelector() {
      const fragment = document.createDocumentFragment();
      DESTINATIONS.forEach((destination, index) => {
        const button = document.createElement("button");
        button.type = "button";
        button.className = "venus-region-card jupiter-region-card";
        button.dataset.jupiterRegion = destination.id;
        button.innerHTML = `<span class="venus-region-preview jupiter-region-preview jupiter-region-preview-${destination.preview}" aria-hidden="true"><i></i><b>${destination.short}</b></span><span class="venus-region-index">${String(index + 1).padStart(2, "0")}</span><strong>${destination.name}</strong><span class="venus-region-descriptor">${destination.descriptor}</span><small>${destination.locationLabel}</small><em>${destination.category}</em><span class="venus-region-source">NASA / JPL-Caltech · Juno / Galileo / Cassini</span>`;
        fragment.append(button);
      });
      this.selectorGrid?.replaceChildren(fragment);
      this.selectDestination(this.selected.id);
    }

    buildObjectives() {
      if (!this.objectivesList) return;
      const fragment = document.createDocumentFragment();
      DESTINATIONS.forEach((destination, index) => {
        const li = document.createElement("li");
        const done = this.discovered.has(destination.id);
        li.className = done ? "is-complete" : "";
        li.dataset.jupiterObjective = destination.id;
        li.innerHTML = `<span class="venus-objective-marker">${done ? "✓" : String(index + 1).padStart(2, "0")}</span><div><strong>${destination.name}</strong><small>${done ? "SUDAH DIAMATI" : destination.descriptor}</small></div>`;
        fragment.append(li);
      });
      this.objectivesList.replaceChildren(fragment);
      const count = this.discovered.size;
      if (this.objectivesCount) this.objectivesCount.textContent = `${count} / ${DESTINATIONS.length}`;
      if (this.objectivesBar) this.objectivesBar.style.width = `${count / DESTINATIONS.length * 100}%`;
      if (this.objectivesToggle) this.objectivesToggle.textContent = `Tujuan · ${count} / ${DESTINATIONS.length}`;
      const next = DESTINATIONS.find(item => !this.discovered.has(item.id));
      if (this.nextTarget) this.nextTarget.hidden = false;
      if (this.nextTargetName) this.nextTargetName.textContent = next ? next.name : "Semua tujuan selesai!";
      if (this.nextTargetDistance) this.nextTargetDistance.textContent = next ? "Pilih dari menu Wilayah untuk mengamati." : "Lima destinasi sistem Jupiter telah diamati.";
    }

    bind() {
      this.entryButton.addEventListener("click", () => this.openEntryFlow());
      this.qualityClose?.addEventListener("click", () => this.closeEntryFlow());
      this.qualityStart?.addEventListener("click", () => this.showSelector());
      this.qualityOptions?.addEventListener("click", event => {
        const button = event.target.closest("[data-jupiter-quality]");
        if (button) this.applyQuality(button.dataset.jupiterQuality);
      });
      this.selectorClose?.addEventListener("click", () => {
        if (this.state === "selecting-world") this.closeSelectorToWorld(); else this.closeEntryFlow();
      });
      this.selectorGrid?.addEventListener("click", event => {
        const button = event.target.closest("[data-jupiter-region]");
        if (!button) return;
        const destination = DESTINATIONS.find(item => item.id === button.dataset.jupiterRegion);
        if (!destination) return;
        this.selectDestination(destination.id);
        if (this.state === "selecting-world") {
          if (this.current?.id === destination.id) {
            this.closeSelectorToWorld();
            this.showInfo(true);
          } else void this.switchDestination(destination);
        } else void this.enter(destination);
      });
      this.infoMinimize?.addEventListener("click", () => { this.infoOpen = false; this.syncPanels(); });
      this.infoToggle?.addEventListener("click", () => this.showInfo(true));
      this.objectivesCollapse?.addEventListener("click", () => { this.objectiveOpen = false; this.syncPanels(); });
      this.objectivesToggle?.addEventListener("click", () => { this.objectiveOpen = true; this.syncPanels(); });
      this.observeButton?.addEventListener("click", () => this.observeCurrent());
      this.observationClose?.addEventListener("click", () => this.closeObservation());
      this.actionsMenuToggle?.addEventListener("click", event => { event.stopPropagation(); this.setActionsMenu(!this.actionsOpen); });
      this.locationButton?.addEventListener("click", () => { this.setActionsMenu(false); this.openSelectorFromWorld(); });
      this.fullscreenButton?.addEventListener("click", () => { this.setActionsMenu(false); this.toggleFullscreen(); });
      this.exitButton?.addEventListener("click", () => { this.setActionsMenu(false); void this.exit(); });
      this.tutorialClose?.addEventListener("click", () => this.hideTutorial(true));
      document.addEventListener("fullscreenchange", () => this.updateFullscreenLabel());
      document.addEventListener("pointerdown", event => {
        if (this.actionsOpen && !this.actionsRoot?.contains(event.target)) this.setActionsMenu(false);
      });
      this.bindOrbitInput();
    }

    bindOrbitInput() {
      const activeKey = key => ["KeyW", "KeyA", "KeyS", "KeyD", "KeyQ", "KeyE", "ShiftLeft", "ShiftRight", "ArrowUp", "ArrowDown", "ArrowLeft", "ArrowRight"].includes(key);
      document.addEventListener("keydown", event => {
        if (!this.scene.fullExplorationActive || this.state !== "exploring") return;
        if (event.key === "Escape") {
          event.preventDefault(); event.stopImmediatePropagation();
          if (!this.observationCard.hidden) return this.closeObservation();
          if (this.actionsOpen) return this.setActionsMenu(false);
          if (this.infoOpen) { this.infoOpen = false; this.syncPanels(); return; }
          if (this.objectiveOpen) { this.objectiveOpen = false; this.syncPanels(); return; }
          void this.exit();
          return;
        }
        if (!activeKey(event.code)) return;
        if (!this.observationCard.hidden) { event.preventDefault(); event.stopImmediatePropagation(); return; }
        const mobileUi = matchMedia("(max-width: 820px), (pointer: coarse) and (max-width: 1100px)").matches;
        const promptInteractive = !this.observationPrompt.hidden && !(mobileUi && (this.infoOpen || this.objectiveOpen || this.actionsOpen));
        if (event.code === "KeyE" && promptInteractive) {
          event.preventDefault(); event.stopImmediatePropagation(); this.observeCurrent(); return;
        }
        event.preventDefault(); event.stopImmediatePropagation();
        this.keyState.add(event.code);
        this.startControlLoop();
      }, true);
      document.addEventListener("keyup", event => this.keyState.delete(event.code), true);

      this.mobileControls.forEach(button => {
        const control = button.dataset.jupiterControl;
        const code = ({ forward:"KeyW", backward:"KeyS", left:"KeyA", right:"KeyD", up:"KeyE", down:"KeyQ" })[control];
        if (!code) return;
        const release = event => { this.keyState.delete(code); try { button.releasePointerCapture(event.pointerId); } catch {} };
        button.addEventListener("pointerdown", event => {
          event.preventDefault(); event.stopPropagation();
          if (!this.observationCard.hidden || this.state !== "exploring") return;
          try { button.setPointerCapture(event.pointerId); } catch {}
          this.keyState.add(code); this.startControlLoop();
        });
        button.addEventListener("pointerup", release);
        button.addEventListener("pointercancel", release);
        button.addEventListener("lostpointercapture", () => this.keyState.delete(code));
      });

      this.inputLayer?.addEventListener("pointerdown", event => {
        if (event.target !== this.inputLayer || this.state !== "exploring" || !this.observationCard.hidden) return;
        this.drag = { id:event.pointerId, x:event.clientX, y:event.clientY };
        try { this.inputLayer.setPointerCapture(event.pointerId); } catch {}
      });
      this.inputLayer?.addEventListener("pointermove", event => {
        if (!this.drag || this.drag.id !== event.pointerId || this.state !== "exploring") return;
        const dx = event.clientX - this.drag.x, dy = event.clientY - this.drag.y;
        this.drag.x = event.clientX; this.drag.y = event.clientY;
        this.world?.addLook(dx, dy);
      });
      const endDrag = event => { if (this.drag?.id === event.pointerId) this.drag = null; };
      this.inputLayer?.addEventListener("pointerup", endDrag);
      this.inputLayer?.addEventListener("pointercancel", endDrag);
    }

    startControlLoop() {
      if (this.controlFrame) return;
      let previous = performance.now();
      const tick = now => {
        this.controlFrame = null;
        if (!this.scene.fullExplorationActive || this.state !== "exploring") { this.keyState.clear(); return; }
        const dt = Math.min(.05, Math.max(.001, (now - previous) / 1000)); previous = now;
        if (this.observationCard.hidden) this.world?.tick(dt, this.keyState); else this.world?.tick(dt, new Set());
        this.updateHud();
        this.updateNearbyObservation();
        this.controlFrame = requestAnimationFrame(tick);
      };
      this.controlFrame = requestAnimationFrame(tick);
    }

    nudgeView(yawDelta, pitchDelta) {
      if (!this.world) return;
      this.world.yaw += yawDelta;
      this.world.pitch = clamp(this.world.pitch + pitchDelta, -1.25, 1.25);
      this.world.look();
    }

    async ensureWorld() {
      if (!this.worldModule) this.worldModule = await import("./jupiter-atmosphere-world.js");
      if (!this.world) this.world = new this.worldModule.JupiterAtmosphereWorld(this.root, this.quality.name);
      this.world.qualityName = this.quality.name;
      await this.world.init();
      return this.world;
    }

    updateNearbyObservation() {
      if (!this.current || !this.world || this.state !== "exploring" || this.discovered.has(this.current.id)) return;
      const distance = this.world.distanceToTarget();
      const close = distance < 18;
      if (this.nextTargetDistance) this.nextTargetDistance.textContent = close ? `Target dekat · ${distance.toFixed(0)} unit` : `Terbang mendekat · ${distance.toFixed(0)} unit`;
      if (close && this.observationPrompt.hidden && this.observationCard.hidden) {
        this.observationPromptTitle.textContent = this.current.name;
        this.observationPrompt.hidden = false;
      } else if (!close && !this.observationPrompt.hidden) {
        this.observationPrompt.hidden = true;
      }
    }

    clearHeldControls() {
      this.keyState.clear();
      this.drag = null;
      if (this.controlFrame) cancelAnimationFrame(this.controlFrame);
      this.controlFrame = null;
    }

    mountSceneViewport() {
      this.viewportMounted = false;
    }

    restoreSceneViewport() {
      this.viewportMounted = false;
    }

    selectDestination(id) {
      this.selected = DESTINATIONS.find(item => item.id === id) || DESTINATIONS[0];
      this.selectorGrid?.querySelectorAll("[data-jupiter-region]").forEach(button => {
        const selected = button.dataset.jupiterRegion === this.selected.id;
        button.classList.toggle("is-selected", selected);
        button.setAttribute("aria-pressed", String(selected));
      });
    }

    openEntryFlow() {
      if (!this.scene.active || this.scene.travelMode || this.scene.fullExplorationActive) return;
      if (this.scene.exploring) this.scene.exitExploration();
      this.state = "configuring";
      this.scene.fullExplorationActive = true;
      this.scene.element.classList.add("is-jupiter-full-active");
      this.root.hidden = false;
      this.root.inert = false;
      this.root.setAttribute("aria-hidden", "false");
      this.mountSceneViewport();
      this.entryButton.disabled = true;
      this.qualityPanel.hidden = false;
      this.selector.hidden = true;
      this.hideWorldUi();
      document.getElementById("announcement").textContent = "Pilih kualitas grafis untuk Eksplorasi Pengalaman Penuh Jupiter.";
    }

    closeEntryFlow() {
      if (!["configuring", "selecting"].includes(this.state)) return;
      this.state = "idle";
      this.world?.dispose?.(); this.world = null;
      this.scene.fullExplorationActive = false;
      this.scene.element.classList.remove("is-jupiter-full-active");
      this.restoreSceneViewport();
      this.root.hidden = true;
      this.root.inert = true;
      this.root.setAttribute("aria-hidden", "true");
      this.qualityPanel.hidden = true;
      this.selector.hidden = true;
      this.entryButton.disabled = false;
      this.scene.caption.inert = false;
      requestAnimationFrame(() => this.entryButton.focus({ preventScroll:true }));
    }

    showSelector() {
      if (this.state !== "configuring") return;
      this.applyQuality(this.quality.name);
      this.state = "selecting";
      this.qualityPanel.hidden = true;
      this.selector.hidden = false;
      document.getElementById("announcement").textContent = "Pilih destinasi sistem Jupiter.";
    }

    async enter(destination) {
      if (!["selecting", "configuring"].includes(this.state)) return;
      const token = ++this.transitionToken;
      this.current = destination || this.selected;
      this.state = "switching";
      this.selector.hidden = true;
      this.qualityPanel.hidden = true;
      this.showLoading(`MEMASUKI ${this.current.name.toUpperCase()}`, "MEMBANGUN VOLUME ATMOSFER", 16);
      try {
        const world = await this.ensureWorld();
        if (token !== this.transitionToken) return;
        await world.build(this.current);
        if (token !== this.transitionToken) return;
        await this.loadingSequence(token, this.current.name);
        if (token !== this.transitionToken) return;
      } catch (error) {
        console.error("Jupiter atmosphere build failed", error);
        this.loadingStatus.textContent = "GAGAL MEMUAT RENDERER ATMOSFER";
        return;
      }
      this.state = "exploring";
      this.loading.hidden = true;
      this.root.classList.add("is-exploring");
      this.objectiveOpen = true;
      this.infoOpen = true;
      this.updateInfo();
      this.buildObjectives();
      this.syncPanels();
      this.showTutorial();
      this.startControlLoop();
      this.updateNearbyObservation();
      document.getElementById("announcement").textContent = `Masuk ke atmosfer ${this.current.name}. Gunakan WASD untuk terbang dan Q/E untuk turun-naik.`;
    }

    async loadingSequence(token, label) {
      const reduced = matchMedia("(prefers-reduced-motion: reduce)").matches;
      const stages = reduced ? [[100, 80]] : [[34, 260], [62, 290], [84, 300], [100, 260]];
      const text = ["MEMUAT DATA NASA / JUNO", "MENGATUR KAMERA", "MENGUNCI TARGET", "SIAP MENGAMATI"];
      for (let i = 0; i < stages.length; i++) {
        if (token !== this.transitionToken) return;
        this.loadingStatus.textContent = text[Math.min(i, text.length - 1)];
        this.loadingProgress.style.width = `${stages[i][0]}%`;
        await delay(stages[i][1]);
      }
      if (this.loadingTitle) this.loadingTitle.textContent = label;
    }

    showLoading(title, status, progress = 10) {
      this.loading.hidden = false;
      if (this.loadingTitle) this.loadingTitle.textContent = title;
      this.loadingStatus.textContent = status;
      this.loadingProgress.style.width = `${progress}%`;
      this.hideWorldUi();
    }

    openSelectorFromWorld() {
      if (this.state !== "exploring") return;
      this.clearHeldControls();
      this.panelSnapshot = { infoOpen: this.infoOpen, objectiveOpen: this.objectiveOpen };
      this.state = "selecting-world";
      this.selectDestination(this.current?.id || this.selected.id);
      this.selector.hidden = false;
      this.infoOpen = false;
      this.objectiveOpen = false;
      this.hideObservationPrompt();
      this.closeObservation();
      this.syncPanels();
    }

    closeSelectorToWorld() {
      if (this.state !== "selecting-world") return;
      this.state = "exploring";
      this.selector.hidden = true;
      this.infoOpen = this.panelSnapshot?.infoOpen ?? true;
      this.objectiveOpen = this.panelSnapshot?.objectiveOpen ?? true;
      this.panelSnapshot = null;
      this.syncPanels();
      this.startControlLoop();
      this.scheduleObservationPrompt();
    }

    async switchDestination(destination) {
      if (this.state !== "selecting-world") return;
      const token = ++this.transitionToken;
      this.clearHeldControls();
      this.panelSnapshot = null;
      this.state = "switching";
      this.selector.hidden = true;
      this.current = destination;
      this.selectDestination(destination.id);
      this.showLoading(`TERBANG KE ${destination.name.toUpperCase()}`, "MEMBANGUN ZONA ATMOSFER", 14);
      try {
        const world = await this.ensureWorld();
        await world.build(destination);
        await this.loadingSequence(token, destination.name);
      } catch (error) { console.error(error); return; }
      if (token !== this.transitionToken) return;
      this.state = "exploring";
      this.loading.hidden = true;
      this.infoOpen = true;
      this.objectiveOpen = true;
      this.updateInfo();
      this.buildObjectives();
      this.syncPanels();
      this.startControlLoop();
      this.updateNearbyObservation();
      document.getElementById("announcement").textContent = `Tiba di zona atmosfer ${destination.name}.`;
    }

    updateInfo() {
      if (!this.current) return;
      const d = this.current;
      this.infoName.textContent = d.name;
      this.infoType.textContent = `${d.category} · ${d.descriptor}`;
      this.infoCoords.textContent = d.locationLabel;
      this.infoImage.src = d.image;
      this.infoImage.alt = d.imageAlt;
      this.infoCaption.textContent = d.imageCaption;
      this.infoMedia.href = d.source;
      this.infoDescription.textContent = d.lead;
      this.infoFacts.replaceChildren(...d.facts.map(fact => { const li = document.createElement("li"); li.textContent = fact; return li; }));
      this.infoSource.href = d.source;
      this.hudTarget.textContent = d.name;
      this.hudType.textContent = d.category;
      this.updateHud();
    }

    updateHud() {
      if (!this.current || !this.world?.camera) return;
      const c = this.world.camera.position;
      const yaw = (this.world.yaw * 180 / Math.PI % 360 + 360) % 360;
      if (this.hudView) this.hudView.textContent = `${yaw.toFixed(0)}° · ALT ${c.y.toFixed(1)}`;
      if (this.hudZoom) this.hudZoom.textContent = `${Math.hypot(this.world.velocity?.x||0,this.world.velocity?.y||0,this.world.velocity?.z||0).toFixed(1)} u/s`;
      if (this.hudType) this.hudType.textContent = this.world.boundaryStrength > .55 ? "MENDEKATI BATAS" : this.current.category;
    }

    syncPanels() {
      const exploring = this.state === "exploring";
      const observationOpen = !this.observationCard.hidden;
      const showInfo = exploring && this.infoOpen && !observationOpen;
      const showObjectives = exploring && this.objectiveOpen && !observationOpen;
      this.info.classList.toggle("is-visible", showInfo);
      this.info.hidden = !showInfo;
      this.info.setAttribute("aria-hidden", String(!showInfo));
      this.infoToggle.hidden = !exploring || this.infoOpen || observationOpen;
      this.objectives.hidden = !showObjectives;
      this.objectives.setAttribute("aria-hidden", String(!showObjectives));
      this.objectivesToggle.hidden = !exploring || this.objectiveOpen || observationOpen;
      this.actionsRoot.hidden = !exploring;
      this.root.classList.toggle("is-info-open", showInfo);
      this.root.classList.toggle("is-objectives-open", showObjectives);
      this.root.classList.toggle("is-observation-open", observationOpen);
    }

    showInfo(focus = false) {
      if (!this.current || this.state !== "exploring") return;
      this.infoOpen = true;
      this.syncPanels();
      if (focus) requestAnimationFrame(() => this.infoMinimize.focus({ preventScroll:true }));
    }

    scheduleObservationPrompt() {
      window.clearTimeout(this.promptTimer);
      this.hideObservationPrompt();
      this.updateNearbyObservation();
    }

    hideObservationPrompt() { this.observationPrompt.hidden = true; }

    observeCurrent() {
      if (!this.current || this.state !== "exploring") return;
      const d = this.current;
      const fresh = !this.discovered.has(d.id);
      this.discovered.add(d.id);
      try { localStorage.setItem("antara-jupiter-full-discoveries-v2", JSON.stringify([...this.discovered])); } catch {}
      if (fresh) window.AntaraProgress?.trackFull?.("jupiter", d.id, d.name);
      this.hideObservationPrompt();
      this.buildObjectives();
      this.observationTitle.textContent = d.name;
      this.observationMeta.textContent = `${d.category} · ${d.locationLabel}`;
      this.observationLead.textContent = d.lead;
      this.observationWhy.textContent = d.why;
      this.observationDeep.replaceChildren(...d.facts.map(fact => { const p = document.createElement("p"); p.textContent = fact; return p; }));
      this.observationSource.href = d.source;
      this.observationStatus.textContent = fresh ? "BARU KAMU AMATI" : "SUDAH PERNAH DIAMATI";
      this.clearHeldControls();
      this.observationCard.hidden = false;
      this.observationCard.setAttribute("aria-hidden", "false");
      this.syncPanels();
      document.getElementById("announcement").textContent = `${d.name} berhasil diamati. ${this.discovered.size} dari ${DESTINATIONS.length} tujuan selesai.`;
    }

    closeObservation() {
      if (!this.observationCard || this.observationCard.hidden) return;
      this.observationCard.hidden = true;
      this.observationCard.setAttribute("aria-hidden", "true");
      this.syncPanels();
      this.startControlLoop();
    }

    hideWorldUi() {
      this.clearHeldControls();
      this.infoOpen = false;
      this.objectiveOpen = false;
      this.actionsRoot.hidden = true;
      this.info.hidden = true;
      this.objectives.hidden = true;
      this.infoToggle.hidden = true;
      this.objectivesToggle.hidden = true;
      this.hideObservationPrompt();
      this.observationCard.hidden = true;
    }

    setActionsMenu(open) {
      const mobile = matchMedia("(max-width: 820px), (pointer: coarse) and (max-width: 1100px)").matches;
      this.actionsOpen = Boolean(open && mobile && this.state === "exploring");
      this.actionsRoot.classList.toggle("is-open", this.actionsOpen);
      this.root.classList.toggle("is-actions-open", this.actionsOpen);
      this.actionsMenuToggle.setAttribute("aria-expanded", String(this.actionsOpen));
    }

    async toggleFullscreen() {
      try {
        if (document.fullscreenElement) await document.exitFullscreen(); else await this.root.requestFullscreen();
      } catch {}
      this.updateFullscreenLabel();
    }

    updateFullscreenLabel() {
      const span = this.fullscreenButton?.querySelector("span");
      if (span) span.textContent = document.fullscreenElement ? "Keluar layar penuh" : "Layar penuh";
      this.fullscreenButton?.setAttribute("aria-pressed", String(Boolean(document.fullscreenElement)));
    }

    showTutorial() {
      let seen = false;
      try { seen = sessionStorage.getItem("antara-jupiter-full-tutorial") === "1"; } catch {}
      if (seen) return;
      this.tutorial.classList.add("is-visible");
      window.setTimeout(() => this.hideTutorial(false), 8500);
    }

    hideTutorial(persist = false) {
      this.tutorial.classList.remove("is-visible");
      if (persist) { try { sessionStorage.setItem("antara-jupiter-full-tutorial", "1"); } catch {} }
    }

    forceReset() {
      ++this.transitionToken;
      window.clearTimeout(this.promptTimer);
      this.clearHeldControls();
      this.setActionsMenu(false);
      this.hideTutorial(false);
      this.panelSnapshot = null;
      this.state = "idle";
      this.infoOpen = false;
      this.objectiveOpen = false;
      this.actionsOpen = false;
      this.root.classList.remove("is-exploring", "is-exiting", "is-info-open", "is-objectives-open");
      this.restoreSceneViewport();
      this.root.hidden = true;
      this.root.inert = true;
      this.root.setAttribute("aria-hidden", "true");
      this.qualityPanel.hidden = true;
      this.selector.hidden = true;
      this.loading.hidden = true;
      this.observationPrompt.hidden = true;
      this.observationCard.hidden = true;
      this.observationCard.setAttribute("aria-hidden", "true");
      this.info.hidden = true;
      this.objectives.hidden = true;
      this.infoToggle.hidden = true;
      this.objectivesToggle.hidden = true;
      this.actionsRoot.hidden = true;
      this.world?.dispose?.(); this.world = null;
      this.scene.fullExplorationActive = false;
      this.scene.element.classList.remove("is-jupiter-full-active");
      if ("fullExplorationPitch" in this.scene) this.scene.fullExplorationPitch = 0;
      this.entryButton.disabled = false;
      this.scene.caption.inert = false;
      this.scene.resize?.();
    }

    async animateAtmosphereExit(duration = 680) {
      if (!this.world?.camera) { await delay(duration); return; }
      const world = this.world;
      const start = performance.now();
      const THREE = world.THREE;
      const backward = new THREE.Vector3();
      world.camera.getWorldDirection(backward);
      backward.multiplyScalar(-1).normalize();
      const startPos = world.camera.position.clone();
      const endPos = startPos.clone().addScaledVector(backward, 18);
      endPos.y += 7;
      const fogStart = world.scene?.fog?.density || 0.025;
      await new Promise(resolve => {
        const frame = now => {
          const t = Math.min(1, (now - start) / duration);
          const e = 1 - Math.pow(1 - t, 3);
          world.camera.position.lerpVectors(startPos, endPos, e);
          if (world.scene?.fog) world.scene.fog.density = fogStart * (1 - e * .78);
          if (world.renderer) world.renderer.toneMappingExposure = .92 - e * .24;
          world.tick(.016, new Set());
          if (t < 1) requestAnimationFrame(frame); else resolve();
        };
        requestAnimationFrame(frame);
      });
    }

    async exit() {
      if (!this.scene.fullExplorationActive || ["exiting", "idle"].includes(this.state)) return;
      const token = ++this.transitionToken;
      this.state = "exiting";
      this.root.classList.add("is-exiting");
      this.hideWorldUi();
      this.keyState.clear();
      if (this.controlFrame) cancelAnimationFrame(this.controlFrame);
      this.controlFrame = null;
      if (matchMedia("(prefers-reduced-motion: reduce)").matches) await delay(80); else await this.animateAtmosphereExit(680);
      if (token !== this.transitionToken) return;
      this.world?.dispose(); this.world = null;
      this.root.classList.remove("is-exploring", "is-exiting");
      this.scene.fullExplorationActive = false;
      this.scene.element.classList.remove("is-jupiter-full-active");
      this.root.hidden = true; this.root.inert = true; this.root.setAttribute("aria-hidden", "true");
      this.state = "idle"; this.entryButton.disabled = false; this.scene.caption.inert = false;
      this.scene.resize?.();
      document.getElementById("announcement").textContent = "Kembali ke panorama Jupiter.";
      requestAnimationFrame(() => this.entryButton.focus({ preventScroll:true }));
    }

  }

  window.JupiterFullExploration = JupiterFullExploration;
  window.ANTARA_JUPITER_FULL_DESTINATIONS = DESTINATIONS;
})();
