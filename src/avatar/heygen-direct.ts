/**
 * Direct HeyGen avatar adapter — submit → poll → download via HeyGen's REST API,
 * bypassing NeuroLink's avatar mode.
 *
 * Why: NeuroLink registers the HeyGen handler (see avatar/index.ts) and the
 * render completes server-side, but NeuroLink's internal *download* step fails
 * with "fetch failed". The raw submit→poll→download flow here was verified to
 * fetch a real talking-head video (≈1.3 MB), so this path is what actually works.
 *
 * Voice is driven by HeyGen TTS (text + voice_id) rather than uploading the
 * pipeline's VO, which keeps the adapter to three stateless REST calls.
 */
import fs from 'fs/promises';
import path from 'path';

const HEYGEN_BASE = 'https://api.heygen.com';

export type HeyGenRenderOptions = {
  apiKey: string;
  avatarId: string;
  voiceId: string;
  text: string;
  width?: number;
  height?: number;
  avatarStyle?: string;
  /** Poll cadence (ms). Default 6000. */
  pollIntervalMs?: number;
  /** Give up after this long (ms). Default 5 min. */
  maxWaitMs?: number;
};

/** Build the `/v2/video/generate` request body. Pure — exported for tests. */
export function buildHeyGenPayload(opts: {
  avatarId: string; voiceId: string; text: string;
  width?: number; height?: number; avatarStyle?: string;
}): Record<string, unknown> {
  return {
    video_inputs: [{
      character: { type: 'avatar', avatar_id: opts.avatarId, avatar_style: opts.avatarStyle ?? 'normal' },
      voice: { type: 'text', input_text: opts.text, voice_id: opts.voiceId },
    }],
    dimension: { width: opts.width ?? 1280, height: opts.height ?? 720 },
  };
}

export type HeyGenVideoStatus = { status: string; url: string | null; error: string | null };

/** Parse a `/v1/video_status.get` response into {status, url, error}. Pure — exported for tests. */
export function parseVideoStatus(json: unknown): HeyGenVideoStatus {
  const data = (json as { data?: { status?: string; video_url?: string; error?: unknown } } | null)?.data;
  const err = data?.error;
  return {
    status: data?.status ?? 'unknown',
    url: data?.video_url ?? null,
    error: err == null ? null : (typeof err === 'string' ? err : JSON.stringify(err)),
  };
}

// Every network call is bounded by a timeout — a stalled HeyGen API or CDN must
// never hang the pipeline indefinitely (the failure mode NeuroLink's path hit).
const REQUEST_TIMEOUT_MS = 30_000;
const DOWNLOAD_TIMEOUT_MS = 120_000;

async function heyGenJson(apiKey: string, urlPath: string, init: RequestInit = {}): Promise<unknown> {
  let res: Response;
  try {
    res = await fetch(`${HEYGEN_BASE}${urlPath}`, {
      ...init,
      headers: { 'X-Api-Key': apiKey, 'Content-Type': 'application/json', ...(init.headers ?? {}) },
      signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS),
    });
  } catch (e) {
    throw new Error(`HeyGen ${urlPath}: request failed (${e instanceof Error ? e.message : String(e)})`);
  }
  const body = await res.text();
  let json: unknown;
  try { json = JSON.parse(body); } catch { throw new Error(`HeyGen ${urlPath}: non-JSON response (${res.status}) ${body.slice(0, 120)}`); }
  if (!res.ok) throw new Error(`HeyGen ${urlPath}: HTTP ${res.status} — ${body.slice(0, 200)}`);
  return json;
}

const sleep = (ms: number): Promise<void> => new Promise((r) => setTimeout(r, ms));

/**
 * Render a HeyGen talking-head end-to-end: submit the job, poll until completed,
 * download the result to `outputPath`. Throws on render failure or timeout.
 */
export async function renderHeyGenAvatar(outputPath: string, opts: HeyGenRenderOptions): Promise<string> {
  const submit = await heyGenJson(opts.apiKey, '/v2/video/generate', {
    method: 'POST',
    body: JSON.stringify(buildHeyGenPayload(opts)),
  }) as { data?: { video_id?: string } };
  const videoId = submit.data?.video_id;
  if (!videoId) throw new Error('HeyGen: submit returned no video_id');
  console.log(`[heygen-direct] submitted video_id=${videoId}; polling…`);

  const interval = opts.pollIntervalMs ?? 6000;
  const maxWait = opts.maxWaitMs ?? 5 * 60_000;
  const start = Date.now();
  while (Date.now() - start < maxWait) {
    await sleep(interval);
    const st = parseVideoStatus(await heyGenJson(opts.apiKey, `/v1/video_status.get?video_id=${videoId}`));
    if (st.status === 'completed' && st.url) {
      let res: Response;
      try { res = await fetch(st.url, { signal: AbortSignal.timeout(DOWNLOAD_TIMEOUT_MS) }); }
      catch (e) { throw new Error(`HeyGen download: fetch failed (${e instanceof Error ? e.message : String(e)})`); }
      if (!res.ok) throw new Error(`HeyGen download: HTTP ${res.status}`);
      const buf = Buffer.from(await res.arrayBuffer());
      await fs.mkdir(path.dirname(outputPath), { recursive: true });
      await fs.writeFile(outputPath, buf);
      console.log(`[heygen-direct] ${outputPath} (${(buf.length / 1024).toFixed(0)} KB)`);
      return outputPath;
    }
    if (st.status === 'failed') throw new Error(`HeyGen render failed: ${st.error ?? 'unknown'}`);
  }
  throw new Error(`HeyGen: render did not complete within ${maxWait}ms`);
}
