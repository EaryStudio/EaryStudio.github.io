// Player-facing projection. The imported, hashed game snapshot is never edited.
export const locales = ['en', 'ko', 'ja', 'es', 'zh-Hans', 'zh-Hant'];
export const pick = (value, keys) => Object.fromEntries(keys.split(' ').filter(k => value?.[k] !== undefined).map(k => [k, value[k]]));
export function term(key, locale, wiki) {
  const text = wiki.dictionaries[locale].terms[key];
  if (text === undefined) throw new Error(`Missing presentation translation: ${key}/${locale}`);
  return text;
}
export function enumText(value, locale, wiki, field='') {
  if (/^(?:[A-FS]|SS|SSS)$/.test(value)) return value;
  const scoped=wiki.dictionaries[locale].terms[`enum.${field}.${value}`];if(scoped)return scoped;
  return term(`enum.${value}`, locale, wiki);
}
export function applyGameLabels(strings,ui){
 const mappings={itemType:['COMBAT_EQUIPMENT','NON_COMBAT_EQUIPMENT','FOOD','CONSUMABLE','MISC','CHEST','TICKET'],rarity:['NORMAL','RARE','EPIC','MYTHIC','ARTIFACT'],validSlots:['HEAD','CHEST','LEGS','MAIN_HAND','OFF_HAND','BOOTS','NECKLACE','RING_1','RING_2','GLOVES','CAPE','PICKAXE','FISHING_ROD','AXE','CHARM','AMMO','POTION'],difficulty:['NOVICE','ADEPT','ELITE']};
 const prefixes={itemType:'UI_ITEM_TYPE_',rarity:'UI_ITEM_RARITY_',validSlots:'UI_EQUIP_SLOT_',difficulty:'UI_CHALLENGE_DIFFICULTY_'};
 for(const [field,suffixes]of Object.entries(mappings))for(const suffix of suffixes){const key=`UI/${prefixes[field]}${suffix}`,value=strings[key];if(!value)throw new Error(`Export missing game display label: ${key}`);const name=suffix.toLowerCase().split('_').map(s=>s[0].toUpperCase()+s.slice(1)).join('');ui.terms[`enum.${field}.${name}`]=value;if(field==='difficulty')ui.terms[`enum.${name}`]=value;}
}
export function effectiveCurrency(data) { return data.currencyOverride?.ref ?? (data.currencyType === 'Ducarin' ? 'currencies:ducarin' : 'currencies:gold'); }
export function levelOf(e) { return e.data.enemyLevel ?? e.data.areaLevel ?? e.data.unlockRequiredSkillLevel ?? e.data.requiredEnduranceLevel ?? Math.max(0, ...(e.data.requiredSkillLevels ?? e.data.levelRequirements ?? []).map(r => r.minLevel)); }
export function listType(e, locale, wiki) {
  if(e.kind==='skills')return enumText(e.data.category==='Combat'?'Combat':'Life',locale,wiki);
  if(e.data.special?.kind==='painting')return listType(wiki.ids.get(e.data.special.target.ref),locale,wiki);
  const value = e.data.itemType ?? e.data.enemyType ?? e.data.category ?? e.data.attribute;
  if (e.kind === 'challenges') return term(e.data.floor ? 'tower' : e.data.difficulty ? 'maze' : 'overview', locale, wiki);
  if (e.kind === 'museum') return term(e.data.requiredSubmittedCount ? 'milestones' : 'overview', locale, wiki);
  if (value) return enumText(value, locale, wiki,e.data.itemType?'itemType':e.data.enemyType?'enemyType':e.data.category?'category':'attribute');
  return wiki.dictionaries[locale][e.kind];
}
export function sortEntities(entities, locale) {
  const rank = value => ({Main:0,General:1,Daily:2,Novice:0,Adept:1,Elite:2}[value] ?? 0);
  return [...entities].sort((a,b) => {
    if (a.kind === 'objectives') return rank(a.data.category)-rank(b.data.category) || (a.data.mainOrder ?? 1e6)-(b.data.mainOrder ?? 1e6) || a.names[locale].localeCompare(b.names[locale],locale,{numeric:true});
    if (a.kind === 'challenges') return (a.data.floor ? 1 : a.data.difficulty ? 2 : 0)-(b.data.floor ? 1 : b.data.difficulty ? 2 : 0) || (a.data.floor ?? 0)-(b.data.floor ?? 0) || (a.data.mazeId ?? '').localeCompare(b.data.mazeId ?? '') || rank(a.data.difficulty)-rank(b.data.difficulty);
    if (a.kind === 'museum') return (a.data.requiredSubmittedCount ?? 0)-(b.data.requiredSubmittedCount ?? 0);
    if (a.kind === 'patch-notes') return a.data.order-b.data.order;
    return a.names[locale].localeCompare(b.names[locale],locale,{numeric:true});
  });
}
export function decorateEntities(entities, wiki) {
  const ids = new Map(entities.map(e=>[e.wikiId,e]));
  const general = {autoexplore:'locations',challenge:'challenges',inventorycategory:'items',museum:'museum',objectives:'objectives',queue:'skills'};
  for (const e of entities) for (const locale of locales) {
    const ui=wiki.dictionaries[locale]; let name;
    if (e.kind==='shops') {
      const currency= e.slug.endsWith('_gold') ? ids.get('currencies:gold') : e.slug.endsWith('_ducarin') ? ids.get('currencies:ducarin') : null;
      name=`${currency?.names[locale] ?? ui.challenges} · ${ui.shops}`;
    } else if (e.kind==='museum') name=e.data.requiredSubmittedCount ? `${ui.museum} · ${e.data.requiredSubmittedCount} ${term('submitted',locale,wiki)}` : ui.museum;
    else if (e.wikiId==='challenges:challenge') name=ui.challenges;
    else if (e.kind==='guides') {
      const suffix=e.slug.replace(/^guides\./,'');
      name=`${ids.get(`skills:${suffix}`)?.names[locale] ?? ui[general[suffix.replace(/^life\./,'')]]} · ${ui.guides}`;
    }
    if(name){e.names[locale]=name;e.data.fallbackLocales=(e.data.fallbackLocales??[]).filter(l=>l!==locale);}
    if(e.kind==='challenges' && e.data.difficulty)e.names[locale]+=` · ${enumText(e.data.difficulty,locale,wiki)}`;
  }
  // Difficulty belongs to an encounter, not to a save ID or asset filename.
  const difficulties=new Map();
  const add=(id,d)=>{if(!id)return;if(!difficulties.has(id))difficulties.set(id,new Set());difficulties.get(id).add(d);};
  for(const e of entities)if(e.kind==='challenges'&&e.data.difficulty){
    add(e.data.area?.ref,e.data.difficulty);
    for(const spawn of e.data.effectiveEnemySpawns??[])add(spawn.enemyData.ref,e.data.difficulty);
  }
  // Summoned variants inherit encounter context, but never inherit its rewards.
  for(let pass=0;pass<entities.length;pass++){
    let changed=false;
    for(const e of entities)for(const relation of e.relations??[])if(relation.role==='summons')for(const d of difficulties.get(e.wikiId)??[]){
      const before=difficulties.get(relation.target)?.size??0;add(relation.target,d);if((difficulties.get(relation.target)?.size??0)>before)changed=true;
    }
    if(!changed)break;
  }
  const duplicateNames=new Set();
  for(const group of Object.values(Object.groupBy(entities,e=>`${e.kind}:${e.names.en}`)))if(group.length>1)for(const e of group)duplicateNames.add(e.wikiId);
  for(const e of entities)if(['monsters','locations'].includes(e.kind)&&duplicateNames.has(e.wikiId))for(const locale of locales){
    const parts=[...(difficulties.get(e.wikiId)??[])].map(d=>enumText(d,locale,wiki));
    if(e.data.enemyType==='Resource')parts.push(`${wiki.dictionaries[locale].level} ${e.data.resourceLevel}`);
    if(parts.length)e.names[locale]+=` · ${parts.join(' / ')}`;
  }
  for(const locale of locales)for(const group of Object.values(Object.groupBy(entities.filter(e=>e.kind==='monsters'),e=>e.names[locale])))if(group.length>1)for(const e of group){
    const areas=entities.filter(a=>a.kind==='locations'&&a.data.enemySpawns?.some(s=>s.enemyData.ref===e.wikiId));
    if(areas.length)e.names[locale]+=` · ${[...new Set(areas.map(a=>a.names[locale]))].join(' / ')}`;
  }
}

