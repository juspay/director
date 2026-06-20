/**
 * Rate limiting and retry utilities — matches dopamine's exponentialBackoff pattern.
 */

import { DELAY_BETWEEN_REQUESTS_MS, MAX_RETRIES, RETRY_BASE_DELAY_MS } from '../pipeline/config.ts';

export function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * Quota/rate-limit classifier — decides exponential (quota) vs linear (other)
 * backoff. Matches on precise markers; a bare `includes('rate')` would also
 * fire on innocent messages like "moderate rate", "iterate", "exchange rate"
 * and wrongly apply exponential backoff to non-quota errors. Exported for tests.
 */
export function isQuotaError(message: string): boolean {
  const lower = message.toLowerCase();
  return (
    message.includes('429') ||
    message.includes('RESOURCE_EXHAUSTED') ||
    lower.includes('quota') ||
    lower.includes('too many requests') ||
    /rate[ _-]?limit/i.test(message)
  );
}

export type BackoffResult<T> =
  | { success: true; value: T }
  | { success: false; error: string };

/**
 * Retry an async function with exponential backoff.
 *
 * - 429/RESOURCE_EXHAUSTED: exponential (baseDelay * 2^attempt)
 * - Other errors: linear (baseDelay * (attempt + 1))
 * - Returns discriminated union — never throws.
 */
export async function exponentialBackoff<T>(
  fn: () => Promise<T>,
  maxRetries: number = MAX_RETRIES,
  baseDelayMs: number = RETRY_BASE_DELAY_MS,
): Promise<BackoffResult<T>> {
  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      const value = await fn();
      return { success: true, value };
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : String(err);
      const quota = isQuotaError(message);

      if (attempt === maxRetries) {
        console.error(`[retry] Failed after ${maxRetries + 1} attempts: ${message}`);
        return { success: false, error: message };
      }

      const delay = quota
        ? baseDelayMs * Math.pow(2, attempt)     // Exponential for quota
        : baseDelayMs * (attempt + 1);           // Linear for other errors

      console.warn(
        `[retry] Attempt ${attempt + 1}/${maxRetries + 1} failed: ${message.slice(0, 100)}. ` +
        `Retrying in ${(delay / 1000).toFixed(1)}s (${quota ? 'exponential' : 'linear'})`,
      );

      await sleep(delay);
    }
  }

  return { success: false, error: 'Unexpected: exceeded retry loop' };
}

/**
 * Delay between sequential API calls (flat cooldown).
 */
export async function rateLimitDelay(): Promise<void> {
  await sleep(DELAY_BETWEEN_REQUESTS_MS);
}
