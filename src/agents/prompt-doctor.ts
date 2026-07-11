/**
 * PromptDoctorAgent — rewrites a media-generation prompt that a provider
 * rejected on safety/policy grounds, preserving creative intent while
 * removing whatever plausibly triggered the block. The doctor loop
 * (generators/doctor.ts) calls this only for safety-class failures, so the
 * extra LLM spend is rare and tiny relative to the media call it rescues.
 */
import type { NeuroLink } from '@juspay/neurolink';
import { DoctorRewriteSchema } from '../schemas/doctor-rewrite.ts';
import { safeJsonParse } from '../utils/json-repair.ts';
import { exponentialBackoff } from '../utils/rate-limit.ts';
import { CONFIG } from '../pipeline/config.ts';

export async function runPromptDoctorAgent(
  neurolink: NeuroLink,
  prompt: string,
  errorMessage: string,
  medium: 'image' | 'video',
): Promise<string | null> {
  const result = await exponentialBackoff(async () => {
    const response = await neurolink.generate({
      input: {
        text: `You are a prompt doctor for a commercial ${medium}-generation pipeline.

The following prompt was REJECTED by the provider:
"""
${prompt}
"""

Provider error:
"""
${errorMessage.slice(0, 500)}
"""

Rewrite the prompt so it will pass the provider's content policy while preserving the shot's creative intent (subject, composition, mood, camera work). Remove or rephrase only what plausibly triggered the rejection — do not sanitize the whole prompt into blandness, and do not add new creative elements.`,
      },
      provider: process.env.AGENT_PROVIDER ?? 'vertex',
      model: CONFIG.MODEL,
      schema: DoctorRewriteSchema,
      output: { format: 'json' },
      disableTools: true,
      maxTokens: 1024,
      timeout: '60s',
    });
    return DoctorRewriteSchema.parse(safeJsonParse(response.content));
  });

  if (!result.success) {
    console.error(`[PromptDoctor] rewrite failed: ${result.error}`);
    return null;
  }
  console.log(`[PromptDoctor] rewrote prompt: ${result.value.change_summary.slice(0, 120)}`);
  return result.value.rewritten_prompt;
}
