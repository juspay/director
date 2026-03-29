/**
 * ElevenLabs TTS provider — TypeScript port using fetch.
 * Replaces Python elevenlabs_generator.py.
 */
import fs from 'fs/promises';
import path from 'path';

const API_BASE = 'https://api.elevenlabs.io/v1';
const API_KEY = process.env.ELEVENLABS_API_KEY ?? '';
const VOICE_ID = process.env.ELEVENLABS_VOICE_ID ?? '1qEiC6qsybMkmnNdVMbK';
const MODEL = 'eleven_v3';

export interface ElevenLabsOptions {
  stability?: number;
  similarityBoost?: number;
  style?: number;
  speakerBoost?: boolean;
}

export async function generate(
  text: string,
  outputPath: string,
  options: ElevenLabsOptions = {},
): Promise<string> {
  if (!API_KEY) throw new Error('ELEVENLABS_API_KEY not set');

  const response = await fetch(`${API_BASE}/text-to-speech/${VOICE_ID}`, {
    method: 'POST',
    headers: {
      'xi-api-key': API_KEY,
      'Content-Type': 'application/json',
      'Accept': 'audio/mpeg',
    },
    body: JSON.stringify({
      text,
      model_id: MODEL,
      output_format: 'mp3_44100_128',
      voice_settings: {
        stability: options.stability ?? 0.55,
        similarity_boost: options.similarityBoost ?? 0.80,
        style: options.style ?? 0.35,
        use_speaker_boost: options.speakerBoost ?? true,
      },
    }),
  });

  if (!response.ok) {
    throw new Error(`ElevenLabs API ${response.status}: ${await response.text()}`);
  }

  const buffer = Buffer.from(await response.arrayBuffer());
  await fs.mkdir(path.dirname(outputPath), { recursive: true });
  await fs.writeFile(outputPath, buffer);
  console.log(`[ElevenLabs] Saved: ${outputPath} (${(buffer.length / 1024).toFixed(0)} KB)`);
  return outputPath;
}

export async function generateSfx(
  prompt: string,
  outputPath: string,
  durationSeconds?: number,
): Promise<string> {
  if (!API_KEY) throw new Error('ELEVENLABS_API_KEY not set');

  const body: Record<string, unknown> = { text: prompt, prompt_influence: 0.3 };
  if (durationSeconds) body.duration_seconds = durationSeconds;

  const response = await fetch(`${API_BASE}/sound-generation`, {
    method: 'POST',
    headers: { 'xi-api-key': API_KEY, 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });

  if (!response.ok) throw new Error(`ElevenLabs SFX ${response.status}`);

  const buffer = Buffer.from(await response.arrayBuffer());
  await fs.mkdir(path.dirname(outputPath), { recursive: true });
  await fs.writeFile(outputPath, buffer);
  return outputPath;
}
