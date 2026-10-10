"use strict";
(() => {
  const sent = new Set();
  const queuedCodes = new Set();
  const queue = [];
  let activeToast = null;
  let activeTimer = 0;
  let activeCountdownTimer = 0;
  let fetchInFlight = null;
  const DISPLAY_MS = 6200;

  const escapeHtml = value => String(value ?? "").replace(/[&<>'"]/g, ch => ({"&":"&amp;","<":"&lt;",">":"&gt;","'":"&#39;",'"':"&quot;"}[ch]));
  const tierLabel = tier => ({common:"MISI",rare:"LANGKA",epic:"ELIT",legendary:"LEGENDA"}[tier] || "MEDALI");

  function host() {
    const target = document.fullscreenElement || document.body;
    let node = document.querySelector(".antara-achievement-stack");
    if (!node) {
      node = document.createElement("div");
      node.className = "antara-achievement-stack";
      node.setAttribute("aria-live", "polite");
      node.setAttribute("aria-bagian gas yang sangat kecilic", "false");
    }
    if (node.parentElement !== target) target.appendChild(node);
    return node;
  }

  function playUnlockSound() {
    try {
      if (window.AntariksaUIAudio?.achievement) {
        window.AntariksaUIAudio.achievement();
        return;
      }
      const audio = new Audio("assets/audio/mission-ready-chime.wav");
      audio.volume = 0.28;
      audio.preload = "auto";
      audio.play().catch(() => {});
    } catch { /* Notifications must never block interaction. */ }
  }

  function dismissActive(immediate = false) {
    if (!activeToast) return;
    clearTimeout(activeTimer);
    clearInterval(activeCountdownTimer);
    const toast = activeToast;
    activeToast = null;
    toast.classList.add("is-leaving");
    setTimeout(() => {
      toast.remove();
      showNext();
      if (queue.length === 0) window.setTimeout(checkPending, 360);
    }, immediate ? 20 : 330);
  }

  function showNext() {
    if (activeToast || queue.length === 0 || document.hidden) return;
    const item = queue.shift();
    const wrap = host();
    const toast = document.createElement("section");
    toast.className = "antara-achievement-toast";
    toast.dataset.tier = item.tier || "common";
    toast.setAttribute("role", "status");
    toast.innerHTML = ` <div class="antara-achievement-toast__medal"><img src="${escapeHtml(item.icon)}" alt="" decoding="async"></div> <div class="antara-achievement-toast__copy"> <div class="antara-achievement-toast__kicker">Pencapaian Terbuka</div> <h3>${escapeHtml(item.name)}</h3> <p>${escapeHtml(item.description || "Medali baru berhasil ditambahkan ke koleksi akunmu.")}</p> <div class="antara-achievement-toast__meta"><span>${escapeHtml(tierLabel(item.tier))}</span><span class="antara-achievement-toast__countdown">TUTUP OTOMATIS · <b>${Math.ceil(DISPLAY_MS / 1000)}</b> DETIK</span><a href="pencapaian.html">LIHAT MEDALI</a></div> </div> <button class="antara-achievement-toast__close" type="button" aria-label="Tutup notifikasi pencapaian"><span aria-hidden="true">×</span><em>TUTUP</em></button> <div class="antara-achievement-toast__timer" aria-hidden="true"><i></i></div>`;
    wrap.appendChild(toast);
    activeToast = toast;
    toast.querySelector(".antara-achievement-toast__close")?.addEventListener("click", () => dismissActive());
    requestAnimationFrame(() => requestAnimationFrame(() => toast.classList.add("is-visible")));
    playUnlockSound();
    const deadline = performance.now() + DISPLAY_MS;
    const countdown = toast.querySelector(".antara-achievement-toast__countdown b");
    clearInterval(activeCountdownTimer);
    activeCountdownTimer = window.setInterval(() => {
      if (!activeToast || activeToast !== toast) return clearInterval(activeCountdownTimer);
      if (countdown) countdown.textContent = String(Math.max(0, Math.ceil((deadline - performance.now()) / 1000)));
    }, 200);
    activeTimer = window.setTimeout(() => dismissActive(), DISPLAY_MS);
  }

  function enqueue(items) {
    for (const item of Array.isArray(items) ? items : []) {
      const code = String(item?.code || "");
      if (!code || queuedCodes.has(code)) continue;
      queuedCodes.add(code);
      queue.push(item);
    }
    showNext();
  }

  async function checkPending() {
    if (fetchInFlight || document.hidden) return fetchInFlight;
    fetchInFlight = fetch("api/achievements/notifications.php", {
      credentials: "same-origin",
      headers: { Accept: "application/json" },
      cache: "no-store"
    }).then(async response => {
      const payload = await response.json().catch(() => ({}));
      if (response.ok && payload.success) enqueue(payload.items || []);
      else if (response.status !== 401) console.warn("ANTARA achievement notifications", payload.message || response.statusText);
      return payload;
    }).catch(error => {
      console.warn("ANTARA achievement notifications unavailable", error);
      return null;
    }).finally(() => { fetchInFlight = null; });
    return fetchInFlight;
  }

  async function markActivity(key) {
    key = String(key || "").trim().toLowerCase();
    if (!key || sent.has(key)) return null;
    try {
      const response = await fetch("api/achievements/mark-activity.php", {
        method: "POST",
        credentials: "same-origin",
        headers: { "Content-Type": "application/json", Accept: "application/json" },
        body: JSON.stringify({ key })
      });
      const payload = await response.json().catch(() => ({}));
      if (response.ok && payload.success) {
        sent.add(key);
        window.dispatchEvent(new CustomEvent("antara:achievement-activity", { detail: payload }));
        queueMicrotask(() => checkPending());
        return payload;
      }
      if (response.status !== 401) console.warn("ANTARA achievement activity rejected", payload.message || response.statusText);
    } catch (error) {
      console.warn("ANTARA achievement activity could not be saved", error);
    }
    return null;
  }

  window.addEventListener("antara:progress-updated", () => window.setTimeout(checkPending, 140));
  window.addEventListener("antara:achievement-activity", () => window.setTimeout(checkPending, 140));
  document.addEventListener("visibilitychange", () => {
    if (!document.hidden) {
      showNext();
      window.setTimeout(checkPending, 180);
    }
  });
  document.addEventListener("fullscreenchange", () => {
    if (activeToast || queue.length) host();
  });

  const boot = () => window.setTimeout(checkPending, 650);
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", boot, { once:true });
  else boot();

  window.AntaraAchievements = Object.freeze({ markActivity, checkPending, enqueue });
  window.AntaraAchievementNotifications = Object.freeze({ checkPending, enqueue });
})();
