import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
  buildShotPrompt,
  buildAnimationPrompt,
  shouldRegenerate,
  applyFixToPrompt,
  normalizeShotPlan,
} from '../../src/pipeline/broll-director.ts';
import type { Shot, ShotPlan } from '../../src/schemas/shot-plan.ts';
import type { ConsistencyVerdict } from '../../src/schemas/consistency-verdict.ts';

const shot = (over: Partial<Shot> = {}): Shot => ({
  scene_id: 'shot_01',
  beat: 'beat',
  shows_product: false,
  prompt: 'A cinematic close-up of a dark room',
  camera: 'slow push-in',
  ...over,
});

const BIBLE = 'a brushed-titanium smart ring with a warm gold inner edge';

test('buildShotPrompt', async (t) => {
  await t.test('non-product shot returns the scene prompt untouched', () => {
    assert.equal(buildShotPrompt(shot(), BIBLE), 'A cinematic close-up of a dark room');
  });

  await t.test('product shot injects the bible verbatim with a match instruction', () => {
    const out = buildShotPrompt(shot({ shows_product: true }), BIBLE);
    assert.ok(out.includes('A cinematic close-up of a dark room'), 'keeps the scene');
    assert.ok(out.includes(BIBLE), 'injects the canonical bible verbatim');
    assert.match(out, /EXACTLY this object/, 'forces identity match');
  });
});

test('buildAnimationPrompt appends camera direction', () => {
  assert.equal(
    buildAnimationPrompt(shot({ prompt: 'A ring on a pedestal', camera: 'orbit' })),
    'A ring on a pedestal Camera: orbit.',
  );
});

test('buildAnimationPrompt omits camera when blank', () => {
  assert.equal(buildAnimationPrompt(shot({ prompt: 'A ring', camera: '   ' })), 'A ring');
});

test('shouldRegenerate', async (t) => {
  const verdict = (over: Partial<ConsistencyVerdict>): ConsistencyVerdict => ({
    consistent: true, score: 9, mismatches: [], fix_instruction: '', ...over,
  });

  await t.test('regenerates when score is below threshold', () => {
    assert.equal(shouldRegenerate(verdict({ score: 4 }), 7), true);
  });
  await t.test('keeps the frame when score meets the threshold', () => {
    assert.equal(shouldRegenerate(verdict({ score: 7 }), 7), false);
    assert.equal(shouldRegenerate(verdict({ score: 9 }), 7), false);
  });
  await t.test('a null verdict (critic failed) does NOT trigger a regenerate loop', () => {
    assert.equal(shouldRegenerate(null, 7), false);
  });
});

test('applyFixToPrompt folds in the correction', () => {
  const out = applyFixToPrompt('base prompt', 'make the ring titanium, add the gold edge');
  assert.ok(out.startsWith('base prompt'));
  assert.match(out, /Correction.*titanium/);
});

test('applyFixToPrompt with empty fix returns the base unchanged', () => {
  assert.equal(applyFixToPrompt('base prompt', '   '), 'base prompt');
});

test('normalizeShotPlan', async (t) => {
  const plan = (shots: Shot[]): ShotPlan => ({
    product_bible: BIBLE, hero_prompt: 'hero', tone: 't', color_palette: 'c', shots,
  });

  await t.test('drops empty-prompt shots', () => {
    const out = normalizeShotPlan(plan([shot(), shot({ prompt: '  ' }), shot()]), 10);
    assert.equal(out.shots.length, 2);
  });

  await t.test('clamps to maxShots to bound paid fan-out', () => {
    const out = normalizeShotPlan(plan(Array.from({ length: 20 }, () => shot())), 8);
    assert.equal(out.shots.length, 8);
  });

  await t.test('preserves bible/tone/palette', () => {
    const out = normalizeShotPlan(plan([shot()]), 8);
    assert.equal(out.product_bible, BIBLE);
    assert.equal(out.tone, 't');
  });
});
