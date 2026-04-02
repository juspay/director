/**
 * ObservabilityAgent — monitors agent execution, logs metrics.
 * Wraps any agent function to capture timing, tokens, cost, and success.
 */
import type { AgentMetrics } from '../types/index.ts';
import { appendToLog } from '../pipeline/state.ts';

const metricsBuffer: AgentMetrics[] = [];

/**
 * Wrap an agent function with observability tracking.
 */
export function observe<T>(
  agentName: string,
  fn: () => Promise<T>,
): Promise<{ result: T | null; metrics: AgentMetrics }> {
  return observeAgent(agentName, fn);
}

async function observeAgent<T>(
  agentName: string,
  fn: () => Promise<T>,
): Promise<{ result: T | null; metrics: AgentMetrics }> {
  const start = Date.now();
  let success = false;
  let retries = 0;
  let result: T | null = null;

  try {
    result = await fn();
    success = result !== null;
  } catch (err) {
    console.error(`[Observer] ${agentName} threw: ${err instanceof Error ? err.message : String(err)}`);
  }

  const executionTimeMs = Date.now() - start;

  const metrics: AgentMetrics = {
    agentName,
    executionTimeMs,
    tokensUsed: (result as Record<string, unknown>)?.tokensUsed as number ?? 0,
    costEstimate: estimateCost(executionTimeMs),
    success,
    retries,
    timestamp: new Date().toISOString(),
  };

  metricsBuffer.push(metrics);

  // Persist to log
  await appendToLog('agent-metrics.jsonl', metrics as unknown as Record<string, unknown>);

  const status = success ? 'OK' : 'FAIL';
  console.log(
    `[Observer] ${agentName}: ${status} (${(executionTimeMs / 1000).toFixed(1)}s, ~$${metrics.costEstimate.toFixed(4)})`,
  );

  return { result, metrics };
}

/**
 * Get all collected metrics for this session.
 */
export function getMetrics(): AgentMetrics[] {
  return [...metricsBuffer];
}

/**
 * Get summary of all agent executions.
 */
export function getMetricsSummary(): {
  total: number;
  succeeded: number;
  failed: number;
  totalTimeMs: number;
  totalCost: number;
} {
  const succeeded = metricsBuffer.filter((m) => m.success).length;
  return {
    total: metricsBuffer.length,
    succeeded,
    failed: metricsBuffer.length - succeeded,
    totalTimeMs: metricsBuffer.reduce((sum, m) => sum + m.executionTimeMs, 0),
    totalCost: metricsBuffer.reduce((sum, m) => sum + m.costEstimate, 0),
  };
}

function estimateCost(executionTimeMs: number): number {
  // Rough estimate: ~$0.001 per second of Gemini API usage
  return (executionTimeMs / 1000) * 0.001;
}
