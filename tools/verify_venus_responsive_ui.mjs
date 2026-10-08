import fs from 'node:fs';
import path from 'node:path';

const root = path.resolve(path.dirname(new URL(import.meta.url).pathname), '..');
const read = file => fs.readFileSync(path.join(root, file), 'utf8');
const html = read('index.html');
const css = read('venus-full-exploration.css');
const venus = read('venus-full-exploration.js');
const venusScene = read('venus-scene.js');
const mars = read('mars-full-exploration.js');
const marsScene = read('mars-scene.js');

const checks = [];
function check(name, condition, detail='') {
  checks.push({ name, ok: Boolean(condition), detail });
  if (!condition) process.exitCode = 1;
}
function has(source, fragment) { return source.includes(fragment); }

check('cache busting updated', has(html, '20260930-venus-exit-ui-rebuild-2'));
check('mobile action menu exists', has(html, 'venus-actions-menu-toggle') && has(html, 'venus-actions-menu'));
check('HUD metrics have responsive hooks', ['venus-hud-metric-altitude','venus-hud-metric-speed','venus-hud-metric-distance','venus-hud-metric-region','venus-hud-metric-quality'].every(x=>has(html,x)));
check('safe-area variables present', ['safe-area-inset-top','safe-area-inset-right','safe-area-inset-bottom','safe-area-inset-left'].every(x=>has(css,x)));
check('viewport height uses dvh', /dvh/.test(css));
check('responsive sizing uses clamp', /clamp\(/.test(css));
check('panel internal scrolling enabled', has(css, 'overflow-y: auto') && has(css, 'overscroll-behavior: contain'));
check('clear z-index architecture', ['--venus-z-world','--venus-z-marker','--venus-z-hud','--venus-z-panel','--venus-z-modal','--venus-z-transition'].every(x=>has(css,x)));
check('no extreme numeric z-index', !/z-index\s*:\s*(?:999|9999|99999)\b/.test(css));
check('mobile bottom-sheet composition exists', has(css, 'bottom: 0;') && has(css, 'border-radius: 14px 14px 0 0'));
check('touch tablet composition exists', has(css, '(pointer: coarse) and (max-width: 1100px)'));
check('mobile touch targets are 44px+', /min-height:\s*44px/.test(css) && /width:\s*48px;\s*height:\s*48px/.test(css));
check('desktop hints wrap', has(css, 'flex-wrap: wrap') && has(css, 'white-space: normal'));
check('short-screen breakpoint exists', has(css, '@media (max-height: 720px)'));
check('reduced motion respected', has(css, '@media (prefers-reduced-motion: reduce)'));
check('panel exclusivity behavior exists', has(venus, 'isConstrainedUi()') && has(venus, 'collapseObjectives()') && has(venus, 'is-info-open') && has(venus, 'is-objectives-open'));
check('normal responsive layout handled mostly in CSS', !/getBoundingClientRect\(\).*style\.(?:left|right|top|bottom|width|height)/s.test(venus));
check('fullscreen resize hook present', has(venus, 'fullscreenchange') && has(venus, 'updateFullscreenLabel()') && has(venus, 'this.resize()'));
check('orientation resize hook present', has(venus, 'orientationchange'));

// Mars exit architecture reference.
const marsExitSignals = [
  'animateCameraAltitude(Math.max(this.cameraAltitude, 52), 1650, token)',
  'const duration = reduced ? 260 : 3200',
  '1 - smoothstep(raw / 0.62)',
  'setFullExplorationTransition?.(1 - eased'
];
check('actual Mars exit contains expected live-handoff sequence', marsExitSignals.every(x=>has(mars,x)));
check('Venus uses same ascent timing', has(venus, 'animateCameraAltitude(Math.max(this.cameraAltitude, 52), 1650, token)'));
check('Venus uses same handoff duration', has(venus, 'const duration = reduced ? 260 : 3200'));
check('Venus uses same surface fade curve', has(venus, '1 - smoothstep(raw / 0.62)'));
check('Venus drives dedicated planet dive during exit', has(venus, 'this.venus.setFullExplorationTransition?.(1 - eased, this.region)'));
check('Venus keeps render loop alive before handoff', /this\.root\.classList\.add\("is-exiting"\)[\s\S]{0,900}this\.startLoop\(\)/.test(venus));
const exitIndex = venus.indexOf('async exit()');
const finishIndex = venus.indexOf('this.finishExit();', exitIndex);
const finishMethodIndex = venus.indexOf('finishExit() {', exitIndex);
const disposeIndex = venus.indexOf('this.disposeRegion()', finishMethodIndex);
check('terrain disposal is after visual exit sequence', exitIndex >= 0 && finishIndex > exitIndex && finishMethodIndex > finishIndex && disposeIndex > finishMethodIndex);
check('obsolete Venus exit helper removed', !has(venus, 'finishExitToOrbit'));
check('Venus exploration root is transparent during planet handoff', /\.venus-full-exploration\s*\{[\s\S]*?background:\s*transparent;/.test(css));
check('surface fallback color is owned by fading viewport', /\.venus-full-exploration \.mars-full-viewport\s*\{[\s\S]*?background:/.test(css));

// Dedicated Full Dive state should exist independently from Info Mode explorationBlend.
const diveVars = ['fullDiveBlend','fullDiveYawTarget','fullDivePitchTarget','fullDiveRollTarget','fullDiveLocationKey','fullDiveQuaternion'];
check('Venus scene has dedicated full-dive state', diveVars.every(x=>has(venusScene,x)));
check('Mars scene has dedicated full-dive state', diveVars.every(x=>has(marsScene,x)));
check('Venus scene uses fullDiveBlend in render', has(venusScene, 'const dive = smooth(this.fullDiveBlend)'));
check('Venus planet distance changes with dive', /this\.distance\s*=\s*Math\.max\(1\.12,[\s\S]{0,180}\(1 - dive \* 0\.76\)\)/.test(venusScene));
check('Venus dive suppresses panorama caption', has(venusScene, 'const captionVisibility = caption * (1 - dive)'));
check('Venus dive targets geographic orientation', has(venusScene, 'venusLocationOrientation(location)'));

for (const c of checks) console.log(`${c.ok ? 'PASS' : 'FAIL'}  ${c.name}${c.detail ? ` - ${c.detail}` : ''}`);
const failed = checks.filter(c=>!c.ok);
console.log(`\n${checks.length - failed.length}/${checks.length} checks passed.`);
if (failed.length) process.exit(1);
