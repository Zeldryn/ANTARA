const fs = require('fs');
const cp = require('child_process');
const planets = ['jupiter','saturn','uranus','neptune'];
let checks = 0, failures = 0;
function ok(cond,msg){ checks++; if(cond) console.log('PASS',msg); else { failures++; console.error('FAIL',msg); } }
const progress = fs.readFileSync('api/progress/_progress.php','utf8');
const ach = fs.readFileSync('api/achievements/_achievements.php','utf8');
for (const planet of planets) {
  const js = fs.readFileSync(`${planet}-full-exploration.js`,'utf8');
  const ids = [...js.matchAll(/^\s{6}id: "([^"]+)",/gm)].slice(0,5).map(m=>m[1]);
  ok(ids.length===5, `${planet}: 5 current regions found`);
  for (const id of ids) ok(progress.includes(`'${id}' =>`), `${planet}: backend catalog contains ${id}`);
  ok(js.includes(`trackFull?.("${planet}", this.current.id, this.current.name)`), `${planet}: observation records region milestone`);
  ok(!js.includes('${this.current.id}:${observation.id}'), `${planet}: no composite observation milestone`);
  ok(js.includes('syncLocalDiscoveryProgress()'), `${planet}: local observation recovery exists`);
  ok(js.includes('this.syncLocalDiscoveryProgress();'), `${planet}: local recovery runs on Full Exploration entry`);
}
ok(progress.includes("explode(':', $key, 2)[0]"), 'backend normalizes stale region:observation keys');
ok(progress.includes('antara_progress_normalize_full_key($planet, $key)'), 'backend validates normalized Full Exploration keys');
ok(ach.includes('$visited[$canonical] = true;'), 'achievement count deduplicates canonical region keys');
ok(!ach.includes("SELECT COUNT(*) AS total"), 'achievement master count no longer trusts raw row count');
const php = cp.execFileSync('php',['-r', `require 'api/progress/_progress.php'; foreach(['jupiter','saturn','uranus','neptune'] as $p){echo $p.':'.count(antara_progress_catalog()[$p]['full'])."\\n";}`], {encoding:'utf8'});
for (const planet of planets) ok(php.includes(`${planet}:5`), `${planet}: server goal remains exactly 5`);
console.log(`RESULT ${checks-failures}/${checks} passed`);
process.exitCode = failures ? 1 : 0;
