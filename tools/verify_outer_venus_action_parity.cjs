const fs = require('fs');
const path = require('path');
const ROOT = path.resolve(__dirname, '..');
const html = fs.readFileSync(path.join(ROOT,'index.html'),'utf8');
const css = fs.readFileSync(path.join(ROOT,'outer-planets-full-actions-parity.css'),'utf8');
const planets = ['jupiter','saturn','uranus','neptune'];
const checks = [];
function check(name, ok, detail='') { checks.push({name,ok,detail}); }
for (const p of planets) {
  const js = fs.readFileSync(path.join(ROOT,`${p}-full-exploration.js`),'utf8');
  const rootRe = new RegExp(`<div class="mars-full-actions venus-full-actions" data-${p}-ui(?![^>]*\\shidden)[^>]*>`);
  check(`${p}: action root persistent markup`, rootRe.test(html));
  check(`${p}: Pindah Wilayah button`, html.includes(`id="${p}-location-toggle"`) && html.includes('Pindah Wilayah'));
  check(`${p}: fullscreen button`, html.includes(`id="${p}-fullscreen-toggle"`));
  check(`${p}: exit button`, html.includes(`id="${p}-full-exit"`));
  check(`${p}: location handler`, js.includes('this.locationButton?.addEventListener("click"') && js.includes('this.openSelectorFromWorld()'));
  check(`${p}: exit handler`, js.includes('this.exitButton?.addEventListener("click"') && js.includes('void this.exit()'));
  check(`${p}: fullscreen handler`, js.includes('this.fullscreenButton?.addEventListener("click"') && js.includes('void this.toggleFullscreen()'));
  check(`${p}: selector hides actions`, js.includes('this.root.classList.add("is-selecting")') && js.includes('this.actionsRoot.hidden = true'));
  check(`${p}: selector restores world`, js.includes('this.root.classList.remove("is-selecting")') && js.includes('this.syncPanels()'));
  check(`${p}: mobile menu focus`, js.includes('setActionsMenu(open, focus = false)') && js.includes('querySelector(".venus-actions-menu button")?.focus'));
  check(`${p}: visibility pause`, js.includes('visibilitychange') && js.includes('document.hidden') && js.includes('this.stopLoop()'));
  check(`${p}: orientation resize`, js.includes('orientationchange') && js.includes('this.resize()'));
  check(`${p}: ESC stack + exit`, js.includes('event.key === "Escape"') && js.includes('this.state === "selecting-world"') && js.includes('this.state === "exploring") void this.exit()'));
  check(`${p}: one-click pointer lock`, js.includes('requestPointerLock') && js.includes('event.pointerType === "mouse"'));
  check(`${p}: objective panel`, html.includes(`id="${p}-objectives-panel"`) && html.includes(`id="${p}-objectives-toggle"`));
  check(`${p}: info panel`, html.includes(`id="${p}-landmark-card"`) && html.includes(`id="${p}-info-toggle"`));
  check(`${p}: observation`, html.includes(`id="${p}-observation-card"`) && html.includes(`id="${p}-observe-button"`));
  check(`${p}: discovery persistence`, js.includes('discoveryStorageKey()') && js.includes('loadDiscoveryState()') && js.includes('saveDiscoveryState()'));
  check(`${p}: quality + region selector`, html.includes(`id="${p}-quality-panel"`) && html.includes(`id="${p}-region-selector"`));
  check(`${p}: error + loading`, html.includes(`id="${p}-full-error"`) && html.includes(`id="${p}-full-loading"`));
  check(`${p}: tutorial`, html.includes(`id="${p}-full-tutorial"`));
  check(`${p}: mobile controls`, html.includes(`data-${p}-control="forward"`) && html.includes(`data-${p}-control="up"`));
}
check('shared CSS loaded after inner mobile audit', html.indexOf('outer-planets-full-actions-parity.css') > html.indexOf('inner-planets-mobile-ui-audit.css'));
check('shared CSS respects hidden state', css.includes('.venus-full-actions[hidden]') && css.includes('display:none !important'));
check('desktop action menu flex', css.includes('.venus-actions-menu {') && css.includes('display:flex !important'));
check('mobile MENU 44x44', css.includes('width:44px !important') && css.includes('height:44px !important'));
check('mobile dropdown state', css.includes('.is-actions-open .venus-actions-menu'));

const passed = checks.filter(c=>c.ok).length;
for (const c of checks) console.log(`${c.ok?'PASS':'FAIL'} | ${c.name}${c.detail?` | ${c.detail}`:''}`);
console.log(`\n${passed}/${checks.length} checks passed`);
if (passed !== checks.length) process.exit(1);
