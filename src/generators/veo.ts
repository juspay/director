/**
 * Google Veo 3.1 video generator via Gemini API.
 */
import fs from 'fs/promises';
import path from 'path';
import { sleep } from '../utils/rate-limit.ts';

const PROJECT = process.env.GOOGLE_CLOUD_PROJECT ?? '';
const LOCATION = process.env.VERTEX_LOCATION ?? 'us-central1';

export async function generateClip(
  prompt: string,
  outputPath: string,
  options: { duration?: number; aspectRatio?: string; generateAudio?: boolean } = {},
): Promise<string> {
  const { Client } = await import('@google-cloud/aiplatform' as string).catch(() => {
    throw new Error('Install @google-cloud/aiplatform or use google-genai SDK');
  });

  // Use google-genai for Veo
  const genai = await import('../../node_modules/@juspay/neurolink/node_modules/@google-cloud/vertexai/build/src/index.js' as string).catch(() => null);

  // Fallback: call Veo via REST
  const apiBase = `https://${LOCATION}-aiplatform.googleapis.com/v1/projects/${PROJECT}/locations/${LOCATION}`;

  console.log(`[Veo] Generating: ${prompt.slice(0, 60)}... (${options.duration ?? 5}s)`);

  // Veo generation via Gemini API (simplified)
  const response = await fetch(`${apiBase}/publishers/google/models/veo-3.1:predict`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      instances: [{ prompt }],
      parameters: {
        sampleCount: 1,
        durationSeconds: options.duration ?? 5,
        aspectRatio: options.aspectRatio ?? '16:9',
      },
    }),
  });

  if (!response.ok) throw new Error(`Veo ${response.status}: ${(await response.text()).slice(0, 300)}`);

  const result = await response.json() as Record<string, Array<Record<string, string>>>;
  const videoBase64 = result.predictions?.[0]?.video;
  if (!videoBase64) throw new Error('No video in response');

  await fs.mkdir(path.dirname(outputPath), { recursive: true });
  await fs.writeFile(outputPath, Buffer.from(videoBase64, 'base64'));
  console.log(`[Veo] Saved: ${outputPath}`);
  return outputPath;
}
