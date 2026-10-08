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
  settle: 1.8,
  ignition: 4.2,
  liftoff: 6.5,
  climb: 9.0,
  cloudApproach: 12.0,
  clouds: 14.5,
  aboveClouds: 18.2,
  upperAtmosphere: 21.5,
  space: 24.0,
  exit: 24.0,
  earthReveal: 26.0,
  approach: 28.2,
  finish: 30.5
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
    this.altitudeValue = document.getElementById("altitude-value");
    this.climbValue = document.getElementById("climb-value");
    this.altitudeChartLine = document.getElementById("altitude-chart-line");
    this.altitudeChartDot = document.getElementById("altitude-chart-dot");
    this.rocketProgress = document.getElementById("rocket-progress");
    this.journeyPercent = document.getElementById("journey-percent");
    this.missionStageText = document.getElementById("mission-stage-text");
    this.phaseReadout = document.getElementById("phase-readout");
    this.modeReadout = document.getElementById("mode-readout");
    this.commReadout = document.getElementById("comm-readout");
    this.guidanceReadout = document.getElementById("guidance-readout");
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
    this.updateTelemetry(0, "idle", 0);
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
    // Reveal the Earth limb gradually after the upper atmosphere. This is the
    // planet we just left below us, not a distant target flying toward us.
    const earthReveal = smooth((t - (c.space + .55)) / Math.max(.01, c.approach - c.space + .25));
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
    const charLag = phase === "liftoff" ? 1.45 : phase === "clouds" ? 1.2 : phase === "ignition" ? .72 : phase === "climb" ? .46 : .2;

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
    this.stage.style.setProperty("--char-a-x", `${camX * .36 - charLag * .18}px`);
    this.stage.style.setProperty("--char-a-y", `${camY * .28 + charLag}px`);
    this.stage.style.setProperty("--char-b-x", `${camX * .34 + charLag * .16}px`);
    this.stage.style.setProperty("--char-b-y", `${camY * .27 + charLag * .84}px`);

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

    this.updateTelemetry(t, phase, ascent);
    if (this.ctx) this.drawParticles(t, ascent, starOpacity, phase);
    this.lastPhase = phase;
    return phase;
  }

  updateTelemetry(t, phase, ascent) {
    const clamp = value => Math.min(1, Math.max(0, value));
    const c = LAUNCH_TIMING;
    const journey = clamp((t - c.liftoff) / Math.max(.01, c.space - c.liftoff));
    const altitudeProgress = phase === "idle" ? 0 : journey;
    const altitude = 120 * Math.pow(altitudeProgress, 1.18);
    const climbRate = altitudeProgress <= 0 ? 0 : .35 + 7.65 * Math.pow(altitudeProgress, .88);

    if (this.altitudeValue) this.altitudeValue.textContent = `${altitude.toFixed(altitude < 10 ? 1 : 0)} KM`;
    if (this.climbValue) this.climbValue.textContent = `+${climbRate.toFixed(2)} KM/S`;
    if (this.journeyPercent) this.journeyPercent.textContent = `${Math.round(journey * 100)}%`;
    if (this.rocketProgress) this.rocketProgress.style.left = `${8 + journey * 84}%`;

    if (this.altitudeChartLine && this.altitudeChartDot) {
      const count = Math.max(1, Math.round(journey * 22));
      const points = [];
      let endX = 1;
      let endY = 56;
      for (let i = 0; i <= count; i += 1) {
        const local = i / Math.max(1, count);
        const x = 2 + local * journey * 96;
        const rise = Math.pow(local * journey, 1.22);
        const y = 56 - rise * 48 - Math.sin((local * journey) * Math.PI * 3) * Math.min(1.8, journey * 2);
        points.push(`${x.toFixed(2)},${y.toFixed(2)}`);
        endX = x; endY = y;
      }
      this.altitudeChartLine.setAttribute("points", points.join(" "));
      this.altitudeChartDot.setAttribute("cx", endX.toFixed(2));
      this.altitudeChartDot.setAttribute("cy", endY.toFixed(2));
    }

    const labels = {
      idle: ["STANDBY", "GROUND", "LINK READY", "LOCKED", "PRE-LAUNCH"],
      prelaunch: ["PRE-LAUNCH", "GROUND", "LINK READY", "LOCKED", "SYSTEM CHECK"],
      ignition: ["IGNITION", "POWER-UP", "COMMS OK", "LOCKED", "ENGINE START"],
      liftoff: ["LIFTOFF", "ASCENT", "COMMS OK", "TRACKING", "CLEARING CITY"],
      climb: ["CLIMB", "ASCENT", "COMMS OK", "TRACKING", "ATMOSPHERIC CLIMB"],
      "cloud-approach": ["CLOUD DECK", "ASCENT", "COMMS OK", "TRACKING", "CLOUD APPROACH"],
      clouds: ["IN CLOUDS", "TURBULENCE", "COMMS OK", "TRACKING", "CLOUD TRANSIT"],
      "above-clouds": ["HIGH ALT", "ASCENT", "COMMS OK", "TRACKING", "ABOVE CLOUDS"],
      "upper-atmosphere": ["UPPER ATM", "ASCENT", "COMMS OK", "TRACKING", "UPPER ATMOSPHERE"],
      space: ["SPACE", "COAST", "COMMS OK", "ORBIT LOCK", "OUTER SPACE"],
      "earth-reveal": ["EARTH VIEW", "COAST", "COMMS OK", "ORBIT LOCK", "EARTH ACQUIRED"],
      approach: ["APPROACH", "ORBIT", "COMMS OK", "ORBIT LOCK", "EARTH HANDOFF"]
    };
    const data = labels[phase] || labels.idle;
    if (this.phaseReadout) this.phaseReadout.textContent = data[0];
    if (this.modeReadout) this.modeReadout.textContent = data[1];
    if (this.commReadout) this.commReadout.textContent = data[2];
    if (this.guidanceReadout) this.guidanceReadout.textContent = data[3];
    if (this.missionStageText) this.missionStageText.textContent = data[4];
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
const CHARACTER_SPRITES = Object.freeze({
  A: {
    name: "Nara",
    base: "assets/characters/nara/",
    fallback: "idle.webp",
    states: Object.freeze({
      idle: "idle.webp",
      happy: "happy.webp",
      talking: "talking.webp",
      excited: "excited.webp",
      pointing: "excited.webp",
      explaining: "talking.webp",
      thinking: "thinking.webp",
      surprised: "surprised.webp",
      confident: "confident.webp",
      supportive: "supportive.webp"
    })
  },
  B: {
    name: "Sora",
    base: "assets/characters/sora/",
    fallback: "idle.webp",
    states: Object.freeze({
      idle: "idle.webp",
      smile: "smile.webp",
      happy: "smile.webp",
      talking: "talking.webp",
      excited: "smile.webp",
      curious: "curious.webp",
      explaining: "talking.webp",
      thinking: "thinking.webp",
      surprised: "surprised.webp",
      confident: "confident.webp",
      supportive: "supportive.webp"
    })
  }
});

class CockpitCompanions {
  constructor() {
    this.a = document.getElementById("companion-a");
    this.b = document.getElementById("companion-b");
    this.images = {
      A: document.getElementById("nara-sprite"),
      B: document.getElementById("sora-sprite")
    };
    this.bubble = document.getElementById("speech-bubble");
    this.speaker = document.getElementById("speech-speaker");
    this.text = document.getElementById("speech-text");
    this.talkTimer = 0;
    this.currentSprite = { A: "", B: "" };
    this.spriteTimers = { A: 0, B: 0 };
    this.preload();
  }

  preload() {
    for (const config of Object.values(CHARACTER_SPRITES)) {
      const files = new Set(Object.values(config.states));
      for (const file of files) {
        const image = new Image();
        image.decoding = "async";
        image.src = config.base + file;
      }
    }
  }

  spritePath(side, state) {
    const config = CHARACTER_SPRITES[side];
    return config.base + (config.states[state] || config.fallback);
  }

  swapSprite(side, state, immediate = false) {
    const host = side === "A" ? this.a : this.b;
    const image = this.images[side];
    const next = this.spritePath(side, state);
    if (!image || this.currentSprite[side] === next) {
      if (host) host.dataset.state = state;
      return;
    }
    clearTimeout(this.spriteTimers[side]);
    const apply = () => {
      image.src = next;
      image.dataset.sprite = state;
      host.dataset.state = state;
      requestAnimationFrame(() => host.classList.remove("is-sprite-changing"));
      this.currentSprite[side] = next;
    };
    if (immediate) {
      host.classList.remove("is-sprite-changing");
      apply();
      return;
    }
    host.classList.add("is-sprite-changing");
    this.spriteTimers[side] = window.setTimeout(apply, 105);
  }

  setJourneyPhase(phase) {
    // Flight phase may change physical cockpit motion, but it must never overwrite
    // the sprite/expression selected by the current 3-second dialogue cue.
    if (this.a) this.a.dataset.flightPhase = phase;
    if (this.b) this.b.dataset.flightPhase = phase;
  }

  setDialogue(entry, immediate = false) {
    if (!entry) return;
    const speakerSide = entry.speaker;
    const otherSide = speakerSide === "A" ? "B" : "A";
    const speakerEl = speakerSide === "A" ? this.a : this.b;
    const otherEl = otherSide === "A" ? this.a : this.b;
    const apply = () => {
      const speakerConfig = CHARACTER_SPRITES[speakerSide];
      this.speaker.textContent = speakerConfig.name;
      this.text.textContent = entry.text;
      this.bubble.classList.toggle("speaker-a", speakerSide === "A");
      this.bubble.classList.toggle("speaker-b", speakerSide === "B");
      this.bubble.classList.remove("is-changing");
      clearTimeout(this.talkTimer);
      this.a.classList.remove("is-talking", "is-focused", "is-listening");
      this.b.classList.remove("is-talking", "is-focused", "is-listening");
      this.a.dataset.role = "idle";
      this.b.dataset.role = "idle";
      speakerEl.classList.add("is-talking", "is-focused");
      otherEl.classList.add("is-listening");
      speakerEl.dataset.role = "speaking";
      otherEl.dataset.role = "listening";
      speakerEl.dataset.expression = entry.emotion || entry.sprite || "neutral";
      otherEl.dataset.expression = entry.otherEmotion || "neutral";
      this.swapSprite(speakerSide, entry.sprite || "talking", immediate);
      if (entry.otherSprite) this.swapSprite(otherSide, entry.otherSprite, immediate);
      const duration = Math.max(3000, entry.duration || Math.min(3400, Math.max(3000, 1050 + entry.text.length * 32)));
      this.talkTimer = setTimeout(() => {
        speakerEl.classList.remove("is-talking");
        speakerEl.classList.add("is-focused");
      }, duration);
    };
    if (immediate) apply();
    else {
      this.bubble.classList.add("is-changing");
      requestAnimationFrame(() => requestAnimationFrame(apply));
    }
  }
}

const DIALOGUE_TIMELINE = Object.freeze([
  { at: 0.00, phase: "prelaunch", speaker: "A", text: "Hai! Sudah Siap menjelajah Tata Surya Kita?", emotion: "happy", sprite: "happy", otherSprite: "idle", duration: 3000 },
  { at: 3.20, phase: "prelaunch", speaker: "B", text: "Kita mulai dari rumah kita dulu: Bumi.", emotion: "explaining", sprite: "talking", otherSprite: "confident", duration: 3000 },
  { at: 6.30, phase: "ignition", speaker: "A", text: "Mesinnya hidup. Siap?", emotion: "excited", sprite: "excited", otherSprite: "supportive", duration: 3000 },
  { at: 9.40, phase: "climb", speaker: "B", text: "Lihat, langitnya makin luas.", emotion: "explaining", sprite: "talking", otherSprite: "confident", duration: 3000 },
  { at: 12.50, phase: "cloud-approach", speaker: "A", text: "Awan mulai kelihatan di depan.", emotion: "explaining", sprite: "pointing", otherSprite: "curious", duration: 3000 },
  { at: 15.60, phase: "clouds", speaker: "B", text: "Sedikit berguncang. Kita sedang melewati awan.", emotion: "surprised", sprite: "surprised", otherSprite: "surprised", duration: 3000 },
  { at: 18.70, phase: "above-clouds", speaker: "A", text: "Keren... kita sudah di atas awan.", emotion: "excited", sprite: "excited", otherSprite: "smile", duration: 3000 },
  { at: 21.80, phase: "upper-atmosphere", speaker: "B", text: "Langitnya makin gelap. Atmosfer mulai menipis.", emotion: "explaining", sprite: "talking", otherSprite: "thinking", duration: 3000 },
  { at: 24.90, phase: "space", speaker: "A", text: "Sekarang tenang banget...", emotion: "thinking", sprite: "thinking", otherSprite: "curious", duration: 3000 },
  { at: 28.05, phase: "approach", speaker: "B", text: "Itu Bumi! Rumah kita.", emotion: "surprised", sprite: "surprised", otherSprite: "pointing", duration: 3000 }
]);

const mission = document.getElementById("mission");
const launchButton = document.getElementById("launch-button");
const earthPreviousButton = document.getElementById("earth-prev-planet");
const marsPreviousButton = document.getElementById("mars-prev-planet");
const marsNextButton = document.getElementById("mars-next-planet");
const venusPreviousButton = document.getElementById("venus-prev-planet");
const venusNextButton = document.getElementById("venus-next-planet");
const mercuryPreviousButton = document.getElementById("mercury-prev-planet");
const mercuryNextButton = document.getElementById("mercury-next-planet");
const sunPreviousButton = document.getElementById("sun-prev-object");
const sunNextButton = document.getElementById("sun-next-object");
const asteroidPreviousButton = document.getElementById("asteroid-prev-object");
const asteroidNextButton = document.getElementById("asteroid-next-object");
const jupiterPreviousButton = document.getElementById("jupiter-prev-planet");
const jupiterNextButton = document.getElementById("jupiter-next-planet");
const saturnPreviousButton = document.getElementById("saturn-prev-planet");
const saturnNextButton = document.getElementById("saturn-next-planet");
const uranusPreviousButton = document.getElementById("uranus-prev-planet");
const uranusNextButton = document.getElementById("uranus-next-planet");
const neptunePreviousButton = document.getElementById("neptune-prev-planet");
const neptuneNextButton = document.getElementById("neptune-next-planet");
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
const earthFull = new EarthFullExploration(earth);
const mars = new MarsScene();
const mercury = new MercuryScene();
const sun = new SunScene();
const venus = new VenusScene();
const asteroid = new AsteroidBeltScene();
const jupiter = new JupiterScene();
const saturn = new SaturnScene();
const uranus = new UranusScene();
const neptune = new NeptuneScene();

function bindSharedJupiterVisualsIfReady() {
  asteroid.bindJupiterVisualSource?.(jupiter);
  saturn.bindJupiterVisualSource?.(jupiter);
}
function prepareSharedJupiterVisuals({ includeSaturn=false }={}) {
  const jobs=[jupiter.prepare(),asteroid.prepare()];
  if(includeSaturn)jobs.push(saturn.prepare());
  Promise.all(jobs).then(bindSharedJupiterVisualsIfReady).catch(()=>{});
  bindSharedJupiterVisualsIfReady();
}
function bindSharedSaturnVisualsIfReady() {
  uranus.bindSaturnVisualSource?.(saturn);
}
function prepareUranusConnection() {
  const jobs=[saturn.prepare(),uranus.prepare()];
  Promise.all(jobs).then(bindSharedSaturnVisualsIfReady).catch(()=>{});
  bindSharedSaturnVisualsIfReady();
}
function bindSharedUranusVisualsIfReady() {
  neptune.bindUranusVisualSource?.(uranus);
}
function prepareNeptuneConnection() {
  const jobs=[uranus.prepare(),neptune.prepare()];
  Promise.all(jobs).then(bindSharedUranusVisualsIfReady).catch(()=>{});
  bindSharedUranusVisualsIfReady();
}

let phase = "idle";
let elapsed = 0;
let previousFrame = 0;
let animationFrame = null;
let activeStatus = -1;
let activeDialogue = -1;
let activeFlightPhase = "idle";
let earthHandoffStarted = false;
let planetTransitionLocked = false;
let activePlanetNavButton = null;
const CELESTIAL_NAV_ORDER = Object.freeze(["sun", "mercury", "venus", "earth", "mars", "asteroid", "jupiter", "saturn", "uranus", "neptune"]);

// Shared panorama interaction lifecycle. Planet renderers own the physical motion,
// while this layer owns whether panorama UI is interactive during travel. Keeping
// that responsibility here mirrors the existing global transition lock and avoids
// per-planet timeout patches.
const CELESTIAL_SCENE_INSTANCES = Object.freeze({
  sun, mercury, venus, earth, mars, asteroid, jupiter, saturn, uranus, neptune
});

function lockTransitionSceneInteraction(sourcePhase, destinationPhase) {
  for (const name of [sourcePhase, destinationPhase]) {
    const scene = CELESTIAL_SCENE_INSTANCES[name];
    if (scene?.element) scene.element.inert = true;
  }
}

function unlockPanoramaInteraction(activePhase) {
  const scene = CELESTIAL_SCENE_INSTANCES[activePhase];
  if (scene?.element) scene.element.inert = false;
}

function resetPanoramaInteractionLocks() {
  for (const scene of Object.values(CELESTIAL_SCENE_INSTANCES)) {
    if (scene?.element) scene.element.inert = false;
  }
}

function getCelestialDirection(from, to) {
  const fromIndex = CELESTIAL_NAV_ORDER.indexOf(from);
  const toIndex = CELESTIAL_NAV_ORDER.indexOf(to);
  if (fromIndex < 0 || toIndex < 0 || fromIndex === toIndex) throw new Error(`Invalid celestial transition: ${from} -> ${to}`);
  return toIndex > fromIndex ? 1 : -1;
}

window.AntaraNavigation = Object.freeze({
  order: CELESTIAL_NAV_ORDER,
  direction: getCelestialDirection
});

function beginPlanetTransition(expectedPhase, transitionPhase, triggerButton = null, destinationPhase = null) {
  if (planetTransitionLocked || phase !== expectedPhase) return false;
  planetTransitionLocked = true;
  phase = transitionPhase;
  mission.classList.add("is-planet-transitioning");
  if (destinationPhase) {
    const direction = getCelestialDirection(expectedPhase, destinationPhase);
    mission.dataset.transitionDirection = direction > 0 ? "next" : "previous";
    lockTransitionSceneInteraction(expectedPhase, destinationPhase);
  } else {
    lockTransitionSceneInteraction(expectedPhase, null);
  }
  activePlanetNavButton = triggerButton;
  if (triggerButton) {
    triggerButton.classList.add("is-nav-pressed");
    triggerButton.setAttribute("aria-busy", "true");
    requestAnimationFrame(() => requestAnimationFrame(() => triggerButton.classList.remove("is-nav-pressed")));
  }
  return true;
}

function finishPlanetTransition(nextPhase) {
  phase = nextPhase;
  planetTransitionLocked = false;
  mission.classList.remove("is-planet-transitioning");
  delete mission.dataset.transitionDirection;
  if (activePlanetNavButton) activePlanetNavButton.removeAttribute("aria-busy");
  activePlanetNavButton = null;
  unlockPanoramaInteraction(nextPhase);

  // Mars can be rendered behind the final part of the Earth -> Mars handoff before
  // the shared transition lock is released. The caption is therefore allowed to be
  // visible slightly before it is actually interactive. Normalize the completed
  // panorama state here so a stale inert flag can never leave the visible Previous /
  // Next controls dead after arrival or after returning from the Asteroid Belt.
  if (nextPhase === "mars" && !mars.exploring && !mars.fullExplorationActive) {
    mars.caption.inert = false;
    mars.caption.classList.add("is-visible");
    marsPreviousButton.disabled = false;
    marsNextButton.disabled = false;
  }
}

function abortPlanetTransition(fallbackPhase) {
  finishPlanetTransition(fallbackPhase);
}
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
    announcement.textContent = `${cue.speaker === "A" ? "Nara" : "Sora"}: ${cue.text}`;
  }

  // Start the real Earth renderer behind the cockpit before the cockpit fades.
  // This makes the last approach a layered handoff instead of a hard scene cut.
  if (!earthHandoffStarted && elapsed >= LAUNCH_TIMING.earthReveal + 0.55) {
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
  sun.prepare();
  venus.prepare().then(() => {
    earth.setVenusTravelSurface(venus.surface);
    mercury.setVenusTravelSurface(venus.surface);
  }).catch(() => {});
  mission.classList.add("is-preparing");
  if (flightStatus) flightStatus.textContent = "SIAP BERANGKAT";
  announcement.textContent = "Nara: Hai! Sudah Siap menjelajah Tata Surya Kita?";
  previousFrame = performance.now();
  animationFrame = requestAnimationFrame(advancePreparation);
});

