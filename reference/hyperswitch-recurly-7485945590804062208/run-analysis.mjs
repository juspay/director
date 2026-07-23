/**
 * run-analysis.mjs — exhaustive Gemini analysis of the target video.
 *
 * Stages:
 *   global   — 8 whole-video / audio passes (structure, text, audio, camera, color, type, brand, technique)
 *   windows  — dense per-window frame-by-frame passes (15 frames each, ~0.5s windows)
 *   verify   — adversarial re-check of each window description against its frames
 *
 * Usage: node run-analysis.mjs --stage <global|windows|verify|all> [--fps N] [--force] [--conc 4]
 */
import fs from 'node:fs';
import path from 'node:path';
import {
  uploadAndWait, videoPart, filePart, frameRangeParts, generate,
} from './gemini-lib.mjs';

const HERE = path.dirname(new URL(import.meta.url).pathname);
const FRAMES_DIR =
  process.env.FRAMES_DIR ||
  '/private/tmp/claude-501/-Users-sachinsharma-Developer-temp-director/0ede4d9c-b28d-46a2-8e82-e49c80920933/scratchpad/li-download/frames_all';
const VIDEO = path.join(HERE, 'target.mp4');
const AUDIO = path.join(HERE, 'audio.mp3');
const OUT = path.join(HERE, 'analysis');
const TOTAL_FRAMES = 435;
const SRC_FPS = 30;

const arg = (k, d) => { const i = process.argv.indexOf(`--${k}`); return i >= 0 ? process.argv[i + 1] : d; };
const has = (k) => process.argv.includes(`--${k}`);
const STAGE = arg('stage', 'all');
const FORCE = has('force');
const CONC = parseInt(arg('conc', '4'), 10);

fs.mkdirSync(path.join(OUT, 'global'), { recursive: true });
fs.mkdirSync(path.join(OUT, 'windows'), { recursive: true });
fs.mkdirSync(path.join(OUT, 'verify'), { recursive: true });

function write(rel, text) {
  const p = path.join(OUT, rel);
  fs.mkdirSync(path.dirname(p), { recursive: true });
  fs.writeFileSync(p, text);
  return p;
}
function done(rel) { return !FORCE && fs.existsSync(path.join(OUT, rel)) && fs.statSync(path.join(OUT, rel)).size > 40; }

// Simple concurrency limiter.
async function pool(items, worker, conc = CONC) {
  const results = [];
  let idx = 0;
  const runners = Array.from({ length: Math.min(conc, items.length) }, async () => {
    while (idx < items.length) {
      const my = idx++;
      try { results[my] = await worker(items[my], my); }
      catch (e) { results[my] = { error: String(e?.message || e) }; console.error(`  ✗ item ${my}: ${results[my].error}`); }
    }
  });
  await Promise.all(runners);
  return results;
}

const SHARED_CONTEXT = `CONTEXT: This is a 14.5-second, 720x900 (portrait 4:5) social/product announcement video. It is a continuous, glossy 3D-rendered motion-graphics piece (no hard cuts) of floating rounded "keycap"/card tiles on a bright soft-focus surface. It announces that RECURLY (subscription-billing brand, gold/yellow) is now integrated / Live with JUSPAY HYPERSWITCH (payment orchestration brand, indigo/blue). Be forensic and literal. Report VERBATIM on-screen text. Report colors as approximate HEX. Report positions as fractions of the frame (x,y from top-left, 0..1). Timestamps in seconds. Never invent detail you cannot see; if unsure, say so.`;

