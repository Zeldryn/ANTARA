"use strict";
(() => {
  const coarse = window.matchMedia?.("(pointer: coarse)")?.matches ?? false;
  const mobile = window.innerWidth <= 700 || (coarse && window.innerWidth <= 900);
  const profile = {
    mobile,
    dprCap: mobile ? 1.1 : 2,
    canvasDprCap: mobile ? 1 : 1.8,
    antialias: !mobile,
    textureDetail: mobile ? "mobile" : "desktop",
    frameInterval: mobile ? 22 : 0,
    shouldRender(scene, now) {
      if (!mobile) return true;
      const last = scene._antaraLastRenderAt || 0;
      if (last && now - last < this.frameInterval) return false;
      scene._antaraLastRenderAt = now;
      return true;
    }
  };
  window.ANTARA_RENDER_PROFILE = Object.freeze(profile);
})();
