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

/**
 * Build the scoring prompt. The video is judged on what is actually on screen —
 * its real style, pacing, and production quality — with no assumption about the
 * production technique. `context` (e.g. the narration script) is optional brief
 * material; it falls back to PRODUCT_NAME/PRODUCT_DESCRIPTION only when those are
 * explicitly configured (not the project default).
 */
function buildScoringPrompt(context?: string): string {
  const fromEnv = process.env.PRODUCT_NAME
    ? `${PRODUCT_NAME}${PRODUCT_DESCRIPTION ? ` — ${PRODUCT_DESCRIPTION}` : ''}`
    : '';
  const brief = (context && context.trim()) || fromEnv;
  const briefLine = brief
    ? `\n\nFor context only (judge the video as delivered, not against a fixed template or tool):\n${brief.slice(0, 1200)}`
    : '';
  return `You are an expert video production critic.

Analyze the attached video against the scoring rubric. Judge it on what is actually on screen — its real visual style, pacing, cinematography or motion design, audio, and overall production quality. Do not assume any particular production technique, tool, or framework.${briefLine}

Score each dimension 1-10 with brief justification. Calculate the weighted overall score.
Identify the top improvements and any deal-breaker issues.

Be rigorous — 9+ means genuinely excellent, not just "good enough."`;
}

export async function runVideoScorerAgent(
  neurolink: NeuroLink,
  videoPath: string,
  tier: 'dev' | 'official' = 'dev',
  context?: string,
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
        text: buildScoringPrompt(context),
        files: [path.resolve(inputFile)],
      },
      provider: process.env.AGENT_PROVIDER ?? 'vertex',
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
  context?: string,
): Promise<{ average: number; scores: VideoScore[]; variance: number }> {
  const results: VideoScore[] = [];

  for (let i = 0; i < runs; i++) {
    console.log(`\n--- Run ${i + 1}/${runs} ---`);
    const score = await runVideoScorerAgent(neurolink, videoPath, 'official', context);
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

// CLI: npm run score -- <video.mp4> [dev|official]
if (import.meta.url === `file://${process.argv[1]}`) {
  const [videoPath, tier] = process.argv.slice(2);
  if (!videoPath) {
    console.error('Usage: npm run score -- <video.mp4> [dev|official]');
    process.exit(1);
  }
  const { NeuroLink } = await import('@juspay/neurolink');
  const nl = new NeuroLink();
  try {
    const score = await runVideoScorerAgent(nl, videoPath, tier === 'official' ? 'official' : 'dev');
    if (!score) process.exit(1);
    console.log(JSON.stringify(score, null, 2));
  } finally {
    await nl.shutdown();
  }
}
