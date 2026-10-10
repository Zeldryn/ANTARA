/* ANTARA mobile scene audit fix — 2026-10-04
   Mobile-only hero framing correction. Earth/Mars are the placement reference.
   Desktop and inter-planet travel choreography are intentionally untouched. */
(() => {
  const patchGroupY = (Ctor, methodName, groupName, baseY, exploreLift, afterRender) => {
    const P = Ctor?.prototype;
    if (!P || P[`__antaraMobileCenter_${methodName}`]) return;
    P[`__antaraMobileCenter_${methodName}`] = true;
    const original = P[methodName];
    if (typeof original !== "function") return;

    P[methodName] = function (...args) {
      const result = original.apply(this, args);
      if (!this.mobile || this.travelMode || this.mode !== "webgl") return result;
      const group = this[groupName];
      if (!group || !this.renderer || !this.scene || !this.camera) return result;

      const blend = Number.isFinite(this.explorationBlend) ? this.explorationBlend : 0;
      group.position.y = baseY + blend * exploreLift;
      afterRender?.call(this, blend, group);
      this.renderer.render(this.scene, this.camera);
      return result;
    };
  };

  const patchSun = () => {
    const P = window.SunScene?.prototype;
    if (!P || P.__antaraMobileCenter_renderSun) return;
    P.__antaraMobileCenter_renderSun = true;
    const original = P.renderSun;
    if (typeof original !== "function") return;

    P.renderSun = function (...args) {
      const result = original.apply(this, args);
      if (!this.mobile || this.travelMode || this.mode !== "webgl" || !this.renderer || !this.camera) return result;
      const blend = Number.isFinite(this.explorationBlend) ? this.explorationBlend : 0;
      const layout = this.normalLayout?.();
      if (!layout) return result;

      const y = layout.half * (0.34 + blend * 0.18);
      const scale = 0.70 * (1 - blend * 0.05);
      if (this.sunGroup) {
        this.sunGroup.position.y = y;
        this.sunGroup.scale.setScalar(scale);
      }
      if (this.corona) {
        this.corona.position.y = y;
        this.corona.scale.setScalar(scale);
      }
      if (this.coronaOuter) {
        this.coronaOuter.position.y = y;
        this.coronaOuter.scale.setScalar(scale);
      }
      this.renderer.render(this.scene, this.camera);
      return result;
    };
  };

  const run = () => {
    patchSun();

    /* These four scenes originally hovered around the viewport midpoint on
       phones. Move them into the same upper-middle visual band as Earth/Mars.
       Lesson mode lifts them slightly farther so the bottom reading sheet does
       not cover the subject. */
    patchGroupY(window.JupiterScene, "renderJupiter", "planetGroup", 0.65, 0.18, function () {
      this.planetGroup.scale.setScalar(0.75);
      this._updateFocusMarker?.();
    });
    patchGroupY(window.SaturnScene, "renderSaturn", "planetGroup", 0.70, 0.18);
    patchGroupY(window.UranusScene, "renderUranus", "systemGroup", 0.70, 0.18, function () {
      this._updateFocusMarker?.();
    });
    patchGroupY(window.NeptuneScene, "renderNeptune", "systemGroup", 0.70, 0.18, function () {
      this._updateStormMarker?.();
    });
  };

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", run, { once: true });
  } else {
    run();
  }
})();
