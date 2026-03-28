/**
 * ComparisonSchema — A/B video comparison results.
 */
import { z } from 'zod';

const DimensionDeltaSchema = z.object({
  dimension: z.string().describe('Dimension name (e.g., content_authenticity)'),
  score_a: z.number().describe('Score for video A'),
  score_b: z.number().describe('Score for video B'),
  delta: z.number().describe('B minus A (positive = B is better)'),
  notes: z.string().describe('What changed between A and B for this dimension'),
});

export const ComparisonSchema = z.object({
  winner: z.string().describe('Which is better: A, B, or equivalent'),
  confidence: z.number().describe('Confidence 0-1 in the winner assessment'),
  overall_a: z.number().describe('Overall score for video A'),
  overall_b: z.number().describe('Overall score for video B'),
  dimension_deltas: z.array(DimensionDeltaSchema).describe('Per-dimension comparison'),
  regression_detected: z.boolean().describe('True if B is worse than A in any critical dimension'),
  recommendation: z.string().describe('One-paragraph recommendation on which to use and why'),
  key_differences: z.array(z.string()).describe('Top 3-5 most noticeable differences'),
});

export type Comparison = z.infer<typeof ComparisonSchema>;
