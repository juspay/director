export type PipelineOptions = {
  /** Which phases to run (default: all). */
  phases?: number[];
  /** Path to the script markdown file. */
  scriptPath?: string;
  /** Existing video for scoring. */
  videoPath?: string;
  /** Existing voiceover audio. */
  audioPath?: string;
  /** Output directory override. */
  outputDir?: string;
  /** TTS provider key (elevenlabs / openai-tts / fish-audio / google-ai / azure-tts / cartesia / edgetts). */
  provider?: string;
  /** TTS voice id/name override (provider-specific, e.g. OpenAI "onyx"). */
  voice?: string;
  /** Output resolution: '1080p' (default) or '720p' for cheaper/faster iteration. */
  resolution?: string;
  /** Video generator key (kling / runway / veo / wan-alpha). */
  videoGenerator?: string;
  /** B-roll strategy: 'director' (default — art-director shot plan + consistency critic), 'concept' (assets/broll-prompts.json), or 'generic'. */
  brollMode?: string;
  /** Music generator key (lyria / beatoven / elevenlabs / replicate / numpy). */
  musicGenerator?: string;
  /** Source image for the avatar phase. */
  avatarSource?: string;
  /** Avatar provider key (did / heygen / replicate / musetalk). */
  avatarProvider?: string;
  /** Provider avatar id (required by HeyGen). Falls back to HEYGEN_AVATAR_ID env. */
  avatarId?: string;
  /** Skip actual provider calls — for smoke tests. */
  dryRun?: boolean;
  /** Skip the post-pipeline scoring step. */
  skipScoring?: boolean;
  /** Scoring mode: 'single' (default — one critic) or 'multi-judge' (consensus panel). */
  scoringMode?: string;
  /** Reference video for the deterministic VMAF regression gate. Absent → VBench-only (no baseline to regress against). Falls back to REGRESSION_REFERENCE env. */
  regressionReference?: string;
  /** Voiceover source: 'script' (default — read script file + TTS) or 'narrator' (model writes spoken narration from the script-as-brief + TTS in one call). */
  narrationMode?: string;
};

export type PipelineState = {
  currentStep: number;
  totalSteps: number;
  results: Record<string, unknown>;
  errors: string[];
  startedAt: string;
  updatedAt: string;
};
