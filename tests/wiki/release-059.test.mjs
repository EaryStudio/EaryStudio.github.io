import test from 'node:test';
import assert from 'node:assert/strict';
import { loadWiki } from '../../scripts/wiki/model.mjs';
import { renderData, renderRelationSections } from '../../scripts/wiki/render.mjs';
const loaded = loadWiki();

test('0.59 preserves the reviewed storage balance and moves material usage from pine to maple', async () => {
  const w = await loaded;
  assert.equal(w.manifest.release, '0.59');
  assert.equal(w.manifest.sourceRevision, '3f227a17027f7ac76088aebda7542f01f55b05f5');
  // Independently checked against CNH0003.asset and CNF0007.asset at the release revision.
  for (const [id, xp, duration, costs] of [
    ['cnh0003', 70, 1200, [['CNP0002',200],['CNT0002',40],['IG0003',200]]],
    ['cnf0007', 15, 300, [['CNP0002',120],['CNT0002',20],['IG0001',40]]]
  ]) {
    const action = w.ids.get(`actions:${id}`), d = action.data;
    assert.equal(d.requiredSkillLevels[0].minLevel, 10);
    assert.equal(d.baseSkillExpGained, xp);
    assert.equal(d.baseDurationSeconds, duration);
    assert.equal(d.special.oneTimeCompletion, true);
    assert.deepEqual(d.inputCosts.map(c => [c.itemId, c.amount]), costs);
    for (const locale of w.manifest.locales) {
      const html = renderData(action, locale, w);
      for (const material of ['cnp0002','cnt0002']) {
        assert.ok(html.includes(`/items/${material}/`), `${id}/${locale}/${material}`);
        const uses = renderRelationSections(w.ids.get(`items:${material}`), locale, w).find(s=>s.id==='uses').html;
        assert.ok(uses.includes(`/actions/${id}/`));
      }
      for (const material of ['cnp0003','cnt0003']) {
        assert.ok(!html.includes(`/items/${material}/`));
        const uses = renderRelationSections(w.ids.get(`items:${material}`), locale, w).find(s=>s.id==='uses').html;
        assert.ok(!uses.includes(`/actions/${id}/`));
      }
    }
  }
  assert.deepEqual(w.ids.get('actions:cnf0007').data.special.requiredProjects, [{ref:'actions:cnh0003'}]);
  assert.equal(w.ids.get('actions:cnf0007').data.special.bonusPercent, 25);
});

test('0.59 patch notes retain all five game entries in every locale without fallback', async () => {
  const w = await loaded, patch = w.ids.get('patch-notes:0.59');
  assert.equal(patch.data.order, 0);
  assert.deepEqual(patch.data.fallbackLocales, []);
  for (const locale of w.manifest.locales) {
    const body = patch.data.bodies[locale];
    assert.equal(body.split('\n').filter(line=>line.startsWith('- ')).length, 5);
    assert.equal(body, w.gameStrings.get(locale)['PatchNotes/PATCH_NOTES_BODY_0_59']);
  }
});