function travelToVenus() {
  if (earth.fullExploring || earth.exploring || !beginPlanetTransition("earth", "venus-transition", document.getElementById("earth-prev-planet"), "venus")) return;
  setExperienceState("planet");
  if (flightStatus) flightStatus.textContent = "PERJALANAN MENUJU VENUS";
  announcement.textContent = "Meninggalkan Bumi. Kamera beralih ke kiri menuju Venus.";

  // Neighbor preloading happens before the next click path, so Venus -> Mercury
  // never has to build Mercury synchronously after input.
  mercury.prepare();
  venus.prepare().then(() => {
    if (phase !== "venus-transition") return;
    earth.setVenusTravelSurface(venus.surface);
    sound.travel(reducedMotion.matches ? 0.4 : 6.2);
    earth.beginTravelToVenus({
      onReveal: () => {
        if (phase !== "venus-transition") return;
        venus.start({ settled: true });
        mercury.prepare();
      },
      onComplete: () => {
        if (phase !== "venus-transition") return;
        earth.stop();
        mission.classList.remove("is-earth");
        mission.classList.add("is-venus");
        finishPlanetTransition("venus");
        if (flightStatus) flightStatus.textContent = "TIBA DI ORBIT VENUS";
        announcement.textContent = "Tiba di Venus.";
      }
    });
  }).catch(() => abortPlanetTransition("earth"));
}

