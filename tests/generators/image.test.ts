import { test } from 'node:test';
import assert from 'node:assert/strict';
import { resolveImageGenParams } from '../../src/generators/image.ts';

test('resolveImageGenParams', async (t) => {
  // Regression guard: the default provider/model regressed silently in the JSDoc
  // (still said OpenAI gpt-image-1). Pin the real defaults so a refactor can't
  // drift them back to the billing-blocked OpenAI path unnoticed.
  await t.test('defaults to Vertex Gemini image when nothing is set', () => {
    const p = resolveImageGenParams({}, {});
    assert.equal(p.provider, 'vertex');
    assert.equal(p.model, 'gemini-2.5-flash-image');
    assert.equal(p.aspectRatio, '16:9');
    assert.ok(p.negativePrompt.includes('text'));
  });

  await t.test('env overrides the defaults', () => {
    const p = resolveImageGenParams({}, { IMAGE_PROVIDER: 'openai', IMAGE_MODEL: 'gpt-image-1' });
    assert.equal(p.provider, 'openai');
    assert.equal(p.model, 'gpt-image-1');
  });

  await t.test('explicit opts win over env and defaults', () => {
    const p = resolveImageGenParams(
      { provider: 'replicate', model: 'flux', aspectRatio: '1:1', negativePrompt: 'none' },
      { IMAGE_PROVIDER: 'openai', IMAGE_MODEL: 'gpt-image-1' },
    );
    assert.equal(p.provider, 'replicate');
    assert.equal(p.model, 'flux');
    assert.equal(p.aspectRatio, '1:1');
    assert.equal(p.negativePrompt, 'none');
  });
});
