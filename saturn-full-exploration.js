"use strict";

(() => {
  const STORAGE_KEY = "antara-saturn-full-quality-v1";
  const QUALITY = Object.freeze({
    LOW: { name: "LOW", label: "RENDAH", dpr: 1.0 },
    MEDIUM: { name: "MEDIUM", label: "SEDANG", dpr: 1.5 },
    HIGH: { name: "HIGH", label: "TINGGI", dpr: 2.0 }
  });

  const DESTINATIONS = Object.freeze([
    {
      id: "rings",
      name: "Cincin & Cassini Division",
      short: "CASSINI DIVISION",
      topicIndex: 2,
      category: "SISTEM CINCIN",
      descriptor: "Cincin A, celah Cassini, dan cincin B",
      locationLabel: "Orbit cincin utama Saturnus",
      image: "https://assets.science.nasa.gov/dynamicimage/assets/science/psd/photojournal/pia/pia06/pia06175/PIA06175.jpg?crop=faces%2Cfocalpoint&fit=clip&h=1000&w=5890",
      imageAlt: "Panorama sistem cincin Saturnus dari Cassini",
      imageCaption: "Cincin Saturnus · Cassini / NASA-JPL-SSI",
      source: "https://science.nasa.gov/mission/cassini/science/rings/",
      facts: [
        "Cincin utama Saturnus tersusun dari sangat banyak partikel es, batu, dan debu yang masing-masing mengorbit planet.",
        "Cassini Division adalah celah besar di antara cincin A dan B, tetapi celah itu sendiri masih mengandung material cincin yang jauh lebih renggang.",
        "Walaupun sistem cincin membentang sangat lebar, banyak bagian cincin utama hanya setebal puluhan meter."
      ],
      lead: "Dari dekat, cincin Saturnus bukan satu piringan padat. Ia adalah lalu lintas orbital raksasa yang dibentuk gravitasi, resonansi, dan jutaan struktur kecil.",
      why: "Cincin memberi ilmuwan laboratorium alami untuk mempelajari bagaimana partikel yang mengorbit saling berinteraksi dan bagaimana resonansi gravitasi membentuk celah serta gelombang.",
      preview: "rings"
    },
    {
      id: "hexagon",
      name: "Hexagon Kutub Utara",
      short: "NORTH POLAR HEXAGON",
      topicIndex: 5,
      category: "ATMOSFER POLAR",
      descriptor: "Jet stream enam sisi dan vortex kutub",
      locationLabel: "Kutub utara Saturnus",
      image: "https://assets.science.nasa.gov/dynamicimage/assets/science/psd/photojournal/pia/pia14/pia14646/PIA14646.jpg?crop=faces%2Cfocalpoint&fit=clip&h=1016&w=1016",
      imageAlt: "Hexagon kutub utara Saturnus dipotret Cassini",
      imageCaption: "Hexagon Saturnus · Cassini PIA14646",
      source: "https://science.nasa.gov/photojournal/hexagon-and-rings/",
      facts: [
        "Hexagon adalah pola jet stream, bukan struktur padat di permukaan.",
        "Pola enam sisinya membentang puluhan ribu kilometer dan mengelilingi kutub utara.",
        "Cassini mengamati badai dan vortex di pusat wilayah polar ini dalam banyak panjang gelombang."
      ],
      lead: "Salah satu pola cuaca paling aneh di Tata Surya berada tepat di kutub utara Saturnus: aliran atmosfer raksasa yang mempertahankan bentuk enam sisi.",
      why: "Hexagon membantu ilmuwan menguji bagaimana gelombang atmosfer, rotasi cepat, dan jet stream dapat membentuk pola yang stabil dalam fluida planet.",
      preview: "hexagon"
    },
    {
      id: "titan",
      name: "Titan",
      short: "TITAN",
      topicIndex: 8,
      category: "BULAN BESAR",
      descriptor: "Atmosfer nitrogen, sungai dan danau hidrokarbon",
      locationLabel: "Orbit Titan",
      image: "https://assets.science.nasa.gov/dynamicimage/assets/science/psd/photojournal/pia/pia06/pia06440/PIA06440.jpg?crop=faces%2Cfocalpoint&fit=clip&h=718&w=504",
      imageAlt: "Permukaan Titan dipotret pendarat Huygens",
      imageCaption: "Permukaan Titan · Huygens PIA06440",
      source: "https://science.nasa.gov/photojournal/titans-surface/",
      facts: [
        "Titan adalah bulan terbesar Saturnus dan memiliki atmosfer tebal yang didominasi nitrogen.",
        "Di permukaannya terdapat danau dan laut hidrokarbon, terutama metana dan etana.",
        "Huygens mendarat di Titan pada Januari 2005 dan mengirim citra langsung dari permukaan."
      ],
      lead: "Titan adalah dunia berkabut yang terasa seperti eksperimen kimia planet skala raksasa: atmosfer tebal, hujan metana, sungai, dan laut hidrokarbon.",
      why: "Titan menunjukkan bahwa siklus cairan mirip siklus air dapat berlangsung dengan bahan kimia berbeda pada suhu yang sangat rendah.",
      preview: "titan"
    },
    {
      id: "enceladus",
      name: "Enceladus",
      short: "ENCELADUS",
      topicIndex: 9,
      category: "BULAN ES",
      descriptor: "Plume es dan samudra bawah permukaan",
      locationLabel: "Orbit Enceladus",
      image: "https://assets.science.nasa.gov/dynamicimage/assets/science/psd/photojournal/pia/pia12/pia12713/PIA12713.jpg?crop=faces%2Cfocalpoint&fit=clip&h=826&w=826",
      imageAlt: "Plume Enceladus dipotret Cassini",
      imageCaption: "Plume Enceladus · Cassini PIA12713",
      source: "https://science.nasa.gov/photojournal/enceladus-plumes/",
      facts: [
        "Enceladus memiliki samudra global di bawah kerak es.",
        "Semburan di dekat kutub selatan membawa uap air dan partikel es ke ruang angkasa.",
        "Material dari plume Enceladus ikut memasok partikel ke cincin E Saturnus."
      ],
      lead: "Enceladus kecil, terang, dan penuh retakan. Dari wilayah kutub selatannya, material dari samudra tersembunyi menyembur langsung ke ruang angkasa.",
      why: "Karena material samudra dapat keluar sebagai plume, Cassini bisa 'mencicipi' kandungan samudra tanpa harus mengebor lapisan es.",
      preview: "enceladus"
    },
    {
      id: "grand-finale",
      name: "Cassini Grand Finale",
      short: "GRAND FINALE",
      topicIndex: 10,
      category: "JALUR MISI",
      descriptor: "Lintasan terakhir antara Saturnus dan cincin",
      locationLabel: "Koridor Grand Finale Cassini",
      image: "https://assets.science.nasa.gov/dynamicimage/assets/science/psd/photojournal/pia/pia05/pia05425/PIA05425.jpg?crop=faces%2Cfocalpoint&fit=clip&h=649&w=1166",
      imageAlt: "Saturnus dan sistem cincin dipotret Cassini",
      imageCaption: "Saturnus · Cassini / NASA-JPL-SSI",
      source: "https://science.nasa.gov/mission/cassini/about-the-mission/",
      facts: [
        "Cassini tiba di sistem Saturnus pada 2004 dan menghabiskan lebih dari satu dekade mempelajarinya.",
        "Pada Grand Finale, Cassini melakukan lintasan berulang melalui celah di antara planet dan bagian dalam cincin.",
        "Misi berakhir pada 15 September 2017 dengan terjun terkontrol ke atmosfer Saturnus untuk melindungi bulan-bulan yang berpotensi layak huni."
      ],
      lead: "Grand Finale membawa Cassini melalui wilayah yang belum pernah dilalui wahana lain, menyapu dekat Saturnus dan bagian dalam sistem cincinnya sebelum akhir misi.",
      why: "Lintasan terakhir menghasilkan pengukuran gravitasi, medan magnet, atmosfer, dan massa cincin yang sulit diperoleh dari orbit biasa.",
      preview: "cassini"
    }
  ]);

  const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
  const delay = ms => new Promise(resolve => window.setTimeout(resolve, ms));

  class SaturnFullExploration {
    constructor(scene) {
      this.scene = scene;
      this.root = document.getElementById("saturn-full-exploration");
      this.entryButton = document.getElementById("saturn-full-explore-button");
      if (!scene || !this.root || !this.entryButton) return;

      this.qualityPanel = document.getElementById("saturn-quality-panel");
      this.qualityOptions = document.getElementById("saturn-quality-options");
      this.qualityClose = document.getElementById("saturn-quality-close");
      this.qualityStart = document.getElementById("saturn-quality-start");
      this.qualityLabel = document.getElementById("saturn-quality-selected-label");
      this.qualityNote = document.getElementById("saturn-quality-device-note");
      this.selector = document.getElementById("saturn-region-selector");
      this.selectorClose = document.getElementById("saturn-region-selector-close");
      this.selectorGrid = document.getElementById("saturn-region-grid");
      this.hudTarget = document.getElementById("saturn-full-hud-location");
      this.hudView = document.getElementById("saturn-full-hud-view");
      this.hudZoom = document.getElementById("saturn-full-hud-zoom");
      this.hudType = document.getElementById("saturn-full-hud-region-type");
      this.hudQuality = document.getElementById("saturn-full-hud-quality");
      this.objectives = document.getElementById("saturn-objectives-panel");
      this.objectivesList = document.getElementById("saturn-objectives-list");
      this.objectivesCount = document.getElementById("saturn-discovery-count");
      this.objectivesBar = document.getElementById("saturn-discovery-bar");
      this.objectivesCollapse = document.getElementById("saturn-objectives-collapse");
      this.objectivesToggle = document.getElementById("saturn-objectives-toggle");
      this.nextTarget = document.getElementById("saturn-next-target");
      this.nextTargetName = document.getElementById("saturn-next-target-name");
      this.nextTargetDistance = document.getElementById("saturn-next-target-distance");
      this.info = document.getElementById("saturn-landmark-card");
      this.infoMinimize = document.getElementById("saturn-landmark-minimize");
      this.infoToggle = document.getElementById("saturn-info-toggle");
      this.infoName = document.getElementById("saturn-landmark-name");
      this.infoType = document.getElementById("saturn-landmark-type");
      this.infoCoords = document.getElementById("saturn-landmark-coords");
      this.infoImage = document.getElementById("saturn-landmark-image");
      this.infoCaption = document.getElementById("saturn-landmark-image-caption");
      this.infoMedia = document.getElementById("saturn-landmark-media");
      this.infoDescription = document.getElementById("saturn-landmark-description");
      this.infoFacts = document.getElementById("saturn-landmark-facts");
      this.infoSource = document.getElementById("saturn-landmark-source");
      this.observationPrompt = document.getElementById("saturn-observation-prompt");
      this.observationPromptTitle = document.getElementById("saturn-observation-prompt-title");
      this.observeButton = document.getElementById("saturn-observe-button");
      this.observationCard = document.getElementById("saturn-observation-card");
      this.observationClose = document.getElementById("saturn-observation-close");
      this.observationTitle = document.getElementById("saturn-observation-title");
      this.observationMeta = document.getElementById("saturn-observation-meta");
      this.observationLead = document.getElementById("saturn-observation-lead");
      this.observationWhy = document.getElementById("saturn-observation-why");
      this.observationDeep = document.getElementById("saturn-observation-deep");
      this.observationSource = document.getElementById("saturn-observation-source");
      this.observationStatus = document.getElementById("saturn-observation-status");
      this.actionsRoot = this.root.querySelector(".venus-full-actions");
      this.actionsMenuToggle = document.getElementById("saturn-actions-menu-toggle");
      this.actionsMenu = document.getElementById("saturn-actions-menu");
      this.locationButton = document.getElementById("saturn-location-toggle");
      this.fullscreenButton = document.getElementById("saturn-fullscreen-toggle");
      this.exitButton = document.getElementById("saturn-full-exit");
      this.loading = document.getElementById("saturn-full-loading");
      this.loadingTitle = document.getElementById("saturn-full-loading-title");
      this.loadingStatus = document.getElementById("saturn-full-loading-status");
      this.loadingProgress = document.getElementById("saturn-full-loading-progress");
      this.tutorial = document.getElementById("saturn-full-tutorial");
      this.tutorialClose = document.getElementById("saturn-tutorial-close");
      this.inputLayer = document.getElementById("saturn-full-orbit-input");
      this.mobileControls = this.root.querySelectorAll("[data-saturn-control]");

      this.state = "idle";
      this.current = null;
      this.selected = DESTINATIONS[0];
      this.discovered = new Set();
      this.objectiveOpen = true;
      this.infoOpen = false;
      this.actionsOpen = false;
      this.transitionToken = 0;
      this.promptTimer = null;
      this.drag = null;
      this.keyState = new Set();
      this.controlFrame = null;
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
      this.qualityOptions?.querySelectorAll("[data-saturn-quality]").forEach(button => {
        const selected = button.dataset.saturnQuality === key;
        button.classList.toggle("is-selected", selected);
        button.setAttribute("aria-checked", String(selected));
        const badge = button.querySelector("[data-quality-recommendation]");
        if (badge) badge.textContent = button.dataset.saturnQuality === this.recommendedQuality ? "DIREKOMENDASIKAN" : "";
      });
      if (this.qualityLabel) this.qualityLabel.textContent = this.quality.label;
      if (this.hudQuality) this.hudQuality.textContent = this.quality.label;
      if (this.qualityNote) this.qualityNote.textContent = `Rekomendasi perangkat saat ini: ${QUALITY[this.recommendedQuality].label}. Mode ini mengatur ketajaman renderer orbital Saturnus.`;
      this.scene.resize?.();
    }

    buildSelector() {
      const fragment = document.createDocumentFragment();
      DESTINATIONS.forEach((destination, index) => {
        const button = document.createElement("button");
        button.type = "button";
        button.className = "venus-region-card saturn-region-card";
        button.dataset.saturnRegion = destination.id;
        button.innerHTML = `<span class="venus-region-preview saturn-region-preview saturn-region-preview-${destination.preview}" aria-hidden="true"><i></i><b>${destination.short}</b></span><span class="venus-region-index">${String(index + 1).padStart(2, "0")}</span><strong>${destination.name}</strong><span class="venus-region-descriptor">${destination.descriptor}</span><small>${destination.locationLabel}</small><em>${destination.category}</em><span class="venus-region-source">NASA / JPL-Caltech · Cassini-Huygens</span>`;
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
        li.dataset.saturnObjective = destination.id;
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
      if (this.nextTargetDistance) this.nextTargetDistance.textContent = next ? "Pilih dari menu Wilayah untuk mengamati." : "Lima destinasi sistem Saturnus telah diamati.";
    }

    bind() {
      this.entryButton.addEventListener("click", () => this.openEntryFlow());
      this.qualityClose?.addEventListener("click", () => this.closeEntryFlow());
      this.qualityStart?.addEventListener("click", () => this.showSelector());
      this.qualityOptions?.addEventListener("click", event => {
        const button = event.target.closest("[data-saturn-quality]");
        if (button) this.applyQuality(button.dataset.saturnQuality);
      });
      this.selectorClose?.addEventListener("click", () => {
        if (this.state === "selecting-world") this.closeSelectorToWorld(); else this.closeEntryFlow();
      });
      this.selectorGrid?.addEventListener("click", event => {
        const button = event.target.closest("[data-saturn-region]");
        if (!button) return;
        const destination = DESTINATIONS.find(item => item.id === button.dataset.saturnRegion);
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
      const activeKey = key => ["KeyW", "KeyA", "KeyS", "KeyD", "KeyQ", "KeyE", "ArrowUp", "ArrowDown", "ArrowLeft", "ArrowRight"].includes(key);
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
        if (event.code === "KeyE" && !this.observationPrompt.hidden) {
          event.preventDefault(); event.stopImmediatePropagation(); this.observeCurrent(); return;
        }
        event.preventDefault(); event.stopImmediatePropagation();
        this.keyState.add(event.code);
        this.startControlLoop();
      }, true);
      document.addEventListener("keyup", event => this.keyState.delete(event.code), true);

      this.mobileControls.forEach(button => {
        const control = button.dataset.saturnControl;
        const code = ({ forward:"KeyW", backward:"KeyS", left:"KeyA", right:"KeyD", up:"KeyE", down:"KeyQ" })[control];
        if (!code) return;
        const release = event => { this.keyState.delete(code); try { button.releasePointerCapture(event.pointerId); } catch {} };
        button.addEventListener("pointerdown", event => {
          event.preventDefault(); event.stopPropagation();
          try { button.setPointerCapture(event.pointerId); } catch {}
          this.keyState.add(code); this.startControlLoop();
        });
        button.addEventListener("pointerup", release);
        button.addEventListener("pointercancel", release);
        button.addEventListener("lostpointercapture", () => this.keyState.delete(code));
      });

      this.inputLayer?.addEventListener("pointerdown", event => {
        if (event.target !== this.inputLayer || this.state !== "exploring") return;
        this.drag = { id:event.pointerId, x:event.clientX, y:event.clientY };
        try { this.inputLayer.setPointerCapture(event.pointerId); } catch {}
      });
      this.inputLayer?.addEventListener("pointermove", event => {
        if (!this.drag || this.drag.id !== event.pointerId || this.state !== "exploring") return;
        const dx = event.clientX - this.drag.x, dy = event.clientY - this.drag.y;
        this.drag.x = event.clientX; this.drag.y = event.clientY;
        this.nudgeView(-dx * .0042, -dy * .0032, 0);
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
        const dt = Math.min(.05, (now - previous) / 1000); previous = now;
        let yaw = 0, pitch = 0, zoom = 0;
        if (this.keyState.has("KeyA") || this.keyState.has("ArrowLeft")) yaw += 1.15 * dt;
        if (this.keyState.has("KeyD") || this.keyState.has("ArrowRight")) yaw -= 1.15 * dt;
        if (this.keyState.has("KeyW") || this.keyState.has("ArrowUp")) pitch += .72 * dt;
        if (this.keyState.has("KeyS") || this.keyState.has("ArrowDown")) pitch -= .72 * dt;
        if (this.keyState.has("KeyQ")) zoom += 1.3 * dt;
        if (this.keyState.has("KeyE")) zoom -= 1.3 * dt;
        if (yaw || pitch || zoom) this.nudgeView(yaw, pitch, zoom);
        this.updateHud();
        if (this.keyState.size) this.controlFrame = requestAnimationFrame(tick);
      };
      this.controlFrame = requestAnimationFrame(tick);
    }

    nudgeView(yawDelta, pitchDelta, zoomDelta) {
      this.scene._ensureFeatureState?.();
      this.scene.focusYawTarget = (this.scene.focusYawTarget ?? this.scene.focusYaw ?? 2.2) + yawDelta;
      this.scene.focusPitchTarget = clamp((this.scene.focusPitchTarget ?? -.28) + pitchDelta, -.72, .72);
      this.scene.focusCameraZTarget = clamp((this.scene.focusCameraZTarget ?? 7) + zoomDelta, 5.72, 8.25);
      this.scene.focusState = "FOCUS_TRANSITION";
      if (!this.scene.frame && this.scene.active) {
        this.scene.previous = performance.now();
        this.scene.tick(this.scene.previous);
      }
    }

    selectDestination(id) {
      this.selected = DESTINATIONS.find(item => item.id === id) || DESTINATIONS[0];
      this.selectorGrid?.querySelectorAll("[data-saturn-region]").forEach(button => {
        const selected = button.dataset.saturnRegion === this.selected.id;
        button.classList.toggle("is-selected", selected);
        button.setAttribute("aria-pressed", String(selected));
      });
    }

    openEntryFlow() {
      if (!this.scene.active || this.scene.travelMode || this.scene.fullExplorationActive) return;
      if (this.scene.exploring) this.scene.exitExploration();
      this.state = "configuring";
      this.scene.fullExplorationActive = true;
      this.scene.element.classList.add("is-saturn-full-active");
      this.root.hidden = false;
      this.root.inert = false;
      this.root.setAttribute("aria-hidden", "false");
      this.entryButton.disabled = true;
      this.qualityPanel.hidden = false;
      this.selector.hidden = true;
      this.hideWorldUi();
      document.getElementById("announcement").textContent = "Pilih kualitas grafis untuk Eksplorasi Pengalaman Penuh Saturnus.";
    }

    closeEntryFlow() {
      if (!["configuring", "selecting"].includes(this.state)) return;
      this.state = "idle";
      this.scene.fullExplorationActive = false;
      this.scene.element.classList.remove("is-saturn-full-active");
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
      document.getElementById("announcement").textContent = "Pilih destinasi sistem Saturnus.";
    }

    async enter(destination) {
      if (!["selecting", "configuring"].includes(this.state)) return;
      const token = ++this.transitionToken;
      this.current = destination || this.selected;
      this.state = "switching";
      this.selector.hidden = true;
      this.qualityPanel.hidden = true;
      this.showLoading(`MEMUAT ${this.current.name.toUpperCase()}`, "MENYIAPKAN PANDANGAN ORBITAL", 18);
      await this.scene.prepare();
      if (token !== this.transitionToken) return;
      if (!this.scene.exploring) this.scene.enterExploration();
      this.scene.setExplorationStop(this.current.topicIndex, { immediate:false, announce:false });
      await this.loadingSequence(token, this.current.name);
      if (token !== this.transitionToken) return;
      this.state = "exploring";
      this.loading.hidden = true;
      this.root.classList.add("is-exploring");
      this.objectiveOpen = true;
      this.infoOpen = true;
      this.updateInfo();
      this.buildObjectives();
      this.syncPanels();
      this.showTutorial();
      this.scheduleObservationPrompt();
      window.AntaraProgress?.trackFull?.("saturn", this.current.id, this.current.name);
      document.getElementById("announcement").textContent = `Tiba di ${this.current.name}. Info lokasi dibuka.`;
    }

    async loadingSequence(token, label) {
      const reduced = matchMedia("(prefers-reduced-motion: reduce)").matches;
      const stages = reduced ? [[100, 80]] : [[34, 260], [62, 290], [84, 300], [100, 260]];
      const text = ["MEMUAT DATA CASSINI", "MENGATUR KAMERA", "MENGUNCI TARGET", "SIAP MENGAMATI"];
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
      this.infoOpen = true;
      this.objectiveOpen = true;
      this.syncPanels();
      this.scheduleObservationPrompt();
    }

    async switchDestination(destination) {
      if (this.state !== "selecting-world") return;
      const token = ++this.transitionToken;
      this.state = "switching";
      this.selector.hidden = true;
      this.current = destination;
      this.selectDestination(destination.id);
      this.showLoading(`BERPINDAH KE ${destination.name.toUpperCase()}`, "MENYIAPKAN TARGET", 14);
      this.scene.setExplorationStop(destination.topicIndex, { immediate:false, announce:false });
      await this.loadingSequence(token, destination.name);
      if (token !== this.transitionToken) return;
      this.state = "exploring";
      this.loading.hidden = true;
      this.infoOpen = true;
      this.objectiveOpen = true;
      this.updateInfo();
      this.buildObjectives();
      this.syncPanels();
      this.scheduleObservationPrompt();
      window.AntaraProgress?.trackFull?.("saturn", destination.id, destination.name);
      document.getElementById("announcement").textContent = `Berpindah ke ${destination.name}. Info lokasi dibuka.`;
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
      if (!this.current) return;
      const yaw = this.scene.focusYawTarget ?? this.scene.focusYaw ?? 0;
      const pitch = this.scene.focusPitchTarget ?? this.scene.focusPitch ?? 0;
      const zoom = this.scene.focusCameraZTarget ?? this.scene.focusCameraZ ?? 7;
      if (this.hudView) this.hudView.textContent = `${(yaw * 180 / Math.PI % 360 + 360) % 360 | 0}° · ${(pitch * 180 / Math.PI).toFixed(0)}°`;
      if (this.hudZoom) this.hudZoom.textContent = `${zoom.toFixed(2)}×`;
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
      if (!this.current || this.discovered.has(this.current.id)) return;
      this.promptTimer = window.setTimeout(() => {
        if (this.state !== "exploring" || !this.current || this.discovered.has(this.current.id)) return;
        this.observationPromptTitle.textContent = this.current.name;
        this.observationPrompt.hidden = false;
      }, matchMedia("(prefers-reduced-motion: reduce)").matches ? 80 : 650);
    }

    hideObservationPrompt() { this.observationPrompt.hidden = true; }

    observeCurrent() {
      if (!this.current || this.state !== "exploring") return;
      const d = this.current;
      const fresh = !this.discovered.has(d.id);
      this.discovered.add(d.id);
      this.hideObservationPrompt();
      this.buildObjectives();
      this.observationTitle.textContent = d.name;
      this.observationMeta.textContent = `${d.category} · ${d.locationLabel}`;
      this.observationLead.textContent = d.lead;
      this.observationWhy.textContent = d.why;
      this.observationDeep.replaceChildren(...d.facts.map(fact => { const p = document.createElement("p"); p.textContent = fact; return p; }));
      this.observationSource.href = d.source;
      this.observationStatus.textContent = fresh ? "BARU KAMU AMATI" : "SUDAH PERNAH DIAMATI";
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
    }

    hideWorldUi() {
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
      try { seen = sessionStorage.getItem("antara-saturn-full-tutorial") === "1"; } catch {}
      if (seen) return;
      this.tutorial.classList.add("is-visible");
      window.setTimeout(() => this.hideTutorial(false), 8500);
    }

    hideTutorial(persist = false) {
      this.tutorial.classList.remove("is-visible");
      if (persist) { try { sessionStorage.setItem("antara-saturn-full-tutorial", "1"); } catch {} }
    }

    async exit() {
      if (!this.scene.fullExplorationActive || ["exiting", "idle"].includes(this.state)) return;
      const token = ++this.transitionToken;
      this.state = "exiting";
      this.root.classList.add("is-exiting");
      this.hideWorldUi();
      this.keyState.clear();
      cancelAnimationFrame(this.controlFrame); this.controlFrame = null;
      this.scene._ensureFeatureState?.();
      this.scene.focusYawTarget = this.scene.focusYaw ?? 2.2;
      this.scene.focusPitchTarget = -.28;
      this.scene.focusCameraZTarget = 7;
      this.scene.focusState = "FOCUS_TRANSITION";
      if (!this.scene.frame && this.scene.active) { this.scene.previous = performance.now(); this.scene.tick(this.scene.previous); }
      await delay(matchMedia("(prefers-reduced-motion: reduce)").matches ? 100 : 720);
      if (token !== this.transitionToken) return;
      if (this.scene.exploring) this.scene.exitExploration();
      await delay(matchMedia("(prefers-reduced-motion: reduce)").matches ? 80 : 420);
      if (token !== this.transitionToken) return;
      this.root.classList.remove("is-exploring", "is-exiting");
      this.root.hidden = true;
      this.root.inert = true;
      this.root.setAttribute("aria-hidden", "true");
      this.scene.fullExplorationActive = false;
      this.scene.element.classList.remove("is-saturn-full-active");
      this.state = "idle";
      this.entryButton.disabled = false;
      this.scene.caption.inert = false;
      document.getElementById("announcement").textContent = "Kembali ke panorama Saturnus.";
      requestAnimationFrame(() => this.entryButton.focus({ preventScroll:true }));
    }
  }

  window.SaturnFullExploration = SaturnFullExploration;
  window.ANTARA_SATURN_FULL_DESTINATIONS = DESTINATIONS;
})();
