import { FPS } from './theme';

export type SceneCategory = 'abstract' | 'screenshot' | 'special' | 'closing';
export type TransitionType = 'thread' | 'fadeBlack' | 'morph';

export interface SceneEntry {
  id: string;
  category: SceneCategory;
  startFrame: number;
  durationFrames: number;
  asset: string;
  transition: TransitionType;
  textOverlay?: string;
}

export const SCENES: SceneEntry[] = [
  // 1. 01_opening — Abstract — 8.78s from 0.00s
  { id: '01_opening', category: 'abstract', startFrame: 0, durationFrames: 263, asset: '01_opening_v2.mp4', transition: 'thread' },
  // 2. 03_gap — Abstract — 6.52s from 8.78s
  { id: '03_gap', category: 'abstract', startFrame: 263, durationFrames: 196, asset: '03_gap_v2.mp4', transition: 'thread' },
  // 3. 04_history — Screenshot — 12.24s from 15.30s
  { id: '04_history', category: 'screenshot', startFrame: 459, durationFrames: 367, asset: 'race-condition-confirmed.png', transition: 'thread' },
  // 4. 05_weight — Abstract — 6.92s from 27.54s
  { id: '05_weight', category: 'abstract', startFrame: 826, durationFrames: 208, asset: '05_weight_v2.mp4', transition: 'thread' },
  // 5. bridge_weight_thesis — Abstract — 2.00s from 34.46s
  { id: 'bridge_weight_thesis', category: 'abstract', startFrame: 1034, durationFrames: 60, asset: 'bridge_weight_to_thesis_v2.mp4', transition: 'fadeBlack' },
  // 6. 06a_thesis_rise — Abstract — 8.68s from 36.46s
  { id: '06a_thesis_rise', category: 'abstract', startFrame: 1094, durationFrames: 260, asset: '06_thesis_v2.mp4', transition: 'thread' },
  // 7. 06b_thesis_friction — Abstract — 10.56s from 45.14s
  { id: '06b_thesis_friction', category: 'abstract', startFrame: 1354, durationFrames: 317, asset: '06b_friction_v2.mp4', transition: 'thread' },
  // 8. 06c_thesis_closer — Special — 1.70s from 55.70s
  { id: '06c_thesis_closer', category: 'special', startFrame: 1671, durationFrames: 51, asset: '06c_tara_reveal_v2.mp4', transition: 'morph' },
  // 9. transition_to_slack — Abstract — 1.00s from 57.40s
  { id: 'transition_to_slack', category: 'abstract', startFrame: 1722, durationFrames: 30, asset: 'bridge_thesis_to_slack_v2.mp4', transition: 'thread' },
  // 10. 07_slack_thread — Screenshot — 8.03s from 58.40s
  { id: '07_slack_thread', category: 'screenshot', startFrame: 1752, durationFrames: 241, asset: 'tara-slack-search.png', transition: 'thread' },
  // 11. 08_investigation — Screenshot — 12.42s from 66.43s
  { id: '08_investigation', category: 'screenshot', startFrame: 1993, durationFrames: 373, asset: 'bug-fix-tara-response.png', transition: 'thread' },
  // 12. 10_team_collab — Screenshot — 10.87s from 78.85s
  { id: '10_team_collab', category: 'screenshot', startFrame: 2366, durationFrames: 326, asset: 'async-loop-yaswanth-review.png', transition: 'thread' },
  // 13. 11a_plan_forms — Screenshot — 7.00s from 89.72s
  { id: '11a_plan_forms', category: 'screenshot', startFrame: 2692, durationFrames: 210, asset: 'tara-jira-pdf-report.png', transition: 'thread' },
  // 14. 11b_plan_moves — Abstract — 6.79s from 96.72s
  { id: '11b_plan_moves', category: 'abstract', startFrame: 2902, durationFrames: 204, asset: '11_plan_forms_v3.mp4', transition: 'thread' },
  // 15. 12a_execution — Screenshot — 9.24s from 103.51s
  { id: '12a_execution', category: 'screenshot', startFrame: 3105, durationFrames: 277, asset: 'coding-agent-implementing.png', transition: 'thread' },
  // 16. 12b_prs — Screenshot — 6.16s from 112.75s
  { id: '12b_prs', category: 'screenshot', startFrame: 3383, durationFrames: 185, asset: 'coding-agent-progress.png', transition: 'thread' },
  // 17. 13_ecosystem — Screenshot — 4.30s from 118.91s
  { id: '13_ecosystem', category: 'screenshot', startFrame: 3567, durationFrames: 129, asset: 'vinay-backend-configs.png', transition: 'thread' },
  // 18. 14_integrations — Abstract — 5.36s from 123.21s
  { id: '14_integrations', category: 'abstract', startFrame: 3696, durationFrames: 161, asset: '14_tara_connects_v2.mp4', transition: 'thread', textOverlay: 'Slack · Bitbucket · JIRA · GitHub' },
  // 19. bridge_demo_impact — Abstract — 1.50s from 128.57s
  { id: 'bridge_demo_impact', category: 'abstract', startFrame: 3857, durationFrames: 45, asset: 'bridge_demo_to_impact_v2.mp4', transition: 'fadeBlack' },
  // 20. 15_metrics — Special — 5.65s from 130.07s
  { id: '15_metrics', category: 'special', startFrame: 3902, durationFrames: 170, asset: '15_metrics_v2.mp4', transition: 'morph' },
  // 21. 17_future — Abstract — 1.81s from 135.72s
  { id: '17_future', category: 'abstract', startFrame: 4072, durationFrames: 54, asset: '17_future_v2.mp4', transition: 'thread' },
  // 22. 18_builders — Special — 1.95s from 137.53s
  { id: '18_builders', category: 'special', startFrame: 4126, durationFrames: 59, asset: '18_builders_v2.mp4', transition: 'morph' },
  // 23. 19_constellation — Abstract — 3.81s from 139.48s
  { id: '19_constellation', category: 'abstract', startFrame: 4184, durationFrames: 114, asset: '19_constellation_v2.mp4', transition: 'thread', textOverlay: 'Right where the conversation started.' },
  // 24. 21_tagline — Closing — 2.87s from 143.29s
  { id: '21_tagline', category: 'closing', startFrame: 4299, durationFrames: 86, asset: '', transition: 'thread' },
];

// Verify: last scene ends at frame 4299 + 86 = 4385 = DURATION_FRAMES ✓