// ---------- GLOBAL PASSES ----------
async function runGlobal() {
  console.log('[global] uploading video + audio...');
  const vfile = await uploadAndWait(VIDEO);
  const afile = await uploadAndWait(AUDIO);
  console.log('[global] uploaded. running passes...');

  const passes = [
    {
      out: 'global/A1_structure.md', fps: 6, json: false,
      prompt: `${SHARED_CONTEXT}

TASK A1 — MASTER STRUCTURAL BREAKDOWN.
Produce an exhaustive beat-by-beat timeline of the ENTIRE video. Segment it into distinct visual "beats" (moments where the composition, focal element, or camera intent changes). For EACH beat give:
- start–end timestamp (s)
- what is on screen (every visible tile/card/label, verbatim text, and which is the focal/hero element)
- what the camera is doing
- what enters and what exits during the beat
- the narrative purpose of the beat
Then give: (1) the overall story arc in 2-3 sentences, (2) the exact ending frozen composition, (3) total beat count. Be thorough — this is the spine of a full reconstruction.`,
    },
    {
      out: 'global/A2_text_timeline.json', fps: 8, json: true,
      prompt: `${SHARED_CONTEXT}

TASK A2 — ON-SCREEN TEXT & ELEMENT TIMELINE (JSON).
List EVERY distinct on-screen text label / tile / logo that appears at any point. Output a JSON object:
{
  "elements": [
    {
      "label": "<verbatim text, exact casing/punctuation, or 'LOGO:Recurly' etc>",
      "kind": "capability-tile | metric | brand-logo | cta-pill | icon-only | background-ui | other",
      "icon": "<describe the icon on the tile if any>",
      "first_seen_s": <number>, "last_seen_s": <number>,
      "peak_focus_s": <number, when it is largest/sharpest/centered>,
      "approx_position": {"x": <0..1>, "y": <0..1>},
      "fill_hex": "<#rrggbb>", "text_hex": "<#rrggbb>",
      "notes": "<anything else: how it animates in/out>"
    }
  ]
}
Include the faint background UI tiles too (labeled 'background-ui'). Be exhaustive — 15+ elements expected.`,
    },
    {
      out: 'global/A3_audio.md', fps: 5, json: false, audio: true,
      prompt: `${SHARED_CONTEXT}

TASK A3 — AUDIO FORENSICS (using the attached audio track).
Analyze the soundtrack in full:
1. VOICEOVER / SPEECH: transcribe verbatim any spoken words or none. State clearly if there is NO voiceover.
2. MUSIC: genre/style, mood, approximate BPM/tempo, key feel (major/minor), instrumentation (list every instrument/sound you hear), and its structure over the 14.5s (intro/build/hits/resolve) with timestamps.
3. SOUND DESIGN / SFX: list every distinct sound effect (whooshes, clicks, impacts, risers, sparkles, sub-drops, UI blips) WITH timestamps and what visual they likely sync to.
4. MIX: loudness feel, any ducking, stereo width.
5. A reproducible MUSIC BRIEF: a paragraph a composer or a music-gen model (e.g. Beatoven/Suno) could use to recreate this exact feel, plus 6-8 descriptor tags.`,
    },
    {
      out: 'global/A4_camera_motion.md', fps: 10, json: false,
      prompt: `${SHARED_CONTEXT}

TASK A4 — CAMERA & MOTION DESIGN.
Describe the camera and motion language precisely:
1. Camera path across the whole 14.5s: dolly/truck/pan/tilt/orbit/zoom — with direction and timestamps for each move.
2. The 3D space: is it isometric? what is the tilt/angle? is there parallax between foreground/background tiles?
3. Element motion: how do tiles float, rotate, settle, or "press" like keys? Describe easing (ease-in/out, overshoot/spring, linear) qualitatively.
4. Depth of field: what is in focus vs blurred, and how the focal plane travels.
5. Timing/rhythm: is motion synced to the music? Note the key motion beats with timestamps.
6. A reproduction note: what camera + animation rig would recreate this (e.g. single continuous dolly with rack-focus, specific easing).`,
    },
    {
      out: 'global/A5_color_lighting.md', fps: 4, json: false,
      prompt: `${SHARED_CONTEXT}

TASK A5 — COLOR, MATERIAL & LIGHTING.
1. Full color palette as HEX: background, white tiles, the indigo/blue (Juspay), the gold/yellow (Recurly), icon colors, text colors, any accent. Give a swatch list with a name + hex + where used.
2. Materials/shading: describe the surface of the tiles (matte plastic? glossy? soft-touch keycap? beveled edges? corner radius?), the "hero" keycaps (Recurly gold, Hyperswitch blue) vs the flat capability tiles.
3. Lighting: key light direction, softness, bloom/glow, highlights, ambient occlusion/contact shadows, overall exposure (is it bright/high-key?).
4. Post/grade: bloom, vignette, grain, chromatic aberration, DOF blur character.
5. A reproducible LOOK BRIEF paragraph + tags.`,
    },
    {
      out: 'global/A6_typography.md', fps: 4, json: false,
      prompt: `${SHARED_CONTEXT}

TASK A6 — TYPOGRAPHY & LAYOUT SYSTEM.
For every text style in the video (capability-tile labels, the metric "99.999%" text, the Recurly wordmark, the "JUSPAY hyperswitch" wordmark, the "Live Now" pill, any small UI text):
- identify the likely typeface / closest font family (e.g. Inter, SF Pro, Helvetica Now, a geometric sans, or brand-custom), weight, case, tracking, and relative size.
- describe the tile layout: icon position vs label, padding, corner radius, alignment, shadow.
- describe the exact Recurly and Hyperswitch logo lockups (mark + wordmark arrangement, colors).
Give a reproducible TYPE + LAYOUT spec a designer could rebuild from.`,
    },
    {
      out: 'global/A7_brand_assets.json', fps: 6, json: true,
      prompt: `${SHARED_CONTEXT}

TASK A7 — BRAND ASSET INVENTORY (JSON).
Output JSON:
{
  "brands": [
    {"name": "Recurly", "role": "...", "logo_mark_desc": "...", "wordmark_desc": "...", "primary_hex": "...", "keycap_or_tile": "...", "appears_s": [..], "hero_moment_s": <n>},
    {"name": "Juspay Hyperswitch", ...}
  ],
  "cta": {"text": "Live Now", "style_desc": "...", "hex": "...", "appears_s": [..]},
  "capability_tiles": [{"label": "...", "icon_desc": "...", "hex": "..."}],
  "metrics": [{"text": "...", "context": "..."}],
  "final_lockup": "describe the exact end-card composition: relative placement of Recurly, Hyperswitch, Live Now, and any tagline",
  "partnership_message": "one sentence: what business message this video communicates"
}
Be exhaustive and literal about every brand element.`,
    },
    {
      out: 'global/A8_technique.md', fps: 4, json: false,
      prompt: `${SHARED_CONTEXT}

TASK A8 — PRODUCTION TECHNIQUE & REPRODUCTION FEASIBILITY.
1. How was this most likely made? (3D software like Blender/Cinema4D/Houdini + render engine; or After Effects; isometric keycap-render style, etc.) Justify from visual evidence (reflections, DOF, contact shadows, bevels).
2. Is this a single continuous 3D camera move or composited layers? Evidence.
3. Reproduction difficulty for a video PIPELINE that uses AI image/video generators (wan/kling/seedance/veo) + Remotion compositing: which parts are AI-genable vs which need real 3D/2D design (the exact brand lockups, crisp wordmarks, precise UI text)?
4. Recommend the BEST reproduction strategy to match this exactly: e.g. build the 3D scene deterministically (Blender/Remotion-3D) vs AI-gen a plate + overlay crisp vector brand cards. Be specific and opinionated.
5. List the hard-to-fake fidelity details a reviewer would check (crispness of wordmarks, keycap material, DOF travel, motion easing, audio sync).`,
    },
  ];

  const todo = passes.filter((p) => !done(p.out));
  console.log(`[global] ${passes.length - todo.length} cached, ${todo.length} to run`);
  await pool(todo, async (p) => {
    const parts = p.audio ? [filePart(afile), { text: p.prompt }] : [videoPart(vfile, p.fps), { text: p.prompt }];
    const { text, usage } = await generate({ parts, json: p.json, model: 'gemini-2.5-pro' });
    write(p.out, text);
    console.log(`  ✓ ${p.out}  (${usage.totalTokenCount ?? '?'} tok)`);
    return { out: p.out };
  });
}

