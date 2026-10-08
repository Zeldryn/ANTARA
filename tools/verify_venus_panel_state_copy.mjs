import fs from 'node:fs';
import path from 'node:path';
const root=path.resolve(path.dirname(new URL(import.meta.url).pathname),'..');
const read=f=>fs.readFileSync(path.join(root,f),'utf8');
const js=read('venus-full-exploration.js');
const css=read('venus-full-exploration.css');
const html=read('index.html');
let failed=0;
const test=(n,c)=>{console.log(`${c?'PASS':'FAIL'}  ${n}`);if(!c)failed++;};
const between=(a,b)=>{const i=js.indexOf(a);const j=js.indexOf(b,i+1);return i>=0&&j>i?js.slice(i,j):''};

const showInfo=between('showRegionInfo(focus = false) {','hideRegionInfo(focusToggle = true) {');
const expandObj=between('expandObjectives(focus = false) {','updateEducation(delta = 0) {');
const syncPanels=between('syncSecondaryPanels() {','setActionsMenu(open, focus = false) {');
const inputEsc=between('onKeyDown(event) {','onKeyUp(event) {');

test('independent objectiveOpen state exists', js.includes('this.objectiveOpen = false'));
test('independent infoOpen state exists', js.includes('this.infoOpen = false'));
test('panel interaction order exists', js.includes('this.secondaryPanelOrder = []'));
test('opening info does not collapse objectives', !showInfo.includes('collapseObjectives(') && !showInfo.includes('objectiveOpen = false'));
test('opening objectives does not close info', !expandObj.includes('hideRegionInfo(') && !expandObj.includes('infoOpen = false'));
test('desktop sync can show info and objectives together', syncPanels.includes('showInfo = exploring && this.infoOpen') && syncPanels.includes('showObjectives = exploring && this.objectiveOpen'));
test('mobile presentation chooses most recent panel without resetting state', syncPanels.includes('const top = mobile ? this.getTopSecondaryPanel() : null') && !syncPanels.includes('this.objectiveOpen = false') && !syncPanels.includes('this.infoOpen = false'));
test('ESC closes most recently interacted secondary panel', inputEsc.includes('getTopSecondaryPanel') && inputEsc.indexOf('topPanel === "info"') < inputEsc.indexOf('this.controller.exit()') && inputEsc.indexOf('topPanel === "objectives"') < inputEsc.indexOf('this.controller.exit()'));
test('desktop/laptop both-open responsive CSS exists', css.includes('.venus-full-exploration.is-info-open.is-objectives-open .venus-objectives-panel') && css.includes('.venus-full-exploration.is-info-open.is-objectives-open .venus-location-card'));
test('discovery reason label is friendly', html.includes('KENAPA INI MENARIK?'));
test('discovery status is friendlier', js.includes('BARU KAMU LIHAT') && js.includes('SUDAH PERNAH KAMU LIHAT'));
test('discovery announcement is not robotic', js.includes('Ada hal menarik di dekatmu') && js.includes('Coba amati!'));

const friendlyTypes=['TAHUKAH KAMU?','COBA PERHATIKAN!','COBA LIHAT SEKITAR!','LIHAT DEH!','TERNYATA...','UNIKNYA...','KENAPA BISA BEGINI?'];
const typeMatches=[...js.matchAll(/id:\s*"(?:maat|maxwell|aphrodite|ishtar|alpha)-[^"]+"[\s\S]{0,180}?type:\s*"([^"]+)"/g)].map(m=>m[1]);
test('all 25 observation cards found', typeMatches.length===25);
test('all observation card eyebrows use friendly discovery language', typeMatches.every(t=>friendlyTypes.includes(t)));
const friendlyLeadSignals=['dari dekat','Coba','coba','di depanmu','Di depanmu','Tahukah','bisa','lihat','permukaan','punggungan','awan','radar'];
const leads=[...js.matchAll(/id:\s*"(?:maat|maxwell|aphrodite|ishtar|alpha)-[^"]+"[\s\S]{0,320}?lead:\s*"([^"]+)"/g)].map(m=>m[1]);
test('all 25 observation leads found', leads.length===25);
test('observation leads stay concise', leads.every(x=>x.length<=250));

test('professional main UI labels remain unchanged', ['Kualitas Grafis','Wilayah','Ketinggian','Keluar dari Eksplorasi'].every(x=>html.includes(x)));

console.log(`\n${failed?'FAILED':'ALL PASS'}: ${failed} failed checks.`);
if(failed)process.exit(1);
