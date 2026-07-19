import { test } from 'node:test';
import assert from 'node:assert/strict';
import { classifyGate, NARRATION_GATES, buildQualityGateReport, type ScorerResult } from '../../src/scoring/quality-gates.ts';

const ful = (name: string, o: { passed: boolean; normalizedScore?: number; confidence?: number; reasoning?: string }): PromiseSettledResult<ScorerResult> => ({
  status: 'fulfilled',
  value: { scorerId: name, scorerName: name, score: o.normalizedScore ?? 0.9, normalizedScore: o.normalizedScore ?? 0.9, passed: o.passed, threshold: 0.7, reasoning: o.reasoning ?? 'ok', confidence: o.confidence ?? 0.9 },
});
const rej = (reason: string): PromiseSettledResult<ScorerResult> => ({ status: 'rejected', reason: new Error(reason) });

test('buildQualityGateReport', async (t) => {
  await t.test('all gates pass → passed, min/avg over conclusive', () => {
    const r = buildQualityGateReport([ful('toxicity', { passed: true, normalizedScore: 0.9 }), ful('bias', { passed: true, normalizedScore: 0.8 })], ['toxicity', 'bias'], { toxicity: 0.8, bias: 0.8 });
    assert.equal(r.passed, true);
    assert.equal(r.overall.passedGates, 2);
    assert.equal(r.overall.minScore, 0.8);
    assert.ok(Math.abs(r.overall.avgScore - 0.85) < 1e-9);
  });

  await t.test('any failed gate → not passed; failed names listed', () => {
    const r = buildQualityGateReport([ful('a', { passed: true }), ful('b', { passed: false, normalizedScore: 0.4 })], ['a', 'b'], {});
    assert.equal(r.passed, false);
    assert.deepEqual(r.overall.failedGates, ['b']);
  });

  await t.test('a rejected scorer is inconclusive (not a failure) and excluded from min/avg', () => {
    const r = buildQualityGateReport([ful('a', { passed: true, normalizedScore: 0.9 }), rej('boom')], ['a', 'b'], {});
    assert.equal(r.passed, true);
    assert.deepEqual(r.overall.inconclusiveGates, ['b']);
    assert.equal(r.overall.minScore, 0.9);
  });

  await t.test('all-inconclusive → not passed, min/avg default to 0', () => {
    const r = buildQualityGateReport([ful('a', { passed: true, confidence: 0.2 }), ful('b', { passed: false, confidence: 0.1 })], ['a', 'b'], {});
    assert.equal(r.passed, false);
    assert.equal(r.overall.passedGates, 0);
    assert.equal(r.overall.minScore, 0);
    assert.equal(r.overall.avgScore, 0);
    assert.equal(r.overall.inconclusiveGates.length, 2);
  });

  await t.test('passing requires at least one conclusive pass (no gates ≠ pass)', () => {
    const r = buildQualityGateReport([], [], {});
    assert.equal(r.passed, false);
  });
});

