/**
 * API cost tracker — JSONL logging with auto-estimation.
 */
import fs from 'fs/promises';
import path from 'path';
import { stateDir } from '../pipeline/state.ts';

const RATES: Record<string, Record<string, number>> = {
  elevenlabs: { tts_per_1k_chars: 0.30 },
  // Image generation — billed per image. A director-mode run bills 1 hero +
  // up to BROLL_MAX_REGEN attempts × shots of keyframes, which previously never
  // reached the log at all. `vertex` covers Gemini 2.5 Flash Image ("nano
  // banana", the default IMAGE_PROVIDER); override with VERTEX_IMAGE_PER_IMAGE.
  openai: { tts_per_1k_chars: 0.015, per_image: 0.04 },
  fish_audio: { tts_per_1k_chars: 0.015 },
  // Video generators — billed per second of output. `vertex` (Veo) was the gap
  // that let live-run b-roll log as $0. The figure is a representative Veo 3
  // rate; override per model/tier with VERTEX_VIDEO_PER_SEC.
  vertex: { per_second: 0.40, per_image: 0.039 },
  runway: { per_second: 0.12 },
  kling: { per_second: 0.029 },
  replicate: { per_second: 0.09 },
  gemini_pro: { per_1m_input: 1.25 },
  gemini_flash: { per_1m_input: 0.30 },
};

// Per-model video rates, keyed `${provider}:${model}`. A single provider
// scalar can't hold two spend tiers at once — an LTX or Hailuo model routed
// through replicate would silently price at replicate's flat $0.09/s. Only
// rates verified against a published price page belong in this table; every
// other model corrects via the VIDEO_MODEL_RATES env override and otherwise
// falls back to the provider rate (the pre-per-model behavior).
const MODEL_RATES: Record<string, number> = {
  'replicate:wavespeedai/wan-2.1-i2v-480p': 0.09,
  'replicate:wavespeedai/wan-2.1-i2v-720p': 0.25,
  // Kling via Replicate — billingConfig + input-schema defaults pulled live
  // 2026-07-18 (docs/plans/2026-07-18-model-leaderboard-snapshot.md):
  // v2.1 standard $0.05/s; v3 defaults mode=pro + generate_audio=false → $0.224/s.
  'replicate:kwaivgi/kling-v2.1': 0.05,
  'replicate:kwaivgi/kling-v3-video': 0.224,
  // Reference-to-video routes — UPPER-BOUND estimates (prices not exposed by
  // the Replicate API; docs/plans/2026-07-19-reference-conditioning.md). The
  // rate pilot replaces these with measured figures; over-estimating keeps
  // the budget pre-flight conservative, never generous.
  'replicate:wan-video/wan-2.7-r2v': 0.10,
  'replicate:bytedance/seedance-2.0': 0.30,
  'replicate:bytedance/seedance-2.0-fast': 0.15,
  'replicate:kwaivgi/kling-v3-omni-video': 0.168,
};

/**
 * VIDEO_MODEL_RATES — JSON map of `${provider}:${model}` → USD per output
 * second, e.g. '{"replicate:minimax/hailuo-2.3-fast":0.03}'. Same override
 * contract as VERTEX_VIDEO_PER_SEC: an explicit 0 means free; entries that
 * aren't finite numbers (and unparseable JSON) are ignored and fall through
 * to the built-in tables.
 */
function envModelRate(key: string): number | undefined {
  const raw = process.env.VIDEO_MODEL_RATES;
  if (!raw) return undefined;
  try {
    const parsed: unknown = JSON.parse(raw);
    if (typeof parsed !== 'object' || parsed === null) return undefined;
    const v = (parsed as Record<string, unknown>)[key];
    return typeof v === 'number' && Number.isFinite(v) ? v : undefined;
  } catch {
    return undefined;
  }
}

export class CostTracker {
  private explicitLogPath: string | null;
  constructor(logPath?: string) {
    this.explicitLogPath = logPath ?? null;
  }

