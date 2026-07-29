/**
 * Per-second A/B craft analysis.
 *
 * Earlier passes measured the reproduction numerically (frame deltas, Laplacian
 * energy). That caught structure — cuts, stalls, clipping — but says nothing
 * about design or animation *craft*, which is what still reads as wrong.
 *
 * This walks the clip one second at a time and sends EVERY frame of that second
 * from both videos to Gemini, interleaved and labelled, asking for concrete
 * differences in motion and design rather than a score.
 *
 *   node analyze-seconds.mjs <refFramesDir> <reproFramesDir> <outDir> [--sec N] [--conc N]
 *
 * Frame dirs contain 001.png … 435.png at 30fps.
 */
import fs from 'node:fs';
import path from 'node:path';
import { generate, inlineImagePart } from './gemini-lib.mjs';

const [refDir, reproDir, outDir] = process.argv.slice(2);
if (!refDir || !reproDir || !outDir) {
  console.error('usage: node analyze-seconds.mjs <refFrames> <reproFrames> <outDir> [--sec N] [--conc N]');
  process.exit(1);
}
const arg = (k, d) => {
  const i = process.argv.indexOf(k);
  return i > -1 ? Number(process.argv[i + 1]) : d;
};
const ONLY = arg('--sec', -1);
const CONC = arg('--conc', 3);
const FPS = 30;
const TOTAL = 435;
fs.mkdirSync(outDir, { recursive: true });

const PROMPT = `You are a senior 3D motion-design director reviewing a reproduction against its reference.

You are given, for ONE SECOND of a 14.5s 3D product-launch film, every frame from:
  - A = THE REFERENCE (the professionally produced original)
  - B = THE REPRODUCTION (an attempt to recreate it)
Frames are interleaved in shooting order and labelled "A f<N>" / "B f<N>".

Judge CRAFT, not content inventory. Both have roughly the same objects; the
reproduction still reads as obviously not the original, and I need to know
precisely why, in terms an animator/lighting TD can act on.

Answer with these headings, concretely, referencing specific frame numbers:

## 1. What actually animates in A this second
Every moving thing: camera (direction, speed, whether it accelerates or holds),
each object, each icon micro-animation, light sweeps, shadow movement,
reflections travelling across surfaces. State the EASING you infer (linear /
ease-out / overshoot / settle) and over how many frames.

## 2. What animates in B this second
Same list. Explicitly note anything in A that is entirely ABSENT in B.

## 3. Motion-craft differences (ranked, most damaging first)
For each: what A does, what B does, and the specific change B needs. Be
quantitative where you can (frames, degrees, percentages).

## 4. Design/render-craft differences (ranked)
Materials, shading, shadow softness/contact, edge highlights, bevels, gradient
direction, colour temperature, contrast, typography weight/tracking/position,
icon construction, layout rhythm and spacing. Say what makes A look
photographed and B look like a viewport render.

## 5. The single highest-impact fix for this second
One sentence.

Be blunt and specific. Do not praise. Do not summarise the content.`;

async function analyzeSecond(sec) {
  const from = sec * FPS + 1;
  const to = Math.min(from + FPS - 1, TOTAL);
  const parts = [{ text: PROMPT }, { text: `\n--- SECOND ${sec} (frames ${from - 1}..${to - 1}) ---\n` }];
  for (let f = from; f <= to; f++) {
    const name = String(f).padStart(3, '0') + '.png';
    const a = path.join(refDir, name);
    const b = path.join(reproDir, name);
    if (!fs.existsSync(a) || !fs.existsSync(b)) continue;
    parts.push({ text: `A f${f - 1}` }, inlineImagePart(a));
    parts.push({ text: `B f${f - 1}` }, inlineImagePart(b));
  }
  const { text } = await generate({ parts, mediaRes: 'high', maxOutputTokens: 16384, temperature: 0.15 });
  const out = path.join(outDir, `sec-${String(sec).padStart(2, '0')}.md`);
  fs.writeFileSync(out, `# Second ${sec} — frames ${from - 1}..${to - 1}\n\n${text}\n`);
  console.log(`[sec ${sec}] ${text.length} chars -> ${out}`);
}

const secs = ONLY >= 0 ? [ONLY] : Array.from({ length: Math.ceil(TOTAL / FPS) }, (_, i) => i);
const todo = secs.filter((s) => !fs.existsSync(path.join(outDir, `sec-${String(s).padStart(2, '0')}.md`)));
console.log(`analysing ${todo.length} second(s) with concurrency ${CONC}`);

let idx = 0;
await Promise.all(
  Array.from({ length: Math.min(CONC, todo.length) }, async () => {
    while (idx < todo.length) {
      const s = todo[idx++];
      try {
        await analyzeSecond(s);
      } catch (e) {
        console.error(`[sec ${s}] FAILED: ${e.message.slice(0, 200)}`);
      }
    }
  }),
);
console.log('done');
