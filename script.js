"use strict";

// Replace these files to change the soundtrack; no third-party audio is used.
const AUDIO_ASSETS = {
  music: "assets/audio/orbital-dawn-music.wav",
  ambience: "assets/audio/launch-facility-ambience.wav",
  ignition: "assets/audio/engine-ignition-rumble.wav",
  ascent: "assets/audio/rocket-ascent-roar.wav",
  hover: "assets/audio/soft-ui-hover.wav",
  activate: "assets/audio/mission-activation.wav",
  ready: "assets/audio/mission-ready-chime.wav"
};

// Seconds from the click. Visual staging and sound cues use this same schedule.
const LAUNCH_TIMING = Object.freeze({
  appearance: 0,
  settle: 1.4,
  ignition: 3.0,
  liftoff: 5.0,
  climb: 7.6,
  cloudApproach: 9.4,
  clouds: 11.4,
  aboveClouds: 14.8,
  upperAtmosphere: 17.4,
  space: 19.5,
  exit: 19.5,
  earthReveal: 20.7,
  approach: 22.8,
  finish: 25.2
});

class MissionAudio {
  constructor(onStateChange) {
    this.onStateChange = onStateChange;
    this.context = null;
    this.master = null;
    this.sources = new Set();
    this.buffers = new Map();
    this.muted = false;
    this.started = false;
    this.unavailable = false;
    this.failedAssets = new Set();
    this.generation = 0;
    this.lastHover = 0;
    this.lastClick = 0;
    this.suspendTimer = null;
    try { this.muted = (localStorage.getItem("antara-muted") ?? localStorage.getItem("antariksa-muted")) === "true"; } catch { /* Storage is optional. */ }
  }

  // This is called from a real click, never on page load or hover.
  unlock() {
    try {
      const AudioContext = window.AudioContext || window.webkitAudioContext;
      if (!AudioContext) throw new Error("Web Audio unavailable");
      if (!this.context) {
        this.context = new AudioContext();
        this.master = this.context.createGain();
        this.master.gain.value = this.muted || document.hidden ? 0 : 0.48;
        const limiter = this.context.createDynamicsCompressor();
        limiter.threshold.value = -12;
        limiter.knee.value = 12;
        limiter.ratio.value = 4;
        this.master.connect(limiter);
        limiter.connect(this.context.destination);
      }
      // Call resume directly in the gesture handler, before any asynchronous loading.
      this.context.resume().catch(() => this.fail());
      this.started = true;
      this.preload();
    } catch { this.fail(); }
    this.onStateChange();
  }

