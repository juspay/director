/** Feed the ORIGINAL and the REPRODUCTION to Gemini; get a faithfulness verdict. */
import { uploadAndWait, videoPart, generate } from './gemini-lib.mjs';

const [a, b] = process.argv.slice(2);
if (!a || !b) {
  console.error('usage: node compare-fidelity.mjs <original.mp4> <repro.mp4>');
  process.exit(1);
}
const fa = await uploadAndWait(a);
const fb = await uploadAndWait(b);
const prompt = `Video A is the ORIGINAL 3D announcement (Recurly × JUSPAY Hyperswitch "Live Now").
Video B is a REPRODUCTION attempt built in three.js/Remotion.

Judge how faithfully B reproduces A. Be concrete and fair.
1. FAITHFULNESS SCORE 0–100 (0 = unrelated, 100 = indistinguishable).
2. What B gets RIGHT (bullets).
3. Top differences to fix, ORDERED BY VISUAL IMPACT (bullets) — cover: overall look/lighting/DOF, floor/background, camera motion & framing, keycap material & depth, brand logo accuracy, text/typography, per-scene layout & timing, and any missing elements.
4. A one-line verdict.
Video A is first, Video B is second.`;
const { text } = await generate({
  parts: [videoPart(fa, 4), videoPart(fb, 4), { text: prompt }],
  model: 'gemini-2.5-pro',
  maxOutputTokens: 8192,
});
console.log(text);
