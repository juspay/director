import { test } from 'node:test';
import assert from 'node:assert/strict';
import { diagnoseError, withDoctor, type DoctorEvent } from '../../src/generators/doctor.ts';

const NO_BACKOFF = () => 0;

test('diagnoseError', async (t) => {
  await t.test('safety blocks are retryable with a prompt rewrite', () => {
    const d = diagnoseError('Request blocked by safety policy: violates content guidelines');
    assert.deepEqual(d, { kind: 'safety', retryable: true, rewritePrompt: true });
  });
  await t.test('quota/429 retries without rewriting', () => {
    assert.equal(diagnoseError('429 Too Many Requests').kind, 'quota');
    assert.equal(diagnoseError('Resource exhausted: rate limit').rewritePrompt, false);
  });
  await t.test('transient network failures are retryable', () => {
    for (const msg of ['ETIMEDOUT: timed out', 'socket hang up ECONNRESET', 'HTTP 503 service unavailable']) {
      const d = diagnoseError(msg);
      assert.equal(d.retryable, true, msg);
      assert.equal(d.kind, 'transient', msg);
    }
  });
  await t.test('invalid params are not retryable (same call, same rejection)', () => {
    const d = diagnoseError('Invalid argument: resolution must be one of 720p, 1080p');
    assert.deepEqual(d, { kind: 'invalid_param', retryable: false, rewritePrompt: false });
  });
  await t.test('unknown errors (incl. budget aborts) are never retried', () => {
    assert.equal(diagnoseError('Budget of $5.00 would be exceeded by this run').retryable, false);
    assert.equal(diagnoseError('something completely novel').retryable, false);
  });
});

test('withDoctor', async (t) => {
  await t.test('success passes straight through', async () => {
    let calls = 0;
    const out = await withDoctor(async (p) => { calls++; return p.toUpperCase(); }, 'ok', { backoffMs: NO_BACKOFF });
    assert.equal(out, 'OK');
    assert.equal(calls, 1);
  });

  await t.test('retries once on a transient failure, same prompt', async () => {
    let calls = 0;
    const prompts: string[] = [];
    const out = await withDoctor(async (p) => {
      prompts.push(p); calls++;
      if (calls === 1) throw new Error('HTTP 503 service unavailable');
      return 'done';
    }, 'steady prompt', { backoffMs: NO_BACKOFF });
    assert.equal(out, 'done');
    assert.deepEqual(prompts, ['steady prompt', 'steady prompt']);
  });

  await t.test('safety failure invokes the rewriter and retries with the new prompt', async () => {
    const prompts: string[] = [];
    const events: DoctorEvent[] = [];
    const out = await withDoctor(async (p) => {
      prompts.push(p);
      if (prompts.length === 1) throw new Error('blocked by safety policy');
      return p;
    }, 'edgy prompt', {
      backoffMs: NO_BACKOFF,
      rewrite: async () => 'gentle prompt',
      onEvent: (e) => events.push(e),
    });
    assert.equal(out, 'gentle prompt');
    assert.deepEqual(prompts, ['edgy prompt', 'gentle prompt']);
    assert.deepEqual(events, [{ attempt: 0, kind: 'safety', action: 'retry_rewritten' }]);
  });

  await t.test('a failed or unchanged rewrite still retries with the original prompt', async () => {
    const prompts: string[] = [];
    await withDoctor(async (p) => {
      prompts.push(p);
      if (prompts.length === 1) throw new Error('safety violation');
      return p;
    }, 'same', { backoffMs: NO_BACKOFF, rewrite: async () => null });
    assert.deepEqual(prompts, ['same', 'same']);
  });

  await t.test('non-retryable failures rethrow immediately, no extra calls', async () => {
    let calls = 0;
    await assert.rejects(
      withDoctor(async () => { calls++; throw new Error('Invalid argument: bad resolution'); }, 'p', { backoffMs: NO_BACKOFF }),
      /Invalid argument/,
    );
    assert.equal(calls, 1);
  });

  await t.test('gives up after the retry budget and rethrows the last error', async () => {
    let calls = 0;
    const events: DoctorEvent[] = [];
    await assert.rejects(
      withDoctor(async () => { calls++; throw new Error('429 too many requests'); }, 'p', {
        retries: 2, backoffMs: NO_BACKOFF, onEvent: (e) => events.push(e),
      }),
      /429/,
    );
    assert.equal(calls, 3);
    assert.deepEqual(events.map((e) => e.action), ['retry', 'retry', 'give_up']);
  });

  await t.test('retries: 0 disables the loop entirely', async () => {
    let calls = 0;
    await assert.rejects(
      withDoctor(async () => { calls++; throw new Error('timeout'); }, 'p', { retries: 0, backoffMs: NO_BACKOFF }),
    );
    assert.equal(calls, 1);
  });
});

// Live B8 regression: "must be 500 characters or less (got 503)" contains two
// bare numbers the transient bucket's status-code heuristic matched — the
// invalid_param check must win, or the same doomed call retries on spend.
test('prompt-length rejections classify invalid_param, not transient', () => {
  const d = diagnoseError("Invalid parameters for tool 'video-generation': Video prompt must be 500 characters or less (got 503)");
  assert.equal(d.kind, 'invalid_param');
  assert.equal(d.retryable, false);
});
