/**
 * OpenAI gpt-4o-mini-tts provider — prompt-steerable delivery.
 * Replaces Python openai_tts.py.
 */
import fs from 'fs/promises';
import path from 'path';

const API_KEY = process.env.OPENAI_API_KEY ?? '';

export type Voice = 'alloy' | 'ash' | 'ballad' | 'coral' | 'echo' | 'fable' | 'onyx' | 'nova' | 'sage' | 'shimmer';

export const DELIVERY_PRESETS = {
  contemplative_build: 'Begin with quiet, intimate contemplation. Gradually build confidence. End with warm resolve.',
  storyteller: 'Seasoned storyteller. Varied pacing — slow for drama, quick for excitement.',
  ted_talk: 'Confident, polished TED talk delivery. Strategic pauses. Building to powerful conclusion.',
  documentary: 'Authoritative documentary narrator. Measured, clear, gravitas on key stats.',
  founder_pitch: 'Passionate founder. Genuine excitement, urgency on problems, pride on solutions.',
} as const;

export async function generate(
  text: string,
  outputPath: string,
  options: { voice?: Voice; deliveryPrompt?: string; speed?: number } = {},
): Promise<string> {
  if (!API_KEY) throw new Error('OPENAI_API_KEY not set');

  const body: Record<string, unknown> = {
    model: 'gpt-4o-mini-tts',
    voice: options.voice ?? 'nova',
    input: text,
    response_format: 'mp3',
    speed: options.speed ?? 1.0,
  };
  if (options.deliveryPrompt) body.instructions = options.deliveryPrompt;

  const response = await fetch('https://api.openai.com/v1/audio/speech', {
    method: 'POST',
    headers: { 'Authorization': `Bearer ${API_KEY}`, 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });

  if (!response.ok) throw new Error(`OpenAI TTS ${response.status}: ${await response.text()}`);

  const buffer = Buffer.from(await response.arrayBuffer());
  await fs.mkdir(path.dirname(outputPath), { recursive: true });
  await fs.writeFile(outputPath, buffer);
  console.log(`[OpenAI TTS] Saved: ${outputPath} (${(buffer.length / 1024).toFixed(0)} KB)`);
  return outputPath;
}
