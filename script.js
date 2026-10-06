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
const LAUNCH_TIMING = Object.freeze({ appearance: 0.35, settle: 2.35, ignition: 2.4, liftoff: 4.55, exit: 6.75, finish: 8.3 });

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
    try { this.muted = localStorage.getItem("antariksa-muted") === "true"; } catch { /* Storage is optional. */ }
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
    try { localStorage.setItem("antariksa-muted", String(value)); } catch { /* Optional preference. */ }
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

// A lightweight flight renderer. Only the active cinematic runs a canvas loop;
// transforms, particles, captions, and audio all follow the same elapsed time.
class LaunchVisual {
  constructor() {
    this.stage = document.getElementById("launch-stage");
    this.vehicle = document.getElementById("launch-vehicle");
    this.bloom = document.getElementById("launch-bloom");
    this.arrivalEarth = document.getElementById("arrival-earth");
    this.sky = this.stage.querySelector(".launch-sky");
    this.canvas = document.getElementById("launch-particles");
    try { this.ctx = this.canvas.getContext("2d", { alpha: true }); } catch { this.ctx = null; }
    const random = n => { const x = Math.sin(n * 127.1 + 311.7) * 43758.5453; return x - Math.floor(x); };
    this.stars = Array.from({ length: 88 }, (_, i) => ({ x: random(i), y: random(i + 100), size: 0.4 + random(i + 200) * 1.1 }));
    this.particles = Array.from({ length: 36 }, (_, i) => ({ seed: random(i + 400), spread: random(i + 600) * 2 - 1 }));
  }

  resize() {
    if (this.stage.hidden) return;
    this.width = this.stage.clientWidth;
    this.height = this.stage.clientHeight;
    this.anchor = this.vehicle.offsetTop;
    this.vehicleHeight = this.vehicle.offsetHeight;
    const dpr = Math.min(window.devicePixelRatio || 1, 1.5);
    this.canvas.width = Math.round(this.width * dpr);
    this.canvas.height = Math.round(this.height * dpr);
    this.ctx?.setTransform(dpr, 0, 0, dpr, 0, 0);
  }

  start() {
    this.stage.hidden = false;
    this.stage.style.transition = "none";
    this.resize();
    this.render(0);
  }

  reset() {
    this.stage.hidden = true;
    this.stage.style.transition = "none";
    this.stage.style.opacity = "0";
    this.stage.dataset.phase = "idle";
    this.stage.style.setProperty("--space-mix", "0");
    this.stage.style.setProperty("--grid-opacity", "0");
    this.vehicle.style.transform = "";
    this.vehicle.style.opacity = "0";
    this.vehicle.style.setProperty("--engine-power", "0");
    this.bloom.style.opacity = "0";
    this.arrivalEarth.style.opacity = "0";
    this.arrivalEarth.style.transform = "translate(-50%, -50%) scale(.08)";
    this.ctx?.clearRect(0, 0, this.width || 0, this.height || 0);
  }

