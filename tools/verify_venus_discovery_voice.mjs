import fs from 'node:fs';

const js = fs.readFileSync(new URL('../venus-full-exploration.js', import.meta.url), 'utf8');
const html = fs.readFileSync(new URL('../index.html', import.meta.url), 'utf8');
let fails = 0;
const test = (name, ok) => { console.log(`${ok ? 'PASS' : 'FAIL'}  ${name}`); if (!ok) fails++; };

const blocks = [...js.matchAll(/id:\s*"((?:maat|maxwell|aphrodite|ishtar|alpha)-[^"]+)"[\s\S]*?type:\s*"([^"]+)"[\s\S]*?title:\s*"([^"]+)"[\s\S]*?lead:\s*"([^"]+)"[\s\S]*?sections:\s*\[([\s\S]*?)\][\s\S]*?why:\s*"([^"]+)"/g)];
const friendlyTypes = new Set(['TAHUKAH KAMU?','COBA PERHATIKAN!','COBA LIHAT SEKITAR!','LIHAT DEH!','TERNYATA...','UNIKNYA...','KENAPA BISA BEGINI?','PANAS BANGET, YA?']);
const stiff = [
  'manifestasi morfologi',
  'temuan geologi berhasil diidentifikasi',
  'objek telah ditemukan',
  'merupakan manifestasi',
  'proses ekstrusi material'
];

test('all 25 Venus observation cards are present', blocks.length === 25);
test('every discovery hook uses approved friendly language', blocks.every(m => friendlyTypes.has(m[2])));
test('discovery hooks have variety', new Set(blocks.map(m => m[2])).size >= 6);
test('all observation leads stay concise', blocks.every(m => m[4].length <= 260));
test('all why paragraphs stay concise', blocks.every(m => m[6].length <= 230));
test('no known stiff / robotic phrases remain in observation copy', stiff.every(x => !js.toLowerCase().includes(x)));
test('nearby prompt is friendlier', html.includes('<small>ADA YANG MENARIK</small>'));
test('observe action remains clear', html.includes('id="venus-observe-button" type="button">AMATI</button>'));
test('reason label remains KENAPA INI MENARIK?', html.includes('KENAPA INI MENARIK?'));
test('main professional quality label remains', html.includes('<small>Kualitas</small>'));
test('main professional region label remains', html.includes('<small>Wilayah</small>'));
test('main professional altitude label remains', html.includes('<small>Ketinggian</small>'));
test('main professional exit label remains', html.includes('Keluar dari Eksplorasi'));

if (fails) {
  console.error(`\nFAILED: ${fails} discovery-voice checks.`);
  process.exit(1);
}
console.log(`\n${13 - fails}/13 discovery-voice checks passed.`);
