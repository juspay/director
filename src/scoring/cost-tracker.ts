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

  async log(provider: string, operation: string, params: Record<string, number> = {}, cost?: number): Promise<void> {
    const entry = {
      timestamp: new Date().toISOString(), provider, operation, params,
      cost: cost ?? this.estimate(provider, params),
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
  estimateOnly(provider: string, params: Record<string, number>): number {
    return this.estimate(provider, params);
  }

  private estimate(provider: string, params: Record<string, number>): number {
    const r = RATES[provider];
    if (!r) return 0;
    if (params.chars) return (params.chars / 1000) * (r.tts_per_1k_chars ?? 0);
    if (params.seconds) return params.seconds * this.perSecond(provider, r);
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

  private perSecond(provider: string, r: Record<string, number>): number {
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
