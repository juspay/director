/**
 * FidelityGateAgent — single-video product-fidelity judgment via Neurolink.
 *
 * B4 of the beat-the-field plan: the comparator methodology (resolution-blind,
 * CRITICAL identity dims, script context) reproduced the owner's veto of a
 * product-mutating cut — but only as an on-demand A/B CLI. This is the
 * single-video form of that rubric, wired into every run as a pre-ship gate:
 * a run whose finished video mutates the product, drops the brand, or ends on
 * an unrelated shot must not be called SHIP-READY by its own pipeline.
 */

import type { NeuroLink } from '@juspay/neurolink';
import fsp from 'fs/promises';
import os from 'os';
import path from 'path';
import { FidelityReportSchema, type FidelityReport } from '../schemas/fidelity.ts';
import type { ShotPlan } from '../schemas/shot-plan.ts';
import { safeJsonParse } from '../utils/json-repair.ts';
import { exponentialBackoff } from '../utils/rate-limit.ts';
import { CONFIG } from '../pipeline/config.ts';
import { extractLastFramePng } from '../rendering/tail-check.ts';

/**
 * Storyboard intent for the judge: which shots deliberately show something
 * other than the product. Without this the judge scores designed contrast as
 * identity drift — found live on the B8 hero leg: identity 1/5 on a run with
 * zero actual drift, because the plan intentionally opens on the generic
 * smartwatch the ring replaces. The context states intent; it does not tell
 * the judge to pass — a product shot showing the wrong device still fails.
 */
export function buildStoryboardContext(plan: ShotPlan): string {
  const lines = plan.shots.map((s, i) =>
    `${i}. ${s.shows_product ? '[PRODUCT]' : '[CONTRAST — deliberately NOT the product]'} ${s.prompt.trim().slice(0, 160)}`);
  return `Storyboard (the art director's plan; the video assembles these shots in order):
${lines.join('\n')}

Shots marked [CONTRAST] intentionally show generic or competing devices/scenes as the problem the product solves. Their presence is deliberate storytelling, NOT a product-identity or script failure. Product identity is judged on the product itself wherever it appears — a [PRODUCT] shot showing a different object is still a failure.`;
}

export function buildFidelityPrompt(productContext?: string, storyboard?: string): string {
  return `You are the product-fidelity gate for a finished product video. Judge the ACTUAL pixels, shot by shot.

Score each dimension 1-5 (5 = flawless, 1 = failing):
- product_identity (CRITICAL): does the product stay the SAME object across every shot — shape, materials, colors, proportions, design details? A product that mutates between shots (e.g. titanium turning gold, a ring becoming a watch) is a 1-2 regardless of shot quality.
- brand_assets (CRITICAL): is a logo/wordmark or other identifying brand mark visibly present where the video presents the product — overlay, end-card, or on the product itself? No visible branding anywhere = 1-2.
- cta_ending (CRITICAL): do the FINAL seconds land on the product or a branded end-card? A video whose last frames show an unrelated or competitor-category object under the closing call-to-action is a 1.
- motion_artifacts: morphing, warping, extra fingers, garbled on-screen text.
- script_alignment: do the shots show what the script/brief describes?

Resolution, sharpness-from-pixel-count, and file size are NOT quality signals — never cite them. Judge what was created, not how it was delivered.

The second attached file is the video's EXACT final frame, extracted losslessly — treat it as ground truth for cta_ending and for end-card/logo presence at the ending, even if your sampling of the video itself did not surface it.
${productContext ? `\nThe product and script this video must be faithful to:\n---\n${productContext}\n---\n` : ''}${storyboard ? `\n${storyboard}\n` : ''}
Set passed=false if ANY critical dimension scores below 3, and list every concrete failure you saw (shot + what is wrong). Focus on VISIBLE evidence — don't manufacture problems that aren't there.`;
}

/**
 * The judge-half pass rule: identity and brand are the dimensions where a
 * vision judge is authoritative. The ENDING is deliberately excluded — video
 * ingestion samples frames sparsely and calibration showed the judge
 * mis-reading the final seconds even with the exact last frame attached, so
 * cta lives with the deterministic tail check (rendering/tail-check.ts),
 * which the runner composes alongside this. The judge's own `passed` boolean
 * is ignored for the same reason: it bakes the unreliable cta read back in.
 * Pure — exported for tests.
 */
export function fidelityPassed(report: FidelityReport, threshold = 3): boolean {
  return report.product_identity.score >= threshold && report.brand_assets.score >= threshold;
}

export async function runFidelityGateAgent(
  neurolink: NeuroLink,
  videoPath: string,
  options: { productContext?: string; storyboard?: string } = {},
): Promise<FidelityReport | null> {
  console.log(`[FidelityGate] Judging ${path.basename(videoPath)}`);

  const tmpDir = await fsp.mkdtemp(path.join(os.tmpdir(), 'fidelity-gate-'));
  let lastFrame: string | null = null;
  try {
    lastFrame = await extractLastFramePng(videoPath, path.join(tmpDir, 'last-frame.png'));
  } catch (e) {
    console.warn('[FidelityGate] last-frame extraction skipped:', e instanceof Error ? e.message : e);
  }

  const result = await exponentialBackoff(async () => {
    const response = await neurolink.generate({
      input: {
        text: buildFidelityPrompt(options.productContext, options.storyboard),
        files: [path.resolve(videoPath), ...(lastFrame ? [lastFrame] : [])],
      },
      provider: process.env.AGENT_PROVIDER ?? 'vertex',
      model: CONFIG.MODEL,
      schema: FidelityReportSchema,
      output: { format: 'json' },
      disableTools: true,
      maxTokens: 8192,
      timeout: '240s',
    });

    return FidelityReportSchema.parse(safeJsonParse(response.content));
  }).finally(() => fsp.rm(tmpDir, { recursive: true, force: true }).catch(() => undefined));

  if (!result.success) {
    console.error(`[FidelityGate] Failed: ${result.error}`);
    return null;
  }

  const r = result.value;
  const verdict = fidelityPassed(r) ? 'PASS' : 'FAIL';
  console.log(`[FidelityGate] ${verdict} — identity ${r.product_identity.score}/5, brand ${r.brand_assets.score}/5, cta ${r.cta_ending.score}/5${r.failures.length ? ` | ${r.failures.length} failure(s)` : ''}`);
  return r;
}

// CLI: npm run fidelity -- <video.mp4> [script.txt] [shot-plan.json]
if (import.meta.url === `file://${process.argv[1]}`) {
  const [video, scriptPath, planPath] = process.argv.slice(2);
  if (!video) {
    console.error('Usage: npm run fidelity -- <video.mp4> [script.txt — product/script context] [shot-plan.json — storyboard intent]');
    process.exit(1);
  }
  const fs = await import('fs/promises');
  const productContext = scriptPath ? await fs.readFile(scriptPath, 'utf8') : undefined;
  const plan = planPath ? JSON.parse(await fs.readFile(planPath, 'utf8')) as ShotPlan : undefined;
  const storyboard = plan?.shots?.length ? buildStoryboardContext(plan) : undefined;
  const { NeuroLink } = await import('@juspay/neurolink');
  const nl = new NeuroLink();
  try {
    const report = await runFidelityGateAgent(nl, video, { productContext, storyboard });
    if (!report) process.exit(1);
    console.log(JSON.stringify({ ...report, gate_passed: fidelityPassed(report) }, null, 2));
  } finally {
    await nl.shutdown();
  }
}
