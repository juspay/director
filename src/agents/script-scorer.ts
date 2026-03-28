/**
 * ScriptScorerAgent — scores script text against 11 criteria via Neurolink.
 * Pattern B: text only + schema (no file input).
 */

import type { NeuroLink } from '@juspay/neurolink';
import { ScriptScoreSchema, type ScriptScore } from '../schemas/script-score.ts';
import { safeJsonParse } from '../utils/json-repair.ts';
import { exponentialBackoff } from '../utils/rate-limit.ts';
import { CONFIG } from '../pipeline/config.ts';

const SCRIPT_SCORING_PROMPT = `You are a world-class video scriptwriter and creative director.

Score this video script across 11 criteria, each 1-10. The script is for a 2-3 minute product video.

Criteria:
1. Flow & Continuity — reads as one continuous river, no scene walls
2. Speakability — natural spoken delivery, no tongue-twisters
3. Emotional Arc — builds, peaks, resolves
4. Visual-Audio Sync — words match intended visual moments
5. Pacing — rhythm variation, no monotone
6. Hook Strength — first 3 seconds grab attention
7. Transition Quality — scenes flow via narration bridges
8. Specificity & Truth — real data, specific details
9. Thesis Landing — core message is clear and memorable
10. Overall Polish — professional language, no rough edges
11. Music Direction — supports musical arc, silence moments noted

Lock criteria: average >= 9.0 AND no criterion below 7.0.
Be honest — most scripts are 7-8. A 9+ is exceptional.`;

export async function runScriptScorerAgent(
  neurolink: NeuroLink,
  scriptText: string,
): Promise<ScriptScore | null> {
  console.log(`[ScriptScorer] Scoring script (${scriptText.length} chars)...`);

  const result = await exponentialBackoff(async () => {
    const response = await neurolink.generate({
      input: { text: `${SCRIPT_SCORING_PROMPT}\n\n---\n\nSCRIPT:\n${scriptText}` },
      provider: 'vertex',
      model: CONFIG.MODEL,
      schema: ScriptScoreSchema,
      output: { format: 'json' },
      disableTools: true,
      maxTokens: 4096,
      timeout: '120s',
    });

    return ScriptScoreSchema.parse(safeJsonParse(response.content));
  });

  if (!result.success) {
    console.error(`[ScriptScorer] Failed: ${result.error}`);
    return null;
  }

  const s = result.value;
  console.log(`[ScriptScorer] Average: ${s.average_score.toFixed(2)}/10 | Lock ready: ${s.lock_ready} | Weakest: ${s.weakest_criterion}`);
  return s;
}
