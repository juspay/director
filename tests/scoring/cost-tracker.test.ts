import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import { CostTracker } from '../../src/scoring/cost-tracker.ts';

const tmpLog = () => path.join(os.tmpdir(), `cost-log-${process.pid}-${Math.round(performance.now())}.jsonl`);

test('CostTracker.estimate', async (t) => {
  await t.test('vertex/Veo video billed per second (the #40 gap)', async () => {
    const p = tmpLog();
    const ct = new CostTracker(p);
    await ct.reset();
    await ct.log('vertex', 'broll-video', { seconds: 10 });
    assert.equal((await ct.getSummary()).total, 4.0); // 10s × $0.40
    await fs.rm(p, { force: true });
  });

  await t.test('TTS billed per 1k chars, per provider key', async () => {
    const p = tmpLog();
    const ct = new CostTracker(p);
    await ct.reset();
    await ct.log('openai', 'tts', { chars: 1000 });
    await ct.log('elevenlabs', 'tts', { chars: 1000 });
    const s = await ct.getSummary();
    assert.equal(s.byProvider.openai, 0.015);
    assert.equal(s.byProvider.elevenlabs, 0.30);
    await fs.rm(p, { force: true });
  });

  await t.test('unknown provider estimates $0, never throws', async () => {
    const p = tmpLog();
    const ct = new CostTracker(p);
    await ct.reset();
    await ct.log('does-not-exist', 'op', { seconds: 100 });
    assert.equal((await ct.getSummary()).total, 0);
    await fs.rm(p, { force: true });
  });

  await t.test('VERTEX_VIDEO_PER_SEC overrides the Veo rate', async () => {
    const prev = process.env.VERTEX_VIDEO_PER_SEC;
    process.env.VERTEX_VIDEO_PER_SEC = '0.15';
    try {
      const p = tmpLog();
      const ct = new CostTracker(p);
      await ct.reset();
      await ct.log('vertex', 'broll-video', { seconds: 10 });
      assert.equal((await ct.getSummary()).total, 1.5); // 10s × $0.15 override
      await fs.rm(p, { force: true });
    } finally {
      if (prev === undefined) delete process.env.VERTEX_VIDEO_PER_SEC;
      else process.env.VERTEX_VIDEO_PER_SEC = prev;
    }
  });

  await t.test('VERTEX_VIDEO_PER_SEC=0 means free, not the default rate', async () => {
    const prev = process.env.VERTEX_VIDEO_PER_SEC;
    process.env.VERTEX_VIDEO_PER_SEC = '0'; // explicit zero must NOT fall back to $0.40
    try {
      const p = tmpLog();
      const ct = new CostTracker(p);
      await ct.reset();
      await ct.log('vertex', 'broll-video', { seconds: 10 });
      assert.equal((await ct.getSummary()).total, 0);
      await fs.rm(p, { force: true });
    } finally {
      if (prev === undefined) delete process.env.VERTEX_VIDEO_PER_SEC;
      else process.env.VERTEX_VIDEO_PER_SEC = prev;
    }
  });

  await t.test('unparseable VERTEX_VIDEO_PER_SEC falls back to the default rate', async () => {
    const prev = process.env.VERTEX_VIDEO_PER_SEC;
    process.env.VERTEX_VIDEO_PER_SEC = 'not-a-number';
    try {
      const p = tmpLog();
      const ct = new CostTracker(p);
      await ct.reset();
      await ct.log('vertex', 'broll-video', { seconds: 10 });
      assert.equal((await ct.getSummary()).total, 4.0); // back to 10s × $0.40
      await fs.rm(p, { force: true });
    } finally {
      if (prev === undefined) delete process.env.VERTEX_VIDEO_PER_SEC;
      else process.env.VERTEX_VIDEO_PER_SEC = prev;
    }
  });
});

test('CostTracker.reset scopes the summary to one run', async () => {
  const p = tmpLog();
  const ct = new CostTracker(p);
  await ct.log('vertex', 'broll-video', { seconds: 8 });
  await ct.reset();
  await ct.log('openai', 'tts', { chars: 500 });
  const s = await ct.getSummary();
  assert.equal(s.total, 0.0075);          // only the post-reset entry counts
  assert.equal(s.byProvider.vertex, undefined);
  await fs.rm(p, { force: true });
});

test('CostTracker.getSummary on a fresh/missing log returns zero', async () => {
  const ct = new CostTracker(tmpLog());
  const s = await ct.getSummary();
  assert.equal(s.total, 0);
  assert.deepEqual(s.byProvider, {});
});
