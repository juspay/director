/**
 * Google Veo 3.1 video generator via Vertex AI REST API.
 * Requires GOOGLE_CLOUD_PROJECT and GOOGLE_APPLICATION_CREDENTIALS.
 */
import fs from 'fs/promises';
import path from 'path';
import { sleep } from '../utils/rate-limit.ts';

const LOCATION = process.env.VERTEX_LOCATION ?? 'us-central1';

async function getAccessToken(): Promise<string> {
  // Use gcloud CLI to get access token (works with ADC and service accounts)
  const { execa } = await import('execa');
  const { stdout } = await execa('gcloud', ['auth', 'print-access-token']);
  return stdout.trim();
}

export async function generateClip(
  prompt: string,
  outputPath: string,
  options: { duration?: number; aspectRatio?: string; generateAudio?: boolean } = {},
): Promise<string> {
  const project = process.env.GOOGLE_CLOUD_PROJECT;
  if (!project) throw new Error('GOOGLE_CLOUD_PROJECT not set');

  const apiBase = `https://${LOCATION}-aiplatform.googleapis.com/v1/projects/${project}/locations/${LOCATION}`;
  const token = await getAccessToken();

  console.log(`[Veo] Generating: ${prompt.slice(0, 60)}... (${options.duration ?? 5}s)`);

  // Submit generation request
  const response = await fetch(`${apiBase}/publishers/google/models/veo-3.1:predict`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
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

  const result = await response.json() as Record<string, unknown>;

  // Handle async operation — poll if we get an operation name
  const operationName = (result as Record<string, string>).name;
  if (operationName && !((result as Record<string, unknown[]>).predictions)) {
    console.log(`[Veo] Polling operation: ${operationName}`);
    for (let i = 0; i < 120; i++) {
      await sleep(5000);
      const pollResp = await fetch(`https://${LOCATION}-aiplatform.googleapis.com/v1/${operationName}`, {
        headers: { 'Authorization': `Bearer ${token}` },
      });
      const op = await pollResp.json() as Record<string, unknown>;
      if (op.done) {
        const opResult = op.response as Record<string, Array<Record<string, string>>> | undefined;
        const videoBase64 = opResult?.predictions?.[0]?.video;
        if (!videoBase64) throw new Error('No video in completed operation');
        await fs.mkdir(path.dirname(outputPath), { recursive: true });
        await fs.writeFile(outputPath, Buffer.from(videoBase64, 'base64'));
        console.log(`[Veo] Saved: ${outputPath}`);
        return outputPath;
      }
      if (op.error) throw new Error(`Veo operation failed: ${JSON.stringify(op.error)}`);
    }
    throw new Error('Veo operation timeout after 10 minutes');
  }

  // Synchronous response
  const predictions = (result as Record<string, Array<Record<string, string>>>).predictions;
  const videoBase64 = predictions?.[0]?.video;
  if (!videoBase64) throw new Error('No video in response');

  await fs.mkdir(path.dirname(outputPath), { recursive: true });
  await fs.writeFile(outputPath, Buffer.from(videoBase64, 'base64'));
  console.log(`[Veo] Saved: ${outputPath}`);
  return outputPath;
}
