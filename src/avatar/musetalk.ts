/**
 * MuseTalk lip sync via Replicate API.
 */
import fs from 'fs/promises';
import path from 'path';
import { sleep } from '../utils/rate-limit.ts';

const TOKEN = process.env.REPLICATE_API_TOKEN ?? '';

export async function generateLipsync(
  sourceImage: string,
  audio: string,
  outputPath: string,
  options: { bboxShift?: number; fps?: number } = {},
): Promise<string> {
  if (!TOKEN) throw new Error('REPLICATE_API_TOKEN not set');

  const imgData = await fs.readFile(sourceImage);
  const audioData = await fs.readFile(audio);
  const imgMime = sourceImage.endsWith('.png') ? 'image/png' : 'image/jpeg';

  const response = await fetch('https://api.replicate.com/v1/predictions', {
    method: 'POST',
    headers: { 'Authorization': `Bearer ${TOKEN}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({
      version: 'latest',
      input: {
        source_image: `data:${imgMime};base64,${imgData.toString('base64')}`,
        driven_audio: `data:audio/mpeg;base64,${audioData.toString('base64')}`,
        bbox_shift: options.bboxShift ?? 0,
        fps: options.fps ?? 30,
      },
    }),
  });

  if (!response.ok) throw new Error(`MuseTalk ${response.status}`);
  const pred = await response.json() as Record<string, string>;

  for (let i = 0; i < 120; i++) {
    await sleep(5000);
    const poll = await fetch(`https://api.replicate.com/v1/predictions/${pred.id}`, {
      headers: { 'Authorization': `Bearer ${TOKEN}` },
    });
    const r = await poll.json() as Record<string, unknown>;
    if (r.status === 'succeeded') {
      const url = (Array.isArray(r.output) ? r.output[0] : r.output) as string;
      const data = await fetch(url).then((res) => res.arrayBuffer());
      await fs.mkdir(path.dirname(outputPath), { recursive: true });
      await fs.writeFile(outputPath, Buffer.from(data));
      console.log(`[MuseTalk] Saved: ${outputPath}`);
      return outputPath;
    }
    if (r.status === 'failed') throw new Error(`MuseTalk failed: ${r.error}`);
  }
  throw new Error('MuseTalk timeout');
}
