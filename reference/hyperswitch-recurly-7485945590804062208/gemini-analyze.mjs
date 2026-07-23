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
import { GoogleGenAI } from '@google/genai';
import fs from 'node:fs';
import path from 'node:path';

const argv = process.argv.slice(2);
const arg = (k, d) => {
  const i = argv.indexOf(`--${k}`);
  return i >= 0 ? argv[i + 1] : d;
};
const has = (k) => argv.includes(`--${k}`);

const apiKey = process.env.GEMINI_API_KEY || process.env.GOOGLE_AI_API_KEY || process.env.GOOGLE_GENERATIVE_AI_API_KEY;
if (!apiKey) { console.error('No GEMINI_API_KEY / GOOGLE_AI_API_KEY in env'); process.exit(1); }
const ai = new GoogleGenAI({ apiKey });

const model = arg('model', 'gemini-2.5-pro');
const fps = parseFloat(arg('fps', '5'));
const mediaRes = arg('mediaRes', 'high') === 'high' ? 'MEDIA_RESOLUTION_HIGH' : 'MEDIA_RESOLUTION_LOW';
const wantJson = has('json');

const promptFile = arg('prompt');
const prompt = promptFile ? fs.readFileSync(promptFile, 'utf8') : arg('promptText', 'Describe this in exhaustive detail.');

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

function mimeFor(p) {
  const e = path.extname(p).toLowerCase();
  if (e === '.jpg' || e === '.jpeg') return 'image/jpeg';
  if (e === '.png') return 'image/png';
  if (e === '.mp4') return 'video/mp4';
  if (e === '.wav') return 'audio/wav';
  if (e === '.mp3') return 'audio/mp3';
  return 'application/octet-stream';
}

async function uploadAndWait(p) {
  const up = await ai.files.upload({ file: p, config: { mimeType: mimeFor(p) } });
  let f = up;
  let tries = 0;
  while (f.state === 'PROCESSING' && tries < 120) {
    await sleep(1500);
    f = await ai.files.get({ name: up.name });
    tries++;
  }
  if (f.state !== 'ACTIVE') throw new Error(`file not active: ${f.state}`);
  return f;
}

function inlineImagePart(p) {
  const data = fs.readFileSync(p).toString('base64');
  return { inlineData: { mimeType: mimeFor(p), data } };
}

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

  const config = { mediaResolution: mediaRes, temperature: 0.2, maxOutputTokens: 32768 };
  if (wantJson) config.responseMimeType = 'application/json';

  const resp = await ai.models.generateContent({ model, contents: [{ role: 'user', parts }], config });
  const text = resp.text ?? '';
  const outFile = arg('out');
  if (outFile) fs.writeFileSync(outFile, text);
  process.stdout.write(text);
  process.stderr.write(`\n[usage] ${JSON.stringify(resp.usageMetadata ?? {})}\n`);
}

main().catch((e) => { console.error('ERROR:', e?.message || e); process.exit(1); });
