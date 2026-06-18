/**
 * ShotPlanSchema — the art director's cohesive shot list for concept-mode b-roll.
 *
 * The whole point of this schema is product *identity*: `product_bible` is a
 * single, exhaustive physical description of the product that gets injected
 * verbatim into every shot that shows it, so the product renders as the SAME
 * object across the whole film (the failure mode the old static prompts had —
 * a different-looking ring in every shot).
 */
import { z } from 'zod';

const ShotSchema = z.object({
  scene_id: z.string().describe('Short stable id, e.g. "shot_01_problem"'),
  beat: z.string().describe('The script line / narrative beat this shot covers'),
  shows_product: z.boolean().describe('True if the product is visible in this shot (anchors it to the canonical hero still)'),
  prompt: z.string().describe('Full cinematic image prompt for the keyframe. Describe the scene, lighting, mood, framing — but do NOT restate the product description; the product_bible is injected separately to keep it identical.'),
  camera: z.string().describe('Camera + motion direction for the animation pass: e.g. "slow push-in", "rack focus to the ring", "static macro", "handheld drift"'),
});

export const ShotPlanSchema = z.object({
  product_bible: z.string().describe('ONE canonical, exhaustive physical description of the product: exact material, colour, finish, proportions, and every distinguishing feature (e.g. a warm gold inner edge, a thin sensor band with a subtle green LED). This is the single source of truth injected into every product shot.'),
  hero_prompt: z.string().describe('Cinematic beauty-shot prompt for the single canonical product still that all product shots derive from. Must embody the product_bible.'),
  tone: z.string().describe('Overall tonal / emotional direction for the film'),
  color_palette: z.string().describe('Cohesive colour palette so shots feel like one film'),
  shots: z.array(ShotSchema).describe('Ordered shot list, one per narrative beat, in script order'),
});

export type ShotPlan = z.infer<typeof ShotPlanSchema>;
export type Shot = z.infer<typeof ShotSchema>;
