/**
 * ConsistencyCriticAgent — judges whether a candidate keyframe's product matches
 * the canonical hero still. Runs on the still image (cheap) before the expensive
 * animation pass, so off-brand frames are caught and regenerated, not animated.
 */
import type { NeuroLink } from '@juspay/neurolink';
import path from 'path';
import { ConsistencyVerdictSchema, type ConsistencyVerdict } from '../schemas/consistency-verdict.ts';
import { safeJsonParse } from '../utils/json-repair.ts';
import { exponentialBackoff } from '../utils/rate-limit.ts';
import { CONFIG } from '../pipeline/config.ts';

export async function runConsistencyCriticAgent(
  neurolink: NeuroLink,
  canonicalImagePath: string,
  candidateImagePath: string,
  productBible: string,
): Promise<ConsistencyVerdict | null> {
  const label = path.basename(candidateImagePath);

  const result = await exponentialBackoff(async () => {
    const response = await neurolink.generate({
      input: {
        text: `You are a product-consistency inspector for a commercial film.

IMAGE 1 is the CANONICAL reference of the product. IMAGE 2 is a candidate shot.

The product must be EXACTLY this object in every shot:
"""
${productBible}
"""

Compare IMAGE 2 against IMAGE 1 and the description. Judge ONLY the product's physical identity — material, colour, finish, proportions, distinguishing features, and whether it is actually visible. Ignore scene, background, lighting and composition differences (those are meant to vary).

Score 0-10 how faithfully IMAGE 2 reproduces the canonical product. List concrete mismatches and give one imperative fix_instruction to regenerate IMAGE 2 so the product matches. If the product is not clearly visible in IMAGE 2, that is a failure.`,
        files: [path.resolve(canonicalImagePath), path.resolve(candidateImagePath)],
      },
      provider: process.env.AGENT_PROVIDER ?? 'vertex',
      model: CONFIG.MODEL,
      schema: ConsistencyVerdictSchema,
      output: { format: 'json' },
      disableTools: true,
      maxTokens: 2048,
      timeout: '120s',
    });

    return ConsistencyVerdictSchema.parse(safeJsonParse(response.content));
  });

  if (!result.success) {
    console.error(`[ConsistencyCritic] Failed for ${label}: ${result.error}`);
    return null;
  }

  const v = result.value;
  console.log(`[ConsistencyCritic] ${label}: ${v.consistent ? 'MATCH' : 'DRIFT'} (${v.score}/10)${v.mismatches.length ? ` — ${v.mismatches[0]}` : ''}`);
  return v;
}

// CLI: node --import tsx src/agents/consistency-critic.ts <canonical.png> <candidate.png> "<bible>"
if (import.meta.url === `file://${process.argv[1]}`) {
  const [canonical, candidate, bible] = process.argv.slice(2);
  if (!canonical || !candidate) {
    console.error('Usage: node --import tsx src/agents/consistency-critic.ts <canonical> <candidate> [bible]');
    process.exit(1);
  }
  const { NeuroLink } = await import('@juspay/neurolink');
  const nl = new NeuroLink();
  try {
    const verdict = await runConsistencyCriticAgent(nl, canonical, candidate, bible ?? 'the product');
    if (!verdict) process.exit(1);
    console.log(JSON.stringify(verdict, null, 2));
  } finally {
    await nl.shutdown();
  }
}
