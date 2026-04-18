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
    const { appendToLog } = await import('../../src/pipeline/state.ts');
    const { STATE_DIR } = await import('../../src/pipeline/config.ts');
    const unique = `test-events-${process.pid}-${Date.now()}.jsonl`;
    await appendToLog(unique, { event: 'one' });
    await appendToLog(unique, { event: 'two' });
    const raw = await fs.readFile(path.join(STATE_DIR, unique), 'utf-8');
    const lines = raw.trim().split('\n');
    assert.equal(lines.length, 2);
    const first = JSON.parse(lines[0]);
    assert.equal(first.event, 'one');
    assert.ok(first.timestamp);
    // Cleanup
    await fs.unlink(path.join(STATE_DIR, unique));
  });
});
