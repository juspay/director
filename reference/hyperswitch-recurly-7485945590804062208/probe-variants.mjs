/**
 * probe-variants.mjs — repeatability + technique sweep for video analysis.
 *
 * probe-video-analysis.mjs established that gemini-2.5-pro at default settings
 * scores 0/4 on ground-truth cut detection. This answers the follow-ups that
 * one run cannot:
 *
 *   1. Is a config REPEATABLE, or was 4/4 luck? (N runs each)
 *   2. Does retiming the clip 2x slower beat raw fps=24? The API caps sampling
 *      at 24fps but the source is 30fps, so 6 of every 30 frames are never
 *      seen; slowing to 15fps lets 24fps sampling cover every frame.
 *   3. Does per-part media resolution (Part.mediaResolution, which reaches
 *      levels the global GenerationConfig enum does not expose) help?
 *
 * Two harness bugs from the first version are fixed here, both of which
 * produced false negatives:
 *   - the slowed-clip variant asked the MODEL to halve its own timestamps;
 *     it often did not. Rescaling now happens in code.
 *   - responseMimeType=json still occasionally yields trailing text, which
 *     crashed the run rather than scoring it. Parsing is now lenient.
 */
import fs from 'node:fs';
import path from 'node:path';
import { getAi, uploadAndWait, withRateLimitGate } from './gemini-lib.mjs';

const TRUTH = [66 / 30, 147 / 30, 200 / 30, 243 / 30];
const TOL = 0.15;
const SCRATCH = '/private/tmp/claude-501/-Users-sachinsharma-Developer-temp-director/0ede4d9c-b28d-46a2-8e82-e49c80920933/scratchpad';

const PROMPT = `This is a 3D motion-design film at 30fps.

Identify every HARD CUT — a single-frame boundary where camera, layout and
subject all change discontinuously. Do NOT report gradual camera moves,
dissolves, or object animations as cuts.

Return ONLY JSON: {"cuts":[{"t":<seconds, decimal>,"what_changes":"<short>"}],"shot_count":<int>}`;

/** Extract the first JSON object even when the model appends prose. */
function looseJson(text) {
  try { return JSON.parse(text); } catch { /* fall through */ }
  const a = text.indexOf('{');
  if (a < 0) throw new Error('no JSON object in response');
  let depth = 0, inStr = false, esc = false;
  for (let i = a; i < text.length; i++) {
    const c = text[i];
    if (inStr) { if (esc) esc = false; else if (c === '\\') esc = true; else if (c === '"') inStr = false; continue; }
    if (c === '"') inStr = true;
    else if (c === '{') depth++;
    else if (c === '}' && --depth === 0) return JSON.parse(text.slice(a, i + 1));
  }
  throw new Error('unterminated JSON object');
}

async function gen({ parts, model, mediaRes }) {
  const ai = getAi();
  const config = { temperature: 0.1, maxOutputTokens: 8192, responseMimeType: 'application/json' };
  if (mediaRes) config.mediaResolution = `MEDIA_RESOLUTION_${mediaRes.toUpperCase()}`;
  const resp = await withRateLimitGate(() =>
    ai.models.generateContent({ model, contents: [{ role: 'user', parts }], config }),
  );
  return { text: resp.text ?? '', usage: resp.usageMetadata ?? {} };
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

const files = {
  native: await uploadAndWait(path.join(import.meta.dirname, 'target.mp4')),
  slow2x: await uploadAndWait(path.join(SCRATCH, 'target_slow2x.mp4')),
};
console.log('uploaded native + slow2x\n');
console.log('variant                        hits/4 per run      fp        mean err   promptTok');

const N = 5;
const VARIANTS = [
  { name: '3.1pro  fps24 med  native', src: 'native', model: 'gemini-3.1-pro-preview', fps: 24, mediaRes: 'medium', runs: N },
  { name: '3.5flash fps24 med native', src: 'native', model: 'gemini-3.5-flash', fps: 24, mediaRes: 'medium', runs: N },
  { name: '3.1pro  fps24 med  slow2x', src: 'slow2x', model: 'gemini-3.1-pro-preview', fps: 24, mediaRes: 'medium', runs: N, scale: 2 },
  { name: '3.5flash fps24 med slow2x', src: 'slow2x', model: 'gemini-3.5-flash', fps: 24, mediaRes: 'medium', runs: N, scale: 2 },
  { name: '3.1pro  fps24 partHIGH   ', src: 'native', model: 'gemini-3.1-pro-preview', fps: 24, partRes: 'MEDIA_RESOLUTION_HIGH', runs: 2 },
  { name: '3.1pro  fps24 partULTRA  ', src: 'native', model: 'gemini-3.1-pro-preview', fps: 24, partRes: 'MEDIA_RESOLUTION_ULTRA_HIGH', runs: 2 },
  { name: '2.5pro  fps1  low BASELINE', src: 'native', model: 'gemini-2.5-pro', fps: 1, mediaRes: 'low', runs: 2 },
];

const rows = [];
for (const v of VARIANTS) {
  const f = files[v.src];
  const results = [];
  for (let r = 0; r < v.runs; r++) {
    const vp = { fileData: { fileUri: f.uri, mimeType: f.mimeType }, videoMetadata: { fps: v.fps } };
    if (v.partRes) vp.mediaResolution = { level: v.partRes };
    try {
      const { text, usage } = await gen({ parts: [vp, { text: PROMPT }], model: v.model, mediaRes: v.mediaRes });
      const j = looseJson(text);
      // Rescale in code — asking the model to divide its own timestamps was
      // unreliable and scored as a miss when it simply did not comply.
      const cuts = (j.cuts ?? []).map((x) => Number(x.t) / (v.scale ?? 1)).filter(Number.isFinite);
      results.push({ ...score(cuts), cuts, tok: usage.promptTokenCount });
    } catch (e) {
      results.push({ hits: null, error: String(e.message).slice(0, 100) });
    }
  }
  const ok = results.filter((r) => r.hits !== null);
  const errs = ok.map((r) => r.err).filter((e) => e !== null);
  const mean = (a) => (a.length ? a.reduce((x, y) => x + y, 0) / a.length : null);
  const m = mean(ok.map((r) => r.hits));
  console.log(
    `${v.name}  ${ok.map((r) => r.hits).join(',').padEnd(12)} ` +
      `avg ${m === null ? ' — ' : m.toFixed(1)}  ` +
      `fp ${ok.map((r) => r.fp).join(',').padEnd(9)} ` +
      `${errs.length ? mean(errs).toFixed(3) + 's' : '  —   '}  ` +
      `${ok[0]?.tok ?? '?'}` +
      (results.some((r) => r.error) ? `   ERR: ${results.find((r) => r.error).error}` : ''),
  );
  rows.push({ ...v, results });
}

fs.mkdirSync(path.join(import.meta.dirname, 'analysis'), { recursive: true });
fs.writeFileSync(path.join(import.meta.dirname, 'analysis', 'probe-variants.json'), JSON.stringify(rows, null, 2));
console.log('\n-> analysis/probe-variants.json');
