import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'fs/promises';
import os from 'os';
import path from 'path';
import { deriveSnapshot, readSnapshot, resolveStateDir, BACKLOT_PHASES } from '../../src/backlot/tailer.ts';
import { STATE_DIR } from '../../src/pipeline/config.ts';

test('deriveSnapshot', async (t) => {
  await t.test('all phases pending, zero cost, on an empty run', () => {
    const s = deriveSnapshot({ results: {}, errors: [] }, []);
    assert.equal(s.phases.length, BACKLOT_PHASES.length);
    assert.ok(s.phases.every((p) => p.status === 'pending'));
    assert.equal(s.currentStep, 0);
    assert.equal(s.complete, false);
    assert.equal(s.cost.total, 0);
    assert.equal(s.cost.events, 0);
  });

  await t.test('marks done from results, failed from an error label prefix', () => {
    const s = deriveSnapshot(
      { results: { voiceover: {}, broll: {}, scoring: {} }, errors: ['4. Music: provider timed out'] },
      [],
    );
    const by = Object.fromEntries(s.phases.map((p) => [p.name, p]));
    assert.equal(by.voiceover.status, 'done');
    assert.equal(by.broll.status, 'done');
    assert.equal(by.music.status, 'failed');
    assert.equal(by.music.error, 'provider timed out');
    assert.equal(by.avatar.status, 'pending');
    assert.equal(s.currentStep, 2); // 'scoring' is a post-pipeline key, not a phase
  });

  await t.test('summarizes cost by provider and flags completion', () => {
    const all = Object.fromEntries(BACKLOT_PHASES.map((p) => [p.name, {}]));
    const s = deriveSnapshot({ results: all }, [
      { provider: 'elevenlabs', cost: 0.02 },
      { provider: 'vertex', cost: 0.1 },
      { provider: 'elevenlabs', cost: 0.03 },
    ]);
    assert.equal(s.complete, true);
    assert.equal(s.currentStep, BACKLOT_PHASES.length);
    assert.equal(s.cost.total, 0.15);
    assert.equal(s.cost.byProvider.elevenlabs, 0.05);
    assert.equal(s.cost.events, 3);
  });

  await t.test('derives currentStep from results, ignoring a stale persisted value', () => {
    // A pre-fix state file may carry currentStep:0 while results show progress —
    // the derived count must win so the bar and the 'done' pills stay consistent.
    const s = deriveSnapshot({ results: { voiceover: {}, avatar: {} }, currentStep: 0 }, []);
    assert.equal(s.currentStep, 2);
  });
});

test('readSnapshot', async (t) => {
  await t.test('reads state + cost log from a dir, skipping a torn JSONL line', async () => {
    const dir = await fs.mkdtemp(path.join(os.tmpdir(), 'backlot-'));
    try {
      await fs.writeFile(path.join(dir, 'pipeline-state.json'), JSON.stringify({
        results: { voiceover: {}, avatar: {} }, errors: [], currentStep: 2, totalSteps: 7,
        startedAt: '2026-07-08T00:00:00Z', updatedAt: '2026-07-08T00:01:00Z',
      }));
      await fs.writeFile(
        path.join(dir, 'cost_log.jsonl'),
        '{"provider":"elevenlabs","cost":0.02}\n{"provider":"vertex","cost":0.1}\n{bad json\n',
      );
      const s = await readSnapshot(dir);
      assert.equal(s.phases.find((p) => p.name === 'voiceover')?.status, 'done');
      assert.equal(s.currentStep, 2);
      assert.equal(s.cost.total, 0.12); // torn line skipped, not counted
      assert.equal(s.cost.events, 2);
      assert.equal(s.updatedAt, '2026-07-08T00:01:00Z');
    } finally {
      await fs.rm(dir, { recursive: true, force: true });
    }
  });

  await t.test('missing state dir → empty-but-valid snapshot (never throws)', async () => {
    const s = await readSnapshot(path.join(os.tmpdir(), 'backlot-does-not-exist-abc123'));
    assert.ok(s.phases.every((p) => p.status === 'pending'));
    assert.equal(s.cost.total, 0);
    assert.equal(s.complete, false);
  });
});

