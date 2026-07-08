/**
 * Backlot server — a read-only `node:http` sidecar (zero new deps). It serves the
 * live dashboard and a JSON snapshot endpoint, both derived by tailing the
 * pipeline's on-disk state. It never imports runner.ts, so running it (or not)
 * has zero effect on the pipeline.
 *
 * CLI: `npm run backlot [-- --port 4599]`  (or BACKLOT_PORT env)
 */
import http from 'http';
import { readSnapshot } from './tailer.ts';
import { renderShell } from './html.ts';
import { parseIntOr } from '../pipeline/runner-helpers.ts';

const DEFAULT_PORT = 4599;

export function createBacklotServer(): http.Server {
  return http.createServer(async (req, res) => {
    const url = (req.url ?? '/').split('?')[0];
    try {
      if (req.method === 'GET' && url === '/api/snapshot') {
        const snap = await readSnapshot();
        res.writeHead(200, { 'Content-Type': 'application/json', 'Cache-Control': 'no-store' });
        res.end(JSON.stringify(snap));
        return;
      }
      if (req.method === 'GET' && (url === '/' || url === '/index.html')) {
        const snap = await readSnapshot();
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
  const port = resolvePort(process.argv.slice(2), process.env);
  createBacklotServer().listen(port, () => {
    console.log(`[Backlot] live run dashboard → http://localhost:${port}`);
    console.log(`[Backlot] tailing ${process.cwd()}/.pipeline-state (polling every 1.5s)`);
  });
}