// ---------- WINDOW PASSES (dense frame-by-frame) ----------
function windows() {
  const WIN = 15; // frames per window (~0.5s @30fps)
  const list = [];
  for (let from = 1; from <= TOTAL_FRAMES; from += WIN) {
    const to = Math.min(from + WIN - 1, TOTAL_FRAMES);
    list.push({ idx: list.length + 1, from, to });
  }
  return list;
}

async function runWindows() {
  const list = windows();
  const todo = list.filter((w) => !done(`windows/w${String(w.idx).padStart(2, '0')}.md`));
  console.log(`[windows] ${list.length} windows, ${list.length - todo.length} cached, ${todo.length} to run`);
  await pool(todo, async (w) => {
    const { parts: frameParts, used } = frameRangeParts(FRAMES_DIR, w.from, w.to, 1, SRC_FPS);
    const tStart = ((w.from - 1) / SRC_FPS).toFixed(3);
    const tEnd = ((w.to - 1) / SRC_FPS).toFixed(3);
    const prompt = `${SHARED_CONTEXT}

TASK — DENSE FRAME-BY-FRAME READING of window ${w.idx} (t=${tStart}s → t=${tEnd}s), frames ${w.from}–${w.to}.
You are given every frame of this ~0.5s window in order, each labeled with its frame number and timestamp.
Go frame by frame. For the FIRST frame, fully describe the composition. For EACH subsequent frame, describe ONLY what CHANGED from the previous frame (camera move delta, element movement in fractions of frame, scale change, opacity/blur change, any text that becomes newly legible, focus shift). Then:
- List every VERBATIM text label legible anywhere in this window and its position (x,y as 0..1).
- Note the focal/hero element of this window.
- Note any transition, morph, or "key press" that happens.
- Estimate the camera motion vector for the window (e.g. "trucking right ~0.15 of frame width, slight dolly-in").
Be forensic and literal.`;
    const parts = [...frameParts, { text: prompt }];
    const { text, usage } = await generate({ parts, json: false, model: 'gemini-2.5-pro', mediaRes: 'high' });
    write(`windows/w${String(w.idx).padStart(2, '0')}.md`, `# Window ${w.idx} — t=${tStart}s..${tEnd}s (frames ${used[0]}-${used[used.length - 1]})\n\n${text}\n`);
    console.log(`  ✓ window ${w.idx}/${list.length} (frames ${w.from}-${w.to}, ${usage.totalTokenCount ?? '?'} tok)`);
    return { idx: w.idx };
  });
}

