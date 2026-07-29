/**
 * analyze-seconds-v2.mjs — per-second A/B craft analysis, on video.
 *
 * Replaces analyze-seconds.mjs, which sent inline PNG stills and therefore gave
 * the model no temporal signal at all while asking it to judge motion. Scored
 * against ground truth that pipeline found 0 of 4 hard cuts; see
 * VIDEO-ANALYSIS-METHOD.md.
 *
 * Three changes carry the difference:
 *
 * 1. BOTH COMPLETE VIDEOS, as video, in one request — resolution-matched and
 *    retimed 2x so 24fps sampling (the API maximum) covers every frame of a
 *    30fps source. Windowing each second with startOffset/endOffset was tried
 *    and is cheaper (4.3k vs 88k tokens) but measurably worse: with only ~1.4s
 *    of footage the model cannot separate a hard cut from a fast camera move,
 *    and it missed cuts it finds reliably with the whole clip in hand. Context
 *    is what makes the judgement possible, so every call gets all of it and is
 *    merely asked to REPORT on one second.
 *
 * 2. A GROUND-TRUTH CHECK ON EVERY CALL. Each response must also report which
 *    of the four known cuts fall in its second. A response that gets that wrong
 *    is discarded rather than believed — the analyser proves itself per call.
 *
 * 3. REPRODUCIBILITY AS A FILTER. Every second is analysed N times
 *    independently and only claims that recur are kept. The previous pass's
 *    specific assertions were often false (it called 30 moving frames
 *    "identical", and a measured (82,129,239) blue "#0000FF") while its
 *    directional readings held up. Requiring agreement across runs keeps the
 *    latter and drops the former, which is what made the old output unusable.
 *
 *   node analyze-seconds-v2.mjs <refSlow2x.mp4> <reproSlow2x.mp4> <outDir> [--sec N] [--runs 3] [--conc 3]
 */
import fs from 'node:fs';
import path from 'node:path';
import { getAi, uploadAndWait, withRateLimitGate } from './gemini-lib.mjs';

const [refPath, reproPath, outDir] = process.argv.slice(2);
if (!refPath || !reproPath || !outDir) {
  console.error('usage: node analyze-seconds-v2.mjs <refSlow2x.mp4> <reproSlow2x.mp4> <outDir> [--sec N] [--runs 3] [--conc 3]');
  process.exit(1);
}
const arg = (k, d) => {
  const i = process.argv.indexOf(k);
  return i > -1 ? Number(process.argv[i + 1]) : d;
};
const ONLY = arg('--sec', -1);
const RUNS = arg('--runs', 3);
const CONC = arg('--conc', 3);
const MODEL = process.env.ANALYSIS_MODEL || 'gemini-3.5-flash';

/** Cuts measured by frame differencing (evidence/AUDIT.md), original timeline. */
const CUTS = [66 / 30, 147 / 30, 200 / 30, 243 / 30];
const TOTAL_SECONDS = 15;
const SCALE = 2; // both inputs are 2x slowed

fs.mkdirSync(outDir, { recursive: true });

function cutsInSecond(sec) {
  return CUTS.filter((t) => t >= sec && t < sec + 1);
}

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

const ANALYSIS_SCHEMA = {
  type: 'object',
  required: ['cuts_in_window', 'a_motion', 'b_motion', 'absent_in_b', 'differences', 'highest_impact_fix'],
  properties: {
    cuts_in_window: {
      type: 'array',
      description: 'Hard cuts falling inside the reported second, in ORIGINAL-timeline seconds.',
      items: { type: 'number' },
    },
    a_motion: {
      type: 'array',
      description: 'Everything that moves in A during this second: camera direction/speed/easing, each object, icon micro-animations, light and shadow travel, reflections.',
      items: { type: 'string' },
    },
    b_motion: { type: 'array', items: { type: 'string' } },
    absent_in_b: {
      type: 'array',
      description: 'Things present in A this second and entirely missing from B.',
      items: { type: 'string' },
    },
    differences: {
      type: 'array',
      description: 'Ranked, most damaging first.',
      items: {
        type: 'object',
        required: ['category', 'a_does', 'b_does', 'fix', 'severity'],
        properties: {
          category: { type: 'string', enum: ['motion', 'staging', 'lighting', 'material', 'color', 'typography', 'layout', 'camera'] },
          a_does: { type: 'string' },
          b_does: { type: 'string' },
          fix: { type: 'string', description: 'Specific and actionable; quantify in frames/degrees/percent where possible.' },
          severity: { type: 'integer', description: '1 = cosmetic, 5 = the reason it reads as a different film.' },
        },
      },
    },
    highest_impact_fix: { type: 'string' },
  },
};

