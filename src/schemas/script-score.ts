/**
 * ScriptScoreSchema — 11-criterion script evaluation rubric.
 * Ported from v7's scoring methodology.
 */
import { z } from 'zod';

export const ScriptScoreSchema = z.object({
  flow_continuity: z.number().describe('Score 1-10: Continuous river flow, no scene walls'),
  speakability: z.number().describe('Score 1-10: Natural spoken delivery, no tongue-twisters'),
  emotional_arc: z.number().describe('Score 1-10: Builds, peaks, resolves satisfyingly'),
  visual_audio_sync: z.number().describe('Score 1-10: Words match intended visual moments'),
  pacing: z.number().describe('Score 1-10: Rhythm variation, no monotone sections'),
  hook_strength: z.number().describe('Score 1-10: First 3 seconds grab attention'),
  transition_quality: z.number().describe('Score 1-10: Scenes flow into each other via narration'),
  specificity_truth: z.number().describe('Score 1-10: Real data, specific details, no generic claims'),
  thesis_landing: z.number().describe('Score 1-10: Core message lands clearly and memorably'),
  overall_polish: z.number().describe('Score 1-10: Professional, no rough edges in language'),
  music_direction: z.number().describe('Score 1-10: Script supports musical arc, silence moments noted'),

  average_score: z.number().describe('Average across all 11 criteria'),
  lock_ready: z.boolean().describe('True if average >= 9.0 and no criterion below 7.0'),
  weakest_criterion: z.string().describe('Name of the lowest-scoring criterion'),
  improvement_notes: z.array(z.string()).describe('Specific improvements for weakest areas'),
});

export type ScriptScore = z.infer<typeof ScriptScoreSchema>;