  preload() {
    if (this.rawAssets) return;
    this.rawAssets = new Map(Object.entries(AUDIO_ASSETS).map(([name, path]) => {
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 12000);
      const request = fetch(path, { signal: controller.signal }).then(response => {
        if (!response.ok) throw new Error(`Audio unavailable: ${name}`);
        return response.arrayBuffer();
      }).catch(() => null).finally(() => clearTimeout(timeout));
      return [name, request];
    }));
  }

  async buffer(name) {
    if (!this.context) return null;
    if (!this.buffers.has(name)) {
      this.buffers.set(name, this.rawAssets.get(name).then(bytes => bytes
        ? this.context.decodeAudioData(bytes.slice(0)).catch(() => null)
        : null));
    }
    return this.buffers.get(name);
  }

  fail() {
    this.unavailable = true;
    this.onStateChange();
  }

  ramp(param, value, duration = 0.4) {
    const now = this.context.currentTime;
    if (param.cancelAndHoldAtTime) param.cancelAndHoldAtTime(now);
    else {
      const previous = param.value;
      param.cancelScheduledValues(now);
      param.setValueAtTime(previous, now);
    }
    param.linearRampToValueAtTime(value, now + duration);
  }

  setMuted(value) {
    this.muted = value;
    try { localStorage.setItem("antara-muted", String(value)); } catch { /* Optional preference. */ }
    if (this.master) this.ramp(this.master.gain, value || document.hidden ? 0 : 0.48);
    // Before launch the speaker only changes the preference, without unlocking audio.
    if (!value && this.started && this.context && !document.hidden) {
      this.context.resume().catch(() => this.fail());
    }
    this.onStateChange();
  }

  async cue(name, { at, gain = 0.2, loop = false, generation = this.generation } = {}) {
    try {
      const buffer = await this.buffer(name);
      if (generation !== this.generation || !this.context) return;
      if (!buffer) {
        this.failedAssets.add(name);
        this.onStateChange();
        if (name === "music") this.fail();
        return;
      }
      const now = this.context.currentTime;
      const intendedStart = at ?? now;
      const elapsed = Math.max(0, now - intendedStart);
      if (!loop && elapsed >= buffer.duration - 0.025) return;
      const start = Math.max(now, intendedStart);
      const source = this.context.createBufferSource();
      const level = this.context.createGain();
      source.buffer = buffer;
      source.loop = loop;
      source.connect(level);
      level.connect(this.master);
      level.gain.setValueAtTime(0, now);
      level.gain.setValueAtTime(0, start);
      const duckTime = intendedStart + LAUNCH_TIMING.exit;
      const spaceGain = name === "ambience" ? 0 : gain * 0.65;
      if (name === "ambience" && now >= intendedStart + LAUNCH_TIMING.finish) return;
      const target = loop && now >= duckTime ? spaceGain : gain;
      level.gain.linearRampToValueAtTime(target, start + (loop ? 1.8 : 0.025));
      // Facility sound falls away in space; only the quiet musical score continues.
      if (loop && duckTime > start + 1.8) {
        level.gain.setValueAtTime(gain, duckTime);
        level.gain.linearRampToValueAtTime(spaceGain, duckTime + 1.55);
      }
      source.start(start, loop ? elapsed % buffer.duration : elapsed);
      if (name === "ambience") source.stop(intendedStart + LAUNCH_TIMING.finish + 0.1);
      const entry = { source, level };
      this.sources.add(entry);
      source.onended = () => {
        source.disconnect();
        level.disconnect();
        this.sources.delete(entry);
      };
    } catch { /* Audio must never block the visual experience. */ }
  }

  startMission() {
    this.stop(0.15);
    this.unlock();
    if (!this.context || this.unavailable) return;
    const at = this.context.currentTime;
    this.missionStart = at;
    const generation = this.generation;
    this.cue("music", { at, gain: 0.42, loop: true, generation });
    this.cue("ambience", { at, gain: 0.18, loop: true, generation });
    this.cue("activate", { at, gain: 0.25, generation });
    this.cue("ignition", { at: at + LAUNCH_TIMING.ignition, gain: 0.36, generation });
    this.cue("ascent", { at: at + LAUNCH_TIMING.liftoff, gain: 0.52, generation });
    this.cue("ready", { at: at + LAUNCH_TIMING.finish, gain: 0.16, generation });
  }

  hover() {
    if (!this.started || this.muted || this.unavailable || document.hidden) return;
    const now = performance.now();
    if (now - this.lastHover < 180) return;
    this.lastHover = now;
    this.cue("hover", { gain: 0.07 });
  }

  uiClick() {
    if (!this.started || this.muted || this.unavailable || document.hidden) return;
    const now = performance.now();
    // Fast controls can be tapped repeatedly, but accidental duplicate handlers
    // for the same physical click should never stack two copies on top of each other.
    if (now - this.lastClick < 45) return;
    this.lastClick = now;
    // Browsers may suspend Web Audio after an idle/background period. A real UI
    // activation is a valid user gesture, so resume here before playing feedback.
    if (this.context?.state === "suspended") this.context.resume().catch(() => this.fail());
    this.cue("hover", { gain: 0.095 });
  }

  travel(duration = 6.2) {
    if (!this.started || this.muted || this.unavailable || document.hidden || !this.context || !this.master) return;
    this.context.resume().catch(() => {});
    const now = this.context.currentTime;
    const end = now + duration;

    if (!this.travelNoiseBuffer) {
      const seconds = 1.4;
      const buffer = this.context.createBuffer(1, Math.floor(this.context.sampleRate * seconds), this.context.sampleRate);
      const data = buffer.getChannelData(0);
      for (let i = 0; i < data.length; i++) {
        const envelope = 0.72 + 0.28 * Math.sin((i / data.length) * Math.PI * 6);
        data[i] = (Math.random() * 2 - 1) * envelope;
      }
      this.travelNoiseBuffer = buffer;
    }

    const noise = this.context.createBufferSource();
    const filter = this.context.createBiquadFilter();
    const level = this.context.createGain();
    noise.buffer = this.travelNoiseBuffer;
    noise.loop = true;
    filter.type = "lowpass";
    filter.Q.value = 0.8;
    filter.frequency.setValueAtTime(280, now);
    filter.frequency.linearRampToValueAtTime(560, now + duration * 0.48);
    filter.frequency.linearRampToValueAtTime(330, end);
    const noiseAttack = Math.min(0.65, duration * 0.24);
    level.gain.setValueAtTime(0.0001, now);
    level.gain.exponentialRampToValueAtTime(0.055, now + noiseAttack);
    level.gain.setValueAtTime(0.055, now + duration * 0.68);
    level.gain.exponentialRampToValueAtTime(0.0001, end);
    noise.connect(filter);
    filter.connect(level);
    level.connect(this.master);

    const tone = this.context.createOscillator();
    const toneLevel = this.context.createGain();
    tone.type = "sine";
    tone.frequency.setValueAtTime(46, now);
    tone.frequency.linearRampToValueAtTime(66, now + duration * 0.55);
    tone.frequency.linearRampToValueAtTime(51, end);
    const toneAttack = Math.min(0.8, duration * 0.26);
    toneLevel.gain.setValueAtTime(0.0001, now);
    toneLevel.gain.exponentialRampToValueAtTime(0.028, now + toneAttack);
    toneLevel.gain.setValueAtTime(0.028, now + duration * 0.66);
    toneLevel.gain.exponentialRampToValueAtTime(0.0001, end);
    tone.connect(toneLevel);
    toneLevel.connect(this.master);

    const noiseEntry = { source: noise, level };
    const toneEntry = { source: tone, level: toneLevel };
    this.sources.add(noiseEntry);
    this.sources.add(toneEntry);
    noise.onended = () => { noise.disconnect(); filter.disconnect(); level.disconnect(); this.sources.delete(noiseEntry); };
    tone.onended = () => { tone.disconnect(); toneLevel.disconnect(); this.sources.delete(toneEntry); };
    noise.start(now);
    tone.start(now);
    noise.stop(end + 0.03);
    tone.stop(end + 0.03);
  }

  stop(duration = 0.8) {
    this.generation += 1; // Invalidate audio that is still fetching/decoding.
    if (!this.context) return;
    for (const { source, level } of this.sources) {
      this.ramp(level.gain, 0, duration);
      try { source.stop(this.context.currentTime + duration + 0.02); } catch { /* Already ended. */ }
    }
  }

  setBackground(hidden) {
    clearTimeout(this.suspendTimer);
    if (!this.context || !this.started) return;
    if (hidden) {
      this.ramp(this.master.gain, 0, 0.18);
      this.suspendTimer = setTimeout(() => {
        if (document.hidden) this.context.suspend().catch(() => {});
      }, 200);
    } else {
      this.context.resume().then(() => this.ramp(this.master.gain, this.muted ? 0 : 0.48, 0.6)).catch(() => this.fail());
    }
  }
}

