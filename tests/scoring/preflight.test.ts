import { test } from 'node:test';
import assert from 'node:assert/strict';
import { estimatePreflight, formatPreflight, assertWithinBudget, pendingShotCounts, BudgetExceededError } from '../../src/scoring/preflight.ts';
import type { PreflightInputs } from '../../src/scoring/preflight.ts';

// A representative director-mode run: 8 shots × 4s vertex video, hero + one
// keyframe each, 3 product shots that can each regen up to 2 times.
const DIRECTOR: PreflightInputs = {
  shots: 8, segLen: 4, videoProvider: 'vertex', imageProvider: 'vertex',
  heroNeeded: true, productShots: 3, maxRegen: 2,
};

test('estimatePreflight', async (t) => {
  await t.test('prices video and the best/worst keyframe range from the rate table', () => {
    const e = estimatePreflight(DIRECTOR);
    assert.equal(e.videoUsd, 12.8);        // 8 × 4s × $0.40
    assert.equal(e.imagesBest, 9);         // hero + 8 keyframes
    assert.equal(e.imagesWorst, 15);       // + 3 product shots × 2 regens
    assert.equal(e.imagesBestUsd, 0.35);   // 9 × $0.039 → rounded
    assert.equal(e.imagesWorstUsd, 0.59);  // 15 × $0.039 → rounded
    assert.equal(e.bestUsd, 13.15);
    assert.equal(e.worstUsd, 13.39);
  });

  await t.test('a cached hero drops one image from both bounds', () => {
    const e = estimatePreflight({ ...DIRECTOR, heroNeeded: false });
    assert.equal(e.imagesBest, 8);
    assert.equal(e.imagesWorst, 14);
  });

  await t.test('no product shots (concept mode) collapses the range', () => {
    const e = estimatePreflight({ ...DIRECTOR, productShots: 0, maxRegen: 0 });
    assert.equal(e.imagesBest, e.imagesWorst);
    assert.equal(e.bestUsd, e.worstUsd);
  });

  await t.test('unknown providers price at $0 — the projection never blocks a free path', () => {
    const e = estimatePreflight({ ...DIRECTOR, videoProvider: 'none', imageProvider: 'none' });
    assert.equal(e.videoUsd, 0);
    assert.equal(e.worstUsd, 0);
  });

  await t.test('honors the same env overrides the tracker bills with', () => {
    const prev = process.env.VERTEX_VIDEO_PER_SEC;
    process.env.VERTEX_VIDEO_PER_SEC = '0.10';
    try {
      const e = estimatePreflight(DIRECTOR);
      assert.equal(e.videoUsd, 3.2); // 32s × $0.10 override
    } finally {
      if (prev === undefined) delete process.env.VERTEX_VIDEO_PER_SEC;
      else process.env.VERTEX_VIDEO_PER_SEC = prev;
    }
  });
});

test('videoModel routes the projection through per-model rates', async (t) => {
  await t.test('projection and billing agree on the per-model price', () => {
    const prev = process.env.VIDEO_MODEL_RATES;
    process.env.VIDEO_MODEL_RATES = '{"replicate:minimax/hailuo-2.3-fast":0.03}';
    try {
      const flat = estimatePreflight({ ...DIRECTOR, videoProvider: 'replicate' });
      const perModel = estimatePreflight({ ...DIRECTOR, videoProvider: 'replicate', videoModel: 'minimax/hailuo-2.3-fast' });
      assert.equal(flat.videoUsd, 2.88);     // 32s × flat $0.09
      assert.equal(perModel.videoUsd, 0.96); // 32s × per-model $0.03
    } finally {
      if (prev === undefined) delete process.env.VIDEO_MODEL_RATES;
      else process.env.VIDEO_MODEL_RATES = prev;
    }
  });

  await t.test('formatPreflight names the model so the console line matches the log', () => {
    const inp: PreflightInputs = { ...DIRECTOR, videoProvider: 'replicate', videoModel: 'minimax/hailuo-2.3-fast' };
    const line = formatPreflight(estimatePreflight(inp), inp, 0);
    assert.match(line, /@ replicate:minimax\/hailuo-2\.3-fast\)/);
  });
});

