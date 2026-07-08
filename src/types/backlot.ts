/**
 * Backlot — live run dashboard. Types only (no `interface`, per the barrel rule).
 *
 * Backlot is a read-only sidecar: it tails the artifacts the pipeline already
 * writes (`.pipeline-state/pipeline-state.json`, `.pipeline-state/cost_log.jsonl`)
 * and never imports or mutates the runner. These types describe the snapshot it
 * derives for the UI.
 */

/** MVP status of a single phase. 'running' (mtime-based) is a later phase. */
export type PhaseStatus = 'pending' | 'done' | 'failed';

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

export type BacklotSnapshot = {
  phases: PhaseView[];
  currentStep: number;
  totalSteps: number;
  complete: boolean;
  startedAt: string | null;
  updatedAt: string | null;
  errors: string[];
  cost: CostView;
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
