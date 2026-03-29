/**
 * Encoding presets — 14 presets ported from Python pipeline_config.py.
 * Single source of truth for all FFmpeg encoding parameters.
 */

export interface EncodingPreset {
  name: string;
  videoCodec: string;
  videoCrf?: number;
  videoPreset?: string;
  videoBitrate?: string;
  pixelFormat: string;
  audioCodec: string;
  audioBitrate: string;
  width: number;
  height: number;
  maxBitrate?: string;
  bufsize?: string;
  extraArgs?: string[];
  videoArgs(): string[];
  audioArgs(): string[];
}

function createPreset(config: Omit<EncodingPreset, 'videoArgs' | 'audioArgs'>): EncodingPreset {
  return {
    ...config,
    videoArgs() {
      const args = ['-c:v', this.videoCodec];

      if (this.videoCodec === 'libsvtav1') {
        args.push('-crf', String(this.videoCrf ?? 30), '-preset', this.videoPreset ?? '6');
        args.push('-pix_fmt', this.pixelFormat);
      } else if (this.videoCodec === 'h264_videotoolbox') {
        args.push('-b:v', this.videoBitrate ?? '5M', '-pix_fmt', this.pixelFormat);
      } else if (this.videoCodec === 'libx264') {
        args.push('-crf', String(this.videoCrf ?? 18), '-preset', this.videoPreset ?? 'slow');
        args.push('-profile:v', 'high', '-level', '4.1', '-pix_fmt', this.pixelFormat);
        args.push('-tune', 'animation');
      } else {
        args.push('-crf', String(this.videoCrf ?? 23), '-preset', this.videoPreset ?? 'medium');
        args.push('-pix_fmt', this.pixelFormat);
      }

      if (this.extraArgs) args.push(...this.extraArgs);
      if (this.maxBitrate) args.push('-maxrate', this.maxBitrate, '-bufsize', this.bufsize ?? this.maxBitrate);
      if (this.width !== 1920 || this.height !== 1080) args.push('-vf', `scale=${this.width}:${this.height}`);
      return args;
    },
    audioArgs() {
      return ['-c:a', this.audioCodec, '-b:a', this.audioBitrate, '-ar', '44100', '-ac', '2'];
    },
  };
}

export const PRESETS: Record<string, EncodingPreset> = {
  final: createPreset({ name: 'final', videoCodec: 'libx264', videoCrf: 18, videoPreset: 'slow', pixelFormat: 'yuv420p', audioCodec: 'aac', audioBitrate: '320k', width: 1920, height: 1080 }),
  preview: createPreset({ name: 'preview', videoCodec: 'libx264', videoCrf: 23, videoPreset: 'medium', pixelFormat: 'yuv420p', audioCodec: 'aac', audioBitrate: '192k', width: 1920, height: 1080 }),
  draft: createPreset({ name: 'draft', videoCodec: 'libx264', videoCrf: 28, videoPreset: 'ultrafast', pixelFormat: 'yuv420p', audioCodec: 'aac', audioBitrate: '128k', width: 1920, height: 1080 }),
  web: createPreset({ name: 'web', videoCodec: 'libx264', videoCrf: 28, videoPreset: 'medium', pixelFormat: 'yuv420p', audioCodec: 'aac', audioBitrate: '128k', width: 1280, height: 720, maxBitrate: '2M', bufsize: '4M' }),
  social: createPreset({ name: 'social', videoCodec: 'libx264', videoCrf: 23, videoPreset: 'medium', pixelFormat: 'yuv420p', audioCodec: 'aac', audioBitrate: '192k', width: 1080, height: 1080 }),
  av1_final: createPreset({ name: 'av1_final', videoCodec: 'libsvtav1', videoCrf: 30, videoPreset: '6', pixelFormat: 'yuv420p10le', audioCodec: 'libopus', audioBitrate: '128k', width: 1920, height: 1080, extraArgs: ['-svtav1-params', 'keyint=10s:tune=0:enable-overlays=1:scd=1'] }),
  av1_web: createPreset({ name: 'av1_web', videoCodec: 'libsvtav1', videoCrf: 35, videoPreset: '6', pixelFormat: 'yuv420p10le', audioCodec: 'libopus', audioBitrate: '48k', width: 1280, height: 720, extraArgs: ['-svtav1-params', 'keyint=10s:tune=0'] }),
  draft_hw: createPreset({ name: 'draft_hw', videoCodec: 'h264_videotoolbox', videoBitrate: '5M', pixelFormat: 'yuv420p', audioCodec: 'aac', audioBitrate: '128k', width: 1920, height: 1080 }),
  preview_hw: createPreset({ name: 'preview_hw', videoCodec: 'h264_videotoolbox', videoBitrate: '8M', pixelFormat: 'yuv420p', audioCodec: 'aac', audioBitrate: '192k', width: 1920, height: 1080 }),
  youtube: createPreset({ name: 'youtube', videoCodec: 'libx264', videoCrf: 18, videoPreset: 'slow', pixelFormat: 'yuv420p', audioCodec: 'aac', audioBitrate: '320k', width: 1920, height: 1080 }),
  linkedin: createPreset({ name: 'linkedin', videoCodec: 'libx264', videoCrf: 20, videoPreset: 'medium', pixelFormat: 'yuv420p', audioCodec: 'aac', audioBitrate: '192k', width: 1920, height: 1080 }),
  twitter: createPreset({ name: 'twitter', videoCodec: 'libx264', videoCrf: 23, videoPreset: 'medium', pixelFormat: 'yuv420p', audioCodec: 'aac', audioBitrate: '160k', width: 1280, height: 720, maxBitrate: '4M', bufsize: '8M' }),
  tiktok: createPreset({ name: 'tiktok', videoCodec: 'libx264', videoCrf: 23, videoPreset: 'medium', pixelFormat: 'yuv420p', audioCodec: 'aac', audioBitrate: '192k', width: 1080, height: 1920 }),
  producthunt: createPreset({ name: 'producthunt', videoCodec: 'libx264', videoCrf: 28, videoPreset: 'medium', pixelFormat: 'yuv420p', audioCodec: 'aac', audioBitrate: '128k', width: 1080, height: 1080, maxBitrate: '3M', bufsize: '6M' }),
};

export function getPreset(name: string): EncodingPreset {
  const preset = PRESETS[name];
  if (!preset) throw new Error(`Unknown preset: ${name}. Available: ${Object.keys(PRESETS).join(', ')}`);
  return preset;
}