function travelVenusToMercury() {
  if (venus.exploring || !beginPlanetTransition("venus", "venus-mercury-transition", venusPreviousButton, "mercury")) return;
  setExperienceState("planet");
  if (flightStatus) flightStatus.textContent = "PERJALANAN MENUJU MERKURIUS";
  announcement.textContent = "Meninggalkan Venus. Kamera bergeser menuju Merkurius.";

  // Mercury is precompiled during launch and again while Venus is active.
  // The click path therefore starts the cinematic immediately.
  mercury.setVenusTravelSurface(venus.surface);
  sound.travel(reducedMotion.matches ? 0.4 : 6.2);
  mercury.beginTravelFromVenus({
    venusRotation: venus.renderedRotation,
    onCovered: () => {
      if (phase === "venus-mercury-transition") venus.stop();
    },
    onComplete: () => {
      if (phase !== "venus-mercury-transition") return;
      mission.classList.remove("is-venus");
      mission.classList.add("is-mercury");
      finishPlanetTransition("mercury");
      sun.prepare();
      if (flightStatus) flightStatus.textContent = "TIBA DI ORBIT MERKURIUS";
      announcement.textContent = "Tiba di Merkurius, planet terkecil dan terdekat dari Matahari.";
    }
  });
}

function travelMercuryToSun() {
  if (mercury.exploring || !beginPlanetTransition("mercury", "mercury-sun-transition", mercuryPreviousButton, "sun")) return;
  setExperienceState("planet");
  if (flightStatus) flightStatus.textContent = "PERJALANAN MENUJU MATAHARI";
  announcement.textContent = "Meninggalkan Merkurius. Cahaya Matahari semakin kuat di depan.";

  // Sun is already prepared while the mission is running; do not await it here.
  sun.setMercuryTravelSurface(mercury.surface);
  sound.travel(reducedMotion.matches ? 0.4 : 6.4);
  sun.beginTravelFromMercury({
    mercuryRotation: mercury.renderedRotation,
    onCovered: () => {
      if (phase === "mercury-sun-transition") mercury.stop();
    },
    onComplete: () => {
      if (phase !== "mercury-sun-transition") return;
      mission.classList.remove("is-mercury");
      mission.classList.add("is-sun");
      finishPlanetTransition("sun");
      if (flightStatus) flightStatus.textContent = "TIBA DI DEKAT MATAHARI";
      announcement.textContent = "Tiba di Matahari, bintang pusat Tata Surya.";
    }
  });
}

