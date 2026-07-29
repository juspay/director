/**
 * probe-offsets.mjs — can we window a clip server-side instead of re-encoding?
 *
 * The per-second analysis needs 15 windows x 2 videos. VideoMetadata carries
 * startOffset/endOffset, which would avoid 30 clip files, but the video docs
 * never mention them and they are untested alongside fps. This checks that a
 * window actually restricts what the model sees, using ground truth: the
 * reference's four cuts fall in distinct seconds (2.200 / 4.900 / 6.667 /
 * 8.100), so a window over [4,6) must report the 4.900 cut and NOT the others.
 *
 * Timings below are in the 2x-slowed timeline: original second N is [2N, 2N+2].
 */
import path from 'node:path';
import { getAi, uploadAndWait, withRateLimitGate } from './gemini-lib.mjs';

const SCRATCH = '/private/tmp/claude-501/-Users-sachinsharma-Developer-temp-director/0ede4d9c-b28d-46a2-8e82-e49c80920933/scratchpad';
const file = await uploadAndWait(path.join(SCRATCH, 'target_slow2x.mp4'));

const PROMPT = `Identify every HARD CUT in this clip — a single-frame boundary where camera,
layout and subject all change discontinuously. Ignore gradual camera moves.
Also state what is visible in the FIRST frame you were given.
Return ONLY JSON: {"cuts":[<seconds, as observed in the clip you were given>],"first_frame":"<short>"}`;

/** [original-second window, expected original-timeline cuts inside it] */
const WINDOWS = [
  { sec: 1, expect: [2.200] },
  { sec: 2, expect: [] },
  { sec: 4, expect: [4.900] },
  { sec: 6, expect: [6.667] },
  { sec: 8, expect: [8.100] },
];

console.log('window (orig s)   offsets (slowed)   cuts reported (orig timeline)   expected');
for (const w of WINDOWS) {
  // One second of original time = two seconds of slowed time. A little padding
  // on each side so a cut sitting on a boundary is not clipped away.
  const s = Math.max(0, w.sec * 2 - 0.4);
  const e = w.sec * 2 + 2.4;
  const parts = [
    {
      fileData: { fileUri: file.uri, mimeType: file.mimeType },
      videoMetadata: { fps: 24, startOffset: `${s.toFixed(2)}s`, endOffset: `${e.toFixed(2)}s` },
    },
    { text: PROMPT },
  ];
  try {
    const ai = getAi();
    const resp = await withRateLimitGate(() =>
      ai.models.generateContent({
        model: 'gemini-3.5-flash',
        contents: [{ role: 'user', parts }],
        config: { mediaResolution: 'MEDIA_RESOLUTION_MEDIUM', temperature: 0.1, maxOutputTokens: 4096, responseMimeType: 'application/json' },
      }),
    );
    const j = JSON.parse(resp.text);
    // Offsets may be reported relative to the clip start or to the source
    // timeline; print both readings so we can tell which convention applies.
    const raw = (j.cuts ?? []).map(Number).filter(Number.isFinite);
    const asAbsolute = raw.map((t) => t / 2);
    const asRelative = raw.map((t) => (t + s) / 2);
    console.log(
      `${String(w.sec).padStart(2)}   [${s.toFixed(2)},${e.toFixed(2)}]   ` +
        `abs=[${asAbsolute.map((x) => x.toFixed(2)).join(' ')}]  rel=[${asRelative.map((x) => x.toFixed(2)).join(' ')}]   ` +
        `expect [${w.expect.map((x) => x.toFixed(2)).join(' ')}]   ${resp.usageMetadata?.promptTokenCount}tok`,
    );
    console.log(`        first frame: ${j.first_frame}`);
  } catch (e) {
    console.log(`${String(w.sec).padStart(2)}   ERROR: ${String(e.message).slice(0, 140)}`);
  }
}
