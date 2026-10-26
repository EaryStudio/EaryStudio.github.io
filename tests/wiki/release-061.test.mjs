import test from 'node:test';
import assert from 'node:assert/strict';
import { loadWiki } from '../../scripts/wiki/model.mjs';

test('0.61 preserves all six release entries and five sections in every game locale', async () => {
  const w = await loadWiki(), patch = w.ids.get('patch-notes:0.61');
  assert.equal(w.manifest.release, '0.61');
  assert.equal(w.manifest.sourceRevision, '012dfc01d311534264970424f8f958512cca9137');
  assert.equal(patch.data.order, 0);
  assert.deepEqual(patch.data.fallbackLocales, []);
  for (const locale of w.manifest.locales) {
    const body = patch.data.bodies[locale];
    assert.equal(body, w.gameStrings.get(locale)['PatchNotes/PATCH_NOTES_BODY_0_61']);
    const lines = body.split(/\r?\n/).map(line => line.trim()).filter(Boolean);
    assert.equal(lines.filter(line => line.startsWith('- ')).length, 6, locale);
    assert.equal(lines.filter(line => !line.startsWith('- ')).length, 5, locale);
    assert.equal(patch.data.textReferences[locale].locale, locale);
    assert.ok(w.pages.some(p => p.url === `/iris/wiki/${locale}/patch-notes/0.61/`));
    assert.ok(JSON.parse(w.indexes[locale].json).some(e => e.id === 'patch-notes:0.61'));
  }
});
