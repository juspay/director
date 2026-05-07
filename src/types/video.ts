export type VideoProvider = 'vertex' | 'kling' | 'runway' | 'replicate';

export type VideoOptions = {
  /** Duration in seconds — Veo supports 4/6/8. */
  length?: 4 | 6 | 8;
  /** Aspect ratio. */
  aspectRatio?: '16:9' | '9:16' | '1:1';
  /** Output resolution. */
  resolution?: '720p' | '1080p';
  /** Generate audio track (where supported). */
  audio?: boolean;
  /** Optional input image (Buffer or path) for image-to-video providers. */
  inputImage?: Buffer | string;
  /** Provider-specific model id (e.g. Replicate model slug). */
  model?: string;
  /** Region override. */
  region?: string;
};
