/**
 * VideoComparatorAgent — A/B compares two video renders via Neurolink.
 * Pattern A: multiple files + schema.
 */

import type { NeuroLink } from '@juspay/neurolink';
import path from 'path';
import { ComparisonSchema, type Comparison } from '../schemas/comparison.ts';
import { safeJsonParse } from '../utils/json-repair.ts';
import { exponentialBackoff } from '../utils/rate-limit.ts';
import { CONFIG } from '../pipeline/config.ts';

const COMPARISON_PROMPT = `You are comparing two versions of a product video (A and B).

Score each video across 7 dimensions (content authenticity, visual polish, motion design, storytelling, transitions, music/audio, production value).

Determine which is better overall, with confidence level. Flag any regressions where B is worse than A.
Focus on VISIBLE differences — don't manufacture differences that aren't there.`;

export async function runVideoComparatorAgent(
  neurolink: NeuroLink,
  videoPathA: string,
  videoPathB: string,
): Promise<Comparison | null> {
  console.log(`[Comparator] A: ${path.basename(videoPathA)} vs B: ${path.basename(videoPathB)}`);

  const result = await exponentialBackoff(async () => {
    const response = await neurolink.generate({
      input: {
        text: `${COMPARISON_PROMPT}\n\nVideo A is the first video. Video B is the second.`,
        files: [path.resolve(videoPathA), path.resolve(videoPathB)],
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
}

// CLI: npm run compare -- <videoA.mp4> <videoB.mp4>
if (import.meta.url === `file://${process.argv[1]}`) {
  const [videoA, videoB] = process.argv.slice(2);
  if (!videoA || !videoB) {
    console.error('Usage: npm run compare -- <videoA.mp4> <videoB.mp4>');
    process.exit(1);
  }
  const { NeuroLink } = await import('@juspay/neurolink');
  const nl = new NeuroLink();
  try {
    const comparison = await runVideoComparatorAgent(nl, videoA, videoB);
    if (!comparison) process.exit(1);
    console.log(JSON.stringify(comparison, null, 2));
  } finally {
    await nl.shutdown();
  }
}
