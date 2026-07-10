import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import { CostTracker } from '../../src/scoring/cost-tracker.ts';

// mkdtemp (not a predictable os.tmpdir() filename) — guards the shared temp dir
// against symlink races (CodeQL js/insecure-temporary-file) and isolates
// concurrent test runs. Callers clean up the parent dir.
const tmpLog = async () => path.join(await fs.mkdtemp(path.join(os.tmpdir(), 'director-cost-')), 'cost_log.jsonl');

test('CostTracker.estimate', async (t) => {
  await t.test('vertex/Veo video billed per second (the #40 gap)', async () => {
    const p = await tmpLog();
    const ct = new CostTracker(p);
    await ct.reset();
    await ct.log('vertex', 'broll-video', { seconds: 10 });
    assert.equal((await ct.getSummary()).total, 4.0); // 10s × $0.40
    await fs.rm(path.dirname(p), { recursive: true, force: true });
  });

  await t.test('TTS billed per 1k chars, per provider key', async () => {
    const p = await tmpLog();
    const ct = new CostTracker(p);
    await ct.reset();
    await ct.log('openai', 'tts', { chars: 1000 });
    await ct.log('elevenlabs', 'tts', { chars: 1000 });
    const s = await ct.getSummary();
    assert.equal(s.byProvider.openai, 0.015);
    assert.equal(s.byProvider.elevenlabs, 0.30);
    await fs.rm(path.dirname(p), { recursive: true, force: true });
  });

  await t.test('unknown provider estimates $0, never throws', async () => {
    const p = await tmpLog();
    const ct = new CostTracker(p);
    await ct.reset();
    await ct.log('does-not-exist', 'op', { seconds: 100 });
    assert.equal((await ct.getSummary()).total, 0);
    await fs.rm(path.dirname(p), { recursive: true, force: true });
  });

  await t.test('VERTEX_VIDEO_PER_SEC overrides the Veo rate', async () => {
    const prev = process.env.VERTEX_VIDEO_PER_SEC;
    process.env.VERTEX_VIDEO_PER_SEC = '0.15';
    try {
      const p = await tmpLog();
      const ct = new CostTracker(p);
      await ct.reset();
      await ct.log('vertex', 'broll-video', { seconds: 10 });
      assert.equal((await ct.getSummary()).total, 1.5); // 10s × $0.15 override
      await fs.rm(path.dirname(p), { recursive: true, force: true });
    } finally {
      if (prev === undefined) delete process.env.VERTEX_VIDEO_PER_SEC;
      else process.env.VERTEX_VIDEO_PER_SEC = prev;
    }
  });

  await t.test('VERTEX_VIDEO_PER_SEC=0 means free, not the default rate', async () => {
    const prev = process.env.VERTEX_VIDEO_PER_SEC;
    process.env.VERTEX_VIDEO_PER_SEC = '0'; // explicit zero must NOT fall back to $0.40
    try {
      const p = await tmpLog();
      const ct = new CostTracker(p);
      await ct.reset();
      await ct.log('vertex', 'broll-video', { seconds: 10 });
      assert.equal((await ct.getSummary()).total, 0);
      await fs.rm(path.dirname(p), { recursive: true, force: true });
    } finally {
      if (prev === undefined) delete process.env.VERTEX_VIDEO_PER_SEC;
      else process.env.VERTEX_VIDEO_PER_SEC = prev;
    }
  });

  await t.test('unparseable VERTEX_VIDEO_PER_SEC falls back to the default rate', async () => {
    const prev = process.env.VERTEX_VIDEO_PER_SEC;
    process.env.VERTEX_VIDEO_PER_SEC = 'not-a-number';
    try {
      const p = await tmpLog();
      const ct = new CostTracker(p);
      await ct.reset();
      await ct.log('vertex', 'broll-video', { seconds: 10 });
      assert.equal((await ct.getSummary()).total, 4.0); // back to 10s × $0.40
      await fs.rm(path.dirname(p), { recursive: true, force: true });
    } finally {
      if (prev === undefined) delete process.env.VERTEX_VIDEO_PER_SEC;
      else process.env.VERTEX_VIDEO_PER_SEC = prev;
    }
  });
});

test('CostTracker.reset scopes the summary to one run', async () => {
  const p = await tmpLog();
  const ct = new CostTracker(p);
  await ct.log('vertex', 'broll-video', { seconds: 8 });
  await ct.reset();
  await ct.log('openai', 'tts', { chars: 500 });
  const s = await ct.getSummary();
  assert.equal(s.total, 0.0075);          // only the post-reset entry counts
  assert.equal(s.byProvider.vertex, undefined);
  await fs.rm(path.dirname(p), { recursive: true, force: true });
});

test('CostTracker.getSummary on a fresh/missing log returns zero', async () => {
  const p = await tmpLog();
  const ct = new CostTracker(p);
  const s = await ct.getSummary();
  assert.equal(s.total, 0);
  assert.deepEqual(s.byProvider, {});
  await fs.rm(path.dirname(p), { recursive: true, force: true });
});

// Per-run state isolation: the runner constructs its CostTracker at module load
// and only scopes STATE_DIR_OVERRIDE inside runPipeline(). The default log path
// must therefore resolve at call time, not construction time.
test('CostTracker default path follows STATE_DIR_OVERRIDE set after construction', async () => {
  const ct = new CostTracker(); // constructed BEFORE the override exists
  const prev = process.env.STATE_DIR_OVERRIDE;
  const runState = await fs.mkdtemp(path.join(os.tmpdir(), 'cost-run-state-'));
  process.env.STATE_DIR_OVERRIDE = runState;
  try {
    await ct.log('openai', 'tts', { chars: 2000 });
    const raw = await fs.readFile(path.join(runState, 'cost_log.jsonl'), 'utf-8');
    assert.equal(raw.trim().split('\n').length, 1, 'log line lands in the per-run state dir');
    assert.equal((await ct.getSummary()).total, 0.03);
  } finally {
    if (prev === undefined) delete process.env.STATE_DIR_OVERRIDE;
    else process.env.STATE_DIR_OVERRIDE = prev;
    await fs.rm(runState, { recursive: true, force: true });
  }
});
