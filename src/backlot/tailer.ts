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
import type { ActivityInfo, BacklotSnapshot, CostView, Liveness, PhaseView, PipelineStateLike, RunInfo, ShotView } from '../types/backlot.ts';

/** Quiet period before an incomplete run reads as stalled (BACKLOT_STALL_SECONDS overrides). */
export const DEFAULT_STALL_SECONDS = 300;

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
function deriveLiveness(complete: boolean, activity: ActivityInfo | undefined): Liveness {
  if (complete) return 'complete';
  if (!activity || activity.mtimeMs == null) return 'idle';
  const quietMs = (activity.stallSeconds ?? DEFAULT_STALL_SECONDS) * 1000;
  return activity.nowMs - activity.mtimeMs <= quietMs ? 'running' : 'stalled';
}

export function deriveSnapshot(
  state: PipelineStateLike,
  costLines: CostLine[],
  activity?: ActivityInfo,
): BacklotSnapshot {
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
  const complete = done === BACKLOT_PHASES.length;
  const liveness = deriveLiveness(complete, activity);
  // A live run's first pending phase is the one in flight (phases 2-4 run
  // concurrently, so this is a best-single-pill approximation, not a claim).
  if (liveness === 'running') {
    const active = phases.find((p) => p.status === 'pending');
    if (active) active.status = 'running';
  }
  return {
    phases,
    currentStep: done,
    totalSteps: BACKLOT_PHASES.length,
    complete,
    liveness,
    lastActivityAt: activity?.mtimeMs != null ? new Date(activity.mtimeMs).toISOString() : null,
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
  return (await scanStateDirs(base))[0]?.dir ?? STATE_DIR;
}

/**
 * All discoverable run state dirs under a base — `<base>/.pipeline-state`
 * (legacy) plus every `<base>/<child>/.pipeline-state` — that actually contain
 * a `pipeline-state.json`, newest first. This is also the run-switching
 * allowlist: the server accepts a `?run=` value only if this scan produced it.
 */
export async function scanStateDirs(base: string = process.cwd()): Promise<Array<{ dir: string; mtimeMs: number }>> {
  const candidates: string[] = [path.join(base, '.pipeline-state')];
  const children = await fs.readdir(base, { withFileTypes: true }).catch(() => [] as import('fs').Dirent[]);
  for (const c of children) {
    if (c.isDirectory()) candidates.push(path.join(base, c.name, '.pipeline-state'));
  }
  const found: Array<{ dir: string; mtimeMs: number }> = [];
  for (const dir of candidates) {
    const st = await fs.stat(path.join(dir, 'pipeline-state.json')).catch(() => null);
    if (st) found.push({ dir, mtimeMs: st.mtimeMs });
  }
  return found.sort((a, b) => b.mtimeMs - a.mtimeMs);
}

/** The discoverable runs as UI options: id = the state dir, label = the run's output dir name. */
export async function listRuns(base: string = process.cwd(), activeDir?: string): Promise<RunInfo[]> {
  const scanned = await scanStateDirs(base);
  return scanned.map((r) => ({
    id: r.dir,
    label: path.dirname(r.dir) === base ? '(project root)' : path.basename(path.dirname(r.dir)),
    lastActivityAt: new Date(r.mtimeMs).toISOString(),
    active: r.dir === activeDir,
  }));
}

/**
 * Derive the director-mode shot grid: the art director's plan (state dir) joined
 * with what exists on disk (keyframes/segments in the run's output dir — the
 * parent of a per-run state dir) and the critic's logged verdicts. Returns
 * undefined when no plan exists (non-director modes, or nothing yet). For the
 * legacy project-global state dir the artifact probes simply come back false.
 */
export async function readShots(stateDir: string): Promise<ShotView[] | undefined> {
  const planRaw = await fs.readFile(path.join(stateDir, 'shot-plan.json'), 'utf8').catch(() => null);
  if (!planRaw) return undefined;
  let shots: Array<{ scene_id?: string; beat?: string; shows_product?: boolean; camera?: string }>;
  try {
    const plan = JSON.parse(planRaw) as { shots?: unknown };
    if (!Array.isArray(plan.shots) || plan.shots.length === 0) return undefined;
    shots = plan.shots as typeof shots;
  } catch { return undefined; }

  const outDir = path.dirname(stateDir);
  const verdicts = (await readJsonl(path.join(stateDir, 'shot-verdicts.jsonl'))) as Array<{
    shot?: number; score?: number | null; regenerate?: boolean;
  }>;
  const onDisk = (p: string): Promise<boolean> => fs.access(p).then(() => true, () => false);

  return Promise.all(shots.map(async (s, i) => {
    const mine = verdicts.filter((v) => v.shot === i);
    const last = mine[mine.length - 1];
    return {
      index: i,
      sceneId: s.scene_id ?? `shot_${i}`,
      beat: s.beat ?? '',
      showsProduct: !!s.shows_product,
      camera: s.camera ?? '',
      keyframe: await onDisk(path.join(outDir, `.broll-dir-key-${i}.png`)),
      animated: await onDisk(path.join(outDir, `.broll-dir-seg-${i}.mp4`)),
      critic: last ? { score: last.score ?? null, regenerate: !!last.regenerate, attempts: mine.length } : null,
    };
  }));
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

  // Activity = the newest write across all three state files. The checkpoint
  // only updates at phase boundaries, but cost/metrics lines land mid-phase
  // (every agent call), so a long b-roll phase still reads as alive.
  let mtimeMs: number | null = null;
  for (const f of ['pipeline-state.json', 'cost_log.jsonl', 'agent-metrics.jsonl']) {
    const st = await fs.stat(path.join(stateDir, f)).catch(() => null);
    if (st && (mtimeMs == null || st.mtimeMs > mtimeMs)) mtimeMs = st.mtimeMs;
  }
  const envStall = Number(process.env.BACKLOT_STALL_SECONDS);
  const stallSeconds = Number.isFinite(envStall) && envStall > 0 ? envStall : undefined;
  const snap = deriveSnapshot(state, costLines, { mtimeMs, nowMs: Date.now(), stallSeconds });
  // Shot grid rides along when a plan exists; deriveSnapshot itself stays pure.
  const shots = await readShots(stateDir);
  return shots ? { ...snap, shots } : snap;
}

/**
 * Replay (Phase D): reconstruct the run as it looked at time `tMs`, purely from
 * the logs the pipeline already writes — agent-metrics.jsonl carries a
 * timestamped completion line per phase, cost_log.jsonl carries timestamped
 * spend. No new runner instrumentation needed.
 */
export function deriveReplayState(
  metrics: Array<Record<string, unknown>>,
  tMs: number,
): PipelineStateLike {
  const results: Record<string, unknown> = {};
  for (const m of metrics) {
    const name = typeof m.agentName === 'string' ? m.agentName : null;
    if (!name || !PHASE_NAMES.includes(name) || m.success === false) continue;
    const ts = Date.parse(typeof m.timestamp === 'string' ? m.timestamp : '');
    if (Number.isFinite(ts) && ts <= tMs) results[name] = { replay: true };
  }
  return { results, errors: [] };
}

const lineTs = (l: Record<string, unknown>): number =>
  Date.parse(typeof l.timestamp === 'string' ? l.timestamp : '');

/** The scrubbing window: [earliest, latest] timestamp across both logs, or nulls when empty. */
export async function replayBounds(stateDir: string): Promise<{ startMs: number | null; endMs: number | null }> {
  const lines = [
    ...(await readJsonl(path.join(stateDir, 'agent-metrics.jsonl'))),
    ...(await readJsonl(path.join(stateDir, 'cost_log.jsonl'))),
  ];
  const stamps = lines.map(lineTs).filter(Number.isFinite);
  if (!stamps.length) return { startMs: null, endMs: null };
  return { startMs: Math.min(...stamps), endMs: Math.max(...stamps) };
}

/** The snapshot as of `tMs` — phases completed by then, spend accrued by then. */
export async function readReplay(stateDir: string, tMs: number): Promise<BacklotSnapshot> {
  const metrics = await readJsonl(path.join(stateDir, 'agent-metrics.jsonl'));
  const costLines = (await readJsonl(path.join(stateDir, 'cost_log.jsonl')))
    .filter((l) => { const ts = lineTs(l); return Number.isFinite(ts) && ts <= tMs; }) as CostLine[];
  // Activity pinned to the replay instant: an incomplete moment reads as
  // 'running' (it WAS running then), the final moment reads as 'complete'.
  return deriveSnapshot(deriveReplayState(metrics, tMs), costLines, { mtimeMs: tMs, nowMs: tMs });
}
