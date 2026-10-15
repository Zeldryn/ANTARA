"use strict";

(() => {
  const STORAGE_KEY = "antara-uranus-full-quality-v1";
  const QUALITY = Object.freeze({
    LOW: { name: "LOW", label: "RENDAH", dpr: 1.0 },
    MEDIUM: { name: "MEDIUM", label: "SEDANG", dpr: 1.5 },
    HIGH: { name: "HIGH", label: "TINGGI", dpr: 2.0 }
  });

  const DESTINATIONS = Object.freeze([
    {
      id: "axis",
      name: "Kemiringan Sumbu Uranus",
      short: "SUMBU 97.77°",
      topicIndex: 1,
      category: "ORIENTASI PLANET",
      descriptor: "Sumbu rotasi hampir rebah terhadap bidang orbit",
      locationLabel: "Sumbu rotasi Uranus · 97,77°",
      image: "./assets/uranus-tilt-diagram.svg",
      imageAlt: "Diagram kemiringan sumbu Uranus 97,77 derajat",
      imageCaption: "Diagram kemiringan sumbu Uranus · visual ANTARA berbasis NASA",
      source: "https://science.nasa.gov/uranus/facts/",
      facts: [
        "Uranus berputar hampir menyamping sehingga kutubnya dapat menghadap Matahari dalam waktu yang sangat lama.",
        "Kemiringan ekstrem ini adalah salah satu ciri paling khas Uranus dibanding planet lain.",
        "Model 3D ANTARA menonjolkan orientasi sumbu ini sebagai identitas utama Uranus."
      ],
      lead: "Inilah hal pertama yang membuat Uranus berbeda. Ia tidak berputar hampir tegak seperti Bumi, tetapi hampir rebah, sehingga pola siang, malam, dan musimnya menjadi sangat unik.",
      why: "Kemiringan ekstrem Uranus membantu ilmuwan memahami sejarah tumbukan awal Tata Surya dan bagaimana orientasi planet memengaruhi cuaca jangka panjang.",
      preview: "axis"
    },
    {
      id: "seasons",
      name: "Musim Ekstrem Uranus",
      short: "MUSIM PANJANG",
      topicIndex: 2,
      category: "IKLIM JANGKA PANJANG",
      descriptor: "Setiap musim dapat berlangsung sekitar 21 tahun Bumi",
      locationLabel: "Belahan kutub Uranus",
      image: "./assets/uranus-seasons-diagram.svg",
      imageAlt: "Diagram musim ekstrem Uranus",
      imageCaption: "Musim Uranus · visual ANTARA berbasis NASA",
      source: "https://science.nasa.gov/uranus/facts/",
      facts: [
        "Satu tahun Uranus berlangsung sekitar 84 tahun Bumi.",
        "Satu musimnya kira-kira berlangsung 21 tahun Bumi.",
        "Karena sumbunya sangat miring, satu kutub bisa lama menghadap Matahari lalu lama membelakanginya."
      ],
      lead: "Uranus mengalami musim yang jauh lebih aneh daripada Bumi. Bayangkan satu musim berlangsung puluhan tahun—itulah yang terjadi karena sumbu putarnya hampir rebah.",
      why: "Musim ekstrem memengaruhi energi yang diterima atmosfer Uranus dan membantu menjelaskan perubahan awan yang diamati dari waktu ke waktu.",
      preview: "seasons"
    },
    {
      id: "rings",
      name: "Cincin Gelap Uranus",
      short: "RING SYSTEM",
      topicIndex: 5,
      category: "SISTEM CINCIN",
      descriptor: "Cincin tipis, sempit, dan jauh lebih redup daripada Saturnus",
      locationLabel: "Bidang ekuator Uranus",
      image: "https://assets.science.nasa.gov/dynamicimage/assets/science/psd/photojournal/pia/pia01/pia01977/PIA01977.jpg?crop=faces%2Cfocalpoint&fit=clip&h=735&w=754",
      imageAlt: "Citra cincin Uranus dari Voyager 2",
      imageCaption: "Cincin Uranus · Voyager 2 / NASA-JPL",
      source: "https://science.nasa.gov/photojournal/uranus-rings/",
      facts: [
        "Uranus memiliki 13 cincin yang diketahui.",
        "Sebagian besar cincin sangat sempit dan gelap.",
        "Cincin ini pertama kali terdeteksi pada 1977 melalui pengamatan bintang yang tertutup Uranus."
      ],
      lead: "Walau tidak seterkenal Saturnus, Uranus juga punya sistem cincin. Cincinnya tipis, gelap, dan membutuhkan kondisi pengamatan yang tepat untuk terlihat jelas.",
      why: "Cincin Uranus membantu ilmuwan mempelajari dinamika partikel kecil, resonansi orbit, dan hubungan cincin dengan bulan-bulan penggembala.",
      preview: "rings"
    },
    {
      id: "miranda",
      name: "Miranda",
      short: "MIRANDA",
      topicIndex: 7,
      category: "BULAN UNIK",
      descriptor: "Bulan kecil dengan tebing tinggi dan lanskap yang tampak terpecah-pecah",
      locationLabel: "Orbit Miranda",
      image: "https://assets.science.nasa.gov/dynamicimage/assets/science/psd/photojournal/pia/pia00/pia00041/PIA00041.jpg?crop=faces%2Cfocalpoint&fit=clip&h=597&w=754",
      imageAlt: "Permukaan Miranda dipotret Voyager 2",
      imageCaption: "Miranda · Voyager 2 / NASA-JPL",
      source: "https://science.nasa.gov/photojournal/mirandas-icy-face/",
      facts: [
        "Miranda berdiameter sekitar 470 km.",
        "Verona Rupes di Miranda termasuk salah satu tebing paling tinggi yang diketahui di Tata Surya.",
        "Citra terbaik Miranda hingga kini masih berasal dari lintasan Voyager 2."
      ],
      lead: "Miranda terlihat seperti dunia kecil yang pernah dihancurkan lalu disusun kembali. Permukaannya menyatukan tebing, lembah, dan medan yang sangat berbeda dalam satu objek kecil.",
      why: "Miranda memberi petunjuk penting tentang aktivitas geologi masa lalu bulan-bulan es dan dampak pemanasan internal pada dunia kecil.",
      preview: "miranda"
    },
    {
      id: "voyager",
      name: "Lintasan Voyager 2",
      short: "VOYAGER 2",
      topicIndex: 9,
      category: "SEJARAH EKSPLORASI",
      descriptor: "Satu-satunya wahana yang pernah terbang melewati Uranus",
      locationLabel: "Flyby Uranus · Januari 1986",
      image: "https://assets.science.nasa.gov/dynamicimage/assets/science/psd/photojournal/pia/pia22/pia22915/PIA22915.jpg?crop=faces%2Cfocalpoint&fit=clip&h=1080&w=1920",
      imageAlt: "Ilustrasi wahana Voyager 2",
      imageCaption: "Voyager 2 · ilustrasi instrumen wahana NASA/JPL-Caltech",
      source: "https://science.nasa.gov/photojournal/voyager-2-spacecraft-instruments/",
      facts: [
        "Voyager 2 melintas Uranus pada 24 Januari 1986.",
        "Wahana ini mengungkap cincin, bulan, serta struktur atmosfer Uranus dengan detail jauh lebih baik.",
        "Sampai sekarang, belum ada misi orbit khusus ke Uranus."
      ],
      lead: "Sebagian besar pengetahuan visual detail kita tentang Uranus berasal dari satu kunjungan bersejarah: flyby Voyager 2 pada 1986.",
      why: "Voyager 2 menjadi fondasi seluruh pemahaman modern tentang sistem Uranus dan menunjukkan betapa berharganya data langsung dari wahana antariksa.",
      preview: "voyager"
    }
  ]);

  const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
  const delay = ms => new Promise(resolve => window.setTimeout(resolve, ms));

  class UranusFullExploration {
    constructor(scene) {
      this.scene = scene;
      this.root = document.getElementById("uranus-full-exploration");
      this.entryButton = document.getElementById("uranus-full-explore-button");
      if (!scene || !this.root || !this.entryButton) return;
      this.viewportPlaceholder = null;
      this.viewportMounted = false;

      this.qualityPanel = document.getElementById("uranus-quality-panel");
      this.qualityOptions = document.getElementById("uranus-quality-options");
      this.qualityClose = document.getElementById("uranus-quality-close");
      this.qualityStart = document.getElementById("uranus-quality-start");
      this.qualityLabel = document.getElementById("uranus-quality-selected-label");
      this.qualityNote = document.getElementById("uranus-quality-device-note");
      this.selector = document.getElementById("uranus-region-selector");
      this.selectorClose = document.getElementById("uranus-region-selector-close");
      this.selectorGrid = document.getElementById("uranus-region-grid");
      this.hudTarget = document.getElementById("uranus-full-hud-location");
      this.hudView = document.getElementById("uranus-full-hud-view");
      this.hudZoom = document.getElementById("uranus-full-hud-zoom");
      this.hudType = document.getElementById("uranus-full-hud-region-type");
      this.hudQuality = document.getElementById("uranus-full-hud-quality");
      this.objectives = document.getElementById("uranus-objectives-panel");
      this.objectivesList = document.getElementById("uranus-objectives-list");
      this.objectivesCount = document.getElementById("uranus-discovery-count");
      this.objectivesBar = document.getElementById("uranus-discovery-bar");
      this.objectivesCollapse = document.getElementById("uranus-objectives-collapse");
      this.objectivesToggle = document.getElementById("uranus-objectives-toggle");
      this.nextTarget = document.getElementById("uranus-next-target");
      this.nextTargetName = document.getElementById("uranus-next-target-name");
      this.nextTargetDistance = document.getElementById("uranus-next-target-distance");
      this.info = document.getElementById("uranus-landmark-card");
      this.infoMinimize = document.getElementById("uranus-landmark-minimize");
      this.infoToggle = document.getElementById("uranus-info-toggle");
      this.infoName = document.getElementById("uranus-landmark-name");
      this.infoType = document.getElementById("uranus-landmark-type");
      this.infoCoords = document.getElementById("uranus-landmark-coords");
      this.infoImage = document.getElementById("uranus-landmark-image");
      this.infoCaption = document.getElementById("uranus-landmark-image-caption");
      this.infoMedia = document.getElementById("uranus-landmark-media");
      this.infoDescription = document.getElementById("uranus-landmark-description");
      this.infoFacts = document.getElementById("uranus-landmark-facts");
      this.infoSource = document.getElementById("uranus-landmark-source");
      this.observationPrompt = document.getElementById("uranus-observation-prompt");
      this.observationPromptTitle = document.getElementById("uranus-observation-prompt-title");
      this.observeButton = document.getElementById("uranus-observe-button");
      this.observationCard = document.getElementById("uranus-observation-card");
      this.observationClose = document.getElementById("uranus-observation-close");
      this.observationTitle = document.getElementById("uranus-observation-title");
      this.observationMeta = document.getElementById("uranus-observation-meta");
      this.observationLead = document.getElementById("uranus-observation-lead");
      this.observationWhy = document.getElementById("uranus-observation-why");
      this.observationDeep = document.getElementById("uranus-observation-deep");
      this.observationSource = document.getElementById("uranus-observation-source");
      this.observationStatus = document.getElementById("uranus-observation-status");
      this.actionsRoot = this.root.querySelector(".venus-full-actions");
      this.actionsMenuToggle = document.getElementById("uranus-actions-menu-toggle");
      this.actionsMenu = document.getElementById("uranus-actions-menu");
      this.locationButton = document.getElementById("uranus-location-toggle");
      this.fullscreenButton = document.getElementById("uranus-fullscreen-toggle");
      this.exitButton = document.getElementById("uranus-full-exit");
      this.loading = document.getElementById("uranus-full-loading");
      this.loadingTitle = document.getElementById("uranus-full-loading-title");
      this.loadingStatus = document.getElementById("uranus-full-loading-status");
      this.loadingProgress = document.getElementById("uranus-full-loading-progress");
      this.tutorial = document.getElementById("uranus-full-tutorial");
      this.tutorialClose = document.getElementById("uranus-tutorial-close");
      this.inputLayer = document.getElementById("uranus-full-orbit-input");
      this.mobileControls = this.root.querySelectorAll("[data-uranus-control]");

      this.state = "idle";
      this.current = null;
      this.selected = DESTINATIONS[0];
      this.discovered = new Set();
      this.objectiveOpen = true;
      this.infoOpen = false;
      this.actionsOpen = false;
      this.panelSnapshot = null;
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
      this.qualityOptions?.querySelectorAll("[data-uranus-quality]").forEach(button => {
        const selected = button.dataset.uranusQuality === key;
        button.classList.toggle("is-selected", selected);
        button.setAttribute("aria-checked", String(selected));
        const badge = button.querySelector("[data-quality-recommendation]");
        if (badge) badge.textContent = button.dataset.uranusQuality === this.recommendedQuality ? "DIREKOMENDASIKAN" : "";
      });
      if (this.qualityLabel) this.qualityLabel.textContent = this.quality.label;
      if (this.hudQuality) this.hudQuality.textContent = this.quality.label;
      if (this.qualityNote) this.qualityNote.textContent = `Rekomendasi perangkat saat ini: ${QUALITY[this.recommendedQuality].label}. Mode ini mengatur ketajaman renderer orbital Uranus.`;
      this.scene.resize?.();
    }

    buildSelector() {
      const fragment = document.createDocumentFragment();
      DESTINATIONS.forEach((destination, index) => {
        const button = document.createElement("button");
        button.type = "button";
        button.className = "venus-region-card uranus-region-card";
        button.dataset.uranusRegion = destination.id;
        button.innerHTML = `<span class="venus-region-preview uranus-region-preview uranus-region-preview-${destination.preview}" aria-hidden="true"><i></i><b>${destination.short}</b></span><span class="venus-region-index">${String(index + 1).padStart(2, "0")}</span><strong>${destination.name}</strong><span class="venus-region-descriptor">${destination.descriptor}</span><small>${destination.locationLabel}</small><em>${destination.category}</em><span class="venus-region-source">NASA / JPL-Caltech · Voyager 2 / NASA Science</span>`;
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
        li.dataset.uranusObjective = destination.id;
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
      if (this.nextTargetDistance) this.nextTargetDistance.textContent = next ? "Pilih dari menu Wilayah untuk mengamati." : "Lima destinasi sistem Uranus telah diamati.";
    }

    bind() {
      this.entryButton.addEventListener("click", () => this.openEntryFlow());
      this.qualityClose?.addEventListener("click", () => this.closeEntryFlow());
      this.qualityStart?.addEventListener("click", () => this.showSelector());
      this.qualityOptions?.addEventListener("click", event => {
        const button = event.target.closest("[data-uranus-quality]");
        if (button) this.applyQuality(button.dataset.uranusQuality);
      });
      this.selectorClose?.addEventListener("click", () => {
        if (this.state === "selecting-world") this.closeSelectorToWorld(); else this.closeEntryFlow();
      });
      this.selectorGrid?.addEventListener("click", event => {
        const button = event.target.closest("[data-uranus-region]");
        if (!button) return;
        const destination = DESTINATIONS.find(item => item.id === button.dataset.uranusRegion);
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
        const control = button.dataset.uranusControl;
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
        if (!this.scene.fullExplorationActive || this.state !== "exploring" || !this.observationCard.hidden) { this.keyState.clear(); return; }
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
      const nextYaw = (this.scene.focusTo?.yaw ?? this.scene.viewYaw ?? -0.38) + yawDelta;
      const nextZoom = clamp((this.scene.focusTo?.z ?? this.scene.viewCameraZ ?? 7) + zoomDelta, 5.95, 8.4);
      this.scene.fullExplorationPitch = clamp((this.scene.fullExplorationPitch ?? 0) + pitchDelta, -.62, .62);
      this.scene._beginFocus?.(nextYaw, nextZoom);
      if (!this.scene.frame && this.scene.active) {
        this.scene.previous = performance.now();
        this.scene.tick(this.scene.previous);
      }
    }

    clearHeldControls() {
      this.keyState.clear();
      this.drag = null;
      if (this.controlFrame) cancelAnimationFrame(this.controlFrame);
      this.controlFrame = null;
    }

    mountSceneViewport() {
      const viewport = this.scene?.viewport;
      if (!viewport || this.viewportMounted) return;
      const parent = viewport.parentNode;
      if (!parent) return;
      this.viewportPlaceholder = document.createComment("antara-uranus-viewport-home");
      parent.insertBefore(this.viewportPlaceholder, viewport);
      this.root.insertBefore(viewport, this.root.firstChild);
      viewport.classList.add("is-full-exploration-mounted");
      this.viewportMounted = true;
      this.scene.resize?.();
      this.scene.render?.();
    }

    restoreSceneViewport() {
      if (!this.viewportMounted) return;
      const viewport = this.scene?.viewport;
      const placeholder = this.viewportPlaceholder;
      if (viewport && placeholder?.parentNode) placeholder.parentNode.insertBefore(viewport, placeholder);
      placeholder?.remove?.();
      viewport?.classList.remove("is-full-exploration-mounted");
      this.viewportPlaceholder = null;
      this.viewportMounted = false;
      this.scene.resize?.();
      this.scene.render?.();
    }

    selectDestination(id) {
      this.selected = DESTINATIONS.find(item => item.id === id) || DESTINATIONS[0];
      this.selectorGrid?.querySelectorAll("[data-uranus-region]").forEach(button => {
        const selected = button.dataset.uranusRegion === this.selected.id;
        button.classList.toggle("is-selected", selected);
        button.setAttribute("aria-pressed", String(selected));
      });
    }

    openEntryFlow() {
      if (!this.scene.active || this.scene.travelMode || this.scene.fullExplorationActive) return;
      if (this.scene.exploring) this.scene.exitExploration();
      this.state = "configuring";
      this.scene.fullExplorationActive = true;
      this.scene.element.classList.add("is-uranus-full-active");
      this.root.hidden = false;
      this.root.inert = false;
      this.root.setAttribute("aria-hidden", "false");
      this.mountSceneViewport();
      this.entryButton.disabled = true;
      this.qualityPanel.hidden = false;
      this.selector.hidden = true;
      this.hideWorldUi();
      document.getElementById("announcement").textContent = "Pilih kualitas grafis untuk Eksplorasi Pengalaman Penuh Uranus.";
    }

    closeEntryFlow() {
      if (!["configuring", "selecting"].includes(this.state)) return;
      this.state = "idle";
      this.scene.fullExplorationActive = false;
      this.scene.element.classList.remove("is-uranus-full-active");
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
      document.getElementById("announcement").textContent = "Pilih destinasi sistem Uranus.";
    }

    async enter(destination) {
      if (!["selecting", "configuring"].includes(this.state)) return;
      const token = ++this.transitionToken;
      this.current = destination || this.selected;
      this.scene.fullExplorationPitch = 0;
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
      document.getElementById("announcement").textContent = `Tiba di ${this.current.name}. Info lokasi dibuka.`;
    }

    async loadingSequence(token, label) {
      const reduced = matchMedia("(prefers-reduced-motion: reduce)").matches;
      const stages = reduced ? [[100, 80]] : [[34, 260], [62, 290], [84, 300], [100, 260]];
      const text = ['MEMUAT DATA VOYAGER 2', 'MENGATUR KAMERA', 'MENGUNCI TARGET', 'SIAP MENGAMATI'];
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
      this.scene.fullExplorationPitch = 0;
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
      const yaw = this.scene.focusTo?.yaw ?? this.scene.viewYaw ?? -0.38;
      const zoom = this.scene.focusTo?.z ?? this.scene.viewCameraZ ?? 7;
      const elevation = (this.scene.fullExplorationPitch ?? 0) * 180 / Math.PI;
      if (this.hudView) this.hudView.textContent = `${((yaw * 180 / Math.PI) % 360 + 360) % 360 | 0}° orbit · ${elevation.toFixed(0)}° elevasi`;
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
      if (!this.current || this.discovered.has(this.current.id)) return;
      const token = this.transitionToken;
      const started = performance.now();
      const check = () => {
        if (token !== this.transitionToken || this.state !== "exploring" || !this.current || this.discovered.has(this.current.id)) return;
        const elapsed = performance.now() - started;
        const settled = this.scene.focusState !== "FOCUS_TRANSITION";
        const minimumWaitDone = elapsed >= (matchMedia("(prefers-reduced-motion: reduce)").matches ? 60 : 420);
        const markerRequired = Boolean(this.scene._activeMarker);
        const markerVisible = !markerRequired || this.scene.mode !== "webgl" || Boolean(this.scene.focusReticle?.classList?.contains("is-marker-visible"));
        const visualReady = markerVisible || elapsed >= 2400;
        if (!settled || !minimumWaitDone || !visualReady) {
          this.promptTimer = window.setTimeout(check, 90);
          return;
        }
        this.observationPromptTitle.textContent = this.current.name;
        this.observationPrompt.hidden = false;
      };
      this.promptTimer = window.setTimeout(check, matchMedia("(prefers-reduced-motion: reduce)").matches ? 40 : 120);
    }

    hideObservationPrompt() { this.observationPrompt.hidden = true; }

    observeCurrent() {
      if (!this.current || this.state !== "exploring") return;
      const d = this.current;
      const fresh = !this.discovered.has(d.id);
      this.discovered.add(d.id);
      if (fresh) window.AntaraProgress?.trackFull?.("uranus", d.id, d.name);
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
      try { seen = sessionStorage.getItem("antara-uranus-full-tutorial") === "1"; } catch {}
      if (seen) return;
      this.tutorial.classList.add("is-visible");
      window.setTimeout(() => this.hideTutorial(false), 8500);
    }

    hideTutorial(persist = false) {
      this.tutorial.classList.remove("is-visible");
      if (persist) { try { sessionStorage.setItem("antara-uranus-full-tutorial", "1"); } catch {} }
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
      this.scene.fullExplorationActive = false;
      this.scene.element.classList.remove("is-uranus-full-active");
      if ("fullExplorationPitch" in this.scene) this.scene.fullExplorationPitch = 0;
      this.entryButton.disabled = false;
      this.scene.caption.inert = false;
      this.scene.resize?.();
    }

    async exit() {
      if (!this.scene.fullExplorationActive || ["exiting", "idle"].includes(this.state)) return;
      const token = ++this.transitionToken;
      this.state = "exiting";
      this.scene.fullExplorationPitch = 0;
      this.root.classList.add("is-exiting");
      this.hideWorldUi();
      this.keyState.clear();
      cancelAnimationFrame(this.controlFrame); this.controlFrame = null;
      this.scene._beginFocus?.(-0.38, 7);
      if (!this.scene.frame && this.scene.active) { this.scene.previous = performance.now(); this.scene.tick(this.scene.previous); }
      await delay(matchMedia("(prefers-reduced-motion: reduce)").matches ? 100 : 720);
      if (token !== this.transitionToken) return;
      if (this.scene.exploring) this.scene.exitExploration();
      await delay(matchMedia("(prefers-reduced-motion: reduce)").matches ? 80 : 420);
      if (token !== this.transitionToken) return;
      this.root.classList.remove("is-exploring", "is-exiting");
      this.scene.fullExplorationActive = false;
      this.scene.element.classList.remove("is-uranus-full-active");
      this.restoreSceneViewport();
      this.root.hidden = true;
      this.root.inert = true;
      this.root.setAttribute("aria-hidden", "true");
      this.scene.resize?.();
      this.state = "idle";
      this.entryButton.disabled = false;
      this.scene.caption.inert = false;
      document.getElementById("announcement").textContent = "Kembali ke panorama Uranus.";
      requestAnimationFrame(() => this.entryButton.focus({ preventScroll:true }));
    }
  }

  window.UranusFullExploration = UranusFullExploration;
  window.ANTARA_URANUS_FULL_DESTINATIONS = DESTINATIONS;
})();