  render(t) {
    const clamp = value => Math.min(1, Math.max(0, value));
    const smooth = value => { const v = clamp(value); return v * v * (3 - 2 * v); };
    const cue = LAUNCH_TIMING;
    const ignition = smooth((t - cue.ignition) / (cue.liftoff - cue.ignition));
    const ascent = smooth((t - cue.liftoff) / (cue.exit - cue.liftoff));
    const coast = smooth((t - cue.exit) / (cue.finish - cue.exit));
    const earthReveal = smooth((t - (cue.exit - 0.55)) / (cue.finish - cue.exit + 0.55));
    const spaceMix = smooth((t - (cue.ignition + 0.25)) / (cue.exit - cue.ignition));
    const engine = smooth((t - cue.ignition) / 0.7) * (1 - coast * 0.45);

    // The cinematic vehicle begins exactly where the landing-page craft sits.
    // That removes the old "rocket appears from below" discontinuity.
    let y = 0;
    if (t >= cue.liftoff) y = -(this.anchor + this.vehicleHeight * 1.45 + 95) * Math.pow(ascent, 1.72);
    const anticipation = smooth((t - (cue.ignition - 0.45)) / 0.8);
    const shakeStrength = t < cue.liftoff ? anticipation * (0.9 + ignition * 1.8) : (1 - ascent) * 1.2;
    const shakeX = reducedMotion.matches ? 0 : Math.sin(t * 61) * shakeStrength;
    const shakeY = reducedMotion.matches ? 0 : Math.cos(t * 47) * shakeStrength * 0.42;

    this.stage.dataset.phase = t < cue.ignition ? "standby" : t < cue.liftoff ? "ignition" : t < cue.exit ? "ascent" : "approach";
    this.stage.style.opacity = String(smooth((t - 0.08) / 0.45));
    this.stage.style.setProperty("--space-mix", String(spaceMix));
    this.stage.style.setProperty("--grid-opacity", String(ascent * (1 - coast) * 0.48));

    const vehicleFade = 1 - smooth((t - (cue.exit - 0.25)) / 0.95);
    this.vehicle.style.opacity = String(reducedMotion.matches ? Math.min(1, vehicleFade) : vehicleFade);
    this.vehicle.style.transform = reducedMotion.matches
      ? "translate3d(-50%, 0, 0)"
      : `translate3d(calc(-50% + ${shakeX}px), ${y + shakeY}px, 0) scale(${1 + ascent * 0.045})`;
    this.vehicle.style.setProperty("--engine-power", String(engine));
    this.vehicle.style.setProperty("--plume-length", String(0.08 + ignition * 0.58 + ascent * 0.85 + Math.sin(t * 29) * engine * 0.025));
    this.bloom.style.opacity = String(engine * (1 - coast) * (reducedMotion.matches ? 0.25 : 0.68));
    this.sky.style.transform = reducedMotion.matches ? "none" : `translate3d(${shakeX * -0.25}px, ${ascent * 14}px, 0) scale(${1 + ascent * 0.025})`;

    this.arrivalEarth.style.opacity = String(earthReveal);
    const earthScale = 0.08 + earthReveal * (reducedMotion.matches ? 0.72 : 0.94);
    const earthY = 48 + (1 - earthReveal) * 8;
    this.arrivalEarth.style.transform = `translate(-50%, -${earthY}%) scale(${earthScale}) rotate(${earthReveal * -3}deg)`;
    this.arrivalEarth.style.backgroundPosition = `${50 + Math.sin(t * 0.22) * 3}% center`;

    if (this.ctx && !reducedMotion.matches) this.drawAtmosphere(t, y, engine, ascent, coast);
  }

  drawAtmosphere(t, y, engine, ascent, coast) {
    const ctx = this.ctx;
    const w = this.width;
    const h = this.height;
    ctx.clearRect(0, 0, w, h);
    // Quiet stars become fine downward light trails as the camera follows liftoff.
    for (const star of this.stars) {
      const x = star.x * w;
      const sy = (star.y * h + ascent * ascent * h * 0.4) % h;
      ctx.strokeStyle = `rgba(200,219,241,${0.15 + star.size * 0.14})`;
      ctx.lineWidth = star.size * 0.65;
      ctx.beginPath();
      ctx.moveTo(x, sy);
      ctx.lineTo(x, sy + star.size + ascent * (1 - coast) * 45);
      ctx.stroke();
    }
    ctx.strokeStyle = "rgba(237,197,126,0.10)";
    ctx.lineWidth = 0.7;
    ctx.beginPath();
    ctx.ellipse(w * 0.5, h * 0.63, w * 0.41, h * 0.35, -0.35, 0, Math.PI * 2);
    ctx.stroke();
    if (engine < 0.01) return;
    const baseY = this.anchor + this.vehicleHeight * 0.945 + y;
    // Ground vapor expands sideways, with soft cool edges and warm reflected light.
    const cloudAge = Math.max(0, t - LAUNCH_TIMING.ignition);
    for (let i = 0; i < 18; i++) {
      const particle = this.particles[i];
      const travel = cloudAge * (28 + particle.seed * 35);
      const cx = w * 0.5 + particle.spread * (20 + travel);
      const cy = this.anchor + this.vehicleHeight + 45 + particle.seed * 55 - cloudAge * 5;
      const radius = 20 + cloudAge * 13 + particle.seed * 25;
      const alpha = engine * (1 - coast) * 0.12;
      const gradient = ctx.createRadialGradient(cx, cy, 0, cx, cy, radius);
      gradient.addColorStop(0, `rgba(195,182,158,${alpha})`);
      gradient.addColorStop(0.5, `rgba(116,137,158,${alpha * 0.65})`);
      gradient.addColorStop(1, "rgba(80,100,125,0)");
      ctx.fillStyle = gradient;
      ctx.fillRect(cx - radius, cy - radius, radius * 2, radius * 2);
    }
    // A restrained number of hot particles follow the moving engine nozzle.
    if (ascent < 1) for (const particle of this.particles) {
      const age = (t * 0.8 + particle.seed) % 1;
      const px = w * 0.5 + particle.spread * (6 + age * 40);
      const py = baseY + age * (70 + ascent * 220);
      ctx.fillStyle = `rgba(255,215,155,${engine * (1 - age) * 0.6})`;
      ctx.fillRect(px, py, 0.8 + particle.seed, 1.5 + ascent * 7);
    }
  }
}

