/**
 * D-ID avatar generator — lip-sync talking head.
 */
import fs from 'fs/promises';
import path from 'path';
import { sleep } from '../utils/rate-limit.ts';

const API_KEY = process.env.DID_API_KEY ?? '';
const API_BASE = 'https://api.d-id.com';

export async function generateAvatar(
  sourceImage: string,
  audio: string,
  outputPath: string,
): Promise<string> {
  if (!API_KEY) throw new Error('DID_API_KEY not set');
  const headers = { 'Authorization': `Basic ${API_KEY}`, 'Content-Type': 'application/json' };

  // Upload image + audio
  const imgData = await fs.readFile(sourceImage);
  const audioData = await fs.readFile(audio);

  const imgResp = await fetch(`${API_BASE}/images`, {
    method: 'POST', headers: { 'Authorization': `Basic ${API_KEY}` },
    body: (() => { const fd = new FormData(); fd.append('image', new Blob([imgData]), 'avatar.png'); return fd; })(),
  });
  if (!imgResp.ok) throw new Error(`D-ID image upload ${imgResp.status}: ${(await imgResp.text()).slice(0, 200)}`);
  const imgResult = await imgResp.json() as Record<string, string>;

  const audioResp = await fetch(`${API_BASE}/audios`, {
    method: 'POST', headers: { 'Authorization': `Basic ${API_KEY}` },
    body: (() => { const fd = new FormData(); fd.append('audio', new Blob([audioData]), 'audio.mp3'); return fd; })(),
  });
  if (!audioResp.ok) throw new Error(`D-ID audio upload ${audioResp.status}: ${(await audioResp.text()).slice(0, 200)}`);
  const audioResult = await audioResp.json() as Record<string, string>;

  // Create talk
  const talkResp = await fetch(`${API_BASE}/talks`, {
    method: 'POST', headers,
    body: JSON.stringify({
      source_url: imgResult.url, script: { type: 'audio', audio_url: audioResult.url },
      config: { stitch: true, result_format: 'mp4' },
    }),
  });
  if (!talkResp.ok) throw new Error(`D-ID talk creation ${talkResp.status}: ${(await talkResp.text()).slice(0, 200)}`);
  const talk = await talkResp.json() as Record<string, string>;

  // Poll
  for (let i = 0; i < 60; i++) {
    await sleep(10000);
    const poll = await fetch(`${API_BASE}/talks/${talk.id}`, { headers });
    const r = await poll.json() as Record<string, string>;
    if (r.status === 'done') {
      const videoData = await fetch(r.result_url).then((res) => res.arrayBuffer());
      await fs.mkdir(path.dirname(outputPath), { recursive: true });
      await fs.writeFile(outputPath, Buffer.from(videoData));
      return outputPath;
    }
    if (r.status === 'error') throw new Error(`D-ID talk failed: ${r.error ?? 'unknown error'}`);
  }
  throw new Error('D-ID timeout');
}