function promptFor(sec) {
  const known = cutsInSecond(sec);
  return `You are given TWO complete videos of the same 3D motion-design film:
first VIDEO A (the professionally produced reference), then VIDEO B (a
reproduction). Both are 720x900 and have been SLOWED TO 2x their real duration
so every frame is visible.

TIMESTAMPS: report everything in ORIGINAL-timeline seconds — halve any timestamp
you observe in these slowed clips. The original film is 14.5s at 30fps, so
original second ${sec} spans observed time ${sec * SCALE}s-${(sec + 1) * SCALE}s in the clips you were given.

YOUR TASK: analyse **ORIGINAL SECOND ${sec}** — original frames ${sec * 30}-${sec * 30 + 29}. You have
both complete films for context, but report ONLY on that second.

Judge CRAFT, not content inventory. Both films contain roughly the same objects.
B still reads as obviously not the original and I need to know precisely why, in
terms a lighting TD or animator can act on. Be blunt and specific. Do not praise,
do not summarise the content, and do not mention resolution or sharpness — the
clips are resolution-matched.

${known.length ? `Note: a hard cut occurs during this second, at original t=${known.map((t) => t.toFixed(3)).join(' and ')}s.` : 'Note: no hard cut occurs during this second.'}
Report in cuts_in_window the cuts you actually observe inside this second, in
original-timeline seconds — this is a check on your own timing accuracy, so
report what you see rather than what you were told.`;
}

async function analyzeOnce(sec, files) {
  const ai = getAi();
  const parts = [
    { text: 'VIDEO A (reference):' },
    { fileData: { fileUri: files.a.uri, mimeType: files.a.mimeType }, videoMetadata: { fps: 24 } },
    { text: 'VIDEO B (reproduction):' },
    { fileData: { fileUri: files.b.uri, mimeType: files.b.mimeType }, videoMetadata: { fps: 24 } },
    { text: promptFor(sec) },
  ];
  const resp = await withRateLimitGate(() =>
    ai.models.generateContent({
      model: MODEL,
      contents: [{ role: 'user', parts }],
      config: {
        mediaResolution: 'MEDIA_RESOLUTION_MEDIUM',
        temperature: 0.35, // some spread, so agreement across runs means something
        maxOutputTokens: 16384,
        responseMimeType: 'application/json',
        responseJsonSchema: ANALYSIS_SCHEMA,
      },
    }),
  );
  return { json: looseJson(resp.text ?? ''), tokens: resp.usageMetadata?.promptTokenCount };
}

/** A run is trusted only if its self-reported cut timings match ground truth. */
function verifyRun(sec, j) {
  const expect = cutsInSecond(sec);
  const got = (j.cuts_in_window ?? []).map(Number).filter(Number.isFinite);
  if (got.length !== expect.length) return { ok: false, why: `reported ${got.length} cuts, truth has ${expect.length}` };
  for (const t of expect) {
    if (!got.some((g) => Math.abs(g - t) <= 0.15)) return { ok: false, why: `missed cut at ${t.toFixed(3)}s (got ${got.map((x) => x.toFixed(2)).join(',')})` };
  }
  return { ok: true };
}

/**
 * Keep only what independent runs agree on. Text matching across paraphrases is
 * the one job worth handing back to the model; the cheap-model dedup is checked
 * by requiring it to cite which runs support each surviving claim.
 */
async function consolidate(sec, runs) {
  const ai = getAi();
  const prompt = `${runs.length} independent analyses of the same second of the same two videos are below.
They were produced separately and disagree in places. Individual runs are known
to hallucinate specifics.

Keep ONLY findings corroborated by AT LEAST ${Math.min(2, runs.length)} of the ${runs.length} analyses. A finding counts as
corroborated when runs describe the same underlying defect, even in different
words. Drop everything else — a claim made once is noise.

Return JSON:
{"agreed_differences":[{"category":"...","a_does":"...","b_does":"...","fix":"...","severity":<1-5>,"supported_by":<count>}],
 "agreed_absent_in_b":["..."],
 "highest_impact_fix":"...",
 "dropped_unsupported":<count of single-run claims discarded>}

${runs.map((r, i) => `--- ANALYSIS ${i + 1} ---\n${JSON.stringify(r, null, 1)}`).join('\n\n')}`;
  const resp = await withRateLimitGate(() =>
    ai.models.generateContent({
      model: MODEL,
      contents: [{ role: 'user', parts: [{ text: prompt }] }],
      // Consolidation embeds three full analyses and re-emits the surviving
      // subset; at 16384 it truncated mid-object on the densest seconds and
      // took the whole second down with it.
      config: { temperature: 0.1, maxOutputTokens: 65536, responseMimeType: 'application/json' },
    }),
  );
  return looseJson(resp.text ?? '');
}

