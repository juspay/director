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

// CLI: npm run report — prints the last run's metrics from the persisted log.
if (import.meta.url === `file://${process.argv[1]}`) {
  const fs = await import('fs/promises');
  const path = await import('path');
  const { STATE_DIR } = await import('../pipeline/config.ts');
  const logPath = path.join(STATE_DIR, 'agent-metrics.jsonl');
  try {
    const raw = await fs.readFile(logPath, 'utf-8');
    const rows = raw.split('\n').filter(Boolean).map((l) => JSON.parse(l) as { agentName: string; executionTimeMs: number; costEstimate: number; success: boolean });
    if (rows.length === 0) { console.log('[Reporter] No metrics logged yet.'); process.exit(0); }
    const ok = rows.filter((r) => r.success).length;
    const cost = rows.reduce((s, r) => s + r.costEstimate, 0);
    const time = rows.reduce((s, r) => s + r.executionTimeMs, 0);
    console.log(`[Reporter] ${rows.length} agent runs — ${ok} ok, ${rows.length - ok} failed, $${cost.toFixed(3)}, ${(time / 1000).toFixed(0)}s total`);
    for (const r of rows) {
      console.log(`  ${r.success ? '+' : 'X'} ${r.agentName.padEnd(16)} ${(r.executionTimeMs / 1000).toFixed(1)}s  $${r.costEstimate.toFixed(4)}`);
    }
  } catch {
    console.log(`[Reporter] No metrics log found at ${logPath}. Run the pipeline first.`);
  }
}
