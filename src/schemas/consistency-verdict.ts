/**
 * ConsistencyVerdictSchema — the product-consistency critic's judgment of a
 * candidate keyframe against the canonical hero still.
 *
 * Run on the still keyframe (cheap) BEFORE paying to animate it, so off-brand
 * frames are caught and regenerated rather than animated.
 */
import { z } from 'zod';

export const ConsistencyVerdictSchema = z.object({
  consistent: z.boolean().describe('True if the product in the candidate matches the canonical reference closely enough to read as the same object'),
  score: z.number().describe('0-10: how faithfully the candidate reproduces the canonical product (material, colour, finish, distinguishing features, visibility)'),
  mismatches: z.array(z.string()).describe('Specific, concrete differences, e.g. "ring is matte black not brushed titanium", "missing the warm gold inner edge", "product is not visible in frame"'),
  fix_instruction: z.string().describe('A concrete, imperative instruction to regenerate the keyframe so the product matches the reference exactly'),
});

export type ConsistencyVerdict = z.infer<typeof ConsistencyVerdictSchema>;
