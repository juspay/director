/**
 * Pre-flight spend projection (roadmap P0-2) — price the b-roll generation a
 * run is about to commit to, from the same rate table the CostTracker bills
 * against, *before* the first paid call. The shot plan fixes every cost driver
 * (shot count, clip length, image attempts) ahead of generation, so the
 * projection is deterministic arithmetic, not a guess.
 *
 * Pure module: no I/O, no logging. The optional budget check throws a
 * distinctive error so the runner can fail the phase outright instead of
 * falling through to another paid generation path.
 */
import { CostTracker } from './cost-tracker.ts';

export type PreflightInputs = {
  /** Planned animated shots (each becomes one image-to-video call). */
  shots: number;
  /** Seconds per animated clip — video providers bill per output second. */
  segLen: number;
  /** Rate-table key for the video generator ('vertex', 'kling', …). */
  videoProvider: string;
  /** Rate-table key for the keyframe image generator. */
  imageProvider: string;
  /** Whether a hero still must be generated (false when cached from a resume). */
  heroNeeded: boolean;
  /** Shots that show the product — each can trigger critic regenerations. */
  productShots: number;
  /** BROLL_MAX_REGEN — worst-case extra keyframe attempts per product shot. */
  maxRegen: number;
  /** KEYFRAME_CANDIDATES — images generated per attempt on product shots (default 1). */
  candidates?: number;
};

export type PreflightEstimate = {
  videoUsd: number;
  imagesBest: number;
  imagesWorst: number;
  imagesBestUsd: number;
  imagesWorstUsd: number;
  bestUsd: number;
  worstUsd: number;
};

export class BudgetExceededError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'BudgetExceededError';
  }
}

const round2 = (n: number): number => Math.round(n * 100) / 100;

/**
 * Project the spend the coming generation will commit. Uses estimateOnly so the
 * per-provider env overrides (VERTEX_VIDEO_PER_SEC, VERTEX_IMAGE_PER_IMAGE)
 * apply identically to projection and billing. Unknown providers price at $0 —
 * the projection must never block a run the tracker itself would bill as free.
 */
export function estimatePreflight(inp: PreflightInputs): PreflightEstimate {
  const rates = new CostTracker();
  const videoUsd = rates.estimateOnly(inp.videoProvider, { seconds: inp.shots * inp.segLen });
  // Candidate pools multiply the images generated per attempt on product
  // shots; with candidates = 1 both formulas reduce to the classic ones.
  const cand = Math.max(1, inp.candidates ?? 1);
  const imagesBest = (inp.heroNeeded ? 1 : 0) + inp.shots + inp.productShots * (cand - 1);
  const imagesWorst = imagesBest + inp.productShots * cand * inp.maxRegen;
  const imagesBestUsd = rates.estimateOnly(inp.imageProvider, { images: imagesBest });
  const imagesWorstUsd = rates.estimateOnly(inp.imageProvider, { images: imagesWorst });
  return {
    videoUsd: round2(videoUsd),
    imagesBest,
    imagesWorst,
    imagesBestUsd: round2(imagesBestUsd),
    imagesWorstUsd: round2(imagesWorstUsd),
    bestUsd: round2(videoUsd + imagesBestUsd),
    worstUsd: round2(videoUsd + imagesWorstUsd),
  };
}

/** One console line: what the phase is about to spend, plus what the run already has. */
export function formatPreflight(e: PreflightEstimate, inp: PreflightInputs, spentUsd: number): string {
  const images = e.imagesBest === e.imagesWorst
    ? `${e.imagesBest} images $${e.imagesBestUsd.toFixed(2)}`
    : `${e.imagesBest}–${e.imagesWorst} images $${e.imagesBestUsd.toFixed(2)}–$${e.imagesWorstUsd.toFixed(2)}`;
  const total = e.bestUsd === e.worstUsd
    ? `$${e.bestUsd.toFixed(2)}`
    : `$${e.bestUsd.toFixed(2)}–$${e.worstUsd.toFixed(2)}`;
  return `[Pre-flight] projected spend: video $${e.videoUsd.toFixed(2)} (${inp.shots}×${inp.segLen}s @ ${inp.videoProvider})`
    + ` + ${images} (${inp.imageProvider}) → ${total} this phase; $${spentUsd.toFixed(2)} already logged this run`;
}

/**
 * Enforce a whole-run budget cap: already-logged spend plus the worst-case
 * projection must fit. No budget (undefined/null/NaN/≤0) means no cap.
 */
export function assertWithinBudget(
  spentUsd: number,
  e: PreflightEstimate,
  budgetUsd: number | null | undefined,
): void {
  if (budgetUsd == null || !Number.isFinite(budgetUsd) || budgetUsd <= 0) return;
  const projected = round2(spentUsd + e.worstUsd);
  if (projected > budgetUsd) {
    throw new BudgetExceededError(
      `[Pre-flight] projected worst-case run spend $${projected.toFixed(2)} `
      + `($${spentUsd.toFixed(2)} logged + $${e.worstUsd.toFixed(2)} this phase) exceeds --budget $${budgetUsd.toFixed(2)} — `
      + `aborting before any paid generation. Lower the shot count (BROLL_MAX_SHOTS), pick a cheaper provider, or raise the budget.`,
    );
  }
}
