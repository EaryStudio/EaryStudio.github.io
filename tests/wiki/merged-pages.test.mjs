import test from 'node:test';
import assert from 'node:assert/strict';
import {loadWiki,route} from '../../scripts/wiki/model.mjs';
import {renderData,renderRelationSections} from '../../scripts/wiki/render.mjs';
const loaded=loadWiki();

test('all familiar, stealth and combat definitions have one combined action page',async()=>{
  const w=await loaded;
  assert.equal(w.mergedInto.size,80);
  assert.equal(w.mergedContent.size,80);
  for(const kind of ['familiars','targets','combat-actions','offers'])assert.ok(!w.navigationKinds.includes(kind));
  for(const [definitionId,actionId]of w.mergedInto){
    const definition=w.ids.get(definitionId),action=w.ids.get(actionId);
    assert.equal(w.parentSkills.get(definitionId),action.data.skill.ref);
    for(const locale of w.manifest.locales){
      assert.equal(route(w.config,locale,definition),route(w.config,locale,action));
      const page=w.pages.find(p=>p.locale===locale&&p.entity===action);
      assert.ok(page.mergedIds.includes(definitionId));
      assert.ok(renderData(definition,locale,w).length);
    }
  }
});

test('search, legacy URLs and shop ownership point into the new hierarchy',async()=>{
  const w=await loaded;
  for(const locale of w.manifest.locales){
    const search=JSON.parse(w.indexes[locale].json);
    assert.ok(!search.some(e=>['familiars','targets','combat-actions'].includes(e.kind)));
    assert.ok(search.find(e=>e.id==='actions:tr0003').names.includes('combat-actions:alertstance'));
    const legacy=w.pages.find(p=>p.url===`/iris/wiki/${locale}/combat-actions/alertstance/`);
    assert.equal(legacy.type,'forward');
    assert.equal(legacy.canonicalUrl,`/iris/wiki/${locale}/actions/tr0003/`);
    assert.equal(w.pages.find(p=>p.url===`/iris/wiki/${locale}/offers/page/2/`).canonicalUrl,`/iris/wiki/${locale}/shops/`);
    for(const offer of w.groups.offers){
      const page=w.pages.find(p=>p.locale===locale&&p.entity===offer);
      assert.ok(page.parentShopIds.length);
    }
  }
  const target=w.ids.get('targets:ste0001');
  assert.ok(renderData(target,'ko',w).includes('통찰'));
  const mergedRelations=renderRelationSections(w.ids.get('actions:ste0001'),'ko',w).map(s=>s.html).join('');
  assert.ok(mergedRelations.includes('/items/chests0001/'));
  assert.ok(!mergedRelations.includes('/actions/ste0001/'));
});
