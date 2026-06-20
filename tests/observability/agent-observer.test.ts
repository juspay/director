import { describe, it, before, after } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import path from 'node:path';
import os from 'node:os';
import { observe, getMetrics, getMetricsSummary } from '../../src/observability/agent-observer.ts';

// observe() persists metrics via appendToLog → isolate to a tmp dir so the tests
// don't pollute the real .pipeline-state/agent-metrics.jsonl.
let tmpDir: string;
before(async () => {
  tmpDir = await fs.mkdtemp(path.join(os.tmpdir(), 'director-test-observer-'));
  process.env.STATE_DIR_OVERRIDE = tmpDir;
});
after(async () => {
  delete process.env.STATE_DIR_OVERRIDE;
  await fs.rm(tmpDir, { recursive: true, force: true });
});

describe('agent-observer', () => {
  it('observe() records a successful execution and returns result + metrics', async () => {
    const baseline = getMetrics().length;
    const { result, metrics } = await observe('test-agent', async () => ({ value: 42 }));
    assert.deepEqual(result, { value: 42 });
    assert.equal(metrics.agentName, 'test-agent');
    assert.equal(metrics.success, true);
    assert.ok(metrics.executionTimeMs >= 0);
    assert.equal(getMetrics().length, baseline + 1);
  });

  it('observe() catches errors without rethrowing and marks success=false', async () => {
    const baseline = getMetrics().length;
    const { result, metrics } = await observe('failing-agent', async () => {
      throw new Error('kaboom');
    });
    assert.equal(result, null);
    assert.equal(metrics.success, false);
    assert.equal(metrics.agentName, 'failing-agent');
    assert.equal(getMetrics().length, baseline + 1);
  });

  it('observe() treats null result as failure', async () => {
    const { result, metrics } = await observe('null-agent', async () => null);
    assert.equal(result, null);
    assert.equal(metrics.success, false);
  });

  // Regression: the old `result !== null` flagged an `undefined` return as a
  // success (undefined !== null === true).
  it('observe() treats undefined result as failure', async () => {
    const { metrics } = await observe('undef-agent', async () => undefined);
    assert.equal(metrics.success, false);
  });

  it('observe() treats a returned object as success', async () => {
    const { metrics } = await observe('obj-agent', async () => ({ score: 7 }));
    assert.equal(metrics.success, true);
  });

  // Regression: tokensUsed was a TS-only cast — a string '300' was stored as a
  // string at runtime, breaking downstream cost math. It must be coerced.
  it('observe() coerces a string tokensUsed to a number', async () => {
    const { metrics } = await observe('tok-string', async () => ({ tokensUsed: '300' }));
    assert.equal(metrics.tokensUsed, 300);
    assert.equal(typeof metrics.tokensUsed, 'number');
  });

  it('observe() defaults a missing/garbage tokensUsed to 0', async () => {
    const a = await observe('tok-missing', async () => ({ ok: true }));
    assert.equal(a.metrics.tokensUsed, 0);
    const b = await observe('tok-garbage', async () => ({ tokensUsed: 'lots' }));
    assert.equal(b.metrics.tokensUsed, 0);
  });

  it('getMetricsSummary aggregates counts correctly', async () => {
    await observe('summary-agent', async () => ({ ok: true }));
    const summary = getMetricsSummary();
    assert.ok(summary.total >= 1);
    assert.ok(summary.succeeded >= 1);
    assert.equal(typeof summary.failed, 'number');
    assert.equal(typeof summary.totalCost, 'number');
    assert.equal(typeof summary.totalTimeMs, 'number');
  });

  it('getMetrics returns a copy, not the live buffer', async () => {
    const a = getMetrics();
    const b = getMetrics();
    assert.notEqual(a, b, 'should return defensive copy');
    assert.deepEqual(a, b, 'contents should be equal');
  });
});
