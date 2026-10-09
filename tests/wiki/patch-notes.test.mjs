import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import nunjucks from 'nunjucks';
import { loadWiki } from '../../scripts/wiki/model.mjs';

test('patch notes replace systems in all published routes, navigation and search', async () => {
  const wiki = await loadWiki();
  const notes = wiki.groups['patch-notes'];
  assert.equal(notes.length, 24);
  assert.equal(notes[0].data.version, wiki.manifest.release);
  assert.equal(notes.at(-1).data.version, '0.34');
  assert.equal(wiki.navigationKinds.at(-1), 'patch-notes');
  assert.ok(!wiki.pages.some(p => /\/(systems|rules)\//.test(p.url)));
  for (const locale of wiki.manifest.locales) {
    const strings = JSON.parse(await fs.readFile(`data/iris/locales/${locale}.json`, 'utf8'));
    const search = JSON.parse(wiki.indexes[locale].json);
    assert.ok(!search.some(e => ['systems', 'rules'].includes(e.kind)));
    assert.equal(search.filter(e => e.kind === 'patch-notes').length, notes.length);
    for (const [order, note] of notes.entries()) {
      assert.equal(note.data.order, order);
      const ref = note.data.textReferences[locale];
      assert.equal(note.data.bodies[locale], strings[`${ref.table}/${ref.key}`]);
      assert.ok(note.data.bodies[locale].length > 0);
      assert.ok(wiki.pages.some(p => p.url === `${wiki.config.wikiPath}${locale}/patch-notes/${note.slug}/`));
    }
  }
  // Raw patch-note text must never become executable HTML.
  const template = await fs.readFile('src/wiki/pages.njk', 'utf8');
  const body = template.match(/<article class="patch-body[\s\S]*?<\/article>/)[0];
  const env = new nunjucks.Environment(null, { autoescape: true });
  const rendered = env.renderString(body, { lang: 'ko', patch: { names: { ko: '0.56' }, data: { bodies: { ko: '<script>alert(1)</script>\n- & 변경' } } } });
  assert.ok(!rendered.includes('<script>'));
  assert.ok(rendered.includes('&lt;script&gt;'));
  assert.ok(rendered.includes('\n- &amp; 변경'));
});
