export type EncodingPreset = {
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
};

export type ValidationResult = {
  valid: boolean;
  checks: Array<{ name: string; passed: boolean; detail: string }>;
};