function travelSunToMercury() {
  if (sun.exploring || !beginPlanetTransition("sun", "sun-mercury-transition", sunNextButton, "mercury")) return;
  setExperienceState("planet");
  if (flightStatus) flightStatus.textContent = "MENJAUH DARI MATAHARI";
  announcement.textContent = "Meninggalkan Matahari. Merkurius mulai terlihat di kejauhan.";

  sun.setMercuryTravelSurface(mercury.surface);
  sound.travel(reducedMotion.matches ? 0.4 : 6.4);
  sun.beginTravelToMercury({
    onComplete: () => {
      if (phase !== "sun-mercury-transition") return;
      mercury.start({ settled: true });
      sun.stop();
      mission.classList.remove("is-sun");
      mission.classList.add("is-mercury");
      finishPlanetTransition("mercury");
      if (flightStatus) flightStatus.textContent = "TIBA DI ORBIT MERKURIUS";
      announcement.textContent = "Tiba di Merkurius.";
    }
  });
}

function travelMercuryToVenus() {
  if (mercury.exploring || !beginPlanetTransition("mercury", "mercury-venus-transition", mercuryNextButton, "venus")) return;
  setExperienceState("planet");
  if (flightStatus) flightStatus.textContent = "PERJALANAN MENUJU VENUS";
  announcement.textContent = "Meninggalkan Merkurius. Kamera bergeser menuju Venus.";

  mercury.setVenusTravelSurface(venus.surface);
  sound.travel(reducedMotion.matches ? 0.4 : 6.2);
  mercury.beginTravelToVenus({
    onReveal: () => {
      if (phase !== "mercury-venus-transition") return;
      venus.start({ settled: true });
    },
    onComplete: () => {
      if (phase !== "mercury-venus-transition") return;
      mercury.stop();
      mission.classList.remove("is-mercury");
      mission.classList.add("is-venus");
      finishPlanetTransition("venus");
      if (flightStatus) flightStatus.textContent = "TIBA DI ORBIT VENUS";
      announcement.textContent = "Tiba di Venus.";
    }
  });
}

