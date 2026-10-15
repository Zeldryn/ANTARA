const fs = require('fs');
const assert = (cond, msg) => { if (!cond) throw new Error(msg); console.log('PASS', msg); };
const read = f => fs.readFileSync(f,'utf8');
const refs = [
 ['Matahari','sun-scene.js','https://science.nasa.gov/sun/facts/'],
 ['Merkurius','mercury-scene.js','https://science.nasa.gov/mercury/facts/'],
 ['Venus','venus-scene.js','https://science.nasa.gov/venus/venus-facts/'],
 ['Bumi','earth-scene.js','https://science.nasa.gov/earth/facts/'],
 ['Mars','mars-scene.js','https://science.nasa.gov/mars/facts/'],
 ['Sabuk Asteroid','asteroid-scene.js','https://science.nasa.gov/solar-system/asteroids/facts/'],
 ['Jupiter','jupiter-scene.js','https://science.nasa.gov/jupiter/jupiter-facts/'],
 ['Saturnus','saturn-scene.js','https://science.nasa.gov/saturn/facts/'],
 ['Uranus','uranus-scene.js','https://science.nasa.gov/uranus/facts/'],
 ['Neptunus','neptune-scene.js','https://science.nasa.gov/neptune/neptune-facts/'],
];
for(const [name,file,url] of refs) assert(read(file).includes(url), `${name} canonical NASA reference present`);
const saturn = read('saturn-full-exploration.js') + read('saturn-scene.js');
for(const [name,url] of [
 ['Titan','https://science.nasa.gov/saturn/moons/titan/facts/'],
 ['Enceladus','https://science.nasa.gov/saturn/moons/enceladus/'],
 ['Cassini','https://science.nasa.gov/mission/cassini/about-the-mission/'],
]) assert(saturn.includes(url), `Saturn ${name} stable reference present`);
const uranus = read('uranus-full-exploration.js') + read('uranus-scene.js');
assert(uranus.includes('https://science.nasa.gov/uranus/moons/miranda/'), 'Miranda stable reference present');
const neptune = read('neptune-full-exploration.js') + read('neptune-scene.js');
assert(neptune.includes('https://science.nasa.gov/neptune/moons/triton/'), 'Triton stable reference present');
const files = ['sun-scene.js','mercury-scene.js','mercury-full-exploration.js','venus-scene.js','venus-full-exploration.js','earth-scene.js','earth-full-exploration.js','mars-scene.js','mars-full-exploration.js','asteroid-scene.js','jupiter-scene.js','jupiter-full-exploration.js','saturn-scene.js','saturn-full-exploration.js','uranus-scene.js','uranus-full-exploration.js','neptune-scene.js','neptune-full-exploration.js','exploration-media.js'];
const brittle = /https?:\/\/(?!assets\.science\.nasa\.gov)[^"'\s]*(?:\/photojournal\/|\/resource\/|\/asset\/|jpl\.nasa\.gov\/news\/|press-kits\/)/g;
let bad=[];
for(const f of files){ const m=read(f).match(brittle)||[]; if(m.length) bad.push([f,m]); }
assert(bad.length===0, 'No brittle legacy page URLs remain in audited planet reference files');
const ach=read('achievement-client.js');
assert(ach.includes('const CONTEXT_DISPLAY_MS = 7000;'), 'Live achievement auto-hide is 7 seconds');
assert(ach.includes('delta > 0 || unlockChanged'), 'Progress/unlock can re-show live achievement');
assert(ach.includes('contextAutoHiddenKey'), 'Passive renders do not permanently re-show auto-hidden badge');
assert(ach.includes('scheduleContextAutoHide(key)'), 'Context badge schedules auto-hide');
const css=read('achievement-notify.css');
assert(css.includes('.antara-context-achievement.is-auto-hiding'), 'Auto-hide transition CSS present');
const html=read('index.html');
assert(html.includes('achievement-client.js?v=20261005-linkaudit-livebadge-1'), 'Achievement cache key bumped');
assert(html.includes('saturn-full-exploration.js?v=20261005-linkaudit-livebadge-1'), 'Saturn Full Exploration cache key bumped');
console.log('ALL REFERENCE/LIVE BADGE CHECKS PASSED');
