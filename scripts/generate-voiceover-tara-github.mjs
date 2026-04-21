/**
 * generate-voiceover-tara-github.mjs
 *
 * Generates per-scene TTS voiceover files for the Tara GitHub Support video template.
 * Outputs MP3 files to public/voiceover/ and a durations.json manifest.
 *
 * Required env vars:
 *   ELEVENLABS_API_KEY   — your ElevenLabs API key
 *
 * Optional env vars:
 *   ELEVENLABS_VOICE_ID  — voice to use (default: Bella hpp4J3VqNfWAUOO0d1Us, premade, free-tier OK)
 *   ELEVENLABS_MODEL_ID  — TTS model (default: eleven_multilingual_v2)
 *
 * Usage:
 *   ELEVENLABS_API_KEY=sk_... node scripts/generate-voiceover-tara-github.mjs
 */
import { writeFileSync, mkdirSync } from 'node:fs';
import { join } from 'node:path';
import { parseFile } from 'music-metadata';

const API_KEY = process.env.ELEVENLABS_API_KEY;
if (!API_KEY) {
  console.error('Error: set ELEVENLABS_API_KEY in your environment');
  console.error('  export ELEVENLABS_API_KEY=sk_...');
  process.exit(1);
}

const VOICE_ID = process.env.ELEVENLABS_VOICE_ID || 'hpp4J3VqNfWAUOO0d1Us';
const MODEL_ID = process.env.ELEVENLABS_MODEL_ID || 'eleven_multilingual_v2';

const VOICE_SETTINGS = {
  stability: 0.5,
  similarity_boost: 0.75,
  style: 0.35,
  use_speaker_boost: true,
};

const SCENES = [
  { id: '01-title', text: 'Tara just learned a new language. The language of GitHub.' },
  { id: '02-recap', text: 'You already know what Tara does. She reads your threads, plans with you, and ships code — straight from Slack.' },
  { id: '03-drop', text: 'Until today, she built on Bitbucket. From today, she builds on GitHub too.' },
  { id: '04-flow', text: 'Same conversation. Same thread. Same Tara. Context gathered. Repo cloned. Branch configured. Code analyzed. Changes implemented. Commit pushed. Pull request created.' },
  { id: '05-where', text: 'Point her at any GitHub repository your team has access to. Public, private, mono-repo, micro-repo — she handles them the same way.' },
  { id: '06-example1', text: "Drop a GitHub issue link in a thread. Say fix this. Tara reads the issue, traces the code, opens a pull request with the fix." },
  { id: '07-example2', text: 'Share a Figma and a GitHub repo. Tara plans the feature, implements it, and pushes a P R for review — no context switch.' },
  { id: '08-example3', text: "Tag Tara on a GitHub P R. She reviews it the way a senior engineer would — line by line, with reasoning." },
  { id: '09-next', text: 'This is one of seven capabilities rolling out in Phase 1. Watch this thread.' },
  { id: '10-outro', text: 'Build what matters. Now on GitHub too.' },
];

const outDir = join('public', 'voiceover');
mkdirSync(outDir, { recursive: true });

const durations = {};

for (const scene of SCENES) {
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
