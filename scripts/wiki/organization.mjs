// Presentation ownership only. Game definitions and stable detail URLs stay intact.
export function organize(entities) {
  const ids = new Map(entities.map(e => [e.wikiId, e]));
  const parentSkills = new Map(), skillActions = new Map(), contextualGuides = new Map(), presentationImages = new Map();
  const mergedInto = new Map(), mergedContent = new Map(), parentShops = new Map();
  const append = (map, key, id) => { if (!map.has(key)) map.set(key, []); map.get(key).push(id); };
  const generalGuides = { autoexplore: 'locations', challenge: 'challenges', inventorycategory: 'items', museum: 'museum', objectives: 'objectives', queue: 'skills' };
  const sharedIcons = {
    'shops:shopoffercatalog_gold': 'currencies:gold',
    'shops:shopoffercatalog_ducarin': 'currencies:ducarin',
    'shops:shopoffercatalog_challenge': 'currencies:challenge.cycle_stone',
    'stats:dexterity': 'skills:life.stealth'
  };
  for (const entity of entities) {
    if (entity.kind === 'patch-notes') {
      presentationImages.set(entity.wikiId, { sitePath: 'assets/wiki-ui/statistics.svg', sprite: 'statistics', width: 32, height: 32 });
    }
    if (['statistics', 'museum'].includes(entity.kind)) {
      presentationImages.set(entity.wikiId, { sitePath: `assets/wiki-ui/${entity.kind}.svg`, sprite: entity.kind, width: 32, height: 32 });
    }
    if (!entity.image && sharedIcons[entity.wikiId]) {
      const source = ids.get(sharedIcons[entity.wikiId]);
      if (!source?.image) throw new Error(`Missing shared icon: ${entity.wikiId}`);
      presentationImages.set(entity.wikiId, source.image);
    }
    if (['actions', 'recipes'].includes(entity.kind)) {
      const skill = entity.data.skill?.ref;
      if (!skill || ids.get(skill)?.kind !== 'skills') throw new Error(`Missing owning skill: ${entity.wikiId}`);
      parentSkills.set(entity.wikiId, skill); append(skillActions, skill, entity.wikiId);
    }
    if (entity.kind === 'guides') {
      const suffix = entity.slug.replace(/^guides\./, ''); const skill = `skills:${suffix}`;
      if (ids.has(skill)) { parentSkills.set(entity.wikiId, skill); append(contextualGuides, skill, entity.wikiId); }
      else {
        const section = generalGuides[suffix.replace(/^life\./, '')];
        if (!section) throw new Error(`Guide needs a contextual home: ${entity.wikiId}`);
        append(contextualGuides, section, entity.wikiId);
      }
    }
    if (!entity.image && entity.kind === 'offers') {
      const item = ids.get(entity.data.item?.ref); if (item?.image) presentationImages.set(entity.wikiId, item.image);
    }
    if (!entity.image && entity.kind === 'systems') {
      const skill = ids.get(`skills:life.${entity.slug}`); if (skill?.image) presentationImages.set(entity.wikiId, skill.image);
    }
  }
  const merge = (definition, action) => {
    if (!action || action.kind !== 'actions' || mergedInto.has(definition.wikiId)) throw new Error(`Missing or ambiguous action for ${definition.wikiId}`);
    const expected = {familiars:'skills:life.familiartraining',targets:'skills:life.stealth','combat-actions':'skills:life.training'}[definition.kind];
    if(parentSkills.get(action.wikiId)!==expected)throw new Error(`Wrong owning skill for ${definition.wikiId}`);
    mergedInto.set(definition.wikiId,action.wikiId);
    append(mergedContent,action.wikiId,definition.wikiId);
    parentSkills.set(definition.wikiId,expected);
  };
  for(const definition of entities){
    if(definition.kind==='familiars'){
      const matches=entities.filter(e=>e.kind==='actions'&&e.data.bindings?.some(b=>b.familiar?.ref===definition.wikiId));
      if(matches.length!==1)throw new Error(`Missing or ambiguous action for ${definition.wikiId}`);
      merge(definition,matches[0]);
    }
    if(definition.kind==='targets')merge(definition,entities.find(e=>e.kind==='actions'&&e.gameId===definition.data.actionId));
    if(definition.kind==='combat-actions'){
      const matches=entities.filter(e=>e.kind==='actions'&&e.data.onSuccessEffects?.some(effect=>effect.$type==='IdleEffect_TrainPlayerActionSO'&&effect.targetPlayerAction?.ref===definition.wikiId));
      if(matches.length!==1)throw new Error(`Missing or ambiguous action for ${definition.wikiId}`);
      merge(definition,matches[0]);
    }
    if(definition.kind==='shops')for(const offer of definition.data.offers??[])append(parentShops,offer.ref,definition.wikiId);
  }
  for(const offer of entities.filter(e=>e.kind==='offers'))if(!parentShops.has(offer.wikiId))throw new Error(`Missing shop for ${offer.wikiId}`);
  for (const children of skillActions.values()) children.sort((a, b) => {
    const level = id => Math.max(0, ...(ids.get(id).data.requiredSkillLevels ?? []).map(r => r.minLevel));
    return level(a) - level(b) || a.localeCompare(b);
  });
  return { parentSkills, skillActions, contextualGuides, presentationImages, mergedInto, mergedContent, parentShops };
}