const mission = document.getElementById("mission");
const launchButton = document.getElementById("launch-button");
const earthPreviousButton = document.getElementById("earth-prev-planet");
const marsPreviousButton = document.getElementById("mars-prev-planet");
const venusNextButton = document.getElementById("venus-next-planet");
const audioToggle = document.getElementById("audio-toggle");
const audioLabel = document.getElementById("audio-label");
const preparation = document.getElementById("preparation");
const preparationStep = document.getElementById("preparation-step");
const announcement = document.getElementById("announcement");
const flightStatus = document.getElementById("flight-status");
const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)");
const flight = new LaunchVisual();
const earth = new EarthScene({ onNext: travelToMars });
const mars = new MarsScene();
const venus = new VenusScene();
const locationDetail = document.querySelector(".location-detail");
const originalLocation = locationDetail.textContent;
const preparationProgress = document.querySelector(".preparation-track span");
let phase = "idle";
let elapsed = 0;
let previousFrame = 0;
let animationFrame = null;
let activeStep = -1;

const sound = new MissionAudio(() => {
  audioToggle.classList.toggle("is-muted", sound.muted || sound.unavailable);
  audioToggle.setAttribute("aria-pressed", String(sound.muted));
  audioToggle.setAttribute("aria-label", sound.muted ? "Aktifkan audio" : "Bisukan audio");
  audioLabel.textContent = sound.unavailable ? "AUDIO TIDAK TERSEDIA" : sound.muted ? "SUARA MATI" : sound.failedAssets.size ? "AUDIO TERBATAS" : sound.started && phase !== "idle" ? "SUARA AKTIF" : "AUDIO SIAP";
  audioToggle.title = sound.unavailable ? "Audio tidak tersedia. Misi tetap dapat dilanjutkan." : !sound.started || phase === "idle" ? "Audio dimulai setelah Ayo Berangkat! ditekan" : sound.muted ? "Aktifkan audio" : "Bisukan audio";
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

const preparationSteps = [
  { time: 0, text: "Semua siap. Nusantara 01 menunggu hitungan terakhir." },
  { time: LAUNCH_TIMING.ignition, text: "Mesin menyala. Rasakan getarannya!" },
  { time: LAUNCH_TIMING.liftoff, text: "Kita terbang! Arah pertama: Bumi dari luar angkasa." },
  { time: LAUNCH_TIMING.exit, text: "Lihat di depan. Rumah kita mulai terlihat." }
];

function advancePreparation(timestamp) {
  if (phase !== "preparing") return;
  if (!document.hidden) {
    // Audio's clock keeps the ignition and flight aligned even under low frame rates.
    const audioClock = sound.context?.state === "running" && Number.isFinite(sound.missionStart);
    elapsed = audioClock ? Math.max(elapsed, sound.context.currentTime - sound.missionStart) : elapsed + (timestamp - previousFrame) / 1000;
  }
  previousFrame = timestamp;
  flight.render(elapsed);
  preparationProgress.style.transform = `scaleX(${Math.min(1, elapsed / LAUNCH_TIMING.finish)})`;
  const step = preparationSteps.findLastIndex(item => elapsed >= item.time);
  if (step !== activeStep) {
    activeStep = step;
    preparationStep.textContent = preparationSteps[step].text;
    announcement.textContent = preparationSteps[step].text;
  }
  if (elapsed >= LAUNCH_TIMING.finish) {
    phase = "earth";
    preparation.setAttribute("aria-hidden", "true");
    preparation.style.opacity = "0";
    mission.classList.add("is-earth");
    if (flightStatus) flightStatus.textContent = "MEMASUKI ORBIT BUMI";
    locationDetail.textContent = "PLANET ASAL • BUMI";
    announcement.textContent = "Sampai! Bumi, rumah kita, sekarang terlihat dari luar angkasa.";
    earth.start();
    flight.stage.style.transition = reducedMotion.matches ? "opacity .01s linear" : "opacity .9s ease";
    requestAnimationFrame(() => { flight.stage.style.opacity = "0"; });
    setTimeout(() => flight.reset(), reducedMotion.matches ? 40 : 950);
    return;
  }
  animationFrame = requestAnimationFrame(advancePreparation);
}

launchButton.addEventListener("click", () => {
  if (phase !== "idle") return;
  phase = "preparing";
  elapsed = 0;
  activeStep = -1;
  launchButton.disabled = true;
  document.querySelector(".intro").inert = true;
  sound.startMission();
  flight.start();
  // Warm up local assets and shaders while the existing launch plays unchanged.
  earth.prepare();
  mars.prepare();
  venus.prepare().then(() => earth.setVenusTravelSurface(venus.surface)).catch(() => {});
  mission.classList.add("is-preparing");
  if (flightStatus) flightStatus.textContent = "NUSANTARA 01 • MESIN BERSIAP";
  previousFrame = performance.now();
  animationFrame = requestAnimationFrame(advancePreparation);
});

function travelToVenus() {
  if (phase !== "earth" || earth.exploring) return;
  phase = "venus-transition";
  if (flightStatus) flightStatus.textContent = "PERJALANAN MENUJU VENUS";
  locationDetail.textContent = "TUJUAN SEBELUMNYA • VENUS";
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
        locationDetail.textContent = "PLANET KE-2 • VENUS";
        announcement.textContent = "Tiba di Venus.";
      }
    });
  });
}