// First-person cockpit renderer. The webpage stays interactive: cloud layers,
// character rigs, speech, camera motion, and the Earth handoff all share one timeline.
class LaunchVisual {
  constructor() {
    this.stage = document.getElementById("launch-stage");
    this.camera = document.getElementById("cockpit-camera");
    this.sky = this.stage.querySelector(".launch-sky");
    this.spaceLayer = this.stage.querySelector(".launch-space-layer");
    this.ground = this.stage.querySelector(".ground-world");
    this.arrivalEarth = document.getElementById("arrival-earth");
    this.canvas = document.getElementById("launch-particles");
    this.cloudFar = this.stage.querySelector(".cloud-far");
    this.cloudMid = this.stage.querySelector(".cloud-mid");
    this.cloudNear = this.stage.querySelector(".cloud-near");
    try { this.ctx = this.canvas.getContext("2d", { alpha: true }); } catch { this.ctx = null; }
    const random = n => { const x = Math.sin(n * 127.1 + 311.7) * 43758.5453; return x - Math.floor(x); };
    this.stars = Array.from({ length: 115 }, (_, i) => ({
      x: random(i), y: random(i + 100), size: 0.35 + random(i + 200) * 1.25, drift: .3 + random(i + 300) * .9
    }));
    this.lastPhase = "idle";
    this.resize();
    this.renderIdle();
    this.stage.hidden = false;
  }

  resize() {
    this.width = this.stage.clientWidth || innerWidth;
    this.height = this.stage.clientHeight || innerHeight;
    const dpr = Math.min(window.devicePixelRatio || 1, 1.5);
    this.canvas.width = Math.round(this.width * dpr);
    this.canvas.height = Math.round(this.height * dpr);
    this.ctx?.setTransform(dpr, 0, 0, dpr, 0, 0);
  }

  start() {
    this.stage.hidden = false;
    this.stage.style.transition = "none";
    this.stage.style.opacity = "1";
    this.resize();
    return this.render(0);
  }

  renderIdle() {
    const vars = {
      "--space-mix": 0,
      "--star-opacity": 0,
      "--ground-progress": 0,
      "--ground-opacity": 1,
      "--cloud-deck-opacity": 0,
      "--earth-reveal": 0,
      "--handoff": 0,
      "--engine-power": 0,
      "--cam-x": "0px",
      "--cam-y": "0px",
      "--cam-tilt": "0deg",
      "--char-a-x": "0px",
      "--char-a-y": "0px",
      "--char-b-x": "0px",
      "--char-b-y": "0px"
    };
    for (const [name, value] of Object.entries(vars)) this.stage.style.setProperty(name, String(value));
    this.stage.dataset.phase = "idle";
    this.cloudFar.style.setProperty("--cloud-far-opacity", "0");
    this.cloudMid.style.setProperty("--cloud-mid-opacity", "0");
    this.cloudNear.style.setProperty("--cloud-near-opacity", "0");
  }

  reset() {
    this.stage.hidden = true;
    this.stage.style.transition = "none";
    this.stage.style.opacity = "0";
    this.renderIdle();
    this.ctx?.clearRect(0, 0, this.width || 0, this.height || 0);
  }

  phaseAt(t) {
    const c = LAUNCH_TIMING;
    if (t < c.ignition) return "prelaunch";
    if (t < c.liftoff) return "ignition";
    if (t < c.climb) return "liftoff";
    if (t < c.cloudApproach) return "climb";
    if (t < c.clouds) return "cloud-approach";
    if (t < c.aboveClouds) return "clouds";
    if (t < c.upperAtmosphere) return "above-clouds";
    if (t < c.space) return "upper-atmosphere";
    if (t < c.earthReveal) return "space";
    if (t < c.approach) return "earth-reveal";
    return "approach";
  }

