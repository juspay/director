/**
 * Python bridge — calls Python DSP scripts via execa.
 * Mirrors dopamine's pattern: TypeScript orchestrates, Python executes DSP.
 *
 * Python scripts in scripts/python/ handle:
 * - Music synthesis (NumPy/SciPy)
 * - SFX generation (Karplus-Strong)
 * - Audio mixing (VAD ducking, Pedalboard compression)
 * - Spectral analysis (librosa)
 */
import { execa, type ResultPromise } from 'execa';
import path from 'path';
import { fileURLToPath } from 'url';

const SCRIPTS_DIR = path.resolve(
  path.dirname(fileURLToPath(import.meta.url)),
  '..', '..', 'scripts', 'python',
);

export async function runPythonScript(
  scriptName: string,
  args: string[] = [],
  options: { timeout?: number; cwd?: string } = {},
): Promise<{ stdout: string; stderr: string; exitCode: number }> {
  const scriptPath = path.join(SCRIPTS_DIR, scriptName);
  console.log(`[Python] Running: ${scriptName} ${args.join(' ')}`);

  const result = await execa('python3', [scriptPath, ...args], {
    timeout: options.timeout ?? 600_000,
    cwd: options.cwd,
    reject: false,
  });

  if (result.exitCode !== 0) {
    console.error(`[Python] ${scriptName} failed (exit ${result.exitCode}): ${result.stderr.slice(0, 300)}`);
  }

  return { stdout: result.stdout, stderr: result.stderr, exitCode: result.exitCode ?? 1 };
}

// Convenience wrappers for common DSP operations

export async function synthesizeMusic(outputPath: string, configPath?: string): Promise<string> {
  const args = ['--output', outputPath];
  if (configPath) args.push('--config', configPath);
  await runPythonScript('synthesize-music.py', args);
  return outputPath;
}

export async function synthesizeSfx(outputDir: string): Promise<string> {
  await runPythonScript('synthesize-sfx.py', ['--output-dir', outputDir]);
  return outputDir;
}

export async function mixAudio(
  musicPath: string,
  voiceoverPath: string,
  outputPath: string,
  options: { duckDb?: number } = {},
): Promise<string> {
  const args = ['--music', musicPath, '--voiceover', voiceoverPath, '--output', outputPath];
  if (options.duckDb) args.push('--duck-db', String(options.duckDb));
  await runPythonScript('mix-audio.py', args);
  return outputPath;
}

export async function analyzeAudio(audioPath: string): Promise<Record<string, number>> {
  const { stdout } = await runPythonScript('analyze-audio.py', ['--audio', audioPath, '--json']);
  try {
    return JSON.parse(stdout) as Record<string, number>;
  } catch {
    console.warn('[Python] Could not parse analysis output');
    return {};
  }
}
