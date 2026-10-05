"use strict";

// One renderer shared by Earth and Mars. A new image per selection keeps late
// load/error events from an earlier topic from changing the current figure.
window.ExplorationMedia = {
  render(prefix, stop) {
    const figure = document.getElementById(`${prefix}-topic-media`);
    figure.replaceChildren();
    figure.hidden = !stop.image;
    if (!stop.image) return;

    const frame = document.createElement("div");
    frame.className = "exploration-media-frame";
    const status = document.createElement("span");
    status.className = "exploration-media-status";
    status.textContent = "Memuat gambar…";
    const image = document.createElement("img");
    image.alt = stop.imageAlt;
    image.width = stop.imageWidth;
    image.height = stop.imageHeight;
    image.loading = "lazy";
    image.decoding = "async";
    image.style.objectFit = stop.imageFit || "contain";
    image.addEventListener("load", () => { status.hidden = true; });
    image.addEventListener("error", () => {
      image.hidden = true;
      status.textContent = "Gambar tidak tersedia. Keterangan dan sumber tetap dapat dibaca.";
    });
    image.src = stop.image;
    frame.append(image, status);

    const caption = document.createElement("figcaption");
    const description = document.createElement("span");
    description.textContent = stop.imageCaption;
    const credit = document.createElement("a");
    credit.href = stop.imageSource;
    credit.target = "_blank";
    credit.rel = "noopener noreferrer";
    credit.textContent = `Foto/citra: ${stop.imageCredit}`;
    const license = document.createElement("a");
    license.href = stop.imageLicenseUrl;
    license.target = "_blank";
    license.rel = "noopener noreferrer";
    license.textContent = stop.imageLicense;
    const attribution = document.createElement("span");
    attribution.append(credit, document.createTextNode(" · "), license);
    caption.append(description, attribution);
    figure.append(frame, caption);
  }
};