test('formatPreflight prints the range and the already-logged figure', () => {
  const e = estimatePreflight(DIRECTOR);
  const line = formatPreflight(e, DIRECTOR, 0.02);
  assert.match(line, /video \$12\.80 \(8×4s @ vertex\)/);
  assert.match(line, /9–15 images \$0\.35–\$0\.59/);
  assert.match(line, /\$13\.15–\$13\.39 this phase/);
  assert.match(line, /\$0\.02 already logged/);
});

test('assertWithinBudget', async (t) => {
  const e = estimatePreflight(DIRECTOR); // worst $13.39

  await t.test('no cap (undefined / null / NaN / 0) never throws', () => {
    assertWithinBudget(100, e, undefined);
    assertWithinBudget(100, e, null);
    assertWithinBudget(100, e, NaN);
    assertWithinBudget(100, e, 0);
  });

  await t.test('within budget passes', () => {
    assertWithinBudget(0.5, e, 14);
  });

  await t.test('over budget throws BudgetExceededError with the figures', () => {
    assert.throws(
      () => assertWithinBudget(0, e, 10),
      (err: unknown) => err instanceof BudgetExceededError
        && /\$13\.39/.test((err as Error).message)
        && /\$10\.00/.test((err as Error).message),
    );
  });

  await t.test('already-logged spend counts toward the cap', () => {
    // Projection alone fits a $15 cap; $2 already spent pushes it over.
    assertWithinBudget(0, e, 15);
    assert.throws(() => assertWithinBudget(2, e, 15), BudgetExceededError);
  });
});

test('candidate pools multiply product-shot image counts', async (t) => {
  const base = {
    shots: 8, segLen: 4, videoProvider: 'none', imageProvider: 'vertex',
    heroNeeded: true, productShots: 3, maxRegen: 2,
  };
  await t.test('candidates: 1 (and omitted) reduce to the classic formulas', () => {
    const classic = estimatePreflight(base);
    const explicit = estimatePreflight({ ...base, candidates: 1 });
    assert.equal(classic.imagesBest, 9);
    assert.equal(classic.imagesWorst, 15);
    assert.deepEqual(explicit, classic);
  });
  await t.test('candidates: 3 prices the pool on every product-shot attempt', () => {
    const est = estimatePreflight({ ...base, candidates: 3 });
    // best: hero 1 + 8 shots + 3 product shots × 2 extra candidates = 15
    assert.equal(est.imagesBest, 15);
    // worst: best + 3 product shots × 3 candidates × 2 regens = 33
    assert.equal(est.imagesWorst, 33);
  });
});

test('pendingShotCounts prices only shots whose segments are not cached', async (t) => {
  // Index-aligned shows_product flags for a 5-shot plan: shots 1 and 3 show
  // the product.
  const flags = [false, true, false, true, false];

  await t.test('nothing cached → full plan counts', () => {
    assert.deepEqual(pendingShotCounts(flags, new Set()), { shots: 5, productShots: 2 });
  });

  await t.test('cached segments drop from both counts', () => {
    // Shots 0-2 rendered before the run died — a regen of 3 and 4 prices two
    // shots, one of which shows the product.
    assert.deepEqual(pendingShotCounts(flags, new Set([0, 1, 2])), { shots: 2, productShots: 1 });
  });

  await t.test('fully cached plan projects zero paid shots', () => {
    assert.deepEqual(pendingShotCounts(flags, new Set([0, 1, 2, 3, 4])), { shots: 0, productShots: 0 });
  });

  await t.test('stale indices beyond the plan are ignored', () => {
    assert.deepEqual(pendingShotCounts(flags, new Set([7, 9])), { shots: 5, productShots: 2 });
  });

  await t.test('a zero-shot projection passes any budget (regen with all segments intact)', () => {
    const est = estimatePreflight({
      shots: 0, segLen: 4, videoProvider: 'vertex', imageProvider: 'vertex',
      heroNeeded: false, productShots: 0, maxRegen: 2,
    });
    assert.equal(est.worstUsd, 0);
    assert.doesNotThrow(() => assertWithinBudget(10.30, est, 10.31));
  });
});
