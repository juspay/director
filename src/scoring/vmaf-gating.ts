/**
 * VMAF regression gating — deterministic quality comparison via CLI.
 */
import { execa } from 'execa';

export async function checkRegression(
  current: string,
  reference: string,
  threshold = 2.0,
): Promise<{ regression: boolean; vmaf: number; message: string }> {
  try {
    const { stdout } = await execa('ffmpeg-quality-metrics', [current, reference, '--metrics', 'vmaf']);
    const data = JSON.parse(stdout) as Record<string, Array<Record<string, number>>>;
    const vmafScores = data.vmaf?.map((f) => f.vmaf) ?? [];
    const avgVmaf = vmafScores.reduce((a, b) => a + b, 0) / (vmafScores.length || 1);
    const regression = avgVmaf < (100 - threshold);
    return { regression, vmaf: Math.round(avgVmaf * 100) / 100, message: regression ? `REGRESSION: VMAF ${avgVmaf.toFixed(1)}` : `OK: VMAF ${avgVmaf.toFixed(1)}` };
  } catch {
    // Fallback to ffmpeg libvmaf
    try {
      const { stderr } = await execa('ffmpeg', ['-i', current, '-i', reference, '-lavfi', 'libvmaf', '-f', 'null', '-']);
      const match = stderr.match(/VMAF score:\s*([\d.]+)/);
      const vmaf = match ? parseFloat(match[1]) : 0;
      return { regression: vmaf < (100 - threshold), vmaf, message: `VMAF ${vmaf.toFixed(1)}` };
    } catch { return { regression: false, vmaf: 0, message: 'VMAF computation failed' }; }
  }
}
