import { test } from 'node:test';
import assert from 'node:assert/strict';
import { estimatePreflight, formatPreflight, assertWithinBudget, BudgetExceededError } from '../../src/scoring/preflight.ts';
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