test('resolveStateDir', async (t) => {
  const mkState = async (dir: string, mtime?: Date) => {
    await fs.mkdir(dir, { recursive: true });
    const f = path.join(dir, 'pipeline-state.json');
    await fs.writeFile(f, '{"results":{}}');
    if (mtime) await fs.utimes(f, mtime, mtime);
  };

  await t.test('--state arg wins over env and any scan', async () => {
    const dir = await resolveStateDir(['--state', '/explicit/dir'], { BACKLOT_STATE_DIR: '/env/dir' }, '/nonexistent-base');
    assert.equal(dir, '/explicit/dir');
  });

  await t.test('BACKLOT_STATE_DIR wins over the scan', async () => {
    const dir = await resolveStateDir([], { BACKLOT_STATE_DIR: '/env/dir' }, '/nonexistent-base');
    assert.equal(dir, '/env/dir');
  });

  await t.test('newest per-run child state dir wins the mtime scan', async () => {
    const base = await fs.mkdtemp(path.join(os.tmpdir(), 'backlot-resolve-'));
    try {
      await mkState(path.join(base, 'output-a', '.pipeline-state'), new Date('2026-01-01T00:00:00Z'));
      await mkState(path.join(base, 'output-b', '.pipeline-state'), new Date('2026-06-01T00:00:00Z'));
      const dir = await resolveStateDir([], {}, base);
      assert.equal(dir, path.join(base, 'output-b', '.pipeline-state'));
    } finally {
      await fs.rm(base, { recursive: true, force: true });
    }
  });

  await t.test('the legacy project-global dir competes in the same scan', async () => {
    const base = await fs.mkdtemp(path.join(os.tmpdir(), 'backlot-resolve-'));
    try {
      await mkState(path.join(base, 'output-a', '.pipeline-state'), new Date('2026-01-01T00:00:00Z'));
      await mkState(path.join(base, '.pipeline-state'), new Date('2026-06-01T00:00:00Z'));
      const dir = await resolveStateDir([], {}, base);
      assert.equal(dir, path.join(base, '.pipeline-state'));
    } finally {
      await fs.rm(base, { recursive: true, force: true });
    }
  });

  await t.test('nothing found → legacy STATE_DIR fallback (readSnapshot stays tolerant)', async () => {
    const base = await fs.mkdtemp(path.join(os.tmpdir(), 'backlot-resolve-empty-'));
    try {
      const dir = await resolveStateDir([], {}, base);
      assert.equal(dir, STATE_DIR);
    } finally {
      await fs.rm(base, { recursive: true, force: true });
    }
  });
});

test('liveness', async (t) => {
  const state = { results: { voiceover: {} }, errors: [] };
  const NOW = 1_800_000_000_000;

  await t.test('recent activity on an incomplete run → running, first pending pill marked', () => {
    const s = deriveSnapshot(state, [], { mtimeMs: NOW - 10_000, nowMs: NOW });
    assert.equal(s.liveness, 'running');
    assert.equal(s.phases.find((p) => p.name === 'avatar')?.status, 'running'); // first pending phase
    assert.equal(s.phases.filter((p) => p.status === 'running').length, 1);
    assert.equal(s.lastActivityAt, new Date(NOW - 10_000).toISOString());
  });

  await t.test('quiet past the default 300s threshold → stalled, nothing marked running', () => {
    const s = deriveSnapshot(state, [], { mtimeMs: NOW - 301_000, nowMs: NOW });
    assert.equal(s.liveness, 'stalled');
    assert.ok(s.phases.every((p) => p.status !== 'running'));
  });

  await t.test('custom stallSeconds is honored in both directions', () => {
    assert.equal(deriveSnapshot(state, [], { mtimeMs: NOW - 10_000, nowMs: NOW, stallSeconds: 5 }).liveness, 'stalled');
    assert.equal(deriveSnapshot(state, [], { mtimeMs: NOW - 10_000, nowMs: NOW, stallSeconds: 60 }).liveness, 'running');
  });

  await t.test('a complete run is complete regardless of mtime age', () => {
    const all = Object.fromEntries(BACKLOT_PHASES.map((p) => [p.name, {}]));
    const s = deriveSnapshot({ results: all, errors: [] }, [], { mtimeMs: NOW - 999_000, nowMs: NOW });
    assert.equal(s.liveness, 'complete');
  });

  await t.test('no on-disk activity → idle (and omitted activity degrades the same way)', () => {
    assert.equal(deriveSnapshot(state, [], { mtimeMs: null, nowMs: NOW }).liveness, 'idle');
    assert.equal(deriveSnapshot(state, []).liveness, 'idle');
    assert.equal(deriveSnapshot(state, []).lastActivityAt, null);
  });

  await t.test('readSnapshot on a freshly-written fixture reads as running', async () => {
    const dir = await fs.mkdtemp(path.join(os.tmpdir(), 'backlot-live-'));
    try {
      await fs.writeFile(path.join(dir, 'pipeline-state.json'), JSON.stringify({ results: { voiceover: {} }, errors: [] }));
      const s = await readSnapshot(dir);
      assert.equal(s.liveness, 'running');
      assert.ok(s.lastActivityAt);
    } finally {
      await fs.rm(dir, { recursive: true, force: true });
    }
  });
});
