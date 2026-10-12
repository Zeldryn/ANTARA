"use strict";
(() => {
  const sent = new Set();
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
        return payload;
      }
      if (response.status !== 401) console.warn("ANTARA achievement activity rejected", payload.message || response.statusText);
    } catch (error) {
      console.warn("ANTARA achievement activity could not be saved", error);
    }
    return null;
  }
  window.AntaraAchievements = Object.freeze({ markActivity });
})();
