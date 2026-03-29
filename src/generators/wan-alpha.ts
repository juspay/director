/**
 * Wan-Alpha RGBA video generator — native transparency.
 */
import fs from 'fs/promises';
import path from 'path';
import { sleep } from '../utils/rate-limit.ts';
import { execa } from 'execa';

const REPLICATE_TOKEN = process.env.REPLICATE_API_TOKEN ?? '';

export async function generateRgbaVideo(
  prompt: string,
  outputPath: string,
  options: { width?: number; height?: number; sourceImage?: string } = {},
): Promise<string> {
  if (!REPLICATE_TOKEN) throw new Error('REPLICATE_API_TOKEN not set');

  const input: Record<string, unknown> = {
    prompt,
    width: options.width ?? 832,
    height: options.height ?? 480,
    output_format: 'webm',
  };

  if (options.sourceImage) {
    const imgData = await fs.readFile(options.sourceImage);
    input.image = `data:image/png;base64,${imgData.toString('base64')}`;
  }

  const response = await fetch('https://api.replicate.com/v1/models/wechatcv/wan-alpha/predictions', {
    method: 'POST',
    headers: { 'Authorization': `Bearer ${REPLICATE_TOKEN}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({ input }),
  });

  if (!response.ok) throw new Error(`Wan-Alpha ${response.status}`);
  const pred = await response.json() as Record<string, string>;

  // Poll
  let videoUrl = '';
  for (let i = 0; i < 120; i++) {
    await sleep(5000);
    const poll = await fetch(`https://api.replicate.com/v1/predictions/${pred.id}`, {
      headers: { 'Authorization': `Bearer ${REPLICATE_TOKEN}` },
    });
    const r = await poll.json() as Record<string, unknown>;
    if (r.status === 'succeeded') {
      videoUrl = (Array.isArray(r.output) ? r.output[0] : r.output) as string;
      break;
    }
    if (r.status === 'failed') throw new Error(`Wan-Alpha failed: ${r.error}`);
  }

  const videoData = await fetch(videoUrl).then((r) => r.arrayBuffer());
  await fs.mkdir(path.dirname(outputPath), { recursive: true });
  await fs.writeFile(outputPath, Buffer.from(videoData));
  console.log(`[Wan-Alpha] Saved RGBA: ${outputPath}`);
  return outputPath;
}

export async function compositeOnBackground(
  rgbaVideo: string,
  outputPath: string,
  backgroundColor = '#0f172a',
): Promise<string> {
  const color = backgroundColor.replace('#', '');
  await execa('ffmpeg', [
    '-y', '-f', 'lavfi', '-i', `color=c=0x${color}:s=1920x1080:d=300`,
    '-i', rgbaVideo,
    '-filter_complex', '[1:v]scale=1920:-1[fg];[0:v][fg]overlay=(W-w)/2:(H-h)/2:shortest=1',
    '-c:v', 'libx264', '-crf', '18', '-preset', 'slow', '-tune', 'animation',
    '-movflags', '+faststart', outputPath,
  ]);
  return outputPath;
}
