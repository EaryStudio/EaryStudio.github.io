import test from 'node:test';
import assert from 'node:assert/strict';
import { loadWiki } from '../../scripts/wiki/model.mjs';
import { renderData } from '../../scripts/wiki/render.mjs';
import { gameText } from '../../scripts/wiki/special-actions.mjs';
const loaded = loadWiki();

test('0.60 patch notes match all six game tables without fallback', async () => {
  const w = await loaded, patch = w.ids.get('patch-notes:0.60');
  assert.equal(w.manifest.release, '0.60');
  assert.equal(w.manifest.sourceRevision, '922a2fcad6f658901a5d06ef96ddfce3ea3c0699');
  assert.equal(patch.data.order, 0);
  assert.deepEqual(patch.data.fallbackLocales, []);
  for (const locale of w.manifest.locales) {
    assert.equal(patch.data.bodies[locale], w.gameStrings.get(locale)['PatchNotes/PATCH_NOTES_BODY_0_60']);
    assert.equal(patch.data.bodies[locale].split('\n').filter(line => line.startsWith('- ')).length, 3);
  }
});

test('planting quantity is shown once using the game translation in every locale', async () => {
  const w = await loaded, seeds = w.groups.items.filter(e => e.data.minimumPlantingQuantity !== undefined);
  assert.ok(seeds.length > 0);
  for (const seed of seeds) {
    assert.ok(Number.isSafeInteger(seed.data.minimumPlantingQuantity) && seed.data.minimumPlantingQuantity > 0);
    for (const locale of w.manifest.locales) {
      const html = renderData(seed, locale, w);
      assert.equal(html.split('planting-requirement').length - 1, 1);
      assert.ok(html.includes(gameText(w, locale, 'UI/UI_ITEM_REQ_PLANTING_QUANTITY_FORMAT', [seed.data.minimumPlantingQuantity])));
      assert.ok(!html.includes('minimumPlantingQuantity'));
    }
  }
  const ordinary = w.groups.items.find(e => e.data.minimumPlantingQuantity === undefined);
  assert.ok(!renderData(ordinary, 'ko', w).includes('planting-requirement'));
  assert.throws(() => renderData({...seeds[0], data:{...seeds[0].data, minimumPlantingQuantity:0}}, 'ko', w), /Invalid planting quantity/);
});
