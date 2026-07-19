/**
 * Reference-conditioned video via the Replicate HTTP API directly.
 *
 * NeuroLink's video tool maps ONE input image to one model field
 * (imageInputKey); reference-to-video models take an ARRAY of subject
 * reference images, which that call shape cannot express — so this module
 * speaks to Replicate itself. Routes and param names were schema-verified
 * 2026-07-19 (docs/plans/2026-07-19-reference-conditioning.md); prices are
 * NOT verified — MODEL_RATES carries deliberate upper-bound estimates until
 * the rate pilot replaces them with measured figures.
 *
 * Reference images upload through the Files API: Replicate caps inline data
 * URIs well below a 1080p PNG, so "inline the bytes" is not an option here.
 */
import fs from 'fs/promises';
import path from 'path';
import { clampVideoPrompt } from './index.ts';
import { pacedVideoCall, RATE_LIMIT_BACKOFF_MS } from './pacing.ts';

export type ReferenceRoute = {
  /** owner/name slug of an official Replicate model. */
  model: string;
  /** The array-valued reference input field (schema-verified). */
  referenceKey: string;
  /** In-prompt binding tag for models that address refs from the text, 1-based. */
  tag?: (n: number) => string;
  /** Extra input pinned only where the key is schema-verified — a guessed key 422s the call. */
  extraInput?: Record<string, string | number | boolean>;
};

export const REFERENCE_ROUTES: Record<string, ReferenceRoute> = {
  'wan-r2v': {
    model: 'wan-video/wan-2.7-r2v', referenceKey: 'reference_images',
    extraInput: { resolution: '1080p' },
  },
  'seedance-2': {
    model: 'bytedance/seedance-2.0', referenceKey: 'reference_images',
    tag: (n) => `[Image${n}]`, extraInput: { generate_audio: false, resolution: '1080p' },
  },
  'seedance-2-fast': {
    model: 'bytedance/seedance-2.0-fast', referenceKey: 'reference_images',
    tag: (n) => `[Image${n}]`, extraInput: { generate_audio: false, resolution: '1080p' },
  },
  'kling-omni': {
    model: 'kwaivgi/kling-v3-omni-video', referenceKey: 'reference_images',
    tag: (n) => `<<<image_${n}>>>`, extraInput: { mode: 'pro' },
  },
};

/**
 * BROLL_REFERENCE_MODE=<alias> opts product shots into reference-conditioned
 * generation. Unknown aliases throw (same fail-loud contract as the draft
 * tier) — a typo must not silently fall back to a paid non-reference run.
 */
export function resolveReferenceMode(env: NodeJS.ProcessEnv): ReferenceRoute | null {
  const raw = env.BROLL_REFERENCE_MODE?.trim();
  if (!raw) return null;
  const route = REFERENCE_ROUTES[raw.toLowerCase()];
  if (!route) {
    throw new Error(`BROLL_REFERENCE_MODE '${raw}' unknown — expected one of: ${Object.keys(REFERENCE_ROUTES).join(', ')}`);
  }
  return route;
}

/**
 * Compose the prompt so binding tags always survive the length clamp: the
 * tags are the reference wiring — a clamp that cuts them silently degrades
 * the call to unconditioned t2v at reference-model prices.
 */
export function composeReferencePrompt(prompt: string, refCount: number, route: ReferenceRoute, limit = 500): string {
  if (!route.tag || refCount <= 0) return clampVideoPrompt(prompt, limit);
  const tags = Array.from({ length: refCount }, (_, i) => route.tag!(i + 1)).join(' ');
  const lead = `The product is the subject shown in ${tags}. `;
  return lead + clampVideoPrompt(prompt, Math.max(1, limit - lead.length));
}

/** Pure request-body builder — exported for tests. */
export function buildPredictionInput(
  route: ReferenceRoute,
  prompt: string,
  referenceUrls: readonly string[],
  opts: { length?: number; aspectRatio?: string } = {},
): Record<string, unknown> {
  return {
    prompt: composeReferencePrompt(prompt, referenceUrls.length, route),
    [route.referenceKey]: [...referenceUrls],
    duration: Math.max(2, Math.round(opts.length ?? 4)),
    aspect_ratio: opts.aspectRatio ?? '16:9',
    ...route.extraInput,
  };
}

const API = 'https://api.replicate.com/v1';

function authHeaders(): Record<string, string> {
  const token = process.env.REPLICATE_API_TOKEN;
  if (!token) throw new Error('[ref-video] REPLICATE_API_TOKEN not set');
  return { Authorization: `Bearer ${token}` };
}