  /**
   * Resolved per call, not at construction: the runner constructs its tracker at
   * module load, *before* runPipeline() scopes STATE_DIR_OVERRIDE to the run's
   * output dir. Resolving lazily (and via stateDir() rather than process.cwd())
   * keeps the cost log in the same per-run state dir as the checkpoint it
   * belongs to.
   */
  private logPath(): string {
    return this.explicitLogPath ?? path.join(stateDir(), 'cost_log.jsonl');
  }

  async log(provider: string, operation: string, params: Record<string, number> = {}, cost?: number, model?: string): Promise<void> {
    const entry = {
      timestamp: new Date().toISOString(), provider,
      ...(model ? { model } : {}),
      operation, params,
      cost: cost ?? this.estimate(provider, params, model),
    };
    const logPath = this.logPath();
    await fs.mkdir(path.dirname(logPath), { recursive: true });
    await fs.appendFile(logPath, JSON.stringify(entry) + '\n');
  }

  /**
   * Price a hypothetical operation without logging it — the pre-flight
   * projection prices planned work through the exact table (and env overrides)
   * that will bill the real calls, so projection and billing can't drift.
   */
  estimateOnly(provider: string, params: Record<string, number>, model?: string): number {
    return this.estimate(provider, params, model);
  }

  private estimate(provider: string, params: Record<string, number>, model?: string): number {
    const r = RATES[provider];
    if (!r) return 0;
    if (params.chars) return (params.chars / 1000) * (r.tts_per_1k_chars ?? 0);
    if (params.seconds) return params.seconds * this.perSecond(provider, r, model);
    if (params.images) return params.images * this.perImage(provider, r);
    if (params.input_tokens) return (params.input_tokens / 1_000_000) * (r.per_1m_input ?? 0);
    return 0;
  }

  private perImage(provider: string, r: Record<string, number>): number {
    // Same override contract as VERTEX_VIDEO_PER_SEC: explicit 0 means free,
    // only an unparseable value falls back to the table rate.
    if (provider === 'vertex' && process.env.VERTEX_IMAGE_PER_IMAGE) {
      const parsed = Number(process.env.VERTEX_IMAGE_PER_IMAGE);
      return Number.isFinite(parsed) ? parsed : (r.per_image ?? 0);
    }
    return r.per_image ?? 0;
  }

  private perSecond(provider: string, r: Record<string, number>, model?: string): number {
    // Most-specific wins: env per-model rate, then the built-in per-model
    // table, then the provider-level rate. A model with no per-model rate
    // anywhere prices at the provider rate — the pre-per-model behavior.
    if (model) {
      const key = `${provider}:${model}`;
      const fromEnv = envModelRate(key);
      if (fromEnv !== undefined) return fromEnv;
      const fromTable = MODEL_RATES[key];
      if (fromTable !== undefined) return fromTable;
    }
    // Veo pricing varies by model/tier; let an env override correct it without a code change.
    // Number.isFinite (not `||`) so an explicit VERTEX_VIDEO_PER_SEC=0 stays 0 rather than
    // falling back to the default rate; only an unparseable value falls back.
    if (provider === 'vertex' && process.env.VERTEX_VIDEO_PER_SEC) {
      const parsed = Number(process.env.VERTEX_VIDEO_PER_SEC);
      return Number.isFinite(parsed) ? parsed : (r.per_second ?? 0);
    }
    return r.per_second ?? 0;
  }

  /** Truncate the log so getSummary() reflects a single run, not cumulative history. */
  async reset(): Promise<void> {
    const logPath = this.logPath();
    await fs.mkdir(path.dirname(logPath), { recursive: true });
    await fs.writeFile(logPath, '');
  }

  async getSummary(): Promise<{ total: number; byProvider: Record<string, number> }> {
    let entries: Array<{ provider: string; cost: number }> = [];
    try {
      const raw = await fs.readFile(this.logPath(), 'utf-8');
      entries = raw.trim().split('\n').filter(Boolean).map((l) => JSON.parse(l));
    } catch { /* no log yet */ }

    const byProvider: Record<string, number> = {};
    let total = 0;
    for (const e of entries) {
      byProvider[e.provider] = (byProvider[e.provider] ?? 0) + (e.cost ?? 0);
      total += e.cost ?? 0;
    }
    return { total: Math.round(total * 10000) / 10000, byProvider };
  }
}
