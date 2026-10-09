import { plain, route } from './model.mjs';
import { publicData, projectValue, effectiveCurrency, term, enumText, listType, levelOf, pick, locales } from './presentation.mjs';
import { relationSection } from './relations.mjs';
import { renderSpecial } from './special-actions.mjs';
export const escape = v => String(v ?? '').replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
export const label = name => name.replace(/([a-z0-9])([A-Z])/g, '$1 $2');
const aliases={progressionSkill:'skill',unlockIdleSkillId:'skill',unlockRequiredSkillId:'skill',targetSkillId:'skill',specificProgressionSkills:'specificSkills',specificSkillIds:'specificSkills',combatStatModifiers:'modifiers',statModifiers:'modifiers',enemyData:'enemyId',equipItemIds:'itemId',entryConsumeItemId:'itemId',entryRequiredEquippedItemId:'itemId',unlockObjectiveId:'objectives',unlockTargetId:'unlockKind',actionId:'actions',unlockIdleActionId:'actions',targetSkill:'skill',item:'itemId',area:'areaId',familiar:'familiars',allowedRecipes:'recipes',shopCatalog:'shops',offers:'offers',towerFloors:'tower',mazes:'maze',cycleStoneCurrency:'currency',rewindThreadCurrency:'currency',rankBonuses:'rankStatBonuses',statGrowthBands:'modifiers',enchantLevel:'level',outputPercent:'percent',price:'priceRules'};
export function fieldLabel(key,l,w){const ui=w.dictionaries[l];key=aliases[key]??key;const v=ui.terms[key]??ui.fields[key]??ui[key];if(v===undefined)throw new Error(`Missing field label: ${key}/${l}`);return v;}
const identifier=k=>/(?:^id$|Id$|Ids$|Key$)/.test(k);
function referenceFor(v,k,w){const kind=/currency/i.test(k)?'currencies':/skill/i.test(k)?'skills':/enemy/i.test(k)?'monsters':/area/i.test(k)?'locations':/item/i.test(k)?'items':/action/i.test(k)?'actions':/recipe|passive/i.test(k)?'recipes':/objective/i.test(k)?'objectives':null;return kind?w.byGameId.get(`${kind}:${v}`):null;}
const visible=([k,v],w)=>k!=='$type'&&v!==null&&v!==undefined&&v!==''&&!(Array.isArray(v)&&!v.length)&&(!identifier(k)||(Array.isArray(v)?v:[v]).some(x=>referenceFor(x,k,w)));
export const imageUrl=(i,c)=>i?.sitePath?`${c.basePath}${i.sitePath}#${i.sprite}`:i?`${c.basePath}assets/wiki/${i.path.split('/').pop().replace(/\.png$/,i.width>640||i.height>640?'.webp':'.png')}`:`${c.wikiPath}client/placeholder.svg`;
export function link(id,l,w,icon=false){const e=w.ids.get(id);if(!e)throw new Error(`Unresolved display reference: ${id}`);const parent=['actions','recipes'].includes(e.kind)?w.ids.get(e.data.skill?.ref):null;return `<a${icon?' class="relation-link"':''} href="${route(w.config,l,e)}">${icon?`<img src="${escape(imageUrl(e.image??w.presentationImages?.get(id),w.config))}" alt="" width="32" height="32" loading="lazy">`:''}<span>${escape(plain(e.names[l]))}${parent?` <small class="relation-parent">· ${escape(plain(parent.names[l]))}</small>`:''}</span></a>`;}
const formats=new Map();
export function number(v,l){if(!formats.has(l))formats.set(l,new Intl.NumberFormat(l,{maximumFractionDigits:6}));return formats.get(l).format(v);}
export function modifierValue(modifier,l,w){
 const {value,modType,statType}=modifier,definition=w.byGameId.get(`stats:${statType}`)?.data;
 if(modType==='FinalPercent')return `×${number(1+value/100,l)}`;
 const signed=n=>`${n>0?'+':''}${number(n,l)}`;
 if(modType==='Percent')return `${signed(value)}%`;
 if(definition?.isPercent01)return `${signed(value*100)}%p`;
 if(definition?.isPercent100)return `${signed(value)}%p`;
 if(statType==='AttackInterval')return `${signed(value)} ${escape(term('second',l,w))}`;
 return signed(value);
}
function numeric(v,k,l,w){
 if(k==='storageCapOverride'&&v===0)return escape(term('recipeStorage',l,w));
 if(/HourLocal$/.test(k))return `${String(v).padStart(2,'0')}:00`;
 if(/(?:Chance01|HealthRatio)$/.test(k))return `${number(v*100,l)}%`;
 if(/Percent$|^percent$|^chancePercent$/.test(k))return `${number(v,l)}%`;
 if(/Seconds$|attackIntervalOverride/.test(k)){const u=v>=3600&&v%3600===0?'hour':v>=60&&v%60===0?'minute':'second';return `${number(v/(u==='hour'?3600:u==='minute'?60:1),l)} ${escape(term(u,l,w))}`;}
 if(/Multiplier$|multiplierAt99|multiplierPerStep/.test(k))return `×${number(v,l)}`;
 return number(v,l);
}
export function table(head,rows){return rows.length?`<div class="table-scroll" tabindex="0"><table><thead><tr>${head.map(h=>`<th scope="col">${escape(h)}</th>`).join('')}</tr></thead><tbody>${rows.map(row=>`<tr>${row.map(v=>`<td>${v??'—'}</td>`).join('')}</tr>`).join('')}</tbody></table></div>`:'';}
export const fold=(title,html)=>`<details class="content-details"><summary>${escape(title)}</summary>${html}</details>`;
function rewards(v,l,w){const ui=w.dictionaries[l],chest=v.$type==='ChestRewardProbabilityDataSO',weight=chest?0:v.entries.filter(e=>e.itemId&&Math.max(...e.itemCountRange)>0).reduce((s,e)=>s+e.itemProbability,0),rows=[],percent=n=>`${number(n*100,l)}%`;
 for(const row of v.entries){if(!chest&&row.goldProbability>0&&Math.max(...row.goldRange)>0)rows.push([link('currencies:gold',l,w,true),valueHtml(row.goldRange,l,w,'goldRange'),percent(row.goldProbability)]);
 const id=chest?row.item?.ref:w.byGameId.get(`items:${row.itemId}`)?.wikiId,p=chest?row.probability:row.itemProbability,r=chest?row.quantityRange:row.itemCountRange;
 if(id&&p>0&&Math.max(...r)>0)rows.push([link(id,l,w,true),valueHtml(chest?r.map(n=>Math.max(1,n)):r,l,w,'quantityRange'),percent(!chest&&v.chooseOneItem?p/weight:p)]);}
 return rows.length?`<p class="model-label">${escape(ui.rewardModel)}: ${escape(chest?ui.chest:v.chooseOneItem?ui.weighted:ui.independent)}</p>${chest?`<p>${escape(ui.emptyChest)}</p>`:''}${table([ui.fields.itemId,ui.fields.amount,ui.baseChance],rows)}`:'';
}
export function valueHtml(v,l,w,k=''){
 const ui=w.dictionaries[l];
 if(v===null||v===undefined||v==='')return '—';
 if(typeof v==='boolean')return escape(v?ui.yes:ui.no);
 if(typeof v==='number')return numeric(v,k,l,w);
 if(typeof v==='string'){
  if(identifier(k)){const e=referenceFor(v,k,w);return e?link(e.wikiId,l,w,true):'';}
  const e=k==='statType'?w.byGameId.get(`stats:${v}`):k==='targetPlayerAction'?w.byGameId.get(`combat-actions:${v}`):null;
  return e?link(e.wikiId,l,w):escape(enumText(v,l,w,k));
 }
 if(v.ref)return link(v.ref,l,w,true);
 if(v.path?.startsWith('assets/'))return `<img class="data-sprite" src="${escape(imageUrl(v,w.config))}" alt="" loading="lazy" width="${Math.min(v.width,480)}" height="${Math.round(v.height*Math.min(v.width,480)/v.width)}">`;
 if(Array.isArray(v)){
  if(!v.length)return '';
  if(v.every(x=>x?.ref))return `<ul class="compact-links">${v.map(x=>`<li>${link(x.ref,l,w,true)}</li>`).join('')}</ul>`;
  if(v.every(x=>typeof x!=='object')){const range=/^(quantityRange|itemCountRange|goldRange)$/.test(k);return (range?[...new Set(v)].sort((a,b)=>a-b):v).map(x=>typeof x==='number'?number(x,l):valueHtml(x,l,w,k)).join(range?' – ':k==='boxSize'?' × ':', ');}
  if(v.every(x=>x&&'statType'in x&&'value'in x))return table([ui.fields.statType??ui.stats,ui.fields.value,ui.fields.modType],v.map(x=>[valueHtml(x.statType,l,w,'statType'),modifierValue(x,l,w),valueHtml(x.modType,l,w,'modType')]));
  if(k==='skills')return v.map((x,i)=>fold(`${fieldLabel(k,l,w)} ${i+1}`,valueHtml(x,l,w))).join('');
  const keys=[...new Set(v.flatMap(x=>Object.entries(x??{}).filter(pair=>visible(pair,w)).map(([key])=>key)))];
  if(keys.length<=7)return table(keys.map(key=>fieldLabel(key,l,w)),v.map(x=>keys.map(key=>key in x?valueHtml(x[key],l,w,key):'—')));
  return v.map((x,i)=>fold(`${fieldLabel(k,l,w)} ${i+1}`,valueHtml(x,l,w))).join('');
 }
 if(['RewardProbabilityDataSO','ChestRewardProbabilityDataSO'].includes(v.$type))return rewards(v,l,w);
 const pairs=Object.entries(v).filter(pair=>visible(pair,w));
 return pairs.length?`<dl class="fields">${pairs.map(([key,x])=>`<div><dt>${escape(fieldLabel(key,l,w))}</dt><dd>${valueHtml(x,l,w,key)}</dd></div>`).join('')}</dl>`:'';
}
export function offerPrice(e,l,w){return `${link(effectiveCurrency(e.data),l,w,true)} <strong>${number(e.data.price?.basePrice??0,l)}</strong>`;}
function catalogData(e,l,w){const ui=w.dictionaries[l],d=e.data;
 if(e.kind==='shops'){
  const offers=(d.offers??[]).map(x=>w.ids.get(x.ref));
  const limited=offers.some(o=>o.data.slotPurchaseLimit);
  const rows=items=>table([ui.fields.itemId,ui.fields.amount,term('effectivePrice',l,w),term('priceRules',l,w),...(limited?[ui.fields.slotPurchaseLimit]:[])],items.map(o=>[link(o.wikiId,l,w,true),number(o.data.amount,l),offerPrice(o,l,w),o.data.price.priceKind==='Fixed'?'—':fold(term('priceRules',l,w),valueHtml(projectValue(o.data.price),l,w)),...(limited?[o.data.slotPurchaseLimit?fold(ui.fields.slotPurchaseLimit,valueHtml(o.data.slotPurchaseLimit,l,w)):'—']:[])]));
  const head=valueHtml(projectValue(pick(d,'dailyRefreshHourLocal')),l,w);
  if(e.wikiId!=='shops:shopoffercatalog_ducarin')return head+rows(offers);
  return head+`<p>${escape(term('dailyOffersPerPool',l,w))}: <strong>${number(d.dailyOfferCount,l)}</strong></p>`+Object.entries(Object.groupBy(offers,o=>o.data.ducarinPool)).map(([pool,items])=>`<h3>${escape(term('ducarinPool',l,w))} ${escape(pool)}</h3>${['C','D'].includes(pool)?`<p>${escape(term('fullGameRequired',l,w))}</p>`:''}${fold(`${term('offerCandidates',l,w)} (${items.length})`,rows(items))}`).join('');
 }
 if(e.wikiId==='challenges:challenge'){
  const head=valueHtml(projectValue(Object.fromEntries(Object.entries(d).filter(([k])=>['requiredEnduranceLevel','dailyResetHourLocal','towerDailyLimit','mazeDailyLimit','cycleStoneCurrency','rewindThreadCurrency'].includes(k)))),l,w);
  const floors=(d.towerFloors??[]).map(x=>w.ids.get(x.ref)).sort((a,b)=>a.data.floor-b.data.floor);let tower='';
  for(let i=0;i<floors.length;i+=10)tower+=fold(`${term('tower',l,w)} ${i+1}–${Math.min(i+10,floors.length)}`,valueHtml(floors.slice(i,i+10).map(x=>({ref:x.wikiId})),l,w));
  const mazes=Object.groupBy((d.mazes??[]).map(x=>w.ids.get(x.ref)),x=>x.data.mazeId);
  const maze=Object.values(mazes).map(g=>fold(g[0].names[l].split(' · ')[0],valueHtml([...g].sort((a,b)=>['Novice','Adept','Elite'].indexOf(a.data.difficulty)-['Novice','Adept','Elite'].indexOf(b.data.difficulty)).map(x=>({ref:x.wikiId})),l,w))).join('');
  return `${head}<h3>${escape(term('tower',l,w))}</h3>${tower}<h3>${escape(term('maze',l,w))}</h3>${maze}${d.shopCatalog?`<h3>${escape(ui.shops)}</h3>${valueHtml(d.shopCatalog,l,w)}`:''}`;
 }
 if(e.wikiId==='museum:museum')return valueHtml(projectValue(Object.fromEntries(Object.entries(d).filter(([k])=>['unlockObjectiveId','autoSubmitOnObtainedItemIds'].includes(k)))),l,w)+table([term('requiredSubmittedCount',l,w),ui.fields.rewardTable],(d.milestones??[]).map(x=>w.ids.get(x.ref)).sort((a,b)=>a.data.requiredSubmittedCount-b.data.requiredSubmittedCount).map(m=>[link(m.wikiId,l,w),valueHtml(projectValue(m.data.itemRewards),l,w,'itemRewards')+valueHtml(projectValue(m.data.statRewards),l,w,'statRewards')]));
 return null;
}
export function renderData(e,l,w){
 const special=renderSpecial(e,l,w);
 if(e.data.bindings?.some(b=>b.$type==='ExpeditionAreaBindingSO'))e={...e,data:{...e.data,baseDurationSeconds:undefined}};
 if(e.data.special)e={...e,data:{...e.data,special:undefined}};
 if(e.data.bindings)e={...e,data:{...e.data,bindings:e.data.bindings.filter(b=>!['CartographyAreaBindingSO','ExpeditionAreaBindingSO'].includes(b.$type)).map(b=>b.$type==='MeditationActionEffectBindingSO'?{...b,actionId:undefined,consecutiveBuffByRank:undefined}:b)}};
 if(w.mergedContent?.has(e.wikiId))e={...e,data:{...e.data,
  bindings:e.data.bindings?.filter(b=>!w.mergedInto.has(b.familiar?.ref)),
  onSuccessEffects:e.data.onSuccessEffects?.filter(effect=>!w.mergedInto.has(effect.targetPlayerAction?.ref))}};
 if(w.mergedInto?.has(e.wikiId)&&e.kind==='targets')e={...e,data:{...e.data,actionId:undefined}};
 if(e.kind==='guides')return `<div class="data-section guide-dialogue">${e.data.lines.map(line=>`<blockquote>${line.text[l].speaker?`<cite>${escape(plain(line.text[l].speaker))}</cite>`:''}<p>${escape(plain(line.text[l].content))}</p></blockquote>`).join('')}</div>`;
 if(e.kind==='statistics')return `<div class="data-section"><p>${escape(term('lifetime',l,w))}</p></div>`;
 if(e.kind==='achievements')return '';
 if(e.kind==='recipes'){
  const d=publicData(e);
  if(!['None','OnStart'].includes(d.consumeMode)||d.xpGrantTiming!=='OnHarvest')throw new Error(`Unsupported recipe lifecycle: ${e.wikiId}`);
  const stage=(title,keys)=>`<section class="data-section recipe-stage"><h3>${escape(term(title,l,w))}</h3>${valueHtml(pick(d,keys),l,w)}</section>`;
  return stage('start','skill requiredSkillLevels toolRequirements extraConditions consumeMode inputCosts onStartEffects')+
    stage('production',`runMode baseCycleSeconds ${d.maxStoredOutputCount>0?'maxStoredOutputCount':''} primaryOutputItem onProductionEffects`)+
    stage('harvest','rewardTable xpGrantTiming baseSkillExpGained xpMultiplier compostOutputItem onHarvestEffects unlockRecipeIds unlockPassiveIds');
 }
 if(e.kind==='offers')return `<section class="data-section"><h3>${escape(term('effectivePrice',l,w))}</h3>${offerPrice(e,l,w)}${valueHtml({item:e.data.item,amount:e.data.amount},l,w)}${e.data.price.priceKind==='Fixed'?'':fold(term('priceRules',l,w),valueHtml(projectValue(e.data.price),l,w))}</section>`;
 const catalog=catalogData(e,l,w);if(catalog!==null)return `<section class="data-section catalog">${catalog}</section>`;
 const pairs=Object.entries(publicData(e)).filter(pair=>visible(pair,w));const scalar=valueHtml(Object.fromEntries(pairs.filter(([,v])=>typeof v!=='object')),l,w);let html=scalar?`<section class="data-section">${scalar}</section>`:'';
 for(const [k,v]of pairs.filter(([,v])=>typeof v==='object')){const body=valueHtml(v,l,w,k);if(!body)continue;const title=fieldLabel(k,l,w),collapsed=['levelTable','proficiencyTable','levelMilestones','enchantScaleRules','enchantIdleSkillBonusScaleRules','statGrowthBands','bindings','traitB'].includes(k)||(Array.isArray(v)&&v.length>8&&!['equipmentModifiers','baseStats','levels','skills'].includes(k));html+=`<section class="data-section" id="field-${escape(k)}">${collapsed?fold(title,body):`<h3>${escape(title)}</h3>${body}`}</section>`;}
 return special+html;
}
export function relationsTitle(e,l,w){return ['items','currencies'].includes(e.kind)?w.dictionaries[l].sources:e.kind==='monsters'?term('relatedLocations',l,w):e.kind==='skills'?term('relatedSkills',l,w):e.kind==='stats'?term('relatedEffects',l,w):w.dictionaries[l].related;}
function relationContext(relation,owner){
 const c={...(relation.context??{})};
 if(c.$type==='RewardProbabilityEntry'){
  const path=relation.field.split('.entries[')[0].replace(/\[(\d+)\]/g,'.$1').split('.');
  const reward=path.reduce((value,key)=>value?.[key],owner);
  c.quantity=c.itemCountRange;c.probability=c.itemProbability;c.model=reward?.chooseOneItem?'weighted':'independent';
 }else if(c.quantityRange)c.quantity=c.$type==='ChestRewardEntry'?c.quantityRange.map(n=>Math.max(1,n)):c.quantityRange;
 else if(typeof c.amount==='number')c.quantity=[Math.abs(c.amount),Math.abs(c.amount)];
 if(c.$type==='EnemySummonEffectData')c.quantity=[c.count,c.count];
 return c;
}
export function renderRelationSections(e,l,w){
 if(['statistics','guides','shops','achievements'].includes(e.kind)||['challenges:challenge','museum:museum'].includes(e.wikiId))return [];
 const groups=new Map();
 function add(r,incoming){const id=incoming?r.source:r.target;if(route(w.config,l,w.ids.get(id))===route(w.config,l,e)||/(?:^|\.)(previous|next)(?:\.|$)/.test(r.field??'')||(!incoming&&r.role==='related'))return;
  if(incoming&&e.kind==='skills'&&w.ids.get(id)?.data.skill?.ref===e.wikiId&&['actions','recipes'].includes(w.ids.get(id).kind))return;
  const section=relationSection(e,r,incoming,w);
  const c=relationContext(r,incoming?w.ids.get(r.source):e),condition=typeof c.condition==='string'?c.condition:null,key=JSON.stringify([section,route(w.config,l,w.ids.get(id))]);
  const display=w.config.entityRoutes?.get(id)??w.ids.get(id);
  if(!groups.has(key))groups.set(key,{id:display.wikiId,section,roles:new Set(),summaries:new Set(),incoming,contexts:[]});
  groups.get(key).roles.add(r.role);
  if(incoming&&e.kind==='skills'&&w.ids.get(id).kind==='items'){
    if(c.$type==='LevelRequirement')groups.get(key).summaries.add(`${term('equipmentRequirement',l,w)}: ${plain(e.names[l])} ${number(c.minLevel,l)}`);
    if(c.$type==='IdleSkillBonus')groups.get(key).summaries.add(`${enumText(c.bonusType,l,w)}: ${c.percent>0?'+':''}${number(c.percent,l)}%`);
  }
  const row={timing:c.timing,quantity:c.quantity,probability:c.probability,model:c.model,minimumStars:c.minimumStars,purpose:c.purpose,level:c.level,condition:condition??undefined,owner:c.owner,via:c.via};
  if(Object.values(row).some(x=>x!==undefined))groups.get(key).contexts.push(row);
 }
 for(const subject of [e,...(w.mergedContent?.get(e.wikiId)??[]).map(id=>w.ids.get(id))]){
  for(const r of [...subject.relations,...(w.derived.get(subject.wikiId)??[])])add(r,false);
  for(const r of w.reverse.get(subject.wikiId)??[])add(r,true);
 }
 if(!groups.size)return [];
 const ui=w.dictionaries[l],roles={related:ui.related,requires:ui.fields.extraConditions,consumes:ui.fields.inputCosts,rewards:ui.fields.rewardTable,encounter:ui.fields.enemySpawns,summons:ui.summons,unlock:ui.unlock};
 const renderGroups=rows=>Object.entries(Object.groupBy(rows,r=>w.ids.get(r.id).kind)).map(([kind,rows])=>{
  const conditionText=c=>c==='normal encounter'?term('normalEncounter',l,w):c==='area clear'?term('areaClear',l,w):c?.startsWith('resource level ')?c.replace('resource level',term('resourceLevel',l,w)):c;
  const html=`<ul class="relations">${rows.map(r=>{
   const contexts=r.contexts.map(x=>`<li>${x.owner?`${escape(plain(w.ids.get(x.owner).names[l]))} · `:''}${x.condition?`${escape(conditionText(x.condition))} · `:''}${x.purpose?`${escape(fieldLabel(x.purpose,l,w))} · `:''}${x.level!==undefined?`${escape(ui.level)} ${number(x.level,l)} · `:''}${x.timing?.startsWith('encounter ')?`${escape(ui.fields.enemySpawns)} ${escape(x.timing.slice(10))} · `:''}${x.quantity?`${escape(ui.fields.amount)} ${valueHtml(x.quantity,l,w,'quantityRange')}`:''}${x.probability!==undefined?` · ${escape(x.model==='weighted'?ui.weighted:ui.baseChance)} ${x.model==='weighted'?number(x.probability,l):`${number(x.probability*100,l)}%`}`:''}${x.minimumStars?` · ≥ ${x.minimumStars} ★`:''}</li>`).join('');
   const role=r.section==='sources'?term('acquisition',l,w):r.section==='uses'?term('usage',l,w):[...r.roles].filter(role=>role!=='related'||r.roles.size===1).map(role=>roles[role]??ui.related).join(' · ');
   return `<li>${r.summaries.size?'':`<span class="relation-tag">${escape(role)}</span>`}${link(r.id,l,w,true)}${[...r.summaries].map(s=>`<small class="relation-summary">${escape(s)}</small>`).join('')}${contexts?`<details><summary>${escape(term('details',l,w))}</summary><p>${escape(term('distinctContexts',l,w))}</p><ul>${contexts}</ul></details>`:''}</li>`;}).join('')}</ul>`;
  return rows.length>8?fold(`${ui[kind]} (${rows.length})`,html):`<section><h3>${escape(ui[kind])}</h3>${html}</section>`;
 }).join('');
 return ['sources','uses','related'].flatMap(id=>{
  const rows=[...groups.values()].filter(r=>r.section===id);
  if(!rows.length)return [];
  const title=id==='related'?(['items','currencies'].includes(e.kind)?ui.related:relationsTitle(e,l,w)):term(id==='sources'?'acquisition':'usage',l,w);
  return [{id,title,html:`<div class="data-section relation-panel">${renderGroups(rows)}</div>`}];
 });
}
export function renderRelations(e,l,w){return renderRelationSections(e,l,w).map(section=>section.html).join('');}
export function listRecord(e,l,w){
 const ui=w.dictionaries[l],summaries=[];
 for(const b of e.data.bindings??[]){
  if(b.$type==='CartographyAreaBindingSO')summaries.push(`${w.specialLabels.unlockChance[locales.indexOf(l)]} ${number(Number((b.unlockChance*100).toFixed(2)),l)}%`);
  if(b.$type==='ExpeditionAreaBindingSO'){const d=w.ids.get(b.area.ref).data;summaries.push([['★★',d.twoStarMaxClearTimeSeconds],['★★★',d.threeStarMaxClearTimeSeconds]].map(([stars,time])=>`${stars} ${number(time,l)} ${term('second',l,w)}`).join(' · '));}
 }
 return {name:plain(e.names[l]),summary:summaries.join(' · '),search:`${plain(e.names[l])} ${e.gameId}`,url:route(w.config,l,e),image:imageUrl(e.image??w.presentationImages.get(e.wikiId),w.config),type:listType(e,l,w),level:levelOf(e),facets:{rarity:e.data.rarity?[enumText(e.data.rarity,l,w,'rarity')]:[],slot:(e.data.validSlots??[]).map(v=>enumText(v,l,w,'validSlots')),skill:[...new Set(e.relations.filter(r=>r.target.startsWith('skills:')).map(r=>plain(w.ids.get(r.target).names[l])))],source:[...new Set((w.reverse.get(e.wikiId)??[]).filter(r=>r.role==='rewards'||w.ids.get(r.source).kind==='offers').map(r=>ui[w.ids.get(r.source).kind]))]}};
}
