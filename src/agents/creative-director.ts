/**
 * CreativeDirectorAgent — generates optimized prompts for TTS, B-roll, music, SFX.
 * Pattern B: text only + schema (analyzes script, outputs per-scene creative direction).
 */

import type { NeuroLink } from '@juspay/neurolink';
import { CreativePromptSchema, type CreativePrompt } from '../schemas/creative-prompt.ts';
import { safeJsonParse } from '../utils/json-repair.ts';
import { exponentialBackoff } from '../utils/rate-limit.ts';
import { CONFIG } from '../pipeline/config.ts';

const CREATIVE_DIRECTION_PROMPT = `You are a creative director for product videos. Given a video script, generate optimized creative direction for every production phase.

For each scene, provide:
1. TTS delivery instruction (natural language for OpenAI gpt-4o-mini-tts)
2. Words to emphasize
3. Cinematic B-roll prompt (for Kling 3.0 / Runway Gen-4.5)
4. Camera direction for B-roll
5. Music mood and energy level (0-1)
6. SFX suggestions with placement
7. Transition notes to the next scene

Also provide overall:
- Tonal direction
- Color palette
- Musical key and BPM arc
- Strategic silence moments

Think like a Pixar creative director meeting a YC startup founder.`;

export async function runCreativeDirectorAgent(
  neurolink: NeuroLink,
  scriptText: string,
  projectTitle: string = `${process.env.PRODUCT_NAME ?? 'Director'}: AI Video Pipeline`,
): Promise<CreativePrompt | null> {
  console.log(`[CreativeDirector] Generating direction for "${projectTitle}"...`);

  const result = await exponentialBackoff(async () => {
    const response = await neurolink.generate({
      input: {
        text: `${CREATIVE_DIRECTION_PROMPT}\n\nProject: ${projectTitle}\n\n---\n\nSCRIPT:\n${scriptText}`,
      },
      provider: process.env.AGENT_PROVIDER ?? 'vertex',
      model: process.env.CREATIVE_DIRECTOR_MODEL ?? CONFIG.MODEL,
      schema: CreativePromptSchema,
      output: { format: 'json' },
      disableTools: true,
      maxTokens: 8192,
      timeout: '180s',
      thinkingConfig: { thinkingLevel: 'high' },
    });

    return CreativePromptSchema.parse(safeJsonParse(response.content));
  });

  if (!result.success) {
    console.error(`[CreativeDirector] Failed: ${result.error}`);
    return null;
  }

  const c = result.value;
  console.log(`[CreativeDirector] Generated direction for ${c.scenes.length} scenes | Key: ${c.music_key} | BPM: ${c.music_bpm_start}-${c.music_bpm_peak}`);
  return c;
}
