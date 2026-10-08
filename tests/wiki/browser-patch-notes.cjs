const { chromium } = require(process.env.PLAYWRIGHT_MODULE || 'playwright');
const fs = require('node:fs/promises');
const assert = require('node:assert/strict');

(async () => {
  const notes = JSON.parse(await fs.readFile('data/iris/entities/patch-notes.json', 'utf8'));
  const latest = notes.find(note => note.data.order === 0);
  const browser = await chromium.launch({ channel: process.env.PLAYWRIGHT_CHANNEL || 'chrome', headless: true });
  try {
    const page = await browser.newPage({ viewport: { width: 1440, height: 1000 } });
    const errors = [];
    page.on('pageerror', error => errors.push(error.message));
    for (const locale of Object.keys(latest.names)) {
      await page.goto(`http://127.0.0.1:8088/iris/wiki/${locale}/patch-notes/`);
      await page.locator('.brand').waitFor({ state: 'visible' });
      assert.equal(await page.locator('.patch-body').textContent(), latest.data.bodies[locale]);
      assert.equal(await page.locator('.patch-versions a').count(), notes.length);
      assert.match(await page.locator('.sidebar a[aria-current="page"]').getAttribute('href'), /\/patch-notes\/$/);
      assert.equal(await page.locator('.sidebar a[href*="/systems/"]').count(), 0);
      for (const suffix of ['', 'commerce/', 'enchanting/', 'painting/', 'writing/']) {
        const response = await page.request.get(`http://127.0.0.1:8088/iris/wiki/${locale}/systems/${suffix}`);
        assert.equal(response.status(), 404);
      }
    }
    await page.goto('http://127.0.0.1:8088/iris/wiki/ko/patch-notes/');
    await page.locator('.brand').waitFor({ state: 'visible' });
    await page.screenshot({ path: 'reports/patch-notes-desktop.png', fullPage: true });
    assert.equal(await page.locator('.patch-history').getAttribute('open'), null);
    await page.locator('.patch-history > summary').click();
    await page.locator('.patch-versions a').filter({ hasText: /^0\.34$/ }).click();
    await page.locator('.brand').waitFor({ state: 'visible' });
    assert.match(page.url(), /\/ko\/patch-notes\/0.34\/$/);
    await page.locator('.languages summary').click();
    await page.locator('.languages a[lang="ja"]').click();
    await page.locator('.brand').waitFor({ state: 'visible' });
    assert.match(page.url(), /\/ja\/patch-notes\/0.34\/$/);
    assert.equal(await page.locator('.patch-body').textContent(), notes.find(note => note.slug === '0.34').data.bodies.ja);
    await page.setViewportSize({ width: 320, height: 800 });
    await page.goto('http://127.0.0.1:8088/iris/wiki/ko/patch-notes/');
    await page.locator('.brand').waitFor({ state: 'visible' });
    assert.ok(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth));
    await page.screenshot({ path: 'reports/patch-notes-mobile.png', fullPage: true });
    const noJs = await browser.newContext({ javaScriptEnabled: false, viewport: { width: 320, height: 800 } });
    const staticPage = await noJs.newPage();
    await staticPage.goto('http://127.0.0.1:8088/iris/wiki/ko/patch-notes/0.56/');
    assert.equal(await staticPage.locator('.patch-body').textContent(), latest.data.bodies.ko);
    assert.ok(await staticPage.locator('.patch-body').isVisible());
    await noJs.close();
    assert.deepEqual(errors, []);
    console.log('Patch notes: all six locales, source text, version/language links, 30 removed routes, 320px and no-JS passed.');
  } finally { await browser.close(); }
})().catch(error => { console.error(error); process.exitCode = 1; });
