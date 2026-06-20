/**
 * Pipeline state management — resume-safe JSON persistence.
 * Matches dopamine's loadState/saveState pattern.
 */
import fs from 'fs/promises';
import path from 'path';
import { STATE_DIR } from './config.ts';

/**
 * Resolve the state directory at call time. Reads `STATE_DIR_OVERRIDE` on every
 * call (not at import) so tests can redirect persistence to an isolated tmp dir
 * — the config `STATE_DIR` const is fixed at import, which made the previous
 * test isolation a silent no-op that wrote into the real `.pipeline-state/`.
 */
export function stateDir(): string {
  return process.env.STATE_DIR_OVERRIDE ?? STATE_DIR;
}

export async function loadState<T>(filename: string, defaultValue: T): Promise<T> {
  const filePath = path.join(stateDir(), filename);
  try {
    const raw = await fs.readFile(filePath, 'utf-8');
    return JSON.parse(raw) as T;
  } catch {
    return defaultValue;
  }
}

// Per-file write chain: phases 2-4 run concurrently and each calls saveState on
// the same file. Without serialization their fs.writeFile calls can resolve out
// of order, letting an earlier (less complete) snapshot overwrite a later one and
// corrupting the resume checkpoint. The JSON is snapshotted synchronously at call
// time, then writes are queued so they apply in call order.
const writeChains = new Map<string, Promise<void>>();

export async function saveState<T>(filename: string, data: T): Promise<void> {
  const dir = stateDir();
  const filePath = path.join(dir, filename);
  const payload = JSON.stringify(data, null, 2);
  const prev = writeChains.get(filename) ?? Promise.resolve();
  const next = prev.catch(() => undefined).then(async () => {
    await fs.mkdir(dir, { recursive: true });
    await fs.writeFile(filePath, payload, 'utf-8');
  });
  writeChains.set(filename, next);
  await next;
}

export async function appendToLog(filename: string, entry: Record<string, unknown>): Promise<void> {
  const dir = stateDir();
  await fs.mkdir(dir, { recursive: true });
  const filePath = path.join(dir, filename);
  const line = JSON.stringify({ ...entry, timestamp: new Date().toISOString() }) + '\n';
  await fs.appendFile(filePath, line, 'utf-8');
}