  render(t) {
    const clamp = value => Math.min(1, Math.max(0, value));
    const smooth = value => { const v = clamp(value); return v * v * (3 - 2 * v); };
    const c = LAUNCH_TIMING;
    const phase = this.phaseAt(t);
    const ignition = smooth((t - c.ignition) / Math.max(.01, c.liftoff - c.ignition));
    const ascent = smooth((t - c.liftoff) / Math.max(.01, c.space - c.liftoff));
    const groundProgress = smooth((t - c.liftoff) / Math.max(.01, c.clouds - c.liftoff));
    const groundFade = 1 - smooth((t - c.cloudApproach) / Math.max(.01, c.aboveClouds - c.cloudApproach));
    const cloudApproach = smooth((t - c.cloudApproach) / Math.max(.01, c.clouds - c.cloudApproach));
    const cloudPass = smooth((t - c.clouds) / Math.max(.01, c.aboveClouds - c.clouds));
    const cloudExit = smooth((t - c.aboveClouds) / Math.max(.01, c.upperAtmosphere - c.aboveClouds));
    const upperAtmosphere = smooth((t - c.upperAtmosphere) / Math.max(.01, c.space - c.upperAtmosphere));
    const spaceMix = smooth((t - c.aboveClouds) / Math.max(.01, c.space - c.aboveClouds));
    const starOpacity = smooth((t - (c.upperAtmosphere - .7)) / Math.max(.01, c.space - c.upperAtmosphere + .7));
    const earthReveal = smooth((t - c.earthReveal) / Math.max(.01, c.approach - c.earthReveal + .35));
    const handoff = smooth((t - c.approach) / Math.max(.01, c.finish - c.approach));
    const engine = smooth((t - c.ignition) / .8) * (1 - handoff * .82);

    let shake = 0;
    if (phase === "ignition") shake = 1.15 + ignition * 1.25;
    else if (phase === "liftoff") shake = 2.8 - ascent * .4;
    else if (phase === "climb") shake = 1.35;
    else if (phase === "cloud-approach") shake = 1.1;
    else if (phase === "clouds") shake = 3.25;
    else if (phase === "above-clouds") shake = .95 * (1 - cloudExit * .55);
    else if (phase === "upper-atmosphere") shake = .42 * (1 - upperAtmosphere * .6);
    else if (phase === "space") shake = .14;
    if (reducedMotion.matches) shake = 0;

    const micro = Math.sin(t * 18.7) * .54 + Math.sin(t * 7.3 + .8) * .31;
    const camX = micro * shake + Math.sin(t * 1.55) * shake * .28;
    const camY = (Math.cos(t * 16.2) * .34 + Math.cos(t * 2.2) * .22) * shake - ascent * (reducedMotion.matches ? 0 : 2.6);
    const camTilt = reducedMotion.matches ? 0 : (Math.sin(t * 5.1) * .028 + Math.sin(t * 1.1) * .018) * shake;
    const charLag = phase === "liftoff" ? 3.0 : phase === "clouds" ? 2.5 : phase === "ignition" ? 1.1 : phase === "climb" ? .75 : .35;

    this.stage.dataset.phase = phase;
    this.stage.style.setProperty("--space-mix", String(spaceMix));
    this.stage.style.setProperty("--star-opacity", String(starOpacity));
    this.stage.style.setProperty("--ground-progress", String(groundProgress));
    this.stage.style.setProperty("--ground-opacity", String(Math.max(0, groundFade)));
    this.stage.style.setProperty("--cloud-deck-opacity", String(Math.max(0, (1 - cloudExit) * (phase === "above-clouds" ? .9 : 0))));
    this.stage.style.setProperty("--earth-reveal", String(earthReveal));
    this.stage.style.setProperty("--handoff", String(handoff));
    this.stage.style.setProperty("--engine-power", String(engine));
    this.stage.style.setProperty("--cam-x", `${camX}px`);
    this.stage.style.setProperty("--cam-y", `${camY}px`);
    this.stage.style.setProperty("--cam-tilt", `${camTilt}deg`);
    this.stage.style.setProperty("--char-a-x", `${camX * .43 - Math.sin(t * 6.1) * charLag}px`);
    this.stage.style.setProperty("--char-a-y", `${camY * .38 + charLag}px`);
    this.stage.style.setProperty("--char-b-x", `${camX * .40 + Math.sin(t * 5.6) * charLag * .78}px`);
    this.stage.style.setProperty("--char-b-y", `${camY * .36 + charLag * .84}px`);

    const approachFar = cloudApproach * .5;
    const passDensity = phase === "clouds" ? .50 + Math.sin(t * 1.25) * .07 + Math.sin(t * .53) * .04 : 0;
    const deckDensity = phase === "above-clouds" ? (1 - cloudExit) * .62 : 0;
    const cloudTravel = Math.max(0, t - c.cloudApproach);
    this.cloudFar.style.setProperty("--cloud-far-y", `${42 - cloudTravel * 36}px`);
    this.cloudFar.style.setProperty("--cloud-far-x", `${Math.sin(t * .23) * 22}px`);
    this.cloudFar.style.setProperty("--cloud-far-opacity", String(Math.min(.72, approachFar + passDensity * .34 + deckDensity)));
    this.cloudMid.style.setProperty("--cloud-mid-y", `${108 - cloudTravel * 69}px`);
    this.cloudMid.style.setProperty("--cloud-mid-x", `${Math.sin(t * .48) * 40}px`);
    this.cloudMid.style.setProperty("--cloud-mid-opacity", String(Math.min(.83, cloudApproach * .22 + passDensity * .76 + deckDensity * .66)));
    this.cloudNear.style.setProperty("--cloud-near-y", `${190 - cloudTravel * 108}px`);
    this.cloudNear.style.setProperty("--cloud-near-x", `${Math.cos(t * .61) * 55}px`);
    this.cloudNear.style.setProperty("--cloud-near-opacity", String(Math.min(.74, passDensity * .9 + deckDensity * .28)));
    this.arrivalEarth.style.backgroundPosition = `${50 + Math.sin(t * .16) * 2.4}% center`;

    if (this.ctx) this.drawParticles(t, ascent, starOpacity, phase);
    this.lastPhase = phase;
    return phase;
  }

  drawParticles(t, ascent, starOpacity, phase) {
    const ctx = this.ctx;
    const w = this.width;
    const h = this.height;
    ctx.clearRect(0, 0, w, h);
    if (reducedMotion.matches || starOpacity < .025) return;
    const speed = phase === "upper-atmosphere" ? 8 : 5 + starOpacity * 18;
    for (const star of this.stars) {
      const x = (star.x * w + Math.sin(t * .19 + star.y * 8) * 3) % w;
      const y = (star.y * h + t * speed * star.drift) % h;
      const alpha = starOpacity * (.18 + star.size * .16);
      ctx.fillStyle = `rgba(220,238,252,${alpha})`;
      ctx.beginPath();
      ctx.arc(x, y, Math.max(.35, star.size * .58), 0, Math.PI * 2);
      ctx.fill();
      if (phase === "space" && star.size > 1.05) {
        ctx.strokeStyle = `rgba(186,218,244,${alpha * .42})`;
        ctx.lineWidth = .45;
        ctx.beginPath();
        ctx.moveTo(x, y - 3 - ascent * 2);
        ctx.lineTo(x, y + 3 + ascent * 2);
        ctx.stroke();
      }
    }
  }
}
class CockpitCompanions {
  constructor() {
    this.a = document.getElementById("companion-a");
    this.b = document.getElementById("companion-b");
    this.bubble = document.getElementById("speech-bubble");
    this.speaker = document.getElementById("speech-speaker");
    this.text = document.getElementById("speech-text");
    this.talkTimer = 0;
    this.blinkTimers = [];
    this.scheduleBlink(this.a, 0);
    this.scheduleBlink(this.b, 700);
  }

