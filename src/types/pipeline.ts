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
  /** Video generator key (kling / runway / veo / wan-alpha). */
  videoGenerator?: string;
  /** Music generator key (lyria / beatoven / elevenlabs / replicate / numpy). */
  musicGenerator?: string;
  /** Source image for the avatar phase. */
  avatarSource?: string;
  /** Avatar provider key (did / heygen / replicate / musetalk). */
  avatarProvider?: string;
  /** Skip actual provider calls — for smoke tests. */
  dryRun?: boolean;
  /** Skip the post-pipeline scoring step. */
  skipScoring?: boolean;
};

export type PipelineState = {
  currentStep: number;
  totalSteps: number;
  results: Record<string, unknown>;
  errors: string[];
  startedAt: string;
  updatedAt: string;
};
