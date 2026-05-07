export type AvatarProvider = 'd-id' | 'heygen' | 'replicate';

export type AvatarOptions = {
  quality?: 'standard' | 'hd';
  format?: 'mp4' | 'webm' | 'mov';
  ttsProvider?: string;
  voice?: string;
  model?: string;
};
