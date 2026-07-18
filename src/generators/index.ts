/**
 * Video router — dispatches to `nl.generate({output: {mode: 'video'}})` for
 * every video provider NeuroLink supports (vertex/Veo, Kling, Runway,
 * Replicate). All providers return `result.video.data` (Buffer).
 */
import fs from 'fs/promises';
import path from 'path';
import type { NeuroLink } from '@juspay/neurolink';
import type { VideoProvider, VideoOptions } from '../types/index.ts';

export type { VideoProvider, VideoOptions } from '../types/index.ts';
import { pacedVideoCall, RATE_LIMIT_BACKOFF_MS } from './pacing.ts';

/**
 * NeuroLink dispatches video by `output.video.provider`, but the top-level
 * `provider` still instantiates the text-provider shell (baseProvider) that
 * hosts the video call. Kling and Runway are video-only handlers — no text
 * provider of that name exists — so requesting them at the top level dies in
 * the provider registry ("Unknown provider: kling") before the video dispatch
 * ever runs. Route their shell through vertex; the video handler selection
 * below stays on the real provider.
 */
const SHELL_PROVIDER: Record<VideoProvider, string> = {
  vertex: 'vertex',
  replicate: 'replicate',
  kling: 'vertex',
  runway: 'vertex',
};

/**
 * NeuroLink's video-generation tool rejects prompts over 500 characters
 * outright — live B8 run: art-director animate prompts of 503-590 chars lost
 * 4 of 16 segments across both legs. Truncate on a word boundary instead of
 * failing the shot: a clipped prompt generates; an overlong one never does.
 * Pure — exported for tests.
 */
export function clampVideoPrompt(prompt: string, limit = 500): string {
  if (prompt.length <= limit) return prompt;
  const cut = prompt.slice(0, limit);
  const lastSpace = cut.lastIndexOf(' ');
  return (lastSpace > limit * 0.6 ? cut.slice(0, lastSpace) : cut).trimEnd();
}

export async function generate(
  nl: NeuroLink,
  provider: VideoProvider,
  prompt: string,
  outputPath: string,
  options: VideoOptions = {},
): Promise<string> {
  const images: Array<Buffer | string> = [];
  if (Buffer.isBuffer(options.inputImage)) images.push(options.inputImage);
  else if (typeof options.inputImage === 'string') images.push(await fs.readFile(options.inputImage));

  const clamped = clampVideoPrompt(prompt);
  if (clamped.length !== prompt.length) console.log(`[video] prompt clamped ${prompt.length}→${clamped.length} chars (tool limit)`);
  console.log(`[video] ${provider}: ${clamped.slice(0, 60)}...`);
  // Paid submit: globally spaced (VIDEO_SUBMIT_INTERVAL_MS) and retried on
  // rate-limit errors only — see generators/pacing.ts for the live failure
  // this guards against.
  const intervalMs = Math.max(0, Number(process.env.VIDEO_SUBMIT_INTERVAL_MS ?? 0) || 0);
  const result = await pacedVideoCall(() => nl.generate({
    input: { text: clamped, images: images.length ? images : undefined },
    provider: SHELL_PROVIDER[provider] ?? 'vertex',
    region: options.region ?? process.env.VERTEX_LOCATION,
    output: {
      mode: 'video',
      video: {
        provider,
        model: options.model,
        ...(options.imageInputKey ? { imageInputKey: options.imageInputKey } : {}),
        resolution: options.resolution ?? '1080p',
        length: options.length ?? 8,
        aspectRatio: options.aspectRatio ?? '16:9',
        audio: options.audio ?? true,
      },
    },
  }), { intervalMs, retryDelaysMs: RATE_LIMIT_BACKOFF_MS });

  const buf = result.video?.data;
  if (!buf) throw new Error(`[video] ${provider}: no video buffer returned`);
  await fs.mkdir(path.dirname(outputPath), { recursive: true });
  await fs.writeFile(outputPath, buf);
  console.log(`[video] ${provider}: ${outputPath} (${(buf.length / 1024).toFixed(0)} KB)`);
  return outputPath;
}