// Remove inactive union members and implementation-only metadata before rendering.
export function projectValue(v) {
  if(!v || typeof v!=='object')return v;
  if(Array.isArray(v))return v.filter(x=>x?.enabled!==false).map(projectValue);
  let out={...v}; const type=v.$type;
  if(['RewardProbabilityDataSO','ChestRewardProbabilityDataSO'].includes(type))return v;
  if(type==='LevelRequirement')out={skill:v.skill??v.progressionSkill, minLevel:v.minLevel};
  if(type==='EnemySkillEffectDefinition')out=pick(v,`effectType delaySeconds ${{Summon:'summon',AreaAttack:'areaAttack',Heal:'heal',TimedBuff:'timedBuff'}[v.effectType]??''}`);
  if(type==='EnemyAreaAttackEffectData')out=pick(v,`damageKind damageMultiplier minimumPlayerMaxHpDamagePercent targetMode areaCount shape warningSeconds ${v.shape==='Circle'?'radius':'boxSize'}`);
  if(type==='EnemySkillDefinition')out=pick(v,`selectionWeight minimumHealthRatio maximumHealthRatio individualCooldownSeconds activationRangeMode ${v.activationRangeOverride>0?'activationRangeOverride':''} ${v.attackIntervalOverride>0?'attackIntervalOverride':''} ${v.releaseTiming==='Timed'?'releaseDelaySeconds':''} ${v.motionLockSeconds>0?'motionLockSeconds':''} effects`);
  if(type==='EnemyAttackInfo')out=v.enabled ? pick(v,`chancePercent attackKind ${v.attackIntervalOverride>0?'attackIntervalOverride':''} ${v.attackRangeOverride>0?'attackRangeOverride':''}`) : {};
  if(type==='PlayerActionLevel')out=Object.fromEntries(Object.entries(v).filter(([k,x])=>!['moveDistance','instantHealAmount','immunityDuringAction','healAtStart'].includes(k)||(typeof x==='number'?x!==0:typeof x==='string'?x!=='None':false)));
  if(type==='ObjectiveRewardData'){
    out=pick(v,`rewardType ${v.rewardType==='Unlock'?'unlockKind':'amount'} ${v.rewardType==='Item'?'itemId':v.rewardType==='Currency'?'currencyId':v.rewardType==='Unlock'?'':'skillId'}`);
    if(v.rewardType==='Unlock'&&v.unlockTargetId){
      const key={Skill:'skillId',Action:'actionId',Area:'areaId'}[v.unlockKind];
      if(!key)throw new Error(`Unsupported unlock target: ${v.unlockKind}`);
      out[key]=v.unlockTargetId;
    }
  }
  if(type?.startsWith('Objective')&&'revealConditionType' in v && v.revealConditionType==='None')return {};
  if(type==='EnemySpawnInfo')out=pick(v,'enemyData');
  if(type==='MuseumItemReward'&&v.enchantLevel===0)delete out.enchantLevel;
  if(type==='ShopPriceDefinition')out=v.priceKind==='Fixed'?pick(v,'basePrice'):pick(v,`basePrice purchasesPerStep multiplierPerStep ${v.additivePerStep?'additivePerStep':''} ${v.maxPrice>0?'maxPrice':''}`);
  const hidden=new Set(['$type','textReferences','fallbackLocales','previous','next','scope','order','sortOrder','combatEquipmentSortGroup','museumCategory','xpCurve','actionProficiencyCurve','isInt','isPercent01','isPercent100','enabled','positionOffset','anchor','buffIdPrefix','buffId','displayNameLocalizationKey','sellLocked','healAtStart']);
  return Object.fromEntries(Object.entries(out).filter(([key,value])=>!hidden.has(key)&&value!==null&&value!==''&&value!==undefined&&!(Array.isArray(value)&&!value.length)).map(([k,x])=>[k,projectValue(x)]).filter(([,x])=>!(x&&typeof x==='object'&&!Object.keys(x).length)));
}
export function publicData(e) {
  let d={...e.data};
  if(e.kind==='monsters' && d.enemyType!=='Resource')for(const k of ['resourceKind','resourceLevel','resourceDropFailTable'])delete d[k];
  if(e.kind==='monsters' && d.enemyType==='Resource')for(const k of ['attack1','attack2','attack3','skills'])delete d[k];
  if(e.kind==='familiars'){
    const keys=d.category==='IdleSkill'?'unlockIdleSkillId unlockIdleActionId idleUnlockChance01':d.category==='Combat'?'unlockCombatAttackType combatUnlockChance01':'objectiveUnlockChance01';
    d=pick(d,`category unlockedWithFamiliarTrainingSkill ${keys} effectType targetSkillId targetCombatAttackType rankBonuses`);
    if(d.category!=='Combat')delete d.targetCombatAttackType;
    if(d.unlockedWithFamiliarTrainingSkill)for(const key of Object.keys(d))if(/UnlockChance01$/.test(key))delete d[key];
  }
  if(e.kind==='items'){
    if(d.consumableCategory!=='Potion')for(const key of Object.keys(d))if(key.startsWith('potion'))delete d[key];
    if(d.consumableCategory!=='Ammo')delete d.ammoUsageType;
    if(d.useTiming!=='Periodic')delete d.periodicIntervalSeconds;
    for(const [field,source]of [['enchantScaleRules','equipmentModifiers'],['enchantIdleSkillBonusScaleRules','idleSkillBonuses']])if(d[field])d[field]=d[field].map(r=>({...pick(d[source]?.[r.modifierIndex??r.bonusIndex]??{},'statType skill bonusType'),multiplierAt99:r.multiplierAt99}));
  }
  if(e.kind==='objectives'){if(d.category!=='Daily')delete d.dailyReveal;if(d.category!=='General')delete d.generalReveal;delete d.dailyPoolTag;}
  if(e.kind==='challenges'){delete d.enemySpawnOverride;delete d.useEnemySpawnOverride;}
  if(e.kind==='skills'){delete d.kind;delete d.category;}
  if(e.kind==='combat-actions'){delete d.actionType;d.levels=d.levels?.map((v,i)=>({level:i+1,...v}));}
  return projectValue(d);
}
