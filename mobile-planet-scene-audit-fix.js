/* ANTARA mobile scene audit fix — 2026-10-04
   Small hero-framing correction for the gas-giant mobile panoramas.
   The goal is to stop Jupiter-like scenes from feeling too zoomed / too low
   compared with Mars on phones. Desktop is untouched. */
(() => {
  const patchJupiter = () => {
    const P = window.JupiterScene?.prototype;
    if (!P || P.__mobileSceneAuditFixV1) return false;
    P.__mobileSceneAuditFixV1 = true;

    const originalStart = P.start;
    P.start = function (opts = {}) {
      originalStart.call(this, opts);
      if (this.mobile) {
        this.focusCameraZ = this.focusCameraZTarget = 6.95;
      }
    };

    P.getHeroVisualState = function () {
      return {
        x: this.mobile ? 0 : 0.82,
        y: this.mobile ? 0.02 : 0.02,
        scale: this.mobile ? 0.88 : 1.13,
        cameraZ: this.mobile ? 6.95 : 6.4,
        fov: 34,
        rotation: this.renderedRotation,
        time: this.time
      };
    };

    P.renderJupiter = function () {
      this._ensureFeatureState();
      const blend = this.explorationBlend;
      const x = this.mobile ? 0 : (0.82 + blend * 0.15);
      const y = this.mobile ? (0.02 - blend * 0.18) : (0.02 + blend * 0.01);
      const scale = this.mobile ? 0.88 : 1.13;
      const idle = (Number.isFinite(this.rotationBase) ? this.rotationBase : 2.58) + this.time * 0.030;
      const subtle = this.exploring && this.focusState === "FOCUSED_IDLE" ? Math.sin(this.time * 0.16) * 0.018 : 0;
      this.renderedRotation = this.exploring ? this.focusYaw + subtle : idle;

      if (this.mode === "webgl") {
        this.travelMarsGroup.visible = false;
        if (this.asteroidGroup) this.asteroidGroup.visible = false;
        this.planetGroup.visible = true;
        this.planetGroup.position.set(x, y, 0);
        this.planetGroup.scale.setScalar(scale);
        this.planetGroup.rotation.x = this.exploring ? this.focusPitch : 0;
        this.planetGroup.rotation.z = this.exploring ? -0.018 : 0;
        this.planet.rotation.y = this.renderedRotation;
        if (this.cloudLayer) this.cloudLayer.rotation.y = this.renderedRotation + this.time * 0.0045;
        if (this.ring?.material) this.ring.material.opacity = this.ring.material.userData?.antaraBaseOpacity ?? 0.44;
        this.ring.rotation.z = 0.015 + Math.sin(this.time * 0.14) * 0.008;
        const z = this.exploring ? this.focusCameraZ : (this.mobile ? 6.95 : 6.4);
        this.camera.position.set(
          this.motion.matches ? 0 : this.cameraOffset.x * 0.13,
          this.motion.matches ? 0 : -this.cameraOffset.y * 0.09,
          z
        );
        this.camera.lookAt(0, 0, 0);
        this.renderer.render(this.scene, this.camera);
        this._updateFocusMarker();
      } else {
        this.drawCanvasJupiter(x, y, scale);
        this.focusReticle?.classList.remove("is-marker-visible");
      }

      if (this.time > 1.1 && !this.travelMode) {
        this.caption.classList.add("is-visible");
        this.caption.inert = this.exploring;
        this.credit.style.opacity = this.exploring ? "0" : ".9";
      }
    };
  };

  const run = () => {
    patchJupiter();
  };

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", run, { once: true });
  } else {
    run();
  }
})();
