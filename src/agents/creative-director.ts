/**
 * CreativeDirectorAgent — generates optimized prompts for TTS, B-roll, music, SFX.
 * Pattern B: text only + schema (analyzes script, outputs per-scene creative direction).
 */

import type { NeuroLink } from '@juspay/neurolink';
import { CreativePromptSchema, type CreativePrompt } from '../schemas/creative-prompt.ts';
import { safeJsonParse } from '../utils/json-repair.ts';
import { exponentialBackoff } from '../utils/rate-limit.ts';
import { CONFIG } from '../pipeline/config.ts';
import { buildBrandVoiceRAG } from '../rag/index.ts';

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

/**
 * Assemble the creative-direction input, optionally prefixing retrieved brand
 * context so the model honors the documented brand voice / product facts. Pure —
 * exported for unit testing.
 */
export function composeCreativeInput(projectTitle: string, scriptText: string, brandContext?: string): string {
  const brand = brandContext?.trim()
    ? `\n\nBRAND CONTEXT (retrieved from brand-voice & product-knowledge docs — honor this):\n${brandContext.trim()}`
    : '';
  return `${CREATIVE_DIRECTION_PROMPT}${brand}\n\nProject: ${projectTitle}\n\n---\n\nSCRIPT:\n${scriptText}`;
}

/** Retrieve a brand-voice / product brief grounded in docs/. Never throws — returns '' if unavailable. */
async function fetchBrandContext(neurolink: NeuroLink, scriptText: string): Promise<string> {
  try {
    const rag = await buildBrandVoiceRAG(neurolink);
    if (!rag.files.length) return '';
    const query = `Summarize the brand voice, tone, and the key product facts to respect when directing a video for this script:\n\n${scriptText.slice(0, 1500)}`;
    return (await rag.ask(query, { topK: 5 })).trim();
  } catch (e) {
    console.warn(`[CreativeDirector] brand-voice RAG skipped: ${e instanceof Error ? e.message : e}`);
    return '';
  }
}

export async function runCreativeDirectorAgent(
  neurolink: NeuroLink,
  scriptText: string,
  projectTitle: string = `${process.env.PRODUCT_NAME ?? 'Director'}: AI Video Pipeline`,
  opts: { brandContext?: string; useBrandVoice?: boolean } = {},
): Promise<CreativePrompt | null> {
  console.log(`[CreativeDirector] Generating direction for "${projectTitle}"...`);

  // Opt-in brand grounding: explicit context wins; otherwise fetch via RAG when
  // requested (option or BRAND_VOICE_RAG=1). Default path is unchanged.
  let brandContext = opts.brandContext;
  if (brandContext === undefined && (opts.useBrandVoice ?? process.env.BRAND_VOICE_RAG === '1')) {
    brandContext = await fetchBrandContext(neurolink, scriptText);
    if (brandContext) console.log(`[CreativeDirector] injected ${brandContext.length} chars of brand context`);
  }

  const result = await exponentialBackoff(async () => {
    const response = await neurolink.generate({
      input: {
        text: composeCreativeInput(projectTitle, scriptText, brandContext),
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

// CLI: npm run direct -- <script.txt> [--brand-voice]
if (import.meta.url === `file://${process.argv[1]}`) {
  const args = process.argv.slice(2);
  const scriptPath = args.find((a) => !a.startsWith('--'));
  const useBrandVoice = args.includes('--brand-voice');
  if (!scriptPath) {
    console.error('Usage: npm run direct -- <script.txt> [--brand-voice]');
    process.exit(1);
  }
  const fs = await import('fs/promises');
  const { NeuroLink } = await import('@juspay/neurolink');
  const scriptText = (await fs.readFile(scriptPath, 'utf-8')).trim();
  const nl = new NeuroLink();
  try {
    const direction = await runCreativeDirectorAgent(nl, scriptText, undefined, { useBrandVoice });
    if (!direction) process.exit(1);
    console.log(JSON.stringify(direction, null, 2));
  } finally {
    await nl.shutdown();
  }
}
