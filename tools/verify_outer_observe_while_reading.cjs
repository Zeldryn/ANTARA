const fs = require('fs');
const planets = ['jupiter','saturn','uranus','neptune'];
let pass = 0, total = 0;
function check(ok, label){ total++; if(ok) pass++; console.log(`${ok?'PASS':'FAIL'} | ${label}`); }
for (const planet of planets) {
  const js = fs.readFileSync(`${planet}-full-exploration.js`, 'utf8');
  check(js.includes('this.nearbyObservation && this.observationCard.hidden'), `${planet}: E observes even when prompt is visually compact/hidden by reading UI`);
  check(!js.includes('!this.observationPrompt.hidden && this.observationCard.hidden'), `${planet}: E no longer depends on prompt visibility`);
  check(js.includes('reachable && this.observationCard.hidden && !this.actionsOpen'), `${planet}: nearby prompt survives Info/Tujuan panels`);
  check(js.includes('this.observeButton?.addEventListener("click", () => this.observeNearby())'), `${planet}: touch AMATI button wired`);
}
const css = fs.readFileSync('outer-planets-full-actions-parity.css','utf8');
check(css.includes('OBSERVE-WHILE-READING PARITY'), 'shared observe-while-reading CSS present');
check(css.includes('.venus-observation-prompt:not([hidden])'), 'visible nearby prompt override present');
check(css.includes('max-width: min(180px, calc(100vw - 120px))'), 'mobile compact AMATI layout present');
check(css.includes('.is-actions-open\n    .venus-observation-prompt'), 'Menu remains higher-priority than AMATI');
console.log(`\n${pass}/${total} checks passed`);
if (pass !== total) process.exit(1);
