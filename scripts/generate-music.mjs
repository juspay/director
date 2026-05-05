/**
 * generate-music.mjs
 *
 * Config-driven background music generator. Reads
 * video-production/library/configs/<video>.json and writes music-01.mp3
 * into the configured outDir. Tries the ElevenLabs Music API first
 * (paid plans), falls back to the Sound Effects API on the free tier.
 *
 * Required env vars:
 *   ELEVENLABS_API_KEY — your ElevenLabs API key
 *
 * Usage:
 *   ELEVENLABS_API_KEY=sk_... node scripts/generate-music.mjs <video-name>
 *   e.g. node scripts/generate-music.mjs hippocampus
 *        node scripts/generate-music.mjs tara-skills
 */
import { readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import { join } from 'node:path';
import { parseFile } from 'music-metadata';

const API_KEY = process.env.ELEVENLABS_API_KEY;
if (!API_KEY) {
  console.error('Error: set ELEVENLABS_API_KEY');
  process.exit(1);
}

const videoName = process.argv[2];
if (!videoName) {
  console.error('Error: pass a video name as the first argument.');
  console.error('  node scripts/generate-music.mjs <video-name>');
  process.exit(1);
}

const configPath = join('video-production', 'library', 'configs', `${videoName}.json`);
let config;
try {
  config = JSON.parse(readFileSync(configPath, 'utf8'));
} catch (err) {
  console.error(`Error reading config ${configPath}: ${err.message}`);
  process.exit(1);
}

const PROMPT = config.music.prompt;
const DURATION_MS = config.music.durationMs;
const SFX_FALLBACK_SECONDS = config.music.sfxFallbackSeconds ?? 22.0;

const outDir = join('public', 'voiceover', config.name);
mkdirSync(outDir, { recursive: true });

async function tryMusicApi() {
  console.log('Trying Music API (paid plans)...');
  const resp = await fetch('https://api.elevenlabs.io/v1/music', {
    method: 'POST',
    headers: { 'xi-api-key': API_KEY, 'Content-Type': 'application/json', Accept: 'audio/mpeg' },
    body: JSON.stringify({ prompt: PROMPT, music_length_ms: DURATION_MS }),
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
  console.log(`Using Sound Effects API (free tier, ${SFX_FALLBACK_SECONDS}s chunks)...`);
  const file = join(outDir, 'music-01.mp3');
  const resp = await fetch('https://api.elevenlabs.io/v1/sound-generation', {
    method: 'POST',
    headers: { 'xi-api-key': API_KEY, 'Content-Type': 'application/json', Accept: 'audio/mpeg' },
    body: JSON.stringify({ text: PROMPT, duration_seconds: SFX_FALLBACK_SECONDS, prompt_influence: 0.5 }),
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

console.log(`\nDone. Music saved to ${join(outDir, 'music-01.mp3')}`);
