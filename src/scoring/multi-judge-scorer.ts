/**
 * Multi-judge consensus scoring.
 *
 * Two flavours:
 *  - `scoreWithMultiJudge` — NeuroLink's text MULTI_JUDGE_3 workflow (3 text
 *    models + 2 judges). Text-only; needs OpenAI/Anthropic providers.
 *  - `runMultiJudgeVideoScoring` — a panel of multimodal models that each SEE the
 *    video and score the full rubric; their verdicts are aggregated to a median
 *    consensus. This is what the pipeline uses, because the video must be judged
 *    visually and we want a robust score rather than one noisy critic.
 */
import { MULTI_JUDGE_3_WORKFLOW } from '@juspay/neurolink';
import type { NeuroLink } from '@juspay/neurolink';
import { runVideoScorerAgent } from '../agents/video-scorer.ts';
import { VIDEO_SCORE_WEIGHTS, type VideoScore } from '../schemas/video-score.ts';
import type { MultiJudgeResult, MultiJudgeConsensus, JudgeVerdict } from '../types/index.ts';

export type { MultiJudgeResult, MultiJudgeConsensus, JudgeVerdict } from '../types/index.ts';

const DIMENSIONS = Object.keys(VIDEO_SCORE_WEIGHTS) as Array<keyof typeof VIDEO_SCORE_WEIGHTS>;
const DEFAULT_JUDGES = ['gemini-2.5-flash', 'gemini-2.5-pro'];

const round2 = (n: number): number => Math.round(n * 100) / 100;

function median(xs: number[]): number {
  if (xs.length === 0) return 0;
  const s = [...xs].sort((a, b) => a - b);
  const mid = Math.floor(s.length / 2);
  return s.length % 2 ? s[mid] : (s[mid - 1] + s[mid]) / 2;
}

/** Case-insensitive dedup that preserves first-seen order. */
function dedup(items: string[]): string[] {
  const seen = new Set<string>();
  const out: string[] = [];
  for (const item of items) {
    const key = item.trim().toLowerCase();
    if (key && !seen.has(key)) { seen.add(key); out.push(item.trim()); }
  }
  return out;
}

/**
 * Aggregate a panel of judges' rubric scores into a consensus. Pure — the median
 * is robust to one outlier judge; variance drives the agreement label. Exported
 * for unit testing without any model calls.
 */
export function aggregateJudgeScores(
  results: Array<{ model: string; score: VideoScore }>,
): MultiJudgeConsensus {
  // An empty panel has no consensus. Returning {0, 'strong'} here would let a
  // total judge failure masquerade as a unanimous zero-score to a quality gate;
  // the only caller (runMultiJudgeVideoScoring) already returns null beforehand.
  if (results.length === 0) throw new Error('aggregateJudgeScores: cannot aggregate an empty judge panel');
  const overalls = results.map((r) => r.score.weighted_overall);
  const variance = overalls.length ? round2(Math.max(...overalls) - Math.min(...overalls)) : 0;
  const dimensions: Record<string, number> = {};
  for (const d of DIMENSIONS) dimensions[d] = round2(median(results.map((r) => Number(r.score[d]) || 0)));

  const judges: JudgeVerdict[] = results.map((r) => ({
    model: r.model,
    weighted_overall: r.score.weighted_overall,
    dimensions: Object.fromEntries(DIMENSIONS.map((d) => [d, Number(r.score[d]) || 0])),
    top_improvements: r.score.top_improvements,
    deal_breakers: r.score.deal_breakers,
  }));

  return {
    consensusOverall: round2(median(overalls)),
    meanOverall: overalls.length ? round2(overalls.reduce((a, b) => a + b, 0) / overalls.length) : 0,
    variance,
    agreement: variance <= 0.5 ? 'strong' : variance <= 1.5 ? 'moderate' : 'weak',
    dimensions,
    judges,
    topImprovements: dedup(results.flatMap((r) => r.score.top_improvements)),
    dealBreakers: dedup(results.flatMap((r) => r.score.deal_breakers)),
  };
}

/**
 * Score a video with a panel of multimodal judges (default flash + pro), then
 * aggregate to a median consensus. Returns null only if every judge failed
 * (caller falls back to single-critic scoring).
 */
export async function runMultiJudgeVideoScoring(
  nl: NeuroLink,
  videoPath: string,
  opts: { models?: string[]; context?: string; tier?: 'dev' | 'official' } = {},
): Promise<MultiJudgeConsensus | null> {
  const requested = opts.models
    ?? process.env.MULTI_JUDGE_MODELS?.split(',').map((m) => m.trim()).filter(Boolean);
  const models = requested && requested.length ? requested : DEFAULT_JUDGES; // never an empty panel
  console.log(`[MultiJudge] Scoring with ${models.length} judges: ${models.join(', ')}`);

  // Judges are independent — run them concurrently.
  const settled = await Promise.all(
    models.map(async (model) => {
      const score = await runVideoScorerAgent(nl, videoPath, opts.tier ?? 'dev', opts.context, model);
      return score ? { model, score } : null;
    }),
  );
  const results = settled.filter((r): r is { model: string; score: VideoScore } => r !== null);
  if (results.length === 0) { console.warn('[MultiJudge] all judges failed'); return null; }

  const consensus = aggregateJudgeScores(results);
  console.log(`[MultiJudge] Consensus ${consensus.consensusOverall}/10 (mean ${consensus.meanOverall}, ${consensus.agreement} agreement, ${results.length}/${models.length} judges)`);
  return consensus;
}

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
