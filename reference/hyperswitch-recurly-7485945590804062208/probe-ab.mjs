/**
 * probe-ab.mjs — does the two-video A/B channel actually work?
 *
 * Comparison, not description, is the real use case, and the docs advise "one
 * video per prompt". This checks whether sending both clips in a single request
 * still recovers ground truth for EACH of them, and whether the model keeps
 * them straight rather than blending them into one description.
 *
 * Ground truth: both clips cut at frames 66/147/200/243 (the reproduction was
 * built to match), so a working A/B channel scores 4/4 on both, and a model
 * that has lost track of which clip is which will not.
 *
 * Both inputs are 720x900 and 2x-slowed: resolution-matched so no resolution
 * delta can bias the judge, and retimed so 24fps sampling (the API maximum)
 * covers every frame of a 30fps source.
 */
import fs from 'node:fs';
import path from 'node:path';
import { getAi, uploadAndWait, withRateLimitGate } from './gemini-lib.mjs';

const TRUTH = [66 / 30, 147 / 30, 200 / 30, 243 / 30];
const TOL = 0.15;
const SCRATCH = '/private/tmp/claude-501/-Users-sachinsharma-Developer-temp-director/0ede4d9c-b28d-46a2-8e82-e49c80920933/scratchpad';

const PROMPT = `You are given TWO videos of the same 3D motion-design film:
first VIDEO A (the reference), then VIDEO B (a reproduction).
Both have been slowed to 2x their real duration.

For EACH video independently, identify every HARD CUT — a single-frame boundary
where camera, layout and subject all change discontinuously. Ignore gradual
camera moves and object animations.

Then state one concrete visual difference you can see between A and B that is
NOT about resolution or sharpness.

Return ONLY JSON:
{"a_cuts":[<seconds, decimal, as observed in the slowed clip>],
 "b_cuts":[<seconds, decimal, as observed in the slowed clip>],
 "difference":"<one concrete difference>",
 "kept_them_distinct":<true|false — were you able to tell the two clips apart?>}`;

function looseJson(text) {
  try { return JSON.parse(text); } catch { /* fall through */ }
  const a = text.indexOf('{');
  if (a < 0) throw new Error('no JSON object');
  let depth = 0, inStr = false, esc = false;
  for (let i = a; i < text.length; i++) {
    const c = text[i];
    if (inStr) { if (esc) esc = false; else if (c === '\\') esc = true; else if (c === '"') inStr = false; continue; }
    if (c === '"') inStr = true;
    else if (c === '{') depth++;
    else if (c === '}' && --depth === 0) return JSON.parse(text.slice(a, i + 1));
  }
  throw new Error('unterminated JSON');
}

function score(cuts) {
  const pred = [...cuts].sort((a, b) => a - b);
  const taken = new Set();
  let hits = 0;
  const errs = [];
  for (const t of TRUTH) {
    let best = -1, bestErr = Infinity;
    for (let i = 0; i < pred.length; i++) {
      if (taken.has(i)) continue;
      const e = Math.abs(pred[i] - t);
      if (e < bestErr) { bestErr = e; best = i; }
    }
    if (best >= 0 && bestErr <= TOL) { taken.add(best); hits++; errs.push(bestErr); }
  }
  return { hits, fp: pred.length - hits, err: errs.length ? errs.reduce((a, b) => a + b, 0) / errs.length : null };
}

const [A, B] = await Promise.all([
  uploadAndWait(path.join(SCRATCH, 'target_slow2x.mp4')),
  uploadAndWait(path.join(SCRATCH, 'repro_slow2x.mp4')),
]);
console.log('uploaded A=reference B=reproduction (both 720x900, 2x slowed)\n');

const MODELS = ['gemini-3.1-pro-preview', 'gemini-3.5-flash'];
const N = 3;
const rows = [];

for (const model of MODELS) {
  for (let r = 0; r < N; r++) {
    const parts = [
      { text: 'VIDEO A (reference):' },
      { fileData: { fileUri: A.uri, mimeType: A.mimeType }, videoMetadata: { fps: 24 } },
      { text: 'VIDEO B (reproduction):' },
      { fileData: { fileUri: B.uri, mimeType: B.mimeType }, videoMetadata: { fps: 24 } },
      { text: PROMPT },
    ];
    const t0 = Date.now();
    try {
      const ai = getAi();
      const resp = await withRateLimitGate(() =>
        ai.models.generateContent({
          model,
          contents: [{ role: 'user', parts }],
          config: {
            mediaResolution: 'MEDIA_RESOLUTION_MEDIUM',
            temperature: 0.1,
            maxOutputTokens: 8192,
            responseMimeType: 'application/json',
          },
        }),
      );
      const j = looseJson(resp.text ?? '');
      const a = score((j.a_cuts ?? []).map((x) => Number(x) / 2).filter(Number.isFinite));
      const b = score((j.b_cuts ?? []).map((x) => Number(x) / 2).filter(Number.isFinite));
      console.log(
        `${model.padEnd(24)} run${r + 1}  A ${a.hits}/4 (err ${a.err?.toFixed(3) ?? '—'})  ` +
          `B ${b.hits}/4 (err ${b.err?.toFixed(3) ?? '—'})  distinct=${j.kept_them_distinct}  ` +
          `${resp.usageMetadata?.promptTokenCount}tok ${((Date.now() - t0) / 1000).toFixed(0)}s`,
      );
      if (r === 0) console.log(`    diff: ${j.difference}`);
      rows.push({ model, run: r, a, b, j, tok: resp.usageMetadata?.promptTokenCount });
    } catch (e) {
      console.log(`${model.padEnd(24)} run${r + 1}  ERROR: ${String(e.message).slice(0, 120)}`);
      rows.push({ model, run: r, error: String(e.message).slice(0, 200) });
    }
  }
}

fs.mkdirSync(path.join(import.meta.dirname, 'analysis'), { recursive: true });
fs.writeFileSync(path.join(import.meta.dirname, 'analysis', 'probe-ab.json'), JSON.stringify(rows, null, 2));
console.log('\n-> analysis/probe-ab.json');
