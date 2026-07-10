/**
 * Image generator — wraps NeuroLink's `ImageGenService` to produce still
 * keyframes (hero product shots, per-scene b-roll keyframes).
 *
 * Used by the two-stage b-roll path: generate a composed keyframe (optionally
 * anchored to a reference image for product consistency), then animate it with
 * an image-to-video model. Defaults to Vertex Gemini image (`gemini-2.5-flash-image`,
 * "nano banana") for native reference-image editing and the Vertex billing path;
 * override via IMAGE_PROVIDER / IMAGE_MODEL or per-call opts.
 */
import fs from 'fs/promises';
import path from 'path';
import { ImageGenService } from '@juspay/neurolink';
import { CostTracker } from '../scoring/cost-tracker.ts';

export type ImageGenOpts = {
  referenceImages?: Array<Buffer | string>;
  negativePrompt?: string;
  aspectRatio?: string;
  provider?: string;
  model?: string;
};

const DEFAULT_NEGATIVE = 'text, words, letters, typography, logo, brand name, watermark, caption, label, UI text, low quality, blurry, distorted, cartoon';

let _svc: ImageGenService | null = null;
function service(): ImageGenService {
  if (!_svc) _svc = new ImageGenService();
  return _svc;
}

// Logging at this choke point covers every billed image — hero, per-shot
// keyframes, and critic-driven regenerations — which previously never reached
// cost_log.jsonl at all (a director-mode run bills up to 1 + shots × attempts
// images that the end-of-run summary silently omitted).
const costTracker = new CostTracker();

/**
 * Resolve the provider/model/negative/aspect for an image generation, applying
 * the precedence opts → env → default. Default is Vertex Gemini image (the
 * OpenAI default was dropped when gpt-image-1 billing was hard-limited). Pure —
 * exported so the defaults are unit-testable without constructing the service.
 */
export function resolveImageGenParams(
  opts: ImageGenOpts = {},
  env: NodeJS.ProcessEnv = process.env,
): { provider: string; model: string; negativePrompt: string; aspectRatio: string } {
  return {
    provider: opts.provider ?? env.IMAGE_PROVIDER ?? 'vertex',
    model: opts.model ?? env.IMAGE_MODEL ?? 'gemini-2.5-flash-image',
    negativePrompt: opts.negativePrompt ?? DEFAULT_NEGATIVE,
    aspectRatio: opts.aspectRatio ?? '16:9',
  };
}

export async function generateImage(
  prompt: string,
  outputPath: string,
  opts: ImageGenOpts = {},
): Promise<string> {
  const { provider, model, negativePrompt, aspectRatio } = resolveImageGenParams(opts);
  console.log(`[image] ${provider}/${model}: ${prompt.slice(0, 60)}...`);

  const result = await service().generate({
    prompt,
    negativePrompt,
    aspectRatio,
    provider,
    model,
    ...(opts.referenceImages && opts.referenceImages.length ? { images: opts.referenceImages } : {}),
  } as Parameters<ImageGenService['generate']>[0]);

  if (!result.success || !result.imageBuffer) {
    throw new Error(`[image] ${provider}/${model}: ${result.error ?? 'no image buffer'}`);
  }
  await fs.mkdir(path.dirname(outputPath), { recursive: true });
  await fs.writeFile(outputPath, result.imageBuffer);
  // Accounting must never break generation, hence the swallow.
  await costTracker.log(provider, 'image-gen', { images: 1 }).catch(() => undefined);
  console.log(`[image] ${provider}/${model}: ${outputPath} (${(result.imageBuffer.length / 1024).toFixed(0)} KB)`);
  return outputPath;
}