test('classifyGate', async (t) => {
  await t.test('confident pass → passed', () => {
    assert.equal(classifyGate({ passed: true, confidence: 0.9, reasoning: 'clean' }), 'passed');
  });

  await t.test('confident fail → failed', () => {
    assert.equal(classifyGate({ passed: false, confidence: 0.9, reasoning: 'toxic' }), 'failed');
  });

  await t.test('low confidence → inconclusive (not a failure)', () => {
    // The #40 live run: promptAlignment/biasDetection came back at confidence 0.3.
    assert.equal(classifyGate({ passed: true, confidence: 0.3, reasoning: 'x' }), 'inconclusive');
    assert.equal(classifyGate({ passed: false, confidence: 0.3, reasoning: 'x' }), 'inconclusive');
  });

  await t.test('unparseable judgment → inconclusive regardless of passed flag', () => {
    assert.equal(classifyGate({ passed: true, reasoning: 'Could not parse structured response' }), 'inconclusive');
    assert.equal(classifyGate({ passed: false, reasoning: 'Could not parse structured response' }), 'inconclusive');
  });

  await t.test('no confidence + clean reasoning → trust the passed flag', () => {
    assert.equal(classifyGate({ passed: true, reasoning: 'looks fine' }), 'passed');
    assert.equal(classifyGate({ passed: false, reasoning: 'looks bad' }), 'failed');
  });

  await t.test('minConfidence floor is configurable', () => {
    assert.equal(classifyGate({ passed: true, confidence: 0.6 }, 0.5), 'passed');
    assert.equal(classifyGate({ passed: true, confidence: 0.6 }, 0.7), 'inconclusive');
  });

  await t.test('confidence exactly at the floor passes (strict <)', () => {
    assert.equal(classifyGate({ passed: true, confidence: 0.5 }, 0.5), 'passed');
  });

  // Regression: a provided-but-garbage confidence must be inconclusive. The old
  // `typeof c === 'number'` guard let NaN through (typeof NaN === 'number', but
  // NaN < floor is false), trusting the passed flag unconditionally.
  await t.test('NaN confidence → inconclusive, not a trusted pass', () => {
    assert.equal(classifyGate({ passed: true, confidence: NaN }), 'inconclusive');
    assert.equal(classifyGate({ passed: false, confidence: NaN }), 'inconclusive');
  });

  await t.test('Infinity confidence → inconclusive', () => {
    assert.equal(classifyGate({ passed: true, confidence: Infinity }), 'inconclusive');
  });

  await t.test('borderline: a near-miss within the margin is inconclusive, not failed', () => {
    // The live case: biasDetection 0.7 vs threshold 0.8 on ad copy that scored
    // 0.8 on two other legs. Within one point → inconclusive.
    const bias = { passed: false, normalizedScore: 0.7, threshold: 0.8, confidence: 0.9 };
    assert.equal(classifyGate(bias, 0.5, 0.1), 'inconclusive');
    // A confident failure beyond the band still fails.
    assert.equal(classifyGate({ passed: false, normalizedScore: 0.6, threshold: 0.8, confidence: 0.9 }, 0.5, 0.1), 'failed');
    // Margin 0 (strict) → the near-miss fails as before.
    assert.equal(classifyGate(bias, 0.5, 0), 'failed');
    // The border is inclusive at exactly threshold - margin.
    assert.equal(classifyGate({ passed: false, normalizedScore: 0.7, threshold: 0.8, confidence: 0.9 }, 0.5, 0.1), 'inconclusive');
  });

  await t.test('borderline never rescues a low-confidence or unparseable score into a pass', () => {
    // Still inconclusive (not passed) — the band only softens failed→inconclusive.
    assert.equal(classifyGate({ passed: false, normalizedScore: 0.79, threshold: 0.8, confidence: 0.1 }, 0.5, 0.1), 'inconclusive');
  });
});

test('buildQualityGateReport borderline band', async (t) => {
  const biasFul = (passed: boolean, normalizedScore: number): PromiseSettledResult<ScorerResult> => ({
    status: 'fulfilled',
    value: { scorerId: 'biasDetection', scorerName: 'biasDetection', score: normalizedScore, normalizedScore, passed, threshold: 0.8, reasoning: 'ad copy', confidence: 0.9 },
  });
  await t.test('a 1-point bias near-miss no longer sinks the gate when one gate passes', () => {
    const r = buildQualityGateReport(
      [ful('toxicity', { passed: true, normalizedScore: 0.9 }), biasFul(false, 0.7)],
      ['toxicity', 'biasDetection'], { toxicity: 0.8, biasDetection: 0.8 }, 0.5, 0.1,
    );
    assert.equal(r.passed, true);
    assert.deepEqual(r.overall.failedGates, []);
    assert.deepEqual(r.overall.inconclusiveGates, ['biasDetection']);
  });
  await t.test('with margin 0 (strict) the same near-miss fails the gate', () => {
    const r = buildQualityGateReport(
      [ful('toxicity', { passed: true, normalizedScore: 0.9 }), biasFul(false, 0.7)],
      ['toxicity', 'biasDetection'], { toxicity: 0.8, biasDetection: 0.8 }, 0.5, 0,
    );
    assert.equal(r.passed, false);
    assert.deepEqual(r.overall.failedGates, ['biasDetection']);
  });
});

test('NARRATION_GATES excludes the Q&A-relationship scorers', () => {
  // Approach C (issue #40): only content-appropriate gates judge a verbatim narration.
  assert.deepEqual([...NARRATION_GATES], ['toxicity', 'biasDetection', 'faithfulness']);
  for (const banned of ['promptAlignment', 'answerRelevancy', 'hallucination', 'toneConsistency']) {
    assert.ok(!NARRATION_GATES.includes(banned as never), `${banned} must not be a narration gate`);
  }
});
