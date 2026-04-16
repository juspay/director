/**
 * generate-voiceover.mjs
 *
 * Generates per-scene TTS voiceover files for the Tara Skills video template.
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
 *   ELEVENLABS_API_KEY=sk_... node scripts/generate-voiceover.mjs
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
  { id: '01-title', text: 'Tara has Skills now. A new feature for everyone using Tara.' },
  { id: '02-what', text: "Skills are elaborate steps or instructions for repetitive tasks. Create them once, and Tara reuses them whenever they're needed." },
  { id: '03-commands', text: 'Four slash commands run the show. Skill-create, skill-update, skill-list, and skill-delete. These commands only work inside the tara-skills channel.' },
  { id: '04-flow', text: 'Each command raises a request. Once approved, the skill goes live, and Tara picks it up automatically.' },
  { id: '05-scope', text: 'Skills are scoped. Make them global, or specific to a single channel.' },
  { id: '06-example1', text: "Here's an A C L Finder skill. Instructions tell Tara where to find A C L definitions in the dashboard codebase." },
  { id: '07-example2', text: 'A Jira-first coding skill creates a ticket in the example project before any implementation begins.' },
  { id: '08-example3', text: "And a Blend UI skill — always use the shared component library instead of raw markup." },
  { id: '09-coming-soon', text: 'And coming soon — Tara will start creating skills for you, automatically.' },
  { id: '10-outro', text: 'Try it out today. Build what matters. Not XYNE.' },
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
