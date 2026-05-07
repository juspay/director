/**
 * Music router — dispatches to `nl.generate({output: {mode: 'music'}})` for
 * every music provider NeuroLink supports (Lyria, Beatoven, ElevenLabs
 * Music, Replicate MusicGen/Riffusion). Returns `result.music.buffer`.
 *
 * The local NumPy programmatic fallback lives in `scripts/python/synthesize-music.py`
 * and is invoked from `pipeline/runner.ts` when no API provider is configured.
 */
import fs from 'fs/promises';
import path from 'path';
import type { NeuroLink } from '@juspay/neurolink';
import type { MusicProvider, MusicOptions } from '../types/index.ts';

export type { MusicProvider, MusicOptions } from '../types/index.ts';

export async function generate(
  nl: NeuroLink,
  provider: MusicProvider,
  prompt: string,
  outputPath: string,
  options: MusicOptions = {},
): Promise<string> {
  console.log(`[music] ${provider}: ${prompt.slice(0, 60)}...`);
  const result = await nl.generate({
    input: { text: prompt },
    output: {
      mode: 'music',
      music: {
        prompt,
        provider,
        duration: options.duration,
        format: options.format ?? 'mp3',
        genre: options.genre,
        mood: options.mood,
        tempo: options.tempo,
        ...(options.model ? { model: options.model } : {}),
      },
    },
  });

  if (!result.music?.buffer) throw new Error(`[music] ${provider}: no music buffer returned`);
  await fs.mkdir(path.dirname(outputPath), { recursive: true });
  await fs.writeFile(outputPath, result.music.buffer);
  console.log(`[music] ${provider}: ${outputPath} (${(result.music.buffer.length / 1024).toFixed(0)} KB)`);
  return outputPath;
}
