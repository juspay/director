/**
 * SuperObservabilityAgent — observes everything, penalizes violations.
 * The top-level overseer in the observability hierarchy.
 *
 * Responsibilities:
 * 1. Aggregates metrics from all agent observers
 * 2. Evaluates group-level quality via EvaluationAgent
 * 3. Validates policy compliance via PolicyValidator
 * 4. Applies penalties (logged) for violations
 * 5. Generates comprehensive observability report
 */
import type { ObservabilityReport, PolicyViolation, AgentMetrics, Penalty } from '../types/index.ts';
import { getMetrics, getMetricsSummary } from './agent-observer.ts';
import { evaluateAllGroups, printEvaluationReport } from './evaluation-agent.ts';
import { validatePipelineCompliance } from '../policies/policy-validator.ts';
import { saveState } from '../pipeline/state.ts';

const penalties: Penalty[] = [];

/**
 * Run full observability sweep — metrics, evaluation, compliance, penalties.
 */
export async function runSuperObserver(): Promise<ObservabilityReport> {
  console.log(`\n${'#'.repeat(60)}`);
  console.log(`  SUPER OBSERVABILITY AGENT — FULL SWEEP`);
  console.log(`${'#'.repeat(60)}\n`);

  // 1. Collect metrics
  const metrics = getMetrics();
  const summary = getMetricsSummary();
  console.log(`[SuperObserver] Agents observed: ${summary.total} (${summary.succeeded} ok, ${summary.failed} failed)`);
  console.log(`[SuperObserver] Total cost: $${summary.totalCost.toFixed(4)} | Time: ${(summary.totalTimeMs / 1000).toFixed(1)}s`);

  // 2. Group evaluations
  const evaluations = evaluateAllGroups();
  printEvaluationReport(evaluations);

  // 3. Policy compliance
  const compliance = await validatePipelineCompliance();

  // 4. Apply penalties
  applyPenalties(metrics, compliance.violations);

  // 5. Generate report
  const report: ObservabilityReport = {
    timestamp: new Date().toISOString(),
    totalAgents: summary.total,
    completedAgents: summary.succeeded,
    failedAgents: summary.failed,
    totalCost: summary.totalCost,
    totalTokens: metrics.reduce((sum, m) => sum + m.tokensUsed, 0),
    policyViolations: compliance.violations,
    agentMetrics: metrics,
  };

  // Persist report
  await saveState('observability-report.json', {
    ...report,
    evaluations,
    compliance,
    penalties,
  });

  console.log(`\n[SuperObserver] Report saved. Penalties: ${penalties.length}`);
  return report;
}

function applyPenalties(metrics: AgentMetrics[], violations: PolicyViolation[]): void {
  // Penalize agents that failed
  for (const m of metrics) {
    if (!m.success) {
      penalties.push({
        agent: m.agentName,
        reason: 'Agent execution failed',
        severity: 'critical',
        action: 'Flag for retry in next iteration',
        timestamp: new Date().toISOString(),
      });
    }

    // Penalize slow agents (>3 min)
    if (m.executionTimeMs > 180000) {
      penalties.push({
        agent: m.agentName,
        reason: `Execution too slow: ${(m.executionTimeMs / 1000).toFixed(0)}s`,
        severity: 'major',
        action: 'Consider model downgrade or input size reduction',
        timestamp: new Date().toISOString(),
      });
    }

    // Penalize expensive agents (>$0.50)
    if (m.costEstimate > 0.50) {
      penalties.push({
        agent: m.agentName,
        reason: `Cost too high: $${m.costEstimate.toFixed(4)}`,
        severity: 'minor',
        action: 'Switch to Flash tier or reduce maxTokens',
        timestamp: new Date().toISOString(),
      });
    }
  }

  // Penalize policy violations
  for (const v of violations) {
    if (v.severity === 'error') {
      penalties.push({
        agent: v.policy,
        reason: v.rule,
        severity: 'critical',
        action: 'Block release until resolved',
        timestamp: new Date().toISOString(),
      });
    }
  }

  if (penalties.length > 0) {
    console.log(`\n  PENALTIES (${penalties.length}):`);
    for (const p of penalties) {
      const icon = p.severity === 'critical' ? 'XXX' : p.severity === 'major' ? 'XX' : 'X';
      console.log(`    [${icon}] ${p.agent}: ${p.reason} → ${p.action}`);
    }
  }
}

// CLI: npm run observe — runs a full observability sweep over collected metrics.
if (import.meta.url === `file://${process.argv[1]}`) {
  runSuperObserver().catch((e) => {
    console.error('[SuperObserver] Failed:', e instanceof Error ? e.message : e);
    process.exit(1);
  });
}
