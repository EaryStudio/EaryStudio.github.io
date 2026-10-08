import test from 'node:test';
import assert from 'node:assert/strict';
import { loadWiki } from '../../scripts/wiki/model.mjs';
import { renderData, renderRelationSections, listRecord } from '../../scripts/wiki/render.mjs';
import { renderSpecial } from '../../scripts/wiki/special-actions.mjs';
import { currencyRelations } from '../../scripts/wiki/currency-relations.mjs';

const loaded=loadWiki();
test('currencies include numeric rewards, shop prices, unlocks and special actions',async()=>{
 const w=await loaded;
 for(const id of ['currencies:gold','currencies:ducarin']){
  const sections=renderRelationSections(w.ids.get(id),'ko',w);
  assert.ok(sections.find(s=>s.id==='sources'));assert.ok(sections.find(s=>s.id==='uses'));
 }
 const gold=w.reverse.get('currencies:gold');
 assert.ok(gold.some(r=>r.source==='offers:g0001'&&r.role==='consumes'));
 assert.ok(gold.some(r=>r.source==='slots:farming.slot.fru1'&&r.context.quantity[0]===100));
 assert.ok(gold.some(r=>r.source==='actions:wrt0002'&&r.context.quantity[0]===300));
 assert.ok(!gold.some(r=>r.source==='offers:chshop_skill_cap_115'));
 const ducarin=w.reverse.get('currencies:ducarin');
 assert.ok(ducarin.some(r=>r.source==='actions:com0004'&&r.role==='rewards'));
 assert.ok(ducarin.some(r=>r.source==='actions:com0005'&&r.role==='consumes'));
});
test('gold rolls stay independent and repeated reward entries are not deduplicated',()=>{
 const e={wikiId:'monsters:test',kind:'monsters',relations:[],data:{rewardTable:{$type:'RewardProbabilityDataSO',chooseOneItem:true,entries:[{goldRange:[2,4],goldProbability:.8},{goldRange:[2,4],goldProbability:.8}]}}};
 const rows=currencyRelations([e,{wikiId:'currencies:gold',kind:'currencies',data:{},relations:[]}],new Map()).get(e.wikiId);
 assert.equal(rows.length,2);assert.ok(rows.every(r=>r.context.model==='independent'&&r.context.probability===.8));
});
test('shop rotation and zero slot capacity retain runtime semantics in six languages',async()=>{
 const w=await loaded;
 for(const l of w.manifest.locales){
  const label=w.dictionaries[l].terms.dailyOffersPerPool;
  assert.ok(!renderData(w.ids.get('shops:shopoffercatalog_gold'),l,w).includes(label));
  const shop=renderData(w.ids.get('shops:shopoffercatalog_ducarin'),l,w);
  assert.ok(shop.includes(label));assert.ok(shop.includes(w.dictionaries[l].terms.fullGameRequired));
  for(const pool of ['B','C','D'])assert.ok(shop.includes(` ${pool}</h3>`));
  for(const slot of w.groups.slots)assert.ok(renderData(slot,l,w).includes(w.dictionaries[l].terms.recipeStorage));
 }
});
test('variants are distinguishable without save IDs and life skills share a category',async()=>{
 const w=await loaded;
 for(const l of w.manifest.locales){
  for(const kind of ['monsters','locations']){
   const variants=(kind==='monsters'?['0006c_a','0006c_b','0006c_c']:['chm0001a','chm0001b','chm0001c']).map(id=>w.ids.get(`${kind}:${id}`));
   assert.equal(new Set(variants.map(e=>e.names[l])).size,3);
  }
  assert.equal(listRecord(w.ids.get('skills:life.cooking'),l,w).type,listRecord(w.ids.get('skills:life.mining'),l,w).type);
  assert.equal(new Set(w.groups.monsters.map(e=>e.names[l])).size,w.groups.monsters.length);
 }
});
test('skill pagination preserves every action and overview values move into its rows',async()=>{
 const w=await loaded;
 const pages=w.pages.filter(p=>p.locale==='ko'&&p.entity?.wikiId==='skills:life.painting');
 assert.equal(pages.length,5);assert.ok(pages.every(p=>p.skillActionIds.length<=50));
 assert.equal(new Set(pages.flatMap(p=>p.skillActionIds)).size,205);
 assert.equal(pages[1].url,'/iris/wiki/ko/skills/life.painting/actions/page/2/');
 for(const id of ['skills:life.expedition','skills:life.cartography']){
  assert.equal(renderSpecial(w.ids.get(id),'ko',w),'');
  for(const actionId of w.skillActions.get(id))assert.ok(listRecord(w.ids.get(actionId),'ko',w).summary);
 }
 assert.ok(new Set(w.skillActions.get('skills:life.painting').map(id=>listRecord(w.ids.get(id),'ko',w).type)).size>1);
});
test('special tables describe static values and related links group by document',async()=>{
 const w=await loaded;
 const writing=renderData(w.ids.get('skills:life.writing'),'ko',w);
 assert.ok(!writing.includes('위 3가지'));assert.ok(!writing.includes('마지막 페이지까지'));
 assert.match(writing,/자동 재배정 기준 수행 횟수/);assert.match(writing,/1,000/);
 const stealth=renderData(w.ids.get('actions:ste0002'),'ko',w);
 assert.match(stealth,/<h3>성공 확률<\/h3>/);assert.match(stealth,/<th scope="col">손재주 보너스/);
 const painting=renderData(w.ids.get('skills:life.painting'),'ko',w);
 assert.ok(!painting.includes('+3% /'));assert.match(painting,/<details/);
 const related=renderRelationSections(w.ids.get('skills:life.writing'),'ko',w).find(s=>s.id==='related');
 const urls=[...related.html.matchAll(/href="([^"]+)"/g)].map(x=>x[1]);assert.equal(urls.length,new Set(urls).size);
});
test('grouping source links retains each repeated reward roll in the rendered details',async()=>{
 const w=await loaded,item=w.ids.get('items:mn0026'),source=w.groups.monsters[0];
 const relation={source:source.wikiId,target:item.wikiId,role:'rewards',field:'test.reward',context:{quantity:[2,3],probability:.25,model:'independent'}};
 const html=renderRelationSections(item,'en',{...w,reverse:new Map([[item.wikiId,[relation,{...relation,field:'test.reward2'}]]])}).find(s=>s.id==='sources').html;
 assert.equal((html.match(/25%/g)??[]).length,2);
 assert.equal((html.match(new RegExp(`monsters/${source.slug}/`,'g'))??[]).length,1);
});