// ---------- VERIFY (adversarial) ----------
async function runVerify() {
  const list = windows();
  const todo = list.filter((w) => {
    const src = path.join(OUT, `windows/w${String(w.idx).padStart(2, '0')}.md`);
    return fs.existsSync(src) && !done(`verify/w${String(w.idx).padStart(2, '0')}.md`);
  });
  console.log(`[verify] ${todo.length} to verify`);
  await pool(todo, async (w) => {
    const desc = fs.readFileSync(path.join(OUT, `windows/w${String(w.idx).padStart(2, '0')}.md`), 'utf8');
    const { parts: frameParts } = frameRangeParts(FRAMES_DIR, w.from, w.to, 2, SRC_FPS);
    const prompt = `${SHARED_CONTEXT}

TASK — ADVERSARIAL VERIFICATION. Below is a prior frame-by-frame description of this window. Re-examine the attached frames and find EVERY error or omission: mis-transcribed on-screen text, wrong colors, invented elements, missed elements, wrong positions, wrong motion direction. Output a bullet list of CORRECTIONS only (skip what is correct). If the description is fully accurate, say "ACCURATE — no corrections." Be strict.

--- PRIOR DESCRIPTION ---
${desc}
--- END ---`;
    const parts = [...frameParts, { text: prompt }];
    const { text } = await generate({ parts, json: false, model: 'gemini-2.5-pro', mediaRes: 'high' });
    write(`verify/w${String(w.idx).padStart(2, '0')}.md`, `# Verify window ${w.idx}\n\n${text}\n`);
    console.log(`  ✓ verify ${w.idx}`);
    return { idx: w.idx };
  });
}

// ---------- MAIN ----------
const t0 = Date.now();
if (STAGE === 'global' || STAGE === 'all') await runGlobal();
if (STAGE === 'windows' || STAGE === 'all') await runWindows();
if (STAGE === 'verify' || STAGE === 'all') await runVerify();
console.log(`\n[done] stage=${STAGE} in ${Math.round((Date.now() - t0) / 1000)}s`);
