"use strict";

(() => {
  const sent = new Set();
  const inflight = new Map();
  const retryCounts = new Map();
  const MAX_RATE_RETRIES = 2;

  const clean = value => String(value ?? "").trim();
  const eventId = (planet, type, key) => `${planet}:${type}:${key}`;

  async function mark({ planet, type, key, label = "" }) {
    planet = clean(planet).toLowerCase();
    type = clean(type).toLowerCase();
    key = clean(key).toLowerCase();
    label = clean(label);
    if (!planet || !type || !key) return null;

    const id = eventId(planet, type, key);
    if (sent.has(id)) return null;
    if (inflight.has(id)) return inflight.get(id);

    const request = fetch("api/progress/mark.php", {
      method: "POST",
      credentials: "same-origin",
      headers: { "Content-Type": "application/json", "Accept": "application/json" },
      body: JSON.stringify({ planet, type, key, label })
    })
      .then(async response => {
        const payload = await response.json().catch(() => ({}));
        if (response.ok && payload.success) {
          sent.add(id);
          retryCounts.delete(id);
          window.dispatchEvent(new CustomEvent("antara:progress-updated", { detail: payload }));
          window.setTimeout(() => window.AntaraAchievements?.checkPending?.(), 120);
          return payload;
        }
        if (response.status === 429) {
          const attempts = retryCounts.get(id) || 0;
          if (attempts < MAX_RATE_RETRIES) {
            retryCounts.set(id, attempts + 1);
            const retryHeader = Number.parseInt(response.headers.get("Retry-After") || "10", 10);
            const retryMs = Math.max(1200, (Number.isFinite(retryHeader) ? retryHeader : 10) * 1000 + 180);
            window.setTimeout(() => mark({ planet, type, key, label }), retryMs);
          }
        } else if (response.status !== 401) {
          console.warn("ANTARA progress milestone rejected", payload.message || response.statusText);
        }
        return null;
      })
      .catch(error => {
        console.warn("ANTARA progress milestone could not be saved", error);
        return null;
      })
      .finally(() => inflight.delete(id));

    inflight.set(id, request);
    return request;
  }

  const api = Object.freeze({
    mark,
    trackTopic(planet, index, label = "") {
      const topic = Number.parseInt(index, 10);
      if (!Number.isInteger(topic) || topic < 0) return null;
      return mark({ planet, type: "normal", key: `topic-${topic}`, label });
    },
    trackFull(planet, key, label = "") {
      return mark({ planet, type: "full", key, label });
    }
  });

  window.AntaraProgress = api;

  /*
   * UI milestone guard.
   *
   * Scene renderers have accumulated visual overrides over time. A visual override
   * must never be able to display a topic without also recording that topic. This
   * observer treats the actually visible exploration card as the source of truth.
   * Direct trackTopic() calls remain in every scene; sent/inflight dedupe makes the
   * guard a no-op when the normal path already succeeded.
   */
  const TOPIC_GUARD = Object.freeze([
    { scene: "sun-scene", prefix: "sun", planet: "sun" },
    { scene: "mercury-scene", prefix: "mercury", planet: "mercury" },
    { scene: "venus-scene", prefix: "venus", planet: "venus" },
    { scene: "earth-scene", prefix: "earth", planet: "earth" },
    { scene: "mars-scene", prefix: "mars", planet: "mars" },
    { scene: "asteroid-scene", prefix: "asteroid", planet: "asteroid-belt" },
    { scene: "jupiter-scene", prefix: "jupiter", planet: "jupiter" },
    { scene: "saturn-scene", prefix: "saturn", planet: "saturn" },
    { scene: "uranus-scene", prefix: "uranus", planet: "uranus" },
    { scene: "neptune-scene", prefix: "neptune", planet: "neptune" }
  ]);

  function installTopicGuard(definition) {
    const scene = document.getElementById(definition.scene);
    const current = document.getElementById(`${definition.prefix}-topic-current`);
    const title = document.getElementById(`${definition.prefix}-topic-title`);
    if (!scene || !current || !title || typeof MutationObserver !== "function") return;

    let scheduled = false;
    let lastVisibleId = "";

    const sync = () => {
      scheduled = false;
      if (scene.hidden || !scene.classList.contains("is-exploring")) {
        lastVisibleId = "";
        return;
      }
      const visibleNumber = Number.parseInt(clean(current.textContent), 10);
      if (!Number.isInteger(visibleNumber) || visibleNumber < 1) return;
      const index = visibleNumber - 1;
      const label = clean(title.textContent);
      const visibleId = `${definition.planet}:${index}:${label}`;
      if (visibleId === lastVisibleId) return;
      lastVisibleId = visibleId;
      api.trackTopic(definition.planet, index, label);
    };

    const schedule = () => {
      if (scheduled) return;
      scheduled = true;
      queueMicrotask(sync);
    };

    const observer = new MutationObserver(schedule);
    observer.observe(scene, { attributes: true, attributeFilter: ["class", "hidden"] });
    observer.observe(current, { childList: true, characterData: true, subtree: true });
    observer.observe(title, { childList: true, characterData: true, subtree: true });
    schedule();
  }

  function bootTopicGuards() {
    TOPIC_GUARD.forEach(installTopicGuard);
  }

  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", bootTopicGuards, { once: true });
  else bootTopicGuards();
})();
