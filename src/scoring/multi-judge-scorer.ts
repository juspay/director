/**
 * Multi-judge consensus scoring via `NeuroLink.generate({workflowConfig: MULTI_JUDGE_3_WORKFLOW})`.
 *
 * The MULTI_JUDGE_3 workflow runs the prompt against 3 models in parallel,
 * has 2 judges score each response, and returns a consensus selection in
 * `result.workflow`. Higher cost than a single call; use for production-grade
 * evaluation, fall back to a single generate() for fast feedback.
 */
import { MULTI_JUDGE_3_WORKFLOW } from '@juspay/neurolink';
import type { NeuroLink } from '@juspay/neurolink';
import type { MultiJudgeResult } from '../types/index.ts';

export type { MultiJudgeResult } from '../types/index.ts';

export async function scoreWithMultiJudge(
  nl: NeuroLink,
  prompt: string,
  systemPrompt?: string,
): Promise<MultiJudgeResult> {
  const result = await nl.generate({
    input: { text: prompt },
    systemPrompt,
    workflowConfig: MULTI_JUDGE_3_WORKFLOW,
  });
  if (!result.workflow) throw new Error('MULTI_JUDGE_3 workflow returned no workflow block');
  return {
    selectedModel: result.workflow.selectedModel,
    consensusResponse: result.workflow.processedResponse,
    judgeScores: result.workflow.judgeScores?.scores,
    judgeReasoning: result.workflow.judgeScores?.reasoning,
    ensembleResponses: result.workflow.ensembleResponses,
  };
}
