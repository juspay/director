/**
 * Avatar router — dispatches to `nl.generate({output: {mode: 'avatar'}})` for
 * every avatar / lip-sync provider NeuroLink supports (D-ID, HeyGen,
 * Replicate MuseTalk/SadTalker/Wav2Lip). Returns `result.avatar.buffer`.
 */
import fs from 'fs/promises';
import path from 'path';
import type { NeuroLink } from '@juspay/neurolink';
import type { AvatarProvider, AvatarOptions } from '../types/index.ts';

export type { AvatarProvider, AvatarOptions } from '../types/index.ts';

/**
 * Generate a talking-head video by lip-syncing a portrait image to either
 * pre-rendered audio or text (NeuroLink will TTS the text first via the
 * configured `ttsProvider`).
 */
export async function generate(
  nl: NeuroLink,
  provider: AvatarProvider,
  image: Buffer | string,
  audioOrText: { audio: Buffer | string } | { text: string },
  outputPath: string,
  options: AvatarOptions = {},
): Promise<string> {
  console.log(`[avatar] ${provider}: ${typeof image === 'string' ? image : 'buffer'} ...`);
  const result = await nl.generate({
    input: { text: '' },
    output: {
      mode: 'avatar',
      avatar: {
        image,
        ...('audio' in audioOrText ? { audio: audioOrText.audio } : { text: audioOrText.text }),
        provider,
        quality: options.quality ?? 'hd',
        format: options.format ?? 'mp4',
        ttsProvider: options.ttsProvider,
        voice: options.voice,
        ...(options.model ? { model: options.model } : {}),
      },
    },
  });

  if (!result.avatar?.buffer) throw new Error(`[avatar] ${provider}: no avatar buffer returned`);
  await fs.mkdir(path.dirname(outputPath), { recursive: true });
  await fs.writeFile(outputPath, result.avatar.buffer);
  console.log(`[avatar] ${provider}: ${outputPath} (${(result.avatar.buffer.length / 1024).toFixed(0)} KB)`);
  return outputPath;
}
