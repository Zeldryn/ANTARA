"use strict";
(() => {
  const $ = selector => document.querySelector(selector);
  const $$ = selector => Array.from(document.querySelectorAll(selector));
  const account = $("#ach-account");
  const specialGrid = $("#ach-special");
  const planetGrid = $("#ach-planets");
  const lockedPage = $("#ach-locked-page");
  const errorPanel = $("#ach-error");
  const retry = $("#ach-retry");

  const esc = value => String(value ?? "").replace(/[&<>'"]/g, ch => ({"&":"&amp;","<":"&lt;",">":"&gt;","'":"&#39;",'"':"&quot;"}[ch]));
  const tierLabel = tier => ({common:"MISI",rare:"LANGKA",epic:"ELIT",legendary:"LEGENDA"}[tier] || "MEDALI");
  const formatDate = value => {
    if (!value) return "TERKUNCI";
    const date = new Date(String(value).replace(" ", "T"));
    if (Number.isNaN(date.getTime())) return "TERBUKA";
    return new Intl.DateTimeFormat("id-ID", { day:"2-digit", month:"short", year:"numeric" }).format(date).toUpperCase();
  };

  function card(item) {
    const el = document.createElement("article");
    el.className = `ach-card ${item.unlocked ? "is-unlocked" : "is-locked"}`;
    el.dataset.tier = item.tier || "common";
    const pct = Math.max(0, Math.min(100, Number(item.progress?.percent) || 0));
    el.innerHTML = ` <div class="ach-medal"> <span class="ach-lock">${item.unlocked ? "TERBUKA" : "TERKUNCI"}</span> <img src="${esc(item.icon)}" alt="" loading="lazy" decoding="async"> <span class="ach-tap-hint">${item.unlocked ? "KETUK UNTUK LIHAT" : "KETUK UNTUK CEK"}</span> </div> <div class="ach-body"> <div class="ach-topline"><span class="ach-tier">${tierLabel(item.tier)}</span><span class="ach-date">${formatDate(item.unlockedAt)}</span></div> <h3>${esc(item.name)}</h3> <p>${esc(item.description)}</p> <div class="ach-progress" style="--progress:${pct}%"><div><i></i></div><span>${esc(item.unlocked ? "SELESAI ✦" : (item.progress?.label || "Belum dimulai"))}</span></div> </div>`;
    el.tabIndex = 0;
    el.setAttribute("role", "button");
    el.setAttribute("aria-label", `${item.name}. ${item.unlocked ? "Pencapaian terbuka" : `Progress ${pct}%`}.`);
    const togglePeek = () => {
      document.querySelectorAll(".ach-card.is-peek").forEach(card => { if (card !== el) card.classList.remove("is-peek"); });
      el.classList.toggle("is-peek");
    };
    el.addEventListener("click", togglePeek);
    el.addEventListener("keydown", event => {
      if (event.key === "Enter" || event.key === " ") { event.preventDefault(); togglePeek(); }
    });
    return el;
  }

  function setFilter(filter) {
    $$(".ach-filters button").forEach(btn => btn.classList.toggle("is-active", btn.dataset.filter === filter));
    $$("[data-category-section]").forEach(section => { section.hidden = filter !== "all" && section.dataset.categorySection !== filter; });
  }

  function render(data) {
    document.body.classList.remove("is-locked", "has-error");
    lockedPage.hidden = true; errorPanel.hidden = true;
    const items = Array.isArray(data.items) ? data.items : [];
    const special = items.filter(i => i.category === "special");
    const planets = items.filter(i => i.category === "planet");
    specialGrid.replaceChildren(...special.map(card));
    planetGrid.replaceChildren(...planets.map(card));

    const summary = data.summary || {};
    const unlocked = Number(summary.unlocked) || 0;
    const total = Number(summary.total) || items.length || 30;
    const percent = Number(summary.percent) || 0;
    $("#ach-ring").style.setProperty("--value", String(percent));
    $("#ach-percent").textContent = `${percent}%`;
    $("#ach-count").textContent = `${unlocked} / ${total}`;
    $("#stat-unlocked").textContent = String(unlocked);
    $("#stat-locked").textContent = String(Math.max(0, total - unlocked));
    $("#stat-rank").textContent = data.bestRank ? `#${data.bestRank}` : "-";

    const locked = items.filter(i => !i.unlocked).sort((a,b) => (b.progress?.percent || 0) - (a.progress?.percent || 0));
    $("#ach-next").textContent = locked.length ? `Paling dekat: ${locked[0].name} · ${locked[0].progress?.label || "lanjutkan perjalanan"}` : "Seluruh koleksi medali sudah terbuka.";
  }

  function showLocked() {
    document.body.classList.add("is-locked"); document.body.classList.remove("has-error");
    lockedPage.hidden = false; errorPanel.hidden = true;
    account.innerHTML = '<i></i><span>BELUM MASUK</span>';
  }
  function showError(message) {
    document.body.classList.add("has-error"); document.body.classList.remove("is-locked");
    errorPanel.hidden = false; lockedPage.hidden = true;
    $("#ach-error-message").textContent = message || "Coba buka lagi sebentar.";
  }
  async function json(url) {
    const response = await fetch(url, { credentials:"same-origin", headers:{ Accept:"application/json" }, cache:"no-store" });
    const data = await response.json().catch(() => ({}));
    return { response, data };
  }
  async function load() {
    retry.disabled = true;
    try {
      const auth = await json("api/auth/me.php");
      if (auth.response.status === 401 || !auth.data.success || !auth.data.authenticated) { showLocked(); return; }
      const user = auth.data.user || {};
      account.innerHTML = `<i></i><span>${esc(user.name || user.username || "PENJELAJAH")}</span>`;
      const result = await json("api/achievements/get.php");
      if (result.response.status === 401) { showLocked(); return; }
      if (!result.response.ok || !result.data.success) throw new Error(result.data.message || "Pencapaian belum dapat dimuat.");
      render(result.data);
    } catch (error) {
      console.warn("ANTARA achievements", error);
      showError(error.message);
    } finally { retry.disabled = false; }
  }

  $$(".ach-filters button").forEach(btn => btn.addEventListener("click", () => setFilter(btn.dataset.filter || "all")));
  retry.addEventListener("click", load);
  window.addEventListener("pageshow", event => { if (event.persisted) load(); });
  load();
})();
