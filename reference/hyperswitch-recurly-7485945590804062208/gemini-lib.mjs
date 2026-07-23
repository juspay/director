/**
 * gemini-lib.mjs — shared Gemini analysis primitives (Files API + inline frames + retry).
 */
import { GoogleGenAI } from '@google/genai';
import fs from 'node:fs';
import path from 'node:path';

const apiKey =
  process.env.GEMINI_API_KEY || process.env.GOOGLE_AI_API_KEY || process.env.GOOGLE_GENERATIVE_AI_API_KEY;
if (!apiKey) throw new Error('No GEMINI_API_KEY / GOOGLE_AI_API_KEY in env');

export const ai = new GoogleGenAI({ apiKey });
export const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

export function mimeFor(p) {
  const e = path.extname(p).toLowerCase();
  if (e === '.jpg' || e === '.jpeg') return 'image/jpeg';
  if (e === '.png') return 'image/png';
  if (e === '.mp4') return 'video/mp4';
  if (e === '.wav') return 'audio/wav';
  if (e === '.mp3') return 'audio/mp3';
  return 'application/octet-stream';
}

export async function uploadAndWait(p) {
  const up = await ai.files.upload({ file: p, config: { mimeType: mimeFor(p) } });
  let f = up;
  let tries = 0;
  while (f.state === 'PROCESSING' && tries < 200) {
    await sleep(1500);
    f = await ai.files.get({ name: up.name });
    tries++;
  }
  if (f.state !== 'ACTIVE') throw new Error(`file not active: ${f.state}`);
  return f;
}

export function videoPart(file, fps = 5) {
  return { fileData: { fileUri: file.uri, mimeType: file.mimeType }, videoMetadata: { fps } };
}
export function filePart(file) {
  return { fileData: { fileUri: file.uri, mimeType: file.mimeType } };
}

export function inlineImagePart(p) {
  const data = fs.readFileSync(p).toString('base64');
  return { inlineData: { mimeType: mimeFor(p), data } };
}

/** Build labeled frame parts for frames_all/f_%03d.jpg over [from,to], taking every `everyN`. */
export function frameRangeParts(dir, from, to, everyN = 1, fpsOfSource = 30) {
  const parts = [];
  const used = [];
  for (let i = from; i <= to; i += everyN) {
    const p = path.join(dir, `f_${String(i).padStart(3, '0')}.jpg`);
    if (!fs.existsSync(p)) continue;
    const t = ((i - 1) / fpsOfSource).toFixed(3);
    parts.push({ text: `\n[FRAME ${i} — t=${t}s]` });
    parts.push(inlineImagePart(p));
    used.push(i);
  }
  return { parts, used };
}

/** generateContent with exponential backoff on 429/5xx/network. */
export async function generate({ parts, model = 'gemini-2.5-pro', mediaRes = 'high', json = false, maxOutputTokens = 32768, temperature = 0.2 }) {
  const config = {
    mediaResolution: mediaRes === 'high' ? 'MEDIA_RESOLUTION_HIGH' : 'MEDIA_RESOLUTION_LOW',
    temperature,
    maxOutputTokens,
  };
  if (json) config.responseMimeType = 'application/json';

  let lastErr;
  for (let attempt = 0; attempt < 6; attempt++) {
    try {
      const resp = await ai.models.generateContent({ model, contents: [{ role: 'user', parts }], config });
      const text = resp.text ?? '';
      if (!text) throw new Error(`empty response (finish: ${resp.candidates?.[0]?.finishReason})`);
      return { text, usage: resp.usageMetadata ?? {} };
    } catch (e) {
      lastErr = e;
      const msg = String(e?.message || e);
      const retriable = /429|5\d\d|deadline|timeout|ECONN|ENOTFOUND|EAI_AGAIN|overloaded|UNAVAILABLE|empty response/i.test(msg);
      if (!retriable || attempt === 5) break;
      const wait = Math.min(60000, 5000 * 2 ** attempt) + Math.floor(1000 * ((attempt * 37) % 5) / 5);
      process.stderr.write(`[retry ${attempt + 1}] ${msg.slice(0, 120)} — waiting ${Math.round(wait / 1000)}s\n`);
      await sleep(wait);
    }
  }
  throw lastErr;
}
