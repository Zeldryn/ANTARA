"use strict";

(() => {
  const $ = selector => document.querySelector(selector);
  const grid = $("#progress-grid");
  const empty = $("#progress-empty");
  const locked = $("#progress-locked");
  const errorPanel = $("#progress-error");
  const retry = $("#progress-retry");
  const account = $("#progress-account");

  const PLANET_VISUALS = {
    "sun": { image: "assets/progress-planets/sun.png", className: "is-sun" },
    "mercury": { image: "assets/progress-planets/mercury.png", className: "is-mercury" },
    "venus": { image: "assets/progress-planets/venus.png", className: "is-venus" },
    "earth": { image: "assets/progress-planets/earth.png", className: "is-earth" },
    "mars": { image: "assets/progress-planets/mars.png", className: "is-mars" },
    "asteroid-belt": { image: "assets/progress-planets/asteroid-belt.png", className: "is-asteroid" },
    "jupiter": { image: "assets/progress-planets/jupiter.png", className: "is-jupiter" },
    "saturn": { image: "assets/progress-planets/saturn.png", className: "is-saturn" },
    "uranus": { image: "assets/progress-planets/uranus.png", className: "is-uranus" },
    "neptune": { image: "assets/progress-planets/neptune.png", className: "is-neptune" },
  };

  const planetVisualFor = planet => PLANET_VISUALS[planet?.planet] || null;

  const formatUpdated = value => {
    if (!value) return "Belum ada aktivitas eksplorasi.";
    const normalized = String(value).replace(" ", "T") + (String(value).includes("Z") ? "" : "");
    const date = new Date(normalized);
    if (Number.isNaN(date.getTime())) return "Progress tersimpan di akunmu.";
    return `Terakhir tercatat ${new Intl.DateTimeFormat("id-ID", { dateStyle:"medium", timeStyle:"short" }).format(date)}`;
  };

  const statusFor = planet => {
    if (planet.completed) return { text:"SELESAI", className:"is-complete" };
    if (planet.started) return { text:"SEDANG DIJELAJAHI", className:"is-active" };
    return { text:"BELUM DIMULAI", className:"" };
  };

  function renderPlanet(planet) {
    const status = statusFor(planet);
    const full = planet.full || { available:false, completed:0, total:0 };
    const visual = planetVisualFor(planet);
    const updated = planet.updatedAt ? formatUpdated(planet.updatedAt).replace("Terakhir tercatat ", "") : "Belum tercatat";
    const card = document.createElement("article");
    card.className = "planet-progress-card";
    if (planet?.planet) card.dataset.planet = String(planet.planet);
    card.style.setProperty("--planet-progress", `${Math.max(0, Math.min(100, Number(planet.progress) || 0))}%`);
    card.innerHTML = ` <div class="planet-progress-head"> <div class="planet-head-main"> <span class="planet-orb ${escapeHtml(visual?.className || "")}" aria-hidden="true">${visual?.image ? `<img src="${escapeHtml(visual.image)}" alt="">` : ""}</span> <div class="planet-title"><small>${escapeHtml(planet.short || planet.name)}</small><h3>${escapeHtml(planet.name)}</h3></div> </div> <strong class="planet-percent">${Number(planet.progress) || 0}%</strong> </div> <div class="planet-progress-track" aria-hidden="true"><i></i></div> <div class="planet-progress-meta"> <div><small>JELAJAH BIASA</small><strong>${planet.normal.completed} / ${planet.normal.total} topik</strong></div> <div class="full-meta ${full.available ? "" : "is-unavailable"}"><small>EKSPLORASI PENUH</small><strong>${full.available ? `${full.completed} / ${full.total} destinasi` : "Belum tersedia"}</strong></div> </div> <div class="planet-progress-foot"> <span class="planet-status ${status.className}"><i></i>${status.text}</span> <span>${escapeHtml(updated)}</span> </div>`;
    return card;
  }

  function escapeHtml(value) {
    return String(value ?? "").replace(/[&<>'"]/g, char => ({ "&":"&amp;", "<":"&lt;", ">":"&gt;", "'":"&#39;", '"':"&quot;" }[char]));
  }

  function render(data) {
    document.body.classList.remove("is-locked", "has-error");
    locked.hidden = true;
    errorPanel.hidden = true;

    const overall = data.overall || {};
    const planets = Array.isArray(data.planets) ? data.planets : [];
    const percent = Math.max(0, Math.min(100, Number(overall.progress) || 0));
    $("#overall-ring").style.setProperty("--progress", String(percent));
    $("#overall-percent").textContent = `${percent}%`;
    $("#overall-milestones").textContent = `${overall.completedMilestones || 0} / ${overall.totalMilestones || 0} milestone`;
    $("#overall-updated").textContent = formatUpdated(overall.updatedAt);
    $("#stat-explored").textContent = `${overall.exploredObjects || 0} / ${overall.totalObjects || planets.length}`;
    $("#stat-completed").textContent = String(overall.completedObjects || 0);
    $("#stat-milestones").textContent = String(overall.completedMilestones || 0);

    grid.replaceChildren(...planets.map(renderPlanet));
    empty.hidden = (overall.completedMilestones || 0) > 0;
  }

  function showLocked() {
    document.body.classList.add("is-locked");
    document.body.classList.remove("has-error");
    locked.hidden = false;
    errorPanel.hidden = true;
    account.innerHTML = '<span class="progress-account-dot"></span><span>BELUM MASUK</span>';
  }

  function showError(message) {
    document.body.classList.add("has-error");
    document.body.classList.remove("is-locked");
    locked.hidden = true;
    errorPanel.hidden = false;
    $("#progress-error-message").textContent = message || "Periksa Apache, MySQL, dan koneksi database ANTARA.";
  }

  async function fetchJson(url) {
    const response = await fetch(url, { credentials:"same-origin", headers:{ Accept:"application/json" } });
    const data = await response.json().catch(() => ({}));
    return { response, data };
  }

  async function load() {
    retry.disabled = true;
    try {
      const auth = await fetchJson("api/auth/me.php");
      if (auth.response.status === 401 || !auth.data.success || !auth.data.authenticated) {
        showLocked();
        return;
      }
      const user = auth.data.user || {};
      account.innerHTML = `<span class="progress-account-dot"></span><span>${escapeHtml(user.name || user.username || "PENJELAJAH")}</span>`;

      const result = await fetchJson("api/progress/get.php");
      if (result.response.status === 401) {
        showLocked();
        return;
      }
      if (!result.response.ok || !result.data.success) {
        throw new Error(result.data.message || "Progress belum dapat dimuat dari database.");
      }
      render(result.data);
    } catch (error) {
      console.warn("ANTARA progress page", error);
      showError(error.message);
    } finally {
      retry.disabled = false;
    }
  }

  retry.addEventListener("click", load);
  window.addEventListener("pageshow", event => { if (event.persisted) load(); });
  load();
})();
