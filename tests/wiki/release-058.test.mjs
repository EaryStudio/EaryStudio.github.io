import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import { loadWiki } from '../../scripts/wiki/model.mjs';
import { renderData, renderRelationSections } from '../../scripts/wiki/render.mjs';
import { relationSection } from '../../scripts/wiki/relations.mjs';

const loaded=loadWiki();
test('all 29 new item source/use links match the independently reviewed release assets',async()=>{
 const w=await loaded;
 // Reviewed directly against the release ScriptableObjects, not generated from reverse links.
 const expected=JSON.parse(await fs.readFile(new URL('./fixtures/release-058-item-relations.json',import.meta.url),'utf8'));
 assert.equal(Object.keys(expected).length,29);
 for(const [id,sections]of Object.entries(expected)){
  const item=w.ids.get(id),incoming=w.reverse.get(id);
  for(const [section,sources]of Object.entries(sections)){
   assert.deepEqual(incoming.filter(r=>relationSection(item,r,true,w)===section).map(r=>r.source).sort(),sources,`${id}/${section}`);
   for(const locale of w.manifest.locales){
    const html=renderRelationSections(item,locale,w).find(s=>s.id===section)?.html??'';
    for(const source of sources){const e=w.ids.get(source);assert.ok(html.includes(`/${e.kind}/${e.slug}/`),`${id}/${section}/${source}/${locale}`);}
   }
  }
 }
});

test('item usage details show the objective submission quantity without treating equipment goals as consumption',async()=>{
 const w=await loaded,item=w.ids.get('items:cnp0001');
 const submit=w.reverse.get(item.wikiId).find(r=>r.source==='objectives:mo0029');
 for(const locale of w.manifest.locales){
  const render=r=>renderRelationSections(item,locale,{...w,reverse:new Map([[item.wikiId,[r]]]),derived:new Map()}).find(s=>s.id==='uses').html;
  assert.ok(render(submit).includes(`${w.dictionaries[locale].fields.amount} 10`));
  assert.ok(!render(submit).includes(w.dictionaries[locale].terms.distinctContexts));
  const sections=renderRelationSections(item,locale,w);
  assert.ok(sections.every(s=>!s.html.includes(w.dictionaries[locale].terms.distinctContexts)));
  const equip={...submit,context:{...submit.context,conditionType:'EquipItem',targetCount:999}};
  assert.ok(!render(equip).includes('999'));
 }
});
test('0.58 includes the complete released carpentry catalog and linked content',async()=>{
 const w=await loaded;
 assert.equal(w.manifest.release,'0.58');
 assert.equal(w.manifest.sourceRevision,'e1b70899813c6eb6e3f31f3efaefad8229df8c29');
 assert.equal(w.groups.items.length,970);
 assert.equal(w.groups.skills.length,26);
 assert.equal(w.groups.objectives.length,169);
 const actions=w.groups.actions.filter(e=>e.data.skill?.ref==='skills:life.carpentry');
 assert.equal(actions.length,82);
 assert.equal(actions.filter(e=>e.data.special?.kind==='carpentry-space').length,8);
 assert.equal(actions.filter(e=>e.data.special?.kind==='carpentry-furniture').length,48);
 for(const e of actions)assert.ok(e.image,`Missing released icon: ${e.wikiId}`);
 for(const id of ['items:pon0018','items:spenonc0050','items:spenonc0051','familiars:fam0043','familiars:fam0044','guides:guides.life.carpentry','patch-notes:0.58'])assert.ok(w.ids.has(id),id);
 for(const id of ['mo0028','mo0029','mo0030','mo0031'])assert.ok(w.ids.has('objectives:'+id));
});

test('permanent projects expose prerequisites, exclusive slots and final tier bonuses',async()=>{
 const w=await loaded,skill=w.ids.get('skills:life.carpentry').data.special;
 assert.equal(skill.spaceProjects.length,8);
 assert.equal(skill.furniture.length,16);
 for(let slot=0;slot<8;slot++){
  const families=skill.furniture.filter(f=>f.slot===slot);assert.equal(families.length,2);
  for(const family of families){assert.equal(family.levels.length,3);
   family.levels.forEach((r,i)=>{
    const e=w.ids.get(r.ref),s=e.data.special;
    assert.equal(s.tier,i+1);assert.equal(s.oneTimeCompletion,true);assert.equal(s.slot,slot);
    assert.ok(s.bonusPercent>0);assert.equal(s.alternatives.length,1);
    assert.equal(w.ids.get(s.alternatives[0].ref).data.special.slot,slot);
    assert.equal(s.requiredProjects.length,i===0?1:2);
    if(i>0)assert.ok(s.requiredProjects.some(r=>r.ref===family.levels[i-1].ref));
    assert.ok(s.requiredProjects.some(r=>w.ids.get(r.ref).data.special.kind==='carpentry-space'));
   });
  }
 }
 assert.deepEqual(['cnf0001','cnf0002','cnf0003'].map(id=>w.ids.get('actions:'+id).data.special.bonusPercent),[10,20,30]);
 for(const r of skill.spaceProjects){const s=w.ids.get(r.ref).data.special;assert.equal(s.unlocks.length,2);assert.equal(s.requiredProjects.length,s.stage===1?0:1);}
});

test('carpentry renders the game wording and condition links in every locale',async()=>{
 const w=await loaded;
 for(const locale of w.manifest.locales){
  const strings=w.gameStrings.get(locale);
  for(const id of ['skills:life.carpentry','actions:cnh0001','actions:cnf0001','actions:cnf0024','actions:cnf0048']){
   const html=renderData(w.ids.get(id),locale,w);
   assert.ok(!/UI_CARPENTRY_|undefined|\{[012]\}/.test(html),`${id}/${locale}`);
   if(id==='skills:life.carpentry')assert.ok(html.includes(strings['UI/UI_CARPENTRY_MANAGE']));
   if(id.startsWith('actions:cnf')){assert.ok(html.includes(strings['UI/UI_CARPENTRY_PLACE_FOR_BONUS']));assert.ok(html.includes('/actions/cnh'));}
  }
  for(const offer of w.groups.offers.filter(e=>e.data.slotPurchaseLimit))
   assert.ok(renderData(offer,locale,w).includes(w.dictionaries[locale].fields.slotPurchaseLimit));
 }
 for(const e of w.groups.objectives.filter(e=>e.data.condition.conditionType==='CompleteCarpentryProject')){
  assert.ok(e.data.condition.actionId);
  assert.ok(e.relations.some(r=>r.target===`actions:${e.data.condition.actionId.toLowerCase()}`&&r.role==='requires'));
 }
});

test('new special equipment drops come from chests, not carpentry processing',async()=>{
 const w=await loaded;
 for(const [chest,item] of [['chestd0004','spenonc0050'],['chestd0008','spenonc0051']]){
  const rows=w.ids.get('items:'+chest).data.rewards.entries;
  const row=rows.find(r=>r.item?.ref==='items:'+item);assert.ok(row);assert.equal(row.probability,0.004);
  for(const a of w.groups.actions.filter(a=>a.data.skill?.ref==='skills:life.carpentry'))assert.ok(!a.relations.some(r=>r.target==='items:'+item&&r.role==='rewards'));
 }
});
