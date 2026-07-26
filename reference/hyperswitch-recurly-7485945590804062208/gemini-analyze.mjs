#!/usr/bin/env node
/**
 * gemini-analyze.mjs — exhaustive Gemini video/frame analysis harness.
 *
 * Modes:
 *   --video <path>            Upload a video via Files API and analyze (supports --fps).
 *   --frames "a.jpg,b.jpg"    Analyze an ordered list of image frames (inline base64).
 *   --framesGlob <dir> --from N --to M   Analyze frames_all/f_%03d.jpg in [N,M].
 *   --audio <path>            Analyze an audio file (transcription / music).
 *
 * Prompt:
 *   --prompt <file>           Read the instruction prompt from a file.
 *   --promptText "..."        Inline prompt.
 *
 * Output:
 *   --out <file>              Write raw model text to file (also printed).
 *   --json                    Ask for JSON mime type response.
 *   --model <id>              default gemini-2.5-pro
 *   --fps <n>                 video sampling fps (default 5)
 *   --mediaRes <low|high>     media resolution for video/images (default high)
 */
// Primitives (client construction, key resolution, upload polling, retry with
// quota-aware backoff, shared rate-limit gate) live in gemini-lib.mjs so fixes
// land in one place instead of drifting between the two harnesses.
import { generate, inlineImagePart, uploadAndWait } from './gemini-lib.mjs';
import fs from 'node:fs';
import path from 'node:path';

const argv = process.argv.slice(2);
const arg = (k, d) => {
  const i = argv.indexOf(`--${k}`);
  return i >= 0 ? argv[i + 1] : d;
};
const has = (k) => argv.includes(`--${k}`);

const model = arg('model', 'gemini-2.5-pro');
const fps = parseFloat(arg('fps', '5'));
// Kept as the raw 'high' | 'low' token — gemini-lib's generate() maps it to the
// MEDIA_RESOLUTION_* enum.
const mediaRes = arg('mediaRes', 'high');
const wantJson = has('json');

const promptFile = arg('prompt');
const prompt = promptFile ? fs.readFileSync(promptFile, 'utf8') : arg('promptText', 'Describe this in exhaustive detail.');

async function main() {
  const parts = [];
  const videoPath = arg('video');
  const audioPath = arg('audio');
  const framesArg = arg('frames');
  const framesGlob = arg('framesGlob');

  let labelNote = '';

  if (videoPath) {
    const f = await uploadAndWait(videoPath);
    parts.push({ fileData: { fileUri: f.uri, mimeType: f.mimeType }, videoMetadata: { fps } });
  } else if (audioPath) {
    const f = await uploadAndWait(audioPath);
    parts.push({ fileData: { fileUri: f.uri, mimeType: f.mimeType } });
  } else if (framesArg || framesGlob) {
    let files = [];
    if (framesArg) files = framesArg.split(',').map((s) => s.trim());
    else {
      const from = parseInt(arg('from', '1'), 10);
      const to = parseInt(arg('to', '435'), 10);
      for (let i = from; i <= to; i++) {
        const p = path.join(framesGlob, `f_${String(i).padStart(3, '0')}.jpg`);
        if (fs.existsSync(p)) files.push(p);
      }
    }
    // Label each frame with its index + timestamp so the model can cite exact times.
    for (const p of files) {
      const m = path.basename(p).match(/f_(\d+)/);
      const idx = m ? parseInt(m[1], 10) : null;
      const t = idx != null ? ((idx - 1) / 30).toFixed(3) : '?';
      parts.push({ text: `\n[FRAME ${idx} — t=${t}s]` });
      parts.push(inlineImagePart(p));
    }
    labelNote = `\n(${files.length} labeled frames provided in order, each preceded by its frame index and timestamp.)`;
  }

  parts.push({ text: prompt + labelNote });

  // Via gemini-lib: inherits quota-aware backoff and the shared rate-limit
  // gate, which this harness previously had no retry for at all.
  const { text, usage } = await generate({ parts, model, mediaRes, json: wantJson });
  const outFile = arg('out');
  if (outFile) fs.writeFileSync(outFile, text);
  process.stdout.write(text);
  process.stderr.write(`\n[usage] ${JSON.stringify(usage ?? {})}\n`);
}

main().catch((e) => { console.error('ERROR:', e?.message || e); process.exit(1); });
