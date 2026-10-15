"use strict";
(() => {
  const sent = new Set();
  const queuedCodes = new Set();
  const queue = [];
  let activeToast = null;
  let activeTimer = 0;
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
      node.setAttribute("aria-atomic", "false");
    }
    if (node.parentElement !== target) target.appendChild(node);
    return node;
  }


  const PLANET_CONTEXTS = Object.freeze([
    { planet:"sun", name:"Matahari", scene:"sun-scene", complete:"sun-complete" },
    { planet:"mercury", name:"Merkurius", scene:"mercury-scene", full:"mercury-full-exploration", complete:"mercury-complete", master:"mercury-master" },
    { planet:"venus", name:"Venus", scene:"venus-scene", full:"venus-full-exploration", complete:"venus-complete", master:"venus-master" },
    { planet:"earth", name:"Bumi", scene:"earth-scene", full:"earth-full-exploration", complete:"earth-complete", master:"earth-master" },
    { planet:"mars", name:"Mars", scene:"mars-scene", full:"mars-full-exploration", complete:"mars-complete", master:"mars-master" },
    { planet:"asteroid-belt", name:"Sabuk Asteroid", scene:"asteroid-scene", complete:"asteroid-complete" },
    { planet:"jupiter", name:"Jupiter", scene:"jupiter-scene", full:"jupiter-full-exploration", complete:"jupiter-complete", master:"jupiter-master" },
    { planet:"saturn", name:"Saturnus", scene:"saturn-scene", full:"saturn-full-exploration", complete:"saturn-complete", master:"saturn-master" },
    { planet:"uranus", name:"Uranus", scene:"uranus-scene", full:"uranus-full-exploration", complete:"uranus-complete", master:"uranus-master" },
    { planet:"neptune", name:"Neptunus", scene:"neptune-scene", full:"neptune-full-exploration", complete:"neptune-complete", master:"neptune-master" }
  ]);

  const CONTEXT_META = Object.freeze({
    "sun-complete": { name:"Matahari Tuntas", icon:"assets/achievements/01-matahari.png", tier:"rare", goal:11 },
    "mercury-complete": { name:"Merkurius Tuntas", icon:"assets/achievements/02-merkurius.png", tier:"rare", goal:16 },
    "venus-complete": { name:"Venus Tuntas", icon:"assets/achievements/03-venus.png", tier:"rare", goal:19 },
    "earth-complete": { name:"Bumi Tuntas", icon:"assets/achievements/04-bumi.png", tier:"rare", goal:19 },
    "mars-complete": { name:"Mars Tuntas", icon:"assets/achievements/05-mars.png", tier:"rare", goal:16 },
    "asteroid-complete": { name:"Sabuk Asteroid Tuntas", icon:"assets/achievements/06-asteroid.png", tier:"rare", goal:11 },
    "jupiter-complete": { name:"Jupiter Tuntas", icon:"assets/achievements/07-jupiter.png", tier:"rare", goal:16 },
    "saturn-complete": { name:"Saturnus Tuntas", icon:"assets/achievements/08-saturnus.png", tier:"rare", goal:16 },
    "uranus-complete": { name:"Uranus Tuntas", icon:"assets/achievements/09-uranus.png", tier:"rare", goal:16 },
    "neptune-complete": { name:"Neptunus Tuntas", icon:"assets/achievements/10-neptunus.png", tier:"rare", goal:16 },
    "mercury-master": { name:"Ahli Merkurius", icon:"assets/achievements/26-ahli-merkurius.svg", tier:"epic", goal:5 },
    "venus-master": { name:"Ahli Venus", icon:"assets/achievements/15-ahli-venus.png", tier:"epic", goal:5 },
    "earth-master": { name:"Ahli Bumi", icon:"assets/achievements/16-ahli-bumi.png", tier:"epic", goal:5 },
    "mars-master": { name:"Ahli Mars", icon:"assets/achievements/17-ahli-mars.png", tier:"epic", goal:5 },
    "jupiter-master": { name:"Ahli Jupiter", icon:"assets/achievements/27-ahli-jupiter.svg", tier:"epic", goal:5 },
    "saturn-master": { name:"Ahli Saturnus", icon:"assets/achievements/28-ahli-saturnus.svg", tier:"epic", goal:5 },
    "uranus-master": { name:"Ahli Uranus", icon:"assets/achievements/29-ahli-uranus.svg", tier:"epic", goal:5 },
    "neptune-master": { name:"Ahli Neptunus", icon:"assets/achievements/30-ahli-neptunus.svg", tier:"epic", goal:5 },
    "quiz-first": { name:"Kuis Pertama", icon:"assets/achievements/21-quiz-pertama.svg", tier:"common", goal:1 },
    "quiz-streak-5": { name:"Orbit Streak x5", icon:"assets/achievements/22-streak-5.svg", tier:"rare", goal:5 },
    "quiz-speedster": { name:"Jawaban Kilat", icon:"assets/achievements/23-kilat-quiz.svg", tier:"epic", goal:5 },
    "quiz-perfect": { name:"Lintasan Sempurna", icon:"assets/achievements/24-sempurna-quiz.svg", tier:"legendary", goal:15 },
    "quiz-master": { name:"Komandan Kuis", icon:"assets/achievements/25-master-quiz.svg", tier:"legendary", goal:5000 }
  });

  const achievementItems = new Map();
  const planetProgress = new Map();
  const lastRenderedProgress = new Map();
  let contextRefreshTimer = 0;
  let contextFetch = null;
  let contextObserver = null;
  let contextCard = null;
  let activeContextKey = "";
  let quizLive = {
    active:false,
    finished:false,
    score:0,
    streak:0,
    bestStreak:0,
    fastCorrect:0,
    firstTryCurrent:0,
    bestFirstTry:0
  };

  function contextHost() {
    const target = document.fullscreenElement || document.body;
    let wrap = document.querySelector(".antara-context-achievement-wrap");
    if (!wrap) {
      wrap = document.createElement("div");
      wrap.className = "antara-context-achievement-wrap";
      wrap.setAttribute("aria-live", "polite");
      wrap.innerHTML = `
        <section class="antara-context-achievement" hidden>
          <div class="antara-context-achievement__medal"><img alt="" decoding="async"><span>BADGE MISI</span></div>
          <div class="antara-context-achievement__body">
            <div class="antara-context-achievement__top"><span class="antara-context-achievement__context">PROGRES PENCAPAIAN</span><strong class="antara-context-achievement__percent">0%</strong></div>
            <h3></h3>
            <p class="antara-context-achievement__label">Belum dimulai</p>
            <div class="antara-context-achievement__track" aria-hidden="true"><i></i></div>
            <div class="antara-context-achievement__foot"><span class="antara-context-achievement__count">0 / 0</span><a href="pencapaian.html">LIHAT PENCAPAIAN</a></div>
          </div>
          <span class="antara-context-achievement__delta" aria-hidden="true"></span>
        </section>`;
    }
    if (wrap.parentElement !== target) target.appendChild(wrap);
    contextCard = wrap.querySelector(".antara-context-achievement");
    return wrap;
  }

  const numeric = value => Number.isFinite(Number(value)) ? Number(value) : 0;
  const percentOf = (current, goal) => goal > 0 ? Math.max(0, Math.min(100, Math.round((current / goal) * 100))) : 0;
  const scoreText = value => new Intl.NumberFormat("id-ID").format(Math.max(0, Math.round(numeric(value))));

  function isQuizPage() {
    return /(?:^|\/)permainan\.html(?:$|[?#])/.test(location.pathname + location.search + location.hash) || !!document.getElementById("quiz-stage");
  }

  function detectPlanetContext() {
    for (const definition of PLANET_CONTEXTS) {
      const scene = document.getElementById(definition.scene);
      if (!scene || scene.hidden) continue;
      const full = definition.full ? document.getElementById(definition.full) : null;
      if (full && !full.hidden) {
        if (full.classList.contains("is-active") && !full.classList.contains("is-exiting")) {
          return { kind:"planet", planet:definition.planet, name:definition.name, full:true, code:definition.master || definition.complete };
        }
        return { kind:"suspended" };
      }
      return { kind:"planet", planet:definition.planet, name:definition.name, full:false, code:definition.complete };
    }
    return null;
  }

  function detectContext() {
    if (isQuizPage()) return { kind:"quiz" };
    return detectPlanetContext();
  }

  function fallbackItem(code) {
    const meta = CONTEXT_META[code] || { name:"Pencapaian", icon:"assets/achievements/11-langkah-pertama.png", tier:"common" };
    const goal = numeric(meta.goal) || 1;
    return { code, ...meta, unlocked:false, progress:{ current:0, goal, percent:0, label:"Belum dimulai" } };
  }

  function serverItem(code) {
    return achievementItems.get(code) || fallbackItem(code);
  }

  function planetContextItem(context) {
    const base = { ...fallbackItem(context.code), ...serverItem(context.code) };
    const snapshot = planetProgress.get(context.planet);
    if (!snapshot) return base;
    if (context.full) {
      const current = numeric(snapshot.full?.completed);
      const goal = numeric(snapshot.full?.total);
      base.progress = {
        current, goal, percent:percentOf(current, goal),
        label: current >= goal && goal > 0 ? "SEMUA WILAYAH SELESAI" : `${current} / ${goal} wilayah diamati`
      };
    } else {
      const current = numeric(snapshot.completedMilestones);
      const goal = numeric(snapshot.totalMilestones);
      base.progress = {
        current, goal, percent:percentOf(current, goal),
        label: current >= goal && goal > 0 ? "SELURUH MILESTONE SELESAI" : `${current} / ${goal} milestone`
      };
    }
    return base;
  }

  function quizItem(code) {
    const base = { ...fallbackItem(code), ...serverItem(code) };
    const serverCurrent = numeric(base.progress?.current);
    let current = serverCurrent;
    let goal = numeric(base.progress?.goal) || 1;
    if (code === "quiz-first") current = Math.max(serverCurrent, quizLive.finished ? 1 : 0);
    if (code === "quiz-streak-5") { goal = 5; current = Math.max(serverCurrent, quizLive.bestStreak); }
    if (code === "quiz-speedster") { goal = 5; current = Math.max(serverCurrent, quizLive.fastCorrect); }
    if (code === "quiz-perfect") { goal = 15; current = Math.max(serverCurrent, quizLive.bestFirstTry, quizLive.firstTryCurrent); }
    if (code === "quiz-master") { goal = 5000; current = Math.max(serverCurrent, quizLive.score); }
    current = Math.min(goal, current);
    let label = base.progress?.label || "Belum dimulai";
    if (code === "quiz-first") label = current >= 1 ? "Run kuis selesai" : (quizLive.active ? "Selesaikan run yang sedang berjalan" : "Selesaikan satu run kuis");
    if (code === "quiz-streak-5") label = `${current} / ${goal} streak terbaik`;
    if (code === "quiz-speedster") label = `${current} / ${goal} jawaban ≤ 3 detik`;
    if (code === "quiz-perfect") label = `${current} / ${goal} benar percobaan pertama`;
    if (code === "quiz-master") label = `${scoreText(current)} / ${scoreText(goal)} poin`;
    if (!base.unlocked && current >= goal && goal > 0) label = "TARGET TERCAPAI · MENUNGGU VERIFIKASI";
    base.progress = { current, goal, percent:percentOf(current, goal), label };
    return base;
  }

  function chooseQuizTarget() {
    const codes = ["quiz-streak-5", "quiz-speedster", "quiz-perfect", "quiz-master", "quiz-first"];
    const candidates = codes.map((code, index) => ({ item:quizItem(code), index })).filter(entry => !entry.item.unlocked);
    if (!candidates.length) return quizItem("quiz-master");
    if (!quizLive.active) {
      const started = candidates.filter(entry => numeric(entry.item.progress?.current) > 0);
      return (started.sort((a,b) => numeric(b.item.progress?.percent) - numeric(a.item.progress?.percent) || a.index-b.index)[0] || candidates[candidates.length - 1]).item;
    }
    const active = candidates.filter(entry => numeric(entry.item.progress?.current) > 0 && numeric(entry.item.progress?.current) < numeric(entry.item.progress?.goal));
    if (active.length) return active.sort((a,b) => numeric(b.item.progress?.percent) - numeric(a.item.progress?.percent) || a.index-b.index)[0].item;
    return candidates[candidates.length - 1].item;
  }

  function contextDescriptor(context) {
    if (context.kind === "quiz") return "QUIZ · TARGET AKTIF";
    if (context.kind === "planet") return context.full ? `EKSPLORASI PENUH · ${context.name.toUpperCase()}` : `JELAJAH · ${context.name.toUpperCase()}`;
    return "PROGRES PENCAPAIAN";
  }

  function hideContextCard() {
    if (!contextCard) return;
    contextCard.hidden = true;
    activeContextKey = "";
  }

  function renderContextCard() {
    const context = detectContext();
    const wrap = contextHost();
    const card = contextCard || wrap.querySelector(".antara-context-achievement");
    if (!context || context.kind === "suspended") { hideContextCard(); return; }

    wrap.classList.toggle("is-quiz-context-wrap", context.kind === "quiz");
    wrap.classList.toggle("is-full-context-wrap", context.kind === "planet" && !!context.full);
    wrap.classList.toggle("is-planet-context-wrap", context.kind === "planet" && !context.full);

    const item = context.kind === "quiz" ? chooseQuizTarget() : planetContextItem(context);
    if (!item?.code) { hideContextCard(); return; }
    const current = numeric(item.progress?.current);
    const goal = numeric(item.progress?.goal);
    const percent = goal > 0 ? percentOf(current, goal) : numeric(item.progress?.percent);
    const key = `${context.kind}:${context.planet || "quiz"}:${context.full ? "full" : "normal"}:${item.code}`;
    const previous = lastRenderedProgress.get(key);
    const delta = previous === undefined ? 0 : current - previous;
    lastRenderedProgress.set(key, current);

    card.hidden = false;
    card.dataset.tier = item.tier || "common";
    card.classList.toggle("is-unlocked", !!item.unlocked);
    card.classList.toggle("is-full-context", !!context.full);
    card.classList.toggle("is-quiz-context", context.kind === "quiz");
    card.style.setProperty("--badge-progress", `${percent}%`);
    card.querySelector("img").src = item.icon || CONTEXT_META[item.code]?.icon || "assets/achievements/11-langkah-pertama.png";
    card.querySelector("img").alt = `${item.name || "Pencapaian"} badge`;
    card.querySelector(".antara-context-achievement__context").textContent = contextDescriptor(context);
    card.querySelector(".antara-context-achievement__percent").textContent = item.unlocked ? "TERBUKA" : `${percent}%`;
    card.querySelector("h3").textContent = item.name || "Pencapaian";
    card.querySelector(".antara-context-achievement__label").textContent = item.unlocked ? "PENCAPAIAN SELESAI" : (item.progress?.label || "Belum dimulai");
    const count = card.querySelector(".antara-context-achievement__count");
    count.textContent = goal > 0 ? `${context.kind === "quiz" && item.code === "quiz-master" ? scoreText(current) : current} / ${context.kind === "quiz" && item.code === "quiz-master" ? scoreText(goal) : goal}` : `${percent}%`;

    if (key !== activeContextKey) {
      activeContextKey = key;
      card.classList.remove("is-switching");
      void card.offsetWidth;
      card.classList.add("is-switching");
    }
    if (delta > 0) {
      const deltaNode = card.querySelector(".antara-context-achievement__delta");
      deltaNode.textContent = `+${context.kind === "quiz" && item.code === "quiz-master" ? scoreText(delta) : delta}`;
      card.classList.remove("is-progressing");
      void card.offsetWidth;
      card.classList.add("is-progressing");
      window.setTimeout(() => card.classList.remove("is-progressing"), 820);
    }
  }

  function ingestAchievementItems(items) {
    for (const item of Array.isArray(items) ? items : []) {
      if (!item?.code) continue;
      achievementItems.set(String(item.code), item);
    }
  }

  async function refreshContextData() {
    if (contextFetch) return contextFetch;
    contextFetch = fetch("api/achievements/get.php", {
      credentials:"same-origin",
      headers:{ Accept:"application/json" },
      cache:"no-store"
    }).then(async response => {
      const payload = await response.json().catch(() => ({}));
      if (response.ok && payload.success) ingestAchievementItems(payload.items || []);
      renderContextCard();
      return payload;
    }).catch(error => {
      console.warn("ANTARA contextual achievement unavailable", error);
      renderContextCard();
      return null;
    }).finally(() => { contextFetch = null; });
    return contextFetch;
  }

  function scheduleContextDataRefresh(delayMs = 120) {
    clearTimeout(contextRefreshTimer);
    contextRefreshTimer = window.setTimeout(() => refreshContextData(), delayMs);
  }

  function ingestPlanetProgress(payload) {
    const detail = payload?.detail || payload || {};
    const planet = detail.planet;
    if (planet && typeof planet === "object" && planet.planet) {
      planetProgress.set(String(planet.planet), planet);
    }
  }

  function updateQuizProgress(next = {}) {
    const patch = typeof next === "object" && next ? next : {};
    quizLive = {
      ...quizLive,
      ...patch,
      active: patch.active === undefined ? true : !!patch.active,
      finished: patch.finished === undefined ? quizLive.finished : !!patch.finished,
      score: Math.max(0, numeric(patch.score === undefined ? quizLive.score : patch.score)),
      streak: Math.max(0, numeric(patch.streak === undefined ? quizLive.streak : patch.streak)),
      bestStreak: Math.max(quizLive.bestStreak, numeric(patch.bestStreak), numeric(patch.streak)),
      fastCorrect: Math.max(quizLive.fastCorrect, numeric(patch.fastCorrect)),
      firstTryCurrent: Math.max(0, numeric(patch.firstTryCurrent === undefined ? quizLive.firstTryCurrent : patch.firstTryCurrent)),
      bestFirstTry: Math.max(quizLive.bestFirstTry, numeric(patch.bestFirstTry), numeric(patch.firstTryCurrent))
    };
    renderContextCard();
    if (patch.finished) scheduleContextDataRefresh(180);
  }

  function resetQuizProgress() {
    quizLive = { active:false, finished:false, score:0, streak:0, bestStreak:0, fastCorrect:0, firstTryCurrent:0, bestFirstTry:0 };
    renderContextCard();
  }

  function installContextObserver() {
    if (contextObserver || typeof MutationObserver !== "function") return;
    const nodes = [];
    for (const definition of PLANET_CONTEXTS) {
      const scene = document.getElementById(definition.scene);
      const full = definition.full ? document.getElementById(definition.full) : null;
      if (scene) nodes.push(scene);
      if (full) nodes.push(full);
    }
    const quizStage = document.getElementById("quiz-stage");
    const resultStage = document.getElementById("result-stage");
    if (quizStage) nodes.push(quizStage);
    if (resultStage) nodes.push(resultStage);
    contextObserver = new MutationObserver(() => queueMicrotask(renderContextCard));
    nodes.forEach(node => contextObserver.observe(node, { attributes:true, attributeFilter:["class","hidden","aria-hidden"] }));
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
    toast.innerHTML = `
      <div class="antara-achievement-toast__medal"><img src="${escapeHtml(item.icon)}" alt="" decoding="async"></div>
      <div class="antara-achievement-toast__copy">
        <div class="antara-achievement-toast__kicker">Pencapaian Terbuka</div>
        <h3>${escapeHtml(item.name)}</h3>
        <p>${escapeHtml(item.description || "Medali baru berhasil ditambahkan ke koleksi akunmu.")}</p>
        <div class="antara-achievement-toast__meta"><span>${escapeHtml(tierLabel(item.tier))}</span><a href="pencapaian.html">LIHAT MEDALI</a></div>
      </div>
      <button class="antara-achievement-toast__close" type="button" aria-label="Tutup notifikasi pencapaian">×</button>
      <div class="antara-achievement-toast__timer" aria-hidden="true"><i></i></div>`;
    wrap.appendChild(toast);
    activeToast = toast;
    toast.querySelector(".antara-achievement-toast__close")?.addEventListener("click", () => dismissActive());
    requestAnimationFrame(() => requestAnimationFrame(() => toast.classList.add("is-visible")));
    playUnlockSound();
    activeTimer = window.setTimeout(() => dismissActive(), DISPLAY_MS);
  }

  function enqueue(items) {
    for (const item of Array.isArray(items) ? items : []) {
      const code = String(item?.code || "");
      if (!code || queuedCodes.has(code)) continue;
      queuedCodes.add(code);
      queue.push(item);
      const existing = achievementItems.get(code) || fallbackItem(code);
      achievementItems.set(code, { ...existing, ...item, unlocked:true, progress:{ ...(existing.progress || {}), current:existing.progress?.goal || 1, percent:100, label:"PENCAPAIAN SELESAI" } });
    }
    renderContextCard();
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

  window.addEventListener("antara:progress-updated", event => {
    ingestPlanetProgress(event);
    renderContextCard();
    window.setTimeout(checkPending, 140);
    scheduleContextDataRefresh(180);
  });
  window.addEventListener("antara:achievement-activity", () => {
    window.setTimeout(checkPending, 140);
    scheduleContextDataRefresh(180);
  });
  document.addEventListener("visibilitychange", () => {
    if (!document.hidden) {
      showNext();
      renderContextCard();
      window.setTimeout(checkPending, 180);
      scheduleContextDataRefresh(240);
    }
  });
  document.addEventListener("fullscreenchange", () => {
    if (activeToast || queue.length) host();
    contextHost();
    renderContextCard();
  });

  const boot = () => {
    contextHost();
    installContextObserver();
    renderContextCard();
    window.setTimeout(checkPending, 520);
    window.setTimeout(refreshContextData, 620);
  };
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", boot, { once:true });
  else boot();

  window.AntaraAchievements = Object.freeze({ markActivity, checkPending, enqueue, updateQuizProgress, resetQuizProgress, refreshContext:refreshContextData });
  window.AntaraAchievementNotifications = Object.freeze({ checkPending, enqueue });
})();
