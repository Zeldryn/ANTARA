"use strict";

// Shared marker-side visual preview for Earth and Mars.
// The information cards remain text-first; media lives with the active map marker.
window.ExplorationMedia = {
  render(prefix, stop) {
    const host = document.getElementById(`${prefix}-marker-media`);
    if (!host) return;

    host.replaceChildren();
    host.hidden = !stop.image;
    if (!stop.image) return;

    const sources = [
      {
        src: stop.image,
        alt: stop.imageAlt || `${stop.title} preview`,
        fit: stop.markerImageFit || "cover",
        position: stop.imagePosition || "50% 50%",
        detail: false
      }
    ];

    if (stop.secondaryImage) {
      sources.push({
        src: stop.secondaryImage,
        alt: stop.secondaryImageAlt || `Foto pendukung ${stop.title}`,
        fit: stop.secondaryImageFit || "cover",
        position: stop.secondaryImagePosition || "50% 50%",
        detail: false
      });
    } else if (stop.dualPreview !== false) {
      // The source project currently provides one verified local image per stop.
      // A second, tighter view keeps the two-frame annotation without inventing
      // an unrelated asset; a true secondaryImage can replace it data-first later.
      sources.push({
        src: stop.image,
        alt: "",
        fit: "cover",
        position: stop.detailPosition || "62% 50%",
        detail: true
      });
    }

    const gallery = document.createElement("div");
    gallery.className = `exploration-marker-gallery${sources.length > 1 ? " is-dual" : ""}`;

    sources.slice(0, 2).forEach((source, index) => {
      const frame = document.createElement("span");
      frame.className = `exploration-marker-frame${source.detail ? " is-detail" : ""}${index === 0 ? " is-primary" : ""}`;

      const status = document.createElement("span");
      status.className = "exploration-marker-status";
      status.textContent = "Memuat…";

      const image = document.createElement("img");
      image.alt = source.alt;
      image.loading = "eager";
      image.decoding = "async";
      image.style.objectFit = source.fit;
      image.style.objectPosition = source.position;
      image.addEventListener("load", () => { status.hidden = true; });
      image.addEventListener("error", () => {
        frame.classList.add("has-error");
        image.hidden = true;
        status.textContent = "Visual tidak tersedia";
      });
      image.src = source.src;
      frame.append(image, status);
      gallery.append(frame);
    });

    const meta = document.createElement("span");
    meta.className = "exploration-marker-meta";
    meta.textContent = stop.imageCredit ? `VISUAL · ${stop.imageCredit}` : "VISUAL LOKASI";

    host.append(gallery, meta);
  }
};
