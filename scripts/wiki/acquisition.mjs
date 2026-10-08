// Derived acquisition paths retain their complete provenance. The snapshot keeps
// each table only at its owning definition; these are computed links, not new drops.
export function expeditionSources(entities, ids) {
  const result = new Map();
  for (const action of entities.filter(e => e.kind === 'actions')) {
    const relations = [];
    for (const binding of action.data.bindings ?? []) {
      if (binding.$type !== 'ExpeditionAreaBindingSO') continue;
      const area = ids.get(binding.area.ref);
      const sources = [{ owner: area, table: area.data.clearRewardTable, timing: 'area clear' }];
      for (const [index, spawn] of area.data.enemySpawns.entries()) {
        const enemy = ids.get(spawn.enemyData.ref);
        if (!enemy) throw new Error(`Missing expedition enemy in ${area.wikiId}`);
        sources.push({ owner: enemy, table: enemy.data.rewardTable, timing: `encounter ${index + 1}`, condition: enemy.data.enemyType === 'Resource' ? `resource level >= ${enemy.data.resourceLevel}` : 'normal encounter' });
        if (enemy.data.enemyType === 'Resource' && enemy.data.resourceDropFailTable) sources.push({ owner: enemy, table: enemy.data.resourceDropFailTable, timing: `encounter ${index + 1}`, condition: `resource level < ${enemy.data.resourceLevel}` });
      }
      for (const source of sources) {
        for (const [index, row] of (source.table?.entries ?? []).entries()) {
          if(row.goldProbability>0&&Math.max(...row.goldRange)>0)relations.push({target:'currencies:gold',role:'rewards',field:`derived.expedition.${source.owner.wikiId}.${source.timing}.${index}.gold`,context:{via:area.wikiId,owner:source.owner.wikiId,timing:source.timing,condition:source.condition??'area clear',quantity:row.goldRange,probability:row.goldProbability,model:'independent',minimumStars:2}});
          if (!row.itemId || row.itemProbability <= 0 || Math.max(...row.itemCountRange) <= 0) continue;
          const target = entities.find(e => e.kind === 'items' && e.gameId === row.itemId);
          if (!target) throw new Error(`Unresolved expedition item ${row.itemId}`);
          relations.push({ target: target.wikiId, role: 'rewards', field: `derived.expedition.${source.owner.wikiId}.${source.timing}.${index}`, context: { via: area.wikiId, owner: source.owner.wikiId, timing: source.timing, condition: source.condition ?? 'area clear', quantity: row.itemCountRange, probability: row.itemProbability, model: source.table.chooseOneItem ? 'weighted' : 'independent', minimumStars: 2 } });
        }
      }
    }
    if (relations.length) result.set(action.wikiId, relations);
  }
  return result;
}
