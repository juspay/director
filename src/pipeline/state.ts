/**
 * Pipeline state management — resume-safe JSON persistence.
 * Matches dopamine's loadState/saveState pattern.
 */
import fs from 'fs/promises';
import path from 'path';
import { STATE_DIR } from './config.ts';

export async function loadState<T>(filename: string, defaultValue: T): Promise<T> {
  const filePath = path.join(STATE_DIR, filename);
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
  const filePath = path.join(STATE_DIR, filename);
  const payload = JSON.stringify(data, null, 2);
  const prev = writeChains.get(filename) ?? Promise.resolve();
  const next = prev.catch(() => undefined).then(async () => {
    await fs.mkdir(STATE_DIR, { recursive: true });
    await fs.writeFile(filePath, payload, 'utf-8');
  });
  writeChains.set(filename, next);
  await next;
}

export async function appendToLog(filename: string, entry: Record<string, unknown>): Promise<void> {
  await fs.mkdir(STATE_DIR, { recursive: true });
  const filePath = path.join(STATE_DIR, filename);
  const line = JSON.stringify({ ...entry, timestamp: new Date().toISOString() }) + '\n';
  await fs.appendFile(filePath, line, 'utf-8');
}
