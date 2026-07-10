/**
 * Backlot server — a read-only `node:http` sidecar (zero new deps). It serves the
 * live dashboard and a JSON snapshot endpoint, both derived by tailing the
 * pipeline's on-disk state. It never imports runner.ts, so running it (or not)
 * has zero effect on the pipeline.
 *
 * CLI: `npm run backlot [-- --port 4599 --state <dir>]`  (or BACKLOT_PORT /
 * BACKLOT_STATE_DIR env). Without `--state`, the newest per-run state dir wins
 * (see `resolveStateDir`) — runs keep their state under their own output dir.
 */
import fs from 'fs/promises';
import http from 'http';
import path from 'path';
import { STATE_DIR } from '../pipeline/config.ts';
import { readSnapshot, resolveStateDir } from './tailer.ts';
import { renderShell } from './html.ts';
import { parseIntOr } from '../pipeline/runner-helpers.ts';

const DEFAULT_PORT = 4599;

// Keyframe thumbnails: digits-only index (no traversal surface), resolved
// against the run's output dir — the parent of a per-run state dir.
const SHOT_KEY_ROUTE = /^\/api\/shot-key\/(\d{1,3})$/;

export function createBacklotServer(stateDir?: string): http.Server {
  return http.createServer(async (req, res) => {
    const url = (req.url ?? '/').split('?')[0];
    try {
      if (req.method === 'GET' && url === '/api/snapshot') {
        const snap = await readSnapshot(stateDir);
        res.writeHead(200, { 'Content-Type': 'application/json', 'Cache-Control': 'no-store' });
        res.end(JSON.stringify(snap));
        return;
      }
      if (req.method === 'GET' && url === '/api/events') {
        // SSE: push the snapshot only when it changes (server-side 1.5s tail),
        // with a comment heartbeat so idle proxies don't reap the connection.
        res.writeHead(200, {
          'Content-Type': 'text/event-stream',
          'Cache-Control': 'no-store',
          Connection: 'keep-alive',
        });
        let last = '';
        const push = async (): Promise<void> => {
          try {
            const data = JSON.stringify(await readSnapshot(stateDir));
            if (data !== last) { last = data; res.write(`data: ${data}\n\n`); }
          } catch { /* transient read hiccup — the next tick retries */ }
        };
        await push();
        const tick = setInterval(() => { void push(); }, 1500);
        const beat = setInterval(() => res.write(': ping\n\n'), 15_000);
        req.on('close', () => { clearInterval(tick); clearInterval(beat); });
        return;
      }
      const shotKey = url.match(SHOT_KEY_ROUTE);
      if (req.method === 'GET' && shotKey) {
        const outDir = path.dirname(stateDir ?? STATE_DIR);
        const png = await fs
          .readFile(path.join(outDir, `.broll-dir-key-${Number(shotKey[1])}.png`))
          .catch(() => null);
        if (!png) {
          res.writeHead(404, { 'Content-Type': 'text/plain' });
          res.end('No keyframe');
          return;
        }
        // no-cache (not immutable): the critic can regenerate a keyframe in place.
        res.writeHead(200, { 'Content-Type': 'image/png', 'Cache-Control': 'no-cache' });
        res.end(png);
        return;
      }
      if (req.method === 'GET' && (url === '/' || url === '/index.html')) {
        const snap = await readSnapshot(stateDir);
        res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' });
        res.end(renderShell(snap));
        return;
      }
      res.writeHead(404, { 'Content-Type': 'text/plain' });
      res.end('Not found');
    } catch (e) {
      res.writeHead(500, { 'Content-Type': 'text/plain' });
      res.end(`Backlot error: ${e instanceof Error ? e.message : String(e)}`);
    }
  });
}

/** Resolve the port from `--port <n>`, else BACKLOT_PORT, else the default. */
export function resolvePort(args: string[], env: NodeJS.ProcessEnv): number {
  const i = args.indexOf('--port');
  if (i >= 0) return parseIntOr(args[i + 1], DEFAULT_PORT);
  return parseIntOr(env.BACKLOT_PORT, DEFAULT_PORT);
}

// CLI entry
if (import.meta.url === `file://${process.argv[1]}`) {
  const args = process.argv.slice(2);
  const port = resolvePort(args, process.env);
  const stateDir = await resolveStateDir(args, process.env);
  createBacklotServer(stateDir).listen(port, () => {
    console.log(`[Backlot] live run dashboard → http://localhost:${port}`);
    console.log(`[Backlot] tailing ${stateDir} (SSE push, 1.5s tail; stall threshold ${process.env.BACKLOT_STALL_SECONDS ?? '300'}s)`);
  });
}
