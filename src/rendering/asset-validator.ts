/**
 * Asset validator — pre-render checks via ffprobe.
 */
import { execa } from 'execa';
import fs from 'fs/promises';

export interface ValidationResult {
  valid: boolean;
  checks: Array<{ name: string; passed: boolean; detail: string }>;
}

export async function validateAssets(assets: Record<string, string>): Promise<ValidationResult> {
  const checks: ValidationResult['checks'] = [];

  for (const [name, filePath] of Object.entries(assets)) {
    try {
      await fs.access(filePath);
      const duration = await getDuration(filePath);
      checks.push({ name, passed: true, detail: `exists, ${duration.toFixed(1)}s` });
    } catch {
      checks.push({ name, passed: false, detail: 'file not found' });
    }
  }

  const valid = checks.every((c) => c.passed);
  console.log(`[Validator] ${checks.filter((c) => c.passed).length}/${checks.length} assets valid`);
  return { valid, checks };
}

async function getDuration(filePath: string): Promise<number> {
  try {
    const { stdout } = await execa('ffprobe', [
      '-v', 'error', '-show_entries', 'format=duration',
      '-of', 'default=noprint_wrappers=1:nokey=1', filePath,
    ]);
    return parseFloat(stdout.trim()) || 0;
  } catch {
    return 0;
  }
}