  scheduleBlink(character, extraDelay = 0) {
    const delay = extraDelay + 2000 + Math.random() * 4000;
    const timer = setTimeout(() => {
      character.classList.add("is-blinking");
      setTimeout(() => character.classList.remove("is-blinking"), 115 + Math.random() * 55);
      if (Math.random() < .18) setTimeout(() => {
        character.classList.add("is-blinking");
        setTimeout(() => character.classList.remove("is-blinking"), 95);
      }, 180);
      this.scheduleBlink(character);
    }, delay);
    this.blinkTimers.push(timer);
  }

  setJourneyPhase(phase) {
    const stateMap = {
      idle: ["idle", "idle"],
      prelaunch: ["idle", "idle"],
      ignition: ["excited", "excited"],
      liftoff: ["launching", "launching"],
      climb: ["excited", "idle"],
      "cloud-approach": ["excited", "idle"],
      clouds: ["turbulence", "turbulence"],
      "above-clouds": ["excited", "idle"],
      "upper-atmosphere": ["idle", "idle"],
      space: ["idle", "idle"],
      "earth-reveal": ["looking-earth", "pointing"],
      approach: ["looking-earth", "looking-earth"]
    };
    const [aState, bState] = stateMap[phase] || stateMap.idle;
    this.a.dataset.state = aState;
    this.b.dataset.state = bState;
  }

  setDialogue(entry, immediate = false) {
    if (!entry) return;
    const speakerEl = entry.speaker === "A" ? this.a : this.b;
    const otherEl = entry.speaker === "A" ? this.b : this.a;
    const apply = () => {
      this.speaker.textContent = entry.speaker === "A" ? "Nara" : "Aksa";
      this.text.textContent = entry.text;
      this.bubble.classList.toggle("speaker-a", entry.speaker === "A");
      this.bubble.classList.toggle("speaker-b", entry.speaker === "B");
      this.bubble.classList.remove("is-changing");
      clearTimeout(this.talkTimer);
      this.a.classList.remove("is-talking");
      this.b.classList.remove("is-talking");
      speakerEl.classList.add("is-talking");
      speakerEl.dataset.expression = entry.expression || "bright";
      otherEl.dataset.expression = entry.otherExpression || (entry.speaker === "A" ? "calm" : "bright");
      const duration = entry.duration || Math.min(3200, Math.max(1600, 1050 + entry.text.length * 32));
      this.talkTimer = setTimeout(() => speakerEl.classList.remove("is-talking"), duration);
    };
    if (immediate) apply();
    else {
      this.bubble.classList.add("is-changing");
      requestAnimationFrame(() => requestAnimationFrame(apply));
    }
  }
}

const DIALOGUE_TIMELINE = Object.freeze([
  { at: 0.00, phase: "prelaunch", speaker: "A", text: "Ayo, kita jelajah bersama!", expression: "bright", duration: 2300 },
  { at: 1.45, phase: "prelaunch", speaker: "B", text: "Kita mulai dari rumah kita dulu: Bumi.", expression: "calm", duration: 2500 },
  { at: LAUNCH_TIMING.ignition + .10, phase: "ignition", speaker: "A", text: "Mesinnya hidup. Siap?", expression: "bright", duration: 1750 },
  { at: LAUNCH_TIMING.liftoff - .62, phase: "ignition", speaker: "B", text: "Pegangan ya, kita mulai terbang!", expression: "focused", duration: 2100 },
  { at: LAUNCH_TIMING.liftoff + .22, phase: "liftoff", speaker: "A", text: "Kita naik! Kota di bawah mulai mengecil.", expression: "bright", duration: 2400 },
  { at: LAUNCH_TIMING.climb + .22, phase: "climb", speaker: "B", text: "Lihat, langitnya makin luas.", expression: "calm", duration: 2100 },
  { at: LAUNCH_TIMING.cloudApproach + .18, phase: "cloud-approach", speaker: "A", text: "Awan mulai kelihatan di depan.", expression: "bright", duration: 2200 },
  { at: LAUNCH_TIMING.clouds + .32, phase: "clouds", speaker: "B", text: "Sedikit berguncang. Kita sedang melewati awan.", expression: "focused", duration: 2600 },
  { at: LAUNCH_TIMING.aboveClouds + .20, phase: "above-clouds", speaker: "A", text: "Keren... kita sudah di atas awan.", expression: "soft", duration: 2250 },
  { at: LAUNCH_TIMING.upperAtmosphere + .22, phase: "upper-atmosphere", speaker: "B", text: "Langitnya makin gelap. Atmosfer mulai menipis.", expression: "calm", duration: 2650 },
  { at: LAUNCH_TIMING.space + .18, phase: "space", speaker: "A", text: "Sekarang tenang banget...", expression: "soft", duration: 1900 },
  { at: LAUNCH_TIMING.earthReveal + .22, phase: "earth-reveal", speaker: "B", text: "Itu Bumi! Rumah kita.", expression: "soft", duration: 2250 },
  { at: LAUNCH_TIMING.approach + .24, phase: "approach", speaker: "A", text: "Yuk, kita lihat lebih dekat!", expression: "bright", duration: 2200 }
]);

const mission = document.getElementById("mission");
const launchButton = document.getElementById("launch-button");
const earthPreviousButton = document.getElementById("earth-prev-planet");
const marsPreviousButton = document.getElementById("mars-prev-planet");
const venusNextButton = document.getElementById("venus-next-planet");
const audioToggle = document.getElementById("audio-toggle");
const audioLabel = document.getElementById("audio-label");
const announcement = document.getElementById("announcement");
const flightStatus = document.getElementById("flight-status");
const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)");
const flight = new LaunchVisual();
const companions = new CockpitCompanions();
companions.setJourneyPhase("idle");
companions.setDialogue(DIALOGUE_TIMELINE[0], true);
const earth = new EarthScene({ onNext: travelToMars });
const mars = new MarsScene();
const venus = new VenusScene();
let phase = "idle";
let elapsed = 0;
let previousFrame = 0;
let animationFrame = null;
let activeStatus = -1;
let activeDialogue = -1;
let activeFlightPhase = "idle";
let earthHandoffStarted = false;
const introPanel = document.querySelector(".intro");

