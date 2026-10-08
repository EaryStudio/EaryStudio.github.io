import { effectiveCurrency } from './presentation.mjs';

// These relationships are derived from public snapshot fields, never a player save.
// Gold rolls remain independent even when the item table uses weighted choice.
export function currencyRelations(entities, systems) {
  const result = new Map(), ids = new Map(entities.map(e => [e.wikiId, e]));
  const add = (source, target, role, field, context = {}) => {
    if (!ids.has(source) || !ids.has(target)) throw new Error(`Missing currency relation: ${source} -> ${target}`);
    const rows = result.get(source) ?? []; result.set(source, rows);
    rows.push({ target, role, field, context });
  };
  for (const e of entities) {
    const walk = (v, field) => {
      if (!v || typeof v !== 'object') return;
      if (v.$type === 'RewardProbabilityDataSO') {
        for (const [i, row] of v.entries.entries()) if (row.goldProbability > 0 && Math.max(...row.goldRange) > 0)
          add(e.wikiId, 'currencies:gold', 'rewards', `${field}.entries[${i}].goldRange`, {
            quantity: row.goldRange, probability: row.goldProbability, model: 'independent', purpose: field.includes('resourceDropFailTable') ? 'resourceDropFailTable' : field.includes('clearRewardTable') ? 'clearRewardTable' : 'rewardTable', ...(e.data.enemyType==='Resource'?{condition:`resource level ${field.includes('resourceDropFailTable')?'<':'>='} ${e.data.resourceLevel}`}:{})
          });
        return;
      }
      if (v.goldReward > 0) add(e.wikiId, 'currencies:gold', 'rewards', `${field}.goldReward`, { quantity: [v.goldReward,v.goldReward], level: v.level, purpose: 'goldReward' });
      for (const [key, value] of Object.entries(v)) if (!['textReferences', 'special'].includes(key)) walk(value, `${field}.${key}`);
    };
    walk(e.data, 'data');
    if (e.kind === 'offers' && !e.relations.some(r => r.target === effectiveCurrency(e.data)))
      add(e.wikiId, effectiveCurrency(e.data), 'consumes', 'data.price', { quantity: [e.data.price.basePrice,e.data.price.basePrice], purpose: 'effectivePrice' });
    for (const key of ['unlockGoldCost','sweepGoldCost']) if (e.data[key] > 0)
      add(e.wikiId, 'currencies:gold', 'consumes', `data.${key}`, { quantity:[e.data[key],e.data[key]], purpose:key });
    if (e.kind === 'items' && e.data.sellPrice > 0 && !e.data.sellLocked)
      add(e.wikiId, 'currencies:gold', 'rewards', 'data.sellPrice', { quantity:[e.data.sellPrice,e.data.sellPrice], purpose:'sellPrice' });
  }
  const action = gameId => entities.find(e => e.kind === 'actions' && e.gameId === gameId)?.wikiId;
  const writing = systems.get('writing');
  if (writing) for (const i of [1,2]) {
    const source = action(writing[`action${i}Id`]);
    add(source, `currencies:${writing.goldCurrencyId}`, 'consumes', `settings.action${i}ResetGoldCost`, { quantity:[writing[`action${i}ResetGoldCost`],writing[`action${i}ResetGoldCost`]], purpose:'rerollCost' });
    if (!ids.get(source).relations.some(r=>r.target===`currencies:${writing.inspirationCurrencyId}`&&r.role==='consumes'))
      add(source,`currencies:${writing.inspirationCurrencyId}`,'consumes',`settings.action${i}InspirationCost`,{quantity:[writing[`action${i}InspirationCost`],writing[`action${i}InspirationCost`]],purpose:'inputCosts'});
  }
  const commerce = systems.get('commerce');
  if (commerce) {
    for (const key of ['action1InstantSaleId','action2ListToGoldId']) add(action(commerce[key]),'currencies:gold','rewards',`settings.${key}`,{purpose:'priceConditions'});
    add(action(commerce.action3ListToDucarinId),`currencies:${commerce.ducarinCurrencyId}`,'rewards','settings.action3ListToDucarinId',{purpose:'priceConditions'});
    commerce.commodityTradeActionIds.forEach((id,i)=>add(action(id),`currencies:${commerce.ducarinCurrencyId}`,commerce.commodityTradeModesBySlot[i]==='Buy'?'consumes':'rewards',`settings.commodityTradeActionIds.${i}`,{purpose:'priceConditions'}));
  }
  return result;
}