function travelVenusToEarth() {
  if (venus.exploring || !beginPlanetTransition("venus", "venus-earth-transition", venusNextButton, "earth")) return;
  setExperienceState("planet");
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
      finishPlanetTransition("earth");
      if (flightStatus) flightStatus.textContent = "KEMBALI DI ORBIT BUMI";
      announcement.textContent = "Kembali di Bumi.";
    }
  });
}

function travelToMars() {
  if (earth.fullExploring) return;
  if (!beginPlanetTransition("earth", "mars-transition", document.getElementById("earth-next"), "mars")) return;
  setExperienceState("planet");
  if (flightStatus) flightStatus.textContent = "PERJALANAN MENUJU PLANET MERAH";
  announcement.textContent = "Meninggalkan Bumi. Kamera beralih menuju Mars.";
  // The next two outward destinations are prepared during this existing journey,
  // never inside the Mars navigation click path.
  prepareSharedJupiterVisuals();
  sound.travel(reducedMotion.matches ? 0.4 : 6.2);
  earth.beginTravelToMars({
    onReveal: () => {
      if (phase !== "mars-transition") return;
      mars.start({ settled: true });
      prepareSharedJupiterVisuals();
    },
    onComplete: () => {
      if (phase !== "mars-transition") return;
      earth.stop();
      mission.classList.remove("is-earth");
      mission.classList.add("is-mars");
      finishPlanetTransition("mars");
      if (flightStatus) flightStatus.textContent = "TIBA DI ORBIT MARS";
      announcement.textContent = "Tiba di Mars.";
    }
  });
}

function travelToEarth() {
  if (mars.exploring || mars.fullExplorationActive || !beginPlanetTransition("mars", "earth-transition", marsPreviousButton, "earth")) return;
  setExperienceState("planet");
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
      finishPlanetTransition("earth");
      if (flightStatus) flightStatus.textContent = "KEMBALI DI ORBIT BUMI";
      announcement.textContent = "Kembali di Bumi.";
    }
  });
}

function travelMarsToAsteroid() {
  if (mars.exploring || mars.fullExplorationActive || !beginPlanetTransition("mars", "mars-asteroid-transition", marsNextButton, "asteroid")) return;
  setExperienceState("planet");
  if (flightStatus) flightStatus.textContent = "PERJALANAN MENUJU SABUK ASTEROID";
  announcement.textContent = "Meninggalkan Mars. Memasuki wilayah sabuk asteroid utama.";
  prepareSharedJupiterVisuals({ includeSaturn:true });
  sound.travel(reducedMotion.matches ? 0.4 : 6.2);
  asteroid.beginTravelFromMars({
    direction: getCelestialDirection("mars", "asteroid"),
    marsRotation: mars.renderedRotation,
    marsHeroDistance: mars.finalDistance,
    marsHeroFov: mars.camera?.fov ?? 36,
    onCovered: () => {
      if (phase === "mars-asteroid-transition") mars.stop();
    },
    onComplete: () => {
      if (phase !== "mars-asteroid-transition") return;
      mission.classList.remove("is-mars");
      mission.classList.add("is-asteroid");
      finishPlanetTransition("asteroid");
      if (flightStatus) flightStatus.textContent = "TIBA DI SABUK ASTEROID";
      announcement.textContent = "Tiba di Sabuk Asteroid, wilayah berbatu luas antara Mars dan Jupiter.";
    }
  });
}

function travelAsteroidToMars() {
  if (asteroid.exploring || !beginPlanetTransition("asteroid", "asteroid-mars-transition", asteroidPreviousButton, "mars")) return;
  setExperienceState("planet");
  if (flightStatus) flightStatus.textContent = "KEMBALI MENUJU MARS";
  announcement.textContent = "Meninggalkan Sabuk Asteroid. Mars mulai terlihat di bagian dalam Tata Surya.";
  sound.travel(reducedMotion.matches ? 0.5 : 7.0);
  asteroid.beginTravelToMars({
    direction: getCelestialDirection("asteroid", "mars"),
    marsHeroDistance: mars.finalDistance,
    marsHeroFov: mars.camera?.fov ?? 36,
    onComplete: () => {
      if (phase !== "asteroid-mars-transition") return;
      mars.start({ settled: true });
      asteroid.stop();
      mission.classList.remove("is-asteroid");
      mission.classList.add("is-mars");
      finishPlanetTransition("mars");
      if (flightStatus) flightStatus.textContent = "KEMBALI DI ORBIT MARS";
      announcement.textContent = "Kembali di Mars.";
    }
  });
}

