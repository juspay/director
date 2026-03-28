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

export async function saveState<T>(filename: string, data: T): Promise<void> {
  await fs.mkdir(STATE_DIR, { recursive: true });
  const filePath = path.join(STATE_DIR, filename);
  await fs.writeFile(filePath, JSON.stringify(data, null, 2), 'utf-8');
}

export async function appendToLog(filename: string, entry: Record<string, unknown>): Promise<void> {
  await fs.mkdir(STATE_DIR, { recursive: true });
  const filePath = path.join(STATE_DIR, filename);
  const line = JSON.stringify({ ...entry, timestamp: new Date().toISOString() }) + '\n';
  await fs.appendFile(filePath, line, 'utf-8');
}
