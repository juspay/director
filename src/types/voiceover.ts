export type VoiceoverProvider =
  | 'elevenlabs'
  | 'openai-tts'
  | 'fish-audio'
  | 'google-ai'
  | 'azure-tts'
  | 'cartesia'
  | 'edgetts';

export type VoiceoverOptions = {
  voice?: string;
  speed?: number;
  pitch?: number;
  format?: 'mp3' | 'wav' | 'ogg' | 'opus';
};

/** A single narration segment with optional SSML-style overrides. */
export type Segment = {
  text: string;
  /** e.g. "+5%" or "-10%" */
  rate?: string;
  /** e.g. "+2st" */
  pitch?: string;
};
