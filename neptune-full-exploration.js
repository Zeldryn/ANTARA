"use strict";

(() => {
  const STORAGE_KEY = "antara-neptune-full-quality-v1";
  const QUALITY = Object.freeze({
    LOW: { name: "LOW", label: "RENDAH", dpr: 1.0 },
    MEDIUM: { name: "MEDIUM", label: "SEDANG", dpr: 1.5 },
    HIGH: { name: "HIGH", label: "TINGGI", dpr: 2.0 }
  });

  const DESTINATIONS = Object.freeze([
    {
      id: "winds",
      name: "Angin Super Cepat",
      short: "SUPER WINDS",
      topicIndex: 4,
      category: "DINAMIKA ATMOSFER",
      descriptor: "Arus angin dapat melampaui 2.000 km/jam",
      locationLabel: "Atmosfer global Neptunus",
      image: "./assets/neptune-winds-diagram.svg",
      imageAlt: "Diagram angin cepat di atmosfer Neptunus",
      imageCaption: "Angin Neptunus · visual ANTARA berbasis NASA",
      source: "https://science.nasa.gov/neptune/neptune-facts/",
      facts: [
        "Neptunus memiliki angin tercepat di antara seluruh planet utama.",
        "Kecepatannya dapat melampaui sekitar 2.000 km/jam.",
        "Para ilmuwan masih meneliti bagaimana planet sejauh ini tetap memiliki cuaca yang sangat aktif."
      ],
      lead: "Meskipun jauh dari Matahari, Neptunus justru menyimpan atmosfer yang sangat aktif. Di sinilah angin tercepat di Tata Surya melaju mengelilingi raksasa es biru ini.",
      why: "Mengamati angin Neptunus membantu ilmuwan memahami sumber energi internal planet dan cara cuaca ekstrem bertahan di lingkungan yang sangat dingin.",
      preview: "winds"
    },
    {
      id: "dark-spot",
      name: "Great Dark Spot",
      short: "DARK SPOT",
      topicIndex: 5,
      category: "BADAI BESAR",
      descriptor: "Vortex gelap raksasa yang dapat muncul lalu menghilang",
      locationLabel: "Atmosfer selatan Neptunus",
      image: "https://assets.science.nasa.gov/dynamicimage/assets/science/psd/photojournal/pia/pia00/pia00052/PIA00052.jpg?crop=faces%2Cfocalpoint&fit=clip&h=852&w=700",
      imageAlt: "Great Dark Spot Neptunus oleh Voyager 2",
      imageCaption: "Great Dark Spot · Voyager 2 / NASA-JPL",
      source: "https://science.nasa.gov/photojournal/neptune-through-a-clear-filter/",
      facts: [
        "Voyager 2 menemukan Great Dark Spot pada 1989.",
        "Dark spot bukan noda permanen di permukaan, melainkan badai atmosfer.",
        "Teleskop Hubble kemudian melihat vortex gelap lain muncul di lokasi dan waktu berbeda."
      ],
      lead: "Great Dark Spot adalah salah satu ikon cuaca Neptunus. Ia memperlihatkan bahwa dunia biru ini punya sistem badai hidup yang berubah dari waktu ke waktu.",
      why: "Badai gelap Neptunus memberi petunjuk tentang sirkulasi atmosfer, kestabilan vortex besar, dan evolusi cuaca di planet es raksasa.",
      preview: "storm"
    },
    {
      id: "clouds",
      name: "Awan Tinggi Cerah",
      short: "HIGH CLOUDS",
      topicIndex: 6,
      category: "AWAN ATMOSFER",
      descriptor: "Awan putih terang menandai cuaca aktif dan aliran cepat",
      locationLabel: "Lapisan atas atmosfer Neptunus",
      image: "https://assets.science.nasa.gov/dynamicimage/assets/science/psd/photojournal/pia/pia02/pia02222/PIA02222.jpg?crop=faces%2Cfocalpoint&fit=clip&h=400&w=400",
      imageAlt: "Awan tinggi terang Neptunus dipotret Voyager 2",
      imageCaption: "Awan tinggi Neptunus · Voyager 2 / NASA-JPL",
      source: "https://science.nasa.gov/photojournal/neptune-clouds-on-the-dark-spot/",
      facts: [
        "Awan tinggi sering tampak sebagai streak putih terang.",
        "Awan ini membantu ilmuwan mengukur kecepatan angin.",
        "Awan cerah kerap berhubungan dengan sistem badai dan gelombang atmosfer."
      ],
      lead: "Di atas warna biru Neptunus, awan putih terang sering menjadi petunjuk paling jelas bahwa atmosfer planet ini sedang bergerak sangat cepat.",
      why: "Melacak awan terang memberi data langsung tentang arah dan kecepatan angin di lapisan atas atmosfer Neptunus.",
      preview: "clouds"
    },
    {
      id: "rings",
      name: "Cincin & Arc Neptunus",
      short: "RING ARCS",
      topicIndex: 7,
      category: "SISTEM CINCIN",
      descriptor: "Cincin tipis gelap dengan kumpulan material terang bernama arc",
      locationLabel: "Cincin Adams dan Le Verrier",
      image: "https://assets.science.nasa.gov/dynamicimage/assets/science/psd/photojournal/pia/pia02/pia02207/PIA02207.jpg?crop=faces%2Cfocalpoint&fit=clip&h=900&w=1200",
      imageAlt: "Cincin Neptunus dipotret Voyager 2",
      imageCaption: "Cincin Neptunus · Voyager 2 / NASA-JPL",
      source: "https://science.nasa.gov/photojournal/neptunes-rings/",
      facts: [
        "Neptunus memiliki sedikitnya lima cincin utama.",
        "Beberapa bagian cincin tampak lebih terang dan disebut ring arc.",
        "Arc menunjukkan bahwa distribusi materi cincin Neptunus tidak merata."
      ],
      lead: "Neptunus juga punya cincin, tetapi lebih tipis dan gelap daripada Saturnus. Yang membuatnya istimewa adalah adanya arc—bagian cincin yang tampak lebih terang dan padat.",
      why: "Arc cincin Neptunus membantu ilmuwan mempelajari bagaimana gravitasi bulan dan resonansi dapat menjaga materi cincin tetap terkumpul. ",
      preview: "rings"
    },
    {
      id: "triton",
      name: "Triton",
      short: "TRITON",
      topicIndex: 8,
      category: "BULAN UTAMA",
      descriptor: "Bulan besar retrograde dengan geyser nitrogen beku",
      locationLabel: "Orbit Triton",
      image: "https://assets.science.nasa.gov/dynamicimage/assets/science/psd/photojournal/pia/pia00/pia00317/PIA00317.jpg?crop=faces%2Cfocalpoint&fit=clip&h=930&w=930",
      imageAlt: "Permukaan Triton dipotret Voyager 2",
      imageCaption: "Triton · Voyager 2 / NASA-JPL",
      source: "https://science.nasa.gov/photojournal/global-color-mosaic-of-triton/",
      facts: [
        "Triton mengorbit Neptunus secara retrograde, berlawanan arah dengan rotasi Neptunus.",
        "Voyager 2 melihat tanda-tanda geyser nitrogen pada permukaannya.",
        "Triton diduga merupakan objek Sabuk Kuiper yang tertangkap gravitasi Neptunus."
      ],
      lead: "Triton bukan bulan biasa. Orbit retrograde dan permukaan aktifnya membuat bulan ini menjadi salah satu dunia paling menarik di sistem Neptunus.",
      why: "Triton dapat menyimpan petunjuk tentang objek Sabuk Kuiper, evolusi bulan tertangkap, dan aktivitas kriovulkanik di dunia es.",
      preview: "triton"
    }
  ]);

  const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
  const delay = ms => new Promise(resolve => window.setTimeout(resolve, ms));

  class NeptuneFullExploration {
    constructor(scene) {
      this.scene = scene;
      this.root = document.getElementById("neptune-full-exploration");
      this.entryButton = document.getElementById("neptune-full-explore-button");
      if (!scene || !this.root || !this.entryButton) return;
      this.viewportPlaceholder = null;
      this.viewportMounted = false;

      this.qualityPanel = document.getElementById("neptune-quality-panel");
      this.qualityOptions = document.getElementById("neptune-quality-options");
      this.qualityClose = document.getElementById("neptune-quality-close");
      this.qualityStart = document.getElementById("neptune-quality-start");
      this.qualityLabel = document.getElementById("neptune-quality-selected-label");
      this.qualityNote = document.getElementById("neptune-quality-device-note");
      this.selector = document.getElementById("neptune-region-selector");
      this.selectorClose = document.getElementById("neptune-region-selector-close");
      this.selectorGrid = document.getElementById("neptune-region-grid");
      this.hudTarget = document.getElementById("neptune-full-hud-location");
      this.hudView = document.getElementById("neptune-full-hud-view");
      this.hudZoom = document.getElementById("neptune-full-hud-zoom");
      this.hudType = document.getElementById("neptune-full-hud-region-type");
      this.hudQuality = document.getElementById("neptune-full-hud-quality");
      this.objectives = document.getElementById("neptune-objectives-panel");
      this.objectivesList = document.getElementById("neptune-objectives-list");
      this.objectivesCount = document.getElementById("neptune-discovery-count");
      this.objectivesBar = document.getElementById("neptune-discovery-bar");
      this.objectivesCollapse = document.getElementById("neptune-objectives-collapse");
      this.objectivesToggle = document.getElementById("neptune-objectives-toggle");
      this.nextTarget = document.getElementById("neptune-next-target");
      this.nextTargetName = document.getElementById("neptune-next-target-name");
      this.nextTargetDistance = document.getElementById("neptune-next-target-distance");
      this.info = document.getElementById("neptune-landmark-card");
      this.infoMinimize = document.getElementById("neptune-landmark-minimize");
      this.infoToggle = document.getElementById("neptune-info-toggle");
      this.infoName = document.getElementById("neptune-landmark-name");
      this.infoType = document.getElementById("neptune-landmark-type");
      this.infoCoords = document.getElementById("neptune-landmark-coords");
      this.infoImage = document.getElementById("neptune-landmark-image");
      this.infoCaption = document.getElementById("neptune-landmark-image-caption");
      this.infoMedia = document.getElementById("neptune-landmark-media");
      this.infoDescription = document.getElementById("neptune-landmark-description");
      this.infoFacts = document.getElementById("neptune-landmark-facts");
      this.infoSource = document.getElementById("neptune-landmark-source");
      this.observationPrompt = document.getElementById("neptune-observation-prompt");
      this.observationPromptTitle = document.getElementById("neptune-observation-prompt-title");
      this.observeButton = document.getElementById("neptune-observe-button");
      this.observationCard = document.getElementById("neptune-observation-card");
      this.observationClose = document.getElementById("neptune-observation-close");
      this.observationTitle = document.getElementById("neptune-observation-title");
      this.observationMeta = document.getElementById("neptune-observation-meta");
      this.observationLead = document.getElementById("neptune-observation-lead");
      this.observationWhy = document.getElementById("neptune-observation-why");
      this.observationDeep = document.getElementById("neptune-observation-deep");
      this.observationSource = document.getElementById("neptune-observation-source");
      this.observationStatus = document.getElementById("neptune-observation-status");
      this.actionsRoot = this.root.querySelector(".venus-full-actions");
      this.actionsMenuToggle = document.getElementById("neptune-actions-menu-toggle");
      this.actionsMenu = document.getElementById("neptune-actions-menu");
      this.locationButton = document.getElementById("neptune-location-toggle");
      this.fullscreenButton = document.getElementById("neptune-fullscreen-toggle");
      this.exitButton = document.getElementById("neptune-full-exit");
      this.loading = document.getElementById("neptune-full-loading");
      this.loadingTitle = document.getElementById("neptune-full-loading-title");
      this.loadingStatus = document.getElementById("neptune-full-loading-status");
      this.loadingProgress = document.getElementById("neptune-full-loading-progress");
      this.tutorial = document.getElementById("neptune-full-tutorial");
      this.tutorialClose = document.getElementById("neptune-tutorial-close");
      this.inputLayer = document.getElementById("neptune-full-orbit-input");
      this.mobileControls = this.root.querySelectorAll("[data-neptune-control]");

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
      this.qualityOptions?.querySelectorAll("[data-neptune-quality]").forEach(button => {
        const selected = button.dataset.neptuneQuality === key;
        button.classList.toggle("is-selected", selected);
        button.setAttribute("aria-checked", String(selected));
        const badge = button.querySelector("[data-quality-recommendation]");
        if (badge) badge.textContent = button.dataset.neptuneQuality === this.recommendedQuality ? "DIREKOMENDASIKAN" : "";
      });
      if (this.qualityLabel) this.qualityLabel.textContent = this.quality.label;
      if (this.hudQuality) this.hudQuality.textContent = this.quality.label;
      if (this.qualityNote) this.qualityNote.textContent = `Rekomendasi perangkat saat ini: ${QUALITY[this.recommendedQuality].label}. Mode ini mengatur ketajaman renderer orbital Neptunus.`;
      this.scene.resize?.();
    }

    buildSelector() {
      const fragment = document.createDocumentFragment();
      DESTINATIONS.forEach((destination, index) => {
        const button = document.createElement("button");
        button.type = "button";
        button.className = "venus-region-card neptune-region-card";
        button.dataset.neptuneRegion = destination.id;
        button.innerHTML = `<span class="venus-region-preview neptune-region-preview neptune-region-preview-${destination.preview}" aria-hidden="true"><i></i><b>${destination.short}</b></span><span class="venus-region-index">${String(index + 1).padStart(2, "0")}</span><strong>${destination.name}</strong><span class="venus-region-descriptor">${destination.descriptor}</span><small>${destination.locationLabel}</small><em>${destination.category}</em><span class="venus-region-source">NASA / JPL-Caltech · Voyager 2 / NASA Science</span>`;
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
        li.dataset.neptuneObjective = destination.id;
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
      if (this.nextTargetDistance) this.nextTargetDistance.textContent = next ? "Pilih dari menu Wilayah untuk mengamati." : "Lima destinasi sistem Neptunus telah diamati.";
    }

    bind() {
      this.entryButton.addEventListener("click", () => this.openEntryFlow());
      this.qualityClose?.addEventListener("click", () => this.closeEntryFlow());
      this.qualityStart?.addEventListener("click", () => this.showSelector());
      this.qualityOptions?.addEventListener("click", event => {
        const button = event.target.closest("[data-neptune-quality]");
        if (button) this.applyQuality(button.dataset.neptuneQuality);
      });
      this.selectorClose?.addEventListener("click", () => {
        if (this.state === "selecting-world") this.closeSelectorToWorld(); else this.closeEntryFlow();
      });
      this.selectorGrid?.addEventListener("click", event => {
        const button = event.target.closest("[data-neptune-region]");
        if (!button) return;
        const destination = DESTINATIONS.find(item => item.id === button.dataset.neptuneRegion);
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
        const control = button.dataset.neptuneControl;
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
      const nextYaw = (this.scene.focusTo?.yaw ?? this.scene.viewYaw ?? -0.28) + yawDelta;
      const nextZoom = clamp((this.scene.focusTo?.z ?? this.scene.viewCameraZ ?? 7) + zoomDelta, 5.9, 8.35);
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
      this.viewportPlaceholder = document.createComment("antara-neptune-viewport-home");
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
      this.selectorGrid?.querySelectorAll("[data-neptune-region]").forEach(button => {
        const selected = button.dataset.neptuneRegion === this.selected.id;
        button.classList.toggle("is-selected", selected);
        button.setAttribute("aria-pressed", String(selected));
      });
    }

    openEntryFlow() {
      if (!this.scene.active || this.scene.travelMode || this.scene.fullExplorationActive) return;
      if (this.scene.exploring) this.scene.exitExploration();
      this.state = "configuring";
      this.scene.fullExplorationActive = true;
      this.scene.element.classList.add("is-neptune-full-active");
      this.root.hidden = false;
      this.root.inert = false;
      this.root.setAttribute("aria-hidden", "false");
      this.mountSceneViewport();
      this.entryButton.disabled = true;
      this.qualityPanel.hidden = false;
      this.selector.hidden = true;
      this.hideWorldUi();
      document.getElementById("announcement").textContent = "Pilih kualitas grafis untuk Eksplorasi Pengalaman Penuh Neptunus.";
    }

    closeEntryFlow() {
      if (!["configuring", "selecting"].includes(this.state)) return;
      this.state = "idle";
      this.scene.fullExplorationActive = false;
      this.scene.element.classList.remove("is-neptune-full-active");
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
      document.getElementById("announcement").textContent = "Pilih destinasi sistem Neptunus.";
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
      const yaw = this.scene.focusTo?.yaw ?? this.scene.viewYaw ?? -0.28;
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
      if (fresh) window.AntaraProgress?.trackFull?.("neptune", d.id, d.name);
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
      try { seen = sessionStorage.getItem("antara-neptune-full-tutorial") === "1"; } catch {}
      if (seen) return;
      this.tutorial.classList.add("is-visible");
      window.setTimeout(() => this.hideTutorial(false), 8500);
    }

    hideTutorial(persist = false) {
      this.tutorial.classList.remove("is-visible");
      if (persist) { try { sessionStorage.setItem("antara-neptune-full-tutorial", "1"); } catch {} }
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
      this.scene.element.classList.remove("is-neptune-full-active");
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
      this.scene._beginFocus?.(-0.28, 7);
      if (!this.scene.frame && this.scene.active) { this.scene.previous = performance.now(); this.scene.tick(this.scene.previous); }
      await delay(matchMedia("(prefers-reduced-motion: reduce)").matches ? 100 : 720);
      if (token !== this.transitionToken) return;
      if (this.scene.exploring) this.scene.exitExploration();
      await delay(matchMedia("(prefers-reduced-motion: reduce)").matches ? 80 : 420);
      if (token !== this.transitionToken) return;
      this.root.classList.remove("is-exploring", "is-exiting");
      this.scene.fullExplorationActive = false;
      this.scene.element.classList.remove("is-neptune-full-active");
      this.restoreSceneViewport();
      this.root.hidden = true;
      this.root.inert = true;
      this.root.setAttribute("aria-hidden", "true");
      this.scene.resize?.();
      this.state = "idle";
      this.entryButton.disabled = false;
      this.scene.caption.inert = false;
      document.getElementById("announcement").textContent = "Kembali ke panorama Neptunus.";
      requestAnimationFrame(() => this.entryButton.focus({ preventScroll:true }));
    }
  }

  window.NeptuneFullExploration = NeptuneFullExploration;
  window.ANTARA_NEPTUNE_FULL_DESTINATIONS = DESTINATIONS;
})();
