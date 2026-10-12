"use strict";

(() => {
  const sent = new Set();
  const inflight = new Map();

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
          window.dispatchEvent(new CustomEvent("antara:progress-updated", { detail: payload }));
          return payload;
        }
        if (response.status !== 401) {
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

  window.AntaraProgress = Object.freeze({
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
})();
