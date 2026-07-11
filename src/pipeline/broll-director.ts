/**
 * Pure helpers for director-mode b-roll — prompt composition and regenerate
 * decisions. No I/O, no env, no NeuroLink: kept separate from runner.ts so the
 * product-identity logic can be unit-tested in isolation.
 */
import type { Shot, ShotPlan } from '../schemas/shot-plan.ts';
import type { ConsistencyVerdict } from '../schemas/consistency-verdict.ts';

/**
 * Compose the keyframe image prompt. For product shots the canonical
 * product_bible is injected verbatim with a hard "match exactly" instruction —
 * this is what keeps the product identical shot-to-shot instead of drifting.
 */
export function buildShotPrompt(shot: Shot, productBible: string): string {
  const scene = shot.prompt.trim();
  if (!shot.shows_product) return scene;
  const bible = productBible.trim();
  return `${scene}\n\nThe product in frame must be EXACTLY this object, identical in every detail: ${bible}. Reproduce its material, colour, finish and distinguishing features precisely; do not restyle or recolour it.`;
}

/**
 * Animation (image-to-video) prompt: the scene plus its deliberate camera move.
 */
export function buildAnimationPrompt(shot: Shot): string {
  const scene = shot.prompt.trim();
  const camera = shot.camera.trim();
  return camera ? `${scene} Camera: ${camera}.` : scene;
}

/**
 * Should we regenerate this keyframe? Gate on the numeric score so a product
 * that drifted (or isn't visible → low score) is retried. A null verdict means
 * the critic itself failed — don't loop on that; proceed with what we have.
 */
export function shouldRegenerate(verdict: ConsistencyVerdict | null, threshold: number): boolean {
  if (!verdict) return false;
  return verdict.score < threshold;
}

/**
 * Fold the critic's correction into the prompt for the retry pass.
 */
export function applyFixToPrompt(basePrompt: string, fixInstruction: string): string {
  const fix = fixInstruction.trim();
  return fix ? `${basePrompt}\n\nCorrection (previous attempt was off-brand): ${fix}` : basePrompt;
}

/**
 * Defensive normalisation of an agent-produced plan: drop empty-prompt shots and
 * clamp to `maxShots` so a runaway plan can't fan out unbounded paid generations.
 */
export function normalizeShotPlan(plan: ShotPlan, maxShots: number): ShotPlan {
  const shots = plan.shots
    .filter((s) => typeof s.prompt === 'string' && s.prompt.trim().length > 0)
    .slice(0, Math.max(1, maxShots));
  return { ...plan, shots };
}

export type ScoredCandidate = { index: number; verdict: ConsistencyVerdict | null };

/**
 * Pick the best keyframe candidate by critic score. Unscored candidates
 * (critic call failed) rank below any scored one; ties keep the earliest
 * index so the choice is deterministic. Null only for an empty pool.
 */
export function pickBestCandidate<T extends ScoredCandidate>(scored: readonly T[]): T | null {
  if (!scored.length) return null;
  return scored.reduce((best, cur) => {
    const b = best.verdict?.score ?? -1;
    const c = cur.verdict?.score ?? -1;
    return c > b ? cur : best;
  });
}

/**
 * KEYFRAME_CANDIDATES resolution: clamped to [1, 4] — 1 is today's behavior,
 * 4 caps the per-shot image spend multiplier. Non-numeric input means 1.
 */
export function resolveCandidateCount(raw: string | undefined): number {
  const n = Number(raw ?? 1);
  return Number.isFinite(n) ? Math.min(4, Math.max(1, Math.trunc(n))) : 1;
}
