import test from 'node:test';
import assert from 'node:assert/strict';
import { loadWiki } from '../../scripts/wiki/model.mjs';
import { renderData } from '../../scripts/wiki/render.mjs';
import { gameText, renderSpecial } from '../../scripts/wiki/special-actions.mjs';

const loaded=loadWiki();
test('release enchanting tables cover every executable level and preserve action outcomes',async()=>{
 const w=await loaded;
 const normal=w.ids.get('actions:ect0001').data.special;
 const careful=w.ids.get('actions:ect0002').data.special;
 const guard=w.ids.get('actions:ect0003').data.special;
 for(const s of [normal,careful,guard]){
  assert.deepEqual(s.levels.map(r=>r.level),Array.from({length:99},(_,i)=>i));
  for(const r of s.levels){assert.ok(Math.abs(r.success+r.fail+r.greatFail-1)<1e-6);assert.equal(r.amount,r.level+1);}
 }
 assert.ok(Math.abs(careful.levels[31].success-.6)<1e-6);
 assert.ok(Math.abs(careful.levels[31].fail-.3)<1e-6);
 assert.ok(guard.levels.every(r=>r.greatFail===0));
 assert.equal(normal.inputMaterials.length,1);assert.equal(careful.inputMaterials.length,2);
 assert.ok(!w.ids.get('actions:ect0004').data.special);
});
test('all painting actions expose costs, output probabilities and real target references',async()=>{
 const w=await loaded,actions=w.groups.actions.filter(e=>e.data.skill?.ref==='skills:life.painting');
 assert.equal(actions.length,205);
 for(const e of actions){const s=e.data.special;assert.ok(w.ids.has(s.target.ref));assert.equal(s.outputs.length,5);
  assert.ok(Math.abs(s.outputs.reduce((sum,r)=>sum+r.probability,0)-1)<1e-6);
  assert.equal(s.inputCosts[1].amount,s.inputCosts[0].amount*5);
  assert.ok(s.outputs.every(r=>w.ids.has(r.item.ref)&&r.amount===s.inputCosts[0].amount));
  assert.ok(e.relations.some(r=>r.role==='consumes'&&r.target==='currencies:inspiration'));
 }
});
test('market quotes retain rank conditions, eligible pools, depletion direction and last executable sale',async()=>{
 const w=await loaded,d=w.systems.get('commerce');
 assert.equal(d.special.resetDay,6);assert.equal(d.special.resetHour,21);
 for(const mode of ['Sell','Buy']){
  const ids=new Set(d.special.candidates[mode].map(r=>r.ref));
  for(const id of ids){assert.equal(w.ids.get(id).data.rarity,'Normal');assert.ok(w.ids.get(id).data.sellPrice>0);}
  for(const q of d.special.quotes[mode]){
   assert.ok(ids.has(q.item.ref));assert.ok(['F','SSS'].includes(q.rank));assert.ok(['F','SSS'].includes(q.specialRank));
   assert.equal(q.values.length,3);assert.ok(q.values.every(v=>Number.isInteger(v)&&v>0));
   if(mode==='Buy')assert.ok(q.values[0]<=q.values[1]&&q.values[1]<=q.values[2]);
   else {assert.ok(q.values[0]>=q.values[1]&&q.values[1]>=q.values[2]);assert.equal(q.values[2],d.action3DucarinByRank.find(r=>r.rank===q.specialRank).value*d.commodityBatchItemCount);}
  }
 }
});
test('cartography and meditation required execution fields survive the export',async()=>{
 const w=await loaded;let cartography=0,meditation=0;
 for(const action of w.groups.actions)for(const b of action.data.bindings??[]){
  if(b.$type==='CartographyAreaBindingSO'){cartography++;assert.ok(b.unlockChance>0&&b.unlockChance<=1);}
  if(b.$type==='MeditationActionEffectBindingSO')for(const r of b.consecutiveBuffByRank??[]){meditation++;assert.ok(r.requiredConsecutiveCount>0);assert.ok(r.durationSeconds>0);}
 }
 assert.equal(cartography,48);assert.ok(meditation>0);
});
test('stealth probabilities and expedition durations retain their input conditions',async()=>{
 const w=await loaded,common=w.ids.get('skills:life.stealth').data.special;
 assert.equal(common.levels[0].bonus,0);assert.equal(common.levels.at(-1).bonus,98);
 assert.equal(common.ranks[0].seconds,10);assert.equal(common.ranks.at(-1).seconds,6);
 const stealth=w.groups.actions.filter(a=>a.data.special?.kind==='stealth');assert.equal(stealth.length,28);
 for(const a of stealth){let previous;
  for(const row of a.data.special.chances){
   assert.equal(row.chances.length,9);
   row.chances.forEach((value,i)=>{assert.ok(value>=0&&value<=1);if(i)assert.ok(value>=row.chances[i-1]);if(previous)assert.ok(value>=previous[i]);});
   previous=row.chances;
  }
 }
 const expedition=w.groups.actions.find(a=>a.data.bindings?.some(b=>b.$type==='ExpeditionAreaBindingSO'));
 const html=renderData(expedition,'ko',w);assert.match(html,/지역 별 수/);assert.match(html,/<td>2<\/td>/);assert.match(html,/<td>3<\/td>/);
 assert.ok(!html.includes('<dt>기본 시간</dt>'),'raw fallback time must not contradict the star-dependent durations');
});
test('special action information is statically readable in all six languages without resurrecting system pages',async()=>{
 const w=await loaded;
 for(const locale of w.manifest.locales){
  for(const id of ['actions:ect0002','actions:com0004','actions:com0005','actions:wrt0001','actions:wrt0002','actions:med0001','actions:ctgd0001','actions:ptg_area_dg0001']){
   const html=renderData(w.ids.get(id),locale,w);assert.match(html,/special-data/);assert.match(html,/<table>/);assert.doesNotMatch(html,/undefined|NaN|\{\d/);
  }
  assert.match(renderSpecial(w.ids.get('skills:life.enchanting'),locale,w),/60%/);
 }
 assert.ok(!w.pages.some(p=>p.entity?.kind==='systems'));
 assert.throws(()=>gameText(w,'ko','Writing/UI_WRITING_ACTION1_OUTPUT_DESC_FORMAT',[]),/argument/);
});
