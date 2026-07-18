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

  await t.test('image generation billed per image (the unlogged-keyframes gap)', async () => {
    const p = await tmpLog();
    const ct = new CostTracker(p);
    await ct.reset();
    // A representative director-mode run: 1 hero + 8 keyframes = 9 images.
    await ct.log('vertex', 'image-gen', { images: 9 });
    assert.equal((await ct.getSummary()).total, 0.351); // 9 × $0.039
    await fs.rm(path.dirname(p), { recursive: true, force: true });
  });

  await t.test('VERTEX_IMAGE_PER_IMAGE overrides the image rate; explicit 0 means free', async () => {
    const prev = process.env.VERTEX_IMAGE_PER_IMAGE;
    try {
      process.env.VERTEX_IMAGE_PER_IMAGE = '0.10';
      const p = await tmpLog();
      const ct = new CostTracker(p);
      await ct.reset();
      await ct.log('vertex', 'image-gen', { images: 10 });
      assert.equal((await ct.getSummary()).total, 1.0); // 10 × $0.10 override

      process.env.VERTEX_IMAGE_PER_IMAGE = '0'; // explicit zero must NOT fall back
      await ct.reset();
      await ct.log('vertex', 'image-gen', { images: 10 });
      assert.equal((await ct.getSummary()).total, 0);
      await fs.rm(path.dirname(p), { recursive: true, force: true });
    } finally {
      if (prev === undefined) delete process.env.VERTEX_IMAGE_PER_IMAGE;
      else process.env.VERTEX_IMAGE_PER_IMAGE = prev;
    }
  });
});

