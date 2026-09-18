const { test } = require('node:test');
const assert = require('node:assert/strict');
const { readFileSync } = require('node:fs');
const { join } = require('node:path');
const { runInNewContext } = require('node:vm');
const source = readFileSync(join(__dirname, '../steam-auth/callback.js'), 'utf8');

function run(hash = '', search = '', rejectHistory = false) {
  const message = { textContent: '' };
  let ready, cleaned, redirected, hashChanged;
  const context = {
    URLSearchParams,
    window: {
      addEventListener: (event, handler) => { assert.equal(event, 'hashchange'); hashChanged = handler; },
      location: { hash, search, pathname: '/steam-auth/', replace: (path) => { redirected = path; } },
      history: { replaceState: (state, title, path) => {
        if (rejectHistory) throw new Error('Unavailable');
        assert.equal(state, null);
        assert.equal(title, '');
        cleaned = path;
        context.window.location.hash = '';
        context.window.location.search = '';
      } }
    },
    document: {
      addEventListener: (event, handler) => { assert.equal(event, 'DOMContentLoaded'); ready = handler; },
      getElementById: (id) => { assert.equal(id, 'message'); return message; }
    }
  };
  // No storage, fetch, DOM injection, or console API is supplied.
  runInNewContext(source, context);
  assert.equal(cleaned || redirected, '/steam-auth/', 'URL cleaned synchronously');
  if (ready) ready();
  assert.equal(message.textContent.includes('SYNTHETIC'), false);
  return {
    message: message.textContent,
    redirected,
    changeHash: (hash) => {
      context.window.location.hash = hash;
      hashChanged();
      assert.equal(context.window.location.hash, '');
      return message.textContent;
    }
  };
}

test('direct visit gives app-start guidance', () => {
  assert.match(run().message, /^Start Steam sign-in/);
});
test('success candidate gives return guidance, never authenticates', () => {
  const result = run('#access_token=SYNTHETIC_ONLY&token_type=steam&state=SYNTHETIC_STATE');
  assert.match(result.message, /^Return to Iris/);
  assert.doesNotMatch(result.message, /successful|connected/i);
});
test('denial is fixed text and does not echo provider descriptions', () => {
  assert.match(run('#error=access_denied&state=SYNTHETIC&error_description=%3Cscript%3E').message, /^Steam access was not granted/);
});
const invalid = [
  '#access_token=SYNTHETIC&token_type=steam',
  '#access_token=SYNTHETIC&token_type=steam&state=',
  '#access_token=&token_type=steam&state=SYNTHETIC',
  '#access_token=SYNTHETIC&token_type=bearer&state=SYNTHETIC',
  '#access_token=SYNTHETIC&token_type=steam&state=a&state=b',
  '#access_token=SYNTHETIC&access_token=second&token_type=steam&state=a',
  '#access_token=SYNTHETIC&token_type=steam&state=a&error=access_denied',
  '#error=access_denied',
  '#error=unknown&state=SYNTHETIC',
  '#code=SYNTHETIC&state=a',
  '#access_token=SYNTHETIC&token_type=steam&state=a&code=code',
  '#access_token=%ZZ&token_type=steam&state=a',
  '#access_token=%E0%A4&token_type=steam&state=a',
  '#unexpected=value',
  '#' + 'x'.repeat(16385)
];
invalid.forEach((hash, index) => {
  test('reject malformed/ambiguous fragment case ' + (index + 1), () => {
    assert.match(run(hash).message, /^This sign-in response could not be used/);
  });
});
test('query responses are cleared and never accepted', () => {
  assert.match(run('', '?access_token=SYNTHETIC&state=a').message, /^This sign-in response/);
  assert.match(run('#access_token=SYNTHETIC&token_type=steam&state=a', '?state=b').message, /^This sign-in response/);
});
test('unavailable history replacement falls back to a clean navigation', () => {
  assert.equal(run('#access_token=SYNTHETIC&token_type=steam&state=a', '', true).redirected, '/steam-auth/');
});

test('a fragment arriving in the same document is also discarded', () => {
  const page = run();
  assert.match(page.changeHash('#access_token=SYNTHETIC&token_type=steam&state=a'), /^Return to Iris/);
  assert.match(page.changeHash('#error=access_denied&state=a'), /^Steam access was not granted/);
  assert.match(page.changeHash('#access_token=SYNTHETIC'), /^This sign-in response/);
});
