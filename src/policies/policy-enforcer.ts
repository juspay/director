/**
 * PolicyEnforcer — validates outputs during execution.
 * Cycle 2 of the 3-cycle policy system: Create → Enforce → Validate.
 *
 * Called after each agent produces output. Returns violations immediately.
 */
import type { Policy, PolicyRule, PolicyViolation } from '../types/index.ts';

/**
 * Enforce a policy against an output object.
 * Returns array of violations (empty = all rules passed).
 */
export function enforcePolicy(policy: Policy, output: Record<string, unknown>): PolicyViolation[] {
  const violations: PolicyViolation[] = [];

  for (const rule of policy.rules) {
    const actual = getNestedValue(output, rule.field);
    const violated = checkRule(rule, actual);

    if (violated) {
      violations.push({
        policy: policy.name,
        rule: rule.message,
        actual,
        expected: rule.value,
        severity: policy.severity,
        timestamp: new Date().toISOString(),
      });
    }
  }

  if (violations.length > 0) {
    console.warn(
      `[PolicyEnforcer] ${policy.name}: ${violations.length} violation(s)`,
    );
    for (const v of violations) {
      const icon = v.severity === 'error' ? '!!!' : v.severity === 'warning' ? '!!' : '!';
      console.warn(`  ${icon} ${v.rule} (actual: ${JSON.stringify(v.actual)}, expected: ${JSON.stringify(v.expected)})`);
    }
  }

  return violations;
}

/**
 * Enforce multiple policies against an output.
 */
export function enforceAllPolicies(
  policies: Policy[],
  output: Record<string, unknown>,
): PolicyViolation[] {
  return policies.flatMap((policy) => enforcePolicy(policy, output));
}

/**
 * Check if output passes all policies (no error-severity violations).
 */
export function passesAllPolicies(
  policies: Policy[],
  output: Record<string, unknown>,
): { passed: boolean; violations: PolicyViolation[] } {
  const violations = enforceAllPolicies(policies, output);
  const errors = violations.filter((v) => v.severity === 'error');
  return { passed: errors.length === 0, violations };
}

// Helpers

function checkRule(rule: PolicyRule, actual: unknown): boolean {
  switch (rule.condition) {
    // Negated comparisons so a NaN field (typeof NaN === 'number', but every
    // comparison with NaN is false) is reported as a violation rather than
    // silently satisfying the bound.
    case 'min':
      return typeof actual === 'number' && !(actual >= (rule.value as number));
    case 'max': {
      if (Array.isArray(actual)) return actual.length > (rule.value as number);
      return typeof actual === 'number' && !(actual <= (rule.value as number));
    }
    case 'equals': {
      if (typeof rule.value === 'number' && typeof actual === 'boolean') {
        return actual !== (rule.value === 1);
      }
      return actual !== rule.value;
    }
    case 'contains':
      return typeof actual === 'string' && !actual.includes(rule.value as string);
    case 'regex':
      return typeof actual === 'string' && !new RegExp(rule.value as string).test(actual);
    default:
      return false;
  }
}

function getNestedValue(obj: Record<string, unknown>, path: string): unknown {
  return path.split('.').reduce<unknown>((current, key) => {
    if (current && typeof current === 'object' && key in (current as Record<string, unknown>)) {
      return (current as Record<string, unknown>)[key];
    }
    return undefined;
  }, obj);
}
