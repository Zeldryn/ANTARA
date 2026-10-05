"use strict";

// Shared marker-side visual preview and lightbox for Earth + Mars.
window.ExplorationMedia = {
  lightbox: null,
  activeImages: [],
  activeIndex: 0,
  activeStop: null,
  previousFocus: null,

  canonicalSrc(src) {
    return String(src || "")
      .trim()
      .split("#", 1)[0]
      .split("?", 1)[0]
      .toLowerCase();
  },

  getImages(stop) {
    const seen = new Set();
    const raw = Array.isArray(stop?.images) ? stop.images : [];

    return raw
      .filter(item => item && typeof item.src === "string" && item.src.trim())
      .filter(item => {
        const key = this.canonicalSrc(item.src);
        if (!key || seen.has(key)) return false;
        seen.add(key);
        return true;
      })
      .slice(0, 2)
      .map((item, index) => ({
        src: item.src.trim(),
        alt: item.alt || `${stop.title || "Visual"} ${index + 1}`,
        credit: item.credit || "",
        source: item.source || stop.source || "",
        license: item.license || "",
        licenseUrl: item.licenseUrl || "",
        caption: item.caption || stop.title || "",
        fit: item.fit || "cover",
        position: item.position || "50% 50%"
      }));
  },

  ensureLightbox() {
    if (this.lightbox) return this.lightbox;

    const root = document.createElement("div");
    root.className = "exploration-lightbox";
    root.hidden = true;
    root.setAttribute("aria-hidden", "true");

    const backdrop = document.createElement("button");
    backdrop.type = "button";
    backdrop.className = "exploration-lightbox-backdrop";
    backdrop.setAttribute("aria-label", "Tutup pratinjau visual");

    const dialog = document.createElement("figure");
    dialog.className = "exploration-lightbox-dialog";
    dialog.setAttribute("role", "dialog");
    dialog.setAttribute("aria-modal", "true");
    dialog.setAttribute("aria-labelledby", "exploration-lightbox-title");
    dialog.tabIndex = -1;

    const close = document.createElement("button");
    close.type = "button";
    close.className = "exploration-lightbox-close";
    close.setAttribute("aria-label", "Tutup visual");
    close.innerHTML = '<span aria-hidden="true">×</span>';

    const previous = document.createElement("button");
    previous.type = "button";
    previous.className = "exploration-lightbox-nav exploration-lightbox-prev";
    previous.setAttribute("aria-label", "Visual sebelumnya");
    previous.innerHTML = '<span aria-hidden="true">‹</span>';

    const next = document.createElement("button");
    next.type = "button";
    next.className = "exploration-lightbox-nav exploration-lightbox-next";
    next.setAttribute("aria-label", "Visual berikutnya");
    next.innerHTML = '<span aria-hidden="true">›</span>';

    const imageWrap = document.createElement("div");
    imageWrap.className = "exploration-lightbox-image-wrap";

    const image = document.createElement("img");
    image.className = "exploration-lightbox-image";
    image.alt = "";
    image.decoding = "async";

    const loading = document.createElement("span");
    loading.className = "exploration-lightbox-loading";
    loading.textContent = "Memuat visual…";

    imageWrap.append(image, loading);

    const caption = document.createElement("figcaption");
    caption.className = "exploration-lightbox-caption";

    const headingRow = document.createElement("div");
    headingRow.className = "exploration-lightbox-heading-row";

    const title = document.createElement("strong");
    title.className = "exploration-lightbox-title";
    title.id = "exploration-lightbox-title";

    const counter = document.createElement("span");
    counter.className = "exploration-lightbox-counter";

    const description = document.createElement("span");
    description.className = "exploration-lightbox-description";

    const metadata = document.createElement("span");
    metadata.className = "exploration-lightbox-metadata";

    const source = document.createElement("a");
    source.className = "exploration-lightbox-link";
    source.target = "_blank";
    source.rel = "noopener noreferrer";
    source.textContent = "Sumber visual ↗";

    headingRow.append(title, counter);
    caption.append(headingRow, description, metadata, source);
    dialog.append(close, previous, next, imageWrap, caption);
    root.append(backdrop, dialog);
    document.body.append(root);

    backdrop.addEventListener("click", () => this.closeLightbox());
    close.addEventListener("click", () => this.closeLightbox());
    previous.addEventListener("click", () => this.stepLightbox(-1));
    next.addEventListener("click", () => this.stepLightbox(1));

    document.addEventListener("keydown", event => {
      if (!this.lightbox || this.lightbox.root.hidden) return;
      if (event.key === "Escape") {
        event.preventDefault();
        this.closeLightbox();
      } else if (event.key === "ArrowLeft" && this.activeImages.length > 1) {
        event.preventDefault();
        this.stepLightbox(-1);
      } else if (event.key === "ArrowRight" && this.activeImages.length > 1) {
        event.preventDefault();
        this.stepLightbox(1);
      }
    });

    image.addEventListener("load", () => {
      loading.hidden = true;
      image.hidden = false;
    });
    image.addEventListener("error", () => {
      image.hidden = true;
      loading.hidden = false;
      loading.textContent = "Visual gagal dimuat";
    });

    this.lightbox = { root, dialog, previous, next, image, loading, title, counter, description, metadata, source };
    return this.lightbox;
  },

  updateLightbox() {
    const modal = this.ensureLightbox();
    const item = this.activeImages[this.activeIndex];
    if (!item) return;

    modal.image.hidden = true;
    modal.loading.hidden = false;
    modal.loading.textContent = "Memuat visual…";
    modal.image.src = item.src;
    modal.image.alt = item.alt;
    modal.title.textContent = this.activeStop?.title || "Visual eksplorasi";
    modal.counter.textContent = `${String(this.activeIndex + 1).padStart(2, "0")} / ${String(this.activeImages.length).padStart(2, "0")}`;
    modal.description.textContent = item.caption || item.alt || "";
    modal.metadata.textContent = [item.credit, item.license].filter(Boolean).join(" · ");
    modal.metadata.hidden = !modal.metadata.textContent;

    modal.source.hidden = !item.source;
    if (item.source) modal.source.href = item.source;
    else modal.source.removeAttribute("href");

    const hasMultiple = this.activeImages.length > 1;
    modal.previous.hidden = !hasMultiple;
    modal.next.hidden = !hasMultiple;
    modal.previous.disabled = !hasMultiple || this.activeIndex === 0;
    modal.next.disabled = !hasMultiple || this.activeIndex === this.activeImages.length - 1;
  },

  openLightbox(images, startingIndex, stop, trigger) {
    const modal = this.ensureLightbox();
    this.activeImages = Array.isArray(images) ? images.slice(0, 2) : [];
    if (!this.activeImages.length) return;

    this.activeIndex = Math.max(0, Math.min(this.activeImages.length - 1, Number(startingIndex) || 0));
    this.activeStop = stop || null;
    this.previousFocus = trigger || document.activeElement;
    this.updateLightbox();

    modal.root.hidden = false;
    modal.root.setAttribute("aria-hidden", "false");
    document.documentElement.classList.add("is-exploration-lightbox-open");
    requestAnimationFrame(() => modal.dialog.focus({ preventScroll: true }));
  },

  stepLightbox(delta) {
    if (this.activeImages.length <= 1) return;
    const nextIndex = this.activeIndex + delta;
    if (nextIndex < 0 || nextIndex >= this.activeImages.length) return;
    this.activeIndex = nextIndex;
    this.updateLightbox();
  },

  closeLightbox({ restoreFocus = true } = {}) {
    const modal = this.lightbox;
    if (!modal || modal.root.hidden) {
      this.activeImages = [];
      this.activeIndex = 0;
      this.activeStop = null;
      return;
    }

    modal.root.hidden = true;
    modal.root.setAttribute("aria-hidden", "true");
    modal.image.removeAttribute("src");
    modal.image.hidden = true;
    document.documentElement.classList.remove("is-exploration-lightbox-open");

    const focusTarget = this.previousFocus;
    this.activeImages = [];
    this.activeIndex = 0;
    this.activeStop = null;
    this.previousFocus = null;

    if (restoreFocus && focusTarget?.isConnected && typeof focusTarget.focus === "function") {
      focusTarget.focus({ preventScroll: true });
    }
  },

  render(prefix, stop) {
    const host = document.getElementById(`${prefix}-marker-media`);
    if (!host) return;

    // Changing topic/landmark must never retain stale modal state.
    this.closeLightbox({ restoreFocus: false });
    host.replaceChildren();

    const images = this.getImages(stop);
    host.hidden = images.length === 0;
    if (!images.length) return;

    this.ensureLightbox();
    const gallery = document.createElement("div");
    gallery.className = `exploration-marker-gallery${images.length > 1 ? " is-dual" : ""}`;

    const refreshGalleryState = () => {
      const count = gallery.querySelectorAll(".exploration-marker-frame").length;
      gallery.classList.toggle("is-dual", count > 1);
      host.hidden = count === 0;
    };

    images.forEach((item, index) => {
      const frame = document.createElement("button");
      frame.type = "button";
      frame.className = "exploration-marker-frame";
      frame.disabled = true;
      frame.setAttribute("aria-label", `Perbesar visual ${index + 1} untuk ${stop.title}`);
      frame._explorationImage = item;

      const chip = document.createElement("span");
      chip.className = "exploration-marker-chip";
      chip.textContent = String(index + 1).padStart(2, "0");

      const status = document.createElement("span");
      status.className = "exploration-marker-status";
      status.textContent = "Memuat…";

      const image = document.createElement("img");
      image.alt = item.alt;
      image.loading = "eager";
      image.decoding = "async";
      image.style.objectFit = "cover";
      image.style.objectPosition = item.position;
      image.addEventListener("load", () => {
        status.hidden = true;
        frame.disabled = false;
      });
      image.addEventListener("error", () => {
        frame.remove();
        refreshGalleryState();
      });
      image.src = item.src;

      frame.addEventListener("click", () => {
        const liveFrames = [...gallery.querySelectorAll(".exploration-marker-frame:not(:disabled)")];
        const liveImages = liveFrames.map(button => button._explorationImage).filter(Boolean);
        const liveIndex = liveFrames.indexOf(frame);
        if (liveIndex >= 0) this.openLightbox(liveImages, liveIndex, stop, frame);
      });

      frame.append(image, chip, status);
      gallery.append(frame);
    });

    const meta = document.createElement("span");
    meta.className = "exploration-marker-meta";
    meta.textContent = "VISUAL · KLIK UNTUK PERBESAR";

    host.append(gallery, meta);
  }
};
