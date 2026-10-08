import fs from 'node:fs';
import path from 'node:path';

const root = path.resolve(path.dirname(new URL(import.meta.url).pathname), '..');
const read = f => fs.readFileSync(path.join(root, f), 'utf8');
const venus = read('venus-full-exploration.js');
const mars = read('mars-full-exploration.js');
const venusScene = read('venus-scene.js');
const marsScene = read('mars-scene.js');
const css = read('venus-full-exploration.css');
const html = read('index.html');

let failed = 0;
const test = (name, ok) => { console.log(`${ok ? 'PASS' : 'FAIL'}  ${name}`); if (!ok) failed++; };
const has = (s, x) => s.includes(x);
const between = (s, a, b) => { const i=s.indexOf(a); const j=s.indexOf(b,i+1); return i>=0 && j>i ? s.slice(i,j) : ''; };

const marsExit = between(mars, 'async exit() {', 'finishExit() {');
const venusExit = between(venus, 'async exit() {', 'finishExit() {');
const venusFinish = between(venus, 'finishExit() {', 'showError(error) {');

for (const sig of [
  'this.state = STATES.EXITING',
  'this.input.clear()',
  'animateCameraAltitude(Math.max(this.cameraAltitude, 52), 1650, token)',
  'const duration = reduced ? 260 : 3200',
  '1 - smoothstep(raw / 0.62)',
  'setFullExplorationTransition?.(1 - eased'
]) {
  test(`Mars reference contains ${sig}`, has(marsExit, sig));
  test(`Venus port contains ${sig}`, has(venusExit, sig));
}

test('Venus does not unbind input before visual handoff completes', !has(venusExit, 'input.unbind'));
test('Venus does not stop RAF before visual handoff completes', !has(venusExit, 'stopLoop'));
test('Venus does not dispose terrain before visual handoff completes', !has(venusExit, 'disposeRegion') && !has(venusExit, 'disposeRenderer'));
test('Venus exit has no timer-chain handoff', !has(venusExit, 'setTimeout'));
test('Only one normal Venus exit cleanup method remains', !has(venus, 'finishExitToOrbit') && (venus.match(/\n\s*finishExit\(\) \{/g)||[]).length === 1);
test('Cleanup stops renderer only after finishExit begins', has(venusFinish, 'this.stopLoop()'));
test('Root is hidden before region disposal', venusFinish.indexOf('this.root.hidden = true') >= 0 && venusFinish.indexOf('this.root.hidden = true') < venusFinish.indexOf('this.disposeRegion()'));
test('Renderer disposal occurs after panorama handoff method', has(venusFinish, 'this.disposeRenderer()'));

for (const sig of ['fullDiveBlend','fullDiveYawTarget','fullDivePitchTarget','fullDiveRollTarget','fullDiveLocationKey','fullDiveQuaternion']) {
  test(`Venus scene owns ${sig}`, has(venusScene, sig));
  test(`Mars scene reference owns ${sig}`, has(marsScene, sig));
}
test('Venus render uses dedicated fullDiveBlend', has(venusScene, 'const dive = smooth(this.fullDiveBlend)'));
test('Venus dive changes apparent planet distance', /distance\s*=\s*Math\.max\(1\.12,[\s\S]{0,220}\(1 - dive \* 0\.76\)\)/.test(venusScene));
test('Venus dive suppresses pointer/parallax influence', /pointerStrength[\s\S]{0,180}\(1 - dive\)/.test(venusScene));
test('Venus dive suppresses caption', has(venusScene, 'caption * (1 - dive)'));
test('Venus dive uses geographic orientation', has(venusScene, 'venusLocationOrientation(location)'));

test('Full Exploration root is transparent', /\.venus-full-exploration\s*\{[\s\S]*?background:\s*transparent;/.test(css));
test('Opaque Venus fallback belongs to fading viewport', /\.venus-full-exploration \.mars-full-viewport\s*\{[\s\S]*?background:/.test(css));
test('Venus canvas no longer double-fades', /\.venus-full-exploration \.venus-full-canvas\s*\{[\s\S]*?opacity:\s*1;/.test(css));
test('Atmospheric overlay clears during exit', /is-exiting \.venus-haze-vignette[\s\S]*?opacity:\s*0;/.test(css));

test('Safe-area insets are used', ['safe-area-inset-top','safe-area-inset-right','safe-area-inset-bottom','safe-area-inset-left'].every(x=>has(css,x)));
test('Dynamic viewport height is used', has(css,'dvh'));
test('Compact UI behavior matches compact CSS range', has(venus, '(max-width: 1599px), (max-height: 860px), (pointer: coarse)'));
test('Short-height desktop observation card avoids toolbar', has(css, '@media (min-width: 821px) and (max-height: 720px)'));
test('Mobile HUD uses border-box sizing', /\.venus-full-exploration \.mars-full-hud\s*\{[\s\S]*?box-sizing:\s*border-box;/.test(css));
test('Info card scrolls internally', /\.venus-location-card[\s\S]*?overflow-y:\s*auto/.test(css) || has(css,'overflow-y: auto'));
test('Mobile bottom sheets remain present', /border-radius:\s*14px 14px 0 0/.test(css));
test('Cache busting points to rebuilt assets', has(html,'20260930-venus-panel-copy-3'));

console.log(`\n${failed ? 'FAILED' : 'ALL PASS'}: ${failed} failed checks.`);
if (failed) process.exit(1);
