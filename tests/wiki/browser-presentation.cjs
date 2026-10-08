const { chromium } = require(process.env.PLAYWRIGHT_MODULE || 'playwright');
const assert = require('node:assert/strict');
const fs = require('node:fs/promises');
const origin = 'http://127.0.0.1:8088';

(async () => {
  const browser = await chromium.launch({ channel: 'chrome', headless: true });
  try {
    const page = await browser.newPage({ viewport: { width: 1440, height: 1000 } });
    const errors = [];
    page.on('pageerror', e => errors.push(e.message));
    const visit = async path => {
      await page.goto(origin + '/iris/wiki/ko/' + path);
      await page.locator('.brand').waitFor({ state: 'visible' });
    };
    await visit('items/page/2/');
    await page.locator('[data-filters]:not([hidden])').waitFor();
    const first = await page.locator('.entity-list strong').first().textContent();
    const index = await (await page.request.get(origin + await page.locator('[data-entity-list]').getAttribute('data-list-index'))).json();
    const farItem = index.at(-1);
    const input = page.locator('[data-list-query]');
    await input.fill(farItem.search.split(' ').at(-1));
    assert.ok(await page.locator(`.entity-list a[href="${farItem.url}"]`).count());
    await input.fill('');
    assert.equal(await page.locator('.entity-list strong').first().textContent(), first);
    assert.equal(await page.locator('[data-pagination] [aria-current]').textContent(), '2');
    const facet = page.locator('[data-facet="rarity"]');
    const frequent = Object.entries(index.reduce((counts,row)=>{
      for(const rarity of row.facets.rarity)counts[rarity]=(counts[rarity]||0)+1;
      return counts;
    },{})).find(([,count])=>count>100)[0];
    await facet.selectOption(frequent);
    assert.equal(await page.locator('.entity-list > li').count(), 50);
    const filteredFirst = await page.locator('.entity-list strong').first().textContent();
    await page.locator('[data-filter-next]').click();
    assert.notEqual(await page.locator('.entity-list strong').first().textContent(), filteredFirst);
    assert.match(await page.locator('[data-filter-page]').textContent(), /^2 \/ /);

    const measurements = [];
    for(const width of [1440,320]) {
      await page.setViewportSize({width,height:900});
      for(const path of ['items/','currencies/inspiration/','items/ticket0001/','skills/life.camping/','monsters/0010c_c/','challenges/challenge/','shops/shopoffercatalog_ducarin/','recipes/fwd0006/','combat-actions/combatmastery/','objectives/mo0010/','museum/museum/','statistics/stat_action_total/']) {
        await visit(path);
        const body = await page.locator('main').innerText();
        assert.ok(!body.includes('[object Object]'),path);
        assert.ok(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),`${path} overflow at ${width}`);
        measurements.push({path,width,height:await page.evaluate(()=>document.documentElement.scrollHeight)});
        if(path==='skills/life.camping/')assert.equal(await page.locator('#field-levelTable details[open]').count(),0);
        if(path==='recipes/fwd0006/')assert.equal(await page.locator('.recipe-stage').count(),3);
        if(path==='objectives/mo0010/')assert.ok(await page.locator('#values a[href$="/skills/life.stealth/"]').count());
        if(path==='statistics/stat_action_total/')assert.equal(await page.locator('#related').count(),0);
        if(path==='challenges/challenge/')assert.equal(await page.locator('#values details').count(),21);
        if(path==='currencies/inspiration/'){
          assert.equal(await page.locator('#sources > h2').textContent(),'획득처');
          assert.equal(await page.locator('#uses > h2').textContent(),'사용처');
          assert.ok(await page.locator('#sources a[href$="/actions/ip0001/"]').count());
          assert.ok(await page.locator('#uses a[href$="/actions/cmpa0010/"]').count());
          for(const selector of ['.entity-description','#sources .relation-panel','#uses .relation-panel'])assert.match(await page.locator(selector).evaluate(e=>getComputedStyle(e).borderImageSource),/panel\.png/);
          await page.locator('#navigation').evaluate(e=>{e.open=true;});
          const community=page.locator('.sidebar-foot a');
          assert.deepEqual(await community.allTextContents(),['↗ 공식 홈페이지','↗ Steam','↗ Google Play','↗ Discord']);
          assert.ok(await community.last().isVisible());
          await page.locator('#navigation').evaluate((e,width)=>{e.open=width>760;},width);
          await page.screenshot({path:`reports/inspiration-${width}.png`,fullPage:true});
        }
      }
    }
    await visit('monsters/0010c_c/');
    await page.locator('#field-skills details > summary').first().click();
    assert.ok(await page.locator('#field-skills details[open]').count());
    assert.ok(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth));
    await page.screenshot({path:'reports/presentation-monster-mobile.png',fullPage:true});
    await page.setViewportSize({width:640,height:500});
    await page.evaluate(()=>document.documentElement.style.fontSize=`${parseFloat(getComputedStyle(document.documentElement).fontSize)*2}px`);
    assert.ok(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth));
    assert.deepEqual(errors,[]);
    await fs.writeFile('reports/presentation-browser.json',JSON.stringify({measurements,errors},null,2));
    console.log('Presentation: filtering, pagination, separate acquisition/use panels, community links, 24 desktop/mobile pages, expanded skills and 200% text passed.');
  } finally { await browser.close(); }
})().catch(error=>{console.error(error);process.exitCode=1;});
