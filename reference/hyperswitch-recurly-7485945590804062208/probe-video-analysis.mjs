/**
 * probe-video-analysis.mjs — does our video analysis actually work?
 *
 * Every analysis pass so far has been trusted without ever being tested. This
 * scores each candidate configuration against ground truth we established
 * NUMERICALLY (frame-differencing, see evidence/AUDIT.md): the reference has
 * exactly four hard cuts, at frames 66 / 147 / 200 / 243 of 435 @30fps —
 * t = 2.200 / 4.900 / 6.667 / 8.100 s.
 *
 * A config that cannot recover four cuts it was never told about is not an
 * analyser, and nothing it says about craft can be trusted either.
 *
 *   node probe-video-analysis.mjs <video.mp4> [--only <name>]
 */
import fs from 'node:fs';
import path from 'node:path';
import { getAi, uploadAndWait, generate, withRateLimitGate } from './gemini-lib.mjs';

const VIDEO = process.argv[2] || path.join(import.meta.dirname, 'target.mp4');
const only = process.argv.includes('--only') ? process.argv[process.argv.indexOf('--only') + 1] : null;

/** Cuts measured by frame differencing, in seconds. */
const TRUTH = [66 / 30, 147 / 30, 200 / 30, 243 / 30];
const TOL = 0.15; // seconds

const PROMPT = `This is a 14.5-second 3D motion-design film at 30fps.

Identify every HARD CUT — a single-frame boundary where the camera, layout and
subject all change discontinuously. Do not report gradual camera moves,
dissolves, or object animations as cuts.

Return ONLY JSON, no prose:
{"cuts":[{"t":<seconds, decimal, as precise as you can>,"what_changes":"<short>"}],
 "shot_count":<int>,
 "notes":"<one line on how confident you are in the timings>"}`;

/**
 * Configurations under test. `fps` is the videoMetadata sampling rate — the
 * API caps it at 24.0 (discovery doc: "The fps range is (0.0, 24.0]"), and it
 * defaults to 1.0, which is what every previous pass silently used.
 */
const CONFIGS = [
  { name: '2.5pro-fps1-low', model: 'gemini-2.5-pro', fps: 1, mediaRes: 'low' },
  { name: '2.5pro-fps24-low', model: 'gemini-2.5-pro', fps: 24, mediaRes: 'low' },
  { name: '2.5pro-fps24-med', model: 'gemini-2.5-pro', fps: 24, mediaRes: 'medium' },
  { name: '3.1pro-fps1-low', model: 'gemini-3.1-pro-preview', fps: 1, mediaRes: 'low' },
  { name: '3.1pro-fps24-low', model: 'gemini-3.1-pro-preview', fps: 24, mediaRes: 'low' },
  { name: '3.1pro-fps24-med', model: 'gemini-3.1-pro-preview', fps: 24, mediaRes: 'medium' },
  { name: '3-pro-fps24-low', model: 'gemini-3-pro-preview', fps: 24, mediaRes: 'low' },
];

/** gemini-lib's generate() only maps high/low; medium needs the raw enum. */
async function gen({ parts, model, mediaRes, maxOutputTokens = 8192 }) {
  const ai = getAi();
  const config = {
    mediaResolution: `MEDIA_RESOLUTION_${mediaRes.toUpperCase()}`,
    temperature: 0.1,
    maxOutputTokens,
    responseMimeType: 'application/json',
  };
  const resp = await withRateLimitGate(() =>
    ai.models.generateContent({ model, contents: [{ role: 'user', parts }], config }),
  );
  return { text: resp.text ?? '', usage: resp.usageMetadata ?? {} };
}

/** Greedy 1:1 match of predicted cuts to truth within TOL. */
function score(cuts) {
  const pred = [...cuts].sort((a, b) => a - b);
  const taken = new Set();
  const matched = [];
  for (const t of TRUTH) {
    let best = -1;
    let bestErr = Infinity;
    for (let i = 0; i < pred.length; i++) {
      if (taken.has(i)) continue;
      const e = Math.abs(pred[i] - t);
      if (e < bestErr) { bestErr = e; best = i; }
    }
    if (best >= 0 && bestErr <= TOL) { taken.add(best); matched.push({ t, got: pred[best], err: bestErr }); }
    else matched.push({ t, got: null, err: null });
  }
  const hits = matched.filter((m) => m.got !== null).length;
  const errs = matched.filter((m) => m.err !== null).map((m) => m.err);
  return {
    hits,
    missed: TRUTH.length - hits,
    false_positives: pred.length - hits,
    mean_err: errs.length ? errs.reduce((a, b) => a + b, 0) / errs.length : null,
    matched,
  };
}

const file = await uploadAndWait(VIDEO);
console.log(`uploaded ${path.basename(VIDEO)} -> ${file.uri}\n`);
console.log(`ground truth cuts: ${TRUTH.map((t) => t.toFixed(3)).join(', ')} s (tolerance ±${TOL}s)\n`);

const rows = [];
for (const c of CONFIGS) {
  if (only && c.name !== only) continue;
  const parts = [
    { fileData: { fileUri: file.uri, mimeType: file.mimeType }, videoMetadata: { fps: c.fps } },
    { text: PROMPT },
  ];
  const t0 = Date.now();
  try {
    const { text, usage } = await gen({ parts, model: c.model, mediaRes: c.mediaRes });
    const j = JSON.parse(text);
    const cuts = (j.cuts ?? []).map((x) => Number(x.t)).filter((n) => Number.isFinite(n));
    const s = score(cuts);
    rows.push({ ...c, ...s, cuts, secs: (Date.now() - t0) / 1000, tokens: usage.promptTokenCount, notes: j.notes });
    console.log(
      `${c.name.padEnd(20)} hits ${s.hits}/4  fp ${s.false_positives}  ` +
        `err ${s.mean_err === null ? '  —  ' : s.mean_err.toFixed(3) + 's'}  ` +
        `[${cuts.map((x) => x.toFixed(2)).join(' ')}]  ${usage.promptTokenCount}tok ${((Date.now() - t0) / 1000).toFixed(0)}s`,
    );
  } catch (e) {
    rows.push({ ...c, error: String(e.message).slice(0, 160) });
    console.log(`${c.name.padEnd(20)} ERROR: ${String(e.message).slice(0, 160)}`);
  }
}

const out = path.join(import.meta.dirname, 'analysis', 'probe-results.json');
fs.mkdirSync(path.dirname(out), { recursive: true });
fs.writeFileSync(out, JSON.stringify({ video: VIDEO, truth: TRUTH, tolerance: TOL, rows }, null, 2));
console.log(`\n-> ${out}`);
