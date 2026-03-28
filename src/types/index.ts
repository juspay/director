/**
 * Core type definitions for the Director AI pipeline.
 */

// Video scoring result
export interface VideoScoreResult {
  videoFile: string;
  iteration: number;
  tier: 'dev' | 'official';
  overallScore: number;
  dimensions: Record<string, number>;
  justifications: Record<string, string>;
  timestamp: string;
  model: string;
}

// Script scoring result
export interface ScriptScoreResult {
  scriptVersion: string;
  overallScore: number;
  criteria: Record<string, number>;
  locked: boolean;
  timestamp: string;
}

// Acoustic scoring result
export interface AcousticScoreResult {
  variationId: string;
  compositeScore: number;
  scores: Record<string, number>;
  details: Record<string, unknown>;
  timestamp: string;
}

// Scene analysis result
export interface SceneAnalysisResult {
  sceneId: string;
  artifacts: string[];
  qualityIssues: string[];
  compositionNotes: string;
  temporalScore: number;
  motionScore: number;
}

// Video comparison result
export interface VideoComparisonResult {
  videoA: string;
  videoB: string;
  winner: 'A' | 'B' | 'equivalent';
  perDimensionDeltas: Record<string, number>;
  recommendation: string;
}

// Creative prompt result
export interface CreativePromptResult {
  sceneId: string;
  ttsPrompt: string;
  ttsDeliveryInstructions: string;
  brollPrompt: string;
  musicMood: string;
  sfxSuggestions: string[];
}

// Pipeline state
export interface PipelineState {
  currentStep: number;
  totalSteps: number;
  results: Record<string, unknown>;
  errors: string[];
  startedAt: string;
  updatedAt: string;
}

// Policy types
export interface Policy {
  name: string;
  description: string;
  rules: PolicyRule[];
  severity: 'error' | 'warning' | 'info';
}

export interface PolicyRule {
  field: string;
  condition: 'min' | 'max' | 'equals' | 'contains' | 'regex';
  value: number | string;
  message: string;
}

export interface PolicyViolation {
  policy: string;
  rule: string;
  actual: unknown;
  expected: unknown;
  severity: 'error' | 'warning' | 'info';
  timestamp: string;
}

// Observability types
export interface AgentMetrics {
  agentName: string;
  executionTimeMs: number;
  tokensUsed: number;
  costEstimate: number;
  success: boolean;
  retries: number;
  timestamp: string;
}

export interface ObservabilityReport {
  timestamp: string;
  totalAgents: number;
  completedAgents: number;
  failedAgents: number;
  totalCost: number;
  totalTokens: number;
  policyViolations: PolicyViolation[];
  agentMetrics: AgentMetrics[];
}
