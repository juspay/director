/**
 * VideoComparatorAgent — A/B compares two video renders via Neurolink.
 * Pattern A: multiple files + schema.
 *
 * W-COMP-FIDELITY: the first live cross-tier verdict was overturned on human
 * review — the judge picked the cheap 1080p draft over the 720p hero
 * baseline purely on resolution-driven dimensions, while missing that the
 * draft dropped the product's identity (no logo, mutating product). Inputs
 * are now resolution-normalized before judging, the rubric carries two
 * product-fidelity dimensions weighted as critical, and callers can pass the
 * script/brief so the judge knows what the product actually is.
 */

import type { NeuroLink } from '@juspay/neurolink';
import fs from 'fs/promises';
import path from 'path';
import { ComparisonSchema, type Comparison } from '../schemas/comparison.ts';
import { safeJsonParse } from '../utils/json-repair.ts';
import { exponentialBackoff } from '../utils/rate-limit.ts';
import { CONFIG } from '../pipeline/config.ts';
import { normalizeToMatchedResolution } from './comparator-media.ts';

export function buildComparisonPrompt(productContext?: string): string {
  return `You are comparing two versions of a product video (A and B).

Score each video across 9 dimensions:
- product_identity (CRITICAL): does the product stay the SAME object across every shot — shape, materials, proportions, design details? A product that mutates between shots is a failing score regardless of how good each shot looks.
- brand_assets (CRITICAL): are the product's logo/wordmark and identifying marks present and correct where the video presents the product? A product video with no visible branding scores low here.
- content_authenticity, visual_polish, motion_design, storytelling, transitions, music_audio, production_value.

Both videos have been normalized to the same resolution. Resolution, sharpness-from-pixel-count, and file size are NOT quality signals — never cite them. Judge what was created, not how it was delivered.

A failure in either CRITICAL dimension caps that video's overall score: a beautiful video of the wrong or unbranded product is a worse product video.
${productContext ? `\nThe product and script for both videos:\n---\n${productContext}\n---\n` : ''}
Determine which is better overall, with confidence level. Flag any regressions where B is worse than A.
Focus on VISIBLE differences — don't manufacture differences that aren't there.`;
}

export async function runVideoComparatorAgent(
  neurolink: NeuroLink,
  videoPathA: string,
  videoPathB: string,
  options: { productContext?: string } = {},
): Promise<Comparison | null> {
  console.log(`[Comparator] A: ${path.basename(videoPathA)} vs B: ${path.basename(videoPathB)}`);

  const pair = await normalizeToMatchedResolution(videoPathA, videoPathB);
  try {
    const result = await exponentialBackoff(async () => {
      const response = await neurolink.generate({
        input: {
          text: `${buildComparisonPrompt(options.productContext)}\n\nVideo A is the first video. Video B is the second.`,
          files: [path.resolve(pair.pathA), path.resolve(pair.pathB)],
        },
        provider: process.env.AGENT_PROVIDER ?? 'vertex',
        model: CONFIG.MODEL,
        schema: ComparisonSchema,
        output: { format: 'json' },
        disableTools: true,
        maxTokens: 8192,
        timeout: '240s',
      });

      return ComparisonSchema.parse(safeJsonParse(response.content));
    });

    if (!result.success) {
      console.error(`[Comparator] Failed: ${result.error}`);
      return null;
    }

    const c = result.value;
    console.log(`[Comparator] Winner: ${c.winner} (confidence: ${c.confidence}) | Regression: ${c.regression_detected}`);
    return c;
  } finally {
    await pair.cleanup().catch(() => undefined);
  }
}

// CLI: npm run compare -- <videoA.mp4> <videoB.mp4> [script.txt]
if (import.meta.url === `file://${process.argv[1]}`) {
  const [videoA, videoB, scriptPath] = process.argv.slice(2);
  if (!videoA || !videoB) {
    console.error('Usage: npm run compare -- <videoA.mp4> <videoB.mp4> [script.txt — product/script context for the judge]');
    process.exit(1);
  }
  const productContext = scriptPath ? await fs.readFile(scriptPath, 'utf8') : undefined;
  const { NeuroLink } = await import('@juspay/neurolink');
  const nl = new NeuroLink();
  try {
    const comparison = await runVideoComparatorAgent(nl, videoA, videoB, { productContext });
    if (!comparison) process.exit(1);
    console.log(JSON.stringify(comparison, null, 2));
  } finally {
    await nl.shutdown();
  }
}
