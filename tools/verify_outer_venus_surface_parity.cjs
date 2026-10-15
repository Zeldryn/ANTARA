const fs = require('fs');
const html = fs.readFileSync('index.html','utf8');
const shared = fs.readFileSync('outer-planets-full-actions-parity.css','utf8');
const planets = ['jupiter','saturn','uranus','neptune'];
let pass=0, fail=0;
function check(ok,label){ if(ok){console.log('PASS',label);pass++;}else{console.error('FAIL',label);fail++;} }
for(const p of planets){
  const js=fs.readFileSync(`${p}-full-exploration.js`,'utf8');
  const css=fs.readFileSync(`${p}-full-exploration.css`,'utf8');
  const section = html.match(new RegExp(`<section class="[^"]*${p}-full-exploration[\\s\\S]*?</section>\\s*<a class="${p}-credit"`))?.[0] || '';
  check(section.includes(`id="${p}-full-hud-location"`), `${p}: HUD/info eksplorasi exists`);
  check(section.includes(`id="${p}-location-toggle"`) && section.includes('Pindah Wilayah'), `${p}: Pindah Wilayah exists`);
  check(section.includes(`id="${p}-fullscreen-toggle"`), `${p}: fullscreen exists`);
  check(section.includes(`id="${p}-full-exit"`), `${p}: exit exists`);
  check(section.includes('mars-control-hints') && section.includes('<b>WASD</b>'), `${p}: desktop bottom help exists`);
  check(section.includes('mars-mobile-controls') && section.includes(`data-${p}-control="forward"`) && section.includes(`data-${p}-control="left"`) && section.includes(`data-${p}-control="right"`) && section.includes(`data-${p}-control="backward"`) && section.includes(`data-${p}-control="up"`) && section.includes(`data-${p}-control="down"`), `${p}: mobile arrows + altitude controls exist`);
  check(js.includes('this.root.style.setProperty("--surface-opacity", "1")'), `${p}: controller reveals inherited Mars surfaces`);
  check(js.includes('this.root.style.removeProperty("--surface-opacity")'), `${p}: controller resets surface opacity`);
  check(css.includes(`data-${p}-control="forward"`) && css.includes(`data-${p}-control="backward"`), `${p}: mobile D-pad positions mapped`);
}
check(shared.includes('.is-active {\n  --surface-opacity: 1;'), 'shared defensive active opacity guard');
check(shared.includes('.is-active .mars-mobile-controls'), 'shared mobile controls active guard');
check(shared.includes('.is-active .mars-control-hints'), 'shared desktop help active guard');
console.log(`\nRESULT ${pass}/${pass+fail}`);
process.exitCode = fail ? 1 : 0;
