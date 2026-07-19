import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
  REFERENCE_ROUTES, resolveReferenceMode, composeReferencePrompt,
  buildPredictionInput, pollPrediction, outputVideoUrl,
} from '../../src/generators/replicate-reference.ts';

test('resolveReferenceMode', async (t) => {
  await t.test('unset and blank mean off', () => {
    assert.equal(resolveReferenceMode({}), null);
    assert.equal(resolveReferenceMode({ BROLL_REFERENCE_MODE: '  ' }), null);
  });
  await t.test('resolves known aliases case-insensitively', () => {
    assert.equal(resolveReferenceMode({ BROLL_REFERENCE_MODE: 'WAN-R2V' })?.model, 'wan-video/wan-2.7-r2v');
  });
  await t.test('unknown alias throws instead of silently running unconditioned', () => {
    assert.throws(() => resolveReferenceMode({ BROLL_REFERENCE_MODE: 'wan-r2v-typo' }), /unknown/);
  });
});

test('composeReferencePrompt — binding tags always survive the clamp', async (t) => {
  const seedance = REFERENCE_ROUTES['seedance-2'];
  await t.test('tagless routes just clamp', () => {
    const p = composeReferencePrompt('a ring on a hand', 1, REFERENCE_ROUTES['wan-r2v']);
    assert.equal(p, 'a ring on a hand');
  });
  await t.test('tags lead the prompt and the scene is clamped around them', () => {
    const long = 'scene '.repeat(200);
    const p = composeReferencePrompt(long, 2, seedance);
    assert.match(p, /^The product is the subject shown in \[Image1\] \[Image2\]\. /);
    assert.ok(p.length <= 500 + 1, `composed prompt ${p.length} chars`);
  });
});

test('seedance routes pin a resolution their model actually accepts', async (t) => {
  // Schema-verified 2026-07-19: seedance-2.0-fast resolution enum is
  // ['480p','720p'] (no 1080p → a 1080p submit 422s), while seedance-2.0
  // allows up to 4k. A regression guard so the fast route never re-acquires 1080p.
  await t.test('seedance-2-fast is 720p (its max), seedance-2 is 1080p', () => {
    assert.equal(REFERENCE_ROUTES['seedance-2-fast'].extraInput?.resolution, '720p');
    assert.equal(REFERENCE_ROUTES['seedance-2'].extraInput?.resolution, '1080p');
  });
  await t.test('the fast route still bundles its other verified extras', () => {
    assert.equal(REFERENCE_ROUTES['seedance-2-fast'].extraInput?.generate_audio, false);
    assert.equal(REFERENCE_ROUTES['seedance-2-fast'].referenceKey, 'reference_images');
  });
});

test('buildPredictionInput', async (t) => {
  await t.test('carries refs under the route key with pinned extras', () => {
    const input = buildPredictionInput(REFERENCE_ROUTES['wan-r2v'], 'macro shot', ['https://x/ref.png'], { length: 4 });
    assert.deepEqual(input.reference_images, ['https://x/ref.png']);
    assert.equal(input.duration, 4);
    assert.equal(input.aspect_ratio, '16:9');
    assert.equal(input.resolution, '1080p');
  });
  await t.test('duration floors at 2 (wan minimum) and rounds', () => {
    assert.equal(buildPredictionInput(REFERENCE_ROUTES['wan-r2v'], 'x', [], { length: 1 }).duration, 2);
    assert.equal(buildPredictionInput(REFERENCE_ROUTES['wan-r2v'], 'x', [], {}).duration, 4);
  });
});

test('pollPrediction with injected fetch', async (t) => {
  process.env.REPLICATE_API_TOKEN ??= 'test-token';
  const responses = (bodies: object[]): typeof fetch => {
    let i = 0;
    return (async () => ({ ok: true, json: async () => bodies[Math.min(i++, bodies.length - 1)] })) as unknown as typeof fetch;
  };
  await t.test('returns on succeeded', async () => {
    const p = await pollPrediction('https://x/pred', responses([{ status: 'processing' }, { status: 'succeeded', output: 'https://x/v.mp4' }]), 1);
    assert.equal(p.status, 'succeeded');
  });
  await t.test('throws on failed with the provider detail', async () => {
    await assert.rejects(
      pollPrediction('https://x/pred', responses([{ status: 'failed', error: 'NSFW rejected' }]), 1),
      /failed: NSFW rejected/,
    );
  });
});

test('outputVideoUrl accepts string or array, rejects junk', () => {
  assert.equal(outputVideoUrl('https://x/v.mp4'), 'https://x/v.mp4');
  assert.equal(outputVideoUrl(['https://x/v.mp4']), 'https://x/v.mp4');
  assert.throws(() => outputVideoUrl({ nope: true }), /unexpected output shape/);
});
