import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'fs/promises';
import http from 'http';
import os from 'os';
import path from 'path';
import type { AddressInfo } from 'net';
import { createBacklotServer, resolvePort } from '../../src/backlot/server.ts';

/** Boot the sidecar on an ephemeral port over a freshly-written state fixture. */
async function withServer(fn: (port: number, dir: string) => Promise<void>): Promise<void> {
  const dir = await fs.mkdtemp(path.join(os.tmpdir(), 'backlot-srv-'));
  await fs.writeFile(
    path.join(dir, 'pipeline-state.json'),
    JSON.stringify({ results: { voiceover: {} }, errors: [] }),
  );
  const srv = createBacklotServer(dir);
  await new Promise<void>((resolve) => srv.listen(0, '127.0.0.1', resolve));
  try {
    await fn((srv.address() as AddressInfo).port, dir);
  } finally {
    await new Promise<void>((resolve) => srv.close(() => resolve()));
    await fs.rm(dir, { recursive: true, force: true });
  }
}

test('GET /api/snapshot serves the derived snapshot for the given state dir', async () => {
  await withServer(async (port) => {
    const body = await new Promise<string>((resolve, reject) => {
      http.get({ host: '127.0.0.1', port, path: '/api/snapshot' }, (res) => {
        assert.equal(res.statusCode, 200);
        let b = '';
        res.setEncoding('utf8');
        res.on('data', (c) => { b += c; });
        res.on('end', () => resolve(b));
      }).on('error', reject);
    });
    const snap = JSON.parse(body);
    assert.equal(snap.totalSteps, 7);
    assert.equal(snap.currentStep, 1);
    assert.equal(snap.liveness, 'running'); // fixture was written moments ago
  });
});

test('GET /api/events streams an initial SSE snapshot frame and cleans up on close', async () => {
  await withServer(async (port) => {
    const frame = await new Promise<string>((resolve, reject) => {
      const req = http.get({ host: '127.0.0.1', port, path: '/api/events' }, (res) => {
        assert.equal(res.headers['content-type'], 'text/event-stream');
        let buf = '';
        res.setEncoding('utf8');
        res.on('data', (c) => {
          buf += c;
          const i = buf.indexOf('\n\n');
          if (i >= 0) { req.destroy(); resolve(buf.slice(0, i)); }
        });
      });
      req.on('error', () => { /* expected: destroyed after the first frame */ });
      setTimeout(() => { req.destroy(); reject(new Error('no SSE frame within 5s')); }, 5000).unref();
    });
    assert.match(frame, /^data: /);
    const snap = JSON.parse(frame.slice('data: '.length));
    assert.equal(snap.currentStep, 1);
    assert.equal(snap.liveness, 'running');
    // If the per-connection intervals leaked, srv.close() in withServer would
    // hang this test past its runner timeout — completing IS the cleanup check.
  });
});

test('resolvePort precedence: --port beats env beats default', () => {
  assert.equal(resolvePort(['--port', '5000'], { BACKLOT_PORT: '6000' }), 5000);
  assert.equal(resolvePort([], { BACKLOT_PORT: '6000' }), 6000);
  assert.equal(resolvePort([], {}), 4599);
});
