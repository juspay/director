/**
 * Runway Gen-4 Turbo video generator.
 */
import fs from 'fs/promises';
import path from 'path';
import { sleep } from '../utils/rate-limit.ts';

const API_BASE = 'https://api.dev.runwayml.com/v1';
const API_KEY = process.env.RUNWAY_API_KEY ?? '';

export async function generateClip(
  prompt: string,
  outputPath: string,
  options: { duration?: number; model?: string } = {},
): Promise<string> {
  if (!API_KEY) throw new Error('RUNWAY_API_KEY not set');

  const response = await fetch(`${API_BASE}/image_to_video`, {
    method: 'POST',
    headers: { 'Authorization': `Bearer ${API_KEY}`, 'Content-Type': 'application/json', 'X-Runway-Version': '2024-11-06' },
    body: JSON.stringify({
      model: options.model ?? 'gen4_turbo',
      promptText: prompt,
      duration: options.duration ?? 5,
      ratio: '1280:720',
    }),
  });

  if (!response.ok) throw new Error(`Runway ${response.status}: ${(await response.text()).slice(0, 300)}`);
  const result = await response.json() as Record<string, string>;
  const taskId = result.id;

  // Poll
  let videoUrl = '';
  for (let i = 0; i < 120; i++) {
    await sleep(5000);
    const poll = await fetch(`${API_BASE}/tasks/${taskId}`, {
      headers: { 'Authorization': `Bearer ${API_KEY}`, 'X-Runway-Version': '2024-11-06' },
    });
    const status = await poll.json() as Record<string, string | Array<Record<string, string>>>;
    if (status.status === 'SUCCEEDED') {
      const output = status.output as Array<Record<string, string>>;
      videoUrl = output?.[0] as unknown as string ?? '';
      break;
    }
    if (status.status === 'FAILED') throw new Error(`Runway failed: ${status.failure}`);
  }

  if (!videoUrl) throw new Error('Runway timeout');
  const videoData = await fetch(videoUrl).then((r) => r.arrayBuffer());
  await fs.mkdir(path.dirname(outputPath), { recursive: true });
  await fs.writeFile(outputPath, Buffer.from(videoData));
  console.log(`[Runway] Saved: ${outputPath}`);
  return outputPath;
}
