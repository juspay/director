import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import path from 'node:path';
import os from 'node:os';
import { runPythonScript } from '../../src/scripts/python-bridge.ts';

describe('python-bridge', () => {
  it('runPythonScript invokes python3 and captures stdout', async () => {
    // Create a tiny helper script in a tmp dir via --output-dir-style arg
    // Instead we use an inline python3 to verify the bridge exec path works.
    // We'll shell out to a script we know exists: analyze-audio.py --help (argparse always supports --help)
    const result = await runPythonScript('analyze-audio.py', ['--help']);
    assert.equal(result.exitCode, 0);
    assert.match(result.stdout, /usage:/);
  });

  it('runPythonScript returns non-zero exit on script error', async () => {
    const result = await runPythonScript('analyze-audio.py', ['--audio', '/nonexistent/path.wav', '--json']);
    assert.notEqual(result.exitCode, 0);
  });

  it('all 4 DSP scripts respond to --help (valid CLI contracts)', async () => {
    for (const name of [
      'synthesize-music.py',
      'synthesize-sfx.py',
      'mix-audio.py',
      'analyze-audio.py',
    ]) {
      const { exitCode, stdout } = await runPythonScript(name, ['--help']);
      assert.equal(exitCode, 0, `${name} --help exited non-zero`);
      assert.match(stdout, /usage:/, `${name} --help output missing usage line`);
    }
  });
});
