export type Policy = {
  name: string;
  description: string;
  rules: PolicyRule[];
  severity: 'error' | 'warning' | 'info';
};

export type PolicyRule = {
  field: string;
  condition: 'min' | 'max' | 'equals' | 'contains' | 'regex';
  value: number | string;
  message: string;
};

export type PolicyViolation = {
  policy: string;
  rule: string;
  actual: unknown;
  expected: unknown;
  severity: 'error' | 'warning' | 'info';
  timestamp: string;
};

export type ComplianceReport = {
  timestamp: string;
  totalPolicies: number;
  totalRules: number;
  violations: PolicyViolation[];
  errorCount: number;
  warningCount: number;
  infoCount: number;
  compliant: boolean;
  summary: string;
};
