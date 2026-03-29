/**
 * VBench temporal quality checker via CLI.
 */
import { execa } from 'execa';

export async function checkTemporalQuality(
  videoPath: string,
  thresholds = { flickering: 0.90, smoothness: 0.85 },
): Promise<{ passed: boolean; scores: Record<string, number>; issues: string[] }> {
  const scores: Record<string, number> = {};
  const issues: string[] = [];

  for (const dim of ['temporal_flickering', 'motion_smoothness'] as const) {
    try {
      const { stdout } = await execa('python3', ['-m', 'vbench', 'evaluate',
        '--videos_path', videoPath, '--dimension', dim, '--mode=custom_input']);
      const match = stdout.match(new RegExp(`${dim}[:\\s]+(\\d+\\.\\d+)`));
      if (match) {
        scores[dim] = parseFloat(match[1]);
        const threshold = dim === 'temporal_flickering' ? thresholds.flickering : thresholds.smoothness;
        if (scores[dim] < threshold) issues.push(`${dim}: ${scores[dim].toFixed(3)} < ${threshold}`);
      }
    } catch { scores[dim] = -1; }
  }

  return { passed: issues.length === 0, scores, issues };
}
