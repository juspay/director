import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { exponentialBackoff, sleep } from '../../src/utils/rate-limit.ts';

describe('exponentialBackoff', () => {
  it('returns success on first attempt when fn succeeds', async () => {
    const result = await exponentialBackoff(async () => 'ok', 3, 1);
    assert.equal(result.success, true);
    if (result.success) assert.equal(result.value, 'ok');
  });

  it('retries then succeeds', async () => {
    let attempts = 0;
    const result = await exponentialBackoff(
      async () => {
        attempts++;
        if (attempts < 3) throw new Error('transient');
        return 'finally';
      },
      5,
      1,
    );
    assert.equal(result.success, true);
    assert.equal(attempts, 3);
    if (result.success) assert.equal(result.value, 'finally');
  });

  it('returns failure after exhausting retries', async () => {
    const result = await exponentialBackoff(
      async () => {
        throw new Error('permanent failure');
      },
      2,
      1,
    );
    assert.equal(result.success, false);
    if (!result.success) assert.match(result.error, /permanent failure/);
  });

  it('never throws — always returns discriminated union', async () => {
    const result = await exponentialBackoff(
      async () => {
        throw new Error('boom');
      },
      1,
      1,
    );
    assert.equal(result.success, false);
  });

  it('handles non-Error throws', async () => {
    const result = await exponentialBackoff(
      async () => {
        throw 'string rejection';
      },
      1,
      1,
    );
    assert.equal(result.success, false);
    if (!result.success) assert.match(result.error, /string rejection/);
  });
});

describe('sleep', () => {
  it('resolves after at least the specified delay', async () => {
    const start = Date.now();
    await sleep(50);
    const elapsed = Date.now() - start;
    assert.ok(elapsed >= 45, `expected >= 45ms, got ${elapsed}ms`);
  });
});
