export type VideoScoreResult = {
  videoFile: string;
  iteration: number;
  tier: 'dev' | 'official';
  overallScore: number;
  dimensions: Record<string, number>;
  justifications: Record<string, string>;
  timestamp: string;
  model: string;
};

export type ScriptScoreResult = {
  scriptVersion: string;
  overallScore: number;
  criteria: Record<string, number>;
  locked: boolean;
  timestamp: string;
};

export type AcousticScoreResult = {
  variationId: string;
  compositeScore: number;
  scores: Record<string, number>;
  details: Record<string, unknown>;
  timestamp: string;
};

export type SceneAnalysisResult = {
  sceneId: string;
  artifacts: string[];
  qualityIssues: string[];
  compositionNotes: string;
  temporalScore: number;
  motionScore: number;
};

export type VideoComparisonResult = {
  videoA: string;
  videoB: string;
  winner: 'A' | 'B' | 'equivalent';
  perDimensionDeltas: Record<string, number>;
  recommendation: string;
};

export type CreativePromptResult = {
  sceneId: string;
  ttsPrompt: string;
  ttsDeliveryInstructions: string;
  brollPrompt: string;
  musicMood: string;
  sfxSuggestions: string[];
};

export type QualityGateInput = {
  /** Original script / prompt that drove the pipeline */
  script: string;
  /** Generated narration / transcript / on-screen content */
  response: string;
  /** Optional retrieved context (for RAG runs) */
  context?: string[];
};

export type QualityGateConfig = {
  /** Minimum overall score required to pass (0..1). Defaults to 0.7. */
  threshold?: number;
  /** Domain hint (e.g. 'video-script', 'product-narrative'). */
  evaluationDomain?: string;
  /** Where to write the JSON report. */
  outputPath?: string;
};

export type QualityGateReport = {
  passed: boolean;
  threshold: number;
  evaluation: {
    relevance: number;
    accuracy: number;
    completeness: number;
    overall: number;
    isOffTopic: boolean;
    alertSeverity: 'low' | 'medium' | 'high' | 'none';
    reasoning: string;
    suggestedImprovements?: string;
  };
};

export type MultiJudgeResult = {
  selectedModel: string;
  consensusResponse: string;
  judgeScores?: Record<string, number>;
  judgeReasoning?: string;
  ensembleResponses: Array<{
    provider: string;
    model: string;
    content: string;
    responseTime: number;
    status: 'success' | 'failure' | 'timeout' | 'partial';
    error?: string;
  }>;
};
