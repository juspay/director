/**
 * FidelityReportSchema — single-video product-fidelity gate results.
 */
import { z } from 'zod';

const FidelityDimensionSchema = z.object({
  score: z.number().describe('1-5; 5 = flawless, 1 = failing'),
  notes: z.string().describe('What the video shows that earned this score'),
});

export const FidelityReportSchema = z.object({
  product_identity: FidelityDimensionSchema.describe('CRITICAL: the product stays the same object in every shot'),
  brand_assets: FidelityDimensionSchema.describe('CRITICAL: logo/wordmark visibly present where the video presents the product'),
  cta_ending: FidelityDimensionSchema.describe('CRITICAL: the video ends on the product or a branded end-card, not an unrelated shot'),
  motion_artifacts: FidelityDimensionSchema.describe('Morphing, warping, extra fingers, garbled text'),
  script_alignment: FidelityDimensionSchema.describe('Shots show what the script/brief describes'),
  passed: z.boolean().describe('Overall gate verdict from the judge'),
  failures: z.array(z.string()).describe('Concrete failures observed, empty when passing'),
});

export type FidelityReport = z.infer<typeof FidelityReportSchema>;
