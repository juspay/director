/**
 * VideoScoreSchema — 7-dimension video scoring rubric.
 * Ported from gemini_video_scorer.py's SCORING_DIMENSIONS.
 *
 * Rules (from dopamine):
 * - No z.union() (triggers "Too many states" on Gemini)
 * - Use z.string().describe() instead of z.enum() in nested arrays
 * - Keep top-level flat
 * - disableTools: true required when using schema on Vertex
 */
import { z } from 'zod';

export const VideoScoreSchema = z.object({
  content_authenticity: z.number().describe('Score 1-10: Real data, real names, authentic Slack UI'),
  content_authenticity_justification: z.string().describe('Brief justification for content authenticity score'),

  visual_polish: z.number().describe('Score 1-10: Typography, color consistency, glow/shadow quality'),
  visual_polish_justification: z.string().describe('Brief justification for visual polish score'),

  motion_design: z.number().describe('Score 1-10: Spring quality, stagger timing, micro-animations'),
  motion_design_justification: z.string().describe('Brief justification for motion design score'),

  storytelling_arc: z.number().describe('Score 1-10: Hook strength, energy build, payoff landing'),
  storytelling_arc_justification: z.string().describe('Brief justification for storytelling arc score'),

  scene_transitions: z.number().describe('Score 1-10: Flow between scenes, visual continuity'),
  scene_transitions_justification: z.string().describe('Brief justification for scene transitions score'),

  music_audio: z.number().describe('Score 1-10: Music arc, volume automation, narration clarity'),
  music_audio_justification: z.string().describe('Brief justification for music/audio score'),

  production_value: z.number().describe('Score 1-10: Agency-level impression, no rough edges'),
  production_value_justification: z.string().describe('Brief justification for production value score'),

  weighted_overall: z.number().describe('Weighted overall: A*0.25 + B*0.20 + C*0.15 + D*0.15 + E*0.10 + F*0.10 + G*0.05'),

  top_improvements: z.array(z.string()).describe('Top 3-5 specific improvements to make'),
  deal_breakers: z.array(z.string()).describe('Any deal-breaker issues that must be fixed before shipping'),
});

export type VideoScore = z.infer<typeof VideoScoreSchema>;

// Dimension weights (must match weighted_overall formula)
export const VIDEO_SCORE_WEIGHTS = {
  content_authenticity: 0.25,
  visual_polish: 0.20,
  motion_design: 0.15,
  storytelling_arc: 0.15,
  scene_transitions: 0.10,
  music_audio: 0.10,
  production_value: 0.05,
} as const;
