/**
 * analyze-seconds-v3.mjs — per-second A/B analysis with claim verification.
 *
 * v2 established the perception layer (both complete 2x-retimed videos, fps=24,
 * ground-truth cut gating, 3-run corroboration). v3 adds what
 * VERIFICATION-DESIGN.md specifies on top: between "the model saw correctly"
 * and "the claim is true" there was nothing, and 2/2 agreement once endorsed a
 * vignette that pixel measurement disproved.
 *
 *   Layer 0  three gated runs (unchanged from v2)
 *   Layer 1  citation firewall — every claim carries t + observables; claims in
 *            measurable categories must PREDICT what a measurement will show,
 *            or they are rejected before the vote
 *   Layer 2  measure.py settles predictions against the ORIGINAL-timebase
 *            pixels; the vote is irrelevant for measurable claims; vetoes are
 *            logged so the model's per-category false-positive rate accumulates
 *   Layer 3  semantic claims default-REJECT unless eyewitness-supported:
 *            channel B (Gemini, ±0.75s clip re-check) runs here; channel A
 *            (Claude reading the cited full-res frames) is prepared as a task
 *            manifest and applied by eyewitness-apply.mjs
 *
 * Takes ORIGINAL-timebase videos and derives the 2x-retimed copies itself —
 * measurement and eyewitness extraction need the originals anyway.
 *
 *   node analyze-seconds-v3.mjs <refOriginal.mp4> <reproOriginal.mp4> <outDir>
 *        [--sec N] [--runs 3] [--conc 3]
 */
import { execFileSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';
import { getAi, uploadCached, getOrCreateContextCache, withRateLimitGate } from './gemini-lib.mjs';

const [refPath, reproPath, outDir] = process.argv.slice(2);
if (!refPath || !reproPath || !outDir) {
  console.error('usage: node analyze-seconds-v3.mjs <refOriginal.mp4> <reproOriginal.mp4> <outDir> [--sec N] [--runs 3] [--conc 3]');
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
const HERE = path.dirname(new URL(import.meta.url).pathname);
const MEASURE = path.join(HERE, 'measure.py');

const CUTS = [66 / 30, 147 / 30, 200 / 30, 243 / 30];
const TOTAL_SECONDS = 15;
const SCALE = 2;

for (const d of ['runs', 'clips', 'eyewitness']) fs.mkdirSync(path.join(outDir, d), { recursive: true });

/* ------------------------------------------------------------- plumbing -- */

const cutsInSecond = (sec) => CUTS.filter((t) => t >= sec && t < sec + 1);

function looseJson(text) {
  try { return JSON.parse(text); } catch { /* fall through */ }
  const a = text.indexOf('{');
  if (a < 0) throw new Error('no JSON object in response');
  const stack = [];
  let inStr = false, esc = false;
  for (let i = a; i < text.length; i++) {
    const c = text[i];
    if (inStr) { if (esc) esc = false; else if (c === '\\') esc = true; else if (c === '"') inStr = false; continue; }
    if (c === '"') inStr = true;
    else if (c === '{' || c === '[') stack.push(c);
    else if (c === '}' || c === ']') { stack.pop(); if (stack.length === 0) return JSON.parse(text.slice(a, i + 1)); }
  }
  // Seen in the wild with finishReason=STOP: the model emits a complete,
  // valid document minus its final closing brace(s). Close whatever is still
  // open and parse that; genuinely mangled output still throws below.
  let tail = text.slice(a).replace(/[\s,]+$/, '');
  if (inStr) tail += '"';
  for (let i = stack.length - 1; i >= 0; i--) tail += stack[i] === '{' ? '}' : ']';
  return JSON.parse(tail);
}

/** 2x-retimed derivative, cached next to the analysis output. */
function slow2x(src, name) {
  const out = path.join(outDir, name);
  if (!fs.existsSync(out)) {
    execFileSync('ffmpeg', ['-v', 'error', '-i', src, '-vf', 'setpts=2.0*PTS', '-r', '15',
      '-an', '-c:v', 'libx264', '-crf', '14', '-preset', 'veryfast', '-y', out]);
  }
  return out;
}

/* --------------------------------------------------------------- schema -- */

/**
 * Categories split by measurability (VERIFICATION-DESIGN.md): color, motion
 * and lighting claims MUST predict a measurement — lighting was made mandatory
 * at doc review after the sec-7 smoke test, where the one lighting claim that
 * volunteered a prediction turned out to have its shadow direction backwards.
 * A lighting claim that cannot be phrased as one of the five metrics cannot be
 * made. Camera may predict when photometric; the rest are semantic and go to
 * the eyewitness channels.
 */
const MEASURABLE_REQUIRED = new Set(['color', 'motion', 'lighting']);
const METRIC_EXPECTS = {
  vignette: ['A_stronger', 'B_stronger'],
  color_cast: ['A_cooler', 'B_cooler', 'A_more_saturated', 'B_more_saturated'],
  luma_curve: ['A_deeper_blacks', 'B_deeper_blacks', 'A_deeper_shadows', 'B_deeper_shadows',
    'A_brighter_highlights', 'B_brighter_highlights', 'A_higher_contrast', 'B_higher_contrast'],
  motion: ['A_more', 'B_more'],
  region_sharpness: ['A_sharper', 'B_sharper'],
};
const REGIONS = ['full', 'center', 'left', 'right', 'top', 'bottom', 'corners'];

const ANALYSIS_SCHEMA = {
  type: 'object',
  required: ['cuts_in_window', 'a_motion', 'b_motion', 'absent_in_b', 'differences', 'highest_impact_fix'],
  properties: {
    cuts_in_window: { type: 'array', items: { type: 'number' } },
    a_motion: { type: 'array', items: { type: 'string' } },
    b_motion: { type: 'array', items: { type: 'string' } },
    absent_in_b: { type: 'array', items: { type: 'string' } },
    differences: {
      type: 'array',
      items: {
        type: 'object',
        required: ['category', 't', 'a_observable', 'b_observable', 'fix', 'severity', 'prediction'],
        properties: {
          category: { type: 'string', enum: ['motion', 'staging', 'lighting', 'material', 'color', 'typography', 'layout', 'camera'] },
          t: { type: 'number', description: 'ORIGINAL-timeline second where the difference is most visible; must fall inside the reported second.' },
          a_observable: { type: 'string', description: 'What is VISIBLE in A at t. An observation, never advice.' },
          b_observable: { type: 'string', description: 'What is VISIBLE in B at t.' },
          fix: { type: 'string', description: 'Advisory only; never counts as evidence.' },
          severity: { type: 'integer' },
          prediction: {
            type: 'object',
            required: ['metric', 'expect'],
            properties: {
              metric: { type: 'string', enum: ['none', 'vignette', 'color_cast', 'luma_curve', 'motion', 'region_sharpness'] },
              expect: { type: 'string' },
              region: { type: 'string', enum: REGIONS },
            },
          },
        },
      },
    },
    highest_impact_fix: { type: 'string' },
  },
};

const VERDICT_SCHEMA = {
  type: 'object',
  required: ['verdict', 'certainty', 'note'],
  properties: {
    verdict: { type: 'string', enum: ['supported', 'refuted', 'cannot_tell'] },
    certainty: { type: 'number' },
    note: { type: 'string' },
  },
};

/* --------------------------------------------------------------- layer 0 -- */

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

Judge CRAFT, not content inventory. Be blunt and specific. Do not praise, do not
summarise content, and do not mention resolution or sharpness of the encode —
the clips are resolution-matched.

RULES OF EVIDENCE — claims that break these are discarded unread:
1. a_observable / b_observable state what is VISIBLE, never what to do about it.
   "B's corners are as bright as its centre" is evidence; "add a vignette" is
   not. Advice goes only in "fix".
2. Every claim carries "t": the ORIGINAL-timeline moment (inside this second)
   where the difference is clearest. Your claims will be checked against pixels
   extracted at exactly that time.
3. Claims about COLOR, MOTION or LIGHTING are settled by measurement, so they
   MUST carry a prediction naming what the measurement will show. A lighting
   claim you cannot phrase as one of these measurements is a claim you cannot
   make — rephrase it photometrically or leave it out. Available metrics and
   the exact "expect" values:
     vignette:          A_stronger | B_stronger  (corner-vs-centre luma falloff)
     color_cast:        A_cooler | B_cooler | A_more_saturated | B_more_saturated
     luma_curve:        A_deeper_blacks | B_deeper_blacks | A_deeper_shadows |
                        B_deeper_shadows | A_brighter_highlights |
                        B_brighter_highlights | A_higher_contrast | B_higher_contrast
     motion:            A_more | B_more  (mean frame delta over the second)
     region_sharpness:  A_sharper | B_sharper  (requires "region": one of
                        full|center|left|right|top|bottom|corners)
   CAMERA claims should also carry a prediction when the claim is photometric
   (brightness, falloff, focus). If the measurement refutes your
   prediction the claim is dropped no matter how confident you are — so only
   assert differences you expect to survive pixels.
4. Claims about materials, typography, layout or staging use metric "none";
   they will be re-verified by an independent eyewitness pass on the exact
   frames you cite, so cite the moment where the difference is unmistakable.

${known.length ? `Note: a hard cut occurs during this second, at original t=${known.map((t) => t.toFixed(3)).join(' and ')}s.` : 'Note: no hard cut occurs during this second.'}
Report in cuts_in_window the cuts you actually observe inside this second, in
original-timeline seconds — this is a check on your own timing accuracy, so
report what you see rather than what you were told.`;
}

async function analyzeOnce(sec, ctx) {
  const ai = getAi();
  const config = {
    mediaResolution: 'MEDIA_RESOLUTION_MEDIUM',
    temperature: 0.35,
    maxOutputTokens: 32768,
    responseMimeType: 'application/json',
    responseJsonSchema: ANALYSIS_SCHEMA,
  };
  let parts;
  if (ctx.cache) {
    config.cachedContent = ctx.cache.name;
    parts = [{ text: promptFor(sec) }];
  } else {
    parts = [...ctx.prefixParts, { text: promptFor(sec) }];
  }
  const resp = await withRateLimitGate(() =>
    ai.models.generateContent({ model: MODEL, contents: [{ role: 'user', parts }], config }),
  );
  return looseJson(resp.text ?? '');
}

function verifyRun(sec, j) {
  const expect = cutsInSecond(sec);
  const got = (j.cuts_in_window ?? []).map(Number).filter(Number.isFinite);
  if (got.length !== expect.length) return { ok: false, why: `reported ${got.length} cuts, truth has ${expect.length}` };
  for (const t of expect) {
    if (!got.some((g) => Math.abs(g - t) <= 0.15)) return { ok: false, why: `missed cut at ${t.toFixed(3)}s` };
  }
  return { ok: true };
}

/* --------------------------------------------------------------- layer 1 -- */

function layer1(sec, claims) {
  const kept = [];
  const rejected = [];
  for (const c of claims ?? []) {
    const p = c.prediction ?? { metric: 'none' };
    const t = Number(c.t);
    const why = (() => {
      if (!Number.isFinite(t) || t < sec - 0.05 || t >= sec + 1.05) return `t=${c.t} outside second ${sec}`;
      if (!c.a_observable?.trim() || !c.b_observable?.trim()) return 'missing observables';
      if (MEASURABLE_REQUIRED.has(c.category) && (!p.metric || p.metric === 'none')) {
        return `${c.category} claim carries no prediction`;
      }
      if (p.metric && p.metric !== 'none') {
        if (!METRIC_EXPECTS[p.metric]) return `unknown metric ${p.metric}`;
        if (!METRIC_EXPECTS[p.metric].includes(p.expect)) return `invalid expect '${p.expect}' for ${p.metric}`;
        if (p.metric === 'region_sharpness' && !REGIONS.includes(p.region)) return 'region_sharpness without region';
      }
      return null;
    })();
    if (why) rejected.push({ claim: c, why });
    else kept.push({ ...c, prediction: p });
  }
  return { kept, rejected };
}

/* --------------------------------------------------------------- layer 2 -- */

function measureCheck(prediction, t) {
  const pred = { ...prediction, t };
  const out = execFileSync('python3', [MEASURE, 'check', JSON.stringify(pred), refPath, reproPath],
    { encoding: 'utf8', timeout: 180000 });
  return JSON.parse(out);
}

/* --------------------------------------------------------------- layer 3 -- */

/** ±0.75s clip around t, 2x-retimed, small enough to send inline. */
function clipAt(src, tag, t) {
  const key = `${tag}-${t.toFixed(2)}.mp4`;
  const out = path.join(outDir, 'clips', key);
  if (!fs.existsSync(out)) {
    const start = Math.max(0, t - 0.75);
    execFileSync('ffmpeg', ['-v', 'error', '-ss', start.toFixed(3), '-i', src, '-t', '1.5',
      '-vf', 'setpts=2.0*PTS', '-r', '15', '-an', '-c:v', 'libx264', '-crf', '16', '-preset', 'veryfast', '-y', out]);
  }
  return out;
}

async function eyewitnessGemini(claim) {
  const ai = getAi();
  const t = Number(claim.t);
  const clipA = clipAt(refPath, 'a', t);
  const clipB = clipAt(reproPath, 'b', t);
  const inline = (p) => ({ inlineData: { mimeType: 'video/mp4', data: fs.readFileSync(p).toString('base64') }, videoMetadata: { fps: 24 } });
  const parts = [
    { text: 'CLIP A (reference):' }, inline(clipA),
    { text: 'CLIP B (reproduction):' }, inline(clipB),
    { text: `Both clips cover the same moment (original t=${t.toFixed(2)}s, slowed 2x, ±0.75s of context).

A prior analysis made this claim about the difference between them:
  - about A: ${claim.a_observable}
  - about B: ${claim.b_observable}

Verify ONLY this claim against what these clips actually show.
"supported" requires BOTH halves to hold as stated. "refuted" means either half
is contradicted by what you see. "cannot_tell" means the clips do not show
enough to decide. Do not consider plausibility — only pixels.` },
  ];
  const resp = await withRateLimitGate(() =>
    ai.models.generateContent({
      model: MODEL,
      contents: [{ role: 'user', parts }],
      config: {
        mediaResolution: 'MEDIA_RESOLUTION_MEDIUM',
        temperature: 0,
        maxOutputTokens: 4096,
        responseMimeType: 'application/json',
        responseJsonSchema: VERDICT_SCHEMA,
      },
    }),
  );
  return looseJson(resp.text ?? '');
}

/** Full-res cited frames for channel A (Claude, applied via eyewitness-apply.mjs). */
function extractEyewitnessFrames(sec, idx, t) {
  const frames = {};
  for (const [tag, src] of [['A', refPath], ['B', reproPath]]) {
    const out = path.join(outDir, 'eyewitness', `sec-${String(sec).padStart(2, '0')}-c${idx}-${tag}.png`);
    if (!fs.existsSync(out)) {
      execFileSync('ffmpeg', ['-v', 'error', '-ss', t.toFixed(4), '-i', src, '-frames:v', '1', '-y', out]);
    }
    frames[tag] = out;
  }
  return frames;
}

/* ----------------------------------------------------------- consolidate -- */

async function consolidate(sec, allRuns) {
  const ai = getAi();
  // Only what the vote needs: full run objects (motion inventories, firewall
  // records) ballooned the prompt until the response truncated mid-object on
  // dense seconds even at 65536 output tokens.
  const runs = allRuns.map((r) => ({
    differences: r.differences,
    absent_in_b: r.absent_in_b,
    highest_impact_fix: r.highest_impact_fix,
  }));
  const prompt = `${runs.length} independent analyses of the same second of the same two videos are below.
They were produced separately and disagree in places. Individual runs are known
to hallucinate specifics.

Keep ONLY findings corroborated by AT LEAST ${Math.min(2, runs.length)} of the ${runs.length} analyses. A finding counts as
corroborated when runs describe the same underlying defect, even in different
words. Drop everything else — a claim made once is noise.

For each surviving finding copy "t" and "prediction" VERBATIM from one of its
supporting runs (prefer the median t if they differ). Never invent or alter a
prediction.

Return JSON:
{"agreed_differences":[{"category":"...","t":<sec>,"a_observable":"...","b_observable":"...","fix":"...","severity":<1-5>,"prediction":{...},"supported_by":<count>}],
 "agreed_absent_in_b":["..."],
 "highest_impact_fix":"...",
 "dropped_unsupported":<count>}

${runs.map((r, i) => `--- ANALYSIS ${i + 1} ---\n${JSON.stringify(r, null, 1)}`).join('\n\n')}`;
  const resp = await withRateLimitGate(() =>
    ai.models.generateContent({
      model: MODEL,
      contents: [{ role: 'user', parts: [{ text: prompt }] }],
      config: { temperature: 0.1, maxOutputTokens: 65536, responseMimeType: 'application/json' },
    }),
  );
  try {
    return looseJson(resp.text ?? '');
  } catch (e) {
    const dump = path.join(outDir, 'runs', `consolidate-fail-sec${String(sec).padStart(2, '0')}.txt`);
    fs.writeFileSync(dump, `finish=${resp.candidates?.[0]?.finishReason}\n\n${resp.text ?? ''}`);
    throw new Error(`${e.message} (raw dumped to ${dump})`);
  }
}

/* ---------------------------------------------------------------- render -- */

const CHIP = {
  accepted_measured: 'MEASURED ✓',
  vetoed_measured: 'MEASUREMENT VETO ✗',
  pending_eyewitness: 'eyewitness pending (channel B: %B%)',
  rejected_eyewitness: 'EYEWITNESS REFUTED ✗',
};

function render(sec, consolidated, meta) {
  const all = consolidated.agreed_differences ?? [];
  const live = all.filter((x) => x.status !== 'vetoed_measured' && x.status !== 'rejected_eyewitness');
  const dead = all.filter((x) => !live.includes(x));
  const line = (x) => {
    const chip = (CHIP[x.status] ?? x.status).replace('%B%', x.channelB?.verdict ?? '—');
    return `### [sev ${x.severity}] ${x.category} @ t=${Number(x.t).toFixed(2)}s — ${x.supported_by}/${meta.verified} runs — **${chip}**
- **A:** ${x.a_observable}
- **B:** ${x.b_observable}
- **Fix (advisory):** ${x.fix}${x.measurement ? `\n- **Measurement:** ${JSON.stringify(x.measurement.A)} vs ${JSON.stringify(x.measurement.B)}` : ''}${x.channelB?.note ? `\n- **Channel B:** ${x.channelB.note}` : ''}`;
  };
  return `# Second ${sec} — original frames ${sec * 30}-${sec * 30 + 29}

_${meta.verified}/${meta.attempted} runs passed the ground-truth timing check; ${consolidated.dropped_unsupported ?? '?'} single-run claims dropped by the vote; ${meta.layer1Rejected} rejected by the citation firewall._

## Highest-impact fix (advisory until claims verify)
${consolidated.highest_impact_fix ?? '—'}

## Verified / surviving claims
${live.length === 0 ? '_None._' : live.map(line).join('\n\n')}

## Killed in verification
${dead.length === 0 ? '_None._' : dead.map(line).join('\n\n')}

## Present in A, absent in B (corroborated, unverified inventory)
${(consolidated.agreed_absent_in_b ?? []).length === 0 ? '_Nothing corroborated._' : consolidated.agreed_absent_in_b.map((x) => `- ${x}`).join('\n')}
`;
}

/* ------------------------------------------------------------------ main -- */

const slowA = slow2x(refPath, 'ref-slow2x.mp4');
const slowB = slow2x(reproPath, 'repro-slow2x.mp4');
const files = { a: await uploadCached(slowA), b: await uploadCached(slowB) };

const prefixParts = [
  { text: 'VIDEO A (reference):' },
  { fileData: { fileUri: files.a.uri, mimeType: files.a.mimeType }, videoMetadata: { fps: 24 } },
  { text: 'VIDEO B (reproduction):' },
  { fileData: { fileUri: files.b.uri, mimeType: files.b.mimeType }, videoMetadata: { fps: 24 } },
];
const cache = await getOrCreateContextCache({ model: MODEL, parts: prefixParts });
const ctx = { cache, prefixParts };
console.log(`uploaded A+B (dedup cache) | model ${MODEL} | ${RUNS} runs/sec | context cache: ${cache ? 'ON' : 'off'}\n`);

const secs = ONLY >= 0 ? [ONLY] : Array.from({ length: TOTAL_SECONDS }, (_, i) => i);
const todo = secs.filter((s) => !fs.existsSync(path.join(outDir, `sec-${String(s).padStart(2, '0')}.md`)));
const vetoLog = path.join(outDir, 'veto-log.jsonl');

let idx = 0;
const summary = [];
await Promise.all(
  Array.from({ length: Math.min(CONC, Math.max(todo.length, 1)) }, async () => {
    while (idx < todo.length) {
      const sec = todo[idx++];
      const secTag = String(sec).padStart(2, '0');
      try {
        // Layer 0 with crash-safe per-run flushing: completed runs are reused
        // across restarts instead of being re-bought.
        const good = [];
        const rejected = [];
        let layer1Rejected = 0;
        for (let r = 0; r < RUNS; r++) {
          const runFile = path.join(outDir, 'runs', `sec-${secTag}-run-${r}.json`);
          let record;
          if (fs.existsSync(runFile)) {
            record = JSON.parse(fs.readFileSync(runFile, 'utf8'));
          } else {
            try {
              const json = await analyzeOnce(sec, ctx);
              const v = verifyRun(sec, json);
              // Rejected runs keep their JSON: when all runs fail the gate the
              // WHERE of the phantom cut is the diagnostic.
              record = v.ok ? { ok: true, json } : { ok: false, why: v.why, json };
            } catch (e) {
              record = { ok: false, why: String(e.message).slice(0, 120), transient: true };
            }
            // Transient failures (network, quota exhaustion) are NOT flushed —
            // a restart should retry them, not inherit them.
            if (!record.transient) fs.writeFileSync(runFile, JSON.stringify(record, null, 2));
          }
          if (record.ok) {
            const l1 = layer1(sec, record.json.differences);
            layer1Rejected += l1.rejected.length;
            good.push({ ...record.json, differences: l1.kept, layer1_rejected: l1.rejected });
          } else rejected.push(record.why);
        }
        if (good.length === 0) {
          console.log(`[sec ${sec}] ALL ${RUNS} RUNS REJECTED: ${rejected.join(' | ')}`);
          summary.push({ sec, verified: 0, attempted: RUNS, rejected });
          continue;
        }

        const consolidated = await consolidate(sec, good);
        const claims = consolidated.agreed_differences ?? [];
        const tasks = [];

        for (let k = 0; k < claims.length; k++) {
          const c = claims[k];
          const p = c.prediction ?? { metric: 'none' };
          if (p.metric && p.metric !== 'none') {
            // Layer 2: the measurement decides; the vote is irrelevant here.
            try {
              const m = measureCheck(p, Number(c.t));
              c.measurement = m;
              if (m.verdict === 'confirmed') c.status = 'accepted_measured';
              else if (m.verdict === 'refuted') {
                c.status = 'vetoed_measured';
                fs.appendFileSync(vetoLog, JSON.stringify({ sec, category: c.category, metric: p.metric, expect: p.expect, t: c.t, A: m.A, B: m.B }) + '\n');
              } else c.status = 'pending_eyewitness';
            } catch (e) {
              c.status = 'pending_eyewitness';
              c.measurement_error = String(e.message).slice(0, 120);
            }
          } else {
            c.status = 'pending_eyewitness';
          }

          if (c.status === 'pending_eyewitness') {
            // Layer 3 channel B first — a refute here is terminal (the
            // tie-break needs zero refuters), so channel A effort is spared.
            try {
              c.channelB = await eyewitnessGemini(c);
              if (c.channelB.verdict === 'refuted') c.status = 'rejected_eyewitness';
            } catch (e) {
              c.channelB = { verdict: 'cannot_tell', certainty: 0, note: `channel B failed: ${String(e.message).slice(0, 80)}` };
            }
            if (c.status === 'pending_eyewitness') {
              const frames = extractEyewitnessFrames(sec, k, Number(c.t));
              tasks.push({ sec, idx: k, t: c.t, category: c.category, a_observable: c.a_observable, b_observable: c.b_observable, frames, channelB: c.channelB });
            }
          }
        }

        fs.writeFileSync(path.join(outDir, 'eyewitness', `sec-${secTag}-tasks.json`), JSON.stringify(tasks, null, 2));
        const meta = { verified: good.length, attempted: RUNS, layer1Rejected };
        fs.writeFileSync(path.join(outDir, `sec-${secTag}.md`), render(sec, consolidated, meta));
        fs.writeFileSync(path.join(outDir, `sec-${secTag}.json`), JSON.stringify({ sec, meta, rejected, runs: good, consolidated }, null, 2));
        const n = claims.length;
        const st = (s) => claims.filter((c) => c.status === s).length;
        console.log(`[sec ${sec}] ${good.length}/${RUNS} verified · ${n} corroborated · measured ✓${st('accepted_measured')} ✗${st('vetoed_measured')} · eyewitness pending ${st('pending_eyewitness')} refuted ${st('rejected_eyewitness')} · firewall -${layer1Rejected}`);
        summary.push({ sec, verified: good.length, attempted: RUNS, corroborated: n, measured_ok: st('accepted_measured'), vetoed: st('vetoed_measured'), pending: st('pending_eyewitness'), refuted: st('rejected_eyewitness'), layer1Rejected });
      } catch (e) {
        console.error(`[sec ${sec}] FAILED: ${String(e.message).slice(0, 160)}`);
      }
    }
  }),
);

summary.sort((a, b) => a.sec - b.sec);
fs.writeFileSync(path.join(outDir, 'summary.json'), JSON.stringify(summary, null, 2));
console.log(`\n-> ${outDir}\n   channel A verdicts: Read the frames in eyewitness/sec-*-tasks.json, write eyewitness/verdicts-claude.json, then run eyewitness-apply.mjs`);
