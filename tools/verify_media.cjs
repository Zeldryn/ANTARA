const { chromium } = require('playwright');
const assert = require('assert');
const { spawn } = require('child_process');

(async () => {
  const root = require('path').resolve(__dirname, '..');
  require('fs').mkdirSync(root + '/.tmp', { recursive: true });
  const server = spawn('python', ['-m', 'http.server', '8780', '--directory', root]);
  const browser = await chromium.launch({
    executablePath: process.env.BROWSER_EXECUTABLE || undefined,
    args: ['--no-sandbox', '--enable-unsafe-swiftshader'],
    headless: true
  });

  try {
    const p = await browser.newPage({ viewport: { width: 1440, height: 900 }, reducedMotion: 'reduce' });
    const errors = [];
    p.on('pageerror', e => errors.push(e.message));
    await p.goto('http://127.0.0.1:8780');
    await p.evaluate(async () => {
      await Promise.all([earth.prepare(), mars.prepare()]);
      mission.classList.add('is-earth');
      phase = 'earth';
      document.querySelector('.intro').inert = true;
      earth.start({ settled: true });
      earth.element.style.opacity = '1';
    });
    await p.click('#earth-explore-button');

    async function check(prefix, i) {
      await p.evaluate(({ prefix, i }) => (prefix === 'earth' ? earth : mars).setExplorationStop(i), { prefix, i });
      if (prefix === 'earth') await p.evaluate(() => { earth.pose = { ...earth.poseTarget }; earth.render(); });
      if (prefix === 'mars') await p.evaluate(() => {
        mars.explorationBlend = mars.explorationBlendTarget = 1;
        mars.topicYaw = mars.topicYawTarget;
        mars.topicPitch = mars.topicPitchTarget;
        mars.topicRoll = mars.topicRollTarget;
        mars.topicShift = { ...mars.topicShiftTarget };
        mars.render();
      });
      await p.waitForFunction(prefix => {
        const images = [...document.querySelectorAll(`#${prefix}-marker-media img`)];
        return images.length >= 2 && images.every(img => img.complete && img.naturalWidth > 0);
      }, prefix);
      assert(await p.locator(`#${prefix}-marker-media img`).first().getAttribute('alt'));
      assert.equal(await p.locator(`#${prefix}-marker-media img`).count(), 2);
    }

    for (let i = 4; i < 11; i++) await check('earth', i);
    assert.equal(await p.locator('#earth-exploration .exploration-marker-frame').count(), 0);
    assert.equal(await p.locator('#earth-exploration img:not(.earth-country-flag)').count(), 0);
    await p.screenshot({ path: root + '/.tmp/media-earth-marker-desktop.png' });

    async function assertPreviewInViewport(prefix) {
      const bounds = await p.evaluate(prefix => {
        const r = document.getElementById(`${prefix}-marker-media`).getBoundingClientRect();
        return { left: r.left, top: r.top, right: r.right, bottom: r.bottom, width: innerWidth, height: innerHeight };
      }, prefix);
      assert(bounds.left >= 0 && bounds.top >= 0 && bounds.right <= bounds.width && bounds.bottom <= bounds.height, JSON.stringify(bounds));
    }
    await assertPreviewInViewport('earth');

    await p.click('#earth-exploration-close');
    await p.click('#earth-next');
    await p.waitForFunction(() => phase === 'mars');
    await p.click('#mars-explore-button');
    for (let i = 0; i < 6; i++) await check('mars', i);
    assert.equal(await p.locator('#mars-exploration img').count(), 0);
    await assertPreviewInViewport('mars');
    await p.screenshot({ path: root + '/.tmp/media-mars-marker-desktop.png' });

    await p.setViewportSize({ width: 390, height: 844 });
    await p.evaluate(() => { mars.resize(); mars.render(); });
    await assertPreviewInViewport('mars');
    assert.equal(await p.evaluate(() => document.documentElement.scrollWidth), 390);
    await p.screenshot({ path: root + '/.tmp/media-mars-marker-mobile.png' });

    await p.evaluate(() => ExplorationMedia.render('mars', { ...MARS_EXPLORATION_STOPS[5], image: 'assets/missing-test.webp' }));
    await p.waitForFunction(() => [...document.querySelectorAll('#mars-marker-media img')].every(img => img.hidden));
    assert((await p.locator('#mars-marker-media').textContent()).includes('Visual tidak tersedia'));
    await check('mars', 0);

    assert.deepEqual(errors, []);
    console.log('PASS marker-side media: Earth + Mars, dual previews, text-only cards, adaptive placement, rapid switching and image failure recovery.');
  } finally {
    await browser.close();
    server.kill();
  }
})().catch(e => { console.error(e); process.exit(1); });
