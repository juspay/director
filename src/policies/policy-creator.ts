/**
 * PolicyCreator — defines quality policies per agent output.
 * Cycle 1 of the 3-cycle policy system: Create → Enforce → Validate.
 */
import type { Policy, PolicyRule } from '../types/index.ts';

/**
 * Video scoring policy — minimum quality thresholds.
 */
export const VIDEO_SCORE_POLICY: Policy = {
  name: 'video_score_quality',
  description: 'Minimum video scoring thresholds for production release',
  severity: 'error',
  rules: [
    { field: 'weighted_overall', condition: 'min', value: 7.0, message: 'Overall score below 7.0' },
    { field: 'content_authenticity', condition: 'min', value: 6.0, message: 'Content authenticity below 6.0' },
    { field: 'visual_polish', condition: 'min', value: 6.0, message: 'Visual polish below 6.0' },
    { field: 'motion_design', condition: 'min', value: 5.0, message: 'Motion design below 5.0' },
    { field: 'storytelling_arc', condition: 'min', value: 6.0, message: 'Storytelling arc below 6.0' },
    { field: 'deal_breakers', condition: 'max', value: 0, message: 'Deal-breaker issues present' },
  ],
};

/**
 * Script scoring policy — lock readiness.
 */
export const SCRIPT_SCORE_POLICY: Policy = {
  name: 'script_lock_ready',
  description: 'Script must meet lock criteria before production',
  severity: 'error',
  rules: [
    { field: 'average_score', condition: 'min', value: 9.0, message: 'Average below 9.0 (lock threshold)' },
    { field: 'lock_ready', condition: 'equals', value: 1, message: 'Script not lock-ready' },
  ],
};

/**
 * Acoustic quality policy.
 */
export const ACOUSTIC_POLICY: Policy = {
  name: 'acoustic_quality',
  description: 'Voiceover quality thresholds',
  severity: 'warning',
  rules: [
    { field: 'composite_score', condition: 'min', value: 7.0, message: 'Composite score below 7.0' },
    { field: 'perceived_quality', condition: 'min', value: 6.0, message: 'Perceived quality below 6.0' },
    { field: 'pacing', condition: 'min', value: 6.0, message: 'Pacing score below 6.0' },
  ],
};

/**
 * Scene analysis policy.
 */
export const SCENE_POLICY: Policy = {
  name: 'scene_quality',
  description: 'Per-scene quality gate',
  severity: 'error',
  rules: [
    { field: 'pass', condition: 'equals', value: 1, message: 'Scene did not pass quality check' },
    { field: 'temporal_quality', condition: 'min', value: 7.0, message: 'Temporal quality below 7.0' },
    { field: 'motion_smoothness', condition: 'min', value: 7.0, message: 'Motion smoothness below 7.0' },
  ],
};

/**
 * Agent execution policy — performance and cost.
 */
export const AGENT_EXECUTION_POLICY: Policy = {
  name: 'agent_execution',
  description: 'Agent performance and cost bounds',
  severity: 'warning',
  rules: [
    { field: 'executionTimeMs', condition: 'max', value: 300000, message: 'Agent took >5 minutes' },
    { field: 'retries', condition: 'max', value: 3, message: 'Agent needed >3 retries' },
    { field: 'costEstimate', condition: 'max', value: 1.0, message: 'Agent cost >$1.00' },
  ],
};

/**
 * All policies for export.
 */
export const ALL_POLICIES: Policy[] = [
  VIDEO_SCORE_POLICY,
  SCRIPT_SCORE_POLICY,
  ACOUSTIC_POLICY,
  SCENE_POLICY,
  AGENT_EXECUTION_POLICY,
];

export function getPolicyByName(name: string): Policy | undefined {
  return ALL_POLICIES.find((p) => p.name === name);
}
