import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { exponentialBackoff, sleep, isQuotaError } from '../../src/utils/rate-limit.ts';

describe('isQuotaError', () => {
  it('matches genuine quota / rate-limit markers', () => {
    for (const m of ['HTTP 429', 'RESOURCE_EXHAUSTED', 'quota exceeded', 'Rate limit reached', 'rate_limit', 'rate-limit', 'Too Many Requests']) {
      assert.equal(isQuotaError(m), true, `should match: ${m}`);
    }
  });

  // Regression: the old bare includes('rate') fired on these, wrongly applying
  // exponential backoff to non-quota errors.
  it('does NOT match innocent messages that merely contain "rate"', () => {
    for (const m of ['failed to iterate results', 'moderate rate of failures', 'exchange rate unavailable', 'could not generate image']) {
      assert.equal(isQuotaError(m), false, `should not match: ${m}`);
    }
  });
});

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
