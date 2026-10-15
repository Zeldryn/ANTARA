const fs = require('fs');
const planets = ['earth','mercury','venus','mars','jupiter','saturn','uranus','neptune'];
const html = fs.readFileSync('index.html','utf8');
let failed = 0;
const test=(name,ok)=>{console.log(`${ok?'PASS':'FAIL'}  ${name}`); if(!ok) failed++;};
for (const p of planets) {
  const js = fs.readFileSync(`${p}-full-exploration.js`,'utf8');
  test(`${p}: visible error card removed`, !html.includes(`id="${p}-full-error"`));
  test(`${p}: old visible fallback copy removed`, !new RegExp(`Eksplorasi[^\\n\"]*(?:gagal dimuat|tidak dapat dimuat|Belum Tersedia)`, 'i').test(js));
  test(`${p}: developer diagnostics remain`, /console\.(?:warn|error)\(/.test(js));
  if (p === 'earth') test(`${p}: silent recovery returns to panorama`, /showError\(error\)[\s\S]*?this\.failBack\(\)/.test(js));
  else if (p === 'venus' || p === 'mars') test(`${p}: silent recovery returns to panorama`, /showError\(error\)[\s\S]*?this\.failBackToOrbit\(\)/.test(js));
  else if (p === 'mercury') test(`${p}: silent recovery returns to panorama`, /showError\(message\)[\s\S]*?this\.exit\(true\)/.test(js));
  else test(`${p}: silent recovery returns to panorama`, /showError\(error\)[\s\S]*?this\.forceReset\(\)/.test(js));
}
test('solar observer: visitor failure copy removed', !/SIMULASI GAGAL DIMUAT|Mode observasi Tata Surya gagal dimuat/.test(fs.readFileSync('script.js','utf8')));
test('index: no duplicate IDs', (()=>{const ids=[...html.matchAll(/\bid="([^"]+)"/g)].map(x=>x[1]);return new Set(ids).size===ids.length;})());
console.log(`\n${failed?'FAILED':'ALL PASS'}: ${failed} failed checks.`);
if(failed) process.exit(1);