function render(sec, consolidated, meta) {
  const d = (consolidated.agreed_differences ?? []).sort((a, b) => (b.severity ?? 0) - (a.severity ?? 0));
  return `# Second ${sec} — original frames ${sec * 30}-${sec * 30 + 29}

_${meta.verified}/${meta.attempted} runs passed the ground-truth timing check; ${consolidated.dropped_unsupported ?? '?'} single-run claims discarded._

## Highest-impact fix
${consolidated.highest_impact_fix ?? '—'}

## Corroborated differences
${d.length === 0 ? '_None survived corroboration._' : d.map((x) => `### [sev ${x.severity}] ${x.category} — ${x.supported_by}/${meta.verified} runs
- **A:** ${x.a_does}
- **B:** ${x.b_does}
- **Fix:** ${x.fix}`).join('\n\n')}

## Present in A, absent in B
${(consolidated.agreed_absent_in_b ?? []).length === 0 ? '_Nothing corroborated._' : consolidated.agreed_absent_in_b.map((x) => `- ${x}`).join('\n')}
`;
}

const files = {
  a: await uploadAndWait(refPath),
  b: await uploadAndWait(reproPath),
};
console.log(`uploaded A=${path.basename(refPath)} B=${path.basename(reproPath)} | model ${MODEL} | ${RUNS} runs/second\n`);

const secs = ONLY >= 0 ? [ONLY] : Array.from({ length: TOTAL_SECONDS }, (_, i) => i);
const todo = secs.filter((s) => !fs.existsSync(path.join(outDir, `sec-${String(s).padStart(2, '0')}.md`)));

let idx = 0;
const summary = [];
await Promise.all(
  Array.from({ length: Math.min(CONC, todo.length) }, async () => {
    while (idx < todo.length) {
      const sec = todo[idx++];
      try {
        const good = [];
        const rejected = [];
        for (let r = 0; r < RUNS; r++) {
          try {
            const { json } = await analyzeOnce(sec, files);
            const v = verifyRun(sec, json);
            if (v.ok) good.push(json);
            else rejected.push(v.why);
          } catch (e) {
            rejected.push(String(e.message).slice(0, 80));
          }
        }
        if (good.length === 0) {
          console.log(`[sec ${sec}] ALL ${RUNS} RUNS REJECTED: ${rejected.join(' | ')}`);
          summary.push({ sec, verified: 0, attempted: RUNS, rejected });
          continue;
        }
        const consolidated = await consolidate(sec, good);
        const meta = { verified: good.length, attempted: RUNS };
        fs.writeFileSync(path.join(outDir, `sec-${String(sec).padStart(2, '0')}.md`), render(sec, consolidated, meta));
        fs.writeFileSync(path.join(outDir, `sec-${String(sec).padStart(2, '0')}.json`), JSON.stringify({ sec, meta, rejected, runs: good, consolidated }, null, 2));
        const n = (consolidated.agreed_differences ?? []).length;
        console.log(`[sec ${sec}] ${good.length}/${RUNS} runs verified · ${n} corroborated · dropped ${consolidated.dropped_unsupported ?? '?'} — ${consolidated.highest_impact_fix?.slice(0, 90) ?? ''}`);
        summary.push({ sec, verified: good.length, attempted: RUNS, corroborated: n, dropped: consolidated.dropped_unsupported, top: consolidated.highest_impact_fix });
      } catch (e) {
        console.error(`[sec ${sec}] FAILED: ${String(e.message).slice(0, 160)}`);
      }
    }
  }),
);

summary.sort((a, b) => a.sec - b.sec);
fs.writeFileSync(path.join(outDir, 'summary.json'), JSON.stringify(summary, null, 2));
console.log(`\n-> ${outDir}`);
