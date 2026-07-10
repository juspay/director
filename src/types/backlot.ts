/**
 * Backlot — live run dashboard. Types only (no `interface`, per the barrel rule).
 *
 * Backlot is a read-only sidecar: it tails the artifacts the pipeline already
 * writes (`.pipeline-state/pipeline-state.json`, `.pipeline-state/cost_log.jsonl`)
 * and never imports or mutates the runner. These types describe the snapshot it
 * derives for the UI.
 */

/** Status of a single phase. 'running' is derived, mtime-based (Phase B): the
 * first pending phase while the run shows recent on-disk activity. */
export type PhaseStatus = 'pending' | 'running' | 'done' | 'failed';

/**
 * Run-level liveness, derived purely from on-disk activity — the pipeline
 * never reports "I'm alive", so recency of its state-file writes is the signal:
 * 'running' = incomplete with recent writes, 'stalled' = incomplete and quiet
 * past the threshold, 'idle' = no state on disk, 'complete' = all phases done.
 */
export type Liveness = 'idle' | 'running' | 'stalled' | 'complete';

/** On-disk activity evidence, injected so liveness derivation stays pure. */
export type ActivityInfo = {
  /** Newest mtime across the state files, or null when none exist. */
  mtimeMs: number | null;
  nowMs: number;
  /** Quiet-period threshold before 'running' degrades to 'stalled' (default 300). */
  stallSeconds?: number;
};

export type PhaseView = {
  name: string;
  label: string;
  status: PhaseStatus;
  /** Failure message (from `state.errors`) when status is 'failed'. */
  error?: string;
};

export type CostView = {
  /** Real API spend summed from cost_log.jsonl (rounded to 4dp), matching CostTracker. */
  total: number;
  byProvider: Record<string, number>;
  /** Number of cost events logged so far. */
  events: number;
};

/** Latest consistency-critic call for a shot, from shot-verdicts.jsonl. */
export type ShotCriticView = {
  /** 0-10 product-identity score from the latest attempt (null = critic errored). */
  score: number | null;
  /** Whether that latest verdict demanded a regeneration. */
  regenerate: boolean;
  /** Total critic attempts logged for this shot. */
  attempts: number;
};

/** One director-mode shot in the b-roll grid, derived from the shot plan + on-disk artifacts. */
export type ShotView = {
  index: number;
  sceneId: string;
  /** The narrative beat this shot covers (from the art director's plan). */
  beat: string;
  showsProduct: boolean;
  camera: string;
  /** A keyframe image exists on disk (thumbnail servable). */
  keyframe: boolean;
  /** The animated segment exists on disk. */
  animated: boolean;
  critic: ShotCriticView | null;
};

export type BacklotSnapshot = {
  phases: PhaseView[];
  currentStep: number;
  totalSteps: number;
  complete: boolean;
  liveness: Liveness;
  /** ISO time of the newest state-file write, or null when nothing exists. */
  lastActivityAt: string | null;
  startedAt: string | null;
  updatedAt: string | null;
  errors: string[];
  cost: CostView;
  /** Director-mode b-roll grid — present only once a shot plan exists. */
  shots?: ShotView[];
};

/**
 * The structural subset of `PipelineState` that Backlot reads. Kept permissive
 * (all optional) so a partially-written or older state file degrades gracefully
 * instead of throwing.
 */
export type PipelineStateLike = {
  results?: Record<string, unknown>;
  errors?: string[];
  currentStep?: number;
  totalSteps?: number;
  startedAt?: string;
  updatedAt?: string;
};
