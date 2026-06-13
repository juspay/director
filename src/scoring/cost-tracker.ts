/**
 * API cost tracker — JSONL logging with auto-estimation.
 */
import fs from 'fs/promises';
import path from 'path';

const RATES: Record<string, Record<string, number>> = {
  elevenlabs: { tts_per_1k_chars: 0.30 },
  openai: { tts_per_1k_chars: 0.015 },
  fish_audio: { tts_per_1k_chars: 0.015 },
  // Video generators — billed per second of output. `vertex` (Veo) was the gap
  // that let live-run b-roll log as $0. The figure is a representative Veo 3
  // rate; override per model/tier with VERTEX_VIDEO_PER_SEC.
  vertex: { per_second: 0.40 },
  runway: { per_second: 0.12 },
  kling: { per_second: 0.029 },
  replicate: { per_second: 0.09 },
  gemini_pro: { per_1m_input: 1.25 },
  gemini_flash: { per_1m_input: 0.30 },
};

export class CostTracker {
  private logPath: string;
  constructor(logPath?: string) {
    this.logPath = logPath ?? path.join(process.cwd(), '.pipeline-state', 'cost_log.jsonl');
  }

  async log(provider: string, operation: string, params: Record<string, number> = {}, cost?: number): Promise<void> {
    const entry = {
      timestamp: new Date().toISOString(), provider, operation, params,
      cost: cost ?? this.estimate(provider, params),
    };
    await fs.mkdir(path.dirname(this.logPath), { recursive: true });
    await fs.appendFile(this.logPath, JSON.stringify(entry) + '\n');
  }

  private estimate(provider: string, params: Record<string, number>): number {
    const r = RATES[provider];
    if (!r) return 0;
    if (params.chars) return (params.chars / 1000) * (r.tts_per_1k_chars ?? 0);
    if (params.seconds) return params.seconds * this.perSecond(provider, r);
    if (params.input_tokens) return (params.input_tokens / 1_000_000) * (r.per_1m_input ?? 0);
    return 0;
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
    await fs.mkdir(path.dirname(this.logPath), { recursive: true });
    await fs.writeFile(this.logPath, '');
  }

  async getSummary(): Promise<{ total: number; byProvider: Record<string, number> }> {
    let entries: Array<{ provider: string; cost: number }> = [];
    try {
      const raw = await fs.readFile(this.logPath, 'utf-8');
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
