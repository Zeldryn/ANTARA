import fs from 'node:fs';
import path from 'node:path';

const root = path.resolve(path.dirname(new URL(import.meta.url).pathname), '..');
const html = fs.readFileSync(path.join(root, 'index.html'), 'utf8');
const css = fs.readFileSync(path.join(root, 'styles.css'), 'utf8');
const js = fs.readFileSync(path.join(root, 'script.js'), 'utf8');

const checks = [];
const check = (name, condition) => checks.push({ name, ok: Boolean(condition) });
const count = (text, pattern) => (text.match(pattern) || []).length;

check('profile HUD root exists exactly once', count(html, /id="cockpit-profile-hud"/g) === 1);
check('profile trigger exists exactly once', count(html, /id="profile-hud-trigger"/g) === 1);
check('avatar image hook exists', html.includes('id="profile-avatar-image"'));
check('logged-out primary copy exists', html.includes('MASUK KE ANTARA'));
check('profile is placed before the speech bubble', html.indexOf('id="cockpit-profile-hud"') < html.indexOf('id="speech-bubble"'));

check('layered avatar ring styles exist', css.includes('.profile-avatar-tech') && css.includes('.profile-ring-dash-a') && css.includes('.profile-ring-blade'));
check('ANTARA gold and cyan channels exist', css.includes('--profile-gold') && css.includes('--profile-cyan'));
check('boot scan exists', css.includes('@keyframes profile-boot-scan'));
check('subtle idle ring exists', css.includes('@keyframes profile-ring-idle'));
check('hover scan exists', css.includes('@keyframes profile-hover-scan'));
check('reduced-motion handling exists', css.includes('@media (prefers-reduced-motion: reduce)'));
check('mobile profile layout exists', /@media \(max-width: 700px\)[\s\S]*?\.cockpit-profile-hud/.test(css));
check('short-height profile layout exists', /@media \(max-height: 700px\) and \(min-width: 701px\)[\s\S]*?\.cockpit-profile-hud/.test(css));

check('profile controller exists', js.includes('class CockpitProfileHUD'));
check('real auth discovery is supported', js.includes('window.ANTARAAuth') && js.includes('getCurrentUser'));
check('auth change event is supported', js.includes('antara:auth-change'));
check('login request hook exists', js.includes('antara:login-request'));
check('profile request hook exists', js.includes('antara:profile-request'));
check('public profile HUD hook exists', js.includes('window.ANTARAProfileHUD'));
check('profile HUD does not persist fake auth state', !/localStorage\.setItem\([^\n]*(?:profile|user|auth)/i.test(js));

const failed = checks.filter(item => !item.ok);
for (const item of checks) console.log(`${item.ok ? 'PASS' : 'FAIL'} ${item.name}`);
if (failed.length) {
  console.error(`\n${failed.length} profile HUD verification check(s) failed.`);
  process.exit(1);
}
console.log(`\n${checks.length}/${checks.length} profile HUD verification checks passed.`);