function setExperienceState(state) {
  mission.dataset.experience = state;
  const home = state === "home";
  const launch = state === "launch";
  const openingVisible = home || launch;
  introPanel.inert = !home;
  introPanel.setAttribute("aria-hidden", String(!home));
  flight.stage.setAttribute("aria-hidden", String(!openingVisible));
  if (home) {
    flight.stage.hidden = false;
    flight.stage.style.transition = "none";
    flight.stage.style.opacity = "1";
    flight.renderIdle();
    companions.setJourneyPhase("idle");
  }
}

setExperienceState("home");

const sound = new MissionAudio(() => {
  audioToggle.classList.toggle("is-muted", sound.muted || sound.unavailable);
  audioToggle.setAttribute("aria-pressed", String(sound.muted));
  audioToggle.setAttribute("aria-label", sound.muted ? "Aktifkan audio" : "Bisukan audio");
  audioLabel.textContent = sound.unavailable ? "AUDIO TIDAK TERSEDIA" : sound.muted ? "SUARA MATI" : sound.failedAssets.size ? "AUDIO TERBATAS" : sound.started && phase !== "idle" ? "SUARA AKTIF" : "AUDIO SIAP";
  audioToggle.title = sound.unavailable ? "Audio tidak tersedia. Misi tetap dapat dilanjutkan." : !sound.started || phase === "idle" ? "Audio dimulai setelah Yuk, Berangkat! ditekan" : sound.muted ? "Aktifkan audio" : "Bisukan audio";
  if (!sound.unavailable && sound.failedAssets.size) audioToggle.title = "Sebagian audio tidak dapat dimuat. Misi tetap dapat dilanjutkan.";
});
sound.onStateChange();

// One shared UI-audio bridge for components loaded before this file (notably
// dynamically-rendered Earth/Mars/Venus image previews and the top-level lightbox).
window.AntariksaUIAudio = Object.freeze({
  click: () => sound.uiClick(),
  hover: () => sound.hover()
});

// Fetch quietly in advance, but never create/resume an AudioContext on page load.
if ("requestIdleCallback" in window) requestIdleCallback(() => sound.preload(), { timeout: 2000 });
else setTimeout(() => sound.preload(), 800);

const FLIGHT_STATUS_TIMELINE = [
  { time: 0, text: "SIAP • BUMI" },
  { time: LAUNCH_TIMING.ignition, text: "MESIN MENYALA" },
  { time: LAUNCH_TIMING.liftoff, text: "NAIK • KOTA MENJAUH" },
  { time: LAUNCH_TIMING.cloudApproach, text: "MENDEKATI AWAN" },
  { time: LAUNCH_TIMING.clouds, text: "MELEWATI AWAN" },
  { time: LAUNCH_TIMING.aboveClouds, text: "DI ATAS AWAN" },
  { time: LAUNCH_TIMING.upperAtmosphere, text: "ATMOSFER MENIPIS" },
  { time: LAUNCH_TIMING.space, text: "RUANG ANGKASA" },
  { time: LAUNCH_TIMING.earthReveal, text: "BUMI DI DEPAN" },
  { time: LAUNCH_TIMING.approach, text: "MENDEKATI BUMI" }
];

function advancePreparation(timestamp) {
  if (phase !== "preparing") return;
  if (!document.hidden) {
    // Audio's clock keeps ignition, cloud entry, dialogue, and the Earth handoff aligned.
    const audioClock = sound.context?.state === "running" && Number.isFinite(sound.missionStart);
    elapsed = audioClock ? Math.max(elapsed, sound.context.currentTime - sound.missionStart) : elapsed + (timestamp - previousFrame) / 1000;
  }
  previousFrame = timestamp;
  const visualPhase = flight.render(elapsed);
  if (visualPhase !== activeFlightPhase) {
    activeFlightPhase = visualPhase;
    companions.setJourneyPhase(visualPhase);
  }

  const status = FLIGHT_STATUS_TIMELINE.findLastIndex(item => elapsed >= item.time);
  if (status !== activeStatus && status >= 0) {
    activeStatus = status;
    if (flightStatus) flightStatus.textContent = FLIGHT_STATUS_TIMELINE[status].text;
  }

  const dialogue = DIALOGUE_TIMELINE.findLastIndex(item => elapsed >= item.at);
  if (dialogue !== activeDialogue && dialogue >= 0) {
    activeDialogue = dialogue;
    const cue = DIALOGUE_TIMELINE[dialogue];
    companions.setDialogue(cue);
    announcement.textContent = `${cue.speaker === "A" ? "Nara" : "Aksa"}: ${cue.text}`;
  }

  // Start the real Earth renderer behind the cockpit before the cockpit fades.
  // This makes the last approach a layered handoff instead of a hard scene cut.
  if (!earthHandoffStarted && elapsed >= LAUNCH_TIMING.approach) {
    earthHandoffStarted = true;
    mission.classList.add("is-earth");
    earth.start();
  }

  if (elapsed >= LAUNCH_TIMING.finish) {
    phase = "earth";
    mission.classList.remove("is-preparing");
    if (flightStatus) flightStatus.textContent = "TIBA DI BUMI";
    announcement.textContent = "Sampai. Bumi, rumah kita, sekarang ada di depan.";
    if (!earthHandoffStarted) earth.start();
    flight.stage.style.transition = reducedMotion.matches ? "opacity .01s linear" : "opacity .72s ease";
    requestAnimationFrame(() => { flight.stage.style.opacity = "0"; });
    setTimeout(() => {
      flight.reset();
      setExperienceState("planet");
    }, reducedMotion.matches ? 40 : 760);
    return;
  }
  animationFrame = requestAnimationFrame(advancePreparation);
}

