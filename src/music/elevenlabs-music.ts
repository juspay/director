/**
 * ElevenLabs music generation via sound-generation endpoint.
 */
import fs from 'fs/promises';
import path from 'path';

const API_KEY = process.env.ELEVENLABS_API_KEY ?? '';

export async function generateMusic(prompt: string, outputPath: string, durationHint = 22): Promise<string> {
  if (!API_KEY) throw new Error('ELEVENLABS_API_KEY not set');

  const response = await fetch('https://api.elevenlabs.io/v1/sound-generation', {
    method: 'POST',
    headers: { 'xi-api-key': API_KEY, 'Content-Type': 'application/json' },
    body: JSON.stringify({ text: prompt, duration_seconds: durationHint }),
  });

  if (!response.ok) throw new Error(`ElevenLabs music ${response.status}`);
  const buffer = Buffer.from(await response.arrayBuffer());
  await fs.mkdir(path.dirname(outputPath), { recursive: true });
  await fs.writeFile(outputPath, buffer);
  console.log(`[ElevenLabs Music] Saved: ${outputPath} (${(buffer.length / 1024).toFixed(0)} KB)`);
  return outputPath;
}
