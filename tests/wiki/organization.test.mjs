import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import { organize } from '../../scripts/wiki/organization.mjs';

test('release actions and recipes have one skill home; every guide has a contextual home', async () => {
  const files = await fs.readdir('data/iris/entities');
  const entities = (await Promise.all(files.map(async file => JSON.parse(await fs.readFile(`data/iris/entities/${file}`, 'utf8'))))).flat();
  const result = organize(entities);
  const children = [...result.skillActions.values()].flat();
  const expected = entities.filter(e => ['actions', 'recipes'].includes(e.kind));
  assert.equal(children.length, expected.length);
  assert.equal(new Set(children).size, expected.length);
  for (const entity of expected) assert.equal(result.parentSkills.get(entity.wikiId), entity.data.skill.ref);
  const guides = [...result.contextualGuides.values()].flat();
  assert.equal(guides.length, entities.filter(e => e.kind === 'guides').length);
  assert.equal(new Set(guides).size, guides.length);
  const autoExplore = entities.find(e => e.kind === 'guides' && e.slug.endsWith('autoexplore'));
  assert.ok(result.contextualGuides.get('locations').includes(autoExplore.wikiId));
  assert.equal(result.presentationImages.size, 112 + entities.filter(e => e.kind === 'patch-notes').length);
});

test('new actions without a skill and unplaced guides fail instead of disappearing', () => {
  assert.throws(() => organize([{ wikiId: 'actions:new', kind: 'actions', data: {} }]), /owning skill/);
  assert.throws(() => organize([{ wikiId: 'guides:new', kind: 'guides', slug: 'guides.new', data: {} }]), /contextual home/);
});
