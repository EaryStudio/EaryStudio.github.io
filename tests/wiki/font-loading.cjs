// Real cold-cache reproduction of the reported font swap, including a delay
// longer than font-display:block's usual three-second block period.
const { chromium } = require(process.env.PLAYWRIGHT_MODULE || 'playwright');
const assert = require('node:assert/strict');
const fs = require('node:fs/promises');
(async () => {
  const browser = await chromium.launch({ headless: true, channel: 'chrome' });
  try {
    const context = await browser.newContext({ viewport: { width: 1280, height: 900 } });
    let releaseFont;
    const held = new Promise(resolve => { releaseFont = resolve; });
    let requestSeen;
    const requested = new Promise(resolve => { requestSeen = resolve; });
    await context.route('**/silver.woff2', async route => { requestSeen(); await held; await route.continue(); });
    const page = await context.newPage();
    await page.goto('http://127.0.0.1:8088/iris/wiki/ko/slots/', { waitUntil: 'domcontentloaded' });
    await requested;
    await page.waitForTimeout(3500);
    assert.equal(await page.locator('body').evaluate(e => getComputedStyle(e).visibility), 'hidden');
    releaseFont();
    await page.waitForFunction(() => !document.documentElement.classList.contains('font-pending'));
    assert.equal(await page.locator('body').evaluate(e => getComputedStyle(e).visibility), 'visible');
    assert.ok(await page.evaluate(() => document.fonts.check('24px Silver')));
    await page.screenshot({ path: 'reports/slots-aligned.png', fullPage: true });
    await page.locator('.entity-list a').first().click();
    await page.waitForFunction(() => !document.documentElement.classList.contains('font-pending'));
    assert.equal(await page.locator('.entity-id').count(), 0);
    const failed = await browser.newContext();
    await failed.route('**/silver.woff2', route => route.abort());
    const fallback = await failed.newPage();
    await fallback.goto('http://127.0.0.1:8088/iris/wiki/en/slots/', { waitUntil: 'domcontentloaded' });
    await fallback.waitForFunction(() => !document.documentElement.classList.contains('font-pending'));
    assert.equal(await fallback.locator('body').evaluate(e => getComputedStyle(e).visibility), 'visible');
    await fs.writeFile('reports/font-loading.json', JSON.stringify({ coldCacheDelayed3500ms: true, noTemporaryFont: true, navigation: true, failedFontStillReadable: true, gameIdLabelsRemoved: true }, null, 2));
    console.log('Delayed-font and failed-font checks passed.');
  } finally { await browser.close(); }
})();
