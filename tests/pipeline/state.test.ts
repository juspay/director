import { describe, it, before, after } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import path from 'node:path';
import os from 'node:os';

// Isolate STATE_DIR to a tmp dir for these tests
let tmpDir: string;
before(async () => {
  tmpDir = await fs.mkdtemp(path.join(os.tmpdir(), 'director-test-state-'));
  process.env.STATE_DIR_OVERRIDE = tmpDir;
});
after(async () => {
  await fs.rm(tmpDir, { recursive: true, force: true });
});

describe('pipeline/state', () => {
  // Import after env is set up (config reads env on first import)
  it('loadState returns default when file missing', async () => {
    const { loadState } = await import('../../src/pipeline/state.ts');
    const result = await loadState('nonexistent.json', { count: 0 });
    assert.deepEqual(result, { count: 0 });
  });

  it('saveState then loadState round-trips', async () => {
    const { saveState, loadState } = await import('../../src/pipeline/state.ts');
    await saveState('roundtrip.json', { count: 42, label: 'x' });
    const result = await loadState<{ count: number; label: string }>('roundtrip.json', {
      count: 0,
      label: '',
    });
    assert.equal(result.count, 42);
    assert.equal(result.label, 'x');
  });

  it('appendToLog appends a newline-delimited JSON record', async () => {
    const { appendToLog, stateDir } = await import('../../src/pipeline/state.ts');
    const unique = `test-events-${process.pid}-${Date.now()}.jsonl`;
    await appendToLog(unique, { event: 'one' });
    await appendToLog(unique, { event: 'two' });
    const raw = await fs.readFile(path.join(stateDir(), unique), 'utf-8');
    const lines = raw.trim().split('\n');
    assert.equal(lines.length, 2);
    const first = JSON.parse(lines[0]);
    assert.equal(first.event, 'one');
    assert.ok(first.timestamp);
    // Cleanup
    await fs.unlink(path.join(stateDir(), unique));
  });

  // Regression: STATE_DIR_OVERRIDE was previously a no-op (config STATE_DIR is
  // fixed at import), so these tests silently wrote into the real .pipeline-state/.
  // Persistence must now land in the isolated tmp dir.
  it('persists into the isolated STATE_DIR_OVERRIDE, not the real state dir', async () => {
    const { saveState, stateDir } = await import('../../src/pipeline/state.ts');
    assert.equal(stateDir(), tmpDir, 'stateDir() honors the override');
    await saveState('isolated.json', { ok: true });
    const onDisk = await fs.readFile(path.join(tmpDir, 'isolated.json'), 'utf-8');
    assert.deepEqual(JSON.parse(onDisk), { ok: true });
  });
});

describe('stateDirFor', () => {
  it('namespaces state under the run output dir', async () => {
    const { stateDirFor } = await import('../../src/pipeline/state.ts');
    assert.equal(stateDirFor('/runs/output-live4'), path.join('/runs/output-live4', '.pipeline-state'));
    assert.equal(stateDirFor('output'), path.join('output', '.pipeline-state'));
  });
});
