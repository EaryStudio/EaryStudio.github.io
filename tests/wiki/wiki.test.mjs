import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import { validateGraph, validatePackage, sha256, locales, safePath } from '../../scripts/wiki/validate.mjs';
import { importPackage } from '../../scripts/wiki/import.mjs';
import { siteConfig, route, reverseRelations } from '../../scripts/wiki/model.mjs';
import { escape } from '../../scripts/wiki/render.mjs';
import { prepare, search } from '../../src/wiki/client/search.mjs';
import { searchIndex } from '../../scripts/wiki/model.mjs';
const entity = (id = 'items:test') => ({ wikiId: id, gameId: id.split(':')[1], kind: id.split(':')[0], slug: id.split(':')[1], type: 'TestFixture', names: Object.fromEntries(locales.map(l => [l, 'Test'])), descriptions: Object.fromEntries(locales.map(l => [l, ''])), image: null, data: {}, relations: [], aliases: [] });
async function fixture(root) {
  await fs.mkdir(path.join(root, 'entities'), { recursive: true }); await fs.mkdir(path.join(root, 'locales')); await fs.mkdir(path.join(root, 'schema'));
  await fs.writeFile(path.join(root, 'entities/items.json'), JSON.stringify([entity()]));
  await fs.copyFile('scripts/wiki/entity.schema.json', path.join(root, 'schema/entity.schema.json'));
  for (const locale of locales) await fs.writeFile(path.join(root, `locales/${locale}.json`), '{}');
  const files = {};
  for (const file of ['entities/items.json', 'schema/entity.schema.json', ...locales.map(l => `locales/${l}.json`)]) files[file] = sha256(await fs.readFile(path.join(root, file)));
  await fs.writeFile(path.join(root, 'manifest.json'), JSON.stringify({ schemaVersion: 1, release: '0.56', sourceRevision: 'fd02bba2d2e4e677e39a0334461c3a9d61d5f0ee', locales, entityCount: 1, files }));
}
test('independent probabilities need not total one; weighted and chest models are distinct', () => {
  const e = entity(); e.data.reward = { $type: 'RewardProbabilityDataSO', chooseOneItem: false, entries: [{ itemId: 'a', itemProbability: .9, itemCountRange: [1, 2] }, { itemId: 'b', itemProbability: .8, itemCountRange: [1, 1] }] };
  assert.doesNotThrow(() => validateGraph([e]));
  e.data.reward = { $type: 'RewardProbabilityDataSO', chooseOneItem: true, entries: [{ itemId: 'a', itemProbability: 0, itemCountRange: [1, 1] }] };
  assert.throws(() => validateGraph([e]), /weighted/);
  e.data.reward = { $type: 'ChestRewardProbabilityDataSO', entries: [{ probability: .7 }, { probability: .5 }] };
  assert.throws(() => validateGraph([e]), /cumulative/);
  e.data.reward.entries = [{ probability: .4 }]; assert.doesNotThrow(() => validateGraph([e]));
});
test('game IDs can collide while stable wiki IDs and object references remain distinct', () => {
  const variants = ['a', 'b', 'c'].map(s => ({ ...entity(`monsters:0006c_${s}`), gameId: '0006C_A' }));
  assert.equal(validateGraph(variants).size, 3);
  assert.throws(() => validateGraph([...variants, variants[0]]), /Duplicate/);
  variants[0].data.next = { ref: variants[1].wikiId }; variants[1].data.next = { ref: variants[0].wikiId };
  assert.throws(() => validateGraph(variants), /cycle/);
});
test('reverse references preserve repeated rolls', () => {
  const a = entity('monsters:one'), b = entity();
  a.relations = [0, 1].map(i => ({ target: b.wikiId, role: 'rewards', field: `entries.${i}`, context: {} }));
  assert.equal(reverseRelations([a, b]).get(b.wikiId).length, 2);
});
test('search supports exact ID, accented Latin, CJK and alternate-language names', () => {
  const docs = prepare([{ id: 'items:tea', gameId: 'TEA', name: 'Café', names: ['커피콩', '珈琲豆', '咖啡豆'], description: '', kind: 'items' }, { id: 'items:tea2', gameId: 'TEA2', name: 'Tea leaf', names: [], description: '', kind: 'items' }]);
  for (const query of ['cafe', '커피', '珈琲', '咖啡']) assert.equal(search(docs, query)[0].id, 'items:tea');
  assert.equal(search(docs, 'TEA')[0].id, 'items:tea');
});
test('routes support subpaths and IDs never depend on translated names', () => {
  assert.equal(route(siteConfig('/preview/'), 'zh-Hans', entity()), '/preview/iris/wiki/zh-Hans/items/test/');
  assert.throws(() => siteConfig('/../'));
  assert.equal(escape('<img src=x onerror=alert(1)>'), '&lt;img src=x onerror=alert(1)&gt;');
  for (const value of ['../secret', '/absolute', 'assets/../../key', 'entities\\file.json', 'entities/x.json:stream']) assert.equal(safePath(value), false);
});
test('invalid import leaves committed snapshot untouched', async t => {
  const root = await fs.mkdtemp(path.join(os.tmpdir(), 'iris-wiki-test-')); t.after(() => fs.rm(root, { recursive: true, force: true }));
  const input = path.join(root, 'input'), destination = path.join(root, 'snapshot'); await fixture(input);
  await importPackage(input, destination); await validatePackage(destination);
  const original = await fs.readFile(path.join(destination, 'entities/items.json'), 'utf8');
  await fs.writeFile(path.join(input, 'entities/items.json'), '[]');
  await assert.rejects(importPackage(input, destination), /Hash mismatch/);
  assert.equal(await fs.readFile(path.join(destination, 'entities/items.json'), 'utf8'), original);
  await fs.writeFile(path.join(input, 'secrets.txt'), 'private');
  await assert.rejects(validatePackage(input), /inventory/);
});
test('complete snapshot search stays below the 200 ms response budget in every locale', async () => {
  const snapshot = await validatePackage('data/iris'); const timings = {};
  for (const locale of locales) {
    const docs = prepare(searchIndex(snapshot.entities, locale, siteConfig()));
    const queries = ['0006C_A', 'iron', '철', '鉄', '铁', '鐵', 'cocina', 'Life.Mining'];
    const elapsed = [];
    for (const query of queries) { const start = performance.now(); search(docs, query); elapsed.push(performance.now() - start); }
    timings[locale] = Math.max(...elapsed);
    assert.ok(timings[locale] < 200, `${locale}: ${timings[locale]} ms`);
  }
  await fs.mkdir('reports', { recursive: true }); await fs.writeFile('reports/search-performance.json', JSON.stringify(timings, null, 2));
});
