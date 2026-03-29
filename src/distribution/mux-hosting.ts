/**
 * Mux video hosting — upload, HLS transcoding, analytics.
 */
import fs from 'fs/promises';

const TOKEN_ID = process.env.MUX_TOKEN_ID ?? '';
const TOKEN_SECRET = process.env.MUX_TOKEN_SECRET ?? '';
const API_BASE = 'https://api.mux.com';

function authHeader(): string {
  return `Basic ${Buffer.from(`${TOKEN_ID}:${TOKEN_SECRET}`).toString('base64')}`;
}

export async function uploadVideo(videoPath: string): Promise<{ assetId: string; playbackUrl: string }> {
  if (!TOKEN_ID) throw new Error('MUX_TOKEN_ID not set');

  const headers = { 'Authorization': authHeader(), 'Content-Type': 'application/json' };

  // Create upload
  const uploadResp = await fetch(`${API_BASE}/video/v1/uploads`, {
    method: 'POST', headers,
    body: JSON.stringify({ new_asset_settings: { playback_policy: ['public'] }, cors_origin: '*' }),
  });
  const upload = ((await uploadResp.json()) as Record<string, Record<string, string>>).data;

  // PUT video
  const videoData = await fs.readFile(videoPath);
  await fetch(upload.url, { method: 'PUT', body: videoData, headers: { 'Content-Type': 'video/mp4' } });

  // Poll for asset
  let assetId = '';
  for (let i = 0; i < 60; i++) {
    await new Promise((r) => setTimeout(r, 5000));
    const check = await fetch(`${API_BASE}/video/v1/uploads/${upload.id}`, { headers });
    const data = ((await check.json()) as Record<string, Record<string, string>>).data;
    if (data.asset_id) { assetId = data.asset_id; break; }
  }

  // Get playback URL
  const assetResp = await fetch(`${API_BASE}/video/v1/assets/${assetId}`, { headers });
  const asset = ((await assetResp.json()) as Record<string, Record<string, Array<Record<string, string>>>>).data;
  const pid = asset.playback_ids?.[0]?.id ?? '';

  return { assetId, playbackUrl: `https://stream.mux.com/${pid}.m3u8` };
}

export async function getAnalytics(assetId: string): Promise<{ views: number; watchTime: number }> {
  const resp = await fetch(`${API_BASE}/data/v1/video-views?filters[]=asset_id:${assetId}`, {
    headers: { 'Authorization': authHeader() },
  });
  const data = ((await resp.json()) as Record<string, Array<Record<string, number>>>).data ?? [];
  return { views: data.length, watchTime: data.reduce((s, v) => s + (v.watch_time ?? 0), 0) };
}
