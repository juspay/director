import { test } from 'node:test';
import assert from 'node:assert/strict';
import { composeCreativeInput } from '../../src/agents/creative-director.ts';

test('composeCreativeInput', async (t) => {
  await t.test('includes the project title and full script', () => {
    const out = composeCreativeInput('Tara: launch', 'Meet Tara.');
    assert.ok(out.includes('Project: Tara: launch'));
    assert.ok(out.includes('SCRIPT:\nMeet Tara.'));
  });

  await t.test('injects a BRAND CONTEXT section when brand context is provided', () => {
    const out = composeCreativeInput('T', 'script', 'Warm, friendly, never corporate.');
    assert.ok(out.includes('BRAND CONTEXT'));
    assert.ok(out.includes('Warm, friendly, never corporate.'));
  });

  await t.test('omits the BRAND CONTEXT section for empty/whitespace/undefined context', () => {
    for (const ctx of [undefined, '', '   ']) {
      const out = composeCreativeInput('T', 'script', ctx);
      assert.ok(!out.includes('BRAND CONTEXT'), `no brand section for ${JSON.stringify(ctx)}`);
    }
  });

  await t.test('keeps the creative-direction system instructions', () => {
    const out = composeCreativeInput('T', 'script');
    assert.ok(out.includes('creative director'));
  });
});
