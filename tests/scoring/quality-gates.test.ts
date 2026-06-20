import { test } from 'node:test';
import assert from 'node:assert/strict';
import { classifyGate, NARRATION_GATES } from '../../src/scoring/quality-gates.ts';

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
