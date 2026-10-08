export const normalize = value => String(value).normalize('NFD').replace(/\p{Diacritic}/gu, '').toLocaleLowerCase('en').replace(/\s+/g, ' ').trim();
export function prepare(documents) {
  return documents.map(doc => ({ ...doc, terms: [doc.id, doc.gameId, doc.name, ...doc.names].map(normalize), extra: normalize(doc.description) }));
}
export function search(documents, query, limit = Infinity) {
  const q = normalize(query); if (!q) return [];
  return documents.map(doc => {
    let score = 0;
    for (const name of doc.terms) score = Math.max(score, name === q ? 100 : name.startsWith(q) ? 70 : name.includes(q) ? 40 : 0);
    if (!score && q.length >= 2 && doc.extra.includes(q)) score = 10;
    return { doc, score };
  }).filter(x => x.score).sort((a, b) => b.score - a.score || a.doc.name.localeCompare(b.doc.name)).slice(0, limit).map(x => x.doc);
}
