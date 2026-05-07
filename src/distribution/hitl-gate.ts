/**
 * Human-in-the-loop gate for irreversible distribution actions
 * (Mux upload, Late publish).
 *
 * App-level only — a CLI stdin prompt for interactive runs, with auto-approve
 * for non-TTY contexts (CI) and explicit `HITL_AUTO_APPROVE=1` override for
 * scripted runs. No NeuroLink primitives involved.
 */
import readline from 'node:readline';
import type { ApprovalRequest } from '../types/index.ts';

export type { ApprovalRequest } from '../types/index.ts';

async function cliPrompt(req: ApprovalRequest): Promise<boolean> {
  if (!process.stdin.isTTY) return true;
  const rl = readline.createInterface({ input: process.stdin, output: process.stdout });
  const answer = await new Promise<string>((resolve) => {
    rl.question(
      `\n[HITL] ${req.action}: ${req.description}\n  Context: ${JSON.stringify(req.context ?? {})}\n  Approve? (y/N): `,
      (a) => { rl.close(); resolve(a); },
    );
  });
  return /^y(es)?$/i.test(answer.trim());
}

export async function requestApproval(req: ApprovalRequest): Promise<boolean> {
  if (process.env.HITL_AUTO_APPROVE === '1') return true;
  if (process.env.HITL_DISABLED === '1') return true;
  return cliPrompt(req);
}
