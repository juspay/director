/**
 * SceneAnalysisSchema — per-scene quality analysis.
 * Catches issues Gemini scoring might miss at the overall level.
 *
 * Note: Uses z.string().describe() instead of z.enum() for type fields
 * inside arrays (Gemini constraint from dopamine learnings).
 */
import { z } from 'zod';

const ArtifactSchema = z.object({
  type: z.string().describe('Artifact type: flickering, banding, aliasing, blur, compression, misalignment'),
  severity: z.string().describe('Severity: critical, major, minor, cosmetic'),
  timestamp: z.string().describe('Approximate timestamp where artifact appears (e.g., "0:32")'),
  description: z.string().describe('What the artifact looks like and where on screen'),
});

export const SceneAnalysisSchema = z.object({
  scene_id: z.string().describe('Scene identifier'),
  temporal_quality: z.number().describe('Score 0-10: Absence of flickering, smooth motion'),
  motion_smoothness: z.number().describe('Score 0-10: Spring quality, no janky transitions'),
  composition: z.number().describe('Score 0-10: Visual balance, hierarchy, spacing'),
  color_consistency: z.number().describe('Score 0-10: Palette matches across the scene'),
  typography_quality: z.number().describe('Score 0-10: Font rendering, readability, hierarchy'),

  artifacts: z.array(ArtifactSchema).describe('List of visual artifacts detected'),
  composition_notes: z.string().describe('Notes on visual composition and layout'),
  overall_assessment: z.string().describe('One-paragraph overall quality assessment'),
  pass: z.boolean().describe('True if scene meets production quality bar'),
});

export type SceneAnalysis = z.infer<typeof SceneAnalysisSchema>;
