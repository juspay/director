/**
 * Google Lyria music generation via Gemini API.
 */
import fs from 'fs/promises';
import path from 'path';

const GEMINI_API_KEY = process.env.GEMINI_API_KEY ?? '';

export const MOOD_PRESETS = {
  product_demo: [{ time: 0, mood: 'contemplative' }, { time: 40, mood: 'building' }, { time: 80, mood: 'energetic' }, { time: 120, mood: 'resolving' }],
  problem_solution: [{ time: 0, mood: 'tense' }, { time: 60, mood: 'hopeful' }, { time: 120, mood: 'celebratory' }],
} as const;

export async function generateTrack(
  outputPath: string,
  options: { duration?: number; prompt?: string; key?: string; moodPreset?: keyof typeof MOOD_PRESETS } = {},
): Promise<string> {
  if (!GEMINI_API_KEY) throw new Error('GEMINI_API_KEY not set');
  const prompt = buildPrompt(options);

  console.log(`[Lyria] Generating ${options.duration ?? 170}s track...`);

  const response = await fetch('https://generativelanguage.googleapis.com/v1beta/models/lyria-3-pro:generateContent', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-goog-api-key': GEMINI_API_KEY,
    },
    body: JSON.stringify({
      contents: [{ parts: [{ text: prompt }] }],
      generationConfig: { response_modalities: ['AUDIO'] },
    }),
  });

  if (!response.ok) throw new Error(`Lyria ${response.status}: ${(await response.text()).slice(0, 300)}`);
  const result = await response.json() as Record<string, Array<Record<string, Record<string, Array<Record<string, Record<string, string>>>>>>>;

  const audioPart = result.candidates?.[0]?.content?.parts?.find((p) => p.inlineData?.mimeType?.startsWith('audio/'));
  if (!audioPart?.inlineData?.data) throw new Error('No audio in response');

  await fs.mkdir(path.dirname(outputPath), { recursive: true });
  await fs.writeFile(outputPath, Buffer.from(audioPart.inlineData.data, 'base64'));
  console.log(`[Lyria] Saved: ${outputPath}`);
  return outputPath;
}

function buildPrompt(opts: { duration?: number; prompt?: string; key?: string; moodPreset?: string }): string {
  const parts = [opts.prompt ?? 'Cinematic background music for a tech product video. Warm electronic with ambient textures.'];
  parts.push(`Duration: ${opts.duration ?? 170} seconds. Key: ${opts.key ?? 'Ab major'}.`);
  parts.push('Mix at low volume suitable for narration overlay. Include strategic silence moments.');
  return parts.join(' ');
}
