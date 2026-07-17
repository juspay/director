import { test } from 'node:test';
import assert from 'node:assert/strict';
import { pickTargetDims } from '../../src/agents/comparator-media.ts';
import { buildComparisonPrompt } from '../../src/agents/video-comparator.ts';

test('pickTargetDims', async (t) => {
  await t.test('matched pairs need no normalization', () => {
    assert.equal(pickTargetDims({ width: 1920, height: 1080 }, { width: 1920, height: 1080 }), null);
  });
  await t.test('the live case: 1080p draft vs 720p baseline → downscale to 720p', () => {
    assert.deepEqual(
      pickTargetDims({ width: 1280, height: 720 }, { width: 1920, height: 1080 }),
      { width: 1280, height: 720 },
    );
    assert.deepEqual(
      pickTargetDims({ width: 1920, height: 1080 }, { width: 1280, height: 720 }),
      { width: 1280, height: 720 },
    );
  });
  await t.test('equal height falls back to smaller width', () => {
    assert.deepEqual(
      pickTargetDims({ width: 1920, height: 1080 }, { width: 1440, height: 1080 }),
      { width: 1440, height: 1080 },
    );
  });
});

test('buildComparisonPrompt', async (t) => {
  await t.test('carries the product-fidelity dimensions as critical', () => {
    const p = buildComparisonPrompt();
    assert.match(p, /product_identity \(CRITICAL\)/);
    assert.match(p, /brand_assets \(CRITICAL\)/);
    assert.match(p, /caps that video's overall score/);
  });
  await t.test('declares resolution a non-signal (inputs are normalized)', () => {
    const p = buildComparisonPrompt();
    assert.match(p, /normalized to the same resolution/);
    assert.match(p, /NOT quality signals/);
  });
  await t.test('embeds the product context only when provided', () => {
    assert.match(buildComparisonPrompt('Aether is a titanium smart ring.'), /titanium smart ring/);
    assert.doesNotMatch(buildComparisonPrompt(), /---/);
  });
});
