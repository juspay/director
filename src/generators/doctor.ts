/**
 * Doctor loop — automated failure recovery for paid media-generation calls.
 *
 * Complements the consistency critic: the critic judges the *quality* of a
 * successful result; the doctor absorbs *failures*. On error it classifies
 * the failure (rule-based, no LLM), optionally rewrites the prompt through an
 * injected rewriter for safety-class blocks, and retries within a bound.
 * Pattern borrowed from VideoClaw's DoctorAgent, kept pure and injectable.
 */

export type DoctorKind = 'safety' | 'quota' | 'transient' | 'invalid_param' | 'unknown';

export type DoctorDiagnosis = {
  kind: DoctorKind;
  /** Same call may succeed again (after backoff / a prompt rewrite). */
  retryable: boolean;
  /** A prompt rewrite is the plausible fix (safety blocks). */
  rewritePrompt: boolean;
};

export type DoctorEvent = {
  attempt: number;
  kind: DoctorKind;
  action: 'retry' | 'retry_rewritten' | 'give_up';
};

/**
 * Rule-based error classification. Order matters: quota markers (429) before
 * the generic 'invalid' bucket, safety before transient — an error mentioning
 * both a policy block and a retry hint is a policy block.
 */
export function diagnoseError(message: string): DoctorDiagnosis {
  const m = message.toLowerCase();
  if (/safety|blocked|policy|violat|prohibited|refus/i.test(m)) {
    return { kind: 'safety', retryable: true, rewritePrompt: true };
  }
  if (/quota|rate.?limit|\b429\b|resource.?exhaust|too many requests/i.test(m)) {
    return { kind: 'quota', retryable: true, rewritePrompt: false };
  }
  if (/invalid|unsupported|must be|not supported|bad request|\b400\b/i.test(m)) {
    // Same params → same rejection; retrying without changing the call is spend
    // without hope. The caller's own fallbacks handle this class. Checked BEFORE
    // the transient bucket: its bare status-code heuristic (\b500\b etc.) fires
    // on messages like "must be 500 characters or less (got 503)" — which is
    // exactly how two lost B8 segments got retried as "transient" live.
    return { kind: 'invalid_param', retryable: false, rewritePrompt: false };
  }
  if (/timeout|timed out|econnreset|econnrefused|unavailable|\b(500|502|503|504)\b|network|socket/i.test(m)) {
    return { kind: 'transient', retryable: true, rewritePrompt: false };
  }
  return { kind: 'unknown', retryable: false, rewritePrompt: false };
}

export type DoctorOptions = {
  /** Extra attempts after the first failure. 0 disables the loop. Default 1. */
  retries?: number;
  /** Prompt rewriter for safety blocks. Return null/empty/unchanged to skip. */
  rewrite?: (prompt: string, error: string) => Promise<string | null>;
  /** Backoff before a retry, per attempt (1-based). Default 1500ms × attempt. */
  backoffMs?: (attempt: number) => number;
  onEvent?: (e: DoctorEvent) => void;
};

const sleep = (ms: number) => (ms > 0 ? new Promise<void>((r) => setTimeout(r, ms)) : Promise.resolve());

/**
 * Run `fn(prompt)` under the doctor. Non-retryable failures and exhausted
 * budgets rethrow the last error untouched, so callers' existing error
 * handling (fallback modes, segment drops) behaves exactly as before.
 */
export async function withDoctor<T>(
  fn: (prompt: string) => Promise<T>,
  prompt: string,
  opts: DoctorOptions = {},
): Promise<T> {
  const retries = Math.max(0, opts.retries ?? 1);
  let current = prompt;
  for (let attempt = 0; ; attempt++) {
    try {
      return await fn(current);
    } catch (e) {
      const message = e instanceof Error ? e.message : String(e);
      const d = diagnoseError(message);
      if (!d.retryable || attempt >= retries) {
        opts.onEvent?.({ attempt, kind: d.kind, action: 'give_up' });
        throw e;
      }
      let action: DoctorEvent['action'] = 'retry';
      if (d.rewritePrompt && opts.rewrite) {
        const rewritten = await opts.rewrite(current, message).catch(() => null);
        if (rewritten && rewritten.trim() && rewritten.trim() !== current) {
          current = rewritten.trim();
          action = 'retry_rewritten';
        }
      }
      opts.onEvent?.({ attempt, kind: d.kind, action });
      await sleep((opts.backoffMs ?? ((a) => 1500 * a))(attempt + 1));
    }
  }
}
