const fs = require('fs');
const path = require('path');
const root = path.resolve(__dirname, '..');
const js = fs.readFileSync(path.join(root,'achievement-client.js'),'utf8');
const quiz = fs.readFileSync(path.join(root,'permainan.js'),'utf8');
const index = fs.readFileSync(path.join(root,'index.html'),'utf8');
const game = fs.readFileSync(path.join(root,'permainan.html'),'utf8');
const css = fs.readFileSync(path.join(root,'achievement-notify.css'),'utf8');
let total=0, pass=0;
function check(name, ok){ total++; if(ok){pass++; console.log('PASS', name);} else {console.error('FAIL', name);} }
const planets = [
  ['sun','sun-scene','sun-complete',null,'assets/achievements/01-matahari.png'],
  ['mercury','mercury-scene','mercury-complete','mercury-master','assets/achievements/02-merkurius.png'],
  ['venus','venus-scene','venus-complete','venus-master','assets/achievements/03-venus.png'],
  ['earth','earth-scene','earth-complete','earth-master','assets/achievements/04-bumi.png'],
  ['mars','mars-scene','mars-complete','mars-master','assets/achievements/05-mars.png'],
  ['asteroid-belt','asteroid-scene','asteroid-complete',null,'assets/achievements/06-asteroid.png'],
  ['jupiter','jupiter-scene','jupiter-complete','jupiter-master','assets/achievements/07-jupiter.png'],
  ['saturn','saturn-scene','saturn-complete','saturn-master','assets/achievements/08-saturnus.png'],
  ['uranus','uranus-scene','uranus-complete','uranus-master','assets/achievements/09-uranus.png'],
  ['neptune','neptune-scene','neptune-complete','neptune-master','assets/achievements/10-neptunus.png'],
];
for (const [planet,scene,complete,master,icon] of planets) {
  check(`${planet}: scene context mapped`, js.includes(`planet:"${planet}"`) && js.includes(`scene:"${scene}"`));
  check(`${planet}: complete badge mapped`, js.includes(`complete:"${complete}"`));
  check(`${planet}: complete icon exists`, fs.existsSync(path.join(root,icon)));
  if (master) {
    check(`${planet}: full master mapped`, js.includes(`master:"${master}"`));
    check(`${planet}: full DOM exists`, index.includes(`id="${planet}-full-exploration"`) || (planet==='earth' && index.includes('id="earth-full-exploration"')));
  }
}
const quizCodes=['quiz-first','quiz-streak-5','quiz-speedster','quiz-perfect','quiz-master'];
for(const code of quizCodes) check(`quiz mapping ${code}`, js.includes(`"${code}"`));
check('planet progress event ingested live', js.includes('ingestPlanetProgress(event)'));
check('context refetch after planet progress', js.includes('scheduleContextDataRefresh(180)'));
check('full exploration context detection', js.includes('full.classList.contains("is-active")'));
check('context hidden during entry/loading lifecycle', js.includes('return { kind:"suspended" }'));
check('fullscreen context reparenting', js.includes('contextHost();') && js.includes('fullscreenchange'));
check('quiz live API exported', js.includes('updateQuizProgress') && js.includes('resetQuizProgress'));
check('quiz score pushed live', quiz.includes('scoreTotal') && quiz.includes('syncAchievementBadge'));
check('quiz streak tracked live', quiz.includes('liveBestStreak'));
check('quiz fast answer tracked live', quiz.includes('liveFastCorrect'));
check('quiz first try tracked live', quiz.includes('liveFirstTryByLevel'));
check('quiz result refreshes server achievement state', quiz.includes('refreshContext?.()'));
check('context badge CSS exists', css.includes('.antara-context-achievement-wrap') && css.includes('--badge-progress'));
check('mobile contextual badge CSS exists', css.includes('(pointer:coarse)') && css.includes('bottom:max(118px'));
check('progress +delta animation exists', css.includes('antara-context-delta') && js.includes('is-progressing'));
check('index cache key updated', index.includes('achievement-client.js?v=20261005-context-badge-1') && index.includes('achievement-notify.css?v=20261005-context-badge-1'));
check('quiz cache key updated', game.includes('achievement-client.js?v=20261005-context-badge-1') && game.includes('permainan.js?v=20261005-context-badge-1'));
console.log(`\n${pass}/${total} PASS`);
process.exit(pass===total?0:1);
