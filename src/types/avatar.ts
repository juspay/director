export type AvatarProvider = 'd-id' | 'heygen' | 'replicate';

export type AvatarOptions = {
  quality?: 'standard' | 'hd';
  format?: 'mp4' | 'webm' | 'mov';
  ttsProvider?: string;
  voice?: string;
  model?: string;
  /** Provider avatar identifier — required by HeyGen (which preset talking head to drive). */
  avatarId?: string;
};
