/**
 * Image generator — wraps NeuroLink's `ImageGenService` to produce still
 * keyframes (hero product shots, per-scene b-roll keyframes).
 *
 * Used by the two-stage b-roll path: generate a composed keyframe (optionally
 * anchored to a reference image for product consistency), then animate it with
 * an image-to-video model. Defaults to OpenAI `gpt-image-1` because Vertex
 * Imagen is not enabled in every project/region.
 */
import fs from 'fs/promises';
import path from 'path';
import { ImageGenService } from '@juspay/neurolink';

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

export async function generateImage(
  prompt: string,
  outputPath: string,
  opts: ImageGenOpts = {},
): Promise<string> {
  // Default to Vertex Gemini image ("nano banana"): native reference-image editing
  // (best for product consistency), cinematic output, and on the Vertex billing path
  // rather than OpenAI. Override via IMAGE_PROVIDER / IMAGE_MODEL or opts.
  const provider = opts.provider ?? process.env.IMAGE_PROVIDER ?? 'vertex';
  const model = opts.model ?? process.env.IMAGE_MODEL ?? 'gemini-2.5-flash-image';
  console.log(`[image] ${provider}/${model}: ${prompt.slice(0, 60)}...`);

  const result = await service().generate({
    prompt,
    negativePrompt: opts.negativePrompt ?? DEFAULT_NEGATIVE,
    aspectRatio: opts.aspectRatio ?? '16:9',
    provider,
    model,
    ...(opts.referenceImages && opts.referenceImages.length ? { images: opts.referenceImages } : {}),
  } as Parameters<ImageGenService['generate']>[0]);

  if (!result.success || !result.imageBuffer) {
    throw new Error(`[image] ${provider}/${model}: ${result.error ?? 'no image buffer'}`);
  }
  await fs.mkdir(path.dirname(outputPath), { recursive: true });
  await fs.writeFile(outputPath, result.imageBuffer);
  console.log(`[image] ${provider}/${model}: ${outputPath} (${(result.imageBuffer.length / 1024).toFixed(0)} KB)`);
  return outputPath;
}
