import { escape, table, fold, link, number, valueHtml } from './render.mjs';
import { locales, term } from './presentation.mjs';
import { plain } from './model.mjs';

export function gameText(w,l,key,args=[]) {
 const raw=w.gameStrings.get(l)[key];
 if(!raw)throw new Error(`Missing special-action game text: ${key}/${l}`);
 const text=raw.replace(/\{(\d+)(?::[^{}]+)?\}/g,(_,i)=>{if(args[i]===undefined)throw new Error(`Missing game format argument: ${key}/${i}`);return String(args[i]);});
 if(/[{}]/.test(text))throw new Error(`Unsupported game format: ${key}`);
 return plain(text);
}
export function renderSpecial(e,l,w){
 const ui=w.dictionaries[l],s=e.data.special,skill=e.kind==='skills'?e.wikiId:e.data.skill?.ref;
 const t=k=>{const text=w.specialLabels[k]?.[locales.indexOf(l)];if(!text)throw new Error(`Missing special label: ${k}/${l}`);return text;};
 const g=(key,...args)=>gameText(w,l,key,args),n=v=>number(v,l),pct=v=>`${n(Number((v*100).toFixed(2)))}%`,pc=v=>`${n(v)}%`,sec=v=>`${n(v)} ${term('second',l,w)}`;
 const ref=id=>link(id,l,w,true),by=(kind,id)=>{const x=w.byGameId.get(`${kind}:${id}`);if(!x)throw new Error(`Missing special reference: ${kind}:${id}`);return ref(x.wikiId);};
 const box=(title,body)=>body?`<section class="data-section special-data"><h3>${escape(title)}</h3>${body}</section>`:'';
 const cells=rows=>table([t('conditions'),t('result')],rows.map(([a,b])=>[escape(a),b]));
 const settings=name=>{const d=w.systems.get(name);if(!d)throw new Error(`Missing special settings: ${name}`);return d;};
 const ranks=['F','E','D','C','B','A','S','SS','SSS'];
 let html='';
 if(e.kind==='skills'&&['skills:life.enchanting','skills:life.cartography','skills:life.meditation','skills:life.rest','skills:life.expedition'].includes(skill)){
  const actions=(w.skillActions.get(e.wikiId)??[]).map(id=>w.ids.get(id)).filter(x=>x.kind==='actions');
  if(['skills:life.cartography','skills:life.expedition'].includes(skill))return '';
  if(skill==='skills:life.rest')return actions.map(a=>box(a.names[l],valueHtml(a.data.bindings?.[0]?.configByRank,l,w,'configByRank'))).join('');
  return actions.filter(a=>a.gameId!=='ECT0004').map(a=>box(a.names[l],ref(a.wikiId)+fold(ui.terms.details,renderSpecial(a,l,w)))).join('');
 }
 if(skill==='skills:life.enchanting'){
  if(e.kind==='actions'&&e.gameId!=='ECT0004'){
   if(s?.kind!=='enchanting')throw new Error(`Missing enchanting export: ${e.wikiId}`);
   const chanceHeaders=['SUCCESS','FAIL','GREAT_FAIL'].map(k=>g(`Enchanting/UI_ENCHANTING_${k}_CHANCE_FORMAT`,'').replace(/[%：:]\s*$/,'').trim());
   const bands=[];for(const row of s.levels){const last=bands.at(-1);if(last&&['success','fail','greatFail'].every(k=>row[k]===last[k]))last.end=row.level;else bands.push({...row,end:row.level});}
   html+=box(t('result'),`<p>${escape(g(`Enchanting/UI_ENCHANTING_${e.gameId}_ACTION_DESC`))}</p>`+table([t('currentLevel'),...chanceHeaders],bands.map(r=>[`+${r.level}–+${r.end}`,pct(r.success),pct(r.fail),pct(r.greatFail)]))+`<h4>${escape(t('levelChange'))}</h4>`+table(chanceHeaders,[['+1','0','−1']])+
    `<p>${escape(g('Enchanting/UI_ENCHANTING_MAX_LEVEL'))}: +${s.levels.at(-1).level+1}</p><p>${escape(g('Enchanting/UI_ENCHANTING_EQUIPMENT_DETAILS'))}</p>`);
   html+=box(t('materials'),s.inputMaterials.map(x=>ref(x.ref)).join(' · ')+fold(t('currentLevel'),table([t('currentLevel'),...s.inputMaterials.map(x=>plain(w.ids.get(x.ref).names[l]))],s.levels.map(r=>[`+${r.level}`,...s.inputMaterials.map(()=>n(r.amount))]))));
  }
 }
 if(skill==='skills:life.painting'){
  const d=settings('painting');
  if(e.kind==='actions'){
   if(s?.kind!=='painting')throw new Error(`Missing painting export: ${e.wikiId}`);
   html+=box(t('target'),ref(s.target.ref));
   html+=box(ui.fields.inputCosts,table([ui.fields.itemId,ui.fields.amount],s.inputCosts.map(r=>[ref(r.item.ref),n(r.amount)])));
   html+=box(ui.fields.rewardTable,table([ui.fields.itemId,ui.fields.amount,ui.baseChance],s.outputs.map(r=>[ref(r.item.ref),n(r.amount),pct(r.probability)])));
  }
  if(e.kind==='skills'){
   let speed=0,xp=0,double=0;
   const rows=d.milestoneBonuses.map(r=>{speed+=r.speedPercent;xp+=r.xpPercent;double+=r.doubleAwardChancePercent;return {threshold:n(r.threshold),added:[r.speedPercent,r.xpPercent,r.doubleAwardChancePercent],total:[speed,xp,Math.min(100,double)]};});
   const headers=[g('Painting/UI_PAINTING_MILESTONE_ROW_THRESHOLD_FORMAT',''),...['SPEED','XP','DOUBLE_CHANCE'].map(k=>g(`Painting/UI_PAINTING_MILESTONE_BONUS_${k}`))];
   html+=box(g('Painting/UI_PAINTING_MILESTONE_PROGRESS_REACHED_TIER'),fold(t('totalBonus'),table(headers,rows.map(r=>[r.threshold,...r.total.map(pc)])))+fold(t('perMilestone'),table(headers,rows.map(r=>[r.threshold,...r.added.map(v=>`+${pc(v)}`)]))));
  }else html+=box(term('sharedSkillData',l,w),ref(skill));
 }
 if(skill==='skills:life.writing'){
  const d=settings('writing');
  for(const i of [1,2]){
   if(e.kind==='actions'&&e.gameId!==d[`action${i}Id`])continue;
   const p=`action${i}`,costs=[[by('currencies',d.inspirationCurrencyId),n(d[p+'InspirationCost'])],[`${escape(g('Writing/UI_WRITING_REROLL'))} · ${by('currencies',d.goldCurrencyId)}`,n(d[p+'ResetGoldCost'])]];
   const excluded=[d.writingSkillId,d.restSkillId,...d[p+'AdditionalExcludedSkillIds']];
   const output=i===1?[[term('speedPercent',l,w),`+${pc((d.action1BoostSpeedMultiplier-1)*100)}`],[t('duration'),`${n(d.action1BoostDurationSeconds/60)} ${escape(term('minute',l,w))}`]]:[[term('xpMultiplier',l,w),`×${n(d.action2GrantExpMultiplier)}`],[t('autoRerollThreshold'),n(d.action2AutoRerollCompletionCount)]];
   // WritingRuntime.Roll uses Mathf.Min(3, candidates.Count) in release 0.56.
   html+=box(w.byGameId.get(`actions:${d[p+'Id']}`).names[l],cells([[t('assignedSkills'),'≤ 3'],...output,[t('requiredCount'),n(d[p+'RequiredCountPerSkill'])],[t('excluded'),excluded.map(id=>by('skills',id)).join(' · ')]])+(i===2?`<p>${escape(g('Writing/UI_WRITING_ACTION2_OUTPUT_DESC_FORMAT',n(d.action2GrantExpMultiplier)))}</p>`:'')+table([ui.fields.inputCosts,ui.fields.amount],costs));
  }
 }
 if(skill==='skills:life.commerce'){
  const d=settings('commerce'),idx=d.commodityTradeActionIds.indexOf(e.gameId),rankValue=(field,rank)=>d[field].find(r=>r.rank===rank)?.value??0;
  for(const i of [1,2,3]){
   const id=d[['','action1InstantSaleId','action2ListToGoldId','action3ListToDucarinId'][i]];
   if(e.kind==='actions'&&e.gameId!==id)continue;
   const field=['','action1SellBonusPercentByRank','action2SellBonusPercentByRank','action3DucarinByRank'][i];
   html+=box(w.byGameId.get(`actions:${id}`).names[l],table([t('rank'),i===3?w.byGameId.get(`currencies:${d.ducarinCurrencyId}`).names[l]:t('bonus')],ranks.map(rank=>[rank,i===3?n(rankValue(field,rank)):`+${pc(rankValue(field,rank))}`])));
   if(i===2)html+=box(g('Commerce/UI_COMMERCE_ACTION2_OUTPUT'),`<p>⌊⌊${escape(ui.fields.sellPrice)} × (100% + ${by('actions',d.action1InstantSaleId)})⌋ × (100% + ${by('actions',d.action2ListToGoldId)})⌋ ≥ ${n(d.minimumGoldFromAction2)} ${by('currencies','gold')}</p>`);
  }
  if(e.kind==='skills'||idx>=0){
   if(!d.special?.candidates)throw new Error('Missing commodity candidate export');
   const modes=idx<0?['Sell','Buy']:[d.commodityTradeModesBySlot[idx]];
   const weekday=new Intl.DateTimeFormat(l,{weekday:'long',timeZone:'UTC'}).format(new Date(Date.UTC(2023,0,1+d.special.resetDay)));
   html+=box(t('conditions'),cells([[t('weeklyReset'),`${escape(weekday)} ${String(d.special.resetHour).padStart(2,'0')}:${String(d.special.resetMinute).padStart(2,'0')}`],[ui.fields.amount,n(d.commodityBatchItemCount)],[t('baseConversion'),`×${n(d.commodityBaseDucarinRateFromGoldSellPrice)}`]]));
   for(const mode of modes){const buy=mode==='Buy',title=g(`Commerce/UI_COMMERCE_COMMODITY_${mode.toUpperCase()}_MODE`),depth=buy?d.commodityBuySupplyDepthCompletions:d.commoditySellDemandDepthCompletions;
    html+=box(title,cells([[t('capacity'),n(depth)],...(buy?[[t('priceCap'),pc(d.commodityBuyMaxPricePercent)]]:[[t('specialMaximum'),pc(d.commoditySellMaxSpecialPricePercent)]])])+fold(t('rank'),table([t('rank'),buy?t('buyMarkup'):t('salePremium'),buy?'':t('specialMinimum'),buy?'':t('rankConversion')].filter(Boolean),ranks.map(rank=>buy?[rank,`+${pc(rankValue('commodityBuyMarkupPercentByRank',rank))}`]:[rank,`+${pc(rankValue('commoditySellPremiumPercentByRank',rank))}`,`+${pc(rankValue('commodityMinimumSpecialAdvantagePercentByRank',rank))}`,pc(rankValue('commodityDucarinPercentByRank',rank))])))+
     fold(t('candidateItems'),table([ui.fields.itemId,ui.fields.sellPrice,...(buy?[t('initialPrice')]:[])],d.special.candidates[mode].map(r=>[ref(r.ref),n(w.ids.get(r.ref).data.sellPrice),...(buy?[pc(d.commodityBuyPricePercentByItem.find(p=>p.item.ref===r.ref)?.value??100)]:[])])))+
     fold(t('priceConditions'),`<p>${by('currencies',d.ducarinCurrencyId)} · ${escape(ui.fields.amount)} ${n(d.commodityBatchItemCount)}</p>`+table([ui.fields.itemId,t('rank'),t('specialRank'),...[0,Math.floor(depth/2),depth-1].map(x=>`${t('completed')}: ${n(x)}`)],d.special.quotes[mode].map(r=>[ref(r.item.ref),r.rank,r.specialRank,...r.values.map(n)]))));
   }
  }
 }
 if(skill==='skills:life.stealth'&&s){
  const common=w.ids.get(skill).data.special;if(!common?.ranks)throw new Error('Missing stealth ranks');
  html+=box(t('rank'),table([t('rank'),t('dexterityBonus'),t('failureWait')],common.ranks.map(r=>[r.rank,n(r.bonus),sec(r.seconds)])));
  html+=box(t('levelBonus'),fold(ui.fields.level,table([ui.fields.level,t('dexterityBonus')],common.levels.map(r=>[n(r.level),n(r.bonus)]))));
  if(s.chances)html+=box(t('successChance'),table([t('effectiveDexterity'),...ranks],s.chances.map(r=>[n(r.dexterity),...r.chances.map(pct)])));
 }
 for(const b of e.data.bindings??[]){
  if(b.$type==='CartographyAreaBindingSO'){
   if(!Number.isFinite(b.unlockChance))throw new Error('Missing cartography unlock chance');
   html+=box(t('result'),ref(b.area.ref)+`<p>${escape(g('Cartography/UI_CARTOGRAPHY_UNLOCK_CHANCE_FORMAT',n(b.unlockChance*100)))}</p>`);
  }
  if(b.$type==='MeditationActionEffectBindingSO'&&b.consecutiveBuffByRank?.length){
   if(b.consecutiveBuffByRank.some(r=>!Number.isFinite(r.requiredConsecutiveCount)||!Number.isFinite(r.durationSeconds)))throw new Error('Missing meditation conditions');
   html+=box(g('Meditation/UI_IDLE_MEDITATION_STREAK_BUFF'),table([t('rank'),t('consecutive'),ui.terms.globalSkillSpeedPercent??t('bonus'),t('duration')],b.consecutiveBuffByRank.map(r=>[r.rank,n(r.requiredConsecutiveCount),pc(r.globalSkillSpeedPercent),sec(r.durationSeconds)])));
  }
  if(b.$type==='ExpeditionAreaBindingSO'){
   const area=w.ids.get(b.area.ref),d=area.data;
   html+=box(t('conditions'),ref(area.wikiId)+table([t('stars'),ui.fields.baseDurationSeconds],[[2,sec(d.twoStarMaxClearTimeSeconds)],[3,sec(d.threeStarMaxClearTimeSeconds)]]));
   const sources=[];
   for(const [i,spawn]of d.enemySpawns.entries()){
    const enemy=w.ids.get(spawn.enemyData.ref),ed=enemy.data,resource=ed.enemyType==='Resource';
    for(const [fail,reward]of [[false,ed.rewardTable],[true,ed.resourceDropFailTable]])if(reward&&(!fail||resource))sources.push(`<h4>${i+1}. ${ref(enemy.wikiId)}${resource?` · ${escape(t('resourceLevel'))} ${fail?'&lt;':'≥'} ${n(ed.resourceLevel)}`:''}</h4>${valueHtml(reward,l,w)}`);
   }
   if(d.clearRewardTable)sources.push(`<h4>${escape(term('areaClear',l,w))}</h4>${valueHtml(d.clearRewardTable,l,w)}`);
   html+=box(ui.fields.rewardTable,fold(ui.fields.enemySpawns,sources.join('')));
  }
 }
 if(skill==='skills:life.camping')html+=box(t('result'),`<p>${escape(t('maxActiveBonus'))}</p>`);
 return html;
}
