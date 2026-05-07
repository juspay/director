/**
 * PolicyValidator — post-execution compliance check.
 * Cycle 3 of the 3-cycle policy system: Create → Enforce → Validate.
 *
 * Runs after all agents complete. Validates the full pipeline state
 * against all policies and generates a compliance report.
 */
import type { Policy, PolicyViolation, PipelineState, ComplianceReport } from '../types/index.ts';
import { ALL_POLICIES } from './policy-creator.ts';
import { enforcePolicy } from './policy-enforcer.ts';
import { loadState } from '../pipeline/state.ts';

export type { ComplianceReport } from '../types/index.ts';

/**
 * Validate the full pipeline output against all policies.
 */
export async function validatePipelineCompliance(): Promise<ComplianceReport> {
  const state = await loadState<PipelineState>('pipeline-state.json', {
    currentStep: 0,
    totalSteps: 0,
    results: {},
    errors: [],
    startedAt: '',
    updatedAt: '',
  });

  const allViolations: PolicyViolation[] = [];
  const totalRules = ALL_POLICIES.reduce((sum, p) => sum + p.rules.length, 0);

  // Check each result against its matching policy
  const policyMap: Record<string, string> = {
    video_scoring: 'video_score_quality',
    script_scoring: 'script_lock_ready',
    acoustic_analysis: 'acoustic_quality',
    scene_analysis: 'scene_quality',
  };

  for (const [stepName, result] of Object.entries(state.results)) {
    if (!result || typeof result !== 'object') continue;

    const policyName = policyMap[stepName];
    if (!policyName) continue;

    const policy = ALL_POLICIES.find((p) => p.name === policyName);
    if (!policy) continue;

    const violations = enforcePolicy(policy, result as Record<string, unknown>);
    allViolations.push(...violations);
  }

  const errorCount = allViolations.filter((v) => v.severity === 'error').length;
  const warningCount = allViolations.filter((v) => v.severity === 'warning').length;
  const infoCount = allViolations.filter((v) => v.severity === 'info').length;
  const compliant = errorCount === 0;

  const summary = compliant
    ? `COMPLIANT: All ${totalRules} rules passed (${warningCount} warnings).`
    : `NON-COMPLIANT: ${errorCount} errors, ${warningCount} warnings across ${allViolations.length} violations.`;

  const report: ComplianceReport = {
    timestamp: new Date().toISOString(),
    totalPolicies: ALL_POLICIES.length,
    totalRules,
    violations: allViolations,
    errorCount,
    warningCount,
    infoCount,
    compliant,
    summary,
  };

  console.log(`\n${'='.repeat(60)}`);
  console.log(`  POLICY COMPLIANCE REPORT`);
  console.log(`${'='.repeat(60)}`);
  console.log(`  Status: ${compliant ? 'COMPLIANT' : 'NON-COMPLIANT'}`);
  console.log(`  Policies: ${ALL_POLICIES.length} | Rules: ${totalRules}`);
  console.log(`  Errors: ${errorCount} | Warnings: ${warningCount} | Info: ${infoCount}`);
  if (allViolations.length > 0) {
    console.log(`\n  Violations:`);
    for (const v of allViolations) {
      const icon = v.severity === 'error' ? 'X' : v.severity === 'warning' ? '!' : 'i';
      console.log(`    [${icon}] ${v.policy}: ${v.rule}`);
    }
  }
  console.log(`${'='.repeat(60)}\n`);

  return report;
}
