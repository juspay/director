/**
 * Kling 3.0 video generator — 4K/60fps at $0.029/sec.
 */
import fs from 'fs/promises';
import path from 'path';
import { sleep } from '../utils/rate-limit.ts';

const API_BASE = process.env.KLING_API_BASE ?? 'https://api.piapi.ai/api/kling/v1';
const API_KEY = process.env.KLING_API_KEY ?? '';

export async function generateClip(
  prompt: string,
  outputPath: string,
  options: { duration?: number; resolution?: string } = {},
): Promise<string> {
  if (!API_KEY) throw new Error('KLING_API_KEY not set');

  const response = await fetch(`${API_BASE}/videos/generations`, {
    method: 'POST',
    headers: { 'Authorization': `Bearer ${API_KEY}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({
      model: 'kling-v3', prompt,
      duration: options.duration ?? 5,
      width: options.resolution === '4k' ? 3840 : 1920,
      height: options.resolution === '4k' ? 2160 : 1080,
    }),
  });

  if (!response.ok) throw new Error(`Kling ${response.status}: ${(await response.text()).slice(0, 300)}`);
  const result = await response.json() as Record<string, Record<string, string>>;
  const taskId = result.data?.task_id ?? result.task_id;
  if (!taskId) throw new Error('No task_id');

  // Poll
  const videoUrl = await pollTask(`${API_BASE}/videos/generations/${taskId}`, API_KEY);
  const videoData = await fetch(videoUrl).then((r) => r.arrayBuffer());
  await fs.mkdir(path.dirname(outputPath), { recursive: true });
  await fs.writeFile(outputPath, Buffer.from(videoData));
  console.log(`[Kling] Saved: ${outputPath}`);
  return outputPath;
}

async function pollTask(url: string, key: string, timeout = 600_000): Promise<string> {
  const start = Date.now();
  while (Date.now() - start < timeout) {
    await sleep(5000);
    const r = await fetch(url, { headers: { 'Authorization': `Bearer ${key}` } });
    const data = (await r.json()) as Record<string, Record<string, string>>;
    const d = (data.data ?? data) as Record<string, string | Record<string, string>>;
    const status = (d.status ?? '') as string;
    if (['completed', 'succeed', 'done'].includes(status)) {
      return (d.video_url as string) ?? ((d.output as Record<string, string>)?.video_url ?? '');
    }
    if (['failed', 'error'].includes(status)) throw new Error(`Kling failed: ${JSON.stringify(d)}`);
  }
  throw new Error('Kling timeout');
}
