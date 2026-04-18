import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import {
  enforcePolicy,
  enforceAllPolicies,
  passesAllPolicies,
} from '../../src/policies/policy-enforcer.ts';
import type { Policy } from '../../src/types/index.ts';

const minPolicy: Policy = {
  name: 'min-score',
  description: 'Score must be at least 9.0',
  severity: 'error',
  rules: [{ field: 'score', condition: 'min', value: 9.0, message: 'score too low' }],
};

const maxPolicy: Policy = {
  name: 'max-duration',
  description: 'Duration must not exceed 180s',
  severity: 'warning',
  rules: [{ field: 'duration', condition: 'max', value: 180, message: 'too long' }],
};

const containsPolicy: Policy = {
  name: 'required-word',
  description: 'Title must contain "demo"',
  severity: 'warning',
  rules: [{ field: 'title', condition: 'contains', value: 'demo', message: 'missing demo' }],
};

const regexPolicy: Policy = {
  name: 'version-format',
  description: 'version must match vX.Y.Z',
  severity: 'error',
  rules: [{ field: 'version', condition: 'regex', value: '^v\\d+\\.\\d+\\.\\d+$', message: 'bad version' }],
};

const equalsPolicy: Policy = {
  name: 'status-ok',
  description: 'status must equal ok',
  severity: 'info',
  rules: [{ field: 'status', condition: 'equals', value: 'ok', message: 'not ok' }],
};

describe('enforcePolicy', () => {
  it('passes when min rule is satisfied', () => {
    assert.deepEqual(enforcePolicy(minPolicy, { score: 9.5 }), []);
  });

  it('violates when min rule is not satisfied', () => {
    const v = enforcePolicy(minPolicy, { score: 8.5 });
    assert.equal(v.length, 1);
    assert.equal(v[0].actual, 8.5);
    assert.equal(v[0].expected, 9.0);
    assert.equal(v[0].severity, 'error');
  });

  it('passes when max rule is satisfied', () => {
    assert.deepEqual(enforcePolicy(maxPolicy, { duration: 120 }), []);
  });

  it('violates when max is exceeded', () => {
    assert.equal(enforcePolicy(maxPolicy, { duration: 200 }).length, 1);
  });

  it('treats max on arrays as length check', () => {
    const policy: Policy = {
      name: 'max-items',
      description: 'items array must have at most 3 items',
      severity: 'warning',
      rules: [{ field: 'items', condition: 'max', value: 3, message: 'too many items' }],
    };
    assert.equal(enforcePolicy(policy, { items: [1, 2] }).length, 0);
    assert.equal(enforcePolicy(policy, { items: [1, 2, 3, 4] }).length, 1);
  });

  it('violates when contains rule not met', () => {
    assert.equal(enforcePolicy(containsPolicy, { title: 'product launch' }).length, 1);
    assert.equal(enforcePolicy(containsPolicy, { title: 'demo video' }).length, 0);
  });

  it('violates when regex does not match', () => {
    assert.equal(enforcePolicy(regexPolicy, { version: '1.0' }).length, 1);
    assert.equal(enforcePolicy(regexPolicy, { version: 'v1.0.0' }).length, 0);
  });

  it('violates when equals rule not met', () => {
    assert.equal(enforcePolicy(equalsPolicy, { status: 'error' }).length, 1);
    assert.equal(enforcePolicy(equalsPolicy, { status: 'ok' }).length, 0);
  });

  it('handles nested field paths via dot notation', () => {
    const policy: Policy = {
      name: 'nested',
      description: 'metrics.score must be at least 8',
      severity: 'error',
      rules: [{ field: 'metrics.score', condition: 'min', value: 8, message: 'nested low' }],
    };
    assert.equal(enforcePolicy(policy, { metrics: { score: 9 } }).length, 0);
    assert.equal(enforcePolicy(policy, { metrics: { score: 5 } }).length, 1);
  });

  it('treats missing nested fields as undefined (no violation from min/max)', () => {
    assert.deepEqual(enforcePolicy(minPolicy, {}), []);
  });
});

describe('enforceAllPolicies', () => {
  it('aggregates violations across policies', () => {
    const violations = enforceAllPolicies(
      [minPolicy, maxPolicy],
      { score: 5, duration: 500 },
    );
    assert.equal(violations.length, 2);
  });
});

describe('passesAllPolicies', () => {
  it('passes when only non-error violations exist', () => {
    const result = passesAllPolicies([maxPolicy], { duration: 200 });
    assert.equal(result.passed, true);
    assert.equal(result.violations.length, 1);
  });

  it('fails when any error-severity violation exists', () => {
    const result = passesAllPolicies([minPolicy, maxPolicy], { score: 5, duration: 200 });
    assert.equal(result.passed, false);
    assert.equal(result.violations.length, 2);
  });

  it('passes when all rules satisfied', () => {
    const result = passesAllPolicies([minPolicy, maxPolicy], { score: 10, duration: 120 });
    assert.equal(result.passed, true);
    assert.equal(result.violations.length, 0);
  });
});
