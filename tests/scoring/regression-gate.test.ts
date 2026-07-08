import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'fs/promises';
import os from 'os';
import path from 'path';
import { aggregateRegressionGate, runRegressionGate } from '../../src/scoring/regression-gate.ts';

const cleanVbench = { passed: true, scores: { temporal_flickering: 0.95 }, issues: [] };

test('aggregateRegressionGate', async (t) => {
  await t.test('passes when there is no VMAF regression and temporal is clean', () => {
    const r = aggregateRegressionGate({
      vmaf: { regression: false, vmaf: 98.4, message: 'OK: VMAF 98.4' },
      vbench: cleanVbench,
    });
    assert.equal(r.passed, true);
    assert.deepEqual(r.reasons, []);
  });

  await t.test('fails on a VMAF regression', () => {
    const r = aggregateRegressionGate({
      vmaf: { regression: true, vmaf: 91.2, message: 'REGRESSION: VMAF 91.2' },
      vbench: cleanVbench,
    });
    assert.equal(r.passed, false);
    assert.match(r.reasons[0], /VMAF regression/);
  });

  await t.test('fails on temporal issues and lists each one', () => {
    const r = aggregateRegressionGate({
      vmaf: { regression: false, vmaf: 99, message: 'OK' },
      vbench: { passed: false, scores: { motion_smoothness: 0.7 }, issues: ['motion_smoothness: 0.700 < 0.85'] },
    });
    assert.equal(r.passed, false);
    assert.equal(r.reasons.length, 1);
    assert.match(r.reasons[0], /temporal — motion_smoothness/);
  });

  await t.test('aggregates both VMAF and temporal failures', () => {
    const r = aggregateRegressionGate({
      vmaf: { regression: true, vmaf: 80, message: 'REGRESSION: VMAF 80' },
      vbench: { passed: false, scores: {}, issues: ['temporal_flickering: 0.80 < 0.90'] },
    });
    assert.equal(r.passed, false);
    assert.equal(r.reasons.length, 2);
  });

  await t.test('no reference (vmaf null) → gate rests on temporal only', () => {
    const r = aggregateRegressionGate({ vmaf: null, vbench: cleanVbench });
    assert.equal(r.passed, true);
    assert.equal(r.vmaf, null);
  });
});

// The gate is wired into runner.ts post-assembly. That is only safe because it
// is lenient by construction: with no reference baseline and no CLI binaries
// present it must resolve to PASS and write a report, never throwing — so it can
// never false-fail a completed production run.
test('runRegressionGate is non-fatal when tools/reference are absent (safe to wire)', async () => {
  // Use a securely-created unique temp dir rather than a predictable os.tmpdir
  // path (guards against symlink races on the shared temp dir — CodeQL
  // js/insecure-temporary-file — and keeps concurrent test runs isolated).
  const tmpDir = await fs.mkdtemp(path.join(os.tmpdir(), 'director-gate-'));
  const outputPath = path.join(tmpDir, 'regression-gate.json');
  try {
    const report = await runRegressionGate('/nonexistent-final_captioned.mp4', null, { outputPath });

    // No reference → VMAF skipped; absent VBench binary → temporal resolves clean.
    assert.equal(report.passed, true, 'gate must PASS (not throw / not fail) when it has nothing to measure');
    assert.equal(report.vmaf, null, 'no reference means no VMAF result');
    assert.deepEqual(report.reasons, []);

    // It persists a report the pipeline (and dashboards) can read.
    const written = JSON.parse(await fs.readFile(outputPath, 'utf8'));
    assert.equal(written.passed, true);
  } finally {
    await fs.rm(tmpDir, { recursive: true, force: true });
  }
});
