import { test } from 'node:test';
import assert from 'node:assert/strict';
import { aggregateRegressionGate } from '../../src/scoring/regression-gate.ts';

const cleanVbench = { passed: true, scores: { temporal_flickering: 0.95 }, issues: [] };

test('aggregateRegressionGate', async (t) => {
  await t.test('passes when there is no VMAF regression and temporal is clean', () => {
    const r = aggregateRegressionGate({
      vmaf: { regression: false, vmaf: 98.4, message: 'OK: VMAF 98.4' },
      vbench: cleanVbench,
    });
    assert.equal(r.passed, true);
    assert.deepEqual(r.reasons, []);
  });

  await t.test('fails on a VMAF regression', () => {
    const r = aggregateRegressionGate({
      vmaf: { regression: true, vmaf: 91.2, message: 'REGRESSION: VMAF 91.2' },
      vbench: cleanVbench,
    });
    assert.equal(r.passed, false);
    assert.match(r.reasons[0], /VMAF regression/);
  });

  await t.test('fails on temporal issues and lists each one', () => {
    const r = aggregateRegressionGate({
      vmaf: { regression: false, vmaf: 99, message: 'OK' },
      vbench: { passed: false, scores: { motion_smoothness: 0.7 }, issues: ['motion_smoothness: 0.700 < 0.85'] },
    });
    assert.equal(r.passed, false);
    assert.equal(r.reasons.length, 1);
    assert.match(r.reasons[0], /temporal — motion_smoothness/);
  });

  await t.test('aggregates both VMAF and temporal failures', () => {
    const r = aggregateRegressionGate({
      vmaf: { regression: true, vmaf: 80, message: 'REGRESSION: VMAF 80' },
      vbench: { passed: false, scores: {}, issues: ['temporal_flickering: 0.80 < 0.90'] },
    });
    assert.equal(r.passed, false);
    assert.equal(r.reasons.length, 2);
  });

  await t.test('no reference (vmaf null) → gate rests on temporal only', () => {
    const r = aggregateRegressionGate({ vmaf: null, vbench: cleanVbench });
    assert.equal(r.passed, true);
    assert.equal(r.vmaf, null);
  });
});
