const { chromium } = require('playwright');
const assert = require('assert');
const { spawn } = require('child_process');
const fs = require('fs');
const path = require('path');

(async () => {
  const root = path.resolve(__dirname, '..');
  const tmp = path.join(root, '.tmp');
  fs.mkdirSync(tmp, { recursive: true });
  const server = spawn('python', ['-m', 'http.server', '8780', '--directory', root], { stdio: 'ignore' });
  const browser = await chromium.launch({
    executablePath: process.env.BROWSER_EXECUTABLE || undefined,
    args: ['--no-sandbox', '--enable-unsafe-swiftshader'],
    headless: true
  });

  try {
    const p = await browser.newPage({ viewport: { width: 1440, height: 900 }, reducedMotion: 'reduce' });
    const errors = [];
    p.on('pageerror', e => errors.push(e.message));

    // The CI sandbox has no outbound network. Remote images are independently verified
    // by source metadata; route them to valid local image bytes so UI/load behavior can
    // still be tested end-to-end without changing their actual src values in the app.
    const fallback = fs.readFileSync(path.join(root, 'assets/exploration/taj-mahal.webp'));
    for (const pattern of [
      'https://upload.wikimedia.org/**',
      'https://thumb.wikimedia.org/**',
      'https://assets.science.nasa.gov/**'
    ]) {
      await p.route(pattern, route => route.fulfill({ status: 200, contentType: 'image/webp', body: fallback }));
    }

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

    async function settle(prefix, i) {
      await p.evaluate(({ prefix, i }) => (prefix === 'earth' ? earth : mars).setExplorationStop(i), { prefix, i });
      if (prefix === 'earth') {
        await p.evaluate(() => { earth.pose = { ...earth.poseTarget }; earth.render(); });
      } else {
        await p.evaluate(() => {
          mars.explorationBlend = mars.explorationBlendTarget = 1;
          mars.topicYaw = mars.topicYawTarget;
          mars.topicPitch = mars.topicPitchTarget;
          mars.topicRoll = mars.topicRollTarget;
          mars.topicShift = { ...mars.topicShiftTarget };
          mars.render();
        });
      }
      await p.waitForFunction(prefix => {
        const frames = [...document.querySelectorAll(`#${prefix}-marker-media .exploration-marker-frame`)];
        return frames.length > 0 && frames.every(frame => !frame.disabled);
      }, prefix);
    }

    async function verifyTwoUnique(prefix, i) {
      await settle(prefix, i);
      const data = await p.evaluate(prefix => {
        const frames = [...document.querySelectorAll(`#${prefix}-marker-media .exploration-marker-frame`)];
        return frames.map(frame => ({ src: frame.querySelector('img').src, alt: frame.querySelector('img').alt }));
      }, prefix);
      assert.equal(data.length, 2, `${prefix} ${i} should have exactly 2 usable images`);
      assert(data[0].alt && data[1].alt, `${prefix} ${i} alt text missing`);
      assert.notEqual(data[0].src, data[1].src, `${prefix} ${i} image src duplicated`);

      const frames = p.locator(`#${prefix}-marker-media .exploration-marker-frame`);
      await frames.nth(0).click();
      await p.waitForFunction(() => !document.querySelector('.exploration-lightbox').hidden);
      let lightboxSrc = await p.locator('.exploration-lightbox-image').getAttribute('src');
      assert.equal(new URL(lightboxSrc, 'http://127.0.0.1:8780').href, data[0].src, `${prefix} image 01 opened wrong source`);
      assert.equal(await p.locator('.exploration-lightbox-counter').textContent(), '01 / 02');
      assert.equal(await p.locator('.exploration-lightbox-prev').isDisabled(), true);
      assert.equal(await p.locator('.exploration-lightbox-next').isDisabled(), false);

      await p.locator('.exploration-lightbox-next').click();
      lightboxSrc = await p.locator('.exploration-lightbox-image').getAttribute('src');
      assert.equal(new URL(lightboxSrc, 'http://127.0.0.1:8780').href, data[1].src, `${prefix} right arrow did not open image 02`);
      assert.equal(await p.locator('.exploration-lightbox-counter').textContent(), '02 / 02');

      await p.locator('.exploration-lightbox-prev').click();
      lightboxSrc = await p.locator('.exploration-lightbox-image').getAttribute('src');
      assert.equal(new URL(lightboxSrc, 'http://127.0.0.1:8780').href, data[0].src, `${prefix} left arrow did not return to image 01`);

      await p.keyboard.press('Escape');
      assert.equal(await p.locator('.exploration-lightbox').getAttribute('aria-hidden'), 'true');

      await frames.nth(1).click();
      await p.waitForFunction(() => !document.querySelector('.exploration-lightbox').hidden);
      lightboxSrc = await p.locator('.exploration-lightbox-image').getAttribute('src');
      assert.equal(new URL(lightboxSrc, 'http://127.0.0.1:8780').href, data[1].src, `${prefix} image 02 opened wrong source`);
      await p.locator('.exploration-lightbox-close').click();
      assert.equal(await p.locator('.exploration-lightbox').getAttribute('aria-hidden'), 'true');

      await frames.nth(0).click();
      await p.locator('.exploration-lightbox-backdrop').click({ position: { x: 2, y: 2 } });
      assert.equal(await p.locator('.exploration-lightbox').getAttribute('aria-hidden'), 'true');
    }

    // Renderer-level duplicate filtering also rejects same file with query/hash variants.
    const dedup = await p.evaluate(() => ExplorationMedia.getImages({
      title: 'Dedup test',
      images: [
        { src: 'assets/test.webp?one=1' },
        { src: 'assets/test.webp?two=2' },
        { src: 'assets/other.webp' },
        { src: '' },
        null
      ]
    }).map(item => item.src));
    assert.deepEqual(dedup, ['assets/test.webp?one=1', 'assets/other.webp']);

    // Earth: all seven modern wonders.
    for (let i = 4; i < 11; i++) await verifyTwoUnique('earth', i);
    assert.equal(await p.locator('#earth-exploration .exploration-marker-frame').count(), 0);
    assert.equal(await p.locator('#earth-exploration img:not(.earth-country-flag)').count(), 0);
    await p.screenshot({ path: path.join(tmp, 'media-earth-marker-desktop.png') });

    // Old state must be cleared when changing selections.
    await settle('earth', 5);
    const oldSrc = await p.locator('#earth-marker-media img').nth(0).getAttribute('src');
    await settle('earth', 10);
    const newSrc = await p.locator('#earth-marker-media img').nth(0).getAttribute('src');
    assert.notEqual(oldSrc, newSrc, 'Earth preview stayed stale after selection change');
    assert.equal(await p.locator('.exploration-lightbox').getAttribute('aria-hidden'), 'true');

    async function assertPreviewInViewport(prefix) {
      const bounds = await p.evaluate(prefix => {
        const r = document.getElementById(`${prefix}-marker-media`).getBoundingClientRect();
        return { left: r.left, top: r.top, right: r.right, bottom: r.bottom, width: innerWidth, height: innerHeight };
      }, prefix);
      assert(bounds.left >= -1 && bounds.top >= -1 && bounds.right <= bounds.width + 1 && bounds.bottom <= bounds.height + 1, JSON.stringify(bounds));
    }
    await assertPreviewInViewport('earth');

    await p.click('#earth-exploration-close');
    await p.click('#earth-next');
    await p.waitForFunction(() => phase === 'mars');
    await p.click('#mars-explore-button');

    // Mars: every existing visual topic, including Olympus and another mapped topic.
    for (let i = 0; i < 6; i++) await verifyTwoUnique('mars', i);
    assert.equal(await p.locator('#mars-exploration img').count(), 0);
    await assertPreviewInViewport('mars');
    await p.screenshot({ path: path.join(tmp, 'media-mars-marker-desktop.png') });

    // Broken second image disappears cleanly and does not duplicate image 1.
    await p.evaluate(() => ExplorationMedia.render('mars', {
      title: 'Broken-image test',
      images: [
        { src: 'assets/exploration/olympus-mons.webp', alt: 'valid' },
        { src: 'assets/missing-test.webp', alt: 'missing' }
      ]
    }));
    await p.waitForFunction(() => document.querySelectorAll('#mars-marker-media .exploration-marker-frame').length === 1);
    assert.equal(await p.locator('#mars-marker-media .exploration-marker-frame').count(), 1);
    assert.equal(await p.locator('#mars-marker-media img').count(), 1);
    await settle('mars', 0);

    await p.setViewportSize({ width: 390, height: 844 });
    await p.evaluate(() => { mars.resize(); mars.render(); });
    await assertPreviewInViewport('mars');
    assert.equal(await p.evaluate(() => document.documentElement.scrollWidth), 390);
    await p.screenshot({ path: path.join(tmp, 'media-mars-marker-mobile.png') });

    assert.deepEqual(errors, []);
    console.log('PASS shared media: explicit images arrays, dedup, exact thumbnail zoom, arrows, X/backdrop/ESC, stale-state reset, broken-image cleanup, Earth+Mars placement.');
  } finally {
    await browser.close();
    server.kill();
  }
})().catch(e => { console.error(e); process.exit(1); });