test('CostTracker per-model video rates', async (t) => {
  await t.test('built-in per-model key beats the provider flat rate', async () => {
    const p = await tmpLog();
    const ct = new CostTracker(p);
    await ct.reset();
    // Without the model key this would price at replicate's flat $0.09/s.
    await ct.log('replicate', 'broll-video', { seconds: 10 }, undefined, 'wavespeedai/wan-2.1-i2v-720p');
    assert.equal((await ct.getSummary()).total, 2.5); // 10s × $0.25
    await fs.rm(path.dirname(p), { recursive: true, force: true });
  });

  await t.test('a model with no per-model rate prices at the provider rate', async () => {
    const p = await tmpLog();
    const ct = new CostTracker(p);
    await ct.reset();
    await ct.log('replicate', 'broll-video', { seconds: 10 }, undefined, 'someone/unpriced-model');
    assert.equal((await ct.getSummary()).total, 0.9); // falls back to flat $0.09/s
    await fs.rm(path.dirname(p), { recursive: true, force: true });
  });

  await t.test('VIDEO_MODEL_RATES overrides both the built-in model table and the flat rate', async () => {
    const prev = process.env.VIDEO_MODEL_RATES;
    process.env.VIDEO_MODEL_RATES = JSON.stringify({
      'replicate:minimax/hailuo-2.3-fast': 0.03,
      'replicate:wavespeedai/wan-2.1-i2v-720p': 0.20,
    });
    try {
      const p = await tmpLog();
      const ct = new CostTracker(p);
      await ct.reset();
      await ct.log('replicate', 'broll-video', { seconds: 10 }, undefined, 'minimax/hailuo-2.3-fast');
      await ct.log('replicate', 'broll-video', { seconds: 10 }, undefined, 'wavespeedai/wan-2.1-i2v-720p');
      assert.equal((await ct.getSummary()).total, 2.3); // 10s × $0.03 + 10s × $0.20 (env beats table's $0.25)
      await fs.rm(path.dirname(p), { recursive: true, force: true });
    } finally {
      if (prev === undefined) delete process.env.VIDEO_MODEL_RATES;
      else process.env.VIDEO_MODEL_RATES = prev;
    }
  });

  await t.test('an explicit 0 in VIDEO_MODEL_RATES means free, not fall-through', async () => {
    const prev = process.env.VIDEO_MODEL_RATES;
    process.env.VIDEO_MODEL_RATES = '{"replicate:wavespeedai/wan-2.1-i2v-720p":0}';
    try {
      const p = await tmpLog();
      const ct = new CostTracker(p);
      await ct.reset();
      await ct.log('replicate', 'broll-video', { seconds: 10 }, undefined, 'wavespeedai/wan-2.1-i2v-720p');
      assert.equal((await ct.getSummary()).total, 0);
      await fs.rm(path.dirname(p), { recursive: true, force: true });
    } finally {
      if (prev === undefined) delete process.env.VIDEO_MODEL_RATES;
      else process.env.VIDEO_MODEL_RATES = prev;
    }
  });

  await t.test('unparseable VIDEO_MODEL_RATES is ignored, not fatal', async () => {
    const prev = process.env.VIDEO_MODEL_RATES;
    process.env.VIDEO_MODEL_RATES = 'not json{';
    try {
      const p = await tmpLog();
      const ct = new CostTracker(p);
      await ct.reset();
      await ct.log('replicate', 'broll-video', { seconds: 10 }, undefined, 'wavespeedai/wan-2.1-i2v-720p');
      assert.equal((await ct.getSummary()).total, 2.5); // built-in table still applies
      await fs.rm(path.dirname(p), { recursive: true, force: true });
    } finally {
      if (prev === undefined) delete process.env.VIDEO_MODEL_RATES;
      else process.env.VIDEO_MODEL_RATES = prev;
    }
  });

  await t.test('the JSONL entry records the model so the log stays auditable', async () => {
    const p = await tmpLog();
    const ct = new CostTracker(p);
    await ct.reset();
    await ct.log('replicate', 'broll-video', { seconds: 5 }, undefined, 'minimax/hailuo-2.3-fast');
    await ct.log('vertex', 'broll-video', { seconds: 5 }); // no model → no field
    const lines = (await fs.readFile(p, 'utf-8')).trim().split('\n').map((l) => JSON.parse(l));
    assert.equal(lines[0].model, 'minimax/hailuo-2.3-fast');
    assert.equal('model' in lines[1], false);
    await fs.rm(path.dirname(p), { recursive: true, force: true });
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

// Avatar renders and paid music were billable-but-invisible until 2026-07-18:
// no rate exists for those providers, and nothing logged the call at all. The
// contract for the new call sites: an unknown-rate provider still writes an
// entry ($0 estimate, params preserved) so the CALL is auditable even before
// a page-verified rate lands.
test('unknown-rate providers still log the call with params intact', async () => {
  const p = await tmpLog();
  const ct = new CostTracker(p);
  await ct.reset();
  await ct.log('heygen', 'avatar-render', { seconds: 12.4 });
  await ct.log('beatoven', 'music-gen', { seconds: 32 });
  const lines = (await fs.readFile(p, 'utf-8')).trim().split('\n').map((l) => JSON.parse(l));
  assert.equal(lines.length, 2);
  assert.equal(lines[0].provider, 'heygen');
  assert.equal(lines[0].operation, 'avatar-render');
  assert.deepEqual(lines[0].params, { seconds: 12.4 });
  assert.equal(lines[0].cost, 0);
  assert.equal(lines[1].provider, 'beatoven');
  assert.equal(lines[1].cost, 0);
  await fs.rm(path.dirname(p), { recursive: true, force: true });
});

// Rates verified live 2026-07-18 from Replicate billingConfig + input-schema
// defaults (kling-v3-video resolves to mode=pro + generate_audio=false).
test('kling per-model rates price v2.1 and v3 differently through one provider', async () => {
  const p = await tmpLog();
  const ct = new CostTracker(p);
  await ct.reset();
  await ct.log('replicate', 'broll-video', { seconds: 5 }, undefined, 'kwaivgi/kling-v2.1');
  await ct.log('replicate', 'broll-video', { seconds: 5 }, undefined, 'kwaivgi/kling-v3-video');
  const s = await ct.getSummary();
  assert.equal(s.total, 5 * 0.05 + 5 * 0.224);
  await fs.rm(path.dirname(p), { recursive: true, force: true });
});
