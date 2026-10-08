const {chromium}=require('playwright');
const assert=require('assert');
const path=require('path'), fs=require('fs');
const root=path.resolve(__dirname,'..');
const output=path.join(root,'.tmp');fs.mkdirSync(output,{recursive:true});
const server=require('child_process').spawn(process.env.PYTHON || 'python',['-m','http.server','8765','--directory',root]);
process.on('exit',()=>server.kill());
(async()=>{
const browser=await chromium.launch({executablePath:process.env.BROWSER_EXECUTABLE || undefined,headless:true,args:['--no-sandbox','--enable-unsafe-swiftshader']});
await new Promise(r=>setTimeout(r,500));
const page=await browser.newPage({viewport:{width:1440,height:900}});const errors=[];page.on('pageerror',e=>errors.push(e.message));
await page.goto('http://127.0.0.1:8765');
await page.evaluate(async()=>{await earth.prepare();mission.classList.add('is-earth');phase='earth';document.querySelector('.intro').inert=true;earth.start({settled:true})});
await page.waitForTimeout(1100);
console.log('renderer',await page.evaluate(()=>earth.mode));
await page.screenshot({path:output+'/earth-intro.png'});
assert(await page.locator('#earth-explore-button').isVisible());
assert.equal(await page.locator('#earth-exploration').evaluate(e=>getComputedStyle(e).visibility),'hidden');
await page.click('#earth-explore-button');await page.waitForTimeout(1000);
assert(await page.evaluate(()=>earth.exploring));
await page.screenshot({path:output+'/earth-overview.png'});
for(let i=1;i<7;i++){
 await page.locator('#earth-topic-progress button').nth(i).click();await page.waitForTimeout(1800);
 const v=await page.evaluate(()=>{const l=EARTH_EXPLORATION_STOPS[earth.topicIndex].location;const lat=l.latitude*Math.PI/180,lon=l.longitude*Math.PI/180;const n=new earth.THREE.Vector3(Math.cos(lat)*Math.cos(lon),Math.sin(lat),-Math.cos(lat)*Math.sin(lon)).applyQuaternion(earth.planet.quaternion);return {title:document.getElementById('earth-topic-title').textContent,z:n.z,marker:earth.marker.style.opacity}});
 assert(v.z>.999,JSON.stringify(v));console.log(v);
}
await page.screenshot({path:output+'/earth-baikal.png'});
// Interrupted rotation settles at the latest target.
await page.evaluate(()=>{earth.setExplorationStop(1);earth.setExplorationStop(3);earth.setExplorationStop(5)});await page.waitForTimeout(1800);
assert.equal(await page.evaluate(()=>earth.topicIndex),5);
await page.keyboard.press('ArrowLeft');assert.equal(await page.evaluate(()=>earth.topicIndex),4);assert.equal(await page.evaluate(()=>phase),'earth');
for(const viewport of [{width:1366,height:600},{width:390,height:844},{width:375,height:667}]){
 await page.setViewportSize(viewport);await page.waitForTimeout(400);
 await page.evaluate(()=>earth.setExplorationStop(1));
 const bounds=await page.locator('#earth-exploration').evaluate(e=>{const r=e.getBoundingClientRect();const s=document.getElementById('earth-topic-scroll');return {top:r.top,bottom:r.bottom,h:innerHeight,scroll:s.clientHeight,overflow:getComputedStyle(s).overflowY}});
 assert(bounds.top>=0&&bounds.bottom<=bounds.h&&bounds.scroll>20,JSON.stringify(bounds));console.log('bounds',viewport,bounds);
 await page.screenshot({path:`${output}/earth-${viewport.width}.png`});
}
await page.setViewportSize({width:1440,height:900});await page.keyboard.press('Escape');assert(!await page.evaluate(()=>earth.exploring));
await page.click('#earth-next');await page.waitForFunction(()=>phase==='mars',{},{timeout:20000});await page.waitForTimeout(1500);
await page.click('#mars-explore-button');await page.waitForTimeout(1200);assert(await page.evaluate(()=>mars.exploring));
await page.click('#mars-topic-next');assert.equal(await page.evaluate(()=>mars.topicIndex),1);
await page.screenshot({path:output+'/mars-regression.png'});
await page.click('#mars-exploration-close');await page.waitForTimeout(1000);await page.click('#mars-prev-planet');await page.waitForFunction(()=>phase==='earth',{},{timeout:20000});await page.waitForTimeout(1000);assert(!await page.evaluate(()=>earth.exploring));
// Reduced motion still updates a stopped animation loop.
await page.emulateMedia({reducedMotion:'reduce'});await page.waitForTimeout(2200);await page.click('#earth-explore-button');await page.locator('#earth-topic-progress button').nth(6).click();assert.equal(await page.evaluate(()=>earth.pose.pitch),53.5*Math.PI/180);
// Existing Canvas fallback renders real latitude/longitude, including file:// use.
await page.evaluate(()=>{earth.createCanvasFallback();earth.resize();earth.render()});await page.screenshot({path:output+'/earth-fallback.png'});
assert.equal(await page.evaluate(()=>earth.mode),'canvas');
console.log('errors',errors);assert.deepEqual(errors,[]);
await browser.close();server.kill();
})().catch(e=>{console.error(e);process.exit(1)});
