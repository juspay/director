/**
 * Pacing + backoff for paid video submits.
 *
 * Replicate throttles low-credit accounts to 6 predictions/min with burst 1
 * (429 body: "…while you have less than $5.0 in credit… resets in ~5s").
 * NeuroLink's internal retries land ~1s apart, so every attempt burns inside
 * the same window and the next segment's first try arrives still throttled —
 * a cascade that killed all 8 b-roll segments of a live run three times.
 *
 * Two independent guards, both no-ops for unthrottled accounts:
 *  - submit spacing (VIDEO_SUBMIT_INTERVAL_MS, default 0 = off) keeps paid
 *    submits at least the given interval apart across the whole process;
 *  - rate-limit backoff (always on) re-attempts only rate-limited calls,
 *    waiting long enough for the throttle window to reset.
 *
 * @module generators/pacing
 */

/** Backoff schedule for rate-limited submits: one minute-window plus margin. */
export const RATE_LIMIT_BACKOFF_MS: readonly number[] = [15_000, 35_000];

let lastSubmitAt = 0;

/** Test hook — pacing state is process-global by design. */
export function resetVideoPacing(): void {
  lastSubmitAt = 0;
}

export function isRateLimitError(err: unknown): boolean {
  const msg = err instanceof Error ? err.message : String(err);
  return /rate.?limit|throttl|\b429\b/i.test(msg);
}

export type PacedCallHooks = {
  sleep?: (ms: number) => Promise<void>;
  now?: () => number;
};

/**
 * Run one paid submit with global spacing and rate-limit-only backoff.
 * Non-rate-limit errors propagate immediately; rate-limit errors retry
 * through `retryDelaysMs`, then the last error propagates.
 */
export async function pacedVideoCall<T>(
  fn: () => Promise<T>,
  opts: { intervalMs: number; retryDelaysMs: readonly number[] } & PacedCallHooks,
): Promise<T> {
  const sleep = opts.sleep ?? ((ms: number) => new Promise<void>((r) => setTimeout(r, ms)));
  const now = opts.now ?? Date.now;
  for (let attempt = 0; ; attempt++) {
    const wait = opts.intervalMs - (now() - lastSubmitAt);
    if (wait > 0) await sleep(wait);
    lastSubmitAt = now();
    try {
      return await fn();
    } catch (err) {
      const delay = opts.retryDelaysMs[attempt];
      if (delay === undefined || !isRateLimitError(err)) throw err;
      console.warn(
        `[video] rate-limited; backing off ${Math.round(delay / 1000)}s (retry ${attempt + 1}/${opts.retryDelaysMs.length})`,
      );
      await sleep(delay);
    }
  }
}