function travelVenusToEarth() {
  if (phase !== "venus" || venus.exploring) return;
  phase = "venus-earth-transition";
  if (flightStatus) flightStatus.textContent = "PERJALANAN MENUJU BUMI";
  locationDetail.textContent = "TUJUAN BERIKUTNYA • BUMI";
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
      locationDetail.textContent = "PLANET ASAL • BUMI";
      announcement.textContent = "Kembali di Bumi.";
    }
  });
}

function travelToMars() {
  if (phase !== "earth") return;
  phase = "mars-transition";
  if (flightStatus) flightStatus.textContent = "PERJALANAN MENUJU PLANET MERAH";
  locationDetail.textContent = "TUJUAN BERIKUTNYA • MARS";
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
      locationDetail.textContent = "PLANET KE-4 • MARS";
      announcement.textContent = "Tiba di Mars.";
    }
  });
}

function travelToEarth() {
  if (phase !== "mars" || mars.exploring) return;
  phase = "earth-transition";
  if (flightStatus) flightStatus.textContent = "PERJALANAN KEMBALI KE BUMI";
  locationDetail.textContent = "TUJUAN SEBELUMNYA • BUMI";
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
      locationDetail.textContent = "PLANET ASAL • BUMI";
      announcement.textContent = "Kembali di Bumi.";
    }
  });
}

function resetMission() {
  cancelAnimationFrame(animationFrame);
  sound.stop(1.1);
  phase = "idle";
  flight.reset();
  earth.stop();
  mars.stop();
  venus.stop();
  preparationProgress.style.transform = "scaleX(0)";
  mission.classList.remove("is-earth", "is-mars", "is-venus", "is-preparing", "is-planet-transitioning");
  locationDetail.textContent = originalLocation;
  preparation.style.opacity = "";
  document.querySelector(".intro").inert = false;
  launchButton.disabled = false;
  if (flightStatus) flightStatus.textContent = "SEMUA BERAWAL DARI RASA INGIN TAHU";
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
  if (document.hidden || reducedMotion.matches) orbits.pauseAnimations();
  else orbits.unpauseAnimations();
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
  if (reducedMotion.matches || document.hidden) orbits.pauseAnimations();
  else orbits.unpauseAnimations();
}
reducedMotion.addEventListener("change", updateOrbitMotion);
updateOrbitMotion();
