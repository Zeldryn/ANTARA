const fs = require('fs');
const vm = require('vm');
const code = fs.readFileSync('jupiter-full-exploration.js', 'utf8');
const context = {
  window: {},
  document: {},
  navigator: {},
  matchMedia: () => ({ matches:false }),
  innerWidth: 1440,
  innerHeight: 960,
  devicePixelRatio: 1,
  console,
  performance: { now: () => 0 },
  requestAnimationFrame: () => 0,
  cancelAnimationFrame: () => {},
  setTimeout,
  clearTimeout
};
context.window.setTimeout = setTimeout;
context.window.clearTimeout = clearTimeout;
vm.createContext(context);
vm.runInContext(code, context, { filename:'jupiter-full-exploration.js' });
const destinations = context.window.ANTARA_JUPITER_FULL_DESTINATIONS;
if (!Array.isArray(destinations)) throw new Error('Destination export missing');
if (destinations.length !== 5) throw new Error(`Expected 5 atmosphere destinations, got ${destinations.length}`);
const ids = new Set();
let observations = 0;
for (const d of destinations) {
  if (!d.id || ids.has(d.id)) throw new Error(`Duplicate/invalid destination id: ${d.id}`);
  ids.add(d.id);
  if (!Array.isArray(d.observations) || d.observations.length !== 3) throw new Error(`${d.id} must have 3 observations`);
  if (!d.source.startsWith('https://')) throw new Error(`${d.id} source must be HTTPS`);
  if (!d.palette || !d.spawn || !d.wind) throw new Error(`${d.id} missing world configuration`);
  for (const obs of d.observations) {
    observations++;
    if (!obs.id || !obs.source?.startsWith('https://')) throw new Error(`${d.id} observation source/id invalid`);
    if (!Array.isArray(obs.position) || obs.position.length !== 3) throw new Error(`${obs.id} position invalid`);
    if (!Array.isArray(obs.facts) || obs.facts.length < 3) throw new Error(`${obs.id} needs 3+ facts`);
  }
}
const html = fs.readFileSync('index.html', 'utf8');
const requiredIds = [
  'jupiter-full-viewport','jupiter-full-orbit-input','jupiter-quality-panel','jupiter-region-selector',
  'jupiter-full-hud-depth','jupiter-full-hud-speed','jupiter-full-hud-pressure','jupiter-full-hud-region-type',
  'jupiter-objectives-panel','jupiter-observation-prompt','jupiter-observation-card','jupiter-landmark-card',
  'jupiter-full-tutorial','jupiter-boundary-hint','jupiter-full-exit'
];
for (const id of requiredIds) if (!html.includes(`id="${id}"`)) throw new Error(`Missing HTML id ${id}`);
const jsChecks = [
  ['free movement','updateMovement(delta)'],
  ['mouse look','updateLook(delta)'],
  ['pressure model','pressureAt(y)'],
  ['cloud layers','layerAtPressure(pressure)'],
  ['soft boundary','boundaryFactor(position)'],
  ['world disposal','disposeWorld()'],
  ['continuous exit','async exit()'],
  ['mobile controls','data-jupiter-control'],
  ['discovery persistence','DISCOVERY_PREFIX'],
  ['fullscreen','toggleFullscreen()'],
  ['single-click pointer lock','requestPointerLock()'],
  ['pointer-lock mouse movement','document.pointerLockElement !== this.inputLayer'],
  ['pointer-lock cleanup','releasePointerLock()'],
  ['global masthead lifecycle','is-jupiter-full']
];
for (const [label, needle] of jsChecks) if (!code.includes(needle)) throw new Error(`Missing ${label}: ${needle}`);
const venus = fs.readFileSync('venus-full-exploration.js','utf8');
const parity = {
  qualitySelection: code.includes('qualityPanel') && venus.includes('qualityPanel'),
  regionSelection: code.includes('selectorGrid') && venus.includes('selectorGrid'),
  freeMovement: code.includes('updateMovement(delta)') && venus.includes('updateMovement(delta)'),
  lookControl: code.includes('updateLook(delta)') && venus.includes('updateLook(delta)'),
  objectives: code.includes('buildObjectives()') && venus.includes('renderObjectives()'),
  observations: code.includes('observeNearby()') && venus.includes('openObservationCard'),
  infoCard: code.includes('updateRegionUI()') && venus.includes('updateRegionUI()'),
  boundaryGimmick: code.includes('boundaryFactor(position)') && venus.includes('softBoundaryStart'),
  loading: code.includes('loadingSequence') && venus.includes('setLoading'),
  silentRecovery: code.includes('showError(error)') && code.includes('this.forceReset()') && venus.includes('failBackToOrbit()'),
  responsivePanels: code.includes('isMobileUi()') && venus.includes('isMobileUi()'),
  exitTransition: code.includes('async exit()') && venus.includes('exit('),
  desktopPointerLock: code.includes('requestPointerLock()') && venus.includes('requestPointerLock()'),
  globalChromeHidden: code.includes('is-jupiter-full') && venus.includes('is-venus-full')
};
const failed = Object.entries(parity).filter(([,ok]) => !ok);
if (failed.length) throw new Error(`Venus parity checks failed: ${failed.map(([k])=>k).join(', ')}`);
console.log(JSON.stringify({ destinations:destinations.length, observations, parity, pass:true }, null, 2));
