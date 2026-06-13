/**
 * Pure pipeline helpers — no I/O, no env, no side effects. Kept separate from
 * runner.ts (the CLI entry, which pulls dotenv/config transitively) so they can
 * be unit-tested without loading the whole pipeline or mutating process.env.
 */

/** Run `fn` over `items` with bounded concurrency, preserving input order in the result. */
export async function mapWithConcurrency<T, R>(
  items: T[], limit: number, fn: (item: T, index: number) => Promise<R>,
): Promise<R[]> {
  const results = new Array<R>(items.length);
  if (items.length === 0) return results;
  let cursor = 0;
  const worker = async (): Promise<void> => {
    for (let i = cursor++; i < items.length; i = cursor++) {
      results[i] = await fn(items[i], i);
    }
  };
  await Promise.all(Array.from({ length: Math.max(1, Math.min(limit, items.length)) }, () => worker()));
  return results;
}

/** Map a resolution key to output frame dimensions + the video-model resolution string. */
export function resolveDims(resolution: string | undefined): { veo: '720p' | '1080p'; width: number; height: number } {
  return resolution === '720p'
    ? { veo: '720p', width: 1280, height: 720 }
    : { veo: '1080p', width: 1920, height: 1080 };
}

function srtTime(t: number): string {
  const safe = Math.max(0, t);
  const ms = Math.floor((safe % 1) * 1000), s = Math.floor(safe) % 60, m = Math.floor(safe / 60) % 60, h = Math.floor(safe / 3600);
  return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')},${String(ms).padStart(3, '0')}`;
}

/**
 * Build an SRT directly from the known script — 100% accurate text, timed
 * proportionally to word count across the voiceover duration. Avoids STT
 * mishearing brand names / homophones (e.g. "Aether" → "Ather", "know" → "no").
 * Robust to tiny/zero durations (each cue keeps a positive span).
 */
export function scriptToSrt(script: string, durationSec: number): string {
  const words = script.split(/\s+/).filter(Boolean);
  if (words.length === 0) return '';
  const cues: string[][] = [];
  let cur: string[] = [];
  for (const w of words) {
    cur.push(w);
    if (cur.length >= 6 || (/[.!?]$/.test(w) && cur.length >= 3)) { cues.push(cur); cur = []; }
  }
  if (cur.length) cues.push(cur);

  const dur = Math.max(0, durationSec);
  // Shrink the lead-in for very short clips so the timeline never inverts.
  const lead = Math.min(0.08, dur / (cues.length + 1));
  const span = Math.max(dur - lead, 0.001 * cues.length);
  const total = words.length;
  let acc = 0, out = '';
  cues.forEach((c, i) => {
    const start = lead + (acc / total) * span;
    acc += c.length;
    const end = Math.max(lead + (acc / total) * span, start + 0.001);
    out += `${i + 1}\n${srtTime(start)} --> ${srtTime(end)}\n${c.join(' ')}\n\n`;
  });
  return out;
}
