/**
 * Beatoven.ai — text-to-music and video-to-music with scene markers.
 */
import fs from 'fs/promises';
import path from 'path';
import { sleep } from '../utils/rate-limit.ts';

const API_KEY = process.env.BEATOVEN_API_KEY ?? '';
const API_BASE = 'https://api.beatoven.ai/v1';

export async function generateFromText(
  prompt: string,
  outputPath: string,
  options: { duration?: number; genre?: string; mood?: string; tempo?: number; sceneMarkers?: Array<{ time: number; mood: string }> } = {},
): Promise<string> {
  if (!API_KEY) throw new Error('BEATOVEN_API_KEY not set');

  const body: Record<string, unknown> = {
    prompt, duration: options.duration ?? 170, genre: options.genre ?? 'cinematic',
    mood: options.mood ?? 'contemplative', tempo: options.tempo ?? 80,
  };
  if (options.sceneMarkers) body.scene_markers = options.sceneMarkers;

  const response = await fetch(`${API_BASE}/tracks/generate`, {
    method: 'POST',
    headers: { 'Authorization': `Bearer ${API_KEY}`, 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });

  if (!response.ok) throw new Error(`Beatoven ${response.status}`);
  const result = await response.json() as Record<string, string>;
  const trackId = result.track_id ?? result.id;

  const url = await pollTrack(trackId);
  const data = await fetch(url).then((r) => r.arrayBuffer());
  await fs.mkdir(path.dirname(outputPath), { recursive: true });
  await fs.writeFile(outputPath, Buffer.from(data));
  return outputPath;
}

export async function generateFromVideo(videoPath: string, outputPath: string, genre = 'cinematic'): Promise<string> {
  if (!API_KEY) throw new Error('BEATOVEN_API_KEY not set');
  const videoData = await fs.readFile(videoPath);
  const formData = new FormData();
  formData.append('video', new Blob([videoData]), path.basename(videoPath));
  formData.append('genre', genre);

  const response = await fetch(`${API_BASE}/tracks/generate-from-video`, {
    method: 'POST', headers: { 'Authorization': `Bearer ${API_KEY}` }, body: formData,
  });
  if (!response.ok) throw new Error(`Beatoven video ${response.status}`);
  const result = await response.json() as Record<string, string>;

  const url = await pollTrack(result.track_id ?? result.id);
  const data = await fetch(url).then((r) => r.arrayBuffer());
  await fs.mkdir(path.dirname(outputPath), { recursive: true });
  await fs.writeFile(outputPath, Buffer.from(data));
  return outputPath;
}

async function pollTrack(trackId: string, timeout = 300_000): Promise<string> {
  const start = Date.now();
  while (Date.now() - start < timeout) {
    await sleep(5000);
    const r = await fetch(`${API_BASE}/tracks/${trackId}`, { headers: { 'Authorization': `Bearer ${API_KEY}` } });
    const data = await r.json() as Record<string, string>;
    if (['completed', 'ready', 'done'].includes(data.status ?? '')) return data.download_url ?? data.audio_url ?? '';
    if (['failed', 'error'].includes(data.status ?? '')) throw new Error(`Beatoven failed: ${JSON.stringify(data)}`);
  }
  throw new Error('Beatoven timeout');
}
