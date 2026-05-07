import type { PolicyViolation } from './policy.ts';

export type AgentMetrics = {
  agentName: string;
  executionTimeMs: number;
  tokensUsed: number;
  costEstimate: number;
  success: boolean;
  retries: number;
  timestamp: string;
};

export type ObservabilityReport = {
  timestamp: string;
  totalAgents: number;
  completedAgents: number;
  failedAgents: number;
  totalCost: number;
  totalTokens: number;
  policyViolations: PolicyViolation[];
  agentMetrics: AgentMetrics[];
};

export type GroupEvaluation = {
  group: string;
  agents: string[];
  avgExecutionMs: number;
  successRate: number;
  totalCost: number;
  policyViolations: PolicyViolation[];
  grade: 'A' | 'B' | 'C' | 'D' | 'F';
};

export type Penalty = {
  agent: string;
  reason: string;
  severity: 'critical' | 'major' | 'minor';
  action: string;
  timestamp: string;
};
