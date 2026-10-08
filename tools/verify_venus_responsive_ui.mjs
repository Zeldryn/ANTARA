import fs from 'node:fs';

const css = fs.readFileSync(new URL('../venus-full-exploration.css', import.meta.url), 'utf8');
const js = fs.readFileSync(new URL('../venus-full-exploration.js', import.meta.url), 'utf8');
const scene = fs.readFileSync(new URL('../venus-scene.js', import.meta.url), 'utf8');
const marsScene = fs.readFileSync(new URL('../mars-scene.js', import.meta.url), 'utf8');
const html = fs.readFileSync(new URL('../index.html', import.meta.url), 'utf8');

const checks = [];
const ok = (name, cond) => { checks.push([name, Boolean(cond)]); if (!cond) process.exitCode = 1; };

ok('dvh root clamp', css.includes('height: 100dvh') && css.includes('max-height: 100dvh'));
ok('desktop HUD clamp', /width:\s*clamp\(280px,\s*18vw,\s*330px\)/.test(css));
ok('desktop info clamp', /width:\s*clamp\(340px,\s*24vw,\s*430px\)/.test(css));
ok('compact laptop breakpoint', css.includes('@media (max-width: 1599px), (max-height: 820px)'));
ok('tablet touch breakpoint', css.includes('@media (max-width: 820px), (pointer: coarse) and (max-width: 1100px)'));
ok('short-height breakpoint', css.includes('@media (max-height: 700px) and (min-width: 821px)'));
ok('safe areas', css.includes('env(safe-area-inset-top)') && css.includes('env(safe-area-inset-bottom)'));
ok('mobile 44px targets', /min-height:\s*44px/.test(css));
ok('mobile bottom sheets', css.includes('border-radius: 16px 16px 0 0') && css.includes('max-height: 78dvh'));
ok('desktop hints wrap', css.includes('flex-wrap: wrap') && css.includes('white-space: normal'));
ok('z-index tokens', ['--venus-z-world','--venus-z-hud','--venus-z-panel','--venus-z-modal','--venus-z-transition'].every(k => css.includes(k)));
ok('default objective minimized', /activateRegion\(\)[\s\S]*?this\.collapseObjectives\(\);/.test(js));
ok('viewport-aware exclusivity', js.includes('isResponsiveConstrained()') && js.includes('syncResponsiveUiState()'));
ok('resize resync', /resize\(recalculateDpr = true\) \{\s*this\.syncResponsiveUiState\(\);/.test(js));
ok('compact action labels', html.includes('venus-action-label-compact') && css.includes('.venus-action-label-compact'));
ok('Venus dedicated fullDive', scene.includes('this.fullDiveBlend = 0') && scene.includes('setFullExplorationTransition(blend, location)'));
ok('Mars fullDive retained', marsScene.includes('this.fullDiveBlend = 0') && marsScene.includes('setFullExplorationTransition(blend, location)'));

for (const snippet of [
  'this.distance = Math.max(1.12, arrivalDistance * explorationFramingScale * (1 - dive * 0.76));',
  'const pointerStrength = (1 - this.explorationBlend * 0.55) * (1 - dive);'
]) ok(`Mars/Venus shared transition formula: ${snippet.slice(0,34)}…`, scene.includes(snippet) && marsScene.includes(snippet));

ok('Mars exit altitude parity', js.includes('Math.max(currentAltitude, 52), 1650, token'));
ok('Mars exit duration parity', js.includes('const duration = reduced ? 260 : 3200;'));
ok('live render loop survives exit', /if \(this\.state !== STATES\.EXITING\)[\s\S]*?this\.renderer\.render\(this\.scene, this\.camera\);/.test(js));
ok('fullDive reversed during live surface fade', js.includes('this.venus.setFullExplorationTransition?.(1 - eased, this.region)'));

const targets = [
  [360,800],[375,812],[390,844],[393,873],[412,915],
  [768,1024],[1024,768],[1366,768],[1440,900],[1536,864],[1600,900],[1920,1080],[2560,1440]
];
console.log('Viewport audit targets:', targets.map(v => v.join('x')).join(', '));
for (const [name, pass] of checks) console.log(`${pass ? 'PASS' : 'FAIL'}  ${name}`);
if (process.exitCode) throw new Error('Responsive UI verification failed');
