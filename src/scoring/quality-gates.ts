/**
 * Post-pipeline quality gates using NeuroLink's LLM scorers.
 *
 * Runs 7 dimension scorers in parallel against a (script, response, context?)
 * triple and aggregates into a single pass/fail report. Each scorer returns a
 * normalized 0-1 score; the gate passes when every dimension is above its
 * configured threshold.
 *
 * Scorers used:
 *   - PromptAlignment   — does the response follow the prompt's instructions?
 *   - AnswerRelevancy   — is the response topically relevant?
 *   - Hallucination     — does the response contain unsupported claims?
 *   - Faithfulness      — is the response consistent with retrieved context?
 *   - BiasDetection     — does the response exhibit demographic / topical bias?
 *   - Toxicity          — does the response contain harmful content?
 *   - ToneConsistency   — does the response match the requested tone?
 */
import fs from 'fs/promises';
import path from 'path';
import {
  createPromptAlignmentScorer,
  createAnswerRelevancyScorer,
  createHallucinationScorer,
  createFaithfulnessScorer,
  createBiasDetectionScorer,
  createToxicityScorer,
  createToneConsistencyScorer,
} from '@juspay/neurolink';
import type {
  QualityGateInput,
  QualityGateConfig,
  QualityGateReport,
} from '../types/index.ts';

export type {
  QualityGateInput,
  QualityGateConfig,
  QualityGateReport,
} from '../types/index.ts';

const DEFAULT_THRESHOLDS = {
  promptAlignment: 0.7,
  answerRelevancy: 0.7,
  hallucination:   0.6,
  faithfulness:    0.7,
  biasDetection:   0.8,
  toxicity:        0.8,
  toneConsistency: 0.6,
};

export async function runQualityGates(
  input: QualityGateInput,
  config: QualityGateConfig = {},
): Promise<QualityGateReport> {
  const thresholds = { ...DEFAULT_THRESHOLDS, ...(config.thresholds ?? {}) };
  const provider = config.provider ?? process.env.AGENT_PROVIDER ?? 'vertex';
  const model = config.model ?? process.env.MODEL ?? 'gemini-2.5-flash';
  const llmConfig = { provider, model } as Parameters<typeof createPromptAlignmentScorer>[0];

  const scorerInput = {
    query: input.script,
    response: input.response,
    context: input.context,
  };

  // Faithfulness requires a `context` array (it's a RAG-faithfulness check).
  // When the caller didn't supply context, we skip it rather than score 0.
  const hasContext = Array.isArray(input.context) && input.context.length > 0;

  const scorersToRun: Array<{
    name: string;
    factory: Promise<{ score: (i: typeof scorerInput) => Promise<{ scorerId: string; scorerName: string; score: number; normalizedScore: number; passed: boolean; threshold: number; reasoning: string; confidence?: number }> }>;
  }> = [
    { name: 'promptAlignment', factory: createPromptAlignmentScorer({ ...llmConfig, threshold: thresholds.promptAlignment }) },
    { name: 'answerRelevancy', factory: createAnswerRelevancyScorer({ ...llmConfig, threshold: thresholds.answerRelevancy }) },
    { name: 'hallucination',   factory: createHallucinationScorer  ({ ...llmConfig, threshold: thresholds.hallucination }) },
    { name: 'biasDetection',   factory: createBiasDetectionScorer  ({ ...llmConfig, threshold: thresholds.biasDetection }) },
    { name: 'toxicity',        factory: createToxicityScorer       ({ ...llmConfig, threshold: thresholds.toxicity }) },
    { name: 'toneConsistency', factory: createToneConsistencyScorer({ ...llmConfig, threshold: thresholds.toneConsistency }) },
  ];
  if (hasContext) {
    scorersToRun.splice(3, 0, { name: 'faithfulness', factory: createFaithfulnessScorer({ ...llmConfig, threshold: thresholds.faithfulness }) });
  }

  const resolvedScorers = await Promise.all(scorersToRun.map(s => s.factory));
  const names = scorersToRun.map(s => s.name);
  const scoreSettled = await Promise.allSettled(resolvedScorers.map(scorer => scorer.score(scorerInput)));
  const scores: QualityGateReport['scores'] = scoreSettled.map((s, i) => {
    if (s.status === 'fulfilled') {
      return {
        name: names[i],
        ok: true,
        scorerId: s.value.scorerId,
        scorerName: s.value.scorerName,
        score: s.value.score,
        normalizedScore: s.value.normalizedScore,
        passed: s.value.passed,
        threshold: s.value.threshold,
        reasoning: s.value.reasoning,
        confidence: s.value.confidence,
      };
    }
    return { name: names[i], ok: false, error: s.reason instanceof Error ? s.reason.message : String(s.reason) };
  });

  const passedGates = scores.filter(s => s.ok && s.passed);
  const failedGates = scores.filter(s => !s.ok || !s.passed);
  const validScores = scores.filter(s => s.ok) as Array<Extract<QualityGateReport['scores'][number], { ok: true }>>;
  const minScore    = validScores.length ? Math.min(...validScores.map(s => s.normalizedScore)) : 0;
  const avgScore    = validScores.length ? validScores.reduce((sum, s) => sum + s.normalizedScore, 0) / validScores.length : 0;

  const report: QualityGateReport = {
    passed: failedGates.length === 0,
    thresholds,
    overall: {
      minScore,
      avgScore,
      passedGates: passedGates.length,
      failedGates: failedGates.map(g => g.name),
    },
    scores,
  };

  const outPath = config.outputPath ?? path.join('output', 'quality-gates.json');
  await fs.mkdir(path.dirname(outPath), { recursive: true });
  await fs.writeFile(outPath, JSON.stringify(report, null, 2));
  return report;
}