function travelAsteroidToJupiter() {
  if (asteroid.exploring || !beginPlanetTransition("asteroid", "asteroid-jupiter-transition", asteroidNextButton, "jupiter")) return;
  setExperienceState("planet");
  if (flightStatus) flightStatus.textContent = "MENINGGALKAN SABUK ASTEROID";
  announcement.textContent = "Benda-benda berbatu mulai menipis. Jupiter muncul jauh di depan.";
  prepareSharedJupiterVisuals({ includeSaturn:true });
  sound.travel(reducedMotion.matches ? 0.5 : 7.8);
  asteroid.beginTravelToJupiter({
    direction: getCelestialDirection("asteroid", "jupiter"),
    jupiterRotation: jupiter.renderedRotation,
    jupiterTime: jupiter.time,
    onComplete: () => {
      if (phase !== "asteroid-jupiter-transition") return;
      jupiter.start({ settled:true, rotation:asteroid.getJupiterVisualRotation?.(), time:asteroid.getJupiterVisualTime?.() });
      asteroid.stop();
      mission.classList.remove("is-asteroid");
      mission.classList.add("is-jupiter");
      finishPlanetTransition("jupiter");
      if (flightStatus) flightStatus.textContent = "TIBA DI ORBIT JUPITER";
      announcement.textContent = "Tiba di Jupiter. Cincin debunya yang redup ikut mengorbit planet raksasa ini.";
    }
  });
}

function travelJupiterToAsteroid() {
  if (jupiter.exploring || !beginPlanetTransition("jupiter", "jupiter-asteroid-transition", jupiterPreviousButton, "asteroid")) return;
  setExperienceState("planet");
  if (flightStatus) flightStatus.textContent = "MENUJU SABUK ASTEROID";
  announcement.textContent = "Jupiter menjauh. Memasuki kembali wilayah Sabuk Asteroid.";
  prepareSharedJupiterVisuals();
  sound.travel(reducedMotion.matches ? 0.5 : 7.8);
  asteroid.beginTravelFromJupiter({
    direction: getCelestialDirection("jupiter", "asteroid"),
    jupiterRotation: jupiter.renderedRotation,
    jupiterTime: jupiter.time,
    onCovered: () => {
      if (phase === "jupiter-asteroid-transition") jupiter.stop();
    },
    onComplete: () => {
      if (phase !== "jupiter-asteroid-transition") return;
      mission.classList.remove("is-jupiter");
      mission.classList.add("is-asteroid");
      finishPlanetTransition("asteroid");
      if (flightStatus) flightStatus.textContent = "TIBA DI SABUK ASTEROID";
      announcement.textContent = "Kembali di Sabuk Asteroid.";
    }
  });
}

function travelJupiterToSaturn() {
  if (jupiter.exploring || !beginPlanetTransition("jupiter", "jupiter-saturn-transition", jupiterNextButton, "saturn")) return;
  setExperienceState("planet");
  if (flightStatus) flightStatus.textContent = "PERJALANAN MENUJU SATURNUS";
  announcement.textContent = "Meninggalkan Jupiter. Saturnus dan sistem cincinnya mulai muncul jauh di depan.";
  prepareSharedJupiterVisuals({ includeSaturn:true });
  prepareUranusConnection();
  sound.travel(reducedMotion.matches ? 0.5 : 8.0);
  saturn.beginTravelFromJupiter({
    direction: getCelestialDirection("jupiter", "saturn"),
    jupiterRotation: jupiter.renderedRotation,
    jupiterTime: jupiter.time,
    onCovered: () => { if (phase === "jupiter-saturn-transition") jupiter.stop(); },
    onComplete: () => {
      if (phase !== "jupiter-saturn-transition") return;
      mission.classList.remove("is-jupiter");
      mission.classList.add("is-saturn");
      finishPlanetTransition("saturn");
      if (flightStatus) flightStatus.textContent = "TIBA DI ORBIT SATURNUS";
      announcement.textContent = "Tiba di Saturnus. Cassini Division terlihat pada sistem cincinnya.";
    }
  });
}

function travelSaturnToJupiter() {
  if (saturn.exploring || !beginPlanetTransition("saturn", "saturn-jupiter-transition", saturnPreviousButton, "jupiter")) return;
  setExperienceState("planet");
  if (flightStatus) flightStatus.textContent = "KEMBALI MENUJU JUPITER";
  announcement.textContent = "Saturnus menjauh. Jupiter kembali muncul di bagian dalam Tata Surya.";
  prepareSharedJupiterVisuals({ includeSaturn:true });
  sound.travel(reducedMotion.matches ? 0.5 : 8.0);
  saturn.beginTravelToJupiter({
    direction: getCelestialDirection("saturn", "jupiter"),
    jupiterRotation: jupiter.renderedRotation,
    jupiterTime: jupiter.time,
    onComplete: () => {
      if (phase !== "saturn-jupiter-transition") return;
      jupiter.start({ settled:true, rotation:saturn.getJupiterVisualRotation?.(), time:saturn.getJupiterVisualTime?.() });
      saturn.stop();
      mission.classList.remove("is-saturn");
      mission.classList.add("is-jupiter");
      finishPlanetTransition("jupiter");
      if (flightStatus) flightStatus.textContent = "KEMBALI DI ORBIT JUPITER";
      announcement.textContent = "Kembali di Jupiter.";
    }
  });
}

function travelSaturnToUranus() {
  if (saturn.exploring || !beginPlanetTransition("saturn", "saturn-uranus-transition", saturnNextButton, "uranus")) return;
  setExperienceState("planet");
  if (flightStatus) flightStatus.textContent = "PERJALANAN MENUJU URANUS";
  announcement.textContent = "Saturnus menjauh. Uranus yang pucat dan miring mulai muncul di jalur berikutnya.";
  prepareUranusConnection();
  neptune.prepare().then(bindSharedUranusVisualsIfReady).catch(()=>{});
  sound.travel(reducedMotion.matches ? 0.5 : 8.0);
  uranus.beginTravelFromSaturn({
    direction: getCelestialDirection("saturn", "uranus"),
    saturnRotation: saturn.planet?.rotation?.y ?? saturn.renderedRotation,
    saturnTime: saturn.time,
    onCovered: () => { if (phase === "saturn-uranus-transition") saturn.stop(); },
    onComplete: () => {
      if (phase !== "saturn-uranus-transition") return;
      mission.classList.remove("is-saturn");
      mission.classList.add("is-uranus");
      finishPlanetTransition("uranus");
      if (flightStatus) flightStatus.textContent = "TIBA DI ORBIT URANUS";
      announcement.textContent = "Tiba di Uranus. Sumbu rotasi dan cincin gelapnya tampak hampir menyamping.";
    }
  });
}

