/**
 * Pure pipeline helpers — no I/O, no env, no side effects. Kept separate from
 * runner.ts (the CLI entry, which pulls dotenv/config transitively) so they can
 * be unit-tested without loading the whole pipeline or mutating process.env.
 */

/**
 * Parse an integer env value, falling back to `fallback` when it's missing or
 * not a finite number. Plain `parseInt(process.env.X ?? '5', 10)` yields NaN for
 * a non-numeric override (e.g. MAX_RETRIES=foo), and `typeof NaN === 'number'`
 * lets that NaN silently flow into downstream math.
 */
export function parseIntOr(raw: string | undefined, fallback: number): number {
  const n = parseInt(raw ?? '', 10);
  return Number.isFinite(n) ? n : fallback;
}

/** Float counterpart of `parseIntOr`. */
export function parseFloatOr(raw: string | undefined, fallback: number): number {
  const n = parseFloat(raw ?? '');
  return Number.isFinite(n) ? n : fallback;
}

/**
 * Count how many pipeline phases have completed, given the run's `results` map
 * and the set of real phase names. `results` also holds post-pipeline keys
 * (scoring, cost, …) which must not be counted as phases. Used both to drive the
 * live `currentStep` and to detect a resume (count > 0 → already-started run).
 */
export function completedPhaseCount(results: Record<string, unknown>, phaseNames: Iterable<string>): number {
  const names = phaseNames instanceof Set ? phaseNames : new Set(phaseNames);
  let n = 0;
  for (const key of Object.keys(results)) if (names.has(key)) n++;
  return n;
}

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

/** Resolve the voiceover source mode. Only an explicit 'narrator' switches; anything else (incl. undefined/typo) keeps the default script-file path. */
export function resolveNarrationMode(raw: string | undefined): 'script' | 'narrator' {
  return (raw ?? '').trim().toLowerCase() === 'narrator' ? 'narrator' : 'script';
}

/** Choose the caption source text: prefer model-generated narration (narrator mode) when present, else the script. */
export function pickCaptionText(narrationText: string | undefined, script: string): string {
  const n = narrationText?.trim();
  return n ? n : script;
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
 *
 * Cues break on natural language boundaries — sentence ends first, then clause
 * punctuation (comma / dash / semicolon) once a line is reasonably full, and only
 * a word cap as a last resort — so phrases aren't split mid-thought.
 */
export function scriptToSrt(script: string, durationSec: number, maxWords = 7): string {
  // A non-finite duration (NaN from a failed probe, Infinity) would propagate
  // into every cue timestamp as "NaN:NaN:NaN,NaN" — fail loudly instead.
  if (!Number.isFinite(durationSec)) throw new Error(`scriptToSrt: durationSec must be finite, got ${durationSec}`);
  const words = script.split(/\s+/).filter(Boolean);
  if (words.length === 0) return '';
  const cues: string[][] = [];
  let cur: string[] = [];
  for (const w of words) {
    cur.push(w);
    const endsSentence = /[.!?]["'’”)\]]?$/.test(w);
    const endsClause = /[,;:—–-]$/.test(w);
    if (
      (endsSentence && cur.length >= 2) ||   // prefer to end a cue at a full stop
      (endsClause && cur.length >= 4) ||      // break at a clause once the line is full
      cur.length >= maxWords                  // hard cap so no cue runs too long
    ) {
      cues.push(cur);
      cur = [];
    }
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

export type VideoTierChoice = {
  gen: string;
  model?: string;
};

/**
 * Resolve the b-roll spend tier to a generator alias + optional model.
 * 'hero' (default) keeps the run's configured generator untouched. 'draft'
 * routes to the cheap iteration config and is deliberately explicit: with no
 * BROLL_DRAFT_GENERATOR set it throws rather than silently rendering finals
 * on a guessed cheap model — tier choice is a spend decision, not a default.
 */
export function resolveVideoTier(
  tier: string,
  env: Record<string, string | undefined>,
  fallbackGen: string,
  knownGens?: readonly string[],
): VideoTierChoice {
  const t = tier.toLowerCase();
  if (t === 'hero') return { gen: fallbackGen };
  if (t !== 'draft') throw new Error(`[B-roll] unknown tier '${tier}' — use draft or hero`);
  const gen = env.BROLL_DRAFT_GENERATOR?.toLowerCase();
  if (!gen) {
    throw new Error(
      '[B-roll] draft tier requires BROLL_DRAFT_GENERATOR ' +
      "(e.g. 'wan-alpha', or 'replicate' + BROLL_DRAFT_MODEL=<owner/model>, or 'kling')",
    );
  }
  // An unrecognized draft generator must throw here: downstream alias lookup
  // falls back to vertex, which would silently run the *draft* tier on the
  // premium provider — the exact spend surprise this tier exists to prevent.
  if (knownGens && !knownGens.includes(gen)) {
    throw new Error(`[B-roll] BROLL_DRAFT_GENERATOR '${gen}' is not a known generator (known: ${knownGens.join(', ')})`);
  }
  return { gen, model: env.BROLL_DRAFT_MODEL || undefined };
}
