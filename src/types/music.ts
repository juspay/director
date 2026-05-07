export type MusicProvider = 'lyria' | 'beatoven' | 'elevenlabs-music' | 'replicate';

export type MusicOptions = {
  duration?: number;
  format?: 'mp3' | 'wav' | 'flac' | 'ogg';
  genre?: string;
  mood?: string;
  tempo?: number;
  model?: string;
};
