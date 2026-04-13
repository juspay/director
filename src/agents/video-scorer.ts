/**
 * VideoScorerAgent — scores video against 7-dimension rubric via Neurolink.
 *
 * Pattern A: file + schema (from dopamine classifier/knowledge pattern)
 *
 * Usage:
 *   const neurolink = new NeuroLink();
 *   const result = await runVideoScorerAgent(neurolink, videoPath, 'dev');
 */

import type { NeuroLink } from '@juspay/neurolink';
import path from 'path';
import fs from 'fs/promises';
import { VideoScoreSchema, type VideoScore } from '../schemas/video-score.ts';
import { safeJsonParse } from '../utils/json-repair.ts';
import { exponentialBackoff, rateLimitDelay } from '../utils/rate-limit.ts';
import { CONFIG, SCORING_TIERS, VIDEO_SIZE_THRESHOLD_BYTES, PRODUCT_NAME, PRODUCT_DESCRIPTION } from '../pipeline/config.ts';

const VIDEO_SCORING_PROMPT = `You are an expert video production critic specializing in motion graphics and SaaS product videos.

Analyze this video against the scoring rubric. This is a product announcement video for "${PRODUCT_NAME}" — ${PRODUCT_DESCRIPTION}. Built with Remotion (React-based programmatic animation). 2D motion graphics.

Score each dimension 1-10 with brief justification. Calculate the weighted overall score.
Identify the top improvements and any deal-breaker issues.

Be rigorous — 9+ means genuinely excellent, not just "good enough."`;

export async function runVideoScorerAgent(
  neurolink: NeuroLink,
  videoPath: string,
  tier: 'dev' | 'official' = 'dev',
): Promise<VideoScore | null> {
  const absolutePath = path.resolve(videoPath);

  // Check file exists
  try {
    await fs.access(absolutePath);
  } catch {
    console.error(`[VideoScorer] Video not found: ${absolutePath}`);
    return null;
  }

  // Check file size for thumbnail fallback
  const stat = await fs.stat(absolutePath);
  const inputFile = absolutePath; // Large files sent directly — Gemini handles chunking

  const tierConfig = SCORING_TIERS[tier];
  console.log(`[VideoScorer] Scoring ${path.basename(videoPath)} (tier: ${tier}, model: ${tierConfig.model})`);

  const result = await exponentialBackoff(async () => {
    const response = await neurolink.generate({
      input: {
        text: VIDEO_SCORING_PROMPT,
        files: [path.resolve(inputFile)],
      },
      provider: 'vertex',
      model: tierConfig.model,
      schema: VideoScoreSchema,
      output: { format: 'json' },
      disableTools: true,  // REQUIRED: Gemini rejects tools + JSON schema together
      maxTokens: tierConfig.maxTokens,
      timeout: '180s',
    });

    return VideoScoreSchema.parse(safeJsonParse(response.content));
  });

  if (!result.success) {
    console.error(`[VideoScorer] Failed: ${result.error}`);
    return null;
  }

  console.log(`[VideoScorer] Overall: ${result.value.weighted_overall.toFixed(2)}/10`);
  return result.value;
}

/**
 * Multi-run scoring with averaging (official tier).
 */
export async function runMultiRunScoring(
  neurolink: NeuroLink,
  videoPath: string,
  runs: number = 3,
): Promise<{ average: number; scores: VideoScore[]; variance: number }> {
  const results: VideoScore[] = [];

  for (let i = 0; i < runs; i++) {
    console.log(`\n--- Run ${i + 1}/${runs} ---`);
    const score = await runVideoScorerAgent(neurolink, videoPath, 'official');
    if (score) results.push(score);
    if (i < runs - 1) await rateLimitDelay();
  }

  if (results.length === 0) {
    return { average: 0, scores: [], variance: 0 };
  }

  const overalls = results.map((r) => r.weighted_overall);
  const average = overalls.reduce((a, b) => a + b, 0) / overalls.length;
  const variance = Math.max(...overalls) - Math.min(...overalls);

  console.log(`\n[VideoScorer] Average: ${average.toFixed(2)}/10 (variance: ±${variance.toFixed(2)})`);
  return { average, scores: results, variance };
}
