import { test } from 'node:test';
import assert from 'node:assert/strict';
import { ConsistencyVerdictSchema } from '../../src/schemas/consistency-verdict.ts';

const base = { consistent: true, score: 8, mismatches: [], fix_instruction: '' };

test('ConsistencyVerdictSchema', async (t) => {
  await t.test('accepts a valid verdict', () => {
    const v = ConsistencyVerdictSchema.parse(base);
    assert.equal(v.score, 8);
    assert.equal(v.consistent, true);
  });

  await t.test('accepts the score bounds 0 and 10', () => {
    assert.equal(ConsistencyVerdictSchema.parse({ ...base, score: 0 }).score, 0);
    assert.equal(ConsistencyVerdictSchema.parse({ ...base, score: 10 }).score, 10);
  });

  // Regression: an out-of-range score used to pass validation and could mis-fire
  // the regeneration gate. It must now be rejected (the critic then yields a null
  // verdict, which the b-roll loop treats as "don't regenerate").
  await t.test('rejects out-of-range scores', () => {
    assert.throws(() => ConsistencyVerdictSchema.parse({ ...base, score: -1 }));
    assert.throws(() => ConsistencyVerdictSchema.parse({ ...base, score: 11 }));
  });

  await t.test('rejects a missing required field', () => {
    const { fix_instruction: _omit, ...incomplete } = base;
    assert.throws(() => ConsistencyVerdictSchema.parse(incomplete));
  });
});
