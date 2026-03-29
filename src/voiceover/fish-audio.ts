/**
 * Fish Audio S2 Pro — 80% cheaper than ElevenLabs, 15s voice cloning.
 * Replaces Python fish_audio.py.
 */
import fs from 'fs/promises';
import path from 'path';

const API_BASE = 'https://api.fish.audio/v1';
const API_KEY = process.env.FISH_AUDIO_API_KEY ?? '';

export async function generate(
  text: string,
  outputPath: string,
  options: { voiceId?: string; referenceAudio?: string } = {},
): Promise<string> {
  if (!API_KEY) throw new Error('FISH_AUDIO_API_KEY not set');

  const headers: Record<string, string> = { 'Authorization': `Bearer ${API_KEY}` };
  let response: Response;

  if (options.referenceAudio) {
    const formData = new FormData();
    formData.append('text', text);
    formData.append('format', 'mp3');
    const audioData = await fs.readFile(options.referenceAudio);
    formData.append('reference_audio', new Blob([audioData]), path.basename(options.referenceAudio));
    response = await fetch(`${API_BASE}/tts`, { method: 'POST', headers, body: formData });
  } else {
    headers['Content-Type'] = 'application/json';
    const body: Record<string, unknown> = { text, format: 'mp3' };
    if (options.voiceId) body.reference_id = options.voiceId;
    response = await fetch(`${API_BASE}/tts`, { method: 'POST', headers, body: JSON.stringify(body) });
  }

  if (!response.ok) throw new Error(`Fish Audio ${response.status}: ${await response.text()}`);

  const buffer = Buffer.from(await response.arrayBuffer());
  await fs.mkdir(path.dirname(outputPath), { recursive: true });
  await fs.writeFile(outputPath, buffer);
  console.log(`[Fish Audio] Saved: ${outputPath} (${(buffer.length / 1024).toFixed(0)} KB)`);
  return outputPath;
}

export async function clone(referenceAudio: string, name: string): Promise<string> {
  if (!API_KEY) throw new Error('FISH_AUDIO_API_KEY not set');

  const audioData = await fs.readFile(referenceAudio);
  const formData = new FormData();
  formData.append('audio', new Blob([audioData]), path.basename(referenceAudio));
  formData.append('name', name);

  const response = await fetch(`${API_BASE}/models`, {
    method: 'POST',
    headers: { 'Authorization': `Bearer ${API_KEY}` },
    body: formData,
  });

  if (!response.ok) throw new Error(`Fish Audio clone ${response.status}`);
  const result = await response.json() as Record<string, string>;
  return result.id ?? result.model_id ?? '';
}
