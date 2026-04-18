import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { observe, getMetrics, getMetricsSummary } from '../../src/observability/agent-observer.ts';

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
