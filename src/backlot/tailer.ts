/**
 * Backlot tailer — turns the pipeline's on-disk artifacts into a UI snapshot.
 *
 * `deriveSnapshot` is pure (fully unit-testable); `readSnapshot` is the thin I/O
 * wrapper that reads the state dir. Nothing here imports runner.ts — the runner
 * pulls dotenv/config with import-time side effects, which is exactly why the
 * pure helpers it shares live in runner-helpers.ts.
 */
import fs from 'fs/promises';
import path from 'path';
import { STATE_DIR } from '../pipeline/config.ts';
import { completedPhaseCount } from '../pipeline/runner-helpers.ts';
import type { BacklotSnapshot, CostView, PhaseView, PipelineStateLike } from '../types/backlot.ts';

/**
 * Phase name/label list mirroring `runner.ts` PHASES. Duplicated deliberately —
 * runner.ts can't be imported without side effects. Keep in sync with it.
 */
export const BACKLOT_PHASES: ReadonlyArray<{ name: string; label: string }> = [
  { name: 'voiceover', label: '1. Voiceover' },
  { name: 'avatar', label: '2. Avatar' },
  { name: 'broll', label: '3. B-roll' },
  { name: 'music', label: '4. Music' },
  { name: 'render', label: '5. Render' },
  { name: 'assembly', label: '6. Assembly' },
  { name: 'captions', label: '7. Captions' },
];

const PHASE_NAMES = BACKLOT_PHASES.map((p) => p.name);

type CostLine = { provider?: string; cost?: number };

function summarizeCost(lines: CostLine[]): CostView {
  const byProvider: Record<string, number> = {};
  let total = 0;
  let events = 0;
  for (const l of lines) {
    const c = typeof l.cost === 'number' ? l.cost : 0;
    if (l.provider) byProvider[l.provider] = (byProvider[l.provider] ?? 0) + c;
    total += c;
    events++;
  }
  // Round like CostTracker.getSummary so the two figures agree to the cent.
  return { total: Math.round(total * 10000) / 10000, byProvider, events };
}

/**
 * Derive a dashboard snapshot from raw pipeline state + cost lines. Pure.
 *
 * A phase is 'done' if it has a result, 'failed' if `errors` carries its label
 * prefix (`"${label}: …"`, exactly what runner.ts:309 writes), else 'pending'.
 */
export function deriveSnapshot(state: PipelineStateLike, costLines: CostLine[]): BacklotSnapshot {
  const results = state.results ?? {};
  const errors = state.errors ?? [];
  const phases: PhaseView[] = BACKLOT_PHASES.map((p) => {
    if (results[p.name]) return { name: p.name, label: p.label, status: 'done' };
    const err = errors.find((e) => e.startsWith(`${p.label}:`));
    if (err) return { name: p.name, label: p.label, status: 'failed', error: err.slice(p.label.length + 1).trim() };
    return { name: p.name, label: p.label, status: 'pending' };
  });
  // Derive the step from results rather than trusting the persisted currentStep:
  // it's authoritative, always matches the 'done' pills, and stays correct even
  // for state files written before the runner started maintaining currentStep.
  const done = completedPhaseCount(results, PHASE_NAMES);
  return {
    phases,
    currentStep: done,
    totalSteps: BACKLOT_PHASES.length,
    complete: done === BACKLOT_PHASES.length,
    startedAt: state.startedAt ?? null,
    updatedAt: state.updatedAt ?? null,
    errors,
    cost: summarizeCost(costLines),
  };
}

/** Read a JSONL file, skipping blank/torn lines (a concurrent write may leave one). */
async function readJsonl(file: string): Promise<Record<string, unknown>[]> {
  const raw = await fs.readFile(file, 'utf8').catch(() => '');
  const out: Record<string, unknown>[] = [];
  for (const line of raw.split('\n')) {
    const t = line.trim();
    if (!t) continue;
    try { out.push(JSON.parse(t)); } catch { /* skip a partially-written trailing line */ }
  }
  return out;
}

/**
 * Resolve which state dir to tail. Precedence:
 *   1. `--state <dir>` CLI arg
 *   2. `BACKLOT_STATE_DIR` env
 *   3. the state dir with the newest `pipeline-state.json` among `<base>`'s
 *      immediate children (`<child>/.pipeline-state/`) and the legacy
 *      project-global `<base>/.pipeline-state/`
 *   4. the legacy `STATE_DIR` (so a missing everything still yields the same
 *      empty-but-valid snapshot readSnapshot already guarantees)
 * Runs write state under their own `--output` dir (see `stateDirFor`), so the
 * mtime scan finds the most recently active run without any flags.
 */
export async function resolveStateDir(
  args: string[],
  env: NodeJS.ProcessEnv,
  base: string = process.cwd(),
): Promise<string> {
  const i = args.indexOf('--state');
  if (i >= 0 && args[i + 1]) return args[i + 1];
  if (env.BACKLOT_STATE_DIR) return env.BACKLOT_STATE_DIR;

  const candidates: string[] = [path.join(base, '.pipeline-state')];
  const children = await fs.readdir(base, { withFileTypes: true }).catch(() => [] as import('fs').Dirent[]);
  for (const c of children) {
    if (c.isDirectory()) candidates.push(path.join(base, c.name, '.pipeline-state'));
  }
  let newest: { dir: string; mtimeMs: number } | null = null;
  for (const dir of candidates) {
    const st = await fs.stat(path.join(dir, 'pipeline-state.json')).catch(() => null);
    if (st && (!newest || st.mtimeMs > newest.mtimeMs)) newest = { dir, mtimeMs: st.mtimeMs };
  }
  return newest?.dir ?? STATE_DIR;
}

/**
 * Read the live snapshot from a state dir (default: the real `.pipeline-state`).
 * Tolerant by design — a missing or half-written state file yields an empty-but-
 * valid snapshot rather than throwing, so the poller never crashes mid-run.
 */
export async function readSnapshot(stateDir: string = STATE_DIR): Promise<BacklotSnapshot> {
  const stateRaw = await fs.readFile(path.join(stateDir, 'pipeline-state.json'), 'utf8').catch(() => null);
  let state: PipelineStateLike = { results: {}, errors: [] };
  if (stateRaw) {
    try { state = JSON.parse(stateRaw) as PipelineStateLike; } catch { /* keep the empty default */ }
  }
  const costLines = (await readJsonl(path.join(stateDir, 'cost_log.jsonl'))) as CostLine[];
  return deriveSnapshot(state, costLines);
}
