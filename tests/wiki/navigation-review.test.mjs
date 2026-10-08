import test from 'node:test';
import assert from 'node:assert/strict';
import { readState,stateUrl,paginate,rangeText } from '../../src/wiki/client/browse-state.mjs';
import { prepare,search } from '../../src/wiki/client/search.mjs';
import { loadWiki,searchIndex } from '../../scripts/wiki/model.mjs';
import { renderRelationSections,renderData } from '../../scripts/wiki/render.mjs';

test('browse URLs round-trip filters, sorting, page and anchor under a base path',()=>{
 const current='https://example.com/game/iris/wiki/ko/skills/life.painting/actions/page/5/#skill-actions';
 assert.equal(readState(current).page,5);
 const state={...readState(current),q:'광산 & 숲',type:'일반 적',minLevel:10,sort:'name',page:2,rarity:'레어',skill:'그림'};
 const result=stateUrl(current,'/game/iris/wiki/ko/skills/life.painting/',state);
 assert.deepEqual(readState(new URL(result,current)),state);
 assert.ok(result.endsWith('#skill-actions'));
 const cleared=stateUrl(current,'/game/iris/wiki/ko/skills/life.painting/',readState('https://example.com/'));
 assert.ok(!cleared.includes('?'));
 assert.equal(readState('https://example.com/?page=-2&sort=invalid&minLevel=bad').page,1);
});
test('all matches remain reachable and pagination reports a clamped visible range',()=>{
 const documents=prepare(Array.from({length:137},(_,i)=>({id:`skill:${i}`,gameId:String(i),name:`Skill ${i}`,names:[],description:''})));
 const result=search(documents,'skill');assert.equal(result.length,137);
 const pages=[1,2,3].map(p=>paginate(result,p));
 assert.deepEqual(pages.map(p=>[p.start,p.end]),[[1,50],[51,100],[101,137]]);
 assert.equal(new Set(pages.flatMap(p=>p.rows.map(r=>r.id))).size,137);
 assert.equal(paginate(result,999).page,3);
 const empty=paginate([],5);assert.equal(empty.page,1);assert.equal(empty.start,0);assert.equal(empty.end,0);
 assert.equal(rangeText('{total}개 중 {start}–{end}개 표시',pages[1],'ko'),'137개 중 51–100개 표시');
});
const loaded=loadWiki();
test('real Korean search exposes the seven results beyond the former cap',async()=>{
 const w=await loaded,docs=prepare(searchIndex(w.entities.filter(e=>!w.mergedInto.has(e.wikiId)),'ko',w.config,w.dictionaries.ko));
 const result=search(docs,'스킬');assert.equal(result.length,87);
 assert.equal(paginate(result,2).rows.length,37);
});
test('source rows group by destination while every expedition reward context survives',async()=>{
 const w=await loaded,html=renderRelationSections(w.ids.get('currencies:gold'),'ko',w).find(s=>s.id==='sources').html;
 const urls=[...html.matchAll(/href="([^"]+)"/g)].map(m=>m[1]);assert.equal(urls.length,new Set(urls).size);
 assert.equal(urls.filter(u=>u.endsWith('/actions/epdg0001/')).length,1);
 const expected=(w.derived.get('actions:epdg0001')??[]).filter(r=>r.target==='currencies:gold');assert.equal(expected.length,9);
 const row=html.split('href="/iris/wiki/ko/actions/epdg0001/"')[1].split('</details>')[0];
 assert.equal((row.match(/<li>/g)??[]).length,9);
 for(const relation of expected)assert.ok(row.includes(relation.context.timing.split(' ')[1]));
});
test('skill-related equipment shows both bonuses and equip requirements without changing details',async()=>{
 const w=await loaded;
 for(const l of w.manifest.locales){
  const html=renderRelationSections(w.ids.get('skills:life.painting'),l,w).find(s=>s.id==='related').html;
  const row=html.split('href="/iris/wiki/'+l+'/items/specomb0045/"')[1].split('</li>')[0];
  assert.ok(row.includes(w.dictionaries[l].terms.equipmentRequirement));assert.ok(row.includes('95'));assert.ok(row.includes('+10%'));
  const detail=renderData(w.ids.get('items:specomb0045'),l,w);
  assert.ok(detail.includes('field-idleSkillBonuses'));assert.ok(detail.includes('field-levelRequirements'));assert.ok(detail.includes('field-equipmentModifiers'));
 }
});
