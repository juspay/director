export type VideoProvider = 'vertex' | 'kling' | 'runway' | 'replicate';

export type VideoOptions = {
  /**
   * Duration in seconds. Veo supports 4/6/8; enum-duration Replicate models
   * (kling 5|10, hailuo 6|10) get their length clamped by the b-roll phase
   * before the request is built.
   */
  length?: number;
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
  /**
   * Replicate only: the input-schema key the model expects the image under
   * (e.g. 'first_frame_image' for minimax/hailuo-2.3-fast, 'start_image' for
   * kwaivgi/kling-v2.1). Forwarded to NeuroLink's Replicate handler; a no-op
   * until juspay/neurolink#1150 ships, required for those models after.
   */
  imageInputKey?: string;
  /** Region override. */
  region?: string;
};
