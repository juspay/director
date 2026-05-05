/**
 * generate-voiceover.mjs
 *
 * Config-driven TTS voiceover generator. Reads
 * video-production/library/configs/<video>.json and writes per-scene MP3s
 * plus a durations.json manifest into the configured outDir.
 *
 * Required env vars:
 *   ELEVENLABS_API_KEY   — your ElevenLabs API key
 *
 * Optional env vars (override config values):
 *   ELEVENLABS_VOICE_ID  — voice to use
 *   ELEVENLABS_MODEL_ID  — TTS model
 *
 * Usage:
 *   ELEVENLABS_API_KEY=sk_... node scripts/generate-voiceover.mjs <video-name>
 *   e.g. node scripts/generate-voiceover.mjs hippocampus
 *        node scripts/generate-voiceover.mjs tara-skills
 */
import { readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import { join } from 'node:path';
import { parseFile } from 'music-metadata';

const API_KEY = process.env.ELEVENLABS_API_KEY;
if (!API_KEY) {
  console.error('Error: set ELEVENLABS_API_KEY in your environment');
  console.error('  export ELEVENLABS_API_KEY=sk_...');
  process.exit(1);
}

const videoName = process.argv[2];
if (!videoName) {
  console.error('Error: pass a video name as the first argument.');
  console.error('  node scripts/generate-voiceover.mjs <video-name>');
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

const VOICE_ID = process.env.ELEVENLABS_VOICE_ID || config.voice.voiceId;
const MODEL_ID = process.env.ELEVENLABS_MODEL_ID || config.voice.modelId;
const VOICE_SETTINGS = config.voice.settings;

const outDir = join('public', 'voiceover', config.name);
mkdirSync(outDir, { recursive: true });

const durations = {};

for (const scene of config.scenes) {
  process.stdout.write(`Generating ${scene.id}... `);
  const resp = await fetch(
    `https://api.elevenlabs.io/v1/text-to-speech/${VOICE_ID}`,
    {
      method: 'POST',
      headers: { 'xi-api-key': API_KEY, 'Content-Type': 'application/json', Accept: 'audio/mpeg' },
      body: JSON.stringify({ text: scene.text, model_id: MODEL_ID, voice_settings: VOICE_SETTINGS }),
    },
  );
  if (!resp.ok) {
    console.error(`\nFailed ${scene.id}: ${resp.status}`);
    console.error(await resp.text());
    process.exit(1);
  }
  const buf = Buffer.from(await resp.arrayBuffer());
  const file = join(outDir, `${scene.id}.mp3`);
  writeFileSync(file, buf);
  const meta = await parseFile(file);
  durations[scene.id] = meta.format.duration ?? 4;
  console.log(`${durations[scene.id].toFixed(2)}s`);
}

writeFileSync(join(outDir, 'durations.json'), JSON.stringify(durations, null, 2) + '\n');
const total = Object.values(durations).reduce((a, b) => a + b, 0);
console.log(`\nAll voiceovers generated. Total speech: ${total.toFixed(2)}s`);
