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
  /** Per-scorer thresholds (0..1). Defaults inline in runQualityGates. */
  thresholds?: Partial<{
    promptAlignment: number;
    answerRelevancy: number;
    hallucination: number;
    faithfulness: number;
    biasDetection: number;
    toxicity: number;
    toneConsistency: number;
  }>;
  /** AI provider used to drive the LLM scorers. Defaults to AGENT_PROVIDER or 'vertex'. */
  provider?: string;
  /** Model used by the LLM scorers. Defaults to MODEL or 'gemini-2.5-flash'. */
  model?: string;
  /** Where to write the JSON report. */
  outputPath?: string;
  /** Run only these named gates (e.g. NARRATION_GATES). Omit to run all. */
  gates?: string[];
  /** Judgments below this confidence (or unparseable) are inconclusive, not failures. Default 0.5. */
  minConfidence?: number;
};

export type QualityGateScore =
  | { name: string; ok: false; error: string }
  | {
      name: string;
      ok: true;
      scorerId: string;
      scorerName: string;
      score: number;
      normalizedScore: number;
      passed: boolean;
      threshold: number;
      reasoning: string;
      confidence?: number;
      /** Judgment was unparseable or below the confidence floor — excluded from pass/fail. */
      inconclusive?: boolean;
    };

export type QualityGateReport = {
  passed: boolean;
  thresholds: Record<string, number>;
  overall: {
    minScore: number;
    avgScore: number;
    passedGates: number;
    failedGates: string[];
    inconclusiveGates: string[];
  };
  scores: QualityGateScore[];
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
