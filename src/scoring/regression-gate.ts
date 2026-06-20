/**
 * Deterministic quality-regression gate.
 *
 * Combines two CLI-driven, model-free signals into one pass/fail verdict:
 *  - VMAF (vmaf-gating): does the current render visually regress against a
 *    reference baseline by more than VMAF_REGRESSION_THRESHOLD?
 *  - VBench (vbench-checker): temporal flickering / motion smoothness.
 *
 * Lenient by construction: a missing reference skips VMAF, and absent CLI tools
 * resolve to "pass", so the gate never false-fails a pipeline that lacks the
 * external binaries — it only fails on a *measured* regression.
 */
import fs from 'fs/promises';
import path from 'path';
import { checkRegression } from './vmaf-gating.ts';
import { checkTemporalQuality } from './vbench-checker.ts';
import { CONFIG } from '../pipeline/config.ts';
import type { VmafResult, TemporalResult, RegressionGateReport } from '../types/index.ts';

export type { VmafResult, TemporalResult, RegressionGateReport } from '../types/index.ts';

/**
 * Combine a VMAF result (or null when no reference) and a VBench temporal result
 * into a single verdict. Pure — exported for unit testing without any CLI calls.
 */
export function aggregateRegressionGate(input: {
  vmaf: VmafResult | null;
  vbench: TemporalResult;
}): RegressionGateReport {
  const reasons: string[] = [];
  if (input.vmaf?.regression) reasons.push(`VMAF regression — ${input.vmaf.message}`);
  if (!input.vbench.passed) reasons.push(...input.vbench.issues.map((i) => `temporal — ${i}`));
  return { passed: reasons.length === 0, reasons, vmaf: input.vmaf, vbench: input.vbench };
}

/**
 * Run the regression gate on `current`, optionally against a `reference` baseline.
 * VMAF threshold defaults to the env-overridable CONFIG.VMAF_REGRESSION_THRESHOLD.
 */
export async function runRegressionGate(
  current: string,
  reference: string | null = null,
  opts: { vmafThreshold?: number; outputPath?: string } = {},
): Promise<RegressionGateReport> {
  const vmafThreshold = opts.vmafThreshold ?? CONFIG.VMAF_REGRESSION_THRESHOLD;
  const vmaf = reference
    ? await checkRegression(current, reference, vmafThreshold).catch(() => null)
    : null;
  const vbench = await checkTemporalQuality(current).catch(
    () => ({ passed: true, scores: {}, issues: [] } as TemporalResult),
  );

  const report = aggregateRegressionGate({ vmaf, vbench });

  const outPath = opts.outputPath ?? path.join('output', 'regression-gate.json');
  await fs.mkdir(path.dirname(outPath), { recursive: true });
  await fs.writeFile(outPath, JSON.stringify(report, null, 2)).catch(() => undefined);

  console.log(
    `[RegressionGate] ${report.passed ? 'PASS' : 'FAIL'}` +
    `${report.reasons.length ? ` — ${report.reasons.join('; ')}` : ''}`,
  );
  return report;
}

// CLI: npm run gate -- <current.mp4> [reference.mp4]
if (import.meta.url === `file://${process.argv[1]}`) {
  const [current, reference] = process.argv.slice(2);
  if (!current) {
    console.error('Usage: npm run gate -- <current.mp4> [reference.mp4]');
    process.exit(1);
  }
  const report = await runRegressionGate(current, reference ?? null);
  console.log(JSON.stringify(report, null, 2));
  process.exit(report.passed ? 0 : 1);
}