async function uploadReference(filePath: string): Promise<string> {
  const buf = await fs.readFile(filePath);
  const form = new FormData();
  form.append('content', new Blob([new Uint8Array(buf)]), path.basename(filePath));
  const res = await fetch(`${API}/files`, { method: 'POST', headers: authHeaders(), body: form });
  if (!res.ok) throw new Error(`[ref-video] file upload failed: ${res.status} ${(await res.text()).slice(0, 160)}`);
  const json = await res.json() as { urls?: { get?: string } };
  if (!json.urls?.get) throw new Error('[ref-video] file upload returned no URL');
  return json.urls.get;
}

type Prediction = { status: string; output?: unknown; error?: unknown; urls?: { get?: string } };

/** Poll a created prediction to a terminal state. fetchFn injectable for tests. */
export async function pollPrediction(
  getUrl: string,
  fetchFn: typeof fetch = fetch,
  intervalMs = 5000,
  timeoutMs = 15 * 60_000,
): Promise<Prediction> {
  const deadline = Date.now() + timeoutMs;
  for (;;) {
    const res = await fetchFn(getUrl, { headers: authHeaders() });
    if (!res.ok) throw new Error(`[ref-video] poll failed: ${res.status}`);
    const p = await res.json() as Prediction;
    if (p.status === 'succeeded') return p;
    if (p.status === 'failed' || p.status === 'canceled') {
      throw new Error(`[ref-video] prediction ${p.status}: ${String(p.error ?? 'no error detail').slice(0, 200)}`);
    }
    if (Date.now() > deadline) throw new Error('[ref-video] prediction timed out');
    await new Promise((r) => setTimeout(r, intervalMs));
  }
}

/** First video URL out of a prediction output (string or array). Exported for tests. */
export function outputVideoUrl(output: unknown): string {
  const first = Array.isArray(output) ? output[0] : output;
  if (typeof first !== 'string' || !first.startsWith('http')) {
    throw new Error(`[ref-video] unexpected output shape: ${JSON.stringify(output).slice(0, 120)}`);
  }
  return first;
}

/**
 * Generate one reference-conditioned clip: upload refs → create prediction on
 * the official-model endpoint → poll → download. Paced and rate-limit-retried
 * like every other paid video submit.
 */
export async function generateWithReferences(
  route: ReferenceRoute,
  prompt: string,
  referencePaths: readonly string[],
  outputPath: string,
  opts: { length?: number; aspectRatio?: string } = {},
): Promise<string> {
  const refs = await Promise.all(referencePaths.map(uploadReference));
  const input = buildPredictionInput(route, prompt, refs, opts);
  console.log(`[ref-video] ${route.model}: ${String(input.prompt).slice(0, 60)}... (${refs.length} ref)`);

  const intervalMs = Math.max(0, Number(process.env.VIDEO_SUBMIT_INTERVAL_MS ?? 0) || 0);
  const created = await pacedVideoCall(async () => {
    const res = await fetch(`${API}/models/${route.model}/predictions`, {
      method: 'POST',
      headers: { ...authHeaders(), 'Content-Type': 'application/json' },
      body: JSON.stringify({ input }),
    });
    const body = await res.text();
    if (!res.ok) throw new Error(`[ref-video] submit failed: ${res.status} — ${body.slice(0, 200)}`);
    return JSON.parse(body) as Prediction;
  }, { intervalMs, retryDelaysMs: RATE_LIMIT_BACKOFF_MS });

  if (!created.urls?.get) throw new Error('[ref-video] created prediction has no poll URL');
  const done = await pollPrediction(created.urls.get);
  const videoRes = await fetch(outputVideoUrl(done.output));
  if (!videoRes.ok) throw new Error(`[ref-video] output download failed: ${videoRes.status}`);
  await fs.mkdir(path.dirname(outputPath), { recursive: true });
  await fs.writeFile(outputPath, Buffer.from(await videoRes.arrayBuffer()));
  console.log(`[ref-video] ${route.model} → ${outputPath}`);
  return outputPath;
}

// CLI (rate pilot, design-doc step 1): npm run ref-pilot -- <route> <prompt> <ref.png>[,ref2.png] <out.mp4> [seconds]
if (import.meta.url === `file://${process.argv[1]}`) {
  const [alias, prompt, refsArg, out, seconds] = process.argv.slice(2);
  const route = alias ? REFERENCE_ROUTES[alias.toLowerCase()] : undefined;
  if (!route || !prompt || !refsArg || !out) {
    console.error(`Usage: npm run ref-pilot -- <${Object.keys(REFERENCE_ROUTES).join('|')}> <prompt> <ref.png[,ref2.png]> <out.mp4> [seconds]`);
    process.exit(1);
  }
  await generateWithReferences(route, prompt, refsArg.split(','), out, seconds ? { length: Number(seconds) } : {});
}
