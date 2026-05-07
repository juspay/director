/**
 * Voiceover router — dispatches to `nl.generate({tts: {...}})` for every
 * provider NeuroLink supports natively, falls back to the local `edgetts`
 * subprocess for Microsoft Edge TTS (no public REST API).
 *
 * Supported providers (NeuroLink built-ins): "elevenlabs", "openai-tts",
 * "fish-audio", "google-ai" (Google TTS), "azure-tts", "cartesia".
 * Plus local: "edgetts".
 */
import fs from 'fs/promises';
import path from 'path';
import type { NeuroLink } from '@juspay/neurolink';
import type { VoiceoverProvider, VoiceoverOptions } from '../types/index.ts';
import * as edgetts from './edgetts.ts';

export type { VoiceoverProvider, VoiceoverOptions } from '../types/index.ts';

const DEFAULT_VOICE: Record<VoiceoverProvider, string | undefined> = {
  elevenlabs: '21m00Tcm4TlvDq8ikWAM',
  'openai-tts': 'alloy',
  'fish-audio': undefined,
  'google-ai': 'en-US-Neural2-D',
  'azure-tts': 'en-US-AvaMultilingualNeural',
  cartesia: undefined,
  edgetts: 'en-IN-NeerjaNeural',
};

export async function generate(
  nl: NeuroLink,
  provider: VoiceoverProvider,
  text: string,
  outputPath: string,
  options: VoiceoverOptions = {},
): Promise<string> {
  if (provider === 'edgetts') return edgetts.generate(text, outputPath, options);

  const result = await nl.generate({
    input: { text },
    tts: {
      enabled: true,
      provider,
      voice: options.voice ?? DEFAULT_VOICE[provider],
      speed: options.speed,
      pitch: options.pitch,
      format: options.format ?? 'mp3',
      useAiResponse: false,
    },
  });
  if (!result.audio?.buffer) throw new Error(`[voiceover] ${provider}: no audio buffer returned`);
  await fs.mkdir(path.dirname(outputPath), { recursive: true });
  await fs.writeFile(outputPath, result.audio.buffer);
  console.log(`[voiceover] ${provider}: ${outputPath} (${(result.audio.buffer.length / 1024).toFixed(0)} KB)`);
  return outputPath;
}
