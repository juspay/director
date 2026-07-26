/**
 * gemini-lib.mjs — shared Gemini analysis primitives (Files API + inline frames + retry).
 */
import { GoogleGenAI } from '@google/genai';
import fs from 'node:fs';
import path from 'node:path';

export const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

/**
 * Lazily construct the client. The key is resolved on first *use* rather than
 * at import time, so importing this module for a pure helper (mimeFor,
 * frameRangeParts, …) never crashes the process on a missing key.
 */
let _ai = null;
export function getAi() {
  if (_ai) return _ai;
  const apiKey =
    process.env.GEMINI_API_KEY || process.env.GOOGLE_AI_API_KEY || process.env.GOOGLE_GENERATIVE_AI_API_KEY;
  if (!apiKey) {
    throw new Error('No GEMINI_API_KEY / GOOGLE_AI_API_KEY / GOOGLE_GENERATIVE_AI_API_KEY in env');
  }
  _ai = new GoogleGenAI({ apiKey });
  return _ai;
}

/**
 * Quota classifier mirroring `src/utils/rate-limit.ts::isQuotaError` — quota
 * errors get exponential backoff, everything else linear. Matches precise
 * markers so an innocent "moderate rate" does not trigger exponential waits.
 *
 * NOTE: this deliberately duplicates the shared TypeScript helper rather than
 * importing it. These are standalone `.mjs` harnesses run directly by node:
 * `src/utils/rate-limit.ts` cannot be imported without a loader, and
 * `dist/utils/rate-limit.js` is gitignored, so importing either would break the
 * scripts for anyone who has not built the repo first. The semantics below are
 * kept in lockstep with that module.
 */
export function isQuotaError(message) {
  const lower = String(message).toLowerCase();
  return (
    message.includes('429') ||
    message.includes('RESOURCE_EXHAUSTED') ||
    lower.includes('quota') ||
    lower.includes('too many requests') ||
    /rate[ _-]?limit/i.test(message)
  );
}

const MAX_RETRIES = 5;
const RETRY_BASE_DELAY_MS = 5000;
const MAX_RETRY_DELAY_MS = 60000;

/**
 * Process-wide gate shared by EVERY Gemini call (uploads and generations
 * alike), so a parallel fan-out cannot stampede the quota: at most
 * GEMINI_MAX_INFLIGHT calls run at once, and consecutive calls are spaced by at
 * least GEMINI_MIN_INTERVAL_MS. Without this, each caller only backs off for
 * its own request and N workers still burst together.
 */
const MAX_INFLIGHT = Math.max(1, Number(process.env.GEMINI_MAX_INFLIGHT) || 4);
const MIN_INTERVAL_MS = Math.max(0, Number(process.env.GEMINI_MIN_INTERVAL_MS) || 250);
let _inflight = 0;
let _lastStart = 0;
const _waiters = [];

async function acquireSlot() {
  if (_inflight >= MAX_INFLIGHT) {
    await new Promise((resolve) => _waiters.push(resolve));
  }
  _inflight++;
  const since = Date.now() - _lastStart;
  if (since < MIN_INTERVAL_MS) await sleep(MIN_INTERVAL_MS - since);
  _lastStart = Date.now();
}

function releaseSlot() {
  _inflight--;
  const next = _waiters.shift();
  if (next) next();
}

/** Run `fn` under the shared concurrency + spacing gate. */
export async function withRateLimitGate(fn) {
  await acquireSlot();
  try {
    return await fn();
  } finally {
    releaseSlot();
  }
}

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
  const ai = getAi();
  // Gated: uploads share the quota with generations, so they must go through
  // the same limiter rather than bursting alongside it.
  const up = await withRateLimitGate(() => ai.files.upload({ file: p, config: { mimeType: mimeFor(p) } }));
  let f = up;
  let tries = 0;
  while (f.state === 'PROCESSING' && tries < 200) {
    await sleep(1500);
    f = await withRateLimitGate(() => ai.files.get({ name: up.name }));
    tries++;
  }
  if (f.state === 'PROCESSING') {
    throw new Error(`file still PROCESSING after ${tries} polls (~${Math.round((tries * 1500) / 1000)}s): ${up.name}`);
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

/**
 * generateContent with quota-aware backoff, matching the schedule in
 * `src/utils/rate-limit.ts::exponentialBackoff`: exponential for quota errors
 * (429/RESOURCE_EXHAUSTED/…), linear for other retriables. Every attempt runs
 * under the shared gate so retries cannot stampede either.
 */
export async function generate({ parts, model = 'gemini-2.5-pro', mediaRes = 'high', json = false, maxOutputTokens = 32768, temperature = 0.2 }) {
  const ai = getAi();
  const config = {
    mediaResolution: mediaRes === 'high' ? 'MEDIA_RESOLUTION_HIGH' : 'MEDIA_RESOLUTION_LOW',
    temperature,
    maxOutputTokens,
  };
  if (json) config.responseMimeType = 'application/json';

  let lastErr;
  for (let attempt = 0; attempt <= MAX_RETRIES; attempt++) {
    try {
      const resp = await withRateLimitGate(() =>
        ai.models.generateContent({ model, contents: [{ role: 'user', parts }], config }),
      );
      const text = resp.text ?? '';
      if (!text) throw new Error(`empty response (finish: ${resp.candidates?.[0]?.finishReason})`);
      return { text, usage: resp.usageMetadata ?? {} };
    } catch (e) {
      lastErr = e;
      const msg = String(e?.message || e);
      const quota = isQuotaError(msg);
      const retriable =
        quota || /5\d\d|deadline|timeout|ECONN|ENOTFOUND|EAI_AGAIN|overloaded|UNAVAILABLE|empty response/i.test(msg);
      if (!retriable || attempt === MAX_RETRIES) break;
      const wait = Math.min(
        MAX_RETRY_DELAY_MS,
        quota ? RETRY_BASE_DELAY_MS * 2 ** attempt : RETRY_BASE_DELAY_MS * (attempt + 1),
      );
      process.stderr.write(
        `[retry ${attempt + 1}/${MAX_RETRIES}] ${msg.slice(0, 120)} — waiting ${Math.round(wait / 1000)}s ` +
          `(${quota ? 'exponential/quota' : 'linear'})\n`,
      );
      await sleep(wait);
    }
  }
  throw lastErr;
}
