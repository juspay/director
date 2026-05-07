/**
 * Scene narrator — single NeuroLink call that produces both the narration
 * text and the synthesized voice in one round-trip.
 *
 * Wraps `neurolink.generate({tts: {enabled, useAiResponse: true, voice}})`.
 */
import fs from 'fs/promises';
import path from 'path';
import type { NeuroLink } from '@juspay/neurolink';

import type { NarrateSceneOptions, NarrateSceneResult } from '../types/index.ts';
export type { NarrateSceneOptions, NarrateSceneResult } from '../types/index.ts';

const NARRATION_PROMPT_TEMPLATE = `You are a video narrator. Write a natural-sounding spoken narration for the scene description below.
Constraints:
  - 2-4 sentences max
  - Conversational, friendly tone
  - No stage directions, just spoken words
  - Output only the narration text, nothing else`;

export async function narrateScene(
  neurolink: NeuroLink,
  sceneDescription: string,
  outputAudioPath: string,
  options: NarrateSceneOptions = {},
): Promise<NarrateSceneResult> {
  const result = await neurolink.generate({
    input: { text: `${NARRATION_PROMPT_TEMPLATE}\n\nSCENE:\n${sceneDescription}` },
    provider: process.env.AGENT_PROVIDER ?? 'vertex',
    model: process.env.NARRATOR_MODEL ?? process.env.MODEL ?? 'gemini-2.5-flash',
    disableTools: true,
    maxTokens: 500,
    timeout: '60s',
    tts: {
      enabled: true,
      useAiResponse: true,
      voice: options.voice ?? 'en-US-Neural2-D',
      format: options.format ?? 'mp3',
      speed: options.speed,
      pitch: options.pitch,
    },
  } as Parameters<NeuroLink['generate']>[0]);

  const r = result as unknown as { content?: string; audio?: { buffer: Buffer; size: number; duration?: number } };
  if (!r.audio?.buffer) {
    throw new Error('No audio in narrator response — check tts handler registration and voice name');
  }
  await fs.mkdir(path.dirname(outputAudioPath), { recursive: true });
  await fs.writeFile(outputAudioPath, r.audio.buffer);
  return {
    text: r.content ?? '',
    audioPath: outputAudioPath,
    durationSec: r.audio.duration,
  };
}