launchButton.addEventListener("click", () => {
  if (phase !== "idle") return;
  phase = "preparing";
  elapsed = 0;
  activeStatus = -1;
  activeDialogue = -1;
  activeFlightPhase = "prelaunch";
  earthHandoffStarted = false;
  launchButton.disabled = true;
  setExperienceState("launch");
  sound.startMission();
  flight.start();
  companions.setJourneyPhase("prelaunch");
  companions.setDialogue(DIALOGUE_TIMELINE[0], true);
  earth.prepare();
  mars.prepare();
  venus.prepare().then(() => earth.setVenusTravelSurface(venus.surface)).catch(() => {});
  mission.classList.add("is-preparing");
  if (flightStatus) flightStatus.textContent = "SIAP BERANGKAT";
  announcement.textContent = "Nara: Ayo, kita jelajah bersama!";
  previousFrame = performance.now();
  animationFrame = requestAnimationFrame(advancePreparation);
});

function travelToVenus() {
  if (phase !== "earth" || earth.exploring) return;
  setExperienceState("planet");
  phase = "venus-transition";
  if (flightStatus) flightStatus.textContent = "PERJALANAN MENUJU VENUS";
  announcement.textContent = "Meninggalkan Bumi. Kamera beralih ke kiri menuju Venus.";

  // Reuse VenusScene's fully resolved surface before the existing travel timeline
  // begins. The movement, direction, camera pan, and duration stay unchanged.
  venus.prepare().then(() => {
    if (phase !== "venus-transition") return;
    earth.setVenusTravelSurface(venus.surface);
    sound.travel(reducedMotion.matches ? 0.4 : 6.2);
    earth.beginTravelToVenus({
      onReveal: () => {
        if (phase !== "venus-transition") return;
        venus.start({ settled: true });
      },
      onComplete: () => {
        if (phase !== "venus-transition") return;
        earth.stop();
        mission.classList.remove("is-earth");
        mission.classList.add("is-venus");
        phase = "venus";
        if (flightStatus) flightStatus.textContent = "TIBA DI ORBIT VENUS";
        announcement.textContent = "Tiba di Venus.";
      }
    });
  });
}

function travelVenusToEarth() {
  if (phase !== "venus" || venus.exploring) return;
  setExperienceState("planet");
  phase = "venus-earth-transition";
  if (flightStatus) flightStatus.textContent = "PERJALANAN MENUJU BUMI";
  announcement.textContent = "Meninggalkan Venus. Kembali menuju Bumi.";
  earth.setVenusTravelSurface(venus.surface);
  sound.travel(reducedMotion.matches ? 0.4 : 6.2);
  earth.beginTravelFromVenus({
    venusRotation: venus.renderedRotation,
    onCovered: () => {
      if (phase === "venus-earth-transition") venus.stop();
    },
    onComplete: () => {
      if (phase !== "venus-earth-transition") return;
      mission.classList.remove("is-venus");
      mission.classList.add("is-earth");
      phase = "earth";
      if (flightStatus) flightStatus.textContent = "KEMBALI DI ORBIT BUMI";
      announcement.textContent = "Kembali di Bumi.";
    }
  });
}

function travelToMars() {
  if (phase !== "earth") return;
  setExperienceState("planet");
  phase = "mars-transition";
  if (flightStatus) flightStatus.textContent = "PERJALANAN MENUJU PLANET MERAH";
  announcement.textContent = "Meninggalkan Bumi. Kamera beralih menuju Mars.";
  sound.travel(reducedMotion.matches ? 0.4 : 6.2);
  earth.beginTravelToMars({
    onReveal: () => {
      if (phase !== "mars-transition") return;
      mars.start({ settled: true });
    },
    onComplete: () => {
      if (phase !== "mars-transition") return;
      earth.stop();
      mission.classList.remove("is-earth");
      mission.classList.add("is-mars");
      phase = "mars";
      if (flightStatus) flightStatus.textContent = "TIBA DI ORBIT MARS";
      announcement.textContent = "Tiba di Mars.";
    }
  });
}

function travelToEarth() {
  if (phase !== "mars" || mars.exploring) return;
  setExperienceState("planet");
  phase = "earth-transition";
  if (flightStatus) flightStatus.textContent = "PERJALANAN KEMBALI KE BUMI";
  announcement.textContent = "Meninggalkan Mars. Kembali menuju Bumi.";
  sound.travel(reducedMotion.matches ? 0.4 : 6.2);
  earth.beginTravelFromMars({
    marsRotation: mars.renderedRotation,
    onCovered: () => {
      if (phase === "earth-transition") mars.stop();
    },
    onComplete: () => {
      if (phase !== "earth-transition") return;
      mission.classList.remove("is-mars");
      mission.classList.add("is-earth");
      phase = "earth";
      if (flightStatus) flightStatus.textContent = "KEMBALI DI ORBIT BUMI";
      announcement.textContent = "Kembali di Bumi.";
    }
  });
}

