/**
 * AcousticScoreSchema — 9-criterion voiceover quality analysis.
 * AI-enhanced version of acoustic_scorer.py's librosa-based scoring.
 */
import { z } from 'zod';

export const AcousticScoreSchema = z.object({
  pacing: z.number().describe('Score 0-10: WPM closeness to 118 target'),
  duration_fit: z.number().describe('Score 0-10: Closeness to target duration'),
  dynamic_range: z.number().describe('Score 0-10: RMS energy variation (expressiveness)'),
  silence_quality: z.number().describe('Score 0-10: Natural breath/pause patterns'),
  energy_arc: z.number().describe('Score 0-10: Energy builds and resolves like the script'),
  spectral_warmth: z.number().describe('Score 0-10: Low-to-mid frequency emphasis'),
  consistency: z.number().describe('Score 0-10: RMS stability, no jarring shifts'),
  clarity: z.number().describe('Score 0-10: Spectral centroid in presence range'),
  perceived_quality: z.number().describe('Score 0-10: Overall naturalness and human-likeness'),

  composite_score: z.number().describe('Weighted composite across all criteria'),
  delivery_notes: z.string().describe('Notes on delivery style, emotional tone, pacing issues'),
  improvement_suggestions: z.array(z.string()).describe('Specific suggestions for TTS parameter tuning'),
});

export type AcousticScore = z.infer<typeof AcousticScoreSchema>;
