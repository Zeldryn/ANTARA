const fs = require('fs');
const path = require('path');
const root = path.resolve(__dirname, '..');
const read = f => fs.readFileSync(path.join(root, f), 'utf8');
const html = read('index.html');
const css = read('inner-planets-mobile-ui-audit.css');
const planets = ['mercury','venus','earth','mars','jupiter'];
let failed = 0;
const test = (name, ok) => { console.log(`${ok ? 'PASS' : 'FAIL'}  ${name}`); if (!ok) failed++; };

test('final mobile audit stylesheet is loaded', html.includes('inner-planets-mobile-ui-audit.css?v=20261005-mobile-panel-audit-1'));
for (const planet of planets) {
  const js = read(`${planet}-full-exploration.js`);
  test(`${planet}: cache key updated`, new RegExp(`${planet}-full-exploration\\.js\\?v=20261005-[^"\\s<]+`).test(html));
  test(`${planet}: mobile viewport predicate exists`, js.includes('max-width: 820px') || js.includes('max-width:820px'));
  test(`${planet}: objective toggle exists`, html.includes(`id="${planet}-objectives-toggle"`));
  test(`${planet}: info toggle exists`, html.includes(`id="${planet}-info-toggle"`));
  test(`${planet}: mobile audit CSS scopes root`, css.includes(`#${planet}-full-exploration`));
}

test('CSS forces horizontal compact switches', css.includes('writing-mode:horizontal-tb !important') && css.includes('height:38px !important'));
test('CSS uses one bottom sheet geometry', css.includes('--antara-mobile-panel-bottom') && css.includes('max-height:min(44dvh, calc(100dvh - 296px))'));
test('CSS parks flight controls behind overlays', css.includes('pointer-events:none !important') && css.includes('.is-objectives-open'));
test('CSS hides switches while a large overlay is open', css.includes(':is(.is-info-open,.is-objectives-open,.is-actions-open)'));
test('mobile Menu is 44px', css.includes('width:44px !important') && css.includes('height:44px !important'));
test('Menu dropdown is moved below HUD zone', css.includes('top:126px !important'));

const mercury = read('mercury-full-exploration.js');
test('mercury: opening goals closes info', mercury.includes('if (!collapsed && mobile)') && mercury.includes('this.infoMinimized = true'));
test('mercury: opening info closes goals', mercury.includes('if (!minimized && mobile)') && mercury.includes('this.objectivesCollapsed = true'));

const venus = read('venus-full-exploration.js');
test('venus: mobile mutual exclusion', venus.includes('if (mobile && this.infoOpen && this.objectiveOpen)'));
test('venus: menu owns root state', venus.includes('this.root?.classList.toggle("is-actions-open", next)'));

const earth = read('earth-full-exploration.js');
test('earth: menu closes secondary panels', earth.includes('this.actionsMenuOpen && this.isMobileUi()') && earth.includes('this.objectivesOpen = false'));
test('earth: opening goals closes info', earth.includes('this.infoOpen = false') && earth.includes('expandObjectives(focus = false)'));

const mars = read('mars-full-exploration.js');
test('mars: menu closes secondary panels', mars.includes('if (next) {\n        this.infoOpen = false;\n        this.objectiveOpen = false;'));
test('mars: landmark info closes goals on mobile', mars.includes('showLandmarkInfo(landmark') && mars.includes('this.objectiveOpen = false'));

const jupiter = read('jupiter-full-exploration.js');
test('jupiter: stale dual state is normalized', jupiter.includes('this.objectiveOpen = false;\n        showObjectives = false;'));
test('jupiter: sibling compact toggles hide while panel open', jupiter.includes('mobileSecondaryOpen'));

const ids = [...html.matchAll(/\bid="([^"]+)"/g)].map(m => m[1]);
const dupes = [...new Set(ids.filter((id, i) => ids.indexOf(id) !== i))];
test('index has no duplicate IDs', dupes.length === 0);

console.log(`\n${failed ? 'FAILED' : 'ALL PASS'}: ${failed} failed checks.`);
if (failed) process.exit(1);
