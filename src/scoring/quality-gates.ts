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

/**
 * Gates whose semantics fit judging narration *content* (a single text) rather
 * than a question→answer relationship. The Q&A scorers (promptAlignment,
 * answerRelevancy, hallucination, toneConsistency) misfire on a faithful,
 * verbatim narration — see issue #40. Faithfulness self-skips without context.
 */
export const NARRATION_GATES = ['toxicity', 'biasDetection', 'faithfulness'] as const;

export type GateVerdict = 'passed' | 'failed' | 'inconclusive';

/**
 * Classify a resolved scorer result. A judgment that couldn't be parsed
 * ("Could not parse structured response") or came back below `minConfidence`
 * is *inconclusive* — it must not count as a pass or a failure, or low-confidence
 * noise poisons the aggregate (the #40 live run failed on exactly this).
 */
export function classifyGate(
  score: { passed: boolean; confidence?: number; reasoning?: string },
  minConfidence = 0.5,
): GateVerdict {
  const unparseable = /could not parse|failed to parse|no structured/i.test(score.reasoning ?? '');
  // A provided-but-garbage confidence (NaN/Infinity) must be inconclusive too:
  // `typeof NaN === 'number'` is true but `NaN < minConfidence` is false, so a
  // bare typeof guard would silently trust a scorer with no real confidence.
  const c = score.confidence;
  const lowConfidence = c !== undefined && (!Number.isFinite(c) || c < minConfidence);
  if (unparseable || lowConfidence) return 'inconclusive';
  return score.passed ? 'passed' : 'failed';
}

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

  // Factories are lazy thunks so the gate subset can be applied *before* any
  // scorer is constructed — selecting NARRATION_GATES must not pay to build the
  // gates it dropped.
  const scorerDefs: Array<{
    name: string;
    create: () => Promise<{ score: (i: typeof scorerInput) => Promise<{ scorerId: string; scorerName: string; score: number; normalizedScore: number; passed: boolean; threshold: number; reasoning: string; confidence?: number }> }>;
  }> = [
    { name: 'promptAlignment', create: () => createPromptAlignmentScorer({ ...llmConfig, threshold: thresholds.promptAlignment }) },
    { name: 'answerRelevancy', create: () => createAnswerRelevancyScorer({ ...llmConfig, threshold: thresholds.answerRelevancy }) },
    { name: 'hallucination',   create: () => createHallucinationScorer  ({ ...llmConfig, threshold: thresholds.hallucination }) },
    { name: 'biasDetection',   create: () => createBiasDetectionScorer  ({ ...llmConfig, threshold: thresholds.biasDetection }) },
    { name: 'toxicity',        create: () => createToxicityScorer       ({ ...llmConfig, threshold: thresholds.toxicity }) },
    { name: 'toneConsistency', create: () => createToneConsistencyScorer({ ...llmConfig, threshold: thresholds.toneConsistency }) },
  ];
  if (hasContext) {
    scorerDefs.splice(3, 0, { name: 'faithfulness', create: () => createFaithfulnessScorer({ ...llmConfig, threshold: thresholds.faithfulness }) });
  }

  // Approach C (issue #40): when the caller names a gate subset, run only those.
  // Unselected scorers are never instantiated (no wasted construction / LLM calls).
  const selected = config.gates && config.gates.length
    ? scorerDefs.filter(s => config.gates!.includes(s.name))
    : scorerDefs;

  const resolvedScorers = await Promise.all(selected.map(s => s.create()));
  const names = selected.map(s => s.name);
  const scoreSettled = await Promise.allSettled(resolvedScorers.map(scorer => scorer.score(scorerInput)));
  const minConfidence = config.minConfidence ?? 0.5;
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
        inconclusive: classifyGate(s.value, minConfidence) === 'inconclusive',
      };
    }
    // Execution error → can't judge; treat as inconclusive rather than a hard fail
    // so a transient blip never sinks the whole gate.
    return { name: names[i], ok: false, error: s.reason instanceof Error ? s.reason.message : String(s.reason) };
  });

  const verdictOf = (s: QualityGateReport['scores'][number]): GateVerdict =>
    s.ok ? classifyGate(s, minConfidence) : 'inconclusive';

  const passedGates       = scores.filter(s => verdictOf(s) === 'passed');
  const failedGates       = scores.filter(s => verdictOf(s) === 'failed');
  const inconclusiveGates = scores.filter(s => verdictOf(s) === 'inconclusive');
  // Aggregate over conclusive gates only — inconclusive noise must not skew it.
  const conclusive = [...passedGates, ...failedGates].filter(s => s.ok) as Array<Extract<QualityGateReport['scores'][number], { ok: true }>>;
  const minScore   = conclusive.length ? Math.min(...conclusive.map(s => s.normalizedScore)) : 0;
  const avgScore   = conclusive.length ? conclusive.reduce((sum, s) => sum + s.normalizedScore, 0) / conclusive.length : 0;

  const report: QualityGateReport = {
    // Pass only when something was actually verified and nothing failed.
    passed: failedGates.length === 0 && passedGates.length > 0,
    thresholds,
    overall: {
      minScore,
      avgScore,
      passedGates: passedGates.length,
      failedGates: failedGates.map(g => g.name),
      inconclusiveGates: inconclusiveGates.map(g => g.name),
    },
    scores,
  };

  const outPath = config.outputPath ?? path.join('output', 'quality-gates.json');
  await fs.mkdir(path.dirname(outPath), { recursive: true });
  await fs.writeFile(outPath, JSON.stringify(report, null, 2));
  return report;
}
