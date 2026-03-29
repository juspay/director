/**
 * Late API — post video to 13 platforms in a single call.
 */
import fs from 'fs/promises';
import path from 'path';

const API_KEY = process.env.LATE_API_KEY ?? '';
const API_BASE = 'https://api.getlate.dev/v1';

export async function publishVideo(
  videoPath: string,
  platforms: string[],
  title: string,
  description: string,
  options: { tags?: string[]; thumbnailPath?: string; scheduleAt?: string } = {},
): Promise<Record<string, { url: string; id: string; status: string }>> {
  if (!API_KEY) throw new Error('LATE_API_KEY not set');

  const formData = new FormData();
  const videoData = await fs.readFile(videoPath);
  formData.append('video', new Blob([videoData]), path.basename(videoPath));
  formData.append('platforms', JSON.stringify(platforms));
  formData.append('title', title);
  formData.append('description', description);
  if (options.tags) formData.append('tags', JSON.stringify(options.tags));
  if (options.scheduleAt) formData.append('schedule_at', options.scheduleAt);
  if (options.thumbnailPath) {
    const thumbData = await fs.readFile(options.thumbnailPath);
    formData.append('thumbnail', new Blob([thumbData]), 'thumbnail.png');
  }

  const response = await fetch(`${API_BASE}/posts/create`, {
    method: 'POST',
    headers: { 'Authorization': `Bearer ${API_KEY}` },
    body: formData,
  });

  if (!response.ok) throw new Error(`Late API ${response.status}: ${(await response.text()).slice(0, 300)}`);
  const result = await response.json() as Record<string, Array<Record<string, string>>>;

  const perPlatform: Record<string, { url: string; id: string; status: string }> = {};
  for (const pr of (result.results ?? result.posts ?? [])) {
    perPlatform[pr.platform ?? 'unknown'] = { url: pr.url ?? '', id: pr.post_id ?? pr.id ?? '', status: pr.status ?? 'published' };
  }
  return perPlatform;
}
