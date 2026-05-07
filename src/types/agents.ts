export type NarrateSceneOptions = {
  voice?: string;
  format?: 'mp3' | 'wav' | 'ogg' | 'opus';
  speed?: number;
  pitch?: number;
};

export type NarrateSceneResult = {
  text: string;
  audioPath: string;
  durationSec?: number;
};
