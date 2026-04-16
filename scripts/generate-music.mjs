/**
 * generate-music.mjs
 *
 * Generates background music for the Tara Skills video template.
 * Uses the ElevenLabs Music API (paid plans) or Sound Effects API (free tier).
 *
 * Required env vars:
 *   ELEVENLABS_API_KEY — your ElevenLabs API key
 *
 * Usage:
 *   ELEVENLABS_API_KEY=sk_... node scripts/generate-music.mjs
 */
import { writeFileSync, mkdirSync } from 'node:fs';
import { join } from 'node:path';
import { parseFile } from 'music-metadata';

const API_KEY = process.env.ELEVENLABS_API_KEY;
if (!API_KEY) {
  console.error('Error: set ELEVENLABS_API_KEY');
  process.exit(1);
}

const PROMPT =
  'Upbeat optimistic corporate tech soundtrack, light playful synth arpeggios, soft electronic drums, warm bassline, modern product launch vibe, friendly and motivating, instrumental only, no vocals';

// Try the Music API first (paid plans), fall back to Sound Effects API (free tier)
const outDir = join('public', 'voiceover');
mkdirSync(outDir, { recursive: true });

async function tryMusicApi() {
  console.log('Trying Music API (paid plans)...');
  const resp = await fetch('https://api.elevenlabs.io/v1/music', {
    method: 'POST',
    headers: { 'xi-api-key': API_KEY, 'Content-Type': 'application/json', Accept: 'audio/mpeg' },
    body: JSON.stringify({ prompt: PROMPT, music_length_ms: 62000 }),
  });
  if (resp.ok) {
    const buf = Buffer.from(await resp.arrayBuffer());
    const file = join(outDir, 'music-01.mp3');
    writeFileSync(file, buf);
    const meta = await parseFile(file);
    console.log(`Music API success: ${meta.format.duration?.toFixed(2)}s`);
    return true;
  }
  console.log(`Music API returned ${resp.status}, falling back to Sound Effects API...`);
  return false;
}

async function trySfxApi() {
  console.log('Using Sound Effects API (free tier, 22s chunks)...');
  const file = join(outDir, 'music-01.mp3');
  const resp = await fetch('https://api.elevenlabs.io/v1/sound-generation', {
    method: 'POST',
    headers: { 'xi-api-key': API_KEY, 'Content-Type': 'application/json', Accept: 'audio/mpeg' },
    body: JSON.stringify({ text: PROMPT, duration_seconds: 22.0, prompt_influence: 0.5 }),
  });
  if (!resp.ok) {
    console.error(`SFX API failed: ${resp.status}`);
    console.error(await resp.text());
    process.exit(1);
  }
  const buf = Buffer.from(await resp.arrayBuffer());
  writeFileSync(file, buf);
  const meta = await parseFile(file);
  console.log(`SFX API success: ${meta.format.duration?.toFixed(2)}s (will loop in composition)`);
}

const musicOk = await tryMusicApi();
if (!musicOk) await trySfxApi();

console.log('\nDone. Music saved to public/voiceover/music-01.mp3');
