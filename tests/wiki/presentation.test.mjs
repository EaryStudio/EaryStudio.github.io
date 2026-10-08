import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import { loadWiki } from '../../scripts/wiki/model.mjs';
import { renderData, renderRelations, renderRelationSections, listRecord, modifierValue } from '../../scripts/wiki/render.mjs';
import { publicData, effectiveCurrency, sortEntities } from '../../scripts/wiki/presentation.mjs';

const loaded=loadWiki();
test('sources and uses are separated by actual rewards and costs',async()=>{
  const w=await loaded;
  for(const locale of w.manifest.locales){
    const inspiration=renderRelationSections(w.ids.get('currencies:inspiration'),locale,w);
    const sources=inspiration.find(s=>s.id==='sources'),uses=inspiration.find(s=>s.id==='uses');
    assert.match(sources.html,/actions\/ip0001\//);
    assert.ok(!sources.html.includes('actions/cmpa0010/'));
    assert.match(uses.html,/actions\/cmpa0010\//);
    assert.ok(!uses.html.includes('actions/ip0001/'));
    assert.match(sources.html,/data-section relation-panel/);
    const ticket=renderRelationSections(w.ids.get('items:ticket0001'),locale,w);
    assert.match(ticket.find(s=>s.id==='sources').html,/offers\/g0007\//);
    assert.match(ticket.find(s=>s.id==='uses').html,/museum\/museum\//);
  }
  const chest=w.groups.items.find(e=>e.relations.some(r=>r.role==='rewards'));
  const contents=chest.relations.find(r=>r.role==='rewards').target;
  const chestSections=renderRelationSections(chest,'en',w);
  assert.ok(chestSections.find(s=>s.id==='uses').html.includes(`/${w.ids.get(contents).slug}/`));
  assert.ok(w.config.communityLinks.every(link=>link.url.startsWith('https://')));
});
test('all published detail and list values have six-language presentation adapters',async()=>{
  const wiki=await loaded;
  for(const locale of wiki.manifest.locales)for(const e of wiki.entities){
    if(e.kind==='patch-notes')continue;
    const data=renderData(e,locale,wiki),related=renderRelations(e,locale,wiki);
    assert.ok(!`${data}${related}`.includes('[object Object]'),e.wikiId);
    assert.ok(!/undefined|NaN/.test(`${data}${related}`),e.wikiId);
    assert.ok(listRecord(e,locale,wiki).type);
  }
});
test('inactive union fields cannot imply extra unlock routes, drops or prices',async()=>{
  const w=await loaded, rabbit=w.ids.get('familiars:fam0011'),boss=w.ids.get('monsters:0010c_c'),offer=w.ids.get('offers:chshop_skill_cap_115');
  const d=publicData(rabbit);
  assert.equal(d.idleUnlockChance01,.002);
  assert.ok(!('combatUnlockChance01'in d));assert.ok(!('objectiveUnlockChance01'in d));
  assert.match(renderData(rabbit,'ko',w),/0\.2%/);
  assert.ok(!('resourceKind'in publicData(boss)));
  for(const skill of publicData(boss).skills)for(const effect of skill.effects){if(effect.effectType==='AreaAttack'){assert.ok(effect.areaAttack);assert.ok(!effect.heal);assert.ok(!effect.summon);}}
  assert.equal(effectiveCurrency(offer.data),'currencies:challenge.rewind_thread');
  assert.match(renderData(offer,'ko',w),/되감기 실타래/);
  assert.ok(!renderData(offer,'ko',w).includes('Gold'));
  const objective=renderData(w.ids.get('objectives:mo0002'),'ko',w);
  assert.ok(!objective.includes('Daily Reveal'));assert.ok(!objective.includes('Unlock Kind'));
});
test('progression lists have numeric order and real no-JavaScript pagination',async()=>{
  const w=await loaded;
  const floors=sortEntities(w.groups.challenges,'ko').filter(e=>e.data.floor);
  assert.deepEqual(floors.map(e=>e.data.floor),Array.from({length:100},(_,i)=>i+1));
  const main=sortEntities(w.groups.objectives,'ko').filter(e=>e.data.category==='Main');
  assert.equal(main[0].data.mainOrder,1);assert.equal(main[1].data.mainOrder,2);
  const pages=w.pages.filter(p=>p.locale==='ko'&&p.kind==='items');
  assert.equal(pages.length,19);assert.ok(pages.every(p=>p.entities.length<=50));
  assert.equal(new Set(pages.flatMap(p=>p.entities.map(e=>e.wikiId))).size,941);
  assert.equal(pages[1].url,'/iris/wiki/ko/items/page/2/');
  const maze=w.groups.challenges.filter(e=>e.data.mazeId==='REWIND_LABYRINTH_001');
  assert.equal(new Set(maze.map(e=>e.names.ko)).size,3);
  assert.ok(maze.some(e=>e.names.ko.endsWith(' · 입문')));
});
test('game vocabulary is sourced from exported StringTables and raw snapshot stays intact',async()=>{
  const w=await loaded;
  assert.equal(w.dictionaries.ko.terms['enum.rarity.Rare'],'레어');
  assert.equal(w.dictionaries.ko.terms['enum.rarity.Epic'],'에픽');
  assert.equal(w.dictionaries.ko.terms['enum.validSlots.Chest'],'상의');
  const raw=JSON.parse(await fs.readFile('data/iris/entities/challenges.json','utf8'));
  assert.equal(raw.find(e=>e.wikiId==='challenges:challenge').names.ko,'Challenge');
  assert.equal(w.ids.get('challenges:challenge').names.ko,'도전');
  assert.equal(renderRelations(w.ids.get('statistics:stat_action_total'),'ko',w),'');
  assert.ok(!renderData(w.ids.get('statistics:stat_action_total'),'ko',w).includes('export'));
  const skill=renderData(w.ids.get('skills:life.camping'),'ko',w);
  assert.ok(!skill.includes('Exp To Next By Level'));
  assert.match(skill,/<details class="content-details"><summary>레벨/);
});

test('recipe lifecycle, unlock targets and modifiers preserve gameplay meaning',async()=>{
  const w=await loaded;
  const recipe=renderData(w.ids.get('recipes:fwd0006'),'ko',w);
  assert.match(recipe,/recipe-stage/);
  assert.match(recipe,/2 시간/);
  assert.match(recipe,/9,640/);
  assert.ok(!recipe.includes('보관 한도'));
  const unlock=renderData(w.ids.get('objectives:mo0010'),'ko',w);
  assert.match(unlock,/skills\/life.stealth/);
  assert.equal(modifierValue({statType:'MaxHP',modType:'FinalPercent',value:10},'ko',w),'×1.1');
  assert.equal(modifierValue({statType:'CritChance',modType:'Flat',value:15},'ko',w),'+15%p');
  assert.equal(modifierValue({statType:'AttackInterval',modType:'Flat',value:-.5},'ko',w),'-0.5 초');
  assert.ok(!w.reverse.get('stats:maxhp').some(r=>r.source==='achievements:ach_3star_dg0003'));
  const boss=publicData(w.ids.get('monsters:0010c_c'));
  assert.ok(!('attackIntervalOverride' in boss.attack1));
});
