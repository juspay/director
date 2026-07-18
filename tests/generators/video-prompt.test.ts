import { test } from 'node:test';
import assert from 'node:assert/strict';
import { clampVideoPrompt } from '../../src/generators/index.ts';

test('clampVideoPrompt', async (t) => {
  await t.test('prompts within the tool limit pass through untouched', () => {
    const p = 'a'.repeat(500);
    assert.equal(clampVideoPrompt(p), p);
    assert.equal(clampVideoPrompt('short prompt'), 'short prompt');
  });
  await t.test('overlong prompts truncate on a word boundary under the limit', () => {
    const p = ('cinematic macro shot of a titanium ring ').repeat(20); // 800 chars
    const out = clampVideoPrompt(p);
    assert.ok(out.length <= 500);
    assert.ok(!out.endsWith(' '));
    assert.ok(p.startsWith(out));
    // must not cut mid-word: the next char in the source is a space boundary
    assert.notEqual(p[out.length], undefined);
  });
  await t.test('degenerate no-space prompts hard-truncate at the limit', () => {
    const out = clampVideoPrompt('x'.repeat(600));
    assert.equal(out.length, 500);
  });
});
