/**
 * Post-pipeline quality gates via `NeuroLink.generate({enableEvaluation: true})`.
 *
 * Returns the 4-dimension EvaluationData (relevance, accuracy, completeness,
 * overall) plus alert severity and reasoning, persisted to JSON for CI gates.
 * Domain-specific scoring is configured via the `evaluationDomain` field.
 */
import fs from 'fs/promises';
import path from 'path';
import type { NeuroLink } from '@juspay/neurolink';
import type { QualityGateInput, QualityGateConfig, QualityGateReport } from '../types/index.ts';

export type { QualityGateInput, QualityGateConfig, QualityGateReport } from '../types/index.ts';

export async function runQualityGates(
  nl: NeuroLink,
  input: QualityGateInput,
  config: QualityGateConfig = {},
): Promise<QualityGateReport> {
  const threshold = config.threshold ?? 0.7;
  const result = await nl.generate({
    input: {
      text: `Script:\n${input.script}\n\nResponse:\n${input.response}${
        input.context?.length ? `\n\nContext:\n${input.context.join('\n---\n')}` : ''
      }`,
    },
    enableEvaluation: true,
    evaluationDomain: config.evaluationDomain ?? 'video-script-quality',
  });

  const ev = result.evaluation;
  if (!ev) throw new Error('NeuroLink returned no evaluation block');

  const report: QualityGateReport = {
    passed: ev.overall >= threshold,
    threshold,
    evaluation: {
      relevance: ev.relevance,
      accuracy: ev.accuracy,
      completeness: ev.completeness,
      overall: ev.overall,
      isOffTopic: ev.isOffTopic,
      alertSeverity: ev.alertSeverity,
      reasoning: ev.reasoning,
      suggestedImprovements: ev.suggestedImprovements,
    },
  };

  const outPath = config.outputPath ?? path.join('output', 'quality-gates.json');
  await fs.mkdir(path.dirname(outPath), { recursive: true });
  await fs.writeFile(outPath, JSON.stringify(report, null, 2));
  return report;
}
