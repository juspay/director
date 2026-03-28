/**
 * AcousticAnalyzerAgent — AI-enhanced voiceover quality analysis.
 * Complements the Python-based acoustic_scorer.py with Gemini's
 * perceptual quality judgment.
 *
 * Pattern A: file + schema.
 */

import type { NeuroLink } from '@juspay/neurolink';
import path from 'path';
import { AcousticScoreSchema, type AcousticScore } from '../schemas/acoustic-score.ts';
import { safeJsonParse } from '../utils/json-repair.ts';
import { exponentialBackoff } from '../utils/rate-limit.ts';
import { CONFIG } from '../pipeline/config.ts';

const ACOUSTIC_ANALYSIS_PROMPT = `You are an audio engineer specializing in voiceover quality for product videos.

Analyze this voiceover audio across 9 criteria:
1. Pacing — WPM feels natural for narration (~118 WPM target)
2. Duration fit — appropriate length for a 2-3 minute video
3. Dynamic range — expressiveness without jarring shifts
4. Silence quality — natural pauses, not robotic or rushed
5. Energy arc — energy builds through the middle, resolves at end
6. Spectral warmth — warm, full voice without harshness
7. Consistency — stable quality throughout, no degradation
8. Clarity — clear articulation, good presence
9. Perceived quality — overall naturalness, human-likeness

Score each 0-10. Provide delivery notes and specific TTS parameter tuning suggestions.
A 9+ is genuinely exceptional narration that would pass for a human voice actor.`;

export async function runAcousticAnalyzerAgent(
  neurolink: NeuroLink,
  audioPath: string,
): Promise<AcousticScore | null> {
  console.log(`[AcousticAnalyzer] Analyzing ${path.basename(audioPath)}...`);

  const result = await exponentialBackoff(async () => {
    const response = await neurolink.generate({
      input: {
        text: ACOUSTIC_ANALYSIS_PROMPT,
        files: [path.resolve(audioPath)],
      },
      provider: 'vertex',
      model: CONFIG.MODEL,
      schema: AcousticScoreSchema,
      output: { format: 'json' },
      disableTools: true,
      maxTokens: 4096,
      timeout: '120s',
    });

    return AcousticScoreSchema.parse(safeJsonParse(response.content));
  });

  if (!result.success) {
    console.error(`[AcousticAnalyzer] Failed: ${result.error}`);
    return null;
  }

  const a = result.value;
  console.log(`[AcousticAnalyzer] Composite: ${a.composite_score.toFixed(2)}/10 | Quality: ${a.perceived_quality}/10`);
  return a;
}
