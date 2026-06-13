/**
 * ArtDirectorAgent — turns a script into a cohesive, on-brand shot plan.
 *
 * Unlike the legacy static broll-prompts.json (which let the product drift into
 * a different-looking object every shot), this produces ONE canonical
 * `product_bible` plus a hero beauty-shot prompt and an ordered shot list. The
 * bible is later injected verbatim into every product shot so the product stays
 * identical across the film.
 */
import type { NeuroLink } from '@juspay/neurolink';
import { ShotPlanSchema, type ShotPlan } from '../schemas/shot-plan.ts';
import { safeJsonParse } from '../utils/json-repair.ts';
import { exponentialBackoff } from '../utils/rate-limit.ts';
import { CONFIG, PRODUCT_NAME, PRODUCT_DESCRIPTION } from '../pipeline/config.ts';

export type ArtDirectorOpts = {
  productName?: string;
  productDescription?: string;
  /** Soft target for shot count; the agent matches the script's natural beats. */
  shotCount?: number;
};

const SYSTEM_PROMPT = `You are the art director and director of photography for a premium product film. Given the product and the narration script, design a cohesive shot list.

Non-negotiable rules:
0. SCRIPT IS AUTHORITATIVE — The SCRIPT defines what the product actually is and does. The product brief is only a hint; if it conflicts with the script, follow the SCRIPT. Never rewrite the script's beats to fit a different product.
1. PRODUCT IDENTITY — Write ONE exhaustive "product_bible": the exact material, colour, finish, proportions and EVERY distinguishing feature of the product as described by the SCRIPT. This is the single source of truth. The product must look like the SAME physical object in every shot. Do NOT invent variations.
2. Each shot's "prompt" describes the SCENE only (setting, lighting, mood, framing, action) — do NOT restate the product description inside shot prompts; the product_bible is injected separately.
3. Set shows_product=true for any shot the product appears in (hero shots, on-body shots, lifestyle shots where it's worn).
4. LEGIBILITY — If a beat references a number, score, metric or reading (e.g. "a single number: how ready you are"), the shot MUST make that value legibly visible on screen (e.g. a clean UI showing a large readiness score like "87").
5. Give every shot a deliberate "camera" direction (slow push-in, rack focus, static macro, handheld drift, orbit) for an intentional, cinematic feel.
6. Keep one cohesive tone and colour palette across all shots so it reads as a single film.
7. Order shots to follow the script beats exactly, beginning with the problem and ending on the product + call to action.`;

export async function runArtDirectorAgent(
  neurolink: NeuroLink,
  scriptText: string,
  opts: ArtDirectorOpts = {},
): Promise<ShotPlan | null> {
  const productName = opts.productName ?? PRODUCT_NAME;
  const productDescription = opts.productDescription ?? PRODUCT_DESCRIPTION;
  const shotHint = opts.shotCount ? `\nAim for about ${opts.shotCount} shots.` : '';
  console.log(`[ArtDirector] Planning shots for "${productName}"...`);

  const result = await exponentialBackoff(async () => {
    const response = await neurolink.generate({
      input: {
        text: `${SYSTEM_PROMPT}\n\nPRODUCT: ${productName} — ${productDescription}${shotHint}\n\n---\n\nSCRIPT:\n${scriptText}`,
      },
      provider: process.env.AGENT_PROVIDER ?? 'vertex',
      model: process.env.ART_DIRECTOR_MODEL ?? CONFIG.MODEL,
      schema: ShotPlanSchema,
      output: { format: 'json' },
      disableTools: true,
      maxTokens: 8192,
      timeout: '180s',
      thinkingConfig: { thinkingLevel: 'high' },
    });

    return ShotPlanSchema.parse(safeJsonParse(response.content));
  });

  if (!result.success) {
    console.error(`[ArtDirector] Failed: ${result.error}`);
    return null;
  }

  const plan = result.value;
  console.log(`[ArtDirector] ${plan.shots.length} shots | ${plan.shots.filter((s) => s.shows_product).length} show the product | tone: ${plan.tone.slice(0, 60)}`);
  return plan;
}

// CLI: npm run art-direct -- <script.txt>
if (import.meta.url === `file://${process.argv[1]}`) {
  const scriptPath = process.argv[2];
  if (!scriptPath) {
    console.error('Usage: node --import tsx src/agents/art-director.ts <script.txt>');
    process.exit(1);
  }
  const fs = await import('fs/promises');
  const { NeuroLink } = await import('@juspay/neurolink');
  const scriptText = (await fs.readFile(scriptPath, 'utf-8')).trim();
  const nl = new NeuroLink();
  try {
    const plan = await runArtDirectorAgent(nl, scriptText);
    if (!plan) process.exit(1);
    console.log(JSON.stringify(plan, null, 2));
  } finally {
    await nl.shutdown();
  }
}
