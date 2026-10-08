// Classify by gameplay meaning, not by the direction of an object reference.
export function relationSection(entity, relation, incoming, wiki) {
  if (!['items', 'currencies'].includes(entity.kind)) return 'related';
  const source = incoming ? wiki.ids.get(relation.source) : entity;
  const field = relation.field ?? '';
  const context = relation.context ?? {};
  if (incoming) {
    if (relation.role === 'rewards' ||
        (source.kind === 'offers' && field === 'data.item') ||
        field.startsWith('data.resourceDropFailTable.')) return 'sources';
    if (context.$type === 'IdleEffect_AddCurrencySO') return context.amount > 0 ? 'sources' : context.amount < 0 ? 'uses' : 'related';
    if (['consumes', 'requires'].includes(relation.role) ||
        (source.kind === 'offers' && /currency/i.test(field)) ||
        ['data.entryConsumeItemId', 'data.entryRequiredEquippedItemId', 'data.autoSubmitOnObtainedItemIds'].includes(field)) return 'uses';
  } else if (['rewards', 'consumes', 'unlock'].includes(relation.role)) {
    // Opening a chest is a use of that chest; its contents are not its source.
    return 'uses';
  }
  return 'related';
}
