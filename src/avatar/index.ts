/**
 * Avatar router — dispatches to `nl.generate({output: {mode: 'avatar'}})` for
 * every avatar / lip-sync provider NeuroLink supports (D-ID, HeyGen,
 * Replicate MuseTalk/SadTalker/Wav2Lip). Returns `result.avatar.buffer`.
 */
import fs from 'fs/promises';
import path from 'path';
import type { NeuroLink } from '@juspay/neurolink';
import { registerDefaultAvatarHandlers } from '@juspay/neurolink/avatar';
import type { AvatarProvider, AvatarOptions } from '../types/index.ts';

export type { AvatarProvider, AvatarOptions } from '../types/index.ts';

// NeuroLink ships D-ID / HeyGen / Replicate avatar handlers but doesn't register
// them automatically — without this the avatar registry is empty and every
// provider fails with "Avatar provider '…' is not registered". Register once.
let _handlersRegistered = false;
function ensureAvatarHandlers(): void {
  if (_handlersRegistered) return;
  registerDefaultAvatarHandlers();
  _handlersRegistered = true;
}

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
  ensureAvatarHandlers();
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
        ...(options.avatarId ? { avatarId: options.avatarId } : {}),
      },
    },
  });

  if (!result.avatar?.buffer) throw new Error(`[avatar] ${provider}: no avatar buffer returned`);
  await fs.mkdir(path.dirname(outputPath), { recursive: true });
  await fs.writeFile(outputPath, result.avatar.buffer);
  console.log(`[avatar] ${provider}: ${outputPath} (${(result.avatar.buffer.length / 1024).toFixed(0)} KB)`);
  return outputPath;
}
