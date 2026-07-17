import { test } from 'node:test';
import assert from 'node:assert/strict';
import { pacedVideoCall, isRateLimitError, resetVideoPacing, RATE_LIMIT_BACKOFF_MS } from '../../src/generators/pacing.ts';

function makeClock() {
  let t = 100_000;
  const sleeps: number[] = [];
  return {
    now: () => t,
    sleep: (ms: number) => {
      sleeps.push(ms);
      t += ms;
      return Promise.resolve();
    },
    advance: (ms: number) => { t += ms; },
    sleeps,
  };
}

test('isRateLimitError', () => {
  assert.equal(isRateLimitError(new Error('Replicate rate limit exceeded. Back off and retry.')), true);
  assert.equal(isRateLimitError(new Error('Request was throttled.')), true);
  assert.equal(isRateLimitError(new Error('predictions submit failed: 429 — {"detail":"..."}')), true);
  assert.equal(isRateLimitError(new Error('Replicate predictions submit failed: 404')), false);
  assert.equal(isRateLimitError(new Error('no video buffer returned')), false);
});

test('pacedVideoCall', async (t) => {
  await t.test('interval 0: no sleeps, single attempt', async () => {
    resetVideoPacing();
    const clock = makeClock();
    const out = await pacedVideoCall(async () => 'ok', { intervalMs: 0, retryDelaysMs: RATE_LIMIT_BACKOFF_MS, ...clock });
    assert.equal(out, 'ok');
    assert.deepEqual(clock.sleeps, []);
  });

  await t.test('second submit inside the interval waits out the remainder', async () => {
    resetVideoPacing();
    const clock = makeClock();
    const opts = { intervalMs: 12_000, retryDelaysMs: RATE_LIMIT_BACKOFF_MS, ...clock };
    await pacedVideoCall(async () => 1, opts);
    clock.advance(3_000);
    await pacedVideoCall(async () => 2, opts);
    assert.deepEqual(clock.sleeps, [9_000]);
  });

  await t.test('rate-limit errors retry through the backoff schedule, then succeed', async () => {
    resetVideoPacing();
    const clock = makeClock();
    let calls = 0;
    const out = await pacedVideoCall(
      async () => {
        calls++;
        if (calls < 3) throw new Error('Replicate rate limit exceeded. Back off and retry.');
        return 'clip';
      },
      { intervalMs: 0, retryDelaysMs: [15_000, 35_000], ...clock },
    );
    assert.equal(out, 'clip');
    assert.equal(calls, 3);
    assert.deepEqual(clock.sleeps, [15_000, 35_000]);
  });

  await t.test('non-rate-limit errors propagate immediately, no retry', async () => {
    resetVideoPacing();
    const clock = makeClock();
    let calls = 0;
    await assert.rejects(
      pacedVideoCall(
        async () => { calls++; throw new Error('Replicate predictions submit failed: 404'); },
        { intervalMs: 0, retryDelaysMs: [15_000], ...clock },
      ),
      /404/,
    );
    assert.equal(calls, 1);
    assert.deepEqual(clock.sleeps, []);
  });

  await t.test('exhausted backoff schedule rethrows the rate-limit error', async () => {
    resetVideoPacing();
    const clock = makeClock();
    let calls = 0;
    await assert.rejects(
      pacedVideoCall(
        async () => { calls++; throw new Error('Request was throttled.'); },
        { intervalMs: 0, retryDelaysMs: [10, 20], ...clock },
      ),
      /throttled/,
    );
    assert.equal(calls, 3);
  });
});
