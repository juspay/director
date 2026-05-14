/**
 * generate-voiceover-edge.mjs
 *
 * Local preview shim. Generates per-scene voiceover MP3s using Microsoft's
 * free edge-tts (no API key needed) instead of ElevenLabs. Mirrors the
 * output shape of generate-voiceover.mjs so the Remotion composition can
 * consume the result identically.
 *
 * NOT committed — used only when ELEVENLABS_API_KEY is unavailable for a
 * preview render. Regenerate with the official ElevenLabs script before
 * the final cut.
 *
 * Requires: edge-tts (pip install edge-tts), ffprobe (ffmpeg).
 *
 * Usage:
 *   node scripts/generate-voiceover-edge.mjs <video-name> [voice]
 *   e.g. node scripts/generate-voiceover-edge.mjs tara-sensors en-US-AriaNeural
 */
import { readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import { join } from 'node:path';
import { execFileSync } from 'node:child_process';

const videoName = process.argv[2];
const voice = process.argv[3] || 'en-US-AriaNeural';

if (!videoName) {
  console.error('Error: pass a video name as the first argument.');
  process.exit(1);
}

const configPath = join('video-production', 'library', 'configs', `${videoName}.json`);
const config = JSON.parse(readFileSync(configPath, 'utf8'));

const outDir = join('public', 'voiceover', config.name);
mkdirSync(outDir, { recursive: true });

const durations = {};

for (const scene of config.scenes) {
  process.stdout.write(`Generating ${scene.id} (${voice})... `);
  const file = join(outDir, `${scene.id}.mp3`);
  execFileSync('edge-tts', ['--voice', voice, '--text', scene.text, '--write-media', file], {
    stdio: ['ignore', 'ignore', 'inherit'],
  });
  const probe = execFileSync('ffprobe', [
    '-v', 'error', '-show_entries', 'format=duration',
    '-of', 'default=noprint_wrappers=1:nokey=1', file,
  ]).toString().trim();
  const dur = parseFloat(probe) || 4;
  durations[scene.id] = dur;
  console.log(`${dur.toFixed(2)}s`);
}

writeFileSync(join(outDir, 'durations.json'), JSON.stringify(durations, null, 2) + '\n');
const total = Object.values(durations).reduce((a, b) => a + b, 0);
console.log(`\nAll voiceovers generated. Total speech: ${total.toFixed(2)}s`);
