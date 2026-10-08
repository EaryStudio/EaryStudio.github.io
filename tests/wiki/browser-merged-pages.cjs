const {chromium}=require(process.env.PLAYWRIGHT_MODULE||'playwright');
const assert=require('node:assert/strict');
const base='http://127.0.0.1:8088/iris/wiki/';
(async()=>{
 const browser=await chromium.launch({channel:'chrome',headless:true});
 try{
  const page=await browser.newPage({viewport:{width:1440,height:1000}});
  const errors=[];page.on('pageerror',e=>errors.push(e.message));
  for(const locale of ['en','ko','ja','es','zh-Hans','zh-Hant']){
   for(const [oldPath,action,kind]of [['familiars/fam0011/','fam0011','familiars'],['targets/ste0001/','ste0001','targets'],['combat-actions/alertstance/','tr0003','combat-actions']]){
    await page.goto(`${base}${locale}/${oldPath}`);
    await page.waitForURL(`**/${locale}/actions/${action}/`);
    await page.locator('.brand').waitFor({state:'visible'});
    assert.ok(await page.locator(`#merged-${kind} .data-section`).count());
    assert.ok(await page.locator('#values .data-section').count());
    assert.match(await page.locator('.sidebar [aria-current="page"]').getAttribute('href'),/\/skills\/$/);
    for(const removed of ['familiars','targets','combat-actions','offers'])assert.equal(await page.locator(`.sidebar nav a[href$="/${removed}/"]`).count(),0);
    if(locale==='ko'&&kind==='combat-actions')await page.screenshot({path:'reports/merged-training-desktop.png',fullPage:true});
   }
  }
  for(const [skill,count]of [['familiartraining',42],['stealth',28],['training',10]]){
   await page.goto(`${base}ko/skills/life.${skill}/`);
   assert.equal(await page.locator('#skill-actions .entity-list a').count(),count);
   await page.locator('#skill-actions .entity-list a').first().click();
   assert.ok(await page.locator('.merged-content').count());
  }
  await page.goto(`${base}ko/offers/d0008/`);
  assert.match(await page.locator('.sidebar [aria-current="page"]').getAttribute('href'),/\/shops\/$/);
  assert.ok(await page.locator('.breadcrumb a[href$="/shops/shopoffercatalog_ducarin/"]').count());
  await page.locator('.breadcrumb a[href$="/shops/shopoffercatalog_ducarin/"]').click();
  await page.locator('main a[href$="/offers/d0008/"]').click();
  assert.match(page.url(),/\/offers\/d0008\/$/);
  await page.goto(`${base}ko/offers/`);await page.waitForURL('**/ko/shops/');
  await page.setViewportSize({width:320,height:800});
  for(const path of ['actions/fam0011/','actions/ste0001/','actions/tr0003/','offers/d0008/']){
   await page.goto(`${base}ko/${path}`);await page.locator('.brand').waitFor({state:'visible'});
   assert.ok(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),path);
  }
  await page.goto(`${base}ko/actions/ste0001/`);await page.locator('.brand').waitFor({state:'visible'});
  await page.screenshot({path:'reports/merged-stealth-mobile.png',fullPage:true});
  const context=await browser.newContext({javaScriptEnabled:false});const noJs=await context.newPage();
  await noJs.goto(`${base}ko/combat-actions/alertstance/`);await noJs.waitForURL('**/ko/actions/tr0003/');
  assert.ok(await noJs.locator('#merged-combat-actions table').count());
  const response=await noJs.request.get(`${base}ko/familiars/`);
  assert.match(await response.text(),/href="\/iris\/wiki\/ko\/skills\/life.familiartraining\/"/);
  assert.deepEqual(errors,[]);
  console.log('Merged pages: six locales, 80 definitions covered by unit tests, legacy redirects, skill and shop navigation, mobile and no-JS passed.');
 }finally{await browser.close();}
})().catch(e=>{console.error(e);process.exitCode=1;});
