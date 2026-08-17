/**
 * Contract tests for the two third-party packages first-party code depends on
 * most directly, and that no other test imports by name.
 *
 * Why this file exists: @juspay/neurolink 9 -> 10 and execa 9 -> 10 both landed
 * green because typecheck and 489 unit tests never touched either package at
 * runtime, and the one CI job that would have (score-pr.yml) self-skips when
 * Vertex credentials are absent. A removed export or a changed result shape
 * would have reached main undetected.
 *
 * These assertions must hold WITHOUT credentials so they run on every PR:
 * they check the surface and result shapes the codebase actually consumes, not
 * live provider behaviour.
 */
import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { execa, type ResultPromise } from 'execa';

describe('@juspay/neurolink contract', () => {
  it('exports NeuroLink and initializeOpenTelemetry', async () => {
    // Both are named imports in src/pipeline/runner.ts.
    const mod = await import('@juspay/neurolink');
    assert.equal(typeof mod.NeuroLink, 'function', 'NeuroLink export missing');
    assert.equal(
      typeof mod.initializeOpenTelemetry,
      'function',
      'initializeOpenTelemetry export missing',
    );
  });

  it('constructs without credentials and exposes generate + shutdown', async () => {
    // Agents construct eagerly and only fail at generate() time, so the
    // constructor must stay credential-free or every agent breaks at import.
    const { NeuroLink } = await import('@juspay/neurolink');
    const nl = new NeuroLink();
    try {
      assert.equal(typeof nl.generate, 'function', 'generate() missing');
      assert.equal(typeof nl.shutdown, 'function', 'shutdown() missing');
    } finally {
      await nl.shutdown();
    }
  });
});

describe('execa contract', () => {
  it('resolves with stdout, stderr and exitCode', async () => {
    const result = await execa('node', ['-e', 'process.stdout.write("ok")']);
    assert.equal(result.stdout, 'ok');
    assert.equal(result.stderr, '');
    assert.equal(result.exitCode, 0);
  });

  it('passes an argument array through to the subprocess', async () => {
    // Mirrors the call shape in src/scripts/python-bridge.ts.
    //
    // Under `node -e`, the eval script is NOT part of argv: argv is
    // [execPath, ...positionals], so the first positional is argv[1] — not
    // argv[2] or argv[3] as with a script file. Verified on Node 22 and 24.
    // The marker prefix and String() keep a dropped argument surfacing as a
    // readable assertion diff rather than an ERR_INVALID_ARG_TYPE crash
    // inside the subprocess.
    const result = await execa('node', [
      '-e',
      'process.stdout.write("arg=" + String(process.argv[1]))',
      'arg-1',
    ]);
    assert.equal(result.stdout, 'arg=arg-1');
  });

  it('returns rather than throws on non-zero exit when reject is false', async () => {
    // python-bridge.ts reads result.exitCode instead of catching, so a change
    // back to throwing here would surface as an unhandled rejection.
    const result = await execa('node', ['-e', 'process.exit(3)'], { reject: false });
    assert.equal(result.exitCode, 3);
    assert.equal(result.failed, true);
  });

  it('throws on non-zero exit by default', async () => {
    await assert.rejects(() => execa('node', ['-e', 'process.exit(4)']));
  });

  it('still exports the ResultPromise type used by python-bridge', () => {
    // Type-only assertion: this fails at typecheck, not runtime, if the export
    // is renamed or removed.
    const pending: ResultPromise = execa('node', ['-e', '']);
    assert.equal(typeof pending.then, 'function');
  });
});
