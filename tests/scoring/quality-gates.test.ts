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
});

test('NARRATION_GATES excludes the Q&A-relationship scorers', () => {
  // Approach C (issue #40): only content-appropriate gates judge a verbatim narration.
  assert.deepEqual([...NARRATION_GATES], ['toxicity', 'biasDetection', 'faithfulness']);
  for (const banned of ['promptAlignment', 'answerRelevancy', 'hallucination', 'toneConsistency']) {
    assert.ok(!NARRATION_GATES.includes(banned as never), `${banned} must not be a narration gate`);
  }
});