function travelUranusToSaturn() {
  if (uranus.exploring || !beginPlanetTransition("uranus", "uranus-saturn-transition", uranusPreviousButton, "saturn")) return;
  setExperienceState("planet");
  if (flightStatus) flightStatus.textContent = "KEMBALI MENUJU SATURNUS";
  announcement.textContent = "Uranus menjauh. Saturnus kembali muncul di jalur bagian dalam.";
  prepareUranusConnection();
  sound.travel(reducedMotion.matches ? 0.5 : 8.0);
  uranus.beginTravelToSaturn({
    direction: getCelestialDirection("uranus", "saturn"),
    onComplete: () => {
      if (phase !== "uranus-saturn-transition") return;
      saturn.start({ settled:true, rotation:uranus.getSaturnVisualRotation?.(), time:uranus.getSaturnVisualTime?.() });
      uranus.stop();
      mission.classList.remove("is-uranus");
      mission.classList.add("is-saturn");
      finishPlanetTransition("saturn");
      if (flightStatus) flightStatus.textContent = "KEMBALI DI ORBIT SATURNUS";
      announcement.textContent = "Kembali di Saturnus.";
    }
  });
}


function travelUranusToNeptune() {
  if (uranus.exploring || !beginPlanetTransition("uranus", "uranus-neptune-transition", uranusNextButton, "neptune")) return;
  setExperienceState("planet");
  if (flightStatus) flightStatus.textContent = "PERJALANAN MENUJU NEPTUNUS";
  announcement.textContent = "Uranus menjauh. Dunia biru yang lebih gelap mulai muncul di jalur terluar.";
  prepareNeptuneConnection();
  sound.travel(reducedMotion.matches ? 0.5 : 8.0);
  neptune.beginTravelFromUranus({
    direction: getCelestialDirection("uranus", "neptune"),
    uranusRotation: uranus.planet?.rotation?.y ?? uranus.renderedRotation,
    uranusTime: uranus.time,
    onCovered: () => { if (phase === "uranus-neptune-transition") uranus.stop(); },
    onComplete: () => {
      if (phase !== "uranus-neptune-transition") return;
      mission.classList.remove("is-uranus");
      mission.classList.add("is-neptune");
      finishPlanetTransition("neptune");
      if (flightStatus) flightStatus.textContent = "TIBA DI ORBIT NEPTUNUS";
      announcement.textContent = "Tiba di Neptunus, planet utama terjauh dengan atmosfer biru yang sangat aktif.";
    }
  });
}

function travelNeptuneToUranus() {
  if (neptune.exploring || !beginPlanetTransition("neptune", "neptune-uranus-transition", neptunePreviousButton, "uranus")) return;
  setExperienceState("planet");
  if (flightStatus) flightStatus.textContent = "KEMBALI MENUJU URANUS";
  announcement.textContent = "Neptunus menjauh. Uranus kembali muncul dari jalur bagian dalam.";
  prepareNeptuneConnection();
  sound.travel(reducedMotion.matches ? 0.5 : 8.0);
  neptune.beginTravelToUranus({
    direction: getCelestialDirection("neptune", "uranus"),
    onComplete: () => {
      if (phase !== "neptune-uranus-transition") return;
      uranus.start({ settled:true, rotation:neptune.getUranusVisualRotation?.(), time:neptune.getUranusVisualTime?.() });
      neptune.stop();
      mission.classList.remove("is-neptune");
      mission.classList.add("is-uranus");
      finishPlanetTransition("uranus");
      if (flightStatus) flightStatus.textContent = "KEMBALI DI ORBIT URANUS";
      announcement.textContent = "Kembali di Uranus.";
    }
  });
}


