import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'fs/promises';
import os from 'os';
import path from 'path';
import { deriveSnapshot, readSnapshot, BACKLOT_PHASES } from '../../src/backlot/tailer.ts';

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
