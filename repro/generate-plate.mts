/**
 * Two-stage atmospheric plate for the Recurly x Hyperswitch reproduction.
 *
 * NeuroLink's video tool in this build is image-to-video only ("Video
 * generation requires an input image") across every provider, so this follows
 * the repo's documented b-roll path: generate a keyframe with the image
 * generator, then animate that keyframe. Replicate is not involved.
 */
import fs from 'fs/promises';
import path from 'path';
import { NeuroLink } from '@juspay/neurolink';
import { generateImage } from '../src/generators/image.ts';
import { generate } from '../src/generators/index.ts';
import type { VideoProvider } from '../src/types/index.ts';

const OUT = process.argv[2] ?? '/tmp/plate';
const SEED_IMAGE = process.argv[3]; // optional: animate an existing still instead
await fs.mkdir(OUT, { recursive: true });

const LOOK =
  'Abstract high-key 3D render: many soft rounded white and pale-grey panels ' +
  'and cards laid across a bright light-grey surface, dappled sunlight moving ' +
  'over them like light through leaves, shallow depth of field, soft ambient ' +
  'shadows, occasional small accents of cobalt blue and warm yellow, clean ' +
  'minimal corporate aesthetic, dreamy and premium.';

const keyframe = path.join(OUT, 'plate-key.png');
if (SEED_IMAGE) {
  await fs.copyFile(SEED_IMAGE, keyframe);
  console.log(`[plate] seeded keyframe from ${SEED_IMAGE}`);
} else {
  await generateImage(`${LOOK} No text, no logos, no people, no watermarks.`, keyframe, {
    aspectRatio: '9:16',
  });
}

const MOTION =
  'Very slow gentle camera drift across the scene while soft dappled light ' +
  'moves over the panels. Subtle, continuous, dreamlike. Nothing enters or ' +
  'leaves frame. No text, no logos, no people.';

type Attempt = { provider: VideoProvider; model?: string; length: number };
const ATTEMPTS: Attempt[] = [
  { provider: 'vertex', model: 'veo-3.1-generate-preview', length: 8 },
  { provider: 'vertex', model: 'veo-3.0-generate-001', length: 8 },
  { provider: 'kling', length: 10 },
  { provider: 'runway', length: 10 },
];

const nl = new NeuroLink();
const summary: string[] = [];
for (const a of ATTEMPTS) {
  const tag = `${a.provider}${a.model ? `-${a.model}` : ''}`;
  const dest = path.join(OUT, `plate-${tag}.mp4`);
  console.log(`\n=== ${tag} (${a.length}s, i2v) ===`);
  try {
    const t0 = Date.now();
    await generate(nl, a.provider, MOTION, dest, {
      model: a.model,
      inputImage: keyframe,
      aspectRatio: '9:16',
      length: a.length,
      resolution: '1080p',
      audio: false,
    });
    const secs = ((Date.now() - t0) / 1000).toFixed(1);
    const size = (await fs.stat(dest)).size;
    console.log(`OK ${tag} ${size}B ${secs}s -> ${dest}`);
    summary.push(`OK ${tag} ${size}B ${secs}s`);
    break;
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    console.log(`FAIL ${tag}: ${msg.slice(0, 260)}`);
    summary.push(`FAIL ${tag}: ${msg.slice(0, 150)}`);
  }
}
console.log('\n--- summary ---');
summary.forEach((s) => console.log(s));