function resetMission() {
  earthFull.forceReset?.();
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
  mercury.stop();
  sun.stop();
  venus.stop();
  jupiter.stop();
  saturn.stop();
  uranus.stop();
  neptune.stop();
  planetTransitionLocked = false;
  activePlanetNavButton = null;
  resetPanoramaInteractionLocks();
  mission.classList.remove("is-earth", "is-mars", "is-venus", "is-mercury", "is-sun", "is-asteroid", "is-jupiter", "is-saturn", "is-uranus", "is-neptune", "is-preparing", "is-planet-transitioning");
  setExperienceState("home");
  launchButton.disabled = false;
  if (flightStatus) flightStatus.textContent = "SIAP • BUMI";
  sound.onStateChange();
  launchButton.focus({ preventScroll: true });
}
earthPreviousButton.addEventListener("click", travelToVenus);
venusPreviousButton.addEventListener("click", travelVenusToMercury);
venusNextButton.addEventListener("click", travelVenusToEarth);
mercuryPreviousButton.addEventListener("click", travelMercuryToSun);
mercuryNextButton.addEventListener("click", travelMercuryToVenus);
sunNextButton.addEventListener("click", travelSunToMercury);
marsPreviousButton.addEventListener("click", travelToEarth);
marsNextButton.addEventListener("click", travelMarsToAsteroid);
asteroidPreviousButton.addEventListener("click", travelAsteroidToMars);
asteroidNextButton.addEventListener("click", travelAsteroidToJupiter);
jupiterPreviousButton.addEventListener("click", travelJupiterToAsteroid);
jupiterNextButton.addEventListener("click", travelJupiterToSaturn);
saturnPreviousButton.addEventListener("click", travelSaturnToJupiter);
saturnNextButton.addEventListener("click", travelSaturnToUranus);
uranusPreviousButton.addEventListener("click", travelUranusToSaturn);
uranusNextButton.addEventListener("click", travelUranusToNeptune);
neptunePreviousButton.addEventListener("click", travelNeptuneToUranus);
document.addEventListener("keydown", event => {
  if (phase === "earth" && earthFull.state !== "idle") {
    if (event.key === "Escape") { event.preventDefault(); earthFull.exit(); }
    return;
  }
  if (phase === "mars" && mars.fullExplorationActive) {
    if (event.key === "Escape") { event.preventDefault(); mars.fullExploration?.exit(); }
    return;
  }
  if (phase === "earth" && earth.exploring) {
    if (event.key === "ArrowRight" || event.key === "ArrowLeft") {
      event.preventDefault();
      earth.setExplorationStop(earth.topicIndex + (event.key === "ArrowRight" ? 1 : -1));
    }
    if (event.key === "Escape") { event.preventDefault(); earth.exitExploration(); }
    return;
  }
  if (phase === "mercury" && mercury.exploring) {
    if (event.key === "ArrowRight" || event.key === "ArrowLeft") {
      event.preventDefault();
      mercury.setExplorationStop(mercury.topicIndex + (event.key === "ArrowRight" ? 1 : -1));
    }
    if (event.key === "Escape") { event.preventDefault(); mercury.exitExploration(); }
    return;
  }
  if (phase === "sun" && sun.exploring) {
    if (event.key === "ArrowRight" || event.key === "ArrowLeft") {
      event.preventDefault();
      sun.setExplorationStop(sun.topicIndex + (event.key === "ArrowRight" ? 1 : -1));
    }
    if (event.key === "Escape") { event.preventDefault(); sun.exitExploration(); }
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
  if (phase === "asteroid" && asteroid.exploring) {
    if (event.key === "ArrowRight" || event.key === "ArrowLeft") {
      event.preventDefault();
      asteroid.setExplorationStop(asteroid.topicIndex + (event.key === "ArrowRight" ? 1 : -1));
    }
    if (event.key === "Escape") { event.preventDefault(); asteroid.exitExploration(); }
    return;
  }
  if (phase === "jupiter" && jupiter.exploring) {
    if (event.key === "ArrowRight" || event.key === "ArrowLeft") {
      event.preventDefault();
      jupiter.setExplorationStop(jupiter.topicIndex + (event.key === "ArrowRight" ? 1 : -1));
    }
    if (event.key === "Escape") { event.preventDefault(); jupiter.exitExploration(); }
    return;
  }
  if (phase === "saturn" && saturn.exploring) {
    if (event.key === "ArrowRight" || event.key === "ArrowLeft") {
      event.preventDefault();
      saturn.setExplorationStop(saturn.topicIndex + (event.key === "ArrowRight" ? 1 : -1));
    }
    if (event.key === "Escape") { event.preventDefault(); saturn.exitExploration(); }
    return;
  }
  if (phase === "uranus" && uranus.exploring) {
    if (event.key === "ArrowRight" || event.key === "ArrowLeft") {
      event.preventDefault();
      uranus.setExplorationStop(uranus.topicIndex + (event.key === "ArrowRight" ? 1 : -1));
    }
    if (event.key === "Escape") { event.preventDefault(); uranus.exitExploration(); }
    return;
  }
  if (phase === "neptune" && neptune.exploring) {
    if (event.key === "ArrowRight" || event.key === "ArrowLeft") {
      event.preventDefault();
      neptune.setExplorationStop(neptune.topicIndex + (event.key === "ArrowRight" ? 1 : -1));
    }
    if (event.key === "Escape") { event.preventDefault(); neptune.exitExploration(); }
    return;
  }
  if (event.key === "ArrowRight" && phase === "earth") travelToMars();
  if (event.key === "ArrowLeft" && phase === "earth") travelToVenus();
  if (event.key === "ArrowLeft" && phase === "venus" && !venus.exploring) travelVenusToMercury();
  if (event.key === "ArrowRight" && phase === "venus" && !venus.exploring) travelVenusToEarth();
  if (event.key === "ArrowLeft" && phase === "mercury" && !mercury.exploring) travelMercuryToSun();
  if (event.key === "ArrowRight" && phase === "mercury" && !mercury.exploring) travelMercuryToVenus();
  if (event.key === "ArrowRight" && phase === "sun" && !sun.exploring) travelSunToMercury();
  if (event.key === "ArrowLeft" && phase === "mars" && !mars.exploring && !mars.fullExplorationActive) travelToEarth();
  if (event.key === "ArrowRight" && phase === "mars" && !mars.exploring && !mars.fullExplorationActive) travelMarsToAsteroid();
  if (event.key === "ArrowLeft" && phase === "asteroid" && !asteroid.exploring) travelAsteroidToMars();
  if (event.key === "ArrowRight" && phase === "asteroid" && !asteroid.exploring) travelAsteroidToJupiter();
  if (event.key === "ArrowLeft" && phase === "jupiter" && !jupiter.exploring) travelJupiterToAsteroid();
  if (event.key === "ArrowRight" && phase === "jupiter" && !jupiter.exploring) travelJupiterToSaturn();
  if (event.key === "ArrowLeft" && phase === "saturn" && !saturn.exploring) travelSaturnToJupiter();
  if (event.key === "ArrowRight" && phase === "saturn" && !saturn.exploring) travelSaturnToUranus();
  if (event.key === "ArrowLeft" && phase === "uranus" && !uranus.exploring) travelUranusToSaturn();
  if (event.key === "ArrowRight" && phase === "uranus" && !uranus.exploring) travelUranusToNeptune();
  if (event.key === "ArrowLeft" && phase === "neptune" && !neptune.exploring) travelNeptuneToUranus();
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
  if (control === launchButton || control === earth.nextButton || control === earthPreviousButton || control === venusPreviousButton || control === venusNextButton || control === mercuryPreviousButton || control === mercuryNextButton || control === sunNextButton || control === marsPreviousButton || control === marsNextButton || control === asteroidPreviousButton || control === asteroidNextButton || control === jupiterPreviousButton || control === jupiterNextButton || control === saturnPreviousButton || control === saturnNextButton || control === uranusPreviousButton || control === uranusNextButton || control === neptunePreviousButton || control === audioToggle) return;

  sound.uiClick();
}, true);

for (const button of [launchButton, earth.nextButton, earthPreviousButton, earthFull.entryButton, venusPreviousButton, venusNextButton, mercuryPreviousButton, mercuryNextButton, mercury.exploreButton, sunNextButton, sun.exploreButton, venus.exploreButton, marsPreviousButton, marsNextButton, mars.exploreButton, mars.fullExploration?.entryButton, asteroidPreviousButton, asteroidNextButton, asteroid.exploreButton, jupiterPreviousButton, jupiterNextButton, jupiter.exploreButton, saturnPreviousButton, saturnNextButton, saturn.exploreButton, uranusPreviousButton, uranusNextButton, uranus.exploreButton, neptunePreviousButton, neptune.exploreButton, audioToggle].filter(Boolean)) {
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