function resetMission() {
  cancelAnimationFrame(animationFrame);
  sound.stop(1.1);
  phase = "idle";
  flight.reset();
  companions.setJourneyPhase("idle");
  companions.setDialogue(DIALOGUE_TIMELINE[0], true);
  activeStatus = -1;
  activeDialogue = -1;
  activeFlightPhase = "idle";
  earthHandoffStarted = false;
  earth.stop();
  mars.stop();
  venus.stop();
  mission.classList.remove("is-earth", "is-mars", "is-venus", "is-preparing", "is-planet-transitioning");
  setExperienceState("home");
  launchButton.disabled = false;
  if (flightStatus) flightStatus.textContent = "SIAP • BUMI";
  sound.onStateChange();
  launchButton.focus({ preventScroll: true });
}
earthPreviousButton.addEventListener("click", travelToVenus);
venusNextButton.addEventListener("click", travelVenusToEarth);
marsPreviousButton.addEventListener("click", travelToEarth);
document.addEventListener("keydown", event => {
  if (phase === "earth" && earth.exploring) {
    if (event.key === "ArrowRight" || event.key === "ArrowLeft") {
      event.preventDefault();
      earth.setExplorationStop(earth.topicIndex + (event.key === "ArrowRight" ? 1 : -1));
    }
    if (event.key === "Escape") { event.preventDefault(); earth.exitExploration(); }
    return;
  }
  if (phase === "venus" && venus.exploring) {
    if (event.key === "ArrowRight" || event.key === "ArrowLeft") {
      event.preventDefault();
      venus.setExplorationStop(venus.topicIndex + (event.key === "ArrowRight" ? 1 : -1));
    }
    if (event.key === "Escape") { event.preventDefault(); venus.exitExploration(); }
    return;
  }
  if (event.key === "ArrowRight" && phase === "earth") travelToMars();
  if (event.key === "ArrowLeft" && phase === "earth") travelToVenus();
  if (event.key === "ArrowRight" && phase === "venus" && !venus.exploring) travelVenusToEarth();
  if (event.key === "ArrowLeft" && phase === "mars" && !mars.exploring) travelToEarth();
  if (event.key === "Escape" && phase !== "idle") resetMission();
});
window.addEventListener("resize", () => flight.resize());

audioToggle.addEventListener("click", () => {
  const willMute = !sound.muted;
  // Turning sound off gets its feedback before mute is applied; turning it on
  // gets feedback immediately after audio has been restored.
  if (willMute) sound.uiClick();
  sound.setMuted(willMute);
  if (!willMute) sound.uiClick();
});

// Every real interactive control gets one consistent UI sound. Use capture phase so
// Earth/Mars/Venus handlers cannot swallow the click before audio feedback is dispatched.
// This also covers dynamically-rendered progress controls. The top-level lightbox
// keeps its existing manual audio handlers and is marked data-ui-sound="manual".
document.addEventListener("click", event => {
  const target = event.target instanceof Element ? event.target : null;
  const control = target?.closest("button, a[href], [role=\"button\"]");
  if (!control) return;

  const insideMission = mission.contains(control);
  const insideLightbox = Boolean(control.closest(".exploration-lightbox"));
  if (!insideMission && !insideLightbox) return;

  if (control.matches("button:disabled, [aria-disabled=\"true\"]")) return;
  if (control.dataset.uiSound === "manual") return;

  // These actions already have their own intentional audio and must not double-fire.
  if (control === launchButton || control === earth.nextButton || control === earthPreviousButton || control === venusNextButton || control === marsPreviousButton || control === audioToggle) return;

  sound.uiClick();
}, true);

for (const button of [launchButton, earth.nextButton, earthPreviousButton, venusNextButton, venus.exploreButton, marsPreviousButton, mars.exploreButton, audioToggle]) {
  button.addEventListener("pointerenter", event => { if (event.pointerType === "mouse") sound.hover(); });
  button.addEventListener("focus", () => sound.hover());
}
document.addEventListener("visibilitychange", () => {
  mission.classList.toggle("is-backgrounded", document.hidden);
  const orbits = document.querySelector(".navigation-orbits");
  if (orbits) {
    if (document.hidden || reducedMotion.matches) orbits.pauseAnimations?.();
    else orbits.unpauseAnimations?.();
  }
  sound.setBackground(document.hidden);
  previousFrame = performance.now();
});
window.addEventListener("pagehide", () => sound.stop(0.15));

// Small, compositor-only camera movement; disabled for touch and reduced motion.
let pointerFrame = null;
mission.addEventListener("pointermove", event => {
  if (reducedMotion.matches || event.pointerType !== "mouse" || phase !== "idle" || innerWidth < 701) return;
  if (pointerFrame) cancelAnimationFrame(pointerFrame);
  pointerFrame = requestAnimationFrame(() => {
    mission.style.setProperty("--parallax-x", `${(event.clientX / innerWidth - 0.5) * -8}px`);
    mission.style.setProperty("--parallax-y", `${(event.clientY / innerHeight - 0.5) * -5}px`);
    mission.style.setProperty("--orbit-x", `${(event.clientX / innerWidth - 0.5) * -15}px`);
    mission.style.setProperty("--orbit-y", `${(event.clientY / innerHeight - 0.5) * -9}px`);
    mission.style.setProperty("--foreground-x", `${(event.clientX / innerWidth - 0.5) * -25}px`);
    mission.style.setProperty("--foreground-y", `${(event.clientY / innerHeight - 0.5) * -15}px`);
    pointerFrame = null;
  });
});
mission.addEventListener("pointerleave", () => {
  mission.style.setProperty("--parallax-x", "0px");
  mission.style.setProperty("--parallax-y", "0px");
  for (const layer of ["orbit", "foreground"]) {
    mission.style.setProperty(`--${layer}-x`, "0px");
    mission.style.setProperty(`--${layer}-y`, "0px");
  }
});

function updateOrbitMotion() {
  const orbits = document.querySelector(".navigation-orbits");
  if (!orbits) return;
  if (reducedMotion.matches || document.hidden) orbits.pauseAnimations?.();
  else orbits.unpauseAnimations?.();
}
reducedMotion.addEventListener("change", updateOrbitMotion);
updateOrbitMotion();
