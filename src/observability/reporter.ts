/**
 * ReporterAgent — emits status bursts at configurable intervals (default 40s).
 * Runs as a background loop, printing compact status to stdout.
 */
import { getMetrics, getMetricsSummary } from './agent-observer.ts';
import { REPORTER_INTERVAL_MS } from '../pipeline/config.ts';

let reporterRunning = false;
let reporterInterval: ReturnType<typeof setInterval> | null = null;
let reportCount = 0;

/**
 * Start the reporter loop (non-blocking).
 */
export function startReporter(intervalMs: number = REPORTER_INTERVAL_MS): void {
  if (reporterRunning) return;
  reporterRunning = true;
  reportCount = 0;

  console.log(`[Reporter] Started (${intervalMs / 1000}s interval)`);

  reporterInterval = setInterval(() => {
    reportCount++;
    emitStatusBurst();
  }, intervalMs);
}

/**
 * Stop the reporter loop.
 */
export function stopReporter(): void {
  if (reporterInterval) {
    clearInterval(reporterInterval);
    reporterInterval = null;
  }
  reporterRunning = false;
  console.log(`[Reporter] Stopped after ${reportCount} reports`);
}

/**
 * Emit a single compact status burst.
 */
function emitStatusBurst(): void {
  const summary = getMetricsSummary();
  const metrics = getMetrics();
  const now = new Date().toISOString().slice(11, 19); // HH:MM:SS

  // Recent agents (last 5)
  const recent = metrics.slice(-5).map((m) => {
    const status = m.success ? '+' : 'X';
    const time = (m.executionTimeMs / 1000).toFixed(1);
    return `${status}${m.agentName.replace('Agent', '')}(${time}s)`;
  });

  const line = [
    `[${now}]`,
    `#${reportCount}`,
    `${summary.succeeded}/${summary.total} ok`,
    `${summary.failed} fail`,
    `$${summary.totalCost.toFixed(3)}`,
    `${(summary.totalTimeMs / 1000).toFixed(0)}s total`,
    recent.length > 0 ? `| ${recent.join(' ')}` : '',
  ].filter(Boolean).join(' ');

  console.log(`[Reporter] ${line}`);
}

/**
 * Get a one-line status string (for external consumers).
 */
export function getStatusLine(): string {
  const s = getMetricsSummary();
  return `${s.succeeded}/${s.total} agents ok, ${s.failed} failed, $${s.totalCost.toFixed(3)}, ${(s.totalTimeMs / 1000).toFixed(0)}s`;
}
