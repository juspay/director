/**
 * EvaluationAgent — scores agent group quality.
 * Groups agents by domain, evaluates each group's collective output quality.
 */
import type { AgentMetrics, PolicyViolation, GroupEvaluation } from '../types/index.ts';
import { getMetrics } from './agent-observer.ts';
import { enforcePolicy } from '../policies/policy-enforcer.ts';
import { AGENT_EXECUTION_POLICY } from '../policies/policy-creator.ts';

export type { GroupEvaluation } from '../types/index.ts';

const AGENT_GROUPS: Record<string, string[]> = {
  scoring: ['VideoScorer', 'ScriptScorer', 'SceneAnalyzer'],
  creative: ['CreativeDirector', 'AcousticAnalyzer'],
  comparison: ['VideoComparator'],
  pipeline: ['runner'],
};

/**
 * Evaluate all agent groups.
 */
export function evaluateAllGroups(): GroupEvaluation[] {
  const metrics = getMetrics();
  return Object.entries(AGENT_GROUPS).map(([group, agentNames]) =>
    evaluateGroup(group, agentNames, metrics),
  );
}

function evaluateGroup(
  group: string,
  agentNames: string[],
  allMetrics: AgentMetrics[],
): GroupEvaluation {
  const groupMetrics = allMetrics.filter((m) =>
    agentNames.some((name) => m.agentName.includes(name)),
  );

  if (groupMetrics.length === 0) {
    return {
      group,
      agents: agentNames,
      avgExecutionMs: 0,
      successRate: 1.0,
      totalCost: 0,
      policyViolations: [],
      grade: 'A',
    };
  }

  const avgExecutionMs =
    groupMetrics.reduce((sum, m) => sum + m.executionTimeMs, 0) / groupMetrics.length;
  const successRate =
    groupMetrics.filter((m) => m.success).length / groupMetrics.length;
  const totalCost = groupMetrics.reduce((sum, m) => sum + m.costEstimate, 0);

  // Check each agent's metrics against execution policy
  const violations = groupMetrics.flatMap((m) =>
    enforcePolicy(AGENT_EXECUTION_POLICY, m as unknown as Record<string, unknown>),
  );

  const grade = calculateGrade(successRate, violations.length, avgExecutionMs);

  return { group, agents: agentNames, avgExecutionMs, successRate, totalCost, policyViolations: violations, grade };
}

function calculateGrade(
  successRate: number,
  violationCount: number,
  avgMs: number,
): 'A' | 'B' | 'C' | 'D' | 'F' {
  if (successRate === 1.0 && violationCount === 0 && avgMs < 60000) return 'A';
  if (successRate >= 0.9 && violationCount <= 1) return 'B';
  if (successRate >= 0.7 && violationCount <= 3) return 'C';
  if (successRate >= 0.5) return 'D';
  return 'F';
}

/**
 * Print evaluation report.
 */
export function printEvaluationReport(evaluations: GroupEvaluation[]): void {
  console.log(`\n${'='.repeat(50)}`);
  console.log(`  AGENT GROUP EVALUATIONS`);
  console.log(`${'='.repeat(50)}`);
  for (const e of evaluations) {
    console.log(
      `  [${e.grade}] ${e.group}: ${(e.successRate * 100).toFixed(0)}% success, ` +
      `${(e.avgExecutionMs / 1000).toFixed(1)}s avg, $${e.totalCost.toFixed(4)}, ` +
      `${e.policyViolations.length} violations`,
    );
  }
  console.log(`${'='.repeat(50)}\n`);
}
