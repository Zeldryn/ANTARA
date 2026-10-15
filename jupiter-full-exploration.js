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
      id: "grs",
      name: "Great Red Spot",
      short: "GREAT RED SPOT",
      topicIndex: 4,
      category: "BADAI RAKSASA",
      descriptor: "Anticyclone raksasa di atmosfer selatan Jupiter",
      locationLabel: "Atmosfer selatan Jupiter",
      image: "https://assets.science.nasa.gov/dynamicimage/assets/science/psd/photojournal/pia/pia02/pia02821/PIA02821.jpg?crop=faces%2Cfocalpoint&fit=clip&h=1200&w=1200",
      imageAlt: "Great Red Spot Jupiter pada citra Cassini",
      imageCaption: "Great Red Spot · Cassini PIA02821",
      source: "https://science.nasa.gov/photojournal/jupiters-great-red-spot-in-cassini-image/",
      facts: [
        "Great Red Spot adalah anticyclone raksasa yang telah diamati selama berabad-abad dan terus berubah ukuran serta bentuk.",
        "Cassini merekam struktur awan berfilamen dan lapisan haze di sekitar badai dalam citra warna asli.",
        "Pengukuran Juno menunjukkan struktur dinamis badai berlanjut jauh di bawah puncak awan yang terlihat."
      ],
      lead: "Great Red Spot bukan noda pada permukaan. Ia adalah sistem badai atmosfer raksasa yang berputar di antara aliran jet Jupiter dan menjadi laboratorium alami untuk cuaca ekstrem planet gas.",
      why: "Dengan mengamati bentuk, warna, kecepatan angin, dan kedalaman badai, ilmuwan dapat menguji bagaimana energi bergerak di atmosfer Jupiter tanpa adanya permukaan padat.",
      preview: "grs"
    },
    {
      id: "bands",
      name: "Sabuk & Zona Awan",
      short: "BELTS & ZONES",
      topicIndex: 3,
      category: "DINAMIKA ATMOSFER",
      descriptor: "Pita gelap-terang dan jet stream berlawanan arah",
      locationLabel: "Atmosfer global Jupiter",
      image: "https://assets.science.nasa.gov/dynamicimage/assets/science/psd/photojournal/pia/pia04/pia04866/PIA04866.jpg?crop=faces%2Cfocalpoint&fit=clip&h=1600&w=1600",
      imageAlt: "Portrait global Jupiter dari citra Cassini",
      imageCaption: "Portrait global Jupiter · Cassini PIA04866",
      source: "https://science.nasa.gov/resource/cassini-jupiter-portrait/",
      facts: [
        "Pita terang dan gelap Jupiter merupakan sistem awan dan aliran atmosfer yang bergerak dalam arah berbeda pada lintang yang berdekatan.",
        "Portrait warna Cassini disusun dari 27 citra merah, hijau, dan biru pada pendekatan terdekat Desember 2000.",
        "Fitur kecil yang tampak dalam mosaic tersebut mencapai skala sekitar puluhan kilometer, memperlihatkan turbulensi halus di antara pita besar."
      ],
      lead: "Jupiter terlihat bergaris karena atmosfernya dipecah menjadi sabuk dan zona oleh rotasi cepat serta jet stream. Batas antarpita menjadi tempat pusaran, gelombang, dan awan terang terus terbentuk.",
      why: "Pita global membantu ilmuwan memahami hubungan rotasi cepat, konveksi dari bagian dalam planet, komposisi awan, dan jet stream yang menjaga pola atmosfer Jupiter tetap terorganisasi.",
      preview: "bands"
    },
    {
      id: "polar-cyclones",
      name: "Siklon Kutub Utara",
      short: "POLAR CYCLONES",
      topicIndex: 6,
      category: "ATMOSFER POLAR",
      descriptor: "Siklon pusat dikelilingi delapan siklon besar",
      locationLabel: "Kutub utara Jupiter",
      image: "https://assets.science.nasa.gov/dynamicimage/assets/science/psd/photojournal/pia/pia24/pia24238/PIA24238.jpg?crop=faces%2Cfocalpoint&fit=clip&h=800&w=1200",
      imageAlt: "Salah satu siklon circumpolar Jupiter pada citra JunoCam",
      imageCaption: "Circumpolar Cyclone · JunoCam PIA24238",
      source: "https://science.nasa.gov/photojournal/a-jupiter-circumpolar-cyclone/",
      facts: [
        "Juno menemukan sebuah siklon pusat di kutub utara yang dikelilingi delapan siklon circumpolar besar.",
        "PIA24238 merekam salah satu siklon circumpolar pada perijove ke-29 Juno, 16 September 2020.",
        "Pola siklon polar dapat bertahan lama walaupun masing-masing badai berada dalam atmosfer yang sangat turbulen."
      ],
      lead: "Dari ekuator Jupiter kita terbiasa melihat pita. Di kutub, pola itu berubah menjadi kota badai: pusaran raksasa berkumpul mengelilingi satu siklon pusat.",
      why: "Susunan siklon polar memberi petunjuk tentang bagaimana vortex besar saling berinteraksi dan tetap terpisah pada planet yang berputar sangat cepat.",
      preview: "polar"
    },
    {
      id: "rings",
      name: "Cincin Utama & Halo",
      short: "RING SYSTEM",
      topicIndex: 8,
      category: "SISTEM CINCIN",
      descriptor: "Main ring, halo, dan gossamer ring yang sangat redup",
      locationLabel: "Orbit ekuatorial Jupiter",
      image: "https://assets.science.nasa.gov/dynamicimage/assets/science/psd/photojournal/pia/pia09/pia09249/PIA09249.jpg?crop=faces%2Cfocalpoint&fit=clip&h=626&w=835",
      imageAlt: "Sistem cincin redup Jupiter",
      imageCaption: "Cincin Jupiter · data wahana NASA",
      source: "https://science.nasa.gov/photojournal/jupiters-main-ring-and-halo/",
      facts: [
        "Sistem cincin Jupiter mencakup halo bagian dalam, main ring yang tipis, dan gossamer ring yang lebih luar.",
        "Cincin jauh lebih redup daripada cincin Saturnus dan kaya partikel debu berukuran kecil.",
        "Data Galileo menunjukkan struktur cincin dipengaruhi bulan-bulan kecil seperti Metis dan Adrastea."
      ],
      lead: "Jupiter memang punya cincin, hanya saja tipis dan gelap. Dalam pencahayaan yang tepat, butiran debu membentuk struktur halo, main ring, dan gossamer ring di sekitar raksasa gas ini.",
      why: "Cincin Jupiter memperlihatkan bagaimana tumbukan mikrometeoroid pada bulan kecil dapat terus memasok debu ke sebuah sistem cincin yang rapuh.",
      preview: "rings"
    },
    {
      id: "galilean-moons",
      name: "Empat Bulan Galilea",
      short: "GALILEAN MOONS",
      topicIndex: 9,
      category: "SISTEM BULAN",
      descriptor: "Io, Europa, Ganymede, dan Callisto",
      locationLabel: "Sistem bulan besar Jupiter",
      image: "https://assets.science.nasa.gov/dynamicimage/assets/science/psd/photojournal/pia/pia01/pia01481/PIA01481.jpg?crop=faces%2Cfocalpoint&fit=clip&h=1654&w=2081",
      imageAlt: "Montase Jupiter dan empat bulan Galilea",
      imageCaption: "Bulan Galilea · NASA/JPL PIA01481",
      source: "https://science.nasa.gov/jupiter/moons/",
      facts: [
        "Io adalah dunia paling aktif secara vulkanik yang diketahui di Tata Surya.",
        "Europa menunjukkan bukti kuat adanya samudra cair di bawah kerak esnya.",
        "Ganymede adalah bulan terbesar di Tata Surya, sedangkan Callisto mempertahankan permukaan tua yang sangat penuh kawah."
      ],
      lead: "Empat bulan yang pertama kali diamati Galileo pada 1610 ternyata bukan sekadar titik cahaya. Masing-masing adalah dunia dengan geologi, sejarah, dan lingkungan yang sama sekali berbeda.",
      why: "Sistem Galilea menunjukkan bagaimana gravitasi Jupiter dan resonansi antarbulan dapat mengubah interior, memicu vulkanisme, menjaga samudra, dan membentuk evolusi dunia kecil.",
      preview: "moons"
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
      this.qualityOptions?.querySelectorAll("[data-jupiter-quality]").forEach(button => {
        const selected = button.dataset.jupiterQuality === key;
        button.classList.toggle("is-selected", selected);
        button.setAttribute("aria-checked", String(selected));
        const badge = button.querySelector("[data-quality-recommendation]");
        if (badge) badge.textContent = button.dataset.jupiterQuality === this.recommendedQuality ? "DIREKOMENDASIKAN" : "";
      });
      if (this.qualityLabel) this.qualityLabel.textContent = this.quality.label;
      if (this.hudQuality) this.hudQuality.textContent = this.quality.label;
      if (this.qualityNote) this.qualityNote.textContent = `Rekomendasi perangkat saat ini: ${QUALITY[this.recommendedQuality].label}. Mode ini mengatur ketajaman renderer orbital Jupiter.`;
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
        const control = button.dataset.jupiterControl;
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
      this.scene.focusYawTarget = (this.scene.focusYawTarget ?? this.scene.focusYaw ?? 2.58) + yawDelta;
      this.scene.focusPitchTarget = clamp((this.scene.focusPitchTarget ?? 0) + pitchDelta, -.88, .88);
      this.scene.focusCameraZTarget = clamp((this.scene.focusCameraZTarget ?? 6.4) + zoomDelta, 5.45, 8.10);
      this.scene.focusState = "FOCUS_TRANSITION";
      if (!this.scene.frame && this.scene.active) {
        this.scene.previous = performance.now();
        this.scene.tick(this.scene.previous);
      }
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
      this.entryButton.disabled = true;
      this.qualityPanel.hidden = false;
      this.selector.hidden = true;
      this.hideWorldUi();
      document.getElementById("announcement").textContent = "Pilih kualitas grafis untuk Eksplorasi Pengalaman Penuh Jupiter.";
    }

    closeEntryFlow() {
      if (!["configuring", "selecting"].includes(this.state)) return;
      this.state = "idle";
      this.scene.fullExplorationActive = false;
      this.scene.element.classList.remove("is-jupiter-full-active");
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
      window.AntaraProgress?.trackFull?.("jupiter", this.current.id, this.current.name);
      document.getElementById("announcement").textContent = `Tiba di ${this.current.name}. Info lokasi dibuka.`;
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
      window.AntaraProgress?.trackFull?.("jupiter", destination.id, destination.name);
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
      const zoom = this.scene.focusCameraZTarget ?? this.scene.focusCameraZ ?? 6.4;
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
      try { seen = sessionStorage.getItem("antara-jupiter-full-tutorial") === "1"; } catch {}
      if (seen) return;
      this.tutorial.classList.add("is-visible");
      window.setTimeout(() => this.hideTutorial(false), 8500);
    }

    hideTutorial(persist = false) {
      this.tutorial.classList.remove("is-visible");
      if (persist) { try { sessionStorage.setItem("antara-jupiter-full-tutorial", "1"); } catch {} }
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
      this.scene.focusYawTarget = this.scene.focusYaw ?? 2.58;
      this.scene.focusPitchTarget = 0;
      this.scene.focusCameraZTarget = 6.4;
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
      this.scene.element.classList.remove("is-jupiter-full-active");
      this.state = "idle";
      this.entryButton.disabled = false;
      this.scene.caption.inert = false;
      document.getElementById("announcement").textContent = "Kembali ke panorama Jupiter.";
      requestAnimationFrame(() => this.entryButton.focus({ preventScroll:true }));
    }
  }

  window.JupiterFullExploration = JupiterFullExploration;
  window.ANTARA_JUPITER_FULL_DESTINATIONS = DESTINATIONS;
})();
